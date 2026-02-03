import React from 'react';

interface ProductHuntUpvoteProps {
  className?: string;
  showText?: boolean;
}

const ProductHuntUpvote: React.FC<ProductHuntUpvoteProps> = ({ 
  className = "",
  showText = true
}) => {
  const handleUpvoteClick = () => {
    window.open('https://www.producthunt.com/products/skillsurger/launches/skillsurger', '_blank');
  };

  return (
    <div 
      onClick={handleUpvoteClick}
      className={`inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
      title="Upvote us on ProductHunt"
    >
      <svg 
        className="w-5 h-5" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.806-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.996V6h5.608c2.319 0 4.2 1.88 4.2 4.2 0 2.32-1.881 4.2-4.2 4.2z"/>
      </svg>
      {showText && <span className="font-medium">Upvote on ProductHunt</span>}
    </div>
  );
};

export default ProductHuntUpvote;
