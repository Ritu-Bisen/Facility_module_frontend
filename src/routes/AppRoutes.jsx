import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import NotFound from '../pages/NotFound';
import UnauthorizedPage from '../pages/UnauthorizedPage';
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
import NocApprovalPage from '../pages/NocApprovalPage';
import ShcIndentApprovalFAC from '../pages/ShcIndentApprovalFAC';
import ShcIndentItemsFAC from '../pages/ShcIndentItemsFAC';
import InterFacilityIssueFAC from '../pages/InterFacilityIssueFAC';
import AddInterFacilityIssueFAC from '../pages/AddInterFacilityIssueFAC';
import InterFacilityReceiptsFAC from '../pages/InterFacilityReceiptsFAC';
import AddInterFacilityReceiptFAC from '../pages/AddInterFacilityReceiptFAC';
import BreakageVoucherMain from '../pages/BreakageVoucherMain';
import BreakageVoucherItems from '../pages/BreakageVoucherItems';
import PrintBreakageVoucherPage from '../pages/PrintBreakageVoucherPage';
import StockDashboard from '../pages/StockDashboard';
import FacilityWardsPage from '../pages/FacilityWardsPage';
import FacilityInformationPage from '../pages/FacilityInformationPage';
import StorageLocationPage from '../pages/StorageLocationPage';
import SpLocationPage from '../pages/SpLocationPage';
import DoctorInformationPage from '../pages/DoctorInformationPage';
import ShcInterFacilityTransferPage from '../pages/ShcInterFacilityTransferPage';
import AddShcInterFacilityTransferPage from '../pages/AddShcInterFacilityTransferPage';
import AddShcIssueDirectPage from '../pages/AddShcIssueDirectPage';
import IndentToOtherFacilityPage from '../pages/IndentToOtherFacilityPage';
import AddIndentToOtherFacilityPage from '../pages/AddIndentToOtherFacilityPage';
import PrintIndentToOtherFacilityPage from '../pages/PrintIndentToOtherFacilityPage';
import InterFacilityIssueAgainstOnlineIndentPage from '../pages/InterFacilityIssueAgainstOnlineIndentPage';
import OnlineTransferItemsPage from '../pages/OnlineTransferItemsPage';
import StockRegisterPage from '../pages/StockRegisterPage';
import AnnualIndentDistributionPage from '../pages/AnnualIndentDistributionPage';
import RoleAccessManagementPage from '../pages/RoleAccessManagementPage';

function PlaceholderPage({ title, description, children }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600">{description}</p>
              {children}
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
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/masters/facility-wards" element={
        <ProtectedRoute>
          <FacilityWardsPage />
        </ProtectedRoute>
      } />
      <Route path="/masters/facility-information" element={
        <ProtectedRoute>
          <FacilityInformationPage />
        </ProtectedRoute>
      } />
      <Route path="/masters/storage-location" element={
        <ProtectedRoute>
          <StorageLocationPage />
        </ProtectedRoute>
      } />
      <Route path="/masters/special-receipt-location" element={
        <ProtectedRoute>
          <SpLocationPage />
        </ProtectedRoute>
      } />
      <Route path="/masters/doctor-information" element={
        <ProtectedRoute>
          <DoctorInformationPage />
        </ProtectedRoute>
      } />
      <Route path="/masters/role-access-management" element={
        <ProtectedRoute>
          <RoleAccessManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/stock-dashboard" element={
        <ProtectedRoute>
          <StockDashboard />
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

      <Route path="/stock-register" element={
        <ProtectedRoute>
          <StockRegisterPage />
        </ProtectedRoute>
      } />

      <Route path="/annual-indent-distribution" element={
        <ProtectedRoute>
          <AnnualIndentDistributionPage />
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
      <Route path="/indent/cmho-approval" element={
        <ProtectedRoute>
          <NocApprovalPage />
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
      <Route path="/indent-to-other-facility" element={
        <ProtectedRoute>
          <IndentToOtherFacilityPage />
        </ProtectedRoute>
      } />
      <Route path="/indent-to-other-facility/add" element={
        <ProtectedRoute>
          <AddIndentToOtherFacilityPage />
        </ProtectedRoute>
      } />
      <Route path="/indent-to-other-facility/print/:id" element={
        <ProtectedRoute>
          <PrintIndentToOtherFacilityPage />
        </ProtectedRoute>
      } />
      <Route path="/indent-to-other-facility/edit/:indentId" element={
        <ProtectedRoute>
          <AddIndentToOtherFacilityPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-issue-against-online-indent" element={
        <ProtectedRoute>
          <InterFacilityIssueAgainstOnlineIndentPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-issue-online/items/add/:nocId" element={
        <ProtectedRoute>
          <OnlineTransferItemsPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-issue-online/items/edit/:issueId" element={
        <ProtectedRoute>
          <OnlineTransferItemsPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-shc-transfer" element={
        <ProtectedRoute>
          <ShcInterFacilityTransferPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-shc-transfer/direct-add" element={
        <ProtectedRoute>
          <AddShcIssueDirectPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-shc-transfer/add/:nocId" element={
        <ProtectedRoute>
          <AddShcInterFacilityTransferPage />
        </ProtectedRoute>
      } />
      <Route path="/inter-facility-shc-transfer/edit/:issueId" element={
        <ProtectedRoute>
          <AddShcInterFacilityTransferPage />
        </ProtectedRoute>
      } />
      <Route path="/breakage-voucher" element={
        <ProtectedRoute>
          <BreakageVoucherMain />
        </ProtectedRoute>
      } />
      <Route path="/breakage-voucher/create" element={
        <ProtectedRoute>
          <BreakageVoucherItems mode="Create" />
        </ProtectedRoute>
      } />
      <Route path="/breakage-voucher/edit/:id" element={
        <ProtectedRoute>
          <BreakageVoucherItems mode="Edit" />
        </ProtectedRoute>
      } />
      <Route path="/breakage-voucher/view/:id" element={
        <ProtectedRoute>
          <BreakageVoucherItems mode="View" />
        </ProtectedRoute>
      } />
      <Route path="/breakage-voucher/print/:id" element={
        <ProtectedRoute>
          <PrintBreakageVoucherPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}