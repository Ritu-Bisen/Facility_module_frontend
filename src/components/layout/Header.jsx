import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../features/auth/authSlice';
import ChangePasswordModal from './ChangePasswordModal';

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      <header className="relative z-50 flex-shrink-0 transition-colors duration-500">
      <nav className="bg-[#0f172a] dark:bg-[#0b0f19] px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
        {/* Left: CG Govt Logo + Title */}
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <div className="flex-shrink-0 bg-white/10 rounded-xl p-1.5 border border-white/15 backdrop-blur-sm">
            <img src="/cg-govt.png" alt="Chhattisgarh Government Logo" className="h-10 md:h-12 w-auto object-contain drop-shadow-md" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl lg:text-2xl font-bold text-white leading-tight tracking-wide">
              Drug Distribution & Management Information System
            </h1>
            <p className="text-[10px] md:text-xs font-medium text-blue-200/60 mt-0.5 tracking-wide hidden sm:block">
              Chhattisgarh Medical Services Corporation Limited, Government of Chhattisgarh
            </p>
          </div>
        </div>

        {/* Right: Logout, Dark Mode, CGMSC Logo */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">

          {/* Logout & Change Password */}
          {user && (
            <div className="flex flex-col gap-1 items-end mr-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium text-red-300 hover:bg-white/10 hover:text-red-400 transition-colors duration-200 w-full justify-end"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-blue-300 hover:bg-white/10 hover:text-blue-400 transition-colors duration-200"
              >
                Change Password
              </button>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-white/15"></div>

          <div className="flex-shrink-0 bg-white rounded-xl p-1.5 shadow-md">
            <img src="/cgmsc-logo.png" alt="CGMSC Logo" className="h-10 md:h-12 w-auto object-contain" />
          </div>
        </div>
      </nav>
    </header>
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </>
  );
}
