import { NextResponse } from 'next/server';

const CODEMAGIC_API_TOKEN = process.env.CODEMAGIC_API_TOKEN;
const CODEMAGIC_APP_ID = process.env.CODEMAGIC_APP_ID;

/**
 * Fetch latest build details from CodeMagic API
 * This endpoint gets the most recent successful builds for iOS and Android
 */
export async function GET() {
  try {
    if (!CODEMAGIC_API_TOKEN || !CODEMAGIC_APP_ID) {
      console.error('Missing CodeMagic API token or app ID');
      return NextResponse.json(
        {
          iosDownloadUrl: null,
          androidDownloadUrl: null,
          status: 'Configuration missing',
        },
        { status: 200 } // Return 200 but with null URLs
      );
    }

    // Fetch builds from CodeMagic API
    // API endpoint: https://api.codemagic.io/builds?appId={appId}
    const buildsResponse = await fetch(
      `https://api.codemagic.io/builds?appId=${CODEMAGIC_APP_ID}&limit=50`,
      {
        headers: {
          'x-auth-token': CODEMAGIC_API_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!buildsResponse.ok) {
      console.error(`CodeMagic API error: ${buildsResponse.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch builds from CodeMagic' },
        { status: buildsResponse.status }
      );
    }

    const buildsData = await buildsResponse.json();
    const builds = buildsData.builds || [];

    // Find latest successful iOS and Android builds
    const iosBuild = builds.find(
      (build: any) =>
        build.status === 'finished' &&
        build.buildStatus === 'success' &&
        build.platform === 'ios' &&
        build.artifacts?.length > 0
    );

    const androidBuild = builds.find(
      (build: any) =>
        build.status === 'finished' &&
        build.buildStatus === 'success' &&
        build.platform === 'android' &&
        build.artifacts?.length > 0
    );

    // Extract download URLs and metadata
    const response: any = {
      iosDownloadUrl: iosBuild?.artifacts?.[0]?.downloadUrl || null,
      androidDownloadUrl: androidBuild?.artifacts?.[0]?.downloadUrl || null,
      iosVersion: iosBuild?.appVersion || null,
      androidVersion: androidBuild?.appVersion || null,
      buildNumber: iosBuild?.buildNumber || androidBuild?.buildNumber || null,
      releaseDate: iosBuild?.finishedAt || androidBuild?.finishedAt || null,
      iosBuildId: iosBuild?.id || null,
      androidBuildId: androidBuild?.id || null,
    };

    // Fetch GitHub latest release for changelog if available
    try {
      const githubResponse = await fetch(
        'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/whispr-mobile/releases/latest',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && {
              'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            }),
          },
        }
      );

      if (githubResponse.ok) {
        const releaseData = await githubResponse.json();
        response.changelog = releaseData.body || null;
        response.githubReleaseUrl = releaseData.html_url || null;
      }
    } catch (err) {
      console.warn('Failed to fetch GitHub release info:', err);
    }

    // Add cache headers (revalidate every 1 hour)
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return nextResponse;
  } catch (error) {
    console.error('Error fetching build details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
