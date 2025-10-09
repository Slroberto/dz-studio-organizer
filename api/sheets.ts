import { GOOGLE_SHEETS_ID, ORDERS_SHEET_NAME, LOG_SHEET_NAME } from '../config';
import { ServiceOrder, OrderStatus, ActivityLogEntry, ActivityActionType } from '../types';

/**
 * Parses a date string from Google Sheets into a valid ISO string.
 * Handles various formats that might be entered manually or by the API.
 * @param dateInput The date value from the sheet (string, number, or undefined).
 * @returns An ISO 8601 string, or undefined if the input is invalid.
 */
const parseSheetDate = (dateInput: any): string | undefined => {
  if (!dateInput) return undefined;

  // Try direct parsing first - works for ISO strings and many standard formats
  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  // Handle "DD/MM/YYYY" or "DD-MM-YYYY" strings, with optional time
  if (typeof dateInput === 'string') {
    const parts = dateInput.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[ T](\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (parts) {
      // parts[1]=day, parts[2]=month, parts[3]=year
      const day = parseInt(parts[1], 10);
      const month = parseInt(parts[2], 10) - 1; // JS month is 0-indexed
      const year = parseInt(parts[3], 10);
      const hour = parseInt(parts[4] || '12', 10); // Default to midday to avoid timezone issues
      const minute = parseInt(parts[5] || '0', 10);
      const second = parseInt(parts[6] || '0', 10);
      
      // Use UTC to prevent timezone shifts from changing the date
      const parsedDate = new Date(Date.UTC(year, month, day, hour, minute, second));
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
  }

  console.warn(`Could not parse date: "${dateInput}"`);
  return undefined; // Return undefined for unparseable dates
};


// Helper to map a sheet row (array of strings) to a ServiceOrder object
const mapRowToOrder = (row: any[], rowIndex: number): ServiceOrder => {
    return {
        id: row[0] || `OS-TEMP-${rowIndex}`, // Use ID_OS as the primary ID
        orderNumber: row[0] || '',
        client: row[1] || '',
        description: row[2] || '',
        thumbnailUrl: row[3] || 'https://picsum.photos/seed/default/400/300',
        status: row[4] as OrderStatus || OrderStatus.Waiting,
        progress: parseInt(row[5], 10) || 0,
        creationDate: parseSheetDate(row[6]) || new Date().toISOString(),
        expectedDeliveryDate: parseSheetDate(row[7]),
        deliveryDate: parseSheetDate(row[8]),
        responsible: row[9] || '',
        link: row[10] || '',
        lastStatusUpdate: parseSheetDate(row[11]) || new Date().toISOString(),
        _rowIndex: rowIndex + 1 // Save the original row index for updates (1-based)
    };
};

// Helper to map a ServiceOrder object to a sheet row array
const mapOrderToRow = (order: ServiceOrder): any[] => {
    // Format dates back to a Google Sheets-friendly format if needed, or let Sheets auto-detect.
    // Sending ISO string is generally safe.
    return [
        order.orderNumber,
        order.client,
        order.description,
        order.thumbnailUrl,
        order.status,
        order.progress,
        order.creationDate,
        order.expectedDeliveryDate || null,
        order.deliveryDate || null,
        order.responsible,
        order.link,
        order.lastStatusUpdate,
    ];
};


export const getOrders = async (): Promise<ServiceOrder[]> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${ORDERS_SHEET_NAME}!A2:L`, // Assuming headers are in row 1
        });
        const rows = response.result.values || [];
        // The rowIndex passed to mapRowToOrder should be 1-based index of the data row itself
        // Since data starts at sheet row 2, the first data row has an index of 1 relative to the data block
        return rows.map((row, index) => mapRowToOrder(row, index + 1));
    } catch (err: any) {
        console.error("Error fetching orders:", err.result.error.message);
        throw new Error('Failed to fetch data from Google Sheets.');
    }
};

export const addOrder = async (order: ServiceOrder): Promise<any> => {
    const row = mapOrderToRow(order);
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${ORDERS_SHEET_NAME}!A:L`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [row],
            },
        });
        return response.result;
    } catch (err: any) {
        console.error("Error adding order:", err.result.error.message);
        throw new Error('Failed to add order to Google Sheets.');
    }
};

export const updateOrder = async (order: ServiceOrder): Promise<any> => {
    if (!order._rowIndex) {
        throw new Error("Cannot update order without a row index.");
    }
    const row = mapOrderToRow(order);
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${ORDERS_SHEET_NAME}!A${order._rowIndex}:L${order._rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [row],
            },
        });
        return response.result;
    } catch (err: any) {
        console.error("Error updating order:", err.result.error.message);
        throw new Error('Failed to update order in Google Sheets.');
    }
};

export const deleteOrder = async (rowIndex: number): Promise<any> => {
    // Note: Deleting rows shifts everything up. A better strategy for complex apps
    // might be to mark a row as "deleted" with a status or a separate column.
    // For this implementation, we'll proceed with deletion.
    try {
        // Find the sheetId (gid) for the named sheet
        const sheetMeta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEETS_ID });
        const sheet = sheetMeta.result.sheets.find((s: any) => s.properties.title === ORDERS_SHEET_NAME);
        if (!sheet) throw new Error(`Sheet with name ${ORDERS_SHEET_NAME} not found.`);
        const sheetId = sheet.properties.sheetId;

        const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: GOOGLE_SHEETS_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }]
            }
        });
        return response.result;
    } catch (err: any) {
        console.error("Error deleting order:", err.result.error.message);
        throw new Error('Failed to delete order from Google Sheets.');
    }
};


// --- Activity Log Functions ---

const mapRowToLogEntry = (row: any[]): ActivityLogEntry => ({
    id: row[0],
    timestamp: row[1],
    userId: row[2],
    userName: row[3],
    action: row[4] as ActivityActionType,
    orderId: row[5],
    orderNumber: row[6],
    clientName: row[7],
    details: row[8],
});

export const getActivityLog = async (): Promise<ActivityLogEntry[]> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${LOG_SHEET_NAME}!A2:I`,
        });
        const rows = response.result.values || [];
        return rows.map(mapRowToLogEntry);
    } catch (err: any) {
        console.error("Error fetching activity log:", err.result.error.message);
        return []; // Return empty log on error
    }
};

export const addActivityLogEntry = async (entry: ActivityLogEntry): Promise<any> => {
    const row = [
        entry.id, entry.timestamp, entry.userId, entry.userName, entry.action,
        entry.orderId, entry.orderNumber, entry.clientName, entry.details || null
    ];
    try {
        return await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${LOG_SHEET_NAME}!A:I`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [row],
            },
        });
    } catch (err: any) {
        console.error("Error adding log entry:", err.result.error.message);
        // Fail silently for logging
    }
};
