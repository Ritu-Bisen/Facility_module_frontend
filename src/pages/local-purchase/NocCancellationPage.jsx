import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/layout/Footer";
import { getNocsForCancellation } from '../../api/nocCancellationApi';
import { toast } from 'react-hot-toast';
import { EyeIcon } from '@heroicons/react/24/outline';

const NocCancellationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNocs();
  }, []);

  const fetchNocs = async () => {
    try {
      setLoading(true);
      const response = await getNocsForCancellation();
      if (response.success) {
        setData(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch NOCs for cancellation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      name: 'Sl. No.',
      selector: (row, index) => index + 1,
      width: '80px',
      center: true,
    },
    {
      name: 'Facility Name',
      selector: row => row.facilityName,
      sortable: true,
      wrap: true,
    },
    {
      name: 'NOC Number',
      selector: row => row.nocNumber,
      sortable: true,
    },
    {
      name: 'NOC Date',
      selector: row => row.nocDate,
      sortable: true,
    },
    {
      name: 'No Of NOC Items',
      selector: row => row.cntNoItems,
      sortable: true,
      right: true,
    },
    {
      name: 'PO Generated Items',
      selector: row => row.cntLpItems,
      sortable: true,
      right: true,
    },
    {
      name: 'Canceled Items',
      selector: row => row.cntCancelItems,
      sortable: true,
      right: true,
    },
    {
      name: 'Action',
      cell: (row) => (
        <button
          onClick={() => navigate(`/local-purchase/noc-cancellation/${row.nocId}`)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors bg-blue-50 hover:bg-blue-100"
          title="View Details"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      ),
      center: true,
      width: '100px',
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
            
            <div className="max-w-[95%] mx-auto mt-6">
              <div className="bg-[#0f172a] border-b-2 border-[#0f172a] p-3 mb-4 rounded-t shadow-sm">
                <h2 className="text-xl font-bold text-center text-white">NOC Details For Cancellation</h2>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#1e293b] text-white">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-600">Sl. No.</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-600">Facility Name</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-600">NOC Number</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-slate-600">NOC Date</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right border-r border-slate-600">No Of NOC Items</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right border-r border-slate-600">PO Generated Items</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right border-r border-slate-600">Canceled Items</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">Action</th>
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              No NOCs found for cancellation.
                            </td>
                          </tr>
                        ) : (
                          data.map((item, index) => (
                            <tr key={item.nocId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-900">{index + 1}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.facilityName}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.nocNumber}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.nocDate}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.cntNoItems}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.cntLpItems}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.cntCancelItems}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                                <button
                                  onClick={() => navigate(`/local-purchase/noc-cancellation/${item.nocId}`)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors bg-blue-50 hover:bg-blue-100"
                                  title="View Details"
                                >
                                  <EyeIcon className="w-5 h-5 inline-block" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
            
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default NocCancellationPage;
