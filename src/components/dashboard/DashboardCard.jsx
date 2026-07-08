export default function DashboardCard({ title, children }) { 
  return <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"><h3 className="text-lg font-semibold mb-4">{title}</h3>{children}</div> 
}