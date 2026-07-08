import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';

export async function loginWithEmail(email, password) {
  const response = await api.post(ENDPOINTS.LOGIN_EMAIL, { email, password });
  return response.data;
}

export async function loginWithPhone(phoneNo, password) {
  const response = await api.post(ENDPOINTS.LOGIN_PHONE, { phoneNo, password });
  return response.data;
}