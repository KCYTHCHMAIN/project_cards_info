import React from 'react';

export const ThemeToggle = ({ isDarkMode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        fixed top-6 right-6 z-40 p-4 rounded-full transition-all duration-500
        ${isDarkMode 
          ? 'bg-gradient-to-r from-purple-800 to-pink-800 text-yellow-300 hover:from-purple-700 hover:to-pink-700 shadow-2xl shadow-purple-900/50' 
          : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 hover:from-yellow-200 hover:to-orange-200 shadow-2xl shadow-orange-200/50'
        }
        backdrop-blur-sm border-2 ${isDarkMode ? 'border-purple-600' : 'border-orange-300'}
      `}
      aria-label="Toggle theme"
    >
      {isDarkMode ? <span className="text-2xl">🌞</span> : <span className="text-2xl">🌙</span>}
    </button>
  );
};

export default ThemeToggle;
