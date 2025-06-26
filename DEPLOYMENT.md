# Deployment Guide for Webflow SEO App

## Prerequisites
- Node.js 18+ installed
- Git repository set up
- Webflow OAuth app configured

## Environment Variables
Required environment variables:
```
WEBFLOW_CLIENT_ID=your_client_id
WEBFLOW_CLIENT_SECRET=your_client_secret
WEBFLOW_REDIRECT_URI=https://your-domain.com/callback
SESSION_SECRET=random_secret_string
NODE_ENV=production
PORT=3000
```

## Deployment Options

### 1. Deploy to Render (Recommended - Free Tier)

1. Push your code to GitHub:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. Go to [render.com](https://render.com) and sign up
3. Create a new "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables in the dashboard

### 2. Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Deploy:
   ```bash
   railway login
   railway init
   railway up
   railway open
   ```

3. Add environment variables in Railway dashboard

### 3. Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

3. Deploy:
   ```bash
   vercel
   ```

## Post-Deployment Steps

1. Update your Webflow app's redirect URI to match your production domain
2. Ensure HTTPS is enabled (most platforms do this automatically)
3. Test the OAuth flow completely
4. Monitor logs for any errors

## Security Checklist

- [ ] Environment variables are set properly
- [ ] SESSION_SECRET is a strong random string
- [ ] HTTPS is enabled
- [ ] Token storage directory has proper permissions
- [ ] No sensitive data in logs

## Production Considerations

1. **Database Storage**: For production, consider replacing file-based token storage with:
   - Redis for session storage
   - PostgreSQL/MongoDB for persistent data

2. **Monitoring**: Set up error tracking (Sentry, LogRocket)

3. **Scaling**: Current setup handles single instance. For multiple instances, use:
   - Redis for session storage
   - Shared database for tokens

## Troubleshooting

### OAuth Redirect Mismatch
- Ensure redirect URI in Webflow app settings matches exactly
- Check for trailing slashes
- Verify HTTPS vs HTTP

### Token Storage Issues
- Ensure write permissions for `.tokens` directory
- Check disk space
- Verify file system is persistent (not ephemeral)

### Session Issues
- Ensure SESSION_SECRET is consistent across deployments
- Check cookie settings for production (secure: true)