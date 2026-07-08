export default function Button({ children, onClick, className="" }) { 
  return <button className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors ${className}`} onClick={onClick}>{children}</button> 
}