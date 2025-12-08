import React, { useState, useRef, useEffect } from 'react';
import { SemanticModel, ChatMessage } from '../types';
import { generateAssistantResponse } from '../services/geminiService';
import { Send, User, Bot, Sparkles } from 'lucide-react';

interface AgentChatProps {
  model: SemanticModel;
}

export const AgentChat: React.FC<AgentChatProps> = ({ model }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: 'welcome',
        role: 'model',
        text: 'Hello! I am your Data Agent. I have context on your Revenue, Inventory, and Product entities. Ask me anything about your business data.',
        timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: inputValue,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const responseText = await generateAssistantResponse(userMsg.text, model, history);

    const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="absolute inset-0 bg-[url('https://www.gstatic.com/cloud/images/backgrounds/cloud_background_v2.svg')] opacity-5 pointer-events-none"></div>
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white/80 backdrop-blur-sm z-10">
        <div>
            <h1 className="text-xl font-normal text-gray-800 flex items-center gap-2">
                <Sparkles className="text-blue-500" size={20} />
                Dataplex Agent
            </h1>
            <p className="text-sm text-gray-500">Connected to <span className="font-medium text-gray-700">Revenue & Inventory Domain</span></p>
        </div>
        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Model Active
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={18} className="text-blue-600"/>}
                </div>
                <div className={`max-w-[70%] rounded-lg p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
            </div>
        ))}
        {isThinking && (
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                     <Bot size={18} className="text-blue-600"/>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white z-10">
        <div className="max-w-4xl mx-auto relative">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about your data (e.g., 'What products had zero stock this week?')"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-4 pr-12 shadow-sm"
            />
            <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                className="absolute right-2 top-2.5 text-blue-600 hover:bg-blue-50 p-2 rounded-full disabled:opacity-50 transition-colors"
            >
                <Send size={20} />
            </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-xs text-gray-400">AI can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
};