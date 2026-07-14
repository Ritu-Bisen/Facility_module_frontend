import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getInFacilityTransferFacilities, generateAndSaveInFacilityTransferIssueNo, getInFacilityTransferItems, getInFacilityTransferItemDetails, getInFacilityTransferIssueById, updateInFacilityTransferIssueHeader } from '../api/inFacilityTransferApi';
import api from '../api/axios';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const today = new Date().toISOString().split('T')[0];

const formatDateDDMMYYYY = (dStr) => {
  if (!dStr) return '—';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dStr;
  }
};

function SearchDrop({ options, value, onChange, placeholder, labelKey, valueKey, disabled }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef();

  const list = q.trim()
    ? options.filter((o) => (o[labelKey] || '').toLowerCase().includes(q.toLowerCase()))
    : options;

  const selected = options.find((o) => String(o[valueKey]) === String(value));

  useEffect(() => {
    const h = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openDrop = () => { if (disabled) return; setQ(''); setOpen(true); };
  const pick = (o) => { onChange(o[valueKey]); setOpen(false); setQ(''); };

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        onClick={openDrop}
        className={`flex items-center justify-between gap-2 w-full h-8 px-2 rounded border text-xs cursor-pointer select-none transition
          ${disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : open     ? 'border-blue-500 ring-1 ring-blue-500 bg-white'
            : 'bg-slate-50 border-slate-300 hover:border-blue-400'}`}
      >
        <span className={`truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected[labelKey] : placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-[200] top-full mt-1 w-full min-w-[220px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-1.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <MagnifyingGlassIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to filter..."
                className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400 min-w-0"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-[10px]">✕</button>
              )}
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {list.length === 0
              ? <li className="px-3 py-2 text-xs text-gray-400 text-center">No results</li>
              : list.map((o, i) => (
                <li
                  key={o[valueKey] ?? i}
                  onClick={() => pick(o)}
                  className={`px-2.5 py-1.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0
                    ${String(o[valueKey]) === String(value) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                >
                  {o[labelKey]}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AddInterFacilityIssueFAC() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [form, setForm] = useState({
    toFacility: '',
    remarks: '',
    issueDate: today,
    category: ''
  });
  
  const [facilities, setFacilities] = useState([]);
  const [items, setItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [headerSaved, setHeaderSaved] = useState(() => localStorage.getItem('currentInFacIssueHeaderSaved') === 'true');
  const [parentIssueId, setParentIssueId] = useState(() => id || localStorage.getItem('currentInFacIssueId') || null);
  const [issueNo, setIssueNo] = useState(() => localStorage.getItem('currentInFacIssueNo') || '');
  const [rows, setRows] = useState([{ id: 1, reqQty: '', issueQty: '', issueItemId: null, isEditing: true }]);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [savingRows, setSavingRows] = useState(new Set());

  useEffect(() => {
    if (facilityId) {
      Promise.all([
        loadFacilities(),
        loadItems()
      ]).finally(() => {
        setIsInitialLoading(false);
      });
    } else {
      setIsInitialLoading(false);
    }
  }, [facilityId]);

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const fetchId = id || localStorage.getItem('currentInFacIssueId');
    if (fetchId && !isInitialLoading && !hasLoadedData.current) {
      hasLoadedData.current = true;
      loadIssueData(fetchId);
    }
  }, [id, isInitialLoading]);

  const loadIssueData = async (issueId) => {
    setIsLoadingData(true);
    const res = await getInFacilityTransferIssueById(issueId);
    setIsLoadingData(false);
    if (res.success && res.issue) {
      setForm({
        toFacility: res.issue.ToFacilityID || '',
        issueDate: res.issue.IssueDate ? String(res.issue.IssueDate).substring(0, 10) : today,
        category: '', 
        remarks: res.issue.Remarks || ''
      });
      setIssueNo(res.issue.IssueNo || '');
      setParentIssueId(res.issue.IssueID || id);
      setHeaderSaved(true);

      if (res.items && res.items.length > 0) {
        const loadedRows = res.items.map((item, idx) => ({
          id: Date.now() + idx,
          itemId: item.ItemID,
          reqQty: item.Allotted,
          issueQty: item.IssueQty,
          issueItemId: item.IssueItemID,
          details: null,
          isEditing: false
        }));
        
        setRows(loadedRows);
        setIsItemsLoading(true);

        const rowsWithDetails = await Promise.all(loadedRows.map(async (r) => {
            let fetchedBatches = [];
            try {
              if (r.issueItemId && r.itemId) {
                const bRes = await api.get(`/ward-issue/batches/${r.issueItemId}/${r.itemId}`);
                if (bRes.data && bRes.data.success) fetchedBatches = bRes.data.data || [];
              }
            } catch(e) { console.error("Error fetching batches", e); }

            const dRes = await getInFacilityTransferItemDetails(facilityId, r.itemId);
            if (dRes.success && dRes.data) {
                return { ...r, details: dRes.data, batches: fetchedBatches };
            }
            return { ...r, batches: fetchedBatches };
        }));
        
        setRows(rowsWithDetails);
        setIsItemsLoading(false);
      }
    }
  };

  const loadFacilities = async () => {
    try {
      const res = await api.get('/shc-inter-facility-transfers/all-facilities');
      if (res.data && res.data.success) {
        setFacilities(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load facilities:', e);
    }
  };

  const loadItems = async () => {
    const res = await getInFacilityTransferItems(facilityId);
    if (res.success) {
      const formattedItems = (res.data || []).map(item => ({
        ...item,
        displayLabel: `${item.itemCode} - ${item.itemName}`
      }));
      setItems(formattedItems);
    }
  };

  const handleGenerateIssueNo = async () => {
    if (!facilityId) return;
    if (!form.toFacility) {
      alert('Please select Transfer Facility');
      return;
    }
    if (!form.issueDate) {
      alert('Please select Issue Date');
      return;
    }
    
    setIsGenerating(true);
    try {
      if (parentIssueId) {
        const payload = {
          toFacilityId: form.toFacility,
          issueDate: form.issueDate,
          remarks: form.remarks || ''
        };
        const res = await updateInFacilityTransferIssueHeader(parentIssueId, payload);
        
        if (res.success) {
          setHeaderSaved(true);
          localStorage.setItem('currentInFacIssueHeaderSaved', 'true');
          alert("Header updated successfully");
        } else {
          alert(res.message || "Failed to update header");
        }
      } else {
        const payload = {
          toFacilityId: form.toFacility,
          issueDate: form.issueDate,
          issueType: 'SH',
          requestBy: form.remarks || '',
          remarks: form.remarks || ''
        };
        const res = await api.post(`/shc-inter-facility-transfers/direct-issues/${facilityId}`, payload);
        const data = res.data;
        if (data && data.success) {
          setIssueNo(data.issueNo);
          setHeaderSaved(true);
          localStorage.setItem('currentInFacIssueNo', data.issueNo);
          localStorage.setItem('currentInFacIssueHeaderSaved', 'true');
          
          if (data.issueId || data.data?.issueId) {
            const newId = data.issueId || data.data.issueId;
            setParentIssueId(newId);
            localStorage.setItem('currentInFacIssueId', newId);
          }
          alert("Issue Generated successfully");
        } else {
          alert(data?.message || "Failed to generate issue");
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error generating issue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditHeader = () => {
    setHeaderSaved(false);
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm("Are you sure you want to delete this entire issue? This action cannot be undone.")) return;
    
    try {
      const res = await api.delete(`/shc-inter-facility-transfers/issues/${parentIssueId}`);
      if (res.data && res.data.success) {
        alert("Issue deleted successfully");
        localStorage.removeItem('currentInFacIssueNo');
        localStorage.removeItem('currentInFacIssueId');
        localStorage.removeItem('currentInFacIssueHeaderSaved');
        navigate('/inter-facility-shc-transfer');
      } else {
        alert(res.data?.message || "Failed to delete issue");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting issue");
    }
  };

  const handleDeleteHeader = async () => {
    if (!parentIssueId) return;
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await api.delete(`/ward-issue/${parentIssueId}`);
      setParentIssueId(null);
      setIssueNo('');
      setHeaderSaved(false);
      setForm({ toFacility: '', category: '', issueDate: today, remarks: '' });
      setRows([{ id: 1, reqQty: '', issueQty: '', issueItemId: null, isEditing: true }]);
      
      localStorage.removeItem('currentInFacIssueId');
      localStorage.removeItem('currentInFacIssueNo');
      localStorage.removeItem('currentInFacIssueHeaderSaved');
      navigate('/inter-facility-shc-transfer');
    } catch (e) {
      console.error(e);
      alert('Failed to delete issue.');
    }
  };

  const handleCompleteIssue = async () => {
    if (!parentIssueId) return;
    setIsGenerating(true);
    try {
      await api.post(`/ward-issue/${parentIssueId}/complete`);
      alert("Issue finalized successfully!");
      setShowFreezeModal(false);
      setParentIssueId(null);
      setIssueNo('');
      setHeaderSaved(false);
      setForm({ toFacility: '', category: '', issueDate: today, remarks: '' });
      setRows([]);
      localStorage.removeItem('currentInFacIssueId');
      localStorage.removeItem('currentInFacIssueNo');
      localStorage.removeItem('currentInFacIssueHeaderSaved');
      navigate('/inter-facility-shc-transfer');
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to freeze issue.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleAddRow = () => {
    setRows(p => [...p, { id: Date.now(), itemId: '', reqQty: '', issueQty: '', issueItemId: null, isEditing: true }]);
  };

  const handleRowItemChange = async (rowId, itemId) => {
    setRows(p => p.map(r => r.id === rowId ? { ...r, itemId, details: null, isLoadingDetails: true } : r));
    
    if (itemId) {
      const res = await getInFacilityTransferItemDetails(facilityId, itemId);
      if (res.success && res.data) {
        setRows(p => p.map(r => r.id === rowId ? { ...r, details: res.data, isLoadingDetails: false } : r));
      } else {
        setRows(p => p.map(r => r.id === rowId ? { ...r, isLoadingDetails: false } : r));
      }
    } else {
      setRows(p => p.map(r => r.id === rowId ? { ...r, isLoadingDetails: false } : r));
    }
  };

  const handleRowQtyChange = (rowId, field, value) => {
    setRows(p => p.map(r => {
      if (r.id === rowId) {
        if (field === 'reqQty') {
          return { ...r, reqQty: value, issueQty: value };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSaveRow = async (row) => {
    if (!parentIssueId) {
      alert("Please generate or save the header first.");
      return;
    }
    if (!row.itemId) { alert("Please select an item."); return; }
    
    const reqQty = Number(row.reqQty) || 0;
    const issueQty = Number(row.issueQty) || 0;
    const stock = Number(row.details?.stock) || 0;
    
    if (reqQty <= 0) { alert("Requested Quantity must be greater than 0"); return; }
    if (issueQty <= 0) { alert("Issue Quantity must be greater than 0"); return; }
    if (issueQty > reqQty) { alert("Issue Quantity cannot be greater than Requested Quantity"); return; }
    if (issueQty > stock) { alert("Issue Quantity cannot be greater than Facility Stock"); return; }

    const payload = {
      issueId: parentIssueId,
      itemId: row.itemId,
      curStock: stock,
      allotted: reqQty,
      issueQty: issueQty,
      issueItemId: row.issueItemId || 0
    };

    setSavingRows(prev => new Set(prev).add(row.id));

    try {
      let activeIssueItemId = row.issueItemId;
      if (row.issueItemId) {
        await api.put(`/ward-issue/items/${row.issueItemId}`, payload);
      } else {
        const res = await api.post(`/ward-issue/${parentIssueId}/items`, payload);
        activeIssueItemId = res.data.issueItemId || res.data.data?.issueItemId || res.data.id;
      }

      let fetchedBatches = [];
      try {
        const batchRes = await api.get(`/ward-issue/batches/${activeIssueItemId}/${row.itemId}`);
        if (batchRes.data && batchRes.data.success) {
          fetchedBatches = batchRes.data.data || [];
        }
      } catch (e) {
        console.error("Error fetching batches:", e);
      }

      setRows(p => p.map(r => r.id === row.id ? { ...r, issueItemId: activeIssueItemId, batches: fetchedBatches, isEditing: false } : r));
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to save item");
    } finally {
      setSavingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(row.id);
        return newSet;
      });
    }
  };

  const handleDeleteSavedRow = async (row) => {
    if (!window.confirm('Are you sure you want to delete this saved item?')) return;
    
    if (row.issueItemId) {
      try {
        await api.delete(`/ward-issue/items/${row.issueItemId}`);
        setRows(p => p.filter(r => r.id !== row.id));
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.error || error.response?.data?.message || "Failed to delete item");
      }
    } else {
      setRows(p => p.filter(r => r.id !== row.id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {(isLoadingData || isInitialLoading) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-slate-600 uppercase tracking-wider">
                  {isInitialLoading ? 'Loading Data...' : 'Loading Issue...'}
                </p>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#0f172a] px-4 py-2.5 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    SHC Inter Facility Transfer
                  </h2>
                  <div className="flex items-center gap-4">
                    {issueNo && (
                      <div className="flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-1 rounded border border-slate-700 shadow-inner">
                        <span className="text-slate-400 font-medium">Issue No:</span>
                        <span className="text-amber-400 font-mono font-bold tracking-wider">{issueNo}</span>
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/inter-facility-shc-transfer')}
                      className="inline-flex items-center px-3 py-1 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded transition-colors"
                    >
                      <ArrowLeftIcon className="w-3.5 h-3.5 mr-1" />
                      Back
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Transfer Facility <span className="text-red-500">*</span></label>
                      <SearchDrop
                        options={facilities}
                        value={form.toFacility}
                        onChange={(val) => setForm(p => ({ ...p, toFacility: val }))}
                        placeholder="Select Facility..."
                        labelKey="facilityName"
                        valueKey="facilityId"
                        disabled={headerSaved}
                      />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Issue Category / Higher EDL Category <span className="text-red-500">*</span></label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleFormChange}
                        disabled={headerSaved}
                        className={`w-full h-8 px-2 border border-slate-300 rounded bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${headerSaved ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select...</option>
                        <option value="EDL category">EDL category</option>
                        <option value="EDL of higher category">EDL of higher category</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Issue Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="issueDate"
                        value={form.issueDate}
                        onChange={handleFormChange}
                        disabled={headerSaved}
                        className={`w-full h-8 px-2 border border-slate-300 rounded bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${headerSaved ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks</label>
                      <input
                        type="text"
                        name="remarks"
                        value={form.remarks}
                        onChange={handleFormChange}
                        disabled={headerSaved}
                        className={`w-full h-8 px-2 border border-slate-300 rounded bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${headerSaved ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="Optional remarks..."
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      {parentIssueId && headerSaved ? (
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={handleEditHeader}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                            title="Edit Issue Header"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteIssue}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                            title="Delete Entire Issue"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGenerateIssueNo}
                          disabled={isGenerating}
                          className={`h-8 px-4 text-xs font-bold uppercase tracking-wider text-white ${parentIssueId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} rounded shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 whitespace-nowrap ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isGenerating 
                            ? (parentIssueId ? 'Saving...' : 'Generating...') 
                            : (parentIssueId ? 'Save Changes' : 'Generate Issue No')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 border border-slate-200 rounded-lg shadow-sm bg-white overflow-visible">
                  <div className="bg-[#1e293b] px-5 py-3 flex justify-between items-center text-sm rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="font-bold text-white tracking-wide">Issue Items List</span>
                    </div>
                  </div>

                  <div className="overflow-visible">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                          <th className="px-5 py-4 text-center w-12">SL.</th>
                          <th className="px-5 py-4 w-72">ITEM CODE & DESCRIPTION</th>
                          <th className="px-5 py-4 w-48">STOCK & REQUEST INFO</th>
                          <th className="px-5 py-4 text-center w-40">QUANTITY TO ISSUE</th>
                          <th className="px-5 py-4 text-center w-32">ACTION</th>
                          <th className="px-5 py-4 w-96">BATCH DETAILS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isItemsLoading ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Items...</p>
                              </div>
                            </td>
                          </tr>
                        ) : rows.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                              No items added yet. Click "Add Another Row" to begin.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50 align-top transition-colors">
                            <td className="px-5 py-6 text-center font-bold text-slate-700">{idx + 1}</td>
                            
                            <td className="px-5 py-6">
                              {row.issueItemId && !row.isEditing ? (
                                <>
                                  {/* Read Only Search Box Look for Saved Items */}
                                  <div className="relative mb-3">
                                    <input 
                                      type="text" 
                                      readOnly 
                                      value={row.details?.itemCode || 'Loading...'} 
                                      className="w-full h-8 px-3 border border-slate-200 rounded text-xs text-slate-500 bg-slate-50 outline-none" 
                                    />
                                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                                  </div>
                                  
                                  <div className="font-bold text-slate-800 text-sm leading-tight mb-2">
                                    {row.details?.itemName || 'Loading...'}
                                  </div>
                                </>
                              ) : (
                                <SearchDrop
                                  options={items}
                                  value={row.itemId}
                                  onChange={(val) => handleRowItemChange(row.id, val)}
                                  placeholder="Search Item..."
                                  labelKey="displayLabel"
                                  valueKey="itemId"
                                />
                              )}
                              
                              <div className={`grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11px] text-slate-500 items-baseline ${!row.issueItemId && 'mt-3'}`}>
                                {row.isLoadingDetails ? (
                                  <span className="col-span-2 flex items-center gap-1.5 text-blue-600 font-medium">
                                    <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    Loading details...
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-blue-600 font-semibold col-span-2">Strength: {row.details?.strength || '—'}</span>
                                    <span>SKU: <span className="text-blue-600 underline cursor-pointer">{row.details?.unit || '—'}</span></span>
                                    <span>Type: <span className="font-semibold text-slate-700">{row.details?.type || '—'}</span></span>
                                    <span className="col-span-2">PackQty: <span className="font-semibold text-slate-700">{row.details?.packQty || '—'}</span></span>
                                    <span className="col-span-2 text-blue-600 font-semibold mt-1">EDL Type: {row.details?.edlType || '—'}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-5 py-6 space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-medium">Facility Stock:</span>
                                {row.isLoadingDetails ? (
                                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                                ) : (
                                  <span className="font-bold text-slate-800 text-sm">{row.details ? row.details.stock : 0}</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-slate-600 font-medium block">Requested Qty in No.:</span>
                                <input 
                                  type="number" 
                                  value={row.reqQty}
                                  disabled={row.issueItemId && !row.isEditing}
                                  onChange={(e) => handleRowQtyChange(row.id, 'reqQty', e.target.value)}
                                  className="w-24 px-3 py-1.5 border border-slate-200 rounded text-slate-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-shadow disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" 
                                />
                              </div>
                            </td>
                            
                            <td className="px-5 py-6">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-600 font-medium">Issue Qty in No.:</span>
                                <input 
                                  type="number" 
                                  value={row.issueQty}
                                  disabled={row.issueItemId && !row.isEditing}
                                  onChange={(e) => handleRowQtyChange(row.id, 'issueQty', e.target.value)}
                                  className="w-20 px-3 py-1.5 border border-slate-200 rounded text-slate-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-shadow disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" 
                                />
                              </div>
                            </td>
                            
                            <td className="px-5 py-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {row.issueItemId && !row.isEditing ? (
                                    <>
                                      <button 
                                        onClick={() => setRows(p => p.map(r => r.id === row.id ? { ...r, isEditing: true } : r))} 
                                        className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-sm transition-colors uppercase"
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteSavedRow(row)} 
                                        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" 
                                        title="Delete Item"
                                      >
                                        <TrashIcon className="w-5 h-5" />
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleSaveRow(row)} 
                                      disabled={savingRows.has(row.id)}
                                      className={`px-4 py-1.5 text-[10px] font-bold tracking-wider text-white rounded-full shadow-sm transition-colors uppercase ${savingRows.has(row.id) ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                      title="Save Item"
                                    >
                                      {savingRows.has(row.id) ? 'Updating...' : (row.issueItemId ? 'Save Changes' : 'Save')}
                                    </button>
                                  )}
                                </div>
                            </td>
                            
                            <td className="px-5 py-6">
                              {row.issueItemId ? (
                                <table className="w-full text-[10px] text-center border-collapse border border-slate-200 shadow-sm">
                                  <thead className="bg-[#1e40af] text-white font-bold">
                                    <tr>
                                      <th className="p-1.5 border-r border-slate-600/30">Sl.<br/>No.</th>
                                      <th className="p-1.5 border-r border-slate-600/30">Batch<br/>No.</th>
                                      <th className="p-1.5 border-r border-slate-600/30">Mfg<br/>date</th>
                                      <th className="p-1.5 border-r border-slate-600/30">Exp<br/>Date</th>
                                      <th className="p-1.5 border-r border-slate-600/30">Stock<br/>Location</th>
                                      <th className="p-1.5">Quantity<br/>(in No.s)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white">
                                    {row.batches && row.batches.length > 0 ? row.batches.map((b, bIdx) => (
                                      <tr key={bIdx} className="hover:bg-slate-50">
                                        <td className="p-2 border border-slate-200 font-medium text-slate-500">{bIdx + 1}</td>
                                        <td className="p-2 border border-slate-200 font-bold text-slate-700">{b.BATCHNO || b.batchNo}</td>
                                        <td className="p-2 border border-slate-200 text-slate-500">{formatDateDDMMYYYY(b.MFGDATE || b.mfgDate)}</td>
                                        <td className="p-2 border border-slate-200 text-red-600 font-bold">{formatDateDDMMYYYY(b.EXPDATE || b.expDate)}</td>
                                        <td className="p-2 border border-slate-200 text-slate-500" title={b.STOCKLOCATION || b.stockLocation || '—'}>{b.STOCKLOCATION || b.stockLocation || '—'}</td>
                                        <td className="p-2 border border-slate-200 font-bold text-slate-800">{b.ISSUEQTY || b.issueQty || 0}</td>
                                      </tr>
                                    )) : (
                                      <tr>
                                        <td colSpan="6" className="p-2 border border-slate-200 text-slate-400 italic">No batches allocated</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                  No batches
                                </div>
                              )}
                            </td>
                            
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50 p-3 border-t border-slate-200">
                    <button onClick={handleAddRow} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
                      <PlusCircleIcon className="w-4 h-4 mr-1" /> Add Another Row
                    </button>
                  </div>
                  <div className="bg-slate-100 border-t border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4 mt-8">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowFreezeModal(true)}
                        disabled={!parentIssueId || rows.length === 0 || isGenerating}
                        className={`px-8 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 shadow
                          ${(parentIssueId && rows.length > 0)
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5'
                            : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'}`}
                      >
                        {isGenerating ? 'Processing...' : 'Freeze'}
                      </button>
                      <button
                        onClick={handleDeleteHeader}
                        disabled={!parentIssueId}
                        className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100/85 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>

                    <button
                      onClick={() => navigate('/inter-facility-shc-transfer')}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {showFreezeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <div>
                <h3 className="text-base font-bold">Review &amp; Freeze Issue</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please review the details before freezing</p>
              </div>
              <button 
                onClick={() => setShowFreezeModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Voucher (Issue) No</span>
                  <strong className="text-slate-800 text-sm font-mono">{issueNo || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Transfer Facility</span>
                  <strong className="text-slate-800 text-sm">{facilities.find(f => String(f.facilityId) === String(form.toFacility))?.facilityName || form.toFacility || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Issue Category</span>
                  <strong className="text-slate-800 text-sm">{form.category || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Issue Date</span>
                  <strong className="text-slate-800 text-sm">{formatDateDDMMYYYY(form.issueDate) || '—'}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Remarks</span>
                  <strong className="text-slate-800 text-sm">{form.remarks || '—'}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Items to Issue ({rows.filter((r) => r.issueItemId).length})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-center w-12">Sl.</th>
                        <th className="px-4 py-2.5">Item Code &amp; Name</th>
                        <th className="px-4 py-2.5 text-center w-24">Requested</th>
                        <th className="px-4 py-2.5 text-center w-24">Issue Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {rows.filter((r) => r.issueItemId).map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-center text-slate-400 font-semibold">{index + 1}</td>
                          <td className="px-4 py-2">
                            <span className="font-semibold text-slate-800">{row.details?.itemCode || ''}</span> - {row.details?.itemName || ''}
                          </td>
                          <td className="px-4 py-2 text-center font-medium">{row.reqQty}</td>
                          <td className="px-4 py-2 text-center font-bold text-indigo-600 bg-slate-50/20">{row.issueQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-amber-800 flex items-center gap-1.5">
                  ⚠️ Important:
                </p>
                <p className="text-amber-800 leading-relaxed font-semibold">
                  By clicking "Freeze Now", all saved data will be finalized, stock deductions will be processed, and inventory balances will be updated accordingly. This action may not be reversible.
                </p>
                <p className="text-amber-700 font-medium">
                  Please verify all entered values before proceeding.
                </p>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCompleteIssue();
                }}
                disabled={isGenerating}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 border border-transparent rounded-xl hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-wait"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : '🔒 Freeze Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
