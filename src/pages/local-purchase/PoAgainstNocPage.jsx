import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  getPoAgainstNocCategories,
  getPoAgainstNocReport
} from '../../api/localPurchaseApi';
import {
  TableCellsIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function PoAgainstNocPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');

  // Dates in YYYY-MM-DD format for HTML date inputs
  const [fromDate, setFromDate] = useState('2025-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getPoAgainstNocCategories();
      if (res && res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load item categories:', err);
    }
  };

  const formatDateToDDMMYYYY = (isoDateStr) => {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDateStr;
  };

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please Select From & To NOC Date');
      return;
    }

    setLoading(true);
    setHasGenerated(true);

    try {
      const formattedFrom = formatDateToDDMMYYYY(fromDate);
      const formattedTo = formatDateToDDMMYYYY(toDate);

      const res = await getPoAgainstNocReport({
        categoryId: selectedCategory,
        fromDate: formattedFrom,
        toDate: formattedTo
      });

      if (res && res.success && Array.isArray(res.data)) {
        setReportData(res.data);
        toast.success(`Loaded ${res.data.length} NOC records`);
      } else {
        setReportData([]);
        toast.error('Failed to fetch report data');
      }
    } catch (err) {
      console.error('Generate PO Against NOC report error:', err);
      toast.error('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const excelRows = reportData.map((row, idx) => ({
      'Sl.No.': idx + 1,
      'Category': row.categoryname || '',
      'NOC Code': row.itemcode || '',
      'Item': row.itemname || '',
      'Strength': row.strength1 || '',
      'NOC Number': row.nocno || '',
      'NOC Date': row.nocdate || '',
      'NOC Qty': row.NocQty || 0,
      'LP Supplier': row.suppliername || '',
      'Tender No': row.tenderno || '',
      'Tender Description': row.tenderdesc || '',
      'PO Qty': row.poqty || 0,
      'PO Date': row.POdate || '',
      'LP Code': row.lpitemcode || '',
      'Fund Head': row.BUDGETNAME || '',
      'LP Rate': row.singleunitprice || 0,
      'Received Qty': row.receiptqty || 0,
      'Received DT': row.RDate || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PO Against NOC');
    XLSX.writeFile(workbook, 'PO_Against_NOC.xlsx');
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full flex flex-col min-h-full shadow-sm border border-slate-200/60 rounded-xl overflow-hidden bg-white">
              
              {/* Header Title Banner */}
              <div className="bg-slate-100 border-b border-slate-200 py-3.5 px-4 text-center">
                <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-wide">
                  Local Purchase Order & Receipts against Received NOC
                </h1>
              </div>

              {/* Form Filter Panel */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-200">
                <div className="max-w-3xl mx-auto space-y-4">
                  
                  {/* Category Dropdown */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <label className="font-bold text-xs text-slate-700 whitespace-nowrap">
                      Select Item Category:
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-80 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                    >
                      <option value="0">All</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dates Row */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <label className="font-bold">From NOC date:</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="font-bold">To NOC Date:</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="text-center pt-2">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold text-xs tracking-wider rounded-md uppercase transition shadow-sm inline-flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        'GENERATE'
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* Export Control Toolbar */}
              <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200 transition shadow-sm"
                  title="Export to Excel"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-blue-600 font-semibold text-[11px]">To download click on excel button</span>
                </button>

                <div className="text-xs text-slate-500 font-medium">
                  {hasGenerated && `Total Records: ${reportData.length}`}
                </div>
              </div>

              {/* Data Table Area (gvReport) */}
              <div className="flex-1 overflow-auto p-4 bg-white">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading PO Against NOC Report...</p>
                  </div>
                ) : !hasGenerated ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <TableCellsIcon className="w-12 h-12 mb-2 text-slate-300" />
                    <p className="text-xs font-bold uppercase tracking-wider">Select filters and click GENERATE to view report</p>
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <FunnelIcon className="w-12 h-12 mb-2 text-slate-300" />
                    <p className="text-xs font-bold uppercase tracking-wider">No records found for selected criteria</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                      <thead className="bg-[#0f172a] text-slate-100 uppercase tracking-wider text-[11px] font-bold">
                        <tr className="divide-x divide-slate-800">
                          <th className="px-3 py-3 text-center w-12">Sl.No.</th>
                          <th className="px-3 py-3">Category</th>
                          <th className="px-3 py-3">NOC Code</th>
                          <th className="px-3 py-3">Item</th>
                          <th className="px-3 py-3">Strength</th>
                          <th className="px-3 py-3">NOC Number</th>
                          <th className="px-3 py-3 text-center">NOC Date</th>
                          <th className="px-3 py-3 text-right">NOC Qty</th>
                          <th className="px-3 py-3">LP Supplier</th>
                          <th className="px-3 py-3">Tender No</th>
                          <th className="px-3 py-3">Tender Description</th>
                          <th className="px-3 py-3 text-right">PO Qty</th>
                          <th className="px-3 py-3 text-center">PO Date</th>
                          <th className="px-3 py-3">LP Code</th>
                          <th className="px-3 py-3">Fund Head</th>
                          <th className="px-3 py-3 text-right">LP Rate (₹)</th>
                          <th className="px-3 py-3 text-right">Received Qty</th>
                          <th className="px-3 py-3 text-center">Received DT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-800 bg-white">
                        {reportData.map((row, idx) => (
                          <tr key={row.nocid || idx} className="divide-x divide-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-700">{row.categoryname}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{row.itemcode}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-900">{row.itemname}</td>
                            <td className="px-3 py-2.5 text-slate-600">{row.strength1}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">{row.nocno}</td>
                            <td className="px-3 py-2.5 text-center text-slate-600">{row.nocdate}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.NocQty}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">{row.suppliername}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">{row.tenderno}</td>
                            <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{row.tenderdesc}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.poqty}</td>
                            <td className="px-3 py-2.5 text-center text-slate-600">{row.POdate}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-600">{row.lpitemcode}</td>
                            <td className="px-3 py-2.5 text-slate-700 font-semibold">{row.BUDGETNAME}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.singleunitprice}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">{row.receiptqty}</td>
                            <td className="px-3 py-2.5 text-center text-slate-600">{row.RDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
