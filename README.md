# Webflow SEO App

A Node.js application for managing SEO settings across your Webflow sites using OAuth authentication.

## Features

- OAuth 2.0 authentication with Webflow
- View all your Webflow sites
- Analyze SEO for all pages in a site
- SEO scoring and issue detection
- Update page SEO metadata
- Bulk SEO analysis

## Setup Instructions

### 1. Create a Webflow App

1. Go to [Webflow Account Settings](https://webflow.com/dashboard/account/apps)
2. Click "Create new app"
3. Fill in the app details:
   - App name: Your SEO App Name
   - Description: SEO management tool
   - Redirect URI: `http://localhost:3000/callback`
4. Save and note your Client ID and Client Secret

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Webflow credentials:
   ```
   WEBFLOW_CLIENT_ID=your_client_id_here
   WEBFLOW_CLIENT_SECRET=your_client_secret_here
   WEBFLOW_REDIRECT_URI=http://localhost:3000/callback
   SESSION_SECRET=generate_a_random_string_here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
node server.js
```

The app will be available at `http://localhost:3000`

## OAuth Scopes Required

The app requests the following scopes for full SEO functionality:

- `sites:read` - View site information
- `sites:write` - Update site settings
- `pages:read` - Read page content and metadata
- `pages:write` - Update page SEO settings
- `cms:read` - Read CMS collections
- `cms:write` - Update CMS items
- `custom_code:read` - Read custom code
- `custom_code:write` - Update custom code

## Usage

1. Click "Connect to Webflow" on the home page
2. Authorize the app to access your Webflow account
3. Select a site from your sites list
4. Click "Analyze SEO" to view SEO analysis
5. The app will show:
   - SEO score for each page
   - Current title and description
   - Issues found (title/description length, missing OG tags)

## API Endpoints

- `GET /` - Home page
- `GET /auth` - Start OAuth flow
- `GET /callback` - OAuth callback
- `GET /test` - Test API connection
- `GET /api/sites` - Get all sites
- `GET /api/sites/:siteId/seo` - Get SEO data for site pages
- `POST /api/sites/:siteId/analyze-seo` - Analyze SEO for all pages
- `PATCH /api/pages/:pageId/seo` - Update page SEO

## Troubleshooting

### OAuth Issues

1. **Invalid redirect URI**: Make sure the redirect URI in your `.env` file matches exactly what you configured in Webflow
2. **Invalid client credentials**: Double-check your client ID and secret
3. **Scope errors**: Ensure the scopes are properly formatted (space-separated)

### Token Storage

Tokens are stored in the session by default. For production, consider:
- Using a database for token storage
- Implementing token refresh logic
- Adding token encryption

## Production Considerations

1. Use HTTPS in production
2. Implement proper token storage (database)
3. Add token refresh logic
4. Implement rate limiting
5. Add proper error logging
6. Use environment-specific configurations