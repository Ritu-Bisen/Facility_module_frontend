import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import {
  DocumentArrowDownIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function DownloadAiFormatPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadExcel = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await axios.get('/annual-indent/download-format');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        const facId = user?.facilityId || '22595';

        let tableHtml = `
          <table border="1">
            <thead>
              <tr style="background-color: #166534; color: #ffffff; font-weight: bold;">
                <th>SlNo</th>
                <th>ITEMCODE</th>
                <th>ITEMNAME</th>
                <th>FORMULATION</th>
                <th>STRENGTH</th>
                <th>GROUPNAME</th>
                <th>EDL</th>
                <th>ISSUED_FROM_WH_01_APR_25_TO_31ST_OCT_25</th>
                <th>ACTUAL_CONSUMPTION_FROM_01_APRIL_25_TO_31ST_OCT_25</th>
                <th>ESTIMATED_CONSUMPTION_FOR_ONE_YEAR_FROM_01_APRIL_25_TO_31ST_MARCH_26</th>
                <th>CURRENT_STOCK</th>
                <th>ANNUAL_INDENT_26_27</th>
                <th>RATE</th>
                <th>CATEGORYNAME</th>
              </tr>
            </thead>
            <tbody>
        `;

        rows.forEach((row, index) => {
          tableHtml += `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td>${row.itemCode || ''}</td>
              <td>${row.itemName || ''}</td>
              <td>${row.formulation || ''}</td>
              <td>${row.strength || ''}</td>
              <td>${row.groupName || ''}</td>
              <td style="text-align: center;">${row.edl || ''}</td>
              <td style="text-align: right;">${row.issuedFromWh || 0}</td>
              <td style="text-align: right;">${row.actualConsumption || 0}</td>
              <td style="text-align: right;">${row.estimatedConsumption || 0}</td>
              <td style="text-align: right;">${row.currentStock || 0}</td>
              <td style="text-align: right;">${row.annualIndent2627 || 0}</td>
              <td style="text-align: right;">${Number(row.rate || 0).toFixed(2)}</td>
              <td>${row.categoryName || ''}</td>
            </tr>
          `;
        });

        tableHtml += `
            </tbody>
          </table>
        `;

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ItemIndent${facId}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError('No data found for Annual Indent template download');
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
            <div className="max-w-6xl mx-auto space-y-3">

              {/* Compact Header Bar with Download Action */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-xl shadow-sm px-4 py-3 text-white border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <DocumentArrowDownIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h1 className="text-sm md:text-base font-extrabold tracking-tight text-white">
                    Download Annual Indent Format in Excel File for Offline Preparation
                  </h1>
                </div>

                <button
                  onClick={handleDownloadExcel}
                  disabled={downloading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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

              {/* Compact Red Hindi Alert Banner */}
              <div className="px-3.5 py-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>
                  नोट : Drugs एवं Consumables के Consumption , Current Stock व Annual Indent FY 2026-27 में संख्या टेबलेट/केप्सूल/वायल/एमपुल/सिरप/बाटल में प्रतिनग के अनुसार भरेंगे |
                </span>
              </div>

              {/* Grid 2-Column Compressed Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                
                {/* Left 2 Columns: Instructions List */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                    <InformationCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Instructions for Upload & Forward Annual Indent Excel File</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-blue-900 dark:text-blue-300 leading-tight">
                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">1</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र Download Excel Button को क्लिक कर Annual Indent Excel File को Save as 'Excel 97-2003 Workbook' Format में करेंगे |</p>
                    </div>

                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">2</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र को EDL/Non EDL के कोड वार ही Drugs & Consumables की लिस्ट प्राप्त होगी |</p>
                    </div>

                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">3</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र की Generated Excel File अलग होगी अतः प्रत्येक स्वास्थ्य केंद्र अपने लॉग इन में जाकर ही फाइल Generate करें |</p>
                    </div>

                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">4</span>
                      <p>Generated Excel File में स्वास्थ्य केंद्र किसी भी प्रकार की परिवर्तन नहीं करेंगे, File के नाम व Excel Sheet को भी परिवर्तित नही करना है |</p>
                    </div>

                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">5</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र केवल Excel File में कॉलम 8 (WH Issue), कॉलम 9 (Actual Cons.), कॉलम 10 (Projected Cons.), कॉलम 11 (Current Stock) एवं कॉलम 12 (Annual Indent) में ही भरेंगे |</p>
                    </div>

                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">6</span>
                      <p>प्रत्येक स्वास्थ्य केंद्र File Upload करने के पश्चात सभी Data को चेक करेंगे ,उसी के पश्चात Freez Button में क्लिक करेंगे |</p>
                    </div>

                    <div className="flex gap-2 items-start bg-blue-50/40 dark:bg-slate-800/40 p-2 rounded-lg border border-blue-100/60 dark:border-slate-700/50">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0">7</span>
                      <p>किसी प्रकार की सहायता के लिए नीचे दिए गए संपर्क विवरण पर संपर्क करें |</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Contact Info Card */}
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-xs pb-1.5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                      Technical Support Details
                    </h3>

                    <div className="space-y-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                        <p className="font-bold text-slate-900 dark:text-slate-100">Mukesh Kumar Kaushik</p>
                        <p className="text-slate-500 text-[10px]">Programmer</p>
                        <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-bold">
                          <PhoneIcon className="w-3 h-3" />
                          9039193621
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                        <p className="font-bold text-slate-900 dark:text-slate-100">Ram Sir</p>
                        <p className="text-slate-500 text-[10px]">Assistant System Manager</p>
                        <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-bold">
                          <PhoneIcon className="w-3 h-3" />
                          9752312141
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-center">
                    <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1">
                      <EnvelopeIcon className="w-3.5 h-3.5" />
                      <a href="mailto:dhsannualindent@gmail.com" className="underline hover:text-blue-800">
                        dhsannualindent@gmail.com
                      </a>
                    </p>
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
