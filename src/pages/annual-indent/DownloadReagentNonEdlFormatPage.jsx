import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import { getDynamicIndentHeaders } from '../../utils/indentYearHelper';
import {
  DocumentArrowDownIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function DownloadReagentNonEdlFormatPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [itemsData, setItemsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { currYr, nextYr1, nextYr2, consumptionHeader, indentHeader, futureYearRange, futureFullYearRange } = getDynamicIndentHeaders();

  // Fetch format data on component mount
  useEffect(() => {
    fetchFormatData();
  }, []);

  const fetchFormatData = async () => {
    setLoading(true);
    setError('');
    try {
      const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
      const facTypeId = localStorage.getItem('facilityTypeId') || localStorage.getItem('facilitytypeid') || user?.facilityTypeId || user?.facilitytypeid;
      const res = await axios.get('/annual-indent/reagent-non-edl/download-format', {
        params: { facilityId: facId, facilityTypeId: facTypeId || undefined }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItemsData(res.data.data);
      } else {
        setItemsData([]);
      }
    } catch (err) {
      console.error('Failed to load Reagent/Non-EDL format data:', err);
      setError('Failed to fetch Reagent/Non-EDL format data from server');
    } finally {
      setLoading(false);
    }
  };

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    return itemsData.filter(item => {
      const matchesSearch =
        !searchQuery.trim() ||
        (item.itemCode && item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.itemName && item.itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.formulation && item.formulation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.strength && item.strength.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [itemsData, searchQuery]);

  const handleDownloadExcel = async () => {
    setDownloading(true);
    setError('');
    try {
      let exportRows = itemsData;
      if (exportRows.length === 0) {
        const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
        const facTypeId = localStorage.getItem('facilityTypeId') || localStorage.getItem('facilitytypeid') || user?.facilityTypeId || user?.facilitytypeid;
        const res = await axios.get('/annual-indent/reagent-non-edl/download-format', {
          params: { facilityId: facId, facilityTypeId: facTypeId || undefined }
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          exportRows = res.data.data;
        }
      }

      if (exportRows.length > 0) {
        const facId = localStorage.getItem('facilityId') || user?.facilityId || '22595';
        const headerCons = exportRows[0]?.consumptionHeader || consumptionHeader;
        const headerInd = exportRows[0]?.indentHeader || indentHeader;

        // Prepare XLSX worksheet data with dynamic headers matching current year and future year:
        // SlNo, itemcode, itemname, Formulation, Strength, [headerCons], Current_Stock, [headerInd], Rate
        const worksheetData = exportRows.map((row, index) => ({
          'SlNo': index + 1,
          'itemcode': row.itemCode || '',
          'itemname': row.itemName || '',
          'Formulation': row.formulation || '',
          'Strength': row.strength || '',
          [headerCons]: Number(row.consumptionFrom1Apr !== undefined ? row.consumptionFrom1Apr : (row.consumptionFrom1Apr25 !== undefined ? row.consumptionFrom1Apr25 : 0)),
          'Current_Stock': Number(row.currentStock !== undefined ? row.currentStock : 0),
          [headerInd]: Number(row.nonEdlIndent !== undefined ? row.nonEdlIndent : (row.nonEdlIndent2627 !== undefined ? row.nonEdlIndent2627 : 0)),
          'Rate': Number(row.rate !== undefined ? row.rate : 0)
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ReagentNonEDLFormat');

        // Auto-fit column widths
        const colWidths = [
          { wch: 8 },  // SlNo
          { wch: 14 }, // itemcode
          { wch: 45 }, // itemname
          { wch: 20 }, // Formulation
          { wch: 25 }, // Strength
          { wch: 28 }, // COSUMPTION_From_1APR_XX
          { wch: 16 }, // Current_Stock
          { wch: 26 }, // Non_EDL_INDENT_XX_YY
          { wch: 12 }  // Rate
        ];
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `NonEDL_Reagent_Kits_Consumables_${facId}.xls`);
      } else {
        setError('No data found for Reagent/Non-EDL format download');
      }
    } catch (err) {
      console.error('Failed to download Reagent/Non-EDL format:', err);
      setError('Failed to download Reagent/Non-EDL format from server');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col justify-start gap-3">
            <div className="max-w-6xl w-full mx-auto flex flex-col gap-3">

              {/* Blue Header Bar (Banner matching Image 2 with Sidebar Blue color) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a6a] via-[#1e293b] to-[#0f172a] rounded-xl shadow-md px-5 py-3.5 md:py-4 text-white border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30 shrink-0 shadow-inner hidden sm:flex">
                    <DocumentArrowDownIcon className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white drop-shadow-xs">
                      Download Annual Indent Format in Excel File for Offline Preparation (Non EDL Consumables, KIT & Reagent)
                    </h1>
                    <p className="text-xs text-blue-200/90 font-medium mt-0.5">
                      NON EDL Annual Indent FY 2026-27 | Facility ID: <span className="font-bold text-amber-300">{user?.facilityId || '22595'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all flex items-center gap-2 shadow-xs"
                    title="View item list preview"
                  >
                    <TableCellsIcon className="w-4 h-4 text-blue-400" />
                    <span>Preview Items</span>
                    {itemsData.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-600/40 text-[10px] text-blue-200 font-bold">
                        {itemsData.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadExcel}
                    disabled={downloading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Download Format</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert (if any) */}
              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold text-xs">✕</button>
                </div>
              )}

              {/* Centered Download Action Row (exact structure from Image 2) */}
              <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-center gap-3 shrink-0 text-center">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                  Download Annual Indent Format for Non EDL Consumables, KIT & Reagent
                </span>
                <button
                  onClick={handleDownloadExcel}
                  disabled={downloading}
                  className="px-5 py-1.5 bg-[#1e3a6a] hover:bg-[#152a4d] active:scale-95 text-white font-bold text-xs rounded-md shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </>
                  )}
                </button>
                {itemsData.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {itemsData.length} Items Ready
                  </span>
                )}
              </div>

              {/* Instructions and Contact Card (matching Image 2 layout with Sidebar Blue Color) */}
              <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col gap-3">
                
                {/* Generation Instruction Heading */}
                <div className="text-center pb-1">
                  <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-[#1e3a6a] dark:text-blue-400">
                    Generation Instruction for Upload,Forward Non Edl Annual Indent Excel File
                  </h2>
                </div>

                {/* Red Hindi Note Banner (Verbatim from Image 2) */}
                <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0 hidden sm:inline" />
                  <span>
                    नोट : Non EDL Reagent के Consumption ,Current Stock व Annual Indent {futureFullYearRange} में संख्या टेबलेट/केप्सूल/वायल/एमपुल/सिरप/बाटल में प्रतिनग के अनुसार भरेंगे |
                  </span>
                </div>

                {/* Numbered Steps 1 to 7 (exact Hindi instructions from Image 2) */}
                <div className="space-y-2 text-xs font-semibold text-[#1e3a6a] dark:text-blue-200 leading-relaxed max-w-4xl mx-auto w-full">
                  <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded border border-slate-200/80 dark:border-slate-700/60">
                    <span className="font-bold shrink-0">1)</span>
                    <p>प्रत्येक स्वास्थ्य केंद्र Download Excel Button को क्लिक कर Annual Indent Excel File को Save as 'Mircrosfot 97-2003' Format में करेंगे |</p>
                  </div>

                  <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded border border-slate-200/80 dark:border-slate-700/60">
                    <span className="font-bold shrink-0">2)</span>
                    <p>प्रत्येक स्वास्थ्य केंद्र को EDL के कोड वार ही Drugs & Consumables की लिस्ट प्राप्त होगी |</p>
                  </div>

                  <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded border border-slate-200/80 dark:border-slate-700/60">
                    <span className="font-bold shrink-0">3)</span>
                    <p>प्रत्येक स्वास्थ्य केंद्र की Generated Excel File अलग होगी अतः प्रत्येक स्वास्थ्य केंद्र अपने लॉग इन में जाकर ही फाइल Generate करें |</p>
                  </div>

                  <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded border border-slate-200/80 dark:border-slate-700/60">
                    <span className="font-bold shrink-0">4)</span>
                    <p>Generated Excel File में स्वास्थ्य केंद्र किसी भी प्रकार की परिवर्तन नहीं करेंगे, File के नाम व Excel Sheet को भी परिवर्तित नहीं करना है |</p>
                  </div>

                  <div className="flex gap-2 items-start bg-blue-50/70 dark:bg-blue-950/40 px-3 py-2 rounded border border-blue-200 dark:border-blue-900/60">
                    <span className="font-bold text-[#1e3a6a] dark:text-blue-300 shrink-0">5)</span>
                    <p className="text-blue-950 dark:text-blue-100 font-bold">
                      प्रत्येक स्वास्थ्य केंद्र केवल Excel File में कॉलम नंबर 6 ({consumptionHeader}) ,कॉलम नंबर 7 (CURRENT_STOCK) एवं कॉलम नंबर 8 ({indentHeader}) में ही भरेंगे |
                    </p>
                  </div>

                  <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded border border-slate-200/80 dark:border-slate-700/60">
                    <span className="font-bold shrink-0">6)</span>
                    <p>प्रत्येक स्वास्थ्य केंद्र File Upload करने के पश्चात सभी Data को चेक करेंगे ,उसी के पश्चात Freez Button में क्लिक करेंगे |</p>
                  </div>

                  <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded border border-slate-200/80 dark:border-slate-700/60">
                    <span className="font-bold shrink-0">7)</span>
                    <p>किसी प्रकार की सहायता के लिए संपर्क करे :-</p>
                  </div>
                </div>

                {/* Contact Details (exact block from Image 2) */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-center space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Contact Details
                  </h3>
                  <p className="text-xs font-semibold text-[#1e3a6a] dark:text-blue-300 flex flex-wrap items-center justify-center gap-1.5">
                    <PhoneIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 inline" />
                    <span>Mob :</span>
                    <a href="tel:9039193621" className="hover:underline">9039193621(Mr Mukesh Kaushik)</a>
                    <span>,</span>
                    <a href="tel:9770406881" className="hover:underline">9770406881( Mr Kaushal Singh Rajput)</a>
                    <span>,</span>
                    <a href="tel:7773006938" className="hover:underline">7773006938(Mr Ram Patel)</a>
                  </p>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1.5">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Email :</span>
                    <a href="mailto:it.cgmsc@gov.in" className="hover:underline font-bold">it.cgmsc@gov.in</a>
                  </p>
                </div>

              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Item Preview Modal (Clean, Non-intrusive, Opens only on user request) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#1e3a6a] text-white flex items-center justify-between border-b border-[#2563eb]/20 shrink-0">
              <div className="flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-blue-300" />
                <span className="text-sm font-bold">Reagent / Non-EDL Consumables & Kits Preview</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold border border-blue-400/30">
                  {filteredItems.length} Items {filteredItems.length !== itemsData.length && `(filtered from ${itemsData.length})`}
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label="Filter by category"
                    className="text-xs bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="ALL">All Categories ({itemsData.length})</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}

                <div className="relative flex-1 sm:w-64">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search code, name, formulation..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleDownloadExcel}
                disabled={downloading}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-md shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Excel...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="overflow-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Loading Reagent / Non-EDL format items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs font-semibold">
                  No items match your search or filter criteria.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#1e293b] text-slate-200 font-bold sticky top-0 z-10 shadow-sm border-b border-slate-700">
                    <tr>
                      <th className="py-2 px-3 text-center w-12">#</th>
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3">Formulation</th>
                      <th className="py-2 px-3">Strength</th>
                      <th className="py-2 px-3 text-center">Pkg Unit</th>
                      <th className="py-2 px-3 text-center">Category</th>
                      <th className="py-2 px-3 text-right">Current Stock</th>
                      <th className="py-2 px-3 text-right">Rate (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {filteredItems.slice(0, 150).map((row, idx) => (
                      <tr
                        key={row.itemCode || idx}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-1.5 px-3 text-center font-bold text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">{row.itemCode}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate" title={row.itemName}>
                          {row.itemName}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{row.formulation}</td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{row.strength}</td>
                        <td className="py-1.5 px-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">{row.packagingUnit}</td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            {row.categoryName}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {Number(row.currentStock || 0).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {Number(row.rate || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
              <span>Showing preview of top 150 items. Total available: {itemsData.length} items.</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
