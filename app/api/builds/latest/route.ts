import { NextResponse } from 'next/server';

/**
 * Fetch latest build directly from CodeMagic API
 * Generates public download URLs for artifacts
 */

async function generatePublicUrl(
  authenticatedUrl: string,
  token: string,
  expirationDays: number = 30
): Promise<string | null> {
  try {
    // Extract secure filename from URL
    // Format: https://api.codemagic.io/artifacts/UUID1/UUID2/filename
    const urlParts = authenticatedUrl.split('api.codemagic.io/artifacts/');
    if (urlParts.length !== 2) {
      console.warn('Invalid artifact URL format:', authenticatedUrl);
      return null;
    }

    const secureFilename = urlParts[1];
    
    // Calculate expiration timestamp (30 days from now by default)
    const expiresAt = Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60);

    // Request public URL from CodeMagic
    const publicUrlResponse = await fetch(
      `https://api.codemagic.io/artifacts/${secureFilename}/public-url`,
      {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresAt }),
      }
    );

    if (!publicUrlResponse.ok) {
      console.warn(
        `Failed to generate public URL for ${secureFilename}: ${publicUrlResponse.status}`
      );
      return null;
    }

    const data = await publicUrlResponse.json();
    return data.url || null;
  } catch (error) {
    console.error('Error generating public URL:', error);
    return null;
  }
}

export async function GET() {
  try {
    const codemagicToken = process.env.CODEMAGIC_API_TOKEN;
    const codemagicAppId = process.env.CODEMAGIC_APP_ID;

    if (!codemagicToken || !codemagicAppId) {
      console.error('Missing CodeMagic API credentials');
      return NextResponse.json(
        {
          androidDownloadUrl: null,
          status: 'CodeMagic credentials not configured',
        },
        { status: 200 }
      );
    }

    // Fetch latest successful builds from CodeMagic
    const codemagicResponse = await fetch(
      `https://api.codemagic.io/builds?appId=${codemagicAppId}&status=finished&limit=5`,
      {
        headers: {
          'x-auth-token': codemagicToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!codemagicResponse.ok) {
      console.error(`CodeMagic API error: ${codemagicResponse.status}`);
      return NextResponse.json(
        {
          androidDownloadUrl: null,
          status: 'Failed to fetch from CodeMagic',
        },
        { status: 200 }
      );
    }

    const buildData = await codemagicResponse.json();

    if (!buildData.builds || buildData.builds.length === 0) {
      console.warn('No finished builds found in CodeMagic');
      return NextResponse.json(
        {
          androidDownloadUrl: null,
          status: 'No builds available',
        },
        { status: 200 }
      );
    }

    const latestBuild = buildData.builds[0] as any;
    const buildId = latestBuild.id;
    const buildTime = latestBuild.finishedAt || latestBuild.buildStartedTime;
    const buildNumber = latestBuild.buildNumber || latestBuild.issueNumber || 'Latest Build';
    const appVersion = latestBuild.appVersion || '1.0.0';

    // Extract artifact URLs (CodeMagic uses "artefacts" spelling)
    const artifacts = (latestBuild.artefacts || []) as any[];
    
    // Get APK and AAB URLs
    const apkArtifact = artifacts.find((a: any) => a.name?.endsWith('.apk'));
    const aabArtifact = artifacts.find((a: any) => a.name?.endsWith('.aab'));

    // Format file sizes
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Generate public URLs for artifacts
    let apkPublicUrl: string | null = null;
    let aabPublicUrl: string | null = null;

    if (apkArtifact?.url) {
      apkPublicUrl = await generatePublicUrl(apkArtifact.url, codemagicToken);
    }

    if (aabArtifact?.url) {
      aabPublicUrl = await generatePublicUrl(aabArtifact.url, codemagicToken);
    }

    // Use public URLs if available, fall back to authenticated URLs
    const androidDownloadUrl = apkPublicUrl || apkArtifact?.url || aabPublicUrl || aabArtifact?.url;

    const response = {
      buildId,
      buildNumber,
      buildTime,
      releaseDate: buildTime,
      version: appVersion,
      buildStatus: latestBuild.status,
      workflowName: latestBuild.workflow?.name || 'Android Release',
      artifacts: {
        apk: apkArtifact ? {
          name: apkArtifact.name,
          authenticatedUrl: apkArtifact.url,
          publicUrl: apkPublicUrl,
          url: apkPublicUrl || apkArtifact.url,
          size: apkArtifact.size,
          sizeFormatted: formatFileSize(apkArtifact.size || 0),
        } : null,
        aab: aabArtifact ? {
          name: aabArtifact.name,
          authenticatedUrl: aabArtifact.url,
          publicUrl: aabPublicUrl,
          url: aabPublicUrl || aabArtifact.url,
          size: aabArtifact.size,
          sizeFormatted: formatFileSize(aabArtifact.size || 0),
        } : null,
      },
      androidDownloadUrl,
      allArtifacts: artifacts.map((a: any) => ({
        name: a.name,
        url: a.url,
        size: a.size,
        sizeFormatted: formatFileSize(a.size || 0),
      })),
      changelog: `Build ${buildNumber} - v${appVersion}`,
      releaseName: `Whispr v${appVersion}`,
    };

    // Add cache headers (revalidate every 5 minutes for fresher builds)
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=1800'
    );

    return nextResponse;
  } catch (error) {
    console.error('Error fetching build details from CodeMagic:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
