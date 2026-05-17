import { NextResponse } from 'next/server';

const OWNER = 'TECHTUNE-I-T-SOLUTIONS';
const REPO = 'whispr-mobile';

type ReleaseAsset = {
  id: number;
  name: string;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedAsset = url.searchParams.get('asset')?.toLowerCase() || 'apk';
    const token = process.env.GITHUB_DOWNLOAD_TOKEN || process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json({ error: 'Server token not configured' }, { status: 500 });
    }

    const releaseResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    });

    if (!releaseResponse.ok) {
      const text = await releaseResponse.text().catch(() => '');
      return NextResponse.json(
        { error: 'Failed to fetch latest release', details: text },
        { status: releaseResponse.status }
      );
    }

    const release = await releaseResponse.json();
    const assets: ReleaseAsset[] = release?.assets || [];
    const asset = assets.find((current) => {
      const name = current.name.toLowerCase();
      if (requestedAsset === 'aab') return name.endsWith('.aab');
      return name.endsWith('.apk');
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found in latest release', asset: requestedAsset },
        { status: 404 }
      );
    }

    const assetResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${asset.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/octet-stream',
      },
      redirect: 'follow',
    });

    if (!assetResponse.ok) {
      const text = await assetResponse.text().catch(() => '');
      return NextResponse.json(
        { error: 'Failed to download asset', details: text },
        { status: assetResponse.status }
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', requestedAsset === 'aab' ? 'application/octet-stream' : 'application/vnd.android.package-archive');
    headers.set('Content-Disposition', `attachment; filename="${asset.name}"`);

    return new NextResponse(assetResponse.body, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}