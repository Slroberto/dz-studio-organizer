import { GOOGLE_SHEETS_ID, ORDERS_SHEET_NAME, LOG_SHEET_NAME } from '../config';
import { ServiceOrder, OrderStatus, ActivityLogEntry, ActivityActionType } from '../types';

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
        creationDate: row[6] || new Date().toISOString(),
        expectedDeliveryDate: row[7] || undefined,
        deliveryDate: row[8] || undefined,
        responsible: row[9] || '',
        link: row[10] || '',
        lastStatusUpdate: row[11] || new Date().toISOString(),
        _rowIndex: rowIndex + 1 // Save the original row index for updates (1-based)
    };
};

// Helper to map a ServiceOrder object to a sheet row array
const mapOrderToRow = (order: ServiceOrder): any[] => {
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
