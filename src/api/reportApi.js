import axios from './axios';

export const getHoldBatchesReport = async (itemTypeId = '0') => {
  try {
    const response = await axios.get('/reports/hold-batches', {
      params: { itemTypeId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getItemTypes = async () => {
  try {
    const response = await axios.get('/items/types');
    return response.data;
  } catch (error) {
    throw error;
  }
};
