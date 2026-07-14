import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../api/axios';
import {
  createIndentToOtherFacility,
  getItemsForFacility,
  saveIndentItem,
  getIndentDetail,
  deleteIndentItem,
  updateIndent,
  deleteIndent
} from '../api/indentToOtherFacilityApi';
import { getInFacilityTransferFacilities } from '../api/inFacilityTransferApi';
import { PlusCircleIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const today = new Date().toLocaleDateString('en-IN', {
  day: '2-digit', month: '2-digit', year: 'numeric'
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddIndentToOtherFacilityPage() {
  const navigate   = useNavigate();
  const { indentId: editIndentId } = useParams(); // present when editing
  const user = useSelector(s => s.auth.user);
  const isEditMode = !!editIndentId;

  // Header form state
  const [accYears, setAccYears]         = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [facilities, setFacilities]     = useState([]);
  const [fromFacility, setFromFacility] = useState('');

  // Generated indent state
  const [isGenerating, setIsGenerating]         = useState(false);
  const [generatedIndentNo, setGeneratedIndentNo] = useState('');
  const [generatedIndentId, setGeneratedIndentId] = useState(null);
  const [error, setError]                         = useState(null);

  // Items state (after generation)
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isUpdatingHeader, setIsUpdatingHeader] = useState(false);
  const [rows, setRows] = useState([{ id: Date.now(), itemId: '', itemData: null, reqQty: '', saving: false, saved: false }]);

  // Load fin years
  useEffect(() => {
    api.get('/shc-inter-facility-transfers/fin-years').then(res => {
      const mapped = (res.data.data || []).map(y =>
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] }
          : { AccYrSetID: y.id || y.ACCYRSETID, SHAccYear: y.year || y.AccYear }
      );
      setAccYears(mapped);
      if (mapped.length > 0 && !isEditMode) setSelectedYear(mapped[0].AccYrSetID);
    }).catch(console.error);
  }, []);

  // Load facilities when user is ready
  useEffect(() => {
    if (user?.facilityId) {
      getInFacilityTransferFacilities(user.facilityId)
        .then(res => { if (res.success) setFacilities(res.data || []); })
        .catch(console.error);
    }
  }, [user?.facilityId]);

  // ── Edit mode: load existing indent ────────────────────────────────────────
  useEffect(() => {
    if (isEditMode && editIndentId) {
      loadExistingIndent(editIndentId);
    }
  }, [isEditMode, editIndentId]);

  const loadExistingIndent = async (id) => {
    try {
      const res = await getIndentDetail(id);
      if (res.success && res.data.header) {
        const h = res.data.header;
        setGeneratedIndentNo(h.IndentNo);
        setGeneratedIndentId(Number(h.IndentID));
        setFromFacility(String(h.FromFacilityID));
        setSelectedYear(String(h.AccYrSetID));
        // Load available items for the from facility
        loadItems(h.FromFacilityID);
        // Pre-populate saved item rows
        const savedItems = res.data.items || [];
        if (savedItems.length > 0) {
          setRows(savedItems.map(item => ({
            id: item.itemId,
            itemId: String(item.itemId),
            itemData: {
              itemId:        item.itemId,
              itemCode:      item.itemCode,
              itemName:      item.itemName,
              strength:      item.strength,
              sku:           item.sku,
              itemType:      item.itemType,
              packQty:       item.packQty,
              edlType:       item.edlType,
              facilityStock: item.facStock
            },
            reqQty:      String(item.requestedQty || ''),
            approvedQty: String(item.approvedQty || ''),
            saving:      false,
            saved:       true  // already in DB
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load existing indent:', e);
      setError('Failed to load indent details.');
    }
  };

  // Load items when fromFacility changes (after generation too)
  useEffect(() => {
    if (fromFacility && generatedIndentId) {
      loadItems(fromFacility);
    }
  }, [fromFacility, generatedIndentId]);

  const loadItems = async (facId) => {
    setLoadingItems(true);
    try {
      const res = await getItemsForFacility(facId);
      if (res.success) setAvailableItems(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingItems(false); }
  };

  const handleGenerate = async () => {
    if (!fromFacility) { setError('Please select a From Facility.'); return; }
    if (!selectedYear) { setError('Please select a Financial Year.'); return; }
    setIsGenerating(true); setError(null);
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const res = await createIndentToOtherFacility(fromFacility, selectedYear, todayISO);
      if (res.success) {
        setGeneratedIndentNo(res.data.IndentNo);
        setGeneratedIndentId(res.data.IndentID);
        // Items will load via useEffect
      } else {
        setError(res.message || 'Failed to generate indent.');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleItemSelect = (rowId, itemObj) => {
    setRows(prev => prev.map(r =>
      r.id === rowId ? { ...r, itemId: String(itemObj.itemId), itemData: itemObj, reqQty: '', saved: false } : r
    ));
  };

  const handleQtyChange = (rowId, val) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, reqQty: val, saved: false } : r));
  };

  const handleSaveRow = async (row) => {
    if (!row.itemId) { alert('Please select an item.'); return; }
    if (!row.reqQty || Number(row.reqQty) <= 0) { alert('Please enter a valid Requested Qty.'); return; }
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: true } : r));
    try {
      const res = await saveIndentItem(
        generatedIndentId, row.itemId, Number(row.reqQty), Number(row.approvedQty || row.reqQty), row.itemData?.facilityStock || 0
      );
      if (res.success) {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: false, saved: true } : r));
      } else {
        alert(res.message || 'Failed to save item.');
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: false } : r));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save item.');
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: false } : r));
    }
  };

  const handleEditRow = (itemId) => {
    setRows(prev => prev.map(r => String(r.itemId) === String(itemId) ? { ...r, saved: false } : r));
  };

  const handleDeleteRow = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this saved item?")) return;
    try {
      const res = await deleteIndentItem(generatedIndentId, itemId);
      if (res.success) {
        setRows(prev => prev.map(r => String(r.itemId) === String(itemId) ? { ...r, reqQty: '', saved: false, saving: false } : r));
      } else {
        alert(res.message || 'Failed to delete item.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete item.');
    }
  };

  const handleUpdateIndent = async () => {
    setIsUpdatingHeader(true);
    try {
      const res = await updateIndent(generatedIndentId, fromFacility, selectedYear);
      if (res.success) {
        setIsHeaderEditing(false);
        loadItems(fromFacility);
      } else {
        alert(res.message || 'Failed to update indent header.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update indent header.');
    } finally {
      setIsUpdatingHeader(false);
    }
  };

  const handleDeleteIndent = async () => {
    if (!window.confirm("Are you sure you want to completely delete this Indent? All saved items will be lost.")) return;
    try {
      const res = await deleteIndent(generatedIndentId);
      if (res.success) {
        navigate('/indent-to-other-facility');
      } else {
        alert(res.message || 'Failed to delete indent.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete indent.');
    }
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, { id: Date.now(), itemId: '', itemData: null, reqQty: '', saving: false, saved: false }]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-4">

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded">
                  {error}
                </div>
              )}

              {/* ── Header Card ─────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Dark title bar */}
                <div className="bg-[#0f172a] px-4 py-2.5 flex justify-between items-center gap-4">
                  <h2 className="text-sm font-bold text-white tracking-wide flex-shrink-0">
                    Generate Request No For Inter Facility Transfer Indent
                  </h2>
                  {generatedIndentNo && (
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded border border-slate-700">
                      <span className="text-slate-400 text-xs">Request No:</span>
                      <span className="text-amber-400 font-mono font-bold text-xs tracking-wider">{generatedIndentNo}</span>
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/indent-to-other-facility')}
                    className="flex-shrink-0 px-3 py-1 text-xs font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded transition-colors"
                  >
                    Back
                  </button>
                </div>

                {/* Form row */}
                <div className="p-4">
                  <div className="flex flex-wrap items-end gap-4">
                    {/* Fin Year */}
                    <div className="flex-1 min-w-[130px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Fin Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        disabled={!!generatedIndentId && !isHeaderEditing}
                        className={`w-full h-8 px-2 border border-slate-300 rounded bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${(!!generatedIndentId && !isHeaderEditing) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {accYears.map(yr => (
                          <option key={yr.AccYrSetID} value={yr.AccYrSetID}>{yr.SHAccYear}</option>
                        ))}
                      </select>
                    </div>

                    {/* Request Date */}
                    <div className="flex-1 min-w-[130px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Request Date</label>
                      <input type="text" value={today} disabled
                        className="w-full h-8 px-2 border border-slate-300 rounded bg-slate-100 text-xs text-slate-600 font-semibold cursor-not-allowed" />
                    </div>

                    {/* From Facility */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        From Facility <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={fromFacility}
                        onChange={e => setFromFacility(e.target.value)}
                        disabled={!!generatedIndentId && !isHeaderEditing}
                        className={`w-full h-8 px-2 border border-slate-300 rounded bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${(!!generatedIndentId && !isHeaderEditing) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select From Facility...</option>
                        {facilities.map(fac => (
                          <option key={fac.facilityId} value={fac.facilityId}>{fac.facilityName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Generate / Generated button */}
                    <div className="flex-shrink-0 flex items-end mb-0.5">
                      {!generatedIndentId ? (
                        <button onClick={handleGenerate} disabled={isGenerating}
                          className="h-8 px-5 bg-[#0f172a] hover:bg-slate-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                          {isGenerating ? (
                            <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>Generating...</>
                          ) : 'Generate Indent No'}
                        </button>
                      ) : isHeaderEditing ? (
                        <div className="flex items-center gap-2">
                          <button onClick={handleUpdateIndent} disabled={isUpdatingHeader}
                            className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                            {isUpdatingHeader ? 'Saving...' : 'Update'}
                          </button>
                          <button onClick={() => setIsHeaderEditing(false)} disabled={isUpdatingHeader}
                            className="h-8 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          
                          {/* <button
                            onClick={() => setIsHeaderEditing(true)}
                            title="Edit Header"
                            className="h-8 px-2.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button> */}
                          <button
                            onClick={handleDeleteIndent}
                            title="Delete Indent"
                            className="h-8 px-2.5 text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Item Rows (shown after generation) ──────────────────── */}
              {generatedIndentId && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#0f172a] px-4 py-2.5">
                    <h2 className="text-sm font-bold text-white tracking-wide">Add Items (From Facility Stock)</h2>
                  </div>

                  {loadingItems ? (
                    <div className="flex items-center justify-center py-10 gap-3">
                      <svg className="animate-spin w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <p className="text-xs font-semibold text-slate-500">Loading items from facility...</p>
                    </div>
                  ) : availableItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm font-semibold">
                      No items available in stock at the selected facility.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                            <th className="px-4 py-3 text-center w-12">S.No</th>
                            <th className="px-4 py-3">Item Details</th>
                            <th className="px-4 py-3">Strength/SKU/Type</th>
                            <th className="px-4 py-3 text-right">PackQty</th>
                            <th className="px-4 py-3 text-right">Facility Stock</th>
                            <th className="px-4 py-3 text-center w-32">Req Qty in No.</th>
                            <th className="px-4 py-3 text-center w-32">Approved Qty</th>
                            <th className="px-4 py-3 text-center w-28">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {availableItems.map((item, idx) => {
                            // Find if this item is in the "rows" state (our local state for edits/saves)
                            const rowState = rows.find(r => r.itemId === String(item.itemId)) || {
                              reqQty: '', approvedQty: '', saving: false, saved: false
                            };

                            return (
                              <tr key={item.itemId} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-xs font-bold text-slate-800">{item.itemName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.itemCode}</div>
                                  <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">{item.edlType}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-[11px] text-slate-600">
                                    <span className="font-semibold text-slate-700">Str:</span> {item.strength || '—'}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    <span className="font-semibold text-slate-700">SKU:</span> {item.sku || '—'}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    <span className="font-semibold text-slate-700">Type:</span> {item.itemType || '—'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-xs font-bold text-slate-600">
                                  {item.packQty || '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                                  {item.facilityStock ?? '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={rowState.reqQty}
                                    onChange={e => {
                                      const val = e.target.value;
                                      // Update local row state
                                      setRows(prev => {
                                        const existing = prev.find(r => r.itemId === String(item.itemId));
                                        if (existing) {
                                          return prev.map(r => r.itemId === String(item.itemId) ? { ...r, reqQty: val, approvedQty: val, saved: false } : r);
                                        }
                                        return [...prev, { itemId: String(item.itemId), itemData: item, reqQty: val, approvedQty: val, saving: false, saved: false, id: item.itemId }];
                                      });
                                    }}
                                    disabled={rowState.saved}
                                    className={`w-full h-8 px-2 border border-slate-300 rounded text-xs text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 ${rowState.saved ? 'opacity-60 cursor-not-allowed font-bold text-green-700 bg-green-50' : ''}`}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={rowState.approvedQty}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setRows(prev => {
                                        const existing = prev.find(r => r.itemId === String(item.itemId));
                                        if (existing) {
                                          return prev.map(r => r.itemId === String(item.itemId) ? { ...r, approvedQty: val, saved: false } : r);
                                        }
                                        return [...prev, { itemId: String(item.itemId), itemData: item, reqQty: '', approvedQty: val, saving: false, saved: false, id: item.itemId }];
                                      });
                                    }}
                                    disabled={rowState.saved}
                                    className={`w-full h-8 px-2 border border-slate-300 rounded text-xs text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 ${rowState.saved ? 'opacity-60 cursor-not-allowed font-bold text-green-700 bg-green-50' : ''}`}
                                    placeholder="0"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {rowState.saved ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="inline-flex h-8 px-2 items-center justify-center gap-1 bg-green-50 border border-green-300 rounded text-green-700 text-[10px] font-bold">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Saved
                                      </div>
                                      <button
                                        onClick={() => handleEditRow(item.itemId)}
                                        title="Edit Quantity"
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      >
                                        <PencilIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRow(item.itemId)}
                                        title="Delete Item"
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleSaveRow({ id: item.itemId, itemId: String(item.itemId), itemData: item, reqQty: rowState.reqQty, approvedQty: rowState.approvedQty })}
                                      disabled={rowState.saving || !rowState.reqQty}
                                      className="inline-flex h-8 px-4 w-full items-center justify-center bg-[#1e5f1e] hover:bg-[#155015] text-white text-[11px] font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
                                    >
                                      {rowState.saving ? (
                                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                      ) : null}
                                      SAVE
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
