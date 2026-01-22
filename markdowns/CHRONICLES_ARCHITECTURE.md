# Whispr Chronicles - Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WHISPR CHRONICLES                         │
│                     Creator Platform                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   Frontend Pages     │          │    API Routes        │
│                      │          │                      │
│ • Landing (/chron)   │  <────→  │ • Auth endpoints     │
│ • Signup             │          │ • Post CRUD          │
│ • Dashboard          │          │ • Engagement         │
│ • Write/Editor       │          │ • Creator data       │
│ • Posts              │          │ • Settings/Config    │
│ • Profile            │          │ • Leaderboard        │
│ • Leaderboard        │          │ • Analytics          │
└──────────────────────┘          └──────────────────────┘
         │                                    │
         │         Database Layer            │
         └────────────┬──────────────────────┘
                      │
         ┌────────────▼──────────────┐
         │   SUPABASE (PostgreSQL)   │
         │                            │
         │  ┌──────────────────────┐ │
         │  │ Chronicles Tables    │ │
         │  │                      │ │
         │  │ • creators           │ │
         │  │ • posts              │ │
         │  │ • engagement         │ │
         │  │ • streaks            │ │
         │  │ • achievements       │ │
         │  │ • settings           │ │
         │  │ • programs           │ │
         │  └──────────────────────┘ │
         │                            │
         └────────────────────────────┘
```

---

## 📱 User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW CREATOR JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘

          ┌──────────────────────┐
          │  Landing Page        │
          │  /chronicles         │
          └──────────┬───────────┘
                     │
                     ▼ (Click "Start Writing")
          ┌──────────────────────┐
          │  Signup Page         │
          │  /chronicles/signup  │
          │                      │
          │  Step 1: Email/Pass  │
          │  Step 2: Profile     │
          └──────────┬───────────┘
                     │
                     ▼ (Success)
          ┌──────────────────────┐
          │  Dashboard           │
          │  /chronicles/        │
          │  dashboard           │
          │                      │
          │  • Stats             │
          │  • Posts             │
          │  • Badges            │
          └──────┬───────────────┘
                 │
                 ├─────────────────────┬──────────────────┐
                 │                     │                  │
                 ▼                     ▼                  ▼
          ┌────────────────┐   ┌────────────────┐  ┌──────────────┐
          │ Write New Post │   │ Edit Posts     │  │ View Profile │
          │ /chronicles/   │   │ /chronicles/   │  │ Settings     │
          │ write          │   │ write/:id      │  │              │
          └────────┬───────┘   └────────────────┘  └──────────────┘
                   │
          ┌────────▼────────┐
          │  Create/Edit    │
          │  Content        │
          └────────┬────────┘
                   │
          ┌────────▼────────────────┐
          │ Save Draft / Publish    │
          └────────┬────────────────┘
                   │
          ┌────────▼────────────────┐
          │ Post Published!         │
          │ Appears in Feed         │
          │ Share & Promote         │
          └────────┬────────────────┘
                   │
          ┌────────▼────────────────┐
          │ Earn Engagement         │
          │ • Likes                 │
          │ • Comments              │
          │ • Shares                │
          └────────┬────────────────┘
                   │
          ┌────────▼────────────────┐
          │ Accumulate Streaks      │
          │ & Badges                │
          └────────┬────────────────┘
                   │
          ┌────────▼────────────────┐
          │ Climb Leaderboard       │
          │ Unlock Rewards          │
          └────────┬────────────────┘
                   │
          ┌────────▼────────────────┐
          │ Get Offered Sub-Admin   │
          │ Role (Elite Creators)   │
          └────────────────────────┘
```

---

## 📊 Database Schema

```
CHRONICLES_CREATORS
├── id (UUID)
├── user_id (FK: auth.users)
├── program_id (FK: chronicles_programs)
├── pen_name (TEXT) *Unique display name
├── bio (TEXT)
├── profile_image_url (TEXT)
├── status (active|inactive|banned|pending)
├── role (creator|verified_creator|sub_admin)
├── streak_count (INT)
├── longest_streak (INT)
├── total_posts (INT)
├── total_engagement (INT)
├── total_shares (INT)
├── points (INT)
├── badges (TEXT[])
├── sub_admin_offered (BOOLEAN)
├── last_post_date (TIMESTAMP)
└── created_at, updated_at

CHRONICLES_POSTS
├── id (UUID)
├── creator_id (FK: chronicles_creators)
├── title (TEXT)
├── slug (TEXT) *Unique URL slug
├── content (TEXT)
├── excerpt (TEXT)
├── cover_image_url (TEXT)
├── category (TEXT)
├── tags (TEXT[])
├── status (draft|published|archived)
├── likes_count (INT)
├── comments_count (INT)
├── shares_count (INT)
├── views_count (INT)
├── published_at (TIMESTAMP)
└── created_at, updated_at

CHRONICLES_ENGAGEMENT
├── id (UUID)
├── post_id (FK: chronicles_posts)
├── user_id (FK: auth.users)
├── engagement_type (like|comment|share)
├── content (TEXT) *For comments
└── created_at

CHRONICLES_STREAK_HISTORY
├── id (UUID)
├── creator_id (FK: chronicles_creators)
├── streak_date (DATE)
├── post_count (INT)
├── engagement_count (INT)
└── created_at

CHRONICLES_ACHIEVEMENTS
├── id (UUID)
├── badge_id (TEXT)
├── name (TEXT)
├── description (TEXT)
├── icon_url (TEXT)
├── requirement (TEXT)
├── points_reward (INT)
└── created_at

CHRONICLES_CREATOR_ACHIEVEMENTS
├── id (UUID)
├── creator_id (FK: chronicles_creators)
├── achievement_id (FK: chronicles_achievements)
└── earned_at

CHRONICLES_SETTINGS
├── id (UUID)
├── setting_key (TEXT) *Unique
├── setting_value (TEXT)
├── updated_by (FK: auth.users)
└── updated_at

CHRONICLES_PROGRAMS
├── id (UUID)
├── name (TEXT)
├── description (TEXT)
├── status (draft|active|ended|paused)
├── start_date (TIMESTAMP)
├── end_date (TIMESTAMP)
├── created_by (FK: auth.users)
└── created_at, updated_at
```

---

## 🎮 Gamification Flow

```
┌────────────────────────────────────────────────────────────────┐
│                  GAMIFICATION SYSTEM                            │
└────────────────────────────────────────────────────────────────┘

POST CREATION
    │
    ├─→ +10 Points
    │
    └─→ Start/Continue Streak
         (Day 1, 2, 3, ... 10 ✓ Badge!)

ENGAGEMENT RECEIVED
    │
    ├─→ Like: +1 Point
    ├─→ Comment: +2 Points
    ├─→ Share: +5 Points
    │
    └─→ Trigger Achievement Checks
         ├─→ 100+ Likes on Post? → "Viral Post" Badge
         ├─→ 50+ Comments? → "Community Favorite" Badge
         └─→ 50+ Shares? → "Super Sharer" Badge

MILESTONE ACHIEVEMENTS
    │
    ├─→ 10-day streak → Badge + 50 Points
    ├─→ 100 total posts → Badge + Spotlight
    ├─→ 500+ engagement → "Master Storyteller" Badge
    └─→ Elite performer? → Sub-Admin Offer!

LEADERBOARD
    │
    └─→ Ranked by:
        ├─→ Engagement score
        ├─→ Streak length
        ├─→ Post count
        └─→ Points total

SUB-ADMIN PATH
    │
    └─→ Invite top creators to:
        ├─→ Moderate comments
        ├─→ Feature posts
        ├─→ Manage community
        └─→ Shape platform
```

---

## 🔐 Security & Privacy Model

```
┌────────────────────────────────────────────────────────────────┐
│              SECURITY & ISOLATION LAYERS                        │
└────────────────────────────────────────────────────────────────┘

FEATURE ISOLATION
├─→ New tables (chronicles_*) separate from main tables
├─→ Feature flag controls visibility (on/off)
└─→ No impact on existing admin or visitor tables

AUTHENTICATION
├─→ Creator sign-up with email/password
├─→ Session-based auth
├─→ JWT tokens for API
└─→ Role-based access control (creator/verified/sub_admin)

DATA ISOLATION (RLS)
├─→ Creators see only their own posts in dashboard
├─→ Creators see only their own stats
├─→ Engagement visible to all (public read)
└─→ Admins can see all data for moderation

API SECURITY
├─→ All endpoints require authentication
├─→ Rate limiting on public endpoints
├─→ Input validation on all forms
├─→ CORS configured appropriately
└─→ XSS/CSRF protection via Next.js defaults

CONTENT MODERATION
├─→ Posts flagged for review
├─→ Sub-admins can moderate comments
├─→ Admin can remove inappropriate content
└─→ Creator can be banned if necessary
```

---

## 🚀 Deployment Phases

```
PHASE 1: MVP (Week 1)
├─ Deploy database tables
├─ Implement auth endpoints
├─ Create dashboard UI
├─ Build post CRUD
└─ Set feature_enabled = 'false' (hidden)

PHASE 2: Engagement (Week 2)
├─ Add streak tracking
├─ Implement achievements
├─ Build leaderboard
└─ Creator profiles

PHASE 3: Advanced (Week 3+)
├─ Analytics dashboard
├─ Creator discovery
├─ Sub-admin features
├─ Email notifications
└─ Monetization integration

PHASE 4: Public Launch
├─ Set feature_enabled = 'true'
├─ Promote in header banner
├─ Marketing campaign
└─ Monitor performance
```

---

## 📈 Scalability Considerations

```
CURRENT SETUP (MVP)
├─ Single Supabase instance
├─ RLS for data isolation
└─ Indexed queries for performance

FUTURE SCALING
├─ Database replication for high traffic
├─ Caching layer (Redis) for leaderboards
├─ CDN for image/content delivery
├─ Async jobs for streak/badge processing
├─ Queue system for notifications
└─ Analytics warehouse (BigQuery, etc)
```

---

## 🎨 Component Hierarchy

```
app/chronicles/
├── page.tsx (Landing)
├── signup/
│   └── page.tsx (Signup Flow)
├── dashboard/
│   └── page.tsx (Creator Dashboard)
├── write/
│   ├── page.tsx (New Post)
│   └── [id]/page.tsx (Edit Post)
├── posts/
│   └── [slug]/page.tsx (View Post)
├── feed/
│   └── page.tsx (Chronicles Feed)
├── profile/
│   └── [id]/page.tsx (Creator Profile)
├── leaderboard/
│   └── page.tsx (Leaderboard)
└── settings/
    └── page.tsx (Creator Settings)

app/admin/chronicles/
├── dashboard/page.tsx
├── creators/page.tsx
├── content-moderation/page.tsx
├── settings/page.tsx
└── analytics/page.tsx

components/
└── chronicles-teaser-banner.tsx (Header Banner)

api/chronicles/
├── settings/route.ts
├── auth/
│   ├── signup/route.ts
│   ├── login/route.ts
│   └── logout/route.ts
├── creator/
│   ├── stats/route.ts
│   ├── posts/route.ts
│   └── [id]/route.ts
├── posts/
│   ├── [slug]/route.ts
│   └── [id]/engage/route.ts
├── feed/route.ts
└── leaderboard/route.ts
```

---

## 📊 Key Metrics to Track

```
CREATION METRICS
├─ New creators/day
├─ Posts created/day
├─ Average posts per creator
└─ Content diversity (categories)

ENGAGEMENT METRICS
├─ Total likes/comments/shares
├─ Avg engagement per post
├─ Comment sentiment
└─ Share expansion factor

CREATOR HEALTH
├─ Active creators (posts this week)
├─ Streak count distribution
├─ Badge distribution
└─ Creator retention rate

PLATFORM HEALTH
├─ Feature toggle status
├─ API response times
├─ Error rates
└─ User satisfaction scores
```

---

## 🎯 Success Criteria

```
PHASE 1 COMPLETION
✓ Database tables created & tested
✓ All pages rendering correctly
✓ Signup flow works end-to-end
✓ Dashboard displays real data
✓ Post creation & publishing works
✓ Feature toggle functions properly

PHASE 2 COMPLETION
✓ Streak system active
✓ Badges earned & displayed
✓ Leaderboard populated
✓ Creator profiles complete
✓ 100+ active creators

PHASE 3 COMPLETION
✓ Analytics dashboard live
✓ Creator discovery working
✓ Sub-admin invitations sent
✓ Email notifications active
✓ Monetization integration done

LAUNCH READINESS
✓ 500+ creators signed up
✓ 1000+ posts created
✓ 10K+ engagements
✓ Zero critical bugs
✓ All performance targets met
```

---

This architecture provides a **scalable, secure, and engaging** platform for creators to publish their work independently within the Whispr ecosystem! 🚀
