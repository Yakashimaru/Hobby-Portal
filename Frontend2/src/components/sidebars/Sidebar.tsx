import { useClickOutside } from "../../hooks/useClickOutside";
import { Star } from "lucide-react";

interface SidebarProps {
    children: React.ReactNode;
    isVisible: boolean;
    onClose: () => void;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    year?: React.ReactNode;
    rating?: React.ReactNode;
    status?: React.ReactNode;
    statusColor?: React.ReactNode;
}

const Sidebar = ({ children, isVisible, onClose, title, subtitle, year , rating, status, statusColor}: SidebarProps) => {
  const sidebarRef = useClickOutside(() => {
    if (isVisible) onClose();
  });
  
  return (
    <div 
      ref={sidebarRef}
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="bg-white border-b p-4 relative">    
        {/* Hexagon Rating Badge */}
        {rating && (
          <div className="absolute top-1/2 right-0 z-10 transform -translate-y-1/2">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                 style={{clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'}}>
              <div className="text-white font-bold text-sm flex items-center">
                <Star className="w-4 h-4 mr-1 fill-white" />
                  <span className="font-bold text-sm">{rating}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Title and Subtitle */}
        <div className="pr-16">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
          {/* Minimal Status + Year */}
          <div className="flex items-center gap-2 mt-1">
              {status && (
                <span className={`px-2 py-1 rounded font-medium ${statusColor}`} style={{ fontSize: '10px' }}>
                  {status}
                </span>
              )}
              {year && (
                <span className="text-gray-400" style={{ fontSize: '10px' }}>
                  {year}
                </span>
              )}
            </div>
          </div>
        </div>
    
      
      <div className="transition-opacity duration-200">
        {children}
      </div>
    </div>
  );
};


export default Sidebar;