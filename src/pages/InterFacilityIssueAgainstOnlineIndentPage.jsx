import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getIndentsForIssue, getIssuesForIndent } from '../api/interFacilityIssueOnlineApi';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const IssueDetailsCell = ({ indent }) => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await getIssuesForIndent(indent.NOCID);
                if (res.success) {
                    setIssues(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch issues", err);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, [indent.NOCID]);

    if (loading) {
        return <div className="text-xs text-slate-400 p-2 text-center">Loading...</div>;
    }

    if (issues.length === 0) {
        return (
            <div className="flex justify-center p-2">
                {indent.issueid === 0 || indent.issueid === '0' ? (
                    <button
                        onClick={() => navigate(`/inter-facility-issue-online/items/add/${indent.NOCID}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                    >
                        <PlusIcon className="w-3.5 h-3.5" /> Add Issue
                    </button>
                ) : (
                    <span className="text-xs text-slate-500">No issue found</span>
                )}
            </div>
        );
    }

    return (
        <div className="p-1">
            <table className="w-full text-left text-xs bg-white border border-slate-200 shadow-sm rounded">
                <thead>
                    <tr className="bg-[#0f172a] text-white">
                        <th className="px-2 py-1.5 border-b border-slate-300 text-center font-semibold">Issue No</th>
                        <th className="px-2 py-1.5 border-b border-slate-300 border-l text-center font-semibold">Issue Date</th>
                        <th className="px-2 py-1.5 border-b border-slate-300 border-l text-center font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {issues.map(issue => (
                        <tr key={issue.IssueID} className="hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-center">{issue.ISSUENO}</td>
                            <td className="px-2 py-1.5 border-l border-slate-200 text-center">{issue.ISSUEDATE}</td>
                            <td className="px-2 py-1.5 border-l border-slate-200 text-center">
                                {issue.Status === 'C' ? (
                                    <span className="text-green-600 font-medium">Issued</span>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/inter-facility-issue-online/items/edit/${issue.IssueID}`)}
                                        className="text-red-600 hover:underline font-medium"
                                    >
                                        Incomplete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default function InterFacilityIssueAgainstOnlineIndentPage() {
    const [accYears, setAccYears] = useState([]);
    const [filters, setFilters] = useState({ yearId: '', status: 'All' });
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const res = await api.get('/shc-inter-facility-transfers/fin-years');
                const mappedYears = (res.data.data || []).map(y => 
                    Array.isArray(y) ? { id: y[0], year: y[1] } : { id: y.id || y.ACCYRSETID || y.accYrSetId, year: y.year || y.AccYear || y.SHACCYEAR || y.shAccYear }
                );
                setAccYears(mappedYears);
                if (mappedYears.length > 0) {
                    setFilters(prev => ({ ...prev, yearId: mappedYears[0].id }));
                }
            } catch (err) {
                console.error("Failed to load financial years", err);
            }
        };
        fetchYears();
    }, []);

    useEffect(() => {
        if (filters.yearId) {
            loadIndents();
        }
    }, [filters]);

    const loadIndents = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getIndentsForIssue(filters.yearId, filters.status);
            if (res.success) {
                setIndents(res.data);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch indents');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
                        <div className="max-w-7xl mx-auto space-y-6">
                            
                            {/* Page Header */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">Inter Facility Transfer Against Online Indent</h1>
                                    <p className="text-xs text-slate-500 mt-1">Manage issues against indents requested by other facilities</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filters:</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-600">Fin. Year:</label>
                                        <select 
                                            value={filters.yearId} 
                                            onChange={(e) => setFilters({ ...filters, yearId: e.target.value })}
                                            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32 cursor-pointer hover:bg-white transition-colors"
                                        >
                                            <option value="">-- Select Year --</option>
                                            {accYears.map(y => (
                                                <option key={y.id} value={y.id}>{y.year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-600">Status:</label>
                                        <select 
                                            value={filters.status} 
                                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-28 cursor-pointer hover:bg-white transition-colors"
                                        >
                                            <option value="All">All</option>
                                            <option value="I">Incomplete</option>
                                            <option value="C">Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Main Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* <div className="bg-[#0f172a] px-4 py-3 border-b border-slate-200">
                                    <h2 className="text-sm font-bold text-white tracking-wide">Facility Transfer</h2>
                                </div> */}
                                
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 text-sm font-semibold border-b border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#0f172a] text-white text-[10px] uppercase tracking-wider font-bold">
                                                <th className="px-4 py-3 border-b border-slate-200 w-16 text-center border-r border-slate-700">Sl No</th>
                                                <th className="px-4 py-3 border-b border-slate-200 border-r border-slate-700">Facility</th>
                                                <th className="px-4 py-3 border-b border-slate-200 text-center border-r border-slate-700">Indent No</th>
                                                <th className="px-4 py-3 border-b border-slate-200 text-center border-r border-slate-700 w-32">Indent Date</th>
                                                <th className="px-4 py-3 border-b border-slate-200 w-28 text-center border-r border-slate-700">Status</th>
                                                <th className="px-4 py-3 border-b border-slate-200 text-center">Issue Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-sm">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                            <span>Loading...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : indents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-medium">
                                                        No data found for selected filter conditions
                                                    </td>
                                                </tr>
                                            ) : (
                                                indents.map((indent, idx) => (
                                                    <tr key={indent.NOCID} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-center font-medium text-slate-500 border-r border-slate-200">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-semibold text-slate-800 border-r border-slate-200">{indent.facilityname}</td>
                                                        <td className="px-4 py-3 text-center font-mono text-xs text-blue-700 border-r border-slate-200">{indent.NOCNumber}</td>
                                                        <td className="px-4 py-3 text-center border-r border-slate-200 text-xs">{indent.NOCDATE}</td>
                                                        <td className="px-4 py-3 text-center border-r border-slate-200">
                                                            {indent.statusR && indent.statusR !== 'Incomplete' ? (
                                                                <span className="text-xs font-medium text-slate-600">
                                                                    {indent.statusR}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400"></span>
                                                            )}
                                                        </td>
                                                        <td className="p-1 align-top bg-slate-50">
                                                            <IssueDetailsCell indent={indent} />
                                                        </td>
                                                    </tr>
                                                ))
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
