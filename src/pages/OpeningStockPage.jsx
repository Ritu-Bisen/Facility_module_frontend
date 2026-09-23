import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  PlusIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  PencilSquareIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function OpeningStockPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [canAdd, setCanAdd] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOpeningStockList();
  }, []);

  const fetchOpeningStockList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/opening-stock/list');
      if (response.data && response.data.success) {
        setData(response.data.data || []);
        setCanAdd(response.data.canAdd);
      } else {
        setData(response.data?.data || []);
        setCanAdd(response.data?.canAdd ?? true);
      }
    } catch (err) {
      console.error('Error fetching opening stock list:', err);
      setError(err.response?.data?.message || 'Failed to load opening stock details.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.receiptNo?.toLowerCase().includes(query) ||
        item.facilityName?.toLowerCase().includes(query) ||
        item.receiptDate?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const handleAddNewRequest = () => {
    navigate('/facility-receipt-manual?Mode=Create');
  };

  const handleStatusClick = (row) => {
    if (row.status === 'I') {
      navigate(`/facility-receipt-manual?ReceiptID=${encodeURIComponent(row.receiptId)}`);
    } else if (row.status === 'C') {
      navigate(`/opening-stock-report?ReceiptID=${encodeURIComponent(row.receiptId)}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-full mx-auto space-y-6">
              
              {/* Simple Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Opening Stock</h1>
                  <p className="text-xs text-gray-500 mt-1">Facility initial stock records and verification status</p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  {canAdd && (
                    <button
                      onClick={handleAddNewRequest}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors focus:outline-none"
                    >
                      <PlusIcon className="w-4 h-4 stroke-[3]" />
                      <span>Add Opening Stock</span>
                    </button>
                  )}

                  <button
                    onClick={fetchOpeningStockList}
                    disabled={loading}
                    className="inline-flex items-center space-x-1 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors focus:outline-none"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Notice if entry already exists */}
              {!canAdd && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs font-medium flex items-center space-x-2 shadow-xs">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Opening stock entry already exists for your facility.</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {/* Main Content & Table Container */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Search Bar & Table Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Facility Opening Stock List
                  </h2>

                  <div className="relative w-full sm:w-64">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-12 text-gray-500 text-xs">
                      <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading Opening Stock...
                    </div>
                  ) : filteredData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-xs font-medium">
                      No Receipts found for selected filter conditions
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left divide-y divide-gray-200">
                      <thead className="bg-gray-100 text-gray-700 uppercase font-semibold text-[11px]">
                        <tr>
                          <th className="py-3 px-4 text-center w-16">Sl. No.</th>
                          <th className="py-3 px-4">Opening Stock No.</th>
                          <th className="py-3 px-4">Opening Stock Date</th>
                          <th className="py-3 px-4 text-center">Facility Name</th>
                          <th className="py-3 px-4 text-center w-32">Status</th>
                          <th className="py-3 px-4 text-center w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-800">
                        {filteredData.map((row, idx) => (
                          <tr key={row.receiptId || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-center font-medium text-gray-500">
                              {row.slNo || idx + 1}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                              {row.receiptNo}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {row.receiptDate}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-700">
                              {row.facilityName}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold">
                              {row.status === 'I' && (
                                <button
                                  onClick={() => handleStatusClick(row)}
                                  className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs font-semibold transition-colors"
                                >
                                  Incomplete
                                </button>
                              )}
                              {row.status === 'C' && (
                                <button
                                  onClick={() => handleStatusClick(row)}
                                  className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 hover:bg-green-200 rounded-full text-xs font-semibold transition-colors"
                                >
                                  Completed
                                </button>
                              )}
                              {!row.status && <span className="text-gray-400">-</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleStatusClick(row)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title={row.status === 'I' ? 'Edit Record' : 'View Report'}
                              >
                                {row.status === 'I' ? (
                                  <PencilSquareIcon className="w-4 h-4" />
                                ) : (
                                  <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                  Showing {filteredData.length} records
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
