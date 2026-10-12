import React, { useState, useEffect, useMemo } from 'react';
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
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function UploadForwardIndentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard: Only allow HOD ID 2 (DME) or 3 (AYUSH)
  const rawHodId = localStorage.getItem('hodId') || localStorage.getItem('hodid') || user?.hodId || user?.hodid;
  const currentHodId = rawHodId !== null && rawHodId !== undefined && rawHodId !== '' ? Number(rawHodId) : null;
  const isAuthorized = currentHodId === 2 || currentHodId === 3;

  useEffect(() => {
    if (user && !isAuthorized) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAuthorized, navigate]);

  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('547');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [statusFilter, setStatusFilter] = useState('All');

  const [indentList, setIndentList] = useState([]);
  const [canAdd, setCanAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloadingCategory, setDownloadingCategory] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Fetch Financial Years & Categories on Mount
  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const [fyRes, catRes] = await Promise.all([
          axios.get('/annual-indent/upload-forward/fin-years'),
          axios.get('/annual-indent/categories')
        ]);

        if (fyRes.data?.success && Array.isArray(fyRes.data.data)) {
          setFinYears(fyRes.data.data);
          if (fyRes.data.data.length > 0) {
            const currentFy = fyRes.data.data.find(fy => fy.isCurrent);
            const defaultId = currentFy ? currentFy.accYrSetId : fyRes.data.data[0].accYrSetId;
            setSelectedFinYear(String(defaultId));
          }
        }

        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load initial dropdowns:', err);
        setError('Failed to load initial page parameters');
      } finally {
        setDropdownLoading(false);
      }
    }

    loadDropdowns();
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
        setCanAdd(res.data.canAdd !== undefined ? res.data.canAdd : true);
      } else {
        setIndentList([]);
        setCanAdd(true);
      }
    } catch (err) {
      console.error('Failed to fetch Annual Indent list:', err);
      setError('Failed to fetch Annual Indent list');
      setIndentList([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Indent List based on Status Filter
  const filteredIndentList = indentList.filter(row => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'I') return row.status === 'Incomplete';
    if (statusFilter === 'C') return row.status === 'Completed' || row.status === 'NOC Approved' || row.status === 'Sent for Approval';
    return true;
  });

  // Check if facility type or role is DH (District Hospital)
  const isDhUser = useMemo(() => {
    const facTypeCode = (user?.facilityTypeCode || localStorage.getItem('facilityTypeCode') || '').toUpperCase();
    const facTypeDesc = (user?.facilityTypeName || user?.facilityType || localStorage.getItem('facilityType') || '').toUpperCase();
    const facName = (user?.facilityName || '').toUpperCase();
    const role = (user?.roleName || user?.role || localStorage.getItem('roleName') || '').toUpperCase();

    return (
      facTypeCode === 'DH' ||
      facTypeCode.includes('DH') ||
      facTypeDesc.includes('DH') ||
      facTypeDesc.includes('DISTRICT HOSPITAL') ||
      facName.startsWith('DH ') ||
      facName.includes('DISTRICT HOSPITAL') ||
      role === 'DH' ||
      role.includes('DH')
    );
  }, [user]);

  // For DH: only show Add New Annual Indent button if in that year there is NO indent (indentList.length === 0)
  const showAddButton = isDhUser ? (indentList.length === 0) : canAdd;

  // Download Category Excel Format Handler (btnDownload_Click)
  const handleDownloadCategoryFormat = async () => {
    if (!selectedCategory || selectedCategory === '0') {
      setCategoryError('Type required');
      return;
    }
    setCategoryError('');
    setDownloadingCategory(true);

    try {
      const res = await axios.get('/annual-indent/ayush/download-format', {
        params: { 
          subCatId: selectedCategory,
          facilityId: user?.facilityId || '29609'
        }
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        if (rows.length === 0) {
          alert('No items found for selected category format.');
          return;
        }

        const catObj = categories.find(c => String(c.subcatId || c.categoryId) === String(selectedCategory));
        const catNameName = catObj ? catObj.categoryName.replace(/\s+/g, '_') : 'Category';

        let tableHtml = `
          <table border="1">
            <thead>
              <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
                <th>SlNo</th>
                <th>itemcode</th>
                <th>itemname</th>
                <th>Formulation</th>
                <th>Strength</th>
                <th>UNIT</th>
                <th>edl</th>
                <th>categoryname</th>
                <th>COSUMPTION_From_1APR_25</th>
                <th>CurStock</th>
                <th>INDENT_26_27</th>
                <th>Rates</th>
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
              <td style="text-align: center;">${r.unit || '-'}</td>
              <td style="text-align: center;">${r.edl || ''}</td>
              <td>${r.categoryName || ''}</td>
              <td style="text-align: right;">${r.cosumptionFrom1Apr25 || 0}</td>
              <td style="text-align: right;">${r.curStock || 0}</td>
              <td style="text-align: right;">${r.indent2627 || 0}</td>
              <td style="text-align: right;">${Number(r.rates || 0).toFixed(2)}</td>
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
        a.download = `AnnualIndentFormat_${catNameName}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate Excel file for category');
      }
    } catch (err) {
      console.error('Failed to download category indent Excel:', err);
      alert('Error downloading category indent Excel file');
    } finally {
      setDownloadingCategory(false);
    }
  };

  // Download Specific Indent File Handler
  const handleDownloadIndent = async (row) => {
    try {
      const res = await axios.get('/annual-indent/ayush/download-format', {
        params: {
          subCatId: row.aiCategoryId || row.categoryId || selectedCategory || 8,
          facilityId: user?.facilityId || '29609'
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;

        let tableHtml = `
          <table border="1">
            <thead>
              <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
                <th>SlNo</th>
                <th>itemcode</th>
                <th>itemname</th>
                <th>Formulation</th>
                <th>Strength</th>
                <th>UNIT</th>
                <th>edl</th>
                <th>categoryname</th>
                <th>COSUMPTION_From_1APR_25</th>
                <th>CurStock</th>
                <th>INDENT_26_27</th>
                <th>Rates</th>
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
              <td style="text-align: center;">${r.unit || '-'}</td>
              <td style="text-align: center;">${r.edl || ''}</td>
              <td>${r.categoryName || ''}</td>
              <td style="text-align: right;">${r.cosumptionFrom1Apr25 || 0}</td>
              <td style="text-align: right;">${r.curStock || 0}</td>
              <td style="text-align: right;">${r.indent2627 || 0}</td>
              <td style="text-align: right;">${Number(r.rates || 0).toFixed(2)}</td>
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
        a.download = `AnnualIndent_${(row.nocNumber || row.indentNo || 'AYUSH').replace(/\//g, '_')}.xls`;
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

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Title Header Banner (Navy Blue Theme matching Sidebar) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl shadow-lg p-5 text-white border border-blue-700/40 text-center">
                <div className="relative z-10 space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/40 text-blue-200 text-xs font-semibold uppercase tracking-widest border border-blue-500/30">
                    <DocumentArrowUpIcon className="w-4 h-4" />
                    <span>Annual Indent</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Ayush Upload and Forward Indent for Approval
                  </h1>
                </div>
              </div>

              {/* Filter Parameters Bar */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5 space-y-4">
                
                {/* Category Selection & Add New Annual Indent Button */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Category Selection & Download Excel Format */}
                  <div className="flex flex-wrap items-center gap-2 relative">
                    <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      Select Category For Download Excel Format:
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCategoryError('');
                      }}
                      disabled={dropdownLoading}
                      className={`px-3 py-2 rounded-xl border bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none shadow-sm ${
                        categoryError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <option value="0">-- Select Category --</option>
                      {categories.map(cat => (
                        <option key={cat.subcatId || cat.categoryId} value={cat.subcatId || cat.categoryId}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDownloadCategoryFormat}
                      disabled={downloadingCategory}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition-all inline-flex items-center gap-1.5 shrink-0"
                    >
                      {downloadingCategory ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )}
                      <span>Download</span>
                    </button>
                    {categoryError && (
                      <span className="absolute -bottom-5 left-0 text-red-500 text-[11px] font-bold">
                        {categoryError}
                      </span>
                    )}
                  </div>

                  {/* Add New Annual Indent Button */}
                  <div className="flex items-center">
                    {showAddButton && (
                      <Link 
                        to={`/annual-indent/create?finYearId=${selectedFinYear}`}
                        className="inline-flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-blue-200 dark:border-slate-700 shadow-sm group shrink-0"
                        title="Add new Anualindent"
                      >
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 whitespace-nowrap">
                          Add New Annual Indent:
                        </span>
                        <div className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow transition-all duration-200 group-hover:scale-110 shrink-0">
                          <PlusIcon className="w-4 h-4 font-bold" />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Financial Year & Filter Status Side-by-Side */}
                <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Financial Year Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      Financial Year:
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={dropdownLoading}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none shadow-sm"
                    >
                      {finYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter Menu (Placed right beside Financial Year) */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      Filter Status:
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all outline-none shadow-sm"
                    >
                      <option value="All">All</option>
                      <option value="I">Incomplete</option>
                      <option value="C">Completed</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Data Table GridView */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                    <TableCellsIcon className="w-4 h-4 text-blue-600" />
                    <span>Annual Indent List</span>
                  </h3>
                  {filteredIndentList.length > 0 && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold">
                      {filteredIndentList.length} Record(s)
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white font-bold text-center border-b border-blue-800">
                        <th className="py-3 px-4 border-r border-blue-800 w-16 text-center">Sl. No.</th>
                        <th className="py-3 px-4 border-r border-blue-800 text-center">Indent No.</th>
                        <th className="py-3 px-4 border-r border-blue-800 text-center">Indent Date</th>
                        <th className="py-3 px-4 border-r border-blue-800 text-center">Annual Indent Type</th>
                        <th className="py-3 px-4 border-r border-blue-800 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Download Anual Indent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-7 h-7 animate-spin text-blue-600" />
                              <span className="text-xs font-semibold">Loading Annual Indent list...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredIndentList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                            No Item found
                          </td>
                        </tr>
                      ) : (
                        filteredIndentList.map((row, index) => (
                          <tr
                            key={row.nocId || index}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors bg-white dark:bg-[#1e293b]"
                          >
                            <td className="py-3 px-4 text-center font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                              {row.nocNumber}
                            </td>
                            <td className="py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800 font-medium">
                              {row.nocDate}
                            </td>
                            <td className="py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800 font-semibold text-blue-700 dark:text-blue-400">
                              {row.categoryName || 'General'}
                            </td>
                            <td className={`py-3 px-4 text-center border-r border-slate-100 dark:border-slate-800 font-extrabold ${
                              row.status === 'Incomplete' 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {row.status}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {row.status !== 'Incomplete' ? (
                                <button
                                  onClick={() => handleDownloadIndent(row)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-400 font-bold rounded-lg transition-all text-xs border border-blue-200 dark:border-slate-700 shadow-sm"
                                >
                                  <ArrowDownTrayIcon className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Download</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">-</span>
                              )}
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
    </div>
  );
}
