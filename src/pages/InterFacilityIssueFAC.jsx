import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { getInFacilityTransferList } from '../api/inFacilityTransferApi';
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderOpenIcon,
  PencilIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

export default function InterFacilityIssueFAC() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Filters
  const [statusFilter, setStatusFilter] = useState('IR'); // 'IR' = Incomplete
  const [selectedYear, setSelectedYear] = useState('');
  
  // Data
  const [accYears, setAccYears] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (facilityId && selectedYear) {
      loadIssues();
    }
  }, [facilityId, selectedYear, statusFilter]);

  const loadYears = async () => {
    try {
      const res = await api.get('/ward-issue/acc-years');
      const mappedYears = (res.data || []).map(y => 
        Array.isArray(y) ? { id: y[0], name: y[1] } : { id: y.ACCYRSETID || y.accYrSetId, name: y.SHACCYEAR || y.shAccYear }
      );
      setAccYears(mappedYears);
      if (mappedYears.length > 0) {
        setSelectedYear(mappedYears[0].id);
      }
    } catch (error) {
      console.error('Error loading financial years:', error);
    }
  };

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await getInFacilityTransferList(facilityId, selectedYear, statusFilter);
      if (res.success) {
        const mappedIssues = (res.data || []).map(item => {
          if (Array.isArray(item)) {
            return {
              IssueID: item[0],
              IssueNo: item[1],
              IssueDate: item[2],
              WRequestBy: item[3],
              Remarks: item[4],
              Status: item[5],
              ToFacility: item[6],
              FromFacility: item[7],
              DistrictName: item[8],
              StateName: item[9]
            };
          }
          return {
            IssueID: item.ISSUEID || item.IssueID || item.issueId,
            IssueNo: item.ISSUENO || item.IssueNo || item.issueNo,
            IssueDate: item.ISSUEDATE || item.IssueDate || item.issueDate,
            WRequestBy: item.WREQUESTBY || item.WRequestBy || item.wRequestBy,
            Remarks: item.REMARKS || item.Remarks || item.remarks,
            Status: item.STATUS || item.Status || item.status,
            ToFacility: item.TOFACILITY || item.ToFacility || item.toFacility,
            FromFacility: item.FROMFACILITY || item.FromFacility || item.fromFacility,
            DistrictName: item.DISTRICTNAME || item.DistrictName || item.districtName,
            StateName: item.STATENAME || item.StateName || item.stateName
          };
        });
        setIssues(mappedIssues);
      }
    } catch (error) {
      console.error('Error loading transfer list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssue = async () => {
    try {
      // Check if there are any incomplete issues for the selected year
      const res = await getInFacilityTransferList(facilityId, selectedYear, 'IR');
      if (res.success && res.data && res.data.length > 0) {
        alert("Please complete your incomplete issue(s) first.");
        setStatusFilter('IR');
        return;
      }
    } catch (error) {
      console.error('Error checking for incomplete issues:', error);
    }
    
    navigate('/inter-facility-issue/add');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Inter Facility Transfer</h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Manage and view facility transfers</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  
                  {/* Year filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fin. Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    >
                      {accYears.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                      ))}
                    </select>
                  </div>

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

                  <button
                    onClick={handleAddIssue}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                    Add Issue
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-[#0f172a] text-gray-100 text-[10px] uppercase font-bold tracking-wider">
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-center w-14">Sl. No.</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-left">To Facility</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-center">Issue No.</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-center">Issue Date</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-left">Facility Req. By</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-center">Status</th>
                        <th className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#1e293b] px-5 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="px-5 py-12 text-center">
                            <svg className="animate-spin w-8 h-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <p className="text-xs font-semibold text-slate-400">Loading records...</p>
                          </td>
                        </tr>
                      ) : (
                        issues.map((issue, idx) => (
                          <tr key={issue.ISSUEID || issue.IssueID || idx} className="hover:bg-slate-50/50 align-middle">
                            <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                              {issue.ToFacility}, {issue.FromFacility}, {issue.DistrictName} (District)
                            </td>
                            <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600 bg-slate-50/50">
                              {issue.ISSUENO || issue.IssueNo || '-'}
                            </td>
                            <td className="px-5 py-4 text-center text-xs text-slate-600">
                              {issue.ISSUEDATE || issue.IssueDate || '-'}
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                              {issue.REMARKS || issue.Remarks || issue.WRequestBy || '-'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {issue.STATUS === 'C' || issue.Status === 'C' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                  Issued
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                  <ClockIcon className="w-3.5 h-3.5" />
                                  Incomplete
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {issue.STATUS === 'C' || issue.Status === 'C' ? (
                                <button
                                  onClick={() => window.open(`/ward-issues/print/${issue.ISSUEID || issue.IssueID || issue.issueId}`, '_blank')}
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm hover:shadow mx-auto"
                                >
                                  <PrinterIcon className="w-4.5 h-4.5 text-slate-500" />
                                  Print VR
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/inter-facility-issue/edit/${issue.ISSUEID || issue.IssueID || issue.issueId}`)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm hover:shadow-md mx-auto"
                                >
                                  <PencilIcon className="w-3.5 h-3.5" />
                                  Edit Sheet
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                      
                      {!loading && issues.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                              <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No issues found</p>
                              <p className="text-xs mt-1">Select alternative filters or click 'Add Issue' to create one.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
