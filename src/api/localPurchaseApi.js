import axios from './axios';

export const getBudgets = async () => {
  try {
    const response = await axios.get('/local-purchase/budgets');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBudgetDetails = async (budgetId = '0') => {
  try {
    const response = await axios.get('/local-purchase/budget-details', {
      params: { budgetId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addBudgetDetail = async (data) => {
  try {
    const response = await axios.post('/local-purchase/budget-details', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSuppliers = async () => {
  try {
    const response = await axios.get('/local-purchase/suppliers');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSupplierById = async (id) => {
  try {
    const response = await axios.get(`/local-purchase/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSupplier = async (data) => {
  try {
    const response = await axios.post('/local-purchase/suppliers', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSupplier = async (id, data) => {
  try {
    const response = await axios.put(`/local-purchase/suppliers/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await axios.delete(`/local-purchase/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSupplyOrders = async (finYearId, status) => {
  try {
    const response = await axios.get('/local-purchase/supply-orders', {
      params: { finYearId, status }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSupplyOrderDetails = async (poNoId) => {
  try {
    const response = await axios.get(`/local-purchase/supply-orders/${poNoId}/pdf-details`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const generateSupplyOrderNo = async (finYearId) => {
  try {
    const response = await axios.get('/local-purchase/supply-orders/auto-number', {
      params: { finYearId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const saveSupplyOrderHeader = async (data) => {
  try {
    const response = await axios.post('/local-purchase/supply-orders', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSupplyOrderItems = async (poNoId) => {
  try {
    const response = await axios.get(`/local-purchase/supply-orders/${poNoId}/items`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addSupplyOrderItem = async (poNoId, data) => {
  try {
    const response = await axios.post(`/local-purchase/supply-orders/${poNoId}/items`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSupplyOrderItem = async (poNoId, itemId) => {
  try {
    const response = await axios.delete(`/local-purchase/supply-orders/${poNoId}/items/${itemId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSupplierReceipts = async (finYearId) => {
  try {
    const response = await axios.get('/local-purchase/supplier-receipts', {
      params: { finYearId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReceiptHeaderData = async (mode, id) => {
  const response = await axios.get('/local-purchase/receipts/header', { params: { mode, id } });
  return response.data;
};

export const saveReceiptHeader = async (data) => {
  const response = await axios.post('/local-purchase/receipts', data);
  return response.data;
};

export const getReceiptItems = async (receiptId, poNoId) => {
  const response = await axios.get('/local-purchase/receipts/items', { params: { receiptId, poNoId } });
  return response.data;
};

export const saveReceiptItems = async (receiptId, items) => {
  const response = await axios.post(`/local-purchase/receipts/${receiptId}/items`, { items });
  return response.data;
};

export const getReceiptBatches = async (receiptId) => {
  const response = await axios.get(`/local-purchase/receipts/${receiptId}/batches`);
  return response.data;
};

export const saveReceiptBatch = async (receiptId, batchData) => {
  const response = await axios.post(`/local-purchase/receipts/${receiptId}/batches`, batchData);
  return response.data;
};

export const deleteReceiptBatch = async (inwNo) => {
  const response = await axios.delete(`/local-purchase/receipts/batches/${inwNo}`);
  return response.data;
};

export const completeReceipt = async (receiptId) => {
  const response = await axios.post(`/local-purchase/receipts/${receiptId}/complete`);
  return response.data;
};
