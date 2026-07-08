import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import WardIssuesPage from '../pages/WardIssuesPage';
import AddWardIssuePage from '../pages/AddWardIssuePage';
import PrintWardIssuePage from '../pages/PrintWardIssuePage';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import FacilityStockItemWisePage from '../pages/FacilityStockItemWisePage';
import FacilityStockBatchWise from '../pages/FacilityStockBatchWise';
import MonthlyIndentPage from '../pages/MonthlyIndentPage';
import AddMonthlyIndentPage from '../pages/AddMonthlyIndentPage';
import PrintMonthlyIndentPage from '../pages/PrintMonthlyIndentPage';
import WarehouseStockPage from '../pages/WarehouseStockPage';
import WarehouseReceiptFAC from '../pages/WarehouseReceiptFAC';
import FacilityReceiptViewFAC from '../pages/FacilityReceiptViewFAC';
import ShcIndentApprovalFAC from '../pages/ShcIndentApprovalFAC';
import ShcIndentItemsFAC from '../pages/ShcIndentItemsFAC';
import InterFacilityIssueFAC from '../pages/InterFacilityIssueFAC';
import AddInterFacilityIssueFAC from '../pages/AddInterFacilityIssueFAC';
import InterFacilityReceiptsFAC from '../pages/InterFacilityReceiptsFAC';
import AddInterFacilityReceiptFAC from '../pages/AddInterFacilityReceiptFAC';

function PlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-xl shadow-sm">
              <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              <p className="text-slate-500 mt-2 text-sm">{description}</p>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/store/facility-stock-item-wise" element={
        <ProtectedRoute>
          <FacilityStockItemWisePage />
        </ProtectedRoute>
      } />
      <Route path="/store/warehouse-stock" element={
        <ProtectedRoute>
          <WarehouseStockPage />
        </ProtectedRoute>
      } />

      <Route path="/store/facility-stock-batch-wise" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
                  <FacilityStockBatchWise />
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <PlaceholderPage title="Reports & Analytics" description="Generate and view detailed facility inventory consumption, issue summary reports, and stock balances." />
        </ProtectedRoute>
      } />
      <Route path="/ward-issues" element={
        <ProtectedRoute>
          <WardIssuesPage />
        </ProtectedRoute>
      } />
      <Route path="/ward-issues/add" element={
        <ProtectedRoute>
          <AddWardIssuePage />
        </ProtectedRoute>
      } />
      <Route path="/ward-issues/print/:id" element={
        <ProtectedRoute>
          <PrintWardIssuePage />
        </ProtectedRoute>
      } />
      <Route path="/indent/warehouse" element={
        <ProtectedRoute>
          <MonthlyIndentPage />
        </ProtectedRoute>
      } />
      <Route path="/indent/warehouse/add" element={
        <ProtectedRoute>
          <AddMonthlyIndentPage />
        </ProtectedRoute>
      } />
      <Route path="/indent/warehouse/print/:id" element={
        <ProtectedRoute>
          <PrintMonthlyIndentPage />
        </ProtectedRoute>
      } />
      <Route path="/indent/warehouse-receipts" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                  <WarehouseReceiptFAC />
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/indent/warehouse-receipts/view/:receiptId" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                  <FacilityReceiptViewFAC />
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/indent/shc-approval" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                  <ShcIndentApprovalFAC />
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/indent/shc-approval/:nocId" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                  <ShcIndentItemsFAC />
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-issue" element={
        <ProtectedRoute>
          <InterFacilityIssueFAC />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-issue/add" element={
        <ProtectedRoute>
          <AddInterFacilityIssueFAC />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-issue/edit/:id" element={
        <ProtectedRoute>
          <AddInterFacilityIssueFAC />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-receipt" element={
        <ProtectedRoute>
          <InterFacilityReceiptsFAC />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-receipt/add/:issueId" element={
        <ProtectedRoute>
          <AddInterFacilityReceiptFAC />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-receipt/edit/:facReceiptId" element={
        <ProtectedRoute>
          <AddInterFacilityReceiptFAC />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}