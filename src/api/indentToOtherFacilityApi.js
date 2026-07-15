import api from './axios';

export const getIndentsToOtherFacility = async (yearId, status) => {
    try {
        const response = await api.get('/indent-to-other-facility', { params: { yearId, status } });
        return response.data;
    } catch (error) { throw error; }
};

export const createIndentToOtherFacility = async (fromFacilityId, yearId, indentDate) => {
    try {
        const response = await api.post('/indent-to-other-facility', { fromFacilityId, yearId, indentDate });
        return response.data;
    } catch (error) { throw error; }
};

export const getItemsForFacility = async (facilityId) => {
    try {
        const response = await api.get('/indent-to-other-facility/items', { params: { facilityId } });
        return response.data;
    } catch (error) { throw error; }
};

export const saveIndentItem = async (indentId, itemId, requestedQty, approvedQty, facStock, stockInHand, status) => {
    try {
        const response = await api.post(`/indent-to-other-facility/${indentId}/items`, {
            itemId, requestedQty, approvedQty, facStock, stockInHand, status
        });
        return response.data;
    } catch (error) { throw error; }
};

export const editIndentItem = async (indentId, itemId, requestedQty, approvedQty) => {
    try {
        const response = await api.put(`/indent-to-other-facility/${indentId}/items/${itemId}`, {
            requestedQty, approvedQty
        });
        return response.data;
    } catch (error) { throw error; }
};

export const getIndentDetail = async (indentId) => {
    try {
        const response = await api.get(`/indent-to-other-facility/${indentId}`);
        return response.data;
    } catch (error) { throw error; }
};

export const deleteIndentItem = async (indentId, itemId) => {
    try {
        const response = await api.delete(`/indent-to-other-facility/${indentId}/items/${itemId}`);
        return response.data;
    } catch (error) { throw error; }
};

export const updateIndent = async (indentId, fromFacilityId, accYrSetId) => {
    try {
        const response = await api.put(`/indent-to-other-facility/${indentId}`, { fromFacilityId, accYrSetId });
        return response.data;
    } catch (error) { throw error; }
};

export const deleteIndent = async (indentId) => {
    try {
        const response = await api.delete(`/indent-to-other-facility/${indentId}`);
        return response.data;
    } catch (error) { throw error; }
};

export const completeIndent = async (indentId) => {
    try {
        const response = await api.post(`/indent-to-other-facility/${indentId}/complete`);
        return response.data;
    } catch (error) { throw error; }
};
