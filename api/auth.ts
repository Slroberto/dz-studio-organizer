/**
 * Triggers the Google OAuth2 consent screen to get an access token.
 * If the user has already granted consent, it may return a token without a prompt.
 */
export const signIn = () => {
  if (window.tokenClient) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // only when establishing a new session or if consent is required.
    window.tokenClient.requestAccessToken({ prompt: 'select_account' });
  } else {
    console.error('Google Token Client not initialized.');
  }
};

/**
 * Revokes the user's access token, effectively signing them out.
 */
export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Access token revoked.');
    });
    window.gapi.client.setToken(null);
  }
};