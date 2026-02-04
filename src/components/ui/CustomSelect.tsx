import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  disabled = false,
  searchable = true,
  className = '',
  icon
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery(''); 
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`space-y-2 min-w-0 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full p-3 pl-10 pr-10 text-right rounded-lg border bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-white transition-all outline-none relative
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600'}
            ${isOpen ? 'ring-2 ring-primary/20 border-primary' : 'border-gray-200 dark:border-gray-700'}
          `}
        >
          <span className={`block truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          
          {/* Icon Positioned Absolute Left */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          
          {/* Chevron Positioned Absolute Right (for RTL relevance, commonly left if strict RTL but UI usually puts chevron at end) */}
          <ChevronDown 
            className={`
              absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}
            `} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
            
            {searchable && (
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث..."
                    className="w-full p-2 pr-9 pl-3 text-sm rounded-md bg-gray-50 dark:bg-gray-900 border-none focus:ring-1 focus:ring-primary text-right"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            
            <div 
              className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      w-full text-right p-3 text-sm flex items-center justify-between group transition-colors
                      ${value === option.id 
                        ? 'bg-primary/5 text-primary' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <span>{option.name}</span>
                    {value === option.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
