import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, HelpCircle, Grid, Database, Layers, ChevronRight } from 'lucide-react';
import { EntityUpdateSuggestion, SuggestionStatus } from '../types';

interface TopBarProps {
  suggestions?: EntityUpdateSuggestion[];
  onSuggestionClick?: () => void;
  onNavigateToBigQuery?: () => void;
  isBigQueryView?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ suggestions = [], onSuggestionClick, onNavigateToBigQuery, isBigQueryView = false }) => {
  const pendingCount = suggestions.filter(s => s.status === SuggestionStatus.PENDING).length;
  const hasPending = pendingCount > 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors ${isMenuOpen ? 'bg-gray-100' : ''}`}
          >
            <Menu size={24} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Google Cloud Products
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <Layers size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Dataplex</div>
                  <div className="text-xs text-gray-400 group-hover:text-blue-500">Unified data management</div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateToBigQuery?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <Database size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">BigQuery</div>
                  <div className="text-xs text-gray-400 group-hover:text-blue-500">Data warehouse & analytics</div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
           <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4V12H20C19.99 7.59 16.41 4.01 12 4Z" fill="#4285F4"/>
             <path d="M4 12C4 16.41 7.59 20 12 20V12H4Z" fill="#34A853"/>
           </svg>
           <span className="text-lg font-normal text-gray-700 hidden sm:block">Google Cloud</span>
           <span className="text-lg text-gray-400 hidden sm:block">{isBigQueryView ? 'BigQuery' : 'Dataplex'}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1.5 border border-gray-200 ml-4 cursor-pointer hover:bg-gray-200 transition-colors">
            <span className="text-xs font-medium text-gray-600">vergheseg-sandbox</span>
            <span className="text-gray-400">▼</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl px-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search resources, docs, products, and more" 
            className="w-full bg-gray-100 text-sm border border-transparent focus:bg-white focus:border-blue-500 rounded-sm pl-10 pr-10 py-2 outline-none transition-all"
          />
          <Search className="absolute left-2 top-2 text-gray-500" size={18} />
          <div className="absolute right-2 top-1.5 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded border border-gray-300">/</div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end flex-1">
         <button className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-full"><span className="text-sm font-semibold border border-gray-500 rounded px-1">&gt;_</span></button>
         <button className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-full"><HelpCircle size={20}/></button>
         
         <button 
           onClick={onSuggestionClick}
           className={`relative p-1.5 rounded-full transition-colors ${
             hasPending 
               ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
               : 'text-gray-600 hover:bg-gray-100'
           }`}
           title={hasPending ? `${pendingCount} recommended changes` : 'No pending changes'}
         >
           <Bell size={20} />
           {hasPending && (
             <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
               {pendingCount}
             </span>
           )}
         </button>
         
         <button className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-full"><Grid size={20}/></button>
         <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
            U
         </div>
      </div>
    </header>
  );
};
