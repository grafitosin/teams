/**
 * On-Behalf-Of (OBO) token exchange
 *
 * The client only ever gets a Teams SSO token scoped to this app's own AAD
 * app registration - never a Graph token. This module exchanges that token,
 * server-side (where the client secret can live safely), for a real
 * Microsoft Graph access token delegated as the signed-in user.
 *
 * Required environment variables:
 *   AAD_APP_CLIENT_ID      - this app's Azure AD application (client) ID
 *   AAD_APP_CLIENT_SECRET  - a client secret (or use a certificate in prod)
 *   AAD_APP_TENANT_ID      - 'common' for multi-tenant, or a specific tenant ID
 */

const TENANT = process.env.AAD_APP_TENANT_ID || 'common';
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;

async function exchangeSsoTokenForGraphToken(ssoToken) {
  const clientId = process.env.AAD_APP_CLIENT_ID;
  const clientSecret = process.env.AAD_APP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('AAD_APP_CLIENT_ID / AAD_APP_CLIENT_SECRET are not configured on the server.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: ssoToken,
    scope: 'https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read',
    requested_token_use: 'on_behalf_of'
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    // Common cause: admin/user consent hasn't been granted for the requested
    // Graph scopes yet - surface the AAD error so the client can prompt for it.
    const err = new Error(data.error_description || 'OBO token exchange failed');
    err.aadError = data;
    throw err;
  }

  return data.access_token;
}

module.exports = { exchangeSsoTokenForGraphToken };
