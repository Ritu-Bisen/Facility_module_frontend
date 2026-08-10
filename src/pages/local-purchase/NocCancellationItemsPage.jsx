import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/layout/Footer";
import { getNocItemsForCancellation, cancelNocItems } from '../../api/nocCancellationApi';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

const NocCancellationItemsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [headerInfo, setHeaderInfo] = useState({
    facilityName: '',
    nocNumber: '',
    nocDate: ''
  });
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItems();
    }
  }, [id]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getNocItemsForCancellation(id);
      if (response.success) {
        const items = response.data || [];
        setData(items);
        if (items.length > 0) {
          setHeaderInfo({
            facilityName: items[0].facilityName,
            nocNumber: items[0].nocNumber,
            nocDate: items[0].nocDate
          });
        }
      }
    } catch (error) {
      toast.error('Failed to fetch NOC items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNoc = async () => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one item to cancel');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Are you sure, you want to Cancel NOC for selected items?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it!'
    });

    if (result.isConfirmed) {
      setIsCancelling(true);
      try {
        const srs = selectedRows.map(row => row.sr);
        const res = await cancelNocItems(srs);
        if (res.success) {
          toast.success('NOC Cancelled Successfully');
          // Refresh grid
          fetchItems();
          // Clear selection
          setSelectedRows([]);
        }
      } catch (error) {
        toast.error('Failed to cancel NOC items');
        console.error(error);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  const handleRowSelected = (row, isChecked) => {
    if (isChecked) {
      setSelectedRows(prev => [...prev, row]);
    } else {
      setSelectedRows(prev => prev.filter(r => r.sr !== row.sr));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows([...data]);
    } else {
      setSelectedRows([]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
            
            <div className="max-w-[95%] mx-auto mt-6">
              <div className="bg-[#0f172a] border-b-2 border-[#0f172a] p-3 mb-4 rounded-t shadow-sm flex items-center justify-between relative">
                <button 
                  onClick={() => navigate('/local-purchase/noc-cancellation')}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
                  title="Go Back"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-center text-white absolute left-1/2 -translate-x-1/2">
                  NOC Details For Cancellation
                </h2>
                <div className="w-8"></div> {/* Spacer to keep title centered */}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  NOC Information
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Facility Name</span>
                    <span className="text-base text-slate-800">{headerInfo.facilityName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">NOC Number</span>
                    <span className="text-base text-slate-800">{headerInfo.nocNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">NOC Date</span>
                    <span className="text-base text-slate-800">{headerInfo.nocDate || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="font-semibold text-slate-700">Select Items to Cancel</h3>
                  <button
                    onClick={handleCancelNoc}
                    disabled={selectedRows.length === 0 || isCancelling}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel NOC'}
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#1e293b] text-white">
                        <tr>
                          <th className="px-4 py-3 text-center border-r border-slate-600 w-12">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={data.length > 0 && selectedRows.length === data.length}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-600 w-20">Sl. No.</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-600">Item Code</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-600">Item Name</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-600">Strength</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">NOC Qty</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              No items available to cancel.
                            </td>
                          </tr>
                        ) : (
                          data.map((item, index) => {
                            const isSelected = selectedRows.some(r => r.sr === item.sr);
                            return (
                              <tr key={item.sr} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={isSelected}
                                    onChange={(e) => handleRowSelected(item, e.target.checked)}
                                  />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-b">{index + 1}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.itemCode}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.itemName}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 border-b">{item.strength}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right border-b">{item.approvedQty}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
            
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default NocCancellationItemsPage;
