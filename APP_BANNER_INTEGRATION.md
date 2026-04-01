# App Banner Integration Guide

## Overview

The `AppBanner` component intelligently detects when users are on mobile and suggests opening content in the Whispr mobile app. It handles:

- ✅ Mobile device detection
- ✅ App installation detection via deeplink
- ✅ Smart deeplink opening
- ✅ App store redirect if app not installed
- ✅ User dismissal with configurable duration
- ✅ Responsive mobile-friendly design

## ✅ Integration Complete

The AppBanner has been integrated into the following pages:

### 1. Chronicles Post Detail Pages ✅
**File:** `app/chronicles/[slug]/page.tsx`
```tsx
import { AppBanner } from '@/components/app-banner';

// Inside the component:
<AppBanner postId={post.id} postType="chronicles" />
```
✓ Shows banner at bottom of each chronicle post
✓ Users can open in app or download it

### 2. Poetry Detail Pages ✅
**File:** `app/poems/[id]/PoemClientPage.tsx`
```tsx
import { AppBanner } from '@/components/app-banner';

// Inside the component:
<AppBanner postId={poem.id} postType="post" />
```
✓ Shows banner for each poem
✓ Encourages app discovery from poetry content

### 3. Blog Post Detail Pages ✅
**File:** `app/blog/[id]/page.tsx`
```tsx
import { AppBanner } from '@/components/app-banner';

// Inside the component:
<AppBanner postId={post.id} postType="post" />
```
✓ Shows banner for each blog post
✓ Integrated after comments section

## Installation for Additional Pages

If you want to add AppBanner to other pages:

### For Any Detail Page
```tsx
'use client';

import { AppBanner } from '@/components/app-banner';

export default function YourPage({ params }: { params: { id: string } }) {
  return (
    <>
      {/* Your content */}
      <YourDetailContent postId={params.id} />
      
      {/* App Banner at bottom */}
      <div className="mt-12">
        <AppBanner postId={params.id} postType="post" />
      </div>
    </>
  );
}
```

### For Root Layout (Optional - Global Banner)
Only add this if you want the banner on EVERY page:

```tsx
import { AppBanner } from '@/components/app-banner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <AppBanner /> {/* No postId = generic call-to-action */}
      </body>
    </html>
  );
}
```

## Component Props

```typescript
interface AppBannerProps {
  postId?: string;           // The post/chronicle ID (for deeplinks)
  postType?: 'chronicles' | 'post'; // Type of content (default: 'chronicles')
}
```

## How It Works

### User on Mobile WITH App Installed:
1. User visits: `https://whisprwords.vercel.app/chronicles/UUID`
2. Banner appears with "Open in App"
3. User taps "Open" button
4. Banner attempts deeplink: `whispr://app/chronicles/UUID`
5. Android/iOS OS intercepts and opens app ✅
6. App navigates to chronicle detail screen

### User on Mobile WITHOUT App Installed:
1. User visits: `https://whisprwords.vercel.app/chronicles/UUID`
2. Banner appears with "Open in App"
3. User taps "Open" button
4. Deeplink fails (no app handler)
5. Banner detects failure and shows "Get App" button
6. User can download from Play Store or App Store

### User on Desktop:
1. Banner is hidden
2. User sees normal web experience

## Features Explained

### App Installation Detection
```typescript
const checkIfAppInstalled = async () => {
  window.location.href = 'whispr://app/test'; // Try deeplink
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
  
  // If still on page, app isn't installed
  if (!document.hidden) {
    setAppInstalled(false); // Show install prompts
  } else {
    setAppInstalled(true); // App was opened
  }
}
```

### Dismissal Management
- User can dismiss banner for 24 hours
- Dismissal stored in `localStorage` key: `whispr_app_banner_dismissed`
- Change `DISMISS_DURATION_HOURS = 24` to adjust timeout
- Old dismissals auto-expire

### Responsive Design
- Adapts to small screens (hides text on mobile, shows icons)
- Uses Tailwind CSS `sm:` breakpoints
- Positioned at bottom for easy access without blocking content

## Styling Customization

### Change Banner Colors:
```tsx
<div className="bg-gradient-to-r from-purple-600 to-pink-600"> {/* Colors here */}
```

### Change Button Colors:
```tsx
className="bg-white text-purple-600 hover:bg-gray-100" {/* Customize */}
```

### Change Banner Height:
```tsx
<div className="py-4 sm:py-3"> {/* Padding here */}
```

## App Store Links

The component uses placeholder links in `components/app-banner.tsx`. Update these with your actual links once you have app IDs:

**Android:**
```typescript
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.whispr.whisprmobile'
```

**iOS:**
```typescript
const APP_STORE_URL = 'https://apps.apple.com/app/whispr/id1234567890' // Update to real app ID
```

### How to Get App IDs:
- **Android**: 
  - Submit app to Google Play Console first
  - ID will be your package name: `com.whispr.whisprmobile`
  - URL format: `https://play.google.com/store/apps/details?id=com.whispr.whisprmobile`

- **iOS**: 
  - Submit app to App Store Connect
  - Find app ID in "App Information" section
  - URL format: `https://apps.apple.com/app/YOUR-APP-NAME/id1234567890`

### Update App Banner URLs:
Edit `components/app-banner.tsx` lines ~150-160:
```tsx
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.whispr.whisprmobile';
const appStoreUrl = 'https://apps.apple.com/app/whispr/id1234567890'; // Add real ID
```

## Testing the Integration

### Test on Mobile Device (Android):
1. Visit: `https://whisprwords.vercel.app/chronicles/any-chronicle-id`
2. Look for purple banner at bottom
3. Tap "Open in App" button
   - If app installed: Opens app to chronicle
   - If not installed: Shows "Get App" button after 1.5 seconds
4. Tap "Get App" → Opens Play Store
5. Tap X to dismiss → Banner hidden for 24 hours

### Test on Mobile Device (iOS):
1. Visit: `https://whisprwords.vercel.app/poems/any-poem-id`
2. Look for purple banner at bottom
3. Tap "Open in App" button
   - If app installed: Opens app to poem
   - If not installed: Shows "Get App" button after 1.5 seconds
4. Tap "Get App" → Opens App Store
5. Tap "Get App" (second button) → Download app

### Test on Desktop:
1. Visit: `https://whisprwords.vercel.app/blog/any-blog-id`
2. Banner should NOT appear
3. Normal web reading experience

### Browser DevTools Mobile Emulation:
1. Open Chrome DevTools
2. Toggle **Device Toolbar** (Ctrl+Shift+M)
3. Select any mobile device
4. Refresh page
5. Banner should appear at bottom
6. Test interactions (may not test deeplinks in emulation)

### Hide Banner for Specific Content
```tsx
<AppBanner 
  postId={postId} 
  postType="chronicles"
  {...(isPrivateContent && { postId: undefined })} // Don't show for private content
/>
```

### Conditionally Show Based on Auth
```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppBanner } from '@/components/app-banner';

export default function ChronicleDetail() {
  const { user } = useAuth();
  
  return (
    <>
      {/* Your content */}
      {user && <AppBanner postId={id} postType="chronicles" />}
    </>
  );
}
```

### Custom Dismiss Duration
Modify in `app-banner.tsx`:
```typescript
const DISMISS_DURATION_HOURS = 48; // Change from 24 to 48 hours
```

## Analytics Integration

To track banner interactions, add analytics events:

```typescript
const handleOpenInApp = () => {
  // Track event
  analytics.track('app_banner_open_clicked', {
    postId,
    postType,
  });
  
  const deeplink = `whispr://app/${postType}/${postId}`;
  window.location.href = deeplink;
};

const handleOpenPlayStore = () => {
  analytics.track('app_banner_store_clicked', {
    store: 'play_store',
    postId,
    postType,
  });
  
  window.open(/* ... */);
};
```

## Troubleshooting

### Banner Not Appearing
1. Make sure you're on a mobile device (or use browser DevTools mobile emulation)
2. Check if banner was dismissed (clear localStorage)
3. Verify component is added to page/layout

### Deeplinks Not Working
1. Verify app package name is `com.whispr.whisprmobile`
2. Test deeplink directly in browser: `whispr://app/test`
3. Ensure Android deep link intent filters are set up correctly
4. For iOS, verify URL schemes in `Info.plist`

### App Not Opening
1. Make sure Whispr app is installed
2. Try opening deeplink directly from another app
3. Rebuild app if changes were made to `AndroidManifest.xml`

## Integration Checklist

- [x] Component created at `components/app-banner.tsx`
- [x] Component added to `/app/chronicles/[slug]/page.tsx`
- [x] Component added to `/app/poems/[id]/PoemClientPage.tsx`
- [x] Component added to `/app/blog/[id]/page.tsx`
- [ ] Update Android Play Store URL (replace placeholder)
- [ ] Update iOS App Store URL with real app ID
- [ ] Test banner on Android device
- [ ] Test banner on iOS device
- [ ] Test opening in app (with app installed)
- [ ] Test app store redirects (without app)
- [ ] Test dismissal persistence (check 24hr)
- [ ] Add analytics tracking (optional)
- [ ] Deploy backend to production
- [ ] Monitor deeplink traffic

## Production Deployment Checklist

### Step 1: Prepare Mobile App
- [ ] Update Flutter app package name to `com.whispr.whisprmobile`
- [ ] Build APK: `flutter build apk`
- [ ] Build IPA: `flutter build ios`
- [ ] Test deeplinks locally
- [ ] Setup deep link intent filters (done ✅)

### Step 2: Submit to App Stores
- [ ] Submit APK to Google Play Console
  - Note the app ID: `com.whispr.whisprmobile`
  - Get Google Play Store URL format
- [ ] Submit IPA to App Store Connect
  - Get App Store URL from "App Information"
  - App ID format: `id1234567890`

### Step 3: Update Web App Banner
- [ ] Get real App IDs from stores
- [ ] Update Play Store URL in `app-banner.tsx`
- [ ] Update App Store URL in `app-banner.tsx`
- [ ] Test URLs work in browser

### Step 4: Setup Deep Link Verification (Optional but Recommended)

**Android** (Google Play Console):
- [ ] Go to "Setup" → "App signing"
- [ ] Add Digital Asset Links
- [ ] Whispr domain: `whisprwords.vercel.app`
- [ ] Apps can now auto-open without chooser

**iOS** (.well-known/apple-app-site-association):
- [ ] Create file at: `/public/.well-known/apple-app-site-association`
- [ ] Add your Team ID and app ID
- [ ] Deploy to production
- [ ] Verify in browser: `https://whisprwords.vercel.app/.well-known/apple-app-site-association`

### Step 5: Deploy Web App
- [ ] Update AppBanner component with real store URLs
- [ ] Deploy backend to production
- [ ] Verify deeplink API working: `/api/deeplink?type=posts&id=test`
- [ ] Test on production domain

### Step 6: Testing & Monitoring
- [ ] Share a chronicle on phone with app installed
- [ ] Click link → Should open in app ✅
- [ ] Uninstall app, click shared link again
- [ ] Should see "Get App" button → Click → App Store opens
- [ ] Install app, click link again → Opens in app ✅
- [ ] Monitor logs for deeplink errors

## File Locations (Updated)

```
Backend (Next.js) - d:\Codes\whispr\
├── components/app-banner.tsx             ← Smart app banner [DONE]
├── app/api/deeplink/route.ts              ← Deep link redirect [DONE]
├── app/chronicles/[slug]/page.tsx         ← Added banner [DONE]
├── app/poems/[id]/PoemClientPage.tsx      ← Added banner [DONE]
├── app/blog/[id]/page.tsx                 ← Added banner [DONE]
├── APP_BANNER_INTEGRATION.md              ← This file
└── DEEPLINK_SETUP.md                      ← Deep link setup

Mobile (Flutter) - d:\Codes\whispr-mobile\whisprmobile\
├── android/app/build.gradle.kts                    ← Package name [DONE]
├── android/app/src/main/AndroidManifest.xml        ← Deep links [DONE]
├── ios/Runner/Info.plist                           ← URL scheme [DONE]
├── lib/core/router/app_router.dart                 ← Routes [DONE]
└── DEEPLINK_SETUP.md                               ← Deep link guide
```

## Next Steps

1. **Immediate** (Ready Now):
   - Deploy web app with AppBanner (component is integrated)
   - Test on mobile browser with DevTools

2. **Short Term** (This Week):
   - Build and test APK/IPA locally
   - Get real App Store IDs
   - Update URLs in AppBanner
   - Submit apps to stores

3. **Medium Term** (2-4 Weeks):
   - Apps approved and published
   - Setup deep link verification
   - Deploy apple-app-site-association file
   - Monitor deeplink opens

4. **Long Term** (Ongoing):
   - Track app open rates
   - A/B test banner messaging
   - Optimize deeplink UX
   - Monitor store ratings/reviews

## Support & Documentation

- **Deep Link Setup**: See `DEEPLINK_SETUP.md`
- **API Documentation**: See `/api/deeplink` endpoint
- **Mobile Navigation**: See `lib/core/router/app_router.dart`
- **Deep Link Testing**: Use browser: `whispr://app/chronicles/TEST_ID`

