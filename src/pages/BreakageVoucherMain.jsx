import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../api/axios';
import { getBreakageVoucherList } from '../api/breakageVoucherApi';
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderOpenIcon,
  PencilIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

export default function BreakageVoucherMain() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const facilityId = user?.facilityId;

  // Filters
  const [statusFilter, setStatusFilter] = useState('AI'); // 'AI' = All
  const [selectedYear, setSelectedYear] = useState('');
  
  // Data
  const [accYears, setAccYears] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (facilityId && selectedYear) {
      loadVouchers();
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

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await getBreakageVoucherList(facilityId, selectedYear, statusFilter);
      if (res.success) {
        const mappedVouchers = (res.data || []).map(item => {
          if (Array.isArray(item)) {
            return {
              SlNo: item[0],
              WardID: item[1],
              WardName: item[2],
              StateName: item[3],
              FacilityName: item[4],
              DistrictName: item[5],
              IssueNo: item[6],
              IssueDate: item[7],
              WRequestBy: item[8],
              Status: item[9],
              IssueID: item[10]
            };
          }
          return item; // It's already an object from our controller
        });
        setVouchers(mappedVouchers);
      }
    } catch (error) {
      console.error('Error loading breakage voucher list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoucher = () => {
    navigate('/breakage-voucher/create');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ClockIcon className="w-4 h-4" />
            Incomplete
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircleIcon className="w-4 h-4" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FolderOpenIcon className="w-4 h-4" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div>
                <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Breakage Voucher</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">Manage and view breakage vouchers</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                
                {/* Year filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fin. Year:</span>
                  <select 
                    className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
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
                    className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-32"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="AI">All Records</option>
                    <option value="IR">Incomplete</option>
                    <option value="CR">Completed</option>
                  </select>
                </div>

                <button
                  onClick={handleAddVoucher}
                  className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                  New Voucher
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Sl. No.</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Voucher No.</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm font-medium text-slate-500">Loading vouchers...</p>
                          </div>
                        </td>
                      </tr>
                    ) : vouchers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                              <FolderOpenIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-base font-medium text-slate-900">No vouchers found</p>
                            <p className="text-sm text-slate-500">Try adjusting your filters or create a new one.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      vouchers.map((item, index) => (
                        <tr key={item.IssueID || index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {item.FacilityName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{item.IssueNo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {item.IssueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(item.Status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {item.Status === 'IN' ? (
                              <button 
                                onClick={() => navigate(`/breakage-voucher/edit/${item.IssueID}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-semibold"
                              >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                              </button>
                            ) : (
                              <button 
                                onClick={() => window.open(`/breakage-voucher/print/${item.IssueID}`, '_blank')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-semibold"
                              >
                                <PrinterIcon className="w-4 h-4" />
                                Report
                              </button>
                            )}
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
  );
}
