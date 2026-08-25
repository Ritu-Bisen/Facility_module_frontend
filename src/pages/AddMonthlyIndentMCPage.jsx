import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

const today = new Date().toISOString().split('T')[0];

function SearchDrop({ options, value, onChange, placeholder, labelKey, valueKey, disabled, isLoading }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef();

  const list = q.trim()
    ? options.filter((o) => (o[labelKey] || '').toLowerCase().includes(q.toLowerCase()))
    : options;

  const selected = options.find((o) => String(o[valueKey]) === String(value));

  useEffect(() => {
    const h = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openDrop = () => { if (disabled || isLoading) return; setQ(''); setOpen(true); };
  const pick = (o) => { onChange(o[valueKey]); setOpen(false); setQ(''); };
  const clearSelection = (e) => { e.stopPropagation(); onChange(''); setOpen(false); setQ(''); };

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        onClick={openDrop}
        className={`flex items-center justify-between gap-2 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer select-none transition
          ${(disabled || isLoading) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : open     ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
            : 'bg-slate-50 border-slate-200 hover:border-blue-400'}`}
      >
        <span className={`truncate font-semibold ${selected && !isLoading ? 'text-slate-700' : 'text-slate-400'}`}>
          {isLoading ? 'Loading...' : (selected ? selected[labelKey] : placeholder)}
        </span>
        <div className="flex items-center gap-1">
          {selected && !isLoading && (
             <button onClick={clearSelection} className="text-slate-400 hover:text-red-500 text-lg font-bold leading-none mr-1" title="Clear">&times;</button>
          )}
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-[200] top-full mt-1 w-full min-w-[220px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to filter…"
                className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 min-w-0"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-slate-400 hover:text-slate-600 flex-shrink-0 text-sm">✕</button>
              )}
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {list.length === 0
              ? <li className="px-4 py-3 text-sm text-slate-400 text-center">No results</li>
              : list.map((o, i) => (
                <li
                  key={o[valueKey] ?? i}
                  onClick={() => pick(o)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 border-b border-slate-50 last:border-0
                    ${String(o[valueKey]) === String(value) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                >
                  {o[labelKey]}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AddMonthlyIndentMCPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editNocId = searchParams.get('nocId');

  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [accYears, setAccYears] = useState([]);
  const [programsList, setProgramsList] = useState([]);

  const [form, setForm] = useState({
    finYear: '',
    reqDate: today,
    programId: '',
  });

  const [requestNo, setRequestNo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editNocIdInternal, setEditNocIdInternal] = useState(editNocId);

  const [items, setItems] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState(null);

  const [itemCategory, setItemCategory] = useState('');
  const [itemCategories, setItemCategories] = useState([]);
  const [itemType, setItemType] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [fmItems, setFmItems] = useState([]);
  const [allDrugs, setAllDrugs] = useState([]);
  const [selectedOtherItemCode, setSelectedOtherItemCode] = useState('');
  const [loadingOtherItem, setLoadingOtherItem] = useState(false);
  const [loadingFmItems, setLoadingFmItems] = useState(false);

  // New loading states
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isRowSaving, setIsRowSaving] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingRowData, setEditingRowData] = useState({});

  useEffect(() => {
    api.get('/monthly-indent/item-categories').then(res => setItemCategories(res.data || [])).catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (itemType && facilityId) {
      fetchFmItems();
    } else {
      setFmItems([]);
    }
  }, [itemType, facilityId, itemCategory]);

  const fetchFmItems = async () => {
    setLoadingFmItems(true);
    try {
      let endpoint = '';
      let params = {};
      if (itemType === 'fm_item') {
        endpoint = '/monthly-indent/fm-items';
        params = { itemType: 'FM-items', categoryId: itemCategory || 1 };
      } else if (itemType === 'STOCK_AND_AVAILABLE') {
        endpoint = '/monthly-indent/warehouse-items';
        params = { itemType, categoryId: itemCategory || 1 };
      } else if (itemType === 'INDENT_DHS') {
        endpoint = '/monthly-indent/dhs-indent-items';
        params = { categoryId: itemCategory || 1 };
      } else if (itemType === 'AGAINST_APPROVAL_INDENT') {
        endpoint = '/monthly-indent/against-approval-indent';
        params = { categoryId: itemCategory || 1 };
      }
      
      if (endpoint) {
        const res = await api.get(endpoint, { params });
        setFmItems(res.data || []);
      } else {
        setFmItems([]);
      }
    } catch (e) {
      console.error('Failed to fetch items:', e);
    } finally {
      setLoadingFmItems(false);
    }
  };

  const fetchAllDrugs = async () => {
    try {
      const res = await api.get('/monthly-indent/all-drugs');
      setAllDrugs(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (itemType === 'OTHER' && allDrugs.length === 0) {
      fetchAllDrugs();
    }
  }, [itemType]);

  const handleOtherItemSearch = async () => {
    if (!selectedOtherItemCode) return;
    const drug = allDrugs.find(d => String(d.itemcode) === String(selectedOtherItemCode));
    if (drug) {
      // Create a mapped object to match what handleSelectItem expects
      const mappedDrug = {
        ITEMID: drug.itemid,
        ITEMCODE: drug.itemcode,
        ITEMNAME: drug.itemname,
        STRENGTH1: drug.strength1 || '',
        UNIT: drug.unit || ''
      };
      setIsAdding(true);
      handleSelectItem(mappedDrug);
      setSelectedOtherItemCode('');
    } else {
      alert("Item not found");
    }
  };

  useEffect(() => {
    if (facilityId) loadFilters();
  }, [facilityId]);

  const loadFilters = async () => {
    setIsPageLoading(true);
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
        const defaultProgram = mappedPrograms.find(p => p.ProgramName && p.ProgramName.toLowerCase().replace(/\s+/g, '') === 'regularsupply');
        const defaultProgramId = defaultProgram ? defaultProgram.ProgramID : (mappedPrograms.length > 0 ? mappedPrograms[0].ProgramID : '');
        setForm(prev => ({ ...prev, finYear: mappedYears[0].AccYrSetID, programId: defaultProgramId }));
      }

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
          fetchItems(noc.NOCID || noc.id || editNocId);
        }
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setIsPageLoading(false);
    }
  };

  const fetchItems = async (id) => {
    setIsTableLoading(true);
    try {
      const res = await api.get(`/monthly-indent/${id}/items`, { params: { isMC: true } });
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleGenerateRequestNo = async () => {
    if (!form.finYear || !form.reqDate || !form.programId) {
      alert("Please select Fin Year and Program.");
      return; 
    }

    setIsGenerating(true);
    try {
      const res = await api.post(`/monthly-indent/generate-no`, { facilityId });
      const generatedNo = res.data.nocNumber;
      const [year, month, day] = form.reqDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const headerRes = await api.post('/monthly-indent/', {
        accYrSetId: form.finYear, nocNumber: generatedNo, nocDate: formattedDate, programId: form.programId
      });

      setRequestNo(generatedNo);
      if (headerRes.data && headerRes.data.nocId) {
        setEditNocIdInternal(headerRes.data.nocId);
        navigate(`?nocId=${headerRes.data.nocId}`, { replace: true });
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate request number.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItemClick = () => {
    setIsAdding(true);
    setNewItem({
      itemId: null, itemCode: '', itemName: '', strength: '', unit: '',
      whStock: 0, otherWhStock: 0, whStockQcPending: 0, estDate: '', facStock: 0,
      aiQty: 0, whIssueQty: 0, nocQty: 0, balAiQty: 0,
      requestedQty: '', remarks: '', itemType: 'FM-items'
    });
  };

  const handleSelectItem = async (drug) => {
    // Check if item is already saved
    if (items.some(item => item.ITEMID === drug.ITEMID)) {
      alert("This item is already added to the list.");
      setSearchFilter('');
      return;
    }

    setSearchFilter(drug.ITEMCODE + '-' + drug.ITEMNAME);
    try {
      const res = await api.get(`/monthly-indent/item-stock-details`, { params: { itemId: drug.ITEMID, isMC: true } });
      const d = res.data;
      setNewItem({
        ...newItem,
        itemId: drug.ITEMID,
        itemCode: drug.ITEMCODE,
        itemName: drug.ITEMNAME,
        itemType: drug.ITEMTYPENAME || drug.itemType || drug.ITEMTYPE || 'Other',
        strength: drug.STRENGTH1 || drug.strength || '',
        sku: drug.UNIT || drug.sku || '',
        packQty: drug.UNITCOUNT || d.unitCount || '',
        edlType: drug.EDL || drug.edlType || '',
        itemTypeName: drug.ITEMTYPENAME || drug.itemTypeName || '',
        whStock: d.whStock,
        otherWhStock: d.otherWhStock,
        whStockQcPending: d.qcStock,
        estDate: d.estDate || '',
        facStock: d.facStock || 0,
        aiQty: d.aiQty || 0,
        whIssueQty: d.whIssueQty || 0,
        nocQty: d.nocQty || 0,
        balAiQty: d.balAiQty || 0,
        requestedQty: '',
        remarks: ''
      });
    } catch(e) {
      console.error(e);
      alert('Failed to fetch item stock details.');
    }
  };

  const saveRow = async (itemData) => {
    if (!itemData.itemId || !itemData.requestedQty) {
      alert("Item and Requested Qty are required.");
      return;
    }
    
    // Check multiple of unit count
    if (itemData.unitCount && parseInt(itemData.requestedQty) % parseInt(itemData.unitCount) !== 0) {
       alert(`Quantity must be a multiple of ${itemData.unitCount}`);
       return;
    }

    // Format estimatedDate to strictly YYYY-MM-DD to prevent ORA-01830
    let safeEstDate = itemData.estDate || null;
    if (safeEstDate && safeEstDate !== 'null' && typeof safeEstDate === 'string') {
      safeEstDate = safeEstDate.split('T')[0].split(' ')[0]; // Strip time
      
      const parts = safeEstDate.split('-');
      if (parts.length === 3) {
        // If the 3rd part is the year (dd-mm-yyyy)
        if (parts[2].length === 4) {
          safeEstDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    } else {
      safeEstDate = null;
    }

    setIsRowSaving(true);
    try {
      await api.post(`/monthly-indent/${editNocIdInternal}/items`, {
        itemId: itemData.itemId,
        requestedqty: itemData.requestedQty,
        whStock: itemData.whStock,
        itemRemarks: itemData.remarks || null,
        whStockQcPending: itemData.whStockQcPending,
        estimatedDate: safeEstDate,
        whId: 0,
        cgmsclRemarks: null,
        otherWhStock: itemData.otherWhStock,
        stockInHand: itemData.facStock,
        itemType: itemData.itemType,
        status: 'Y',
        approvedQty: 0,
        bookedQty: 0,
        bookedFlag: null,
        entry_date: today,
        balAiQty: itemData.balAiQty
      });
      setIsAdding(false);
      setNewItem(null);
      setSearchFilter('');
      fetchItems(editNocIdInternal);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to save item.");
    } finally {
      setIsRowSaving(false);
    }
  };

  const deleteRow = async (nocItemId) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/monthly-indent/items/${nocItemId}`);
      fetchItems(editNocIdInternal);
    } catch(e) {
      alert("Failed to delete.");
    }
  };

  const startEditing = (item) => {
    setEditingRowId(item.NOCITEMID);
    setEditingRowData({
      stockInHand: item.STOCKINHAND || 0,
      requestedQty: item.REQUESTEDQTY || 0,
      remarks: item.REMARKS && item.REMARKS !== 'null' ? item.REMARKS : ''
    });
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setEditingRowData({});
  };

  const saveEditedRow = async (nocItemId) => {
    try {
      await api.put(`/monthly-indent/items/${nocItemId}`, {
        requestedqty: editingRowData.requestedQty,
        stockInHand: editingRowData.stockInHand,
        itemRemarks: editingRowData.remarks
      });
      setEditingRowId(null);
      setEditingRowData({});
      fetchItems(editNocIdInternal);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to update item.");
    }
  };

  const completeNoc = async () => {
    if (!editNocIdInternal) return;
    if (items.length === 0) { alert('Please enter Item details first.'); return; }
    try {
      await api.post(`/monthly-indent/${editNocIdInternal}/complete`);
      alert('Saved Successfully');
      navigate('/indent/warehouse');
    } catch(e) {
      alert('Failed to complete.');
    }
  };

  const deleteNoc = async () => {
    if (!editNocIdInternal) return;
    if(!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/monthly-indent/${editNocIdInternal}`);
      alert('Deleted Successfully');
      navigate('/indent/warehouse');
    } catch(e) {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-sm">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="w-full space-y-4">
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-4">
                  <button onClick={() => navigate('/indent/warehouse')} className="p-2 text-slate-400 hover:text-blue-600 rounded-full">
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-extrabold text-blue-600">Generate Request No For Monthly Indent/NOC (MC Facility)</h1>
                </div>
                
                <div className="grid grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Fin Year *</label>
                    <select name="finYear" value={form.finYear} onChange={e=>setForm({...form, finYear: e.target.value})} disabled={!!requestNo || isPageLoading} className="w-full h-8 px-2 border rounded-md">
                      <option value="">{isPageLoading ? 'Loading...' : 'Select'}</option>
                      {accYears.map(y => <option key={y.AccYrSetID} value={y.AccYrSetID}>{y.SHAccYear}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Requested Date *</label>
                    <input type="date" value={form.reqDate} disabled className="w-full h-8 px-2 border rounded-md bg-slate-100" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Program *</label>
                    <select name="programId" value={form.programId} onChange={e=>setForm({...form, programId: e.target.value})} disabled={!!requestNo || isPageLoading} className="w-full h-8 px-2 border rounded-md">
                      <option value="">{isPageLoading ? 'Loading...' : 'Select'}</option>
                      {programsList.map(p => <option key={p.ProgramID} value={p.ProgramID}>{p.ProgramName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Request No.</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={isPageLoading ? 'Loading...' : (requestNo || 'AUTO GENERATED')} className="flex-1 h-8 px-2 border rounded-md bg-slate-100 font-bold text-slate-600" />
                      {!requestNo && (
                        <button onClick={handleGenerateRequestNo} disabled={isGenerating || isPageLoading} className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs disabled:opacity-50 flex items-center justify-center">
                          {isGenerating ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {requestNo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
                    {/* Item Category Dropdown */}
                    <div className="w-full md:w-1/3 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                          value={itemCategory}
                          onChange={(e) => setItemCategory(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                        >
                          <option value="">Select Item Category</option>
                          {itemCategories.map(cat => (
                            <option key={cat.MCID} value={cat.MCID}>
                              {cat.MCATEGORY}
                            </option>
                          ))}
                        </select>
                    </div>

                    {/* Item Source Dropdown */}
                    <div className="w-full md:w-1/3 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item Source <span className="text-rose-500">*</span>
                      </label>
                      <select
                          value={itemType}
                          onChange={(e) => setItemType(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                        >
                          <option value="">Select Item Source</option>
                          <option value="fm_item">fm item</option>
                          <option value="STOCK_AND_AVAILABLE">stock out and available in warehouse</option>
                          <option value="INDENT_DHS">indent given by DHS</option>
                          <option value="AGAINST_APPROVAL_INDENT">against approval indent</option>
                          <option value="OTHER">other</option>
                        </select>
                    </div>

                    {/* Search Filter */}
                    {itemType !== 'OTHER' && (
                      <div className="w-full md:w-1/3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Search Item <span className="text-gray-400 font-normal">(Name, Code, or Type)</span>
                        </label>
                        <SearchDrop 
                          options={[
                            { value: '', label: 'All Items' },
                            ...fmItems.map((item) => {
                              const name = item.ITEMNAME || item.itemName || '';
                              const code = item.ITEMCODE || item.itemCode || '';
                              return {
                                value: String(item.ITEMID || item.itemId),
                                label: `${code}-${name}`
                              };
                            })
                          ]}
                          value={searchFilter}
                          onChange={(val) => {
                            setSearchFilter(val);
                            if (val) {
                              const drug = fmItems.find(item => String(item.ITEMID || item.itemId) === String(val));
                              if (drug) {
                                setIsAdding(true);
                                handleSelectItem({
                                  ITEMID: drug.ITEMID || drug.itemId,
                                  ITEMCODE: drug.ITEMCODE || drug.itemCode,
                                  ITEMNAME: drug.ITEMNAME || drug.itemName,
                                  STRENGTH1: drug.STRENGTH1 || drug.strength1 || '',
                                  UNIT: drug.UNIT || drug.unit || ''
                                });
                                setSearchFilter(''); // reset
                              }
                            }
                          }}
                          placeholder="Search Name, Code..."
                          labelKey="label"
                          valueKey="value"
                          isLoading={loadingFmItems}
                        />
                      </div>
                    )}

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

                  {isAdding && newItem && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700">Selected Item to Add</h3>
                      </div>
                      <div className="overflow-x-auto border border-blue-200 rounded-md shadow-sm">
                        <table className="w-full text-xs text-left whitespace-nowrap">
                          <thead className="bg-blue-50 text-slate-600 font-bold border-b border-blue-200">
                            <tr>
                              <th className="px-2 py-2">Sl. No.</th>
                              <th className="px-2 py-2 min-w-[250px]">Item code & description</th>
                              <th className="px-2 py-2 text-right">WH Stock<br/>(ready)</th>
                              <th className="px-2 py-2 text-right">Other WH<br/>Stock</th>
                              <th className="px-2 py-2 text-right">WH Stock<br/>(QC Pending)</th>
                              <th className="px-2 py-2 text-center">Est. date for<br/>QC Release</th>
                              <th className="px-2 py-2 text-right">Stock In Hand</th>
                              <th className="px-2 py-2 text-right">To be<br/>Requested Qty</th>
                              <th className="px-2 py-2">Remarks</th>
                              <th className="px-2 py-2 text-center">Actions</th>
                              <th className="px-2 py-2 text-right">To be<br/>Indented Qty</th>
                              <th className="px-2 py-2 text-right">NOC to be<br/>Granted Qty</th>
                              <th className="px-2 py-2">CGMSCL Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr className="bg-white">
                              <td className="px-2 py-2 text-center">*</td>
                              <td className="px-2 py-2">
                                {newItem.itemId && (
                                  <div className="font-semibold text-xs mb-1">
                                    {newItem.itemCode}-{newItem.itemName}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-500 leading-tight">
                                  Strength: {newItem.strength || '-'} | SKU: {newItem.sku || '-'} | Type: {newItem.itemTypeName || newItem.itemType || '-'} | PackQty: {newItem.packQty || '-'}
                                  <br/>EDL Type: {newItem.edlType || '-'}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right font-mono bg-slate-50">{newItem.whStock}</td>
                              <td className="px-2 py-2 text-right font-mono bg-slate-50">{newItem.otherWhStock}</td>
                              <td className="px-2 py-2 text-right font-mono bg-slate-50">{newItem.whStockQcPending}</td>
                              <td className="px-2 py-2 text-center font-mono bg-slate-50">{newItem.estDate}</td>
                              <td className="px-2 py-2 text-right font-mono bg-slate-50">{newItem.facStock}</td>
                              <td className="px-2 py-2 text-right">
                                <input type="number" value={newItem.requestedQty} onChange={e=>setNewItem({...newItem, requestedQty: e.target.value})} className="w-16 h-6 px-1 border border-blue-400 focus:ring-1 focus:ring-blue-500 text-right font-bold" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="text" value={newItem.remarks} onChange={e=>setNewItem({...newItem, remarks: e.target.value})} className="w-20 h-6 px-1 border" />
                              </td>
                              <td className="px-2 py-2 text-center flex justify-center gap-2 mt-1">
                                {isRowSaving ? (
                                  <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <>
                                    <button onClick={() => saveRow(newItem)} disabled={isRowSaving} className="text-emerald-600 hover:text-emerald-800"><CheckIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setIsAdding(false)} disabled={isRowSaving} className="text-red-500 hover:text-red-700"><XMarkIcon className="w-5 h-5"/></button>
                                  </>
                                )}
                              </td>
                              <td className="px-2 py-2 bg-slate-50 text-slate-400 text-center">-</td>
                              <td className="px-2 py-2 bg-slate-50 text-slate-400 text-center">-</td>
                              <td className="px-2 py-2 bg-slate-50 text-slate-400 text-center">-</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-700">Saved Indent/NOC Items</h3>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200 rounded-md shadow-sm">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-2 py-2">Sl. No.</th>
                          <th className="px-2 py-2 min-w-[250px]">Item code & description</th>
                          <th className="px-2 py-2 text-right">WH Stock<br/>(ready)</th>
                          <th className="px-2 py-2 text-right">Other WH<br/>Stock</th>
                          <th className="px-2 py-2 text-right">WH Stock<br/>(QC Pending)</th>
                          <th className="px-2 py-2 text-center">Est. date for<br/>QC Release</th>
                          <th className="px-2 py-2 text-right">Stock In Hand</th>
                          <th className="px-2 py-2 text-right">To be<br/>Requested Qty</th>
                          <th className="px-2 py-2">Remarks</th>
                          <th className="px-2 py-2 text-center">Actions</th>
                          <th className="px-2 py-2 text-right">To be<br/>Indented Qty</th>
                          <th className="px-2 py-2 text-right">NOC to be<br/>Granted Qty</th>
                          <th className="px-2 py-2">CGMSCL Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isTableLoading ? (
                          <tr>
                            <td colSpan="13" className="text-center py-10">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-semibold text-slate-500">Loading items...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <>
                            {items.map((item, idx) => (
                              <tr key={item.NOCITEMID}>
                                <td className="px-2 py-2 text-center">{idx + 1}</td>
                                <td className="px-2 py-2">
                                  <div className="font-semibold text-xs mb-1">
                                    {item.ITEMCODE || item.ItemCode}-{item.ITEMNAME || item.ItemName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 leading-tight">
                                    Strength: {item.STRENGTH1 || item.Strength1 || '-'} | SKU: {item.UNIT || '-'} | Type: {item.ITEMTYPENAME || '-'} | PackQty: {item.UNITCOUNT || '-'}
                                    <br/>EDL Type: {item.EDLTYPE || '-'}
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-right">{item.WHSTOCK}</td>
                                <td className="px-2 py-2 text-right">{item.OTHERWHSTOCK}</td>
                                <td className="px-2 py-2 text-right">{item.WHSTOCKQCPENDING}</td>
                                <td className="px-2 py-2 text-center">{item.ESTIMATEDDATE !== 'null' ? item.ESTIMATEDDATE : ''}</td>
                                {editingRowId === item.NOCITEMID ? (
                                  <>
                                    <td className="px-2 py-2 text-right">
                                      <input type="number" value={editingRowData.stockInHand} onChange={e=>setEditingRowData({...editingRowData, stockInHand: e.target.value})} className="w-12 h-6 px-1 border text-right" />
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                      <input type="number" value={editingRowData.requestedQty} onChange={e=>setEditingRowData({...editingRowData, requestedQty: e.target.value})} className="w-16 h-6 px-1 border border-blue-400 focus:ring-1 focus:ring-blue-500 text-right font-bold" />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input type="text" value={editingRowData.remarks} onChange={e=>setEditingRowData({...editingRowData, remarks: e.target.value})} className="w-20 h-6 px-1 border" />
                                    </td>
                                    <td className="px-2 py-2 text-center flex justify-center gap-2 mt-1">
                                      <button onClick={() => saveEditedRow(item.NOCITEMID)} className="text-emerald-600 hover:text-emerald-800"><CheckIcon className="w-5 h-5"/></button>
                                      <button onClick={cancelEditing} className="text-slate-500 hover:text-slate-700"><XMarkIcon className="w-5 h-5"/></button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-2 py-2 text-right">{item.STOCKINHAND}</td>
                                    <td className="px-2 py-2 text-right font-bold text-blue-600">{item.REQUESTEDQTY}</td>
                                    <td className="px-2 py-2">{item.REMARKS !== 'null' ? item.REMARKS : ''}</td>
                                    <td className="px-2 py-2 text-center">
                                      <button onClick={() => startEditing(item)} className="text-blue-500 hover:text-blue-700 mr-2" title="Edit">
                                        <PencilSquareIcon className="w-4 h-4 inline" />
                                      </button>
                                      <button onClick={() => deleteRow(item.NOCITEMID)} className="text-red-500 hover:text-red-700" title="Delete">
                                        <TrashIcon className="w-4 h-4 inline" />
                                      </button>
                                    </td>
                                  </>
                                )}
                                <td className="px-2 py-2 text-right text-emerald-600 font-bold">{item.BOOKEDQTY}</td>
                                <td className="px-2 py-2 text-right text-purple-600 font-bold">{item.APPROVEDQTY}</td>
                                <td className="px-2 py-2 whitespace-normal min-w-[200px] text-[10px] text-slate-600">{item.CGMSCLREMARKS !== 'null' ? item.CGMSCLREMARKS : ''}</td>
                              </tr>
                            ))}
                            {items.length === 0 && (
                              <tr>
                                <td colSpan="13" className="text-center py-4 text-slate-400">No saved items yet.</td>
                              </tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-center gap-4 mt-6">
                    <button onClick={completeNoc} className="h-8 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow">Complete NOC</button>
                    <button onClick={deleteNoc} className="h-8 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md shadow">Delete NOC</button>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
