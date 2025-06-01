import React from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Card = ({ 
  children, 
  onClick, 
  className = "",
  onMouseEnter,
  onMouseLeave 
}: CardProps) => {
  return (
    <div 
        data-game-card
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer ${className}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

export default Card;