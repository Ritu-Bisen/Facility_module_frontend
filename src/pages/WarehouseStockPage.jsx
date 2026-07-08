import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { storeAPI } from '../features/store/storeAPI';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

export default function WarehouseStockPage() {
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;
  const isWarehouse = user?.roleName?.toLowerCase() === 'warehouse' || user?.role?.toLowerCase() === 'warehouse' || localStorage.getItem('roleName')?.toLowerCase() === 'warehouse';

  const [allData, setAllData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedCgmsc, setSelectedCgmsc] = useState('');
  const [selectedEdl, setSelectedEdl] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('');

  useEffect(() => {
    if (facilityId) {
      loadStockData();
    }
  }, [facilityId]);

  const loadStockData = async () => {
    if (!facilityId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await storeAPI.getWarehouseStock(facilityId);
      setAllData(result || []);
      setDataLoaded(true);
    } catch (e) {
      console.error('Failed to load stock data:', e);
      setError('Failed to fetch stock data. Please try again.');
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueDrugs = useMemo(() => {
    const map = new Map();
    allData.forEach(item => {
      const code = item.ITEMCODE || item.ITEMCODE;
      const name = item.ITEMNAME || item.itemname;
      if (code && name && !map.has(code)) map.set(code, `${code} - ${name}`);
    });
    return Array.from(map.values());
  }, [allData]);

  const uniqueCgmsc = useMemo(() =>
    [...new Set(allData.map(i => i.CGMSCFM || i.CGMSCFM).filter(Boolean))],
    [allData]);

  const uniqueEdl = useMemo(() =>
    [...new Set(allData.map(i => i.EDLTYPE || i.EDLTYPE || 'Non EDL'))],
    [allData]);

  const uniqueGroup = useMemo(() =>
    [...new Set(allData.map(i => i.GROUPNAME || i.groupname).filter(Boolean))],
    [allData]);

  const uniqueItemType = useMemo(() =>
    [...new Set(allData.map(i => i.ITEMTYPENAME || i.itemtypename).filter(Boolean))],
    [allData]);

  // Apply filters
  const filteredData = useMemo(() => {
    let data = allData;

    if (selectedDrug) {
      data = data.filter(item => {
        const code = item.ITEMCODE || item.ITEMCODE;
        const name = item.ITEMNAME || item.itemname;
        return `${code} - ${name}` === selectedDrug;
      });
    }
    if (selectedCgmsc) {
      data = data.filter(item => (item.CGMSCFM || item.CGMSCFM) === selectedCgmsc);
    }
    if (selectedEdl) {
      data = data.filter(item => {
        const edlVal = item.EDLTYPE || item.EDLTYPE || 'Non EDL';
        return edlVal === selectedEdl;
      });
    }
    if (selectedGroup) {
      data = data.filter(item => (item.GROUPNAME || item.groupname) === selectedGroup);
    }
    if (selectedItemType) {
      data = data.filter(item => (item.ITEMTYPENAME || item.itemtypename) === selectedItemType);
    }
    return data;
  }, [allData, selectedDrug, selectedCgmsc, selectedEdl, selectedGroup, selectedItemType]);

  const getFormattedData = () => filteredData.map((row, idx) => ({
    'Sl. No': idx + 1,
    'Item Code': row.ITEMCODE || row.itemcode || '—',
    'Item Name': row.ITEMNAME || row.itemname || '—',
    'Strength': row.STRENGTH1 || row.strength1 || '—',
    'Unit': row.UNIT || row.unit || '—',
    'Ready Qty': row.READYQTY || row.readyqty || '0',
    'Pipeline Qty': row.PIPELINEQTY || row.pipelineqty || '0',
    'IWH PIP Qty': row.IWHPIPQTY || row.iwhpipqty || '0',
    'Near Exp Qty': row.NEAREXPQTY3MONTH || row.nearexpqty3month || '0',
    'UQ Qty': row.UQQTY || row.uqqty || '0',
    'Group': row.GROUPNAME || row.groupname || '—',
    'EDL Type': row.EDLTYPE || row.edltype || '—',
    'CGMSC Flag': row.CGMSCFM || row.cgmscfm || '—',
  }));

  const exportToExcel = () => {
    const exportData = getFormattedData();
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    XLSX.writeFile(wb, 'Current_Stock_Drug_Wise.xlsx');
  };

  const exportToPDF = () => {
    const exportData = getFormattedData();
    if (!exportData.length) return;
    const doc = new jsPDF('landscape');
    doc.text('Warehouse Stock', 14, 15);
    autoTable(doc, {
      head: [Object.keys(exportData[0])],
      body: exportData.map(obj => Object.values(obj)),
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save('Facility_Stock_Item_Wise.pdf');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-full mx-auto space-y-5">

              {/* Page Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                    Warehouse Stock VS Facility Stock
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Concern Warehouse Stock</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {dataLoaded && (
                    <>
                      <button onClick={exportToExcel} className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all">
                        Export Excel
                      </button>
                      <button onClick={exportToPDF} className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all">
                        Export PDF
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Filters Section */}
              {!loading && dataLoaded && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">EDL Type</label>
                    <div className="relative">
                      <select
                        value={selectedEdl}
                        onChange={(e) => setSelectedEdl(e.target.value)}
                        className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">All</option>
                        {uniqueEdl.map((val, i) => <option key={i} value={val}>{val}</option>)}
                      </select>
                      {selectedEdl && (
                        <button onClick={() => setSelectedEdl('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Fast Moving</label>
                    <div className="relative">
                      <select
                        value={selectedCgmsc}
                        onChange={(e) => setSelectedCgmsc(e.target.value)}
                        className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">All</option>
                        {uniqueCgmsc.map((val, i) => <option key={i} value={val}>{val}</option>)}
                      </select>
                      {selectedCgmsc && (
                        <button onClick={() => setSelectedCgmsc('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Item</label>
                    <div className="relative">
                      <input
                        list="drug-list-cs"
                        value={selectedDrug}
                        onChange={(e) => setSelectedDrug(e.target.value)}
                        placeholder="All Drugs"
                        className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {selectedDrug && (
                        <button onClick={() => setSelectedDrug('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
                      )}
                    </div>
                    <datalist id="drug-list-cs">
                      <option value="" label="All Drugs" />
                      {uniqueDrugs.map((d, i) => <option key={i} value={d} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Dosage Form</label>
                    <div className="relative">
                      <select
                        value={selectedItemType}
                        onChange={(e) => setSelectedItemType(e.target.value)}
                        className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">All</option>
                        {uniqueItemType.map((val, i) => <option key={i} value={val}>{val}</option>)}
                      </select>
                      {selectedItemType && (
                        <button onClick={() => setSelectedItemType('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Therapeutic Group</label>
                    <div className="relative">
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">All</option>
                        {uniqueGroup.map((val, i) => <option key={i} value={val}>{val}</option>)}
                      </select>
                      {selectedGroup && (
                        <button onClick={() => setSelectedGroup('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium">{error}</div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400">Loading stock data…</p>
                </div>
              )}

              {/* Table */}
              {!loading && dataLoaded && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing <span className="text-blue-600 font-bold">{filteredData.length}</span> records
                    </span>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto max-h-[550px]">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10">
                          <th className="px-4 py-3 text-center w-10">S.No.</th>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Item</th>
                         
                          <th className="px-4 py-3 text-center">Strength</th>
                           <th className="px-4 py-3 text-center">Dosage Form</th>
                          <th className="px-4 py-3 text-center">Packing</th>
                          <th className="px-4 py-3 text-center">Facility Stock</th>
                          <th className="px-4 py-3 text-center">WH Ready Stock(in Nos)</th>
                          <th className="px-4 py-3 text-center">IWH Stock(in Nos)</th>
                         
                          {isWarehouse && <th className="px-4 py-3 text-center">Near Exp Qty</th>}
                          <th className="px-4 py-3 text-center">Under QC Stock(in Nos)</th>
                          
                          <th className="px-4 py-3 text-center">Stock Available Since</th>
                          <th className="px-4 py-3 text-center">QC Passed Since</th>
                           <th className="px-4 py-3 text-center">Pipeline Qty(in Nos)</th>

                          <th className="px-4 py-3">Therapeutic Group</th>
                          <th className="px-4 py-3">EDL Type</th>
                          <th className="px-4 py-3">Fast Moving</th>
                            <th className="px-4 py-3">EDL Coverage</th>
                          
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 align-middle">
                            <td className="px-4 py-3 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{item.ITEMCODE || item.itemcode || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800 text-xs">
                              <div className="whitespace-normal line-clamp-2 min-w-[200px] max-w-xs" title={item.ITEMNAME || item.itemname}>
                                {item.ITEMNAME || item.itemname || '—'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-slate-600">
                              <div className="whitespace-normal line-clamp-2 min-w-[100px] max-w-[150px] mx-auto" title={item.STRENGTH1 || item.strength1}>
                                {item.STRENGTH1 || item.strength1 || '—'}
                              </div>
                            </td>
                             <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{item.ITEMTYPENAME || item.itemtypename || '—'}</td>
                            <td className="px-4 py-3 text-center text-xs text-slate-600">{item.UNIT || item.unit || '—'}</td>
                              <td className="px-4 py-3 text-center text-xs text-slate-600">{item.FACILITYSTOCK || item.facilitystock || 0}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${(item.READYQTY || item.readyqty || 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                {item.READYQTY || item.readyqty || 0}
                              </span>
                            </td>
                          
                            <td className="px-4 py-3 text-center text-xs text-slate-600">{item.IWHPIPQTY || item.iwhpipqty || 0}</td>
                            {isWarehouse && <td className="px-4 py-3 text-center text-xs text-slate-600">{item.NEAREXPQTY3MONTH || item.nearexpqty3month || 0}</td>}
                            <td className="px-4 py-3 text-center text-xs text-slate-600">{item.UQQTY || item.uqqty || 0}</td>
                              <td className="px-4 py-3 text-center text-xs text-slate-600">{item.RECEIPTDATEWH || item.receiptdatewh || '—'}</td>
                             <td className="px-4 py-3 text-center text-xs text-slate-600">{item.QCPASSEDDT || item.qcpasseddt || '—'}</td>
                             <td className="px-4 py-3 text-center text-xs text-slate-600">{item.PIPELINEQTY || item.pipelineqty || 0}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{item.GROUPNAME || item.groupname || '—'}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(item.EDLTYPE || item.edltype) ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                {item.EDLTYPE || item.edltype || 'Non EDL'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">{item.CGMSCFM || item.cgmscfm || '—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{item.EDL || item.edl || 'Non EDL'}</td>
                          </tr>
                        ))}
                        {filteredData.length === 0 && (
                          <tr>
                            <td colSpan="10" className="px-5 py-14 text-center text-slate-400">
                              <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No stock data found</p>
                              <p className="text-xs mt-1">Try adjusting the filters above.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}



            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
