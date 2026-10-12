import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  LockClosedIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentChartBarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

export default function CreateAnnualIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFinYear = searchParams.get('finYearId');
  const urlIndentId = searchParams.get('indentId');
  const isDh = searchParams.get('isDh') === 'true';

  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState(urlFinYear || '547');

  const [headerInfo, setHeaderInfo] = useState({
    indentId: urlIndentId ? Number(urlIndentId) : 0,
    indentNo: 'AUTO GENERATED',
    indentDate: 'System Generated',
    status: 'N',
    categoryId: 0,
    categoryName: '',
    exists: false
  });

  const [headerEditMode, setHeaderEditMode] = useState(!urlIndentId);

  const [items, setItems] = useState([]);
  const [noOfItems, setNoOfItems] = useState(0);
  const [aproxIndentValue, setAproxIndentValue] = useState('0.00');

  // Compute summary count and total value dynamically from loaded items
  const calculatedNoOfItems = useMemo(() => {
    const valid = items.filter(r => Number(r.facilityIndentQty || 0) > 0);
    return valid.length > 0 ? valid.length : (noOfItems || 0);
  }, [items, noOfItems]);

  const calculatedAproxIndentValue = useMemo(() => {
    const totalRupees = items.reduce((sum, r) => {
      const qty = Number(r.facilityIndentQty) || 0;
      const rate = Number(r.rate) || 0;
      return sum + (qty * rate);
    }, 0);

    if (totalRupees <= 0) return aproxIndentValue || '0.00';

    const crVal = totalRupees / 10000000;
    if (crVal >= 0.01) {
      return crVal.toFixed(2);
    } else {
      return crVal.toFixed(4);
    }
  }, [items, aproxIndentValue]);

  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Editing row state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    consumption: 0,
    actualConsumption: 0,
    projectedConsumption: 0,
    currentStock: 0,
    facilityIndentQty: 0,
    rate: 0
  });

  // Excel upload file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Determine back navigation path
  const backUrl = isDh || ['364', '378', '368'].includes(String(user?.facilityTypeId || ''))
    ? '/annual-indent/upload-forward-dh'
    : '/annual-indent/upload-forward';

  // Fetch Financial Years on Mount
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const fyRes = await axios.get('/annual-indent/upload-forward/fin-years');
        if (fyRes.data?.success && Array.isArray(fyRes.data.data)) {
          setFinYears(fyRes.data.data);
          if (fyRes.data.data.length > 0) {
            const currentFy = fyRes.data.data.find(fy => fy.isCurrent);
            const defaultId = currentFy ? currentFy.accYrSetId : fyRes.data.data[0].accYrSetId;
            setSelectedFinYear(urlFinYear || String(defaultId));
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadDropdowns();
  }, [urlFinYear]);

  // Fetch Header and Items when Financial Year changes
  useEffect(() => {
    if (!selectedFinYear) return;
    loadIndentData();
  }, [selectedFinYear]);

  const loadIndentData = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      // 1. Fetch Header Info
      const headRes = await axios.get('/annual-indent/create/header', {
        params: {
          finYearId: selectedFinYear,
          indentId: urlIndentId || 0
        }
      });
      let currentHeader = {
        indentId: 0,
        indentNo: 'AUTO GENERATED',
        indentDate: 'System Generated',
        status: 'N',
        categoryId: 0,
        categoryName: '',
        exists: false
      };
      if (headRes.data?.success && headRes.data.data) {
        currentHeader = headRes.data.data;
        setHeaderInfo(currentHeader);
        if (currentHeader.exists) {
          setHeaderEditMode(false);
        } else {
          setHeaderEditMode(true);
        }
      }

      // 2. Fetch Items Grid
      const itemsRes = await axios.get('/annual-indent/create/items', {
        params: {
          finYearId: selectedFinYear,
          indentId: currentHeader.indentId || 0
        }
      });

      if (itemsRes.data?.success && itemsRes.data.data) {
        setItems(itemsRes.data.data.items || []);
        setNoOfItems(itemsRes.data.data.noOfItems || 0);
        setAproxIndentValue(itemsRes.data.data.aproxIndentValue || '0.00');
      }
    } catch (err) {
      console.error('Failed to load Annual Indent data:', err);
      setError('Failed to load Annual Indent data');
    } finally {
      setLoading(false);
    }
  };

  // Generate Indent Header Handler (lbtnUpdateSOInfo_Click)
  const handleGenerateHeader = async () => {
    setGenerating(true);
    setLoading(true);
    setMsg('');
    setError('');

    try {
      const res = await axios.post('/annual-indent/create/generate-header', {
        finYearId: selectedFinYear
      });
      if (res.data?.success && res.data.data) {
        const newHeader = res.data.data;
        setHeaderInfo(newHeader);
        setHeaderEditMode(false);
        setMsg('Annual Indent No Generated Successfully');

        // Fetch Items Grid for Newly Generated Header
        const itemsRes = await axios.get('/annual-indent/create/items', {
          params: {
            finYearId: selectedFinYear,
            indentId: newHeader.indentId || 0
          }
        });
        if (itemsRes.data?.success && itemsRes.data.data) {
          setItems(itemsRes.data.data.items || []);
          setNoOfItems(itemsRes.data.data.noOfItems || 0);
          setAproxIndentValue(itemsRes.data.data.aproxIndentValue || '0.00');
        }
      }
    } catch (err) {
      console.error('Failed to generate indent header:', err);
      alert('Failed to generate annual indent header');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  // Upload Excel Handler (btnupload_Click)
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please browse file');
      return;
    }

    setUploading(true);
    setMsg('');
    setError('');

    try {
      // 1. Ensure we have an Indent Header generated first
      let activeIndentId = headerInfo.indentId;
      if (!activeIndentId || activeIndentId === 0) {
        const genRes = await axios.post('/annual-indent/create/generate-header', {
          finYearId: selectedFinYear
        });
        if (genRes.data?.success && genRes.data.data) {
          activeIndentId = genRes.data.data.indentId;
          setHeaderInfo(genRes.data.data);
          setHeaderEditMode(false);
        } else {
          alert('Please Generate Ai No First then Upload File.');
          setUploading(false);
          return;
        }
      }

      // 2. Read and Parse Excel File using XLSX
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const parsedRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!parsedRows || parsedRows.length === 0) {
        alert('The uploaded Excel file appears to be empty.');
        setUploading(false);
        return;
      }

      // Helper function to extract numeric values matching column patterns
      const getRowValue = (row, keyPatterns, defaultVal = 0) => {
        const rowKeys = Object.keys(row);
        for (const pattern of keyPatterns) {
          if (row[pattern] !== undefined && row[pattern] !== null && row[pattern] !== '') {
            const num = Number(row[pattern]);
            if (!isNaN(num)) return num;
          }
          const normPattern = pattern.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          const matchedKey = rowKeys.find(k => k.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_') === normPattern);
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
            const num = Number(row[matchedKey]);
            if (!isNaN(num)) return num;
          }
        }
        return defaultVal;
      };

      const getItemCode = (row) => {
        const rowKeys = Object.keys(row);
        const patterns = ['ITEMCODE', 'ITEM_CODE', 'ITEM CODE', 'itemcode', 'ItemCode'];
        for (const p of patterns) {
          if (row[p]) return String(row[p]).trim();
          const normP = p.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          const mk = rowKeys.find(k => k.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_') === normP);
          if (mk && row[mk]) return String(row[mk]).trim();
        }
        return '';
      };

      // 3. Map Excel Rows to Item Data Structure
      const mappedItems = parsedRows.map(r => {
        const itemCode = getItemCode(r);

        const consumption = getRowValue(r, [
          'ISSUED_FROM_WH_01_APR_25_TO_31ST_OCT_25',
          'COSUMPTION_From_1APR_25',
          'COSUMPTION_From_1APR_24',
          'CONSUMPTION',
          'COSUMPTION'
        ]);

        const actualConsumption = getRowValue(r, [
          'ACTUAL_CONSUMPTION_FROM_01_APRIL_25_TO_31ST_OCT_25',
          'ACTUALCONSUMPTION',
          'ACTUAL_CONSUMPTION'
        ]);

        const projectedConsumption = getRowValue(r, [
          'ESTIMATED_CONSUMPTION_FOR_ONE_YEAR_FROM_01_APRIL_25_TO_31ST_MARCH_26',
          'PROJECTEDCONSUMPTION',
          'PROJECTED_CONSUMPTION'
        ]);

        const currentStock = getRowValue(r, [
          'CURRENT_STOCK', 'CURRENT STOCK', 'Current_Stock', 'CurStock'
        ]);

        const facilityIndentQty = getRowValue(r, [
          'ANNUAL_INDENT_26_27',
          'INDENT_26_27',
          'INDENT_25_26',
          'INDENT',
          'FACILITYINDENTQTY',
          'ANNUAL_INDENT_QTY',
          'ANNUAL INDENT QTY'
        ]);

        const rate = getRowValue(r, ['RATE', 'Rate', 'singlerate', 'Rates']);

        return {
          itemCode,
          consumption,
          actualConsumption,
          projectedConsumption,
          currentStock,
          facilityIndentQty,
          rate
        };
      }).filter(item => item.itemCode !== '' && Number(item.facilityIndentQty) > 0);

      // C# Rate validation check (lines 885-917 of AnualItemIndent.aspx.cs)
      let mCheckData = '';
      for (const item of mappedItems) {
        if (Number(item.facilityIndentQty) > 0) {
          if (Number(item.rate) > 0) {
            // Valid rate
          } else {
            mCheckData += item.itemCode + ', ';
          }
        }
      }

      if (mCheckData !== '') {
        const fullErr = mCheckData + 'Rate should not be empty';
        alert(fullErr);
        setError(fullErr);
        setUploading(false);
        return;
      }

      // 4. Send items payload to Backend Endpoint
      const uploadRes = await axios.post('/annual-indent/create/upload-excel', {
        facilityId: user?.facilityId || '29049',
        finYearId: selectedFinYear,
        indentId: activeIndentId,
        items: mappedItems
      });

      if (uploadRes.data?.success) {
        setMsg('Excel File Uploaded and Items Saved Successfully!');

        // 5. Reload Header & Items Grid to reflect uploaded values
        const headRes = await axios.get('/annual-indent/create/header', {
          params: { finYearId: selectedFinYear, indentId: activeIndentId }
        });
        if (headRes.data?.success && headRes.data.data) {
          setHeaderInfo(headRes.data.data);
        }

        const itemsRes = await axios.get('/annual-indent/create/items', {
          params: { finYearId: selectedFinYear, indentId: activeIndentId }
        });
        if (itemsRes.data?.success && itemsRes.data.data) {
          setItems(itemsRes.data.data.items || []);
          setNoOfItems(itemsRes.data.data.noOfItems || 0);
          setAproxIndentValue(itemsRes.data.data.aproxIndentValue || '0.00');
        }
      } else {
        setError('Failed to process Excel file on server');
      }
    } catch (err) {
      console.error('Error uploading Excel file:', err);
      setError('Error parsing or processing Excel file');
    } finally {
      setUploading(false);
    }
  };

  // Freeze / Finalize Handler (btnFreez_Click)
  const handleFreeze = async () => {
    if (!headerInfo.indentId || headerInfo.indentId === 0) {
      alert('Please generate Indent No first');
      return;
    }
    if (window.confirm('Are you sure you want to finalize/freeze this Annual Indent?')) {
      try {
        await axios.post('/annual-indent/create/freeze', {
          finYearId: selectedFinYear,
          indentId: headerInfo.indentId
        });
        setHeaderInfo(prev => ({ ...prev, status: 'C' }));
        alert('Indent Finalized Successfully');
        navigate(backUrl);
      } catch (err) {
        console.error('Failed to freeze indent:', err);
        alert('Failed to freeze annual indent');
      }
    }
  };

  // Delete Whole Indent Handler (btndelete_Click)
  const handleDeleteWholeIndent = async () => {
    if (!headerInfo.indentId || headerInfo.indentId === 0) {
      alert('No indent to delete');
      return;
    }
    if (window.confirm('Are you sure you want to delete this complete Annual Indent?')) {
      try {
        await axios.delete('/annual-indent/create/indent', {
          params: {
            finYearId: selectedFinYear,
            indentId: headerInfo.indentId
          }
        });
        alert('Annual Indent Deleted Successfully');
        navigate(backUrl);
      } catch (err) {
        console.error('Failed to delete indent:', err);
        alert('Failed to delete annual indent');
      }
    }
  };

  // Start Row Edit
  const handleStartEdit = (row) => {
    setEditingId(row.anualIndentId);
    setEditForm({
      consumption: row.consumption,
      actualConsumption: row.actualConsumption,
      projectedConsumption: row.projectedConsumption,
      currentStock: row.currentStock,
      facilityIndentQty: row.facilityIndentQty,
      rate: row.rate
    });
  };

  // Save Row Edit
  const handleSaveEdit = async (row) => {
    try {
      await axios.put('/annual-indent/create/item', {
        anualIndentId: row.anualIndentId,
        ...editForm
      });
      setEditingId(null);
      setMsg('Item Updated Successfully');
      loadIndentData();
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to update item');
    }
  };

  // Delete Row
  const handleDeleteRow = async (row) => {
    if (!window.confirm('Are you sure, you want to delete?')) return;
    try {
      await axios.delete(`/annual-indent/create/item/${row.anualIndentId}`);
      setMsg('Item Deleted Successfully');
      loadIndentData();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* 1. Header Banner matching Website Theme (Emerald Gradient + Pill Badge + Back Link) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl shadow-lg p-5 text-white border border-emerald-700/40">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/40 text-emerald-200 text-xs font-semibold uppercase tracking-widest border border-emerald-500/30">
                      <DocumentArrowUpIcon className="w-4 h-4" />
                      <span>Annual Indent</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1.5">
                      Upload EDL Item Annual Indent Excel Document
                    </h1>
                  </div>

                  <Link
                    to={backUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700/40 hover:bg-emerald-600 text-emerald-100 font-bold text-xs border border-emerald-500/30 shadow-sm transition-all hover:shadow shrink-0"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back</span>
                  </Link>
                </div>
              </div>

              {/* 2. Main Parameters & Controls Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-5">
                
                {/* Header Parameters Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Fin Year */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        Fin Year:
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

                    {/* Annual Indent No */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        Annual Indent No:
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={headerInfo.indentNo}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-sm outline-none min-w-[200px]"
                      />
                    </div>

                    {/* Indent Date */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        Indent Date:
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={headerInfo.indentDate}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-red-600 dark:text-red-400 text-xs font-black shadow-sm outline-none w-36"
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  {(!headerInfo.exists || headerEditMode) && (
                    <button
                      type="button"
                      onClick={handleGenerateHeader}
                      disabled={generating || loading}
                      className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      {generating ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Generate</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Upload & Action Bar Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  
                  {/* File input & Upload / Delete */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Upload Excel:
                    </span>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs text-slate-600 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 dark:file:bg-emerald-950/60 file:text-emerald-800 dark:file:text-emerald-300 hover:file:bg-emerald-200 cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={handleUploadExcel}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
                    >
                      {uploading ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUpTrayIcon className="w-4 h-4" />
                      )}
                      <span>Upload</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteWholeIndent}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Freeze Button & Hint */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Click on Freeze button to finalize Indent for selected Fin Year:
                    </span>
                    <button
                      type="button"
                      onClick={handleFreeze}
                      disabled={headerInfo.status === 'C'}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                      <span>{headerInfo.status === 'C' ? 'Freezed' : 'Freeze'}</span>
                    </button>
                  </div>

                </div>

                {/* Summary Metrics Badges matching Theme */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {/* Metric 1: No of Item */}
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 shadow-sm">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <DocumentChartBarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        No of Item
                      </span>
                      <span className="text-base font-black text-emerald-800 dark:text-emerald-300">
                        {calculatedNoOfItems}
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Aprox Indent Value */}
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 shadow-sm">
                    <div className="p-1.5 bg-teal-600 text-white rounded-lg">
                      <CurrencyRupeeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Aprox Indent Value (Cr.)
                      </span>
                      <span className="text-base font-black text-teal-800 dark:text-teal-300">
                        ₹ {calculatedAproxIndentValue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toast Messages */}
                {msg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{msg}</span>
                  </div>
                )}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <ExclamationCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

              </div>

              {/* 3. Items Data Table Card matching Theme */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-emerald-100 font-bold text-center uppercase tracking-wider border-b border-emerald-800">
                        <th className="py-3 px-3 border-r border-emerald-800/60 w-12">SL No</th>
                        <th className="py-3 px-4 border-r border-emerald-800/60 text-left min-w-[240px]">ItemCode & Description</th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[120px]">Group Name</th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[130px]">
                          ISSUED_FROM_WH_01<br />_APR_25_TO_31ST_OCT_25
                        </th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[130px]">
                          ACTUAL_CONSUMPTION<br />_FROM_01_APRIL_25_TO_31ST_OCT_25
                        </th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[150px]">
                          ESTIMATED_CONSUMPTION_FOR_ONE_YEAR<br />_FROM_01_APRIL_25_TO_31ST_MARCH_26
                        </th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[90px]">Current Stock</th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[100px]">Annual Indent Qty</th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[80px]">Actions</th>
                        <th className="py-3 px-3 border-r border-emerald-800/60 text-center min-w-[90px]">Aprox Rate</th>
                        <th className="py-3 px-3 text-center min-w-[110px]">Aprox Indent Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="11" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-emerald-600" />
                              <span className="text-sm font-semibold">Loading Annual Indent Items...</span>
                            </div>
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            No Item found for selected Financial Year
                          </td>
                        </tr>
                      ) : (
                        items.map((row, index) => {
                          const isEditing = editingId === row.anualIndentId;
                          const indVal = (Number(row.facilityIndentQty || 0) * Number(row.rate || 0));

                          return (
                            <tr
                              key={row.anualIndentId || index}
                              className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200"
                            >
                              {/* SL No */}
                              <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                                {index + 1}
                              </td>

                              {/* ItemCode & Description Card */}
                              <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800">
                                <div className="space-y-1 text-xs">
                                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="text-slate-400 font-medium text-[11px]">Code:</span>
                                    <span>{row.itemCode}</span>
                                  </div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100">
                                    {row.itemName}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                                    <span className="text-slate-400 font-medium">Strength:</span> {row.strength}
                                  </div>
                                  <div className="text-slate-500 dark:text-slate-400 text-[11px] flex flex-wrap gap-2 pt-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">SKU: {row.unit}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">Type: {row.itemTypeCode}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">Pack: {row.packingQty}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Group Name */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                {row.groupName}
                              </td>

                              {/* ISSUED_FROM_WH_01_APR_25_TO_31ST_OCT_25 */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.consumption}
                                    onChange={(e) => setEditForm({ ...editForm, consumption: e.target.value })}
                                    className="w-16 p-1 border border-slate-300 dark:border-slate-700 rounded text-center text-xs bg-slate-50 dark:bg-slate-800"
                                  />
                                ) : (
                                  row.consumption
                                )}
                              </td>

                              {/* ACTUAL_CONSUMPTION_FROM_01_APRIL_25_TO_31ST_OCT_25 */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.actualConsumption}
                                    onChange={(e) => setEditForm({ ...editForm, actualConsumption: e.target.value })}
                                    className="w-16 p-1 border border-slate-300 dark:border-slate-700 rounded text-center text-xs bg-slate-50 dark:bg-slate-800"
                                  />
                                ) : (
                                  row.actualConsumption
                                )}
                              </td>

                              {/* ESTIMATED_CONSUMPTION_FOR_ONE_YEAR_FROM_01_APRIL_25_TO_31ST_MARCH_26 */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.projectedConsumption}
                                    onChange={(e) => setEditForm({ ...editForm, projectedConsumption: e.target.value })}
                                    className="w-16 p-1 border border-slate-300 dark:border-slate-700 rounded text-center text-xs bg-slate-50 dark:bg-slate-800"
                                  />
                                ) : (
                                  row.projectedConsumption
                                )}
                              </td>

                              {/* Current Stock */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.currentStock}
                                    onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                                    className="w-16 p-1 border border-slate-300 dark:border-slate-700 rounded text-center text-xs bg-slate-50 dark:bg-slate-800"
                                  />
                                ) : (
                                  row.currentStock
                                )}
                              </td>

                              {/* Annual Indent Qty */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.facilityIndentQty}
                                    onChange={(e) => setEditForm({ ...editForm, facilityIndentQty: e.target.value })}
                                    className="w-16 p-1 border border-emerald-500 rounded text-center text-xs font-bold bg-white dark:bg-slate-800"
                                  />
                                ) : (
                                  row.facilityIndentQty
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(row)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow"
                                      title="Update"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingId(null)}
                                      className="p-1 bg-slate-400 hover:bg-slate-500 text-white rounded shadow"
                                      title="Cancel"
                                    >
                                      <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(row)}
                                      className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded transition"
                                      title="Edit Item"
                                    >
                                      <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row)}
                                      className="p-1 text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition"
                                      title="Delete Item"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Aprox Rate */}
                              <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                                    className="w-16 p-1 border border-slate-300 dark:border-slate-700 rounded text-center text-xs bg-slate-50 dark:bg-slate-800"
                                  />
                                ) : (
                                  `₹ ${Number(row.rate || 0).toFixed(2)}`
                                )}
                              </td>

                              {/* Aprox Indent Value */}
                              <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                                ₹ {Number(row.indAprVal || indVal || 0).toFixed(2)}
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

      {/* Loading Overlay */}
      {(generating || uploading) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-slate-200 dark:border-slate-700 min-w-[280px]">
            <ArrowPathIcon className="w-9 h-9 animate-spin text-emerald-600" />
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {generating ? 'Generating Annual Indent No...' : 'Uploading Excel Document...'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please wait a moment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
