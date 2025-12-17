import React, { useState } from 'react';
import { Bot, Plus, Search, ChevronLeft, Settings, Trash2, Send, ChevronDown, HelpCircle, BarChart3, Table, MessageSquare, Sparkles, FileText, Database, Layers, MoreVertical } from 'lucide-react';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryResult?: {
    columns: string[];
    rows: Array<Record<string, string | number>>;
  };
  chartData?: {
    title: string;
    labels: string[];
    values: number[];
  };
}

interface Conversation {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  messages: ConversationMessage[];
}

interface BigQueryConversationProps {
  onBack: () => void;
  selectedDataSource?: { id: string; name: string; type: 'table' | 'semantic_graph' };
}

export const BigQueryConversation: React.FC<BigQueryConversationProps> = ({ onBack, selectedDataSource }) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'agent_catalog'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string>('conv_1');
  const [inputValue, setInputValue] = useState('');
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart');

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv_1',
      name: 'Product inventory',
      icon: 'E',
      iconColor: 'bg-blue-500',
      messages: [
        {
          id: 'msg_1',
          type: 'user',
          content: 'Show me total sweaters sold by city',
          timestamp: new Date()
        },
        {
          id: 'msg_2',
          type: 'assistant',
          content: 'I\'ll write a query for the question: "Calculate total sweaters sold by city".',
          timestamp: new Date(),
          queryResult: {
            columns: ['City', 'Total Sweaters Sold'],
            rows: [
              { City: 'Boston', 'Total Sweaters Sold': 51287 },
              { City: 'Seattle', 'Total Sweaters Sold': 48298 },
              { City: 'New York', 'Total Sweaters Sold': 42156 },
              { City: 'Chicago', 'Total Sweaters Sold': 38421 },
              { City: 'Los Angeles', 'Total Sweaters Sold': 35892 },
              { City: 'Denver', 'Total Sweaters Sold': 28764 },
              { City: 'Miami', 'Total Sweaters Sold': 22341 },
              { City: 'Phoenix', 'Total Sweaters Sold': 18567 },
            ]
          },
          chartData: {
            title: 'Total sweaters sold by city',
            labels: ['Boston', 'Seattle', 'New York', 'Chicago', 'Los Angeles', 'Denver', 'Miami', 'Phoenix'],
            values: [51287, 48298, 42156, 38421, 35892, 28764, 22341, 18567]
          }
        }
      ]
    },
    { id: 'conv_2', name: 'EMEA sales market', icon: 'A', iconColor: 'bg-orange-500', messages: [] },
    { id: 'conv_3', name: 'Customer report 2024', icon: '📊', iconColor: 'bg-gray-100', messages: [] },
    { id: 'conv_4', name: 'Regional customers', icon: '👥', iconColor: 'bg-gray-100', messages: [] },
    { id: 'conv_5', name: 'Regional quarterly sales', icon: 'Q', iconColor: 'bg-green-500', messages: [] },
    { id: 'conv_6', name: 'Product and location forecast', icon: '📈', iconColor: 'bg-gray-100', messages: [] },
    { id: 'conv_7', name: 'Sales for product by category', icon: 'P', iconColor: 'bg-purple-500', messages: [] },
  ]);

  const activeConversation = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeConversation) return;

    const newMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, messages: [...conv.messages, newMessage] }
        : conv
    ));
    setInputValue('');

    setTimeout(() => {
      const responseMessage: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        content: `I'll analyze your request: "${inputValue}"`,
        timestamp: new Date(),
        queryResult: {
          columns: ['Category', 'Value'],
          rows: [
            { Category: 'Result 1', Value: 12500 },
            { Category: 'Result 2', Value: 9800 },
            { Category: 'Result 3', Value: 7600 },
          ]
        }
      };

      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, messages: [...conv.messages, responseMessage] }
          : conv
      ));
    }, 1000);
  };

  const maxValue = activeConversation?.messages[1]?.chartData 
    ? Math.max(...activeConversation.messages[1].chartData.values) 
    : 0;

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
          <Search size={18} />
        </button>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <Sparkles size={18} />
        </button>
        <div className="flex-1"></div>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <Settings size={18} />
        </button>
        <button className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
          <FileText size={18} />
        </button>
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Conversations Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Tabs */}
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
            onClick={() => setActiveTab('agent_catalog')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'agent_catalog'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Agent Catalog
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="p-2 border-b border-gray-100">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
            <Plus size={16} />
            <span>New conversation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors group ${
                selectedConversation === conv.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                conv.iconColor.includes('bg-') ? conv.iconColor : 'bg-gray-100'
              } ${conv.iconColor.includes('500') ? 'text-white' : 'text-gray-700'}`}>
                {conv.icon.length === 1 ? conv.icon : <span className="text-sm">{conv.icon}</span>}
              </div>
              <span className="flex-1 text-left truncate">{conv.name}</span>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
                <MoreVertical size={14} className="text-gray-400" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-medium text-blue-600">{activeConversation?.name || 'New Conversation'}</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
              <Trash2 size={16} />
              Delete
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeConversation?.messages.map((message) => (
              <div key={message.id}>
                {message.type === 'user' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" alt="User" className="w-full h-full" />
                    </div>
                    <div className="bg-gray-700 text-white px-4 py-2 rounded-2xl rounded-tl-sm max-w-md">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Analysis Status */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Sparkles size={16} className="text-blue-600" />
                      </div>
                      <span className="text-gray-900 font-medium">Analysis complete</span>
                      <span className="text-gray-400 text-sm ml-auto">0 min</span>
                    </div>

                    {/* Response Text */}
                    <p className="text-gray-700 ml-11">{message.content}</p>

                    {/* Query Result */}
                    {message.queryResult && (
                      <div className="ml-11">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-600">Here's the query result.</span>
                          <ChevronDown size={16} className="text-gray-400" />
                          <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                            <HelpCircle size={14} className="text-gray-400" />
                          </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                {message.queryResult.columns.map((col, idx) => (
                                  <th key={idx} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${idx === 0 ? 'text-left' : 'text-right'}`}>
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {message.queryResult.rows.slice(0, 3).map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  {message.queryResult!.columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 py-3 text-sm ${colIdx === 0 ? 'text-blue-600 text-left' : 'text-gray-900 text-right'}`}>
                                      {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {message.queryResult.rows.length > 3 && (
                                <tr>
                                  <td colSpan={message.queryResult.columns.length} className="px-4 py-2 text-center">
                                    <button className="text-gray-400 hover:text-gray-600">
                                      <ChevronDown size={16} />
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Chart */}
                    {message.chartData && (
                      <div className="ml-11">
                        <p className="text-gray-600 mb-3">Create a bar chart showing the total sweaters by city.</p>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">{message.chartData.title}</h4>
                            <div className="flex bg-gray-100 rounded-md p-0.5">
                              <button
                                onClick={() => setChartView('chart')}
                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                                  chartView === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                }`}
                              >
                                Chart
                              </button>
                              <button
                                onClick={() => setChartView('table')}
                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                                  chartView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                }`}
                              >
                                Table
                              </button>
                            </div>
                          </div>

                          {chartView === 'chart' ? (
                            <div className="h-64 flex items-end gap-2">
                              {/* Y-axis labels */}
                              <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                                <span>6M</span>
                                <span>4M</span>
                                <span>2M</span>
                                <span></span>
                              </div>
                              {/* Bars */}
                              <div className="flex-1 flex items-end justify-around gap-1 h-full border-l border-b border-gray-200 pl-2 pb-6">
                                {message.chartData.values.map((value, idx) => (
                                  <div key={idx} className="flex flex-col items-center flex-1">
                                    <div 
                                      className="w-full max-w-12 bg-blue-500 rounded-t transition-all"
                                      style={{ height: `${(value / maxValue) * 200}px` }}
                                    ></div>
                                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                                      {message.chartData!.labels[idx]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="border border-gray-200 rounded overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-600">City</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-600">Sweaters Sold</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {message.chartData.labels.map((label, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-2 text-gray-900">{label}</td>
                                      <td className="px-4 py-2 text-right text-gray-900">{message.chartData!.values[idx].toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question"
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar Toggle */}
      <div className="w-8 border-l border-gray-200 flex items-start justify-center pt-4">
        <button className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
};
