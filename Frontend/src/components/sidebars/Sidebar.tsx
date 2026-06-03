import { useState, useEffect } from 'react';
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
    headerBgUrl?: string;
}

const Sidebar = ({ children, isVisible, onClose, title, subtitle, year, rating, status, statusColor, headerBgUrl }: SidebarProps) => {
  const sidebarRef = useClickOutside(() => {
    if (isVisible) onClose();
  });
  const [headerSrc, setHeaderSrc] = useState(headerBgUrl);
  const [headerImgLoaded, setHeaderImgLoaded] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);
  const showBg = !!headerSrc && headerImgLoaded && !headerImgError;

  useEffect(() => {
    setHeaderSrc(headerBgUrl);
    setHeaderImgLoaded(false);
    setHeaderImgError(false);
  }, [headerBgUrl]);

  const handleHeaderImgError = () => {
    if (headerSrc?.endsWith('.jpg')) {
      setHeaderSrc(headerSrc.replace('.jpg', '.png'));
    } else {
      setHeaderImgError(true);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div
        className="border-b px-2 py-4 relative overflow-visible"
        style={{
          backgroundColor: showBg ? undefined : 'white',
          backgroundImage: showBg ? `url(${headerSrc})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Hidden img used only for load error detection */}
        {headerBgUrl && (
          <img key={headerSrc} src={headerSrc} alt="" className="hidden" onLoad={() => setHeaderImgLoaded(true)} onError={handleHeaderImgError} />
        )}
        {showBg && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
        )}

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
        <div className="pr-16 relative z-10">
          <h2
            className={`text-xl font-bold leading-tight ${showBg ? 'text-white' : 'text-gray-900'}`}
            style={showBg ? { textShadow: '0 1px 4px rgba(0,0,0,0.9)' } : undefined}
          >{title}</h2>
          {subtitle && (
            <p
              className={`text-sm mt-1 ${showBg ? 'text-white/90' : 'text-gray-600'}`}
              style={showBg ? { textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : undefined}
            >{subtitle}</p>
          )}
          {/* Minimal Status + Year */}
          <div className="flex items-center gap-2 mt-1">
              {status && (
                <span className={`px-2 py-1 rounded font-medium ${statusColor}`} style={{ fontSize: '10px' }}>
                  {status}
                </span>
              )}
              {year && (
                <span className={`${showBg ? 'text-white/70' : 'text-gray-400'}`} style={{ fontSize: '10px' }}>
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