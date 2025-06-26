# Step-by-Step Render Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the green "New" button or go to https://github.com/new
3. Name your repository: `webflow-seo-app`
4. Keep it Public (required for Render free tier)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Push Your Code to GitHub

Copy and run these commands in your terminal:

```bash
# Add GitHub as remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/webflow-seo-app.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 3: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started" or "Sign Up"
3. Sign up with your GitHub account (recommended) or email
4. Verify your email if needed

## Step 4: Create a New Web Service

1. From your Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account if you haven't already
4. You should see your `webflow-seo-app` repository - click "Connect"

## Step 5: Configure Your Web Service

Fill in these settings:

**Basic Settings:**
- Name: `webflow-seo-app` (or any name you prefer)
- Region: Choose closest to you (Oregon - US West is default)
- Branch: `main`
- Root Directory: leave blank
- Runtime: `Node`

**Build & Deploy Settings:**
- Build Command: `npm install`
- Start Command: `npm start`

**Plan:**
- Select "Free" ($0/month)

## Step 6: Add Environment Variables

Before clicking "Create Web Service", scroll down to "Environment Variables" and add:

1. Click "Add Environment Variable" for each:
   - Key: `WEBFLOW_CLIENT_ID` | Value: (your Webflow client ID)
   - Key: `WEBFLOW_CLIENT_SECRET` | Value: (your Webflow client secret)
   - Key: `WEBFLOW_REDIRECT_URI` | Value: `https://webflow-seo-app.onrender.com/callback`
   - Key: `SESSION_SECRET` | Value: (generate a random string - see below)
   - Key: `NODE_ENV` | Value: `production`
   - Key: `PORT` | Value: `3000`

To generate a SESSION_SECRET, run this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 7: Deploy

1. Click "Create Web Service"
2. Render will start building and deploying your app
3. Wait for the build to complete (usually 2-5 minutes)
4. Your app will be live at: `https://webflow-seo-app.onrender.com`

## Step 8: Update Webflow App Settings

1. Go to your Webflow app settings: https://webflow.com/dashboard/account/apps
2. Find your app and click "Edit"
3. Update the Redirect URI to: `https://webflow-seo-app.onrender.com/callback`
4. Save changes

## Step 9: Test Your Deployment

1. Visit your app URL: `https://webflow-seo-app.onrender.com`
2. Click "Connect to Webflow"
3. Authorize the app
4. You should be redirected back and see "Connected to Webflow"

## Troubleshooting

### Build Fails
- Check the logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### OAuth Error
- Double-check redirect URI matches exactly
- Ensure environment variables are set correctly
- Check Webflow app is approved/active

### App Sleeps (Free Tier)
- Render free tier spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- This is normal for free tier

## Next Steps

1. **Custom Domain**: Add your own domain in Render settings
2. **Monitoring**: Set up health checks in Render dashboard
3. **Logs**: View logs in Render dashboard for debugging
4. **Upgrades**: Consider paid tier for always-on service

## Important Notes

- Free tier has 750 hours/month (enough for one app running 24/7)
- Apps spin down after 15 minutes of inactivity
- Free tier perfect for testing and low-traffic apps
- Render automatically handles HTTPS/SSL

## Quick Commands Reference

```bash
# View your remote repository
git remote -v

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check your current branch
git branch

# View recent commits
git log --oneline -5
```