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
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function CreateAnnualIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFinYear = searchParams.get('finYearId');
  const urlIndentId = searchParams.get('indentId');

  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState(urlFinYear || '547');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [categoryError, setCategoryError] = useState('');

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

  // Fetch Financial Years & Categories on Mount
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const [fyRes, catRes] = await Promise.all([
          axios.get('/annual-indent/upload-forward/fin-years'),
          axios.get('/annual-indent/categories')
        ]);

        if (fyRes.data?.success && Array.isArray(fyRes.data.data)) {
          setFinYears(fyRes.data.data);
          if (fyRes.data.data.length > 0) {
            const currentFy = fyRes.data.data.find(fy => fy.isCurrent);
            const defaultId = currentFy ? currentFy.accYrSetId : fyRes.data.data[0].accYrSetId;
            setSelectedFinYear(urlFinYear || String(defaultId));
          }
        }

        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load initial page dropdowns:', err);
        setError('Failed to load financial years and categories');
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
          if (currentHeader.categoryId) {
            setSelectedCategory(String(currentHeader.categoryId));
          }
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
    if (!selectedCategory || selectedCategory === '0') {
      setCategoryError('Please select AI Type');
      return;
    }
    setCategoryError('');

    try {
      const res = await axios.post('/annual-indent/create/generate-header', {
        finYearId: selectedFinYear,
        categoryId: selectedCategory
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
    }
  };

  // Cancel Header Editing Handler (lbtnCancelSOInfo_Click)
  const handleCancelHeader = () => {
    if (headerInfo.exists) {
      setHeaderEditMode(false);
      setCategoryError('');
    } else {
      navigate('/annual-indent/upload-forward');
    }
  };

  // Upload Excel Handler (btnupload_Click)
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an Excel file to upload');
      return;
    }

    setUploading(true);
    setMsg('');
    setError('');

    try {
      // 1. Ensure we have an Indent Header generated first
      let activeIndentId = headerInfo.indentId;
      if (!activeIndentId || activeIndentId === 0) {
        if (!selectedCategory || selectedCategory === '0') {
          alert('Please select Annual Indent Category before uploading Excel');
          setUploading(false);
          return;
        }
        const genRes = await axios.post('/annual-indent/create/generate-header', {
          finYearId: selectedFinYear,
          categoryId: selectedCategory
        });
        if (genRes.data?.success && genRes.data.data) {
          activeIndentId = genRes.data.data.indentId;
          setHeaderInfo(genRes.data.data);
          setHeaderEditMode(false);
        } else {
          alert('Failed to auto-generate Indent Number before upload');
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
          'COSUMPTION', 'CONSUMPTION', 'COSUMPTION_From_1APR_24', 'ACTUAL_CONSUMPTION_FROM_01_APRIL_25_TO_31ST_OCT_25'
        ]);

        const currentStock = getRowValue(r, [
          'CURRENT_STOCK', 'CURRENT STOCK', 'Current_Stock', 'CurStock'
        ]);

        const facilityIndentQty = getRowValue(r, [
          'INDENT_26_27', 'ANNUAL_INDENT_26_27', 'INDENT_25_26', 'INDENT', 'ANNUAL_INDENT_QTY', 'ANNUAL INDENT QTY'
        ]);

        const rate = getRowValue(r, ['RATE', 'Rate', 'singlerate']);

        return {
          itemCode,
          consumption,
          currentStock,
          facilityIndentQty,
          rate
        };
      }).filter(item => item.itemCode !== '' && Number(item.facilityIndentQty) > 0);

      // 4. Send items payload to Backend Endpoint
      const uploadRes = await axios.post('/annual-indent/create/upload-excel', {
        facilityId: user?.facilityId || '22595',
        finYearId: selectedFinYear,
        indentId: activeIndentId,
        items: mappedItems
      });

      if (uploadRes.data?.success) {
        setMsg('Excel File Uploaded Successfully!');

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
    if (window.confirm('Are you sure you want to Freeze and finalize this Annual Indent?')) {
      try {
        await axios.post('/annual-indent/create/freeze', {
          finYearId: selectedFinYear,
          indentId: headerInfo.indentId
        });
        setHeaderInfo(prev => ({ ...prev, status: 'C' }));
        setMsg('Indent Finalized Successfully');
        setTimeout(() => {
          navigate('/annual-indent/upload-forward');
        }, 1200);
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
        setMsg('Annual Indent Deleted Successfully');
        setTimeout(() => {
          navigate('/annual-indent/upload-forward');
        }, 1000);
      } catch (err) {
        console.error('Failed to delete indent:', err);
        alert('Failed to delete annual indent');
      }
    }
  };

  // Download Sample Excel Handler (lnkDownload_Click)
  const handleDownloadSampleFile = async () => {
    try {
      const res = await axios.get('/annual-indent/download-format');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        let tableHtml = `
          <table border="1">
            <thead>
              <tr style="background-color: #166534; color: #ffffff; font-weight: bold;">
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
                <th>ANNUAL_INDENT_26_27</th>
                <th>RATE</th>
                <th>CATEGORYNAME</th>
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
              <td>${r.formulation || ''}</td>
              <td>${r.strength || ''}</td>
              <td>${r.groupName || ''}</td>
              <td>${r.edl || ''}</td>
              <td>${r.issuedFromWh || 0}</td>
              <td>${r.actualConsumption || 0}</td>
              <td>${r.estimatedConsumption || 0}</td>
              <td>${r.currentStock || 0}</td>
              <td>${r.annualIndent2627 || 0}</td>
              <td>${r.rate || 0}</td>
              <td>${r.categoryName || ''}</td>
            </tr>
          `;
        });
        tableHtml += `</tbody></table>`;
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ItemIndent_${user?.facilityId || '22595'}.xls`;
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

  // Export Current Grid to Excel (imgbtnExport_Click)
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
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
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
    a.download = `ItemIndentList_${currentFyText.replace(/\s+/g, '_')}.xls`;
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

              {/* Title Header Banner (Matching ASPX ctl00_cPlhCenter_lblTitle & lbtnBack) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl shadow-lg p-5 text-white border border-blue-700/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight text-center md:text-left">
                    Upload Annual Indent Excel Document
                  </h1>
                </div>

                <button
                  onClick={() => navigate('/annual-indent/upload-forward')}
                  className="px-4 py-2 bg-blue-700/60 hover:bg-blue-600 text-blue-100 font-bold text-xs rounded-xl border border-blue-500/40 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>

              {/* Form Controls Card matching ASP.NET WebForm AnualItemIndent.aspx Header Panels */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                
                {headerEditMode ? (
                  /* Edit Header Panel (pnlEdit) */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      
                      {/* Fin Year */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Fin Year:
                        </label>
                        <select
                          value={selectedFinYear}
                          onChange={(e) => setSelectedFinYear(e.target.value)}
                          disabled={dropdownLoading}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none"
                        >
                          {finYears.map(fy => (
                            <option key={fy.accYrSetId} value={fy.accYrSetId}>
                              {fy.accYear}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Annual Indent No */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Annual Indent No:
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={headerInfo.indentNo}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold outline-none"
                        />
                      </div>

                      {/* Indent Date */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Indent Date:
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={headerInfo.indentDate}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 text-xs font-extrabold outline-none"
                        />
                      </div>
                    </div>

                    {/* Annual Indent Category Dropdown (ddlAIType) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          Select Annual Indent Category:
                        </label>
                        <div className="flex-1 w-full">
                          <select
                            value={selectedCategory}
                            onChange={(e) => {
                              setSelectedCategory(e.target.value);
                              setCategoryError('');
                            }}
                            className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                              categoryError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <option value="0">-- Select Category --</option>
                            {categories.map(cat => (
                              <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.categoryName}
                              </option>
                            ))}
                          </select>
                          {categoryError && (
                            <span className="text-red-500 text-[11px] font-bold mt-1 block">
                              {categoryError}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Generate / Cancel Buttons */}
                    <div className="flex justify-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <button
                        onClick={handleGenerateHeader}
                        className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                      >
                        Generate
                      </button>
                      <button
                        onClick={handleCancelHeader}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Header Panel (pnlView) */
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold block">Fin Year:</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {finYears.find(fy => String(fy.accYrSetId) === String(selectedFinYear))?.accYear || selectedFinYear}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Annual Indent No:</span>
                        <span className="font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                          {headerInfo.indentNo}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Indent Date:</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {headerInfo.indentDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Annual Indent Type:</span>
                        <span className="font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                          {headerInfo.categoryName || categories.find(c => String(c.categoryId) === String(selectedCategory))?.categoryName || 'General'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setHeaderEditMode(true)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-blue-300 rounded-xl transition-all shadow-sm shrink-0"
                      title="Edit Header Info"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* File Upload & Actions Row (btnupload, btndelete, btnFreez) */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  
                  {/* Upload Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Upload Excel:
                    </span>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                    />
                    <button
                      onClick={handleUploadExcel}
                      disabled={uploading}
                      className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1 disabled:opacity-50"
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
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Freeze Action */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      click on Freeze button to finalize Indent for selected Fin Year:
                    </span>
                    <button
                      onClick={handleFreeze}
                      disabled={headerInfo.status === 'C'}
                      className="px-5 py-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                      <span>{headerInfo.status === 'C' ? 'Freezed' : 'Freeze'}</span>
                    </button>
                  </div>

                </div>

                {/* Export Excel Button Bar (imgbtnExport_Click) */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    To download click on excel button:
                  </span>
                  <button
                    onClick={handleExportToExcel}
                    className="p-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1"
                    title="Export Indent List to Excel"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                </div>

                {/* Summary Info Table (Left Box matching ASP.NET WebForm) */}
                <div className="w-full sm:w-72 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                          No of Item
                        </td>
                        <td className="py-2 px-3 font-extrabold text-blue-700 dark:text-blue-400 text-center">
                          {calculatedNoOfItems}
                        </td>
                      </tr>
                      <tr className="bg-white dark:bg-[#1e293b]">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                          Aprox Indent Value(cr.)
                        </td>
                        <td className="py-2 px-3 font-extrabold text-blue-700 dark:text-blue-400 text-center">
                          ₹{calculatedAproxIndentValue}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Messages */}
                {msg && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                    <span>{msg}</span>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold">
                    {error}
                  </div>
                )}

              </div>

              {/* Data Table Panel matching GridView gv1 */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-slate-100 font-bold text-center uppercase tracking-wider border-b border-blue-800">
                        <th className="py-3 px-3 border-r border-blue-800 w-12">Sl. No.</th>
                        <th className="py-3 px-4 border-r border-blue-800 text-left min-w-[220px]">ItemCode & Description</th>
                        <th className="py-3 px-3 border-r border-blue-800 text-center">Group Name</th>
                        <th className="py-3 px-3 border-r border-blue-800 text-right">Consumption</th>
                        <th className="py-3 px-3 border-r border-blue-800 text-right">Current Stock</th>
                        <th className="py-3 px-3 border-r border-blue-800 text-right">Rate</th>
                        <th className="py-3 px-3 border-r border-blue-800 text-right text-blue-200">Anual Indent</th>
                        <th className="py-3 px-3 border-r border-blue-800 text-right text-blue-200">Indent Value</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-blue-600" />
                              <span className="text-sm font-medium">Fetching Annual Indent Items...</span>
                            </div>
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
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
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200"
                            >
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                                {index + 1}
                              </td>

                              {/* ItemCode & Description */}
                              <td className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800">
                                <div className="space-y-0.5 text-[11px]">
                                  <div className="font-bold text-blue-700 dark:text-blue-400">
                                    <span className="text-slate-500 font-medium">Item Code:</span> {row.itemCode}
                                  </div>
                                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    <span className="text-slate-500 font-medium">Item Name:</span> {row.itemName}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400">
                                    <span className="text-slate-500 font-medium">Strength:</span> {row.strength}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-400">
                                    <span className="text-slate-500 font-medium">SKU:</span> {row.unit} | <span className="text-slate-500 font-medium">Type:</span> {row.itemTypeCode} | <span className="text-slate-500 font-medium">Pack:</span> {row.packingQty}
                                  </div>
                                </div>
                              </td>

                              {/* Group Name */}
                              <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                                {row.groupName}
                              </td>

                              {/* Consumption */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.consumption}
                                    onChange={(e) => setEditForm({ ...editForm, consumption: e.target.value })}
                                    className="w-20 px-1.5 py-1 rounded border border-slate-300 text-right text-xs"
                                  />
                                ) : (
                                  row.consumption
                                )}
                              </td>

                              {/* Current Stock */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.currentStock}
                                    onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                                    className="w-20 px-1.5 py-1 rounded border border-slate-300 text-right text-xs"
                                  />
                                ) : (
                                  row.currentStock
                                )}
                              </td>

                              {/* Rate */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-semibold">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                                    className="w-20 px-1.5 py-1 rounded border border-slate-300 text-right text-xs font-semibold"
                                  />
                                ) : (
                                  `₹${Number(row.rate || 0).toFixed(2)}`
                                )}
                              </td>

                              {/* Annual Indent Qty */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-blue-700 dark:text-blue-400">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.facilityIndentQty}
                                    onChange={(e) => setEditForm({ ...editForm, facilityIndentQty: e.target.value })}
                                    className="w-20 px-1.5 py-1 rounded border border-slate-300 text-right text-xs font-bold"
                                  />
                                ) : (
                                  row.facilityIndentQty
                                )}
                              </td>

                              {/* Indent Value */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-extrabold text-blue-700 dark:text-blue-400">
                                ₹{Number(row.indAprVal || indVal || 0).toFixed(2)}
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleSaveEdit(row)}
                                      className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                                      title="Update"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
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
                                      onClick={() => handleStartEdit(row)}
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                      title="Edit Item"
                                    >
                                      <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRow(row)}
                                      className="p-1 text-red-600 hover:text-red-800"
                                      title="Delete Item"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
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
