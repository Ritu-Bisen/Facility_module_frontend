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
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function SpecialReceiptListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSpecialReceipts();
  }, []);

  const fetchSpecialReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/special-receipt/list');
      if (response.data && response.data.success) {
        setData(response.data.data || []);
      } else {
        setData(response.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching special receipts:', err);
      const msg = err.response?.data?.message || 'Failed to load special receipts.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    // Only show Incomplete records (exclude Completed)
    const incompleteOnly = data.filter((item) => item.status !== 'C');
    if (!searchQuery.trim()) return incompleteOnly;
    const query = searchQuery.toLowerCase();
    return incompleteOnly.filter(
      (item) =>
        item.receiptNo?.toLowerCase().includes(query) ||
        item.receiptFrom?.toLowerCase().includes(query) ||
        item.receiptDate?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const handleAddNew = () => {
    navigate('/special-receipt/entry?Mode=Create');
  };

  const handleRowClick = (receiptId) => {
    navigate(`/special-receipt/entry?ReceiptID=${encodeURIComponent(receiptId)}`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f4f7f6]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4">

              {/* Title Bar in Theme Blue */}
              <div className="bg-[#1e40af] py-2 px-4 rounded text-center shadow-xs">
                <h1 className="text-sm md:text-base font-bold text-white tracking-wide">
                  Special Receipt
                </h1>
              </div>

              {/* Top Banner / Add Action Box in Blue Theme */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-md p-4 text-center shadow-xs">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm font-bold text-gray-800">
                    Click Add to Special Receipts Entry:
                  </span>
                  <button
                    onClick={handleAddNew}
                    title="Add Special Receipt"
                    className="text-blue-600 hover:text-blue-700 transition-transform active:scale-95 focus:outline-none"
                  >
                    <PlusCircleIcon className="w-8 h-8 fill-blue-600 text-white hover:opacity-90" />
                  </button>
                </div>
              </div>

              {/* Filter & Refresh Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search receipt no, location, date..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={fetchSpecialReceipts}
                    disabled={loading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded border border-gray-300 transition-colors focus:outline-none"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded text-xs flex items-center gap-2">
                  <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tab Header & Table */}
              <div className="bg-white rounded-md border border-gray-300 shadow-xs overflow-hidden">
                {/* Single Tab header */}
                <div className="border-b border-gray-300 bg-gray-100 flex items-center px-2 pt-2">
                  <div className="border border-b-0 border-blue-600 bg-white px-4 py-1.5 text-xs font-bold text-blue-900 rounded-t shadow-xs">
                    Special Receipts
                  </div>
                </div>

                {/* GridView / Table */}
                <div className="overflow-x-auto p-2">
                  <table className="w-full text-xs text-left border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-[#1e40af] text-white">
                        <th className="py-2.5 px-3 text-center font-bold border border-blue-900 w-16">
                          Sl. No.
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold border border-blue-900">
                          Special Receipt No.
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold border border-blue-900">
                          Special Receipt Date
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold border border-blue-900">
                          Receipt From
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold border border-blue-900 w-32">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-700" />
                              <span>Loading special receipts...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 font-medium">
                            No special receipts found. Click the (+) button above to add a new Special Receipt.
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, idx) => {
                          const isIncomplete = row.status === 'I' || row.status === 'P';
                          return (
                            <tr
                              key={row.receiptId || idx}
                              className="hover:bg-blue-50/40 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center border border-gray-200 font-medium text-gray-700">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 text-center border border-gray-200">
                                <button
                                  type="button"
                                  onClick={() => handleRowClick(row.receiptId)}
                                  className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                                  title="Click to view/edit receipt"
                                >
                                  {row.receiptNo || 'N/A'}
                                </button>
                              </td>
                              <td className="py-2.5 px-4 text-center border border-gray-200 text-gray-700 font-medium">
                                {row.receiptDate || '-'}
                              </td>
                              <td className="py-2.5 px-4 text-left border border-gray-200 text-gray-800 font-medium">
                                {row.receiptFrom || 'N/A'}
                              </td>
                              <td className="py-2.5 px-4 text-center border border-gray-200">
                                <button
                                  type="button"
                                  onClick={() => handleRowClick(row.receiptId)}
                                  className={`font-bold text-xs hover:underline cursor-pointer ${
                                    isIncomplete ? 'text-red-600' : 'text-blue-700'
                                  }`}
                                >
                                  {isIncomplete ? 'Incomplete' : 'Completed'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Count */}
                {!loading && filteredData.length > 0 && (
                  <div className="p-3 bg-gray-50 border-t border-gray-200 text-right text-xs text-gray-600">
                    Total Records: <span className="font-bold text-gray-800">{filteredData.length}</span>
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
