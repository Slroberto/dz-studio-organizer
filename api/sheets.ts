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

/**
 * Validates and sanitizes the status string from the spreadsheet.
 * If the status is not a valid OrderStatus enum value, it defaults to Waiting.
 * @param statusString The status value from the sheet.
 * @returns A valid OrderStatus.
 */
const getValidStatus = (statusString: any): OrderStatus => {
  const validStatuses = Object.values(OrderStatus) as string[];
  if (typeof statusString === 'string' && validStatuses.includes(statusString)) {
    return statusString as OrderStatus;
  }
  // If status is empty, invalid, or a typo, default to Waiting.
  // This prevents the app from crashing due to bad data.
  return OrderStatus.Waiting;
};


// Helper to map a sheet row (array of strings) to a ServiceOrder object
const mapRowToOrder = (row: any[], sheetRowIndex: number): ServiceOrder => {
    return {
        id: row[0] || `OS-TEMP-${sheetRowIndex}`, // Use ID_OS as the primary ID
        orderNumber: row[0] || '',
        client: row[1] || '',
        description: row[2] || '',
        thumbnailUrl: row[3] || 'https://picsum.photos/seed/default/400/300',
        status: getValidStatus(row[4]), // Sanitize status to prevent errors
        progress: parseInt(row[5], 10) || 0,
        creationDate: parseSheetDate(row[6]) || new Date().toISOString(),
        expectedDeliveryDate: parseSheetDate(row[7]),
        deliveryDate: parseSheetDate(row[8]),
        responsible: row[9] || '',
        link: row[10] || '',
        lastStatusUpdate: parseSheetDate(row[11]) || new Date().toISOString(),
        imageCount: parseInt(row[12], 10) || 0,
        _rowIndex: sheetRowIndex // Save the original row index for updates (1-based)
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
        order.imageCount || 0,
    ];
};


export const getOrders = async (): Promise<ServiceOrder[]> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${ORDERS_SHEET_NAME}!A2:M`, // Assuming headers are in row 1
        });
        const rows = response.result.values || [];
        
        const mappedOrders: ServiceOrder[] = [];
        rows.forEach((row, index) => {
            // Check if the row is valid (has a truthy value in the first column)
            if (row && row[0] && String(row[0]).trim() !== '') {
                // The actual row number in the sheet is the 0-based index + 2 (because data starts at row 2)
                const sheetRowIndex = index + 2;
                mappedOrders.push(mapRowToOrder(row, sheetRowIndex));
            }
        });
        
        return mappedOrders;

    } catch (err: any) {
        console.error("Error fetching orders:", err.result.error.message);
        throw new Error('Falha ao buscar dados do Google Sheets.');
    }
};

export const addOrder = async (order: ServiceOrder): Promise<any> => {
    const row = mapOrderToRow(order);
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${ORDERS_SHEET_NAME}!A:M`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [row],
            },
        });
        return response.result;
    } catch (err: any) {
        console.error("Error adding order:", err.result.error.message);
        throw new Error('Falha ao adicionar ordem ao Google Sheets.');
    }
};

export const updateOrder = async (order: ServiceOrder): Promise<any> => {
    if (!order._rowIndex) {
        throw new Error("Não é possível atualizar a ordem sem um índice de linha.");
    }
    const row = mapOrderToRow(order);
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `${ORDERS_SHEET_NAME}!A${order._rowIndex}:M${order._rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [row],
            },
        });
        return response.result;
    } catch (err: any) {
        console.error("Error updating order:", err.result.error.message);
        throw new Error('Falha ao atualizar a ordem no Google Sheets.');
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
        if (!sheet) throw new Error(`Planilha com o nome ${ORDERS_SHEET_NAME} não encontrada.`);
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
        throw new Error('Falha ao excluir a ordem do Google Sheets.');
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
