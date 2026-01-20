# Deployment Guide

This guide will help you deploy PromptGrade to production.

## Overview

PromptGrade consists of two parts in the **same repository**:
1. **Frontend** - React app in root directory
2. **Backend** - Express.js API server in `server/` directory

> **Recommended**: Deploy both frontend and backend to **Netlify** using Netlify Functions. This allows everything to be deployed together in one place!

## Option 1: Deploy Everything to Netlify (Recommended) ⭐

This is the easiest option since both frontend and backend are in the same repo. Netlify Functions will handle your Express backend as serverless functions.

### Step 1: Configure Netlify

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Connect your repository:**
   - Go to "Add new site" → "Import an existing project"
   - Connect your GitHub repository

3. **Configure build settings** (Netlify will auto-detect from `netlify.toml`, but verify):
   - **Build command**: `pnpm build` or `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `/` (root)

4. **Add Environment Variables** in Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     VITE_GROQ_API_KEY=your_groq_api_key_here
     MONGODB_URI=your_mongodb_connection_string
     ```
   - **Note**: You don't need to set `VITE_API_URL` - the app will automatically use relative URLs (`/api`) when deployed on Netlify

5. **Deploy:**
   - Netlify will automatically deploy on every push to your main branch
   - Or click "Deploy site" to deploy immediately

### How It Works

- The `netlify.toml` file configures Netlify to:
  - Build your frontend React app
  - Deploy your Express backend as a Netlify Function
  - Route `/api/*` requests to the function
- Your API will be available at: `https://your-site.netlify.app/api/*`
- The frontend automatically uses relative URLs when on Netlify

### Verify Deployment

1. **Test Backend:**
   - Visit: `https://your-site.netlify.app/api/health`
   - Should return: `{"status":"ok","message":"API is running"}`

2. **Test Frontend:**
   - Visit your Netlify URL
   - Try creating a quiz
   - Check browser console for any API errors

## Option 2: Deploy Separately (Alternative)

If you prefer to deploy the backend separately (e.g., to Railway or Render), follow the instructions below.

### Step 1: Deploy Backend

> **Note**: Since both frontend and backend are in the same repository, you need to configure the deployment platform to use the `server` directory.

#### Option A: Deploy to Railway

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Create a new project** and select "Deploy from GitHub repo"

3. **Configure your project:**
   - Select your repository
   - Railway will auto-detect it's a Node.js project
   - **Important**: Set the **Root Directory** to `/` (root - this is where package.json is)
   - Set the **Start Command** to: `pnpm start:server` or `cd server && npx tsx index.ts`
   - Railway will automatically run `pnpm install` or `npm install` in the root directory (where all dependencies are)

4. **Add Environment Variables** in Railway dashboard:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   NODE_ENV=production
   ```

5. **Get your backend URL:**
   - Railway will provide a URL like: `https://your-app-name.up.railway.app`
   - Your API will be at: `https://your-app-name.up.railway.app/api`

#### Option B: Deploy to Render

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service:**
   - Connect your GitHub repository
   - **Important**: Set **Root Directory** to `/` (root - this is where package.json is)
   - Set **Build Command**: `pnpm install` or `npm install` (install dependencies from root)
   - Set **Start Command**: `pnpm start:server` or `cd server && npx tsx index.ts`

3. **Add Environment Variables:**
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=10000
   NODE_ENV=production
   ```

4. **Get your backend URL:**
   - Render will provide: `https://your-app-name.onrender.com`
   - Your API will be at: `https://your-app-name.onrender.com/api`

#### Option C: Deploy to Fly.io

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`

2. **Login**: `fly auth login`

3. **Create app**: `fly launch` (in the `server` directory)

4. **Set secrets**:
   ```bash
   fly secrets set MONGODB_URI=your_mongodb_connection_string
   fly secrets set NODE_ENV=production
   ```

5. **Deploy**: `fly deploy`

### Step 2: Deploy Frontend to Netlify (If Backend is Separate)

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Connect your repository:**
   - Go to "Add new site" → "Import an existing project"
   - Connect your GitHub repository (the same repo that has both frontend and backend)

3. **Configure build settings:**
   - **Base directory**: `/` (root - leave blank or set to `/`)
   - **Build command**: `pnpm build` or `npm run build`
   - **Publish directory**: `dist`
   - Netlify will automatically ignore the `server` folder since it's not part of the frontend build

4. **Add Environment Variables** in Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     VITE_GROQ_API_KEY=your_groq_api_key_here
     VITE_API_URL=https://your-backend-url.com/api
     ```
   - **Important**: Replace `https://your-backend-url.com/api` with your actual backend URL from Step 1
   - Make sure to include `/api` at the end
   - Example: `https://promptgrade-api.railway.app/api`

5. **Deploy:**
   - Netlify will automatically deploy on every push to your main branch
   - Or click "Deploy site" to deploy immediately

### Step 3: Update CORS on Backend (Only if Deploying Separately)

If you deployed the backend separately (Option 2), update your backend CORS configuration:

1. **In Railway/Render/Fly.io**, add an environment variable:
   ```
   FRONTEND_URL=https://your-netlify-app.netlify.app
   ```

2. Or update `server/app.ts` to include your Netlify URL in the allowed origins.

> **Note**: If using Netlify Functions (Option 1), CORS is already configured to allow your Netlify domain.

### Step 4: Verify Deployment

1. **Test Backend:**
   - Visit: `https://your-backend-url.com/api/health`
   - Should return: `{"status":"ok","message":"API is running"}`

2. **Test Frontend:**
   - Visit your Netlify URL
   - Try creating a quiz
   - Check browser console for any API errors

## Troubleshooting

### Frontend can't connect to backend

- **Check environment variable**: Make sure `VITE_API_URL` is set correctly in Netlify (only if using Option 2)
- **Check CORS**: Ensure your backend allows requests from your Netlify domain
- **Check backend URL**: Verify the backend is running and accessible
- **Check API path**: Make sure `VITE_API_URL` ends with `/api` (only if using Option 2)
- **For Netlify Functions**: Check Netlify function logs in the dashboard

### Backend connection errors

- **Check MongoDB URI**: Verify your MongoDB connection string is correct
- **Check environment variables**: Ensure all required variables are set
- **Check logs**: Look at Railway/Render/Netlify logs for error messages
- **For Netlify Functions**: Check that `MONGODB_URI` is set in Netlify environment variables

### Build errors

- **Check Node version**: Ensure your deployment platform uses Node 18+
- **Check dependencies**: Make sure all packages are in `package.json`
- **Check build command**: Verify the build command matches your package manager
- **For Netlify Functions**: Ensure `serverless-http` and `@netlify/functions` are installed

## Environment Variables Summary

### Frontend + Backend on Netlify (Option 1 - Recommended)
```
VITE_GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_connection_string
```
> Note: `VITE_API_URL` is not needed - the app uses relative URLs automatically

### Frontend on Netlify, Backend Separate (Option 2)
**Frontend (Netlify):**
```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_API_URL=https://your-backend-url.com/api
```

**Backend (Railway/Render/Fly.io):**
```
MONGODB_URI=your_mongodb_connection_string
PORT=3000 (or auto-assigned)
NODE_ENV=production
FRONTEND_URL=https://your-netlify-app.netlify.app (optional, for CORS)
```

## Quick Reference

- **Backend Health Check**: `https://your-site.netlify.app/api/health` (Option 1) or `https://your-backend-url.com/api/health` (Option 2)
- **Frontend**: `https://your-netlify-app.netlify.app`
- **API Base URL**: `/api` (Option 1) or `https://your-backend-url.com/api` (Option 2)
