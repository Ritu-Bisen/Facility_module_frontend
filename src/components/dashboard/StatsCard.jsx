export default function StatsCard({ title, stat }) { 
  return <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"><div className="text-gray-500 text-sm">{title}</div><div className="text-3xl font-bold text-gray-800 mt-2">{stat}</div></div> 
}