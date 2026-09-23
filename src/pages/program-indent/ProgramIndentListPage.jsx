import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import api from '../../api/axios';
import { generateProgramIndentPDF } from '../../utils/programIndentPdfGenerator';
import {
  PlusIcon,
  FunnelIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function ProgramIndentListPage() {
  const navigate = useNavigate();
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  // Load Financial Years
  useEffect(() => {
    const fetchFinYears = async () => {
      try {
        const res = await api.get('/program-indent/fin-years');
        if (res.data && res.data.success) {
          const years = res.data.data || [];
          setFinYears(years);
          const current = years.find(y => y.isCurrent) || years[0];
          if (current) {
            setSelectedFinYear(String(current.accYrSetId));
          }
        }
      } catch (err) {
        console.error('Failed to load fin years:', err);
      }
    };
    fetchFinYears();
  }, []);

  // Load Indent List
  const fetchList = async () => {
    if (!selectedFinYear) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/program-indent/list?finYearId=${selectedFinYear}`);
      if (res.data && res.data.success) {
        setIndents(res.data.data || []);
      } else {
        setIndents([]);
      }
    } catch (err) {
      console.error('Failed to load program indents:', err);
      setError('Failed to load program indents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [selectedFinYear]);

  // Handle Delete
  const handleDelete = async (indentId, indentNo) => {
    if (!window.confirm(`Are you sure you want to delete Program Indent: ${indentNo}?`)) {
      return;
    }
    setDeletingId(indentId);
    try {
      const res = await api.delete(`/program-indent/header/${indentId}`);
      if (res.data && res.data.success) {
        fetchList();
      } else {
        alert(res.data?.message || 'Failed to delete indent');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting indent');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle PDF Download
  const handleDownloadPDF = async (item) => {
    setDownloadingId(item.indentId);
    try {
      const [headerRes, itemsRes] = await Promise.all([
        api.get(`/program-indent/header?indentId=${item.indentId}`),
        api.get(`/program-indent/items?indentId=${item.indentId}`)
      ]);

      const headerData = (headerRes.data && headerRes.data.success && headerRes.data.data) ? headerRes.data.data : item;
      const itemsData = (itemsRes.data && itemsRes.data.success && itemsRes.data.data) ? itemsRes.data.data : [];

      generateProgramIndentPDF({
        ...item,
        ...headerData
      }, itemsData);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF report.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered Indents by status
  const filteredIndents = indents.filter(item => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Incomplete') return item.status === 'Incomplete' || item.status === 'I';
    if (statusFilter === 'Completed') return item.status === 'Completed' || item.status === 'C';
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Page Title & Add Button Header */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Program Indent</h1>
                  <p className="text-blue-200 text-sm mt-1">Manage, create, and finalize AYUSH Program Indents</p>
                </div>
                <button
                  onClick={() => navigate('/program-indent/create')}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Indent</span>
                </button>
              </div>

              {/* Filters Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                    <FunnelIcon className="w-5 h-5 text-blue-800" />
                    <span>Filters:</span>
                  </div>

                  {/* Fin Year Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Financial Year:
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {finYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear} {fy.isCurrent}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status:
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Incomplete">Incomplete</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{filteredIndents.length}</span> record(s)
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Table / List View */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
                    <p className="text-sm font-medium">Loading Program Indents...</p>
                  </div>
                ) : filteredIndents.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <p className="text-base font-semibold text-gray-700">No Program Indents Found</p>
                    <p className="text-sm text-gray-500 mt-1">Click "Add Indent" above to create a new program indent.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                      <thead className="bg-blue-900 text-white font-semibold">
                        <tr>
                          <th className="px-4 py-3 text-center w-16">#</th>
                          <th className="px-4 py-3">Indent No</th>
                          <th className="px-4 py-3">Indent Date</th>
                          <th className="px-4 py-3">Program</th>
                          <th className="px-4 py-3">Fin Year</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center w-36">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredIndents.map((item, index) => {
                          const isIncomplete = item.status === 'Incomplete' || item.status === 'I';
                          const isCompleted = item.status === 'Completed' || item.status === 'C';

                          return (
                            <tr key={item.indentId} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                              <td className="px-4 py-3 font-semibold text-blue-900">{item.indentNo}</td>
                              <td className="px-4 py-3 text-gray-700">{item.indentDate}</td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{item.programName}</td>
                              <td className="px-4 py-3 text-gray-600">{item.accYear}</td>
                              <td className="px-4 py-3 text-center">
                                {isIncomplete ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                                    <ClockIcon className="w-3.5 h-3.5 text-red-600" />
                                    Incomplete
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                    Completed
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {isIncomplete ? (
                                    <>
                                      <button
                                        onClick={() => navigate(`/program-indent/edit/${item.indentId}`)}
                                        className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                                        title="Edit Indent"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.indentId, item.indentNo)}
                                        disabled={deletingId === item.indentId}
                                        className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                                        title="Delete Indent"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleDownloadPDF(item)}
                                      disabled={downloadingId === item.indentId}
                                      className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-md transition-colors flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 shadow-sm disabled:opacity-50"
                                      title="Download Indent PDF"
                                    >
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                      <span>{downloadingId === item.indentId ? 'Downloading...' : 'Download'}</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
