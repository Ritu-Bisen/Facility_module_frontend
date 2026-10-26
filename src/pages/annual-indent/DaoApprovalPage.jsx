import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// ─── Excel (XLS) Download Helper ────────────────────────────────────────────
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

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function DaoApprovalPage() {
  const { user } = useAuth();

  const [view, setView] = useState('list'); // 'list' | 'detail'

  // List view
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  // Detail view
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // ── Fetch List on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await axios.get('/annual-indent/dao/forwarded-list');
      if (res.data?.success) {
        setListData(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch forwarded list:', err);
      setListError('Failed to load data. Please try again.');
    } finally {
      setListLoading(false);
    }
  };

  // ── Navigate to detail view ───────────────────────────────────────────────
  const handleClickHere = async (row) => {
    setSelectedRow(row);
    setView('detail');
    setDetailData([]);
    setDetailLoading(true);
    setDetailError('');
    try {
      const res = await axios.get('/annual-indent/dao/detail-items', {
        params: { subCatId: row.subCatId }
      });
      if (res.data?.success) {
        setDetailData(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch detail items:', err);
      setDetailError('Failed to load item details. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedRow(null);
    setDetailData([]);
    setDetailError('');
  };

  const handleExcelExport = () => {
    if (!detailData.length) return;
    const headers = ['Sl No', 'Category', 'Item Code', 'Item Name', 'Strength', 'Facility Indent Qty', 'DAO Approved Qty'];
    const rows = detailData.map(r => [
      r.slNo, r.categoryName, r.itemCode, r.itemName, r.strength, r.facilityIndentQty, r.daoApprovedQty
    ]);
    downloadAsExcel(headers, rows, `DrugListAI_${selectedRow?.catName || 'All'}`);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
            {view === 'list' ? (
              <ListPage
                listData={listData}
                listLoading={listLoading}
                listError={listError}
                onRefresh={fetchList}
                onClickHere={handleClickHere}
              />
            ) : (
              <DetailPage
                selectedRow={selectedRow}
                detailData={detailData}
                detailLoading={detailLoading}
                detailError={detailError}
                onBack={handleBack}
                onExport={handleExcelExport}
              />
            )}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

// ─── List Page Component ─────────────────────────────────────────────────────
function ListPage({ listData, listLoading, listError, onRefresh, onClickHere }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Title Banner — uses header/sidebar color (#0f172a / slate-900) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-[#0f172a] text-white text-center py-4 px-6 flex items-center justify-between">
          <div className="flex-1 text-center font-bold text-lg tracking-wide">
            Approval of Forwarded Indent of Ayush Facilities
          </div>
          <button
            onClick={onRefresh}
            disabled={listLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition border border-slate-700 shadow-sm"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${listLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {listError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {listError}
        </div>
      )}

      {/* Grid Table — uses header/sidebar color with fixed header and internal scroll */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-230px)]">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-[#0f172a] text-white">
                <th className="py-2.5 px-4 font-semibold text-center border-r border-slate-700 whitespace-nowrap w-16 bg-[#0f172a]">
                  Sl No
                </th>
                <th className="py-2.5 px-4 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Category
                </th>
                <th className="py-2.5 px-4 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Dispatch No
                </th>
                <th className="py-2.5 px-4 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Dispatch Date
                </th>
                <th className="py-2.5 px-4 font-semibold text-center whitespace-nowrap bg-[#0f172a]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-[#0f172a]" />
                      <span className="font-medium">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : listData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 text-sm font-semibold">
                    No forwarded indents found.
                  </td>
                </tr>
              ) : (
                listData.map((row, idx) => (
                  <tr
                    key={`${row.subCatId}-${idx}`}
                    className={`transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="py-2 px-4 text-center font-semibold text-slate-500 border-r border-slate-100">
                      {row.slNo}
                    </td>
                    <td className="py-2 px-4 border-r border-slate-100 font-semibold text-slate-800">
                      {row.catName}
                    </td>
                    <td className="py-2 px-4 border-r border-slate-100 text-slate-700 font-mono">
                      {row.dispatchNo}
                    </td>
                    <td className="py-2 px-4 border-r border-slate-100 text-slate-700">
                      {row.dispatchDate}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => onClickHere(row)}
                        className="text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2 text-sm transition-colors"
                      >
                        Click Here
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!listLoading && listData.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Total: {listData.length} record(s)
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Page Component (rptDAOApprovalAyush equivalent) ─────────────────
function DetailPage({ selectedRow, detailData, detailLoading, detailError, onBack, onExport }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return detailData;
    const q = searchQuery.toLowerCase();
    return detailData.filter(r =>
      (r.itemCode || '').toLowerCase().includes(q) ||
      (r.itemName || '').toLowerCase().includes(q)
    );
  }, [detailData, searchQuery]);

  const totalIndentQty = useMemo(
    () => filteredData.reduce((sum, r) => sum + (r.facilityIndentQty || 0), 0),
    [filteredData]
  );
  const totalDaoQty = useMemo(
    () => filteredData.reduce((sum, r) => sum + (r.daoApprovedQty || 0), 0),
    [filteredData]
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Title + Category Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="bg-[#0f172a] text-white text-center py-3.5 px-6">
          <h2 className="text-lg font-bold tracking-wide">Ayush Annual Indent Details</h2>
        </div>

        {/* Category display */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <span className="text-sm font-bold text-slate-600 shrink-0">Category:</span>
            <span className="text-sm font-bold text-slate-800 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm flex-1">
              {selectedRow?.catName || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions bar (Download Excel left, Back right) */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onExport}
            disabled={detailData.length === 0 || detailLoading}
            title="Download Excel File"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor">
              <path d="M3 3h18v2H3V3zm0 4h6v2H3V7zm0 4h6v2H3v-2zm0 4h6v2H3v-2zm8-8h10v12H11V7zm2 2v8h6V9h-6zm1 1h1.5l1.5 3 1.5-3H19l-2 4 2 4h-1.5L16 15l-1.5 3H13l2-4-2-4z"/>
            </svg>
            <span>Download Excel File</span>
          </button>

          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search item..."
              className="pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none w-48 bg-white"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
            </svg>
          </div>
        </div>

        {/* Right: Back link */}
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2 text-sm transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Error */}
      {detailError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {detailError}
        </div>
      )}

      {/* Detail Grid Table — header/sidebar color (#0f172a) with fixed header and internal scroll */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)]">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-[#0f172a] text-white">
                <th className="py-2.5 px-3 font-semibold text-center border-r border-slate-700 whitespace-nowrap w-12 bg-[#0f172a]">
                  Sl No
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Category
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Item Code
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Item Name
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Strength
                </th>
                <th className="py-2.5 px-3 font-semibold text-center border-r border-slate-700 whitespace-nowrap bg-[#0f172a]">
                  Facility Indent Qty
                </th>
                <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap bg-[#0f172a]">
                  DAO Approved Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailLoading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-[#0f172a]" />
                      <span className="font-medium">Loading items...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 text-sm font-semibold">
                    No items found for this category.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={`${item.itemCode}-${idx}`}
                    className={`transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="py-2 px-3 text-center font-medium text-slate-500 border-r border-slate-100">
                      {item.slNo}
                    </td>
                    <td className="py-2 px-3 text-slate-700 border-r border-slate-100 text-xs">
                      {item.categoryName}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 border-r border-slate-100 text-xs">
                      {item.itemCode}
                    </td>
                    <td className="py-2 px-3 text-slate-900 border-r border-slate-100 font-medium">
                      {item.itemName}
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-100 text-xs">
                      {item.strength}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-slate-800 border-r border-slate-100">
                      {item.facilityIndentQty.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-slate-800">
                      {item.daoApprovedQty.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals footer row */}
            {!detailLoading && filteredData.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 shadow-sm">
                <tr className="bg-[#0f172a] text-white font-bold">
                  <td colSpan={5} className="py-2.5 px-3 text-right text-xs uppercase tracking-wider border-r border-slate-700 bg-[#0f172a]">
                    Total ({filteredData.length} items):
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-700 bg-[#0f172a]">
                    {totalIndentQty.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center bg-[#0f172a]">
                    {totalDaoQty.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
