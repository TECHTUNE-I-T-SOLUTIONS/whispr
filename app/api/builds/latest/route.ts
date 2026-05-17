import { NextResponse } from 'next/server';

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GitHubRelease = {
  id: number;
  tag_name: string;
  name?: string | null;
  body?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubReleaseAsset[];
};

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function findReleaseAsset(assets: GitHubReleaseAsset[], matcher: (asset: GitHubReleaseAsset) => boolean) {
  return assets.find(matcher) || null;
}

export async function GET() {
  try {
    const owner = process.env.GITHUB_MOBILE_REPO_OWNER || 'TECHTUNE-I-T-SOLUTIONS';
    const repo = process.env.GITHUB_MOBILE_REPO_NAME || 'whispr-mobile';
    const githubToken = process.env.GITHUB_TOKEN;

    const releaseResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 300 },
      }
    );

    if (!releaseResponse.ok) {
      console.error(`GitHub releases API error: ${releaseResponse.status}`);
      return NextResponse.json(
        {
          androidDownloadUrl: null,
          status: 'Failed to fetch from GitHub Releases',
        },
        { status: 200 }
      );
    }

    const releases = (await releaseResponse.json()) as GitHubRelease[];
    const latestRelease = releases.find((release) => !release.draft) || releases[0];

    if (!latestRelease) {
      return NextResponse.json(
        {
          androidDownloadUrl: null,
          status: 'No releases available',
        },
        { status: 200 }
      );
    }

    const apkArtifact = findReleaseAsset(latestRelease.assets, (asset) =>
      asset.name.toLowerCase().endsWith('.apk')
    );
    const aabArtifact = findReleaseAsset(latestRelease.assets, (asset) =>
      asset.name.toLowerCase().endsWith('.aab')
    );
    const buildTime = latestRelease.published_at || latestRelease.created_at || null;
    const appVersion = latestRelease.tag_name.replace(/^v/, '').trim();
    const apkDownloadUrl = apkArtifact ? '/api/builds/download?asset=apk' : null;
    const aabDownloadUrl = aabArtifact ? '/api/builds/download?asset=aab' : null;
    const androidDownloadUrl = apkDownloadUrl || aabDownloadUrl || '/api/builds/latest';

    const response = {
      buildId: latestRelease.id,
      buildNumber: latestRelease.id.toString(),
      buildTime,
      releaseDate: buildTime,
      version: appVersion,
      buildStatus: latestRelease.prerelease ? 'prerelease' : 'released',
      workflowName: 'GitHub Release',
      artifacts: {
        apk: apkArtifact
          ? {
              name: apkArtifact.name,
              authenticatedUrl: apkArtifact.browser_download_url,
              publicUrl: apkDownloadUrl,
              url: apkDownloadUrl,
              size: apkArtifact.size,
              sizeFormatted: formatFileSize(apkArtifact.size || 0),
            }
          : null,
        aab: aabArtifact
          ? {
              name: aabArtifact.name,
              authenticatedUrl: aabArtifact.browser_download_url,
              publicUrl: aabDownloadUrl,
              url: aabDownloadUrl,
              size: aabArtifact.size,
              sizeFormatted: formatFileSize(aabArtifact.size || 0),
            }
          : null,
      },
      androidDownloadUrl,
      allArtifacts: latestRelease.assets.map((asset) => ({
        name: asset.name,
        url: asset.name.toLowerCase().endsWith('.apk')
          ? '/api/builds/download?asset=apk'
          : asset.name.toLowerCase().endsWith('.aab')
            ? '/api/builds/download?asset=aab'
            : asset.browser_download_url,
        size: asset.size,
        sizeFormatted: formatFileSize(asset.size || 0),
      })),
      changelog: latestRelease.body || `Whispr v${appVersion}`,
      releaseName: latestRelease.name || `Whispr v${appVersion}`,
      releaseUrl: latestRelease.html_url,
      repository: `${owner}/${repo}`,
    };

    // Add cache headers (revalidate every 5 minutes for fresher releases)
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=1800'
    );

    return nextResponse;
  } catch (error) {
    console.error('Error fetching build details from GitHub Releases:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
