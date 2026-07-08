import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { useSelector } from 'react-redux';

export default function AddWardIssueModal({ isOpen, onClose, onAdd }) {
  const user = useSelector((state) => state.auth.user);
  const facilityId = user?.facilityId;

  const [formData, setFormData] = useState({
    ward: '',
    reqDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    reqBy: ''
  });

  const [wards, setWards] = useState([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ward: '',
        reqDate: '',
        issueDate: new Date().toISOString().split('T')[0],
        reqBy: ''
      });
      fetchWards();
    }
  }, [isOpen]);

  const fetchWards = async () => {
    setIsLoadingWards(true);
    try {
      const response = await api.get(`/ward-issue/wards?facilityId=${facilityId}`);
      setWards(response.data || []);
    } catch (error) {
      console.error('Failed to fetch wards:', error);
    } finally {
      setIsLoadingWards(false);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.get(`/ward-issue/generate-issue-no?facilityId=${facilityId}`);
      const issueNo = response.data.issueNo;
      
      onAdd({
        ward: formData.ward,
        issueDate: formatDateToDDMMYYYY(formData.issueDate),
        reqDate: formatDateToDDMMYYYY(formData.reqDate),
        reqBy: formData.reqBy,
        issueNo: issueNo
      });
      onClose();
    } catch (error) {
      console.error('Failed to generate issue no:', error);
      alert('Failed to generate issue number. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const isUpdateEnabled = formData.reqBy.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all sm:my-8 scale-100">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-wide">Add New Ward Issue</h2>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors focus:outline-none"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Ward Name</label>
            <select 
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              disabled={isLoadingWards}
              className="w-full border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
            >
              <option value="">{isLoadingWards ? 'Loading wards...' : 'Select a Ward'}</option>
              {wards.map((w, index) => {
                const wardId = Array.isArray(w) ? w[0] : w.WARDID;
                const wardName = Array.isArray(w) ? w[1] : w.WARDNAME;
                return (
                  <option key={wardId || index} value={wardName}>
                    {wardName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Requested Date</label>
              <input 
                type="date" 
                name="reqDate"
                value={formData.reqDate}
                onChange={handleChange}
                className="w-full border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm text-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Issue Date</label>
              <input 
                type="date" 
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                className="w-full border-gray-200 bg-gray-100 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed focus:outline-none text-sm"
                readOnly
                title="Defaults to today"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">Requested By</label>
            <input 
              type="text" 
              name="reqBy"
              value={formData.reqBy}
              onChange={handleChange}
              className="w-full border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              placeholder="Enter Requester Name"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate}
            disabled={!isUpdateEnabled || isGenerating}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              ${isUpdateEnabled && !isGenerating
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-md hover:-translate-y-0.5' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {isGenerating ? 'Generating...' : 'Generate Issue No'}
          </button>
        </div>

      </div>
    </div>
  );
}
