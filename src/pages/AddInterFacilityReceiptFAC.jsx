import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getReceiptHeader, getReceiptHeaderInfo, saveReceiptHeader, 
    getReceiptItems, getReceiptBatches, 
    completeFacilityReceipt, deleteFacilityReceipt 
} from '../api/inFacilityReceiptApi';
import { getStockLocations, saveReceiptItem } from '../api/warehouseReceiptApi'; // We can reuse locations api for racks
import { 
    ArrowLeftIcon, 
    ArrowPathIcon,
    DocumentTextIcon,
    PlusCircleIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

export default function AddInterFacilityReceiptFAC() {
    const { issueId, facReceiptId } = useParams(); // issueId is indentId
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [header, setHeader] = useState(null);
    const [items, setItems] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [locations, setLocations] = useState([]);
    const [itemInputs, setItemInputs] = useState({});
    const [loadedBatches, setLoadedBatches] = useState({});
    
    // UI State
    const [activeTab, setActiveTab] = useState('items'); // 'items' or 'general'
    const [headerForm, setHeaderForm] = useState({
        facReceiptNo: '',
        facReceiptDate: ''
    });
    const [remarks, setRemarks] = useState('');
    const [isUpdatingHeader, setIsUpdatingHeader] = useState(false);
    const [savingItemId, setSavingItemId] = useState(null);

    const user = useSelector((s) => s.auth.user);
    const facilityId = user?.facilityId;

    useEffect(() => {
        fetchLocations();
        if (facReceiptId) {
            fetchExistingReceipt();
        } else if (issueId) {
            fetchNewReceipt();
        }
    }, [facReceiptId, issueId]);

    const fetchLocations = async () => {
        try {
            const res = await getStockLocations(); // Reusing warehouse locs or facility racks
            if (res.success) setLocations(res.data);
        } catch (err) {
            console.error('Failed to fetch locations', err);
        }
    };

    const fetchNewReceipt = async () => {
        setLoading(true);
        try {
            const res = await getReceiptHeader(issueId);
            if (res.success && res.data) {
                setHeader(res.data);
                setHeaderForm({
                    facReceiptNo: res.data.facReceiptNo || '',
                    facReceiptDate: res.data.facReceiptDate || ''
                });
                fetchItems(issueId, res.data.facReceiptId);
            } else {
                toast.error(res?.message || 'Failed to load header details');
                setLoading(false);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load header details');
            setLoading(false);
        }
    };

    const fetchExistingReceipt = async () => {
        setLoading(true);
        try {
            const res = await getReceiptHeaderInfo(facReceiptId);
            if (res.success && res.data) {
                setHeader(res.data);
                setHeaderForm({
                    facReceiptNo: res.data.facReceiptNo || '',
                    facReceiptDate: res.data.facReceiptDate || ''
                });
                setRemarks(res.data.remarks || '');
                fetchItems(res.data.issueId, facReceiptId);
            } else {
                toast.error(res?.message || 'Failed to load existing receipt details');
                setLoading(false);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load existing receipt details');
            setLoading(false);
        }
    };

    const fetchItems = async (indentId, receiptId) => {
        try {
            const res = await getReceiptItems(indentId, receiptId);
            if (res.success) {
                setItems(res.data);
                const initialInputs = {};
                res.data.forEach(item => {
                    initialInputs[item.indentItemId] = {
                        receiptQty: item.facReceiptItemId ? item.absRQty : item.balReceiptQty,
                        stockLocation: item.stockLocation || ''
                    };
                });
                setItemInputs(initialInputs);
            }
        } catch (err) {
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHeader = async () => {
        if (!headerForm.facReceiptNo || !headerForm.facReceiptDate) {
            toast.error("Receipt No and Date are required!");
            return;
        }

        const payload = {
            facReceiptId: header?.facReceiptId || facReceiptId || null,
            indentId: header?.indentId || header?.issueId || issueId,
            warehouseId: header?.warehouseId,
            facilityId: facilityId,
            facReceiptNo: headerForm.facReceiptNo,
            facReceiptDate: headerForm.facReceiptDate
        };

        const toastId = toast.loading('Saving header...');
        setIsUpdatingHeader(true);
        try {
            const res = await saveReceiptHeader(payload);
            if (res.success) {
                toast.success('Header saved successfully!', { id: toastId });
                if (!facReceiptId && !header?.facReceiptId) {
                    navigate(`/inter-facility-receipt/edit/${res.data.facReceiptId}`, { replace: true });
                } else {
                    if (facReceiptId) fetchExistingReceipt();
                    else fetchNewReceipt();
                }
            } else {
                toast.error(res.message || 'Failed to save header.', { id: toastId });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error saving header.', { id: toastId });
        } finally {
            setIsUpdatingHeader(false);
        }
    };

    const handleCompleteReceipt = async () => {
        const idToComplete = header?.facReceiptId || facReceiptId;
        if (!idToComplete) {
            toast.error("Please save the header and items first.");
            return;
        }
        const toastId = toast.loading('Completing receipt...');
        try {
            const res = await completeFacilityReceipt(idToComplete, remarks);
            if (res.success) {
                toast.success('Receipt completed successfully!', { id: toastId });
                navigate('/inter-facility-receipt');
            } else {
                toast.error(res.message || 'Failed to complete receipt.', { id: toastId });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error completing receipt.', { id: toastId });
        }
    };

    const handleDeleteReceipt = async () => {
        const idToDelete = header?.facReceiptId || facReceiptId;
        if (!idToDelete) {
            toast.error("No receipt to delete.");
            return;
        }
        
        if (!window.confirm("Are you sure you want to delete this receipt?")) return;

        const toastId = toast.loading('Deleting receipt...');
        try {
            const res = await deleteFacilityReceipt(idToDelete);
            if (res.success) {
                toast.success('Receipt deleted successfully!', { id: toastId });
                navigate('/inter-facility-receipt');
            } else {
                toast.error(res.message || 'Failed to delete receipt.', { id: toastId });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error deleting receipt.', { id: toastId });
        }
    };

    const toggleRow = async (indentItemId) => {
        const willExpand = !expandedRows[indentItemId];
        setExpandedRows(prev => ({ ...prev, [indentItemId]: !prev[indentItemId] }));

        if (willExpand && !loadedBatches[indentItemId]) {
            try {
                const toastId = toast.loading('Loading batches...');
                const res = await getReceiptBatches(indentItemId);
                if (res.success) {
                    setLoadedBatches(prev => ({ ...prev, [indentItemId]: res.data }));
                    toast.dismiss(toastId);
                } else {
                    toast.error('Failed to load batches.', { id: toastId });
                }
            } catch (err) {
                toast.error('Failed to load batches.');
            }
        }
    };

    const handleInputChange = (indentItemId, field, value) => {
        setItemInputs(prev => ({
            ...prev,
            [indentItemId]: { ...prev[indentItemId], [field]: value }
        }));
    };

    const handleSaveItem = async (e, item) => {
        e.stopPropagation();
        
        const currentFacReceiptId = header?.facReceiptId || facReceiptId;
        if (!currentFacReceiptId) {
            toast.error("Please Update/Save the header first!");
            return;
        }

        const inputs = itemInputs[item.indentItemId];
        if (!inputs || inputs.stockLocation === '') {
            window.alert('Please select a Stock Location.');
            return;
        }
        if (inputs.receiptQty === '' || Number(inputs.receiptQty) < 0) {
            toast.error('Please enter a valid Receipt Quantity.');
            return;
        }

        const toastId = toast.loading('Saving...');
        setSavingItemId(item.indentItemId);

        let batchesToSave = loadedBatches[item.indentItemId];
        if (!batchesToSave) {
            try {
                const bRes = await getReceiptBatches(item.indentItemId);
                if (bRes.success) {
                    batchesToSave = bRes.data;
                    setLoadedBatches(prev => ({ ...prev, [item.indentItemId]: bRes.data }));
                } else {
                    batchesToSave = [];
                }
            } catch (err) {
                batchesToSave = [];
            }
        }

        const payload = {
            facReceiptItemId: item.facReceiptItemId || null,
            indentItemId: item.indentItemId,
            itemId: item.itemId,
            receiptQty: inputs.receiptQty,
            stockLocation: inputs.stockLocation,
            batches: batchesToSave.map(b => ({
                ...b,
                stockLocation: inputs.stockLocation // Ensure batch gets same location
            }))
        };

        try {
            const res = await saveReceiptItem(currentFacReceiptId, payload);
            if (res.success) {
                toast.success('Saved successfully!', { id: toastId });
                
                // Update batches in state with the new location name so it shows immediately
                const locObj = locations.find(l => l.id.toString() === inputs.stockLocation.toString());
                const locationName = locObj ? locObj.name : '-';
                setLoadedBatches(prev => {
                    const currentBatches = prev[item.indentItemId] || batchesToSave;
                    const updatedBatches = currentBatches.map(b => ({
                        ...b,
                        locationno: locationName
                    }));
                    return { ...prev, [item.indentItemId]: updatedBatches };
                });

                if (facReceiptId) fetchExistingReceipt();
                else fetchNewReceipt();
            } else {
                toast.error(res.message || 'Failed to save.', { id: toastId });
            }
        } catch (err) {
            toast.error('Failed to save.', { id: toastId });
        } finally {
            setSavingItemId(null);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col justify-center items-center h-full py-32">
                    <ArrowPathIcon className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <span className="text-slate-500 font-medium text-lg">Loading Receipt Details...</span>
                </div>
            );
        }

        if (!header) {
            return (
                <div className="flex flex-col justify-center items-center h-full py-32">
                    <DocumentTextIcon className="w-16 h-16 text-slate-300 mb-4" />
                    <span className="text-slate-500 font-medium text-lg">Receipt not found or unavailable.</span>
                    <button
                        onClick={() => navigate('/inter-facility-receipt')}
                        className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Receipts
                    </button>
                </div>
            );
        }
        const allItemsSaved = items.length > 0 && items.every(item => item.isVerified === 'true');

        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">

            {/* Header section similar to screenshots */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => navigate('/inter-facility-receipt')}
                        className="mt-1 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none"
                        title="Back to Receipts"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-slate-700" />
                    </button>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Receipt from other Facility</h1>
                            {allItemsSaved && header?.status !== 'C' && (
                                <button
                                    onClick={handleCompleteReceipt}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm"
                                >
                                    Complete Receipt
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Row 1 */}
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fin. Year</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{header.accYear || '-'}</div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse</label>
                                <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={header.warehouseName}>{header.warehouseName || '-'}</div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indent number</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{header.indentNo || '-'}</div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indent Date</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{header.indentDate || '-'}</div>
                            </div>

                            {/* Row 2 */}
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Issue No</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{header.facIndentNo || header.indentNo || '-'}</div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Issue Date</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{header.facIndentDate || header.indentDate || '-'}</div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Receipt No</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{headerForm.facReceiptNo || '-'}</div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Receipt Date</label>
                                <div className="text-sm font-bold text-slate-800 mt-1">{headerForm.facReceiptDate || '-'}</div>
                            </div>
                        </div>

                        {!(header?.facReceiptId || facReceiptId) && (
                            <div className="mt-8 flex justify-center">
                                <button 
                                    onClick={handleSaveHeader}
                                    disabled={isUpdatingHeader}
                                    className={`text-xs font-bold uppercase tracking-wider py-2.5 px-10 rounded-lg transition-colors shadow-sm hover:shadow ${isUpdatingHeader ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                >
                                    {isUpdatingHeader ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            {(header?.facReceiptId || facReceiptId) ? (
                <>
                    <div className="flex border-b border-slate-200 mt-6">
                        <button 
                            onClick={() => setActiveTab('items')}
                            className={`py-2 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'items' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'} rounded-t-lg`}
                        >
                            Receipt Items
                        </button>
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`py-2 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'} rounded-t-lg`}
                        >
                            General
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-sm border border-slate-200 border-t-0 p-6 min-h-[400px]">
                        
                        {activeTab === 'items' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-200">Sl. No.</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-200">Item code &amp; description</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200">Indent Qty<br/><span className="text-[10px] capitalize font-semibold">(In Single Units)</span></th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200">Warehouse Issue Quantity<br/><span className="text-[10px] capitalize font-semibold">(In Single Units)</span></th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200">Receipt Qty<br/><span className="text-[10px] capitalize font-semibold">(In Single Units)</span></th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-slate-200">Stock Location</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200">Action</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Batches</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                                            No items found.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => {
                                        const batches = loadedBatches[item.indentItemId] || [];

                                        return (
                                            <React.Fragment key={item.indentItemId || index}>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-center border-r border-slate-200">{index + 1}</td>
                                                    <td className="px-4 py-3 border-r border-slate-200">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">{item.itemCode} - {item.itemName}</span>
                                                            <span className="text-xs text-slate-500 mt-0.5">Strength: {item.strength || '-'}</span>
                                                            <span className="text-xs text-slate-500">Unit: {item.unit || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-900 text-center border-r border-slate-200 font-medium bg-slate-50">{item.allotted}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-900 text-center border-r border-slate-200 font-medium">{item.balReceiptQty}</td>

                                                    {/* Receipt Qty */}
                                                    <td className="px-4 py-3 text-sm text-center border-r border-slate-200">
                                                        <input 
                                                            type="number"
                                                            disabled={item.isVerified === 'true'}
                                                            className={`w-20 px-2 py-1 text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${item.isVerified === 'true' ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                                            value={itemInputs[item.indentItemId]?.receiptQty ?? ''}
                                                            onChange={(e) => handleInputChange(item.indentItemId, 'receiptQty', e.target.value)}
                                                        />
                                                    </td>

                                                    {/* Stock Location */}
                                                    <td className="px-4 py-3 text-sm border-r border-slate-200">
                                                        <select
                                                            disabled={item.isVerified === 'true'}
                                                            className={`w-32 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${item.isVerified === 'true' ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300 bg-white'}`}
                                                            value={itemInputs[item.indentItemId]?.stockLocation ?? ''}
                                                            onChange={(e) => handleInputChange(item.indentItemId, 'stockLocation', e.target.value)}
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {locations.map(loc => (
                                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* Action */}
                                                    <td className="px-4 py-3 text-sm text-center border-r border-slate-200">
                                                        {savingItemId === item.indentItemId ? (
                                                            <button 
                                                                disabled
                                                                className="text-xs bg-slate-100 text-slate-500 font-bold py-1 px-3 rounded flex items-center gap-2 mx-auto cursor-not-allowed"
                                                            >
                                                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                                                {item.isVerified === 'true' ? 'Updating...' : 'Saving...'}
                                                            </button>
                                                        ) : item.isVerified === 'true' ? (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 font-bold py-1 px-2.5 rounded-full border border-emerald-200">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Saved
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleSaveItem(e, item)}
                                                                className="text-xs bg-emerald-500 text-white font-bold py-1 px-3 rounded hover:bg-emerald-600 mx-auto block"
                                                            >
                                                                Save
                                                            </button>
                                                        )}
                                                    </td>

                                                    {/* SHOW/HIDE BATCHES */}
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <button
                                                            onClick={() => toggleRow(item.indentItemId)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none font-bold text-xs underline"
                                                        >
                                                            {expandedRows[item.indentItemId] ? 'HIDE BATCHES' : 'SHOW BATCHES'}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expandable Batch Details */}
                                                {expandedRows[item.indentItemId] && (
                                                    <tr>
                                                        <td colSpan="8" className="p-0 bg-slate-50 border-b border-slate-200">
                                                            <div className="px-8 py-4 bg-slate-100 border-t border-slate-200 shadow-inner">
                                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    Batches
                                                                </h4>
                                                                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                                                                    <table className="min-w-full divide-y divide-slate-200">
                                                                        <thead className="bg-slate-200 text-slate-700">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-left text-xs font-bold">Batch No.</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-bold">Mfg date</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-bold">Exp Date</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-bold">Stock Location</th>
                                                                                <th className="px-4 py-2 text-right text-xs font-bold">Quantity (in Nos)</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {batches.length > 0 ? (
                                                                                batches.map((batch, bIndex) => (
                                                                                    <tr key={bIndex}>
                                                                                        <td className="px-4 py-2 text-sm font-bold text-slate-800">{batch.batchNo}</td>
                                                                                        <td className="px-4 py-2 text-sm text-slate-600">{batch.mfgDate}</td>
                                                                                        <td className="px-4 py-2 text-sm text-slate-600">{batch.expDate}</td>
                                                                                        <td className="px-4 py-2 text-sm text-slate-600 font-medium">
                                                                                            {batch.locationno || '-'}
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-sm font-semibold text-slate-900 text-right">{batch.issueQty}</td>
                                                                                    </tr>
                                                                                ))
                                                                            ) : (
                                                                                <tr>
                                                                                    <td colSpan="5" className="px-4 py-3 text-center text-sm text-slate-500 italic">No batches recorded.</td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="max-w-2xl">
                        <div className="flex flex-col mb-6">
                            <label className="text-sm font-bold text-slate-700 mb-2">Remarks</label>
                            <textarea 
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter any remarks here..."
                            ></textarea>
                        </div>
                        <div className="flex gap-4 border-t border-slate-200 pt-6">
                            <button 
                                onClick={handleCompleteReceipt}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex-1"
                            >
                                Complete Receipt
                            </button>
                            <button 
                                onClick={handleDeleteReceipt}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex-1"
                            >
                                Delete Receipt
                            </button>
                        </div>
                        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <strong>Note:</strong> Completing the receipt will finalize the stock transfer. Ensure all item quantities and batches are saved correctly before completing. Deleting the receipt will remove all its saved data permanently.
                        </div>
                    </div>
                )}
                
                    </div>
                </>
            ) : (
                <div className="mt-8 text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
                        <DocumentTextIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Receipt Details Required</h3>
                    <p className="text-slate-500 max-w-md mx-auto">Please click the "Update" button above to generate and save the receipt before you can add items.</p>
                </div>
            )}
        </div>
    );
    }; // end of renderContent

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
                        {renderContent()}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
