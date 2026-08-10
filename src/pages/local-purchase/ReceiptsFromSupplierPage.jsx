import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFinYears } from '../../api/contractApi';
import { getSupplierReceipts } from '../../api/localPurchaseApi';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
  ArrowLeftIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  PlusIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

const ReceiptsFromSupplierPage = () => {
  const navigate = useNavigate();
  
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  
  const [supplyOrders, setSupplyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFinYears();
  }, []);

  useEffect(() => {
    if (selectedFinYear) {
      loadSupplyOrders();
    }
  }, [selectedFinYear]);

  const loadFinYears = async () => {
    try {
      const data = await getFinYears();
      setFinYears(data);
      if (data.length > 0) {
        setSelectedFinYear(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load financial years:', err);
    }
  };

  const loadSupplyOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getSupplierReceipts(selectedFinYear);
      setSupplyOrders(response || []);
    } catch (err) {
      console.error('Failed to load supplier receipts:', err);
      setSupplyOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
    if (status === 'Completed') {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (status === 'Incomplete') {
      colorClass = 'bg-red-50 text-red-600 border-red-200';
    } else if (status === 'Order Placed') {
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full px-2 space-y-4">
              
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Local Purchase Supplier Receipts and Returns</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage receipts and returns for local purchase supply orders</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filters:</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700 font-medium">Fin. Year</span>
                      <select 
                        className="h-8 text-sm border border-slate-300 rounded focus:ring-emerald-500 focus:border-emerald-500 pl-2 pr-8 py-0 shadow-sm"
                        value={selectedFinYear}
                        onChange={(e) => setSelectedFinYear(e.target.value)}
                      >
                        <option value="">Select Year</option>
                        {finYears.map(year => (
                          <option key={year.id} value={year.id}>{year.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0b3b17] text-white sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider border-r border-[#155424] w-[3%] text-center">Sl. No.</th>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider border-r border-[#155424] w-[14%]">Supplier</th>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider border-r border-[#155424] w-[11%]">Supply Order No</th>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider border-r border-[#155424] w-[7%] text-center">SO Date</th>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider border-r border-[#155424] w-[8%] text-center">Supply Status</th>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider border-r border-[#155424] w-[7%] text-center">Actions</th>
                        <th className="px-2 py-2 font-semibold text-[10px] tracking-wider w-[50%] text-center">Receipts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                            <div className="flex justify-center items-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                            </div>
                          </td>
                        </tr>
                      ) : supplyOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-500 font-medium">
                            No Supply Order found for selected filter conditions
                          </td>
                        </tr>
                      ) : (
                        supplyOrders.map((so, idx) => {
                          return (
                            <tr key={so.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-2 py-2 text-center text-slate-500 font-medium text-[10px] border-r border-slate-200">{idx + 1}</td>
                              <td className="px-2 py-2 text-slate-800 font-medium truncate text-[10px] border-r border-slate-200">{so.supplierName || 'N/A'}</td>
                              <td className="px-2 py-2 text-slate-700 text-[10px] border-r border-slate-200">{so.poNo}</td>
                              <td className="px-2 py-2 text-center text-slate-600 text-[10px] border-r border-slate-200">{so.poDate}</td>
                              <td className="px-2 py-2 text-center border-r border-slate-200">{getStatusBadge(so.status)}</td>
                              <td className="px-2 py-2 text-center border-r border-slate-200 align-top">
                                <button 
                                  className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 text-[10px] font-semibold transition-colors shadow-sm mt-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/local-purchase/receipts/create/${so.id}`);
                                  }}
                                >
                                  <PlusIcon className="w-3 h-3" /> Receipt
                                </button>
                              </td>
                              <td className="px-1 py-1 align-top bg-slate-50/50">
                                {so.receipts && so.receipts.length > 0 ? (
                                  <div className="border border-slate-200 overflow-hidden shadow-sm m-1">
                                    <table className="w-full text-left text-[9px]">
                                      <thead className="bg-[#0b3b17] text-white">
                                        <tr>
                                          <th className="px-1 py-1 font-semibold border-r border-[#155424]">Receipt No</th>
                                          <th className="px-1 py-1 font-semibold border-r border-[#155424] text-center whitespace-nowrap">Receipt Date</th>
                                          <th className="px-1 py-1 font-semibold border-r border-[#155424]">Voucher No.</th>
                                          <th className="px-1 py-1 font-semibold border-r border-[#155424] text-center whitespace-nowrap">Voucher Date</th>
                                          <th className="px-1 py-1 font-semibold border-r border-[#155424] text-center">Status</th>
                                          <th className="px-1 py-1 font-semibold border-r border-[#155424] text-center whitespace-nowrap">Voucher Details</th>
                                          <th className="px-1 py-1 font-semibold text-center">Print</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200 bg-white">
                                        {so.receipts.map((receipt, rIdx) => (
                                          <tr key={receipt.receiptId} className="hover:bg-slate-50">
                                            <td className="px-1 py-1 text-slate-700 font-medium border-r border-slate-200">{receipt.receiptNo}</td>
                                            <td className="px-1 py-1 text-slate-600 text-center border-r border-slate-200">{receipt.receiptDate}</td>
                                            <td className="px-1 py-1 text-slate-600 border-r border-slate-200">{receipt.voucherNo}</td>
                                            <td className="px-1 py-1 text-slate-600 text-center border-r border-slate-200">{receipt.voucherDate}</td>
                                            <td className="px-1 py-1 text-center border-r border-slate-200">
                                              {receipt.status === 'Incomplete' ? (
                                                <button 
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    navigate(`/local-purchase/receipts/edit/${receipt.receiptId}`);
                                                  }}
                                                  className="hover:underline cursor-pointer focus:outline-none"
                                                >
                                                  {getStatusBadge(receipt.status)}
                                                </button>
                                              ) : (
                                                getStatusBadge(receipt.status)
                                              )}
                                            </td>
                                            <td className="px-1 py-1 text-center text-slate-400 italic border-r border-slate-200">
                                              -
                                            </td>
                                            <td className="px-1 py-1 text-center">
                                              {receipt.status === 'Completed' && (
                                                <button 
                                                  className="text-blue-600 hover:text-blue-800 text-[9px] font-semibold hover:underline inline-flex items-center justify-center"
                                                >
                                                  MRC
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })
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

export default ReceiptsFromSupplierPage;
