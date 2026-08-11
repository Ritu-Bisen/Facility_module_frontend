import axios from './axios';

export const getReturnToWarehouseList = async (finYearId, statusId) => {
  try {
    const response = await axios.get('/return-to-warehouse', {
      params: { finYearId, statusId }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getAccYears = async () => {
  try {
    const response = await axios.get('/ward-issue/acc-years');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWarehouses = async (facilityId) => {
  const response = await axios.get('/return-to-warehouse/warehouses', { params: { facilityId } });
  return response.data;
};

export const getHeader = async (id) => {
  const response = await axios.get(`/return-to-warehouse/${id}`);
  return response.data;
};

export const createHeader = async (data) => {
  const response = await axios.post('/return-to-warehouse', data);
  return response.data;
};

export const updateHeader = async (id, data) => {
  const response = await axios.put(`/return-to-warehouse/${id}`, data);
  return response.data;
};

export const getItems = async (id) => {
  const response = await axios.get(`/return-to-warehouse/${id}/items`);
  return response.data;
};

export const addItem = async (id, data) => {
  const response = await axios.post(`/return-to-warehouse/${id}/items`, data);
  return response.data;
};

export const updateItem = async (issueItemId, data) => {
  const response = await axios.put(`/return-to-warehouse/items/${issueItemId}`, data);
  return response.data;
};

export const deleteItem = async (issueItemId) => {
  const response = await axios.delete(`/return-to-warehouse/items/${issueItemId}`);
  return response.data;
};

export const completeIssue = async (id) => {
  const response = await axios.post(`/return-to-warehouse/${id}/complete`);
  return response.data;
};
