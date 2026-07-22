import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../api/axios'; // Corrected import path

export default function NocApprovalPage() {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [facilityStockList, setFacilityStockList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/noc-approval/pending');
      const data = response.data || [];
      const mapped = data.map((item, idx) => ({
        id: idx,
        sr: item.SR,
        itemId: item.ITEMID,
        facility: item.FACILITYNAME,
        appliedDate: item.NOCDATEA,
        code: item.ITEMCODE,
        itemName: item.ITEMNAME,
        strength: item.STRENGTH1,
        unit: item.UNIT,
        unitCount: item.UNITCOUNT,
        appliedNocQty: item.NOCQTYNOS,
        appliedRemarks: item.ITEMREMARKS,
        districtCurrentStock: item.FACCURRENTSTOCK,
        cfyAiQty: item.INDENTQTY,
        cfyCgmscIssuedQty: item.ISSUEQTY,
        cfyNocQty: item.NOCQTY,
        cmhoApprovedQty: item.CGMSCAPRQTY || 0,
        cmhoRemarks: item.CMHOAPRREMARKS || '',
        nocQtyNos: item.NOCQTYNOS, // To check during approval
        selected: false
      }));
      setPendingItems(mapped);
    } catch (err) {
      console.error(err);
      setMsg('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index) => {
    const newItems = [...pendingItems];
    newItems[index].selected = !newItems[index].selected;
    setPendingItems(newItems);
  };

  const handleQtyChange = (index, val) => {
    const newItems = [...pendingItems];
    newItems[index].cmhoApprovedQty = val;
    setPendingItems(newItems);
  };

  const handleRemarksChange = (index, val) => {
    const newItems = [...pendingItems];
    newItems[index].cmhoRemarks = val;
    setPendingItems(newItems);
  };

  const fetchFacilityStock = async (itemId) => {
    if (!itemId) return;
    setModalLoading(true);
    setStockModalOpen(true);
    try {
      const response = await api.get(`/noc-approval/facility-stock/${itemId}`);
      setFacilityStockList(response.data || []);
    } catch (err) {
      console.error(err);
      setFacilityStockList([]);
    } finally {
      setModalLoading(false);
    }
  };



  const handleApproval = async () => {
    setMsg('');
    const selected = pendingItems.filter(i => i.selected);
    if (!selected.length) {
      return setMsg('Select at least one item');
    }
    try {
      const response = await api.post('/noc-approval/approve', {
        items: selected
      });
      setMsg(response.data.message || 'Approved Successfully');
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error during approval');
    }
  };

  const handleRejection = async () => {
    setMsg('');
    const selected = pendingItems.filter(i => i.selected);
    if (!selected.length) {
      return setMsg('Select at least one item');
    }
    try {
      const response = await api.post('/noc-approval/reject', {
        items: selected
      });
      setMsg(response.data.message || 'Rejected Successfully');
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error during rejection');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto py-4 flex flex-col items-center w-full">
            
            <div className="w-full flex flex-col gap-6 pt-2 pb-10">
              {/* Header Card */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-6 w-full flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pending For NOC Approval</h1>
                  <p className="text-sm text-slate-500 font-medium mt-1">Review and manage items before sending to CGMSC</p>
                </div>
                
                {msg && <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg font-semibold text-sm animate-pulse">{msg}</div>}

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleApproval} 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-2.5 px-6 rounded-full shadow-lg shadow-emerald-500/30 text-sm transition-all transform hover:-translate-y-0.5"
                  >
                    Approve & Send
                  </button>
                  <button 
                    onClick={handleRejection} 
                    className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold py-2.5 px-6 rounded-full shadow-lg shadow-rose-500/30 text-sm transition-all transform hover:-translate-y-0.5"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Loading Overlay */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-500 font-medium text-sm mt-4">Fetching pending approvals...</p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-4">
                  {/* Table Card */}
                  <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="w-full">
                      <table className="w-full text-[11px] text-left table-auto">
                        <thead className="bg-[#0f172a] text-slate-100 leading-tight">
                          <tr>
                            <th className="px-1.5 py-2 font-semibold uppercase">S.No</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">Sel</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Facility</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Applied Date</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Code</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Item Name</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Strength</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Unit</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">Unit Count</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">Applied Qty</th>
                            <th className="px-1.5 py-2 font-semibold uppercase">Remarks</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">Dist Stock</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">CFY AI</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">CFY Issued</th>
                            <th className="px-1.5 py-2 font-semibold uppercase text-center">CFY NOC</th>
                            <th className="px-1.5 py-2 font-semibold uppercase w-24">Approved Qty</th>
                            <th className="px-1.5 py-2 font-semibold uppercase w-32">CMHO Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pendingItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                              <td className="px-1.5 py-1.5 text-slate-500 font-medium">{idx + 1}</td>
                              <td className="px-1.5 py-1.5 text-center">
                                <div className="flex items-center justify-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    checked={item.selected}
                                    onChange={() => toggleSelect(idx)}
                                  />
                                </div>
                              </td>
                              <td className="px-1.5 py-1.5 text-slate-700 font-medium break-words max-w-[80px]">{item.facility}</td>
                              <td className="px-1.5 py-1.5 text-slate-500 break-words max-w-[70px]">{item.appliedDate}</td>
                              <td className="px-1.5 py-1.5">
                                <span className="text-slate-500 font-mono bg-slate-50 rounded px-1 py-0.5 inline-block border border-slate-100">{item.code}</span>
                              </td>
                              <td className="px-1.5 py-1.5 text-blue-700 font-semibold break-words max-w-[140px]">{item.itemName}</td>
                              <td className="px-1.5 py-1.5 text-slate-600 break-words max-w-[70px]">{item.strength}</td>
                              <td className="px-1.5 py-1.5">
                                <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[10px] font-medium">{item.unit}</span>
                              </td>
                              <td className="px-1.5 py-1.5 text-slate-600 text-center font-semibold">{item.unitCount}</td>
                              <td className="px-1.5 py-1.5 text-slate-800 text-center font-bold bg-amber-50/50">{item.appliedNocQty}</td>
                              <td className="px-1.5 py-1.5 text-slate-500 italic break-words max-w-[100px]">{item.appliedRemarks || '-'}</td>
                              <td className="px-1.5 py-1.5 text-center">
                                <button 
                                  onClick={() => fetchFacilityStock(item.itemId)}
                                  className="text-blue-600 hover:text-blue-800 font-bold underline decoration-blue-300 underline-offset-2 hover:decoration-blue-600 transition-all"
                                >
                                  {item.districtCurrentStock}
                                </button>
                              </td>
                              <td className="px-1.5 py-1.5 text-slate-600 text-center">{item.cfyAiQty}</td>
                              <td className="px-1.5 py-1.5 text-slate-600 text-center">{item.cfyCgmscIssuedQty}</td>
                              <td className="px-1.5 py-1.5 text-slate-600 text-center">{item.cfyNocQty}</td>
                              <td className="px-1.5 py-1.5">
                                <input 
                                  type="number" 
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner font-semibold"
                                  value={item.cmhoApprovedQty}
                                  onChange={(e) => handleQtyChange(idx, e.target.value)}
                                />
                              </td>
                              <td className="px-1.5 py-1.5">
                                <textarea 
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner h-8 resize-none text-[10px]"
                                  placeholder="Add notes..."
                                  value={item.cmhoRemarks}
                                  onChange={(e) => handleRemarksChange(idx, e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                          {pendingItems.length === 0 && (
                            <tr>
                              <td colSpan="17" className="px-4 py-12 text-center text-slate-500 font-medium">
                                No pending items found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Modal for Facility Wise Current Stock */}
                  {stockModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-2xl shadow-2xl w-full md:w-4/5 lg:w-3/4 max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/50">
                        <div className="bg-[#0f172a] text-white px-6 py-4 flex justify-between items-center">
                          <div>
                            <h2 className="text-xl font-bold tracking-tight">Facility Wise Current Stock</h2>
                            <p className="text-slate-400 text-xs mt-0.5">District breakdown for selected item</p>
                          </div>
                          <button 
                            onClick={() => setStockModalOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          >
                            &times;
                          </button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-auto bg-slate-50/50">
                          {modalLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                              <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                              <p className="text-slate-500 font-medium">Loading stock data...</p>
                            </div>
                          ) : facilityStockList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2">
                              <div className="text-slate-300">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                              </div>
                              <p className="text-slate-500 font-medium">No stock data available</p>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                              <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold text-center">S.No</th>
                                    <th className="px-4 py-3 font-semibold">Facility</th>
                                    <th className="px-4 py-3 font-semibold">Code</th>
                                    <th className="px-4 py-3 font-semibold">Item Name</th>
                                    <th className="px-4 py-3 font-semibold">Strength</th>
                                    <th className="px-4 py-3 font-semibold text-center">Unit</th>
                                    <th className="px-4 py-3 font-semibold text-center">Current Qty</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {facilityStockList.map((stk, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                                      <td className="px-4 py-3 text-slate-800 font-medium">{stk.FACILITYNAME}</td>
                                      <td className="px-4 py-3 text-slate-500 font-mono text-xs"><span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded">{stk.ITEMCODE}</span></td>
                                      <td className="px-4 py-3 text-blue-700 font-medium">{stk.ITEMNAME}</td>
                                      <td className="px-4 py-3 text-slate-600">{stk.STRENGTH1}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{stk.UNIT}</span>
                                      </td>
                                      <td className="px-4 py-3 text-center text-slate-800 font-bold">{stk.CURRENTSTOCK}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end">
                          <button 
                            onClick={() => setStockModalOpen(false)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-lg shadow-sm text-sm transition-colors border border-slate-300"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
