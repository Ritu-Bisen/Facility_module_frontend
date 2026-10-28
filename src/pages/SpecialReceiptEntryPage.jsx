import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeftIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon, 
  PlusIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function SpecialReceiptEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReceiptId = searchParams.get('ReceiptID') || searchParams.get('receiptId') || '0';
  const mode = searchParams.get('Mode') || '';

  // Tab State: 0 = "Special Receipt", 1 = "General"
  const [activeTab, setActiveTab] = useState(0);

  // Header State
  const [headerInfo, setHeaderInfo] = useState({
    receiptId: rawReceiptId === '0' && mode === 'Create' ? '0' : rawReceiptId,
    receiptNo: 'Auto generated',
    receiptDate: '',
    spLocationId: '',
    receiptFromName: '',
    status: 'I',
    remarks: '',
    stkRegNo: '',
    stkRegDate: ''
  });

  const [isEditingHeader, setIsEditingHeader] = useState(rawReceiptId === '0' || mode === 'Create');
  const [headerDate, setHeaderDate] = useState('');
  const [headerSpLocation, setHeaderSpLocation] = useState('');
  const [headerError, setHeaderError] = useState('');
  const [spLocations, setSpLocations] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);

  // Items and Batches State
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingHeader, setSubmittingHeader] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [savingBatchItemId, setSavingBatchItemId] = useState(null);
  const [updatingBatchInwNo, setUpdatingBatchInwNo] = useState(null);
  const [deletingBatchInwNo, setDeletingBatchInwNo] = useState(null);

  // Inline New Item Row State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isSearchingItems, setIsSearchingItems] = useState(false);
  const [selectedNewItem, setSelectedNewItem] = useState(null);
  const [newItemQty, setNewItemQty] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemQty, setEditItemQty] = useState('');

  // New Batch Row State per ReceiptItem (keyed by receiptItemId)
  const [newBatches, setNewBatches] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [editingBatchInwNo, setEditingBatchInwNo] = useState(null);
  const [editBatchLocation, setEditBatchLocation] = useState('');

  // General Tab State
  const [voucherNo, setVoucherNo] = useState('');
  const [voucherDate, setVoucherDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 420 });

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}-${mm}-${yyyy}`;
    setHeaderDate(todayStr);

    loadInitialData();
  }, [rawReceiptId]);

  // Position the floating dropdown outside of the table div
  useEffect(() => {
    if (showItemDropdown && searchInputRef.current) {
      const updatePosition = () => {
        if (!searchInputRef.current) return;
        const rect = searchInputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 260;
        const top = spaceBelow < dropdownHeight && rect.top > dropdownHeight
          ? rect.top - dropdownHeight - 4
          : rect.bottom + 4;

        setDropdownPos({
          top,
          left: Math.max(10, Math.min(rect.left, window.innerWidth - 440)),
          width: Math.max(rect.width, 420)
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showItemDropdown, itemSearchResults]);

  // Handle outside clicks to close item dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target)
      ) {
        setShowItemDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSpLocations(),
        fetchStorageLocations(),
        fetchHeaderAndItems(rawReceiptId)
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpLocations = async () => {
    try {
      const res = await api.get('/special-receipt/locations');
      if (res.data && res.data.success) {
        setSpLocations(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching SP locations:', err);
    }
  };

  const fetchStorageLocations = async () => {
    try {
      const res = await api.get('/special-receipt/storage-locations');
      if (res.data && res.data.success) {
        setStorageLocations(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching storage locations:', err);
    }
  };

  const fetchHeaderAndItems = async (recId) => {
    if (!recId || recId === '0') {
      setIsEditingHeader(true);
      return;
    }
    try {
      const resHeader = await api.get('/special-receipt/header', {
        params: { receiptId: recId }
      });
      if (resHeader.data && resHeader.data.success) {
        const info = resHeader.data.data;
        setHeaderInfo(info);
        setHeaderDate(info.receiptDate || '');
        setHeaderSpLocation(info.spLocationId || '');
        setVoucherNo(info.stkRegNo || '');
        setVoucherDate(info.stkRegDate || '');
        setRemarks(info.remarks || '');
        setIsEditingHeader(false);

        await fetchItems(info.receiptId);
      }
    } catch (err) {
      console.error('Error fetching header:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch receipt details');
    }
  };

  const fetchItems = async (recId) => {
    if (!recId || recId === '0') return;
    setItemsLoading(true);
    try {
      const resItems = await api.get('/special-receipt/items', {
        params: { receiptId: recId }
      });
      if (resItems.data && resItems.data.success) {
        const list = resItems.data.data || [];
        setItems(list);
        if (list.length === 0) {
          setIsAddingItem(true);
        }
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleUpdateHeader = async () => {
    setHeaderError('');
    if (!headerDate.trim()) {
      const msg = 'Receipt Date is required.';
      setHeaderError(msg);
      toast.error(msg);
      return;
    }
    if (!headerSpLocation) {
      const msg = 'Receipt From location is required. Please select a location.';
      setHeaderError(msg);
      toast.error(msg);
      return;
    }

    setSubmittingHeader(true);
    try {
      const res = await api.post('/special-receipt/header', {
        receiptId: headerInfo.receiptId || '0',
        receiptDate: headerDate.trim(),
        spLocationId: headerSpLocation
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Updated Successfully');
        setHeaderError('');
        const updated = res.data.data;
        setHeaderInfo(prev => ({
          ...prev,
          receiptId: String(updated.receiptId),
          receiptNo: updated.receiptNo || prev.receiptNo,
          receiptDate: updated.receiptDate || headerDate,
          spLocationId: String(updated.spLocationId),
          receiptFromName: spLocations.find(l => String(l.id) === String(updated.spLocationId))?.name || prev.receiptFromName
        }));
        setIsEditingHeader(false);

        if ((!headerInfo.receiptId || headerInfo.receiptId === '0') && updated.receiptId) {
          navigate(`/special-receipt/entry?ReceiptID=${encodeURIComponent(updated.receiptId)}`, { replace: true });
        }
        await fetchItems(updated.receiptId);
        setIsAddingItem(true);
      }
    } catch (err) {
      console.error('Error updating header info:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save header info';
      setHeaderError(msg);
      toast.error(msg);
    } finally {
      setSubmittingHeader(false);
    }
  };

  const handleCancelHeader = () => {
    if (headerInfo.receiptId !== '0') {
      setHeaderDate(headerInfo.receiptDate || '');
      setHeaderSpLocation(headerInfo.spLocationId || '');
      setIsEditingHeader(false);
    }
  };

  const handleOpenAddItem = () => {
    const unallocatedItem = items.find(it => {
      const itQty = Number(it.receiptAbsQty || 0);
      const bTotal = (it.batches || []).reduce((acc, b) => acc + (Number(b.absRQty) || 0), 0);
      return bTotal < itQty;
    });

    if (unallocatedItem) {
      toast.error(`Please allocate full batch quantity for item ${unallocatedItem.itemCode} before adding another item.`);
      return;
    }

    setIsAddingItem(true);
    setSelectedNewItem(null);
    setNewItemQty('');
    setItemSearchQuery('');
    handleSearchItems('');
  };

  const handleSearchItems = async (q = '') => {
    setItemSearchQuery(q);
    setIsSearchingItems(true);
    try {
      const res = await api.get('/special-receipt/search-items', {
        params: { query: q ? q.trim() : '' }
      });
      if (res.data && res.data.success) {
        setItemSearchResults(res.data.data || []);
      }
    } catch (err) {
      console.error('Error searching items:', err);
    } finally {
      setIsSearchingItems(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedNewItem(item);
    setShowItemDropdown(false);
    setItemSearchQuery('');
    // Focus receipt quantity field immediately after item selection
    setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 100);
  };

  const handleSaveItem = async () => {
    if (!headerInfo.receiptId || headerInfo.receiptId === '0') {
      toast.error('Please update Header information first.');
      return;
    }
    if (!selectedNewItem) {
      toast.error('Please select an item first.');
      return;
    }
    const qty = parseInt(newItemQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid Receipt Quantity (in Nos).');
      qtyInputRef.current?.focus();
      return;
    }
    const multiple = selectedNewItem.multiple || 1;
    if (qty % multiple !== 0) {
      toast.error(`Entered Quantity must be a multiple of ${multiple}`);
      return;
    }

    setSavingItem(true);
    try {
      const res = await api.post('/special-receipt/item', {
        receiptId: headerInfo.receiptId,
        receiptItemId: '0',
        itemId: selectedNewItem.itemId,
        receiptAbsQty: qty
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Item saved successfully');
        setIsAddingItem(false);
        setSelectedNewItem(null);
        setNewItemQty('');
        await fetchItems(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleUpdateItem = async (receiptItemId, itemId, multiple) => {
    const qty = parseInt(editItemQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid Receipt Quantity (in Nos).');
      return;
    }
    if (qty % (multiple || 1) !== 0) {
      toast.error(`Entered Quantity must be a multiple of ${multiple || 1}`);
      return;
    }

    setUpdatingItemId(receiptItemId);
    try {
      const res = await api.post('/special-receipt/item', {
        receiptId: headerInfo.receiptId,
        receiptItemId,
        itemId,
        receiptAbsQty: qty
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Updated successfully');
        setEditingItemId(null);
        setEditItemQty('');
        await fetchItems(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error updating item:', err);
      toast.error(err.response?.data?.message || 'Failed to update item');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = async (receiptItemId) => {
    if (!window.confirm('Do you really want to delete this Item?')) return;
    setDeletingItemId(receiptItemId);
    try {
      const res = await api.delete(`/special-receipt/item/${receiptItemId}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Deleted Successfully');
        await fetchItems(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleBatchInputChange = (receiptItemId, field, value) => {
    setNewBatches(prev => ({
      ...prev,
      [receiptItemId]: {
        ...(prev[receiptItemId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveBatch = async (item) => {
    const bData = newBatches[item.receiptItemId] || {};
    if (!bData.batchNo?.trim()) {
      toast.error('Batch No is required.');
      return;
    }
    if (!bData.mfgDate?.trim()) {
      toast.error('Mfg date (MM/YYYY) is required.');
      return;
    }
    if (!bData.expDate?.trim()) {
      toast.error('Exp date (MM/YYYY) is required.');
      return;
    }
    const qty = parseInt(bData.absRQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Batch Quantity must be greater than 0.');
      return;
    }
    if (!bData.stockLocation) {
      toast.error('Stock Location is required.');
      return;
    }

    setSavingBatch(true);
    setSavingBatchItemId(item.receiptItemId);
    try {
      const res = await api.post('/special-receipt/batch', {
        receiptItemId: item.receiptItemId,
        itemId: item.itemId,
        batchNo: bData.batchNo.trim(),
        mfgDate: bData.mfgDate.trim(),
        expDate: bData.expDate.trim(),
        absRQty: qty,
        stockLocation: bData.stockLocation
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Batch Added Successfully');
        setNewBatches(prev => ({ ...prev, [item.receiptItemId]: {} }));
        await fetchItems(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error saving batch:', err);
      toast.error(err.response?.data?.message || 'Failed to add batch');
    } finally {
      setSavingBatch(false);
      setSavingBatchItemId(null);
    }
  };

  const handleUpdateBatchLocation = async (inwNo) => {
    if (!editBatchLocation) {
      toast.error('Please select a Stock Location');
      return;
    }
    setUpdatingBatchInwNo(inwNo);
    try {
      const res = await api.put(`/special-receipt/batch/${inwNo}`, {
        stockLocation: editBatchLocation
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Updated Successfully');
        setEditingBatchInwNo(null);
        setEditBatchLocation('');
        await fetchItems(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error updating batch:', err);
      toast.error(err.response?.data?.message || 'Failed to update batch');
    } finally {
      setUpdatingBatchInwNo(null);
    }
  };

  const handleDeleteBatch = async (inwNo) => {
    if (!window.confirm('Do you really want to delete this batch?')) return;
    setDeletingBatchInwNo(inwNo);
    try {
      const res = await api.delete(`/special-receipt/batch/${inwNo}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Deleted Successfully');
        await fetchItems(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error deleting batch:', err);
      toast.error(err.response?.data?.message || 'Failed to delete batch');
    } finally {
      setDeletingBatchInwNo(null);
    }
  };

  const handleSaveGeneral = async () => {
    if (!headerInfo.receiptId || headerInfo.receiptId === '0') {
      toast.error('Please save Header information first.');
      return;
    }
    if (!voucherNo.trim()) {
      toast.error('Voucher Number is required.');
      return;
    }
    if (!voucherDate.trim()) {
      toast.error('Voucher Date is required.');
      return;
    }

    setSavingGeneral(true);
    try {
      const res = await api.post('/special-receipt/general', {
        receiptId: headerInfo.receiptId,
        stkRegNo: voucherNo.trim(),
        stkRegDate: voucherDate.trim(),
        remarks: remarks.trim()
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'General info saved successfully');
        setHeaderInfo(prev => ({
          ...prev,
          stkRegNo: voucherNo.trim(),
          stkRegDate: voucherDate.trim(),
          remarks: remarks.trim()
        }));
      }
    } catch (err) {
      console.error('Error saving general info:', err);
      toast.error(err.response?.data?.message || 'Failed to save general info');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleFreezeReceipt = async () => {
    if (!headerInfo.receiptId || headerInfo.receiptId === '0') {
      toast.error('Please save Header information first.');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item before completing.');
      return;
    }
    for (let it of items) {
      const bTotal = (it.batches || []).reduce((acc, b) => acc + (Number(b.absRQty) || 0), 0);
      if (bTotal !== Number(it.receiptAbsQty)) {
        toast.error(`Item ${it.itemCode} has pending batch quantity (Entered: ${bTotal}, Required: ${it.receiptAbsQty}).`);
        return;
      }
    }
    if (!window.confirm('Do you really want to complete this receipt? Once completed, it cannot be modified.')) {
      return;
    }

    setFreezing(true);
    try {
      const res = await api.post(`/special-receipt/freeze/${headerInfo.receiptId}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Receipt Completed Successfully');
        setHeaderInfo(prev => ({ ...prev, status: 'C' }));
        setIsEditingHeader(false);
        setIsAddingItem(false);
      }
    } catch (err) {
      console.error('Error freezing receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to complete receipt');
    } finally {
      setFreezing(false);
    }
  };

  const isCompleted = headerInfo.status === 'C';

  return (
    <div className="flex flex-col h-screen bg-[#f4f7f6]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4">

              {/* Title Bar in Theme Blue */}
              <div className="bg-[#1e40af] py-2 px-4 rounded text-center shadow-xs">
                <h1 className="text-sm md:text-base font-bold text-white tracking-wide">
                  Special Receipt
                </h1>
              </div>

              {/* Navigation Bar / Back button */}
              <div className="flex justify-between items-center bg-white p-2.5 px-4 rounded-md border border-gray-200 shadow-xs">
                <div className="text-xs font-semibold text-gray-600">
                  Receipt No:{' '}
                  <span className="font-bold text-gray-900">{headerInfo.receiptNo}</span>
                  {isCompleted && (
                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      Completed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/special-receipt')}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline focus:outline-none"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Header Box (pnlEdit / pnlView) */}
              <div className="bg-[#f8fafc] border border-gray-300 rounded-md p-4 shadow-xs">
                {isEditingHeader && !isCompleted ? (
                  /* Edit Header Form */
                  <div className="max-w-2xl mx-auto space-y-4">
                    {headerError && (
                      <div className="p-2.5 bg-red-100 border border-red-300 rounded text-red-700 font-bold text-xs text-center shadow-xs">
                        {headerError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <label className="font-semibold text-gray-700 w-28">Receipt No:</label>
                        <span className="font-bold text-gray-900">{headerInfo.receiptNo}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <label className="font-semibold text-gray-700 w-28">Receipt Date:</label>
                        <div>
                          <input
                            type="text"
                            value={headerDate}
                            onChange={(e) => {
                              setHeaderDate(e.target.value);
                              if (headerError) setHeaderError('');
                            }}
                            placeholder="DD-MM-YYYY"
                            className={`w-32 px-2.5 py-1 text-xs border rounded bg-white focus:outline-none focus:ring-1 ${
                              headerError && !headerDate.trim() ? 'border-red-500 ring-2 ring-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-3 sm:col-span-2">
                        <label className="font-semibold text-gray-700 w-28">Receipt From:</label>
                        <select
                          value={headerSpLocation}
                          onChange={(e) => {
                            setHeaderSpLocation(e.target.value);
                            if (headerError) setHeaderError('');
                          }}
                          className={`flex-1 max-w-md px-2.5 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 ${
                            headerError && !headerSpLocation ? 'border-red-500 ring-2 ring-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-600'
                          }`}
                        >
                          <option value="">-- Select Receipt Location --</option>
                          {spLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleUpdateHeader}
                        disabled={submittingHeader}
                        className="inline-flex items-center px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition-colors focus:outline-none disabled:opacity-50"
                      >
                        {submittingHeader && (
                          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        )}
                        <span>{submittingHeader ? 'Updating...' : 'Update'}</span>
                      </button>

                      {headerInfo.receiptId !== '0' && (
                        <button
                          onClick={handleCancelHeader}
                          disabled={submittingHeader}
                          className="px-5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs rounded shadow-xs transition-colors focus:outline-none disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* View Header Form */
                  <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-gray-600">Receipt No: </span>
                        <span className="font-bold text-gray-900">{headerInfo.receiptNo}</span>
                        <span className="mx-3 text-gray-400">|</span>
                        <span className="text-gray-600">Receipt Date: </span>
                        <span className="font-bold text-gray-900">{headerInfo.receiptDate || headerDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Receipt From: </span>
                        <span className="font-bold text-gray-900">
                          {headerInfo.receiptFromName ||
                            spLocations.find(l => String(l.id) === String(headerInfo.spLocationId))?.name ||
                            '-'}
                        </span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => setIsEditingHeader(true)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors focus:outline-none"
                        title="Edit Header Information"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs Section */}
              <div className={`bg-white rounded-md border border-gray-300 shadow-xs overflow-hidden ${
                headerInfo.receiptId === '0' || isEditingHeader ? 'opacity-60 pointer-events-none' : ''
              }`}>
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-300 bg-gray-100 px-3 pt-2 gap-2">
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-t transition-colors focus:outline-none border ${
                      activeTab === 0
                        ? 'bg-white text-blue-900 border-blue-600 border-b-white -mb-px'
                        : 'bg-gray-200 text-gray-600 border-transparent hover:bg-gray-300'
                    }`}
                  >
                    Special Receipt
                  </button>

                  <button
                    onClick={() => setActiveTab(1)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-t transition-colors focus:outline-none border ${
                      activeTab === 1
                        ? 'bg-white text-blue-900 border-blue-600 border-b-white -mb-px'
                        : 'bg-gray-200 text-gray-600 border-transparent hover:bg-gray-300'
                    }`}
                  >
                    General
                  </button>
                </div>

                {/* Tab 1: Special Receipt (Items & Batches Grid - gvItems) */}
                {activeTab === 0 && (
                  <div className="p-3 space-y-4">

                    {/* Items & Batches Table (gvItems) */}
                    <div className="overflow-x-auto relative min-h-[140px]">
                      {/* Loading circle overlay when loading item data */}
                      {itemsLoading && (
                        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[0.5px] flex flex-col items-center justify-center gap-2">
                          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900 bg-white/90 px-3 py-1 rounded shadow-xs border border-blue-200">
                            Loading receipt items &amp; batch details...
                          </span>
                        </div>
                      )}
                      <table className="w-full text-xs text-left border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-[#1e40af] text-white">
                            <th className="py-2 px-2 text-center font-bold border border-blue-900 w-12">
                              Sl. No.
                            </th>
                            <th className="py-2 px-3 text-center font-bold border border-blue-900 w-80">
                              Item code &amp; description
                            </th>
                            <th className="py-2 px-3 text-center font-bold border border-blue-900 w-32">
                              Receipt Qty (In Nos)
                            </th>
                            <th className="py-2 px-2 text-center font-bold border border-blue-900 w-20">
                              Action
                            </th>
                            <th className="py-2 px-3 text-center font-bold border border-blue-900">
                              Batch Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          
                          {/* Saved Items Rows */}
                          {items.map((item, itemIdx) => {
                            const isEditingThisItem = editingItemId === item.receiptItemId;
                            const itemReceiptQty = Number(item.receiptAbsQty || 0);
                            const currentBatchTotal = (item.batches || []).reduce(
                              (acc, b) => acc + (Number(b.absRQty) || 0),
                              0
                            );
                            const remainingQty = Math.max(0, itemReceiptQty - currentBatchTotal);
                            const isFulfilled = currentBatchTotal >= itemReceiptQty && itemReceiptQty > 0;
                            const bInputs = newBatches[item.receiptItemId] || {};

                            return (
                              <tr key={item.receiptItemId} className="align-top hover:bg-gray-50/50">
                                {/* Sl No */}
                                <td className="py-2.5 px-2 text-center font-semibold text-gray-700 border border-gray-300">
                                  {itemIdx + 1}
                                </td>

                                {/* Item Code & Description */}
                                <td className="py-2.5 px-3 border border-gray-300">
                                  <div className="font-bold text-gray-900">
                                    {item.itemCode} - {item.itemName}
                                  </div>
                                  <div className="text-[10px] text-gray-600 mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                                    <span>Strength: <b>{item.strength || 'N/A'}</b></span>
                                    <span>SKU: <b>{item.unit || 'Nos'}</b></span>
                                    <span>Type: <b>{item.itemTypeName || 'Drug'}</b></span>
                                    <span>PackQty: <b>{item.multiple || 1}</b></span>
                                    {item.edlType && <span>EDL Type: <b>{item.edlType}</b></span>}
                                  </div>
                                </td>

                                {/* Receipt Qty */}
                                <td className="py-2.5 px-3 text-right border border-gray-300">
                                  {isEditingThisItem ? (
                                    <input
                                      type="number"
                                      min="1"
                                      value={editItemQty}
                                      onChange={(e) => setEditItemQty(e.target.value)}
                                      className="w-20 px-1.5 py-1 text-right text-xs border border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-bold"
                                    />
                                  ) : (
                                    <span className="font-bold text-gray-900">{item.receiptAbsQty}</span>
                                  )}
                                </td>

                                {/* Item Actions */}
                                <td className="py-2.5 px-2 text-center border border-gray-300">
                                  {!isCompleted && (
                                    <div className="flex items-center justify-center gap-1.5">
                                      {isEditingThisItem ? (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleUpdateItem(
                                                item.receiptItemId,
                                                item.itemId,
                                                item.multiple
                                              )
                                            }
                                            disabled={updatingItemId === item.receiptItemId}
                                            className="text-blue-700 hover:text-blue-900 p-1 disabled:opacity-50 inline-flex items-center justify-center min-w-[20px] min-h-[20px]"
                                            title="Update Item Qty"
                                          >
                                            {updatingItemId === item.receiptItemId ? (
                                              <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-700" />
                                            ) : (
                                              <CheckIcon className="w-4 h-4 stroke-[3]" />
                                            )}
                                          </button>
                                          <button
                                            onClick={() => setEditingItemId(null)}
                                            disabled={updatingItemId === item.receiptItemId}
                                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                                            title="Cancel Edit"
                                          >
                                            <XMarkIcon className="w-4 h-4 stroke-[3]" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingItemId(item.receiptItemId);
                                              setEditItemQty(String(item.receiptAbsQty));
                                            }}
                                            disabled={deletingItemId === item.receiptItemId}
                                            className="text-blue-700 hover:text-blue-900 p-1 disabled:opacity-50"
                                            title="Edit Quantity"
                                          >
                                            <PencilSquareIcon className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteItem(item.receiptItemId)}
                                            disabled={deletingItemId === item.receiptItemId}
                                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 inline-flex items-center justify-center min-w-[20px] min-h-[20px]"
                                            title="Delete Item"
                                          >
                                            {deletingItemId === item.receiptItemId ? (
                                              <ArrowPathIcon className="w-4 h-4 animate-spin text-red-600" />
                                            ) : (
                                              <TrashIcon className="w-4 h-4" />
                                            )}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Nested Batch Details Grid (gvBatches) */}
                                <td className="p-2 border border-gray-300 bg-gray-50/40">
                                  <div className="space-y-2">
                                    <table className="w-full text-[11px] text-left border-collapse border border-gray-300 bg-white">
                                      <thead>
                                        <tr className="bg-[#1e40af] text-white">
                                          <th className="py-1 px-1.5 text-center font-bold border border-blue-900 w-8">
                                            Sl. No.
                                          </th>
                                          <th className="py-1 px-2 text-center font-bold border border-blue-900">
                                            Batch No.
                                          </th>
                                          <th className="py-1 px-2 text-center font-bold border border-blue-900 w-24">
                                            Mfg date<br />(MM/YYYY)
                                          </th>
                                          <th className="py-1 px-2 text-center font-bold border border-blue-900 w-24">
                                            Exp Date<br />(MM/YYYY)
                                          </th>
                                          <th className="py-1 px-2 text-center font-bold border border-blue-900 w-24">
                                            Batch Quantity<br />(in Nos)
                                          </th>
                                          <th className="py-1 px-2 text-center font-bold border border-blue-900">
                                            Stock Location
                                          </th>
                                          <th className="py-1 px-1.5 text-center font-bold border border-blue-900 w-16">
                                            Action
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {(item.batches || []).map((batch, bIdx) => {
                                          const isEditingBatch = editingBatchInwNo === batch.inwNo;
                                          return (
                                            <tr key={batch.inwNo} className="hover:bg-blue-50/30">
                                              <td className="py-1 px-1.5 text-center border border-gray-300 font-semibold text-gray-700">
                                                {bIdx + 1}
                                              </td>
                                              <td className="py-1 px-2 text-left font-bold border border-gray-300 text-gray-800">
                                                {batch.batchNo}
                                              </td>
                                              <td className="py-1 px-2 text-center border border-gray-300 text-gray-700">
                                                {batch.mfgDate}
                                              </td>
                                              <td className="py-1 px-2 text-center border border-gray-300 text-gray-700">
                                                {batch.expDate}
                                              </td>
                                              <td className="py-1 px-2 text-right border border-gray-300 font-bold text-gray-900">
                                                {batch.absRQty}
                                              </td>
                                              <td className="py-1 px-2 text-left border border-gray-300">
                                                {isEditingBatch && !isCompleted ? (
                                                  <select
                                                    value={editBatchLocation}
                                                    onChange={(e) => setEditBatchLocation(e.target.value)}
                                                    className="w-full px-1 py-0.5 text-[11px] border border-blue-600 rounded bg-white"
                                                  >
                                                    <option value="">-- Location --</option>
                                                    {storageLocations.map((loc) => (
                                                      <option key={loc.rackId} value={loc.rackId}>
                                                        {loc.locationNo}
                                                      </option>
                                                    ))}
                                                  </select>
                                                ) : (
                                                  <span className="text-gray-800">{batch.stockLocationName}</span>
                                                )}
                                              </td>
                                              <td className="py-1 px-1.5 text-center border border-gray-300">
                                                {!isCompleted && (
                                                  <div className="flex items-center justify-center gap-1">
                                                    {isEditingBatch ? (
                                                      <>
                                                        <button
                                                          onClick={() => handleUpdateBatchLocation(batch.inwNo)}
                                                          disabled={updatingBatchInwNo === batch.inwNo}
                                                          className="text-blue-700 hover:text-blue-900 p-0.5 disabled:opacity-50 inline-flex items-center justify-center min-w-[18px] min-h-[18px]"
                                                          title="Update Location"
                                                        >
                                                          {updatingBatchInwNo === batch.inwNo ? (
                                                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-blue-700" />
                                                          ) : (
                                                            <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                                                          )}
                                                        </button>
                                                        <button
                                                          onClick={() => setEditingBatchInwNo(null)}
                                                          disabled={updatingBatchInwNo === batch.inwNo}
                                                          className="text-red-600 hover:text-red-800 p-0.5 disabled:opacity-50"
                                                          title="Cancel"
                                                        >
                                                          <XMarkIcon className="w-3.5 h-3.5 stroke-[3]" />
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <button
                                                          onClick={() => {
                                                            setEditingBatchInwNo(batch.inwNo);
                                                            setEditBatchLocation(batch.stockLocation || '');
                                                          }}
                                                          disabled={deletingBatchInwNo === batch.inwNo}
                                                          className="text-blue-700 hover:text-blue-900 p-0.5 disabled:opacity-50"
                                                          title="Edit Stock Location"
                                                        >
                                                          <PencilSquareIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeleteBatch(batch.inwNo)}
                                                          disabled={deletingBatchInwNo === batch.inwNo}
                                                          className="text-red-600 hover:text-red-800 p-0.5 disabled:opacity-50 inline-flex items-center justify-center min-w-[18px] min-h-[18px]"
                                                          title="Delete Batch"
                                                        >
                                                          {deletingBatchInwNo === batch.inwNo ? (
                                                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-red-600" />
                                                          ) : (
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                          )}
                                                        </button>
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}

                                        {/* Inline Add Batch Row: only show if NOT fulfilled and remainingQty > 0 */}
                                        {!isCompleted && !isFulfilled && remainingQty > 0 && (
                                          <tr className="bg-blue-50/40">
                                            <td className="py-1 px-1.5 text-center border border-gray-300 font-bold text-blue-900">
                                              {(item.batches || []).length + 1}
                                            </td>
                                            <td className="py-1 px-1.5 border border-gray-300">
                                              <input
                                                type="text"
                                                placeholder="Batch No"
                                                value={bInputs.batchNo || ''}
                                                onChange={(e) =>
                                                  handleBatchInputChange(
                                                    item.receiptItemId,
                                                    'batchNo',
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                              />
                                            </td>
                                            <td className="py-1 px-1.5 border border-gray-300">
                                              <input
                                                type="text"
                                                placeholder="MM/YYYY"
                                                value={bInputs.mfgDate || ''}
                                                onChange={(e) =>
                                                  handleBatchInputChange(
                                                    item.receiptItemId,
                                                    'mfgDate',
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full text-center px-1 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                              />
                                            </td>
                                            <td className="py-1 px-1.5 border border-gray-300">
                                              <input
                                                type="text"
                                                placeholder="MM/YYYY"
                                                value={bInputs.expDate || ''}
                                                onChange={(e) =>
                                                  handleBatchInputChange(
                                                    item.receiptItemId,
                                                    'expDate',
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full text-center px-1 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                              />
                                            </td>
                                            <td className="py-1 px-1.5 border border-gray-300">
                                              <input
                                                type="number"
                                                min="1"
                                                max={remainingQty}
                                                placeholder={`Max ${remainingQty}`}
                                                value={bInputs.absRQty || ''}
                                                onChange={(e) =>
                                                  handleBatchInputChange(
                                                    item.receiptItemId,
                                                    'absRQty',
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full text-right px-1.5 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                                              />
                                            </td>
                                            <td className="py-1 px-1.5 border border-gray-300">
                                              <select
                                                value={bInputs.stockLocation || ''}
                                                onChange={(e) =>
                                                  handleBatchInputChange(
                                                    item.receiptItemId,
                                                    'stockLocation',
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-1 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                              >
                                                <option value="">-- Location --</option>
                                                {storageLocations.map((loc) => (
                                                  <option key={loc.rackId} value={loc.rackId}>
                                                    {loc.locationNo}
                                                  </option>
                                                ))}
                                              </select>
                                            </td>
                                            <td className="py-1 px-1.5 text-center border border-gray-300">
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  onClick={() => handleSaveBatch(item)}
                                                  disabled={savingBatch && savingBatchItemId === item.receiptItemId}
                                                  className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors shadow-2xs disabled:opacity-50 inline-flex items-center justify-center min-w-[22px] min-h-[22px]"
                                                  title="Save Batch"
                                                >
                                                  {savingBatch && savingBatchItemId === item.receiptItemId ? (
                                                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-white" />
                                                  ) : (
                                                    <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                                                  )}
                                                </button>
                                                {(bInputs.batchNo || bInputs.absRQty) && (
                                                  <button
                                                    onClick={() => {
                                                      setNewBatches(prev => ({ ...prev, [item.receiptItemId]: {} }));
                                                    }}
                                                    disabled={savingBatch && savingBatchItemId === item.receiptItemId}
                                                    className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded font-bold transition-colors shadow-2xs disabled:opacity-50"
                                                    title="Cancel"
                                                  >
                                                    <XMarkIcon className="w-3.5 h-3.5 stroke-[3]" />
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>

                                    {/* Batch summary status */}
                                    <div className="flex justify-between items-center text-[10px] px-1 text-gray-600">
                                      <span>
                                        Batch Entered:{' '}
                                        <b className="text-gray-900">{currentBatchTotal}</b> / {itemReceiptQty}
                                      </span>
                                      {remainingQty > 0 ? (
                                        <span className="text-blue-800 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                          Balance to Allocate: {remainingQty}
                                        </span>
                                      ) : (
                                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                          ✓ Fully Allocated
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Inline Add Item Row (Matching Image 2 legacy gvItems Row) */}
                          {isAddingItem && !isCompleted && (
                            <tr className="bg-blue-50/50 align-top border-2 border-blue-500">
                              {/* Sl No */}
                              <td className="py-2.5 px-2 text-center font-bold text-blue-900 border border-gray-300">
                                {items.length + 1}
                              </td>

                              {/* Item Selection & Description Column */}
                              <td className="py-2.5 px-3 border border-gray-300">
                                {!selectedNewItem ? (
                                  <div>
                                    <div className="relative flex items-center">
                                      <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={itemSearchQuery}
                                        onFocus={() => {
                                          setShowItemDropdown(true);
                                          if (itemSearchResults.length === 0) handleSearchItems('');
                                        }}
                                        onChange={(e) => {
                                          setShowItemDropdown(true);
                                          handleSearchItems(e.target.value);
                                        }}
                                        placeholder="Select Item (Click or type to search)..."
                                        className="w-full pr-8 pl-2.5 py-1.5 text-xs rounded border border-blue-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs font-medium"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowItemDropdown(!showItemDropdown);
                                          if (!showItemDropdown && itemSearchResults.length === 0) {
                                            handleSearchItems('');
                                          }
                                        }}
                                        className="absolute right-1 text-gray-400 hover:text-blue-600 p-1"
                                      >
                                        <ChevronDownIcon className="w-4 h-4" />
                                      </button>
                                      {isSearchingItems && (
                                        <div className="absolute right-7">
                                          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Dropdown Options rendered OUTSIDE of this table/div via Portal */}
                                    {showItemDropdown && createPortal(
                                      <div
                                        ref={dropdownRef}
                                        style={{
                                          position: 'fixed',
                                          top: `${dropdownPos.top}px`,
                                          left: `${dropdownPos.left}px`,
                                          width: `${dropdownPos.width}px`,
                                          zIndex: 999999
                                        }}
                                        className="bg-white border-2 border-blue-600 rounded-md shadow-2xl overflow-hidden text-xs"
                                      >
                                        <div className="p-2 bg-blue-50 border-b border-blue-200 flex justify-between items-center text-[11px] font-bold text-blue-900">
                                          <span>Select Item ({itemSearchResults.length} available)</span>
                                          <span className="text-[10px] text-gray-500 font-normal">Click to select</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                          {itemSearchResults.length === 0 ? (
                                            <div className="p-3 text-center text-gray-500">
                                              {isSearchingItems ? 'Loading items...' : 'No items found matching your search.'}
                                            </div>
                                          ) : (
                                            itemSearchResults.map((it) => (
                                              <div
                                                key={it.itemId}
                                                onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  handleSelectItem(it);
                                                }}
                                                className="p-2.5 hover:bg-blue-100/70 cursor-pointer text-gray-800 transition-colors"
                                              >
                                                <div className="font-bold text-blue-900">
                                                  {it.itemCode} - {it.itemName}
                                                </div>
                                                <div className="text-[10px] text-gray-600 mt-0.5 flex flex-wrap gap-x-2">
                                                  <span>Strength: <b>{it.strength || 'N/A'}</b></span>
                                                  <span>SKU: <b>{it.unit || 'Nos'}</b></span>
                                                  <span>Type: <b>{it.itemTypeName || 'Drug'}</b></span>
                                                  <span>Pack: <b className="text-blue-700">{it.multiple || 1}</b></span>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>,
                                      document.body
                                    )}
                                  </div>
                                ) : (
                                  /* Item Info View inside cell after item is selected */
                                  <div className="bg-white border border-blue-300 rounded p-2 text-xs shadow-2xs">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-bold text-blue-900">
                                          {selectedNewItem.itemCode} - {selectedNewItem.itemName}
                                        </div>
                                        <div className="text-[10px] text-gray-600 mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                                          <span>Strength: <b className="text-gray-800">{selectedNewItem.strength || 'N/A'}</b></span>
                                          <span>SKU: <b className="text-gray-800">{selectedNewItem.unit || 'Nos'}</b></span>
                                          <span>Type: <b className="text-gray-800">{selectedNewItem.itemTypeName || 'Drug'}</b></span>
                                          <span>Pack Qty: <b className="text-blue-700">{selectedNewItem.multiple || 1}</b></span>
                                          {selectedNewItem.edlType && <span>EDL Type: <b className="text-gray-800">{selectedNewItem.edlType}</b></span>}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedNewItem(null);
                                          setNewItemQty('');
                                          setShowItemDropdown(true);
                                          handleSearchItems('');
                                        }}
                                        className="text-[10px] text-blue-700 hover:text-blue-900 underline ml-2 whitespace-nowrap font-semibold"
                                        title="Choose a different item"
                                      >
                                        Change
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Receipt Qty (In Nos) Column */}
                              <td className="py-2.5 px-3 border border-gray-300">
                                {!selectedNewItem ? (
                                  <div className="text-center text-gray-400 italic text-[11px] py-1 bg-gray-100 rounded border border-dashed border-gray-300">
                                    Select item first
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <input
                                      ref={qtyInputRef}
                                      type="number"
                                      min="1"
                                      value={newItemQty}
                                      onChange={(e) => setNewItemQty(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveItem();
                                      }}
                                      placeholder="Qty (In Nos)"
                                      className="w-full px-2 py-1 text-right text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-bold shadow-2xs"
                                    />
                                    <div className="text-[10px] text-blue-700 font-semibold text-right">
                                      Multiple of {selectedNewItem.multiple || 1}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Action Column */}
                              <td className="py-2.5 px-2 text-center border border-gray-300">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={handleSaveItem}
                                    disabled={savingItem || !selectedNewItem || !newItemQty}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-40 shadow-2xs inline-flex items-center justify-center min-w-[28px] min-h-[28px]"
                                    title="Save Item"
                                  >
                                    {savingItem ? (
                                      <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                      <CheckIcon className="w-4 h-4 stroke-[3]" />
                                    )}
                                  </button>
                                  {items.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setIsAddingItem(false);
                                        setSelectedNewItem(null);
                                        setNewItemQty('');
                                      }}
                                      className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors shadow-2xs"
                                      title="Cancel"
                                    >
                                      <XMarkIcon className="w-4 h-4 stroke-[3]" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Batch Details Column */}
                              <td className="py-2.5 px-3 border border-gray-300 text-center text-gray-400 italic text-[11px]">
                                Save item row first to enter batch details
                              </td>
                            </tr>
                          )}

                          {items.length === 0 && !isAddingItem && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-500">
                                {itemsLoading ? (
                                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                                    <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-xs text-gray-600">Loading items...</span>
                                  </div>
                                ) : (
                                  'No items added yet. Click "Add Item" to begin entry.'
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Item Trigger Button */}
                    {!isCompleted && !isAddingItem && (() => {
                      const hasUnfulfilledItems = items.some(it => {
                        const itQty = Number(it.receiptAbsQty || 0);
                        const bTotal = (it.batches || []).reduce((acc, b) => acc + (Number(b.absRQty) || 0), 0);
                        return bTotal < itQty;
                      });

                      return (
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            onClick={handleOpenAddItem}
                            disabled={hasUnfulfilledItems}
                            className={`inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded shadow-xs transition-colors focus:outline-none ${
                              hasUnfulfilledItems
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title={hasUnfulfilledItems ? 'Allocate full batch quantity for the current item before adding another item' : 'Add another item'}
                          >
                            <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add Item</span>
                          </button>

                          {hasUnfulfilledItems && (
                            <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                              Allocate full batch quantity for existing item(s) before adding a new item
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tab 2: General */}
                {activeTab === 1 && (
                  <div className="p-4 md:p-6 space-y-6 max-w-xl">
                    <div className="bg-[#f8fafc] border border-gray-300 rounded-md p-5 space-y-4 shadow-2xs">
                      {/* Voucher No */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <label className="font-semibold text-gray-700 w-32">Voucher No:</label>
                        <input
                          type="text"
                          value={voucherNo}
                          onChange={(e) => setVoucherNo(e.target.value)}
                          disabled={isCompleted}
                          placeholder="Enter Voucher Number"
                          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100"
                        />
                      </div>

                      {/* Voucher Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <label className="font-semibold text-gray-700 w-32">Voucher Date:</label>
                        <input
                          type="text"
                          value={voucherDate}
                          onChange={(e) => setVoucherDate(e.target.value)}
                          disabled={isCompleted}
                          placeholder="DD-MM-YYYY"
                          className="w-36 px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100"
                        />
                      </div>

                      {/* Remarks */}
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 text-xs">
                        <div className="w-32">
                          <label className="font-semibold text-gray-700 block">Remarks:</label>
                          <span className="text-[10px] text-gray-400">Max 500 chars</span>
                        </div>
                        <div className="flex-1 w-full">
                          <textarea
                            rows={4}
                            maxLength={500}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            disabled={isCompleted}
                            placeholder="Enter remarks..."
                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100"
                          />
                          <div className="text-right text-[10px] text-gray-400">
                            {remarks.length} / 500
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Save & Cancel */}
                      {!isCompleted && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={handleSaveGeneral}
                            disabled={savingGeneral}
                            className="inline-flex items-center px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs transition-colors disabled:opacity-50"
                          >
                            {savingGeneral && (
                              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            )}
                            <span>{savingGeneral ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setVoucherNo(headerInfo.stkRegNo || '');
                              setVoucherDate(headerInfo.stkRegDate || '');
                              setRemarks(headerInfo.remarks || '');
                            }}
                            disabled={savingGeneral}
                            className="px-5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded shadow-xs disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Complete Button (Freezing receipt) */}
                    {!isCompleted && (
                      <div className="pt-2">
                        <button
                          onClick={handleFreezeReceipt}
                          disabled={freezing}
                          className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded shadow-sm transition-colors focus:outline-none disabled:opacity-50"
                        >
                          {freezing && (
                            <ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
                          )}
                          <span>{freezing ? 'Completing...' : 'Complete'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
