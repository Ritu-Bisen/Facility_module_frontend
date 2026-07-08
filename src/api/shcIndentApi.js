import axios from './axios';

export const getShcIndents = async (facilityId, accYrSetId, status) => {
    try {
        const response = await axios.get(`/shc-indent-approvals`, {
            params: {
                facilityId,
                accYrSetId,
                status
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching SHC indent approvals:', error);
        throw error;
    }
};

export const getFinancialYears = async () => {
    try {
        const response = await axios.get(`/warehouse-receipt/fin-years`);
        return response.data;
    } catch (error) {
        console.error('Error fetching financial years:', error);
        throw error;
    }
};
