require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const tokenStore = require('./lib/token-store');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// OAuth Configuration
const WEBFLOW_AUTH_URL = 'https://webflow.com/oauth/authorize';
const WEBFLOW_TOKEN_URL = 'https://api.webflow.com/oauth/access_token';
const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

// Required scopes for SEO app
const SCOPES = 'sites:read sites:write pages:read pages:write cms:read cms:write custom_code:read custom_code:write';

// Token validation middleware
async function validateToken(req, res, next) {
  // Skip validation for auth routes
  if (req.path === '/' || req.path === '/auth' || req.path === '/callback' || req.path === '/disconnect') {
    return next();
  }

  // Check if token exists
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'No access token found' });
  }

  // Check if we have token metadata to validate expiry
  if (req.session.tokenMetadata) {
    const { expires_in, obtained_at } = req.session.tokenMetadata;
    if (expires_in) {
      const expiresAt = obtained_at + (expires_in * 1000);
      const now = Date.now();
      
      // Token expired or about to expire (5 min buffer)
      if (now >= expiresAt - (5 * 60 * 1000)) {
        console.log('Token expired or expiring soon');
        
        // Try to load from persistent storage
        if (req.session.persistentId) {
          const storedToken = await tokenStore.getToken(req.session.persistentId);
          if (storedToken && storedToken.obtained_at) {
            const storedExpiresAt = storedToken.obtained_at + ((storedToken.expires_in || 7200) * 1000);
            if (now < storedExpiresAt - (5 * 60 * 1000)) {
              // Stored token is still valid, use it
              req.session.accessToken = storedToken.access_token;
              req.session.tokenMetadata = {
                expires_in: storedToken.expires_in,
                obtained_at: storedToken.obtained_at
              };
              return next();
            }
          }
        }
        
        // Token is expired, user needs to re-authenticate
        return res.status(401).json({ 
          error: 'Token expired', 
          message: 'Please re-authenticate',
          redirect: '/auth'
        });
      }
    }
  }

  next();
}

// Home route
app.get('/', async (req, res) => {
  // Try to recover token from storage if session is empty but we have a persistent ID
  if (!req.session.accessToken && req.session.persistentId) {
    const storedToken = await tokenStore.getToken(req.session.persistentId);
    if (storedToken && storedToken.access_token) {
      req.session.accessToken = storedToken.access_token;
      req.session.tokenMetadata = {
        expires_in: storedToken.expires_in,
        obtained_at: storedToken.obtained_at
      };
    }
  }
  
  const isAuthenticated = !!req.session.accessToken;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Webflow SEO App</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .button { display: inline-block; padding: 10px 20px; background: #0366d6; color: white; text-decoration: none; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>Webflow SEO App</h1>
      ${isAuthenticated ? 
        `<p class="success">✓ Connected to Webflow</p>
         <a href="/disconnect" class="button">Disconnect</a>
         <a href="/test" class="button">Test API Connection</a>` : 
        `<p>Connect your Webflow account to get started.</p>
         <a href="/auth" class="button">Connect to Webflow</a>`
      }
    </body>
    </html>
  `);
});

// Start OAuth flow
app.get('/auth', (req, res) => {
  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: process.env.WEBFLOW_CLIENT_ID,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: process.env.WEBFLOW_REDIRECT_URI,
    state: state
  });

  const authUrl = `${WEBFLOW_AUTH_URL}?${params.toString()}`;
  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});

// OAuth callback
app.get('/callback', async (req, res) => {
  const { code, state, error, error_description, error_uri } = req.query;

  // Handle errors with enhanced debugging
  if (error) {
    console.error('OAuth error:', {
      error,
      error_description,
      error_uri,
      timestamp: new Date().toISOString()
    });
    
    return res.send(`
      <h1>Authentication Error</h1>
      <p style="color: red;"><strong>Error:</strong> ${error}</p>
      ${error_description ? `<p style="color: red;"><strong>Details:</strong> ${error_description}</p>` : ''}
      ${error_uri ? `<p><a href="${error_uri}" target="_blank">More information</a></p>` : ''}
      <a href="/">Go back</a>
    `);
  }

  // Verify state
  if (!state || state !== req.session.oauthState) {
    console.error('State mismatch');
    return res.status(400).send('Invalid state parameter');
  }

  // Clear state
  delete req.session.oauthState;

  try {
    // Exchange code for token
    console.log('Exchanging code for token...');
    const tokenResponse = await axios.post(WEBFLOW_TOKEN_URL, {
      client_id: process.env.WEBFLOW_CLIENT_ID,
      client_secret: process.env.WEBFLOW_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.WEBFLOW_REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token, expires_in, token_type, scope } = tokenResponse.data;
    console.log('Token received successfully');

    // Generate persistent session ID if not exists
    if (!req.session.persistentId) {
      req.session.persistentId = tokenStore.generateSessionId();
    }

    // Store token with metadata
    await tokenStore.saveToken(req.session.persistentId, {
      access_token,
      token_type: token_type || 'Bearer',
      expires_in,
      scope,
      obtained_at: Date.now()
    });

    // Also keep in session for quick access
    req.session.accessToken = access_token;
    req.session.tokenMetadata = {
      expires_in,
      obtained_at: Date.now()
    };

    // Redirect to home
    res.redirect('/');
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).send(`
      <h1>Token Exchange Error</h1>
      <p style="color: red;">${error.response?.data?.error_description || error.message}</p>
      <a href="/">Go back</a>
    `);
  }
});

// Apply token validation middleware to protected routes
app.use(validateToken);

// Test API connection
app.get('/test', async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/');
  }

  try {
    // Get user info
    const userResponse = await axios.get(`${WEBFLOW_API_BASE}/token/introspect`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Get sites
    const sitesResponse = await axios.get(`${WEBFLOW_API_BASE}/sites`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`,
        'Accept': 'application/json'
      }
    });

    res.json({
      user: userResponse.data,
      sites: sitesResponse.data
    });
  } catch (error) {
    console.error('API test error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
});

// Disconnect
app.get('/disconnect', async (req, res) => {
  // Clean up stored token
  if (req.session.persistentId) {
    await tokenStore.deleteToken(req.session.persistentId);
  }
  
  req.session.destroy();
  res.redirect('/');
});

// API Routes
const seoRoutes = require('./routes/seo');
app.use('/api', seoRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nWebflow SEO App running on http://localhost:${PORT}`);
  console.log('\nMake sure to set up your OAuth app in Webflow:');
  console.log('1. Go to https://webflow.com/dashboard/account/apps');
  console.log('2. Create a new app');
  console.log('3. Set redirect URI to:', process.env.WEBFLOW_REDIRECT_URI || 'http://localhost:3000/callback');
  console.log('4. Copy your client ID and secret to .env file\n');
  
  // Run token cleanup every hour
  setInterval(() => {
    tokenStore.cleanup(24); // Clean tokens older than 24 hours
  }, 60 * 60 * 1000);
});