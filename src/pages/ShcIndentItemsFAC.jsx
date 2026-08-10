import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getIndentHeader, getIndentItems, approveItem, completeIndent } from '../api/shcIndentItemApi';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ShcIndentItemsFAC() {
    const { nocId } = useParams();
    const navigate = useNavigate();

    const [header, setHeader] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nocId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [headerRes, itemsRes] = await Promise.all([
                getIndentHeader(nocId),
                getIndentItems(nocId)
            ]);
            
            if (headerRes.success) {
                setHeader(headerRes.data);
            }
            if (itemsRes.success) {
                setItems(itemsRes.data);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (index) => {
        const newItems = [...items];
        newItems[index].isChecked = !newItems[index].isChecked;
        setItems(newItems);
    };

    const handleQtyChange = (index, value) => {
        const newItems = [...items];
        newItems[index].APPROVEDQTY = value;
        setItems(newItems);
    };

    const handleApproveSelected = async () => {
        const selectedItems = items.filter(i => i.isChecked && i.APRSTATUS !== 'Yes');
        if (selectedItems.length === 0) {
            toast.error('Please select at least one item to approve.');
            return;
        }

        const toastId = toast.loading(`Approving ${selectedItems.length} items...`);
        try {
            await Promise.all(selectedItems.map(item => approveItem({
                sr: item.SR,
                nocId: nocId,
                itemId: item.ITEMID,
                approvedQty: item.APPROVEDQTY
            })));

            toast.success('Selected items approved successfully', { id: toastId });
            
            const newItems = items.map(item => {
                if (item.isChecked && item.APRSTATUS !== 'Yes') {
                    return { ...item, APRSTATUS: 'Yes', isChecked: false };
                }
                return item;
            });
            setItems(newItems);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error approving items', { id: toastId });
        }
    };

    const handleComplete = async () => {
        if (!confirm('Are you sure you want to complete this indent approval?')) return;
        setSubmitting(true);
        try {
            const res = await completeIndent(nocId);
            if (res.success) {
                toast.success(res.message);
                navigate('/indent/shc-approval');
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error completing indent');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50 p-8">
                <div className="text-indigo-600 font-semibold text-lg">Loading Indent Details...</div>
            </div>
        );
    }

    if (!header) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-8">
                <div className="text-red-500 font-semibold mb-4">Indent Not Found</div>
                <button onClick={() => navigate('/indent/shc-approval')} className="text-indigo-600 hover:underline">
                    &larr; Back to Approvals
                </button>
            </div>
        );
    }

    const isCompleted = header.STATUS === 'C' || header.ISPFACAPPROVAL === 'Y';

    return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="p-6 bg-gray-50 min-h-screen">
            {/* Top Navigation & Actions */}
            <div className="mb-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/indent/shc-approval')}
                    className="flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Indent Approvals
                </button>

                {!isCompleted && (
                    <button
                        onClick={handleComplete}
                        disabled={submitting}
                        className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                    >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        {submitting ? 'Completing...' : 'Complete Indent'}
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div>
                    <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">AAM/SHC Indent Review & Approval</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Review and approve items for this indent</p>
                </div>
            </div>

            {/* Header Details Table */}
            <div className="bg-white border border-t-0 border-gray-300 shadow-sm mb-6">
                <table className="w-full text-sm text-left">
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 bg-gray-50 w-1/4 text-gray-700 font-semibold">AAM/SHC Name</th>
                            <td className="px-4 py-3 w-1/4 border-r border-gray-200">{header.FACILITYNAME}</td>
                            <th className="px-4 py-3 bg-gray-50 w-1/4 text-gray-700 font-semibold">District Name</th>
                            <td className="px-4 py-3 w-1/4">{header.DISTRICTNAME || '-'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 bg-gray-50 w-1/4 text-gray-700 font-semibold">Request No</th>
                            <td className="px-4 py-3 w-1/4 border-r border-gray-200 font-mono">{header.NOCNUMBER}</td>
                            <th className="px-4 py-3 bg-gray-50 w-1/4 text-gray-700 font-semibold">Requested Date</th>
                            <td className="px-4 py-3 w-1/4">{header.NOCDATE}</td>
                        </tr>
                        <tr>
                            <th className="px-4 py-3 bg-gray-50 w-1/4 text-gray-700 font-semibold">Program</th>
                            <td className="px-4 py-3 border-r border-gray-200" colSpan={3}>{header.PROGRAM || 'Regular supply'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Bulk Actions */}
            {!isCompleted && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleApproveSelected}
                        disabled={!items.some(i => i.isChecked)}
                        className={`px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition-colors ${
                            items.some(i => i.isChecked)
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        Approve Selected
                    </button>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white border border-gray-300 shadow-sm overflow-x-auto rounded-md">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                <th className="px-5 py-3.5 text-center w-20">Sl. No</th>
                                <th className="px-5 py-3.5">Item Code</th>
                                <th className="px-5 py-3.5">Item Name</th>
                                <th className="px-5 py-3.5">Strength</th>
                                <th className="px-5 py-3.5">Unit</th>
                                <th className="px-5 py-3.5">Item Type</th>
                                <th className="px-5 py-3.5 text-right">Requested Qty</th>
                                <th className="px-5 py-3.5 text-right">To be Approved Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-8 text-center text-gray-500">No items found for this indent.</td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={item.SR} className="hover:bg-slate-50/50 align-middle bg-white transition-colors">
                                        <td className="px-5 py-4 text-center font-bold text-slate-400">
                                            <div className="flex items-center justify-center gap-2">
                                                {item.APRSTATUS !== 'Yes' && !isCompleted && (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={item.isChecked || false}
                                                        onChange={() => handleCheckboxChange(index)}
                                                        className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                )}
                                                <span>{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-800 font-semibold">{item.ITEMCODE}</td>
                                        <td className="px-5 py-4 text-slate-800 whitespace-normal min-w-[250px]">{item.ITEMNAME}</td>
                                        <td className="px-5 py-4 text-slate-800">{item.STRENGTH1 || '-'}</td>
                                        <td className="px-5 py-4 text-slate-800">{item.UNIT || '-'}</td>
                                        <td className="px-5 py-4 text-slate-800">{item.ITEMTYPE || '-'}</td>
                                        <td className="px-5 py-4 text-right text-slate-800 font-medium">{item.REQUESTEDQTY}</td>
                                        <td className="px-5 py-4 text-right">
                                            {isCompleted || item.APRSTATUS === 'Yes' ? (
                                                <span className="font-semibold text-gray-900">{item.APPROVEDQTY}</span>
                                            ) : (
                                                <input 
                                                    type="number"
                                                    value={item.APPROVEDQTY}
                                                    onChange={(e) => handleQtyChange(index, e.target.value)}
                                                    disabled={!item.isChecked}
                                                    className={`w-24 px-2 py-1 text-right border rounded-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                                                        item.isChecked 
                                                            ? 'bg-white border-slate-300' 
                                                            : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                    min="0"
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
        </div>
    )
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
