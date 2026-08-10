import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon as SaveIcon } from '@heroicons/react/24/outline';
import * as api from '../../api/localPurchaseApi';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';

const ReceiptPage = () => {
  const { mode, id } = useParams(); // mode: 'create' or 'edit', id: poNoId or receiptId
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [headerData, setHeaderData] = useState(null);
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  
  // Tab 1: Items
  const [items, setItems] = useState([]);
  
  // Tab 2: Batches
  const [batchesByItem, setBatchesByItem] = useState([]);
  const [newBatchForm, setNewBatchForm] = useState({}); // keyed by receiptItemId

  useEffect(() => {
    fetchHeader();
  }, [mode, id]);

  useEffect(() => {
    if (headerData?.receiptId || mode === 'edit') {
      const recId = headerData?.receiptId || id;
      const poId = headerData?.poNoId;
      if (recId && poId) {
        fetchItems(recId, poId);
        fetchBatches(recId);
      }
    } else if (headerData?.poNoId) {
      // Create mode, but no receipt saved yet. Fetch items with receiptId = 0
      fetchItems(0, headerData.poNoId);
    }
  }, [headerData]);

  const fetchHeader = async () => {
    try {
      const data = await api.getReceiptHeaderData(mode, id);
      setHeaderData(data);
      if (data?.receiptNo) setReceiptNo(data.receiptNo);
      if (data?.receiptDate) setReceiptDate(data.receiptDate);
    } catch (err) {
      console.error(err);
      alert('Failed to load header data');
    }
  };

  const fetchItems = async (recId, poId) => {
    try {
      const data = await api.getReceiptItems(recId, poId);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async (recId) => {
    try {
      const data = await api.getReceiptBatches(recId);
      setBatchesByItem(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveHeader = async () => {
    try {
      const payload = {
        receiptId: headerData.receiptId,
        poNoId: headerData.poNoId,
        sourceId: headerData.sourceId,
        schemeId: headerData.schemeId,
        supplierId: headerData.supplierId,
        receiptNo,
        receiptDate
      };
      const res = await api.saveReceiptHeader(payload);
      alert('Header saved successfully!');
      if (mode === 'create' && res.receiptId) {
        navigate(`/local-purchase/receipts/edit/${res.receiptId}`, { replace: true });
      } else {
        fetchHeader();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save header');
    }
  };

  const handleItemQtyChange = (index, val) => {
    const newItems = [...items];
    newItems[index].receiptAbsQty = val === '' ? '' : parseInt(val, 10);
    setItems(newItems);
  };

  const handleSaveItems = async () => {
    if (!headerData?.receiptId && mode === 'create') {
      alert('Please save the receipt header first (Receipt No & Date).');
      return;
    }
    try {
      await api.saveReceiptItems(headerData.receiptId, items);
      alert('Items saved successfully!');
      fetchItems(headerData.receiptId, headerData.poNoId);
      fetchBatches(headerData.receiptId);
    } catch (err) {
      console.error(err);
      alert('Failed to save items');
    }
  };

  const handleBatchFormChange = (receiptItemId, field, val) => {
    setNewBatchForm(prev => ({
      ...prev,
      [receiptItemId]: {
        ...(prev[receiptItemId] || {}),
        [field]: val
      }
    }));
  };

  const handleSaveBatch = async (itemGroup) => {
    const form = newBatchForm[itemGroup.receiptItemId];
    if (!form || !form.batchNo || !form.mfgDate || !form.expDate || !form.qty) {
      alert('Please fill out Batch No, Mfg Date, Exp Date, and Quantity.');
      return;
    }
    try {
      const payload = {
        receiptItemId: itemGroup.receiptItemId,
        itemId: itemGroup.itemId,
        batchNo: form.batchNo,
        stockLocation: form.stockLocation || '',
        mfgDate: form.mfgDate,
        expDate: form.expDate,
        qty: parseInt(form.qty, 10)
      };
      await api.saveReceiptBatch(headerData.receiptId, payload);
      alert('Batch saved successfully!');
      setNewBatchForm(prev => ({ ...prev, [itemGroup.receiptItemId]: {} }));
      fetchBatches(headerData.receiptId);
    } catch (err) {
      console.error(err);
      alert('Failed to save batch');
    }
  };

  const handleDeleteBatch = async (inwNo) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await api.deleteReceiptBatch(inwNo);
      alert('Batch deleted!');
      fetchBatches(headerData.receiptId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete batch');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to complete this receipt?')) return;
    try {
      const res = await api.completeReceipt(headerData.receiptId);
      alert(`Receipt completed successfully! MRC Number: ${res.mrcNumber}`);
      fetchHeader();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to complete receipt');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
            {!headerData ? (
              <div className="p-8 flex justify-center items-center h-full text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-indigo-200 rounded-full mb-4"></div>
                  Loading receipt data...
                </div>
              </div>
            ) : (
              <>
            {/* Page Title & Back Button (Sticky) */}
            <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/local-purchase/receipts-from-supplier')}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Supplier Receipt {mode === 'create' ? '(Create)' : '(Edit)'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {headerData.status === 'C' ? (
                      <span className="text-green-600 font-semibold">Completed ({headerData.mrcNumber})</span>
                    ) : (
                      <span className="text-orange-500 font-semibold">Incomplete</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
              
              {/* Header Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <h2 className="font-semibold text-gray-700">Receipt Details</h2>
                  {headerData.status !== 'C' && (
                    <button 
                      onClick={handleSaveHeader}
                      className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition"
                    >
                      <SaveIcon className="mr-2 w-4 h-4" /> Save Header
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Fin Year</label>
                    <div className="font-medium text-gray-800">{headerData.accYear}</div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Supply Order No</label>
                    <div className="font-medium text-gray-800">{headerData.poNo}</div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Order Date</label>
                    <div className="font-medium text-gray-800">{headerData.poDate}</div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Supplier</label>
                    <div className="font-medium text-gray-800">{headerData.supplierName}</div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs mb-1">Source / Scheme</label>
                    <div className="font-medium text-gray-800">{headerData.sourceName} / {headerData.schemeName}</div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Receipt No *</label>
                    <input 
                      type="text" 
                      value={receiptNo} 
                      onChange={(e) => setReceiptNo(e.target.value)}
                      disabled={headerData.status === 'C'}
                      className="w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Receipt Date * (DD-MM-YYYY)</label>
                    <input 
                      type="text" 
                      value={receiptDate} 
                      onChange={(e) => setReceiptDate(e.target.value)}
                      disabled={headerData.status === 'C'}
                      placeholder="DD-MM-YYYY"
                      className="w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Tabs Container */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b">
                  {['Receipt Items', 'Batches', 'General'].map((tab, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === idx 
                          ? 'border-b-2 border-indigo-600 text-indigo-600' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  
                  {/* TAB 1: ITEMS */}
                  {activeTab === 0 && (
                    <div>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                              <th className="p-3 font-medium">SNo</th>
                              <th className="p-3 font-medium">Item Code/Name</th>
                              <th className="p-3 font-medium text-right">Ordered Qty</th>
                              <th className="p-3 font-medium text-right">Prev Received</th>
                              <th className="p-3 font-medium text-right">Balance Qty</th>
                              <th className="p-3 font-medium text-right bg-indigo-50/50">Receipt Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-gray-700">
                            {items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="p-3">{idx + 1}</td>
                                <td className="p-3 font-medium">{item.itemName}</td>
                                <td className="p-3 text-right">{item.orderedQty}</td>
                                <td className="p-3 text-right">{item.receivedQty}</td>
                                <td className="p-3 text-right text-orange-600">{item.balanceQty}</td>
                                <td className="p-3 text-right bg-indigo-50/50">
                                  <input 
                                    type="number"
                                    min="0"
                                    disabled={headerData.status === 'C'}
                                    value={item.receiptAbsQty || ''}
                                    onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                                    className="w-24 text-right border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-transparent disabled:border-none disabled:font-bold"
                                  />
                                </td>
                              </tr>
                            ))}
                            {items.length === 0 && (
                              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No items found.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {headerData.status !== 'C' && (
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={handleSaveItems}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded shadow hover:bg-indigo-700 transition"
                          >
                            <SaveIcon className="mr-2 w-4 h-4" /> Save Items
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: BATCHES */}
                  {activeTab === 1 && (
                    <div className="space-y-6">
                      {batchesByItem.length === 0 && (
                        <div className="text-center text-gray-500 p-8 border rounded-lg bg-gray-50">
                          No received items found. Please save receipt quantities in the 'Receipt Items' tab first.
                        </div>
                      )}
                      {batchesByItem.map((itemGroup, idx) => {
                        const form = newBatchForm[itemGroup.receiptItemId] || {};
                        return (
                          <div key={idx} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 font-medium text-gray-800 border-b">
                              {itemGroup.itemName}
                            </div>
                            <div className="p-0 overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 border-b">
                                  <tr>
                                    <th className="p-2 font-medium w-32">Mfg Date</th>
                                    <th className="p-2 font-medium w-32">Exp Date</th>
                                    <th className="p-2 font-medium">Batch No</th>
                                    <th className="p-2 font-medium">Stock Location</th>
                                    <th className="p-2 font-medium text-right w-24">Qty</th>
                                    <th className="p-2 font-medium w-24 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y text-gray-700">
                                  {itemGroup.batches.map((batch, bIdx) => (
                                    <tr key={bIdx} className="hover:bg-gray-50">
                                      <td className="p-2">{batch.mfgDate}</td>
                                      <td className="p-2">{batch.expDate}</td>
                                      <td className="p-2">{batch.batchNo}</td>
                                      <td className="p-2">{batch.stockLocation}</td>
                                      <td className="p-2 text-right font-medium">{batch.qty}</td>
                                      <td className="p-2 text-center">
                                        {headerData.status !== 'C' && (
                                          <button 
                                            onClick={() => handleDeleteBatch(batch.inwNo)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded"
                                          >
                                            <TrashIcon className="w-4 h-4" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                  {/* New Batch Row */}
                                  {headerData.status !== 'C' && (
                                    <tr className="bg-blue-50/30">
                                      <td className="p-2">
                                        <input 
                                          type="text" 
                                          placeholder="MM/YYYY" 
                                          value={form.mfgDate || ''}
                                          onChange={(e) => handleBatchFormChange(itemGroup.receiptItemId, 'mfgDate', e.target.value)}
                                          className="w-full border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input 
                                          type="text" 
                                          placeholder="MM/YYYY" 
                                          value={form.expDate || ''}
                                          onChange={(e) => handleBatchFormChange(itemGroup.receiptItemId, 'expDate', e.target.value)}
                                          className="w-full border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input 
                                          type="text" 
                                          placeholder="Batch No" 
                                          value={form.batchNo || ''}
                                          onChange={(e) => handleBatchFormChange(itemGroup.receiptItemId, 'batchNo', e.target.value)}
                                          className="w-full border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input 
                                          type="text" 
                                          placeholder="Location" 
                                          value={form.stockLocation || ''}
                                          onChange={(e) => handleBatchFormChange(itemGroup.receiptItemId, 'stockLocation', e.target.value)}
                                          className="w-full border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <input 
                                          type="number" 
                                          min="1"
                                          placeholder="Qty" 
                                          value={form.qty || ''}
                                          onChange={(e) => handleBatchFormChange(itemGroup.receiptItemId, 'qty', e.target.value)}
                                          className="w-full border rounded px-2 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <button 
                                          onClick={() => handleSaveBatch(itemGroup)}
                                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                                        >
                                          <PlusIcon className="w-3 h-3 inline mr-1" /> Add
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 3: GENERAL */}
                  {activeTab === 2 && (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="p-6 border rounded-lg bg-gray-50 text-center space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Completion Status</h3>
                        
                        {headerData.status === 'C' ? (
                          <div className="p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center font-bold text-lg">
                            <CheckIcon className="mr-2 w-5 h-5 inline" /> Receipt Completed (MRC: {headerData.mrcNumber})
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600 mb-4">
                              Please ensure that all received quantities have been correctly distributed into batches.
                              The total batch quantity must exactly match the receipt quantity for each item.
                            </p>
                            <button 
                              onClick={handleComplete}
                              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition w-full flex justify-center items-center"
                            >
                              <CheckIcon className="mr-2 w-5 h-5 inline" /> Verify & Complete Receipt
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            </>
            )}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
