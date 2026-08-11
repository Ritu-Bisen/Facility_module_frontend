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
