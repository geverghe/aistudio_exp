import React from 'react';
import { Search, Info, Star, Clock, MoreVertical, Table, FileText, BarChart2, ListFilter } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const quickFilters = [
    { name: 'Datasets', icon: DatabaseIcon },
    { name: 'Tables', icon: Table },
    { name: 'Data Products', icon: SparkleIcon },
    { name: 'Views', icon: ViewIcon },
    { name: 'Notebooks', icon: FileText },
  ];

  const starredResources = [
    { name: 'gce_esv2_unique_id', type: 'Table', location: 'us: concord-prod', icon: Table },
    { name: 'us_states', type: 'Table', location: 'us: bigquery-public-data', icon: Table },
    { name: 'bb_vergheseg', type: 'Table', location: 'us: vergheseg-sandbox', icon: Table },
    { name: 'bookings_dashboard_looker', type: 'Table', location: 'us: concord-prod', icon: Table },
  ];

  const recentResources = [
    { name: 'curated_customers', type: 'Table', location: 'us: dataplex-pegasus', icon: Table },
    { name: 'bikeshare_stations', type: 'Table', location: 'us: vergheseg-sandbox', icon: Table },
    { name: 'Curated Customer Data', type: 'Dataset', location: 'us: dataplex-pegasus', icon: DatabaseIcon },
    { name: 'customers', type: 'Table', location: 'us: vergheseg-sandbox', icon: Table },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Search Hero */}
      <div className="mb-8">
        <div className="relative max-w-4xl">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <button className="text-blue-600 font-medium text-sm flex items-center gap-1 cursor-pointer hover:bg-blue-50 px-2 py-0.5 rounded transition-colors outline-none focus:ring-2 focus:ring-blue-500/20">
                <ListFilter size={18} /> Filters
            </button>
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
          </div>
          <input 
            type="text" 
            className="block w-full p-3 pl-28 text-sm text-gray-900 border border-blue-500 rounded-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm" 
            placeholder="Find resources across projects with natural language" 
            defaultValue=""
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
             <Search className="text-blue-600" size={20}/>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <Info size={14} className="text-gray-500" />
            <span>You're currently using natural language search. It has some <a href="#" className="text-blue-600 underline">limitations</a>. To return to keyword search, click <a href="#" className="text-blue-600 underline">here</a>.</span>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick filters</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
            {quickFilters.map((filter) => (
                <button key={filter.name} className="flex items-center justify-center gap-2 min-w-[140px] px-4 py-2 border border-blue-200 rounded text-blue-700 text-sm font-medium bg-white hover:bg-blue-50 transition-colors">
                    <filter.icon size={16} />
                    {filter.name}
                </button>
            ))}
        </div>
      </div>

      {/* Starred Resources */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Starred resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {starredResources.map((res, i) => (
                <ResourceCard key={i} resource={res} />
            ))}
        </div>
      </div>

      {/* Recent Resources */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recently opened</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentResources.map((res, i) => (
                <ResourceCard key={i} resource={res} />
            ))}
        </div>
      </div>

    </div>
  );
};

// Sub-components for icons to avoid clutter
const DatabaseIcon = ({size, className}: {size?:number, className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
);
const SparkleIcon = ({size, className}: {size?:number, className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
);
const ViewIcon = ({size, className}: {size?:number, className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>
);

const ResourceCard: React.FC<{ resource: any }> = ({ resource }) => (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-32 relative group">
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
                <resource.icon size={16} className="text-gray-500" />
                <a href="#" className="text-blue-600 text-sm font-medium hover:underline truncate max-w-[150px]" title={resource.name}>{resource.name}</a>
            </div>
            <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={16} />
            </button>
        </div>
        <div className="mt-auto">
             <div className="text-xs text-gray-500 truncate">{resource.location}</div>
        </div>
        <div className="absolute top-4 right-8 text-gray-400">
            <Star size={16} fill="#fab005" stroke="#fab005" />
        </div>
    </div>
);