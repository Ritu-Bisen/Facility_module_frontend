import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSelector } from 'react-redux';
import { storeAPI } from '../features/store/storeAPI';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

const FacilityStockBatchWise = () => {
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [warehouseName, setWarehouseName] = useState('');

  // Filter states
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedExpDays, setSelectedExpDays] = useState('');
  const [selectedCgmsc, setSelectedCgmsc] = useState('');
  const [selectedEdl, setSelectedEdl] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('');
  const [selectedMassCategory, setSelectedMassCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!facilityId) return;
      try {
        setLoading(true);
        const result = await storeAPI.getFacilityStockDrugWise(facilityId);
        setData(result);
        if (result && result.length > 0) {
            setWarehouseName(result[0].WAREHOUSENAME || result[0].warehousename || 'N/A');
        }
        setDataLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch facility stock data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [facilityId]);

  // Derive unique options
  const uniqueDrugs = useMemo(() => {
    const map = new Map();
    data.forEach(item => {
      const code = item.UNIQUEITEMCODE || item.uniqueitemcode;
      const name = item.ITEMNAME || item.itemname;
      if (code && name && !map.has(code)) {
        map.set(code, `${code} - ${name}`);
      }
    });
    return Array.from(map.values());
  }, [data]);

  const uniqueExpDays = useMemo(() => [...new Set(data.map(item => item.EXPDAYSSTATUS || item.expdaysstatus).filter(Boolean))], [data]);
  const uniqueCgmsc = useMemo(() => {
    const vals = [...new Set(data.map(item => item.CGMSCFMFLAG || item.cgmscfmflag).filter(Boolean))];
    const hasNull = data.some(item => !(item.CGMSCFMFLAG || item.cgmscfmflag));
    if (hasNull) vals.push('Non FM');
    return vals;
  }, [data]);
  const uniqueEdl = useMemo(() => [...new Set(data.map(item => item.EDLTYPE2025 || item.edltype2025 || 'Non EDL'))], [data]);
  const uniqueGroup = useMemo(() => [...new Set(data.map(item => item.GROUPNAME || item.groupname).filter(Boolean))], [data]);
  const uniqueItemType = useMemo(() => [...new Set(data.map(item => item.ITEMTYPENAME || item.itemtypename).filter(Boolean))], [data]);
  const uniqueMassCategory = useMemo(() => [...new Set(data.map(item => item.MCATEGORY || item.mcategory).filter(Boolean))], [data]);

  // Apply filters
  useEffect(() => {
    let filtered = data;
    
    if (selectedDrug) {
      filtered = filtered.filter(item => {
        const code = item.UNIQUEITEMCODE || item.uniqueitemcode;
        const name = item.ITEMNAME || item.itemname;
        return `${code} - ${name}` === selectedDrug;
      });
    }
    
    if (selectedExpDays) {
      filtered = filtered.filter(item => (item.EXPDAYSSTATUS || item.expdaysstatus) === selectedExpDays);
    }
    
    if (selectedCgmsc) {
      if (selectedCgmsc === 'Non FM') {
        filtered = filtered.filter(item => !(item.CGMSCFMFLAG || item.cgmscfmflag));
      } else {
        filtered = filtered.filter(item => (item.CGMSCFMFLAG || item.cgmscfmflag) === selectedCgmsc);
      }
    }
    
    if (selectedEdl) {
      filtered = filtered.filter(item => {
        const edlVal = item.EDLTYPE2025 || item.edltype2025 || 'Non EDL';
        return edlVal === selectedEdl;
      });
    }
    
    if (selectedGroup) {
      filtered = filtered.filter(item => (item.GROUPNAME || item.groupname) === selectedGroup);
    }

    if (selectedItemType) {
      filtered = filtered.filter(item => (item.ITEMTYPENAME || item.itemtypename) === selectedItemType);
    }
    
    if (selectedMassCategory) {
      filtered = filtered.filter(item => (item.MCATEGORY || item.mcategory) === selectedMassCategory);
    }

    setFilteredData(filtered);
  }, [data, selectedDrug, selectedExpDays, selectedCgmsc, selectedEdl, selectedGroup, selectedItemType, selectedMassCategory]);

  const getFormattedData = () => {
    return filteredData.map((row, index) => ({
      'Sl. No': index + 1,
      'Item Name': row.ITEMNAME || row.itemname || '—',
      'Item Code': row.UNIQUEITEMCODE || row.uniqueitemcode || '—',
      'Batch No': row.BATCHNO || row.batchno || '—',
      'Strength': row.STRENGTH1 || row.strength1 || '—',
      'Item Type': row.ITEMTYPENAME || row.itemtypename || '—',
      'Unit': row.UNIT || row.unit || '—',
      'Exp Date': row.EXPDATEDDMMYY || row.expdateddmmyy || '—',
      'Exp Status': row.EXPDAYSSTATUS || row.expdaysstatus || '—',
      'Batch Stock': row.BATCHSTOCK || row.batchstock || '0',
      'Location': row.LOCATIONNO || row.locationno || '—'
    }));
  };

  const exportToExcel = () => {
    const exportData = getFormattedData();
    if (exportData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, "Facility_Stock.xlsx");
  };

  const exportToPDF = () => {
    const exportData = getFormattedData();
    if (exportData.length === 0) return;

    const doc = new jsPDF('landscape');
    doc.text(`Current Stock in Facility ${warehouseName}`, 14, 15);
    
    const headers = Object.keys(exportData[0]);
    const rows = exportData.map(obj => Object.values(obj));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save('Facility_Stock.pdf');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
    <div className="max-w-full mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
            Facility Stock - Batch Wise
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">View current stock levels grouped by batch (batch-wise total)</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {!loading && dataLoaded && (
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <svg className="animate-spin w-8 h-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-xs font-semibold text-slate-400">Loading stock data…</p>
        </div>
      )}

      {!loading && dataLoaded && (
        <>
          {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Mass Category</label>
          <div className="relative">
            <select
              value={selectedMassCategory}
              onChange={(e) => setSelectedMassCategory(e.target.value)}
              className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
            >
              <option value="">All</option>
              {uniqueMassCategory.map((val, i) => <option key={i} value={val}>{val}</option>)}
            </select>
            {selectedMassCategory && (
              <button onClick={() => setSelectedMassCategory('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
            )}
          </div>
        </div>

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
              list="drug-list"
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              placeholder="All Drugs"
              className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {selectedDrug && (
              <button onClick={() => setSelectedDrug('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>

            )}
          </div>
          <datalist id="drug-list">
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

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Near Expiry Days</label>
          <div className="relative">
            <select
              value={selectedExpDays}
              onChange={(e) => setSelectedExpDays(e.target.value)}
              className="w-full h-9 px-3 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
            >
              <option value="">All</option>
              {uniqueExpDays.map((val, i) => <option key={i} value={val}>{val}</option>)}
            </select>
            {selectedExpDays && (
              <button onClick={() => setSelectedExpDays('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg font-bold leading-none" title="Clear">&times;</button>
            )}
          </div>
        </div>

     

     

       
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3 text-center w-10">S.No</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 min-w-[250px] whitespace-normal">Item</th>
                  <th className="px-4 py-3 text-center min-w-[150px] whitespace-normal">Strength</th>
                  <th className="px-4 py-3 text-center">Dosage Form</th>
                  <th className="px-4 py-3 text-center">Packing</th>
                  <th className="px-4 py-3 text-center">Stock(in nos)</th>
                  <th className="px-4 py-3">Batch No</th>
                  <th className="px-4 py-3">Exp Date</th>
                  <th className="px-4 py-3">MFG Date</th>
                  <th className="px-4 py-3">Rack Location</th>
                  <th className="px-4 py-3">Exp Status</th>
                  <th className="px-4 py-3">Therapeutic Group</th>
                  <th className="px-4 py-3">EDL Type</th>
                  <th className="px-4 py-3">Fast Moving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/60 align-middle">
                    <td className="px-4 py-3 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{row.UNIQUEITEMCODE || row.uniqueitemcode || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs min-w-[250px] whitespace-normal break-words">{row.ITEMNAME || row.itemname || '—'}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600 min-w-[150px] whitespace-normal break-words">{row.STRENGTH1 || row.strength1 || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{row.ITEMTYPENAME || row.itemtypename || '—'}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">{row.UNIT || row.unit || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${(row.BATCHSTOCK || row.batchstock || 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {row.BATCHSTOCK || row.batchstock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{row.BATCHNO || row.batchno || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.EXPDATEDDMMYY || row.expdateddmmyy || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.MFGDATEDDMMYY || row.mfgdateddmmyy || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.LOCATIONNO || row.locationno || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.EXPDAYSSTATUS || row.expdaysstatus || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.GROUPNAME || row.groupname || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(row.EDLTYPE2025 || row.edltype2025) ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {row.EDLTYPE2025 || row.edltype2025 || 'Non EDL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.CGMSCFMFLAG || row.cgmscfmflag || 'Non FM Item'}</td>
                  </tr>
                ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="14" className="px-6 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-sm font-medium">No records found</span>
                    <span className="text-xs text-slate-400 mt-1">Try adjusting your filters</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      </>
      )}
          </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default FacilityStockBatchWise;
