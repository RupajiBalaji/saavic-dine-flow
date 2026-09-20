# Deploying Saavic Healthy Café on Render

This repository is pre-configured with a Render Blueprint (`render.yaml`) and a production Node.js server preset (`node-server`).

---

## Quick Deployment Steps

### Option A: Via Render Blueprint (Recommended - 1 Click)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub repository: `RupajiBalaji/saavic-dine-flow`.
4. Render will automatically detect `render.yaml` and configure:
   - **Service Name**: `saavic-healthy-cafe`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Fill in the required environment variables prompted on screen (values listed below).
6. Click **Apply**. Render will build and deploy your application.

---

### Option B: Manual Web Service Setup
If you prefer creating a Web Service manually:
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect `RupajiBalaji/saavic-dine-flow`.
3. Set the following settings:
   - **Name**: `saavic-healthy-cafe`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Region**: `Singapore` (or closest to your users)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. In the **Environment Variables** tab, add the variables below.
5. Click **Create Web Service**.

---

## Required Environment Variables

Copy and paste these into your Render Environment settings:

| Variable | Value |
|---|---|
| `NODE_VERSION` | `20.18.0` |
| `NITRO_PRESET` | `node-server` |
| `SUPABASE_PROJECT_ID` | `xsxwlidsbmicqhcwbmak` |
| `SUPABASE_URL` | `https://xsxwlidsbmicqhcwbmak.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_EdSRh8IWuKhwnZtuwhSXXA_X7ARdvdt` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Your Supabase Service Role Key from `.env`)* |
| `VITE_SUPABASE_PROJECT_ID` | `xsxwlidsbmicqhcwbmak` |
| `VITE_SUPABASE_URL` | `https://xsxwlidsbmicqhcwbmak.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_EdSRh8IWuKhwnZtuwhSXXA_X7ARdvdt` |
| `RAZORPAY_KEY_ID` | `rzp_test_placeholder` *(or live key)* |
| `RAZORPAY_KEY_SECRET` | *(Razorpay Secret)* |
| `RAZORPAY_WEBHOOK_SECRET` | *(Razorpay Webhook Secret)* |

---

## Verifying Deployment
Once deployed, Render will provide a live URL such as:
`https://saavic-healthy-cafe.onrender.com`

- **Landing Page**: `https://saavic-healthy-cafe.onrender.com/`
- **About Café Story**: `https://saavic-healthy-cafe.onrender.com/home`
- **Customer Menu & Ordering**: `https://saavic-healthy-cafe.onrender.com/menu`
- **Staff Login**: `https://saavic-healthy-cafe.onrender.com/auth`
- **Kitchen Display / Admin**: `https://saavic-healthy-cafe.onrender.com/admin`
