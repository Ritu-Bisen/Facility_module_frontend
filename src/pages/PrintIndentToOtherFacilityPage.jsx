import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getIndentDetail } from '../api/indentToOtherFacilityApi';
import { generateIndentToOtherFacilityPDF } from '../utils/indentToOtherFacilityPdfGenerator';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function PrintIndentToOtherFacilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrintDetails();
  }, [id]);

  const loadPrintDetails = async () => {
    setLoading(true);
    try {
      const res = await getIndentDetail(id);
      if (res.success) {
        setData({
          header: res.data.header,
          items: res.data.items || []
        });
      } else {
        setError(res.message || 'Failed to load indent details');
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Failed to load indent details');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (dStr) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Printable Indent…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <p className="text-sm font-bold text-red-600">⚠ Error Loading Indent</p>
          <p className="text-xs text-red-500 mt-2">{error || 'Indent not found.'}</p>
          <button
            onClick={() => navigate('/indent-to-other-facility')}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-lg"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const { header, items } = data;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print:p-0">
      
      {/* Print Controls (Hidden on print) */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 print:hidden max-w-[1100px] mx-auto">
        <button
          onClick={() => navigate('/indent-to-other-facility')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-2 rounded-xl transition"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to List
        </button>
        <button
          onClick={() => generateIndentToOtherFacilityPDF(data)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition shadow-sm"
        >
          <PrinterIcon className="w-4.5 h-4.5" /> Save / Download PDF
        </button>
      </div>

      {/* Indent Container */}
      <div className="max-w-[1100px] mx-auto border border-slate-300 rounded-2xl p-8 print:border-0 print:p-0 font-sans text-xs">
        
        {/* Header Block */}
        <div className="text-center pb-6 border-b border-slate-300">
          <h1 className="text-lg font-extrabold tracking-wider uppercase text-indigo-950 print:text-black">
            INDENT TO OTHER FACILITY
          </h1>
          <p className="text-slate-500 font-semibold text-[10px] uppercase mt-0.5 print:text-slate-700">
            {user?.roleName || 'Facility'}
          </p>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mt-4 border-y border-dashed border-slate-300 py-1.5 inline-block px-8">
            INDENT DOCUMENT
          </h2>
        </div>

        {/* Meta details grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-6 text-slate-700 border-b border-slate-200">
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Indent Date</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{header.IndentDate || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Indent No</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5 font-mono">{header.IndentNo || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">From Facility</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{header.FromFacilityName || '—'}</p>
          </div>
          <div>
             <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Financial Year</p>
             <p className="font-bold text-slate-800 text-xs mt-0.5">{header.ShAccYear || '—'}</p>
          </div>
        </div>

        {/* Items list table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full border border-slate-300 border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3e2c] text-white font-bold uppercase tracking-wider text-[10px] divide-x divide-slate-400">
                <th className="py-2.5 px-3 text-center w-12">Sl. No.</th>
                <th className="py-2.5 px-3 text-left">Item Code</th>
                <th className="py-2.5 px-3 text-left">Item Name</th>
                <th className="py-2.5 px-3 text-left">Strength</th>
                <th className="py-2.5 px-3 text-right">Requested Qty</th>
                <th className="py-2.5 px-3 text-right">Approved Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {items.map((item, idx) => (
                <tr key={item.itemId || idx} className="divide-x divide-slate-300 align-top text-slate-800">
                  <td className="py-3 px-3 text-center align-middle font-bold text-xs">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{item.itemCode || item.ITEMCODE}</td>
                  <td className="py-3 px-3 font-semibold">{item.itemName || item.ITEMNAME}</td>
                  <td className="py-3 px-3">{item.strength || item.STRENGTH1}</td>
                  <td className="py-3 px-3 text-right font-bold">{item.requestedQty || item.REQUESTEDQTY}</td>
                  <td className="py-3 px-3 text-right font-bold">{item.approvedQty || item.APPROVEDQTY}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 px-3 text-center text-slate-500 font-semibold">
                    No items in this indent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signature Area */}
        <div className="mt-16 pt-12 border-t border-slate-300 grid grid-cols-2 text-center gap-12 font-bold text-slate-500 uppercase text-[9px] tracking-wider print:mt-24">
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-300 h-8 mb-2"></div>
            <p>Prepared By</p>
            <p className="text-[8px] text-slate-400 lowercase mt-0.5">Pharmacist / Indenting Officer</p>
          </div>
          <div>
            <div className="w-3/4 mx-auto border-b border-slate-300 h-8 mb-2"></div>
            <p>Approved By</p>
            <p className="text-[8px] text-slate-400 lowercase mt-0.5">CMHO / Superintendent / MOIC</p>
          </div>
        </div>

      </div>
    </div>
  );
}
