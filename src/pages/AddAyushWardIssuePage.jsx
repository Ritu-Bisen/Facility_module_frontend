import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  PlusIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api from '../api/axios';

function SearchableItemSelect({ options, value, onChange, placeholder = "Select Item", disabled }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((o) => String(o.itemId) === String(value));

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => (o.itemName || '').toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (itemId) => {
    onChange(String(itemId));
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-between gap-2 w-full h-10 px-3 border rounded-xl text-xs font-semibold cursor-pointer select-none transition-all
          ${disabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen ? 'bg-white border-blue-500 ring-4 ring-blue-100'
            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.itemName : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden min-w-[280px]">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code or item name..."
                className="flex-1 bg-transparent text-xs outline-none text-slate-800 placeholder-slate-400 min-w-0 font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0 text-xs font-bold px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            <li
              onClick={() => handleSelect('0')}
              className={`px-3.5 py-2.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition font-medium ${String(value) === '0' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500'}`}
            >
              Select Item
            </li>
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-4 text-xs text-slate-400 text-center font-medium">
                No items matching "{query}"
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.itemId) === String(value);
                return (
                  <li
                    key={opt.itemId}
                    onClick={() => handleSelect(opt.itemId)}
                    className={`px-3.5 py-2.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition font-medium ${isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                  >
                    {opt.itemName}
                  </li>
                );
              })
            )}
          </ul>

          {/* Summary footer */}
          <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-semibold">
            <span>Search by code or name</span>
            <span>{filteredOptions.length} items</span>
          </div>
        </div>
      )}
    </div>
  );
}

const today = new Date().toISOString().split('T')[0];

const formatDateForInput = (dStr) => {
  if (!dStr) return today;
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return dStr;
  }
};

const formatDateDDMMYYYY = (dStr) => {
  if (!dStr) return '—';
  try {
    const parts = String(dStr).split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dStr;
  } catch (e) {
    return dStr;
  }
};

export default function AddAyushWardIssuePage() {
  const navigate = useNavigate();
  const { id: routeIssueId } = useParams();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Active Tab: 0 = Items, 1 = Item Issue
  const [activeTab, setActiveTab] = useState(0);

  // Header State
  const [issueId, setIssueId] = useState(routeIssueId || localStorage.getItem('currentIssueId') || '');
  const [issueNo, setIssueNo] = useState(localStorage.getItem('currentIssueNo') || 'Auto generated');
  const [wardId, setWardId] = useState('');
  const [requestedDt, setRequestedDt] = useState(today);
  const [requestedBy, setRequestedBy] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [headerSaved, setHeaderSaved] = useState(false);
  const [headerEditing, setHeaderEditing] = useState(true);

  // Wards & Items Dropdowns
  const [wards, setWards] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('0');
  const [currentFacStock, setCurrentFacStock] = useState(0);
  const [issueQtyInput, setIssueQtyInput] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Added Items & Batches
  const [addedItems, setAddedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [batchesMap, setBatchesMap] = useState({});
  const [detailsMap, setDetailsMap] = useState({});

  // Message alert
  const [lblMsg, setLblMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    if (facilityId) {
      loadWards();
      loadItemsDropdown();
      if (issueId && issueId !== '0') {
        loadHeaderInfo(issueId);
        loadIssueItems(issueId);
      } else {
        fetchAutoIssueNo();
      }
    }
  }, [facilityId, issueId]);

  const loadWards = async () => {
    try {
      const res = await api.get(`/ward-issue/wards?facilityId=${facilityId}`);
      const mapped = (res.data || []).map(w => 
        Array.isArray(w) ? { wardId: w[0], wardName: w[1] } : { wardId: w.WARDID || w.wardId, wardName: w.WARDNAME || w.wardName }
      );
      setWards(mapped);
      if (mapped.length > 0 && !wardId) {
        setWardId(String(mapped[0].wardId));
      }
    } catch (e) {
      console.error('Failed to load wards:', e);
    }
  };

  const loadItemsDropdown = async () => {
    try {
      const res = await api.get(`/ward-issue/items?facilityId=${facilityId}`);
      const mapped = (res.data || []).map(i =>
        Array.isArray(i) ? { itemId: i[0], itemName: i[1] } : { itemId: i.ITEMID || i.itemId, itemName: i.ITEMNAME || i.itemName }
      );
      setItemsList(mapped);
    } catch (e) {
      console.error('Failed to load items dropdown:', e);
    }
  };

  const fetchAutoIssueNo = async () => {
    try {
      const res = await api.get(`/ward-issue/generate-issue-no?facilityId=${facilityId}`);
      if (res.data?.issueNo) {
        setIssueNo(res.data.issueNo);
      }
    } catch (e) {
      console.error('Failed to auto generate issue no:', e);
    }
  };

  const loadHeaderInfo = async (id) => {
    try {
      const res = await api.get(`/ward-issue/${id}`);
      if (res.data) {
        const d = res.data;
        const fetchedIssueNo = d.issueNo || d.ISSUENO || d.IssueNo || 'Auto generated';
        const fetchedWardId = String(d.wardId || d.WARDID || d.WardID || '');
        const fetchedReqBy = d.requestedBy || d.requestBy || d.wrequestBy || d.WREQUESTBY || d.WRequestBy || '';
        const fetchedReqDt = d.requestedDt || d.requestDate || d.wrequestDate || d.WREQUESTDATE || d.WRequestDate;
        const fetchedIssDt = d.issueDate || d.ISSUEDATE || d.IssueDate;

        setIssueNo(fetchedIssueNo);
        setWardId(fetchedWardId);
        setRequestedBy(fetchedReqBy);
        if (fetchedReqDt) {
          setRequestedDt(formatDateForInput(fetchedReqDt));
        }
        if (fetchedIssDt) {
          setIssueDate(formatDateForInput(fetchedIssDt));
        }
        setHeaderSaved(true);
        setHeaderEditing(false);
      }
    } catch (e) {
      console.error('Failed to load header info:', e);
    }
  };

  const loadIssueItems = async (id) => {
    setLoadingItems(true);
    try {
      const res = await api.get(`/ward-issue/${id}/items?facilityId=${facilityId}`);
      const itemsData = res.data || [];
      setAddedItems(itemsData);

      // Load batches & item details for each item
      itemsData.forEach(async (item) => {
        const iId = item.issueItemId || item.ISSUEITEMID;
        const itmId = item.itemId || item.ITEMID;
        if (itmId) {
          try {
            const dRes = await api.get(`/items/${itmId}/details`);
            if (dRes.data) {
              setDetailsMap(prev => ({ ...prev, [itmId]: dRes.data }));
            }
          } catch (err) {
            console.error(err);
          }
        }
        if (iId && itmId) {
          try {
            const bRes = await api.get(`/ward-issue/batches/${iId}/${itmId}`);
            if (bRes.data?.success) {
              setBatchesMap(prev => ({ ...prev, [iId]: bRes.data.data || [] }));
            }
          } catch (err) {
            console.error(err);
          }
        }
      });
    } catch (e) {
      console.error('Failed to load issue items:', e);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectItemChange = async (itemId) => {
    setSelectedItemId(itemId);
    if (!itemId || itemId === '0') {
      setCurrentFacStock(0);
      return;
    }
    try {
      const res = await api.get(`/ward-issue/facility-stock?facilityId=${facilityId}&itemId=${itemId}`);
      setCurrentFacStock(res.data?.facilityStock || 0);
    } catch (e) {
      console.error('Failed to fetch stock:', e);
      setCurrentFacStock(0);
    }
  };

  const handleUpdateHeader = async (e) => {
    if (e) e.preventDefault();
    if (!wardId) {
      setLblMsg({ text: 'Please select a Ward', isError: true });
      return;
    }
    const isFirstSave = !headerSaved;
    try {
      const payload = {
        issueId: issueId || undefined,
        facilityId,
        wardId,
        issueNo: issueNo === 'Auto generated' ? undefined : issueNo,
        requestedBy,
        requestedDt,
        issueDate
      };
      const res = await api.post('/ward-issue', payload);
      if (res.data?.issueId) {
        const newId = String(res.data.issueId);
        setIssueId(newId);
        if (res.data.issueNo) {
          setIssueNo(res.data.issueNo);
          localStorage.setItem('currentIssueNo', res.data.issueNo);
        }
        localStorage.setItem('currentIssueId', newId);
        setHeaderSaved(true);
        setHeaderEditing(false);
        setLblMsg({ text: isFirstSave ? 'Issue created successfully' : 'Header updated successfully', isError: false });
        loadIssueItems(newId);
      }
    } catch (e) {
      console.error('Failed to save header:', e);
      setLblMsg({ text: e.response?.data?.error || 'Failed to save header info', isError: true });
    }
  };

  const handleSaveItem = async () => {
    if (!issueId || issueId === '0') {
      if (!wardId) {
        setLblMsg({ text: 'Please select a Ward and click Update first', isError: true });
        return;
      }
      try {
        const payload = { facilityId, wardId, issueNo: issueNo === 'Auto generated' ? undefined : issueNo, requestedBy, requestedDt, issueDate };
        const res = await api.post('/ward-issue', payload);
        if (res.data?.issueId) {
          const newId = String(res.data.issueId);
          setIssueId(newId);
          if (res.data.issueNo) {
            setIssueNo(res.data.issueNo);
            localStorage.setItem('currentIssueNo', res.data.issueNo);
          }
          localStorage.setItem('currentIssueId', newId);
          setHeaderSaved(true);
          setHeaderEditing(false);
          saveItemWithIssueId(newId);
        }
      } catch (err) {
        setLblMsg({ text: err.response?.data?.error || 'Failed to save header', isError: true });
        return;
      }
    } else {
      saveItemWithIssueId(issueId);
    }
  };

  const [editingIssueItemId, setEditingIssueItemId] = useState(null);

  const handleEditItem = async (item) => {
    const iId = item.issueItemId || item.ISSUEITEMID;
    const itmId = String(item.itemId || item.ITEMID);
    const qty = item.issueQty || item.ISSUEQTY || 0;

    setEditingIssueItemId(iId);
    setSelectedItemId(itmId);
    setIssueQtyInput(String(qty));

    try {
      const res = await api.get(`/ward-issue/facility-stock?facilityId=${facilityId}&itemId=${itmId}`);
      setCurrentFacStock(res.data?.facilityStock || 0);
    } catch (e) {
      console.error('Failed to fetch stock:', e);
      setCurrentFacStock(item.curStock || item.CURSTOCK || 0);
    }
  };

  const handleCancelItemEdit = () => {
    setEditingIssueItemId(null);
    setSelectedItemId('0');
    setCurrentFacStock(0);
    setIssueQtyInput('');
  };

  const saveItemWithIssueId = async (currentIssueId) => {
    if (!selectedItemId || selectedItemId === '0') {
      setLblMsg({ text: 'Please select an Item', isError: true });
      return;
    }
    if (!issueQtyInput || parseFloat(issueQtyInput) <= 0) {
      setLblMsg({ text: 'Enter Issue Quantity', isError: true });
      return;
    }

    setSavingItem(true);
    setLblMsg({ text: '', isError: false });
    try {
      const payload = {
        itemId: selectedItemId,
        curStock: currentFacStock,
        allotted: issueQtyInput,
        issueQty: issueQtyInput,
        issueItemId: editingIssueItemId || undefined
      };

      if (editingIssueItemId) {
        const res = await api.put(`/ward-issue/items/${editingIssueItemId}`, payload);
        setLblMsg({ text: res.data?.message || 'Item updated successfully', isError: false });
      } else {
        const res = await api.post(`/ward-issue/${currentIssueId}/items`, payload);
        setLblMsg({ text: 'Item added successfully', isError: false });
      }

      handleCancelItemEdit();
      loadIssueItems(currentIssueId);
    } catch (e) {
      console.error('Failed to save item:', e);
      setLblMsg({ text: e.response?.data?.error || 'Failed to save item', isError: true });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (issueItemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/ward-issue/items/${issueItemId}`);
      setLblMsg({ text: 'Item deleted successfully', isError: false });
      loadIssueItems(issueId);
    } catch (e) {
      console.error('Failed to delete item:', e);
      setLblMsg({ text: e.response?.data?.error || 'Delete not allowed', isError: true });
    }
  };

  const handleCompleteIssue = async () => {
    if (!issueId || issueId === '0') {
      alert('No indent to complete');
      return;
    }
    if (addedItems.length === 0) {
      alert('Please add at least one item before issuing');
      return;
    }
    if (!window.confirm('Are you sure you want to complete and issue this ward request?')) return;
    try {
      const res = await api.post(`/ward-issue/${issueId}/complete`);
      alert(res.data?.message || 'Status changed successfully');
      localStorage.removeItem('currentIssueId');
      localStorage.removeItem('currentIssueNo');
      navigate('/ayush-ward-issue');
    } catch (e) {
      console.error('Failed to complete issue:', e);
      alert(e.response?.data?.error || 'Failed to complete issue');
    }
  };

  const handleDeleteWholeIssue = async () => {
    if (!issueId || issueId === '0') return;
    if (!window.confirm('Are you sure you want to delete this whole indent?')) return;
    try {
      await api.delete(`/ward-issue/${issueId}`);
      alert('Deleted successfully');
      localStorage.removeItem('currentIssueId');
      localStorage.removeItem('currentIssueNo');
      navigate('/ayush-ward-issue');
    } catch (e) {
      console.error('Failed to delete issue:', e);
      alert(e.response?.data?.error || 'Failed to delete issue');
    }
  };

  const selectedWardObj = wards.find(w => String(w.wardId) === String(wardId));

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Page Title & Back Button Section */}
              <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                    Add Ayush Ward Issue
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Issue drugs and supplies to facility wards</p>
                </div>
                <button
                  onClick={() => navigate('/ayush-ward-issue')}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs cursor-pointer"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                  Back
                </button>
              </div>

              {/* Notification Message */}
              {lblMsg.text && (
                <div className={`p-4 rounded-xl text-xs font-bold ${lblMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {lblMsg.text}
                </div>
              )}

              {/* Header Info Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Header Information</h2>
                  {headerSaved && !headerEditing && (
                    <button
                      onClick={() => setHeaderEditing(true)}
                      className="inline-flex items-center px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                    >
                      <PencilIcon className="w-3.5 h-3.5 mr-1" />
                      Edit Header
                    </button>
                  )}
                </div>

                {headerEditing ? (
                  <form onSubmit={handleUpdateHeader} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Ward *</label>
                      <select
                        value={wardId}
                        onChange={(e) => setWardId(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-700"
                        required
                      >
                        <option value="">Select Ward</option>
                        {wards.map(w => (
                          <option key={w.wardId} value={w.wardId}>{w.wardName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Requested Date *</label>
                      <input
                        type="date"
                        value={requestedDt}
                        onChange={(e) => setRequestedDt(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-700"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Requested By</label>
                      <input
                        type="text"
                        value={requestedBy}
                        onChange={(e) => setRequestedBy(e.target.value)}
                        placeholder="Requested By"
                        className="w-full h-9 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Issue No</label>
                      <input
                        type="text"
                        value={issueNo}
                        disabled
                        className="w-full h-9 px-3 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Issue Date *</label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-700"
                        required
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-sm cursor-pointer"
                      >
                        {headerSaved ? 'Update Header' : 'Save Header'}
                      </button>
                      {headerSaved && (
                        <button
                          type="button"
                          onClick={() => setHeaderEditing(false)}
                          className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block">Ward:</span>
                      <span className="font-bold text-slate-800">{selectedWardObj?.wardName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Requested Date:</span>
                      <span className="font-bold text-slate-800">{formatDateDDMMYYYY(requestedDt)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Requested By:</span>
                      <span className="font-bold text-slate-800">{requestedBy || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Issue No:</span>
                      <span className="font-bold text-blue-700 font-mono">{issueNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block">Issue Date:</span>
                      <span className="font-bold text-slate-800">{formatDateDDMMYYYY(issueDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Section - Only visible after Header is Saved */}
              {!headerSaved ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <FolderOpenIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Save Header Information</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Please select a Ward and click <span className="font-bold text-blue-700">"Save Header"</span> above to unlock item selection and batch allocation for this ward issue.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tab Header Bar */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 text-xs font-semibold px-4 pt-3 gap-2">
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`px-5 py-2.5 rounded-t-xl transition cursor-pointer ${activeTab === 0 ? 'bg-white text-blue-700 font-bold border-t-2 border-t-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Items
                  </button>
                  <button
                    onClick={() => setActiveTab(1)}
                    className={`px-5 py-2.5 rounded-t-xl transition cursor-pointer ${activeTab === 1 ? 'bg-white text-blue-700 font-bold border-t-2 border-t-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Item Issue
                  </button>
                </div>

                {/* Tab 0 Content: Items Form & Grid */}
                {activeTab === 0 && (
                  <div className="p-6 space-y-6">
                    
                    {/* Item Entry Controls */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Item *</label>
                          <SearchableItemSelect
                            options={itemsList}
                            value={selectedItemId}
                            onChange={handleSelectItemChange}
                            placeholder="Select Item (Search by Code or Name)"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Current Stock</label>
                          <div className="h-10 px-4 border border-blue-200 bg-blue-50/60 rounded-xl flex items-center text-xs font-bold text-blue-700">
                            {currentFacStock}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Issue Qty *</label>
                          <input
                            type="number"
                            value={issueQtyInput}
                            onChange={(e) => setIssueQtyInput(e.target.value)}
                            placeholder="Qty"
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-700"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveItem}
                            disabled={savingItem}
                            className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-sm cursor-pointer"
                          >
                            {savingItem ? 'Saving...' : editingIssueItemId ? 'Update Item' : 'Save Item'}
                          </button>
                          {editingIssueItemId && (
                            <button
                              type="button"
                              onClick={handleCancelItemEdit}
                              className="h-10 px-4 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Added Items Grid */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px] tracking-wider">
                          <tr>
                            <th className="px-4 py-3.5 text-center w-12 border-r border-slate-100">Sl.</th>
                            <th className="px-4 py-3.5 border-r border-slate-100">Item code &amp; description</th>
                            <th className="px-4 py-3.5 border-r border-slate-100 w-56">Issue Info</th>
                            <th className="px-4 py-3.5 border-r border-slate-100 w-44">Quantity</th>
                            <th className="px-4 py-3.5 border-r border-slate-100 text-center w-24">Actions</th>
                            <th className="px-4 py-3.5">Batches</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {addedItems.map((item, idx) => {
                            const iId = item.issueItemId || item.ISSUEITEMID;
                            const itmId = item.itemId || item.ITEMID;
                            const details = detailsMap[itmId] || {};
                            const batches = batchesMap[iId] || [];
                            
                            const code = item.itemCode || item.ITEMCODE || details.itemcode || '—';
                            const name = item.itemName || item.ITEMNAME || details.itemname || '—';
                            const strength = item.strength || item.STRENGTH || details.strength1 || '';
                            const sku = details.sku || item.SKU || '1';
                            const type = details.type || 'BIOC';
                            const packQty = details.packqty || '1';
                            const edlType = details.edltype || 'EDL';

                            return (
                              <tr key={iId || idx} className="hover:bg-slate-50/50 align-top">
                                <td className="px-4 py-4 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                
                                {/* Item Code & Description Column */}
                                <td className="px-4 py-4 border-r border-slate-100 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-blue-600 text-xs">{code}</span>
                                    <span className="font-bold text-slate-800 text-xs">{name}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                    {strength && <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Strength: {strength}</span>}
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">SKU: {sku}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Type: {type}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">Pack: {packQty}</span>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">{edlType}</span>
                                  </div>
                                </td>

                                {/* Issue Info Column */}
                                <td className="px-4 py-4 border-r border-slate-100 text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Facility Stock:</span>
                                    <span className="font-bold text-slate-800">{item.curStock || item.CURSTOCK || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Requested Qty:</span>
                                    <span className="font-bold text-slate-800">{item.allotted || item.ALLOTTED || 0}</span>
                                  </div>
                                </td>

                                {/* Quantity Column */}
                                <td className="px-4 py-4 border-r border-slate-100 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-medium">Issue Qty:</span>
                                    <span className="font-bold text-blue-700 text-sm">{item.issueQty || item.ISSUEQTY || 0}</span>
                                  </div>
                                </td>

                                {/* Actions Column */}
                                <td className="px-4 py-4 text-center border-r border-slate-100">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditItem(item)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                                      title="Edit Item"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(iId)}
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                      title="Delete Item"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>

                                {/* Batches Column */}
                                <td className="px-4 py-4 text-xs">
                                  {batches.length > 0 ? (
                                    <div className="overflow-hidden border border-slate-200 rounded-xl shadow-2xs">
                                      <table className="w-full text-[11px] border-collapse">
                                        <thead className="bg-slate-800 text-white font-bold">
                                          <tr>
                                            <th className="p-1.5 text-center border-r border-slate-700">Sl.</th>
                                            <th className="p-1.5 text-left border-r border-slate-700">Batch No.</th>
                                            <th className="p-1.5 text-center border-r border-slate-700">Mfg Date</th>
                                            <th className="p-1.5 text-center border-r border-slate-700">Exp Date</th>
                                            <th className="p-1.5 text-left border-r border-slate-700">Stock Location</th>
                                            <th className="p-1.5 text-right">Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                          {batches.map((b, bIdx) => (
                                            <tr key={bIdx} className="hover:bg-slate-50">
                                              <td className="p-1.5 text-center text-slate-400 border-r border-slate-100">{bIdx + 1}</td>
                                              <td className="p-1.5 font-mono font-semibold border-r border-slate-100">{b.BATCHNO || b.BatchNo || b.batchNo || '—'}</td>
                                              <td className="p-1.5 text-center border-r border-slate-100">{formatDateDDMMYYYY(b.MFGDATE || b.MfgDate || b.mfgDate)}</td>
                                              <td className="p-1.5 text-center border-r border-slate-100 font-bold text-rose-600">{formatDateDDMMYYYY(b.EXPDATE || b.ExpDate || b.expDate)}</td>
                                              <td className="p-1.5 border-r border-slate-100">{b.STOCKLOCATION || b.StockLocation || b.stockLocation || '—'}</td>
                                              <td className="p-1.5 text-right font-bold text-slate-800">{b.ISSUEQTY || b.IssueQty || b.issueQty || 0}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">No batches allocated</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {addedItems.length === 0 && (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                                No items added for this ward issue yet. Select an item above and click "Save Item".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCompleteIssue}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full transition shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      >
                        Issue / Complete
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteWholeIssue}
                        className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full transition shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      >
                        Delete Whole Indent
                      </button>
                    </div>

                  </div>
                )}

                {/* Tab 1 Content: Item Issue */}
                {activeTab === 1 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No completed issue items to display.
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
