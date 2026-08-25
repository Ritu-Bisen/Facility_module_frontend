import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getFinYears } from '../../api/contractApi';
import { getSupplyOrders, getSupplyOrderDetails } from '../../api/localPurchaseApi';
import { generateSupplyOrderPDF } from '../../utils/supplyOrderPdfGenerator';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const SupplyOrdersPage = () => {
  const navigate = useNavigate();
  
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('Incomplete');
  
  const [supplyOrders, setSupplyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinYears();
  }, []);

  useEffect(() => {
    if (selectedFinYear) {
      loadSupplyOrders();
    }
  }, [selectedFinYear, statusFilter]);

  const loadFinYears = async () => {
    try {
      const data = await getFinYears();
      setFinYears(data);
      if (data.length > 0) {
        const today = new Date();
        let startYear = today.getFullYear();
        if (today.getMonth() < 3) { // 0=Jan, 1=Feb, 2=Mar
          startYear -= 1;
        }
        const currentYearPrefix = startYear.toString();
        const currentFinYearObj = data.find(y => y.name && y.name.toString().startsWith(currentYearPrefix));
        
        if (currentFinYearObj) {
          setSelectedFinYear(currentFinYearObj.id);
        } else {
          setSelectedFinYear(data[0].id);
        }
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load financial years:', err);
      setIsLoading(false);
    }
  };

  const loadSupplyOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getSupplyOrders(selectedFinYear, statusFilter);
      setSupplyOrders(response.data || []);
    } catch (err) {
      console.error('Failed to load supply orders:', err);
      setSupplyOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/local-purchase/supply-orders/new');
  };

  const user = useSelector((s) => s.auth.user);

  const handleDownloadPO = async (so) => {
    try {
      const response = await getSupplyOrderDetails(so.id);
      if (response && response.success && response.data) {
        generateSupplyOrderPDF(response.data, user);
      } else {
        console.error('Failed to get PDF details');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  // Helper for status colors
  const getStatusBadge = (status, amendNo, remarks) => {
    let colorClass = 'bg-slate-100 text-slate-800';
    let label = status;

    if (status === 'Incomplete') {
      if (amendNo > 0) {
        label = 'Amendment Incomplete';
        colorClass = 'bg-red-50 text-red-600 border border-red-200';
      } else if (remarks && remarks.toLowerCase().includes('reject')) {
        label = 'Incomplete (Rejected)';
        colorClass = 'bg-red-50 text-red-600 border border-red-200';
      } else {
        colorClass = 'bg-red-50 text-red-600 border border-red-200';
      }
    } else if (status === 'Order Placed') {
      colorClass = 'bg-green-50 text-green-700 border border-green-200';
    } else if (status === 'Partial Supply') {
      colorClass = 'bg-orange-50 text-orange-700 border border-orange-200';
    } else if (status === 'Completed') {
      label = 'Supply Completed';
      colorClass = 'bg-rose-50 text-rose-800 border border-rose-200';
    } else if (status === 'Cancelled') {
      colorClass = 'bg-red-50 text-red-700 border border-red-200';
    } else if (status === 'Deleted') {
      label = 'Discarded';
      colorClass = 'bg-red-50 text-red-700 border border-red-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${colorClass}`} title={remarks}>
        {label}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full flex flex-col min-h-full shadow-sm border border-slate-200/60 rounded-xl overflow-hidden">
            
            {/* Header Section */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Local Supply Orders</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage Local Purchase Supply Orders</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">Fin. Year:</label>
                  <select 
                    className="w-36 border-slate-200 shadow-sm rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all py-1.5"
                    value={selectedFinYear}
                    onChange={(e) => setSelectedFinYear(e.target.value)}
                  >
                    {finYears.map(fy => (
                      <option key={fy.id} value={fy.id}>{fy.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">Status:</label>
                  <select 
                    className="w-36 border-slate-200 shadow-sm rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all py-1.5"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Partial Supply">Partial Supply</option>
                    <option value="Completed">Supply Completed</option>
                  </select>
                </div>

                <button 
                  onClick={handleAddNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow active:scale-95"
                >
                  <PlusIcon className="w-4 h-4 stroke-2" />
                  Add Supply Order
                </button>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white flex-1 flex flex-col overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-green-600 to-emerald-600"></div>

              {/* Grid */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f172a] text-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-3 py-3 font-semibold w-12 text-center tracking-wide text-[11px] uppercase border-r border-slate-700/50">Sl. No.</th>
                      <th className="px-4 py-3 font-semibold tracking-wide text-[11px] uppercase border-r border-slate-700/50">Supply Order No</th>
                      <th className="px-4 py-3 font-semibold tracking-wide text-[11px] uppercase w-36 border-r border-slate-700/50 text-center">Supply Order Date</th>
                      <th className="px-4 py-3 font-semibold tracking-wide text-[11px] uppercase border-r border-slate-700/50">Supplier</th>
                      <th className="px-4 py-3 font-semibold tracking-wide text-[11px] uppercase w-40 text-right border-r border-slate-700/50">Supply Order Value</th>
                      <th className="px-4 py-3 font-semibold text-center w-36 tracking-wide text-[11px] uppercase border-r border-slate-700/50">Status</th>
                      <th className="px-4 py-3 font-semibold text-center w-28 tracking-wide text-[11px] uppercase">Dispatched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </td>
                      </tr>
                    ) : supplyOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center">
                          <div className="text-slate-400 mb-2">
                            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-500 font-medium">No Supply Orders found for the selected filters.</p>
                        </td>
                      </tr>
                    ) : (
                      supplyOrders.map((so, index) => (
                        <tr 
                          key={so.id} 
                          className={`hover:bg-green-50/40 transition-colors group ${so.status === 'Incomplete' ? 'cursor-pointer' : ''}`}
                          onClick={() => { if(so.status === 'Incomplete') navigate(`/local-purchase/supply-orders/edit/${so.id}`) }}
                        >
                          <td className="px-3 py-3 text-center font-medium text-slate-400 border-r border-slate-100">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-100">{so.poNo}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100">{so.poDate}</td>
                          <td className="px-4 py-3 border-r border-slate-100 text-slate-700">{so.supplierName}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 border-r border-slate-100">{formatCurrency(so.soValue)}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100">
                            {so.status === 'Incomplete' ? (
                              <button 
                                onClick={() => navigate(`/local-purchase/supply-orders/edit/${so.id}`)}
                                className="focus:outline-none hover:scale-105 transition-transform"
                                title="Edit Supply Order"
                              >
                                {getStatusBadge(so.status, so.amendNo, so.supConfirmationRemarks)}
                              </button>
                            ) : (
                              getStatusBadge(so.status, so.amendNo, so.supConfirmationRemarks)
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {so.status === 'Order Placed' && (
                              <button 
                                onClick={() => handleDownloadPO(so)}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-semibold tracking-wide transition-colors" 
                                title="Download PO"
                              >
                                Download PO
                              </button>
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
        </div>
      </div>
    </div>
  );
};

export default SupplyOrdersPage;
