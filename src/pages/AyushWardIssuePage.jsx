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
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

export default function AyushWardIssuePage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Dropdown options
  const [accYears, setAccYears] = useState([]);
  
  // Selected Filters (Default to 'IR' - Incomplete)
  const [statusFilter, setStatusFilter] = useState('IR'); // 'AI', 'IR', 'CR'
  const [selectedYear, setSelectedYear] = useState('');

  // Data
  const [issues, setIssues] = useState([]);
  
  // Loading states
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (facilityId) {
      loadFilters();
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId && selectedYear) {
      loadIssues();
    }
  }, [facilityId, statusFilter, selectedYear]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const yearsRes = await api.get('/ward-issue/acc-years');
      
      const mappedYears = (yearsRes.data || []).map(y => 
        Array.isArray(y) ? { AccYrSetID: y[0], SHAccYear: y[1] } : { AccYrSetID: y.ACCYRSETID || y.accYrSetId, SHAccYear: y.SHACCYEAR || y.shAccYear }
      );
      setAccYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedYear(mappedYears[0].AccYrSetID);
      }
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
        }
      });
      const mappedIssues = (res.data || []).map(item => {
        return Array.isArray(item) ? {
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
      });
      setIssues(mappedIssues);
    } catch (e) {
      console.error('Failed to load issues list:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const fmtDate = (dStr) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr.split('T')[0] || dStr;
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
    navigate(`/ayush-ward-issue/edit/${issue.IssueID}`);
  };

  const handleAddIssue = () => {
    // Direct creation of new issue without forcing completion of incomplete ones
    localStorage.removeItem('currentIssueNo');
    localStorage.removeItem('currentIssueId');
    localStorage.removeItem('currentIssueHeaderSaved');
    localStorage.removeItem('currentIssueForm');
    navigate('/ayush-ward-issue/add');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                    Ayush Ward Issue
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Ayush Facility Ward Issues & Consumption Management</p>
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
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                    Add Ayush Ward Issue
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
                  <p className="text-xs font-semibold text-slate-400">Loading Ayush ward issues…</p>
                </div>
              ) : (
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
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm hover:shadow-md cursor-pointer"
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
                               <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Ayush ward issues found</p>
                               <p className="text-xs mt-1">Select alternative filters or click 'Add Ayush Ward Issue' to create one.</p>
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
