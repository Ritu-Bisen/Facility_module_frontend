import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import {
  getNocSummaryFinYears,
  getNocSummaryMedicalColleges,
  getNocSummaryReport
} from '../../api/localPurchaseApi';
import { useAuth } from '../../hooks/useAuth';
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  TableCellsIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function NocLpDetailsPage() {
  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [medicalColleges, setMedicalColleges] = useState([]);

  const [selectedFinYear, setSelectedFinYear] = useState('0');
  const [selectedCollege, setSelectedCollege] = useState('0');
  const [yearRangeText, setYearRangeText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  // Load dropdown options on mount
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [fyRes, mcRes] = await Promise.all([
          getNocSummaryFinYears(),
          getNocSummaryMedicalColleges()
        ]);

        if (fyRes.success && Array.isArray(fyRes.data)) {
          setFinYears(fyRes.data);
          if (fyRes.data.length > 0) {
            setSelectedFinYear(String(fyRes.data[0].accyrsetid));
            setYearRangeText(`${fyRes.data[0].startdate}  TO  ${fyRes.data[0].enddate}`);
          }
        }

        if (mcRes.success && Array.isArray(mcRes.data)) {
          setMedicalColleges(mcRes.data);
          const userFacId = user?.facilityId ? String(user.facilityId) : null;
          const userMatching = mcRes.data.find(m => String(m.facilityId) === userFacId);
          if (userMatching) {
            setSelectedCollege(String(userMatching.facilityId));
          } else if (mcRes.data.length > 0) {
            setSelectedCollege(String(mcRes.data[0].facilityId));
          }
        }
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
        setError('Failed to load financial years or medical college options');
      }
    }

    loadDropdowns();
  }, [user]);

  // Handle Fin Year dropdown change
  const handleFinYearChange = (e) => {
    const val = e.target.value;
    setSelectedFinYear(val);
    const found = finYears.find(f => String(f.accyrsetid) === String(val));
    if (found) {
      setYearRangeText(`${found.startdate}  TO  ${found.enddate}`);
    } else {
      setYearRangeText('');
    }
  };

  // Fetch Report Data
  const handleShowReport = async () => {
    if (selectedFinYear === '0' || !selectedFinYear) {
      alert('Please select a Financial Year');
      return;
    }
    if (selectedCollege === '0' || !selectedCollege) {
      alert('Please select a Medical College');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const res = await getNocSummaryReport(selectedFinYear, selectedCollege);
      if (res.success && Array.isArray(res.data)) {
        setReportData(res.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error('Error fetching NOC summary report:', err);
      setError('Failed to fetch NOC summary report from database');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered rows for client search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter(row =>
      (row.itemCode && row.itemCode.toLowerCase().includes(q)) ||
      (row.itemName && row.itemName.toLowerCase().includes(q)) ||
      (row.categoryName && row.categoryName.toLowerCase().includes(q)) ||
      (row.strength && row.strength.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No records available to export');
      return;
    }

    let tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
            <th>S.No</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Strength</th>
            <th>Unit</th>
            <th>Medical College Indent QTY (SKU)</th>
            <th>CGMSC Issue QTY (SKU)</th>
            <th>NOC QTY (SKU)</th>
            <th>PO Qty (SKU)</th>
            <th>PO Value (INR)</th>
            <th>Receipt Qty (SKU)</th>
            <th>Receipt Value (INR)</th>
            <th>Category Name</th>
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
          <td style="text-align: right;">${row.indentQty || 0}</td>
          <td style="text-align: right;">${row.issueQty || 0}</td>
          <td style="text-align: right;">${row.nocQty || 0}</td>
          <td style="text-align: right;">${row.poSku || 0}</td>
          <td style="text-align: right;">${row.poValue ? row.poValue.toFixed(2) : '0.00'}</td>
          <td style="text-align: right;">${row.receiptQtySku || 0}</td>
          <td style="text-align: right;">${row.receiptValue ? row.receiptValue.toFixed(2) : '0.00'}</td>
          <td>${row.categoryName || ''}</td>
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NOC_LP_Details_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compute Totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      acc.indentQty += Number(row.indentQty) || 0;
      acc.issueQty += Number(row.issueQty) || 0;
      acc.nocQty += Number(row.nocQty) || 0;
      acc.poSku += Number(row.poSku) || 0;
      acc.poValue += Number(row.poValue) || 0;
      acc.receiptQtySku += Number(row.receiptQtySku) || 0;
      acc.receiptValue += Number(row.receiptValue) || 0;
      return acc;
    }, { indentQty: 0, issueQty: 0, nocQty: 0, poSku: 0, poValue: 0, receiptQtySku: 0, receiptValue: 0 });
  }, [filteredData]);

  const selectedCollegeName = useMemo(() => {
    const found = medicalColleges.find(m => String(m.facilityId) === String(selectedCollege));
    return found ? found.facilityName : 'Medical College';
  }, [medicalColleges, selectedCollege]);

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-[98%] mx-auto space-y-6">

              {/* Top Banner Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a6a] rounded-2xl shadow-lg p-6 text-white border border-slate-700/50">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform origin-top-right"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                      <TableCellsIcon className="w-4 h-4" />
                      <span>Local Purchase & Distribution</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                      NOC / LP Details
                    </h1>
                    <p className="text-xs md:text-sm text-slate-300 max-w-xl">
                      Summary report of Medical College Indents, NOC approvals, PO SKUs, and Receipt details.
                    </p>
                  </div>

                  {/* Summary Stat Badges */}
                  {reportData.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                      <div className="text-center px-2">
                        <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-medium">Items</span>
                        <span className="text-lg font-bold text-white">{filteredData.length}</span>
                      </div>
                      <div className="text-center px-2 border-l border-white/10">
                        <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-medium">Total NOC SKU</span>
                        <span className="text-lg font-bold text-emerald-300">{totals.nocQty.toLocaleString()}</span>
                      </div>
                      <div className="text-center px-2 border-l border-white/10">
                        <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-medium">PO Value</span>
                        <span className="text-lg font-bold text-amber-300">₹{(totals.poValue / 100000).toFixed(2)}L</span>
                      </div>
                      <div className="text-center px-2 border-l border-white/10">
                        <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-medium">Receipt Value</span>
                        <span className="text-lg font-bold text-cyan-300">₹{(totals.receiptValue / 100000).toFixed(2)}L</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Controls Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-base">
                    <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Select Parameters</span>
                  </div>
                  {yearRangeText && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{yearRangeText}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                  {/* Select Finyear */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Financial Year <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <select
                        value={selectedFinYear}
                        onChange={handleFinYearChange}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                      >
                        <option value="0">-- Select Fin Year --</option>
                        {finYears.map(fy => (
                          <option key={fy.accyrsetid} value={fy.accyrsetid}>
                            {fy.accyear} ({fy.startdate} - {fy.enddate})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select Medical College */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Medical College <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <BuildingOffice2Icon className="w-4 h-4" />
                      </div>
                      <select
                        value={selectedCollege}
                        onChange={(e) => setSelectedCollege(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                      >
                        <option value="0">-- Select Medical College --</option>
                        {medicalColleges.map(mc => (
                          <option key={mc.facilityId} value={mc.facilityId}>
                            {mc.facilityName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <button
                      onClick={handleShowReport}
                      disabled={loading}
                      className="flex-1 py-2.5 px-5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-700/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                          <span>Show</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportExcel}
                      disabled={reportData.length === 0}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title="Export table data to Excel"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Excel</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Error Notification */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Table Container Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Search & Header Bar above Table */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                      {selectedCollegeName}
                    </h3>
                    {filteredData.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        {filteredData.length} records
                      </span>
                    )}
                  </div>

                  {/* Filter Search Input */}
                  <div className="relative w-full md:w-72">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search code, name, category..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Table Data View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-200 font-bold text-center uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-3 border-r border-slate-800 w-12">S.No</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">Item Code</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-left">Item Name</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">Strength</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">Unit</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">Medical College Indent QTY</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">CGMSC Issue QTY</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right text-emerald-400">NOC QTY (SKU)</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">PO Qty (SKU)</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">PO Value (INR)</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">Receipt Qty (SKU)</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">Receipt Value (INR)</th>
                        <th className="py-3.5 px-3 text-left">Category Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="13" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-blue-600" />
                              <span className="text-sm font-medium">Fetching NOC/LP details from database...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="13" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {hasSearched ? 'No records match your selected parameters' : 'Select Financial Year and Medical College, then click "Show"'}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, index) => (
                          <tr
                            key={index}
                            className="hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200"
                          >
                            <td className="py-3 px-3 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                              {index + 1}
                            </td>
                            <td className="py-3 px-3 font-bold text-blue-700 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800">
                              {row.itemCode}
                            </td>
                            <td className="py-3 px-4 font-semibold border-r border-slate-100 dark:border-slate-800 min-w-[200px]">
                              {row.itemName}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                              {row.strength || '-'}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-medium">
                              {row.unit || '-'}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium text-slate-700 dark:text-slate-300">
                              {row.indentQty?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium text-slate-700 dark:text-slate-300">
                              {row.issueQty?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {row.nocQty?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium text-slate-700 dark:text-slate-300">
                              {row.poSku?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-semibold text-amber-700 dark:text-amber-400">
                              ₹{row.poValue ? row.poValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium text-slate-700 dark:text-slate-300">
                              {row.receiptQtySku?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-semibold text-cyan-700 dark:text-cyan-400">
                              ₹{row.receiptValue ? row.receiptValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                              {row.categoryName || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Summary Footer */}
                    {filteredData.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                          <td colSpan="5" className="py-3.5 px-4 text-right border-r border-slate-300 dark:border-slate-700 uppercase tracking-wider text-xs">
                            Grand Total:
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700">
                            {totals.indentQty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700">
                            {totals.issueQty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                            {totals.nocQty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700">
                            {totals.poSku.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-400">
                            ₹{totals.poValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700">
                            {totals.receiptQtySku.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-400">
                            ₹{totals.receiptValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
