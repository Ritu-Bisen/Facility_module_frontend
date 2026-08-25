import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { generateWardIssuePDF } from '../utils/wardIssuePdfGenerator';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function PrintWardIssuePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrintDetails();
  }, [id]);

  const loadPrintDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ward-issue/${id}/print`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Failed to load voucher details');
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
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Printable Voucher…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <p className="text-sm font-bold text-red-600">⚠ Error Loading Voucher</p>
          <p className="text-xs text-red-500 mt-2">{error || 'Voucher not found.'}</p>
          <button
            onClick={() => navigate('/ward-issues')}
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
          onClick={() => navigate('/ward-issues')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-2 rounded-xl transition"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to List
        </button>
        <button
          onClick={() => generateWardIssuePDF(data, type)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition shadow-sm"
        >
          <PrinterIcon className="w-4.5 h-4.5" /> Save / Download PDF
        </button>
      </div>

      {/* Voucher Container */}
      <div id="print-area" className="max-w-[1100px] mx-auto border border-slate-300 rounded-2xl p-8 print:border-0 print:p-0 font-sans text-xs">
        
        {/* Header Block */}
        <div className="bg-slate-800 p-6 flex items-center justify-between print-header">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">CGMSC</h1>
              <p className="text-slate-400 text-xs mt-1">Chhattisgarh Medical Services Corporation Ltd.</p>
            </div>
            <h2 className="text-lg font-bold text-white tracking-widest border border-slate-600 px-4 py-2 rounded">
              {type === 'shc' ? 'SHC ISSUE VOUCHER' : 'WARD ISSUE VOUCHER'}
            </h2>
        </div>

        {/* Voucher Meta details grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-6 px-8 text-slate-700 border-b border-slate-200">
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Facility Name</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{header.FacilityName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{header.DistrictName}, {header.StateName}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">
              {type === 'shc' ? 'Transfer To Facility' : 'Issued To Ward'}
            </p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{header.WardName} ({header.WardCode})</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Issue Date</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{fmtDate(header.IssueDate)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Voucher No</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5 font-mono">{header.IssueNo}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Requested By</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">{header.WRequestBy || '—'} (Req. Date: {fmtDate(header.WRequestDate)})</p>
          </div>
        </div>

        {/* Items list table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full border border-slate-300 border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3e2c] text-white font-bold uppercase tracking-wider text-[10px] divide-x divide-slate-400">
                <th className="py-2.5 px-3 text-center w-12">Sl. No.</th>
                <th className="py-2.5 px-3 text-left">Item code & description</th>
                <th className="py-2.5 px-3 text-left w-60">Issue Info</th>
                <th className="py-2.5 px-3 text-left w-52">Quantity</th>
                <th className="py-2.5 px-3 text-left w-[380px]">Batches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {items.map((item, idx) => (
                <tr key={item.IssueItemID} className="divide-x divide-slate-300 align-top">
                  {/* Sl. No. */}
                  <td className="py-3 px-3 text-center align-middle font-bold text-slate-800 text-xs">{idx + 1}</td>
                  
                  {/* Item code & description */}
                  <td className="py-3 px-3 space-y-1.5">
                    <p className="font-bold text-xs flex items-center gap-1.5 flex-wrap">
                      <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">{item.ItemCode}</span>
                      <svg className="w-3.5 h-3.5 text-blue-950 inline-block fill-current" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">{item.ItemName}</span>
                    </p>
                    <div className="text-[10px] text-slate-600 font-bold flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>Strength: <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">{item.Strength || '500 mg'}</span></span>
                      <span className="text-slate-300">|</span>
                      <span>SKU: <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">{item.SKU || '10 X 10'}</span></span>
                      <span className="text-slate-300">|</span>
                      <span>Type: <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">TAB</span></span>
                      <span className="text-slate-300">|</span>
                      <span>Pack Qty: <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">100</span></span>
                      <span className="text-slate-300">|</span>
                      <span>EDL Type : <span className="text-blue-700 hover:text-blue-800 underline cursor-pointer">EDL</span></span>
                    </div>
                  </td>
                  
                  {/* Issue Info */}
                  <td className="py-3 px-3 text-[11px] text-slate-800 font-bold space-y-1.5 align-middle">
                    <div className="flex justify-between max-w-[220px]">
                      <span>Facility Stock:</span>
                      <span>{(item.CurrentStock !== undefined && item.CurrentStock !== null) ? Number(item.CurrentStock).toLocaleString('en-IN') : '39,900'}</span>
                    </div>
                    <div className="flex justify-between max-w-[220px]">
                      <span>Requested Qty in No.:</span>
                      <span>{item.Allotted || '200'}</span>
                    </div>
                  </td>
                  
                  {/* Quantity */}
                  <td className="py-3 px-3 text-[11px] text-slate-800 font-bold align-middle">
                    <p>Issue Qty in No.: {item.IssueQty}</p>
                  </td>
                  
                  {/* Batches nested table */}
                  <td className="py-3 px-3">
                    {item.batches && item.batches.length > 0 ? (
                      <table className="w-full border border-slate-400 border-collapse text-[10px] bg-white">
                        <thead>
                          <tr className="bg-[#1e3e2c] text-white font-bold uppercase divide-x divide-slate-400">
                            <th className="py-1 px-1.5 text-center">Sl. No.</th>
                            <th className="py-1 px-1.5 text-left">Batch No.</th>
                            <th className="py-1 px-1.5 text-left">Mfg date</th>
                            <th className="py-1 px-1.5 text-left">Exp Date</th>
                            <th className="py-1 px-1.5 text-left">Stock Location</th>
                            <th className="py-1 px-1.5 text-right">Quantity (in No.s)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {item.batches.map((b, bIdx) => (
                            <tr key={bIdx} className="divide-x divide-slate-300 text-slate-800 font-medium">
                              <td className="py-1 px-1.5 text-center">{bIdx + 1}</td>
                              <td className="py-1 px-1.5 font-bold">{b.BatchNo}</td>
                              <td className="py-1 px-1.5">{b.MfgDate ? new Date(b.MfgDate).toLocaleDateString('en-GB') : '01-01-2026'}</td>
                              <td className="py-1 px-1.5">{b.ExpDate ? new Date(b.ExpDate).toLocaleDateString('en-GB') : '31-12-2027'}</td>
                              <td className="py-1 px-1.5">{b.StockLocation || 'TAB RACK 3'}</td>
                              <td className="py-1 px-1.5 text-right font-bold">{b.IssueQty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Area (Bottom of Voucher) */}
        <div className="mt-16 pt-12 border-t border-slate-300 grid grid-cols-3 text-center gap-12 font-bold text-slate-500 uppercase text-[9px] tracking-wider print:mt-24">
          <div>
            <div className="w-full border-b border-slate-300 h-8 mb-2"></div>
            <p>Issued By</p>
            <p className="text-[8px] text-slate-400 lowercase mt-0.5">store keeper</p>
          </div>
          <div>
            <div className="w-full border-b border-slate-300 h-8 mb-2"></div>
            <p>Checked By</p>
            <p className="text-[8px] text-slate-400 lowercase mt-0.5">superintendent / MOIC</p>
          </div>
          <div>
            <div className="w-full border-b border-slate-300 h-8 mb-2"></div>
            <p>Received By</p>
            <p className="text-[8px] text-slate-400 lowercase mt-0.5">ward in-charge</p>
          </div>
        </div>

      </div>
    </div>
  );
}
