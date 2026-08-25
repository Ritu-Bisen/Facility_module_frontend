import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../features/auth/authSlice';

export default function Navbar() { 
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow-md px-4 md:px-6 py-3 flex justify-between items-center">
      <div className="text-xl font-bold text-gray-800">Facility Manager</div>
      
      {user && (
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1e3a6a] text-white flex items-center justify-center text-xs font-bold">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user.firstName} {user.lastName}
            </span>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}