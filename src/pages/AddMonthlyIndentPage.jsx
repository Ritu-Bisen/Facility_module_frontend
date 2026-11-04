import { getDefaultFinYearId } from '../utils/indentYearHelper';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeftIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
    <div ref={boxRef} className="relative w-full z-30">
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
        <div className="absolute z-50 top-full mt-1.5 left-0 w-full min-w-[320px] md:min-w-[420px] max-w-xl bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden ring-1 ring-black/5">
          <div className="p-2 border-b border-slate-100 bg-slate-50/75">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to filter..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 min-w-0 font-medium text-slate-700"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-slate-400 hover:text-slate-600 flex-shrink-0 text-sm">✕</button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] font-medium text-slate-500">
              <span>{list.length} item{list.length === 1 ? '' : 's'}</span>
              {q && <span>Filtering by "{q}"</span>}
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {list.length === 0
              ? <li className="px-4 py-4 text-xs font-semibold text-slate-400 text-center">No matching items found</li>
              : list.map((o, i) => {
                  const isSel = String(o[valueKey]) === String(value);
                  return (
                    <li
                      key={o[valueKey] ?? i}
                      onClick={() => pick(o)}
                      className={`px-3 py-2 text-xs cursor-pointer hover:bg-indigo-50 hover:text-indigo-900 transition-colors
                        ${isSel ? 'bg-indigo-50/80 text-indigo-700 font-bold' : 'text-slate-700'}`}
                    >
                      {o[labelKey]}
                    </li>
                  );
                })}
          </ul>
        </div>
      )}
    </div>
  );
}

const parseToIsoDate = (dStr) => {
  if (!dStr) return '';
  const cleanStr = String(dStr).split(' ')[0];
  const parts = cleanStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  try {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return '';
};

const getEdlCategoryLabel = (rawEdl) => {
  if (!rawEdl) return '-';
  const val = String(rawEdl).trim().toUpperCase();
  switch (val) {
    case 'U': return 'Universal';
    case 'P': return 'Primary';
    case 'S': return 'Secondary';
    case 'T': return 'Tertiary';
    case 'M': return 'Restricted';
    case 'N':
    case 'NON-EDL': return 'Non-EDL';
    default: return rawEdl;
  }
};

export default function AddMonthlyIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editNocId = searchParams.get('nocId');

  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [accYears, setAccYears] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [form, setForm] = useState({
    finYear: '',
    reqDate: today,
    programId: '',
  });

  const [requestNo, setRequestNo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [editNocIdInternal, setEditNocIdInternal] = useState(editNocId);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentRemark, setUrgentRemark] = useState('');

  const [itemCategory, setItemCategory] = useState('');
  const [itemType, setItemType] = useState('');
  const [fmItems, setFmItems] = useState([]);
  const [allFacilityItems, setAllFacilityItems] = useState([]);
  const [allDrugs, setAllDrugs] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingFmItems, setLoadingFmItems] = useState(false);

  // Active Item being added
  const [activeItem, setActiveItem] = useState(null);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);
  const [savingActiveItem, setSavingActiveItem] = useState(false);

  // Saved items list
  const [savedItems, setSavedItems] = useState([]);
  const [loadingSavedItems, setLoadingSavedItems] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [editingQty, setEditingQty] = useState('');
  const [editingStockInHand, setEditingStockInHand] = useState('');
  const [editingRemarks, setEditingRemarks] = useState('');

  useEffect(() => {
    if (facilityId) {
      loadFilters();
    }
  }, [facilityId, editNocId]);

  useEffect(() => {
    api.get('/monthly-indent/item-categories')
      .then(res => setItemCategories(res.data || []))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (facilityId) {
      api.get(`/facility/items/${facilityId}`)
        .then(res => setAllFacilityItems(res.data || []))
        .catch(err => console.error("Error fetching all facility items:", err));
    }
  }, [facilityId]);

  useEffect(() => {
    if (itemType && facilityId) {
      fetchFmItems();
    } else {
      setFmItems([]);
    }
  }, [itemType, facilityId, itemCategory]);

  useEffect(() => {
    if (itemType === 'OTHER' && allDrugs.length === 0) {
      api.get('/monthly-indent/all-drugs')
        .then(res => setAllDrugs(res.data || []))
        .catch(() => {
          api.get('/items/drugs').then(res => setAllDrugs(res.data || [])).catch(console.error);
        });
    }
  }, [itemType]);

  useEffect(() => {
    if (editNocIdInternal) {
      fetchSavedItems();
    }
  }, [editNocIdInternal]);

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
        const defaultProgram = mappedPrograms.find(p => 
          p.ProgramName && p.ProgramName.toLowerCase().replace(/\s+/g, '') === 'regularsupply'
        );
        const defaultProgramId = defaultProgram ? defaultProgram.ProgramID : (mappedPrograms.length > 0 ? mappedPrograms[0].ProgramID : '');

        setForm(prev => ({ 
          ...prev, 
          finYear: getDefaultFinYearId(mappedYears, 'AccYrSetID', 'SHAccYear'),
          programId: defaultProgramId
        }));
      }

      if (editNocId) {
        const nocRes = await api.get(`/monthly-indent/${editNocId}`);
        const noc = nocRes.data;
        if (noc) {
          setRequestNo(noc.NOCNUMBER || noc.nocNumber);
          setEditNocIdInternal(noc.NOCID || noc.id || editNocId);
          setForm({
            finYear: noc.ACCYRSETID || noc.accYrSetId,
            reqDate: parseToIsoDate(noc.NOCDATE || noc.nocDate) || today,
            programId: noc.PROGRAMID || noc.programId
          });
        }
      } else {
        try {
          const incRes = await api.get('/monthly-indent/incomplete');
          if (incRes.data && incRes.data.NOCID) {
            const incNoc = incRes.data;
            alert(`An incomplete Monthly Indent (${incNoc.NOCNUMBER || ''}) already exists for this facility. Opening the existing incomplete indent.`);
            setRequestNo(incNoc.NOCNUMBER || incNoc.nocNumber);
            setEditNocIdInternal(incNoc.NOCID);
            const nocRes = await api.get(`/monthly-indent/${incNoc.NOCID}`);
            const noc = nocRes.data;
            if (noc) {
              setForm({
                finYear: noc.ACCYRSETID || noc.accYrSetId,
                reqDate: parseToIsoDate(noc.NOCDATE || noc.nocDate) || today,
                programId: noc.PROGRAMID || noc.programId
              });
            }
            navigate(`?nocId=${incNoc.NOCID}`, { replace: true });
            return;
          }
        } catch (incErr) {
          console.error('Failed to check incomplete indent:', incErr);
        }
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchSavedItems = async () => {
    if (!editNocIdInternal) return [];
    setLoadingSavedItems(true);
    try {
      const res = await api.get(`/monthly-indent/${editNocIdInternal}/items`);
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setSavedItems(items);
      return items;
    } catch (e) {
      console.error('Failed to fetch saved items:', e);
      return [];
    } finally {
      setLoadingSavedItems(false);
    }
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleGenerateRequestNo = async () => {
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
      const res = await api.post(`/monthly-indent/generate-no`, { facilityId });
      const generatedNo = res.data.nocNumber;

      const [year, month, day] = form.reqDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const headerRes = await api.post('/monthly-indent/', {
        accYrSetId: form.finYear,
        nocNumber: generatedNo,
        nocDate: formattedDate,
        programId: form.programId
      });

      setRequestNo(generatedNo);
      if (headerRes.data && headerRes.data.nocId) {
        setEditNocIdInternal(headerRes.data.nocId);
        navigate(`?nocId=${headerRes.data.nocId}`, { replace: true });
      }
    } catch (error) {
      console.error("Failed to generate Request No", error);
      const errorMsg = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        'An incomplete Monthly Indent already exists. Please delete or complete it before creating a new one.';

      if (error.response?.status === 409) {
        alert(errorMsg);
        setRequestNo('');
        const existingNocId = error.response?.data?.nocId;
        if (existingNocId) {
          navigate(`?nocId=${existingNocId}`, { replace: true });
        } else {
          navigate('/indent/warehouse');
        }
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    navigate('/indent/warehouse');
  };

  // When an item is selected from SearchDrop (Item selection flow)
  const handleSelectItem = async (itemId) => {
    setSearchFilter(itemId);
    if (!itemId) {
      setActiveItem(null);
      return;
    }

    if (!editNocIdInternal) {
      alert('Please generate Request No. before selecting items.');
      setSearchFilter('');
      return;
    }

    // Check if item already exists in saved items
    const alreadySaved = savedItems.some(saved => String(saved.ITEMID || saved.itemId) === String(itemId));
    if (alreadySaved) {
      alert('This item is already added in Saved Indent Items below. You can edit its quantity there.');
      setSearchFilter('');
      return;
    }

    setLoadingItemDetails(true);
    try {
      const res = await api.get('/monthly-indent/item-stock-details', { params: { itemId } });
      const d = res.data || {};

      const found = fmItems.find(i => String(i.ITEMID || i.itemId) === String(itemId)) ||
                    allFacilityItems.find(i => String(i.ITEMID || i.itemId) === String(itemId)) ||
                    allDrugs.find(i => String(i.itemid) === String(itemId)) || {};

      setActiveItem({
        itemId: itemId,
        itemCode: found.ITEMCODE || found.itemCode || found.itemcode || d.itemCode || '',
        itemName: found.ITEMNAME || found.itemName || found.itemname || d.itemName || '',
        strength: found.STRENGTH1 || found.strength1 || found.strength || d.strength || '',
        unit: found.UNIT || found.unit || d.sku || '',
        edlType: found.EDL || found.edl || d.edlType || '',
        unitCount: Number(d.unitCount || found.UNITCOUNT || found.unitcount || 1),
        whStock: Number(d.whStock) || 0,
        otherWhStock: Number(d.otherWhStock) || 0,
        qcStock: Number(d.qcStock) || 0,
        estDate: d.estDate || '',
        stockInHand: d.facStock !== undefined ? d.facStock : (found.FACILITYSTOCK || 0),
        aiQty: Number(d.aiQty) || 0,
        tranQtyRecv: Number(d.tranQtyRecv) || 0,
        whIssueQty: Number(d.whIssueQty) || 0,
        nocQty: Number(d.nocQty) || 0,
        tranIssueQty: Number(d.tranIssueQty) || 0,
        balAiQty: Number(d.balAiQty) || 0,
        requestedQty: '',
        itemRemarks: ''
      });
    } catch (err) {
      console.error('Error fetching stock details:', err);
      alert('Failed to load item stock details.');
    } finally {
      setLoadingItemDetails(false);
    }
  };

  // Save the currently active item into DB
  const handleSaveActiveItem = async () => {
    if (!editNocIdInternal) {
      alert('Please generate Request No. before saving items.');
      return;
    }
    if (!activeItem || !activeItem.itemId) return;

    const reqQty = Number(activeItem.requestedQty);
    if (!reqQty || reqQty <= 0) {
      alert('Please enter a valid Requested Quantity.');
      return;
    }

    const unitCount = Number(activeItem.unitCount) || 1;
    if (reqQty % unitCount !== 0) {
      alert(`Enter Quantity Should be Multiple of ${unitCount}`);
      return;
    }

    // Exact DHS Rule from CgmsclNocDHS.aspx.cs line 465
    const whStock = Number(activeItem.whStock) || 0;
    if (whStock === 0 || reqQty > whStock) {
      alert('Automatic NOC Process has been blocked, You may Contact/Letter to Central Store DHS with the Requirement.');
      return;
    }

    setSavingActiveItem(true);
    try {
      const res = await api.post(`/monthly-indent/${editNocIdInternal}/items`, {
        itemId: activeItem.itemId,
        requestedqty: reqQty,
        stockInHand: activeItem.stockInHand,
        itemRemarks: activeItem.itemRemarks
      });

      // Prepare optimistic item representation so user sees it right below immediately
      const newSavedItem = {
        NOCITEMID: res.data?.nocItemId || Date.now(),
        SR: res.data?.nocItemId || Date.now(),
        NOCID: editNocIdInternal,
        ITEMID: activeItem.itemId,
        ITEMCODE: activeItem.itemCode,
        ITEMNAME: activeItem.itemName,
        STRENGTH1: activeItem.strength,
        UNIT: activeItem.unit,
        UNITCOUNT: unitCount,
        EDL: activeItem.edlType,
        REQUESTEDQTY: reqQty,
        ABSQTY: reqQty,
        WHSTOCK: activeItem.whStock ?? 0,
        WHSTOCKQCPENDING: activeItem.qcStock ?? 0,
        OTHERWHSTOCK: activeItem.otherWhStock ?? 0,
        ESTIMATEDDATE: activeItem.estDate || '-',
        BOOKEDQTY: reqQty,
        APPROVEDQTY: 0,
        STOCKINHAND: activeItem.stockInHand || 0,
        ITEMREMARKS: activeItem.itemRemarks || '',
        REMARKS: activeItem.itemRemarks || '',
        AIQTY: activeItem.aiQty ?? 0,
        WHISSUEQTY: activeItem.whIssueQty ?? 0,
        NOCQTY: activeItem.nocQty ?? 0,
        BALAIQTY: activeItem.balAiQty ?? 0,
        TRANISSUEQTY: activeItem.tranIssueQty ?? 0,
        TRANQTYRECV: activeItem.tranQtyRecv ?? 0,
        ITEMTYPENAME: activeItem.itemTypeName || 'TAB'
      };

      // Add to saved items immediately so it appears below right away
      setSavedItems(prev => [newSavedItem, ...prev.filter(i => (i.ITEMID || i.itemId) !== activeItem.itemId)]);
      setActiveItem(null);
      setSearchFilter('');

      // Await server fetch to keep everything completely synchronized
      await fetchSavedItems();

      alert('Saved Data successfully');
    } catch (err) {
      console.error('Failed to save item:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to save item.';
      alert(msg);
    } finally {
      setSavingActiveItem(false);
    }
  };

  // Inline update of saved item
  const handleUpdateSavedItem = async (nocItemId) => {
    const reqQty = Number(editingQty);
    if (!reqQty || reqQty <= 0) {
      alert('Please enter a valid Requested Quantity.');
      return;
    }
    const item = savedItems.find(i => (i.NOCITEMID || i.SR) === nocItemId);
    if (!item) return;

    const unitCount = Number(item.UNITCOUNT) || 1;
    if (reqQty % unitCount !== 0) {
      alert(`Enter Quantity Should be Multiple of ${unitCount}`);
      return;
    }

    const whStock = Number(item.WHSTOCK) || 0;
    if (whStock === 0 || reqQty > whStock) {
      alert('Automatic NOC Process has been blocked, You may Contact/Letter to Central Store DHS with the Requirement.');
      return;
    }

    setUpdatingItemId(nocItemId);
    try {
      await api.put(`/monthly-indent/items/${nocItemId}`, {
        requestedqty: reqQty,
        stockInHand: editingStockInHand,
        itemRemarks: editingRemarks
      });
      setEditingItemId(null);
      await fetchSavedItems();
      alert('Updated successfully');
    } catch (err) {
      console.error('Failed to update item:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update item.';
      alert(msg);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Delete saved item
  const handleDeleteSavedItem = async (nocItemId) => {
    if (window.confirm('Are you sure, you want to delete?')) {
      try {
        await api.delete(`/monthly-indent/items/${nocItemId}`);
        setSavedItems(prev => prev.filter(i => (i.NOCITEMID || i.SR) !== nocItemId));
        await fetchSavedItems();
        alert('Deleted Successfully');
      } catch (e) {
        console.error('Failed to delete item:', e);
        const msg = e.response?.data?.error || 'Delete not allowed, references found';
        alert(msg);
      }
    }
  };

  // Complete NOC
  const handleCompleteNoc = () => {
    if (!editNocIdInternal) return;
    if (savedItems.length === 0) {
      alert('Please enter Item details first.');
      return;
    }
    setShowUrgentModal(true);
  };

  const executeCompleteNoc = async (isUrgent = 'N') => {
    setShowUrgentModal(false);
    try {
      await api.post(`/monthly-indent/${editNocIdInternal}/complete`, {
        urgentNoc: isUrgent,
        urgentRemark: urgentRemark
      });
      alert('Monthly Indent marked as Completed');
      navigate('/indent/warehouse');
    } catch (e) {
      console.error('Failed to complete NOC:', e);
      const msg = e.response?.data?.error || e.response?.data?.message || 'Failed to complete NOC';
      alert(msg);
    }
  };

  // Delete NOC
  const handleDeleteNoc = async () => {
    if (!editNocIdInternal) return;
    if (window.confirm('Are you sure, you want to delete?')) {
      try {
        await api.delete(`/monthly-indent/${editNocIdInternal}`);
        alert('Deleted Successfully.');
        navigate('/indent/warehouse');
      } catch (e) {
        console.error('Failed to delete NOC:', e);
        const msg = e.response?.data?.error || e.response?.data?.message || 'Delete failed';
        alert(msg);
      }
    }
  };

  // Options for SearchDrop
  const itemOptions = [
    { value: '', label: 'All Items' },
    ...(itemType === 'OTHER'
      ? allDrugs.map(drug => ({
          value: String(drug.itemid),
          label: `${drug.itemcode} - ${drug.itemname} ${drug.strength1 ? `(${drug.strength1})` : ''}`
        }))
      : (fmItems.length > 0 ? fmItems : allFacilityItems).map(item => {
          const name = item.ITEMNAME || item.itemName || item.itemname || '';
          const code = item.ITEMCODE || item.itemCode || item.itemcode || '';
          const strength = item.STRENGTH1 || item.strength1 || item.strength || '';
          return {
            value: String(item.ITEMID || item.itemId || item.itemid),
            label: `${code} - ${name} ${strength ? `(${strength})` : ''}`
          };
        }))
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {loadingFilters && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/85 backdrop-blur-sm">
              <div className="flex flex-col items-center bg-white px-8 py-6 rounded-2xl shadow-xl border border-slate-100">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-slate-200 rounded-full"></div>
                  <div className="w-12 h-12 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700 tracking-wide">Loading Indent Details...</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Please wait while we load the data</p>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-100">
            <div className="w-full max-w-7xl mx-auto space-y-4">
              
              {/* Card 1: Header / Indent Details Form */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible p-3 md:p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                    title="Back to List"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                    Add Indent to Warehouse
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Fin Year */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Fin Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="finYear"
                      value={form.finYear}
                      onChange={handleChange}
                      disabled={loadingFilters || !!requestNo}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Fin Year</option>
                      {accYears.map(y => (
                        <option key={y.AccYrSetID} value={y.AccYrSetID}>{y.SHAccYear}</option>
                      ))}
                    </select>
                  </div>

                  {/* Requested Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Requested Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.reqDate ? form.reqDate.split('-').reverse().join('-') : ''}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600 font-semibold cursor-not-allowed"
                    />
                  </div>

                  {/* Program */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Program <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="programId"
                      value={form.programId}
                      onChange={handleChange}
                      disabled={loadingFilters || !!requestNo}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Program</option>
                      {programsList.map(p => (
                        <option key={p.ProgramID} value={p.ProgramID}>{p.ProgramName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Request No */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Request No.
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        placeholder="Auto Generated"
                        value={requestNo || ''}
                        className={`w-full h-10 px-3 border rounded-xl text-sm font-bold cursor-not-allowed ${
                          requestNo ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      />
                      {!requestNo && (
                        <button
                          type="button"
                          onClick={handleGenerateRequestNo}
                          disabled={isGenerating}
                          className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md rounded-xl transition disabled:opacity-50 whitespace-nowrap"
                        >
                          {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Filter Card (Category, Source, Search Item & Action Buttons) */}
              {requestNo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible p-3 md:p-4 space-y-4 relative z-20">
                  <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
                    {/* Item Category */}
                    <div className="w-full md:w-1/4 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={itemCategory}
                        onChange={(e) => {
                          setItemCategory(e.target.value);
                          setActiveItem(null);
                          setSearchFilter('');
                        }}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                      >
                        <option value="">Select Item Category</option>
                        {itemCategories.filter(cat => !cat.MCATEGORY?.toUpperCase().includes('AYUSH')).map(cat => (
                          <option key={cat.MCID} value={cat.MCID}>{cat.MCATEGORY}</option>
                        ))}
                      </select>
                    </div>

                    {/* Item Source */}
                    <div className="w-full md:w-1/4 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item Source <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={itemType}
                        onChange={(e) => {
                          setItemType(e.target.value);
                          setActiveItem(null);
                          setSearchFilter('');
                        }}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                      >
                        <option value="">Select Item Source</option>
                        <option value="fm_item">FM Item</option>
                        <option value="STOCK_AND_AVAILABLE">Stock Out and Available in Warehouse</option>
                        <option value="INDENT_DHS">Indent Given by DHS</option>
                        <option value="AGAINST_APPROVAL_INDENT">SMHO Approved Indent</option>
                        <option value="OTHER">Other Items</option>
                      </select>
                    </div>

                    {/* Search Item Dropdown */}
                    <div className="w-full md:w-1/2 space-y-1.5 relative z-30">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Search Item (Name, Code, or Type)
                      </label>
                      <SearchDrop
                        options={itemOptions}
                        value={searchFilter}
                        onChange={(val) => handleSelectItem(val)}
                        placeholder="Select or Search Item"
                        labelKey="label"
                        valueKey="value"
                        isLoading={loadingFmItems || loadingItemDetails}
                      />
                    </div>
                  </div>

                  {/* Complete NOC and Delete NOC buttons centered */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleCompleteNoc}
                      disabled={!editNocIdInternal || savedItems.length === 0}
                      className="px-8 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete NOC
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteNoc}
                      disabled={!editNocIdInternal}
                      className="px-8 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete NOC
                    </button>
                  </div>
                </div>
              )}

              {/* GridView: gvItemLst Table (Matches Screenshot 2) */}
              <div className="overflow-x-auto border border-[#063813] rounded-lg shadow-sm bg-white relative">
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                  <thead className="bg-[#063813] text-white text-[11px] font-bold">
                    <tr>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f] w-12">Sl.<br/>No.</th>
                      <th className="px-3 py-2.5 text-left border-r border-[#0d4f1f] min-w-[240px]">Item code & description</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">Warehouse<br/>Stock<br/>(ready for<br/>issue)<br/>(in Nos)</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">Other<br/>Warehouse<br/>Stock<br/>(ready for<br/>issue)</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">Warehouse<br/>Stock (QC<br/>Pending)<br/>(in Nos)</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">Estimated<br/>date for<br/>QC<br/>Release</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">Stock In<br/>Hand<br/>(in Nos)</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f] min-w-[280px]">Annual Indent<br/>Details</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">To be<br/>Requested<br/>Qty<br/>(in Nos)</th>
                      <th className="px-3 py-2.5 text-center border-r border-[#0d4f1f] min-w-[120px]">Remarks(if<br/>any)</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f] w-16">Actions</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">To be<br/>Indented<br/>Qty<br/>(in Nos)</th>
                      <th className="px-2 py-2.5 text-center border-r border-[#0d4f1f]">NOC to<br/>be<br/>Granted<br/>Qty<br/>(in Nos)</th>
                      <th className="px-3 py-2.5 text-center min-w-[120px]">CGMSCL<br/>Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Active Item Row being added (Directly inside table, matching Screenshot 2) */}
                    {activeItem && (
                      <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition-colors border-b-2 border-emerald-300">
                        <td className="px-2 py-2 text-center font-bold text-slate-700 border-r border-slate-200">
                          1
                        </td>

                        {/* Column 2: Item code & description matching Screenshot 2 */}
                        <td className="px-3 py-2 border-r border-slate-200 max-w-xs whitespace-normal">
                          <div className="space-y-1 py-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 border border-slate-300 rounded bg-white font-mono font-bold text-xs text-slate-800 shadow-xs">
                                {activeItem.itemCode}
                              </span>
                              <span className="text-blue-500 text-sm" title="Item Info">💬</span>
                              <span className="px-2 py-0.5 border border-slate-300 rounded bg-white font-semibold text-xs text-slate-800 shadow-xs">
                                {activeItem.itemName}
                              </span>
                            </div>
                            <div className="text-[11px] leading-tight text-slate-700 space-y-0.5">
                              <div>
                                <span className="font-semibold text-slate-600">Strength: </span>
                                <span className="text-blue-700 underline font-medium">{activeItem.strength || '-'}</span>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span>
                                  <span className="font-semibold text-slate-600">SKU: </span>
                                  <span className="text-blue-700 underline font-medium">{activeItem.unit || '-'}</span>
                                </span>
                                <span>
                                  <span className="font-semibold text-slate-600">Type: </span>
                                  <span className="text-blue-700 underline font-medium">{activeItem.itemTypeName || 'TAB'}</span>
                                </span>
                                <span>
                                  <span className="font-semibold text-slate-600">PackQty: </span>
                                  <span className="text-blue-700 underline font-medium">{activeItem.unitCount || 1}</span>
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-600">EDL Type : </span>
                                <span className="text-blue-700 underline font-medium">{getEdlCategoryLabel(activeItem.edlType)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Warehouse Stock (ready for issue) */}
                        <td className="px-2 py-2 text-center font-bold text-slate-800 border-r border-slate-200">
                          {activeItem.whStock ?? 0}
                        </td>

                        {/* Column 4: Other Warehouse Stock */}
                        <td className="px-2 py-2 text-center font-semibold text-slate-700 border-r border-slate-200">
                          {activeItem.otherWhStock ?? 0}
                        </td>

                        {/* Column 5: Warehouse Stock (QC Pending) */}
                        <td className="px-2 py-2 text-center font-bold text-amber-800 border-r border-slate-200">
                          {activeItem.qcStock ?? 0}
                        </td>

                        {/* Column 6: Estimated date for QC Release */}
                        <td className="px-2 py-2 text-center text-slate-600 border-r border-slate-200 text-xs">
                          {activeItem.estDate || '-'}
                        </td>

                        {/* Column 7: Stock In Hand (in Nos) input */}
                        <td className="px-2 py-2 text-center border-r border-slate-200">
                          <input
                            type="number"
                            value={activeItem.stockInHand}
                            onChange={(e) => setActiveItem(prev => ({ ...prev, stockInHand: e.target.value }))}
                            className="w-16 h-7 px-1.5 text-right border border-slate-400 rounded text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                          />
                        </td>

                        {/* Column 8: Annual Indent Details Sub-table matching Screenshot 2 */}
                        <td className="p-1 border-r border-slate-200">
                          <table className="w-full text-[10px] border border-slate-400 border-collapse bg-white">
                            <tbody>
                              <tr className="border-b border-slate-300">
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">Annual Indent:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300 w-12">{activeItem.aiQty ?? 0}</td>
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">AI Transfer Received From Other Facility:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 w-12">{activeItem.tranQtyRecv ?? 0}</td>
                              </tr>
                              <tr className="border-b border-slate-300">
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">WH Issue {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300">{activeItem.whIssueQty ?? 0}</td>
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">NOC {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-slate-800">{activeItem.nocQty ?? 0}</td>
                              </tr>
                              <tr className="border-b border-slate-300">
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">AI Transfer To Other Facility {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300">{activeItem.tranIssueQty ?? 0}</td>
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">Balance AI {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-blue-700">{activeItem.balAiQty ?? 0}</td>
                              </tr>
                              <tr>
                                <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">Return To Warehouse:</td>
                                <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300">0</td>
                                <td colSpan={2} className="bg-slate-50"></td>
                              </tr>
                            </tbody>
                          </table>
                        </td>

                        {/* Column 9: To be Requested Qty input */}
                        <td className="px-2 py-2 text-center border-r border-slate-200">
                          <input
                            type="number"
                            value={activeItem.requestedQty}
                            onChange={(e) => setActiveItem(prev => ({ ...prev, requestedQty: e.target.value }))}
                            placeholder=""
                            className="w-16 h-7 px-1 text-right border border-slate-400 rounded text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                          />
                        </td>

                        {/* Column 10: Remarks textarea */}
                        <td className="px-2 py-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={activeItem.itemRemarks}
                            onChange={(e) => setActiveItem(prev => ({ ...prev, itemRemarks: e.target.value }))}
                            placeholder=""
                            className="w-full min-w-[110px] p-1 border border-slate-400 rounded text-xs bg-white resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                          />
                        </td>

                        {/* Column 11: Actions matching Screenshot 2 (Green checkmark & Red circle-cross) */}
                        <td className="px-2 py-2 text-center border-r border-slate-200">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSaveActiveItem}
                              disabled={savingActiveItem}
                              className="p-1 hover:opacity-80 transition cursor-pointer disabled:cursor-not-allowed"
                              title="Save Item"
                            >
                              {savingActiveItem ? (
                                <svg className="animate-spin w-5 h-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveItem(null); setSearchFilter(''); }}
                              disabled={savingActiveItem}
                              className="p-1 hover:opacity-80 transition cursor-pointer disabled:opacity-50"
                              title="Delete / Cancel"
                            >
                              <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9"></circle>
                                <line x1="5.7" y1="5.7" x2="18.3" y2="18.3"></line>
                              </svg>
                            </button>
                          </div>
                        </td>

                        {/* Column 12: To be Indented Qty */}
                        <td className="px-2 py-2 text-center text-slate-400 border-r border-slate-200">-</td>

                        {/* Column 13: NOC to be Granted Qty */}
                        <td className="px-2 py-2 text-center text-slate-400 border-r border-slate-200">-</td>

                        {/* Column 14: CGMSCL Remarks */}
                        <td className="px-2 py-2 text-center text-slate-400">-</td>
                      </tr>
                    )}

                    {loadingSavedItems ? (
                      <tr>
                        <td colSpan={14} className="text-center py-8 text-slate-500 font-semibold">
                          Loading Indent Items...
                        </td>
                      </tr>
                    ) : savedItems.length === 0 && !activeItem ? (
                      <tr>
                        <td colSpan={14} className="text-center py-8 text-slate-500 font-semibold">
                          No Item found under selected contract
                        </td>
                      </tr>
                    ) : (
                      savedItems.map((item, index) => {
                        const isEditing = editingItemId === (item.NOCITEMID || item.SR);
                        const reqQty = Number(item.REQUESTEDQTY || item.ABSQTY || 0);
                        const toBeIndented = Number(item.BOOKEDQTY || 0);
                        const nocToBeGranted = Number(item.APPROVEDQTY || 0);
                        const itemSlNo = activeItem ? index + 2 : index + 1;

                        return (
                          <tr key={item.NOCITEMID || item.SR || index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-2 py-2 text-center font-bold text-slate-600 border-r border-slate-200">
                              {itemSlNo}
                            </td>

                            <td className="px-3 py-2 border-r border-slate-200 max-w-xs whitespace-normal">
                              <div className="space-y-1 py-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 border border-slate-300 rounded bg-white font-mono font-bold text-xs text-slate-800 shadow-xs">
                                    {item.ITEMCODE || item.ItemCode}
                                  </span>
                                  <span className="text-blue-500 text-sm" title="Item Info">💬</span>
                                  <span className="px-2 py-0.5 border border-slate-300 rounded bg-white font-semibold text-xs text-slate-800 shadow-xs">
                                    {item.ITEMNAME || item.ItemName}
                                  </span>
                                </div>
                                <div className="text-[11px] leading-tight text-slate-700 space-y-0.5">
                                  <div>
                                    <span className="font-semibold text-slate-600">Strength: </span>
                                    <span className="text-blue-700 underline font-medium">{item.STRENGTH1 || item.Strength1 || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span>
                                      <span className="font-semibold text-slate-600">SKU: </span>
                                      <span className="text-blue-700 underline font-medium">{item.UNIT || item.Unit || '-'}</span>
                                    </span>
                                    <span>
                                      <span className="font-semibold text-slate-600">Type: </span>
                                      <span className="text-blue-700 underline font-medium">{item.ITEMTYPENAME || 'TAB'}</span>
                                    </span>
                                    <span>
                                      <span className="font-semibold text-slate-600">PackQty: </span>
                                      <span className="text-blue-700 underline font-medium">{item.UNITCOUNT || item.UnitCount || 1}</span>
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-600">EDL Type : </span>
                                    <span className="text-blue-700 underline font-medium">{getEdlCategoryLabel(item.EDL)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-2 py-2 text-center font-bold text-slate-800 border-r border-slate-200">
                              {item.WHSTOCK ?? 0}
                            </td>

                            <td className="px-2 py-2 text-center font-semibold text-slate-700 border-r border-slate-200">
                              {item.OTHERWHSTOCK ?? 0}
                            </td>

                            <td className="px-2 py-2 text-center font-bold text-amber-800 border-r border-slate-200">
                              {item.WHSTOCKQCPENDING ?? 0}
                            </td>

                            <td className="px-2 py-2 text-center text-slate-600 border-r border-slate-200 text-xs">
                              {item.ESTIMATEDDATE || '-'}
                            </td>

                            <td className="px-2 py-2 text-center border-r border-slate-200">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editingStockInHand}
                                  onChange={(e) => setEditingStockInHand(e.target.value)}
                                  className="w-16 h-7 px-1.5 text-right border border-slate-400 rounded text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                                />
                              ) : (
                                <span className="px-2 py-0.5 border border-slate-300 rounded bg-slate-50 text-xs font-semibold">
                                  {item.STOCKINHAND ?? 0}
                                </span>
                              )}
                            </td>

                            {/* Column 8: Annual Indent Details Sub-table (Matches Screenshot 2) */}
                            <td className="p-1 border-r border-slate-200">
                              <table className="w-full text-[10px] border border-slate-400 border-collapse bg-white">
                                <tbody>
                                  <tr className="border-b border-slate-300">
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">Annual Indent:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300 w-12">{item.AIQTY ?? 0}</td>
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">AI Transfer Received From Other Facility:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 w-12">{item.TRANQTYRECV ?? 0}</td>
                                  </tr>
                                  <tr className="border-b border-slate-300">
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">WH Issue {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300">{item.WHISSUEQTY ?? 0}</td>
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">NOC {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800">{item.NOCQTY ?? 0}</td>
                                  </tr>
                                  <tr className="border-b border-slate-300">
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">AI Transfer To Other Facility {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300">{item.TRANISSUEQTY ?? 0}</td>
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">Balance AI {accYears.find(y => String(y.AccYrSetID) === String(form.finYear))?.SHAccYear || '26-27'}:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-blue-700">{item.BALAIQTY ?? 0}</td>
                                  </tr>
                                  <tr>
                                    <td className="px-1.5 py-0.5 font-medium border-r border-slate-300 text-slate-700 bg-slate-50/50">Return To Warehouse:</td>
                                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border-r border-slate-300">0</td>
                                    <td colSpan={2} className="bg-slate-50"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>

                            <td className="px-2 py-2 text-center font-bold text-blue-900 border-r border-slate-200">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editingQty}
                                  onChange={(e) => setEditingQty(e.target.value)}
                                  className="w-16 h-7 px-1 text-right border border-slate-400 rounded text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                                />
                              ) : (
                                reqQty
                              )}
                            </td>

                            <td className="px-3 py-2 text-slate-700 border-r border-slate-200 max-w-xs whitespace-normal text-xs">
                              {isEditing ? (
                                <textarea
                                  rows={2}
                                  value={editingRemarks}
                                  onChange={(e) => setEditingRemarks(e.target.value)}
                                  className="w-full min-w-[110px] p-1 border border-slate-400 rounded text-xs bg-white resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                                />
                              ) : (
                                item.ITEMREMARKS || item.REMARKS || '-'
                              )}
                            </td>

                            <td className="px-2 py-2 text-center border-r border-slate-200">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSavedItem(item.NOCITEMID || item.SR)}
                                      disabled={updatingItemId === (item.NOCITEMID || item.SR)}
                                      className="p-1 hover:opacity-80 transition cursor-pointer disabled:cursor-not-allowed"
                                      title="Update"
                                    >
                                      {updatingItemId === (item.NOCITEMID || item.SR) ? (
                                        <svg className="animate-spin w-5 h-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : (
                                        <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemId(null)}
                                      disabled={updatingItemId === (item.NOCITEMID || item.SR)}
                                      className="p-1 hover:opacity-80 transition cursor-pointer disabled:opacity-50"
                                      title="Cancel"
                                    >
                                      <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="9"></circle>
                                        <line x1="5.7" y1="5.7" x2="18.3" y2="18.3"></line>
                                      </svg>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(item.NOCITEMID || item.SR);
                                        setEditingQty(reqQty);
                                        setEditingStockInHand(item.STOCKINHAND || '0');
                                        setEditingRemarks(item.ITEMREMARKS || item.REMARKS || '');
                                      }}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                      title="Edit"
                                    >
                                      <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSavedItem(item.NOCITEMID || item.SR)}
                                      className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                                      title="Delete"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="px-2 py-2 text-right font-bold text-slate-700 border-r border-slate-200">
                              {toBeIndented || '-'}
                            </td>

                            <td className="px-2 py-2 text-right font-bold text-slate-700 border-r border-slate-200">
                              {nocToBeGranted || '-'}
                            </td>

                            <td className="px-3 py-2 text-slate-700 text-xs">
                              {item.CGMSCLREMARKS || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Print / Preview Buttons */}
              {editNocIdInternal && savedItems.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3 my-2">
                  <button
                    type="button"
                    onClick={() => window.open(`/indent/warehouse/print/${editNocIdInternal}`, '_blank')}
                    className="px-5 py-2 bg-[#3f6212] hover:bg-[#365314] text-white text-xs font-bold rounded-lg shadow transition"
                  >
                    Preview Indent
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/indent/warehouse/print/${editNocIdInternal}`, '_blank')}
                    className="px-5 py-2 bg-[#3f6212] hover:bg-[#365314] text-white text-xs font-bold rounded-lg shadow transition"
                  >
                    Preview NOC
                  </button>
                </div>
              )}

              {/* Urgent NOC Modal Popup (Exact from CgmsclNoc.aspx modalPopup) */}
              {showUrgentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white w-[320px] border-[3px] border-[#9BD11F] shadow-2xl rounded overflow-hidden">
                    <div className="bg-[#6B8333] h-[30px] text-white text-center font-bold text-sm leading-[30px]">
                      CGMSC
                    </div>
                    <div className="p-4 space-y-3 text-center text-xs">
                      <div className="font-bold text-slate-800 text-sm">
                        Urgent NOC Required:?
                      </div>
                      <div className="text-left font-bold text-slate-700">
                        Remark :-
                        <textarea
                          value={urgentRemark}
                          onChange={(e) => setUrgentRemark(e.target.value)}
                          rows={2}
                          placeholder="Enter remark"
                          className="w-full mt-1 p-1.5 border border-slate-300 rounded text-xs font-normal focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-2 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => executeCompleteNoc('Y')}
                        className="px-4 py-1 bg-[#6B8333] border border-[#9BD11F] text-white font-bold text-xs rounded hover:bg-[#586c2a] transition cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCompleteNoc('N')}
                        className="px-4 py-1 bg-[#9F9F9F] border border-[#9BD11F] text-white font-bold text-xs rounded hover:bg-[#888888] transition cursor-pointer"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowUrgentModal(false)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
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
