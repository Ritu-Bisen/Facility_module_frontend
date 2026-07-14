import api from './axios';

export const getBreakageVoucherList = async (facilityId, accYearId, status) => {
    try {
        const response = await api.get('/breakage-voucher/list', {
            params: { facilityId, accYearId, status }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching breakage voucher list:', error);
        throw error;
    }
};

export const generateBreakageVoucherNo = async (facilityId) => {
    try {
        const response = await api.get('/breakage-voucher/generate-issue-no', {
            params: { facilityId }
        });
        return response.data;
    } catch (error) {
        console.error('Error generating voucher no:', error);
        throw error;
    }
};

export const getBreakageVoucherHeader = async (id) => {
    try {
        const response = await api.get(`/breakage-voucher/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching voucher header:', error);
        throw error;
    }
};

export const saveBreakageVoucherHeader = async (data) => {
    try {
        const url = data.issueId ? `/breakage-voucher/${data.issueId}` : '/breakage-voucher/';
        const method = data.issueId ? 'put' : 'post';
        const response = await api[method](url, data);
        return response.data;
    } catch (error) {
        console.error('Error saving voucher header:', error);
        throw error;
    }
};


export const saveBreakageItem = async (issueId, data) => {
    try {
        const url = data.issueItemId ? `/breakage-voucher/items/${data.issueItemId}` : `/breakage-voucher/${issueId}/items`;
        const method = data.issueItemId ? 'put' : 'post';
        const response = await api[method](url, data);
        return response.data;
    } catch (error) {
        console.error('Error saving breakage item:', error);
        throw error;
    }
};

export const getAvailableBatches = async (facilityId, itemId, issueItemId) => {
    try {
        const response = await api.get('/breakage-voucher/batches/available', {
            params: { facilityId, itemId, issueItemId }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching available batches:', error);
        throw error;
    }
};

export const saveBatchAllocations = async (issueItemId, allocations) => {
    try {
        const response = await api.post('/breakage-voucher/batches/allocations', {
            issueItemId,
            allocations
        });
        return response.data;
    } catch (error) {
        console.error('Error saving batch allocations:', error);
        throw error;
    }
};
