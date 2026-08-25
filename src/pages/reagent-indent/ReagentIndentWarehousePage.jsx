import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import { 
  getReagentWarehouseIndents,
  checkIncompleteIndent 
} from '../../api/reagentIndentApi';
import { 
  generateReagentAnnualIndentPDF, 
  generateReagentIndentLetterPDF 
} from '../../utils/reagentIndentPdfGenerator';
import { 
  PlusIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ReagentIndentWarehousePage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const [finYear, setFinYear] = useState('2026-2027');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [indents, setIndents] = useState([]);
  const [hasIncompleteEntry, setHasIncompleteEntry] = useState(false);

  useEffect(() => {
    loadWarehouseIndents();
  }, [finYear, statusFilter]);

  const loadWarehouseIndents = async () => {
    setLoading(true);
    try {
      const [resIndents, resCheck] = await Promise.all([
        getReagentWarehouseIndents(finYear, statusFilter),
        checkIncompleteIndent()
      ]);

      if (resIndents && resIndents.success && resIndents.data) {
        setIndents(resIndents.data);
      }
      if (resCheck && resCheck.success) {
        setHasIncompleteEntry(resCheck.hasIncomplete);
      }
    } catch (err) {
      console.error('Failed to load reagent warehouse indents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewIndent = () => {
    if (hasIncompleteEntry) {
      toast('Opening Reagent Annual Indent creation page...', { icon: 'ℹ️' });
    }
    navigate('/reagent-indent/warehouse-indent/add?Mode=Create');
  };

  const handleDownloadAnnualIndent = (indent) => {
    generateReagentAnnualIndentPDF(indent, user);
  };

  const handleDownloadIndentLetter = (indent) => {
    generateReagentIndentLetterPDF(indent, user);
  };

  const handlePendingCertificateClick = (indent) => {
    const indentNo = indent.NOCNUMBER || indent.NOCNumber || indent.NocNumber || indent.nocNumber || indent.INDENTNO || indent.indentNo || 'N/A';
    toast.success(`Opening Proprietary Certificate status for Indent No: ${indentNo}`);
  };

  const filteredIndents = indents.filter(item => {
    const statusCode = item.STATUSCODE || item.StatusCode || item.statusCode || (item.Status === 'Incomplete' ? 'I' : item.Status === 'Completed' ? 'C' : 'I');
    if (statusFilter === 'All') return true;
    if (statusFilter === 'I') return statusCode === 'I';
    if (statusFilter === 'C') return statusCode === 'C';
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full flex flex-col min-h-full shadow-sm border border-slate-200/60 rounded-xl overflow-hidden bg-white">
              
              {/* Slate Title Banner (No Green) */}
              <div className="bg-slate-100 border-b border-slate-200 py-3 px-4 text-center">
                <h1 className="text-lg font-bold text-slate-800 tracking-wide">
                  Annual Indent for Equipment Based Reagent
                </h1>
              </div>

              {/* Controls Bar */}
              <div className="py-4 px-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span>Financial Year:</span>
                  <select 
                    value={finYear}
                    onChange={(e) => setFinYear(e.target.value)}
                    className="border-slate-300 shadow-sm rounded-md text-xs font-medium py-1.5 px-3 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span>Add New REAGENT Annual Indent:</span>
                  <button 
                    onClick={handleAddNewIndent}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow-sm hover:shadow active:scale-95 flex items-center justify-center"
                    title="Add new Reagent Annual Indent"
                  >
                    <PlusIcon className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Grid Table */}
              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Indent Data…</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#0f172a] text-slate-100 sticky top-0 z-10 shadow-sm uppercase tracking-wider text-[11px] font-bold">
                      <tr className="divide-x divide-slate-800">
                        <th className="px-4 py-3.5 text-center w-16">Sl. No.</th>
                        <th className="px-4 py-3.5 text-center">Indent No.</th>
                        <th className="px-4 py-3.5 text-center w-32">Indent Date</th>
                        <th className="px-4 py-3.5 text-center w-32">Status</th>
                        <th className="px-4 py-3.5 text-center">Download Anual Indent</th>
                        <th className="px-4 py-3.5 text-center">Download Indent Letter</th>
                        <th className="px-4 py-3.5 text-center max-w-[220px]">
                          Upload Proprietary Certificate is Pending in CME Office.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800 bg-white">
                      {filteredIndents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-12 text-center text-slate-400 font-medium">
                            No Item found
                          </td>
                        </tr>
                      ) : (
                        filteredIndents.map((item, idx) => {
                          const nocNumber = item.NOCNUMBER || item.NOCNumber || item.NocNumber || item.nocNumber || item.INDENTNO || item.indentNo || item.INDENTNUMBER || 'N/A';
                          const nocDate = item.NOCDATE || item.NocDate || item.nocDate || item.INDENTDATE || item.indentDate || 'N/A';
                          const statusCode = item.STATUSCODE || item.StatusCode || item.statusCode || (item.Status === 'Incomplete' || item.STATUS === 'Incomplete' ? 'I' : 'C');
                          const nocId = item.NOCID || item.NocId || item.nocId || item.INDENTID || item.indentId;

                          return (
                            <tr key={nocId || idx} className="divide-x divide-slate-100 hover:bg-slate-50 transition-colors">
                              {/* 1. Sl. No. */}
                              <td className="px-4 py-3.5 text-center font-semibold text-slate-600">{idx + 1}</td>
                              
                              {/* 2. Indent No. */}
                              <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">{nocNumber}</td>
                              
                              {/* 3. Indent Date */}
                              <td className="px-4 py-3.5 text-center">{nocDate}</td>
                              
                              {/* 4. Status */}
                              <td className="px-4 py-3.5 text-center">
                                {statusCode === 'I' ? (
                                  <button
                                    onClick={() => navigate(`/reagent-indent/warehouse-indent/add?nocId=${nocId}&indentNo=${encodeURIComponent(nocNumber)}&indentDate=${encodeURIComponent(nocDate)}`)}
                                    className="text-red-600 hover:text-red-800 font-bold underline transition-colors"
                                  >
                                    Incomplete
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    Completed
                                  </span>
                                )}
                              </td>
                              
                              {/* 5. Download Anual Indent */}
                              <td className="px-4 py-3.5 text-center">
                                {statusCode === 'C' ? (
                                  <button
                                    onClick={() => handleDownloadAnnualIndent(item)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold transition-colors"
                                  >
                                    <DocumentArrowDownIcon className="w-3.5 h-3.5" /> Download
                                  </button>
                                ) : null}
                              </td>
                              
                              {/* 6. Download Indent Letter */}
                              <td className="px-4 py-3.5 text-center">
                                {statusCode === 'C' ? (
                                  <button
                                    onClick={() => handleDownloadIndentLetter(item)}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold transition-colors"
                                  >
                                    <DocumentArrowDownIcon className="w-3.5 h-3.5" /> Download
                                  </button>
                                ) : null}
                              </td>
                              
                              {/* 7. Upload Proprietary Certificate Pending */}
                              <td className="px-4 py-3.5 text-center">
                                {statusCode === 'C' ? (
                                  <button
                                    onClick={() => handlePendingCertificateClick(item)}
                                    className="text-blue-600 hover:text-blue-800 font-bold underline text-xs"
                                  >
                                    Click here
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
