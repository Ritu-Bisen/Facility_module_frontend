import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import api from '../api/axios';

const today = new Date().toISOString().split('T')[0];

const formatDateDDMMYYYY = (dStr) => {
  if (!dStr) return '—';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dStr;
  }
};

/* ─────────────────────────────────────────────────────────────
   Reusable Searchable Dropdown
   – opens full list on click, filters as you type
───────────────────────────────────────────────────────────── */
function SearchDrop({ options, value, onChange, placeholder, labelKey, valueKey, disabled }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef();

  const list = q.trim()
    ? options.filter((o) => (o[labelKey] || '').toLowerCase().includes(q.toLowerCase()))
    : options;

  const selected = options.find((o) => String(o[valueKey]) === String(value));

  /* close on outside click */
  useEffect(() => {
    const h = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openDrop = () => { if (disabled) return; setQ(''); setOpen(true); };
  const pick = (o) => { onChange(o[valueKey]); setOpen(false); setQ(''); };

  return (
    <div ref={boxRef} className="relative w-full">
      {/* Trigger */}
      <div
        onClick={openDrop}
        className={`flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border text-sm cursor-pointer select-none transition
          ${disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : open     ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
            : 'bg-white border-gray-300 hover:border-blue-400'}`}
      >
        <span className={`truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected[labelKey] : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-[200] top-full mt-1 w-full min-w-[220px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to filter…"
                className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400 min-w-0"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-xs">✕</button>
              )}
            </div>
          </div>
          {/* List */}
          <ul className="max-h-52 overflow-y-auto">
            {list.length === 0
              ? <li className="px-4 py-3 text-xs text-gray-400 text-center">No results</li>
              : list.map((o, i) => (
                <li
                  key={o[valueKey] ?? i}
                  onClick={() => pick(o)}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0
                    ${String(o[valueKey]) === String(value) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                >
                  {o[labelKey]}
                </li>
              ))}
          </ul>
          <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-right">
            <span className="text-[10px] text-gray-400">{list.length} result{list.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Item row in the Items table
───────────────────────────────────────────────────────────── */
function ItemRow({ row, index, facilityId, issueId, allItems, rows, onUpdate, onDelete }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 300 });
  const ref = useRef();       // wraps the input + portal trigger
  const inputWrapRef = useRef(); // the visual input box
  const [isSaving, setIsSaving] = useState(false);
  const [batches, setBatches] = useState([]);
  const [showBatches, setShowBatches] = useState(false);
  const [isEditing, setIsEditing] = useState(!row.issueItemId);

  useEffect(() => {
    setIsEditing(!row.issueItemId);
  }, [row.issueItemId]);

  useEffect(() => {
    if (row.issueItemId && row.itemId) {
      api.get(`/return-to-warehouse/batches/${row.issueItemId}/${row.itemId}`)
        .then((res) => {
          if (res.data && res.data.success) {
            setBatches(res.data.data || []);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [row.issueItemId, row.itemId]);

  const handleSaveRow = async () => {
    if (!issueId) {
      alert('Please generate the Issue No first.');
      return;
    }
    const isDup = rows.some((r, rIdx) => r.itemId === row.itemId && rIdx !== index);
    if (isDup) {
      alert("it alredy in your item list update then qty");
      return;
    }
    setIsSaving(true);
    try {
      let activeIssueItemId = row.issueItemId;
      if (row.issueItemId) {
        await api.put(`/return-to-warehouse/items/${row.issueItemId}`, {
          issueId,
          itemId: row.itemId,
          curStock: row.facilityStock || 0,
          allotted: row.requestedQty || 0,
          issueQty: row.issueQty || 0
        });
        setIsEditing(false);
      } else {
        const response = await api.post(`/return-to-warehouse/${issueId}/items`, {
          itemId: row.itemId,
          curStock: row.facilityStock || 0,
          allotted: row.requestedQty || 0,
          issueQty: row.issueQty || 0,
          issueItemId: 0
        });

        activeIssueItemId = response.data.issueItemId;
        onUpdate(index, { ...row, issueItemId: activeIssueItemId });
        setIsEditing(false);
      }

      // Fetch batch details
      const batchRes = await api.get(`/return-to-warehouse/batches/${activeIssueItemId}/${row.itemId}`);
      if (batchRes.data && batchRes.data.success) {
        setBatches(batchRes.data.data || []);
        setShowBatches(true);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to save item row.');
    } finally {
      setIsSaving(false);
    }
  };

  /* close on outside click */
  useEffect(() => {
    const h = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* recalculate dropdown position whenever it opens or window scrolls */
  const calcPos = () => {
    if (!inputWrapRef.current) return;
    const r = inputWrapRef.current.getBoundingClientRect();
    setDropPos({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: Math.max(r.width, 320),
    });
  };

  useEffect(() => {
    if (open) {
      calcPos();
      window.addEventListener('scroll', calcPos, true);
      window.addEventListener('resize', calcPos);
    }
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open]);

  const parseItem = (it) => {
    if (Array.isArray(it)) {
      return { id: it[0], label: String(it[1] || ''), code: '', name: String(it[1] || ''), strength: '' };
    }
    
    let label = String(it.displayname ?? it.ITEMNAME ?? it.itemname ?? '');
    let code = '';
    let name = label;
    let strength = '';

    if (it.displayname) {
      const parts = it.displayname.split('-');
      code = parts[0]?.trim() || '';
      if (parts.length > 2) {
        name = parts.slice(1, parts.length - 1).join('-').trim();
        strength = parts[parts.length - 1]?.trim() || '';
      } else if (parts.length === 2) {
        name = parts[1]?.trim() || '';
      }
      label = `${code} - ${name}`;
    } else {
      const parsed = splitLabel(label);
      code = parsed.code;
      name = parsed.name;
      strength = parsed.strength;
      label = `${code} - ${name}`;
    }

    return {
      id: it.ITEMID ?? it.itemid,
      label,
      code,
      name,
      strength,
    };
  };

  /**
   * Extract parts from the formatted label: "CODE - (Item Name)"
   * e.g. "D396 - (Paracetamol 500 mg Tablet IP)"
   */
  const splitLabel = (label) => {
    const dashIdx = label.indexOf(' - (');
    if (dashIdx !== -1) {
      const code = label.substring(0, dashIdx).trim();
      const name = label.substring(dashIdx + 4).replace(/\)$/, '').trim();
      return { code, name, strength: '' };
    }
    // Fallback: old hyphen format  "D396-ItemName-Strength"
    const parts = label.split('-');
    const code = parts[0]?.trim() || '';
    const name = parts.slice(1, parts.length - 1).join('-').trim() || label;
    const strength = parts.length > 2 ? parts[parts.length - 1]?.trim() : '';
    return { code, name, strength };
  };

  /* full list when q empty, filtered otherwise */
  const list = q.trim()
    ? allItems.filter((it) => parseItem(it).label.toLowerCase().includes(q.toLowerCase()))
    : allItems;

  const handlePick = async (it) => {
    const { id, code, name, strength } = parseItem(it);

    setQ(code);
    setOpen(false);
    setLoadingStock(true);

    // First update with item info immediately, stock loading indicator shown
    onUpdate(index, {
      itemId: id, itemCode: code, itemName: name, strength,
      sku: '',
      type: 'TAB',
      packQty: '',
      edlType: 'EDL',
      facilityStock: '',   // empty = loading
      requestedQty: '', issueQty: '',
    });

    try {
      // Call both the GetFacilityStock API and Item Details API in parallel
      const [stockRes, detailsRes] = await Promise.all([
        api.get(`/return-to-warehouse/facility-stock?facilityId=${facilityId}&itemId=${id}`),
        api.get(`/items/${id}/details`)
      ]);
      
      const stock = stockRes.data?.facilityStock ?? 0;
      const details = detailsRes.data || {};
      
      onUpdate(index, { ...row,
        itemId: id,
        itemCode: details.itemcode || code,
        itemName: details.itemname || name,
        strength: details.strength1 || strength,
        sku: details.sku || '',
        type: details.type || 'TAB',
        packQty: details.packqty || '',
        edlType: details.edltype || 'EDL',
        facilityStock: stock,
        requestedQty: '',
        issueQty: '',
      });
    } catch (e) {
      console.error('Failed to fetch item details or stock:', e);
      onUpdate(index, { ...row, itemId: id, itemCode: code, itemName: name, strength, facilityStock: 0 });
    } finally {
      setLoadingStock(false);
    }
  };

  /* portal dropdown rendered into body to escape table overflow */
  const dropdownPortal = open && createPortal(
    <div
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      {/* search box inside portal */}
      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type to filter…"
            className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400 min-w-0"
          />
          {q && (
            <button onMouseDown={(e) => { e.preventDefault(); setQ(''); }}
              className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0">✕</button>
          )}
        </div>
      </div>
      <ul className="max-h-56 overflow-y-auto">
        {list.length === 0
          ? <li className="px-4 py-3 text-xs text-gray-400 text-center">No items found</li>
          : list.slice(0, 120).map((it, i) => {
            const { id, label } = parseItem(it);
            return (
              <li
                key={id ?? i}
                onMouseDown={() => handlePick(it)}
                className="px-3 py-2.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0 text-gray-700"
              >
                {label}
              </li>
            );
          })}
      </ul>
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-right">
        <span className="text-[10px] text-gray-400">{list.length} result{list.length !== 1 ? 's' : ''}</span>
      </div>
    </div>,
    document.body
  );

  return (
    <tr className="border-b border-gray-200 hover:bg-blue-50/20 align-top">
      {/* Sl. No */}
      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-500 w-12 align-middle">{index + 1}</td>

      {/* Item code & description */}
      <td className="px-4 py-3">
        <div ref={ref}>
          {/* input trigger */}
          <div
            ref={inputWrapRef}
            className={`flex items-center border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 overflow-hidden ${!isEditing ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}
          >
            <input
              className="flex-1 px-2.5 py-1.5 text-xs outline-none bg-transparent placeholder-gray-400 min-w-0 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="Search item code or name…"
              value={row.itemCode ? row.itemCode : q}
              disabled={!isEditing}
              onFocus={() => {
                if (!isEditing) return;
                if (row.itemCode) {
                  setQ('');
                  onUpdate(index, { ...row, itemCode: '', itemId: null, itemName: '', strength: '' });
                }
                calcPos();
                setOpen(true);
              }}
              onChange={(e) => {
                if (!isEditing) return;
                setQ(e.target.value);
                setOpen(true);
                if (row.itemCode) onUpdate(index, { ...row, itemCode: '', itemId: null, itemName: '', strength: '' });
              }}
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
          </div>
          {dropdownPortal}
        </div>

        {/* Item details after selection */}
        {row.itemName && (
          <div className="mt-2 pl-1 space-y-0.5">
            <p className="text-sm font-semibold text-gray-800">{row.itemName}</p>
            <p className="text-xs text-blue-600">Strength: <span className="underline">{row.strength || '—'}</span></p>
            <p className="text-xs text-gray-500">
              SKU: <span className="text-blue-600 underline">{row.sku || '—'}</span>&nbsp;&nbsp;
              Type: <span className="font-medium">{row.type || 'TAB'}</span>&nbsp;&nbsp;
              PackQty: <span className="text-blue-600 underline">{row.packQty || '—'}</span>
            </p>
            <p className="text-xs text-gray-500">EDL Type: <span className="text-blue-600 underline">{row.edlType === 'Y' ? 'EDL' : 'Non-EDL'}</span></p>
          </div>
        )}
      </td>

      {/* Issue Info */}
      <td className="px-4 py-3 w-80 align-middle">
        <div className="space-y-2 text-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">Facility Stock:</span>
            {loadingStock ? (
              <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
            ) : (
              <span className="font-bold text-slate-800">
                {row.facilityStock !== '' ? Number(row.facilityStock).toLocaleString() : '—'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Requested Qty in No.:</span>
            <input
              type="number" min="0" value={row.requestedQty}
              disabled={!isEditing}
              onChange={(e) => onUpdate(index, { ...row, requestedQty: e.target.value, issueQty: e.target.value })}
              className="w-24 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-center font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="0"
            />
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3 w-72 align-middle">
        <div className="flex items-center gap-2 text-slate-700 text-xs">
          <span className="font-medium whitespace-nowrap">Issue Qty in No.:</span>
          <input
            type="number" min="0" max={row.requestedQty || ""} value={row.issueQty}
            disabled={!isEditing}
            onChange={(e) => {
              let val = e.target.value;
              if (val !== '' && Number(val) > Number(row.requestedQty || 0)) {
                val = row.requestedQty;
              }
              onUpdate(index, { ...row, issueQty: val });
            }}
            className="w-24 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-center font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="0"
          />
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center w-36 align-middle">
        <div className="flex items-center justify-center gap-2">
          {isEditing ? (
            <button
              disabled={!row.itemId || !row.issueQty || isSaving}
              onClick={handleSaveRow}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1
                ${row.itemId && row.issueQty && !isSaving
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow hover:shadow-md focus:ring-emerald-500'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving
                </span>
              ) : row.issueItemId ? 'Update' : 'Save'}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-md focus:ring-blue-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1"
            >
              Edit
            </button>
          )}
          <button 
            onClick={onDelete} 
            title="Delete Line Item"
            className="text-red-600 bg-red-50 border border-red-200 p-1.5 rounded-lg hover:bg-red-100/70 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>

      {/* Batch Details column */}
      <td className="px-4 py-3 align-middle w-[480px]">
        {row.issueItemId && batches.length > 0 ? (
          <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-[10px] text-left text-slate-600 border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1e3e2c] text-white text-[9.5px] font-bold tracking-wider">
                  <th className="px-1.5 py-1 text-center border border-slate-300">Sl. No.</th>
                  <th className="px-1.5 py-1 border border-slate-300">Batch No.</th>
                  <th className="px-1.5 py-1 text-center border border-slate-300">Mfg date</th>
                  <th className="px-1.5 py-1 text-center border border-slate-300">Exp Date</th>
                  <th className="px-1.5 py-1 border border-slate-300">Stock Location</th>
                  <th className="px-1.5 py-1 text-right border border-slate-300">Quantity (in No.s)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {batches.map((b, bIdx) => (
                  <tr key={bIdx} className="hover:bg-slate-50">
                    <td className="px-1.5 py-0.5 text-center font-semibold text-slate-400 border border-slate-300">{bIdx + 1}</td>
                    <td className="px-1.5 py-0.5 font-bold text-slate-800 border border-slate-300">{b.BATCHNO || b.batchNo}</td>
                    <td className="px-1.5 py-0.5 text-center border border-slate-300">{formatDateDDMMYYYY(b.MFGDATE || b.mfgDate)}</td>
                    <td className="px-1.5 py-0.5 text-center font-bold text-rose-600 border border-slate-300">{formatDateDDMMYYYY(b.EXPDATE || b.expDate)}</td>
                    <td className="px-1.5 py-0.5 border border-slate-300" title={b.STOCKLOCATION || b.stockLocation || '—'}>{b.STOCKLOCATION || b.stockLocation || '—'}</td>
                    <td className="px-1.5 py-0.5 text-right font-bold text-slate-800 border border-slate-300">{b.ISSUEQTY || b.issueQty || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
export default function ReturnToWarehouseItemsPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem('currentIssueForm');
    return savedForm ? JSON.parse(savedForm) : { warehouse: '', issueDate: '', issueDate: today, remarks: '' };
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [errors, setErrors] = useState({});
  const [issueNo, setIssueNo] = useState(() => localStorage.getItem('currentIssueNo') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [headerSaved, setHeaderSaved] = useState(() => localStorage.getItem('currentIssueHeaderSaved') === 'true');
  const [issueId, setIssueId] = useState(() => localStorage.getItem('currentIssueId') || null);

  const [allItems, setAllItems] = useState([]);
  const [rows, setRows] = useState([emptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  function emptyRow() {
    return { itemId: null, itemCode: '', itemName: '', strength: '', sku: '', type: '', packQty: '', edlType: '', facilityStock: '', requestedQty: '', issueQty: '' };
  }

  const loadSavedItems = async (activeId) => {
    if (!activeId || !facilityId) return;
    setIsItemsLoading(true);
    try {
      const res = await api.get(`/return-to-warehouse/${activeId}/items?facilityId=${facilityId}`);
      if (res.data && res.data.length > 0) {
        const loadedRows = res.data.map(item => ({
          itemId: item.ITEMID ?? item.itemId,
          itemCode: item.ITEMCODE ?? item.itemCode,
          itemName: item.ITEMNAME ?? item.itemName,
          strength: item.STRENGTH ?? item.strength,
          sku: item.SKU ?? item.sku,
          type: item.type ?? 'TAB',
          packQty: item.packQty ?? '',
          edlType: item.edlType ?? 'EDL',
          facilityStock: item.CURSTOCK ?? item.curStock ?? 0,
          requestedQty: item.ALLOTTED ?? item.allotted ?? 0,
          issueQty: item.ISSUEQTY ?? item.issueQty ?? 0,
          issueItemId: item.ISSUEITEMID ?? item.issueItemId
        }));
        setRows(loadedRows);
      } else {
        setRows([emptyRow()]);
      }
    } catch (e) {
      console.error("Failed to load saved issue items:", e);
    } finally {
      setIsItemsLoading(false);
    }
  };

  const parseToIsoDate = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) {
        const parts = dStr.split(' ')[0].split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return '';
      }
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };



  useEffect(() => {
    if (facilityId) {
      loadWarehouses();
      loadItems();
    }
  }, [facilityId]);

  useEffect(() => {
    if (issueId && facilityId) {
      loadSavedItems(issueId);
    }
  }, [issueId, facilityId]);

  // Fallback for old data: If warehouse is missing but remarks matches a warehouse name, preselect it and clear remarks
  useEffect(() => {
    if (headerSaved && warehouses.length > 0 && (!form.warehouse || form.warehouse === 'null' || form.warehouse === 'undefined' || form.warehouse === '0')) {
      if (form.remarks) {
        const matchedWarehouse = warehouses.find(w => w.WAREHOUSENAME && w.WAREHOUSENAME.toLowerCase() === form.remarks.toLowerCase());
        if (matchedWarehouse) {
          setForm(p => {
            const u = { ...p, warehouse: String(matchedWarehouse.WAREHOUSEID), remarks: '' };
            localStorage.setItem('currentIssueForm', JSON.stringify(u));
            return u;
          });
        }
      }
    }
  }, [warehouses, headerSaved, form.remarks, form.warehouse]);

  async function loadWarehouses() {
    setLoadingWarehouses(true);
    try {
      const res = await api.get(`/return-to-warehouse/warehouses?facilityId=${facilityId}`);
      setWarehouses((res.data || []).map((w) =>
        Array.isArray(w) ? { WAREHOUSEID: w[0], WAREHOUSENAME: w[1] } : { WAREHOUSEID: w.WAREHOUSEID ?? w.WarehouseID ?? w.warehouseId, WAREHOUSENAME: w.WAREHOUSENAME ?? w.WarehouseName ?? w.warehouseName }
      ));
    } catch (e) { console.error(e); }
    finally { setLoadingWarehouses(false); }
  }

  async function loadItems() {
    try {
      const res = await api.get(`/facility/items/${facilityId}`);
      setAllItems(res.data || []);
    } catch (e) { console.error(e); }
  }

  const fmt = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}-${m}-${y}`; };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      const u = { ...p, [name]: value };
      if (name === 'issueDate' && p.issueDate && p.issueDate > value) u.issueDate = value;
      localStorage.setItem('currentIssueForm', JSON.stringify(u));
      return u;
    });
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.warehouse) e.warehouse = 'Select a warehouse';
    if (!form.issueDate) e.issueDate = 'Required';
    if (!form.issueDate) e.issueDate = 'Required';
    if (form.issueDate && form.issueDate && form.issueDate > form.issueDate)
      e.issueDate = 'Must be ≤ Issue Date';
    if (!form.remarks.trim()) e.remarks = 'Required';
    return e;
  };

  const handleGenerate = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsGenerating(true);
    try {
      if (issueId) {
        // Update header info via PUT
        await api.put(`/return-to-warehouse/${issueId}`, {
          facilityId, warehouseId: form.warehouse, issueNo,
          issueDate: fmt(form.issueDate), requestDate: fmt(form.issueDate), requestBy: form.remarks,
        });
        setHeaderSaved(true);
        localStorage.setItem('currentIssueHeaderSaved', 'true');
        localStorage.setItem('currentIssueForm', JSON.stringify(form));
      } else {
        // Generate new issue no and insert
        const r = await api.get(`/return-to-warehouse/generate-issue-no?facilityId=${facilityId}`);
        const no = r.data.issueNo;
        setIssueNo(no);
        const s = await api.post('/return-to-warehouse/', {
          facilityId, warehouseId: form.warehouse, issueNo: no,
          issueDate: fmt(form.issueDate), requestDate: fmt(form.issueDate), requestBy: form.remarks,
        });
        const generatedIssueId = s.data.issueId;
        setIssueId(generatedIssueId);
        setHeaderSaved(true);

        localStorage.setItem('currentIssueNo', no);
        localStorage.setItem('currentIssueId', String(generatedIssueId));
        localStorage.setItem('currentIssueHeaderSaved', 'true');
        localStorage.setItem('currentIssueForm', JSON.stringify(form));
      }
    } catch (e) { console.error(e); alert('Failed to save header. Try again.'); }
    finally { setIsGenerating(false); }
  };

  const handleDeleteHeader = async () => {
    if (!issueId) return;
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await api.delete(`/return-to-warehouse/${issueId}`);
      // Reset state
      setIssueId(null);
      setIssueNo('');
      setHeaderSaved(false);
      setForm({ warehouse: '', issueDate: '', issueDate: today, remarks: '' });
      setRows([emptyRow()]);

      // Clear localStorage
      localStorage.removeItem('currentIssueId');
      localStorage.removeItem('currentIssueNo');
      localStorage.removeItem('currentIssueHeaderSaved');
      localStorage.removeItem('currentIssueForm');
      navigate('/return-to-warehouse');
    } catch (e) {
      console.error(e);
      alert('Failed to delete issue.');
    }
  };

  const updateRow = (i, data) => setRows((p) => p.map((r, idx) => idx === i ? { ...r, ...data } : r));

  const deleteRow = async (i) => {
    const rowToDelete = rows[i];
    if (rowToDelete.issueItemId) {
      if (!window.confirm('Are you sure you want to delete this item?')) return;
      try {
        await api.delete(`/return-to-warehouse/items/${rowToDelete.issueItemId}`);
      } catch (e) {
        console.error(e);
        alert(e.response?.data?.error || 'Failed to delete item.');
        return;
      }
    }
    setRows((p) => {
      const updated = p.filter((_, idx) => idx !== i);
      return updated.length ? updated : [emptyRow()];
    });
  };

  const addRow = () => setRows((p) => [...p, emptyRow()]);

  const handleIssue = async () => {
    if (!issueId) { alert('Generate Issue No first.'); return; }
    const savedRows = rows.filter((r) => r.issueItemId);
    if (!savedRows.length) { alert('Save at least one item row first.'); return; }
    setIsSubmitting(true);
    try {
      await api.post(`/return-to-warehouse/${issueId}/complete`);

      // Clear localStorage
      localStorage.removeItem('currentIssueNo');
      localStorage.removeItem('currentIssueId');
      localStorage.removeItem('currentIssueHeaderSaved');
      localStorage.removeItem('currentIssueForm');

      navigate('/return-to-warehouse', {
        state: {
          newIssue: {
            warehouse: warehouses.find((w) => String(w.WAREHOUSEID) === String(form.warehouse))?.WAREHOUSENAME || form.warehouse,
            issueDate: fmt(form.issueDate), issueDate: fmt(form.issueDate),
            remarks: form.remarks, issueNo,
          },
        },
      });
    } catch (e) { alert(e.response?.data?.error || 'Failed to complete issue.'); }
    finally { setIsSubmitting(false); }
  };

  /* small helper for input classes */
  const inp = (err, extra = '') =>
    `w-full h-10 px-3.5 border rounded-xl text-sm transition-all duration-200 shadow-sm focus:outline-none focus:ring-4
    ${err 
      ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' 
      : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 focus:bg-white focus:ring-blue-100 focus:border-blue-500'} ${extra}`;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {isLoadingData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Loading Issue...</p>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-y-auto">

            {/* ── Page title bar with modern gradient banner ── */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-8 py-5 flex items-center justify-between shadow-md border-b border-white/5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/return-to-warehouse')}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-semibold transition-colors group px-3 py-1.5 rounded-lg hover:bg-white/10"
                >
                  <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back
                </button>
                <span className="text-white/20 text-lg">|</span>
                <div>
                  <h1 className="text-white font-bold text-lg leading-tight tracking-tight">Add New Issue</h1>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">Create a warehouse issue and dispense medicines efficiently.</p>
                </div>
              </div>
              {issueNo && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 shadow-inner">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 font-mono text-sm font-bold tracking-wider">{issueNo}</span>
                </div>
              )}
            </div>

            {/* Main content wrapper */}
            <div className="p-4 md:p-5 space-y-4 w-full">

              {/* ── Sleek Form card ── */}
              <div className="bg-white rounded-2xl border border-slate-200/75 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-wrap items-end gap-6">

                  {/* Warehouse Name */}
                  <div className="flex-[2] min-w-[240px] space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Warehouse Name (opd/ipd) <span className="text-red-500">*</span>
                    </label>
                    {headerSaved ? (
                      <input
                        type="text"
                        disabled
                        value={warehouses.find(w => String(w.WAREHOUSEID) === String(form.warehouse))?.WAREHOUSENAME || form.warehouseName || form.remarks || ''}
                        className={inp(false, 'bg-slate-100 border-slate-200 text-slate-700 font-semibold cursor-not-allowed shadow-none')}
                      />
                    ) : (
                      <SearchDrop
                        options={warehouses}
                        value={form.warehouse}
                        onChange={(v) => {
                          setForm((p) => {
                            const u = { ...p, warehouse: v };
                            localStorage.setItem('currentIssueForm', JSON.stringify(u));
                            return u;
                          });
                          setErrors((p) => ({ ...p, warehouse: undefined }));
                        }}
                        placeholder={loadingWarehouses ? 'Loading…' : 'Select a Warehouse'}
                        labelKey="WAREHOUSENAME"
                        valueKey="WAREHOUSEID"
                        disabled={loadingWarehouses}
                      />
                    )}
                    {errors.warehouse && !headerSaved && <p className="text-red-500 text-xs font-medium mt-1">⚠ {errors.warehouse}</p>}
                  </div>

                  {/* Requested Date */}
                  <div className="min-w-[170px] space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Requested Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date" name="issueDate" value={form.issueDate}
                      onChange={handleFormChange}
                      max={form.issueDate || today}
                      disabled={headerSaved}
                      className={inp(errors.issueDate, headerSaved ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' : '')}
                    />
                    {errors.issueDate && <p className="text-red-500 text-xs font-medium mt-1">⚠ {errors.issueDate}</p>}
                  </div>

                  {/* Issue Date */}
                  <div className="min-w-[170px] space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Issue Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date" name="issueDate" value={form.issueDate}
                      onChange={handleFormChange}
                      max={today}
                      disabled={headerSaved}
                      className={inp(errors.issueDate, headerSaved ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' : '')}
                    />
                    {errors.issueDate && <p className="text-red-500 text-xs font-medium mt-1">⚠ {errors.issueDate}</p>}
                  </div>

                  {/* Requested By */}
                  <div className="flex-1 min-w-[180px] space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Remark/Requested By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" name="remarks" value={form.remarks}
                      onChange={handleFormChange}
                      placeholder="Requester name"
                      maxLength={50}
                      disabled={headerSaved}
                      className={inp(errors.remarks, headerSaved ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none' : '')}
                    />
                    {errors.remarks && <p className="text-red-500 text-xs font-medium mt-1">⚠ {errors.remarks}</p>}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {headerSaved ? (
                      <>
                        <button
                          onClick={() => {
                            setHeaderSaved(false);
                            localStorage.setItem('currentIssueHeaderSaved', 'false');
                          }}
                          title="Edit Header"
                          className="h-10 w-10 flex items-center justify-center rounded-xl text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100/70 transition-all duration-200 shadow-sm hover:shadow"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDeleteHeader}
                          title="Delete Header"
                          className="h-10 w-10 flex items-center justify-center rounded-xl text-red-600 bg-red-50 border border-red-200 hover:bg-red-100/70 transition-all duration-200 shadow-sm hover:shadow"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`h-10 px-6 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-900
                          ${isGenerating
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5'}`}
                      >
                        {isGenerating ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Saving…
                          </span>
                        ) : issueId ? 'Update Header' : 'Generate Issue No'}
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Table Card ── */}
              <div className="bg-white rounded-2xl border border-slate-200/75 shadow-sm overflow-hidden">
                
                {/* Table strip header */}
                <div className="bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    <h2 className="text-white text-sm font-bold tracking-wide">Issue Items List</h2>
                  </div>
                  {issueNo && (
                    <span className="text-slate-400 text-xs font-mono">
                      Issue ID: <strong className="text-slate-200">{issueNo}</strong> &nbsp;•&nbsp; Date: <strong className="text-slate-200">{fmt(form.issueDate)}</strong>
                    </span>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative">
                  <table className="w-full text-sm min-w-[820px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center w-14">Sl.</th>
                        <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-left">Item Code &amp; Description</th>
                        <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-left">Stock &amp; Request Info</th>
                        <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-left">Quantity to Issue</th>
                        <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center w-32">Action</th>
                        <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-left w-[480px]">Batch Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isItemsLoading ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Items...</p>
                              </div>
                            </td>
                          </tr>
                        ) : rows.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                              No items added yet. Click "Add New Item" to begin.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, i) => (
                            <ItemRow
                              key={i} row={row} index={i}
                              facilityId={facilityId}
                              issueId={issueId}
                              allItems={allItems}
                              rows={rows}
                              onUpdate={updateRow}
                              onDelete={() => deleteRow(i)}
                            />
                          ))
                        )}
                    </tbody>
                  </table>
                </div>

                {/* Add row strip */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <button onClick={addRow}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:-translate-y-0.5 transform">
                    <PlusCircleIcon className="w-5 h-5 flex-shrink-0" /> Add New Item 
                  </button>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-slate-100 border-t border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFreezeModal(true)}
                      disabled={isSubmitting || !headerSaved}
                      className={`px-8 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 shadow
                        ${headerSaved && !isSubmitting
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5'
                          : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'}`}
                    >
                      {isSubmitting ? 'Issuing…' : 'Freeze'}
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this issue?')) {
                          if (issueId) {
                            try {
                              await api.delete(`/return-to-warehouse/${issueId}`);
                            } catch (e) {
                              console.error('Failed to delete  issue:', e);
                            }
                          }
                          localStorage.removeItem('currentIssueNo');
                          localStorage.removeItem('currentIssueId');
                          localStorage.removeItem('currentIssueHeaderSaved');
                          localStorage.removeItem('currentIssueForm');
                          navigate('/return-to-warehouse');
                        }
                      }}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100/85 transition-all duration-200 shadow-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <button
                    onClick={() => navigate('/return-to-warehouse')}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm hover:shadow"
                  >
                    Cancel
                  </button>
                </div>

              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>

      {showFreezeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <div>
                <h3 className="text-base font-bold">Review &amp; Freeze Issue</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please review the details before freezing</p>
              </div>
              <button 
                onClick={() => setShowFreezeModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Voucher (Issue) No</span>
                  <strong className="text-slate-800 text-sm font-mono">{issueNo || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Warehouse Name</span>
                  <strong className="text-slate-800 text-sm">{warehouses.find((w) => String(w.WAREHOUSEID) === String(form.warehouse))?.WAREHOUSENAME || form.warehouse || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Requested By</span>
                  <strong className="text-slate-800 text-sm">{form.remarks || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Requested Date</span>
                  <strong className="text-slate-800 text-sm">{fmt(form.issueDate) || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Issue Date</span>
                  <strong className="text-slate-800 text-sm">{fmt(form.issueDate) || '—'}</strong>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Items to Issue ({rows.filter((r) => r.issueItemId).length})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-center w-12">Sl.</th>
                        <th className="px-4 py-2.5">Item Code &amp; Name</th>
                        <th className="px-4 py-2.5 text-center w-24">Requested</th>
                        <th className="px-4 py-2.5 text-center w-24">Issue Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {rows.filter((r) => r.issueItemId).map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-center text-slate-400 font-semibold">{index + 1}</td>
                          <td className="px-4 py-2">
                            <span className="font-semibold text-slate-800">{row.itemCode}</span> - {row.itemName}
                          </td>
                          <td className="px-4 py-2 text-center font-medium">{row.requestedQty}</td>
                          <td className="px-4 py-2 text-center font-bold text-indigo-600 bg-slate-50/20">{row.issueQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warning/Important block */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-amber-800 flex items-center gap-1.5">
                  ⚠️ Important:
                </p>
                <p className="text-amber-800 leading-relaxed font-semibold">
                  By clicking "Freeze Now", all saved data will be finalized, stock deductions will be processed, and inventory balances will be updated accordingly. This action may not be reversible.
                </p>
                <p className="text-amber-700 font-medium">
                  Please verify all entered values before proceeding.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFreezeModal(false);
                  handleIssue();
                }}
                disabled={isSubmitting}
                className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 border border-transparent rounded-xl hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                {isSubmitting ? 'Processing…' : '🔒 Freeze Now'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
