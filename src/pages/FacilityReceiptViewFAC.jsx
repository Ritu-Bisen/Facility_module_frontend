import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReceiptDetails, getStockLocations, saveReceiptItem, getReceiptBatches, completeReceipt } from '../api/warehouseReceiptApi';
import { 
    ArrowLeftIcon, 
    ArrowPathIcon,
    DocumentTextIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function FacilityReceiptViewFAC() {
    const { receiptId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [locations, setLocations] = useState([]);
    const [itemInputs, setItemInputs] = useState({});
    const [loadedBatches, setLoadedBatches] = useState({});

    useEffect(() => {
        if (receiptId) {
            fetchReceiptDetails(receiptId);
            fetchLocations();
        }
    }, [receiptId]);

    const fetchLocations = async () => {
        try {
            const res = await getStockLocations();
            if (res.success) setLocations(res.data);
        } catch (err) {
            console.error('Failed to fetch locations', err);
        }
    };

    const fetchReceiptDetails = async (id) => {
        setLoading(true);
        try {
            const res = await getReceiptDetails(id);
            if (res.success) {
                setDetails(res.data);
                const initialInputs = {};
                const initialBatches = {};
                res.data.items.forEach(item => {
                    initialInputs[item.indentItemId] = {
                        receiptQty: item.facReceiptItemId ? item.receiptQty : (item.whIssueQty ?? ''),
                        stockLocation: item.stockLocation || ''
                    };
                    // Pre-load batches from server so location shows immediately
                    if (item.batches && item.batches.length > 0) {
                        initialBatches[item.indentItemId] = item.batches;
                    }
                });
                setItemInputs(initialInputs);
                setLoadedBatches(prev => ({ ...prev, ...initialBatches }));
            }
        } catch (err) {
            toast.error('Failed to load receipt details');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteReceipt = async () => {
        const toastId = toast.loading('Completing receipt...');
        try {
            const res = await completeReceipt(receiptId);
            if (res.success) {
                toast.success('Receipt completed successfully!', { id: toastId });
                fetchReceiptDetails(receiptId); // Reload to show updated status
            } else {
                toast.error(res.message || 'Failed to complete receipt.', { id: toastId });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error completing receipt.', { id: toastId });
        }
    };

    // Auto-complete when all items are saved
    useEffect(() => {
        if (details && details.items && details.header && details.header.status !== 'C') {
            const allSaved = details.items.length > 0 && details.items.every(
                item => item.facReceiptItemId && item.stockLocationName && item.stockLocationName !== '-'
            );
            if (allSaved) {
                handleCompleteReceipt();
            }
        }
    }, [details]);

    const toggleRow = async (indentItemId) => {
        const willExpand = !expandedRows[indentItemId];
        setExpandedRows(prev => ({ ...prev, [indentItemId]: !prev[indentItemId] }));

        // Lazy-load batches on first expand if not already cached
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
        const inputs = itemInputs[item.indentItemId];

        if (!inputs || inputs.stockLocation === '') {
            toast.error('Please select a Stock Location.');
            return;
        }
        if (inputs.receiptQty === '' || Number(inputs.receiptQty) < 0) {
            toast.error('Please enter a valid Receipt Quantity.');
            return;
        }

        const toastId = toast.loading('Saving...');

        // Ensure batches are loaded before saving so they get their location set
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
            receiptQty: Number(inputs.receiptQty),
            stockLocation: Number(inputs.stockLocation),
            batches: batchesToSave || []
        };

        try {
            const res = await saveReceiptItem(receiptId, payload);
            if (res.success) {
                toast.success('Saved successfully!', { id: toastId });
                // Clear batch cache so re-fetch shows updated location
                setLoadedBatches(prev => {
                    const copy = { ...prev };
                    delete copy[item.indentItemId];
                    return copy;
                });
                fetchReceiptDetails(receiptId);
            } else {
                toast.error(res.message || 'Failed to save.', { id: toastId });
            }
        } catch (err) {
            toast.error('Failed to save.', { id: toastId });
        }
    };

    // ── Loading / Error states ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-full py-32">
                <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <span className="text-slate-500 font-medium text-lg">Loading Receipt Details...</span>
            </div>
        );
    }

    if (!details || !details.header) {
        return (
            <div className="flex flex-col justify-center items-center h-full py-32">
                <DocumentTextIcon className="w-16 h-16 text-slate-300 mb-4" />
                <span className="text-slate-500 font-medium text-lg">Receipt not found or unavailable.</span>
                <button
                    onClick={() => navigate('/indent/warehouse-receipts')}
                    className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors border border-emerald-200"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Receipts
                </button>
            </div>
        );
    }

    const { header, items } = details;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                <div className="relative z-10 flex items-start gap-4">
                    <button
                        onClick={() => navigate('/indent/warehouse-receipts')}
                        className="mt-1 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors focus:outline-none"
                        title="Back to Receipts"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Receipt Details</h1>
                        <div className="mt-2 text-emerald-50 font-medium flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <span className="bg-black/20 px-3 py-1 rounded-lg backdrop-blur-md">
                                Fin. Year: <span className="font-bold text-white">{header.accYear}</span>
                            </span>
                            {header.sourceName && (
                                <span className="bg-black/20 px-3 py-1 rounded-lg backdrop-blur-md">
                                    Source: <span className="font-bold text-white">{header.sourceName}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Indent Information</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Warehouse:</span>
                            <span className="text-slate-900 text-sm font-semibold">{header.warehouseName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Indent No:</span>
                            <span className="text-slate-900 text-sm font-semibold">{header.indentNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Indent Date:</span>
                            <span className="text-slate-900 text-sm font-semibold">{header.indentDate}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Receipt Information</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Receipt No:</span>
                            <span className="text-slate-900 text-sm font-semibold">{header.facReceiptNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Receipt Date:</span>
                            <span className="text-slate-900 text-sm font-semibold">{header.facReceiptDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Remarks:</span>
                            <span className="text-slate-900 text-sm font-medium">{header.remarks || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Received Items</h3>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Total Items: {items.length}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider">Sl. No.</th>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider">Item code &amp; description</th>
                                <th scope="col" className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider">Indent Qty<br/>(in Nos)</th>
                                <th scope="col" className="px-4 py-3.5 text-right text-xs font-semibold tracking-wider">Warehouse Issue<br/>Quantity (in Nos)</th>
                                <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold tracking-wider">Receipt Qty<br/>(in Nos)</th>
                                <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold tracking-wider">Stock Location</th>
                                <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold tracking-wider">Action</th>
                                <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold tracking-wider">Batches</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-500">
                                        No items found in this receipt.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => {
                                    const batches = loadedBatches[item.indentItemId] || [];

                                    return (
                                        <React.Fragment key={item.indentItemId || index}>
                                            <tr className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-900 text-center">{index + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-indigo-700">{item.itemCode} - {item.itemName}</span>
                                                        <span className="text-xs text-slate-600 mt-1">Strength: <span className="text-blue-600">{item.strength || '-'}</span></span>
                                                        <span className="text-xs text-slate-600">SKU: <span className="text-blue-600">{item.sku || '-'}</span></span>
                                                        <span className="text-xs text-slate-600">Type: <span className="text-blue-600">{item.itemType || '-'}</span></span>
                                                        <span className="text-xs text-slate-600">Pack Qty: <span className="text-blue-600">{item.packQty || '1'}</span></span>
                                                        <span className="text-xs text-slate-600">EDL Type: <span className="text-blue-600">{item.edlType || 'EDL'}</span></span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 text-right">{item.indentQty}</td>
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 text-right">{item.whIssueQty}</td>

                                                {/* Receipt Qty — plain text */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-900 text-right">
                                                    {itemInputs[item.indentItemId]?.receiptQty ?? '-'}
                                                </td>

                                                {/* Stock Location — saved name from DB if saved, dropdown if not */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm">
                                                    {(item.facReceiptItemId && item.stockLocationName && item.stockLocationName !== '-') ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                                            {item.stockLocationName}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            className="w-40 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                                            value={itemInputs[item.indentItemId]?.stockLocation ?? ''}
                                                            onChange={(e) => handleInputChange(item.indentItemId, 'stockLocation', e.target.value)}
                                                        >
                                                            <option value="">-- Select Rack --</option>
                                                            {locations.map(loc => (
                                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>

                                                {/* Action Column */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-center">
                                                    {!(item.facReceiptItemId && item.stockLocationName && item.stockLocationName !== '-') ? (
                                                        <button
                                                            onClick={(e) => handleSaveItem(e, item)}
                                                            className="p-1 rounded-full text-emerald-600 hover:bg-emerald-100 transition-colors focus:outline-none shadow-sm bg-emerald-50 border border-emerald-200"
                                                            title="Save — assigns selected rack to all batches"
                                                        >
                                                            <PlusCircleIcon className="w-6 h-6" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">
                                                            Received
                                                        </span>
                                                    )}
                                                </td>


                                                {/* SHOW/HIDE BATCHES */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-center">
                                                    <button
                                                        onClick={() => toggleRow(item.indentItemId)}
                                                        className="p-1 text-slate-500 hover:text-slate-700 transition-colors rounded hover:bg-slate-200 focus:outline-none font-bold text-xs underline"
                                                    >
                                                        {expandedRows[item.indentItemId] ? 'HIDE BATCHES' : 'SHOW BATCHES'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expandable Batch Details */}
                                            {expandedRows[item.indentItemId] && (
                                                <tr>
                                                    <td colSpan="8" className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                                                        <div className="px-8 py-5 bg-slate-100/50 border-t border-slate-200/60">
                                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Batches</h4>
                                                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                                                <table className="min-w-full divide-y divide-slate-200">
                                                                    <thead className="bg-slate-800 text-slate-100">
                                                                        <tr>
                                                                            <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold">Sl. No.</th>
                                                                            <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold">Batch No.</th>
                                                                            <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold">Mfg date</th>
                                                                            <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold">Exp Date</th>
                                                                            <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold">Stock Location</th>
                                                                            <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold">Quantity (in Nos)</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {batches.length > 0 ? (
                                                                            batches.map((batch, bIndex) => {
                                                                                // Show saved location from DB; if not set yet, preview from dropdown
                                                                                let displayLocation = batch.locationno && batch.locationno !== '-' ? batch.locationno : null;
                                                                                if (!displayLocation) {
                                                                                    const selId = (itemInputs[item.indentItemId] || {}).stockLocation;
                                                                                    if (selId) {
                                                                                        const loc = locations.find(l => l.id.toString() === selId.toString());
                                                                                        if (loc) displayLocation = loc.name;
                                                                                    }
                                                                                }
                                                                                return (
                                                                                    <tr key={bIndex} className="hover:bg-slate-50 transition-colors">
                                                                                        <td className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-slate-900">{bIndex + 1}</td>
                                                                                        <td className="whitespace-nowrap px-4 py-2.5 text-sm font-bold text-slate-900">{batch.batchNo}</td>
                                                                                        <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">{batch.mfgDate}</td>
                                                                                        <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">{batch.expDate}</td>
                                                                                        <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600 text-center">
                                                                                            {displayLocation || '-'}
                                                                                        </td>
                                                                                        <td className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-slate-900 text-right">{batch.issueQty}</td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="6" className="px-4 py-4 text-center text-sm text-slate-500 italic">No batches recorded.</td>
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
            </div>
        </div>
    );
}
