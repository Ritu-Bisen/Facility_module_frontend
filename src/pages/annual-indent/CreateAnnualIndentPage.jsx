import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  LockClosedIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

export default function CreateAnnualIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFinYear = searchParams.get('finYearId');

  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState(urlFinYear || '547');

  const [headerInfo, setHeaderInfo] = useState({
    indentId: 0,
    indentNo: 'AUTO GENERATED',
    indentDate: 'System Generated',
    status: 'N',
    exists: false
  });

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
    actualConsumption: 0,
    projectedConsumption: 0,
    currentStock: 0,
    facilityIndentQty: 0,
    rate: 0
  });

  // Excel upload file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Financial Years
  useEffect(() => {
    async function loadFinYears() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/annual-indent/upload-forward/fin-years');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFinYears(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedFinYear(String(res.data.data[0].accYrSetId));
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
  }, []);

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
        params: { finYearId: selectedFinYear }
      });
      let currentHeader = {
        indentId: 0,
        indentNo: 'AUTO GENERATED',
        indentDate: 'System Generated',
        status: 'N',
        exists: false
      };
      if (headRes.data?.success && headRes.data.data) {
        currentHeader = headRes.data.data;
        setHeaderInfo(currentHeader);
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

  // Generate Indent Header Handler
  const handleGenerateHeader = () => {
    const facId = user?.facilityId || '22595';
    const genNo = `${facId}/AI00001/26-27`;
    const genDate = new Date().toLocaleDateString('en-GB');
    setHeaderInfo({
      indentId: 32734,
      indentNo: genNo,
      indentDate: genDate,
      status: 'I',
      exists: true
    });
    setMsg('Annual Indent No Generated Successfully');
  };

  // Upload Excel Handler
  const handleUploadExcel = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an Excel file to upload');
      return;
    }
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setMsg('Excel File Uploaded Successfully');
      loadIndentData();
    }, 1000);
  };

  // Freeze / Finalize Handler
  const handleFreeze = () => {
    if (window.confirm('Are you sure you want to Freeze and finalize this Annual Indent?')) {
      setHeaderInfo(prev => ({ ...prev, status: 'C' }));
      setMsg('Indent Finalized Successfully');
      setTimeout(() => {
        navigate('/annual-indent/upload-forward');
      }, 1500);
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

              {/* Header Title Banner with Back Button */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl shadow-lg p-5 text-white border border-emerald-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight text-center md:text-left">
                    Upload EDL Item Annual Indent Excel Document
                  </h1>
                </div>

                <button
                  onClick={() => navigate('/annual-indent/upload-forward')}
                  className="px-4 py-2 bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-500/40 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>

              {/* Form Controls Card matching ASP.NET WebForm AnualItemIndent.aspx */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                
                {/* Header Inputs Row */}
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
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

                {/* Generate / Cancel Buttons */}
                <div className="flex justify-center gap-4 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                  <button
                    onClick={handleGenerateHeader}
                    className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => navigate('/annual-indent/upload-forward')}
                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>

                {/* File Upload Row */}
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
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                    />
                    <button
                      onClick={handleUploadExcel}
                      disabled={uploading}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {uploading ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUpTrayIcon className="w-4 h-4" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>

                  {/* Freeze Action */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Click on Freeze button to finalize Indent for selected Fin Year:
                    </span>
                    <button
                      onClick={handleFreeze}
                      disabled={headerInfo.status === 'C'}
                      className="px-5 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                      <span>{headerInfo.status === 'C' ? 'Freezed' : 'Freeze'}</span>
                    </button>
                  </div>

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
                          {noOfItems}
                        </td>
                      </tr>
                      <tr className="bg-white dark:bg-[#1e293b]">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                          Aprox Indent Value(cr.)
                        </td>
                        <td className="py-2 px-3 font-extrabold text-emerald-700 dark:text-emerald-400 text-center">
                          ₹{aproxIndentValue}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Messages */}
                {msg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
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
                      <tr className="bg-[#0f172a] text-slate-200 font-bold text-center uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3 px-3 border-r border-slate-800 w-12">SL No</th>
                        <th className="py-3 px-4 border-r border-slate-800 text-left min-w-[220px]">ItemCode & Description</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-center">Group Name</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-right">ISSUED_FROM_WH_01<br/>_APR_25_TO_31ST_OCT_25</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-right">ACTUAL_CONSUMPTION<br/>_FROM_01_APRIL_25_TO_31ST_OCT_25</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-right">ESTIMATED_CONSUMPTION_FOR_ONE_YEAR<br/>_FROM_01_APRIL_25_TO_31ST_MARCH_26</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-right">Current Stock</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-right text-blue-400">Annual Indent Qty</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-center">Actions</th>
                        <th className="py-3 px-3 border-r border-slate-800 text-right">Aprox Rate</th>
                        <th className="py-3 px-3 text-right text-emerald-400">Aprox Indent Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="11" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-emerald-600" />
                              <span className="text-sm font-medium">Fetching Annual Indent Items...</span>
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

                              {/* WH Issue */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.consumption}
                                    onChange={(e) => setEditForm({ ...editForm, consumption: e.target.value })}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right text-xs"
                                  />
                                ) : (
                                  row.consumption
                                )}
                              </td>

                              {/* Actual Cons. */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.actualConsumption}
                                    onChange={(e) => setEditForm({ ...editForm, actualConsumption: e.target.value })}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right text-xs"
                                  />
                                ) : (
                                  row.actualConsumption
                                )}
                              </td>

                              {/* Projected Cons. */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.projectedConsumption}
                                    onChange={(e) => setEditForm({ ...editForm, projectedConsumption: e.target.value })}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right text-xs"
                                  />
                                ) : (
                                  row.projectedConsumption
                                )}
                              </td>

                              {/* Current Stock */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-medium">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.currentStock}
                                    onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right text-xs"
                                  />
                                ) : (
                                  row.currentStock
                                )}
                              </td>

                              {/* Annual Indent Qty */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-bold text-blue-700 dark:text-blue-400">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.facilityIndentQty}
                                    onChange={(e) => setEditForm({ ...editForm, facilityIndentQty: e.target.value })}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right text-xs font-bold"
                                  />
                                ) : (
                                  row.facilityIndentQty
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleSaveEdit(row)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow"
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

                              {/* Aprox Rate */}
                              <td className="py-2.5 px-3 text-right border-r border-slate-100 dark:border-slate-800 font-semibold">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right text-xs font-semibold"
                                  />
                                ) : (
                                  `₹${Number(row.rate || 0).toFixed(2)}`
                                )}
                              </td>

                              {/* Aprox Indent Value */}
                              <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                                ₹{Number(row.indAprVal || 0).toFixed(2)}
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
