import React, { useState, useEffect } from 'react';
import { getBudgets, getBudgetDetails, addBudgetDetail } from '../../api/localPurchaseApi';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';

export default function MasBudget() {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState('0');
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    lpBudgetId: '0',
    headCode: '',
    headDetails: '',
    recvFund: '',
    recvDate: '',
    remarks: ''
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    fetchDetails(selectedBudget);
  }, [selectedBudget]);

  const fetchBudgets = async () => {
    try {
      const res = await getBudgets();
      if (res.success) {
        setBudgets(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch budgets');
    }
  };

  const fetchDetails = async (budgetId) => {
    setLoading(true);
    try {
      const res = await getBudgetDetails(budgetId);
      if (res.success) {
        setDetails(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch budget details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFund = () => {
    setShowAddForm(true);
    setFormData({
      lpBudgetId: selectedBudget !== '0' ? selectedBudget : '0',
      headCode: '',
      headDetails: '',
      recvFund: '',
      recvDate: '',
      remarks: ''
    });
  };

  const handleSaveFund = async () => {
    if (formData.lpBudgetId === '0') return toast.error('Please Select Fund Head');
    if (!formData.recvDate) return toast.error('Fund Received Date is required');
    if (formData.recvFund && isNaN(formData.recvFund)) return toast.error('Received Fund must be a number');

    setFormLoading(true);
    try {
      const res = await addBudgetDetail(formData);
      if (res.success) {
        toast.success(res.message);
        setShowAddForm(false);
        // If the selected budget in the list view is the one we just added to, refresh it
        if (selectedBudget === formData.lpBudgetId || selectedBudget === '0') {
          fetchDetails(selectedBudget);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add fund detail');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="p-6 max-w-7xl mx-auto">
              <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
          Fund Details
        </h2>

        {/* Filter Section */}
        <div className="flex justify-center mb-8">
          <table className="w-full max-w-3xl border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left"></th>
                <th className="border border-gray-200 px-4 py-2 text-left"></th>
                <th className="border border-gray-200 px-4 py-2 text-center text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-4 py-3 bg-gray-100 font-semibold text-gray-700 w-1/3">
                  Select Fund Head
                </td>
                <td className="border border-gray-200 px-4 py-3 bg-white w-1/3">
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                  >
                    <option value="0">Select Budget</option>
                    {budgets.map((b) => (
                      <option key={b.budgetId} value={b.budgetId}>
                        {b.budgetName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-200 px-4 py-3 bg-gray-100 text-center w-1/3">
                  <button
                    onClick={handleAddFund}
                    className="inline-flex items-center justify-center gap-2 text-green-700 hover:text-green-800 font-semibold focus:outline-none"
                  >
                    Add Receipt Fund
                    <PlusCircleIcon className="w-6 h-6 text-green-600" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Grid Section or Add Form */}
        {!showAddForm ? (
          <div className="overflow-x-auto mt-8">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Sl No</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Fund Head</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Fund Details</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Received Amount(in Rs)</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Fund Receive Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Remark</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    details.map((item, index) => (
                      <tr key={item.detailId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {item.budgetName}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {item.headDetails}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          ₹{item.recvFund}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {item.recvDate}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {item.remarks}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="mt-8 max-w-4xl mx-auto border border-gray-200 shadow-sm rounded-lg overflow-hidden bg-white">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-800 text-center text-lg">
              Received Fund Entry
            </div>
            <div className="p-6 relative">
              {formLoading && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}

              <table className="w-full border-collapse border border-gray-200 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3 text-right">
                      Select Fund Head <span className="text-red-500">*</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 bg-white w-2/3">
                      <select
                        className="w-full max-w-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.lpBudgetId}
                        onChange={e => setFormData({ ...formData, lpBudgetId: e.target.value })}
                      >
                        <option value="0">Select Budget</option>
                        {budgets.map((b) => (
                          <option key={b.budgetId} value={b.budgetId}>
                            {b.budgetName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3 text-right">
                      Head CODE
                    </td>
                    <td className="border border-gray-200 px-4 py-3 bg-white w-2/3">
                      <input
                        type="text"
                        className="w-full max-w-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.headCode}
                        onChange={e => setFormData({ ...formData, headCode: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3 text-right">
                      Head Details
                    </td>
                    <td className="border border-gray-200 px-4 py-3 bg-white w-2/3">
                      <input
                        type="text"
                        className="w-full max-w-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.headDetails}
                        onChange={e => setFormData({ ...formData, headDetails: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3 text-right">
                      Received Fund (Rs)
                    </td>
                    <td className="border border-gray-200 px-4 py-3 bg-white w-2/3">
                      <input
                        type="number"
                        className="w-full max-w-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.recvFund}
                        onChange={e => setFormData({ ...formData, recvFund: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3 text-right">
                      Fund Received Date <span className="text-red-500">*</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 bg-white w-2/3">
                      <input
                        type="date"
                        className="w-full max-w-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.recvDate}
                        onChange={e => setFormData({ ...formData, recvDate: e.target.value })}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-gray-700 w-1/3 text-right align-top">
                      Remark(if Any)
                    </td>
                    <td className="border border-gray-200 px-4 py-3 bg-white w-2/3">
                      <textarea
                        rows={3}
                        className="w-full max-w-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formData.remarks}
                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleSaveFund}
                  disabled={formLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={formLoading}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-md shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
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
