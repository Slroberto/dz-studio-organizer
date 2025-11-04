import { GOOGLE_API_KEY, GOOGLE_CLIENT_ID, SCOPES } from '../config';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

/**
 * Initializes the GAPI client for Google Sheets and Drive APIs.
 * This function is now more robust with timeout and error handling for loading the client library.
 */
const initGapiClient = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Add a guard to prevent hanging if the API key is not set.
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.startsWith('FAKE_')) {
        return reject(new Error("A chave de API do Google (GOOGLE_API_KEY) não está configurada."));
    }

    const startGapiInitialization = async () => {
      try {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          ],
        });
        resolve();
      } catch (error) {
        console.error('Error initializing GAPI client:', error);
        reject(error);
      }
    };

    // Use the configuration object for gapi.load for better error handling
    window.gapi.load('client', {
      callback: startGapiInitialization,
      onerror: (error: any) => {
        console.error('Error loading GAPI client library:', error);
        reject(new Error('Failed to load GAPI client library.'));
      },
      timeout: 10000, // 10 second timeout
      ontimeout: () => {
        reject(new Error('Timed out loading GAPI client library.'));
      },
    });
  });
};


/**
 * Initializes the Google Identity Services (GIS) client for OAuth2.
 * @param callback The function to call when a new token is received.
 */
const initGisClient = (callback: (tokenResponse: any) => void) => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('FAKE_')) {
    console.error("GOOGLE_CLIENT_ID is not set. Authentication will fail.");
    // FIX: Instead of failing silently, throw a user-friendly error that can be caught and displayed in the UI.
    throw new Error("A configuração da aplicação está incompleta (GOOGLE_CLIENT_ID). Contate o administrador.");
  }
  window.tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: callback,
  });
};

/**
 * Helper to poll for a condition to be true.
 * @param check Function that returns true when the condition is met.
 * @param timeout Time in ms to wait before rejecting.
 */
const waitFor = (
  check: () => boolean,
  timeout = 10000,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (check()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Timed out waiting for Google script to load.`));
      }
    }, 100); // Poll every 100ms
  });
};


/**
 * Loads the necessary Google scripts and initializes the GAPI and GIS clients.
 * @param tokenCallback The function to call when a new access token is acquired.
 */
export const initGoogleClient = async (tokenCallback: (tokenResponse: any) => void): Promise<void> => {
    // The external scripts are loaded via <script> tags in index.html.
    // We need to wait for them to be loaded and for the global `gapi` and `google`
    // objects to be available. Polling is more reliable than using window.onload
    // with module scripts, which might run after the load event has fired.
    try {
        await Promise.all([
            waitFor(() => !!window.gapi?.load), // Wait for gapi and its load function
            waitFor(() => !!window.google?.accounts?.oauth2), // Wait for the full GIS oauth2 object
        ]);
        
        await initGapiClient();
        initGisClient(tokenCallback);
    } catch (error) {
        console.error("Failed to initialize Google scripts:", error);
        // Re-throw to be caught in AppContext and update UI
        throw error;
    }
};