import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import {
  PlusIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

export default function MonthlyIndentPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Dropdown options
  const [accYears, setAccYears] = useState([]);
  
  // Selected Filters
  const [statusFilter, setStatusFilter] = useState('Incomplete'); // 'All', 'Incomplete', 'Complete'
  const [selectedYear, setSelectedYear] = useState('');

  // Data
  const [indents, setIndents] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (facilityId) {
      loadFilters();
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId) {
      loadIndents();
    }
  }, [facilityId, statusFilter, selectedYear]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const res = await api.get('/ward-issue/acc-years');
      const mappedYears = (res.data || []).map(y => 
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y.ACCYRSETID || y.accYrSetId, SHAccYear: y.SHACCYEAR || y.shAccYear }
      );
      setAccYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedYear(mappedYears[0].AccYrSetID);
      }
    } catch (e) {
      console.error('Failed to load filter options:', e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadIndents = async () => {
    if (!selectedYear) return;
    setLoadingData(true);
    try {
      const res = await api.get(`/monthly-indent/list`, {
        params: {
          accYrSetId: selectedYear,
          status: statusFilter
        }
      });
      setIndents(res.data || []);
    } catch (e) {
      console.error('Failed to load indents:', e);
      setIndents([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddClick = () => {
    navigate('/indent/warehouse/add');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Indent to Warehouse</h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Manage and view indent to warehouse</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  {/* Status filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-32"
                    >
                      <option value="All">All</option>
                      <option value="Incomplete">Incomplete</option>
                      <option value="Complete">Complete</option>
                    </select>
                  </div>

                  {/* Year filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={loadingFilters}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    >
                      <option value="">Select Year</option>
                      {accYears.map(y => (
                        <option key={y.AccYrSetID} value={y.AccYrSetID}>{y.SHAccYear}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddClick}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                    Add
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400">Loading data from database…</p>
                </div>
              ) : (
                /* ── Monthly Indent Table ── */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center w-14">Sl. No.</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Request No.</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Request Date</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Status</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Download NOC</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Download Indent to Warehouse</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {indents.map((indent, idx) => (
                          <tr key={indent.NOCID || idx} className="hover:bg-slate-50/50 align-middle">
                            <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{indent.NOCNUMBER || indent.nocNumber}</td>
                            <td className="px-5 py-4 text-center text-xs text-slate-600">{indent.NOCDATE || indent.nocDate}</td>
                            <td className="px-5 py-4 text-center">
                              {(indent.STATUS === 'Completed' || indent.status === 'Completed') ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-pulse">
                                  {indent.STATUS || indent.status || 'Incomplete'}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {indent.nocAvailable ? (
                                <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm hover:shadow mx-auto">
                                  Download
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm hover:shadow mx-auto">
                                Download
                              </button>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {(indent.STATUS === 'Incomplete' || indent.status === 'Incomplete' || indent.STATUS === 'I') && (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => navigate(`/indent/warehouse/add?nocId=${indent.NOCID || indent.id}`)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-sm hover:shadow"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              {(indent.STATUS === 'Completed' || indent.status === 'Completed' || indent.STATUS === 'C') && (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => navigate(`/indent/warehouse/print/${indent.NOCID || indent.id}`)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-sm hover:shadow"
                                    title="Download Indent PDF"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {indents.length === 0 && (
                          <tr>
                            <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                               <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                               <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No records found</p>
                               <p className="text-xs mt-1">Select alternative filters or click 'Add' to create one.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
