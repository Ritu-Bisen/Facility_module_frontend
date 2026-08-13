import axios from './axios';

export const getContracts = async (finYear) => {
  try {
    const response = await axios.get('/contracts', {
      params: { finYear }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTenders = async () => {
  try {
    const response = await axios.get('/contracts/tenders');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFinYears = async () => {
  try {
    const response = await axios.get('/contracts/fin-years');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTendersList = async (finYearId) => {
  try {
    const response = await axios.get(`/contracts/tenders/list?finYearId=${finYearId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLocalItems = async () => {
  try {
    const response = await axios.get(`/contracts/local-items`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWardIssueAccYears = async () => {
  try {
    const response = await axios.get('/ward-issue/acc-years');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createTender = async (data) => {
  try {
    const response = await axios.post('/contracts/tenders', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTender = async (tenderId, data) => {
  try {
    const response = await axios.put(`/contracts/tenders/${tenderId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getContractsForSO = async (finYearId, lpSupplierId) => {
  try {
    const response = await axios.get('/contracts/supply-order', {
      params: { accyrsetid: finYearId, lpsupplierid: lpSupplierId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTender = async (tenderId) => {
  try {
    const response = await axios.delete(`/contracts/tenders/${tenderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createContract = async (data) => {
  try {
    const response = await axios.post('/contracts', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getContractById = async (id) => {
  try {
    const response = await axios.get(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateContract = async (contractId, data) => {
  try {
    const response = await axios.put(`/contracts/${contractId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeContract = async (contractId) => {
  try {
    const response = await axios.put(`/contracts/${contractId}/complete`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const initiateAmendment = async (contractId) => {
  try {
    const response = await axios.put(`/contracts/${contractId}/amend`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getContractItems = async (contractId) => {
  try {
    const response = await axios.get(`/contracts/${contractId}/items`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addContractItem = async (contractId, data) => {
  try {
    const response = await axios.post(`/contracts/${contractId}/items`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateContractItem = async (itemId, data) => {
  try {
    const response = await axios.put(`/contracts/items/${itemId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteContractItem = async (itemId) => {
  try {
    const response = await axios.delete(`/contracts/items/${itemId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
