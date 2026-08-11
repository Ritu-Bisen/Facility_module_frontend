import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function StorageLocationPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLocationNo, setEditLocationNo] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLocationNo, setNewLocationNo] = useState('');

  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [debouncedSearchId, setDebouncedSearchId] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchId(searchId);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchId]);

  // Fetch when page or debounced search changes
  useEffect(() => {
    fetchLocations(page, debouncedSearchId, page > 1);
  }, [page, debouncedSearchId]);

  // Reset page when search changes
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [debouncedSearchId]);

  const fetchLocations = async (currentPage, currentSearch, isAppend) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/storage-locations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 20, searchId: currentSearch || '' }
      });
      
      const newData = response.data;
      if (newData.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isAppend) {
        setLocations(prev => [...prev, ...newData]);
      } else {
        setLocations(newData);
      }
    } catch (error) {
      console.error('Error fetching storage locations:', error);
      toast.error('Failed to load storage locations');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 10;
    if (bottom && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleAddSubmit = async () => {
    if (!newLocationNo.trim()) {
      toast.error('Storage Location is required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${import.meta.env.VITE_API_URL}/storage-locations`, 
        { locationno: newLocationNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Added Successfully');
      setIsAdding(false);
      setNewLocationNo('');
      setPage(1);
      fetchLocations(1, debouncedSearchId, false);
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error(error.response?.data?.message || 'Failed to add location');
    }
  };

  const handleUpdateSubmit = async (rackId) => {
    if (!editLocationNo.trim()) {
      toast.error('Storage Location is required');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${import.meta.env.VITE_API_URL}/storage-locations/${rackId}`, 
        { locationno: editLocationNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Updated Successfully');
      setEditingId(null);
      setEditLocationNo('');
      setPage(1);
      fetchLocations(1, debouncedSearchId, false);
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error(error.response?.data?.message || 'Failed to update location');
    }
  };

  const handleDelete = async (rackId) => {
    if (!window.confirm('Are you sure, you want to delete?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/storage-locations/${rackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted Successfully');
      setPage(1);
      fetchLocations(1, debouncedSearchId, false);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(error.response?.data?.message || 'Delete not allowed. References found.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <>
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Header section with title and search */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Storage Location Information</h1>
                
                <div className="relative w-full sm:w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Rack ID..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Notice text */}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
                <p className="text-orange-800 font-semibold text-sm">
                  कृपया Header Footer English में बनाये !
                </p>
              </div>

              {/* Table section with infinite scroll container */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <div className="overflow-x-auto overflow-y-auto flex-1" onScroll={handleScroll} style={{ overflowAnchor: 'none' }}>
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                      <tr className="border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold w-24 text-center">Rack ID</th>
                        <th className="p-4 font-semibold">Storage Location</th>
                        <th className="p-4 font-semibold w-32 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      
                      {/* Add New Row */}
                      {isAdding && (
                        <tr className="bg-blue-50/50">
                          <td className="p-4 text-center text-slate-400 text-sm italic">Auto</td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={newLocationNo}
                              onChange={(e) => setNewLocationNo(e.target.value)}
                              className="w-full p-2 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Enter location name"
                              autoFocus
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={handleAddSubmit} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Save">
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => setIsAdding(false)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Cancel">
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Existing Locations */}
                      {locations.map((loc) => (
                        <tr key={loc.RackID} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center text-slate-600 font-medium">
                            {loc.RackID}
                          </td>
                          <td className="p-4">
                            {editingId === loc.RackID ? (
                              <input
                                type="text"
                                value={editLocationNo}
                                onChange={(e) => setEditLocationNo(e.target.value)}
                                className="w-full p-2 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            ) : (
                              <span className="text-slate-800 font-medium">{loc.locationno}</span>
                            )}
                          </td>
                          <td className="p-4">
                            {editingId === loc.RackID ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleUpdateSubmit(loc.RackID)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Save">
                                  <CheckIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Cancel">
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => { setEditingId(loc.RackID); setEditLocationNo(loc.locationno); }}
                                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(loc.RackID)}
                                  className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors underline"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Loading and Empty States */}
                      {loading && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-500">
                            Loading...
                          </td>
                        </tr>
                      )}
                      {!loading && locations.length === 0 && !isAdding && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-500">
                            No locations found.
                          </td>
                        </tr>
                      )}
                      {!loading && locations.length > 0 && !hasMore && (
                        <tr>
                          <td colSpan="3" className="p-4 text-center text-slate-400 text-sm">
                            End of list
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add New Link underneath the table */}
                {!isAdding && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button
                      onClick={() => { setIsAdding(true); setNewLocationNo(''); }}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      Add New Storage Location
                    </button>
                  </div>
                )}
              </div>

            </div>
          </>
  
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
