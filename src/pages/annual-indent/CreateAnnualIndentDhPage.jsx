import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
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
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

export default function CreateAnnualIndentDhPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFinYear = searchParams.get('finYearId');
  const urlIndentId = searchParams.get('indentId');

  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState(urlFinYear || '548');

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
  const [generating, setGenerating] = useState(false);

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

  // Fetch Financial Years on Mount
  useEffect(() => {
    async function loadFinYears() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/annual-indent/upload-forward/fin-years');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFinYears(res.data.data);
          if (res.data.data.length > 0) {
            const currentIndex = res.data.data.findIndex(fy => fy.isCurrent);
            let defaultFy = null;
            if (currentIndex > 0) {
              defaultFy = res.data.data[currentIndex - 1]; // Future year (e.g. 27-28)
            } else if (currentIndex === 0) {
              defaultFy = res.data.data[0];
            } else {
              defaultFy = res.data.data[0];
            }
            setSelectedFinYear(urlFinYear || String(defaultFy.accYrSetId));
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years dropdown');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadFinYears();
  }, [urlFinYear]);

  // Load Header and Items when Selected Financial Year or IndentId changes
  useEffect(() => {
    if (!selectedFinYear) return;
    loadIndentData();
  }, [selectedFinYear, urlIndentId]);

  const loadIndentData = async () => {
    setLoading(true);
    setError('');
    try {
      const headRes = await axios.get('/annual-indent/create/header', {
        params: {
          finYearId: selectedFinYear,
          indentId: urlIndentId || undefined
        }
      });

      if (headRes.data?.success && headRes.data.data) {
        const hData = headRes.data.data;
        setHeaderInfo(hData);
        setHeaderEditMode(!hData.exists);

        if (hData.indentId && hData.indentId !== 0) {
          const itemsRes = await axios.get('/annual-indent/create/items', {
            params: {
              finYearId: selectedFinYear,
              indentId: hData.indentId
            }
          });

          if (itemsRes.data?.success && itemsRes.data.data) {
            setItems(itemsRes.data.data.items || []);
            setNoOfItems(itemsRes.data.data.noOfItems || 0);
            setAproxIndentValue(itemsRes.data.data.aproxIndentValue || '0.00');
          } else {
            setItems([]);
            setNoOfItems(0);
            setAproxIndentValue('0.00');
          }
        } else {
          setItems([]);
          setNoOfItems(0);
          setAproxIndentValue('0.00');
        }
      }
    } catch (err) {
      console.error('Failed to load DH Annual Indent data:', err);
      setError('Failed to fetch indent header and items');
    } finally {
      setLoading(false);
    }
  };

  // Generate Indent Header Handler (btnSave_Click)
  const handleGenerateHeader = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await axios.post('/annual-indent/create/generate-header', {
        finYearId: selectedFinYear
      });

      if (res.data?.success && res.data.data) {
        setHeaderInfo(res.data.data);
        setHeaderEditMode(false);
        setMsg('Indent Header Generated Successfully!');
        setTimeout(() => setMsg(''), 4000);
      } else {
        setError('Failed to generate indent header');
      }
    } catch (err) {
      console.error('Error generating header:', err);
      setError('Error creating annual indent');
    } finally {
      setGenerating(false);
    }
  };

  // Upload Excel File Handler
  const handleUploadExcel = async () => {
    if (!selectedFile) {
      alert('Please select an Excel file (.xls or .xlsx) to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setMsg('');

    try {
      const dataBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length < 2) {
        alert('The uploaded Excel sheet contains no data rows.');
        setUploading(false);
        return;
      }

      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const row = rawRows[i].map(c => String(c).trim().toUpperCase());
        if (row.includes('ITEMCODE') || row.includes('ITEM CODE')) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = rawRows[headerRowIndex].map(h => String(h).trim().toUpperCase());
      const itemCodeIdx = headers.findIndex(h => h.includes('ITEMCODE') || h.includes('ITEM CODE'));
      const conIdx = headers.findIndex(h => h.includes('ISSUED_FROM_WH') || h.includes('CONSUMPTION'));
      const actConIdx = headers.findIndex(h => h.includes('ACTUAL_CONSUMPTION'));
      const estConIdx = headers.findIndex(h => h.includes('ESTIMATED_CONSUMPTION') || h.includes('PROJECTED'));
      const curStockIdx = headers.findIndex(h => h.includes('CURRENT_STOCK') || h.includes('STOCK'));
      const indQtyIdx = headers.findIndex(h => h.includes('ANNUALINDENT') || h.includes('INDENT') || h.includes('QTY'));
      const rateIdx = headers.findIndex(h => h.includes('RATE') || h.includes('PRICE'));

      if (itemCodeIdx === -1) {
        alert('Could not find ITEMCODE column in the Excel file.');
        setUploading(false);
        return;
      }

      const parsedItems = [];
      for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const itemCode = String(row[itemCodeIdx] || '').trim();
        if (!itemCode) continue;

        const consumption = conIdx !== -1 ? Number(row[conIdx]) || 0 : 0;
        const actualConsumption = actConIdx !== -1 ? Number(row[actConIdx]) || 0 : 0;
        const projectedConsumption = estConIdx !== -1 ? Number(row[estConIdx]) || 0 : 0;
        const currentStock = curStockIdx !== -1 ? Number(row[curStockIdx]) || 0 : 0;
        const facilityIndentQty = indQtyIdx !== -1 ? Number(row[indQtyIdx]) || 0 : 0;
        const rate = rateIdx !== -1 ? Number(row[rateIdx]) || 0 : 0;

        parsedItems.push({
          itemCode,
          consumption,
          actualConsumption,
          projectedConsumption,
          currentStock,
          facilityIndentQty,
          rate
        });
      }

      if (parsedItems.length === 0) {
        alert('No valid item records found in the Excel file.');
        setUploading(false);
        return;
      }

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
          alert('Failed to automatically create indent header for upload.');
          setUploading(false);
          return;
        }
      }

      const uploadRes = await axios.post('/annual-indent/create/upload-excel', {
        finYearId: selectedFinYear,
        indentId: activeIndentId,
        items: parsedItems
      });

      if (uploadRes.data?.success) {
        setMsg('Excel File Uploaded Successfully!');

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

  // Freeze / Finalize Handler
  const handleFreeze = async () => {
    if (!headerInfo.indentId || headerInfo.indentId === 0) {
      alert('Please generate Indent No first');
      return;
    }
    if (window.confirm('Are you sure you want to Freeze and finalize this Annual Indent?')) {
      try {
        await axios.post('/annual-indent/create/freeze', {
          finYearId: selectedFinYear,
          indentId: headerInfo.indentId
        });
        setHeaderInfo(prev => ({ ...prev, status: 'C' }));
        setMsg('Indent Finalized Successfully');
        setTimeout(() => {
          navigate('/annual-indent/upload-forward-dh');
        }, 1200);
      } catch (err) {
        console.error('Failed to freeze indent:', err);
        alert('Failed to freeze annual indent');
      }
    }
  };

  // Delete Whole Indent Handler
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
        setMsg('Annual Indent Deleted Successfully');
        setTimeout(() => {
          navigate('/annual-indent/upload-forward-dh');
        }, 1000);
      } catch (err) {
        console.error('Failed to delete indent:', err);
        alert('Failed to delete annual indent');
      }
    }
  };

  // Download Sample Excel Handler
  const handleDownloadSampleFile = async () => {
    try {
      const res = await axios.get('/annual-indent/download-format');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        let tableHtml = `
          <table border="1">
            <thead>
              <tr style="background-color: #065f46; color: #ffffff; font-weight: bold;">
                <th>SlNo</th>
                <th>ITEMCODE</th>
                <th>ITEMNAME</th>
                <th>FORMULATION</th>
                <th>STRENGTH</th>
                <th>GROUPNAME</th>
                <th>EDL</th>
                <th>ISSUED_FROM_WH_01_APR_25_TO_31ST_OCT_25</th>
                <th>ACTUAL_CONSUMPTION_FROM_01_APRIL_25_TO_31ST_OCT_25</th>
                <th>ESTIMATED_CONSUMPTION_FOR_ONE_YEAR_FROM_01_APRIL_25_TO_31ST_MARCH_26</th>
                <th>CURRENT_STOCK</th>
                <th>ANNUALINDENT_26_27</th>
                <th>RATE</th>
              </tr>
            </thead>
            <tbody>
        `;
        rows.forEach((r, idx) => {
          tableHtml += `
            <tr>
              <td>${idx + 1}</td>
              <td>${r.itemCode || ''}</td>
              <td>${r.itemName || ''}</td>
              <td>${r.itemType || ''}</td>
              <td>${r.strength || ''}</td>
              <td>${r.groupName || ''}</td>
              <td>${r.edl2025 || 'No'}</td>
              <td>${r.consumptionFrom1Apr25 || 0}</td>
              <td>${r.actualConsumption || 0}</td>
              <td>${r.estimatedConsumption || 0}</td>
              <td>${r.currentStock || 0}</td>
              <td>${r.annualIndent2627 || 0}</td>
              <td>${r.rate || 0}</td>
            </tr>
          `;
        });
        tableHtml += `</tbody></table>`;
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EDL_ItemIndent_${user?.facilityId || 'DH'}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download sample file:', err);
      alert('Error downloading sample Excel file');
    }
  };

  // Export Current Grid to Excel
  const handleExportToExcel = () => {
    if (items.length === 0) {
      alert('No items to export.');
      return;
    }
    const currentFyText = finYears.find(fy => String(fy.accYrSetId) === String(selectedFinYear))?.accYear || '';
    let tableHtml = `
      <table border="1">
        <thead>
          <tr>
            <th colspan="7" style="font-weight: bold; text-align: center;">CHHATTISGARH MEDICAL SERVICES CORPORATION</th>
          </tr>
          <tr>
            <th colspan="7" style="font-weight: bold; text-align: center;">Item(s) Indent For Financial Year: ${currentFyText}</th>
          </tr>
          <tr style="background-color: #065f46; color: #ffffff; font-weight: bold;">
            <th>SlNo</th>
            <th>ItemCode</th>
            <th>ItemName</th>
            <th>GroupName</th>
            <th>Consumption</th>
            <th>CurrentStock</th>
            <th>AnnualIndentQty</th>
            <th>Rate</th>
            <th>IndentValue</th>
          </tr>
        </thead>
        <tbody>
    `;

    items.forEach((r, idx) => {
      tableHtml += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${r.itemCode || ''}</td>
          <td>${r.itemName || ''} ${r.strength || ''}</td>
          <td>${r.groupName || ''}</td>
          <td style="text-align: right;">${r.consumption || 0}</td>
          <td style="text-align: right;">${r.currentStock || 0}</td>
          <td style="text-align: right;">${r.facilityIndentQty || 0}</td>
          <td style="text-align: right;">${Number(r.rate || 0).toFixed(2)}</td>
          <td style="text-align: right;">${Number(r.indAprVal || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDL_ItemIndentList_${currentFyText.replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    if (!window.confirm('Are you sure you want to delete this item?')) return;
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
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-5">
            <div className="max-w-7xl mx-auto space-y-5">

              {/* Title Header Banner (Emerald Green Theme) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl shadow-lg p-5 text-white border border-emerald-700/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight text-center md:text-left">
                    Upload EDL Item Annual Indent Excel Document
                  </h1>
                </div>

                <button
                  onClick={() => navigate('/annual-indent/upload-forward-dh')}
                  className="px-4 py-2 bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-500/40 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>

              {/* Form Controls Card matching DH EDL Item Header */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                
                {headerEditMode ? (
                  /* Edit Header Panel - Inline Layout without Category dropdown */
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    
                    <div className="flex flex-wrap items-center gap-6">
                      {/* Fin Year */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
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
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Annual Indent No:
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={headerInfo.indentNo}
                          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold outline-none shadow-sm min-w-[200px]"
                        />
                      </div>

                      {/* Indent Date */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Indent Date:
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={headerInfo.indentDate}
                          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 text-xs font-extrabold outline-none shadow-sm w-36"
                        />
                      </div>
                    </div>

                    {/* Generate Button on the Right */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateHeader}
                        disabled={generating || loading}
                        className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
                      >
                        {generating ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <span>Generate</span>
                        )}
                      </button>
                    </div>

                  </div>
                ) : (
                  /* View Header Panel */
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold block">Fin Year:</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {finYears.find(fy => String(fy.accYrSetId) === String(selectedFinYear))?.accYear || selectedFinYear}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Annual Indent No:</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                          {headerInfo.indentNo}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Indent Date:</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {headerInfo.indentDate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setHeaderEditMode(true)}
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-emerald-300 rounded-xl transition-all shadow-sm shrink-0"
                      title="Edit Header Info"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Upload & Action Bar Row (File Upload, Freeze, Delete) */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Upload Excel:
                    </span>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs text-slate-600 dark:text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <button
                      onClick={handleUploadExcel}
                      disabled={uploading}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      {uploading ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUpTrayIcon className="w-4 h-4" />
                      )}
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={handleDeleteWholeIndent}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Click on Freeze button to finalize Indent for selected Fin Year:
                    </span>
                    <button
                      onClick={handleFreeze}
                      disabled={headerInfo.status === 'C'}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition-all flex items-center gap-1.5 ${
                        headerInfo.status === 'C'
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <LockClosedIcon className="w-4 h-4" />
                      <span>{headerInfo.status === 'C' ? 'Freezed' : 'Freeze'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Badges Row (No of Item, Indent Value) */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 shadow-sm">
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

                  <div className="px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-3 shadow-sm">
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

                  <button
                    onClick={handleDownloadSampleFile}
                    className="ml-auto text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline flex items-center gap-1"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>Download sample excel file format</span>
                  </button>
                </div>

              </div>

              {/* Success / Error Banners */}
              {msg && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{msg}</span>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold shadow-sm">
                  {error}
                </div>
              )}

              {/* Items Grid Table */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    Indent Items Details ({items.length})
                  </h3>
                  {items.length > 0 && (
                    <button
                      onClick={handleExportToExcel}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Export to Excel</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-white font-bold text-center border-b border-emerald-800">
                        <th className="py-3 px-3 border-r border-emerald-800 w-12 text-center">Sl. No.</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-center w-24">Item Code</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-left">Item Name</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-left">Group Name</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-right">Consumption</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-right">Current Stock</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-right">Annual Indent Qty</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-right">Rate</th>
                        <th className="py-3 px-3 border-r border-emerald-800 text-right">Indent Value</th>
                        <th className="py-3 px-3 text-center w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="10" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-emerald-600" />
                              <span className="text-xs font-semibold">Loading items...</span>
                            </div>
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            No Item found in this Indent. Upload Excel file to populate items.
                          </td>
                        </tr>
                      ) : (
                        items.map((row, idx) => {
                          const isEditing = editingId === row.anualIndentId;
                          return (
                            <tr
                              key={row.anualIndentId || idx}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                                isEditing ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-white dark:bg-[#1e293b]'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                                {row.itemCode}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 font-medium">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{row.itemName}</span>
                                {row.strength && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{row.strength}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                                {row.groupName}
                              </td>
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-semibold">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.consumption}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, consumption: e.target.value }))}
                                    className="w-20 px-2 py-1 text-right border border-emerald-500 rounded outline-none"
                                  />
                                ) : (
                                  row.consumption || 0
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-semibold">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.currentStock}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, currentStock: e.target.value }))}
                                    className="w-20 px-2 py-1 text-right border border-emerald-500 rounded outline-none"
                                  />
                                ) : (
                                  row.currentStock || 0
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-extrabold text-emerald-700 dark:text-emerald-400">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.facilityIndentQty}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, facilityIndentQty: e.target.value }))}
                                    className="w-20 px-2 py-1 text-right border border-emerald-500 rounded outline-none font-bold"
                                  />
                                ) : (
                                  row.facilityIndentQty || 0
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                                    className="w-20 px-2 py-1 text-right border border-emerald-500 rounded outline-none"
                                  />
                                ) : (
                                  Number(row.rate || 0).toFixed(2)
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                                {Number(row.indAprVal || 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {headerInfo.status !== 'C' ? (
                                  isEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleSaveEdit(row)}
                                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow"
                                        title="Save"
                                      >
                                        <CheckIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="p-1 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded shadow"
                                        title="Cancel"
                                      >
                                        <XMarkIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEdit(row)}
                                        className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded transition-all"
                                        title="Edit Item"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRow(row)}
                                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition-all"
                                        title="Delete Item"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-slate-400 font-semibold text-[11px]">Freezed</span>
                                )}
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
    </div>
  );
}
