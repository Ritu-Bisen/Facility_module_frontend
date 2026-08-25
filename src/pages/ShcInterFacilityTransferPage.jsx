import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { generateWardIssuePDF } from '../utils/wardIssuePdfGenerator';
import {
  PlusCircleIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';

export default function ShcInterFacilityTransferPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Filters
  const [accYears, setAccYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Incomplete', 'Completed'

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
    if (facilityId && selectedYear) {
      loadIndents();
    }
  }, [facilityId, selectedYear, statusFilter]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const res = await api.get('/shc-inter-facility-transfers/fin-years');
      const mappedYears = (res.data.data || []).map(y => 
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y.id || y.ACCYRSETID, SHAccYear: y.year || y.AccYear }
      );
      setAccYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedYear(mappedYears[0].AccYrSetID);
      }
    } catch (e) {
      console.error('Failed to load financial years:', e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadIndents = async () => {
    setLoadingData(true);
    try {
      const res = await api.get('/shc-inter-facility-transfers', {
        params: {
          accYrSetId: selectedYear,
          status: statusFilter
        }
      });
      setIndents(res.data.data || []);
    } catch (e) {
      console.error('Failed to load SHC transfers:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleIssueIndent = (indent) => {
    navigate(`/inter-facility-shc-transfer/add/${indent.NOCID}`);
  };

  const handleEditIssue = (indent) => {
    if (!indent.NOCID || indent.NOCID === 0) {
      localStorage.setItem('currentInFacIssueId', indent.issueid);
      localStorage.setItem('currentInFacIssueNo', indent.ISSUENO);
      localStorage.setItem('currentInFacIssueHeaderSaved', 'true');
      navigate('/inter-facility-shc-transfer/direct-add');
    } else {
      navigate(`/inter-facility-shc-transfer/edit/${indent.issueid}?nocId=${indent.NOCID}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header Title Banner */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">SHC Inter Facility Transfer</h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Issue and Transfer items to SHC facilities against online indents</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fin. Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={loadingFilters}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    >
                      {accYears.map(y => (
                        <option key={y.AccYrSetID} value={y.AccYrSetID}>{y.SHAccYear}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    >
                      <option value="All">All Records</option>
                      <option value="Incomplete">Incomplete</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('currentInFacIssueNo');
                      localStorage.removeItem('currentInFacIssueId');
                      localStorage.removeItem('currentInFacIssueHeaderSaved');
                      navigate('/inter-facility-shc-transfer/direct-add');
                    }}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <PlusCircleIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                    Add Indent
                  </button>
                </div>
              </div>

              {/* Table wrapper */}
              {(loadingData || loadingFilters) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400">Loading data from database…</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="px-5 py-3.5 text-center w-14">Sl.</th>
                          <th className="px-5 py-3.5 text-left">Facility</th>
                          <th className="px-5 py-3.5 text-center">Indent No</th>
                          <th className="px-5 py-3.5 text-center">Indent Date</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                          <th className="px-5 py-3.5 text-center w-[40%]">Issue Details</th>
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
                            const hasIssue = indent.issueid && indent.issueid !== 0;
                            return (
                              <tr key={`${indent.NOCID}-${indent.issueid}-${idx}`} className="hover:bg-slate-50/50 align-top">
                                <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-slate-800 text-xs">{indent.facilityname || '—'}</p>
                                </td>
                                <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{indent.NOCNumber || '—'}</td>
                                <td className="px-5 py-4 text-center text-xs text-slate-600">{indent.NOCDATE || '—'}</td>
                                <td className="px-5 py-4 text-center">
                                  {!hasIssue ? (
                                    <button
                                      onClick={() => handleIssueIndent(indent)}
                                      className="inline-flex items-center justify-center bg-green-500 rounded-full w-6 h-6 text-white hover:bg-green-600 shadow-sm focus:outline-none"
                                      title="Add Transfer"
                                    >
                                      <PlusCircleIcon className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                      Issued
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-2 text-center">
                                  {!hasIssue ? (
                                    <div className="flex items-center justify-center h-full">
                                      <span className="text-[10px] text-slate-400 italic">No issue created yet</span>
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                      <table className="w-full text-[10px]">
                                        <thead>
                                          <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider">
                                            <th className="px-3 py-1.5 text-center font-semibold">Issue No</th>
                                            <th className="px-3 py-1.5 text-center font-semibold">Issue Date</th>
                                            <th className="px-3 py-1.5 text-center font-semibold">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-600">{indent.ISSUENO}</td>
                                            <td className="px-3 py-1.5 text-center text-slate-600">{indent.ISSUEDATE}</td>
                                            <td className="px-3 py-1.5 text-center">
                                              {indent.Status === 'I' || indent.Status === 'IN' ? (
                                                <button 
                                                  onClick={() => handleEditIssue(indent)}
                                                  className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                                                >
                                                  Incomplete
                                                </button>
                                              ) : (
                                                <button 
                                                  onClick={() => generateWardIssuePDF(indent.issueid || indent.IssueID, 'shc')}
                                                  className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                                                >
                                                  Completed
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
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
