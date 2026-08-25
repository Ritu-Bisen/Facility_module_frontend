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
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function McHospitalAiVsIssuancePage() {
  const [indentYears, setIndentYears] = useState([]);
  const [categories, setCategories] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [selectedIndentYear, setSelectedIndentYear] = useState('547');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [selectedFacility, setSelectedFacility] = useState('0');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch Dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/annual-indent/mc-ai-vs-issuance/dropdowns');
        if (res.data?.success && res.data.data) {
          const { indentYears = [], categories = [], facilities = [] } = res.data.data;
          setIndentYears(indentYears);
          setCategories(categories);
          setFacilities(facilities);
          if (facilities.length > 0) {
            setSelectedFacility(String(facilities[0].facilityId));
          }
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

  // Fetch Report Handler
  const handleShow = async () => {
    if (selectedFacility === '0') {
      alert('Please select Facility');
      return;
    }

    if (selectedIndentYear === '0') {
      alert('Please select Indent Year');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await axios.get('/annual-indent/mc-ai-vs-issuance/report', {
        params: {
          finYearId: selectedIndentYear,
          categoryId: selectedCategory,
          facilityId: selectedFacility
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReportData(res.data.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error('Failed to fetch MC AI vs Issuance report:', err);
      setError('Failed to fetch report data from server');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Client Filter Search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter(row =>
      (row.itemCode && row.itemCode.toLowerCase().includes(q)) ||
      (row.itemName && row.itemName.toLowerCase().includes(q)) ||
      (row.strength && row.strength.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Compute Grand Totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      acc.ai += Number(row.ai) || 0;
      acc.issuedQty += Number(row.issuedQty) || 0;
      return acc;
    }, { ai: 0, issuedQty: 0 });
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
            <th>AI</th>
            <th>WH Issued Qty</th>
            <th>Issued Percentage(%)</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredData.forEach((row, index) => {
      const per = Number(row.issuePer) || 0;
      let bgStyle = '';
      if (per > 100) {
        bgStyle = 'background-color: #fce7f3;'; // Light Pink
      } else if (per >= 50 && per <= 100) {
        bgStyle = 'background-color: #fef9c3;'; // Light Yellow
      }

      tableHtml += `
        <tr style="${bgStyle}">
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: center;">${row.itemCode || ''}</td>
          <td>${row.itemName || ''}</td>
          <td>${row.strength || ''}</td>
          <td style="text-align: center;">${row.unit || ''}</td>
          <td style="text-align: center;">${row.unitCount || 1}</td>
          <td style="text-align: right;">${row.ai || 0}</td>
          <td style="text-align: right;">${row.issuedQty || 0}</td>
          <td style="text-align: right;">${row.issuePer}%</td>
        </tr>
      `;
    });

    tableHtml += `
          <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td colspan="6" style="text-align: right;">Grand Total:</td>
            <td style="text-align: right;">${totals.ai}</td>
            <td style="text-align: right;">${totals.issuedQty}</td>
            <td style="text-align: right;">${totals.ai > 0 ? (totals.issuedQty / totals.ai * 100).toFixed(2) : '0.00'}%</td>
          </tr>
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_vs_Issuance_Report_${new Date().toISOString().slice(0,10)}.xls`;
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
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl shadow-lg p-6 text-white border border-blue-700/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-widest">
                      <TableCellsIcon className="w-4 h-4" />
                      <span>Annual Indent Vs Issuance</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                      Medical College/Hospital AI vs WH Issuance Report
                    </h1>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportExcel}
                      disabled={filteredData.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Export to Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Red Notice / Legend Box matching ASP.NET AIvsIssueanceRpt.aspx */}
              <div className="bg-red-50/90 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800 p-5 space-y-2 text-xs font-semibold text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200 text-sm mb-1">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  <span>Important Instructions & Color Legend:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300 leading-relaxed font-medium">
                  <li><span className="font-bold text-pink-700 dark:text-pink-300">1. Pink:</span> Showing Lifted Quantity is more than AI Quantity</li>
                  <li><span className="font-bold text-amber-700 dark:text-amber-300">2. Yellow:</span> Showing Lifted Quantity is more than 50% of AI Quantity</li>
                  <li>3. For point no 1 & 2, Please raise Additional Indent by using Supplementary Indent page</li>
                  <li>4. In future Warehouse Issue/Monthly Indent and NOC will be blocked if Balance AI is Nil</li>
                </ul>
              </div>

              {/* Filter Controls Card matching ASP.NET AIvsIssueanceRpt.aspx */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base">
                  <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Filter Parameters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* Indent Year */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Indent Year:
                    </label>
                    <select
                      value={selectedIndentYear}
                      onChange={(e) => setSelectedIndentYear(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">Select Indent Year</option>
                      {indentYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category Name:
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">All Category</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Medical College / Hospital */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Medical College / Hospital:
                    </label>
                    <select
                      value={selectedFacility}
                      onChange={(e) => setSelectedFacility(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">---Select Facility---</option>
                      {facilities.map(fac => (
                        <option key={fac.facilityId} value={fac.facilityId}>
                          {fac.facilityName}
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
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold text-sm rounded-xl shadow-md shadow-blue-700/20 hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                        <span>Loading Report...</span>
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

              {/* Data Table Panel */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      AI vs WH Issuance Report Records
                    </h3>
                    {filteredData.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold">
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
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Table Data matching GridView gvAindent1 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#000084] text-white font-bold text-center uppercase tracking-wider border-b border-blue-900">
                        <th className="py-3.5 px-3 border-r border-blue-900 w-12">S.No</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center font-bold">Item Code</th>
                        <th className="py-3.5 px-4 border-r border-blue-900 text-left min-w-[250px]">Item Name</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-left">Strength</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center">Unit</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center">Unit Count</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center text-blue-200">AI</th>
                        <th className="py-3.5 px-3 border-r border-blue-900 text-center text-emerald-200">WH Issued Qty</th>
                        <th className="py-3.5 px-3 text-center">Issued Percentage(%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-blue-600" />
                              <span className="text-sm font-medium">Fetching AI vs WH Issuance Records...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {hasSearched ? 'No Records to Show' : 'Select Facility, Indent Year and click "Show"'}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, index) => {
                          const per = Number(row.issuePer) || 0;
                          
                          // Conditional row styling matching ASP.NET gvAindent1_RowDataBound
                          let rowClass = "hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200";
                          if (per > 100) {
                            rowClass = "bg-pink-100 hover:bg-pink-200 dark:bg-pink-950/50 dark:hover:bg-pink-900/60 text-pink-950 dark:text-pink-100 font-medium";
                          } else if (per >= 50 && per <= 100) {
                            rowClass = "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-950/50 dark:hover:bg-yellow-900/60 text-yellow-950 dark:text-yellow-100 font-medium";
                          }

                          return (
                            <tr key={row.itemId || index} className={rowClass}>
                              <td className="py-3 px-3 text-center font-semibold border-r border-slate-200/60 dark:border-slate-800">
                                {index + 1}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200/60 dark:border-slate-800 font-bold text-center">
                                {row.itemCode}
                              </td>
                              <td className="py-3 px-4 font-semibold border-r border-slate-200/60 dark:border-slate-800">
                                {row.itemName}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200/60 dark:border-slate-800">
                                {row.strength}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200/60 dark:border-slate-800 text-center">
                                {row.unit}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200/60 dark:border-slate-800 text-center">
                                {row.unitCount}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200/60 dark:border-slate-800 text-center font-bold">
                                {Number(row.ai || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200/60 dark:border-slate-800 text-center font-bold">
                                {Number(row.issuedQty || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center font-extrabold">
                                {row.issuePer}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>

                    {/* Summary Footer */}
                    {filteredData.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-400 dark:border-slate-700">
                          <td colSpan="6" className="py-3.5 px-4 text-right border-r border-slate-300 dark:border-slate-700 uppercase tracking-wider text-xs">
                            Grand Total:
                          </td>
                          <td className="py-3.5 px-3 text-center border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-300">
                            {totals.ai.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center border-r border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-300">
                            {totals.issuedQty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center text-rose-700 dark:text-rose-300">
                            {totals.ai > 0 ? (totals.issuedQty / totals.ai * 100).toFixed(2) : '0.00'}%
                          </td>
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
