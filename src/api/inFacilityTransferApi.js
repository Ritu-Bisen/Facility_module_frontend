import api from './axios';

export const getInFacilityTransferList = async (facilityId, accYearId, status) => {
    try {
        const response = await api.get('/in-facility-transfer/list', {
            params: { facilityId, accYearId, status }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getIncomingReceiptsList = async (facilityId, accYearId) => {
    try {
        const response = await api.get('/in-facility-transfer/receipts-list', {
            params: { facilityId, accYearId }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getInFacilityTransferFacilities = async (facilityId) => {
  try {
    const response = await api.get(`/in-facility-transfer/facilities/${facilityId}`);
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch facilities' };
    }
  } catch (error) {
    console.error('Error in getInFacilityTransferFacilities:', error);
    return { success: false, message: 'API error occurred', data: [] };
  }
};

export const generateInFacilityTransferIssueNo = async (facilityId) => {
  try {
    const response = await api.get(`/in-facility-transfer/generate-issue-no`, {
      params: { facilityId }
    });
    if (response.data && response.data.success) {
      return { success: true, issueNo: response.data.issueNo };
    } else {
      return { success: false, message: response.data?.message || 'Failed to generate issue no' };
    }
  } catch (error) {
    console.error('Error in generateInFacilityTransferIssueNo:', error);
    return { success: false, message: 'API error occurred', issueNo: '' };
  }
};

export const getInFacilityTransferItems = async (facilityId) => {
  try {
    const response = await api.get('/in-facility-transfer/items', {
      params: { facilityId }
    });
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch items' };
    }
  } catch (error) {
    console.error('Error in getInFacilityTransferItems:', error);
    return { success: false, message: 'API error occurred', data: [] };
  }
};

export const getInFacilityTransferItemDetails = async (facilityId, itemId) => {
  try {
    const response = await api.get('/in-facility-transfer/item-details', {
      params: { facilityId, itemId }
    });
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch item details' };
    }
  } catch (error) {
    console.error('Error in getInFacilityTransferItemDetails:', error);
    return { success: false, message: 'API error occurred', data: null };
  }
};

export const saveInFacilityTransferIssueItem = async (payload) => {
  try {
    const response = await api.post('/in-facility-transfer/issue-item', payload);
    return response.data;
  } catch (error) {
    console.error('Error in saveInFacilityTransferIssueItem:', error);
    return { success: false, message: 'API error occurred' };
  }
};

export const deleteInFacilityTransferIssueItem = async (issueItemId) => {
  try {
    const response = await api.delete(`/in-facility-transfer/issue-item/${issueItemId}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteInFacilityTransferIssueItem:', error);
    return { success: false, message: 'API error occurred' };
  }
};

export const getInFacilityTransferIssueById = async (id) => {
  try {
    const response = await api.get(`/in-facility-transfer/issue/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error in getInFacilityTransferIssueById:', error);
    return { success: false, message: 'API error occurred' };
  }
};

export const generateAndSaveInFacilityTransferIssueNo = async (facilityId, payload) => {
  try {
    const response = await api.post(`/issues/generate-and-save/${facilityId}`, payload);
    if (response.data && response.data.success) {
      return { success: true, issueNo: response.data.issueNo };
    } else {
      return { success: false, message: response.data?.message || 'Failed to generate and save issue no' };
    }
  } catch (error) {
    console.error('Error in generateAndSaveInFacilityTransferIssueNo:', error);
    return { success: false, message: error.response?.data?.message || 'API error occurred', issueNo: '' };
  }
};

export const updateInFacilityTransferIssueHeader = async (issueId, payload) => {
  try {
    const response = await api.put(`/in-facility-transfer/issue/${issueId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error in updateInFacilityTransferIssueHeader:', error);
    return { success: false, message: error.response?.data?.message || 'API error occurred' };
  }
};
