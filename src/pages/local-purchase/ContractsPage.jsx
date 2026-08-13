import React, { useState, useEffect } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { getContracts, getWardIssueAccYears } from '../../api/contractApi';

export default function ContractsPage() {
  const [finYear, setFinYear] = useState('542'); // ID for 2026-2027
  const [finYearsList, setFinYearsList] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Mock data for initial render
  const mockData = [
    { id: 1, supplier: 'RIGHT MED', contractNo: '60', contractDate: '16-02-2023', tenderDate: '16-02-2023', tenderNo: '24', tenderDetails: 'M/S RIGHT MED', status: 'Awarded' },
    { id: 2, supplier: 'PMB JAN AUSHADHI KENDRA', contractNo: '2', contractDate: '01-04-2023', tenderDate: '01-04-2026', tenderNo: '7', tenderDetails: 'M/S PMB JAN AUSHADHI KENDRA,KASARIDIH DURG', status: 'Awarded' },
    { id: 3, supplier: 'PHARMADEAL', contractNo: '32', contractDate: '01-04-2023', tenderDate: '01-04-2023', tenderNo: '32', tenderDetails: 'PHARMA DEAL', status: 'Awarded' },
    { id: 4, supplier: 'Pradhanmantri Bhartiya Jan Aushadhi Kendra', contractNo: '4', contractDate: '27-09-2025', tenderDate: '27-09-2025', tenderNo: '4', tenderDetails: 'Pradhanmantri Bhartiya Jan Aushadhi Kendra', status: 'Awarded' },
    { id: 5, supplier: 'GeM/ M/S TIRUPATI SALES AGENCIES', contractNo: '4', contractDate: '01-03-2026', tenderDate: '01-04-2026', tenderNo: '4', tenderDetails: 'GeM/ M/S TIRUPATI SALES AGENCIES', status: 'Awarded' },
    { id: 6, supplier: 'M/S A G Pharma', contractNo: '1', contractDate: '01-04-2026', tenderDate: '01-04-2026', tenderNo: '1', tenderDetails: 'M/S A G PHARMA', status: 'Awarded' },
    { id: 7, supplier: 'GeM/ R.K. INDUSTRIES', contractNo: '10', contractDate: '01-04-2026', tenderDate: '01-04-2026', tenderNo: '10', tenderDetails: 'GeM/ R.K. INDUSTRIES', status: 'Awarded' },
    { id: 13, supplier: 'GeM/M/S RELIANCE PHARMACEUTICALS', contractNo: '26', contractDate: '01-04-2026', tenderDate: '01-04-2026', tenderNo: '23', tenderDetails: 'GeM/M/S RELIANCE PHARMACEUTICALS,BHOPAL', status: 'Incomplete' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (finYear && finYearsList.length > 0) {
      fetchContracts();
    }
  }, [finYear]);

  const fetchInitialData = async () => {
    try {
      const res = await getWardIssueAccYears();
      const years = res || [];
      setFinYearsList(years);
      if (years.length > 0) {
        const isArr = Array.isArray(years[0]);
        const currentStr = '2026-2027'; // default
        const exists = years.find(y => (isArr ? y[1] : (y.SHACCYEAR || y.ACCYEAR)) === currentStr);
        if (exists) {
          setFinYear(isArr ? exists[0].toString() : (exists.ACCYRSETID || exists.accyrsetid).toString());
        } else {
          setFinYear(isArr ? years[0][0].toString() : (years[0].ACCYRSETID || years[0].accyrsetid).toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch fin years', error);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await getContracts(finYear);
      setContracts(res.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch contracts');
      setLoading(false);
    }
  };

  const handleAddContract = () => {
    navigate('/local-purchase/contracts/add');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-[95%] mx-auto">
              
              <div className="bg-[#e5f5e5] border-b-2 border-green-800 p-3 mb-4 rounded-t shadow-sm">
                <h2 className="text-xl font-bold text-center text-gray-900">
                  Award of Contracts to Local Suppliers
                </h2>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded shadow-sm mb-6 p-4">
                <div className="flex items-center justify-center gap-6">
                  <span className="font-semibold text-gray-700">Filters:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Fin. Year</label>
                    <select
                      className="border border-gray-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-600 bg-white"
                      value={finYear}
                      onChange={(e) => setFinYear(e.target.value)}
                    >
                      {finYearsList.length > 0 ? (
                        finYearsList.map((y, idx) => {
                          const isArr = Array.isArray(y);
                          const id = isArr ? y[0] : (y.ACCYRSETID || y.accyrsetid);
                          const name = isArr ? y[1] : (y.SHACCYEAR || y.ACCYEAR || y.shaccyear || y.accyear);
                          return (
                            <option key={id || idx} value={id}>
                              {name}
                            </option>
                          );
                        })
                      ) : (
                        <option value="2026-2027">2026-2027</option>
                      )}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm font-medium text-gray-700">Actions</span>
                    <button
                      onClick={handleAddContract}
                      className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                      title="Add new Direct Contract"
                    >
                      <PlusCircleIcon className="w-7 h-7 text-[#7cb342]" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded border border-gray-300 overflow-hidden">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#003311] text-white">
                        <tr>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-green-900">Sl. No.</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-left border-r border-green-900">Local Supplier</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-left border-r border-green-900">Contract No.</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-green-900">Contract Date</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center border-r border-green-900">Tender/Quot. Date</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-left border-r border-green-900">Tender/Quot. No</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-left border-r border-green-900">Tender/Quot. Details</th>
                          <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              No Contracts available for the selected Source and Scheme.
                            </td>
                          </tr>
                        ) : (
                          contracts.map((item, index) => (
                            <tr key={item.id} className="hover:bg-blue-50 transition-colors even:bg-[#f4f4fa]">
                              <td className="px-4 py-1 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
                                {index + 1}
                              </td>
                              <td className="px-4 py-1 text-sm text-gray-900 border-r border-gray-200">
                                {item.supplier}
                              </td>
                              <td className="px-4 py-1 text-sm text-gray-900 border-r border-gray-200">
                                {item.contractNo}
                              </td>
                              <td className="px-4 py-1 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
                                {item.contractDate}
                              </td>
                              <td className="px-4 py-1 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200">
                                {item.tenderDate}
                              </td>
                              <td className="px-4 py-1 text-sm text-gray-900 border-r border-gray-200">
                                {item.tenderNo}
                              </td>
                              <td className="px-4 py-1 text-sm text-gray-900 border-r border-gray-200">
                                {item.tenderDetails}
                              </td>
                              <td className="px-4 py-1 whitespace-nowrap text-center text-sm font-medium">
                                <button
                                  className={`hover:underline focus:outline-none ${
                                    item.status === 'Incomplete' || item.status === 'Amend Incomplete' ? 'text-red-600' : 'text-green-600'
                                  }`}
                                  onClick={() => navigate(`/local-purchase/contracts/edit/${item.id}`)}
                                >
                                  {item.status}
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
}
