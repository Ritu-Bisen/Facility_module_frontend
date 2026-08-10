import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFinancialYears, getWarehouseIndents, getReceiptsByIndent } from '../api/warehouseReceiptApi';
import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function WarehouseReceiptFAC() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [finYears, setFinYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [filterPending, setFilterPending] = useState(location.state?.filterPending || false);

    useEffect(() => {
        fetchFinYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchIndents(selectedYear);
        }
    }, [selectedYear]);

    const fetchFinYears = async () => {
        try {
            const res = await getFinancialYears();
            if (res.success) {
                setFinYears(res.data);
                if (res.data.length > 0) {
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const currentMonth = today.getMonth(); // 0 = Jan, 3 = Apr
                    
                    let finYearString;
                    if (currentMonth >= 3) { // April onwards
                        finYearString = `${currentYear}-${currentYear + 1}`;
                    } else { // Jan-March
                        finYearString = `${currentYear - 1}-${currentYear}`;
                    }
                    
                    // Match either "2026-2027" or "26-27" format
                    const defaultYearObj = res.data.find(y => 
                        y.year === finYearString || 
                        y.year === finYearString.replace(/20/g, '') ||
                        y.year.includes(finYearString.split('-')[0].slice(-2) + '-' + finYearString.split('-')[1].slice(-2))
                    );

                    if (defaultYearObj) {
                        setSelectedYear(defaultYearObj.id);
                    } else {
                        setSelectedYear(res.data[0].id);
                    }
                }
            }
        } catch (error) {
            toast.error("Failed to load financial years");
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


    const getStatusColor = (status) => {
        switch (status) {
            case 'Received':
                return 'text-green-600 bg-green-50 ring-green-600/20';
            case 'Yet to be Received':
                return 'text-red-600 bg-red-50 ring-red-600/20';
            case 'Partial Receipt':
                return 'text-blue-600 bg-blue-50 ring-blue-600/20';
            case 'Completed':
                return 'text-green-600';
            case 'Incomplete':
                return 'text-red-600';
            default:
                return 'text-gray-600 bg-gray-50 ring-gray-500/10';
        }
    };

    const displayedIndents = useMemo(() => {
        if (!filterPending) return indents;
        return indents.filter(i => i.receiptStatus === 'Yet to be Received' || i.receiptStatus === 'Partial Receipt' || i.receiptStatus === 'Incomplete');
    }, [indents, filterPending]);

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

                <div className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                            <span className="ml-3 text-slate-500 font-medium">Loading Indents...</span>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Sl. No.</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Warehouse</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Indent No</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Indent Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">WH Issue No</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">WH Issue Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Receipt No</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Receipt Date</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-semibold tracking-wider">Status</th>
                                    <th scope="col" className="whitespace-nowrap px-2 py-3 text-center text-[11px] font-semibold tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {displayedIndents.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="px-4 py-8 text-center text-sm text-slate-500">
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
                                                <td className="whitespace-nowrap px-2 py-3 text-xs font-medium text-slate-900">{indent.receiptNo || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-slate-600">{indent.receiptDate || '-'}</td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs">
                                                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-medium ring-1 ring-inset ${getStatusColor(indent.receiptStatus)}`}>
                                                        {indent.receiptStatus}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-xs text-center">
                                                    {indent.receiptId ? (
                                                        <button 
                                                            onClick={() => navigate(`/indent/warehouse-receipts/view/${indent.receiptId}`)}
                                                            className="text-emerald-600 hover:text-emerald-800 hover:underline focus:outline-none font-bold"
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors border border-emerald-200 mx-auto"
                                                        >
                                                            <PlusCircleIcon className="w-3.5 h-3.5" />
                                                            New
                                                        </button>
                                                    )}
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
  
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
