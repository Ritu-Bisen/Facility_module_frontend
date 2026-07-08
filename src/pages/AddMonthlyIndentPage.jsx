import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../api/axios';

const today = new Date().toISOString().split('T')[0];



export default function AddMonthlyIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editNocId = searchParams.get('nocId');

  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [accYears, setAccYears] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [form, setForm] = useState({
    finYear: '',
    reqDate: today,
    programId: '',
  });

  const [itemType, setItemType] = useState('');
  const [fmItems, setFmItems] = useState([]);
  const [loadingFmItems, setLoadingFmItems] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [savingItems, setSavingItems] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingQty, setEditingQty] = useState('');

  const [requestNo, setRequestNo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [editNocIdInternal, setEditNocIdInternal] = useState(editNocId);

  const [allDrugs, setAllDrugs] = useState([]);
  const [selectedOtherItemCode, setSelectedOtherItemCode] = useState('');
  const [loadingOtherItem, setLoadingOtherItem] = useState(false);

  useEffect(() => {
    if (facilityId) {
      loadFilters();
    }
  }, [facilityId]);

  useEffect(() => {
    if (itemType && facilityId) {
      fetchFmItems();
    } else {
      setFmItems([]);
    }
  }, [itemType, facilityId]);

  useEffect(() => {
    if (editNocIdInternal) {
      fetchSavedItems();
    }
  }, [editNocIdInternal]);

  const fetchSavedItems = async () => {
    if (!editNocIdInternal) return;
    try {
      const res = await api.get(`/monthly-indent/${editNocIdInternal}/items`);
      setSavedItems(res.data || []);
    } catch (e) {
      console.error('Failed to fetch saved items:', e);
    }
  };

  const fetchFmItems = async () => {
    setLoadingFmItems(true);
    try {
      let endpoint = '';
      let params = {};
      if (itemType === 'fm_item') {
        endpoint = '/monthly-indent/fm-items';
        params = { itemType: 'FM-items' };
      } else if (itemType === 'STOCK_AND_AVAILABLE') {
        endpoint = '/monthly-indent/warehouse-items';
        params = { itemType };
      } else if (itemType === 'INDENT_DHS') {
        endpoint = '/monthly-indent/dhs-indent-items';
        params = {};
      }
      
      if (endpoint) {
        const res = await api.get(endpoint, { params });
        setFmItems(res.data || []);
      } else {
        setFmItems([]);
      }
      setSelectedItems({});
    } catch (e) {
      console.error('Failed to fetch items:', e);
    } finally {
      setLoadingFmItems(false);
    }
  };

  useEffect(() => {
    if (itemType === 'OTHER' && allDrugs.length === 0) {
      fetchAllDrugs();
    }
  }, [itemType]);

  const fetchAllDrugs = async () => {
    try {
      const res = await api.get('/items/drugs');
      setAllDrugs(res.data || []);
    } catch (e) {
      console.error('Failed to fetch drugs:', e);
    }
  };

  const handleOtherItemSearch = async () => {
    if (!selectedOtherItemCode) return;
    setLoadingOtherItem(true);
    try {
      const res = await api.get('/monthly-indent/other-item', { params: { itemCode: selectedOtherItemCode } });
      const newItems = res.data || [];
      if (newItems.length === 0) {
        alert('No data found for this item code.');
      } else {
        const itemIds = newItems.map(i => i.ITEMID || i.itemId);
        const alreadySaved = itemIds.some(id => savedItems.some(saved => (saved.ITEMID || saved.itemId) === id));
        
        if (alreadySaved) {
          alert('This item is already in your Saved Indent Items below. You can edit its quantity there.');
          setSelectedOtherItemCode('');
          return;
        }

        setFmItems(prev => {
          const existingIds = new Set(prev.map(i => i.ITEMID || i.itemId));
          const filteredNew = newItems.filter(i => !existingIds.has(i.ITEMID || i.itemId));
          return [...prev, ...filteredNew];
        });
        setSelectedOtherItemCode('');
      }
    } catch (e) {
      console.error('Failed to fetch other item:', e);
      alert('Failed to fetch item details.');
    } finally {
      setLoadingOtherItem(false);
    }
  };

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const [resYears, resPrograms] = await Promise.all([
        api.get('/ward-issue/acc-years'),
        api.get('/monthly-indent/programs')
      ]);

      const mappedYears = (resYears.data || []).map(y => 
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y.ACCYRSETID || y.accYrSetId, SHAccYear: y.SHACCYEAR || y.shAccYear }
      );
      setAccYears(mappedYears);
      
      const mappedPrograms = (resPrograms.data || []).map(p => 
        Array.isArray(p) ? { ProgramID: p[0], ProgramName: p[1] } : { ProgramID: p.PROGRAMID || p.programId, ProgramName: p.PROGRAMNAME || p.programName }
      );
      setProgramsList(mappedPrograms);

      if (mappedYears.length > 0) {
        // Find 'Regular supply' ignoring case and spaces
        const defaultProgram = mappedPrograms.find(p => 
          p.ProgramName && p.ProgramName.toLowerCase().replace(/\s+/g, '') === 'regularsupply'
        );
        const defaultProgramId = defaultProgram ? defaultProgram.ProgramID : (mappedPrograms.length > 0 ? mappedPrograms[0].ProgramID : '');

        setForm(prev => ({ 
          ...prev, 
          finYear: mappedYears[0].AccYrSetID,
          programId: defaultProgramId
        }));
      }

      // If we are editing an existing NOC
      if (editNocId) {
        const nocRes = await api.get(`/monthly-indent/${editNocId}`);
        const noc = nocRes.data;
        if (noc) {
          setRequestNo(noc.NOCNUMBER || noc.nocNumber);
          setEditNocIdInternal(noc.NOCID || noc.id || editNocId);
          setForm({
            finYear: noc.ACCYRSETID || noc.accYrSetId,
            reqDate: (noc.NOCDATE || noc.nocDate).split(' ')[0] || today,
            programId: noc.PROGRAMID || noc.programId
          });
        }
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleGenerateRequestNo = async () => {
    // Basic validation
    const errs = {};
    if (!form.finYear) errs.finYear = 'Required';
    if (!form.reqDate) errs.reqDate = 'Required';
    if (!form.programId) errs.programId = 'Required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Generate the number
      const res = await api.post(`/monthly-indent/generate-no`, { facilityId });
      const generatedNo = res.data.nocNumber;

      // 2. Format date from yyyy-mm-dd to dd-mm-yyyy for the backend
      const [year, month, day] = form.reqDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      // 3. Create the header record in the database
      const headerRes = await api.post('/monthly-indent/', {
        accYrSetId: form.finYear,
        nocNumber: generatedNo,
        nocDate: formattedDate,
        programId: form.programId
      });

      // 4. Update UI if successful
      setRequestNo(generatedNo);
      if (headerRes.data && headerRes.data.nocId) {
        setEditNocIdInternal(headerRes.data.nocId);
      }
    } catch (error) {
      console.error("Failed to generate Request No", error);
      if (error.response?.status === 409) {
        alert(error.response.data.error);
        setRequestNo('');
        navigate('/indent/warehouse');
      } else {
        alert('Failed to generate request number or create indent. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    navigate('/indent/warehouse');
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || { checked: false, issueQty: '' };
      return {
        ...prev,
        [itemId]: { ...current, checked: !current.checked }
      };
    });
  };

  const updateItemIssueQty = (itemId, val) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || { checked: false, issueQty: '' };
      return {
        ...prev,
        [itemId]: { ...current, issueQty: val }
      };
    });
  };

  const handleSaveItems = async () => {
    if (!editNocIdInternal) {
      alert('Please generate a Request No. before saving items.');
      return;
    }
    
    // Gather all checked items that have a valid issue quantity
    const itemsToSave = [];
    const availableFmItems = fmItems.filter(item => {
      const id = item.ITEMID || item.itemId;
      return !savedItems.some(saved => (saved.ITEMID || saved.itemId) === id);
    });

    for (const item of availableFmItems) {
      const selection = selectedItems[item.ITEMID || item.itemId];
      if (selection && selection.checked && parseFloat(selection.issueQty) > 0) {
        const readyStock = parseFloat(item.READYSTOCKWHNOS || item.ReadyStockWHNos || 0);
        const uqcStock = parseFloat(item.UQCSTOCKWHNOS || item.UQCStockWHNos || 0);
        const maxAllowed = readyStock + uqcStock;
        if (parseFloat(selection.issueQty) > maxAllowed) {
          alert(`Quantity for ${item.ITEMNAME || item.itemName} cannot exceed Ready Stock + UQC Stock (${maxAllowed}).`);
          return;
        }
        itemsToSave.push({
          itemId: item.ITEMID || item.itemId,
          requestedqty: parseFloat(selection.issueQty),
          whStock: readyStock,
          whStockQcPending: uqcStock,
          otherWhStock: 0,
          stockInHand: 0,
          itemRemarks: '',
          cgmsclRemarks: '',
          itemType: itemType === 'fm_item' ? 'FM-items' : itemType
        });
      }
    }

    if (itemsToSave.length === 0) {
      alert('Please select at least one item and enter a valid Issue Qty.');
      return;
    }

    setSavingItems(true);
    try {
      await api.post(`/monthly-indent/${editNocIdInternal}/items`, { items: itemsToSave });
      alert('Items saved successfully!');
      setSelectedItems({});
      fetchSavedItems(); // Refresh the saved items table
    } catch (e) {
      console.error('Failed to save items', e);
      alert('Failed to save items.');
    } finally {
      setSavingItems(false);
    }
  };

  const handleCompleteNoc = async () => {
    if (!editNocIdInternal) return;
    if (savedItems.length === 0) {
      alert('Please add at least one item before completing the NOC.');
      return;
    }
    if (window.confirm('Are you sure you want to complete this NOC? This action cannot be undone.')) {
      try {
        await api.post(`/monthly-indent/${editNocIdInternal}/complete`);
        alert('NOC Completed successfully!');
        navigate('/indent/warehouse');
      } catch (e) {
        console.error('Failed to complete NOC:', e);
        alert('Failed to complete NOC');
      }
    }
  };

  const handleDeleteNoc = async () => {
    if (!editNocIdInternal) return;
    if (window.confirm('Are you sure you want to delete this NOC? This will also delete all items under it.')) {
      try {
        await api.delete(`/monthly-indent/${editNocIdInternal}`);
        alert('NOC Deleted successfully!');
        navigate('/indent/warehouse');
      } catch (e) {
        console.error('Failed to delete NOC:', e);
        alert('Failed to delete NOC');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="w-full space-y-4">
              
              {/* Top Action Bar & Form Header */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 md:p-4">
                  <div className="flex flex-col gap-4">
                    
                    {/* Top: Title & Back */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                      <button
                        onClick={handleBack}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Back to List"
                      >
                        <ArrowLeftIcon className="w-5 h-5" />
                      </button>
                      <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight whitespace-nowrap">Add Indent to Warehouse</h1>
                    </div>
                    
                    {/* Bottom: Form Fields */}
                    <div className="flex flex-wrap items-end gap-4 w-full">
                    
                    {/* Fin Year */}
                    <div className="space-y-1.5 w-28 flex-shrink-0">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Fin Year <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="finYear"
                        value={form.finYear}
                        onChange={handleChange}
                        disabled={loadingFilters || !!requestNo}
                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700
                          ${errors.finYear ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'}`}
                      >
                        <option value="">Select Fin Year</option>
                        {accYears.map(y => (
                          <option key={y.AccYrSetID} value={y.AccYrSetID}>{y.SHAccYear}</option>
                        ))}
                      </select>
                      {errors.finYear && <p className="text-xs text-rose-500 mt-1">{errors.finYear}</p>}
                    </div>

                    {/* Requested Date */}
                    <div className="space-y-1.5 w-36 flex-shrink-0">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Requested Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="reqDate"
                        value={form.reqDate}
                        readOnly
                        disabled={true}
                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-slate-100 focus:outline-none transition-all font-semibold text-slate-500 cursor-not-allowed border-slate-200`}
                      />
                    </div>

                    {/* Program */}
                    <div className="space-y-1.5 flex-1 min-w-[200px] max-w-sm">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Program <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="programId"
                        value={form.programId}
                        onChange={handleChange}
                        disabled={!!requestNo}
                        className={`w-full h-10 px-3 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700
                          ${errors.programId ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'}`}
                      >
                        <option value="">Select Program</option>
                        {programsList.map(p => (
                          <option key={p.ProgramID} value={p.ProgramID}>{p.ProgramName}</option>
                        ))}
                      </select>
                      {errors.programId && <p className="text-xs text-rose-500 mt-1">{errors.programId}</p>}
                    </div>

                    {/* Request No & Generate */}
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Request No.
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={loadingFilters ? 'Loading...' : requestNo}
                          placeholder="Auto Generated"
                          className={`flex-1 min-w-0 h-10 px-3 border border-slate-200 rounded-xl text-sm font-bold cursor-not-allowed ${
                            requestNo 
                              ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-inner' 
                              : loadingFilters 
                                ? 'bg-amber-50 text-amber-600 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        />
                        {!requestNo && (
                          <button
                            type="button"
                            onClick={handleGenerateRequestNo}
                            disabled={isGenerating}
                            className="h-10 px-4 flex-shrink-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? 'Generating...' : 'Generate'}
                          </button>
                        )}
                      </div>
                    </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Item Type & Table */}
              {requestNo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-3 md:p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
                    {/* Item Type Dropdown */}
                    <div className="w-full md:w-1/3 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                          value={itemType}
                          onChange={(e) => setItemType(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                        >
                          <option value="">Select Item Type</option>
                          <option value="fm_item">fm item</option>
                          <option value="STOCK_AND_AVAILABLE">stock out and available in warehouse</option>
                          <option value="INDENT_DHS">indent given by DHS</option>
                          <option value="OTHER">other</option>
                        </select>
                    </div>

                    {itemType === 'OTHER' && (
                      <div className="w-full md:w-2/3 flex items-end gap-2">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Select Item Code or Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            list="drugsList"
                            value={selectedOtherItemCode}
                            onChange={(e) => setSelectedOtherItemCode(e.target.value)}
                            placeholder="Type Item Code or Name..."
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                          />
                          <datalist id="drugsList">
                            {allDrugs.map(drug => (
                              <option key={drug.itemid} value={drug.itemcode}>
                                {drug.itemname} ({drug.itemcode})
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <button 
                          onClick={handleOtherItemSearch}
                          disabled={!selectedOtherItemCode || loadingOtherItem}
                          className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                        >
                          {loadingOtherItem ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                    )}
                  </div>

                  {itemType && (
                    <div className="space-y-4">
                      {loadingFmItems ? (
                        <div className="py-10 flex flex-col items-center justify-center space-y-3">
                          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm font-semibold text-slate-500">Loading stock data...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-end">
                            <button 
                              onClick={handleSaveItems}
                              disabled={savingItems || !editNocIdInternal}
                              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {savingItems ? 'Saving...' : 'Save Selected Items'}
                            </button>
                          </div>
                          
                          <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-slate-200 rounded-xl relative shadow-sm">
                            <table className="w-full text-xs text-left bg-white whitespace-nowrap">
                              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                                  <th className="px-1 py-3 border-b border-slate-200 text-center w-10">Select</th>
                                  <th className="px-4 py-3 border-b border-slate-200">Item Code</th>
                                  <th className="px-2 py-3 border-b border-slate-200 min-w-[200px]">Item Name</th>
                                  <th className="px-2 py-3 border-b border-slate-200">Strength</th>
                                  <th className="px-2 py-3 border-b border-slate-200">Unit</th>

                                  {(itemType === 'STOCK_AND_AVAILABLE' || itemType === 'INDENT_DHS') && (
                                    <>
                                      {/* <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Warehouse Name</th>
                                      <th className="px-4 py-3 border-b border-slate-200">Category</th>
                                      <th className="px-4 py-3 border-b border-slate-200">EDL Type</th>
                                      <th className="px-4 py-3 border-b border-slate-200">Program</th>
                                      <th className="px-4 py-3 border-b border-slate-200 min-w-[150px]">Program Items</th>
                                      <th className="px-4 py-3 border-b border-slate-200 min-w-[150px]">AI Status</th> */}
                                      {/* <th className="px-4 py-3 border-b border-slate-200">EDL</th>
                                      <th className="px-4 py-3 border-b border-slate-200 text-center">ABC</th>
                                      <th className="px-4 py-3 border-b border-slate-200 text-center">VED</th> */}
                                    </>
                                  )}

                                  <th className="px-4 py-3 border-b border-slate-200 text-right">Ready Stock</th>
                                  <th className="px-4 py-3 border-b border-slate-200 text-right">UQC Stock</th>
                                  <th className="px-1 py-3 border-b border-slate-200 text-right">Pipeline Stock</th>
                                  <th className="px-1 py-3 border-b border-slate-200 text-right">Facility Stock</th>
                                  
                                  {(itemType === 'STOCK_AND_AVAILABLE' || itemType === 'INDENT_DHS') && (
                                    <>
                                      {/* <th className="px-4 py-3 border-b border-slate-200 text-right">Near Exp (3M)</th> */}
                                      {/* <th className="px-4 py-3 border-b border-slate-200 min-w-[120px]">Receipt Date WH</th>
                                      <th className="px-4 py-3 border-b border-slate-200 min-w-[120px]">QC Passed DT</th> */}
                                    </>
                                  )}

                                  {/* <th className="px-4 py-3 border-b border-slate-200">Group Name</th> */}
                                  <th className="px-4 py-3 border-b border-slate-200">Issue Qty</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {fmItems.filter(item => {
                                  const id = item.ITEMID || item.itemId;
                                  return !savedItems.some(saved => (saved.ITEMID || saved.itemId) === id);
                                }).sort((a, b) => {
                                  const aReadyStock = parseFloat(a.READYSTOCKWHNOS ?? a.ReadyStockWHNos ?? 0);
                                  const aUqcStock = parseFloat(a.UQCSTOCKWHNOS ?? a.UQCStockWHNos ?? 0);
                                  const aIsDisabled = aReadyStock === 0 && aUqcStock === 0;

                                  const bReadyStock = parseFloat(b.READYSTOCKWHNOS ?? b.ReadyStockWHNos ?? 0);
                                  const bUqcStock = parseFloat(b.UQCSTOCKWHNOS ?? b.UQCStockWHNos ?? 0);
                                  const bIsDisabled = bReadyStock === 0 && bUqcStock === 0;

                                  if (aIsDisabled === bIsDisabled) return 0;
                                  return aIsDisabled ? 1 : -1;
                                }).map(item => {
                                  const id = item.ITEMID || item.itemId;
                                  const selection = selectedItems[id] || { checked: false, issueQty: '' };
                                  
                                  const readyStock = parseFloat(item.READYSTOCKWHNOS ?? item.ReadyStockWHNos ?? 0);
                                  const uqcStock = parseFloat(item.UQCSTOCKWHNOS ?? item.UQCStockWHNos ?? 0);
                                  const isDisabled = readyStock === 0 && uqcStock === 0;

                                  return (
                                    <tr key={id} className={`hover:bg-slate-50/50 transition-colors ${selection.checked ? 'bg-blue-50/30' : ''} ${isDisabled ? 'bg-slate-100/50' : ''}`}>
                                      <td className="px-1 py-3 text-center align-middle">
                                        <input 
                                          type="checkbox" 
                                          checked={selection.checked && !isDisabled}
                                          onChange={() => {
                                            if (!isDisabled) toggleItemSelection(id);
                                          }}
                                          disabled={isDisabled}
                                          className={`w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                        />
                                      </td>
                                      <td className={`px-3 py-3 font-mono font-bold ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.ITEMCODE || item.itemCode}</td>
                                      <td className={`px-3 py-3 max-w-xs break-words whitespace-normal ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.ITEMNAME || item.itemName}</td>
                                      <td className={`px-3 py-3 max-w-xs break-words whitespace-normal ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.STRENGTH1 || item.strength1}</td>
                                      <td className={`px-3 py-3 max-w-xs break-words whitespace-normal ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.UNIT || item.unit}</td>

                                      {(itemType === 'STOCK_AND_AVAILABLE' || itemType === 'INDENT_DHS') && (
                                        <>
                                          {/* <td className={`px-3 py-3 font-medium whitespace-nowrap ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.WAREHOUSENAME}</td>
                                          <td className={`px-3 py-3 ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.MCATEGORY}</td>
                                          <td className={`px-3 py-3 whitespace-nowrap ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.EDLTYPE}</td>
                                          <td className={`px-3 py-3 ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.PROGRAM}</td>
                                          <td className={`px-3 py-3 min-w-[150px] ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.PROGRAMITEMS}</td>
                                          <td className={`px-3 py-3 min-w-[150px] ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.AISTATUS}</td>
                                          <td className={`px-3 py-3 font-bold text-center ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.EDL}</td>
                                          <td className={`px-3 py-3 font-bold text-center ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.ABCCATEGORY}</td>
                                          <td className={`px-3 py-3 font-bold text-center ${isDisabled ? 'text-slate-400' : 'text-slate-600'}`}>{item.VEDCATEGORY}</td> */}
                                        </>
                                      )}

                                      <td className={`px-4 py-3 text-right font-bold ${isDisabled ? 'text-emerald-400 bg-emerald-50/30' : 'text-emerald-600 bg-emerald-50/50'}`}>{readyStock}</td>
                                      <td className={`px-3 py-3 text-right font-bold ${isDisabled ? 'text-amber-400 bg-amber-50/30' : 'text-amber-600 bg-amber-50/50'}`}>{uqcStock}</td>
                                      <td className={`px-3 py-3 text-right font-bold ${isDisabled ? 'text-blue-400' : 'text-blue-600'}`}>{item.IWHPIPLINESTOCKNOS ?? item.IWHPiplineStockNos ?? 0}</td>
                                      <td className={`px-3 py-3 text-right font-bold ${isDisabled ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.FACILITYSTOCK || 0}</td>

                                      {(itemType === 'STOCK_AND_AVAILABLE' || itemType === 'INDENT_DHS') && (
                                        <>
                                          {/* <td className={`px-3 py-3 text-right font-bold ${isDisabled ? 'text-rose-400' : 'text-rose-600'}`}>{item.NEAREXPQTY3MONTH || 0}</td> */}
                                          {/* <td className="px-3 py-3 text-slate-500 whitespace-nowrap min-w-[120px]">{item.RECEIPTDATEWH || '-'}</td>
                                          <td className="px-3 py-3 text-slate-500 whitespace-nowrap min-w-[120px]">{item.QCPASSEDDT || '-'}</td> */}
                                        </>
                                      )}
                                      <td className="px-3 py-3">
                                        <input 
                                          type="number"
                                          min="1"
                                          placeholder="Qty"
                                          value={selection.issueQty}
                                          onChange={(e) => updateItemIssueQty(id, e.target.value)}
                                          onBlur={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const typeName = (item.ITEMTYPENAME || item.itemtypename || '').toUpperCase();
                                            if (['TABLET', 'CAPSULE', 'TABLET/CAPSULE'].includes(typeName)) {
                                              const unitCount = parseInt(item.UNITCOUNT || item.unitcount || 1, 10);
                                              const qty = parseInt(val, 10);
                                              if (qty % unitCount !== 0) {
                                                alert(`For ${typeName}, quantity must be a multiple of ${unitCount}.`);
                                                updateItemIssueQty(id, '');
                                              }
                                            }
                                          }}
                                          disabled={!selection.checked || isDisabled}
                                          className={`w-24 h-8 px-2 border rounded text-sm font-bold ${
                                            (selection.checked && !isDisabled)
                                              ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white' 
                                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                          }`}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                                {fmItems.filter(item => {
                                  const id = item.ITEMID || item.itemId;
                                  return !savedItems.some(saved => (saved.ITEMID || saved.itemId) === id);
                                }).length === 0 && (
                                  <tr>
                                    <td colSpan="10" className="px-4 py-8 text-center text-slate-400 font-semibold">
                                      No items found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                      
                      {/* Saved Items Table */}
                      {savedItems.length > 0 && (
                        <div className="mt-8 border-t border-slate-200 pt-6">
                          <h3 className="text-lg font-bold text-slate-700 mb-4">Saved Indent Items</h3>
                          <div className="overflow-x-auto border border-slate-200 rounded-xl relative shadow-sm">
                            <table className="w-full text-xs text-left bg-white whitespace-nowrap">
                              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">
                                  <th className="px-4 py-3 border-b border-slate-200">Sl No</th>
                                  <th className="px-4 py-3 border-b border-slate-200">Item Code</th>
                                  <th className="px-4 py-3 border-b border-slate-200 min-w-[200px]">Item Name</th>
                                  <th className="px-4 py-3 border-b border-slate-200">Strength</th>
                                  <th className="px-4 py-3 border-b border-slate-200">Unit</th>
                                  <th className="px-4 py-3 border-b border-slate-200 text-right">Requested Qty</th>
                                  <th className="px-4 py-3 border-b border-slate-200 text-right">WH Stock</th>
                                  <th className="px-4 py-3 border-b border-slate-200 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {savedItems.map((item, index) => (
                                  <tr key={item.NOCITEMID || index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 font-bold">{index + 1}</td>
                                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{item.ITEMCODE || item.ItemCode}</td>
                                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-normal min-w-[200px]">{item.ITEMNAME || item.ItemName}</td>
                                      <td className="px-4 py-3 text-slate-600">{item.STRENGTH1 || item.Strength1}</td>
                                      <td className="px-4 py-3 text-slate-600">{item.UNIT || item.Unit}</td>
                                      <td className="px-4 py-3 text-right font-bold text-indigo-600 bg-indigo-50/30">
                                      {editingItemId === item.NOCITEMID ? (
                                        <input
                                          type="number"
                                          className="w-24 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                                          value={editingQty}
                                          onChange={(e) => setEditingQty(e.target.value)}
                                          min="1"
                                          max={Number(item.WHSTOCK || 0) + Number(item.WHSTOCKQCPENDING || 0)}
                                        />
                                      ) : (
                                        item.REQUESTEDQTY
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600">{item.WHSTOCK}</td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex justify-center space-x-2">
                                        {editingItemId === item.NOCITEMID ? (
                                          <>
                                            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded shadow-sm text-sm transition-colors" onClick={async () => {
                                              const newQty = Number(editingQty);
                                              if (newQty > 0) {
                                                const maxAllowed = Number(item.WHSTOCK || 0) + Number(item.WHSTOCKQCPENDING || 0);
                                                if (newQty > maxAllowed) {
                                                  alert(`Requested Qty cannot exceed Ready Stock + UQC Stock (${maxAllowed}).`);
                                                  return;
                                                }
                                                try {
                                                  await api.put(`/monthly-indent/items/${item.NOCITEMID}`, { requestedqty: newQty });
                                                  setEditingItemId(null);
                                                  fetchSavedItems();
                                                } catch (e) {
                                                  console.error('Failed to update item:', e);
                                                  alert('Failed to update item');
                                                }
                                              } else {
                                                alert('Please enter a valid quantity.');
                                              }
                                            }}>Save</button>
                                            <button className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-1 px-3 rounded shadow-sm text-sm transition-colors" onClick={() => setEditingItemId(null)}>Cancel</button>
                                          </>
                                        ) : (
                                          <>
                                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded shadow-sm text-sm transition-colors" onClick={() => {
                                              setEditingItemId(item.NOCITEMID);
                                              setEditingQty(item.REQUESTEDQTY);
                                            }}>Edit</button>
                                            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded shadow-sm text-sm transition-colors" onClick={async () => {
                                              if (window.confirm('Are you sure you want to delete this item?')) {
                                                try {
                                                  await api.delete(`/monthly-indent/items/${item.NOCITEMID}`);
                                                  fetchSavedItems();
                                                } catch (e) {
                                                  console.error('Failed to delete item:', e);
                                                  alert('Failed to delete item');
                                                }
                                              }
                                            }}>Delete</button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center gap-4 mt-6">
                        <button onClick={handleCompleteNoc} className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500">
                          Complete NOC
                        </button>
                        <button onClick={handleDeleteNoc} className="px-8 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500">
                          Delete NOC
                        </button>
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
