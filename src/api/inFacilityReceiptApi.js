import axios from './axios';

export const getReceiptHeader = async (indentId) => {
    try {
        const response = await axios.get(`/in-facility-receipt/header/${indentId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getReceiptHeaderInfo = async (facReceiptId) => {
    try {
        const response = await axios.get(`/in-facility-receipt/header-info/${facReceiptId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveReceiptHeader = async (payload) => {
    try {
        const response = await axios.post(`/in-facility-receipt/header`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getReceiptItems = async (indentId, facReceiptId) => {
    try {
        let url = `/in-facility-receipt/items?indentId=${indentId}`;
        if (facReceiptId) {
            url += `&facReceiptId=${facReceiptId}`;
        }
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveReceiptItem = async (payload) => {
    try {
        const response = await axios.post(`/in-facility-receipt/items`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getReceiptBatches = async (indentItemId) => {
    try {
        const response = await axios.get(`/in-facility-receipt/batches/${indentItemId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const completeFacilityReceipt = async (facReceiptId, remarks) => {
    try {
        const response = await axios.post(`/in-facility-receipt/complete/${facReceiptId}`, { remarks });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteFacilityReceipt = async (facReceiptId) => {
    try {
        const response = await axios.delete(`/in-facility-receipt/delete/${facReceiptId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
