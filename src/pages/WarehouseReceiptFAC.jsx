import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFinancialYears, getWarehouseIndents, getReceiptsByIndent, createWarehouseReceipt, deleteWarehouseReceipt } from '../api/warehouseReceiptApi';
import { getDefaultFinYearId } from '../utils/indentYearHelper';
import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, ArrowPathIcon, TrashIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function WarehouseReceiptFAC() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [finYears, setFinYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    
    // Modal states for creating receipt
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIndent, setSelectedIndent] = useState(null);
    const [receiptDate, setReceiptDate] = useState('');
    const [minReceiptDate, setMinReceiptDate] = useState('');
    const [maxReceiptDate, setMaxReceiptDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [filterPending, setFilterPending] = useState(location.state?.filterPending || false);
    const [filterIndentNo, setFilterIndentNo] = useState(location.state?.filterIndentNo || null);

    const getTodayYMD = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const parseDateToYMD = (dateStr) => {
        if (!dateStr || dateStr === '-') return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return '';
    };

    useEffect(() => {
        fetchFinYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchIndents(selectedYear);
        }
    }, [selectedYear]);

    const fetchFinYears = async () => {
        setLoading(true);
        try {
            const res = await getFinancialYears();
            if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                setFinYears(res.data);
                const defaultYear = location.state?.selectedYearId || getDefaultFinYearId(res.data, 'id', 'year');
                setSelectedYear(defaultYear);
            } else {
                const fallback = [
                    { id: 2, year: '2026-2027' },
                    { id: 1, year: '2025-2026' }
                ];
                setFinYears(fallback);
                setSelectedYear(location.state?.selectedYearId || 2);
            }
        } catch (error) {
            console.error("Failed to load financial years, using default:", error);
            const fallback = [
                { id: 2, year: '2026-2027' },
                { id: 1, year: '2025-2026' }
            ];
            setFinYears(fallback);
            setSelectedYear(location.state?.selectedYearId || 2);
        } finally {
            setLoading(false);
        }
    };

    const fetchIndents = async (year) => {
        setLoading(true);
        try {
            const res = await getWarehouseIndents(year);
            if (res.success) {
                setIndents(res.data);
            }
        } catch (error) {
            toast.error("Failed to load warehouse indents");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = (indent) => {
        setSelectedIndent(indent);
        const today = getTodayYMD();
        const issueYMD = parseDateToYMD(indent.whIssueDate);
        setMinReceiptDate(issueYMD || '');
        setMaxReceiptDate(today);
        // By default, set to current date
        setReceiptDate(today);
        setShowCreateModal(true);
    };

    const handleConfirmCreateReceipt = async () => {
        if (!selectedIndent) return;
        if (!receiptDate) {
            toast.error('Please select a receipt date');
            return;
        }
        if (minReceiptDate && receiptDate < minReceiptDate) {
            toast.error(`Receipt date cannot be earlier than Warehouse Issue Date (${selectedIndent.whIssueDate})`);
            return;
        }
        if (maxReceiptDate && receiptDate > maxReceiptDate) {
            toast.error('Receipt date cannot be greater than current date');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Creating receipt...');
        try {
            const res = await createWarehouseReceipt(selectedIndent.indentId, receiptDate);
            if (res.success && res.data?.receiptId) {
                toast.success('Receipt created successfully!', { id: toastId });
                setShowCreateModal(false);
                navigate(`/indent/warehouse-receipts/view/${res.data.receiptId}`);
            } else {
                toast.error(res.message || 'Failed to create receipt', { id: toastId });
            }
        } catch (error) {
            console.error('Error creating receipt:', error);
            toast.error('Failed to create receipt', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReceipt = async (receiptId, receiptNo) => {
        if (!window.confirm(`Are you sure you want to delete incomplete receipt "${receiptNo || receiptId}"? This will allow you to create a new receipt.`)) {
            return;
        }

        setDeletingId(receiptId);
        const toastId = toast.loading('Deleting receipt...');
        try {
            const res = await deleteWarehouseReceipt(receiptId);
            if (res.success) {
                toast.success('Receipt deleted successfully!', { id: toastId });
                fetchIndents(selectedYear);
            } else {
                toast.error(res.message || 'Failed to delete receipt', { id: toastId });
            }
        } catch (error) {
            console.error('Error deleting receipt:', error);
            toast.error(error?.response?.data?.message || 'Failed to delete receipt', { id: toastId });
        } finally {
            setDeletingId(null);
        }
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'Received':
                return 'text-green-600 bg-green-50 ring-green-600/20';
            case 'Yet to be Received':
                return 'text-red-600 bg-red-50 ring-red-600/20';
            case 'Partial Receipt':
                return 'text-blue-600 bg-blue-50 ring-blue-600/20';
            case 'Completed':
                return 'text-emerald-700 bg-emerald-50 ring-emerald-600/20';
            case 'Incomplete':
                return 'text-amber-700 bg-amber-50 ring-amber-600/30';
            default:
                return 'text-gray-600 bg-gray-50 ring-gray-500/10';
        }
    };

    const displayedIndents = useMemo(() => {
        let list = indents;
        if (filterPending) {
            list = list.filter(i => i.receiptStatus === 'Yet to be Received' || i.receiptStatus === 'Partial Receipt' || i.receiptStatus === 'Incomplete');
        }
        if (filterIndentNo) {
            list = list.filter(i => String(i.indentNo || '').toLowerCase() === String(filterIndentNo).toLowerCase());
        }
        return list;
    }, [indents, filterPending, filterIndentNo]);

    return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Receipts From Warehouse</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-slate-500 font-medium">Manage warehouse receipts received against facility indents</p>
                        {filterPending && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-600/20">
                                Pending Filter Active
                                <button onClick={() => setFilterPending(false)} className="ml-1.5 text-orange-600 hover:text-orange-900 font-bold">&times;</button>
                            </span>
                        )}
                        {filterIndentNo && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-600/20">
                                Indent: {filterIndentNo}
                                <button onClick={() => setFilterIndentNo(null)} className="ml-1.5 text-blue-600 hover:text-blue-900 font-bold">&times;</button>
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="finYear" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Fin. Year</label>
                    <select
                        id="finYear"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-white text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 py-2 pl-4 pr-10 text-sm font-medium shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
                    >
                        {finYears.map(year => (
                            <option key={year.id} value={year.id}>{year.year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex">
                        <button className="whitespace-nowrap border-b-2 border-emerald-500 px-8 py-4 text-sm font-bold text-emerald-600 bg-emerald-50/50">
                            Receipts from Warehouse
                        </button>
                        {/* Future tab: Return to Warehouse */}
                    </nav>
                </div>

                <div className="p-0 overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                            <span className="ml-3 text-slate-500 font-medium">Loading Indents...</span>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Sl. No.</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Warehouse</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Indent No</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Indent Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">WH Issue No</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">WH Issue Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Delivery Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Receipt No</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Receipt Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider bg-slate-100">Status</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-center text-[11px] font-semibold tracking-wider bg-slate-100">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {displayedIndents.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500">
                                            No indents found for the selected financial year.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedIndents.map((indent, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="transition-colors hover:bg-slate-50 bg-white">
                                                <td className="whitespace-nowrap px-2 py-3 text-xs font-medium text-slate-900 text-center">{index + 1}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.warehouse}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs font-medium text-slate-900">{indent.indentNo}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.indentDate}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.whIssueNo || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.whIssueDate || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.deliveryDate || indent.dropDate1 || indent.dropDateTime || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs font-medium text-slate-900">{indent.receiptNo || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.receiptDate || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs">
                                                    {indent.receiptStatus === 'Incomplete' && indent.receiptId ? (
                                                        <button
                                                            onClick={() => navigate(`/indent/warehouse-receipts/view/${indent.receiptId}`)}
                                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] sm:text-xs font-semibold ring-1 ring-inset transition-all hover:scale-105 cursor-pointer focus:outline-none ${getStatusColor(indent.receiptStatus)}`}
                                                            title="Click to complete receipt"
                                                        >
                                                            {indent.receiptStatus}
                                                        </button>
                                                    ) : (
                                                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-medium ring-1 ring-inset ${getStatusColor(indent.receiptStatus)}`}>
                                                            {indent.receiptStatus}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-center">
                                                    {indent.receiptStatus === 'Completed' && indent.receiptId ? (
                                                        <button 
                                                            onClick={() => navigate(`/indent/warehouse-receipts/view/${indent.receiptId}`)}
                                                            className="text-emerald-600 hover:text-emerald-800 hover:underline focus:outline-none font-bold"
                                                        >
                                                            View
                                                        </button>
                                                    ) : indent.receiptStatus === 'Incomplete' && indent.receiptId ? (
                                                        <button 
                                                            onClick={() => handleDeleteReceipt(indent.receiptId, indent.receiptNo)}
                                                            disabled={deletingId === indent.receiptId}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-2 py-1 rounded transition-colors border border-red-200"
                                                            title="Delete incomplete receipt"
                                                        >
                                                            {deletingId === indent.receiptId ? (
                                                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            )}
                                                            Delete
                                                        </button>
                                                    ) : (!indent.receiptId ? (
                                                        <button 
                                                            onClick={() => handleOpenCreateModal(indent)}
                                                            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 px-2 py-1 rounded transition-colors border border-emerald-200 mx-auto"
                                                        >
                                                            <PlusCircleIcon className="w-3.5 h-3.5" />
                                                            New
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium">-</span>
                                                    ))}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>

        {/* Create Receipt Modal with Date Selection */}
        {showCreateModal && selectedIndent && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <PlusCircleIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Create Warehouse Receipt</h3>
                                <p className="text-xs text-slate-500">Enter receipt date against this indent</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Warehouse:</span>
                                <span className="font-semibold text-slate-800">{selectedIndent.warehouse}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Indent No:</span>
                                <span className="font-semibold text-slate-800 font-mono">{selectedIndent.indentNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">WH Issue No:</span>
                                <span className="font-semibold text-slate-800 font-mono">{selectedIndent.whIssueNo || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">WH Issue Date:</span>
                                <span className="font-bold text-emerald-700">{selectedIndent.whIssueDate || '-'}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Receipt Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={receiptDate}
                                min={minReceiptDate || undefined}
                                max={maxReceiptDate || undefined}
                                onChange={(e) => setReceiptDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                required
                            />
                            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                                <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>
                                    Allowed from <strong>{selectedIndent.whIssueDate || 'Issue Date'}</strong> up to <strong>Today</strong>
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmCreateReceipt}
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                        >
                            {submitting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                            <span>Save &amp; Create</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
  
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
