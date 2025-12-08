import React, { useState } from 'react';
import { Pencil, Check, X, History, Eye, Edit3 } from 'lucide-react';
import { DescriptionHistory } from '../types';

interface WikiEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  history?: DescriptionHistory[];
  onHistoryUpdate?: (history: DescriptionHistory[]) => void;
  label?: string;
  minHeight?: string;
}

export const WikiEditor: React.FC<WikiEditorProps> = ({
  content,
  onChange,
  placeholder = 'Add a description...',
  history = [],
  onHistoryUpdate,
  label = 'Description',
  minHeight = '120px'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showHistory, setShowHistory] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = () => {
    onChange(editContent);
    if (onHistoryUpdate && editContent !== content) {
      const newHistoryEntry: DescriptionHistory = {
        content: content,
        timestamp: new Date(),
        author: 'Current User'
      };
      onHistoryUpdate([newHistoryEntry, ...history.slice(0, 9)]);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
    setPreviewMode(false);
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const renderMarkdown = (text: string) => {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  if (!isEditing) {
    return (
      <div className="group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="View history"
              >
                <History size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setEditContent(content);
                setIsEditing(true);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>
        <div
          onClick={() => {
            setEditContent(content);
            setIsEditing(true);
          }}
          className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-text hover:border-blue-300 transition-colors"
          style={{ minHeight }}
        >
          {content ? (
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          ) : (
            <span className="text-sm text-gray-400 italic">{placeholder}</span>
          )}
        </div>

        {showHistory && (
          <HistoryModal
            history={history}
            onClose={() => setShowHistory(false)}
            onRestore={(content) => {
              onChange(content);
              setShowHistory(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 ${
              previewMode 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {previewMode ? <Edit3 size={12} /> : <Eye size={12} />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div
          className="p-3 bg-white border border-gray-200 rounded-lg"
          style={{ minHeight }}
        >
          <div
            className="text-sm text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
          />
        </div>
      ) : (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
          style={{ minHeight }}
          autoFocus
        />
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          Supports **bold**, *italic*, and `code`
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
          >
            <Check size={12} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryModal: React.FC<{
  history: DescriptionHistory[];
  onClose: () => void;
  onRestore: (content: string) => void;
}> = ({ history, onClose, onRestore }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No history available</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                      {entry.author && ` by ${entry.author}`}
                    </span>
                    <button
                      onClick={() => onRestore(entry.content)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Restore
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WikiEditor;
