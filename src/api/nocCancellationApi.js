import axios from './axios';

export const getNocsForCancellation = async () => {
  try {
    const response = await axios.get('/noc-cancellation');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNocItemsForCancellation = async (nocId) => {
  try {
    const response = await axios.get(`/noc-cancellation/${nocId}/items`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelNocItems = async (srs) => {
  try {
    const response = await axios.post('/noc-cancellation/cancel', { srs });
    return response.data;
  } catch (error) {
    throw error;
  }
};
