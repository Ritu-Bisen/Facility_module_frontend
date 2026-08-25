import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { getWardIssueAccYears } from '../../api/contractApi';
import { getAyushOrders, deleteAyushOrderApi } from '../../api/ayushLocalPurchaseApi';
import { PlusCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/solid';

export default function AyushLocalPurchasePage() {
  const [finYear, setFinYear] = useState('');
  const [finYearsList, setFinYearsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (finYear) {
      fetchOrders();
    }
  }, [finYear, statusFilter]);

  const fetchInitialData = async () => {
    try {
      const res = await getWardIssueAccYears();
      const years = res || [];
      setFinYearsList(years);
      if (years.length > 0) {
        const isArr = Array.isArray(years[0]);
        const currentStr = '2026-2027'; // default
        const exists = years.find(y => (isArr ? y[1] : (y.SHACCYEAR || y.ACCYEAR)) === currentStr);
        if (exists) {
          setFinYear(isArr ? exists[0].toString() : (exists.ACCYRSETID || exists.accyrsetid).toString());
        } else {
          setFinYear(isArr ? years[0][0].toString() : (years[0].ACCYRSETID || years[0].accyrsetid).toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch fin years', error);
      toast.error('Failed to load financial years');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAyushOrders(finYear, statusFilter);
      if (res && res.success) {
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch AYUSH orders', error);
      toast.error('Failed to load AYUSH purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/local-purchase/ayush-local-purchase/new');
  };

  const handleDelete = async (id, poNo) => {
    if (!window.confirm(`Are you sure you want to delete order ${poNo}?`)) return;
    try {
      const res = await deleteAyushOrderApi(id);
      if (res && res.success) {
        toast.success('Order deleted successfully');
        fetchOrders();
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting order');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  };

  const calculateOrderValue = (order) => {
    if (order.totalAmount !== undefined && (!order.items || order.items.length === 0)) {
      return order.totalAmount;
    }
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-[95%] mx-auto">
              
              <div className="bg-slate-100 border-b-2 border-[#0f172a] p-3 mb-4 rounded-t shadow-sm">
                <h2 className="text-xl font-bold text-center text-gray-900">
                  AYUSH Local Purchase Orders
                </h2>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded shadow-sm mb-6 p-4">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <span className="font-semibold text-gray-700">Filters:</span>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Fin. Year</label>
                    <select
                      className="border border-gray-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                      value={finYear}
                      onChange={(e) => setFinYear(e.target.value)}
                    >
                      {finYearsList.length > 0 ? (
                        finYearsList.map((y, idx) => {
                          const isArr = Array.isArray(y);
                          const id = isArr ? y[0] : (y.ACCYRSETID || y.accyrsetid);
                          const name = isArr ? y[1] : (y.SHACCYEAR || y.ACCYEAR || y.shaccyear || y.accyear);
                          return (
                            <option key={id || idx} value={id}>
                              {name}
                            </option>
                          );
                        })
                      ) : (
                        <option value="">No years loaded</option>
                      )}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="border border-gray-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white w-32"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Incomplete">Incomplete</option>
                      <option value="Order Placed">Order Placed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm font-medium text-gray-700">Actions</span>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                      title="Add new AYUSH Local Purchase Order"
                    >
                      <PlusCircleIcon className="w-7 h-7 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded border border-gray-300 overflow-hidden">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#0f172a] text-white">
                        <tr>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-700 w-16">Sl. No.</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-700">PO Number</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-700 w-36">PO Date</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-700">Supplier Name</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-right border-r border-slate-700 w-44">Total Value</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-700 w-32">Status</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center w-28">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              No AYUSH local purchase orders found for the selected filters.
                            </td>
                          </tr>
                        ) : (
                          orders.map((item, index) => (
                            <tr key={item.id} className="hover:bg-blue-50 transition-colors even:bg-[#f4f4fa]">
                              <td className="px-4 py-1.5 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
                                {index + 1}
                              </td>
                              <td className="px-4 py-1.5 text-sm font-semibold text-slate-800 border-r border-gray-200">
                                {item.poNo}
                              </td>
                              <td className="px-4 py-1.5 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
                                {item.date}
                              </td>
                              <td className="px-4 py-1.5 text-sm text-gray-900 border-r border-gray-200">
                                {item.supplierName}
                              </td>
                              <td className="px-4 py-1.5 text-sm text-right font-medium text-slate-900 border-r border-gray-200">
                                {formatCurrency(calculateOrderValue(item))}
                              </td>
                              <td className="px-4 py-1.5 whitespace-nowrap text-center border-r border-gray-200">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  item.status === 'Incomplete' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-1.5 whitespace-nowrap text-center text-sm font-medium flex items-center justify-center gap-3">
                                <button
                                  onClick={() => navigate(`/local-purchase/ayush-local-purchase/edit/${item.id}`)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit Order"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, item.poNo)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Order"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
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
}
