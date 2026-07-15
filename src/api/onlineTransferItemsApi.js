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
