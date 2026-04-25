import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles deep link redirects for the Whispr mobile app
 * 
 * This endpoint receives requests from shared links and:
 * 1. Detects if the user is on mobile (Android/iOS)
 * 2. Checks if they have the mobile app installed
 * 3. Redirects to the app via deep link if available
 * 4. Falls back to web version if app is not installed
 * 
 * Usage:
 * - Mobile app share URL: https://whisprwords.com/api/deeplink?type=chronicles&id=UUID
 * - Direct navigation to app: whispr://app/chronicles/UUID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'chronicles' or 'post'
    const id = searchParams.get('id'); // Post ID
    const userAgent = request.headers.get('user-agent') || '';

    // If no parameters, redirect to web home
    if (!type || !id) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Validate ID format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // Invalid ID, redirect to web home
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Detect if user is on mobile
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    // Construct the appropriate deep link
    if (isMobile) {
      if (isAndroid) {
        // Android deep link: whispr://app/chronicles/{id}
        const deepLink = `whispr://app/${type}/${id}`;
        
        // Create HTML with fallback to web version
        // The Android app will handle the whispr:// scheme
        // If app is not installed, it will fall back after timeout
        return new NextResponse(
          `
<!DOCTYPE html>
<html>
<head>
    <title>Opening Whispr...</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            color: white;
        }
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            margin: 0 0 10px;
            font-size: 24px;
        }
        p {
            margin: 0;
            opacity: 0.9;
        }
        .fallback {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        .fallback a {
            color: white;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Opening Whispr...</h1>
        <p>If the app doesn't open, you can view this on the web below.</p>
        <div class="fallback">
            <p><a href="https://whisprwords.com/${type}/${id}">View on Web</a></p>
        </div>
    </div>
    <script>
        // Attempt to open the deep link
        const deepLink = "${deepLink}";
        const webFallback = "https://whisprwords.com/${type}/${id}";
        
        // Try to open the deep link
        window.location.href = deepLink;
        
        // Fallback: if app is not installed, redirect to web after 2 seconds
        setTimeout(() => {
            window.location.href = webFallback;
        }, 2000);
    </script>
</body>
</html>
          `,
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }
        );
      } else if (isIOS) {
        // iOS deep link: whispr://app/chronicles/{id}
        // Can also use: https://whisprwords.com/chronicles/{id}?app=true
        const deepLink = `whispr://app/${type}/${id}`;
        
        // Create HTML with fallback to web version
        return new NextResponse(
          `
<!DOCTYPE html>
<html>
<head>
    <title>Opening Whispr...</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            color: white;
        }
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            margin: 0 0 10px;
            font-size: 24px;
        }
        p {
            margin: 0;
            opacity: 0.9;
        }
        .fallback {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        .fallback a {
            color: white;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Opening Whispr...</h1>
        <p>If the app doesn't open, you can view this on the web below.</p>
        <div class="fallback">
            <p><a href="https://whisprwords.com/${type}/${id}">View on Web</a></p>
        </div>
    </div>
    <script>
        // Attempt to open the deep link
        const deepLink = "${deepLink}";
        const webFallback = "https://whisprwords.com/${type}/${id}";
        
        // Store timestamp to detect if app opened
        const timestamp = Date.now();
        
        // Try to open the deep link
        window.location.href = deepLink;
        
        // Fallback: if app is not installed, redirect to web after 2 seconds
        setTimeout(() => {
            // Only redirect if app didn't respond (user still on page)
            if (Date.now() - timestamp < 3000) {
                window.location.href = webFallback;
            }
        }, 2000);
    </script>
</body>
</html>
          `,
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }
        );
      }
    }

    // Desktop user - redirect to web version
    return NextResponse.redirect(
      new URL(`/${type}/${id}`, request.url)
    );
  } catch (error) {
    console.error('Deep link error:', error);
    // On error, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }
}
