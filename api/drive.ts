import { GOOGLE_DRIVE_FOLDER_ID } from '../config';

/**
 * Creates a new folder within the main OS_Folders directory on Google Drive.
 * @param folderName The name for the new folder (e.g., "2024-A58_Nike").
 * @returns The created folder's information, including its ID and web link.
 */
export const createFolder = async (folderName: string): Promise<any> => {
    try {
        const fileMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [GOOGLE_DRIVE_FOLDER_ID]
        };
        const response = await window.gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id, webViewLink'
        });
        return response.result;
    } catch (err: any) {
        console.error("Error creating folder:", err.result.error.message);
        throw new Error('Failed to create folder in Google Drive.');
    }
};

/**
 * Lists files within a specific folder in Google Drive.
 * @param folderId The ID of the folder to list files from.
 * @returns A list of files in the folder.
 */
export const getFilesInFolder = async (folderId: string): Promise<any[]> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, webViewLink, iconLink, thumbnailLink, createdTime)',
            orderBy: 'createdTime desc',
        });
        return response.result.files || [];
    } catch (err: any) {
        console.error("Error listing files:", err.result.error.message);
        throw new Error('Failed to list files from Google Drive.');
    }
};


/**
 * Uploads a file to a specific folder in Google Drive using a resumable session.
 * This method is more robust and provides progress updates.
 * @param folderId The ID of the parent folder.
 * @param file The file object to upload.
 * @param onProgress Callback function to report upload progress (0 to 1).
 * @returns The metadata of the created file.
 */
export const uploadFile = async (folderId: string, file: File, onProgress: (progress: number) => void): Promise<any> => {
    const token = window.gapi.client.getToken();
    if (!token) {
        console.error('Authentication token not found.');
        throw new Error("User not authenticated. Please sign in again.");
    }
    const accessToken = token.access_token;

    // Step 1: Initiate a resumable upload session
    const metadata = {
        name: file.name,
        parents: [folderId],
    };

    let initialResponse;
    try {
        initialResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(metadata),
        });
    } catch(networkError) {
        console.error("Network error initiating upload:", networkError);
        throw new Error('Network error: Could not start upload session.');
    }

    if (!initialResponse.ok) {
        const error = await initialResponse.json();
        console.error("Error initiating upload session:", error);
        throw new Error('Failed to start resumable upload session.');
    }

    const location = initialResponse.headers.get('Location');
    if (!location) {
        throw new Error('Could not get the resumable upload URL from Google Drive.');
    }

    // Step 2: Upload the file data using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', location);
        
        // The Authorization header is NOT needed for the PUT request to the session URI
        // It was needed for the initial POST request.
        // FIX: Added the Content-Range header, which is required for single-chunk resumable uploads.
        xhr.setRequestHeader('Content-Range', `bytes 0-${file.size - 1}/${file.size}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = event.loaded / event.total;
                onProgress(progress);
            }
        };

        xhr.onload = () => {
            // A status of 200 or 201 indicates a successful upload.
            if (xhr.status >= 200 && xhr.status < 300) {
                // The response body contains the final file metadata.
                // An empty response body can occur on a 200 OK, so handle that.
                if (xhr.responseText) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    // The upload was successful, but no metadata was returned.
                    // The calling function refreshes the file list anyway.
                    resolve({ success: true, message: 'Upload complete' });
                }
            } else {
                console.error('Upload failed. Status:', xhr.status, 'Response:', xhr.responseText);
                reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
        };

        xhr.onerror = () => {
            console.error('Upload failed due to a network error.');
            reject(new Error('Upload failed due to a network error.'));
        };

        // Send the file object directly. The browser handles the rest.
        xhr.send(file);
    });
};