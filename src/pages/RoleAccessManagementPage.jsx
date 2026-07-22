import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';



export default function RoleAccessManagementPage() {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [modules, setModules] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFacilityTypes = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/facility-access/types`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setFacilityTypes(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load facility types', err);
      }
    };
    loadFacilityTypes();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchPermissions(selectedFacility);
    } else {
      setModules([]);
    }
  }, [selectedFacility]);

  const fetchPermissions = async (facilityType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/facility-access/${facilityType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setModules(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load permissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (moduleIndex, screenIndex, field) => {
    const updatedModules = [...modules];
    const screen = updatedModules[moduleIndex].screens[screenIndex];
    screen[field] = !screen[field];
    setModules(updatedModules);
  };

  const handleSave = async () => {
    if (!selectedFacility) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/facility-access/save`, {
        facilityType: selectedFacility,
        modules: modules
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Permissions saved successfully!');
        // Reset the page to default empty state
        setSelectedFacility('');
        setModules([]);
      }
    } catch (err) {
      toast.error('Failed to save permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Role Access Management</h1>
                  <p className="text-sm text-slate-500 mt-1">Manage access based on Facility Type for newly developed screens.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full sm:w-64 p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                  >
                    <option value="">-- Select Facility Type --</option>
                    {facilityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleSave}
                    disabled={!selectedFacility || saving || loading}
                    className="px-6 py-2.5 bg-[#1e3a6a] hover:bg-[#2d5299] text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a6a]"></div>
                </div>
              ) : selectedFacility ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-4 font-semibold text-slate-700 w-2/3">Screen Name</th>
                          <th className="p-4 font-semibold text-slate-700 text-center">Assign Access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {modules.length === 0 ? (
                          <tr>
                            <td colSpan="2" className="p-8 text-center text-slate-500">
                              No modules or screens found.
                            </td>
                          </tr>
                        ) : (
                          modules.map((module, mIndex) => (
                            <React.Fragment key={module.moduleId}>
                              {/* Module Header Row */}
                              <tr className="bg-slate-100/50">
                                <td colSpan="2" className="px-4 py-3 font-bold text-slate-800 text-sm">
                                  {module.moduleName}
                                </td>
                              </tr>
                              {/* Screen Rows */}
                              {module.screens.map((screen, sIndex) => (
                                <tr key={screen.screenId} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 pl-8 text-slate-600 font-medium text-sm">
                                    {screen.screenName}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <input 
                                      type="checkbox" 
                                      checked={screen.canView}
                                      onChange={() => handleCheckboxChange(mIndex, sIndex, 'canView')}
                                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-800">No Facility Type Selected</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto">Please select a facility type from the dropdown above to view and manage its screen access permissions.</p>
                </div>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
