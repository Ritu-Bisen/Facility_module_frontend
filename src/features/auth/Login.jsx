import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, fetchUserMenus } from './authSlice';
import { loginWithEmail, loginWithPhone, fetchCaptcha, verifyMfaApi } from './authAPI';
import Header from '../../components/layout/Header';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ identifier: false, password: false });

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // MFA State (CWE-308 / Vulnerability Point No. 20)
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaTempToken, setMfaTempToken] = useState('');
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    if (!mfaOtp.trim()) {
      setMfaError('Please enter the 6-digit OTP.');
      return;
    }
    setMfaLoading(true);
    try {
      const res = await verifyMfaApi(mfaTempToken, mfaOtp.trim());
      if (res.success) {
        dispatch(setCredentials({
          data: res.data,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        }));
        await dispatch(fetchUserMenus()).unwrap();
        setShowMfaModal(false);
        navigate('/dashboard', { state: { showWelcome: true } });
      } else {
        setMfaError(res.message || 'MFA verification failed.');
      }
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setMfaLoading(false);
    }
  };

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaError(false);
    try {
      const res = await fetchCaptcha();
      if (res && res.success) {
        setCaptchaData(res.data);
      } else {
        setCaptchaError(true);
      }
    } catch (err) {
      console.error('Failed to load captcha', err);
      setCaptchaError(true);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your User ID or Phone Number.');
      return;
    }

    // Input Sanitization & Vulnerability 23 Check (CWE-20)
    const scriptRegex = /<[^>]*>|on\w+=|javascript:/i;
    if (scriptRegex.test(cleanId)) {
      setError('Invalid characters or script payload detected in User ID / Phone field.');
      return;
    }

    const allowedIdPattern = /^[a-zA-Z0-9@._\-\+\s]+$/;
    if (!allowedIdPattern.test(cleanId)) {
      setError('User ID / Phone field contains disallowed characters.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password or OTP.');
      return;
    }
    if (!captchaValue.trim()) {
      setError('Please enter the CAPTCHA code.');
      return;
    }

    setIsLoading(true);

    try {
      let response;
      const isPhone = /^\d+$/.test(identifier.trim());
      if (isPhone) {
        response = await loginWithPhone(identifier.trim(), password, captchaValue, captchaData?.token);
      } else {
        response = await loginWithEmail(identifier.trim(), password, captchaValue, captchaData?.token);
      }

      if (response.success) {
        if (response.mfaRequired) {
          setMfaTempToken(response.tempToken);
          setShowMfaModal(true);
        } else {
          // Store credentials in Redux + localStorage
          dispatch(setCredentials({
            data: response.data,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          }));
          
          // Fetch menus right after login
          await dispatch(fetchUserMenus()).unwrap();

          // Navigate to dashboard with welcome popup state
          navigate('/dashboard', { state: { showWelcome: true } });
        }
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      if (err.response) {
        // Server responded with an error
        setError(err.response.data?.message || 'Invalid credentials. Please try again.');
      } else if (err.request) {
        setError('Unable to connect to the server. Please check your connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      // Refresh captcha on failure
      setCaptchaValue('');
      loadCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500 bg-[#f0f4f8] dark:bg-[#121418]">
      
      {/* ─── Top Navbar ─── */}
      <Header />

      {/* ─── Main Content: Split Layout ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ─── Left: Hero Panel ─── */}
        <div className="relative lg:flex-1 h-[180px] md:h-[220px] lg:h-full flex-shrink-0 overflow-hidden">
          {/* Hero Image */}
          <img 
          src={`${import.meta.env.BASE_URL}drug-hero.png`}           
            alt="Pharmaceutical medicines and drugs" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a6a]/70 via-[#1e3a6a]/40 to-transparent dark:from-[#0a1628]/80 dark:via-[#0a1628]/50 dark:to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#15803d]/40 via-transparent to-transparent"></div>
          
          {/* Decorative Swoosh */}
          <div className="absolute bottom-0 left-0 right-0 z-10 lg:hidden">
            <svg className="w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
              <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H0Z" className="fill-[#f0f4f8] dark:fill-[#121418]" />
            </svg>
          </div>

          {/* Right edge fade for desktop */}
          <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-[#f0f4f8] dark:from-[#121418] to-transparent z-10"></div>

          {/* Hero Text Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-12 lg:px-16">
            <div className="max-w-lg">
              {/* Small badge */}
              {/* <div className="hidden lg:flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 w-fit mb-5 border border-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-white/90 text-xs font-medium tracking-wide uppercase">Facility Management Portal</span>
              </div> */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
                Drug <br className="hidden lg:block" />
                <span className="text-emerald-300">Distribution</span> <br className="hidden lg:block" />
                Management
              </h2>
              <p className="hidden lg:block mt-4 text-white/70 text-base lg:text-lg leading-relaxed max-w-md">
                Streamlined pharmaceutical tracking and distribution for healthcare facilities across Chhattisgarh.
              </p>
              {/* Stats row */}
              <div className="hidden lg:flex items-center gap-8 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">1200+</div>
                  <div className="text-xs text-white/60 mt-0.5">Facilities</div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">1100+</div>
                  <div className="text-xs text-white/60 mt-0.5">Drugs Tracked</div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-xs text-white/60 mt-0.5">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right: Login Form Panel ─── */}
        <div className="flex-1 lg:max-w-[520px] xl:max-w-[560px] flex items-start lg:items-center justify-center px-4 py-6 lg:py-0 lg:px-8 xl:px-12 overflow-y-auto">
          <div className="w-full max-w-md">
            
            {/* Form Card */}
            <div className="bg-white dark:bg-[#1a1d24] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/30 overflow-hidden border border-gray-100 dark:border-gray-800/60 transition-colors duration-500">
              
              {/* Form Header */}
              <div className="relative bg-gradient-to-br from-[#1e3a6a] via-[#274d8e] to-[#1e3a6a] dark:from-[#162d52] dark:via-[#1b3868] dark:to-[#162d52] py-6 px-6 text-center text-white overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-8 -left-8 w-28 h-28 bg-white/5 rounded-full"></div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full"></div>
                <div className="absolute top-4 right-12 w-3 h-3 bg-emerald-400/30 rounded-full"></div>
                
                <div className="relative z-10">
                  <div className=" mx-auto mb-3   flex items-center justify-center ">
                                <img src={`${import.meta.env.BASE_URL}cgmsc-logo.png`} alt="CGMSC Logo" className="h-14 md:h-16 w-auto object-contain" />
            
                      {/* <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg> */}
                  </div>
                  <h3 className="text-xl font-bold tracking-wide">Welcome to Health Facility Main Store</h3>
                  <p className="text-blue-200/70 text-sm mt-1.5">Sign in to access your dashboard</p>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  
                  {/* Email / Phone Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      User Id / Phone No <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.identifier ? 'text-[#1e3a6a] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter User Id / Phone Number" 
                        onFocus={() => setIsFocused(f => ({ ...f, identifier: true }))}
                        onBlur={() => setIsFocused(f => ({ ...f, identifier: false }))}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333640] focus:ring-4 focus:ring-[#1e3a6a]/10 dark:focus:ring-blue-500/15 focus:border-[#1e3a6a] dark:focus:border-blue-500 transition-all duration-200 outline-none text-gray-700 dark:text-gray-100 bg-gray-50/60 dark:bg-[#252830] focus:bg-white dark:focus:bg-[#2a2d35] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Password / OTP <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused.password ? 'text-[#1e3a6a] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password or OTP" 
                        onFocus={() => setIsFocused(f => ({ ...f, password: true }))}
                        onBlur={() => setIsFocused(f => ({ ...f, password: false }))}
                        className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333640] focus:ring-4 focus:ring-[#1e3a6a]/10 dark:focus:ring-blue-500/15 focus:border-[#1e3a6a] dark:focus:border-blue-500 transition-all duration-200 outline-none text-gray-700 dark:text-gray-100 bg-gray-50/60 dark:bg-[#252830] focus:bg-white dark:focus:bg-[#2a2d35] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-[#1e3a6a] dark:hover:text-blue-400 focus:outline-none transition-colors duration-200"
                      >
                        {showPassword ? (
                           <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                           <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 012.35-3.656m1.504-1.504A9.92 9.92 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.39 2.87m-1.506 1.507A3 3 0 1110.125 9.125m3.75 3.75L9 9" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CAPTCHA */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Security Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={captchaValue}
                          onChange={(e) => setCaptchaValue(e.target.value)}
                          placeholder="Enter code" 
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333640] focus:ring-4 focus:ring-[#1e3a6a]/10 dark:focus:ring-blue-500/15 focus:border-[#1e3a6a] dark:focus:border-blue-500 transition-all duration-200 outline-none text-gray-700 dark:text-gray-100 bg-gray-50/60 dark:bg-[#252830] focus:bg-white dark:focus:bg-[#2a2d35] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
                        />
                      </div>
                      <div className="flex-shrink-0 h-[48px] w-[150px] bg-white rounded-xl border-2 border-gray-200 dark:border-[#333640] overflow-hidden flex items-center justify-center relative cursor-pointer select-none" onClick={loadCaptcha} title="Click to refresh CAPTCHA">
                        {captchaLoading ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <svg className="animate-spin h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading...</span>
                          </div>
                        ) : captchaError ? (
                          <div className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1">
                            <span>Failed. Retry</span>
                          </div>
                        ) : captchaData?.image ? (
                          <div dangerouslySetInnerHTML={{ __html: captchaData.image }} className="w-full h-full flex items-center justify-center scale-105" />
                        ) : (
                          <div className="text-xs text-gray-400">Click to load</div>
                        )}
                        <div className="absolute top-0 right-0 bottom-0 px-2 bg-gray-50/80 flex items-center justify-center border-l border-gray-100 opacity-0 hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Links */}
                  <div className="flex items-center justify-between -mt-1">
                    <button type="button" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200">
                      Generate OTP
                    </button>
                    <a href="#" className="text-xs font-medium text-[#1e3a6a] dark:text-blue-400 hover:text-[#2d5299] dark:hover:text-blue-300 hover:underline transition-colors duration-200">
                      Forgot your password?
                    </a>
                  </div>

                  {/* Login Button */}
                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className={`w-full bg-gradient-to-r from-[#1e3a6a] to-[#2d5299] dark:from-blue-600 dark:to-blue-700 hover:from-[#162d52] hover:to-[#1e3a6a] dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-[#1e3a6a]/20 hover:shadow-xl hover:shadow-[#1e3a6a]/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md flex items-center justify-center gap-2.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Login
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </form>
            </div>

            {/* Footer note below card */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-5 transition-colors">
              Powered by <span className="font-semibold text-gray-500 dark:text-gray-400">CGMSC</span> • Government of Chhattisgarh
            </p>
          </div>
        </div>
      </div>

      {/* ─── MFA Verification Modal (CWE-308 / Vulnerability Point No. 20) ─── */}
      {showMfaModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="bg-gradient-to-r from-[#1e3a6a] to-[#274d8e] p-6 text-white text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
              <p className="text-blue-100 text-xs mt-1">Enter the 6-digit OTP sent to your registered mobile/email</p>
            </div>

            <form onSubmit={handleVerifyMfa} className="p-6 space-y-4">
              {mfaError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800/40">
                  {mfaError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  One-Time Password (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaOtp}
                  onChange={(e) => setMfaOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center tracking-[0.5em] text-lg font-bold py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-[#252830] dark:text-white focus:border-[#1e3a6a] outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMfaModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl text-sm hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mfaLoading}
                  className="flex-1 py-3 px-4 bg-[#1e3a6a] hover:bg-[#274d8e] text-white font-semibold rounded-xl text-sm transition shadow-md disabled:opacity-50"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  ) 
}