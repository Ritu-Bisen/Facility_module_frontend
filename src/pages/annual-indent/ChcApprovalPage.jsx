import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

export default function ChcApprovalPage() {
  const { user } = useAuth();

  // Active Tab: 'approval' | 'general'
  const [activeTab, setActiveTab] = useState('approval');

  // Fin Years
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [loadingFinYears, setLoadingFinYears] = useState(false);

  // Drugs dropdown
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState('0');
  const [loadingDrugs, setLoadingDrugs] = useState(false);

  // Searchable Drug Options for react-select
  const drugOptions = useMemo(() => {
    return [
      { value: '0', label: '-- Select Drug to Review and Approve --' },
      ...drugs.map(d => ({
        value: String(d.itemId),
        label: d.itemName
      }))
    ];
  }, [drugs]);

  const currentDrugOption = useMemo(() => {
    return drugOptions.find(opt => opt.value === String(selectedDrug)) || drugOptions[0];
  }, [drugOptions, selectedDrug]);

  // Grid Data
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);

  // General Tab State
  const [dispatchNo, setDispatchNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [freezing, setFreezing] = useState(false);

  // Messages
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Effective facility ID
  const facilityId = useMemo(() => {
    return user?.facilityId || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.facilityId : null) || localStorage.getItem('facilityId') || '23393';
  }, [user]);

  // Load Financial Years on mount
  useEffect(() => {
    fetchFinYears();
  }, []);

  const fetchFinYears = async () => {
    setLoadingFinYears(true);
    try {
      const res = await axios.get('/chc-annual-indent/fin-years');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setFinYears(res.data.data);
        const curr = res.data.data.find(y => y.isCurrent);
        if (curr) {
          setSelectedFinYear(String(curr.accYrSetId));
        } else if (res.data.data.length > 0) {
          setSelectedFinYear(String(res.data.data[0].accYrSetId));
        }
      }
    } catch (err) {
      console.error('Error fetching fin years:', err);
      showMsg('Failed to load financial years', 'error');
    } finally {
      setLoadingFinYears(false);
    }
  };

  // When Fin Year or facility changes, reload drugs & dispatch details
  useEffect(() => {
    if (selectedFinYear) {
      fetchDrugs();
      fetchDispatchDetails();
    }
  }, [selectedFinYear, facilityId]);

  const fetchDrugs = async () => {
    setLoadingDrugs(true);
    setSelectedDrug('0');
    setItems([]);
    try {
      const res = await axios.get('/chc-annual-indent/drugs', {
        params: { facilityId, finYearId: selectedFinYear }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDrugs(res.data.data);
      } else {
        setDrugs([]);
      }
    } catch (err) {
      console.error('Error fetching drugs:', err);
      showMsg('Failed to load drugs dropdown', 'error');
    } finally {
      setLoadingDrugs(false);
    }
  };

  const fetchDispatchDetails = async () => {
    setLoadingGeneral(true);
    try {
      const res = await axios.get('/chc-annual-indent/dispatch-details', {
        params: { facilityId, finYearId: selectedFinYear }
      });
      if (res.data?.success && res.data.data) {
        setDispatchNo(res.data.data.dispatchNo || '');
        setDispatchDate(res.data.data.dispatchDate || '');
        setIsCompleted(!!res.data.data.isCompleted);
      }
    } catch (err) {
      console.error('Error fetching dispatch details:', err);
    } finally {
      setLoadingGeneral(false);
    }
  };

  // When Drug changes, load items grid
  useEffect(() => {
    if (selectedDrug && selectedDrug !== '0') {
      fetchGridItems();
    } else {
      setItems([]);
    }
  }, [selectedDrug]);

  const fetchGridItems = async () => {
    setLoadingItems(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await axios.get('/chc-annual-indent/items', {
        params: { facilityId, finYearId: selectedFinYear, itemId: selectedDrug }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      showMsg('Failed to load items for selected drug', 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  const showMsg = (text, type = 'info') => {
    setMsg({ text, type });
    setTimeout(() => {
      setMsg({ text: '', type: '' });
    }, 5000);
  };

  // Handle Approve Qty input change
  const handleQtyChange = (index, value) => {
    const updated = [...items];
    const num = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    updated[index].bmoApprovedQty = num;
    setItems(updated);
  };

  // Single row approve
  const handleApproveSingle = async (row) => {
    setSavingRowId(row.anualIndentId);
    try {
      const res = await axios.post('/chc-annual-indent/approve', {
        anualIndentId: row.anualIndentId,
        itemId: row.itemId,
        facilityId: row.facilityId,
        finYearId: selectedFinYear,
        approveQty: row.bmoApprovedQty
      });
      if (res.data?.success) {
        showMsg(`Approved ${row.facilityName} successfully`, 'success');
        // Refresh grid
        fetchGridItems();
      } else {
        showMsg(res.data?.error || 'Failed to approve item', 'error');
      }
    } catch (err) {
      console.error('Error approving item:', err);
      showMsg('Failed to save approval', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  // Batch approve all rows in grid
  const handleApproveAllRows = async () => {
    if (items.length === 0) return;
    setSavingAll(true);
    try {
      const payload = items.map(item => ({
        anualIndentId: item.anualIndentId,
        itemId: item.itemId,
        facilityId: item.facilityId,
        approveQty: item.bmoApprovedQty
      }));
      const res = await axios.post('/chc-annual-indent/approve-batch', {
        items: payload,
        finYearId: selectedFinYear
      });
      if (res.data?.success) {
        showMsg(`All ${res.data.updatedCount} facility rows approved successfully!`, 'success');
        fetchGridItems();
      } else {
        showMsg(res.data?.error || 'Failed to approve batch', 'error');
      }
    } catch (err) {
      console.error('Error in batch approve:', err);
      showMsg('Error approving items', 'error');
    } finally {
      setSavingAll(false);
    }
  };

  // Save Dispatch Details
  const handleSaveDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchNo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Dispatch No Required',
        text: 'Please enter Dispatch No before saving.'
      });
      return;
    }
    setSavingGeneral(true);
    try {
      const res = await axios.post('/chc-annual-indent/save-dispatch', {
        facilityId,
        finYearId: selectedFinYear,
        dispatchNo,
        dispatchDate
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Saved',
          text: 'Dispatch details saved successfully!'
        });
        fetchDispatchDetails();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.data?.error || 'Failed to save dispatch details'
        });
      }
    } catch (err) {
      console.error('Error saving dispatch:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Server error saving dispatch details.'
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  // Freeze All Indents
  const handleFreeze = async () => {
    const confirm = await Swal.fire({
      title: 'Freeze Annual Indents?',
      text: 'Are you sure you want to approve and freeze annual indents for all PHCs under this CHC? Once frozen, quantities cannot be modified.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Freeze and Approve'
    });

    if (!confirm.isConfirmed) return;

    setFreezing(true);
    try {
      const res = await axios.post('/chc-annual-indent/freeze', {
        facilityId,
        finYearId: selectedFinYear
      });

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Approved Successfully!',
          text: 'Annual Indents have been approved and frozen successfully.'
        });
        setIsCompleted(true);
        fetchDispatchDetails();
        fetchDrugs();
      } else {
        // Validation failure (FACILITIES_PENDING or ITEMS_PENDING)
        Swal.fire({
          icon: 'warning',
          title: res.data?.reason === 'FACILITIES_PENDING' ? 'Facilities Not Finalized' : 'Items Not Approved',
          html: `<div class="text-left text-xs space-y-2"><p class="font-semibold text-rose-700">${res.data?.message}</p></div>`
        });
      }
    } catch (err) {
      console.error('Error freezing:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Server error processing freeze request.'
      });
    } finally {
      setFreezing(false);
    }
  };

  // Calculate approval stats for current drug
  const stats = useMemo(() => {
    const total = items.length;
    const approved = items.filter(i => i.isApproved).length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [items]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* Title Header Banner */}
            <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 rounded-2xl shadow-md p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-700/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 uppercase tracking-widest">
                  <BuildingOffice2Icon className="w-4 h-4" />
                  <span>CHC / BMO Level Indent Management</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  Approval of Forwarded Indents of PHCs
                </h1>
                <p className="text-xs text-teal-100">
                  Review, approve quantities and finalize annual indents submitted by primary health centers.
                </p>
              </div>

              {isCompleted ? (
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center gap-2 shrink-0">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                  <span>Annual Indent Frozen & Approved</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center gap-2 shrink-0">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
                  <span>Approval in Progress</span>
                </div>
              )}
            </div>

            {/* Notification Alert */}
            {msg.text && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                msg.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                  : msg.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              }`}>
                {msg.type === 'success' ? (
                  <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            {/* Main Tabs Navigation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex border-b border-slate-200 dark:border-slate-700 px-4 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('approval')}
                  className={`px-5 py-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'approval'
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <DocumentCheckIcon className="w-4 h-4" />
                  <span>Approval</span>
                  {stats.total > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      {stats.approved}/{stats.total}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`px-5 py-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === 'general'
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <TruckIcon className="w-4 h-4" />
                  <span>General & Freeze</span>
                </button>
              </div>

              {/* TAB 1: APPROVAL */}
              {activeTab === 'approval' && (
                <div className="p-4 md:p-6 space-y-5">
                  {/* Filter Toolbar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                    
                    {/* Financial Year */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Financial Year</span>
                      </label>
                      <select
                        value={selectedFinYear}
                        onChange={(e) => setSelectedFinYear(e.target.value)}
                        disabled={loadingFinYears}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      >
                        {finYears.map(fy => (
                          <option key={fy.accYrSetId} value={fy.accYrSetId}>
                            {fy.accYear} {fy.isCurrent ? '(Current Year)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Drug Selector (Searchable) */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BeakerIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Select Drug / Item</span>
                        {loadingDrugs && <ArrowPathIcon className="w-3 h-3 animate-spin text-emerald-600" />}
                      </label>
                      <Select
                        options={drugOptions}
                        value={currentDrugOption}
                        onChange={(opt) => setSelectedDrug(opt ? opt.value : '0')}
                        isDisabled={loadingDrugs || drugs.length === 0}
                        isLoading={loadingDrugs}
                        isSearchable={true}
                        placeholder="-- Search or Select Drug to Review and Approve --"
                        noOptionsMessage={() => (drugs.length === 0 ? "No drugs found" : "No matching drug")}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            minHeight: '38px',
                            height: '38px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#ffffff',
                            borderColor: state.isFocused ? '#059669' : '#cbd5e1',
                            boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                            borderRadius: '0.5rem',
                            '&:hover': { borderColor: '#059669' }
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            height: '38px',
                            padding: '0 8px'
                          }),
                          input: (base) => ({
                            ...base,
                            margin: 0,
                            padding: 0
                          }),
                          indicatorsContainer: (base) => ({
                            ...base,
                            height: '38px'
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999,
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '0.5rem'
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          option: (base, { isFocused, isSelected }) => ({
                            ...base,
                            backgroundColor: isSelected ? '#059669' : isFocused ? '#ecfdf5' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#1e293b',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            fontSize: '12px'
                          })
                        }}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      />
                    </div>

                  </div>

                  {/* Stats Bar */}
                  {selectedDrug !== '0' && items.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Facilities: <strong className="text-slate-900 dark:text-white font-bold">{stats.total}</strong>
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Approved: <strong className="font-bold">{stats.approved}</strong>
                        </span>
                        <span className="text-rose-700 dark:text-rose-400">
                          Pending: <strong className="font-bold">{stats.pending}</strong>
                        </span>
                      </div>

                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={handleApproveAllRows}
                          disabled={savingAll}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                        >
                          {savingAll ? (
                            <>
                              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                              <span>Approving All...</span>
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-3.5 h-3.5" />
                              <span>Approve All for this Drug</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Grid Table */}
                  {selectedDrug === '0' ? (
                    <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
                      <BeakerIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <span>Please select a drug from the dropdown above to view and approve PHC indents.</span>
                    </div>
                  ) : loadingItems ? (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Loading facility indents...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                      No facility indents found for the selected drug in this financial year.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-800 text-white font-bold">
                            <th className="p-3 text-center w-12">Sl. No.</th>
                            <th className="p-3">ItemCode & Description</th>
                            <th className="p-3">Facility Name</th>
                            <th className="p-3 text-right">Consumption</th>
                            <th className="p-3 text-right">Current Stock</th>
                            <th className="p-3 text-right">Facility Annual Indent</th>
                            <th className="p-3 text-center w-36">Approve Qty</th>
                            <th className="p-3 text-center w-28">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {items.map((row, idx) => {
                            const isApproved = row.isApproved;
                            return (
                              <tr
                                key={row.anualIndentId || idx}
                                className={`transition-colors ${
                                  isApproved
                                    ? 'bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40'
                                    : 'bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-950/30'
                                }`}
                              >
                                <td className="p-3 text-center font-bold text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 mr-1.5">
                                    {row.itemCode}
                                  </span>
                                  <span>{row.itemName}</span>
                                </td>
                                <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                                  {row.facilityName}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                  {row.consumption}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                                  {row.currentStock}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {row.anlQty}
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.bmoApprovedQty ?? ''}
                                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                                    disabled={isCompleted}
                                    className="w-28 px-2 py-1.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 shadow-xs"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  {!isCompleted && (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveSingle(row)}
                                      disabled={savingRowId === row.anualIndentId}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1 mx-auto disabled:opacity-50 transition-all"
                                      title="Approve this facility indent"
                                    >
                                      {savingRowId === row.anualIndentId ? (
                                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckIcon className="w-3.5 h-3.5" />
                                          <span>Approve</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                                      <CheckCircleIcon className="w-4 h-4" />
                                      <span>Approved</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: GENERAL & FREEZE */}
              {activeTab === 'general' && (
                <div className="p-6 max-w-2xl mx-auto space-y-6">
                  
                  {isCompleted ? (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
                      <ShieldCheckIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Annual Indents Already Frozen & Approved</p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Dispatch No: <span className="font-mono font-bold">{dispatchNo || 'N/A'}</span> | 
                          Dispatch Date: <span className="font-mono font-bold">{dispatchDate || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveDispatch} className="space-y-5 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <TruckIcon className="w-4 h-4 text-emerald-600" />
                        <span>Dispatch & Submission Details</span>
                      </h2>

                      {/* Dispatch No */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Dispatch No <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={dispatchNo}
                          onChange={(e) => setDispatchNo(e.target.value)}
                          placeholder="e.g. CHC/AI/2026-27/001"
                          disabled={isCompleted || loadingGeneral}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                        />
                      </div>

                      {/* Dispatch Date */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Dispatch Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={dispatchDate}
                          onChange={(e) => setDispatchDate(e.target.value)}
                          disabled={isCompleted || loadingGeneral}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="submit"
                          disabled={savingGeneral || isCompleted}
                          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                        >
                          {savingGeneral ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              <span>Save Dispatch Details</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleFreeze}
                          disabled={freezing || isCompleted}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {freezing ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              <span>Validating & Freezing...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheckIcon className="w-4 h-4" />
                              <span>Freeze & Finalize Approval</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Instructions Notice */}
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 text-blue-900 dark:text-blue-300 text-xs space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                      <span>Approval & Freezing Guidelines:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>All primary health facilities (PHCs) mapped to this CHC must have completed their annual indents before freezing.</li>
                      <li>Every item with quantity greater than 0 must have an approved quantity assigned.</li>
                      <li>Once frozen, the annual indent status is marked as <strong>Completed (C)</strong> and forwarded to the district warehouse.</li>
                    </ul>
                  </div>

                </div>
              )}

            </div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
