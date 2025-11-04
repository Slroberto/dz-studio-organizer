// IMPORTANT: These values are loaded from environment variables.
// In the development environment, these are loaded from `process.env`.
// In production (e.g., Vercel), these must be configured as Environment Variables.

// The Client ID for your OAuth 2.0 Web application credentials from Google Cloud Console.
// Example: GOOGLE_CLIENT_ID="12345..."
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'FAKE_CLIENT_ID.apps.googleusercontent.com';

// The API key for your project from Google Cloud Console.
// Example: GOOGLE_API_KEY="AIzaSy..."
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'FAKE_API_KEY';

// The ID of your Google Sheet. Found in the URL: docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
// Example: GOOGLE_SHEETS_ID="1a2b3c..."
export const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || 'FAKE_SHEETS_ID';

// The ID of the root folder in Google Drive where OS folders will be created.
// Example: GOOGLE_DRIVE_FOLDER_ID="4d5e6f..."
export const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'FAKE_DRIVE_FOLDER_ID';

// Scopes required by the application to access Sheets and Drive APIs.
export const SCOPES = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// The name of the sheet where Service Orders are stored.
export const ORDERS_SHEET_NAME = 'OS_Data';

// The name of the sheet for the Activity Log.
export const LOG_SHEET_NAME = 'Log_Atividade';