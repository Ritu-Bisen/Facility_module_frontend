import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  BuildingOffice2Icon, 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  PencilSquareIcon, 
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { useNavigate, useParams } from 'react-router-dom';
import { getSuppliers } from '../../api/localPurchaseApi';
import { 
  getTenders, 
  createContract, 
  updateContract, 
  getContractItems, 
  addContractItem, 
  updateContractItem,
  deleteContractItem,
  getFinYears,
  getLocalItems,
  getContractById,
  completeContract,
  initiateAmendment
} from '../../api/contractApi';

export default function AddContractPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Header State
  const [finYear, setFinYear] = useState('542'); // ID for 2026-2027 based on mock or db
  const [supplier, setSupplier] = useState('');
  const [tenderNo, setTenderNo] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [contractStatus, setContractStatus] = useState('IN');
  const isCompleted = contractStatus === 'C';
  
  // UI State
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown Lists
  const [suppliersList, setSuppliersList] = useState([]);
  const [tendersList, setTendersList] = useState([]);
  const [finYearsList, setFinYearsList] = useState([]);
  const [localItemsList, setLocalItemsList] = useState([]);
  
  // Items State
  const [items, setItems] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({ lpItemId: '', qty: '', unitPrice: '', manufacturer: '', basicRate: '', gst: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  // Item Editing State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemData, setEditingItemData] = useState({ manufacturer: '', qty: '', basicRate: '', gst: '', unitPrice: '' });

  useEffect(() => {
    fetchDropdownData();
  }, [id]);

  const fetchDropdownData = async () => {
    setIsLoading(true);
    try {
      const [suppRes, tendRes, finRes] = await Promise.all([
        getSuppliers(),
        getTenders(),
        getFinYears()
      ]);
      setSuppliersList(suppRes.data || []);
      setTendersList(tendRes.data || []);
      
      const years = finRes || [];
      setFinYearsList(years);
      if (id) {
        setIsSaved(true);
        const headerData = await getContractById(id);
        if (headerData) {
          setFinYear(headerData.finYear || '');
          setSupplier(headerData.supplier || '');
          setTenderNo(headerData.tenderNo || '');
          setContractNo(headerData.contractNo || '');
          setContractDate(headerData.contractDate || '');
          setContractStatus(headerData.status || 'IN');
        }
        await fetchItems(id);
      } else if (years.length > 0 && finYear === '542') {
        const defaultId = years[0].id.toString();
        setFinYear(defaultId);
      }
      // Fetch local items unconditionally
      await fetchLocalItems();
    } catch (error) {
      toast.error('Failed to load form data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocalItems = async () => {
    try {
      const res = await getLocalItems();
      setLocalItemsList(res || []);
    } catch (err) {
      console.error('Failed to fetch local items:', err);
    }
  };

  const handleFinYearChange = (e) => {
    const val = e.target.value;
    setFinYear(val);
  };

  const fetchItems = async (contractId) => {
    try {
      const res = await getContractItems(contractId);
      setItems(res || []);
    } catch (err) {
      toast.error('Failed to fetch items');
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!contractNo || !contractDate || !supplier || !tenderNo) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        finYear,
        supplier,
        tenderNo,
        contractNo,
        contractDate
      };

      if (id) {
        await updateContract(id, payload);
        toast.success('Contract updated successfully');
        setIsSaved(true);
      } else {
        const res = await createContract(payload);
        if (res.success && res.contractId) {
          toast.success('Contract created successfully');
          setIsSaved(true);
          navigate(`/local-purchase/contracts/edit/${res.contractId}`, { replace: true });
        }
      }
    } catch (error) {
      toast.error('Failed to save contract');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.lpItemId || !newItem.qty || !newItem.unitPrice) {
      toast.error('Please fill all item fields');
      return;
    }
    
    const isDuplicate = items.some(item => item.lpItemId?.toString() === newItem.lpItemId.toString());
    if (isDuplicate) {
      toast.error('This item is already added to the contract');
      return;
    }
    try {
      await addContractItem(id, newItem);
      toast.success('Item added successfully');
      setNewItem({ lpItemId: '', qty: '', unitPrice: '', manufacturer: '', basicRate: '', gst: '' });
      setSelectedCategory('');
      setShowItemForm(false);
      fetchItems(id);
    } catch (err) {
      toast.error('Failed to add item');
      console.error(err);
    }
  };

  const handleStartEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemData({
      manufacturer: item.manufacturer || '',
      qty: item.qty || '',
      basicRate: item.basicRate || '',
      gst: item.gst || '',
      unitPrice: item.unitPrice || ''
    });
  };

  const handleSaveEditItem = async (itemId) => {
    if (!editingItemData.qty || !editingItemData.unitPrice) {
      toast.error('Please fill required item fields');
      return;
    }
    try {
      await updateContractItem(itemId, editingItemData);
      toast.success('Item updated successfully');
      setEditingItemId(null);
      fetchItems(id);
    } catch (err) {
      toast.error('Failed to update item');
      console.error(err);
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteContractItem(itemId);
      toast.success('Item deleted successfully');
      fetchItems(id);
    } catch (err) {
      toast.error('Failed to delete item');
      console.error(err);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Are you sure you want to complete this contract? No further items can be added.')) return;
    try {
      await completeContract(id);
      toast.success('Contract completed successfully');
      setContractStatus('C');
      fetchDropdownData();
    } catch (err) {
      toast.error('Failed to complete contract');
      console.error(err);
    }
  };

  const handleInitiateAmendment = async () => {
    if (!window.confirm('Are you sure you want to initiate amendment for this contract?')) return;
    try {
      await initiateAmendment(id);
      toast.success('Contract amendment initiated successfully');
      await fetchDropdownData();
    } catch (err) {
      toast.error('Failed to initiate amendment');
      console.error(err);
    }
  };

  const tabs = [
    { id: 'items', label: 'Items List' },
    { id: 'complete', label: 'Complete' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6">
            <div className="max-w-[95%] mx-auto space-y-4">
              
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate('/local-purchase/contracts')}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Award of Local Contract</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Direct Contract Creation & Management</p>
                  </div>
                </div>
              </div>

              {/* Main Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                
                {isLoading ? (
                  <div className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : (
                <form onSubmit={handleSave} className="p-4 sm:p-5">
                  {/* Supplier Details Section */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-slate-100 pb-1">
                      <BuildingOffice2Icon className="w-3.5 h-3.5" />
                      Supplier Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Financial Year</label>
                        <select 
                          disabled={isSaved}
                          className="w-full h-8 px-2 border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={finYear}
                          onChange={handleFinYearChange}
                        >
                          <option value="">Select Financial Year</option>
                          {finYearsList.map(y => (
                            <option key={y.id} value={y.id}>{y.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Supplier <span className="text-red-500">*</span></label>
                        <select 
                          disabled={isSaved}
                          required
                          className="w-full h-8 px-2 border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={supplier}
                          onChange={(e) => setSupplier(e.target.value)}
                        >
                          <option value="">Select Supplier</option>
                          {suppliersList.map(s => (
                            <option key={s.lpSupplierId} value={s.lpSupplierId}>{s.supplierName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Select Tender/Quotation No <span className="text-red-500">*</span></label>
                        <select 
                          disabled={isSaved}
                          required
                          className="w-full h-8 px-2 border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={tenderNo}
                          onChange={(e) => setTenderNo(e.target.value)}
                        >
                          <option value="">Select Tender/Quotation No</option>
                          {tendersList.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contract Details Section */}
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-2 mb-2 border-b border-slate-100 pb-1">
                      <DocumentTextIcon className="w-3.5 h-3.5" />
                      Contract Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Contract No <span className="text-red-500">*</span></label>
                        <input 
                          disabled={isSaved}
                          required
                          type="text" 
                          placeholder="Enter contract number"
                          className="w-full h-8 px-2 border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-500"
                          value={contractNo}
                          onChange={(e) => setContractNo(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Contract Date <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input 
                            disabled={isSaved}
                            required
                            type="date" 
                            className="w-full h-8 px-2 border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow pl-8 disabled:bg-slate-50 disabled:text-slate-500"
                            value={contractDate}
                            onChange={(e) => setContractDate(e.target.value)}
                          />
                          <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:col-span-1 lg:col-span-2">
                        {!isSaved ? (
                          <>
                            <button 
                              type="button" 
                              onClick={() => navigate('/local-purchase/contracts')}
                              className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 focus:ring-2 focus:ring-slate-100 transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              disabled={isSaving}
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 border border-transparent rounded hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm min-w-[120px] flex justify-center items-center"
                            >
                              {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                id ? 'Update Contract' : 'Save Contract'
                              )}
                            </button>
                          </>
                        ) : (
                          <button 
                            type="button" 
                            onClick={handleEdit}
                            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 focus:ring-2 focus:ring-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            Edit Details
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </form>
                )}
              </div>

              {/* Tabs Section - Only visible after saving and when not loading */}
              {isSaved && !isLoading && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden mt-4 animate-fade-in">
                  <div className="border-b border-slate-200 bg-slate-50/50">
                    <nav className="flex space-x-1 px-4" aria-label="Tabs">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            whitespace-nowrap py-2 px-4 text-[13px] font-medium border-b-2 transition-colors
                            ${activeTab === tab.id 
                              ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                          `}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="p-4">
                    {activeTab === 'items' && (
                      <div className="space-y-3 -mx-4 sm:-mx-4 mt-2">
                        {/* Only show category & item search dropdowns when contract is NOT complete */}
                        {!isCompleted && (
                          <div className="px-4 sm:px-4 flex gap-4 items-end">
                            <div className="flex-1 max-w-xs">
                              <label className="block text-[11px] font-semibold text-[#0b3b17] mb-1">Item Category</label>
                              <Select 
                                options={[...new Set(localItemsList.map(item => item.mCategory))].filter(Boolean).map(cat => ({ value: cat, label: cat }))}
                                value={selectedCategory ? { value: selectedCategory, label: selectedCategory } : null}
                                onChange={(selectedOption) => {
                                  setSelectedCategory(selectedOption ? selectedOption.value : '');
                                  setNewItem({...newItem, lpItemId: ''}); // Reset item when category changes
                                }}
                                isClearable
                                placeholder="Select Category"
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: '32px',
                                    height: '32px',
                                    fontSize: '12px',
                                    borderColor: '#cbd5e1',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      borderColor: '#0b3b17'
                                    }
                                  }),
                                  valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 8px'
                                  }),
                                  input: (base) => ({
                                    ...base,
                                    margin: '0',
                                    padding: '0'
                                  }),
                                  dropdownIndicator: (base) => ({
                                    ...base,
                                    padding: '4px'
                                  }),
                                  clearIndicator: (base) => ({
                                    ...base,
                                    padding: '4px'
                                  }),
                                  option: (base) => ({
                                    ...base,
                                    fontSize: '12px'
                                  })
                                }}
                              />
                            </div>
                            <div className="flex-1 max-w-md relative">
                              <label className="block text-[11px] font-semibold text-[#0b3b17] mb-1">Select Item</label>
                              <AsyncSelect 
                                key={selectedCategory} // Force re-render when category changes
                                loadOptions={(inputValue, callback) => {
                                  setTimeout(() => {
                                    const filtered = localItemsList
                                      .filter(item => item.mCategory === selectedCategory)
                                      .filter(item => 
                                        !inputValue || 
                                        item.itemCode.toLowerCase().includes(inputValue.toLowerCase()) || 
                                        item.name.toLowerCase().includes(inputValue.toLowerCase())
                                      )
                                      .slice(0, 100) // Limit to improve performance
                                      .map(item => ({ value: item.id, label: `${item.itemCode} - ${item.name}` }));
                                    callback(filtered);
                                  }, 300);
                                }}
                                defaultOptions={localItemsList
                                  .filter(item => item.mCategory === selectedCategory)
                                  .slice(0, 50)
                                  .map(item => ({ value: item.id, label: `${item.itemCode} - ${item.name}` }))}
                                value={newItem.lpItemId ? { 
                                  value: newItem.lpItemId, 
                                  label: (() => {
                                    const selected = localItemsList.find(i => i.id.toString() === newItem.lpItemId);
                                    return selected ? `${selected.itemCode} - ${selected.name}` : '';
                                  })()
                                } : null}
                                onChange={(selectedOption) => {
                                  if (selectedOption) {
                                    const selectedId = String(selectedOption.value);
                                    const isDuplicate = items.some(item => {
                                      const existingId = item.lpItemId ? String(item.lpItemId) : (item.itemId ? String(item.itemId) : null);
                                      return existingId === selectedId;
                                    });
                                    
                                    if (isDuplicate) {
                                      window.alert('You have already added this item to the list');
                                      setNewItem(prev => ({...prev, lpItemId: ''}));
                                      return;
                                    }
                                  }
                                  setNewItem({...newItem, lpItemId: selectedOption ? selectedOption.value.toString() : ''});
                                }}
                                isDisabled={!selectedCategory}
                                isClearable
                                placeholder="Search item code or name..."
                                loadingMessage={() => "Searching..."}
                                noOptionsMessage={() => "No items found"}
                                styles={{
                                  control: (base, state) => ({
                                    ...base,
                                    minHeight: '32px',
                                    height: '32px',
                                    fontSize: '12px',
                                    borderColor: state.isDisabled ? '#e2e8f0' : '#cbd5e1',
                                    backgroundColor: state.isDisabled ? '#f8fafc' : 'white',
                                    boxShadow: 'none',
                                    '&:hover': {
                                      borderColor: state.isDisabled ? '#e2e8f0' : '#0b3b17'
                                    }
                                  }),
                                  valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 8px'
                                  }),
                                  input: (base) => ({
                                    ...base,
                                    margin: '0',
                                    padding: '0'
                                  }),
                                  dropdownIndicator: (base) => ({
                                    ...base,
                                    padding: '4px'
                                  }),
                                  clearIndicator: (base) => ({
                                    ...base,
                                    padding: '4px'
                                  }),
                                  option: (base) => ({
                                    ...base,
                                    fontSize: '12px'
                                  })
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="border border-slate-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left text-[11px] min-w-full table-fixed">
                            <thead className="bg-[#0b3b17] text-white uppercase font-semibold text-[10px] border-b border-slate-200">
                              <tr>
                                <th className="px-1 py-2 border-r border-[#155424] w-[3%] text-center">Sl.No</th>
                                <th className="px-1 py-2 border-r border-[#155424] w-[20%]">Item code & description</th>
                                <th className="px-1 py-2 border-r border-[#155424] w-[12%]">Make/Brand</th>
                                <th className="px-1 py-2 border-r border-[#155424] text-center whitespace-normal w-[10%]">Contract Qty<br/>(Single unit)</th>
                                <th className="px-1 py-2 border-r border-[#155424] text-center w-[10%]">Basic Rate</th>
                                <th className="px-1 py-2 border-r border-[#155424] text-center w-[10%]">GST %</th>
                                <th className="px-1 py-2 border-r border-[#155424] text-center whitespace-normal w-[10%]">Unit Price<br/>(With GST)</th>
                                <th className="px-1 py-2 border-r border-[#155424] text-center whitespace-normal w-[10%]">Item Value<br/>(INR)</th>
                                <th className="px-1 py-2 border-r border-[#155424] text-center w-[5%]">Active</th>
                                <th className="px-1 py-2 text-center w-[10%]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {/* Inline Add Row - Only show when contract is NOT complete */}
                              {!isCompleted && (
                                <tr className="bg-slate-50 align-top">
                                  <td className="px-1 py-2 border-r border-slate-200 text-center font-medium text-slate-500">
                                    {items.length + 1}
                                  </td>
                                  <td className="px-1 py-1 border-r border-slate-200">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 font-medium mr-1">
                                        local Item <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[#0b3b17] shrink-0">
                                          <DocumentTextIcon className="w-3 h-3" />
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-800">
                                          {(() => {
                                            const selected = localItemsList.find(i => i.id.toString() === newItem.lpItemId);
                                            return selected ? `${selected.itemCode} - ${selected.name}` : <span className="text-slate-400 italic">Select an item from above...</span>;
                                          })()}
                                        </div>
                                      </div>
                                      
                                      {(() => {
                                        const selected = localItemsList.find(i => i.id.toString() === newItem.lpItemId);
                                        return selected ? (
                                          <div className="flex flex-wrap text-[9px] text-slate-500 mt-0.5 gap-x-2 px-6">
                                            <span><strong>Code:</strong> {selected.itemCode}</span>
                                            <span><strong>Strength:</strong> {selected.strength}</span>
                                            <span><strong>Unit:</strong> {selected.unit}</span>
                                            <span><strong>PackQty:</strong> {selected.packQty}</span>
                                            <span><strong>Type:</strong> {selected.mCategory}</span>
                                            {selected.isEdl === 'Y' && <span className="text-green-600 font-bold">EDL</span>}
                                          </div>
                                        ) : (
                                          <div className="text-[9px] text-slate-500 grid grid-cols-4 gap-0.5 mt-0.5 px-6 leading-tight">
                                            <div className="col-span-4 truncate">Strength:</div>
                                            <div className="col-span-1 truncate">SKU:</div>
                                            <div className="col-span-1 truncate">Type:</div>
                                            <div className="col-span-2 truncate">PackQty:</div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200">
                                    <textarea 
                                      rows={2}
                                      className="w-full text-[11px] border border-slate-300 bg-white rounded focus:ring-emerald-500 focus:border-emerald-500 px-1 py-0.5 shadow-sm resize-y leading-tight"
                                      value={newItem.manufacturer}
                                      onChange={(e) => setNewItem({...newItem, manufacturer: e.target.value})}
                                    />
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200">
                                    <input 
                                      type="number" 
                                      className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded focus:ring-emerald-500 focus:border-emerald-500 text-right px-1 py-0 shadow-sm"
                                      value={newItem.qty}
                                      onChange={(e) => setNewItem({...newItem, qty: e.target.value})}
                                    />
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200">
                                    <input 
                                      type="number" 
                                      className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded focus:ring-emerald-500 focus:border-emerald-500 text-right px-1 py-0 shadow-sm" 
                                      value={newItem.basicRate}
                                      onChange={(e) => {
                                        const br = parseFloat(e.target.value) || 0;
                                        const gstPercent = parseFloat(newItem.gst) || 0;
                                        const up = (br + (br * gstPercent / 100)).toFixed(2);
                                        setNewItem({...newItem, basicRate: e.target.value, unitPrice: up});
                                      }}
                                    />
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200">
                                    <select 
                                      className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded focus:ring-emerald-500 focus:border-emerald-500 px-1 py-0 shadow-sm"
                                      value={newItem.gst}
                                      onChange={(e) => {
                                        const gstVal = e.target.value;
                                        const br = parseFloat(newItem.basicRate) || 0;
                                        const gstPercent = parseFloat(gstVal) || 0;
                                        const up = (br + (br * gstPercent / 100)).toFixed(2);
                                        setNewItem({...newItem, gst: gstVal, unitPrice: up});
                                      }}
                                    >
                                      <option value="">Select GST</option>
                                      <option value="0">0%</option>
                                      <option value="5">5%</option>
                                      <option value="12">12%</option>
                                      <option value="18">18%</option>
                                      <option value="28">28%</option>
                                    </select>
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200">
                                    <input 
                                      type="number" 
                                      className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded focus:ring-emerald-500 focus:border-emerald-500 text-right px-1 py-0 shadow-sm"
                                      value={newItem.unitPrice}
                                      onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                                    />
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200 text-right font-medium text-slate-700 bg-slate-100/50">
                                    {newItem.qty && newItem.unitPrice ? (parseFloat(newItem.qty) * parseFloat(newItem.unitPrice)).toFixed(2) : ''}
                                  </td>
                                  <td className="px-1 py-2 border-r border-slate-200 text-center">
                                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3 mt-1" />
                                  </td>
                                  <td className="px-1 py-2 text-center">
                                    <button 
                                      onClick={handleAddItem}
                                      className="w-5 h-5 rounded-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white flex items-center justify-center mx-auto transition-colors shadow-sm"
                                    >
                                      <span className="text-sm font-bold leading-none mb-0.5">+</span>
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Saved Items */}
                              {items.map((item, idx) => {
                                const foundItem = localItemsList.find(i => i.id.toString() === item.lpItemId?.toString());
                                const displayName = foundItem ? `${foundItem.itemCode} - ${foundItem.name}` : item.lpItemId;
                                const isEditing = editingItemId === item.id;

                                if (isEditing) {
                                  return (
                                    <tr key={item.id} className="bg-emerald-50/40 border-b border-emerald-200">
                                      <td className="px-1 py-2 border-r border-slate-200 text-center font-semibold">{idx + 1}</td>
                                      <td className="px-1 py-2 border-r border-slate-200 font-medium text-slate-800 text-[10px]">{displayName}</td>
                                      <td className="px-1 py-2 border-r border-slate-200">
                                        <textarea 
                                          rows={2}
                                          className="w-full text-[11px] border border-slate-300 bg-white rounded px-1 py-0.5 leading-tight"
                                          value={editingItemData.manufacturer}
                                          onChange={(e) => setEditingItemData({...editingItemData, manufacturer: e.target.value})}
                                        />
                                      </td>
                                      <td className="px-1 py-2 border-r border-slate-200">
                                        <input 
                                          type="number" 
                                          className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded text-right px-1"
                                          value={editingItemData.qty}
                                          onChange={(e) => setEditingItemData({...editingItemData, qty: e.target.value})}
                                        />
                                      </td>
                                      <td className="px-1 py-2 border-r border-slate-200">
                                        <input 
                                          type="number" 
                                          className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded text-right px-1"
                                          value={editingItemData.basicRate}
                                          onChange={(e) => {
                                            const br = parseFloat(e.target.value) || 0;
                                            const gstPercent = parseFloat(editingItemData.gst) || 0;
                                            const up = (br + (br * gstPercent / 100)).toFixed(2);
                                            setEditingItemData({...editingItemData, basicRate: e.target.value, unitPrice: up});
                                          }}
                                        />
                                      </td>
                                      <td className="px-1 py-2 border-r border-slate-200">
                                        <select 
                                          className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded px-1"
                                          value={editingItemData.gst}
                                          onChange={(e) => {
                                            const gstVal = e.target.value;
                                            const br = parseFloat(editingItemData.basicRate) || 0;
                                            const gstPercent = parseFloat(gstVal) || 0;
                                            const up = (br + (br * gstPercent / 100)).toFixed(2);
                                            setEditingItemData({...editingItemData, gst: gstVal, unitPrice: up});
                                          }}
                                        >
                                          <option value="">GST</option>
                                          <option value="0">0%</option>
                                          <option value="5">5%</option>
                                          <option value="12">12%</option>
                                          <option value="18">18%</option>
                                          <option value="28">28%</option>
                                        </select>
                                      </td>
                                      <td className="px-1 py-2 border-r border-slate-200">
                                        <input 
                                          type="number" 
                                          className="w-full h-6 text-[11px] border border-slate-300 bg-white rounded text-right px-1"
                                          value={editingItemData.unitPrice}
                                          onChange={(e) => setEditingItemData({...editingItemData, unitPrice: e.target.value})}
                                        />
                                      </td>
                                      <td className="px-1 py-2 border-r border-slate-200 text-right font-medium text-slate-700 bg-slate-100/50">
                                        {editingItemData.qty && editingItemData.unitPrice ? (parseFloat(editingItemData.qty) * parseFloat(editingItemData.unitPrice)).toFixed(2) : ''}
                                      </td>
                                      <td className="px-1 py-2 border-r border-slate-200 text-center">
                                        <input type="checkbox" checked readOnly className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3" />
                                      </td>
                                      <td className="px-1 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <button 
                                            onClick={() => handleSaveEditItem(item.id)}
                                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm"
                                            title="Save"
                                          >
                                            <CheckIcon className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={handleCancelEditItem}
                                            className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded"
                                            title="Cancel"
                                          >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-1 py-2 border-r border-slate-200 text-center">{idx + 1}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 font-medium text-slate-800 text-[10px]">{displayName}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-slate-600 whitespace-pre-wrap break-words text-[10px]">{item.manufacturer || 'N/A'}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-right">{item.qty}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-right">₹{parseFloat(item.basicRate || 0).toFixed(2)}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-center">{item.gst ? `${item.gst}%` : '-'}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-right">₹{parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-right font-medium text-slate-700 bg-slate-100/50">
                                      {item.qty && item.unitPrice ? (parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2) : ''}
                                    </td>
                                    <td className="px-1 py-2 border-r border-slate-200 text-center">
                                      <input type="checkbox" checked readOnly className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3" />
                                    </td>
                                    <td className="px-1 py-2 text-center">
                                      {/* Hide edit and delete options when contract is complete */}
                                      {!isCompleted ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button 
                                            onClick={() => handleStartEditItem(item)}
                                            className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-50 transition-colors"
                                            title="Edit item"
                                          >
                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 transition-colors"
                                            title="Delete item"
                                          >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 text-[10px]">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}

                            </tbody>
                          </table>
                        </div>
                        {items.length === 0 && (
                          <div className="text-center py-6 text-slate-500 text-xs">
                            No items added yet.
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'complete' && (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        {isCompleted ? (
                          /* When contract is completed, show ONLY the Initiate Amendment button */
                          <div className="flex flex-col items-center space-y-4">
                            <button 
                              onClick={handleInitiateAmendment}
                              className="px-6 py-2 bg-[#386b0b] hover:bg-[#2e5709] text-white font-bold text-sm rounded shadow border border-[#274b08] transition-all cursor-pointer"
                            >
                              Initiate Amendment
                            </button>
                          </div>
                        ) : (
                          /* When contract is in progress (NOT completed), show Complete & Delete options */
                          <>
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="text-center">
                              <h4 className="text-lg font-bold text-slate-800">Complete Contract</h4>
                              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                Please ensure all items and details are added before completing the contract.
                              </p>
                            </div>
                            <div className="flex gap-3 mt-4">
                              <button 
                                onClick={handleComplete}
                                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
                              >
                                Complete
                              </button>
                              <button className="px-5 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-sm hover:bg-red-100 transition-colors flex items-center gap-1.5">
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
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
