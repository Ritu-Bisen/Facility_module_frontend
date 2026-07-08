import axios from './axios';

export const getIndentHeader = async (nocId) => {
    try {
        const response = await axios.get(`/shc-indent-approval/${nocId}/header`);
        return response.data;
    } catch (error) {
        console.error('Error fetching SHC indent header:', error);
        throw error;
    }
};

export const getIndentItems = async (nocId) => {
    try {
        const response = await axios.get(`/shc-indent-approval/${nocId}/items`);
        return response.data;
    } catch (error) {
        console.error('Error fetching SHC indent items:', error);
        throw error;
    }
};

export const approveItem = async (data) => {
    try {
        const response = await axios.post(`/shc-indent-approval/approve`, data);
        return response.data;
    } catch (error) {
        console.error('Error approving SHC indent item:', error);
        throw error;
    }
};

export const completeIndent = async (nocId) => {
    try {
        const response = await axios.post(`/shc-indent-approval/complete/${nocId}`);
        return response.data;
    } catch (error) {
        console.error('Error completing SHC indent:', error);
        throw error;
    }
};
