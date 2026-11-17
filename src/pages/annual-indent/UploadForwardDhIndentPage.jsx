import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { generateAnnualIndentPDF } from '../../utils/annualIndentPdfGenerator';
import { getCurrentAndFutureFinYears } from '../../utils/indentYearHelper';
import {
  DocumentArrowUpIcon,
  PlusIcon,
  ArrowPathIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function UploadForwardDhIndentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard: Only allow HOD ID 2 (DME) or 3 (AYUSH)
  const rawHodId = localStorage.getItem('hodId') || localStorage.getItem('hodid') || user?.hodId || user?.hodid;
  const currentHodId = rawHodId !== null && rawHodId !== undefined && rawHodId !== '' ? Number(rawHodId) : null;
  const isAuthorized = currentHodId === 2 || currentHodId === 3;

  useEffect(() => {
    if (user && !isAuthorized) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAuthorized, navigate]);

  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('548');
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
        const res = await axios.get('/dh-annual-indent/upload-forward/fin-years');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFinYears(res.data.data);
          if (res.data.data.length > 0) {
            const currentIndex = res.data.data.findIndex(fy => fy.isCurrent);
            let defaultFy = null;
            if (currentIndex > 0) {
              defaultFy = res.data.data[currentIndex - 1]; // One year in the future
            } else if (currentIndex === 0) {
              defaultFy = res.data.data[0];
            } else {
              defaultFy = res.data.data[0];
            }
            setSelectedFinYear(String(defaultFy.accYrSetId));
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years dropdown');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadFinYears();
  }, []);

  // Fetch Annual Indent List when Financial Year changes
  useEffect(() => {
    if (!selectedFinYear) return;
    fetchList();
  }, [selectedFinYear]);

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/dh-annual-indent/upload-forward/list', {
        params: { finYearId: selectedFinYear }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setIndentList(res.data.data);
        setCanAdd(res.data.canAdd !== undefined ? res.data.canAdd : true);
      } else {
        setIndentList([]);
        setCanAdd(true);
      }
    } catch (err) {
      console.error('Failed to fetch DH Annual Indent list:', err);
      setError('Failed to fetch Annual Indent list');
      setIndentList([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if facility type or role is DH (District Hospital)
  const isDhUser = useMemo(() => {
    const facTypeCode = (user?.facilityTypeCode || localStorage.getItem('facilityTypeCode') || '').toUpperCase();
    const facTypeDesc = (user?.facilityTypeName || user?.facilityType || localStorage.getItem('facilityType') || '').toUpperCase();
    const facName = (user?.facilityName || '').toUpperCase();
    const role = (user?.roleName || user?.role || localStorage.getItem('roleName') || '').toUpperCase();

    // If explicit DH in code, desc, name or role
    if (
      facTypeCode === 'DH' ||
      facTypeCode.includes('DH') ||
      facTypeDesc.includes('DH') ||
      facTypeDesc.includes('DISTRICT HOSPITAL') ||
      facName.startsWith('DH ') ||
      facName.includes('DISTRICT HOSPITAL') ||
      role === 'DH' ||
      role.includes('DH')
    ) {
      return true;
    }

    // Default to true for this DH page unless specifically DME or Medical College
    const isMcDme = facTypeCode.includes('364') || facTypeCode.includes('378') || facTypeDesc.includes('DME') || facTypeDesc.includes('MEDICAL COLLEGE');
    return !isMcDme;
  }, [user]);

  // Dynamic Indian Financial Year calculations (1 April - 31 March)
  // e.g. Before 1 April 2027: current = 26-27, future = 27-28
  // e.g. From 1 April 2027:   current = 27-28, future = 28-29
  const finYearInfo = useMemo(() => getCurrentAndFutureFinYears(), []);

  // Check if selected financial year is the current financial year
  const isCurrentFinYear = useMemo(() => {
    const selectedYearObj = finYears.find(fy => String(fy.accYrSetId) === String(selectedFinYear));
    if (selectedYearObj?.isCurrent) return true;

    const yearText = String(
      selectedYearObj?.accYear ||
      selectedYearObj?.shAccYear ||
      selectedYearObj?.year ||
      ''
    ).trim();

    if (yearText) {
      return (
        yearText.includes(finYearInfo.currentFyShort) ||
        yearText.includes(finYearInfo.currentFyFull) ||
        yearText.replace(/\s+/g, '') === finYearInfo.currentFyFull ||
        yearText.replace(/\s+/g, '') === finYearInfo.currentFyShort
      );
    }
    return String(selectedFinYear) === '547';
  }, [finYears, selectedFinYear, finYearInfo]);

  // Check if selected financial year is the future financial year
  const isFutureFinYear = useMemo(() => {
    const selectedYearObj = finYears.find(fy => String(fy.accYrSetId) === String(selectedFinYear));
    const currentIdx = finYears.findIndex(fy => fy.isCurrent);
    if (currentIdx > 0 && selectedYearObj && String(finYears[currentIdx - 1]?.accYrSetId) === String(selectedFinYear)) {
      return true;
    }

    const yearText = String(
      selectedYearObj?.accYear ||
      selectedYearObj?.shAccYear ||
      selectedYearObj?.year ||
      ''
    ).trim();

    if (yearText) {
      return (
        yearText.includes(finYearInfo.futureFyShort) ||
        yearText.includes(finYearInfo.futureFyFull) ||
        yearText.replace(/\s+/g, '') === finYearInfo.futureFyFull ||
        yearText.replace(/\s+/g, '') === finYearInfo.futureFyShort
      );
    }
    return String(selectedFinYear) === '548';
  }, [finYears, selectedFinYear, finYearInfo]);

  const isCurrentOrFutureFinYear = isCurrentFinYear || isFutureFinYear;

  // Add New Annual Indent visibility rule:
  // - The button only shows in the current financial year and future financial year (e.g. 26-27 and 27-28; from 1 April 27-28 and 28-29).
  // - In past financial years, NEVER show that button.
  // - When login user hodId is 3 (DME): ALWAYS show the button in current and future year in any case.
  // - When login user hodId is 2 (DHS):
  //     * In 26-27: do NOT show button
  //     * In future year (e.g. 27-28; from 1 Apr in 27-28/28-29): ONLY show if there is no indent yet (indentList.length === 0). If one indent is created, do NOT show that button.
  // - Otherwise: default to standard rule (isDhUser ? (indentList.length === 0) : canAdd)
  const showAddButton = useMemo(() => {
    // Only show button in current year and future year; never in past years
    if (!isCurrentOrFutureFinYear) {
      return false;
    }

    const localHod = String(
      localStorage.getItem('hodId') ??
      localStorage.getItem('hodid') ??
      currentHodId ??
      ''
    ).trim();

    const isHod3 = localHod === '3' || currentHodId === 3;
    const isHod2 = localHod === '2' || currentHodId === 2;

    if (isHod3) {
      // DME (hodId 3): In both current and future year, ALWAYS show button in any case
      return true;
    }

    if (isHod2) {
      // DHS (hodId 2):
      const selectedYearObj = finYears.find(fy => String(fy.accYrSetId) === String(selectedFinYear));
      const yearText = String(selectedYearObj?.accYear || selectedYearObj?.shAccYear || '').trim();
      const isYear2627 = yearText.includes('26-27') || yearText.includes('2026-2027') || String(selectedFinYear) === '547';

      // In 26-27: do not show
      if (isYear2627) {
        return false;
      }

      // In other current/future years (e.g. 27-28): only show if no indent yet (if 1 indent created, do NOT show)
      return indentList.length === 0;
    }

    return isDhUser ? (indentList.length === 0) : canAdd;
  }, [isCurrentOrFutureFinYear, finYears, selectedFinYear, currentHodId, isDhUser, indentList.length, canAdd]);

  // Filtered Indent List based on Status Filter (matching ddlStatus in C#)
  const filteredIndentList = indentList.filter(row => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'I') return row.status === 'Incomplete';
    if (statusFilter === 'C') return row.status === 'Completed' || row.status === 'NOC Approved' || row.status === 'Sent for Approval';
    return true;
  });

  // Download Specific Indent PDF Handler
  const handleDownloadIndent = async (row) => {
    if (row.status === 'Incomplete' || row.status === 'I') {
      alert('Annual Indent must be completed before downloading PDF.');
      return;
    }
    const key = row.nocId || row.indentId;
    setDownloadingId(key);
    try {
      await generateAnnualIndentPDF(row, user, selectedFinYear);
    } catch (err) {
      console.error('Failed to download indent PDF:', err);
      alert('Error downloading indent PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Title Header Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl shadow-lg p-5 text-white border border-emerald-700/40 text-center">
                <div className="relative z-10 space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/40 text-emerald-200 text-xs font-semibold uppercase tracking-widest border border-emerald-500/30">
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    <span>Annual Indent</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Upload and Forward Annual Indent
                  </h1>
                </div>
              </div>

              {/* Filter Parameters Bar */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Financial Year Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      Financial Year:
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={dropdownLoading}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none shadow-sm"
                    >
                      {finYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap flex items-center gap-1">
                      <FunnelIcon className="w-4 h-4 text-emerald-600" />
                      <span>Filter Status:</span>
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none shadow-sm"
                    >
                      <option value="All">All</option>
                      <option value="I">Incomplete</option>
                      <option value="C">Completed</option>
                    </select>
                  </div>

                  {/* Add New Annual Indent Button (Shown only once per year for DH if no indent exists yet) */}
                  {showAddButton && (
                    <div className="flex items-center">
                      <Link 
                        to={`/annual-indent/create-dh?finYearId=${selectedFinYear}`}
                        className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-emerald-300 dark:border-slate-700 shadow-sm group shrink-0"
                        title="Add new Anualindent"
                      >
                        <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 group-hover:text-emerald-700 whitespace-nowrap">
                          Add New Annual Indent:
                        </span>
                        <div className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow transition-all duration-200 group-hover:scale-110 shrink-0">
                          <PlusIcon className="w-4 h-4 font-bold" />
                        </div>
                      </Link>
                    </div>
                  )}

                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Data Table GridView */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                    <TableCellsIcon className="w-4 h-4 text-emerald-600" />
                    <span>Annual Indent List</span>
                  </h3>
                  {filteredIndentList.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                      {filteredIndentList.length} Record(s)
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-xs bg-slate-50">
                      <tr className="bg-emerald-900 text-white font-bold text-center border-b border-emerald-800">
                        <th className="py-3 px-4 border-r border-emerald-800 w-16 text-center">Sl. No.</th>
                        <th className="py-3 px-4 border-r border-emerald-800 text-center">Indent No.</th>
                        <th className="py-3 px-4 border-r border-emerald-800 text-center">Indent Date</th>
                        <th className="py-3 px-4 border-r border-emerald-800 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Download Annual Indent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-emerald-600" />
                              <span className="text-xs font-semibold">Loading Annual Indent list...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredIndentList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            No Item found
                          </td>
                        </tr>
                      ) : (
                        filteredIndentList.map((row, index) => {
                          const isIncomplete = row.status === 'Incomplete' || row.status === 'I';
                          return (
                            <tr
                              key={row.nocId || index}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b]"
                            >
                              <td className="py-3 px-4 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                                {index + 1}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                                {isIncomplete ? (
                                  <Link
                                    to={`/annual-indent/create-dh?indentId=${row.nocId}&finYearId=${selectedFinYear}`}
                                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                                    title="Click to view/edit incomplete indent"
                                  >
                                    {row.nocNumber || row.indentNo}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-slate-800 dark:text-slate-200 select-none">
                                    {row.nocNumber || row.indentNo}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                                {row.nocDate || row.indentDate}
                              </td>
                              <td className="py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800 font-extrabold">
                                {isIncomplete ? (
                                  <Link
                                    to={`/annual-indent/create-dh?indentId=${row.nocId}&finYearId=${selectedFinYear}`}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 hover:underline cursor-pointer inline-flex items-center gap-1 font-black"
                                    title="Click to view/edit incomplete indent"
                                  >
                                    <span>{row.status}</span>
                                  </Link>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none cursor-default">
                                    {row.status}
                                  </span>
                                )}
                              </td>
                            <td className="py-3 px-4 text-center">
                              {row.status === 'Completed' || row.status === 'C' ? (
                                <button
                                  onClick={() => handleDownloadIndent(row)}
                                  disabled={downloadingId === (row.nocId || row.indentId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-emerald-400 font-bold rounded-lg transition-all text-xs border border-emerald-200 dark:border-slate-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Download saved Annual Indent PDF"
                                >
                                  {downloadingId === (row.nocId || row.indentId) ? (
                                    <>
                                      <svg className="animate-spin w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                      </svg>
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <ArrowDownTrayIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>Download</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">-</span>
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

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
