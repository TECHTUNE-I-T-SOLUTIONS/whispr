# Billing Core Module

## Purpose

The Billing Core module is the single source of truth for everything related to subscriptions, premium access, AI quotas, usage tracking, feature entitlements, payment providers, and billing analytics.

No other module in WhisprWords should communicate directly with Paystack or implement its own premium checks.

Instead, every module must communicate with Billing Core.

This keeps billing logic centralized, testable, scalable, and easy to maintain.

---

# Design Principles

The Billing Core module must own:

- Subscription Management
- Plan Management
- Feature Entitlements
- AI Quotas
- Usage Tracking
- Payment Providers
- Paystack Integration
- Webhook Processing
- Feature Flags
- Billing Analytics
- Invoice Metadata
- Trial Management
- Coupons
- Referral Rewards
- Future Billing Providers

No feature module should duplicate billing logic.

---

# High-Level Architecture

                    Flutter
                       │
                 HTTPS Request
                       │
               Next.js API Route
                       │
                Billing Controller
                       │
                 Billing Core Module
                       │
       ┌─────────┬─────────┬─────────┐
       │         │         │         │
   Paystack     Supabase   OpenAI   Gemini
       │
       ▼
 Paystack Webhooks

The Billing Core module is responsible for coordinating all billing-related interactions.

---

# Recommended Folder Structure

src/

    core/

        billing/

            index.ts

            billing.module.ts

            constants/

            config/

            controllers/

            services/

            repositories/

            middleware/

            providers/

            Paystack/

            quotas/

            entitlements/

            usage/

            analytics/

            webhooks/

            featureFlags/

            plans/

            subscriptions/

            trials/

            coupons/

            referrals/

            dto/

            validators/

            interfaces/

            types/

            utils/

---

# Public API

Only expose a minimal public API to the rest of the application.

Example:

BillingCore

↓

createSubscription()

cancelSubscription()

changePlan()

restoreSubscription()

hasEntitlement()

hasRemainingQuota()

consumeTokens()

getCurrentPlan()

getSubscription()

getRemainingTokens()

getRemainingChats()

getPlanLimits()

grantTrial()

rebuildEntitlements()

syncSubscription()

createBillingPortal()

No other module should access repositories directly.

---

# Internal Layers

Billing Core consists of several layers.

Controllers

Receive requests from Next.js API routes.

↓

Services

Contain all business logic.

↓

Repositories

Read and write data from Supabase.

↓

Providers

Communicate with external services.

↓

Database

Supabase PostgreSQL.

---

# Providers

Billing Core supports provider abstraction.

interface PaymentProvider

Required methods

createCustomer()

createSubscription()

cancelSubscription()

resumeSubscription()

changePlan()

createBillingPortal()

verifyWebhook()

createCheckout()

getInvoice()

refundPayment()

Future providers

PaystackProvider

PaystackProvider

FlutterwaveProvider

PaddleProvider

LemonSqueezyProvider

Only PaystackProvider will be implemented initially.

Changing providers should never require changing business logic.

---

# Services

BillingService

Coordinates all billing workflows.

SubscriptionService

Handles lifecycle management.

PlanService

Loads pricing and plan details.

EntitlementService

Determines whether users can access features.

QuotaService

Calculates remaining limits.

UsageService

Records AI consumption.

FeatureFlagService

Enables or disables platform features globally.

AnalyticsService

Calculates revenue and usage metrics.

WebhookService

Processes Paystack events.

TrialService

Handles free trial eligibility.

CouponService

Applies discounts.

ReferralService

Processes referral rewards.

---

# Middleware

AuthMiddleware

Ensures the user is authenticated.

↓

SubscriptionMiddleware

Loads active subscription.

↓

EntitlementMiddleware

Checks feature access.

↓

QuotaMiddleware

Checks remaining usage.

↓

FeatureFlagMiddleware

Checks whether the feature is globally enabled.

↓

Execute Request

Every protected endpoint follows this pipeline.

---

# AI Integration

The AI module must never know about Paystack.

Instead it calls Billing Core.

Example flow

AI Chat Request

↓

BillingCore.hasEntitlement("AI_CHAT")

↓

BillingCore.hasRemainingQuota()

↓

BillingCore.consumeTokens()

↓

Call OpenAI

↓

Record Usage

↓

Return Response

---

# Games Integration

Game Request

↓

BillingCore.hasEntitlement("PREMIUM_GAMES")

↓

Allowed?

↓

Yes

↓

Launch Game

Otherwise

↓

Return Upgrade Required

---

# Blog Integration

Create Blog

↓

BillingCore.hasEntitlement("BLOG_ASSISTANT")

↓

BillingCore.consumeTokens()

↓

Generate Content

---

# Future Image Generation

Image Request

↓

BillingCore.hasEntitlement("AI_IMAGE_GENERATION")

↓

Feature Enabled?

↓

No

↓

Return

COMING_SOON

When development finishes

↓

Feature Flag

↓

Enabled

↓

No billing changes required.

---

# Error Responses

Billing Core returns structured errors.

Examples

FEATURE_LOCKED

TOKEN_LIMIT_REACHED

SUBSCRIPTION_REQUIRED

PLAN_REQUIRED

TRIAL_EXPIRED

FEATURE_DISABLED

PAYMENT_FAILED

PAYMENT_PENDING

These responses should include:

errorCode

message

requiredPlan

currentPlan

remainingQuota

upgradeRecommendation

This allows Flutter to build intelligent upgrade screens.

---

# Logging

Every Billing Core action should be logged.

Examples

Subscription Created

Subscription Renewed

Subscription Cancelled

Trial Started

Trial Expired

Payment Failed

Webhook Received

Quota Exceeded

Feature Denied

Analytics should be generated from these logs.

---

# Testing

Every service should have isolated unit tests.

Repositories should be mocked.

Providers should be mocked.

Webhook handlers should be integration tested using Paystack test events.

Billing Core should be testable independently of Flutter and the frontend.

---

# Guiding Principle

The Billing Core module is the only component that understands:

- Paystack
- Payment providers
- Plans
- Features
- Quotas
- Usage
- Entitlements
- Billing analytics

Every other module simply asks:

"Can this user perform this action?"

Billing Core answers that question.

This separation keeps the architecture modular, scalable, and maintainable as WhisprWords grows.