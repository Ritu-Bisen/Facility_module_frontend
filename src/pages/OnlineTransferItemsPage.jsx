import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { getIndentHeader, getIssueHeader, createIssueHeader, updateIssueHeader, getItemsForIssue } from '../api/onlineTransferItemsApi';
import { PencilSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function OnlineTransferItemsPage() {
    const navigate = useNavigate();
    const { nocId, issueId } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = Boolean(issueId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState(null);

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

    const loadData = async () => {
        setLoading(true);
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

            if (isEditMode) {
                const res = await updateIssueHeader(issueId, editHeaderData);
                if (res.success) {
                    setMsg("Updated Successfully");
                    setIsHeaderEditing(false);
                    loadData();
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
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
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
                                <div className="p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200">
                                    {msg}
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200">
                                    {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="p-10 text-center text-slate-500 font-bold">Loading...</div>
                            ) : (
                                <>
                                    {/* Header Panel */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="bg-[#0f172a] px-4 py-3 flex justify-between items-center">
                                            <h2 className="text-sm font-bold text-white tracking-wide">Indent & Issue Details</h2>
                                            {!isHeaderEditing && (
                                                <button 
                                                    onClick={() => setIsHeaderEditing(true)}
                                                    className="text-white hover:text-indigo-200 flex items-center gap-1 text-xs font-bold"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" /> Edit
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 space-y-4">
                                            {indentHeader && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase">To Facility</label>
                                                        <div className="font-bold text-slate-800">{indentHeader.FACILITYNAME}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase">Requested No</label>
                                                        <div className="font-bold text-slate-800">{indentHeader.NOCNUMBER}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase">Requested Date</label>
                                                        <div className="font-bold text-slate-800">{indentHeader.NOCDATE}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {isHeaderEditing ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase block mb-1">Issue No</label>
                                                        <div className="font-bold text-slate-800 py-1.5">{issueHeader?.ISSUENO || 'Auto generated'}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase block mb-1">Issue Date</label>
                                                        <input 
                                                            type="date" 
                                                            value={editHeaderData.issueDate}
                                                            onChange={e => setEditHeaderData({ ...editHeaderData, issueDate: e.target.value })}
                                                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="text-xs text-slate-500 font-semibold uppercase block mb-1">Remarks</label>
                                                        <textarea 
                                                            value={editHeaderData.remarks}
                                                            onChange={e => setEditHeaderData({ ...editHeaderData, remarks: e.target.value })}
                                                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                                                            rows="2"
                                                        ></textarea>
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end gap-2">
                                                        {isEditMode && (
                                                            <button 
                                                                onClick={() => {
                                                                    setIsHeaderEditing(false);
                                                                    setEditHeaderData({
                                                                        issueDate: issueHeader?.ISSUEDATE || '',
                                                                        remarks: issueHeader?.REMARKS || ''
                                                                    });
                                                                }}
                                                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 flex items-center gap-2"
                                                            >
                                                                <XCircleIcon className="w-5 h-5" /> Cancel
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={handleUpdateHeader}
                                                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" /> {isEditMode ? 'Update' : 'Save & Continue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase block">Issue No</label>
                                                        <div className="font-bold text-slate-800">{issueHeader?.ISSUENO}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase block">Issue Date</label>
                                                        <div className="font-bold text-slate-800">{issueHeader?.ISSUEDATE}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 font-semibold uppercase block">Remarks</label>
                                                        <div className="font-bold text-slate-800">{issueHeader?.REMARKS || '-'}</div>
                                                    </div>
                                                </div>
                                            )}
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
                                                                <tr key={item.ITEMID} className="hover:bg-slate-50">
                                                                    <td className="px-4 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                                        {item.ITEMNAME}
                                                                        <div className="text-xs text-blue-600 font-mono">{item.ITEMCODE}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">{item.STRENGTH}</td>
                                                                    <td className="px-4 py-3 text-slate-600">{item.SKU}</td>
                                                                    <td className="px-4 py-3 text-center font-bold text-slate-700">{item.REQUESTEDQTY}</td>
                                                                    <td className="px-4 py-3 text-center font-bold text-slate-700">{item.CURSTOCK}</td>
                                                                    <td className="px-4 py-3 text-center font-bold text-indigo-600">{item.ISSUEQTY}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <button 
                                                                            onClick={() => {
                                                                                // Batch assignment implementation would go here
                                                                                // For now, this is a placeholder matching the standard approach
                                                                                alert("Batch addition will be available here");
                                                                            }}
                                                                            className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                                                                        >
                                                                            Assign Batches
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
