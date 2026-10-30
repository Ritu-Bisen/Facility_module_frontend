import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  PlusCircleIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function ExpiryVoucherListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [finYears, setFinYears] = useState([]);
  const [selectedAccYear, setSelectedAccYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFinYears();
  }, []);

  const fetchFinYears = async () => {
    try {
      const res = await api.get('/expiry-voucher/fin-years');
      if (res.data && res.data.success) {
        const years = res.data.data || [];
        setFinYears(years);
        const currentYear = years.find((y) => y.isCurrent);
        if (currentYear) {
          setSelectedAccYear(String(currentYear.accYrSetId));
          fetchList(currentYear.accYrSetId);
        } else if (years.length > 0) {
          setSelectedAccYear(String(years[0].accYrSetId));
          fetchList(years[0].accYrSetId);
        } else {
          fetchList('');
        }
      } else {
        fetchList('');
      }
    } catch (err) {
      console.error('Error fetching financial years:', err);
      fetchList('');
    }
  };

  const fetchList = async (accYearId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/expiry-voucher/list', {
        params: { accYearId: accYearId || '' }
      });
      if (response.data && response.data.success) {
        setData(response.data.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching expiry voucher list:', err);
      const msg = err.response?.data?.message || 'Failed to load expiry vouchers.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccYearChange = (e) => {
    const val = e.target.value;
    setSelectedAccYear(val);
    fetchList(val);
  };

  const handleAddNew = () => {
    navigate('/expiry-voucher/entry?Mode=Create');
  };

  const handleRowClick = (issueId) => {
    navigate(`/expiry-voucher/entry?IssueID=${encodeURIComponent(issueId)}&Mode=Edit`);
  };

  const handleDelete = async (e, issueId) => {
    e.stopPropagation();
    if (!window.confirm('Do you really want to delete this expired voucher?')) return;

    setDeletingId(issueId);
    try {
      const res = await api.delete(`/expiry-voucher/${issueId}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Deleted successfully');
        await fetchList(selectedAccYear);
      }
    } catch (err) {
      console.error('Error deleting voucher:', err);
      toast.error(err.response?.data?.message || 'References found and cannot be deleted.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.issueNo?.toLowerCase().includes(query) ||
        item.issueDate?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-[#f4f7f6]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4">

              {/* Title Bar in Theme Blue */}
              <div className="bg-[#1e40af] py-2.5 px-4 rounded text-center shadow-xs">
                <h1 className="text-sm md:text-base font-bold text-white tracking-wide">
                  Expire Items List
                </h1>
              </div>

              {/* Filter & Action Panel */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-md p-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
                  {/* Financial Year Filter */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">Filters:</span>
                    <span className="font-semibold text-gray-600">Fin. Year</span>
                    <select
                      value={selectedAccYear}
                      onChange={handleAccYearChange}
                      className="px-2.5 py-1 text-xs border border-blue-400 rounded bg-white font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
                    >
                      <option value="">All Financial Years</option>
                      {finYears.map((yr) => (
                        <option key={yr.accYrSetId} value={yr.accYrSetId}>
                          {yr.accYear} {yr.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions: Add button */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">Actions</span>
                    <button
                      onClick={handleAddNew}
                      title="Add New Expired Voucher"
                      className="text-blue-600 hover:text-blue-700 transition-transform active:scale-95 focus:outline-none"
                    >
                      <PlusCircleIcon className="w-7 h-7 fill-blue-600 text-white hover:opacity-90 drop-shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search & Refresh Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Reference No, Date, Status..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => fetchList(selectedAccYear)}
                    disabled={loading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center space-x-2">
                  <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white rounded-md border border-gray-300 shadow-xs overflow-hidden relative min-h-[160px]">
                {/* Loading circle overlay */}
                {loading && (
                  <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[0.5px] flex flex-col items-center justify-center gap-2">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-xs font-semibold text-blue-900 bg-white/90 px-3 py-1 rounded shadow-xs border border-blue-200">
                      Loading expired vouchers...
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-xs bg-slate-50">
                      <tr className="bg-[#1e40af] text-white">
                        <th className="py-2.5 px-3 text-center font-bold border-r border-blue-900 w-16">
                          Sl. No.
                        </th>
                        <th className="py-2.5 px-4 font-bold border-r border-blue-900">
                          Reference No
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold border-r border-blue-900 w-40">
                          Reference Date
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold border-r border-blue-900 w-32">
                          Status
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold w-20">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            {loading ? 'Fetching records...' : 'No expired vouchers found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((item, idx) => {
                          const isComplete = item.status === 'C';
                          const isDeleting = deletingId === item.issueId;

                          return (
                            <tr
                              key={item.issueId}
                              onClick={() => handleRowClick(item.issueId)}
                              className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center text-gray-700 font-medium border-r border-gray-200">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-gray-900 border-r border-gray-200">
                                <span className="text-blue-700 hover:underline">
                                  {item.issueNo}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center text-gray-700 border-r border-gray-200 font-medium">
                                {item.issueDate}
                              </td>
                              <td className="py-2.5 px-4 text-center border-r border-gray-200">
                                {isComplete ? (
                                  <span className="font-bold text-blue-700 hover:underline">
                                    Complete
                                  </span>
                                ) : (
                                  <span className="font-bold text-red-600 hover:underline">
                                    Incomplete
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {!isComplete && (
                                  <button
                                    onClick={(e) => handleDelete(e, item.issueId)}
                                    disabled={isDeleting}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center min-w-[24px] min-h-[24px]"
                                    title="Delete Incomplete Voucher"
                                  >
                                    {isDeleting ? (
                                      <ArrowPathIcon className="w-4 h-4 animate-spin text-red-600" />
                                    ) : (
                                      <TrashIcon className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Records Count Info */}
              <div className="text-right text-[11px] text-gray-500">
                Total Records: <b>{filteredData.length}</b>
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
