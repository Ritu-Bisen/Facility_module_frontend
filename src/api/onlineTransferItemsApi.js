import api from './axios';

export const getIndentHeader = async (nocId) => {
    try {
        const response = await api.get(`/online-transfer-items/header/noc/${nocId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getIssueHeader = async (issueId) => {
    try {
        const response = await api.get(`/online-transfer-items/header/issue/${issueId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createIssueHeader = async (data) => {
    try {
        const response = await api.post('/online-transfer-items/header', data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateIssueHeader = async (issueId, data) => {
    try {
        const response = await api.put(`/online-transfer-items/header/${issueId}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getItemsForIssue = async (nocId, issueId) => {
    try {
        const safeIssueId = issueId || '0';
        const response = await api.get(`/online-transfer-items/items/issue/${safeIssueId}/noc/${nocId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// --- Ward Issue mappings for identical logic ---

export const getBatches = async (issueItemId, itemId) => {
    try {
        const response = await api.get(`/ward-issue/batches/${issueItemId}/${itemId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveIssueItem = async (issueId, payload) => {
    try {
        const response = await api.post(`/ward-issue/${issueId}/items`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateIssueItem = async (issueItemId, payload) => {
    try {
        const response = await api.put(`/ward-issue/items/${issueItemId}`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteIssueItem = async (issueItemId) => {
    try {
        const response = await api.delete(`/ward-issue/items/${issueItemId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const completeIssue = async (issueId) => {
    try {
        const response = await api.post(`/ward-issue/${issueId}/complete`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteIssue = async (issueId) => {
    try {
        const response = await api.delete(`/ward-issue/${issueId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
