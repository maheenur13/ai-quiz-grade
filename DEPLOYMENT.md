# Deployment Guide

This guide will help you deploy PromptGrade to production.

## Overview

PromptGrade consists of two parts:
1. **Frontend** - React app (deploy to Netlify, Vercel, etc.)
2. **Backend** - Express.js API server (deploy to Railway, Render, Fly.io, etc.)

## Step 1: Deploy Backend

### Option A: Deploy to Railway (Recommended)

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Create a new project** and select "Deploy from GitHub repo"

3. **Configure your project:**
   - Select your repository
   - Railway will auto-detect it's a Node.js project
   - Set the **Root Directory** to `/` (or leave blank)
   - Set the **Start Command** to: `cd server && npx tsx index.ts` or create a `package.json` script

4. **Add Environment Variables** in Railway dashboard:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   NODE_ENV=production
   ```

5. **Get your backend URL:**
   - Railway will provide a URL like: `https://your-app-name.up.railway.app`
   - Your API will be at: `https://your-app-name.up.railway.app/api`

### Option B: Deploy to Render

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service:**
   - Connect your GitHub repository
   - Set **Root Directory** to `server`
   - Set **Build Command**: `npm install` or `pnpm install`
   - Set **Start Command**: `npx tsx index.ts` or `node dist/index.js` (if you build first)

3. **Add Environment Variables:**
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=10000
   NODE_ENV=production
   ```

4. **Get your backend URL:**
   - Render will provide: `https://your-app-name.onrender.com`
   - Your API will be at: `https://your-app-name.onrender.com/api`

### Option C: Deploy to Fly.io

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`

2. **Login**: `fly auth login`

3. **Create app**: `fly launch` (in the `server` directory)

4. **Set secrets**:
   ```bash
   fly secrets set MONGODB_URI=your_mongodb_connection_string
   fly secrets set NODE_ENV=production
   ```

5. **Deploy**: `fly deploy`

## Step 2: Deploy Frontend to Netlify

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Connect your repository:**
   - Go to "Add new site" → "Import an existing project"
   - Connect your GitHub repository

3. **Configure build settings:**
   - **Build command**: `pnpm build` or `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `/` (root)

4. **Add Environment Variables** in Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     VITE_GROQ_API_KEY=your_groq_api_key_here
     VITE_API_URL=https://your-backend-url.com/api
     ```
   - **Important**: Replace `https://your-backend-url.com/api` with your actual backend URL from Step 1
   - Make sure to include `/api` at the end

5. **Deploy:**
   - Netlify will automatically deploy on every push to your main branch
   - Or click "Deploy site" to deploy immediately

## Step 3: Update CORS on Backend

After deploying your frontend, update your backend CORS configuration:

1. **In Railway/Render/Fly.io**, add an environment variable:
   ```
   FRONTEND_URL=https://your-netlify-app.netlify.app
   ```

2. Or update `server/index.ts` to include your Netlify URL in the allowed origins.

## Step 4: Verify Deployment

1. **Test Backend:**
   - Visit: `https://your-backend-url.com/api/health`
   - Should return: `{"status":"ok","message":"API is running"}`

2. **Test Frontend:**
   - Visit your Netlify URL
   - Try creating a quiz
   - Check browser console for any API errors

## Troubleshooting

### Frontend can't connect to backend

- **Check environment variable**: Make sure `VITE_API_URL` is set correctly in Netlify
- **Check CORS**: Ensure your backend allows requests from your Netlify domain
- **Check backend URL**: Verify the backend is running and accessible
- **Check API path**: Make sure `VITE_API_URL` ends with `/api`

### Backend connection errors

- **Check MongoDB URI**: Verify your MongoDB connection string is correct
- **Check environment variables**: Ensure all required variables are set
- **Check logs**: Look at Railway/Render logs for error messages

### Build errors

- **Check Node version**: Ensure your deployment platform uses Node 18+
- **Check dependencies**: Make sure all packages are in `package.json`
- **Check build command**: Verify the build command matches your package manager

## Environment Variables Summary

### Frontend (Netlify)
```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (Railway/Render/Fly.io)
```
MONGODB_URI=your_mongodb_connection_string
PORT=3000 (or auto-assigned)
NODE_ENV=production
FRONTEND_URL=https://your-netlify-app.netlify.app (optional, for CORS)
```

## Quick Reference

- **Backend Health Check**: `https://your-backend-url.com/api/health`
- **Frontend**: `https://your-netlify-app.netlify.app`
- **API Base URL**: `https://your-backend-url.com/api`
