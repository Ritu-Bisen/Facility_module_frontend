import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { getIncomingReceiptsList } from '../api/inFacilityTransferApi';
import api from '../api/axios';
import { PlusIcon, FolderOpenIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

export default function InterFacilityReceiptsFAC() {
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  useEffect(() => {
    loadFinYears();
  }, []);

  useEffect(() => {
    if (facilityId && selectedFinYear) {
      loadReceipts();
    }
  }, [facilityId, selectedFinYear]);

  const loadFinYears = async () => {
    try {
      const res = await api.get('/ward-issue/acc-years');
      const mappedYears = (res.data || []).map(y => 
        Array.isArray(y) ? { id: y[0], name: y[1] } : { id: y.ACCYRSETID || y.accYrSetId, name: y.SHACCYEAR || y.shAccYear }
      );
      setFinYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedFinYear(mappedYears[0].id);
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
    }
  };

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await getIncomingReceiptsList(facilityId, selectedFinYear);
      if (res.success) {
        setReceipts(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts list:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 relative">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Page Title & Controls */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -z-10 transform translate-x-20 -translate-y-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Receipts</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inter Facility Receipts</h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">Manage and view receipts from other facilities.</p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Fin. Year</label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-40"
                    >
                      {finYears.map(fy => (
                        <option key={fy.id} value={fy.id}>{fy.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <div className="border-b-2 border-indigo-500 py-2 px-4 bg-white rounded-t-lg shadow-sm">
                  <span className="text-sm font-bold text-indigo-600">Receipts from Facility</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-[#0f172a] text-gray-100 text-[10px] uppercase font-bold tracking-wider">
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-4 py-3.5 text-center w-12">Sl. No.</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-4 py-3.5 text-left">From Facility</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-4 py-3.5 text-center">Issue No</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-4 py-3.5 text-center">Issue Date</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-4 py-3.5 text-center">Receipt Status</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-4 py-3.5 text-center">Receipts</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-0 py-0 text-center w-80">
                          <div className="px-4 py-3.5 w-full border-l border-[#1e293b]">Receipts</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-5 py-12 text-center">
                            <svg className="animate-spin w-8 h-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <p className="text-xs font-semibold text-slate-400">Loading receipts...</p>
                          </td>
                        </tr>
                      ) : (
                        receipts.map((issue, idx) => (
                          <tr key={issue.IssueID} className="hover:bg-slate-50/50 align-middle">
                            <td className="px-4 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-4 text-xs font-semibold text-slate-800">
                              {issue.FromFacility}
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-600 bg-slate-50/50">
                              {issue.IssueNo || '-'}
                            </td>
                            <td className="px-4 py-4 text-center text-xs text-slate-600">
                              {issue.IssueDate || '-'}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {issue.IssueStatus === 'C' || issue.IssueStatus === 'Complete' ? (
                                <span className="text-emerald-700 text-xs font-semibold">Complete</span>
                              ) : (
                                <span className="text-slate-500 text-xs font-medium">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {issue.Receipts && issue.Receipts.length > 0 ? (
                                <span className="text-md font-semibold text-green-600">Received</span>
                              ) : (
                                <button
                                  onClick={() => navigate(`/inter-facility-receipt/add/${issue.IssueID}`)}
                                  className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition shadow-sm hover:shadow-md"
                                  title="Add Receipt"
                                >
                                  <PlusIcon className="w-4 h-4 font-bold" />
                                </button>
                              )}
                            </td>
                            <td className="p-0 align-top">
                              {issue.Receipts && issue.Receipts.length > 0 && (
                                <table className="w-full h-full text-xs text-left min-h-full">
                                  <thead className="bg-[#0f172a] text-gray-100 text-[10px] uppercase font-bold border-l border-[#1e293b]">
                                    <tr>
                                      <th className="px-3 py-1.5 text-center border-b border-[#1e293b]">Receipt No</th>
                                      <th className="px-3 py-1.5 text-center border-b border-l border-[#1e293b]">Receipt Date</th>
                                      <th className="px-3 py-1.5 text-center border-b border-l border-[#1e293b]">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                      {issue.Receipts.map((rcpt, rcptIdx) => (
                                        <tr key={rcpt.FacReceiptID || rcptIdx} className={`border-l border-slate-200 ${rcptIdx > 0 ? "border-t border-slate-200" : ""}`}>
                                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-600 bg-slate-50/50">
                                            <button 
                                              onClick={() => navigate(`/inter-facility-receipt/edit/${rcpt.FacReceiptID}`)}
                                              className="text-blue-600 hover:underline"
                                            >
                                              {rcpt.FacReceiptNo}
                                            </button>
                                          </td>
                                          <td className="px-3 py-2 text-center text-slate-600 border-l border-slate-200">{rcpt.FacReceiptDate}</td>
                                          <td className="px-3 py-2 text-center border-l border-slate-200">
                                            {rcpt.ReceiptStatus === 'C' ? (
                                              <button 
                                                onClick={() => navigate(`/inter-facility-receipt/edit/${rcpt.FacReceiptID}`)}
                                                className="text-emerald-600 font-bold underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
                                              >
                                                Completed
                                              </button>
                                            ) : (
                                              <button 
                                                onClick={() => navigate(`/inter-facility-receipt/edit/${rcpt.FacReceiptID}`)}
                                                className="text-orange-500 font-bold underline decoration-orange-300 underline-offset-2 hover:text-orange-700"
                                              >
                                                Pending
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                      
                      {!loading && receipts.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                              <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No receipts found</p>
                              <p className="text-xs mt-1">Change financial year to view other records.</p>
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
    </div>
  );
}
