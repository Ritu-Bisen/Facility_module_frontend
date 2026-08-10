import Dashboard from '../features/dashboard/Dashboard'; 
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

export default function DashboardPage() { 
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-5">
            <div className="max-w-7xl mx-auto">
              <Dashboard />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  ) 
}