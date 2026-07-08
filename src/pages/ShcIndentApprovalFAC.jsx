import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getShcIndents, getFinancialYears } from '../api/shcIndentApi';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getIndentItems, getIndentHeader } from '../api/shcIndentItemApi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    ArrowPathIcon,
    ArrowDownTrayIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

export default function ShcIndentApprovalFAC() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [indents, setIndents] = useState([]);
    const [finYears, setFinYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const user = useSelector((s) => s.auth.user);
    const facilityId = user?.facilityId;
    const [selectedStatus, setSelectedStatus] = useState('I');
    const [initialLoad, setInitialLoad] = useState(true);

    const statusOptions = [
        { value: 'I', label: 'Incomplete' },
        { value: 'C', label: 'Completed' },
        { value: 'All', label: 'All' }
    ];

    useEffect(() => {
        fetchFinYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchIndents();
        }
    }, [selectedYear, selectedStatus]);

    const fetchFinYears = async () => {
        try {
            const res = await getFinancialYears();
            if (res.success) {
                setFinYears(res.data);
                if (res.data.length > 0) {
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const currentMonth = today.getMonth();
                    
                    let runningYearStr = '';
                    if (currentMonth >= 3) {
                        runningYearStr = `${currentYear}-${currentYear + 1}`;
                    } else {
                        runningYearStr = `${currentYear - 1}-${currentYear}`;
                    }
                    
                    const runningYearItem = res.data.find(y => y.year === runningYearStr);
                    if (runningYearItem) {
                        setSelectedYear(runningYearItem.id);
                    } else {
                        setSelectedYear(res.data[0].id);
                    }
                }
            }
        } catch (err) {
            toast.error('Failed to load financial years');
        } finally {
            setInitialLoad(false);
        }
    };

    const fetchIndents = async () => {
        if (!selectedYear) return;
        setLoading(true);
        try {
            const res = await getShcIndents(facilityId, selectedYear, selectedStatus);
            if (res.success) {
                setIndents(res.data);
            } else {
                toast.error(res.message || 'Failed to fetch indents');
            }
        } catch (error) {
            toast.error('Error loading SHC indents');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (indentId) => {
        navigate(`/indent/shc-approval/${indentId}`);
    };

    const handleDownload = async (nocId, nocNumber) => {
        const toastId = toast.loading('Generating PDF...');
        try {
            const [headerRes, itemsRes] = await Promise.all([
                getIndentHeader(nocId),
                getIndentItems(nocId)
            ]);

            if (headerRes.success && itemsRes.success) {
                const header = headerRes.data;
                const items = itemsRes.data;

                const doc = new jsPDF('landscape'); // use landscape for wide tables
                
                doc.setFontSize(16);
                doc.text('AAM/SHC Indent Review & Approval', 14, 20);
                
                // Add header info table
                autoTable(doc, {
                    startY: 25,
                    theme: 'grid',
                    body: [
                        ['AAM/SHC Name', header.FACILITYNAME || '', 'District Name', header.DISTRICTNAME || ''],
                        ['Request No', header.NOCNUMBER || '', 'Requested Date', header.NOCDATE || ''],
                        ['Program', header.PROGRAM || 'Regular supply', '', '']
                    ],
                    columnStyles: {
                        0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 40 },
                        2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 40 }
                    },
                    styles: { fontSize: 10, cellPadding: 4 }
                });

                const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 55;

                if (items.length > 0) {
                    const tableColumn = ["Sl. No", "Item Code", "Item Name", "Strength", "Unit", "Item Type", "Requested Qty", "Approved Qty", "Approved Status"];
                    const tableRows = items.map((item, index) => [
                        index + 1,
                        item.ITEMCODE || '-',
                        item.ITEMNAME || '-',
                        item.STRENGTH1 || '-',
                        item.UNIT || '-',
                        item.ITEMTYPE || '-',
                        item.REQUESTEDQTY || 0,
                        item.APPROVEDQTY || 0,
                        item.APRSTATUS || 'No'
                    ]);

                    autoTable(doc, {
                        head: [tableColumn],
                        body: tableRows,
                        startY: finalY + 10,
                        theme: 'grid',
                        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
                        styles: { fontSize: 9 }
                    });
                } else {
                    doc.setFontSize(12);
                    doc.text('No items found for this indent.', 14, finalY + 15);
                }

                doc.save(`Indent_${nocNumber || nocId}.pdf`);
                toast.success('PDF downloaded successfully!', { id: toastId });
            } else {
                toast.error('Failed to fetch data for PDF', { id: toastId });
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Error generating PDF', { id: toastId });
        }
    };

    if (initialLoad) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    AAM/SHC Indent(For 2 Month) Review & Approval
                </h1>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2">
                        <label htmlFor="finYear" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Financial Year:</label>
                        <select
                            id="finYear"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-white text-slate-700 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 py-1.5 pl-3 pr-8 text-sm font-medium transition-all hover:bg-slate-50 cursor-pointer"
                        >
                            {finYears.map(year => (
                                <option key={year.id} value={year.id}>{year.year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="status" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Status:</label>
                        <select
                            id="status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-white text-slate-700 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 py-1.5 pl-3 pr-8 text-sm font-medium transition-all hover:bg-slate-50 cursor-pointer"
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                            <span className="ml-3 text-slate-500 font-medium">Loading Indents...</span>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-[#0f172a]">
                                <tr className="text-gray-100 text-[10px] uppercase font-bold tracking-wider">
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-center">Sl. No.</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-left">District</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-left">Facility</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-left">Request No.</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-left">Request Date</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-center">Status</th>
                                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {indents.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                                            No indents found.
                                        </td>
                                    </tr>
                                ) : (
                                    indents.map((indent, index) => (
                                        <tr key={indent.NOCID || index} className="transition-colors hover:bg-slate-50/50 align-middle bg-white">
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-400 text-center">{index + 1}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{indent.DISTRICTNAME || '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{indent.FACILITYNAME}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{indent.NOCNUMBER}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{indent.NOCDATE}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    indent.STATUS === 'I' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                    indent.STATUS === 'C' ? 'bg-green-50 text-green-700 ring-green-600/10' :
                                                    'bg-blue-50 text-blue-700 ring-blue-600/10'
                                                }`}>
                                                    {indent.STATUS === 'I' ? 'Incomplete' : indent.STATUS === 'C' ? 'Approved' : indent.STATUS}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                                                {indent.STATUS === 'C' ? (
                                                    <button 
                                                        onClick={() => handleDownload(indent.NOCID, indent.NOCNUMBER)}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-sm hover:shadow-md"
                                                    >
                                                        <ArrowDownTrayIcon className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                                                        Download
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleView(indent.NOCID)}
                                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm hover:shadow-md"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                                        View / Approve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
