import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';

export async function loginWithEmail(email, password, captchaValue, captchaToken) {
  const response = await api.post(ENDPOINTS.LOGIN_EMAIL, { email, password, captchaValue, captchaToken });
  return response.data;
}

export async function loginWithPhone(phoneNo, password, captchaValue, captchaToken) {
  const response = await api.post(ENDPOINTS.LOGIN_PHONE, { phoneNo, password, captchaValue, captchaToken });
  return response.data;
}

export async function fetchCaptcha() {
  const response = await api.get('/auth/captcha');
  return response.data;
}