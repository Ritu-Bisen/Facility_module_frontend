import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { getHoldBatchesReport, getItemTypes } from '../api/reportApi';
import { ArrowPathIcon, DocumentArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function FacHoldBatchReport() {
    const [itemTypes, setItemTypes] = useState([]);
    const [selectedItemType, setSelectedItemType] = useState('0');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchItemTypes();
        fetchReportData('0');
    }, []);

    const fetchItemTypes = async () => {
        try {
            const res = await getItemTypes();
            if (res.success && res.data) {
                setItemTypes(res.data);
            }
        } catch (error) {
            toast.error('Failed to load item types');
        }
    };

    const fetchReportData = async (itemTypeId) => {
        setLoading(true);
        try {
            const res = await getHoldBatchesReport(itemTypeId);
            if (res.success) {
                setReportData(res.data);
            }
        } catch (error) {
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleItemTypeChange = (e) => {
        const val = e.target.value;
        setSelectedItemType(val);
        fetchReportData(val);
    };

    const handleExportExcel = () => {
        if (reportData.length === 0) {
            toast.error('No data to export');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(reportData.map(row => ({
            'Sl. No.': row.slNo,
            'Facility Name': row.facilityName,
            'Drug Code': row.drugCode,
            'Drug Name': row.drugName,
            'Unit': row.unit,
            'Item Type': row.itemType,
            'Available Stock': row.availableStock,
            'Batch No': row.batchNo,
            'Expiry Date': row.expiryDate,
            'Category Name': row.categoryName,
            'Hold Status': row.holdStatus
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'HoldBatches');
        
        const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
        XLSX.writeFile(wb, `WHCurrentStock${dateStr}.xlsx`);
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto">
                        <div className="w-full h-full p-6 bg-gray-50/50">
                            <div className="max-w-[1400px] mx-auto space-y-6">
                                
                                {/* Header Section */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                                    <div>
                                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-800 tracking-tight">
                                            Hold Batches Report
                                        </h1>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">View and manage all batches currently on hold</p>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <label className="sr-only">Select Item Type</label>
                                            <select
                                                value={selectedItemType}
                                                onChange={handleItemTypeChange}
                                                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm font-medium"
                                            >
                                                <option value="0">All Item Types</option>
                                                {itemTypes.map(type => (
                                                    <option key={type.itemTypeId} value={type.itemTypeId}>
                                                        {type.itemTypeName}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                </svg>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleExportExcel}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                        >
                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                            <span>Export Excel</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Disclaimer Alert */}
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-700 font-semibold text-sm md:text-base leading-relaxed">
                                        दवा बैच के होल्ड होने पर, उपयोग /वितरण नहीं किया जाना है एवं उक्त दवा बैच को होल्ड स्थिति में रखना है एवं उठाव हेतु वेयरहाउस तो अवगत कराएं
                                    </p>
                                </div>

                                {/* Data Grid */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-max border-collapse">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-b border-slate-700">
                                                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider">Sl. No.</th>
                                                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider">Facility Name</th>
                                                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider">Drug Code</th>
                                                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider">Drug Name</th>
                                                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider">Unit</th>
                                                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider">Item Type</th>
                                                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider">Stock</th>
                                                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider">Batch No</th>
                                                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider">Expiry</th>
                                                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                                                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="11" className="p-12 text-center bg-gray-50/50">
                                                            <div className="flex flex-col justify-center items-center gap-3">
                                                                <ArrowPathIcon className="w-8 h-8 text-emerald-600 animate-spin" />
                                                                <span className="text-gray-500 font-medium">Fetching secure records...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : reportData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="11" className="p-12 text-center bg-gray-50/50">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                                    <DocumentArrowDownIcon className="w-8 h-8 text-gray-400" />
                                                                </div>
                                                                <p className="text-gray-600 font-semibold text-lg">No batches on hold</p>
                                                                <p className="text-gray-400 text-sm">There is no data matching the current filters.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    reportData.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-emerald-50/50 transition-colors group">
                                                            <td className="p-4 text-center text-sm text-gray-500 font-medium">{row.slNo}</td>
                                                            <td className="p-4 text-left text-sm text-gray-900 font-medium">{row.facilityName}</td>
                                                            <td className="p-4 text-left text-sm text-gray-500 font-mono">{row.drugCode}</td>
                                                            <td className="p-4 text-left text-sm text-gray-800 font-medium max-w-xs truncate" title={row.drugName}>{row.drugName}</td>
                                                            <td className="p-4 text-right text-sm text-gray-500">{row.unit}</td>
                                                            <td className="p-4 text-center text-sm text-gray-500">
                                                                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">{row.itemType}</span>
                                                            </td>
                                                            <td className="p-4 text-right text-sm text-gray-900 font-bold">{row.availableStock}</td>
                                                            <td className="p-4 text-right text-sm text-gray-700 font-mono bg-gray-50 group-hover:bg-transparent">{row.batchNo}</td>
                                                            <td className="p-4 text-right text-sm text-gray-700">{row.expiryDate}</td>
                                                            <td className="p-4 text-left text-sm text-gray-500 max-w-[150px] truncate" title={row.categoryName}>{row.categoryName}</td>
                                                            <td className="p-4 text-center text-sm">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                    row.holdStatus === 'Hold' 
                                                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                                                    : 'bg-green-100 text-green-700 border border-green-200'
                                                                }`}>
                                                                    {row.holdStatus === 'Hold' ? 'HOLD' : 'ACTIVE'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
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
