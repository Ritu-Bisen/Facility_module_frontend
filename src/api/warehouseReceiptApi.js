import axios from './axios';

export const getFinancialYears = async () => {
    try {
        const response = await axios.get('/warehouse-receipt/fin-years');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getWarehouseIndents = async (accYear) => {
    try {
        const response = await axios.get(`/warehouse-receipt/indents`, {
            params: { accYear }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getReceiptsByIndent = async (indentId) => {
    try {
        const response = await axios.get(`/warehouse-receipt/receipts/${indentId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getReceiptDetails = async (receiptId) => {
    try {
        const response = await axios.get(`/warehouse-receipt/view/${receiptId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getStockLocations = async () => {
    try {
        const response = await axios.get('/warehouse-receipt/locations');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveReceiptItem = async (receiptId, payload) => {
    try {
        const response = await axios.post(`/warehouse-receipt/view/${receiptId}/items`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getReceiptBatches = async (indentItemId) => {
    try {
        const response = await axios.get(`/warehouse-receipt/batches/${indentItemId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * addBatch — POST /warehouse-receipt/view/:receiptId/batches
 *
 * Payload mirrors gvBatches_RowUpdating values:
 *   facReceiptItemId, indentItemId, itemId, receiptQty, stockLocation (RackID),
 *   batchNo, mfgDate (DD/MM/YYYY), expDate (DD/MM/YYYY), absRQty, issueQty
 */
export const addBatch = async (receiptId, payload) => {
    try {
        const response = await axios.post(`/warehouse-receipt/view/${receiptId}/batches`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const completeReceipt = async (receiptId) => {
    try {
        const response = await axios.post(`/warehouse-receipt/complete/${receiptId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
