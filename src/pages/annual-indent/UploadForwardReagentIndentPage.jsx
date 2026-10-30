import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { generateAnnualIndentPDF } from '../../utils/annualIndentPdfGenerator';
import {
  DocumentArrowUpIcon,
  PlusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { isMedicalCollegeOrDmeFacility } from '../../utils/reagentIndentHelper';

export default function UploadForwardReagentIndentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);

  const [indentList, setIndentList] = useState([]);
  const [canAdd, setCanAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Financial Years on Mount
  useEffect(() => {
    async function loadFinYears() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/annual-indent/upload-forward/fin-years');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFinYears(res.data.data);
          if (res.data.data.length > 0) {
            // Default to the latest financial year (first item in descending list)
            const latestFy = res.data.data[0];
            if (latestFy) {
              setSelectedFinYear(String(latestFy.accYrSetId));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadFinYears();
  }, []);

  // Fetch Reagent Indent list when Financial Year or Status changes
  useEffect(() => {
    if (!selectedFinYear) return;
    fetchList();
  }, [selectedFinYear, statusFilter]);

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
      const res = await axios.get('/annual-indent/reagent/upload-forward/list', {
        params: {
          facilityId: facId,
          finYearId: selectedFinYear,
          status: statusFilter !== 'All' ? statusFilter : undefined
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setIndentList(res.data.data);
        setCanAdd(res.data.canAdd !== undefined ? res.data.canAdd : true);
      } else {
        setIndentList([]);
        setCanAdd(true);
      }
    } catch (err) {
      console.error('Failed to fetch Reagent Annual Indent list:', err);
      setError('Failed to fetch Reagent Annual Indent list');
      setIndentList([]);
    } finally {
      setLoading(false);
    }
  };

  // Download Specific Indent PDF Handler
  const handleDownloadIndent = async (row) => {
    if (row.status === 'Incomplete' || row.status === 'I') {
      alert('Annual Indent must be completed before downloading PDF.');
      return;
    }
    const key = row.nocId || row.indentId;
    setDownloadingId(key);
    try {
      await generateAnnualIndentPDF(row, user, row.accYrSetId || selectedFinYear);
    } catch (err) {
      console.error('Failed to download indent PDF:', err);
      alert('Error downloading indent PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const isAuthorized = isMedicalCollegeOrDmeFacility(user);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col h-screen bg-[#f8fafc] font-sans">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full bg-white border border-slate-200 shadow-sm rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldExclamationIcon className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-slate-800 mb-2">Access Restricted</h2>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                This page is only accessible to Medical College and DME facilities.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 space-y-4">
            <div className="max-w-6xl mx-auto space-y-4">

              {/* Broad Blue Header Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a6a] via-[#1e293b] to-[#0f172a] rounded-xl shadow-md px-5 py-4 text-white border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30 shrink-0 shadow-inner">
                    <DocumentArrowUpIcon className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight drop-shadow-xs">
                      Upload Excel File and Forward for Approval
                    </h1>
                    <p className="text-xs text-blue-200/90 font-medium mt-0.5">
                      Reagent / Non-EDL Consumables & Kits | Facility ID: <span className="font-bold text-amber-300">{user?.facilityId || '22595'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={fetchList}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
                    title="Refresh List"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <ExclamationCircleIcon className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold text-sm">✕</button>
                </div>
              )}

              {/* Filter Parameters Bar (matching Image 2) */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
                
                {/* Financial Year Selector */}
                <div className="flex items-center gap-2.5">
                  <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    Financial Year:
                  </label>
                  <select
                    value={selectedFinYear}
                    onChange={(e) => setSelectedFinYear(e.target.value)}
                    disabled={dropdownLoading}
                    aria-label="Financial Year"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none shadow-xs"
                  >
                    {finYears.map(fy => (
                      <option key={fy.accYrSetId} value={fy.accYrSetId}>
                        {fy.accYear}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add New REAGENT Annual Indent Button (matching Image 2) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    Add New REAGENT Annual Indent:
                  </span>
                  {canAdd ? (
                    <Link
                      to={`/non-edl-annual-indent/create-reagent?finYearId=${selectedFinYear}`}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow hover:shadow-md transition-all group shrink-0"
                      title="Add new REAGENT Annual Indent"
                    >
                      <PlusIcon className="w-4 h-4 font-black stroke-[3]" />
                    </Link>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      Indent already created for this year
                    </span>
                  )}
                </div>

              </div>

              {/* Data Grid Table (matching Image 2 gvItemLst) */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 shadow-xs bg-[#1e3a6a] text-white font-bold border-b border-[#2563eb]/20">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-16">Sl. No.</th>
                        <th className="py-2.5 px-4 text-center">Indent No.</th>
                        <th className="py-2.5 px-4 text-center">Indent Date</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-center">Download Anual Indent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 font-semibold">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />
                              <span>Loading Reagent Annual Indent list...</span>
                            </div>
                          </td>
                        </tr>
                      ) : indentList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-500 font-bold text-sm">
                            No Item found
                          </td>
                        </tr>
                      ) : (
                        indentList.map((row, index) => {
                          const isCompleted = row.status === 'Completed' || row.status === 'C';
                          const isIncomplete = row.status === 'Incomplete' || row.status === 'I';
                          const isDownloading = downloadingId === (row.nocId || row.indentId);

                          return (
                            <tr
                              key={row.nocId || index}
                              className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500 text-xs">
                                {index + 1}
                              </td>

                              <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                                {row.nocNumber}
                              </td>

                              <td className="py-2.5 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                                {row.nocDate}
                              </td>

                              <td className="py-2.5 px-4 text-center">
                                {isIncomplete ? (
                                  <Link
                                    to={`/non-edl-annual-indent/create-reagent?mode=Edit&indentId=${row.nocId}&finYearId=${selectedFinYear}`}
                                    className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700 hover:underline"
                                    title="Click to edit incomplete indent"
                                  >
                                    <ClockIcon className="w-3.5 h-3.5 text-red-500" />
                                    <span>Incomplete</span>
                                  </Link>
                                ) : isCompleted ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Completed</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                    <span>{row.status}</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-4 text-center">
                                {isCompleted ? (
                                  <button
                                    onClick={() => handleDownloadIndent(row)}
                                    disabled={isDownloading}
                                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold hover:underline transition-colors disabled:opacity-50"
                                    title="Download Annual Indent Report"
                                  >
                                    {isDownloading ? (
                                      <>
                                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                        <span>Downloading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                        <span>Download</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer status summary */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Total Records: {indentList.length}</span>
                  <span>Financial Year: {finYears.find(f => String(f.accYrSetId) === String(selectedFinYear))?.accYear || selectedFinYear}</span>
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
