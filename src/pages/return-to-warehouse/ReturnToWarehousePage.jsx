import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { getReturnToWarehouseList, getAccYears } from '../../api/returnToWarehouseApi';

export default function ReturnToWarehousePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [finYearsList, setFinYearsList] = useState([]);
  const [finYearId, setFinYearId] = useState('');
  const [statusId, setStatusId] = useState('AI');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const yearsData = await getAccYears();
        const mappedYears = (yearsData || []).map(y => 
          Array.isArray(y) ? { id: y[0], finYear: y[1] } : { id: y.ACCYRSETID || y.accYrSetId, finYear: y.SHACCYEAR || y.shAccYear }
        );
        setFinYearsList(mappedYears);
        if (mappedYears && mappedYears.length > 0) {
          setFinYearId(mappedYears[0].id);
        }
      } catch (err) {
        toast.error('Failed to load financial years');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (finYearId) {
      loadGridData();
    }
  }, [finYearId, statusId]);

  const loadGridData = async () => {
    setIsLoading(true);
    try {
      const data = await getReturnToWarehouseList(finYearId, statusId);
      setItems(data || []);
    } catch (err) {
      toast.error('Failed to load return to warehouse list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/return-to-warehouse/create');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 flex flex-col overflow-y-auto w-full bg-slate-50 relative p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full flex-1">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div>
                  <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Return To Warehouse</h1>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Manage items returned from facility to warehouse</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  {/* Status filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status:</span>
                    <select
                      value={statusId}
                      onChange={(e) => setStatusId(e.target.value)}
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
                      value={finYearId}
                      onChange={(e) => setFinYearId(e.target.value)}
                      disabled={isLoading}
                      className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-semibold text-slate-700 w-36"
                    >
                      {finYearsList.map(y => (
                        <option key={y.id} value={y.id}>{y.finYear}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddNew}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <PlusIcon className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                    Add New
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center">Sl. No.</th>
                      <th className="px-4 py-3">Warehouse/Facility Name</th>
                      <th className="px-4 py-3 text-center">Issue No.</th>
                      <th className="px-4 py-3 text-center">Issue Date</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p>Loading data...</p>
                        </td>
                      </tr>
                    ) : items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={item.issueId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-600 text-center">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">
                              {item.warehouseName}, {item.facilityName}, {item.districtName} (District)
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-slate-700">{item.issueNo}</td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {new Date(item.issueDate).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.status === 'C' ? (
                              <button 
                                className="text-green-600 font-medium hover:underline"
                                onClick={() => navigate(`/return-to-warehouse/view/${item.issueId}`)}
                              >
                                Issued
                              </button>
                            ) : (
                              <button 
                                className="text-red-600 font-medium hover:underline"
                                onClick={() => navigate(`/return-to-warehouse/edit/${item.issueId}`)}
                              >
                                Incomplete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center text-slate-500">
                          <p>No data found for selected filter conditions.</p>
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
