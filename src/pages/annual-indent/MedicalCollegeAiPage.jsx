import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function MedicalCollegeAiPage() {
  const [finYears, setFinYears] = useState([]);
  const [medicalColleges, setMedicalColleges] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedFinYear, setSelectedFinYear] = useState('0');
  const [selectedMedicalCollege, setSelectedMedicalCollege] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('0');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch initial dropdown options
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/annual-indent/medical-college-ai/dropdowns');
        if (res.data?.success && res.data.data) {
          const { finYears = [], medicalColleges = [], categories = [] } = res.data.data;
          setFinYears(finYears);
          setMedicalColleges(medicalColleges);
          setCategories(categories);
        }
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
        setError('Failed to load dropdown filter options');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadDropdowns();
  }, []);

  // Fetch Report Data
  const handleShow = async () => {
    if (selectedFinYear === '0') {
      alert('Please select financial year');
      return;
    }
    if (selectedMedicalCollege === '0') {
      alert('Please select medical college');
      return;
    }
    if (selectedCategory === '0') {
      alert('Please select category');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await axios.get('/annual-indent/medical-college-ai', {
        params: {
          finYearId: selectedFinYear,
          medicalCollegeId: selectedMedicalCollege,
          categoryId: selectedCategory
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReportData(res.data.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error('Failed to fetch Medical College AI report:', err);
      setError('Failed to fetch report data from server');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter(row =>
      (row.itemCode && row.itemCode.toLowerCase().includes(q)) ||
      (row.itemName && row.itemName.toLowerCase().includes(q)) ||
      (row.strength && row.strength.toLowerCase().includes(q)) ||
      (row.status && row.status.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Compute Grand Totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      acc.aiQty += Number(row.aiQty) || 0;
      acc.facStock += Number(row.facStock) || 0;
      acc.iValue += Number(row.iValue) || 0;
      return acc;
    }, { aiQty: 0, facStock: 0, iValue: 0 });
  }, [filteredData]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data available to export');
      return;
    }

    let tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #000084; color: #ffffff; font-weight: bold;">
            <th>S.No</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Strength</th>
            <th>Unit</th>
            <th>Unit Count</th>
            <th>MC Hosp. AI Qty</th>
            <th>Facility Stock</th>
            <th>Rates</th>
            <th>Status</th>
            <th>Issue Value</th>
            <th>AI Type</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredData.forEach((row, index) => {
      tableHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${row.itemCode || ''}</td>
          <td>${row.itemName || ''}</td>
          <td>${row.strength || ''}</td>
          <td>${row.unit || ''}</td>
          <td style="text-align: center;">${row.unitCount || 1}</td>
          <td style="text-align: right;">${row.aiQty || 0}</td>
          <td style="text-align: right;">${row.facStock || 0}</td>
          <td style="text-align: right;">${Number(row.rates || 0).toFixed(2)}</td>
          <td>${row.status || ''}</td>
          <td style="text-align: right;">${Number(row.iValue || 0).toFixed(2)}</td>
          <td>${row.aiType || ''}</td>
        </tr>
      `;
    });

    tableHtml += `
          <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td colspan="6" style="text-align: right;">Grand Total:</td>
            <td style="text-align: right;">${totals.aiQty}</td>
            <td style="text-align: right;">${totals.facStock}</td>
            <td colspan="2"></td>
            <td style="text-align: right;">${totals.iValue.toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_College_Hospital_AI_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-[98%] mx-auto space-y-6">

              {/* Title Header Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-red-800 via-rose-900 to-slate-900 rounded-2xl shadow-lg p-6 text-white border border-red-700/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 uppercase tracking-widest">
                      <TableCellsIcon className="w-4 h-4" />
                      <span>Annual Indent Reports</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                      Medical College Hospital AI
                    </h1>
                    <p className="text-xs md:text-sm text-rose-100">
                      Medical College Hospital Annual Indents, rates, facility stock balances, and total issue values.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportExcel}
                      disabled={filteredData.length === 0}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Export to Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Controls Card matching ASP.NET MC_AI.aspx */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base">
                  <FunnelIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>Report Filter Parameters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Select Fin Year */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Fin Year :-
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all outline-none"
                    >
                      <option value="0">Select Fin Year</option>
                      {finYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Medical College */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Medical College :-
                    </label>
                    <select
                      value={selectedMedicalCollege}
                      onChange={(e) => setSelectedMedicalCollege(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all outline-none"
                    >
                      <option value="0">Select Medical College</option>
                      {medicalColleges.map(mc => (
                        <option key={mc.facilityId} value={mc.facilityId}>
                          {mc.facilityName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Category :-
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all outline-none"
                    >
                      <option value="0">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Show Button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleShow}
                    disabled={loading}
                    className="px-8 py-2.5 bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-800 hover:to-rose-900 text-white font-extrabold text-sm rounded-xl shadow-md shadow-red-700/20 hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                        <span>Loading Data...</span>
                      </>
                    ) : (
                      <span>Show</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Medical College Hospital AI Records
                    </h3>
                    {filteredData.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                        {filteredData.length} records
                      </span>
                    )}
                  </div>

                  <div className="relative w-full md:w-72">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search code, item name, strength..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#000084] text-white font-bold text-center uppercase tracking-wider border-b border-blue-900">
                        <th className="py-3.5 px-3 border-r border-blue-900 w-12">S.No</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center font-bold">Item Code</th>
                        <th className="py-3.5 px-4 border-r border-blue-900 text-left min-w-[220px]">Item Name</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-left">Strength</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-left">Unit</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center">Unit Count</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-right text-rose-300">MC Hosp. AI Qty</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-right">Facility Stock</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-right">Rates</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center">Status</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-right text-emerald-300">Issue Value</th>
                        <th className="py-3.5 px-3 text-left">AI Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="12" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-rose-600" />
                              <span className="text-sm font-medium">Fetching Medical College Hospital AI Records...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="12" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {hasSearched ? 'No Record Available' : 'Select Fin Year, Medical College, Category and click "Show"'}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, index) => (
                          <tr
                            key={index}
                            className="hover:bg-rose-50/40 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200"
                          >
                            <td className="py-3 px-3 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                              {index + 1}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-bold text-blue-700 dark:text-blue-400 text-center">
                              {row.itemCode}
                            </td>
                            <td className="py-3 px-4 font-semibold border-r border-slate-100 dark:border-slate-800">
                              {row.itemName}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              {row.strength}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              {row.unit}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-medium">
                              {row.unitCount}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-rose-700 dark:text-rose-400">
                              {Number(row.aiQty || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium">
                              {Number(row.facStock || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-semibold">
                              ₹{row.rates}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-medium">
                              {row.status}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                              ₹{row.iValue}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {row.aiType}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Summary Footer */}
                    {filteredData.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                          <td colSpan="6" className="py-3.5 px-4 text-right border-r border-slate-300 dark:border-slate-700 uppercase tracking-wider text-xs">
                            Grand Total:
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                            {totals.aiQty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700">
                            {totals.facStock.toLocaleString()}
                          </td>
                          <td colSpan="2" className="border-r border-slate-300 dark:border-slate-700"></td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 text-sm">
                            ₹{totals.iValue.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
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
