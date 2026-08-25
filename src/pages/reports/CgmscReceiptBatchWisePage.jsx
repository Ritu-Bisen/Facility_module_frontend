import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import {
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function CgmscReceiptBatchWisePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState('0');
  const [selectedFacility, setSelectedFacility] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [selectedItem, setSelectedItem] = useState('0');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Set default dates (From 1st of current month to today)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const formatDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFromDate(formatDateStr(firstDay));
    setToDate(formatDateStr(now));
  }, []);

  // Load initial dropdown options
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/reports/cgmsc-receipt-drug-wise/dropdowns');
        if (res.data?.success && res.data.data) {
          const { warehouses = [], categories = [], facilities = [], items = [] } = res.data.data;
          setWarehouses(warehouses);
          setCategories(categories);
          setFacilities(facilities);
          setItems(items);
        }
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
        setError('Failed to load dropdown filters');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadDropdowns();
  }, []);

  // When category changes, reload items for selected category
  const handleCategoryChange = async (e) => {
    const catId = e.target.value;
    setSelectedCategory(catId);
    setSelectedItem('0');
    try {
      const res = await axios.get('/reports/cgmsc-receipt-drug-wise/items', {
        params: { categoryId: catId }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load category items:', err);
    }
  };

  // Generate Report
  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      setError('Warehouse Issued From Date and To Date should not be blank');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await axios.get('/reports/cgmsc-receipt-batch-wise', {
        params: {
          warehouseId: selectedWarehouse,
          targetFacilityId: selectedFacility,
          categoryId: selectedCategory,
          itemId: selectedItem,
          fromDate,
          toDate
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReportData(res.data.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error('Failed to fetch Receipt From CGMSC - Batchwise & Values:', err);
      setError('Failed to fetch report data from server');
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
      (row.batchNo && row.batchNo.toLowerCase().includes(q)) ||
      (row.facilityName && row.facilityName.toLowerCase().includes(q)) ||
      (row.warehouseName && row.warehouseName.toLowerCase().includes(q)) ||
      (row.programName && row.programName.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Compute Totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      acc.whIssued += Number(row.whIssued) || 0;
      acc.receivedValue += Number(row.receivedValue) || 0;
      return acc;
    }, { whIssued: 0, receivedValue: 0 });
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
          <tr style="background-color: #15803d; color: #ffffff; font-weight: bold;">
            <th>Sl. No.</th>
            <th>Warehouse Name</th>
            <th>Facility Name</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Strength</th>
            <th>SKU</th>
            <th>BatchNo</th>
            <th>Receipt Qty</th>
            <th>CGMSC Issue Date</th>
            <th>Programname</th>
            <th>Final Rate</th>
            <th>Receipt Value</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredData.forEach((row, index) => {
      tableHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${row.warehouseName || ''}</td>
          <td>${row.facilityName || ''}</td>
          <td>${row.itemCode || ''}</td>
          <td>${row.itemName || ''}</td>
          <td>${row.strength || ''}</td>
          <td>${row.unit || ''}</td>
          <td>${row.batchNo || ''}</td>
          <td style="text-align: right;">${row.whIssued || 0}</td>
          <td>${row.issueDate || ''}</td>
          <td>${row.programName || ''}</td>
          <td style="text-align: right;">${row.finalRate ? Number(row.finalRate).toFixed(2) : '0.00'}</td>
          <td style="text-align: right;">${row.receivedValue ? Number(row.receivedValue).toFixed(2) : '0.00'}</td>
        </tr>
      `;
    });

    tableHtml += `
          <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td colspan="8" style="text-align: right;">Grand Total:</td>
            <td style="text-align: right;">${totals.whIssued}</td>
            <td colspan="3"></td>
            <td style="text-align: right;">${totals.receivedValue.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_From_CGMSC_Batchwise_and_Values_${new Date().toISOString().slice(0,10)}.xls`;
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

              {/* Banner Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 rounded-2xl shadow-lg p-6 text-white border border-emerald-800/40">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                      <TableCellsIcon className="w-4 h-4" />
                      <span>Reports & Analytics</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                      Receipt From CGMSC-Batchwise & Values
                    </h1>
                    <p className="text-xs md:text-sm text-slate-300">
                      Batch-wise receipt report with unit rates, program details, and total receipt monetary values.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportExcel}
                      disabled={filteredData.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Excel Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters Panel matching ASP.NET WebForm */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-base">
                    <FunnelIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Report Filter Parameters</span>
                  </div>
                </div>

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Warehouse */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Warehouse
                    </label>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                    >
                      <option value="0">All Warehouses</option>
                      {warehouses.map(wh => (
                        <option key={wh.warehouseId} value={wh.warehouseId}>
                          {wh.warehouseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Facility */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Facility
                    </label>
                    <select
                      value={selectedFacility}
                      onChange={(e) => setSelectedFacility(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                    >
                      <option value="0">All Facilities</option>
                      {facilities.map(fac => (
                        <option key={fac.facilityId} value={fac.facilityId}>
                          {fac.facilityName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                    >
                      <option value="0">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Item */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Item
                    </label>
                    <select
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                    >
                      <option value="0">All Items</option>
                      {items.map(item => (
                        <option key={item.itemId} value={item.itemId}>
                          {item.itemName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Warehouse Issued From Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Warehouse Issued From Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                    />
                  </div>

                  {/* Warehouse Issued To Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Warehouse Issued To Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Generate Button Row */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="px-8 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                        <span>Generating Report...</span>
                      </>
                    ) : (
                      <span>Generate</span>
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
                      Receipt From CGMSC-Batchwise & Values List
                    </h3>
                    {filteredData.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
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
                      placeholder="Search batch, code, item, facility..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-200 font-bold text-center uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-3 border-r border-slate-800 w-12">Sl. No.</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">Warehouse Name</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-left">Facility Name</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">Item Code</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-left">Item Name</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">Strength</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">SKU</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-emerald-400">BatchNo</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">Receipt Qty</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">CGMSC Issue Date</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-left">Programname</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">Final Rate</th>
                        <th className="py-3.5 px-3 text-right text-emerald-400">Receipt Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="13" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-emerald-600" />
                              <span className="text-sm font-medium">Fetching Batchwise Receipt Data...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="13" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {hasSearched ? 'No records match your selected parameters' : 'Select dates and click "Generate"'}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, index) => (
                          <tr
                            key={index}
                            className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200"
                          >
                            <td className="py-3 px-3 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                              {index + 1}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-medium">
                              {row.warehouseName}
                            </td>
                            <td className="py-3 px-4 font-medium border-r border-slate-100 dark:border-slate-800 min-w-[160px]">
                              {row.facilityName}
                            </td>
                            <td className="py-3 px-3 font-bold text-blue-700 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800 text-center">
                              {row.itemCode}
                            </td>
                            <td className="py-3 px-4 font-semibold border-r border-slate-100 dark:border-slate-800 min-w-[180px]">
                              {row.itemName}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                              {row.strength}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              {row.unit}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {row.batchNo}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium">
                              {row.whIssued?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center">
                              {row.issueDate}
                            </td>
                            <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                              {row.programName}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-semibold">
                              ₹{Number(row.finalRate || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                              ₹{Number(row.receivedValue || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Summary Footer */}
                    {filteredData.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                          <td colSpan="8" className="py-3.5 px-4 text-right border-r border-slate-300 dark:border-slate-700 uppercase tracking-wider text-xs">
                            Grand Total:
                          </td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">
                            {totals.whIssued.toLocaleString()}
                          </td>
                          <td colSpan="3" className="border-r border-slate-300 dark:border-slate-700"></td>
                          <td className="py-3.5 px-3 text-right text-emerald-700 dark:text-emerald-400 text-sm">
                            ₹{totals.receivedValue.toFixed(2)}
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
