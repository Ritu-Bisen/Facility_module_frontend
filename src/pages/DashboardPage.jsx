import Dashboard from '../features/dashboard/Dashboard'; 
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

export default function DashboardPage() { 
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121418] transition-colors duration-500">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-[#121418] p-6 transition-colors duration-500">
            <Dashboard />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  ) 
}