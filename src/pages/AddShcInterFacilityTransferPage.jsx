import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function AddShcInterFacilityTransferPage() {
  const navigate = useNavigate();
  const { nocId: routeNocId, issueId: routeIssueId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Either coming from /add/:nocId OR /edit/:issueId?nocId=...
  const nocId = routeNocId || searchParams.get('nocId');
  const issueId = routeIssueId;
  
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Header Data
  const [headerInfo, setHeaderInfo] = useState(null);
  const [issueHeader, setIssueHeader] = useState(null);
  
  // Form Data (Editable Header)
  const [issueNo, setIssueNo] = useState('AUTO GENERATED');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestBy, setRequestBy] = useState('');
  const [headerSaved, setHeaderSaved] = useState(false);
  const [activeIssueId, setActiveIssueId] = useState(issueId || null);

  // Items Data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state for Grid
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQty, setEditQty] = useState('');
  
  // Error state
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (facilityId && nocId) {
      loadHeaderInfo();
      loadItems(activeIssueId);
    }
  }, [facilityId, nocId, activeIssueId]);

  const loadHeaderInfo = async () => {
    try {
      const res = await api.get(`/shc-inter-facility-transfers/${nocId}/header`);
      if (res.data.success) {
        setHeaderInfo(res.data.data.indent);
        if (res.data.data.issueHeader) {
          setIssueHeader(res.data.data.issueHeader);
          setIssueNo(res.data.data.issueHeader.issueNo);
          setIssueDate(res.data.data.issueHeader.issueDate);
          setRequestBy(res.data.data.issueHeader.requestBy || '');
          setHeaderSaved(true);
          setActiveIssueId(res.data.data.issueHeader.issueId);
        }
      }
    } catch (e) {
      console.error('Failed to load header:', e);
      setErrorMsg('Failed to load indent details');
    }
  };

  const loadItems = async (currentIssueId) => {
    setLoading(true);
    try {
      const issueParam = currentIssueId ? `?issueId=${currentIssueId}` : '';
      const res = await api.get(`/shc-inter-facility-transfers/${nocId}/items${issueParam}`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load items:', e);
      setErrorMsg('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHeader = async () => {
    setErrorMsg('');
    try {
      const res = await api.post(`/shc-inter-facility-transfers/${nocId}/issues`, {
        issueNo,
        issueDate,
        requestBy,
        toFacilityId: headerInfo.facilityid
      });
      if (res.data.success) {
        setIssueNo(res.data.data.issueNo);
        setActiveIssueId(res.data.data.issueId);
        setHeaderSaved(true);
        // Reload to attach items if any
        loadItems(res.data.data.issueId);
      }
    } catch (e) {
      console.error('Failed to save header:', e);
      setErrorMsg('Failed to save header details');
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.ItemID);
    setEditQty(item.IssueQty > 0 ? item.IssueQty : '');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditQty('');
    setErrorMsg('');
  };

  const handleSaveItem = async (item) => {
    setErrorMsg('');
    if (!editQty || isNaN(editQty) || Number(editQty) <= 0) {
      setErrorMsg('Please enter a valid issue quantity greater than 0');
      return;
    }
    
    if (Number(editQty) > item.CurStock) {
      setErrorMsg('Issued quantity cannot be greater than Current Stock');
      return;
    }
    
    // Check multiple logic (if we had it, we would fetch it. For now, assuming multiple is 1 or skipping since it's an approximation)
    
    try {
      const res = await api.post(`/shc-inter-facility-transfers/issues/${activeIssueId}/items`, {
        issueItemId: item.IssueItemID || 0,
        itemId: item.ItemID,
        curStock: item.CurStock,
        allotted: item.requestedqty,
        issueQty: Number(editQty)
      });
      
      if (res.data.success) {
        setEditingItemId(null);
        setEditQty('');
        loadItems(activeIssueId);
      }
    } catch (e) {
      console.error('Failed to save item:', e);
      setErrorMsg(e.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!item.IssueItemID) return;
    if (!window.confirm('Are you sure you want to delete this issued item?')) return;
    
    setErrorMsg('');
    try {
      const res = await api.delete(`/shc-inter-facility-transfers/issues/items/${item.IssueItemID}`);
      if (res.data.success) {
        loadItems(activeIssueId);
      }
    } catch (e) {
      console.error('Failed to delete item:', e);
      setErrorMsg('Failed to delete item. It may have references.');
    }
  };

  const handleCompleteIssue = async () => {
    // Validation
    const issuedItems = items.filter(i => i.IssueQty > 0);
    if (issuedItems.length === 0) {
      setErrorMsg('Add at least one item before completing the issue.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to complete this issue? Status cannot be changed later.')) return;
    
    setErrorMsg('');
    try {
      const res = await api.post(`/shc-inter-facility-transfers/issues/${activeIssueId}/complete`);
      if (res.data.success) {
        alert('Status changed successfully');
        navigate('/inter-facility-shc-transfer');
      }
    } catch (e) {
      console.error('Failed to complete issue:', e);
      setErrorMsg('Failed to complete issue');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-4">
              
              <div className="flex justify-between items-center bg-[#dcfce7] border border-green-200 p-3 rounded-sm">
                <h1 className="text-sm font-bold text-slate-800">SHC Inter Facility Transfer</h1>
                <button
                  onClick={() => navigate('/inter-facility-shc-transfer')}
                  className="px-4 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
                >
                  Back to List
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-sm">
                  {errorMsg}
                </div>
              )}

              {/* Header Info Panel */}
              {headerInfo && (
                <div className="bg-white border border-slate-300 rounded-sm p-4 text-xs shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">To Facility</span>
                      <span className="text-slate-800">{headerInfo.facilityname}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">Indent No</span>
                      <span className="text-slate-800">{headerInfo.NOCNumber}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">Indent Date</span>
                      <span className="text-slate-800">{headerInfo.NOCDATE}</span>
                    </div>
                  </div>

                  <hr className="my-4 border-slate-200" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">Issue No</span>
                      {!headerSaved ? (
                         <span className="text-slate-500 italic block py-1">{issueNo}</span>
                      ) : (
                         <span className="font-mono text-slate-800 font-bold block py-1">{issueNo}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">Issue Date <span className="text-red-500">*</span></span>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        disabled={headerSaved}
                        className="w-full border border-slate-300 rounded-sm px-2 py-1 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">Remarks</span>
                      <input
                        type="text"
                        value={requestBy}
                        onChange={(e) => setRequestBy(e.target.value)}
                        disabled={headerSaved}
                        className="w-full border border-slate-300 rounded-sm px-2 py-1 focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      {!headerSaved ? (
                        <button
                          onClick={handleUpdateHeader}
                          className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 w-full"
                        >
                          Save Header
                        </button>
                      ) : (
                        <button
                          onClick={() => setHeaderSaved(false)}
                          className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-sm hover:bg-slate-300 w-full"
                        >
                          Edit Header
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items Grid */}
              {headerSaved && (
                <div className="border border-slate-300 rounded-sm bg-white overflow-hidden p-2">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <div className="inline-block border border-orange-400 border-b-white bg-white px-3 py-1 text-xs mb-[-1px] relative z-10 text-slate-700 font-bold">
                      Facility Transfer Items
                    </div>
                    <div>
                      <button
                        onClick={handleCompleteIssue}
                        className="px-4 py-1 text-xs font-bold text-white bg-green-600 rounded shadow-sm hover:bg-green-700 focus:outline-none"
                      >
                        Complete Issue
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-300">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-[#0f3b17] text-white">
                            <th className="px-3 py-2 border-r border-[#1a5c26] text-center w-12">SL</th>
                            <th className="px-3 py-2 border-r border-[#1a5c26] text-center">Item Code</th>
                            <th className="px-3 py-2 border-r border-[#1a5c26] text-left">Item Name</th>
                            <th className="px-3 py-2 border-r border-[#1a5c26] text-center">Requested Qty</th>
                            <th className="px-3 py-2 border-r border-[#1a5c26] text-center">Facility Stock</th>
                            <th className="px-3 py-2 border-r border-[#1a5c26] text-center">Issue Qty</th>
                            <th className="px-3 py-2 text-center w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                             <tr>
                               <td colSpan="7" className="px-4 py-8 text-center text-slate-400">Loading items...</td>
                             </tr>
                          ) : items.length === 0 ? (
                             <tr>
                               <td colSpan="7" className="px-4 py-8 text-center text-slate-400">No items requested for this indent</td>
                             </tr>
                          ) : (
                            items.map((item, idx) => {
                              const isEditing = editingItemId === item.ItemID;
                              const hasBeenIssued = item.IssueQty > 0 && item.IssueItemID;
                              
                              return (
                                <tr key={item.ItemID} className="border-b border-slate-200 hover:bg-slate-50">
                                  <td className="px-3 py-2 border-r border-slate-200 text-center">{idx + 1}</td>
                                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono">{item.ItemCode}</td>
                                  <td className="px-3 py-2 border-r border-slate-200">
                                    <div className="font-bold text-slate-700">{item.ItemName}</div>
                                    <div className="text-[10px] text-slate-500">{item.Strength} | {item.SKU}</div>
                                  </td>
                                  <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-slate-700">{item.requestedqty}</td>
                                  <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-blue-600">{item.CurStock}</td>
                                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        value={editQty}
                                        onChange={(e) => setEditQty(e.target.value)}
                                        className="w-20 px-2 py-1 border border-blue-500 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className={hasBeenIssued ? 'font-bold text-green-600' : 'text-slate-400'}>
                                        {hasBeenIssued ? item.IssueQty : '0'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleSaveItem(item)} className="text-green-600 hover:text-green-800" title="Save">
                                          <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700" title="Cancel">
                                          <XCircleIcon className="w-5 h-5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2">
                                        {hasBeenIssued ? (
                                          <>
                                            <button onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700" title="Edit">
                                              <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteItem(item)} className="text-red-500 hover:text-red-700" title="Delete">
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          </>
                                        ) : (
                                          <button onClick={() => handleEditItem(item)} className="text-green-600 hover:text-green-800" title="Add">
                                            <PlusIcon className="w-5 h-5" />
                                          </button>
                                        )}
                                      </div>
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
