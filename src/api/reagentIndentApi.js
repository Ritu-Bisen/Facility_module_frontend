import api from './axios';

/**
 * Fetch Medical Colleges list for dropdown
 */
export const getMedicalColleges = async () => {
  const response = await api.get('/reagent-indent/medical-colleges');
  return response.data;
};

/**
 * Fetch Proprietary Reagent Freeze RC Details (EquipVsRC_Map)
 */
export const getFreezRcDetails = async (medicalCollegeId) => {
  const response = await api.get('/reagent-indent/freez-rc-details', {
    params: { medicalCollegeId }
  });
  return response.data;
};

/**
 * Fetch Reagent Indents to Warehouse
 */
export const getReagentWarehouseIndents = async (finYear, statusFilter) => {
  const response = await api.get('/reagent-indent/warehouse-indent', {
    params: { finYear, statusFilter }
  });
  return response.data;
};

/**
 * Check if incomplete reagent indent exists for facility
 */
export const checkIncompleteIndent = async () => {
  const response = await api.get('/reagent-indent/check-incomplete');
  return response.data;
};

/**
 * Generate Header / Create Master Indent
 */
export const generateIndentHeader = async (accYrSetId, finYear) => {
  const response = await api.post('/reagent-indent/generate-header', { accYrSetId, finYear });
  return response.data;
};

/**
 * Fetch facility equipment dropdown (FillEqpPrpDdl)
 */
export const getFacilityEquipments = async () => {
  const response = await api.get('/reagent-indent/facility-equipments');
  return response.data;
};

/**
 * Fetch Make Models dropdown (FillMakeModel)
 */
export const getMakeModels = async (pmachineId, indentId) => {
  const response = await api.get('/reagent-indent/make-models', {
    params: { pmachineId, indentId }
  });
  return response.data;
};

/**
 * Save equipment (btnSaveEqp_Click)
 */
export const saveEquipment = async (equipmentData) => {
  const response = await api.post('/reagent-indent/save-equipment', equipmentData);
  return response.data;
};

/**
 * Fetch Equipment Wise Reagent Items (PopulateData & FillAIValue)
 */
export const getReagentItems = async (indentId, pmachineId, accYrSetId) => {
  const response = await api.get('/reagent-indent/items', {
    params: { indentId, pmachineId, accYrSetId }
  });
  return response.data;
};

/**
 * Save / update equipment wise reagent items (btnBufferStockpush_Click)
 */
export const saveReagentItemsApi = async (saveData) => {
  const response = await api.post('/reagent-indent/save-items', saveData);
  return response.data;
};

/**
 * Send OTP (lnkSentOtp_Click)
 */
export const sendOtpApi = async (mobileNo, email) => {
  const response = await api.post('/reagent-indent/send-otp', { mobileNo, email });
  return response.data;
};

/**
 * Freeze and finalize indent (btnFreez_Click)
 */
export const freezeIndentApi = async (freezeData) => {
  const response = await api.post('/reagent-indent/freeze', freezeData);
  return response.data;
};

/**
 * Delete indent (btndelete_Click)
 */
export const deleteIndentApi = async (indentId) => {
  const response = await api.delete(`/reagent-indent/delete/${indentId}`);
  return response.data;
};
