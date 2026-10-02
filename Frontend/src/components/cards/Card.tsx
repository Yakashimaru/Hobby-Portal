import React from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Card = ({ 
  children, 
  onClick, 
  className = "",
  title,
  onMouseEnter,
  onMouseLeave 
}: CardProps) => {
  return (
    <div 
        data-game-card
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer ${className}`}
        title={title}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

export default Card;