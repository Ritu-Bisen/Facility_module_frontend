import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../api/axios';
import { getIndentsToOtherFacility } from '../api/indentToOtherFacilityApi';
import {
  PlusCircleIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function IndentToOtherFacilityPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [accYears, setAccYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); 

  const [indents, setIndents] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (facilityId) {
      loadFilters();
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId && selectedYear) {
      loadIndents();
    }
  }, [facilityId, selectedYear, statusFilter]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      // Reusing the same financial years endpoint
      const res = await api.get('/shc-inter-facility-transfers/fin-years');
      const mappedYears = (res.data.data || []).map(y => 
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y.id || y.ACCYRSETID, SHAccYear: y.year || y.AccYear }
      );
      setAccYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedYear(mappedYears[0].AccYrSetID);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadIndents = async () => {
    setLoadingData(true);
    try {
      const res = await getIndentsToOtherFacility(selectedYear, statusFilter);
      if (res.success) {
        setIndents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121418] transition-colors duration-500">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-[#121418] p-6 transition-colors duration-500">
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
              
              {/* Header Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <h1 className="text-2xl font-black text-indigo-700 tracking-tight">Indent To Other Facility</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage indents requested from other facilities.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 px-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fin. Year:</label>
                      <select 
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        disabled={loadingFilters}
                        className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 w-32 shadow-sm"
                      >
                        {accYears.map(yr => (
                          <option key={yr.AccYrSetID} value={yr.AccYrSetID}>{yr.SHAccYear}</option>
                        ))}
                      </select>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    <div className="flex items-center gap-2 px-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status:</label>
                      <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 w-32 shadow-sm"
                      >
                        <option value="All">All Records</option>
                        <option value="I">Incomplete</option>
                        <option value="C">Completed</option>
                      </select>
                    </div>

                    <div className="px-2">
                      <button
                        onClick={() => navigate('/indent-to-other-facility/add')}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
                      >
                        <PlusCircleIcon className="w-5 h-5" />
                        Add New Indent
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400">Loading indents...</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="px-5 py-3.5 text-center w-14">Sl. No.</th>
                          <th className="px-5 py-3.5 text-left">Facility Name</th>
                          <th className="px-5 py-3.5 text-center">Request No.</th>
                          <th className="px-5 py-3.5 text-center">Request Date</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                          <th className="px-5 py-3.5 text-center">Download Indent Request</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {indents.length === 0 ? (
                           <tr>
                             <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                               <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                               <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No data found</p>
                               <p className="text-xs mt-1">Select alternative filters.</p>
                             </td>
                           </tr>
                        ) : (
                          indents.map((indent, idx) => {
                            return (
                              <tr key={indent.NOCID} className="hover:bg-slate-50/50 align-middle">
                                <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-slate-800 text-xs">{indent.facilityname || '—'}</p>
                                </td>
                                <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{indent.NOCNumber || '—'}</td>
                                <td className="px-5 py-4 text-center text-xs text-slate-600">{indent.NOCDATE || '—'}</td>
                                <td className="px-5 py-4 text-center">
                                    {indent.StatusCode === 'I' || indent.StatusCode === 'IN' ? (
                                      <button 
                                        onClick={() => navigate(`/indent-to-other-facility/edit/${indent.NOCID}`)}
                                        className="text-amber-600 hover:text-amber-700 font-bold text-[11px] uppercase tracking-wider hover:underline"
                                      >
                                        Incomplete
                                      </button>
                                    ) : (
                                      <span className="text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                                        {indent.Status}
                                      </span>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  {indent.StatusCode === 'C' ? (
                                    <button 
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                                      onClick={() => window.open(`/indent-to-other-facility/print/${indent.NOCID}`, '_blank')}
                                    >
                                      <ArrowDownTrayIcon className="w-4 h-4" /> Download
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 italic text-[10px]">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
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
