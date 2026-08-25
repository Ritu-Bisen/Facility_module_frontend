import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { getSuppliers, getNocDetailsApi, getNocBalanceApi, getSupplyOrderDetails, getBudgets } from '../../api/localPurchaseApi';
import { generateSupplyOrderPDF } from '../../utils/supplyOrderPdfGenerator';
import { getWardIssueAccYears, getLocalItems, getTenders } from '../../api/contractApi';
import { 
  saveAyushHeader, 
  getAyushOrderDetails, 
  generateAyushPoNo, 
  getAyushOrderItems, 
  addAyushOrderItem, 
  deleteAyushOrderItem, 
  deleteAyushOrderApi,
  completeAyushOrderApi,
  amendAyushOrderApi
} from '../../api/ayushLocalPurchaseApi';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  PlusIcon, 
  DocumentTextIcon,
  Squares2X2Icon,
  PaperAirplaneIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ListBulletIcon
} from '@heroicons/react/24/solid';

export default function AddAyushLocalPurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  // Header State
  const [finYear, setFinYear] = useState('');
  const [finYearsList, setFinYearsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [status, setStatus] = useState('Incomplete');
  const [isHeaderSaved, setIsHeaderSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contractNo, setContractNo] = useState('');
  const [tenderNo, setTenderNo] = useState('');
  const [fund, setFund] = useState('');
  const [tendersList, setTendersList] = useState([]);
  const [fundsList, setFundsList] = useState([]);

  // Items State
  const [localItemsList, setLocalItemsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState('');
  const [basicRate, setBasicRate] = useState('');
  const [gst, setGst] = useState('0');
  const [manufacturer, setManufacturer] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // NOC Details State
  const [nocList, setNocList] = useState([]);
  const [selectedNoc, setSelectedNoc] = useState('');
  const [nocBalance, setNocBalance] = useState(null);

  // Tab & Complete State
  const [activeTab, setActiveTab] = useState('items');
  const [dispatchNo, setDispatchNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [contractNoState, setContractNoState] = useState(''); // Just to avoid unused var issues, though we declared contractNo above
  const [supplierName, setSupplierName] = useState('');

  const isPOCompleted = status === 'Order Placed' || status === 'Completed';

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  // Fetch NOC Details when item selection changes
  useEffect(() => {
    if (selectedItemId) {
      const fetchNocs = async () => {
        try {
          const res = await getNocDetailsApi(selectedItemId);
          setNocList(res || []);
        } catch (err) {
          console.error('Failed to load NOCs', err);
          setNocList([]);
        }
      };
      fetchNocs();
    } else {
      setNocList([]);
    }
    setSelectedNoc('');
    setNocBalance(null);
  }, [selectedItemId]);

  // Fetch NOC Balance when selected NOC changes
  useEffect(() => {
    if (selectedNoc && selectedItemId) {
      const fetchNocBalance = async () => {
        try {
          const res = await getNocBalanceApi(selectedNoc, selectedItemId);
          setNocBalance(res);
        } catch (err) {
          console.error('Failed to load NOC balance', err);
          setNocBalance(null);
        }
      };
      fetchNocBalance();
    } else {
      setNocBalance(null);
    }
  }, [selectedNoc, selectedItemId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch financial years
      const years = await getWardIssueAccYears();
      setFinYearsList(years || []);
      
      // Default to 2026-2027 if possible
      let defaultFinYearId = '';
      if (years && years.length > 0) {
        const isArr = Array.isArray(years[0]);
        const currentStr = '2026-2027';
        const exists = years.find(y => (isArr ? y[1] : (y.SHACCYEAR || y.ACCYEAR)) === currentStr);
        defaultFinYearId = exists 
          ? (isArr ? exists[0].toString() : (exists.ACCYRSETID || exists.accyrsetid).toString())
          : (isArr ? years[0][0].toString() : (years[0].ACCYRSETID || years[0].accyrsetid).toString());
        setFinYear(defaultFinYearId);
      }

      // 2. Fetch suppliers
      const suppliersRes = await getSuppliers();
      setSuppliersList(suppliersRes.data || []);

      // 3. Fetch local items, funds, and tenders
      const [itemsRes, fundsRes, tendersRes] = await Promise.all([
        getLocalItems(),
        getBudgets(),
        getTenders(defaultFinYearId)
      ]);
      setLocalItemsList(itemsRes || []);
      setFundsList(fundsRes?.data || []);
      setTendersList(tendersRes?.data || []);

      // 4. Load order if in Edit mode
      if (id) {
        const orderRes = await getAyushOrderDetails(id);
        if (orderRes && orderRes.success && orderRes.data) {
          const order = orderRes.data;
          setFinYear(order.finYearId.toString());
          setSelectedSupplier(order.supplierId.toString());
          setPoNo(order.poNo);
          setPoDate(order.date);
          setStatus(order.status);
          setIsHeaderSaved(true);
          setAddedItems(order.items || []);
          if (order.dispatchNo) setDispatchNo(order.dispatchNo);
          if (order.dispatchDate) setDispatchDate(order.dispatchDate);
          if (order.contractNo) setContractNo(order.contractNo);
          if (order.tenderNo) setTenderNo(order.tenderNo);
          if (order.categoryId) setFund(order.categoryId.toString());
          if (order.supplierName) setSupplierName(order.supplierName);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePoNo = async () => {
    if (!finYear) {
      toast.error('Please select a financial year first');
      return;
    }
    try {
      const res = await generateAyushPoNo(finYear);
      if (res && res.success) {
        setPoNo(res.poNo);
        toast.success('PO Number generated successfully');
      } else {
        toast.error('Failed to generate PO number');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error generating PO number');
    }
  };

  const handleSaveHeader = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSupplier || !poDate || !poNo || !finYear || !contractNo || !tenderNo || !fund) {
      toast.error('Please fill all header fields (including Contract No, Tender, and Fund) and generate a PO Number');
      return;
    }

    setIsSavingHeader(true);
    try {
      const supplierObj = suppliersList.find(s => s.lpSupplierId.toString() === selectedSupplier.toString());
      const data = {
        id: id || null,
        supplierId: selectedSupplier,
        supplierName: supplierObj ? supplierObj.supplierName : '',
        date: poDate,
        poNo,
        finYearId: finYear,
        contractNo: contractNo,
        tenderNo: tenderNo,
        contractDate: poDate,
        fundId: fund
      };

      const res = await saveAyushHeader(data);
      if (res && res.success) {
        toast.success(id ? 'Header updated successfully' : 'Header saved successfully');
        setIsHeaderSaved(true);
        setSupplierName(supplierObj ? supplierObj.supplierName : '');
        // We already have contractNo, tenderNo, fund in state, so they don't need reset
        if (!id && res.poNoId) {
          navigate(`/local-purchase/ayush-local-purchase/edit/${res.poNoId}`);
        }
      } else {
        toast.error(res.message || 'Failed to save header');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving header details');
    } finally {
      setIsSavingHeader(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      const res = await deleteAyushOrderApi(id);
      if (res && res.success) {
        toast.success('Order deleted successfully');
        navigate('/local-purchase/ayush-local-purchase');
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting order');
    }
  };

  const handleCompletePO = async () => {
    if (!id) return;
    const today = new Date().toISOString().split('T')[0];
    if (dispatchDate > today) {
      toast.error('Dispatch date cannot be in the future');
      return;
    }
    setIsCompleting(true);
    try {
      await completeAyushOrderApi(id, {
        dispatchNo,
        dispatchDate
      });
      toast.success('Supply Order completed successfully');
      navigate('/local-purchase/ayush-local-purchase');
    } catch (error) {
      toast.error('Failed to complete Supply Order');
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAmendPO = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to amend this supply order?')) return;
    try {
      await amendAyushOrderApi(id);
      toast.success('Supply order amended successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to amend supply order');
      console.error(error);
    }
  };

  const handleDownloadPO = async () => {
    if (!id) return;
    try {
      const response = await getSupplyOrderDetails(id);
      if (response && response.success && response.data) {
        generateSupplyOrderPDF(response.data, user);
      } else {
        toast.error('Failed to load PDF details');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  // Item Calculations
  const selectedItem = localItemsList.find(item => item.id.toString() === selectedItemId.toString());

  const getCalculatedPrice = () => {
    const br = parseFloat(basicRate) || 0;
    const gstPercent = parseFloat(gst) || 0;
    return (br + (br * gstPercent / 100)).toFixed(2);
  };

  const getCalculatedTotal = () => {
    const quantity = parseFloat(qty) || 0;
    const unitPrice = parseFloat(getCalculatedPrice()) || 0;
    return (quantity * unitPrice).toFixed(2);
  };

  const handleAddItem = async () => {
    if (!selectedItemId || !qty || !basicRate) {
      toast.error('Please select an item, and enter both quantity and basic rate');
      return;
    }

    // NOC limit validation
    if (nocBalance && parseFloat(qty) > (nocBalance.balQyy || 0)) {
      toast.error(`Order quantity cannot exceed Balance Qty (${nocBalance.balQyy})`);
      return;
    }

    setIsAddingItem(true);
    try {
      const unitPrice = getCalculatedPrice();
      const totalAmount = getCalculatedTotal();
      
      const itemData = {
        lpItemId: selectedItemId,
        itemName: selectedItem.name,
        strength: selectedItem.strength || '—',
        sku: selectedItem.unit || '—',
        type: selectedItem.mCategory || '—',
        packQty: selectedItem.packQty || '—',
        isEdl: selectedItem.isEdl === 'Y' ? 'EDL' : 'Non-EDL',
        qty,
        basicRate,
        gst,
        unitPrice,
        totalAmount,
        nocDetail: selectedNoc,
        manufacturer
      };

      const res = await addAyushOrderItem(id, itemData);
      if (res && res.success) {
        toast.success('Item saved to order successfully');
        setAddedItems([...addedItems, res.data]);
        
        // Reset Item selection fields
        setSelectedItemId('');
        setQty('');
        setBasicRate('');
        setGst('0');
        setSelectedNoc('');
        setManufacturer('');
        setNocBalance(null);
      } else {
        toast.error(res.message || 'Failed to add item');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error adding item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (orderItemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    try {
      const res = await deleteAyushOrderItem(id, orderItemId);
      if (res && res.success) {
        toast.success('Item removed successfully');
        setAddedItems(addedItems.filter(i => (i.orderItemId || i.lpItemId).toString() !== orderItemId.toString()));
      } else {
        toast.error('Failed to remove item');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error removing item');
    }
  };

  const calculateTotalOrderVal = () => {
    return addedItems.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-[95%] mx-auto space-y-6">
              
              {/* Header bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate('/local-purchase/ayush-local-purchase')}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                      {id ? 'Edit AYUSH Local Purchase Order' : 'Create AYUSH Local Purchase Order'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">AYUSH / Direct Supply Order</p>
                  </div>
                </div>
              </div>

              {/* Header form details */}
              <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                {isLoading ? (
                  <div className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="p-6">
                    <h3 className="text-md font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                      Purchase Order Header
                    </h3>

                    <form onSubmit={handleSaveHeader} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Financial Year <span className="text-red-500">*</span></label>
                        <select
                          className="w-full border border-gray-300 bg-gray-50 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                          value={finYear}
                          onChange={(e) => setFinYear(e.target.value)}
                          disabled={isHeaderSaved}
                        >
                          <option value="">Select Year</option>
                          {finYearsList.map((y, idx) => {
                            const isArr = Array.isArray(y);
                            const idVal = isArr ? y[0] : (y.ACCYRSETID || y.accyrsetid);
                            const nameVal = isArr ? y[1] : (y.SHACCYEAR || y.ACCYEAR || y.shaccyear || y.accyear);
                            return (
                              <option key={idVal || idx} value={idVal}>
                                {nameVal}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                        <select
                          className="w-full border border-gray-300 bg-gray-50 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                          value={selectedSupplier}
                          onChange={(e) => setSelectedSupplier(e.target.value)}
                          disabled={isHeaderSaved}
                        >
                          <option value="">Select Supplier</option>
                          {suppliersList.map(s => (
                            <option key={s.lpSupplierId} value={s.lpSupplierId}>
                              {s.supplierName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Contract No <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter Contract No"
                          className="w-full border border-gray-300 bg-gray-50 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                          value={contractNo}
                          onChange={(e) => setContractNo(e.target.value)}
                          disabled={isHeaderSaved}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tender/Quotation <span className="text-red-500">*</span></label>
                        <select
                          className="w-full border border-gray-300 bg-gray-50 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                          value={tenderNo}
                          onChange={(e) => setTenderNo(e.target.value)}
                          disabled={isHeaderSaved}
                        >
                          <option value="">Select Tender</option>
                          {tendersList.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fund <span className="text-red-500">*</span></label>
                        <select
                          className="w-full border border-gray-300 bg-gray-50 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                          value={fund}
                          onChange={(e) => setFund(e.target.value)}
                          disabled={isHeaderSaved}
                        >
                          <option value="">Select Fund</option>
                          {fundsList.map(f => (
                            <option key={f.budgetId} value={f.budgetId}>{f.budgetName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">PO Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 bg-gray-50 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                          value={poDate}
                          onChange={(e) => setPoDate(e.target.value)}
                          disabled={isHeaderSaved}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">PO Number <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Generate PO Number"
                            className="flex-1 border border-gray-300 bg-gray-100 rounded px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none"
                            value={poNo}
                            readOnly
                          />
                          {!isHeaderSaved && (
                            <button
                              type="button"
                              onClick={handleGeneratePoNo}
                              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Header saved summary section */}
                      {isHeaderSaved && (
                        <div className="md:col-span-4 mt-2 border-t border-gray-200 pt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Items in PO</span>
                            <span className="text-xs font-bold text-[#1e3a8a]">{addedItems.length}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Order Value</span>
                            <span className="text-xs font-bold text-blue-800">{formatCurrency(calculateTotalOrderVal())}</span>
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-4 flex justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
                        {!isHeaderSaved ? (
                          <button
                            type="submit"
                            disabled={isSavingHeader}
                            className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm transition-all"
                          >
                            {isSavingHeader ? 'Saving...' : 'Save Details'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsHeaderSaved(false)}
                              disabled={isPOCompleted}
                              className="px-5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm transition-all disabled:bg-gray-300 disabled:text-gray-500"
                            >
                              Edit Header
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteOrder}
                              disabled={isPOCompleted}
                              className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-all disabled:bg-gray-300 disabled:text-gray-500"
                            >
                              Delete Order
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Items Entry and Listing table */}
              {isHeaderSaved && (
                <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                  
                  {/* Tab Selector */}
                  <div className="flex border-b border-gray-300 bg-gray-100 px-4 pt-2">
                    <button 
                      onClick={() => setActiveTab('items')}
                      className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'items' ? 'border-blue-700 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                      <ListBulletIcon className="w-4 h-4" />
                      Items
                    </button>
                    <button 
                      onClick={() => setActiveTab('general')}
                      className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'general' ? 'border-blue-700 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      General
                    </button>
                  </div>

                  {activeTab === 'items' && (
                    <>
                      <div className="bg-[#e2edf7] border-b border-blue-800 px-4 py-2 flex items-center justify-between">
                        <span className="font-bold text-gray-800 text-sm">Purchase Order Items</span>
                        <span className="text-xs font-semibold text-slate-700">
                          Total Order Value: <strong className="text-blue-800">{formatCurrency(calculateTotalOrderVal())}</strong>
                        </span>
                      </div>

                      <div className="p-4">
                        {/* Select Item specifications picker */}
                        {!isPOCompleted && (
                          <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                              
                              {/* Category filter */}
                              <div>
                                <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">Filter Category</label>
                                <Select
                                  className="text-xs"
                                  placeholder="Select Category"
                                  isClearable
                                  options={[...new Set(localItemsList.map(item => item.mCategory))].filter(Boolean).map(cat => ({ value: cat, label: cat }))}
                                  value={selectedCategory ? { value: selectedCategory, label: selectedCategory } : null}
                                  onChange={(opt) => {
                                    setSelectedCategory(opt ? opt.value : '');
                                    setSelectedItemId('');
                                  }}
                                />
                              </div>

                              {/* Searchable Item dropdown */}
                              <div className="md:col-span-3">
                                <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">Select Item <span className="text-red-500">*</span></label>
                                <Select
                                  className="text-xs"
                                  placeholder="Type to search local item..."
                                  options={localItemsList
                                    .filter(item => !selectedCategory || item.mCategory === selectedCategory)
                                    .map(item => ({
                                      value: item.id.toString(),
                                      label: `${item.itemCode} - ${item.name}`
                                    }))
                                  }
                                  value={selectedItemId ? {
                                    value: selectedItemId,
                                    label: `${selectedItem?.itemCode} - ${selectedItem?.name}`
                                  } : null}
                                  onChange={(opt) => setSelectedItemId(opt ? opt.value : '')}
                                />
                              </div>
                            </div>

                            {/* Display Selected Item Details */}
                            <div className="mt-4 border-t border-gray-200 pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 shrink-0">
                                  <DocumentTextIcon className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-semibold text-slate-800">
                                  {selectedItem ? `${selectedItem.itemCode} - ${selectedItem.name}` : <span className="text-slate-400 italic">Select an item from above to load specs...</span>}
                                </span>
                              </div>

                              {selectedItem ? (
                                <div className="flex flex-wrap text-xs text-slate-500 gap-x-6 gap-y-1 bg-white border border-gray-200 rounded p-2 px-3">
                                  <span><strong>Strength:</strong> {selectedItem.strength || '—'}</span>
                                  <span><strong>SKU (Unit):</strong> {selectedItem.unit || '—'}</span>
                                  <span><strong>Type:</strong> {selectedItem.mCategory || '—'}</span>
                                  <span><strong>PackQty:</strong> {selectedItem.packQty || '—'}</span>
                                  <span>
                                    <strong>EDL Type:</strong>{' '}
                                    <span className={selectedItem.isEdl === 'Y' ? 'text-blue-700 font-bold' : 'text-slate-600'}>
                                      {selectedItem.isEdl === 'Y' ? 'EDL' : 'Non-EDL'}
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded p-2 px-3">
                                  <div>Strength: —</div>
                                  <div>SKU: —</div>
                                  <div>Type: —</div>
                                  <div>PackQty: —</div>
                                </div>
                              )}
                            </div>

                            {/* Qty, Rate input controls */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-8 gap-4 items-end border-t border-gray-200 pt-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Make/Brand</label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600 bg-white"
                                  value={manufacturer}
                                  onChange={(e) => setManufacturer(e.target.value)}
                                  placeholder="Make/Brand"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Enter Qty <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600 bg-white"
                                  value={qty}
                                  onChange={(e) => setQty(e.target.value)}
                                  placeholder="Qty"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Basic Rate <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600 bg-white"
                                  value={basicRate}
                                  onChange={(e) => setBasicRate(e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Select GST <span className="text-red-500">*</span></label>
                                <select
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600 bg-white"
                                  value={gst}
                                  onChange={(e) => setGst(e.target.value)}
                                >
                                  <option value="0">0%</option>
                                  <option value="5">5%</option>
                                  <option value="12">12%</option>
                                  <option value="18">18%</option>
                                  <option value="28">28%</option>
                                </select>
                              </div>

                              {/* NOC Detail selection field */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">NOC Detail</label>
                                {nocList.length > 0 ? (
                                  <Select
                                    options={nocList.map(noc => ({
                                      value: noc.nocId.toString(),
                                      label: noc.nocNumberStr
                                    }))}
                                    value={selectedNoc ? {
                                      value: selectedNoc,
                                      label: nocList.find(n => n.nocId.toString() === selectedNoc.toString())?.nocNumberStr || selectedNoc
                                    } : null}
                                    onChange={(opt) => setSelectedNoc(opt ? opt.value : '')}
                                    placeholder="Select NOC..."
                                    isClearable
                                    className="text-xs"
                                  />
                                ) : (
                                  <input 
                                    type="text"
                                    value={selectedNoc}
                                    onChange={(e) => setSelectedNoc(e.target.value)}
                                    placeholder="NOC No."
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600 bg-white"
                                  />
                                )}
                                {nocBalance && (
                                  <div className="mt-1 text-[9px] text-blue-700 bg-blue-50 p-0.5 rounded leading-none">
                                    Bal: <span className={nocBalance.balQyy < parseFloat(qty || 0) ? "text-red-600 font-bold" : "text-blue-600"}>{nocBalance.balQyy}</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Price</label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 bg-gray-100 rounded px-2 py-1 text-xs font-semibold text-gray-700 outline-none text-right"
                                  value={formatCurrency(getCalculatedPrice())}
                                  readOnly
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Amount</label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 bg-gray-100 rounded px-2 py-1 text-xs font-bold text-gray-800 outline-none text-right"
                                  value={formatCurrency(getCalculatedTotal())}
                                  readOnly
                                />
                              </div>

                              <div>
                                <button
                                  type="button"
                                  onClick={handleAddItem}
                                  disabled={isAddingItem || !selectedItemId || !qty || !basicRate}
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save Item
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Items List Table */}
                        <div className="border border-gray-300 rounded overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#0f172a] text-white">
                              <tr>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-12">Sl.</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-left border-r border-slate-700">Item Name / Code</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-left border-r border-slate-700 w-24">Make/Brand</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-24">Strength</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-20">SKU</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-20">Type</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-20">PackQty</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-24">EDL Type</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-left border-r border-slate-700 w-32">NOC Detail</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-right border-r border-slate-700 w-20">Qty</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-right border-r border-slate-700 w-24">Basic Rate</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center border-r border-slate-700 w-16">GST</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-right border-r border-slate-700 w-24">Unit Price</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-right border-r border-slate-700 w-28">Total Amount</th>
                                <th className="px-3 py-1.5 text-[11px] font-bold uppercase text-center w-16">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {addedItems.length === 0 ? (
                                <tr>
                                  <td colSpan="15" className="px-4 py-6 text-center text-xs text-slate-400 italic">
                                    No items added to this purchase order yet.
                                  </td>
                                </tr>
                              ) : (
                                addedItems.map((item, idx) => (
                                  <tr key={item.orderItemId || idx} className="hover:bg-slate-50 text-xs border-b border-gray-200 last:border-b-0">
                                    <td className="px-3 py-1 text-center text-xs text-slate-700 border-r border-slate-200">{idx + 1}</td>
                                    <td className="px-3 py-1 text-xs font-semibold text-slate-800 border-r border-slate-200">{item.itemName}</td>
                                    <td className="px-3 py-1 text-xs text-slate-700 border-r border-slate-200">{item.manufacturer || '—'}</td>
                                    <td className="px-3 py-1 text-center text-xs text-slate-600 border-r border-slate-200">{item.strength}</td>
                                    <td className="px-3 py-1 text-center text-xs text-slate-600 border-r border-slate-200">{item.sku}</td>
                                    <td className="px-3 py-1 text-center text-xs text-slate-600 border-r border-slate-200">{item.type}</td>
                                    <td className="px-3 py-1 text-center text-xs text-slate-600 border-r border-slate-200">{item.packQty}</td>
                                    <td className="px-3 py-1 text-center text-xs border-r border-slate-200">
                                      <span className={item.isEdl === 'EDL' ? 'text-blue-700 font-semibold' : 'text-slate-600'}>
                                        {item.isEdl}
                                      </span>
                                    </td>
                                    <td className="px-3 py-1 text-xs text-slate-700 border-r border-slate-200">{item.nocDetail || '—'}</td>
                                    <td className="px-3 py-1 text-right text-xs text-slate-700 border-r border-slate-200">{item.qty}</td>
                                    <td className="px-3 py-1 text-right text-xs text-slate-700 border-r border-slate-200">{formatCurrency(item.basicRate)}</td>
                                    <td className="px-3 py-1 text-center text-xs text-slate-700 border-r border-slate-200">{item.gst}%</td>
                                    <td className="px-3 py-1 text-right text-xs text-slate-700 border-r border-slate-200">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-3 py-1 text-right text-xs font-medium text-slate-900 border-r border-slate-200">{formatCurrency(item.totalAmount)}</td>
                                    <td className="px-3 py-1 text-center">
                                      {!isPOCompleted && (
                                        <button
                                          onClick={() => handleDeleteItem(item.orderItemId)}
                                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                          title="Delete Item"
                                        >
                                          <TrashIcon className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t border-gray-300">
                              <tr>
                                <td colSpan="13" className="px-3 py-2 text-right text-xs text-slate-700 border-r border-slate-200">Grand Total:</td>
                                <td className="px-3 py-2 text-right text-xs text-blue-800 border-r border-slate-200">
                                  {formatCurrency(calculateTotalOrderVal())}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Cancel / Close buttons at bottom */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => navigate('/local-purchase/ayush-local-purchase')}
                            className="px-5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-semibold shadow-sm transition-all"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'general' && (
                    <div className="p-6 space-y-6">
                      <div className="bg-gray-50 border border-gray-300 rounded p-5">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                          <PaperAirplaneIcon className="w-4 h-4 text-blue-700" />
                          Dispatch PO
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch No <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={dispatchNo}
                              onChange={(e) => setDispatchNo(e.target.value)}
                              disabled={isPOCompleted}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60 font-bold"
                              placeholder="Enter Dispatch No"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch Date <span className="text-red-500">*</span></label>
                            <input 
                              type="date" 
                              value={dispatchDate}
                              onChange={(e) => setDispatchDate(e.target.value)}
                              disabled={isPOCompleted}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-60 font-bold"
                            />
                          </div>
                          
                          <div>
                            <button 
                              onClick={handleCompletePO}
                              disabled={isCompleting || !dispatchNo || !dispatchDate || isPOCompleted}
                              className="w-full px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <PaperAirplaneIcon className="w-3.5 h-3.5" />
                              {isCompleting ? 'Completing...' : 'Complete PO'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="flex justify-center gap-4 py-4 border-t border-gray-200">
                        <button 
                          onClick={handleDownloadPO}
                          className="px-5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 text-gray-500" />
                          Download PO
                        </button>
                        <button 
                          onClick={handleDeleteOrder}
                          disabled={isPOCompleted}
                          className="px-5 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <TrashIcon className="w-4 h-4 text-red-500" />
                          Delete
                        </button>
                        <button 
                          onClick={handleAmendPO}
                          disabled={!isPOCompleted}
                          className="px-5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <PlusIcon className="w-4 h-4 text-gray-500" />
                          Amend
                        </button>
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
