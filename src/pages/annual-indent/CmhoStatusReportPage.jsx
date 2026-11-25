import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

// ─── Excel (.xls) Export Helper ─────────────────────────────────────────────
function downloadAsExcel(headers, rows, filename) {
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Status Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    </head>
    <body>
      <table border="1" style="border-collapse:collapse; font-family:Arial,sans-serif; font-size:12px;">
        <thead>
          <tr style="background-color:#0f172a; color:#ffffff; font-weight:bold; height:32px;">
            ${headers.map(h => `<th style="padding:6px 12px; border:1px solid #cbd5e1; text-align:left;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, i) => `
            <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; height:28px;">
              ${row.map((cell, cIdx) => `<td style="padding:5px 10px; border:1px solid #e2e8f0; ${cIdx === 0 ? 'text-align:center;' : ''}">${cell ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CmhoStatusReportPage() {
  const { user } = useAuth();

  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('547');
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const facilityId = useMemo(() => {
    return user?.facilityId || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.facilityId : null) || localStorage.getItem('facilityId');
  }, [user]);

  // Load Financial Years on Mount
  useEffect(() => {
    async function loadFinYears() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/cmho-annual-indent/fin-years');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFinYears(res.data.data);
          // Prefer 547 or current year or first item
          const has547 = res.data.data.find(fy => String(fy.accYrSetId) === '547');
          const currentFy = res.data.data.find(fy => fy.isCurrent);
          if (has547) {
            setSelectedFinYear('547');
          } else if (currentFy) {
            setSelectedFinYear(String(currentFy.accYrSetId));
          } else if (res.data.data.length > 0) {
            setSelectedFinYear(String(res.data.data[0].accYrSetId));
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years.');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadFinYears();
  }, []);

  // Fetch report data when selectedFinYear changes
  useEffect(() => {
    if (selectedFinYear) {
      fetchReport();
    }
  }, [selectedFinYear]);

  const fetchReport = async () => {
    if (!selectedFinYear) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/cmho-annual-indent/status-report', {
        params: {
          finYearId: selectedFinYear,
          facilityId
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReportList(res.data.data);
      } else {
        setReportList([]);
      }
    } catch (err) {
      console.error('Failed to fetch CMHO status report:', err);
      setError('Failed to load status report. Please try again.');
      setReportList([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return reportList.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (item.facilityName || '').toLowerCase().includes(term) ||
        (item.status || '').toLowerCase().includes(term)
      );
    });
  }, [reportList, searchTerm]);

  const handleExportExcel = () => {
    if (filteredList.length === 0) return;
    const selYearObj = finYears.find(f => String(f.accYrSetId) === String(selectedFinYear));
    const yearText = selYearObj ? selYearObj.accYear : selectedFinYear;
    const headers = ['Sr No', 'Facility Name', 'Status'];
    const rows = filteredList.map(r => [r.slNo, r.facilityName, r.status]);
    downloadAsExcel(headers, rows, `CMHO_Annual_Indent_Status_${yearText.replace(/[^a-zA-Z0-9]/g, '_')}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible">
            <div className="max-w-6xl mx-auto space-y-5">
              
              {/* Main Report Container */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
                
                {/* Header Banner - Matching Sidebar/Header #0f172a theme */}
                <div className="bg-[#0f172a] text-white px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5 text-center md:text-left">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <h2 className="font-bold text-base md:text-lg tracking-wide">
                      Report : Annual Indent Upload &amp; Forward Status of District Health Facility
                    </h2>
                  </div>

                  {/* Actions: Search, Excel, Print */}
                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={handleExportExcel}
                      disabled={filteredList.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition border border-slate-700 shadow-sm disabled:opacity-40"
                      title="Export to Excel"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4 text-emerald-400" />
                      <span>Excel</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      disabled={filteredList.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition border border-slate-700 shadow-sm disabled:opacity-40"
                      title="Print Report"
                    >
                      <PrinterIcon className="w-4 h-4 text-blue-400" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Sub-bar: Fin Year on Left Side of Searchbar & Results Count */}
                <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Select Fin Year (Left side of searchbar) */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-600" />
                        Select Fin Year:
                      </label>
                      <div className="relative w-44">
                        <select
                          value={selectedFinYear}
                          onChange={(e) => setSelectedFinYear(e.target.value)}
                          disabled={dropdownLoading}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                        >
                          {finYears.map(fy => (
                            <option key={fy.accYrSetId} value={String(fy.accYrSetId)}>
                              {fy.accYear} {fy.isCurrent ? '(Current)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
                        title="Reload data"
                      >
                        <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {/* Searchbar */}
                    <div className="relative w-full sm:w-64">
                      <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search facility name or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 font-medium whitespace-nowrap">
                    Showing <span className="font-semibold text-slate-800">{filteredList.length}</span> of <span className="font-semibold text-slate-800">{reportList.length}</span> facilities
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-white text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                        <th className="py-3 px-4 w-16 text-center border-r border-slate-800/60">Sr No</th>
                        <th className="py-3 px-6 border-r border-slate-800/60">Facility Name</th>
                        <th className="py-3 px-6 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan="3" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
                              <span className="text-xs font-medium">Loading facilities status...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredList.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-12 text-center text-slate-400 text-sm font-medium">
                            No facilities found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredList.map((row, idx) => {
                          const statusLower = (row.status || '').toLowerCase();
                          const isForwarded = statusLower.includes('uploaded and forwarded');
                          const isSaved = statusLower.includes('uploaded but not forwarded');

                          return (
                            <tr
                              key={row.facilityId || idx}
                              className={`transition-colors hover:bg-slate-50/90 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                            >
                              <td className="py-3 px-4 text-center font-medium text-slate-600 border-r border-slate-100 text-xs">
                                {row.slNo || idx + 1}
                              </td>
                              <td className="py-3 px-6 font-semibold text-slate-800 border-r border-slate-100">
                                {row.facilityName}
                              </td>
                              <td className="py-3 px-6 text-center">
                                {isForwarded ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                    {row.status}
                                  </span>
                                ) : isSaved ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                    <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
                                    {row.status}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                    <XCircleIcon className="w-3.5 h-3.5 text-rose-600" />
                                    {row.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Count info */}
                {!loading && filteredList.length > 0 && (
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center print:hidden">
                    <span>CMHO District Health Facility Annual Indent Status</span>
                    <span>Total: <strong className="text-slate-700">{filteredList.length}</strong> Records</span>
                  </div>
                )}
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
