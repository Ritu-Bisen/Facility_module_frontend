import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function FacilityWardsPage() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ WardID: '', WardCode: '', WardName: '', IsOPDEntry: false, Password: '' });
  
  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [debouncedSearchId, setDebouncedSearchId] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchId(searchId);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchId]);

  // Fetch when page or debounced search changes
  useEffect(() => {
    fetchWards(page, debouncedSearchId, page > 1);
  }, [page, debouncedSearchId]);

  // Reset page when search changes
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [debouncedSearchId]);

  const fetchWards = async (currentPage, currentSearch, isAppend) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/facility-wards`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 20, searchId: currentSearch || '' }
      });
      
      const newData = response.data;
      if (newData.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isAppend) {
        setWards(prev => [...prev, ...newData]);
      } else {
        setWards(newData);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      toast.error('Failed to load facility wards');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 10;
    if (bottom && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({ WardID: '', WardCode: '', WardName: '', IsOPDEntry: false, Password: '' });
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ward) => {
    setFormData({ WardID: ward.WardID, WardCode: ward.WardCode, WardName: ward.WardName, IsOPDEntry: ward.IsOPDEntry === 'YES', Password: '' });
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ WardID: '', WardCode: '', WardName: '', IsOPDEntry: false, Password: '' });
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = formData.WardCode.trim();
    const cleanName = formData.WardName.trim();

    if (!cleanCode || !cleanName) {
      toast.error('Ward Code and Ward Name are required');
      return;
    }

    const scriptRegex = /<[^>]*>|on\w+=|javascript:/i;
    if (scriptRegex.test(cleanCode) || scriptRegex.test(cleanName)) {
      toast.error('Ward Code or Ward Name contains invalid HTML/script tags');
      return;
    }

    const codePattern = /^[a-zA-Z0-9_\-\/\s]+$/;
    if (!codePattern.test(cleanCode)) {
      toast.error('Ward Code contains invalid characters');
      return;
    }

    const namePattern = /^[a-zA-Z0-9\s._\-\/\(\),&]+$/;
    if (!namePattern.test(cleanName)) {
      toast.error('Ward Name contains invalid characters or script payload');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { ...formData, WardCode: cleanCode, WardName: cleanName };

      if (editMode) {
        await axios.put(`${import.meta.env.VITE_API_URL}/facility-wards/${formData.WardID}`, payload, config);
        toast.success('Updated Successfully');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/facility-wards`, payload, config);
        toast.success('Added Successfully');
      }
      setIsModalOpen(false);
      setPage(1);
      fetchWards(1, debouncedSearchId, false);
    } catch (error) {
      console.error('Error saving ward:', error);
      toast.error(error.response?.data?.message || 'Failed to save ward');
    }
  };

  const handleDelete = async (wardId) => {
    if (!window.confirm('Are you sure you want to delete?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/facility-wards/${wardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted Successfully');
      setPage(1);
      fetchWards(1, debouncedSearchId, false);
    } catch (error) {
      console.error('Error deleting ward:', error);
      toast.error(error.response?.data?.message || 'Failed to delete ward');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Facility Wards</h1>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Ward ID..."
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    className="flex shrink-0 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add New Ward
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="overflow-x-auto overflow-y-auto flex-1" onScroll={handleScroll} style={{ overflowAnchor: 'none' }}>
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                      <tr className="border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold w-24 text-center">ID</th>
                        <th className="p-4 font-semibold">Ward Code</th>
                        <th className="p-4 font-semibold">Ward Name</th>
                        <th className="p-4 font-semibold text-center">IS OPD Entry</th>
                        <th className="p-4 font-semibold text-center">Password</th>
                        <th className="p-4 font-semibold w-32 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {wards.map((ward, index) => (
                        <tr key={`${ward.WardID}-${index}`} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center text-slate-600 font-medium">
                            {ward.WardID}
                          </td>
                          <td className="p-4 text-slate-800 font-medium">{ward.WardCode}</td>
                          <td className="p-4 text-slate-600">{ward.WardName}</td>
                          <td className="p-4 text-center text-slate-600">{ward.IsOPDEntry || 'NO'}</td>
                          <td className="p-4 text-center">
                            <span className="text-slate-500 hover:text-slate-800 cursor-pointer">Password</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleOpenEditModal(ward)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(ward.WardID)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {loading && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">
                            Loading...
                          </td>
                        </tr>
                      )}
                      {!loading && wards.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">
                            No wards found.
                          </td>
                        </tr>
                      )}
                      {!loading && wards.length > 0 && !hasMore && (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-400 text-sm">
                            End of list
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {editMode ? 'Edit Facility Ward' : 'Add Facility Ward'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ward Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="WardCode"
                  value={formData.WardCode}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter ward code"
                  maxLength="50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ward Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="WardName"
                  value={formData.WardName}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter ward name"
                  maxLength="150"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="Password"
                  value={formData.Password}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={editMode ? "Leave blank to keep current password" : "Enter password"}
                  maxLength="50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="IsOPDEntry"
                  name="IsOPDEntry"
                  checked={formData.IsOPDEntry}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="IsOPDEntry" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  IS OPD Entry
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
