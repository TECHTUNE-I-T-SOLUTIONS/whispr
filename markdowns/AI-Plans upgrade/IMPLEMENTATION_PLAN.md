# Premium Subscription System - Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for adding premium subscription features to WhisprWords mobile app, including AI and games monetization using Paystack SDK.

---

## Database Schema Changes

### New Tables Created

#### Core Billing Tables (Migration 001)
1. **billing_plans** - Subscription plans (Free, AI Starter, AI Pro, Games Premium, Whispr Premium)
2. **billing_features** - Feature definitions (AI_CHAT, AI_WRITER, PREMIUM_GAMES, etc.)
3. **billing_plan_features** - Mapping plans to features
4. **billing_plan_limits** - Usage limits per plan (tokens, chats, images, etc.)
5. **billing_user_subscriptions** - User subscription records
6. **billing_user_entitlements** - Cached feature access per user
7. **billing_ai_usage** - Monthly AI usage tracking
8. **billing_ai_usage_logs** - Detailed AI request logs
9. **billing_ai_models** - AI model registry (OpenAI, Gemini)
10. **billing_feature_flags** - Global feature toggles
11. **billing_payment_transactions** - Payment transaction records

#### Admin & Management Tables (Migration 002)
12. **billing_settings** - Global billing configuration
13. **billing_admin_subscription_actions** - Admin manual actions log
14. **billing_subscription_disputes** - Dispute management
15. **billing_coupons** - Coupon/promo code management
16. **billing_coupon_usage** - Coupon redemption tracking
17. **billing_referrals** - Referral program
18. **billing_referral_transactions** - Referral reward tracking
19. **billing_analytics** - Daily revenue analytics
20. **billing_plan_revenue** - Revenue breakdown by plan
21. **billing_games_config** - Per-game premium configuration
22. **billing_user_game_usage** - Daily game usage tracking

### Migration Files
- `001_create_billing_tables.sql` - Core billing infrastructure
- `002_create_admin_billing_controls.sql` - Admin management tables
- `003_seed_billing_data.sql` - Initial data seeding

### Updated Files
- `full-schema.sql` - Added all 22 new billing tables with indexes and RLS policies

---

## Subscription Plans

### Plan Structure

| Plan | Monthly | Yearly | Trial Days | Key Features |
|------|---------|--------|------------|--------------|
| Free | $0 | $0 | 0 | 2 chats/day, 15K tokens/day, basic AI |
| AI Starter | $4.99 | $49.99 | 7 | 1K chats/month, 750K tokens/month, all AI tools |
| AI Pro | $12.99 | $129 | 7 | 5K chats/month, 5M tokens/month, priority, research |
| Games Premium | $5.99 | $59 | 7 | Unlimited premium games, story mode, leaderboards |
| Whispr Premium | $14.99 | $149 | 7 | Everything + highest limits, early access |

### Feature Entitlements

**AI Features:**
- AI_CHAT, AI_WRITER, AI_REWRITE, AI_SUMMARIZER, AI_TRANSLATE
- AI_RESEARCH, BLOG_ASSISTANT, DOCUMENT_ANALYSIS, CUSTOM_PROMPTS
- AI_IMAGE_GENERATION (coming soon), AI_VOICE (coming soon)

**Games Features:**
- PREMIUM_GAMES, STORY_MODE, DAILY_CHALLENGES, LEADERBOARDS
- MULTIPLAYER (coming soon)

**Platform Features:**
- PRIORITY_QUEUE, EARLY_ACCESS, UNLIMITED_HISTORY, ADVANCED_ANALYTICS
- CLOUD_STORAGE (coming soon), TEAM_WORKSPACES (coming soon)

---

## Admin Controls

### Feature Toggles
Admins can enable/disable:
- Premium features globally (PREMIUM_ENABLED)
- AI premium specifically (AI_PREMIUM_ENABLED)
- Games premium specifically (GAMES_PREMIUM_ENABLED)
- Free trials (FREE_TRIAL_ENABLED)
- Individual features (IMAGE_GENERATION_ENABLED, VOICE_FEATURES_ENABLED, etc.)

### Pricing Management
Admins can:
- Set plan prices in USD (stored in billing_plans)
- Update exchange rate to Naira (billing_settings.exchange_rate_to_ngn)
- Backend converts USD to Naira before sending to Paystack
- Change prices without code deployment

### Subscription Management
Admins can:
- View all user subscriptions
- Manually upgrade/downgrade users
- Extend trials
- Grant free access
- Revoke access
- Adjust quotas
- Pause/resume subscriptions
- All actions logged in billing_admin_subscription_actions

### Dispute Management
Admins can:
- View and manage subscription disputes
- Process refunds
- Add resolution notes
- Track dispute status (pending, under_review, resolved, rejected, escalated)

### Analytics Dashboard
Metrics available:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Total subscribers, new subscribers, churn
- Conversion rates
- Revenue by plan
- AI costs vs revenue
- Profit margins
- Failed payments

---

## Environment Variables

### Website (Backend) - `.env.local`
```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Paystack Product Codes (from Paystack dashboard)
# These are generated when you create products in Paystack
PAYSTACK_MONTHLY_PRICE_AI_STARTER=PLN_xxx
PAYSTACK_YEARLY_PRICE_AI_STARTER=PLN_xxx
PAYSTACK_MONTHLY_PRICE_AI_PRO=PLN_xxx
PAYSTACK_YEARLY_PRICE_AI_PRO=PLN_xxx
PAYSTACK_MONTHLY_PRICE_GAMES=PLN_xxx
PAYSTACK_YEARLY_PRICE_GAMES=PLN_xxx
PAYSTACK_MONTHLY_PRICE_PREMIUM=PLN_xxx
PAYSTACK_YEARLY_PRICE_PREMIUM=PLN_xxx
```

### Mobile App - `.env.local`
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Paystack (Public key only - safe)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Currency
NEXT_PUBLIC_DEFAULT_CURRENCY=USD
NEXT_PUBLIC_EXCHANGE_RATE_TO_NGN=1500

# Feature Flags
NEXT_PUBLIC_PREMIUM_ENABLED=true
NEXT_PUBLIC_AI_PREMIUM_ENABLED=true
NEXT_PUBLIC_GAMES_PREMIUM_ENABLED=true
```

**Note:** Mobile app only needs the public Paystack key. All secret keys stay on the backend.

---

## Implementation Phases

### Phase 1: Database Setup (Week 1)
- [x] Create migration files
- [x] Update full-schema.sql
- [ ] Run migrations on Supabase
- [ ] Verify tables and RLS policies
- [ ] Test seed data

### Phase 2: Backend Services (Week 2-3)
- [ ] Implement Billing Core module in Next.js
- [ ] Create Paystack service integration
- [ ] Build Entitlement Service
- [ ] Build Quota Service
- [ ] Build Usage Service
- [ ] Implement AI Service with Gemini model fallback chain
- [ ] Implement Game Access Service (fast checks)
- [ ] Implement webhook handlers
- [ ] Add middleware for entitlement checks
- [ ] Add middleware for quota checks

### Phase 3: API Endpoints (Week 3-4)
- [ ] POST /api/billing/subscribe
- [ ] POST /api/billing/change-plan
- [ ] POST /api/billing/cancel
- [ ] POST /api/billing/resume
- [ ] GET /api/billing/plans
- [ ] GET /api/billing/subscription
- [ ] GET /api/billing/usage
- [ ] POST /api/paystack/create-payment
- [ ] POST /api/paystack/webhook
- [ ] GET /api/games/check-access
- [ ] Update AI endpoints with quota checks

### Phase 4: Flutter Integration (Week 4-5)
- [ ] Add Paystack SDK to Flutter
- [ ] Create Billing Service in Flutter
- [ ] Implement subscription screens
- [ ] Add payment sheet integration
- [ ] Build upgrade prompts
- [ ] Add usage displays
- [ ] Implement entitlement caching

### Phase 5: Admin Dashboard (Week 5-6)
- [ ] Build plans management UI
- [ ] Build pricing controls
- [ ] Build feature flag toggles
- [ ] Build subscription viewer
- [ ] Build dispute management
- [ ] Build analytics dashboard
- [ ] Build coupon management

### Phase 6: Testing & Launch (Week 6-7)
- [ ] Unit tests for billing services
- [ ] Integration tests for webhooks
- [ ] End-to-end payment flow tests
- [ ] Load testing for quota checks
- [ ] Security audit
- [ ] Beta testing with select users
- [ ] Production deployment

---

## Key Architecture Decisions

### 1. Feature Entitlement System
**Decision:** Use feature-based entitlements instead of boolean `isPremium` flags.

**Rationale:**
- Future-proof for new features
- Granular control (e.g., AI but not games)
- Easy to add new features without schema changes
- Supports complex plan combinations

**Implementation:**
- Every feature checks: `EntitlementService.hasEntitlement(user, 'FEATURE_KEY')`
- Entitlements cached in billing_user_entitlements table
- Regenerated on subscription changes

### 2. Token-Based Quotas
**Decision:** Track tokens instead of chat counts.

**Rationale:**
- Aligns with AI provider pricing
- Fair across different AI models
- Future-proof for different feature types
- Better cost management

**Implementation:**
- Every AI request logs input/output tokens
- Monthly limits enforced in QuotaMiddleware
- Detailed logs in billing_ai_usage_logs

### 3. Backend-First Architecture
**Decision:** All payment logic on backend, Flutter only displays UI.

**Rationale:**
- Security: Never expose secret keys
- Reliability: Webhooks are source of truth
- Flexibility: Easy to change payment providers
- Consistency: Single source of truth for subscriptions

**Implementation:**
- Flutter requests payment from backend
- Backend creates Paystack subscription
- Backend returns payment sheet params
- Flutter shows Paystack payment sheet
- Webhook confirms and updates database

### 4. Currency Conversion
**Decision:** Store prices in USD, convert to Naira for Paystack.

**Rationale:**
- Single source of truth for pricing
- Easy to update exchange rate
- Supports multiple currencies in future
- Admin controls conversion rate

**Implementation:**
- billing_plans stores USD prices
- billing_settings stores exchange_rate_to_ngn
- Backend converts before Paystack API call
- Admin can update rate without deployment

### 5. Games Premium Configuration
**Decision:** Per-game premium configuration in billing_games_config with admin control.

**Rationale:**
- Some games free, some premium
- Different daily limits per game
- Easy to enable/disable premium per game
- Supports game-specific features
- Admin can mark games as free for promotions

**Implementation:**
- Each game has config row
- premium_required boolean
- is_free boolean (admin can mark games as free)
- required_feature_key (e.g., PREMIUM_GAMES)
- free_daily_plays and premium_daily_plays
- Service layer checks game access quickly for good UX

---

## Security Considerations

### 1. Paystack Keys
- **Secret keys:** Only on backend (Next.js .env.local)
- **Public keys:** Only on mobile app (Flutter .env.local)
- Never commit secrets to git

### 2. Row Level Security
- All billing tables have RLS enabled
- Users can only read their own data
- Service role has full access
- Public can read active plans/features

### 3. Webhook Verification
- Paystack does not provide webhook secrets
- Verify webhooks by checking the event source and structure
- Log all webhook events
- Handle duplicate events idempotently

### 4. Entitlement Validation
- Never trust client-side entitlement checks
- Always validate on backend
- Use middleware for protected endpoints
- Cache entitlements but regenerate on changes

### 5. Rate Limiting
- Implement rate limiting on billing endpoints
- Prevent abuse of free trials
- Detect suspicious patterns
- Flag for admin review

---

## Paystack Integration Notes

### Required Paystack Setup

#### Step 1: Create Paystack Account
1. Sign up at paystack.co
2. Complete KYC verification
3. Get your test keys (for development) and live keys (for production)

#### Step 2: Create Products in Paystack Dashboard

Paystack uses a simple product model. For each subscription plan, create 2 products (monthly and yearly):

**For AI Starter Monthly:**
- Name: `AI Starter - Monthly`
- Description: `Monthly subscription to AI Starter plan with 1,000 chats and 750K tokens`
- Price: `7,485` NGN (converts from $4.99 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck` (this is a digital service)

**For AI Starter Yearly:**
- Name: `AI Starter - Yearly`
- Description: `Yearly subscription to AI Starter plan with 1,000 chats/month and 750K tokens/month`
- Price: `74,985` NGN (converts from $49.99 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

**For AI Pro Monthly:**
- Name: `AI Pro - Monthly`
- Description: `Monthly subscription to AI Pro plan with 5,000 chats and 5M tokens`
- Price: `19,485` NGN (converts from $12.99 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

**For AI Pro Yearly:**
- Name: `AI Pro - Yearly`
- Description: `Yearly subscription to AI Pro plan with 5,000 chats/month and 5M tokens/month`
- Price: `193,500` NGN (converts from $129 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

**For Games Premium Monthly:**
- Name: `Games Premium - Monthly`
- Description: `Monthly subscription to Games Premium with unlimited premium games`
- Price: `8,985` NGN (converts from $5.99 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

**For Games Premium Yearly:**
- Name: `Games Premium - Yearly`
- Description: `Yearly subscription to Games Premium with unlimited premium games`
- Price: `88,500` NGN (converts from $59 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

**For Whispr Premium Monthly:**
- Name: `Whispr Premium - Monthly`
- Description: `Monthly subscription to Whispr Premium with all features and highest limits`
- Price: `22,485` NGN (converts from $14.99 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

**For Whispr Premium Yearly:**
- Name: `Whispr Premium - Yearly`
- Description: `Yearly subscription to Whispr Premium with all features and highest limits`
- Price: `223,500` NGN (converts from $149 USD at 1500 NGN rate)
- Quantity: `Unlimited`
- Physical goods: `Uncheck`

#### Step 3: Copy Product Codes
After creating each product, Paystack will generate a product code (e.g., `PLN_xxxxxxxxx`). Copy these codes and add them to your backend `.env.local`:

```bash
PAYSTACK_MONTHLY_PRICE_AI_STARTER=PLN_[actual_code]
PAYSTACK_YEARLY_PRICE_AI_STARTER=PLN_[actual_code]
PAYSTACK_MONTHLY_PRICE_AI_PRO=PLN_[actual_code]
PAYSTACK_YEARLY_PRICE_AI_PRO=PLN_[actual_code]
PAYSTACK_MONTHLY_PRICE_GAMES=PLN_[actual_code]
PAYSTACK_YEARLY_PRICE_GAMES=PLN_[actual_code]
PAYSTACK_MONTHLY_PRICE_PREMIUM=PLN_[actual_code]
PAYSTACK_YEARLY_PRICE_PREMIUM=PLN_[actual_code]
```

#### Step 4: Configure Webhook (Optional)
Paystack does not require webhook secrets. Configure your webhook URL in Paystack dashboard:
- Webhook URL: `https://your-domain.com/api/paystack/webhook`
- Enable events: `charge.success`, `invoice.create`, `invoice.payment_failed`, `subscription.create`, `subscription.disable`, `subscription.enable`

### Webhook Events to Handle
- `charge.success` - Payment successful
- `invoice.create` - Invoice created
- `invoice.payment_failed` - Payment failed
- `subscription.create` - Subscription created
- `subscription.disable` - Subscription disabled/cancelled
- `subscription.enable` - Subscription re-enabled

### Payment Flow
1. User taps "Upgrade" in Flutter
2. Flutter calls POST /api/billing/subscribe
3. Backend creates Paystack subscription
4. Backend returns payment authorization URL
5. Flutter opens Paystack payment page
6. User completes payment
7. Paystack sends webhook to backend
8. Backend updates subscription status
9. Backend regenerates user entitlements
10. Flutter refreshes and shows premium unlocked

---

## Testing Strategy

### Unit Tests
- BillingService: createSubscription, cancelSubscription, changePlan
- EntitlementService: hasEntitlement, rebuildEntitlements
- QuotaService: hasRemainingQuota, consumeTokens
- PaystackService: customer creation, subscription creation

### Integration Tests
- Webhook handlers with Paystack test events
- End-to-end subscription flow
- Entitlement regeneration
- Quota enforcement

### Load Tests
- Concurrent subscription requests
- High-volume AI usage tracking
- Webhook processing under load
- Database query performance

### Security Tests
- RLS policy enforcement
- Webhook signature verification
- Unauthorized access attempts
- Secret key exposure checks

---

## Monitoring & Analytics

### Key Metrics to Track
- Subscription conversion rate
- Trial-to-paid conversion
- Churn rate
- MRR and ARR growth
- AI cost per user
- Feature usage by plan
- Payment failure rate
- Dispute rate

### Alerts to Set Up
- High payment failure rate
- Webhook processing failures
- AI cost exceeding revenue
- Unusual subscription patterns
- Database query performance degradation

---

## Rollback Plan

If issues arise after launch:
1. Disable new subscriptions via feature flag
2. Keep existing subscriptions active
3. Monitor for issues
4. Fix issues in staging
5. Test thoroughly
6. Re-enable when ready

Database changes are additive (new tables only), so rollback is safe.

---

## Next Steps

1. **Immediate:**
   - Review and approve database schema
   - Set up Paystack account and create plans
   - Add Paystack keys to backend .env.local

2. **This Week:**
   - Run migrations on Supabase
   - Implement Billing Core module
   - Start Paystack service integration

3. **Following Weeks:**
   - Follow implementation phases above
   - Regular progress reviews
   - Adjust timeline as needed

---

## Questions for Review

1. **Plan Pricing:** Are the proposed prices ($4.99, $12.99, $5.99, $14.99) appropriate for your market?
2. **Trial Duration:** 7-day trial sufficient, or should it be longer/shorter?
3. **Free Limits:** Are 2 chats/day and 15K tokens/day the right balance?
4. **Admin Dashboard:** Should this be built into existing admin panel or separate?
5. **Launch Strategy:** Beta test with select users or full launch?
6. **Support:** Who will handle billing disputes and support requests?

---

## Conclusion

This implementation provides a robust, scalable premium subscription system that:
- Supports current AI and games features
- Is future-proof for new features
- Gives admins full control over pricing and features
- Provides detailed analytics for optimization
- Maintains security with backend-first architecture
- Uses Paystack for reliable payment processing

The architecture follows the detailed plans in the AI-Plans upgrade documents and is ready for implementation.
