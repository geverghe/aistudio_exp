import React, { useState } from 'react';
import { 
  Compass, 
  Settings, 
  Workflow, 
  BrainCircuit, 
  LayoutTemplate,
  Home,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ViewState } from '../types';

interface SideNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onNavigate }) => {
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(true);

  const navItemClass = (active: boolean) => 
    `flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`;

  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-48px)] overflow-y-auto pb-4 shrink-0">
      <div className="py-2">
        <div 
          onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
          className="px-4 py-3 text-sm text-gray-800 font-semibold uppercase tracking-wider flex items-center justify-between cursor-pointer hover:bg-gray-50"
        >
            Dataplex Universal Catalog
            {isCatalogExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        
        {isCatalogExpanded && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <div 
                onClick={() => onNavigate(ViewState.DASHBOARD)}
                className={navItemClass(currentView === ViewState.DASHBOARD)}
            >
              <Home size={18} />
              <span>Overview</span>
            </div>

            <div className="mt-4 px-4 text-xs font-semibold text-gray-500 mb-1">DISCOVER</div>
            <div className={navItemClass(false)}>
              <Compass size={18} />
              <span>Search</span>
            </div>
            <div 
                onClick={() => onNavigate(ViewState.AGENT_CHAT)}
                className={navItemClass(currentView === ViewState.AGENT_CHAT)}
            >
              <BrainCircuit size={18} />
              <span>Data Products</span>
            </div>

            <div className="mt-4 px-4 text-xs font-semibold text-gray-500 mb-1">MANAGE METADATA</div>
            <div 
                onClick={() => onNavigate(ViewState.SEMANTIC_MODELER)}
                className={navItemClass(currentView === ViewState.SEMANTIC_MODELER)}
            >
              <Workflow size={18} />
              <span>Semantic Model</span>
            </div>
            <div className={navItemClass(false)}>
              <LayoutTemplate size={18} />
              <span>Glossaries</span>
            </div>
          </div>
        )}
        
        <div className="mt-auto pt-8">
            <div className={navItemClass(false)}>
            <Settings size={18} />
            <span>Settings</span>
            </div>
        </div>
      </div>
    </nav>
  );
};