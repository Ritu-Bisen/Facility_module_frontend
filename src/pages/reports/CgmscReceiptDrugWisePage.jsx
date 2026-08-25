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
  FunnelIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  SparklesIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function CgmscReceiptDrugWisePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [selectedItem, setSelectedItem] = useState('0');
  const [selectedFacility, setSelectedFacility] = useState('0');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

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
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await axios.get('/reports/cgmsc-receipt-drug-wise', {
        params: {
          warehouseId: selectedWarehouse,
          categoryId: selectedCategory,
          itemId: selectedItem,
          targetFacilityId: selectedFacility,
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
      console.error('Failed to fetch Facility Requests and Receipts:', err);
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
      (row.facilityName && row.facilityName.toLowerCase().includes(q)) ||
      (row.warehouseName && row.warehouseName.toLowerCase().includes(q)) ||
      (row.districtName && row.districtName.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Compute Totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      acc.reqQty += Number(row.reqQty) || 0;
      acc.issuedQty += Number(row.issuedQty) || 0;
      return acc;
    }, { reqQty: 0, issuedQty: 0 });
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
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
            <th>Sl.No.</th>
            <th>Warehouse</th>
            <th>ItemCode</th>
            <th>Itemname</th>
            <th>Strength</th>
            <th>Facility Name</th>
            <th>District</th>
            <th>Request Date</th>
            <th>Request QTY</th>
            <th>Indent Id</th>
            <th>CGMSC Issue Date</th>
            <th>Receipt QTY</th>
            <th>Fac Receipt Date</th>
            <th>Unit Count</th>
            <th>Days Taken to be Receipt</th>
            <th>SKU</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredData.forEach((row, index) => {
      tableHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${row.warehouseName || ''}</td>
          <td>${row.itemCode || ''}</td>
          <td>${row.itemName || ''}</td>
          <td>${row.strength || ''}</td>
          <td>${row.facilityName || ''}</td>
          <td>${row.districtName || ''}</td>
          <td>${row.reqDate || ''}</td>
          <td style="text-align: right;">${row.reqQty || 0}</td>
          <td>${row.indentId || ''}</td>
          <td>${row.issueDate || ''}</td>
          <td style="text-align: right;">${row.issuedQty || 0}</td>
          <td>${row.facReceiptDate || ''}</td>
          <td style="text-align: center;">${row.unitCount || 1}</td>
          <td style="text-align: center;">${row.daysToReceipt || 0}</td>
          <td>${row.sku || ''}</td>
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
    a.download = `Facility_Requests_and_Receipts_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-[98%] mx-auto space-y-6">

              {/* Banner Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a6a] rounded-2xl shadow-lg p-6 text-white border border-slate-700/50">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                      <TableCellsIcon className="w-4 h-4" />
                      <span>Reports & Analytics</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                      Facility Requests and Receipts
                    </h1>
                    <p className="text-xs md:text-sm text-slate-300">
                      Receipt from CGMSC - Drug wise report displaying facility requests, warehouse issuances, receipt quantities, and transit duration.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportExcel}
                      disabled={filteredData.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      title="To download click on excel button"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Excel Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Parameters Filter Form Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-base">
                    <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Report Filter Parameters</span>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    To download click on excel button
                  </span>
                </div>

                {/* Filter Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Warehouse Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Warehousename
                    </label>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">All Warehouses</option>
                      {warehouses.map(wh => (
                        <option key={wh.warehouseId} value={wh.warehouseId}>
                          {wh.warehouseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Item Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Select Item Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Item Name */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Item Name
                    </label>
                    <select
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">All Items</option>
                      {items.map(item => (
                        <option key={item.itemId} value={item.itemId}>
                          {item.itemName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Facility Name */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Facility Name
                    </label>
                    <select
                      value={selectedFacility}
                      onChange={(e) => setSelectedFacility(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    >
                      <option value="0">All Facilities</option>
                      {facilities.map(fac => (
                        <option key={fac.facilityId} value={fac.facilityId}>
                          {fac.facilityName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WH Issue From Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      WH Issue From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    />
                  </div>

                  {/* To Date */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Generate Button Row */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-700/20 hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                        <span>Generating Report...</span>
                      </>
                    ) : (
                      <span>GENERATE</span>
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

              {/* Table Data View Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Search & Header Bar above Table */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Facility Requests and Receipts List
                    </h3>
                    {filteredData.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
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
                      placeholder="Search code, item, facility..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-200 font-bold text-center uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-3 border-r border-slate-800 w-12">Sl.No.</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">Warehouse</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">ItemCode</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-left">Itemname</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">Strength</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-left">Facility Name</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-left">District</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">Request Date</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right">Request QTY</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">Indent Id</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">CGMSC Issue Date</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-right text-emerald-400">Receipt QTY</th>
                        <th className="py-3.5 px-3 border-r border-slate-800">Fac Receipt Date</th>
                        <th className="py-3.5 px-2 border-r border-slate-800 text-center">Unit Count</th>
                        <th className="py-3.5 px-3 border-r border-slate-800 text-center">Days Taken to be Receipt</th>
                        <th className="py-3.5 px-3">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="16" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-blue-600" />
                              <span className="text-sm font-medium">Fetching Facility Requests and Receipts...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="16" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {hasSearched ? 'No records match your selected parameters' : 'Select parameters and click "GENERATE"'}
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
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-medium">
                              {row.warehouseName}
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
                            <td className="py-3 px-4 font-medium border-r border-slate-100 dark:border-slate-800 min-w-[160px]">
                              {row.facilityName}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-600 dark:text-slate-400">
                              {row.districtName}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center">
                              {row.reqDate}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-medium text-slate-700 dark:text-slate-300">
                              {row.reqQty?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                              {row.indentId}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center">
                              {row.issueDate}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {row.issuedQty?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center">
                              {row.facReceiptDate}
                            </td>
                            <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-center">
                              {row.unitCount}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-center font-semibold">
                              {row.daysToReceipt > 0 ? `${row.daysToReceipt} days` : '-'}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                              {row.sku}
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
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-400">
                            {totals.reqQty.toLocaleString()}
                          </td>
                          <td colSpan="2" className="border-r border-slate-300 dark:border-slate-700"></td>
                          <td className="py-3.5 px-3 text-right border-r border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                            {totals.issuedQty.toLocaleString()}
                          </td>
                          <td colSpan="4"></td>
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
