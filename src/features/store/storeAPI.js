import api from '../../api/axios';

export const storeAPI = {
  getFacilityStockDrugWise: async (facilityId) => {
    const params = facilityId ? { facilityId } : {};
    const response = await api.get('/store/facility-stock-drug-wise', { params });
    return response.data;
  },
  getFacilityStockItemWise: async (facilityId) => {
    const params = facilityId ? { facilityId } : {};
    const response = await api.get('/store/facility-stock-item-wise', { params });
    return response.data;
  },
  getWarehouseStock: async (facilityId) => {
    const params = facilityId ? { facilityId } : {};
    const response = await api.get('/store/warehouse-stock', { params });
    return response.data;
  }
};
