// NeuraMinds — Google OAuth Service
// Standard OAuth 2.0 / OpenID Connect authorization code flow.
// Safe environment-variable-driven implementation using native fetch.

function isGoogleOauthConfigured() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  return Boolean(clientId && clientSecret && callbackUrl);
}

/**
 * Generates the Google OAuth 2.0 login URL for redirecting the user.
 */
function getGoogleAuthUrl(state = '') {
  if (!isGoogleOauthConfigured()) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  if (state) {
    params.append('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for Google user profile info.
 */
async function exchangeCodeForUser(code) {
  if (!isGoogleOauthConfigured()) {
    throw new Error('Google OAuth credentials are not configured on the backend.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  // 1. Exchange code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('[GoogleAuth] Token exchange failed:', errText);
    throw new Error('Failed to exchange authorization code with Google.');
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Fetch user profile info using access token
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch user profile from Google.');
  }

  const googleUser = await userRes.json();

  return {
    googleId: googleUser.id,
    email: googleUser.email,
    name: googleUser.name || googleUser.email.split('@')[0],
    avatar: googleUser.picture || '',
    emailVerified: Boolean(googleUser.verified_email),
  };
}

module.exports = {
  isGoogleOauthConfigured,
  getGoogleAuthUrl,
  exchangeCodeForUser,
};
