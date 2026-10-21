import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import { getDynamicIndentHeaders } from '../../utils/indentYearHelper';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  LockClosedIcon,
  ArrowUpTrayIcon,
  TableCellsIcon,
  ExclamationCircleIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

export default function CreateNonEdlAnnualIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFinYear = searchParams.get('finYearId');
  const urlIndentId = searchParams.get('indentId');
  const urlMode = searchParams.get('mode');

  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState(urlFinYear || '546');

  // Dynamic Year Headers (e.g. COSUMPTION_From_1APR_26, Non_EDL_INDENT_27_28)
  const { consumptionHeader, indentHeader, futureFullYearRange, currYr } = useMemo(() => getDynamicIndentHeaders(), []);

  const [headerInfo, setHeaderInfo] = useState({
    indentId: urlIndentId ? Number(urlIndentId) : 0,
    indentNo: 'AUTO GENERATED',
    indentDate: 'System Generated',
    status: 'N',
    exists: false
  });

  const [headerEditMode, setHeaderEditMode] = useState(!urlIndentId);
  const [generating, setGenerating] = useState(false);

  const [items, setItems] = useState([]);
  const [noOfItems, setNoOfItems] = useState(0);
  const [aproxIndentValue, setAproxIndentValue] = useState('0.00');

  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Editing row state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    consumption: 0,
    currentStock: 0,
    facilityIndentQty: 0,
    rate: 0
  });

  // Excel upload file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Financial Years on Mount (filters for years where indent is not created)
  useEffect(() => {
    async function loadFinYears() {
      setDropdownLoading(true);
      try {
        const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
        const res = await axios.get('/annual-indent/non-edl/create/fin-years', {
          params: {
            facilityId: facId,
            mode: urlMode,
            indentId: urlIndentId
          }
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          const list = res.data.data;
          setFinYears(list);
          if (list.length > 0) {
            const matched = urlFinYear && list.find(fy => String(fy.accYrSetId) === String(urlFinYear));
            if (matched) {
              setSelectedFinYear(String(matched.accYrSetId));
            } else {
              setSelectedFinYear(String(list[0].accYrSetId));
            }
          } else {
            setSelectedFinYear('');
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadFinYears();
  }, [urlFinYear, urlMode, urlIndentId]);

  // Load Header and Items when Financial Year or IndentId changes
  useEffect(() => {
    if (!selectedFinYear) return;
    loadHeaderAndItems();
  }, [selectedFinYear, urlIndentId]);

  const loadHeaderAndItems = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
      const headerRes = await axios.get('/annual-indent/non-edl/create/header', {
        params: {
          facilityId: facId,
          finYearId: selectedFinYear,
          indentId: urlIndentId || undefined
        }
      });

      if (headerRes.data?.success && headerRes.data.data) {
        const data = headerRes.data.data;
        setHeaderInfo(data);
        if (data.exists && data.indentId) {
          setHeaderEditMode(false);
          // Fetch Items
          const itemsRes = await axios.get('/annual-indent/non-edl/create/items', {
            params: {
              facilityId: facId,
              finYearId: selectedFinYear,
              indentId: data.indentId
            }
          });
          if (itemsRes.data?.success && itemsRes.data.data) {
            setItems(itemsRes.data.data.items || []);
            setNoOfItems(itemsRes.data.data.noOfItems || 0);
            setAproxIndentValue(itemsRes.data.data.aproxIndentValue || '0.00');
          }
        } else {
          setHeaderEditMode(true);
          setItems([]);
          setNoOfItems(0);
          setAproxIndentValue('0.00');
        }
      }
    } catch (err) {
      console.error('Failed to load Non-EDL indent header/items:', err);
      setError('Failed to load Non-EDL indent information');
    } finally {
      setLoading(false);
    }
  };

  // Generate Indent Header
  const handleGenerateHeader = async () => {
    setGenerating(true);
    setError('');
    setMsg('');
    try {
      const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
      const res = await axios.post('/annual-indent/non-edl/create/generate-header', {
        facilityId: facId,
        finYearId: selectedFinYear
      });

      if (res.data?.success && res.data.data) {
        setHeaderInfo(res.data.data);
        setHeaderEditMode(false);
        setMsg('Non-EDL Indent header generated successfully');
        loadHeaderAndItems();
      } else {
        setError(res.data?.error || 'Failed to generate indent header');
      }
    } catch (err) {
      console.error('Failed to generate indent header:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate indent header');
    } finally {
      setGenerating(false);
    }
  };

  // Upload Excel File
  const handleUploadExcel = async () => {
    if (!selectedFile) {
      setError('Please browse and select an Excel file first.');
      return;
    }
    if (!headerInfo.indentId || headerInfo.indentId === 0) {
      setError('Please Generate Indent Number First then Upload File.');
      return;
    }

    setUploading(true);
    setError('');
    setMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (rows.length < 2) {
            setError('The uploaded Excel sheet contains no item data rows.');
            setUploading(false);
            return;
          }

          // Header matching (case insensitive, supporting dynamic names)
          const headerRow = rows[0].map(c => String(c || '').trim().toLowerCase());
          const codeIdx = headerRow.findIndex(h => h.includes('itemcode') || h.includes('item_code') || h === 'item code');
          const consIdx = headerRow.findIndex(h => h.includes('cosumption') || h.includes('consumption'));
          const stockIdx = headerRow.findIndex(h => h.includes('current_stock') || h.includes('current stock') || h.includes('stock'));
          const qtyIdx = headerRow.findIndex(h => h.includes('non_edl_indent') || h.includes('indent') || h.includes('qty'));
          const rateIdx = headerRow.findIndex(h => h.includes('rate'));

          const parsedItems = [];
          const missingRateCodes = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const itemCode = String(codeIdx >= 0 ? row[codeIdx] : row[1] || '').trim();
            if (!itemCode) continue;

            const qty = Number(qtyIdx >= 0 ? row[qtyIdx] : row[7] || 0) || 0;
            const rate = Number(rateIdx >= 0 ? row[rateIdx] : row[8] || 0) || 0;

            if (qty > 0) {
              if (rate <= 0) {
                missingRateCodes.push(itemCode);
              }
            } else {
              continue; // Only items with qty > 0 are imported per C# logic
            }

            const consumption = Number(consIdx >= 0 ? row[consIdx] : row[5] || 0) || 0;
            const currentStock = Number(stockIdx >= 0 ? row[stockIdx] : row[6] || 0) || 0;

            parsedItems.push({
              itemcode: itemCode,
              consumption,
              currentStock,
              facilityIndentQty: qty,
              rate
            });
          }

          if (missingRateCodes.length > 0) {
            setError(`Rate should not be empty for item(s): ${missingRateCodes.slice(0, 5).join(', ')}${missingRateCodes.length > 5 ? '...' : ''}`);
            setUploading(false);
            return;
          }

          if (parsedItems.length === 0) {
            setError('No items with Annual Indent Qty > 0 were found in the file.');
            setUploading(false);
            return;
          }

          const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
          const uploadRes = await axios.post('/annual-indent/non-edl/create/upload-excel', {
            facilityId: facId,
            finYearId: selectedFinYear,
            indentId: headerInfo.indentId,
            items: parsedItems
          });

          if (uploadRes.data?.success) {
            setMsg(`Excel items uploaded successfully! Added/Updated ${uploadRes.data.data?.count || parsedItems.length} records.`);
            setSelectedFile(null);
            loadHeaderAndItems();
          } else {
            setError(uploadRes.data?.error || 'Failed to upload Excel items');
          }
        } catch (err) {
          console.error('Error parsing/uploading Excel file:', err);
          setError(err.response?.data?.error || err.message || 'Error parsing Excel file');
        } finally {
          setUploading(false);
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error('Failed to read file:', err);
      setError('Failed to read selected file');
      setUploading(false);
    }
  };

  // Freeze Indent
  const handleFreeze = async () => {
    if (!window.confirm('Are you sure you want to finalize and freeze this Non-EDL Annual Indent? Once frozen, items cannot be edited.')) {
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
      const res = await axios.post('/annual-indent/non-edl/create/freeze', {
        facilityId: facId,
        finYearId: selectedFinYear,
        indentId: headerInfo.indentId
      });
      if (res.data?.success) {
        alert('Non-EDL Indent Finalized Successfully!');
        navigate('/non-edl-annual-indent/upload-forward');
      } else {
        setError(res.data?.error || 'Failed to finalize indent');
      }
    } catch (err) {
      console.error('Failed to freeze indent:', err);
      setError('Failed to finalize indent: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete Entire Indent
  const handleDeleteIndent = async () => {
    if (!window.confirm('Are you sure you want to delete this Non-EDL Annual Indent and all its items?')) {
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
      const res = await axios.delete('/annual-indent/non-edl/create/indent', {
        params: {
          facilityId: facId,
          finYearId: selectedFinYear,
          indentId: headerInfo.indentId
        }
      });
      if (res.data?.success) {
        alert('Non-EDL Indent deleted successfully.');
        navigate('/non-edl-annual-indent/upload-forward');
      } else {
        setError(res.data?.error || 'Failed to delete indent');
      }
    } catch (err) {
      console.error('Failed to delete indent:', err);
      setError('Failed to delete indent: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Start Editing Row
  const startEditRow = (row) => {
    setEditingId(row.anualIndentId);
    setEditForm({
      consumption: row.consumption || 0,
      currentStock: row.currentStock || 0,
      facilityIndentQty: row.facilityIndentQty || 0,
      rate: row.rate || 0
    });
  };

  // Cancel Editing Row
  const cancelEditRow = () => {
    setEditingId(null);
  };

  // Save Row Edit
  const saveRowEdit = async (anualIndentId) => {
    try {
      await axios.put('/annual-indent/create/item', {
        anualIndentId,
        consumption: editForm.consumption,
        actualConsumption: 0,
        projectedConsumption: 0,
        currentStock: editForm.currentStock,
        facilityIndentQty: editForm.facilityIndentQty,
        rate: editForm.rate
      });
      setEditingId(null);
      setMsg('Item updated successfully');
      loadHeaderAndItems();
    } catch (err) {
      console.error('Failed to update item row:', err);
      setError('Failed to update item row: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete Single Item Row
  const deleteRow = async (anualIndentId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/annual-indent/create/item/${anualIndentId}`);
      setMsg('Item deleted successfully');
      loadHeaderAndItems();
    } catch (err) {
      console.error('Failed to delete item row:', err);
      setError('Failed to delete item row');
    }
  };

  const isCompleted = headerInfo.status === 'Completed' || headerInfo.status === 'C';

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 space-y-4">
            <div className="max-w-6xl mx-auto space-y-4">

              {/* Broad Header Banner matching Sidebar Dark Blue */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a6a] via-[#1e293b] to-[#0f172a] rounded-xl shadow-md px-5 py-3.5 text-white border border-blue-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link
                    to="/non-edl-annual-indent/upload-forward"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Back to Non-EDL Indent List"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </Link>
                  <div>
                    <h1 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-xs">
                      Upload Annual Indent Excel Document
                    </h1>
                    <p className="text-xs text-blue-200/90 font-medium">
                      NON EDL Annual Indent | Facility ID: <span className="font-bold text-amber-300">{user?.facilityId || '22595'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <ExclamationCircleIcon className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                </div>
              )}
              {msg && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{msg}</span>
                  </div>
                  <button onClick={() => setMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
                </div>
              )}

              {/* Header Configuration Card (matches pnlHeader2) */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* Fin Year */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fin Year:
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={!headerEditMode || dropdownLoading || isCompleted || finYears.length === 0}
                      aria-label="Financial Year"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none shadow-xs disabled:opacity-60"
                    >
                      {finYears.length === 0 ? (
                        <option value="">No pending financial years</option>
                      ) : (
                        finYears.map(fy => (
                          <option key={fy.accYrSetId} value={fy.accYrSetId}>
                            {fy.accYear}
                          </option>
                        ))
                      )}
                    </select>
                    {finYears.length === 0 && !dropdownLoading && (
                      <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                        All active financial years already have an indent created for this facility.
                      </p>
                    )}
                  </div>

                  {/* Non EDL Annual Indent No */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Non EDL Annual Indent No:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={headerInfo.indentNo || 'AUTO GENERATED'}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  {/* Indent Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Indent Date:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={headerInfo.indentDate || 'System Generated'}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-medium outline-none"
                    />
                  </div>

                </div>

                {/* Generate / Action Buttons */}
                {headerEditMode && !headerInfo.exists && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3">
                    <button
                      onClick={handleGenerateHeader}
                      disabled={generating || !selectedFinYear || finYears.length === 0}
                      className="px-5 py-1.5 bg-[#1e3a6a] hover:bg-[#152a4d] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Generate</span>
                      )}
                    </button>
                    <button
                      onClick={() => navigate('/non-edl-annual-indent/upload-forward')}
                      className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Upload and Operations Card */}
              {headerInfo.exists && (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                  
                  {/* File Upload & Action Buttons Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        Upload Excel:
                      </span>
                      <input
                        type="file"
                        accept=".xls,.xlsx"
                        disabled={isCompleted || uploading}
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        className="text-xs text-slate-700 dark:text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-300"
                      />
                      <button
                        onClick={handleUploadExcel}
                        disabled={!selectedFile || isCompleted || uploading}
                        className="px-4 py-1.5 bg-[#1e3a6a] hover:bg-[#152a4d] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCompleted && (
                        <>
                          <button
                            onClick={handleDeleteIndent}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                            title="Delete entire indent"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>Delete Indent</span>
                          </button>

                          <button
                            onClick={handleFreeze}
                            disabled={items.length === 0}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                            title="Click to finalize Indent for selected Fin Year"
                          >
                            <LockClosedIcon className="w-3.5 h-3.5" />
                            <span>Freeze Indent</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                          <span>Finalized & Freezed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Box (matching C# upditem box) */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs font-bold shadow-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">No of Item</span>
                        <span className="text-sm font-extrabold text-[#1e3a6a] dark:text-blue-400 font-mono">{noOfItems}</span>
                      </div>
                      <div className="h-7 w-px bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Aprox Indent Value (cr.)</span>
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">₹ {aproxIndentValue} Cr</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      💡 Click on <strong>Freeze</strong> button to finalize Indent for selected Fin Year.
                    </span>
                  </div>

                </div>
              )}

              {/* Items Grid Table (matching gv1) */}
              {headerInfo.exists && (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableCellsIcon className="w-4 h-4 text-[#1e3a6a] dark:text-blue-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Non-EDL Annual Indent Items</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#1e3a6a] dark:text-blue-300 text-[10px] font-bold">
                        {items.length} Items Loaded
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#1e3a6a] text-white font-bold sticky top-0 z-10 border-b border-[#2563eb]/20 shadow-xs">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12 text-slate-100">#</th>
                          <th className="py-2.5 px-3 text-slate-100">ItemCode & Description</th>
                          <th className="py-2.5 px-3 text-center text-slate-100">Group Name</th>
                          <th className="py-2.5 px-3 text-right text-slate-100" title={consumptionHeader}>
                            Consumption (From 1-Apr-{currYr})
                          </th>
                          <th className="py-2.5 px-3 text-right text-slate-100">Current Stock</th>
                          <th className="py-2.5 px-3 text-right text-slate-100" title={indentHeader}>
                            Annual Indent Qty ({futureFullYearRange})
                          </th>
                          <th className="py-2.5 px-3 text-right text-slate-100">Aprox Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right text-slate-100">Aprox Indent Value (₹)</th>
                          {!isCompleted && <th className="py-2.5 px-3 text-center w-20 text-slate-100">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {loading ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-500 font-semibold">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />
                                <span>Loading items...</span>
                              </div>
                            </td>
                          </tr>
                        ) : items.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500 font-medium text-xs">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <TableCellsIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-1" />
                                <span>No items found in this Non-EDL Annual Indent. Please upload an Excel document.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          items.map((row, idx) => {
                            const isEditing = editingId === row.anualIndentId;
                            return (
                              <tr
                                key={row.anualIndentId || idx}
                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="py-2 px-3 text-center font-bold text-slate-400 text-[11px]">
                                  {idx + 1}
                                </td>

                                {/* ItemCode & Description */}
                                <td className="py-2 px-3">
                                  <div className="space-y-0.5 max-w-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                                        {row.itemCode}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        {row.unit}
                                      </span>
                                    </div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={row.itemName}>
                                      {row.itemName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      Str: {row.strength1 || '-'} | Pkg: {row.packingQty}
                                    </p>
                                  </div>
                                </td>

                                {/* Group Name */}
                                <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">
                                  {row.groupName || '-'}
                                </td>

                                {/* Consumption */}
                                <td className="py-2 px-3 text-right font-mono">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editForm.consumption}
                                      onChange={(e) => setEditForm({ ...editForm, consumption: Number(e.target.value) })}
                                      className="w-20 px-1.5 py-1 text-right text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                                    />
                                  ) : (
                                    row.consumption?.toLocaleString() || '0'
                                  )}
                                </td>

                                {/* Current Stock */}
                                <td className="py-2 px-3 text-right font-mono">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editForm.currentStock}
                                      onChange={(e) => setEditForm({ ...editForm, currentStock: Number(e.target.value) })}
                                      className="w-20 px-1.5 py-1 text-right text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                                    />
                                  ) : (
                                    row.currentStock?.toLocaleString() || '0'
                                  )}
                                </td>

                                {/* Annual Indent Qty */}
                                <td className="py-2 px-3 text-right font-mono font-bold text-blue-900 dark:text-blue-300">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editForm.facilityIndentQty}
                                      onChange={(e) => setEditForm({ ...editForm, facilityIndentQty: Number(e.target.value) })}
                                      className="w-20 px-1.5 py-1 text-right text-xs border rounded bg-white dark:bg-slate-800 font-mono font-bold"
                                    />
                                  ) : (
                                    row.facilityIndentQty?.toLocaleString() || '0'
                                  )}
                                </td>

                                {/* Aprox Rate */}
                                <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editForm.rate}
                                      onChange={(e) => setEditForm({ ...editForm, rate: Number(e.target.value) })}
                                      className="w-20 px-1.5 py-1 text-right text-xs border rounded bg-white dark:bg-slate-800 font-mono"
                                    />
                                  ) : (
                                    Number(row.rate || 0).toFixed(2)
                                  )}
                                </td>

                                {/* Aprox Indent Value */}
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  {isEditing ? (
                                    (Number(editForm.facilityIndentQty || 0) * Number(editForm.rate || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  ) : (
                                    Number(row.indAprVal || (row.facilityIndentQty * (row.rate || 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  )}
                                </td>

                                {/* Actions */}
                                {!isCompleted && (
                                  <td className="py-2 px-3 text-center">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => saveRowEdit(row.anualIndentId)}
                                          className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
                                          title="Save changes"
                                        >
                                          <CheckIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={cancelEditRow}
                                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                          title="Cancel"
                                        >
                                          <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => startEditRow(row)}
                                          className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                                          title="Edit quantity/rate"
                                        >
                                          <PencilSquareIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => deleteRow(row.anualIndentId)}
                                          className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                          title="Delete item"
                                        >
                                          <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
