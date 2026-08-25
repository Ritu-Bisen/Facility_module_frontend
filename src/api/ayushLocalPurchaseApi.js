import axios from './axios';

export const getAyushOrders = async (finYearId, status) => {
  try {
    const response = await axios.get('/ayush-local-purchase', {
      params: { finYearId, status }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateAyushPoNo = async (finYearId) => {
  try {
    const response = await axios.get('/ayush-local-purchase/auto-number', {
      params: { finYearId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const saveAyushHeader = async (data) => {
  try {
    const response = await axios.post('/ayush-local-purchase', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAyushOrderDetails = async (id) => {
  try {
    const response = await axios.get(`/ayush-local-purchase/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAyushOrderApi = async (id) => {
  try {
    const response = await axios.delete(`/ayush-local-purchase/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAyushOrderItems = async (id) => {
  try {
    const response = await axios.get(`/ayush-local-purchase/${id}/items`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addAyushOrderItem = async (id, data) => {
  try {
    const response = await axios.post(`/ayush-local-purchase/${id}/items`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAyushOrderItemApi = async (id, itemId, data) => {
  try {
    const response = await axios.put(`/ayush-local-purchase/${id}/items/${itemId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAyushOrderItem = async (id, itemId) => {
  try {
    const response = await axios.delete(`/ayush-local-purchase/${id}/items/${itemId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeAyushOrderApi = async (id, data) => {
  try {
    const response = await axios.put(`/ayush-local-purchase/${id}/complete`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const amendAyushOrderApi = async (id) => {
  try {
    const response = await axios.post(`/ayush-local-purchase/${id}/amend`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
