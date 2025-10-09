// FIX: Add type definitions for Vite environment variables to resolve TypeScript errors with `import.meta.env`.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GOOGLE_CLIENT_ID: string;
      readonly VITE_GOOGLE_API_KEY: string;
      readonly VITE_GOOGLE_SHEETS_ID: string;
      readonly VITE_GOOGLE_DRIVE_FOLDER_ID: string;
    }
  }
}

// IMPORTANT: These values are loaded from environment variables.
// You must configure these in your hosting environment (e.g., Vercel, Netlify).
// For local development, create a .env.local file at the root of your project.

// The Client ID for your OAuth 2.0 Web application credentials from Google Cloud Console.
// Example: VITE_GOOGLE_CLIENT_ID="12345..."
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'FAKE_CLIENT_ID.apps.googleusercontent.com';

// The API key for your project from Google Cloud Console.
// Example: VITE_GOOGLE_API_KEY="AIzaSy..."
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'FAKE_API_KEY';

// The ID of your Google Sheet. Found in the URL: docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
// Example: VITE_GOOGLE_SHEETS_ID="1a2b3c..."
export const GOOGLE_SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID || 'FAKE_SHEETS_ID';

// The ID of the root folder in Google Drive where OS folders will be created.
// Example: VITE_GOOGLE_DRIVE_FOLDER_ID="4d5e6f..."
export const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || 'FAKE_DRIVE_FOLDER_ID';

// Scopes required by the application to access Sheets and Drive APIs.
export const SCOPES = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// The name of the sheet where Service Orders are stored.
export const ORDERS_SHEET_NAME = 'OS_Data';

// The name of the sheet for the Activity Log.
export const LOG_SHEET_NAME = 'Log_Atividade';