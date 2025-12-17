import React, { useState } from 'react';
import { Bot, Plus, Search, ChevronLeft, Settings, Trash2, Send, ChevronDown, HelpCircle, BarChart3, Sparkles, FileText, Database, Layers, MoreVertical, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface QueryResult {
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

interface ChartData {
  title: string;
  labels: string[];
  values: number[];
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  queryResult?: QueryResult;
  chartData?: ChartData;
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

const generateMockDataForQuestion = (question: string): { queryResult?: QueryResult; chartData?: ChartData } => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('city') || lowerQuestion.includes('region') || lowerQuestion.includes('location')) {
    return {
      queryResult: {
        columns: ['City', 'Total Sales'],
        rows: [
          { City: 'Boston', 'Total Sales': 51287 },
          { City: 'Seattle', 'Total Sales': 48298 },
          { City: 'New York', 'Total Sales': 42156 },
          { City: 'Chicago', 'Total Sales': 38421 },
          { City: 'Los Angeles', 'Total Sales': 35892 },
        ]
      },
      chartData: {
        title: 'Sales by City',
        labels: ['Boston', 'Seattle', 'New York', 'Chicago', 'Los Angeles'],
        values: [51287, 48298, 42156, 38421, 35892]
      }
    };
  }
  
  if (lowerQuestion.includes('product') || lowerQuestion.includes('category') || lowerQuestion.includes('item')) {
    return {
      queryResult: {
        columns: ['Product Category', 'Revenue'],
        rows: [
          { 'Product Category': 'Electronics', Revenue: 125000 },
          { 'Product Category': 'Clothing', Revenue: 98500 },
          { 'Product Category': 'Home & Garden', Revenue: 76200 },
          { 'Product Category': 'Sports', Revenue: 54300 },
        ]
      },
      chartData: {
        title: 'Revenue by Product Category',
        labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports'],
        values: [125000, 98500, 76200, 54300]
      }
    };
  }
  
  if (lowerQuestion.includes('month') || lowerQuestion.includes('time') || lowerQuestion.includes('trend') || lowerQuestion.includes('year')) {
    return {
      queryResult: {
        columns: ['Month', 'Sales'],
        rows: [
          { Month: 'January', Sales: 42000 },
          { Month: 'February', Sales: 38500 },
          { Month: 'March', Sales: 51200 },
          { Month: 'April', Sales: 48900 },
          { Month: 'May', Sales: 55600 },
          { Month: 'June', Sales: 62100 },
        ]
      },
      chartData: {
        title: 'Monthly Sales Trend',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [42000, 38500, 51200, 48900, 55600, 62100]
      }
    };
  }
  
  if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock') || lowerQuestion.includes('warehouse')) {
    return {
      queryResult: {
        columns: ['Warehouse', 'Stock Level', 'Status'],
        rows: [
          { Warehouse: 'West Coast', 'Stock Level': 15420, Status: 'Healthy' },
          { Warehouse: 'East Coast', 'Stock Level': 12350, Status: 'Healthy' },
          { Warehouse: 'Central', 'Stock Level': 8900, Status: 'Low' },
          { Warehouse: 'South', 'Stock Level': 11200, Status: 'Healthy' },
        ]
      }
    };
  }
  
  return {
    queryResult: {
      columns: ['Metric', 'Value'],
      rows: [
        { Metric: 'Total Records', Value: 15234 },
        { Metric: 'Average Value', Value: 856.42 },
        { Metric: 'Max Value', Value: 12500 },
        { Metric: 'Min Value', Value: 25 },
      ]
    }
  };
};

export const BigQueryConversation: React.FC<BigQueryConversationProps> = ({ onBack, selectedDataSource }) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'agent_catalog'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string>('conv_new');
  const [inputValue, setInputValue] = useState('');
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart');
  const [isGenerating, setIsGenerating] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv_new',
      name: selectedDataSource?.name || 'New Conversation',
      icon: selectedDataSource?.type === 'semantic_graph' ? 'S' : 'T',
      iconColor: selectedDataSource?.type === 'semantic_graph' ? 'bg-purple-500' : 'bg-blue-500',
      messages: []
    },
    { id: 'conv_2', name: 'EMEA sales market', icon: 'A', iconColor: 'bg-orange-500', messages: [] },
    { id: 'conv_3', name: 'Customer report 2024', icon: 'C', iconColor: 'bg-green-500', messages: [] },
    { id: 'conv_4', name: 'Regional customers', icon: 'R', iconColor: 'bg-indigo-500', messages: [] },
    { id: 'conv_5', name: 'Regional quarterly sales', icon: 'Q', iconColor: 'bg-pink-500', messages: [] },
  ]);

  const activeConversation = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation || isGenerating) return;

    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    const loadingMessage: ConversationMessage = {
      id: `msg_${Date.now() + 1}`,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, messages: [...conv.messages, userMessage, loadingMessage] }
        : conv
    ));
    
    const question = inputValue;
    setInputValue('');
    setIsGenerating(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a data analyst assistant. The user is querying data from "${selectedDataSource?.name || 'a data source'}".

User question: "${question}"

Provide a brief, helpful response explaining what query you would write and what insights the data shows. Keep it concise (2-3 sentences). Do not use markdown formatting.`
      });

      const mockData = generateMockDataForQuestion(question);
      
      const responseMessage: ConversationMessage = {
        id: `msg_${Date.now() + 2}`,
        type: 'assistant',
        content: response.text || "I've analyzed your request and here are the results.",
        timestamp: new Date(),
        ...mockData
      };

      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, messages: conv.messages.filter(m => !m.isLoading).concat(responseMessage) }
          : conv
      ));
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ConversationMessage = {
        id: `msg_${Date.now() + 2}`,
        type: 'assistant',
        content: "I encountered an issue processing your request. Here's the data based on your query.",
        timestamp: new Date(),
        ...generateMockDataForQuestion(question)
      };

      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, messages: conv.messages.filter(m => !m.isLoading).concat(errorMessage) }
          : conv
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const getMaxValue = (messages: ConversationMessage[]) => {
    for (const msg of messages) {
      if (msg.chartData) {
        return Math.max(...msg.chartData.values);
      }
    }
    return 0;
  };

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
              <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${conv.iconColor} text-white`}>
                {conv.icon}
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
            {activeConversation?.messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Ask a question about your data</h3>
                <p className="text-gray-500 mb-6">I can help you analyze {selectedDataSource?.name || 'your data'}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Show me sales by city', 'What are the top products?', 'Show monthly trends', 'Check inventory levels'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputValue(suggestion)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                ) : message.isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Loader2 size={16} className="text-blue-600 animate-spin" />
                    </div>
                    <span className="text-gray-500">Analyzing your data...</span>
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
                              {message.queryResult.rows.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  {message.queryResult!.columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 py-3 text-sm ${colIdx === 0 ? 'text-blue-600 text-left' : 'text-gray-900 text-right'}`}>
                                      {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Chart */}
                    {message.chartData && (
                      <div className="ml-11">
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
                              <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                                <span>{Math.round(Math.max(...message.chartData.values) / 1000)}K</span>
                                <span>{Math.round(Math.max(...message.chartData.values) / 2000)}K</span>
                                <span>0</span>
                              </div>
                              <div className="flex-1 flex items-end justify-around gap-2 h-full border-l border-b border-gray-200 pl-2 pb-8">
                                {message.chartData.values.map((value, idx) => (
                                  <div key={idx} className="flex flex-col items-center flex-1">
                                    <div 
                                      className="w-full max-w-12 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                      style={{ height: `${(value / Math.max(...message.chartData!.values)) * 180}px` }}
                                    ></div>
                                    <span className="text-xs text-gray-500 mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-16">
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
                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Label</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-600">Value</th>
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
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask a question"
              disabled={isGenerating}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isGenerating || !inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
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
