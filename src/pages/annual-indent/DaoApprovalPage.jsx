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
  TruckIcon,
  TagIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

// ─── Excel (.xls) Export Helper ─────────────────────────────────────────────
function downloadAsExcel(headers, rows, filename) {
  let tableHtml = `
    <table border="1" style="border-collapse:collapse; font-family:Arial,sans-serif; font-size:12px;">
      <thead>
        <tr style="background-color:#0f172a; color:white; font-weight:bold;">
          ${headers.map(h => `<th style="padding:6px 10px; border:1px solid #cbd5e1;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => `
          <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            ${row.map(cell => `<td style="padding:5px 8px; border:1px solid #e2e8f0;">${cell ?? ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DaoApprovalPage() {
  const { user } = useAuth();

  // Active Tab: 'approval' | 'general' | 'masOverview'
  const [activeTab, setActiveTab] = useState('approval');

  // Fin Years
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [loadingFinYears, setLoadingFinYears] = useState(false);

  // Categories Dropdown (ddlCat)
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Drugs Dropdown (ddldrug)
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState('0');
  const [loadingDrugs, setLoadingDrugs] = useState(false);

  // Grid Data (gv1)
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

  // Overview / Master List State (DAOApprovalMas)
  const [masList, setMasList] = useState([]);
  const [loadingMas, setLoadingMas] = useState(false);

  // Messages
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Effective facility ID
  const facilityId = useMemo(() => {
    return user?.facilityId || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.facilityId : null) || localStorage.getItem('facilityId') || '23633';
  }, [user]);

  // Searchable Drug Options for react-select
  const drugOptions = useMemo(() => {
    return [
      { value: '0', label: '-- Select Drug --' },
      ...drugs.map(d => ({
        value: String(d.itemId),
        label: d.itemName
      }))
    ];
  }, [drugs]);

  const currentDrugOption = useMemo(() => {
    return drugOptions.find(opt => opt.value === String(selectedDrug)) || drugOptions[0];
  }, [drugOptions, selectedDrug]);

  // Load Financial Years & Categories on Mount
  useEffect(() => {
    fetchFinYears();
    fetchCategories();
  }, []);

  const fetchFinYears = async () => {
    setLoadingFinYears(true);
    try {
      const res = await axios.get('/dao-annual-indent/fin-years');
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

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get('/dao-annual-indent/categories');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showMsg('Failed to load categories', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  // When Fin Year, Category or Facility changes, reload drugs & dispatch details
  useEffect(() => {
    if (selectedFinYear) {
      fetchDrugs();
      fetchDispatchDetails();
    }
  }, [selectedFinYear, selectedCategory, facilityId]);

  const fetchDrugs = async () => {
    setLoadingDrugs(true);
    setSelectedDrug('0');
    setItems([]);
    try {
      const res = await axios.get('/dao-annual-indent/drugs', {
        params: {
          facilityId,
          finYearId: selectedFinYear,
          subcatId: selectedCategory !== '0' ? selectedCategory : 0
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDrugs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching drugs:', err);
      showMsg('Failed to load drugs list', 'error');
    } finally {
      setLoadingDrugs(false);
    }
  };

  const fetchDispatchDetails = async () => {
    setLoadingGeneral(true);
    try {
      const res = await axios.get('/dao-annual-indent/dispatch-details', {
        params: { facilityId, finYearId: selectedFinYear }
      });
      if (res.data?.success && res.data.data) {
        setDispatchNo(res.data.data.dispatchNo || '');
        setDispatchDate(res.data.data.dispatchDate || '');
        setIsCompleted(Boolean(res.data.data.isCompleted));
      }
    } catch (err) {
      console.error('Error fetching dispatch details:', err);
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Fetch Items when Drug is selected
  useEffect(() => {
    if (selectedDrug && selectedDrug !== '0' && selectedFinYear) {
      fetchFacilityItems(selectedDrug);
    } else {
      setItems([]);
    }
  }, [selectedDrug]);

  const fetchFacilityItems = async (itemId) => {
    setLoadingItems(true);
    try {
      const res = await axios.get('/dao-annual-indent/facility-items', {
        params: {
          facilityId,
          finYearId: selectedFinYear,
          itemId
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching facility items:', err);
      showMsg('Failed to load facility indent items', 'error');
      setItems([]);
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

  // Change Approve Qty in local state
  const handleQtyChange = (anualIndentId, val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setItems(prev =>
      prev.map(item =>
        item.anualIndentId === anualIndentId ? { ...item, bmoApprovedQty: num } : item
      )
    );
  };

  // Approve Individual Item
  const handleApproveItem = async (row) => {
    const aprQty = row.bmoApprovedQty !== '' ? Number(row.bmoApprovedQty) : (row.anlQty || 0);
    setSavingRowId(row.anualIndentId);
    try {
      const res = await axios.post('/dao-annual-indent/approve-item', {
        anualIndentId: row.anualIndentId,
        itemId: row.itemId,
        facilityId: row.facilityId,
        finYearId: selectedFinYear,
        approveQty: aprQty
      });
      if (res.data?.success) {
        showMsg(`Approved item for ${row.facilityName} successfully!`, 'success');
        // Update local item row state to green/approved
        setItems(prev =>
          prev.map(it =>
            it.anualIndentId === row.anualIndentId
              ? { ...it, isApproved: true, cmhoAprStatus: 'Y', bmoApprovedQty: aprQty }
              : it
          )
        );
      }
    } catch (err) {
      console.error('Error approving item:', err);
      showMsg('Failed to approve item. Please try again.', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  // Approve All Items currently displayed on the page
  const handleApproveAll = async () => {
    if (items.length === 0) return;
    const confirm = await Swal.fire({
      title: 'Approve All Items?',
      text: `Are you sure you want to approve all ${items.length} facility indent entries on this page?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Approve All'
    });
    if (!confirm.isConfirmed) return;

    setSavingAll(true);
    try {
      const res = await axios.post('/dao-annual-indent/approve-batch', {
        items: items.map(it => ({
          anualIndentId: it.anualIndentId,
          itemId: it.itemId,
          facilityId: it.facilityId,
          bmoApprovedQty: it.bmoApprovedQty !== '' ? Number(it.bmoApprovedQty) : (it.anlQty || 0)
        })),
        finYearId: selectedFinYear
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'All Items Approved!',
          text: `Successfully approved ${items.length} items.`,
          timer: 2000,
          showConfirmButton: false
        });
        setItems(prev =>
          prev.map(it => ({
            ...it,
            isApproved: true,
            cmhoAprStatus: 'Y'
          }))
        );
      }
    } catch (err) {
      console.error('Error approving batch items:', err);
      Swal.fire({
        icon: 'error',
        title: 'Batch Approval Failed',
        text: err.response?.data?.error || 'Server error while batch approving items.'
      });
    } finally {
      setSavingAll(false);
    }
  };

  // Save Dispatch Details
  const handleSaveDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchNo.trim()) {
      Swal.fire({ icon: 'warning', title: 'Dispatch No Required', text: 'Please enter Dispatch No' });
      return;
    }
    if (!dispatchDate.trim()) {
      Swal.fire({ icon: 'warning', title: 'Dispatch Date Required', text: 'Please select Dispatch Date' });
      return;
    }

    setSavingGeneral(true);
    try {
      const res = await axios.post('/dao-annual-indent/dispatch-details', {
        facilityId,
        finYearId: selectedFinYear,
        dispatchNo: dispatchNo.trim(),
        dispatchDate: dispatchDate.trim()
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Saved Successfully',
          text: 'Dispatch details saved successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error saving dispatch details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.error || 'Failed to save dispatch details.'
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  // Freeze Action (btnComplete_Click)
  const handleFreeze = async () => {
    const confirm = await Swal.fire({
      title: 'Freeze Annual Indent?',
      text: 'Are you sure you want to freeze and approve the Annual Indent for all Ayush facilities in this district? This action finalizes the approval.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Freeze Now'
    });
    if (!confirm.isConfirmed) return;

    setFreezing(true);
    try {
      const res = await axios.post('/dao-annual-indent/freeze', {
        facilityId,
        finYearId: selectedFinYear
      });

      if (res.data?.success) {
        setIsCompleted(true);
        await Swal.fire({
          icon: 'success',
          title: 'Approved Successfully!',
          text: 'Annual Indent has been approved and freezed successfully.',
          confirmButtonColor: '#059669'
        });
      } else {
        // Validation failure feedback matching C# code
        if (res.data?.validationError === 'FACILITIES_NOT_SUBMITTED') {
          Swal.fire({
            icon: 'error',
            title: 'Facilities Not Freezed',
            html: `
              <div class="text-left text-xs space-y-2">
                <p class="font-bold text-red-600">Your all facilities have not freezed/submitted annual indents:</p>
                <div class="p-2 bg-red-50 border border-red-200 rounded text-red-800 max-h-40 overflow-y-auto">
                  ${res.data.detail || 'One or more facilities have not submitted.'}
                </div>
              </div>
            `
          });
        } else if (res.data?.validationError === 'ITEMS_NOT_APPROVED') {
          Swal.fire({
            icon: 'error',
            title: 'Items Not Approved',
            html: `
              <div class="text-left text-xs space-y-2">
                <p class="font-bold text-amber-600">Please approve all items before freezing:</p>
                <div class="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 max-h-40 overflow-y-auto font-mono">
                  ${res.data.detail || 'Unapproved items remain.'}
                </div>
              </div>
            `
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Freeze Failed',
            text: res.data?.message || 'Failed to freeze indent.'
          });
        }
      }
    } catch (err) {
      console.error('Error freezing indent:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || 'Server error while freezing indent.'
      });
    } finally {
      setFreezing(false);
    }
  };

  // Load Overview Master List if user clicks overview tab
  const fetchOverviewList = async () => {
    setLoadingMas(true);
    try {
      const res = await axios.get('/annual-indent/dao/forwarded-list', {
        params: { finYearId: selectedFinYear }
      });
      if (res.data?.success) {
        setMasList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load overview master list:', err);
    } finally {
      setLoadingMas(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'masOverview' && masList.length === 0) {
      fetchOverviewList();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-5">

              {/* Title Header matching ASP.NET C# Banner */}
              <div className="bg-[#0f172a] text-white rounded-xl shadow-sm py-4 px-6 flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight">
                      Approval of Forwarded Indent of Ayush Facilities
                    </h1>
                    <p className="text-xs text-slate-400">
                      DAO Level Approval &amp; Freeze of Annual Indents submitted by District Ayush Facilities
                    </p>
                  </div>
                </div>

                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                    <span>Freezed &amp; Completed</span>
                  </span>
                )}
              </div>

              {/* Status Alert Banner */}
              {msg.text && (
                <div
                  className={`p-3 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 border transition-all ${
                    msg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : msg.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {msg.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-600" />
                  )}
                  <span>{msg.text}</span>
                </div>
              )}

              {/* Tabs Navigation (Aproval vs General vs Master Overview) */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleTabChange('approval')}
                  className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'approval'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <DocumentCheckIcon className="w-4 h-4" />
                  <span>Aproval</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('general')}
                  className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'general'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TruckIcon className="w-4 h-4" />
                  <span>General</span>
                  {isCompleted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Completed" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('masOverview')}
                  className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ml-auto ${
                    activeTab === 'masOverview'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  title="View Overview of All Categories (DAOApprovalMas)"
                >
                  <TableCellsIcon className="w-4 h-4" />
                  <span>Category Overview</span>
                </button>
              </div>

              {/* TAB 1: APPROVAL */}
              {activeTab === 'approval' && (
                <div className="space-y-4">
                  {/* Filter Header Box: Financial Year, Select Category, Select Drug */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                      
                      {/* Financial Year Selector */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs md:text-sm font-bold text-slate-700 whitespace-nowrap min-w-[110px] text-right">
                          Financial Year:
                        </label>
                        <select
                          value={selectedFinYear}
                          onChange={(e) => setSelectedFinYear(e.target.value)}
                          disabled={loadingFinYears}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition"
                        >
                          {finYears.map(fy => (
                            <option key={fy.accYrSetId} value={fy.accYrSetId}>
                              {fy.accYear} {fy.isCurrent ? '(Current)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Category Selector (ddlCat) */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs md:text-sm font-bold text-slate-700 whitespace-nowrap min-w-[110px] text-right">
                          Select Category:
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          disabled={loadingCategories}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition"
                        >
                          <option value="0">-- Select Category --</option>
                          {categories.map(cat => (
                            <option key={cat.subcatId} value={cat.subcatId}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Drug Selector (ddldrug - Searchable) */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs md:text-sm font-bold text-slate-700 whitespace-nowrap min-w-[90px] text-right">
                          Select Drug:
                        </label>
                        <div className="w-full min-w-[200px]">
                          <Select
                            options={drugOptions}
                            value={currentDrugOption}
                            onChange={(opt) => setSelectedDrug(opt ? opt.value : '0')}
                            isDisabled={loadingDrugs || drugs.length === 0}
                            isLoading={loadingDrugs}
                            isSearchable={true}
                            placeholder="-- Search or Select Drug --"
                            noOptionsMessage={() => (drugs.length === 0 ? "No drugs for this category" : "No matching drug")}
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                minHeight: '36px',
                                height: '36px',
                                fontSize: '12px',
                                fontWeight: '700',
                                backgroundColor: '#f8fafc',
                                borderColor: state.isFocused ? '#059669' : '#cbd5e1',
                                boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                                borderRadius: '0.5rem',
                                '&:hover': { borderColor: '#059669' }
                              }),
                              valueContainer: (base) => ({
                                ...base,
                                height: '36px',
                                padding: '0 8px'
                              }),
                              input: (base) => ({
                                ...base,
                                margin: 0,
                                padding: 0
                              }),
                              indicatorsContainer: (base) => ({
                                ...base,
                                height: '36px'
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

                    </div>
                  </div>

                  {/* Batch Action Toolbar */}
                  {items.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-600">
                        Showing <span className="font-bold text-slate-900">{items.length}</span> facility indent record(s) for selected drug.
                      </div>
                      <button
                        type="button"
                        onClick={handleApproveAll}
                        disabled={savingAll || isCompleted}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                        title="Approve all facility indents on this page at once"
                      >
                        {savingAll ? (
                          <>
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            <span>Approving All...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span>Approve All Items on this Page</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* GridView gv1 Table */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-330px)]">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 z-10 shadow-xs bg-slate-50">
                          <tr className="bg-[#0f172a] text-white font-bold text-center border-b border-slate-700">
                            <th className="py-2.5 px-3 border-r border-slate-700 w-12 text-center">Sl. No.</th>
                            <th className="py-2.5 px-4 border-r border-slate-700 text-left min-w-[200px]">ItemCode &amp; Description</th>
                            <th className="py-2.5 px-4 border-r border-slate-700 text-left min-w-[200px]">Facility Name</th>
                            <th className="py-2.5 px-3 border-r border-slate-700 text-center w-24">Consumption</th>
                            <th className="py-2.5 px-3 border-r border-slate-700 text-center w-24">Current Stock</th>
                            <th className="py-2.5 px-3 border-r border-slate-700 text-center w-28">Facility Anual Indent</th>
                            <th className="py-2.5 px-3 border-r border-slate-700 text-center w-28">Approve Qty</th>
                            <th className="py-2.5 px-3 text-center w-24">Actions</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {loadingItems ? (
                            <tr>
                              <td colSpan="8" className="py-14 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <ArrowPathIcon className="w-6 h-6 animate-spin text-emerald-600" />
                                  <span className="text-xs font-semibold">Loading facility indents...</span>
                                </div>
                              </td>
                            </tr>
                          ) : selectedDrug === '0' ? (
                            <tr>
                              <td colSpan="8" className="py-14 text-center text-slate-500 font-medium">
                                Please select a Financial Year, Category, and Drug to view facility indents.
                              </td>
                            </tr>
                          ) : items.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="py-14 text-center text-slate-500 font-bold">
                                No facility indent record found for this drug.
                              </td>
                            </tr>
                          ) : (
                            items.map((row) => {
                              const isApproved = row.isApproved;
                              // Row coloring logic matching C# gv1_RowDataBound:
                              // If GetAproved() -> GreenYellow (#dcfce7)
                              // Else -> Pink (#ffe4e6)
                              const rowBg = isApproved
                                ? 'bg-emerald-50/80 hover:bg-emerald-100/70 text-slate-900 border-l-4 border-l-emerald-600'
                                : 'bg-rose-50/70 hover:bg-rose-100/70 text-slate-900 border-l-4 border-l-rose-500';

                              return (
                                <tr key={row.anualIndentId} className={`transition-colors ${rowBg}`}>
                                  {/* Sl No */}
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                                    {row.slNo}
                                  </td>

                                  {/* ItemCode & Description */}
                                  <td className="py-2.5 px-4 font-bold border-r border-slate-200 text-slate-900">
                                    <div className="font-mono text-emerald-800 text-[11px] font-black">{row.itemCode}</div>
                                    <div className="font-semibold text-xs leading-snug">{row.itemName}</div>
                                  </td>

                                  {/* Facility Name */}
                                  <td className="py-2.5 px-4 font-bold border-r border-slate-200 text-slate-800">
                                    {row.facilityName}
                                  </td>

                                  {/* Consumption */}
                                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">
                                    {row.consumption.toLocaleString('en-IN')}
                                  </td>

                                  {/* Current Stock */}
                                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">
                                    {row.currentStock.toLocaleString('en-IN')}
                                  </td>

                                  {/* Facility Anual Indent */}
                                  <td className="py-2.5 px-3 text-center font-black text-slate-900 border-r border-slate-200">
                                    {row.anlQty.toLocaleString('en-IN')}
                                  </td>

                                  {/* Approve Qty (txtapproveQty1) */}
                                  <td className="py-2 px-3 text-center border-r border-slate-200">
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.bmoApprovedQty !== undefined ? row.bmoApprovedQty : row.anlQty}
                                      onChange={(e) => handleQtyChange(row.anualIndentId, e.target.value)}
                                      disabled={isCompleted || savingRowId === row.anualIndentId}
                                      className="w-20 px-2 py-1 text-center font-black text-xs border border-slate-300 rounded bg-white shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none"
                                    />
                                  </td>

                                  {/* Actions (imgBtnAdd - Approve) */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveItem(row)}
                                      disabled={isCompleted || savingRowId === row.anualIndentId}
                                      title="Approve Item"
                                      className={`inline-flex items-center justify-center p-1.5 rounded-md font-bold transition shadow-xs ${
                                        isApproved
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      }`}
                                    >
                                      {savingRowId === row.anualIndentId ? (
                                        <ArrowPathIcon className="w-4 h-4 animate-spin text-emerald-700" />
                                      ) : (
                                        <CheckIcon className="w-4 h-4" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Legend */}
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400 inline-block" />
                          <span>Approved (`CMHOAPRSTATUS = 'Y'`)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-400 inline-block" />
                          <span>Pending Approval</span>
                        </span>
                      </div>
                      <div>
                        Total Facilities: <span className="font-bold text-slate-900">{items.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GENERAL (Dispatch & Freeze) */}
              {activeTab === 'general' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 max-w-2xl mx-auto space-y-6">
                  {isCompleted && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">Annual Indent Freezed &amp; Approved</div>
                        <div className="text-xs text-emerald-800">
                          Annual indent for this financial year has been finalized and frozen (`CMHOAPPROVE = 'C'`).
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSaveDispatch} className="space-y-4">
                    {/* Financial Year Display */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-600">Selected Financial Year:</span>
                      <span className="font-black text-slate-900">
                        {finYears.find(y => String(y.accYrSetId) === String(selectedFinYear))?.accYear || selectedFinYear}
                      </span>
                    </div>

                    {/* Dispatch No */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                      <label className="text-xs md:text-sm font-bold text-slate-700 min-w-[130px]">
                        Dispatch No:
                      </label>
                      <input
                        type="text"
                        value={dispatchNo}
                        onChange={(e) => setDispatchNo(e.target.value)}
                        placeholder="Enter Dispatch Number"
                        disabled={loadingGeneral || isCompleted}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 transition"
                      />
                    </div>

                    {/* Dispatch Date */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                      <label className="text-xs md:text-sm font-bold text-slate-700 min-w-[130px]">
                        Dispatch Date:
                      </label>
                      <input
                        type="text"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                        placeholder="DD-MM-YYYY (e.g. 30-01-2026)"
                        disabled={loadingGeneral || isCompleted}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 transition"
                      />
                    </div>

                    {/* Save Dispatch Details Button */}
                    <div className="pt-2 text-center">
                      <button
                        type="submit"
                        disabled={savingGeneral || isCompleted}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs md:text-sm shadow-xs transition disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {savingGeneral ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            <span>Saving Dispatch Details...</span>
                          </>
                        ) : (
                          <span>Save Dispatch Details</span>
                        )}
                      </button>
                    </div>
                  </form>

                  <hr className="border-slate-200" />

                  {/* Freeze Section */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                    <div className="text-xs text-slate-600">
                      Before freezing, verify that all active Ayush facilities in this district have submitted their indents, and all required items have been approved.
                    </div>
                    <button
                      type="button"
                      onClick={handleFreeze}
                      disabled={freezing || isCompleted}
                      className="px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-xs md:text-sm shadow-sm transition disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {freezing ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          <span>Validating &amp; Freezing...</span>
                        </>
                      ) : (
                        <span>Freeze</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: CATEGORY OVERVIEW (DAOApprovalMas) */}
              {activeTab === 'masOverview' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Overview of Forwarded Indents by Category
                      </h2>
                      <p className="text-xs text-slate-500">
                        Summary of category-wise indents and dispatch status (`DAOApprovalMas.aspx`)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchOverviewList}
                      disabled={loadingMas}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                    >
                      <ArrowPathIcon className={`w-3.5 h-3.5 ${loadingMas ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0f172a] text-white font-bold text-center">
                          <th className="py-2.5 px-3 border-r border-slate-700 w-16 text-center">Sl No</th>
                          <th className="py-2.5 px-4 border-r border-slate-700 text-left">Category</th>
                          <th className="py-2.5 px-4 border-r border-slate-700 text-center">Dispatch No</th>
                          <th className="py-2.5 px-4 border-r border-slate-700 text-center">Dispatch Date</th>
                          <th className="py-2.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingMas ? (
                          <tr>
                            <td colSpan="5" className="py-10 text-center text-slate-500">
                              <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                              <span>Loading overview...</span>
                            </td>
                          </tr>
                        ) : masList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-10 text-center text-slate-400 font-semibold">
                              No records found.
                            </td>
                          </tr>
                        ) : (
                          masList.map((row, idx) => (
                            <tr key={row.subCatId || idx} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-200">
                                {row.catName}
                              </td>
                              <td className="py-2.5 px-4 text-center border-r border-slate-200 font-mono">
                                {row.dispatchNo || '—'}
                              </td>
                              <td className="py-2.5 px-4 text-center border-r border-slate-200">
                                {row.dispatchDate || '—'}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(String(row.subCatId));
                                    setActiveTab('approval');
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                                >
                                  Go to Approval &rarr;
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
