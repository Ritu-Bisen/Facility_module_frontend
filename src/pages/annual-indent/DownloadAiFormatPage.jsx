import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import {
  DocumentArrowDownIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  FunnelIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function DownloadAiFormatPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [itemsData, setItemsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showPreview, setShowPreview] = useState(true);

  // Fetch preview data on load
  useEffect(() => {
    fetchFormatData();
  }, []);

  const fetchFormatData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/annual-indent/download-format');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItemsData(res.data.data);
      } else {
        setItemsData([]);
      }
    } catch (err) {
      console.error('Failed to load format data:', err);
      setError('Failed to fetch format data from server');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set();
    itemsData.forEach(item => {
      if (item.categoryName) set.add(item.categoryName);
    });
    return Array.from(set).sort();
  }, [itemsData]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return itemsData.filter(item => {
      const matchesSearch =
        !searchQuery.trim() ||
        (item.itemCode && item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.itemName && item.itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.formulation && item.formulation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.groupName && item.groupName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || item.categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [itemsData, searchQuery, selectedCategory]);

  const handleDownloadExcel = async () => {
    setDownloading(true);
    setError('');
    try {
      let exportRows = itemsData;
      if (exportRows.length === 0) {
        const res = await axios.get('/annual-indent/download-format');
        if (res.data?.success && Array.isArray(res.data.data)) {
          exportRows = res.data.data;
        }
      }

      if (exportRows.length > 0) {
        const facId = user?.facilityId || '22595';

        // Prepare XLSX worksheet data matching live website structure (Image 3)
        const worksheetData = exportRows.map((row, index) => ({
          'SLNO': index + 1,
          'ITEMCODE': row.itemCode || '',
          'ITEMNAME': row.itemName || '',
          'FORMULATION': row.formulation || '',
          'STRENGTH': row.strength || '',
          'GROUPNAME': row.groupName || '',
          'EDL': row.edl || '',
          'COSUMPTION': row.cosumption || 0,
          'CURRENT_STOCK': row.currentStock || 0,
          'INDENT_26_27': row.indent2627 || 0,
          'RATE': Number(row.rate || 0),
          'PACKAGINGUNIT': row.packagingUnit || 1
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AnnualIndentFormat');

        // Auto-fit column widths
        const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `ItemIndent${facId}.xls`);
      } else {
        setError('No data found for Annual Indent format download');
      }
    } catch (err) {
      console.error('Failed to download Annual Indent format:', err);
      setError('Failed to download Annual Indent format from server');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-4 space-y-3">
            <div className="max-w-7xl mx-auto space-y-3">

              {/* Compact Header Bar with Download Action */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-xl shadow-md px-4 py-3 text-white border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-700/50 border border-emerald-500/30 shrink-0">
                    <DocumentArrowDownIcon className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <h1 className="text-sm md:text-base font-extrabold tracking-tight text-white">
                      Download Annual Indent Format in Excel File for Offline Preparation
                    </h1>
                    <p className="text-[11px] text-emerald-200/80 font-medium">
                      Facility ID: <span className="font-bold text-emerald-300">{user?.facilityId || '22595'}</span> | Annual Indent FY 2026-27 Template
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <TableCellsIcon className="w-4 h-4 text-emerald-400" />
                    <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                  </button>

                  <button
                    onClick={handleDownloadExcel}
                    disabled={downloading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span>Generating Excel...</span>
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

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                </div>
              )}

              {/* Red Hindi Alert Banner */}
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2.5 shadow-sm">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <span className="leading-snug">
                  नोट : Drugs एवं Consumables के Consumption , Current Stock व Annual Indent FY 2026-27 में संख्या टेबलेट/केप्सूल/वायल/एमपुल/सिरप/बाटल में प्रतिनग के अनुसार भरेंगे |
                </span>
              </div>

              {/* Top Section: Instructions & Technical Contact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                
                {/* Left 2 Columns: Instructions List */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                      <InformationCircleIcon className="w-4.5 h-4.5 text-emerald-600" />
                      <span>Instruction for Upload And Forward Annual Indent Excel File</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guidelines</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-blue-900 dark:text-blue-300 leading-relaxed">
                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-blue-100/70 dark:border-slate-700/60 hover:bg-blue-50 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">1</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र Download Excel Button को क्लिक कर Annual Indent Excel File को Save as 'Excel 97-2003 Workbook' Format में करेंगे |</p>
                    </div>

                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-blue-100/70 dark:border-slate-700/60 hover:bg-blue-50 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">2</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र को EDL/Non EDL के कोड वार ही Drugs & Consumables की लिस्ट प्राप्त होगी |</p>
                    </div>

                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-blue-100/70 dark:border-slate-700/60 hover:bg-blue-50 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">3</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र की Generated Excel File अलग होगी अतः प्रत्येक स्वास्थ्य केंद्र अपने लॉग इन में जाकर ही फाइल Generate करें |</p>
                    </div>

                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-blue-100/70 dark:border-slate-700/60 hover:bg-blue-50 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">4</span>
                      <p>Generated Excel File में स्वास्थ्य केंद्र किसी भी प्रकार की परिवर्तन नहीं करेंगे, File के नाम व Excel Sheet को भी परिवर्तित नही करना है |</p>
                    </div>

                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-blue-200 dark:border-slate-700 hover:bg-blue-50 transition-colors bg-blue-50/80">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">5</span>
                      <p className="font-bold text-blue-950 dark:text-blue-200">
                        प्रत्येक स्वास्थ्य केंद्र केवल Excel File में कॉलम नंबर 8 (ISSUED_FROM_WH_01_APR_25_TO_31ST_OCT_25) ,कॉलम नंबर 9 (ACTUAL_CONSUMPTION_FROM_01_APRIL_25_TO_31ST_OCT_25) ,कॉलम नंबर 10 (ESTIMATED_CONSUMPTION_FOR_ONE_YEAR_FROM_01_APRIL_25_TO_31ST_MARCH_26) ,कॉलम नंबर 11 (CURRENT_STOCK) एवं कॉलम नंबर 12 (ANNUAL_INDENT_26_27) में ही भरेंगे |
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-blue-100/70 dark:border-slate-700/60 hover:bg-blue-50 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">6</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र File Upload करने के पश्चात सभी Data को चेक करेंगे ,उसी के पश्चात Freez Button में क्लिक करेंगे |</p>
                    </div>

                    <div className="flex gap-2.5 items-start bg-blue-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-blue-100/70 dark:border-slate-700/60 hover:bg-blue-50 transition-colors">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 mt-0.5">7</span>
                      <p>किसी प्रकार की सहायता के लिए नीचे दिए गए संपर्क विवरण पर संपर्क करें |</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Contact Info Card */}
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-xs pb-1.5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Contact Details</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold lowercase">support</span>
                    </h3>

                    <div className="space-y-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">Mukesh Kumar Kaushik</p>
                          <p className="text-slate-500 text-[10px]">Programmer</p>
                        </div>
                        <a href="tel:9039193621" className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1 transition-colors">
                          <PhoneIcon className="w-3 h-3" />
                          9039193621
                        </a>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">Ram Sir</p>
                          <p className="text-slate-500 text-[10px]">Assistant System Manager</p>
                        </div>
                        <a href="tel:9752312141" className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1 transition-colors">
                          <PhoneIcon className="w-3 h-3" />
                          9752312141
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-center space-y-1">
                    <p className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 tracking-wider">Email Assistance</p>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1.5">
                      <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                      <a href="mailto:dhsannualindent@gmail.com" className="underline hover:text-blue-900 transition-colors">
                        dhsannualindent@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

              </div>

              {/* Data Preview & Search Section */}
              {showPreview && (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  
                  {/* Controls & Filter Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <TableCellsIcon className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Format Items Preview ({filteredItems.length} of {itemsData.length} Items)
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Search Bar */}
                      <div className="relative flex-1 sm:w-64">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search item code, name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Category Filter */}
                      {categories.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FunnelIcon className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="ALL">All Categories</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table View */}
                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-2">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Loading Annual Indent Format Data...</span>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      No items matched your search criteria.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 max-h-[450px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-slate-800 text-white font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-2 border-b border-slate-700 text-center w-10">SlNo</th>
                            <th className="p-2 border-b border-slate-700">ITEMCODE</th>
                            <th className="p-2 border-b border-slate-700 min-w-[200px]">ITEMNAME</th>
                            <th className="p-2 border-b border-slate-700">FORMULATION</th>
                            <th className="p-2 border-b border-slate-700">STRENGTH</th>
                            <th className="p-2 border-b border-slate-700">GROUPNAME</th>
                            <th className="p-2 border-b border-slate-700 text-center">EDL</th>
                            <th className="p-2 border-b border-slate-700 text-right">WH_ISSUE</th>
                            <th className="p-2 border-b border-slate-700 text-right">ACTUAL_CONS</th>
                            <th className="p-2 border-b border-slate-700 text-right">EST_CONS</th>
                            <th className="p-2 border-b border-slate-700 text-right">CUR_STOCK</th>
                            <th className="p-2 border-b border-slate-700 text-right">INDENT_26_27</th>
                            <th className="p-2 border-b border-slate-700 text-right">RATE</th>
                            <th className="p-2 border-b border-slate-700">CATEGORY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                          {filteredItems.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                              <td className="p-2 text-center text-slate-500 font-bold">{idx + 1}</td>
                              <td className="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">{row.itemCode}</td>
                              <td className="p-2 font-semibold">{row.itemName}</td>
                              <td className="p-2 text-slate-600 dark:text-slate-400">{row.formulation}</td>
                              <td className="p-2 text-slate-600 dark:text-slate-400">{row.strength}</td>
                              <td className="p-2 text-slate-600 dark:text-slate-400">{row.groupName}</td>
                              <td className="p-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.edl === 'Y' || row.edl === 'Yes' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                  {row.edl}
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono">{row.issuedFromWh || 0}</td>
                              <td className="p-2 text-right font-mono text-slate-400">{row.actualConsumption || 0}</td>
                              <td className="p-2 text-right font-mono text-slate-400">{row.estimatedConsumption || 0}</td>
                              <td className="p-2 text-right font-mono font-bold text-blue-700 dark:text-blue-400">{row.currentStock || 0}</td>
                              <td className="p-2 text-right font-mono text-slate-400">{row.annualIndent2627 || 0}</td>
                              <td className="p-2 text-right font-mono text-emerald-700 dark:text-emerald-400">₹{Number(row.rate || 0).toFixed(2)}</td>
                              <td className="p-2 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">{row.categoryName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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

