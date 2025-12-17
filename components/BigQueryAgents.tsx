import React, { useState } from 'react';
import { Bot, Plus, Database, ArrowLeft, Save, Share2, MessageSquare, Send, Sparkles } from 'lucide-react';
import { DataAgent } from '../types';

interface BigQueryAgentsProps {
  onBack?: () => void;
}

export const BigQueryAgents: React.FC<BigQueryAgentsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'agents'>('agents');
  const [agents, setAgents] = useState<DataAgent[]>([
    {
      id: 'agent_1',
      name: 'Cymbal Sales',
      description: 'Cymbal Sales is an AI agent designed to answer data analysis questions about sales data, providing actionable insights to optimize performance.',
      dataSources: [],
      createdAt: new Date()
    }
  ]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent_1');
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState('');

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const updateAgent = (id: string, updates: Partial<DataAgent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const createNewAgent = () => {
    const newAgent: DataAgent = {
      id: `agent_${Date.now()}`,
      name: 'New Agent',
      description: '',
      dataSources: [],
      createdAt: new Date()
    };
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgentId(newAgent.id);
  };

  const availableDataSources = [
    { id: 'ds_1', name: 'sales_transactions', type: 'Table', project: 'analytics-prod' },
    { id: 'ds_2', name: 'customer_dim', type: 'Table', project: 'analytics-prod' },
    { id: 'ds_3', name: 'product_catalog', type: 'Table', project: 'analytics-prod' },
    { id: 'ds_4', name: 'inventory_snapshot', type: 'Table', project: 'warehouse-data' },
    { id: 'ds_5', name: 'Supply Chain Model', type: 'Semantic Model', project: 'dataplex-pegasus' },
  ];

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-14 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-3 gap-2">
        <button className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <Bot size={20} />
        </button>
        <div className="w-8 h-px bg-gray-200 my-2"></div>
        <button className="w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <Database size={18} />
        </button>
      </div>

      {/* Navigation Panel */}
      <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'agents'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Agents
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'agents' && (
            <div className="space-y-1">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedAgentId === agent.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
              <button
                onClick={createNewAgent}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus size={14} />
                New Agent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedAgent ? (
          <>
            {/* Header */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedAgentId(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={20} />
                </button>
                <span className="font-medium text-gray-900">{selectedAgent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Save size={16} />
                  Save
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Sparkles size={16} />
                  Publish
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 size={16} />
                  Share
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <MessageSquare size={16} />
                  Create conversation
                </button>
              </div>
            </div>

            {/* Editor and Preview */}
            <div className="flex-1 flex overflow-hidden">
              {/* Editor Panel */}
              <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Editor</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedAgent.name}
                      onChange={(e) => updateAgent(selectedAgent.id, { name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={selectedAgent.description}
                      onChange={(e) => updateAgent(selectedAgent.id, { description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Describe what this agent does..."
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        Brief overview to help users understand this agent's purpose. Visible to all viewers.
                      </span>
                      <span className="text-xs text-gray-400">
                        {selectedAgent.description.length}/120
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Data sources</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Select table(s) or model graphs this agent will use when answering questions. 
                      Access to data sources is granted automatically when an agent is published and shared.
                    </p>

                    {selectedAgent.dataSources.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {selectedAgent.dataSources.map(dsId => {
                          const ds = availableDataSources.find(d => d.id === dsId);
                          return ds ? (
                            <div key={dsId} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Database size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-700">{ds.name}</span>
                                <span className="text-xs text-gray-400">({ds.type})</span>
                              </div>
                              <button
                                onClick={() => updateAgent(selectedAgent.id, {
                                  dataSources: selectedAgent.dataSources.filter(id => id !== dsId)
                                })}
                                className="text-gray-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setShowAddDataModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add data
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="w-1/2 p-6 overflow-y-auto bg-gray-50 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Preview</h2>

                <div className="flex-1 flex flex-col items-center justify-center">
                  {selectedAgent.dataSources.length === 0 ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        {selectedAgent.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedAgent.name}</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
                        {selectedAgent.description || 'No description provided'}
                      </p>
                      <p className="text-sm text-gray-400">Add data to preview your agent</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
                            {selectedAgent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedAgent.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {selectedAgent.description || 'No description provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="mt-auto pt-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={previewQuestion}
                      onChange={(e) => setPreviewQuestion(e.target.value)}
                      placeholder="Ask a data question"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Select an agent</h3>
              <p className="text-gray-500 mb-4">Choose an agent from the list or create a new one</p>
              <button
                onClick={createNewAgent}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Data Modal */}
      {showAddDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Data Source</h3>
              <button
                onClick={() => setShowAddDataModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {availableDataSources.map(ds => {
                  const isSelected = selectedAgent?.dataSources.includes(ds.id);
                  return (
                    <button
                      key={ds.id}
                      onClick={() => {
                        if (selectedAgent) {
                          if (isSelected) {
                            updateAgent(selectedAgent.id, {
                              dataSources: selectedAgent.dataSources.filter(id => id !== ds.id)
                            });
                          } else {
                            updateAgent(selectedAgent.id, {
                              dataSources: [...selectedAgent.dataSources, ds.id]
                            });
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database size={18} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                            {ds.name}
                          </div>
                          <div className="text-xs text-gray-500">{ds.project} • {ds.type}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddDataModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddDataModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
