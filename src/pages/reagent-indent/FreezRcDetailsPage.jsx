import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { 
  getMedicalColleges, 
  getFreezRcDetails 
} from '../../api/reagentIndentApi';

export default function FreezRcDetailsPage() {
  const user = useSelector((s) => s.auth.user);

  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('0');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadColleges();
  }, []);

  const loadColleges = async () => {
    try {
      const res = await getMedicalColleges();
      if (res && res.success && res.data) {
        setColleges(res.data);
        // Pre-select facility if available
        const userFacId = user?.facilityId ? String(user.facilityId) : '0';
        const exists = res.data.some(c => String(c.facilityId) === userFacId);
        if (exists) {
          setSelectedCollege(userFacId);
        }
      }
    } catch (err) {
      console.error('Failed to load medical colleges:', err);
    }
  };

  const handleShowReport = async () => {
    setLoading(true);
    try {
      const res = await getFreezRcDetails(selectedCollege);
      if (res && res.success && res.data) {
        setReportData(res.data);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
      toast.error('Failed to load report data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const exportRows = reportData.map((row, idx) => ({
        'S.No': idx + 1,
        'Equipment': row.EQPNAME || '',
        'Make': row.MAKE || '',
        'Model': row.MODEL || '',
        'No. of Institutes': row.nosinstiute || 0,
        'No. of Reagent Mapped': row.NoOfReagentMapped || 0,
        'Reagent RC Count': row.NosReagentRC || 0,
        'Supplier': row.suppliername || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '_');
      XLSX.writeFile(workbook, `Report_${today}.xlsx`);
      toast.success('Report exported to Excel successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full flex flex-col min-h-full shadow-sm border border-slate-200/60 rounded-xl overflow-hidden bg-white">
              
              {/* Header Toolbar (Excel Button) */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
                  title="Export to Excel"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10.5-7L14 15.5 16.5 18h-2.1l-1.4-2.1L11.6 18H9.5l2.5-2.5L9.5 13h2.1l1.4 2.1 1.4-2.1h2.1z" />
                  </svg>
                  <span>Export to Excel</span>
                </button>
              </div>

              {/* Title Header */}
              <div className="py-3 px-4 text-center">
                <h1 className="text-base md:text-lg font-bold text-emerald-800 tracking-wide">
                  Proprietary based Reagent Equipment Mapped vs Rate Contract Status
                </h1>
              </div>

              {/* Filter Section */}
              <div className="py-4 px-6 bg-slate-50/70 border-y border-slate-200 flex flex-col items-center justify-center gap-3">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-800">
                  <label className="font-bold text-slate-700">Select Medical College :</label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-w-[240px] max-w-md"
                  >
                    <option value="0">--All--</option>
                    {colleges.map((c) => (
                      <option key={c.facilityId} value={c.facilityId}>
                        {c.facilityName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleShowReport}
                  className="px-5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded transition shadow-sm active:scale-95"
                >
                  Show Report
                </button>
              </div>

              {/* Data Grid Table */}
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-emerald-600 mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Report Data…</p>
                  </div>
                ) : (
                  <div className="border border-emerald-600/60 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#0f172a] text-slate-100 uppercase tracking-wider text-[11px] font-bold">
                        <tr className="divide-x divide-slate-800">
                          <th className="px-3 py-3 text-center w-14">S.No</th>
                          <th className="px-4 py-3">Equipment</th>
                          <th className="px-4 py-3">Make</th>
                          <th className="px-4 py-3">Model</th>
                          <th className="px-4 py-3 text-center">No. of Institutes</th>
                          <th className="px-4 py-3 text-center">No. of Reagent Mapped</th>
                          <th className="px-4 py-3 text-center">Reagent RC Count</th>
                          <th className="px-4 py-3">Supplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-800 bg-white">
                        {reportData.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-slate-500 font-semibold border border-slate-300">
                              No data found for selected filter conditions
                            </td>
                          </tr>
                        ) : (
                          reportData.map((item, idx) => (
                            <tr key={item.mmid || idx} className="divide-x divide-slate-100 hover:bg-emerald-50/40 transition-colors">
                              <td className="px-3 py-3 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{item.EQPNAME}</td>
                              <td className="px-4 py-3 text-slate-700">{item.MAKE}</td>
                              <td className="px-4 py-3 text-slate-700">{item.MODEL}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">{item.nosinstiute}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">{item.NoOfReagentMapped}</td>
                              <td className="px-4 py-3 text-center font-bold text-emerald-700">{item.NosReagentRC}</td>
                              <td className="px-4 py-3 font-medium text-slate-800">{item.suppliername}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
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
