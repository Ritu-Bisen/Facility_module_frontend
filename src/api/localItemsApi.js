import axios from './axios';

export const getCategories = async () => {
  const response = await axios.get('/local-items/categories');
  return response.data;
};

export const getItemTypes = async () => {
  const response = await axios.get('/local-items/item-types');
  return response.data;
};

export const getEdlItems = async () => {
  const response = await axios.get('/local-items/edl-items');
  return response.data;
};

export const getEdlItemDetails = async (itemCode) => {
  const response = await axios.get(`/local-items/edl-items/${itemCode}`);
  return response.data;
};

export const getLocalItems = async (categoryId) => {
  const params = categoryId ? { categoryId } : {};
  const response = await axios.get('/local-items', { params });
  return response.data;
};

export const saveLocalItem = async (data) => {
  const response = await axios.post('/local-items', data);
  return response.data;
};

export const deleteLocalItem = async (id) => {
  const response = await axios.delete(`/local-items/${id}`);
  return response.data;
};
