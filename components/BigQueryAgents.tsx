import React, { useState } from 'react';
import { Bot, Plus, Database, Home, Star, Users, Clock, Search, ChevronDown, ChevronRight, Sparkles, MessageSquare, FileText, LayoutGrid, GitBranch, FolderOpen, Link2, Settings, Layers } from 'lucide-react';
import { DataAgent } from '../types';

interface BigQueryAgentsProps {
  onBack?: () => void;
}

export const BigQueryAgents: React.FC<BigQueryAgentsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'data_sources'>('data_sources');
  const [dataSourceType, setDataSourceType] = useState<'tables' | 'semantic_graphs'>('semantic_graphs');
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState({ googleMerch: true });

  const semanticGraphs = [
    { id: 'sg_1', name: 'products', dataset: 'dataset_name', description: 'Semantic graph description', project: 'project.name', lastModified: 'May 22, 2020', region: 'US' },
    { id: 'sg_2', name: 'inventory', dataset: 'dataset_name', description: 'Semantic graph description', project: 'project.name', lastModified: 'May 22, 2020', region: 'US' },
    { id: 'sg_3', name: 'customers', dataset: 'dataset_name', description: 'Semantic graph description', project: 'project.name', lastModified: 'May 22, 2020', region: 'US' },
    { id: 'sg_4', name: 'products_02', dataset: 'dataset_name', description: 'Semantic graph description', project: 'project.name', lastModified: 'May 22, 2020', region: 'EU' },
    { id: 'sg_5', name: 'customers_int', dataset: 'dataset_name', description: 'Table description', project: 'project.name', lastModified: 'May 22, 2020', region: 'EU' },
  ];

  const agents = [
    { id: 'agent_1', name: 'Sales Analytics Agent', description: 'Answers questions about sales data' },
    { id: 'agent_2', name: 'Inventory Agent', description: 'Provides inventory insights' },
  ];

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const explorerItems = [
    { icon: Home, label: 'Home', active: false },
    { icon: Star, label: 'Starred', active: false },
    { icon: Users, label: 'Shared with me', active: false },
    { icon: Clock, label: 'Query job history', active: false },
  ];

  const projectItems = [
    { icon: Bot, label: 'Agents', active: true },
    { icon: MessageSquare, label: 'Conversations', active: false },
    { icon: Search, label: 'Queries', active: false },
    { icon: FileText, label: 'Notebooks', active: false },
    { icon: LayoutGrid, label: 'Data canvases', active: false },
    { icon: GitBranch, label: 'Workflows', active: false },
    { icon: FolderOpen, label: 'Repositories', active: false },
    { icon: Database, label: 'Datasets', active: false },
    { icon: Link2, label: 'Connections', active: false },
  ];

  return (
    <div className="flex h-full bg-white">
      {/* Left Icon Sidebar */}
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-3 gap-1">
        <button className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
          <Bot size={18} />
        </button>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <Database size={18} />
        </button>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <FileText size={18} />
        </button>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <Layers size={18} />
        </button>
        <div className="flex-1"></div>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <Settings size={18} />
        </button>
      </div>

      {/* Explorer Panel */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="font-medium text-gray-900">Explorer</span>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">+ Add data</button>
        </div>

        <div className="p-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for resources"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="py-1">
            {explorerItems.map((item, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, googleMerch: !prev.googleMerch }))}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {expandedSections.googleMerch ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="font-medium">GoogleMerch</span>
            </button>

            {expandedSections.googleMerch && (
              <div className="ml-2">
                {projectItems.map((item, idx) => (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-3 px-4 py-1.5 text-sm transition-colors ${
                      item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-2 gap-1">
          <button className="h-8 px-3 flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-200 rounded">
            <ChevronDown size={14} />
          </button>
          <div className="h-8 px-3 flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-t border-b-white -mb-px">
            <FileText size={14} className="text-gray-400" />
            <span>Untitled...ion</span>
            <button className="text-gray-400 hover:text-gray-600 ml-1">×</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-normal text-blue-600 mb-2">Chat with your data</h1>
            <p className="text-gray-600 mb-6">Select an agent or data source to begin a conversation</p>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'agents'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Agents
              </button>
              <button
                onClick={() => setActiveTab('data_sources')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'data_sources'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Data sources
              </button>
            </div>

            {activeTab === 'data_sources' && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  To get started, select your first data source. Additional data sources must be in the same region.
                </p>

                {/* Data Source Type Toggle */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setDataSourceType('tables')}
                      className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                        dataSourceType === 'tables'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Tables
                    </button>
                    <button
                      onClick={() => setDataSourceType('semantic_graphs')}
                      className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                        dataSourceType === 'semantic_graphs'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Semantic graphs
                    </button>
                  </div>
                </div>

                {/* Region and Search */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Region <span className="text-red-500">*</span></span>
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-md border border-gray-200">
                      <span className="text-sm font-medium">{selectedRegion}</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                    <button className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      ?
                    </button>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for semantic graphs"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button className="w-9 h-9 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Recents Table */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Recents</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-10 px-3 py-3"></th>
                          <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Semantic graph name</th>
                          <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                          <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last modified</th>
                          <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {semanticGraphs.map((graph) => (
                          <tr 
                            key={graph.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${selectedItems.includes(graph.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => toggleSelection(graph.id)}
                          >
                            <td className="px-3 py-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedItems.includes(graph.id) 
                                  ? 'border-blue-600 bg-blue-600' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedItems.includes(graph.id) && (
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" fill="none" />
                                  </svg>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-500" />
                                <div>
                                  <div className="text-sm font-medium text-blue-600 hover:underline">{graph.name}</div>
                                  <div className="text-xs text-gray-500">Dataset: {graph.dataset}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">{graph.description}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{graph.project}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{graph.lastModified}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{graph.region}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Start Conversation Button */}
                <div className="mt-6">
                  <button
                    disabled={selectedItems.length === 0}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedItems.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Start conversation
                  </button>
                </div>
              </>
            )}

            {activeTab === 'agents' && (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.description}</div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                ))}
                <button className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full">
                  <Plus size={16} />
                  Create new agent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
