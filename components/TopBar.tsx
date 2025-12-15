import React from 'react';
import { Menu, Search, Bell, HelpCircle, Grid } from 'lucide-react';
import { EntityUpdateSuggestion, SuggestionStatus } from '../types';

interface TopBarProps {
  suggestions?: EntityUpdateSuggestion[];
  onSuggestionClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ suggestions = [], onSuggestionClick }) => {
  const pendingCount = suggestions.filter(s => s.status === SuggestionStatus.PENDING).length;
  const hasPending = pendingCount > 0;

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button className="text-gray-600 hover:bg-gray-100 p-1 rounded-full">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
           <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4V12H20C19.99 7.59 16.41 4.01 12 4Z" fill="#4285F4"/>
             <path d="M4 12C4 16.41 7.59 20 12 20V12H4Z" fill="#34A853"/>
           </svg>
           <span className="text-lg font-normal text-gray-700 hidden sm:block">Google Cloud</span>
           <span className="text-lg text-gray-400 hidden sm:block">Dataplex</span>
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
