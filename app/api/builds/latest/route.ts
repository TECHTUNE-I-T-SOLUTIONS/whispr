import { NextResponse } from 'next/server';

/**
 * Fetch latest build details from GitHub releases (whispr-mobile repo)
 * This endpoint extracts CodeMagic build links from the latest GitHub release
 */
export async function GET() {
  try {
    // Fetch latest release from whispr-mobile repo
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

    if (!githubResponse.ok) {
      console.error(`GitHub API error: ${githubResponse.status}`);
      return NextResponse.json(
        {
          iosDownloadUrl: null,
          androidDownloadUrl: null,
          status: 'No releases found',
        },
        { status: 200 }
      );
    }

    const releaseData = await githubResponse.json();
    const body = releaseData.body || '';
    const tagName = releaseData.tag_name || '';
    const version = tagName.replace(/^v/, '');
    const releaseDate = releaseData.published_at || releaseData.created_at;

    // Extract iOS and Android download URLs from release body
    // Look for markdown links like [Download IPA](url) or [Download APK](url)
    // CodeMagic artifact URLs look like: https://api.codemagic.io/artifacts/...
    const iosMatch = body.match(/\[(Download IPA|Download iOS|iOS)\]\((https?:\/\/[^\)]+\.ipa)\)/i) ||
                      body.match(/IPA.*?(https?:\/\/[^\s)]+\.ipa)/i);
    
    const androidMatch = body.match(/\[(Download APK|Download Android|Android)\]\((https?:\/\/[^\)]+\.(apk|aab))\)/i) ||
                         body.match(/APK.*?(https?:\/\/[^\s)]+\.(apk|aab))/i) ||
                         body.match(/\*\*Direct Download\*\*:.*?\[(.*?)\]\((https?:\/\/[^\)]+)\)/i);

    const response = {
      version,
      tagName,
      releaseDate,
      changelog: body,
      githubReleaseUrl: releaseData.html_url,
      iosDownloadUrl: iosMatch ? (iosMatch[2] || iosMatch[1]) : null,
      androidDownloadUrl: androidMatch ? (androidMatch[2] || androidMatch[3] || androidMatch[1]) : null,
      releaseName: releaseData.name || `Whispr v${version}`,
      isDraft: releaseData.draft || false,
      isPrerelease: releaseData.prerelease || false,
    };

    // Add cache headers (revalidate every 1 hour)
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );

    return nextResponse;
  } catch (error) {
    console.error('Error fetching build details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
