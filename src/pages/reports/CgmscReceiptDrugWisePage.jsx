import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CalendarIcon,
  ChevronDownIcon,
  XMarkIcon,
  CheckIcon
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

  // Item Search Direct Typeable Combobox States
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemInputValue, setItemInputValue] = useState('');
  const itemComboboxRef = useRef(null);
  const itemInputRef = useRef(null);

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
    setItemInputValue('');
    setDropdownLoading(true);
    try {
      const res = await axios.get('/reports/cgmsc-receipt-drug-wise/items', {
        params: { categoryId: catId }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load category items:', err);
    } finally {
      setDropdownLoading(false);
    }
  };

  // Click outside listener for Item dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (itemComboboxRef.current && !itemComboboxRef.current.contains(e.target)) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize items so each item always has clean itemCode, itemName, and displayName
  const normalizedItems = useMemo(() => {
    return items.map(it => {
      let code = it.itemCode || '';
      let name = it.itemName || '';
      let display = it.displayName || it.itemName || '';

      // If itemCode was not explicitly provided, extract from "CODE - (Name)" or "CODE - Name"
      if (!code && typeof display === 'string') {
        const match = display.match(/^([A-Za-z0-9/_-]+)\s*-\s*(?:\((.*)\)|(.*))$/);
        if (match) {
          code = match[1].trim();
          name = (match[2] || match[3] || '').trim();
        }
      }

      return {
        itemId: String(it.itemId),
        itemCode: code,
        itemName: name || display,
        displayName: display || (code ? `${code} - ${name}` : name)
      };
    });
  }, [items]);

  // Currently selected item object
  const currentSelectedItemObj = useMemo(() => {
    return normalizedItems.find(it => String(it.itemId) === String(selectedItem));
  }, [normalizedItems, selectedItem]);

  // Filter items in dropdown by itemCode OR itemName as user types directly in the input
  const filteredItemList = useMemo(() => {
    const q = itemInputValue.trim().toLowerCase();
    // If the input is empty or equals the currently selected item, show all items
    if (
      !q ||
      q === 'all items' ||
      (currentSelectedItemObj && (
        q === (currentSelectedItemObj.displayName || '').toLowerCase() ||
        q === (currentSelectedItemObj.itemName || '').toLowerCase() ||
        q === `[${(currentSelectedItemObj.itemCode || '').toLowerCase()}] ${(currentSelectedItemObj.itemName || '').toLowerCase()}` ||
        q === `${(currentSelectedItemObj.itemCode || '').toLowerCase()} - ${(currentSelectedItemObj.itemName || '').toLowerCase()}`
      ))
    ) {
      return normalizedItems;
    }
    return normalizedItems.filter(it =>
      (it.itemCode && it.itemCode.toLowerCase().includes(q)) ||
      (it.itemName && it.itemName.toLowerCase().includes(q)) ||
      (it.displayName && it.displayName.toLowerCase().includes(q))
    );
  }, [normalizedItems, itemInputValue, currentSelectedItemObj]);

  // Selection handler
  const handleSelectItem = (it) => {
    if (it === '0' || !it) {
      setSelectedItem('0');
      setItemInputValue('');
    } else {
      setSelectedItem(String(it.itemId));
      setItemInputValue(it.itemCode ? `[${it.itemCode}] ${it.itemName}` : (it.itemName || it.displayName));
    }
    setIsItemDropdownOpen(false);
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
        <thead className="sticky top-0 z-10 shadow-xs bg-slate-50">
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Page Loading Circle when dropdown/header data is loading (Except Header, Sidebar, and Footer) */}
          {dropdownLoading && (
            <div className="absolute inset-0 z-40 bg-slate-100/85 dark:bg-[#0f172a]/85 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all">
              <div className="flex flex-col items-center gap-3.5 px-6 py-5 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Loading Report Filters & Master Data...
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Please wait while warehouses, categories, facilities, and drugs are loaded
                  </p>
                </div>
              </div>
            </div>
          )}

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
              <div className="relative bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                {/* Visible Loading Overlay on Filter Parameters */}
                {dropdownLoading && (
                  <div className="absolute inset-0 z-30 bg-white/80 dark:bg-[#1e293b]/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center transition-all">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                      <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Loading filter options...
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Fetching warehouses, categories, facilities & items
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-base">
                    <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Report Filter Parameters</span>
                    {dropdownLoading && (
                      <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold animate-pulse">
                        <ArrowPathIcon className="w-3 h-3 animate-spin text-blue-600" />
                        Loading filters...
                      </span>
                    )}
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
                      <option value="0" className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">All Warehouses</option>
                      {warehouses.map(wh => (
                        <option key={wh.warehouseId} value={wh.warehouseId} className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">
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
                      <option value="0" className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId} className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Item Name - Direct Typeable Search Field */}
                  <div className="space-y-1.5 lg:col-span-2 relative" ref={itemComboboxRef}>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Item Name
                      </label>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        {selectedItem !== '0' ? '1 Item Selected' : 'Type code or name to search'}
                      </span>
                    </div>

                    {/* Direct Typeable Input Field */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400 pointer-events-none">
                        <MagnifyingGlassIcon className="w-4 h-4" />
                      </div>

                      <input
                        ref={itemInputRef}
                        type="text"
                        value={itemInputValue}
                        onFocus={() => setIsItemDropdownOpen(true)}
                        onClick={() => setIsItemDropdownOpen(true)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemInputValue(val);
                          setIsItemDropdownOpen(true);
                          if (!val.trim()) {
                            setSelectedItem('0');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setIsItemDropdownOpen(false);
                        }}
                        placeholder="All Items (Click or type drug code / name to search...)"
                        disabled={dropdownLoading}
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                      />

                      {selectedItem !== '0' || itemInputValue ? (
                        <button
                          type="button"
                          onClick={() => handleSelectItem('0')}
                          className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Clear Item selection (select All Items)"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsItemDropdownOpen(prev => !prev)}
                          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                        >
                          <ChevronDownIcon
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isItemDropdownOpen ? 'rotate-180 text-blue-600' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Suggestions list directly below the typeable field */}
                    {isItemDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                        {/* Status bar */}
                        <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            {itemInputValue.trim() && selectedItem === '0'
                              ? `Matching ${filteredItemList.length} of ${normalizedItems.length} items`
                              : `Total ${normalizedItems.length} items available`}
                          </span>
                          <span className="text-[10px] text-slate-400">Click item to select</span>
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                          {/* "All Items" Option */}
                          <div
                            onClick={() => handleSelectItem('0')}
                            className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                              selectedItem === '0'
                                ? 'bg-blue-50 dark:bg-blue-950/50 font-bold text-blue-700 dark:text-blue-400'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              <span>All Items</span>
                            </div>
                            {selectedItem === '0' && <CheckIcon className="w-4 h-4 text-blue-600" />}
                          </div>

                          {/* Filtered Drug Items */}
                          {filteredItemList.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                              <p className="font-semibold">No items match "{itemInputValue}"</p>
                              <p className="text-[11px] text-slate-400">Try searching by drug code (e.g. D1001) or drug name</p>
                              <button
                                type="button"
                                onClick={() => handleSelectItem('0')}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                              >
                                Show all items
                              </button>
                            </div>
                          ) : (
                            filteredItemList.map((it) => {
                              const isSelected = String(selectedItem) === String(it.itemId);
                              return (
                                <div
                                  key={it.itemId}
                                  onClick={() => handleSelectItem(it)}
                                  className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                                    isSelected
                                      ? 'bg-blue-50 dark:bg-blue-950/60 font-semibold text-blue-900 dark:text-blue-300'
                                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                                    {it.itemCode && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                        {it.itemCode}
                                      </span>
                                    )}
                                    <span className="truncate">
                                      {it.itemName || it.displayName}
                                    </span>
                                  </div>
                                  {isSelected && <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
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
                      <option value="0" className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">All Facilities</option>
                      {facilities.map(fac => (
                        <option key={fac.facilityId} value={fac.facilityId} className="text-slate-900 bg-white dark:text-slate-100 dark:bg-slate-800">
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
              <div className="relative bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Table Loading Circle Overlay when Generating Report */}
                {loading && (
                  <div className="absolute inset-0 z-30 bg-white/80 dark:bg-slate-900/85 backdrop-blur-[2px] flex flex-col items-center justify-center min-h-[260px] transition-all">
                    <div className="flex flex-col items-center gap-3.5 px-6 py-5 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                      <div className="w-11 h-11 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Fetching Facility Requests and Receipts...
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Querying warehouse issues, facility receipts, and duration
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search & Header Bar above Table */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Facility Requests and Receipts List
                    </h3>
                    {loading && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold animate-pulse inline-flex items-center gap-1.5">
                        <ArrowPathIcon className="w-3 h-3 animate-spin text-blue-600" />
                        Loading...
                      </span>
                    )}
                    {!loading && filteredData.length > 0 && (
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
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-xs bg-slate-50">
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
                          <td colSpan="16" className="py-14 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="w-9 h-9 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Fetching Facility Requests and Receipts...
                              </span>
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
