# Whispr 📝✨

**Whispr** is a modern poetry and writing platform that transforms thoughts into whispers, and whispers into words. It’s a space where creativity meets minimalism—built for poets, writers, and readers alike.

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://whispr.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Built%20with-Next.js%20%7C%20Tailwind%20%7C%20Supabase-black?style=for-the-badge)](#tech-stack)

---

## ✨ Features

- 🌙 Light/Dark theme toggle with persistent settings
- 🖋️ Post, read, and react to poems
- 💬 Commenting system for engagement
- 🎨 Beautiful typography and transitions
- 🔒 Admin dashboard with media upload, activity tracking, and secure auth
- 📦 Supabase backend with real-time database + storage

---

## 🚀 Live Demo

Visit the live app:  
🔗 [https://whispr.vercel.app](https://whispr.vercel.app)

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend:** Supabase (Auth, Database, Storage)
- **UI/UX:** ShadCN UI, Framer Motion
- **Deployment:** Vercel

---

## 📁 Project Structure

```bash
/
├── app/                # Main application routes (app router)
├── components/         # Reusable UI components
├── lib/                # Supabase, auth, and utility functions
├── public/             # Static files (e.g. favicon)
├── styles/             # Global CSS (includes Tailwind layers)
├── types/              # Centralized types from Supabase
├── .env.local          # Environment variables
└── README.md
