import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { generateWardIssuePDF } from '../utils/wardIssuePdfGenerator';
import {
  PlusIcon,
  PrinterIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FolderOpenIcon,
  CalendarIcon,
  BookmarkSquareIcon
} from '@heroicons/react/24/outline';

export default function WardIssuesPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'returns'
  
  // Dropdown options
  const [accYears, setAccYears] = useState([]);
  const [items, setItems] = useState([]);
  
  // Selected Filters (Default to 'IR' - Incomplete)
  const [statusFilter, setStatusFilter] = useState('IR'); // 'AI', 'IR', 'CR'
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedItem, setSelectedItem] = useState('');

  // Data
  const [issues, setIssues] = useState([]);
  const [wards, setWards] = useState([]);
  const [expandedWardId, setExpandedWardId] = useState(null);
  const [returnsReceipts, setReturnsReceipts] = useState({}); // { wardId: [receipts] }
  
  // Loading states
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState({});
  const [isCheckingIncomplete, setIsCheckingIncomplete] = useState(false);

  useEffect(() => {
    if (facilityId) {
      loadFilters();
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId && selectedYear) {
      if (activeTab === 'issues') {
        loadIssues();
      } else {
        loadWards();
      }
    }
  }, [facilityId, activeTab, statusFilter, selectedYear, selectedItem]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const [yearsRes, itemsRes] = await Promise.all([
        api.get('/ward-issue/acc-years'),
        api.get(`/ward-issue/items?facilityId=${facilityId}`)
      ]);
      
      const mappedYears = (yearsRes.data || []).map(y => 
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y.ACCYRSETID || y.accYrSetId, SHAccYear: y.SHACCYEAR || y.shAccYear }
      );
      setAccYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedYear(mappedYears[0].AccYrSetID);
      }

      const mappedItems = (itemsRes.data || []).map(i =>
        Array.isArray(i) ? { ItemID: i[0], ItemName: i[1] } : { ItemID: i.ITEMID || i.itemId, ItemName: i.ITEMNAME || i.itemName }
      );
      setItems(mappedItems);
    } catch (e) {
      console.error('Failed to load filter options:', e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadIssues = async () => {
    setLoadingData(true);
    try {
      const res = await api.get('/ward-issue/list', {
        params: {
          status: statusFilter,
          accYrSetId: selectedYear || undefined,
          itemId: selectedItem || undefined
        }
      });
      const mappedIssues = (res.data || []).map(item => {
        const row = Array.isArray(item) ? {
          WardID: item[0],
          WardCode: item[1],
          WardName: item[2],
          StateName: item[3],
          FacilityName: item[4],
          DistrictName: item[5],
          IssueNo: item[6],
          IssueDate: item[7],
          WRequestDate: item[8],
          WRequestBy: item[9],
          Status: item[10],
          IssueID: item[11]
        } : {
          WardID: item.WARDID || item.wardId,
          WardCode: item.WARDCODE || item.wardCode,
          WardName: item.WARDNAME || item.wardName,
          IssueNo: item.ISSUENO || item.issueNo,
          IssueDate: item.ISSUEDATE || item.issueDate,
          WRequestDate: item.WREQUESTDATE || item.wrequestDate,
          WRequestBy: item.WREQUESTBY || item.wrequestBy,
          Status: item.STATUS || item.status,
          IssueID: item.ISSUEID || item.issueId
        };
        return row;
      });
      setIssues(mappedIssues);
    } catch (e) {
      console.error('Failed to load issues list:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const loadWards = async () => {
    setLoadingData(true);
    try {
      const res = await api.get('/ward-issue/returns-wards');
      setWards(res.data || []);
    } catch (e) {
      console.error('Failed to load return wards:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const loadReceiptsForWard = async (wardId) => {
    setLoadingReceipts(prev => ({ ...prev, [wardId]: true }));
    try {
      const res = await api.get('/ward-issue/returns-receipts', {
        params: {
          wardId,
          status: statusFilter,
          accYrSetId: selectedYear || undefined,
          itemId: selectedItem || undefined
        }
      });
      const mappedReceipts = (res.data || []).map(item => {
        return Array.isArray(item) ? {
          FacReceiptID: item[0],
          FacReceiptNo: item[1],
          FacReceiptDate: item[2],
          Status: item[3],
          Source: item[4]
        } : {
          FacReceiptID: item.FACRECEIPTID || item.facReceiptId,
          FacReceiptNo: item.FACRECEIPTNO || item.facReceiptNo,
          FacReceiptDate: item.FACRECEIPTDATE || item.facReceiptDate,
          Status: item.STATUS || item.status,
          Source: item.SOURCE || item.source
        };
      });
      setReturnsReceipts(prev => ({ ...prev, [wardId]: mappedReceipts }));
    } catch (e) {
      console.error(`Failed to load receipts for ward ${wardId}:`, e);
    } finally {
      setLoadingReceipts(prev => ({ ...prev, [wardId]: false }));
    }
  };

  const toggleWardExpand = (wardId) => {
    if (expandedWardId === wardId) {
      setExpandedWardId(null);
    } else {
      setExpandedWardId(wardId);
      loadReceiptsForWard(wardId);
    }
  };

  const fmtDate = (dStr) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) {
        // Fallback if string is formatted differently
        return dStr.split('T')[0] || dStr;
      }
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dStr;
    }
  };

  const parseToIsoDate = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) {
        // Handle direct string split if date format is DD-MM-YYYY or similar
        const parts = dStr.split(' ')[0].split('-');
        if (parts.length === 3) {
          // Check if first part is year
          if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`;
          // Otherwise DD-MM-YYYY -> YYYY-MM-DD
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return '';
      }
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleEditIssue = (issue) => {
    localStorage.setItem('currentIssueId', String(issue.IssueID));
    localStorage.setItem('currentIssueNo', issue.IssueNo);
    localStorage.setItem('currentIssueHeaderSaved', 'true');
    localStorage.setItem('currentIssueForm', JSON.stringify({
      ward: String(issue.WardID),
      wardName: issue.WardName,
      reqDate: parseToIsoDate(issue.WRequestDate),
      issueDate: parseToIsoDate(issue.IssueDate),
      reqBy: issue.WRequestBy || ''
    }));
    navigate('/ward-issues/add');
  };

  const handleAddIssue = async () => {
    setIsCheckingIncomplete(true);
    try {
      const res = await api.get('/ward-issue/incomplete');
      if (res.data) {
        const incomplete = {
          IssueID: res.data.IssueID,
          IssueNo: res.data.IssueNo,
          WardID: res.data.WardID,
          WRequestDate: res.data.WRequestDate,
          IssueDate: res.data.IssueDate,
          WRequestBy: res.data.WRequestBy,
        };
        alert("An incomplete ward issue already exists for this facility. Please complete or cancel it before creating a new issue.");
        handleEditIssue(incomplete);
      } else {
        localStorage.removeItem('currentIssueNo');
        localStorage.removeItem('currentIssueId');
        localStorage.removeItem('currentIssueHeaderSaved');
        localStorage.removeItem('currentIssueForm');
        navigate('/ward-issues/add');
      }
    } catch (e) {
      console.error('Failed to check for incomplete issue:', e);
      localStorage.removeItem('currentIssueNo');
      localStorage.removeItem('currentIssueId');
      localStorage.removeItem('currentIssueHeaderSaved');
      localStorage.removeItem('currentIssueForm');
      navigate('/ward-issues/add');
    } finally {
      setIsCheckingIncomplete(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {isCheckingIncomplete && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Checking Incomplete Issues...</p>
              </div>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Ward Issues (Consumption from Main Store)</h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Consumption recorded for OPD/IPD issue</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  {/* Status filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-32"
                    >
                      <option value="AI">All Records</option>
                      <option value="IR">Incomplete</option>
                      <option value="CR">Completed</option>
                    </select>
                  </div>

                  {/* Year filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={loadingFilters}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    >
                      <option value="">Select Year</option>
                      {accYears.map(y => (
                        <option key={y.AccYrSetID} value={y.AccYrSetID}>{y.SHAccYear}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddIssue}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                    Add Issue
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              {(loadingData || loadingFilters) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400">Loading data from database…</p>
                </div>
              ) : (
                /* ── Ward Issues Table ── */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center w-14">Sl.</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-left">Ward (OPD/IPD)</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Voucher No</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Issued Dt</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Requested Dt</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-left">Remark/Requested By</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center">Voucher Status</th>
                          <th className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-5 py-3.5 text-center w-36">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {issues.map((issue, idx) => (
                          <tr key={issue.IssueID} className="hover:bg-slate-50/50 align-middle">
                            <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-800 text-xs">{issue.WardName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{issue.DistrictName}, {issue.StateName}</p>
                            </td>
                            <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600 bg-slate-50/50">{issue.IssueNo}</td>
                            <td className="px-5 py-4 text-center text-xs text-slate-600">{fmtDate(issue.IssueDate)}</td>
                            <td className="px-5 py-4 text-center text-xs text-slate-600">{fmtDate(issue.WRequestDate)}</td>
                            <td className="px-5 py-4 text-xs font-semibold text-slate-700">{issue.WRequestBy || '—'}</td>
                            <td className="px-5 py-4 text-center">
                              {issue.Status === 'C' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-pulse">
                                  <ClockIcon className="w-3.5 h-3.5" />
                                  Incomplete
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {issue.Status === 'C' ? (
                                <button
                                  onClick={() => generateWardIssuePDF(issue.IssueID, 'ward')}
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm hover:shadow"
                                >
                                  <PrinterIcon className="w-4.5 h-4.5 text-slate-500" />
                                  Print VR
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEditIssue(issue)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm hover:shadow-md"
                                >
                                  <PencilIcon className="w-3.5 h-3.5" />
                                  Edit Sheet
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {issues.length === 0 && (
                          <tr>
                            <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                               <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                               <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No issues found</p>
                               <p className="text-xs mt-1">Select alternative filters or click 'Add New Issue' to create one.</p>
                            </td>
                          </tr>
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
