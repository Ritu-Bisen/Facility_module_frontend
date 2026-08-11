import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import { CalendarIcon, CurrencyRupeeIcon, DocumentTextIcon, BuildingOffice2Icon, PaperAirplaneIcon, ArrowPathIcon, PlusIcon, TrashIcon, ArrowLeftIcon, PencilSquareIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { getSuppliers, getBudgets, getSupplyOrderDetails, getSupplyOrderEditDetails, generateSupplyOrderNo, saveSupplyOrderHeader, getSupplyOrderItems, deleteSupplyOrderItem, addSupplyOrderItem, completeSupplyOrderApi, deleteSupplyOrderApi, amendSupplyOrderApi, getNocDetailsApi, getNocBalanceApi, updateSupplyOrderItemApi } from '../../api/localPurchaseApi';
import { getFinYears, getContractsForSO, getContractItems } from '../../api/contractApi';
import Select from 'react-select';

export default function AddSupplyOrderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Header State
  const [finYear, setFinYear] = useState('');
  const [supplier, setSupplier] = useState('');
  const [contract, setContract] = useState('');
  const [fund, setFund] = useState('1'); 
  const [fundValue, setFundValue] = useState('');
  const [itemCount, setItemCount] = useState('');
  
  // Generated fields
  const [soNoData, setSoNoData] = useState(null);
  const [soDate, setSoDate] = useState('System Generated');

  // Dispatch State
  const [dispatchNo, setDispatchNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // UI State
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [isLoading, setIsLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Inline Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [contractItems, setContractItems] = useState([]);
  const [newItemId, setNewItemId] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemNoc, setNewItemNoc] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isLocalItem, setIsLocalItem] = useState(true);
  const [nocList, setNocList] = useState([]);
  const [nocBalance, setNocBalance] = useState(null);
  
  const [editingItemId, setEditingItemId] = useState(null);

  // Dropdown Lists
  const [finYearsList, setFinYearsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [contractsList, setContractsList] = useState([]);
  const [fundsList, setFundsList] = useState([]);

  // Fetch base dropdowns on mount
  useEffect(() => {
    fetchBaseData();
  }, []);

  // Fetch contracts when finYear or supplier changes
  useEffect(() => {
    if (finYear && supplier && !id) {
      fetchContracts(finYear, supplier);
    } else if (!id) {
      setContractsList([]);
    }
  }, [finYear, supplier, id]);

  const fetchBaseData = async () => {
    setIsLoading(true);
    try {
      const [yrRes, suppRes, fundRes] = await Promise.all([
        getFinYears(),
        getSuppliers(),
        getBudgets()
      ]);
      setFinYearsList(yrRes || []);
      setSuppliersList(suppRes.data || []);
      setFundsList(fundRes.data || []);
      
      if (!id) {
        const today = new Date();
        let startYear = today.getFullYear();
        if (today.getMonth() < 3) {
          startYear -= 1;
        }
        const currentYearPrefix = startYear.toString();
        const currentFinYearObj = (yrRes || []).find(y => y.name && y.name.toString().startsWith(currentYearPrefix));
        if (currentFinYearObj) {
          setFinYear(currentFinYearObj.id);
        }
        
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        setSoDate(`${day}-${month}-${year}`);
      }

      if (id) {
        await loadSupplyOrder(id);
      }
    } catch (error) {
      toast.error('Failed to load form data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupplyOrder = async (poNoId) => {
    try {
      const data = await getSupplyOrderEditDetails(poNoId);
      if (data && data.header) {
        if (data.header.accYrSetId) setFinYear(data.header.accYrSetId.toString());
        setSupplier(data.header.lpSupplierId || '');
        if (data.header.categoryId) setFund(data.header.categoryId.toString());
        if (data.header.contractId) {
          setContractsList([{ id: data.header.contractId, name: data.header.contractNo }]);
          setContract(data.header.contractId.toString());
        }
        
        setSoNoData({ soNo: data.header.poNo, contractNo: data.header.contractNo });
        if (data.header.soValue !== undefined) {
          setFundValue(data.header.soValue.toString());
        }
        if (data.header.itemCnt !== undefined) {
          setItemCount(data.header.itemCnt.toString());
        }
        if (data.header.poDate) {
          setSoDate(data.header.poDate);
        }
        
        if (data.items) {
          setOrderItems(data.items);
        }
        
        setIsSaved(true);
      }
    } catch (err) {
      toast.error('Failed to load supply order edit details');
      console.error(err);
    }
  };

  const loadOrderItems = async () => {
    if (!id) return;
    setIsLoadingItems(true);
    try {
      const res = await getSupplyOrderItems(id);
      setOrderItems(res.data || []);
    } catch (err) {
      toast.error('Failed to load items');
      console.error('Failed to load items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteSupplyOrderItem(id, itemId);
      loadOrderItems();
      toast.success('Item deleted successfully');
    } catch (err) {
      toast.error('Failed to delete item');
      console.error('Failed to delete item:', err);
    }
  };

  const handleAddNewItemClick = async () => {
    setIsAddingItem(true);
    setEditingItemId(null);
    setNewItemId('');
    setNewItemQty('');
    setNewItemNoc('');
    setIsLocalItem(true);
    setNocBalance(null);
    if (!contractItems.length && contract) {
      try {
        const data = await getContractItems(contract);
        setContractItems(data || []);
      } catch (err) {
        toast.error('Failed to load contract items');
      }
    }
  };

  const handleEditItemClick = async (item) => {
    setIsAddingItem(false);
    setEditingItemId(item.orderItemId);
    const val = item.itemId != null ? item.itemId.toString() : (item.lpItemId != null ? item.lpItemId.toString() : '');
    setNewItemId(val);
    setNewItemQty(item.orderQty?.toString() || '');
    setNewItemNoc(item.nocDetail?.toString() || '');
    setIsLocalItem(item.itemId == null);
    setNocBalance(null);
    
    if (!contractItems.length && contract) {
      try {
        const data = await getContractItems(contract);
        setContractItems(data || []);
      } catch (err) {
        toast.error('Failed to load contract items');
      }
    }
  };

  const handleSaveInlineItem = async () => {
    if (!newItemId || !newItemQty) {
      toast.error('Please fill required fields');
      return;
    }
    if (nocBalance && parseFloat(newItemQty) > (nocBalance.balQyy || 0)) {
      toast.error(`Order quantity cannot exceed Balance Qty (${nocBalance.balQyy})`);
      return;
    }

    const selectedItemData = contractItems.find(i => 
      (i.itemId != null && i.itemId.toString() === newItemId.toString()) || 
      (i.lpItemId != null && i.lpItemId.toString() === newItemId.toString())
    );
    if (!selectedItemData) {
      toast.error('Selected item not found in contract items list.');
      return;
    }

    setIsSavingItem(true);
    try {
      const selectedNoc = nocList.find(n => n.nocId?.toString() === newItemNoc?.toString());

      const payload = {
        itemId: selectedItemData.itemId,
        lpItemId: selectedItemData.lpItemId,
        itemName: selectedItemData.itemName,
        orderQty: parseFloat(newItemQty),
        unitPrice: selectedItemData.unitPrice || 0,
        amount: (parseFloat(newItemQty) || 0) * (selectedItemData.unitPrice || 0),
        nocDetail: selectedNoc ? selectedNoc.nocId : newItemNoc
      };
      
      if (editingItemId) {
        await updateSupplyOrderItemApi(id, editingItemId, payload);
        toast.success('Item updated successfully');
        setEditingItemId(null);
      } else {
        await addSupplyOrderItem(id, payload);
        toast.success('Item added successfully');
        setIsAddingItem(false);
      }
      
      loadOrderItems();
    } catch (error) {
      console.error('Failed to save item', error);
      toast.error(editingItemId ? 'Failed to update item' : 'Failed to add item');
    } finally {
      setIsSavingItem(false);
    }
  };

  const fetchContracts = async (yearId, supplierId) => {
    try {
      const data = await getContractsForSO(yearId, supplierId);
      setContractsList(data || []);
      
      // If no contract is selected, or if the currently selected contract is not in the new list, set it to the first one.
      setContract(prevContract => {
        if (!prevContract || (data && !data.some(c => c.id.toString() === prevContract.toString()))) {
           return data && data.length > 0 ? data[0].id : '';
        }
        return prevContract;
      });
      
    } catch (error) {
      console.error('Failed to fetch contracts', error);
      setContractsList([]);
      setContract('');
    }
  };

  const handleGenerateSoNo = async () => {
    if (!finYear) {
      toast.error('Please select Financial Year first');
      return;
    }
    try {
      const data = await generateSupplyOrderNo(finYear);
      setSoNoData(data);
      toast.success('Supply Order number generated');
    } catch (err) {
      toast.error('Failed to generate supply order number');
      console.error(err);
    }
  };

  const handleCompletePO = async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      await completeSupplyOrderApi(id, {
        dispatchNo,
        dispatchDate
      });
      toast.success('Supply Order completed successfully');
      navigate('/local-purchase/supply-orders');
    } catch (error) {
      toast.error('Failed to complete Supply Order');
      console.error(error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Fetch NOC details when item changes
  useEffect(() => {
    if (newItemId && isAddingItem) {
      const fetchNocs = async () => {
        try {
          const res = await getNocDetailsApi(newItemId);
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
    setNewItemNoc('');
    setNocBalance(null);
  }, [newItemId, isAddingItem]);

  // Fetch NOC balance when noc changes
  useEffect(() => {
    if (newItemNoc && newItemId && isAddingItem) {
      const fetchBalance = async () => {
        try {
          const res = await getNocBalanceApi(newItemNoc, newItemId);
          setNocBalance(res);
        } catch (err) {
          console.error('Failed to load NOC balance', err);
          setNocBalance(null);
        }
      };
      fetchBalance();
    } else {
      setNocBalance(null);
    }
  }, [newItemNoc, newItemId, isAddingItem]);

  const handleDeletePO = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this supply order?')) return;
    
    try {
      await deleteSupplyOrderApi(id);
      toast.success('Supply order deleted successfully');
      navigate('/local-purchase/supply-orders');
    } catch (error) {
      toast.error('Failed to delete supply order');
      console.error(error);
    }
  };

  const handleAmendPO = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to amend this supply order?')) return;
    
    try {
      await amendSupplyOrderApi(id);
      toast.success('Supply order amended successfully');
      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast.error('Failed to amend supply order');
      console.error(error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!finYear || !supplier || !contract || !soNoData) {
      toast.error('Please fill all required fields and generate SO Number');
      return;
    }
    
    try {
      const payload = {
        poNoId: id || 0,
        accYrSetId: finYear,
        lpSupplierId: supplier,
        contractId: contract,
        poNo: soNoData.soNo,
        poDate: new Date().toISOString().split('T')[0].split('-').reverse().join('-'),
        categoryId: fund,
        psaCode: soNoData.psaCode,
        icCode: '',
        supplierCode: soNoData.supplierCode,
        autoSoCode: soNoData.autoSoCode
      };

      const res = await saveSupplyOrderHeader(payload);
      if (res.success) {
        toast.success('Header saved successfully');
        setIsSaved(true);
        if (!id) {
          navigate(`/local-purchase/supply-orders/edit/${res.poNoId}`, { replace: true });
        }
      }
    } catch (err) {
      toast.error('Failed to save header');
      console.error(err);
    }
  };

  const tabs = [
    { id: 'items', label: 'Items' },
    { id: 'general', label: 'General' },
  ];

  const renderInlineForm = (isEdit = false, index = null) => {
    return (
      <tr className="bg-blue-50/30" key={isEdit ? `edit-${editingItemId}` : 'add-new'}>
        <td className="px-4 py-4 text-slate-500 font-medium">{isEdit ? index + 1 : 'New'}</td>
        <td className="px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs text-slate-600 font-medium">Local Item</label>
            <input 
              type="checkbox" 
              checked={isLocalItem} 
              onChange={(e) => setIsLocalItem(e.target.checked)} 
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              disabled={isEdit}
            />
          </div>
          <Select
            options={contractItems.map(item => {
              const val = item.itemId != null ? item.itemId : item.lpItemId;
              return {
                value: val,
                label: `${item.itemCode || item.lpItemCode || ''} - ${item.itemName || ''}`.replace(/^- | -$/, '').trim() || `Item ${val}`
              };
            })}
            value={newItemId ? {
              value: newItemId, 
              label: (() => {
                const i = contractItems.find(x => 
                  (x.itemId != null && x.itemId.toString() === newItemId.toString()) || 
                  (x.lpItemId != null && x.lpItemId.toString() === newItemId.toString())
                );
                const val = i ? (i.itemId != null ? i.itemId : i.lpItemId) : newItemId;
                return i ? `${i.itemCode || i.lpItemCode || ''} - ${i.itemName || ''}`.replace(/^- | -$/, '').trim() || `Item ${val}` : newItemId;
              })()
            } : null}
            onChange={(selectedOption) => setNewItemId(selectedOption ? selectedOption.value : '')}
            placeholder="Select Item..."
            isClearable
            isSearchable
            className="w-full text-sm"
            menuPosition="fixed"
            isDisabled={isEdit}
          />
        </td>
        <td className="px-4 py-4">
          <input 
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => {
              const val = e.target.value;
              if (val && nocBalance && parseFloat(val) > (nocBalance.balQyy || 0)) {
                window.alert(`Order quantity cannot exceed Balance Qty (${nocBalance.balQyy})`);
                setNewItemQty(nocBalance.balQyy.toString());
              } else {
                setNewItemQty(val);
              }
            }}
            placeholder="Qty"
            className="w-full text-sm border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 p-1.5 text-right"
          />
        </td>
        <td className="px-4 py-4">
          {nocList.length > 0 ? (
            <Select
              options={nocList.map(noc => ({
                value: noc.nocId,
                label: noc.nocNumberStr
              }))}
              value={newItemNoc ? {
                value: newItemNoc,
                label: nocList.find(n => n.nocId?.toString() === newItemNoc?.toString())?.nocNumberStr || newItemNoc
              } : null}
              onChange={(selectedOption) => setNewItemNoc(selectedOption ? selectedOption.value : '')}
              placeholder="Select NOC..."
              isClearable
              className="w-full text-sm min-w-[200px]"
              menuPosition="fixed"
            />
          ) : (
            <input 
              type="text"
              value={newItemNoc}
              onChange={(e) => setNewItemNoc(e.target.value)}
              placeholder="NOC No."
              className="w-full text-sm border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 p-1.5"
            />
          )}
          {nocBalance && (
            <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-1 rounded font-medium">
              Appr: {nocBalance.approvedqty} | PO: {nocBalance.poqty} | Bal: <span className={nocBalance.balQyy < parseFloat(newItemQty || 0) ? "text-red-600 font-bold" : "text-green-600"}>{nocBalance.balQyy}</span>
            </div>
          )}
        </td>
        <td className="px-4 py-4 text-right text-slate-700 font-medium bg-slate-50/50">
          ₹ {(()=>{
              const sel = contractItems.find(i => 
                (i.itemId != null && i.itemId.toString() === newItemId?.toString()) || 
                (i.lpItemId != null && i.lpItemId.toString() === newItemId?.toString())
              );
              return sel ? (sel.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00';
          })()}
        </td>
        <td className="px-4 py-4 text-right font-bold text-slate-800 bg-slate-50/50">
          ₹ {(()=>{
              const sel = contractItems.find(i => 
                (i.itemId != null && i.itemId.toString() === newItemId?.toString()) || 
                (i.lpItemId != null && i.lpItemId.toString() === newItemId?.toString())
              );
              const price = sel ? (sel.unitPrice || 0) : 0;
              const qty = parseFloat(newItemQty) || 0;
              return (price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2 });
          })()}
        </td>
        <td className="px-4 py-4 text-center">
          <div className="flex justify-center gap-2">
            <button 
              onClick={handleSaveInlineItem}
              disabled={isSavingItem || !newItemId || !newItemQty}
              className="text-green-600 hover:text-green-700 disabled:opacity-50 p-1.5 hover:bg-green-50 rounded-md transition-colors"
              title="Save Item"
            >
              <CheckCircleIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => isEdit ? setEditingItemId(null) : setIsAddingItem(false)}
              disabled={isSavingItem}
              className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1.5 hover:bg-red-50 rounded-md transition-colors"
              title="Cancel"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6">
            <div className="max-w-[95%] mx-auto space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate('/local-purchase/supply-orders')}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                      {id ? 'Edit Supply Order' : 'Create Supply Order'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Local Purchase / Direct Supply Order</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                
                {isLoading ? (
                  <div className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                <form onSubmit={handleSave} className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <DocumentTextIcon className="w-4 h-4" />
                      Supply Order Header
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Financial Year <span className="text-red-500">*</span></label>
                        <select 
                          disabled={true}
                          required
                          className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow disabled:bg-slate-100 disabled:text-slate-800 disabled:font-semibold"
                          value={finYear}
                          onChange={(e) => setFinYear(e.target.value)}
                        >
                          <option value="">Select Fin Year</option>
                          {finYearsList.map(y => (
                            <option key={y.id} value={y.id}>{y.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Supplier (Local Purchase) <span className="text-red-500">*</span></label>
                        <select 
                          disabled={isSaved}
                          required
                          className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={supplier}
                          onChange={(e) => setSupplier(e.target.value)}
                        >
                          <option value="">Select Supplier</option>
                          {suppliersList.map(s => (
                            <option key={s.lpSupplierId} value={s.lpSupplierId}>{s.supplierName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Select Contract No. <span className="text-red-500">*</span></label>
                        <select 
                          disabled={isSaved}
                          required
                          className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={contract}
                          onChange={(e) => setContract(e.target.value)}
                        >
                          <option value="">-- Select Contract --</option>
                          {contractsList.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end mt-6">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Fund</label>
                        <select 
                          disabled={isSaved}
                          className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={fund}
                          onChange={(e) => setFund(e.target.value)}
                        >
                          <option value="">Select Fund</option>
                          {fundsList.map(f => (
                            <option key={f.budgetId} value={f.budgetId}>{f.budgetName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Supply Order No</label>
                        <div className="flex gap-2">
                          <input 
                            readOnly
                            type="text" 
                            className="w-full bg-slate-100 border-slate-200 rounded-lg text-sm text-slate-600 font-mono"
                            value={soNoData ? soNoData.soNo : 'Click Generate -->'}
                          />
                          {!isSaved && (
                            <button 
                              type="button"
                              onClick={handleGenerateSoNo}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Supply Order Date</label>
                        <div className="relative">
                          <input 
                            readOnly
                            type="text" 
                            className="w-full bg-slate-100 border-slate-200 rounded-lg text-sm text-slate-600 pl-10"
                            value={soDate}
                          />
                          <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    {isSaved && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end mt-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Order Value (INR)</label>
                          <input 
                            readOnly
                            type="text" 
                            className="w-full bg-slate-100 border-slate-200 rounded-lg text-sm text-slate-600 font-semibold"
                            value={fundValue ? `₹ ${parseFloat(fundValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹ 0.00'}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Item Count</label>
                          <input 
                            readOnly
                            type="text" 
                            className="w-full bg-slate-100 border-slate-200 rounded-lg text-sm text-slate-600 font-semibold"
                            value={itemCount || '0'}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    {!isSaved ? (
                      <>
                        <button 
                          type="button" 
                          onClick={() => navigate('/local-purchase/supply-orders')}
                          className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm"
                        >
                          Save Header
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setIsSaved(false)}
                        className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit Header
                      </button>
                    )}
                  </div>
                </form>
                )}
              </div>

              {isSaved && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden mt-6 animate-fade-in">
                  <div className="border-b border-slate-200 bg-slate-50/50">
                    <nav className="flex space-x-1 px-4" aria-label="Tabs">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            whitespace-nowrap py-4 px-6 text-sm font-medium border-b-2 transition-colors
                            ${activeTab === tab.id 
                              ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                          `}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="p-6">
                    {activeTab === 'items' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-slate-800">Order Items</h4>
                            <button 
                              onClick={handleAddNewItemClick}
                              disabled={isAddingItem}
                              className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <PlusIcon className="w-4 h-4" />
                              Add New Item
                            </button>
                          </div>
                          
                          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Sl. No.</th>
                                  <th className="px-4 py-3">Item Code & Description</th>
                                  <th className="px-4 py-3 text-right">Order Qty</th>
                                  <th className="px-4 py-3">NOC Detail</th>
                                  <th className="px-4 py-3 text-right">Price (INR)</th>
                                  <th className="px-4 py-3 text-right">Item Value (INR)</th>
                                  <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {isLoadingItems ? (
                                  <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                      <p>Loading items...</p>
                                    </td>
                                  </tr>
                                ) : orderItems.length > 0 ? (
                                  orderItems.map((item, index) => 
                                    item.orderItemId === editingItemId ? (
                                      renderInlineForm(true, index)
                                    ) : (
                                      <tr key={item.orderItemId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-600">{index + 1}</td>
                                        <td className="px-4 py-3">
                                          <div className="font-semibold text-slate-800">
                                            {item.drugCode || item.itemId || item.lpItemId} - {item.itemName}
                                          </div>
                                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                            <span><span className="font-medium">Strength:</span> {item.strength || 'N/A'}</span>
                                            <span><span className="font-medium">SKU:</span> {item.sku || 'N/A'}</span>
                                            <span><span className="font-medium">Type:</span> {item.itemType || 'N/A'}</span>
                                            <span><span className="font-medium">Pack Qty:</span> {item.packQty || 'N/A'}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-700">{item.orderQty || item.orderQuantity}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.nocDetail || '-'}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">₹ {(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-800">₹ {(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-center">
                                          <div className="flex justify-center items-center gap-2">
                                            <button 
                                              onClick={() => handleEditItemClick(item)}
                                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                                              title="Edit Item"
                                            >
                                              <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteItem(item.orderItemId)}
                                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                              title="Delete Item"
                                            >
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  )
                                ) : !isAddingItem ? (
                                  <tr className="hover:bg-slate-50 transition-colors">
                                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                                      <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                      <p>No items added yet. Click "Add New Item" to begin.</p>
                                    </td>
                                  </tr>
                                ) : null}

                                {/* Inline Add Row */}
                                {isAddingItem && renderInlineForm(false)}
                              </tbody>
                            </table>
                          </div>
                      </div>
                    )}
                    
                    {activeTab === 'general' && (
                      <div className="space-y-8">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                            <PaperAirplaneIcon className="w-4 h-4" />
                            Dispatch PO
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-slate-700">Dispatch No</label>
                              <input 
                                type="text" 
                                value={dispatchNo}
                                onChange={(e) => setDispatchNo(e.target.value)}
                                className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Enter Dispatch No"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-slate-700">Dispatch Date</label>
                              <div className="relative">
                                <input 
                                  type="date" 
                                  value={dispatchDate}
                                  onChange={(e) => setDispatchDate(e.target.value)}
                                  className="w-full border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pl-10"
                                />
                                <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                            <div>
                              <button 
                                onClick={handleCompletePO}
                                disabled={isCompleting || !dispatchNo || !dispatchDate}
                                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm flex items-center justify-center gap-2"
                              >
                                <PaperAirplaneIcon className="w-4 h-4" />
                                {isCompleting ? 'Completing...' : 'Complete PO'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div className="flex justify-center gap-4 py-6 border-t border-slate-200">
                          <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                            <DocumentArrowDownIcon className="w-5 h-5 text-slate-400" />
                            Download PO
                          </button>
                          <button 
                            onClick={handleDeletePO}
                            className="px-6 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                            Delete
                          </button>
                          <button 
                            onClick={handleAmendPO}
                            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                          >
                            <PencilSquareIcon className="w-5 h-5 text-slate-400" />
                            Amend
                          </button>
                        </div>
                      </div>
                    )}
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
