import { GOOGLE_DRIVE_FOLDER_ID } from '../config';

/**
 * [MOCK] Creates a fake folder object.
 * @param folderName The name for the new folder (e.g., "2024-A58_Nike").
 * @returns A promise that resolves to a fake folder object.
 */
export const createFolder = async (folderName: string): Promise<any> => {
    console.log(`[MOCK] Creating folder: ${folderName}`);
    return Promise.resolve({
        id: `fake-folder-${Date.now()}`,
        webViewLink: '#' // Return a dummy link to prevent errors
    });
};

/**
 * [MOCK] Returns an empty list of files.
 * @param folderId The ID of the folder to list files from.
 * @returns A promise that resolves to an empty array.
 */
export const getFilesInFolder = async (folderId: string): Promise<any[]> => {
    console.log(`[MOCK] Getting files for folder: ${folderId}`);
    return Promise.resolve([]);
};


/**
 * [MOCK] Simulates a file upload with progress.
 * @param folderId The ID of the parent folder.
 * @param file The file object to upload.
 * @param onProgress Callback function to report upload progress (0 to 1).
 * @returns A promise that resolves when the fake upload is complete.
 */
export const uploadFile = async (folderId: string, file: File, onProgress: (progress: number) => void): Promise<any> => {
    console.log(`[MOCK] Uploading file "${file.name}" to folder: ${folderId}`);
    
    return new Promise((resolve) => {
        let progress = 0;
        onProgress(progress);

        const interval = setInterval(() => {
            progress += 0.25;
            onProgress(progress);
            if (progress >= 1) {
                clearInterval(interval);
                console.log(`[MOCK] Upload complete for "${file.name}"`);
                resolve({ success: true, message: 'Mock upload complete' });
            }
        }, 300); // Simulate upload over 1.2 seconds
    });
};