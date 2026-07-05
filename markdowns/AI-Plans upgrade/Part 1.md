# WhisprWords Premium Platform
## Software Architecture & Implementation Specification

**Version:** 1.0.0

**Author:** ChatGPT (Lead Software Architect)

**Target Stack**

- Flutter
- Next.js
- TypeScript
- Supabase
- Paystack Billing
- Paystack Mobile SDK
- OpenAI
- Gemini
- PostgreSQL

---

# Table of Contents

1. Overview
2. Objectives
3. High-Level Architecture
4. Billing Philosophy
5. Subscription Model
6. Feature Entitlement System
7. AI Usage System
8. Games Premium System
9. Database Design
10. Paystack Integration
11. Backend Architecture
12. Flutter Architecture
13. Middleware
14. Webhooks
15. Security
16. Future Expansion

---

# 1. Overview

WhisprWords is evolving into an AI-powered ecosystem rather than a simple AI assistant.

The Premium Platform must therefore support:

- AI subscriptions
- Game subscriptions
- Feature-based subscriptions
- Bundle subscriptions
- Future AI products
- Image generation
- Voice generation
- Storage
- Future enterprise plans

without requiring any redesign.

Instead of designing billing around products, billing will be designed around **Feature Entitlements**.

Every feature inside WhisprWords will simply ask:

> Does this user have permission?

If yes:

Continue.

If no:

Return Upgrade Required.

This keeps every module independent of Paystack.

---

# 2. Objectives

The billing system must satisfy the following goals.

## Functional Goals

✔ Feature-based subscriptions

✔ Monthly plans

✔ Annual plans

✔ Free plan

✔ Free trial

✔ Coupons

✔ Promo codes

✔ Subscription upgrades

✔ Downgrades

✔ Auto renewals

✔ Grace periods

✔ Usage tracking

✔ AI token tracking

✔ Premium Games

✔ Future AI Image generation

✔ Future AI Video generation

✔ Future Voice generation

✔ Analytics

✔ Admin controls

---

## Non Functional Goals

- Scalable

- Secure

- Maintainable

- Provider Agnostic

Although Paystack is used today, future payment providers should be pluggable.

---

# 3. High-Level Architecture

                    Flutter App
                          │
                          │ HTTPS
                          │
            ┌─────────────▼─────────────┐
            │      Next.js Backend      │
            └─────────────┬─────────────┘
                          │
          ┌───────────────┼──────────────┐
          │               │              │
     Auth Service   Billing Service   AI Service
          │               │              │
          │         Paystack SDK          │
          │               │              │
          └───────────────┼──────────────┘
                          │
                    Paystack Billing
                          │
                     Paystack Webhooks
                          │
                      Supabase DB

Paystack never talks directly to Flutter.

Flutter never contains secret keys.

Flutter never verifies subscriptions.

Everything is verified by the backend.

---

# 4. Billing Philosophy

The Premium Platform will NOT sell products.

Instead, it sells ACCESS.

Example:

Instead of

```
Buy AI
```

it becomes

```
Unlock AI_CHAT

Unlock AI_WRITER

Unlock AI_SUMMARIZER

Unlock PREMIUM_GAMES

Unlock IMAGE_GENERATION

Unlock VOICE

Unlock STORAGE

Unlock EARLY_ACCESS

Unlock PRIORITY_PROCESSING
```

Each subscription simply grants multiple entitlements.

---

# 5. Subscription Plans

## Free

Price

$0

Includes

✓ 2 AI chats per day

✓ AI Writer (limited)

✓ Blog completion (limited)

✓ One free AI game

✓ Read articles

✓ Save drafts

Restrictions

✗ Premium games

✗ Voice AI

✗ Image Generation

✗ Research Assistant

✗ Long Context AI

Daily Token Limit

15,000 tokens/day

Maximum Response Length

Short

Priority

Lowest

---

## AI Starter

Monthly

$4.99

Yearly

$49.99

Includes

✓ 1,000 AI chats/month

✓ 750,000 tokens/month

✓ AI Writer

✓ Blog Generator

✓ Rewrite

✓ Summarizer

✓ Translate

✓ Grammar

✓ Templates

✓ Long Responses

✗ Image Generation (Coming Soon)

✗ Voice (Coming Soon)

---

## AI Pro

Monthly

$12.99

Yearly

$129

Includes

Everything in Starter

Plus

5,000,000 tokens

Priority Processing

Research Mode

Document Analysis

Future Image Generation

Future Voice

Future Video

---

## Games Premium

Monthly

$5.99

Yearly

$59

Includes

Unlimited AI Games

Story Mode

Premium Characters

Future Multiplayer

Daily Challenges

Leaderboards

Exclusive Rewards

---

## Whispr Premium

Monthly

$14.99

Yearly

$149

Everything

AI

Games

Future Features

Highest limits

Priority Queue

Early Access

Beta Features

```
Continue in Part 2...
```