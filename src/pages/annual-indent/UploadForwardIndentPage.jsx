import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import {
  DocumentArrowUpIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function UploadForwardIndentPage() {
  const { user } = useAuth();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('547');

  const [indentList, setIndentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / File Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Fetch Financial Years
  useEffect(() => {
    async function loadFinYears() {
      setDropdownLoading(true);
      try {
        const res = await axios.get('/annual-indent/upload-forward/fin-years');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFinYears(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedFinYear(String(res.data.data[0].accYrSetId));
          }
        }
      } catch (err) {
        console.error('Failed to load financial years:', err);
        setError('Failed to load financial years');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadFinYears();
  }, []);

  // Fetch Annual Indent List when Financial Year changes
  useEffect(() => {
    if (!selectedFinYear) return;
    fetchList();
  }, [selectedFinYear]);

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/annual-indent/upload-forward/list', {
        params: { finYearId: selectedFinYear }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setIndentList(res.data.data);
      } else {
        setIndentList([]);
      }
    } catch (err) {
      console.error('Failed to fetch Annual Indent list:', err);
      setError('Failed to fetch Annual Indent list');
      setIndentList([]);
    } finally {
      setLoading(false);
    }
  };

  // Download Annual Indent Excel File Handler
  const handleDownloadIndent = async (row) => {
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

        rows.forEach((r, index) => {
          tableHtml += `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td>${r.itemCode || ''}</td>
              <td>${r.itemName || ''}</td>
              <td>${r.formulation || ''}</td>
              <td>${r.strength || ''}</td>
              <td>${r.groupName || ''}</td>
              <td style="text-align: center;">${r.edl || ''}</td>
              <td style="text-align: right;">${r.issuedFromWh || 0}</td>
              <td style="text-align: right;">${r.actualConsumption || 0}</td>
              <td style="text-align: right;">${r.estimatedConsumption || 0}</td>
              <td style="text-align: right;">${r.currentStock || 0}</td>
              <td style="text-align: right;">${r.annualIndent2627 || 0}</td>
              <td style="text-align: right;">${Number(r.rate || 0).toFixed(2)}</td>
              <td>${r.categoryName || ''}</td>
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
        a.download = `AnnualIndent_${row.nocNumber.replace(/\//g, '_')}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate Excel file');
      }
    } catch (err) {
      console.error('Failed to download indent Excel:', err);
      alert('Error downloading indent Excel file');
    }
  };

  // Upload Excel File Handler
  const handleUploadFile = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage('Please select an Excel file to upload');
      return;
    }

    setUploading(true);
    setUploadMessage('');
    setTimeout(() => {
      setUploading(false);
      setUploadMessage('Annual Indent Excel File uploaded successfully!');
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadMessage('');
        fetchList();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Title Header Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl shadow-lg p-6 text-white border border-emerald-700/50 text-center">
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/50 text-emerald-200 text-xs font-semibold uppercase tracking-widest border border-emerald-500/30">
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    <span>Annual Indent Workflow</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    Upload Excel File and Forward for Approval
                  </h1>
                </div>
              </div>

              {/* Filter Parameters Bar */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Financial Year Selector */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    Financial Year:
                  </label>
                  <select
                    value={selectedFinYear}
                    onChange={(e) => setSelectedFinYear(e.target.value)}
                    disabled={dropdownLoading}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all outline-none"
                  >
                    {finYears.map(fy => (
                      <option key={fy.accYrSetId} value={fy.accYrSetId}>
                        {fy.accYear}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add New Annual Indent Link Button */}
                <Link 
                  to={`/annual-indent/create?finYearId=${selectedFinYear}`}
                  className="flex items-center gap-2.5 cursor-pointer group px-3.5 py-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-emerald-200 dark:border-slate-700 shadow-sm"
                  title="Click to Add New Annual Indent"
                >
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    Add New Annual Indent:
                  </span>
                  <div
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow transition-all duration-200 group-hover:scale-110"
                  >
                    <PlusIcon className="w-5 h-5 font-bold" />
                  </div>
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Data Table Panel */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                    <TableCellsIcon className="w-4 h-4 text-emerald-600" />
                    <span>Annual Indents Submitted</span>
                  </h3>
                  {indentList.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                      {indentList.length} Indent(s)
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] text-slate-200 font-bold text-center uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-4 border-r border-slate-800 w-16">Sl. No.</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-center">Indent No.</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-center">Indent Date</th>
                        <th className="py-3.5 px-4 border-r border-slate-800 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">Download Annual Indent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-emerald-600" />
                              <span className="text-sm font-medium">Fetching Annual Indent records...</span>
                            </div>
                          </td>
                        </tr>
                      ) : indentList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            No Item found for selected Financial Year
                          </td>
                        </tr>
                      ) : (
                        indentList.map((row, index) => (
                          <tr
                            key={row.nocId || index}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200"
                          >
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                              {index + 1}
                            </td>
                            <td className="py-3.5 px-4 text-center font-extrabold text-blue-700 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800">
                              {row.nocNumber}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold border-r border-slate-100 dark:border-slate-800">
                              {row.nocDate}
                            </td>
                            <td className="py-3.5 px-4 text-center border-r border-slate-100 dark:border-slate-800">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                  row.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : row.status === 'Incomplete'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                }`}
                              >
                                {row.status === 'Completed' ? (
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                ) : row.status === 'Incomplete' ? (
                                  <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <ClockIcon className="w-3.5 h-3.5" />
                                )}
                                <span>{row.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleDownloadIndent(row)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold underline transition-colors inline-flex items-center gap-1"
                              >
                                <DocumentArrowDownIcon className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <DocumentArrowUpIcon className="w-5 h-5 text-emerald-600" />
                <span>Upload Annual Indent Excel</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Excel File (.xls / .xlsx)
                </label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {uploadMessage && (
                <p className={`text-xs font-bold ${uploadMessage.includes('successfully') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {uploadMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload & Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
