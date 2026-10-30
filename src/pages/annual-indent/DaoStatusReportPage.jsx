import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// ─── Excel (.xls) Export Helper ─────────────────────────────────────────────
function downloadAsExcel(headers, rows, filename) {
  let tableHtml = `
    <table border="1" style="border-collapse:collapse; font-family:Arial,sans-serif; font-size:12px;">
      <thead className="sticky top-0 z-10 shadow-xs bg-slate-50">
        <tr style="background-color:#0f172a; color:white; font-weight:bold;">
          ${headers.map(h => `<th style="padding:6px 10px; border:1px solid #cbd5e1;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => `
          <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            ${row.map(cell => `<td style="padding:5px 8px; border:1px solid #e2e8f0;">${cell ?? ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DaoStatusReportPage() {
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');

  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Load Financial Years and Categories on Mount ─────────────────────────
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const [fyRes, catRes] = await Promise.all([
          axios.get('/annual-indent/upload-forward/fin-years'),
          axios.get('/annual-indent/categories')
        ]);

        if (fyRes.data?.success && Array.isArray(fyRes.data.data)) {
          setFinYears(fyRes.data.data);
          if (fyRes.data.data.length > 0) {
            const defaultFy = fyRes.data.data.find(fy => fy.isCurrent) || fyRes.data.data[0];
            setSelectedFinYear(String(defaultFy.accYrSetId));
          }
        }

        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data);
          if (catRes.data.data.length > 0) {
            setSelectedCategory(String(catRes.data.data[0].categoryId || catRes.data.data[0].subcatId || '1'));
          }
        }
      } catch (err) {
        console.error('Failed to load initial dropdowns:', err);
      } finally {
        setDropdownLoading(false);
      }
    }

    loadDropdowns();
  }, []);

  const fetchReport = async () => {
    if (!selectedFinYear || !selectedCategory || selectedCategory === '0') {
      alert('Please select Category');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/annual-indent/dao/status-report', {
        params: {
          finYearId: selectedFinYear,
          categoryId: selectedCategory
        }
      });
      if (res.data?.success) {
        setReportList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch DAO status report:', err);
      setError('Failed to fetch status report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when category and finYear become ready
  useEffect(() => {
    if (selectedFinYear && selectedCategory && selectedCategory !== '0') {
      fetchReport();
    }
  }, [selectedFinYear]);

  const handleExportExcel = () => {
    if (reportList.length === 0) return;
    const catObj = categories.find(c => String(c.categoryId || c.subcatId) === selectedCategory);
    const catName = catObj ? catObj.categoryName : 'Category';
    const headers = ['Sr No', 'Facility Name', 'Indent Type', 'Status'];
    const rows = reportList.map(r => [
      r.slNo,
      r.facilityName,
      r.categoryName || catName,
      r.status
    ]);
    downloadAsExcel(headers, rows, `Annual_Indent_Status_${catName.replace(/[^a-zA-Z0-9]/g, '_')}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              {/* Title Banner — matching header/sidebar background #0f172a */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-[#0f172a] text-white text-center py-4 px-6 flex items-center justify-between">
                <div className="flex-1 text-center font-bold text-lg tracking-wide">
                  Report : Annual Indent Upload &amp; Forward Status
                </div>
                {reportList.length > 0 && (
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition border border-slate-700 shadow-sm"
                    title="Export to Excel"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                )}
              </div>

              {/* Filter Area (Matches ASPX form: Select Fin Year, Select Category, Show button) */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="max-w-lg mx-auto flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-slate-700 w-36 text-right shrink-0">
                      Select Fin Year:
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={dropdownLoading}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none text-slate-800 shadow-sm"
                    >
                      {finYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear} {fy.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-slate-700 w-36 text-right shrink-0">
                      Select Category:
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={dropdownLoading}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none text-slate-800 shadow-sm"
                    >
                      <option value="0">Select Category</option>
                      {categories.map(c => (
                        <option key={c.categoryId || c.subcatId} value={c.categoryId || c.subcatId}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={fetchReport}
                      disabled={loading || dropdownLoading}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-lg text-sm shadow-sm transition"
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>Show</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Grid Table — Internal Scroll with Fixed Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)]">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-10 shadow-sm bg-slate-50">
                    <tr className="bg-[#0f172a] text-white">
                      <th className="py-2.5 px-3 font-semibold text-center border-r border-slate-700 whitespace-nowrap w-16 bg-[#0f172a]">
                        Sr No
                      </th>
                      <th className="py-2.5 px-4 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                        Facility Name
                      </th>
                      <th className="py-2.5 px-4 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                        Indent Type
                      </th>
                      <th className="py-2.5 px-4 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-14 text-center text-slate-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <ArrowPathIcon className="w-6 h-6 animate-spin text-[#0f172a]" />
                            <span className="font-medium">Loading status report...</span>
                          </div>
                        </td>
                      </tr>
                    ) : reportList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-14 text-center text-slate-400 text-sm font-semibold">
                          No records found. Select financial year &amp; category and click "Show".
                        </td>
                      </tr>
                    ) : (
                      reportList.map((row, idx) => (
                        <tr
                          key={`${row.facilityId}-${idx}`}
                          className={`transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                          <td className="py-2 px-3 text-center font-medium text-slate-500 border-r border-slate-100">
                            {row.slNo}
                          </td>
                          <td className="py-2 px-4 border-r border-slate-100 font-medium text-slate-800">
                            {row.facilityName}
                          </td>
                          <td className="py-2 px-4 border-r border-slate-100 text-slate-700 text-xs">
                            {row.categoryName}
                          </td>
                          <td className="py-2 px-4 border-r border-slate-100 text-slate-700 text-xs font-semibold">
                            {row.status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer record count */}
              {!loading && reportList.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
                  Total: {reportList.length} record(s)
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
