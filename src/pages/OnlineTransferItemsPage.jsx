import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getIndentHeader, getIssueHeader, createIssueHeader, updateIssueHeader, getItemsForIssue, saveIssueItem, updateIssueItem, deleteIssueItem, completeIssue, deleteIssue, getBatches } from '../api/onlineTransferItemsApi';
import { PencilSquareIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

function BatchDetailsCell({ issueItemId, itemId }) {
    const [batches, setBatches] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!issueItemId) return;
        const fetchBatches = async () => {
            try {
                const res = await getBatches(issueItemId, itemId);
                if (res.success) {
                    setBatches(res.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, [issueItemId, itemId]);

    if (!issueItemId) return <span className="text-slate-400 text-xs italic">-</span>;
    if (loading) return <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto"></div>;
    if (!batches || batches.length === 0) return <span className="text-slate-400 text-[10px] italic">No batches</span>;

    return (
        <div className="flex flex-col gap-2 text-[10px] w-full min-w-[180px] mx-auto text-left">
            {batches.map((b, i) => (
                <div key={i} className="bg-slate-50 p-1.5 rounded border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                        <span className="font-bold text-slate-700">{b.BATCHNO}</span> 
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 rounded">Qty: {b.ISSUEQTY}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[9px] font-medium">
                        <span>Mfg: {b.MFGDATE ? new Date(b.MFGDATE).toLocaleDateString() : '-'}</span>
                        <span>Exp: {b.EXPDATE ? new Date(b.EXPDATE).toLocaleDateString() : '-'}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function OnlineTransferItemsPage() {
    const navigate = useNavigate();
    const { nocId, issueId } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = Boolean(issueId);

    const [loading, setLoading] = useState(true);
    const [savingHeader, setSavingHeader] = useState(false);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (msg) {
            const t = setTimeout(() => setMsg(null), 3000);
            return () => clearTimeout(t);
        }
    }, [msg]);

    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(t);
        }
    }, [error]);

    // Header States
    const [indentHeader, setIndentHeader] = useState(null);
    const [issueHeader, setIssueHeader] = useState(null);
    
    // Editing States
    const [isHeaderEditing, setIsHeaderEditing] = useState(!isEditMode);
    const [editHeaderData, setEditHeaderData] = useState({
        issueDate: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    // Items State
    const [items, setItems] = useState([]);

    useEffect(() => {
        loadData();
    }, [nocId, issueId]);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Load Indent Header
            let fetchedIndent = null;
            if (nocId) {
                const resNoc = await getIndentHeader(nocId);
                if (resNoc.success) {
                    fetchedIndent = resNoc.data;
                    setIndentHeader(fetchedIndent);
                }
            } else if (issueId) {
                // If we only have issueId, we first need issueHeader to get facIndentId
                const resIssue = await getIssueHeader(issueId);
                if (resIssue.success) {
                    const iHeader = resIssue.data;
                    setIssueHeader(iHeader);
                    setEditHeaderData({
                        issueDate: iHeader.ISSUEDATE,
                        remarks: iHeader.REMARKS || ''
                    });

                    // Then fetch indent header
                    if (iHeader.FACINDENTID) {
                        const resNoc = await getIndentHeader(iHeader.FACINDENTID);
                        if (resNoc.success) {
                            fetchedIndent = resNoc.data;
                            setIndentHeader(fetchedIndent);
                        }
                    }
                }
            }

            // Load Items
            if (fetchedIndent) {
                const resItems = await getItemsForIssue(fetchedIndent.NOCID, issueId);
                if (resItems.success) {
                    setItems(resItems.data);
                }
            }

        } catch (err) {
            console.error(err);
            setError("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateHeader = async () => {
        try {
            setError(null);
            setMsg(null);
            if (!editHeaderData.issueDate) {
                setError("Issue Date is required.");
                return;
            }
            setSavingHeader(true);

            if (isEditMode) {
                const res = await updateIssueHeader(issueId, editHeaderData);
                if (res.success) {
                    setMsg("Updated Successfully");
                    setIsHeaderEditing(false);
                    await loadData(true);
                } else {
                    setError(res.message);
                }
            } else {
                const payload = {
                    toFacilityId: indentHeader.FACILITYID,
                    issueDate: editHeaderData.issueDate,
                    remarks: editHeaderData.remarks,
                    facIndentId: indentHeader.NOCID
                };
                const res = await createIssueHeader(payload);
                if (res.success) {
                    setMsg("Created Successfully");
                    navigate(`/inter-facility-issue-online/items/edit/${res.issueId}`);
                } else {
                    setError(res.message);
                }
            }
        } catch (err) {
            console.error(err);
            setError("Operation failed.");
        } finally {
            setSavingHeader(false);
        }
    };

    const [savingItemId, setSavingItemId] = useState(null);

    const handleSaveItem = async (item) => {
        const qtyInput = document.getElementById(`issue-qty-${item.ITEMID}`);
        const issueQty = qtyInput ? Number(qtyInput.value) : Number(item.ISSUEQTY);
        const payload = {
            itemId: item.ITEMID,
            curStock: item.CURSTOCK || 0,
            allotted: item.REQUESTEDQTY || 0,
            issueQty: issueQty
        };
        
        try {
            setSavingItemId(item.ITEMID);
            const res = await saveIssueItem(issueId, payload);
            if (res.message || res.success) {
                setMsg("Item saved successfully");
                await loadData(true);
            } else {
                setError(res.error || "Failed to save item");
            }
        } catch (e) {
            setError(e.response?.data?.error || "Error saving item");
        } finally {
            setSavingItemId(null);
        }
    };

    const handleUpdateItem = async (item) => {
        const qtyInput = document.getElementById(`issue-qty-${item.ITEMID}`);
        const issueQty = qtyInput ? Number(qtyInput.value) : Number(item.ISSUEQTY);
        const payload = {
            issueId: issueId,
            itemId: item.ITEMID,
            curStock: item.CURSTOCK || 0,
            allotted: item.REQUESTEDQTY || 0,
            issueQty: issueQty
        };
        
        try {
            setSavingItemId(item.ITEMID);
            const res = await updateIssueItem(item.ISSUEITEMID, payload);
            if (res.message || res.success) {
                setMsg("Item updated successfully");
                await loadData(true);
            } else {
                setError(res.error || "Failed to update item");
            }
        } catch (e) {
            setError(e.response?.data?.error || "Error updating item");
        } finally {
            setSavingItemId(null);
        }
    };

    const handleDeleteItem = async (item) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            setSavingItemId(item.ITEMID);
            const res = await deleteIssueItem(item.ISSUEITEMID);
            if (res.message || res.success) {
                setMsg("Item deleted successfully");
                await loadData(true);
            } else {
                setError(res.error || "Failed to delete item");
            }
        } catch (e) {
            setError(e.response?.data?.error || "Error deleting item");
        } finally {
            setSavingItemId(null);
        }
    };

    const handleCompleteIssue = async () => {
        if (!window.confirm('Are you sure you want to complete this issue?')) return;
        try {
            setLoading(true);
            const res = await completeIssue(issueId);
            if (res.message || res.success) {
                navigate('/inter-facility-issue-against-online-indent');
            } else {
                setError(res.error || "Failed to complete issue");
                setLoading(false);
            }
        } catch (e) {
            setError(e.response?.data?.error || "Error completing issue");
            setLoading(false);
        }
    };

    const handleDeleteIssue = async () => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            setLoading(true);
            const res = await deleteIssue(issueId);
            if (res.message || res.success) {
                navigate('/inter-facility-issue-against-online-indent');
            } else {
                setError(res.error || "Failed to delete issue");
                setLoading(false);
            }
        } catch (e) {
            setError(e.response?.data?.error || "Error deleting issue");
            setLoading(false);
        }
    };


    return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <>
                        <div className="max-w-7xl mx-auto space-y-6">
                            
                            {/* Top Bar */}
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h1 className="text-xl font-bold text-slate-800">Inter Facility Transfer Items</h1>
                                <button 
                                    onClick={() => navigate('/inter-facility-issue-against-online-indent')}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Back
                                </button>
                            </div>

                            {msg && (
                                <div className="fixed top-6 right-6 z-50 p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 shadow-xl transition-all duration-300">
                                    {msg}
                                </div>
                            )}

                            {error && (
                                <div className="fixed top-6 right-6 z-50 p-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 shadow-xl transition-all duration-300">
                                    {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="p-10 text-center text-slate-500 font-bold">Loading...</div>
                            ) : (
                                <>
                                    {/* Header Panel */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="bg-[#0f172a] px-4 py-2 flex justify-between items-center">
                                            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                                Indent & Issue Details
                                                {issueHeader?.ISSUENO ? (
                                                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-mono border border-indigo-500/30">
                                                        Issue No: {issueHeader.ISSUENO}
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-600">
                                                        Issue No: Auto generated
                                                    </span>
                                                )}
                                            </h2>
                                            {!isHeaderEditing && (
                                                <button 
                                                    onClick={() => setIsHeaderEditing(true)}
                                                    className="text-white hover:text-indigo-200 flex items-center gap-1 text-xs font-bold bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" /> Edit
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="p-3">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                {/* Indent Details */}
                                                <div className="col-span-2">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">To Facility</label>
                                                    <div className="font-bold text-slate-800 text-xs truncate" title={indentHeader?.FACILITYNAME}>{indentHeader?.FACILITYNAME || '-'}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Req No</label>
                                                    <div className="font-bold text-slate-800 text-xs truncate">{indentHeader?.NOCNUMBER || '-'}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Req Date</label>
                                                    <div className="font-bold text-slate-800 text-xs">{indentHeader?.NOCDATE || '-'}</div>
                                                </div>
                                                
                                                {/* Issue Details */}
                                                {isHeaderEditing ? (
                                                    <>
                                                        <div className="col-span-2">
                                                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Issue Date</label>
                                                            <input 
                                                                type="date" 
                                                                value={editHeaderData.issueDate}
                                                                onChange={e => setEditHeaderData({ ...editHeaderData, issueDate: e.target.value })}
                                                                className="w-full border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 text-xs h-7"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Remarks</label>
                                                            <input 
                                                                type="text"
                                                                value={editHeaderData.remarks}
                                                                onChange={e => setEditHeaderData({ ...editHeaderData, remarks: e.target.value })}
                                                                className="w-full border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 text-xs h-7"
                                                                placeholder="Remarks..."
                                                            />
                                                        </div>
                                                        <div className="col-span-2 flex gap-1 h-7 items-end">
                                                            {isEditMode && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setIsHeaderEditing(false);
                                                                        setEditHeaderData({
                                                                            issueDate: issueHeader?.ISSUEDATE || '',
                                                                            remarks: issueHeader?.REMARKS || ''
                                                                        });
                                                                    }}
                                                                    className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded hover:bg-slate-200 flex items-center justify-center text-[10px] h-full transition-colors w-full"
                                                                >
                                                                    <XCircleIcon className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={handleUpdateHeader}
                                                                disabled={savingHeader}
                                                                className="px-2 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 flex items-center justify-center gap-1 disabled:opacity-75 transition-colors text-[10px] h-full whitespace-nowrap w-full"
                                                            >
                                                                {savingHeader ? (
                                                                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircleIcon className="w-3 h-3" /> {isEditMode ? 'Update' : 'Save'}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="col-span-2">
                                                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Issue Date</label>
                                                            <div className="font-bold text-slate-800 text-xs">{issueHeader?.ISSUEDATE || '-'}</div>
                                                        </div>
                                                        <div className="col-span-4">
                                                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Remarks</label>
                                                            <div className="font-bold text-slate-800 text-xs truncate" title={issueHeader?.REMARKS}>{issueHeader?.REMARKS || '-'}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    {isEditMode && !isHeaderEditing && (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="bg-[#0f172a] px-4 py-3">
                                                <h2 className="text-sm font-bold text-white tracking-wide">Items</h2>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider font-bold">
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center w-12">Sl No</th>
                                                            <th className="px-4 py-3 border-b border-slate-200">Item Name</th>
                                                            <th className="px-4 py-3 border-b border-slate-200">Strength</th>
                                                            <th className="px-4 py-3 border-b border-slate-200">Unit</th>
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center">Req Qty</th>
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center">Cur Stock</th>
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center">Issue Qty</th>
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center w-40">Batch Details</th>
                                                            <th className="px-4 py-3 border-b border-slate-200 text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm">
                                                        {items.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="8" className="px-4 py-8 text-center text-slate-500 font-medium">No items found in indent</td>
                                                            </tr>
                                                        ) : (
                                                            items.map((item, idx) => (
                                                                <React.Fragment key={item.ITEMID}>
                                                                    <tr className="hover:bg-slate-50">
                                                                        <td className="px-4 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                                                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                                                            {item.ITEMNAME}
                                                                            <div className="text-xs text-blue-600 font-mono">{item.ITEMCODE}</div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-slate-600">{item.STRENGTH}</td>
                                                                        <td className="px-4 py-3 text-slate-600">{item.SKU}</td>
                                                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{item.REQUESTEDQTY}</td>
                                                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{item.CURSTOCK}</td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <input 
                                                                                id={`issue-qty-${item.ITEMID}`}
                                                                                type="number"
                                                                                min="0"
                                                                                defaultValue={item.ISSUEQTY}
                                                                                className="w-20 border border-slate-300 rounded px-2 py-1 text-center font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <BatchDetailsCell issueItemId={item.ISSUEITEMID} itemId={item.ITEMID} />
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                                                            {item.ISSUEITEMID ? (
                                                                                <>
                                                                                    <button 
                                                                                        title="Save Edits"
                                                                                        onClick={() => handleUpdateItem(item)}
                                                                                        disabled={savingItemId === item.ITEMID}
                                                                                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50 w-8 h-8 flex items-center justify-center"
                                                                                    >
                                                                                        {savingItemId === item.ITEMID ? (
                                                                                            <div className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin"></div>
                                                                                        ) : (
                                                                                            <PencilSquareIcon className="w-5 h-5" />
                                                                                        )}
                                                                                    </button>
                                                                                    <button 
                                                                                        title="Delete Item"
                                                                                        onClick={() => handleDeleteItem(item)}
                                                                                        disabled={savingItemId === item.ITEMID}
                                                                                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 w-8 h-8 flex items-center justify-center"
                                                                                    >
                                                                                        {savingItemId === item.ITEMID ? (
                                                                                            <div className="w-5 h-5 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div>
                                                                                        ) : (
                                                                                            <TrashIcon className="w-5 h-5" />
                                                                                        )}
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <button 
                                                                                    onClick={() => handleSaveItem(item)}
                                                                                    disabled={savingItemId === item.ITEMID}
                                                                                    className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 min-w-[80px] h-8 flex justify-center items-center"
                                                                                >
                                                                                    {savingItemId === item.ITEMID ? (
                                                                                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                                                                    ) : 'Save Item'}
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons at Bottom */}
                                    {isEditMode && items.length > 0 && (
                                        <div className="flex justify-end gap-4 mt-6">
                                            <button
                                                onClick={handleDeleteIssue}
                                                className="px-5 py-2.5 bg-red-50 text-red-700 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2"
                                            >
                                                <TrashIcon className="w-5 h-5" /> Delete Issue
                                            </button>
                                            <button
                                                onClick={handleCompleteIssue}
                                                className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow flex items-center gap-2"
                                            >
                                                <CheckCircleIcon className="w-5 h-5" /> Complete Issue
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    </>
  
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
