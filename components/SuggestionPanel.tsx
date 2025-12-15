import React from 'react';
import { Bell, Check, X, ChevronDown, ChevronUp, AlertCircle, Sparkles, Database, RefreshCw, FileText, Plus, Edit } from 'lucide-react';
import { EntityUpdateSuggestion, SuggestionStatus, SuggestionSource, SuggestionType, Property } from '../types';

interface SuggestionPanelProps {
    suggestions: EntityUpdateSuggestion[];
    onApprove: (suggestionId: string) => void;
    onReject: (suggestionId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const getSourceIcon = (source: SuggestionSource) => {
    switch (source) {
        case SuggestionSource.AI_GENERATION:
            return <Sparkles size={14} className="text-purple-400" />;
        case SuggestionSource.IMPORT:
            return <Database size={14} className="text-blue-400" />;
        case SuggestionSource.DATA_SCAN:
            return <RefreshCw size={14} className="text-green-400" />;
        case SuggestionSource.SCHEMA_SYNC:
            return <FileText size={14} className="text-orange-400" />;
        default:
            return <AlertCircle size={14} className="text-gray-400" />;
    }
};

const getSourceLabel = (source: SuggestionSource): string => {
    switch (source) {
        case SuggestionSource.AI_GENERATION:
            return 'AI Generated';
        case SuggestionSource.IMPORT:
            return 'Import';
        case SuggestionSource.DATA_SCAN:
            return 'Data Scan';
        case SuggestionSource.SCHEMA_SYNC:
            return 'Schema Sync';
        default:
            return 'Unknown';
    }
};

const getTypeIcon = (type: SuggestionType) => {
    switch (type) {
        case SuggestionType.NEW_PROPERTY:
            return <Plus size={14} className="text-green-400" />;
        case SuggestionType.UPDATED_DESCRIPTION:
            return <Edit size={14} className="text-blue-400" />;
        case SuggestionType.NEW_ENTITY:
            return <Plus size={14} className="text-purple-400" />;
        case SuggestionType.UPDATED_ENTITY:
            return <Edit size={14} className="text-orange-400" />;
        default:
            return <AlertCircle size={14} className="text-gray-400" />;
    }
};

const getTypeLabel = (type: SuggestionType): string => {
    switch (type) {
        case SuggestionType.NEW_PROPERTY:
            return 'New Properties';
        case SuggestionType.UPDATED_DESCRIPTION:
            return 'Description Update';
        case SuggestionType.NEW_ENTITY:
            return 'New Entity';
        case SuggestionType.UPDATED_ENTITY:
            return 'Entity Update';
        default:
            return 'Update';
    }
};

const PropertyPreview: React.FC<{ property: Property }> = ({ property }) => (
    <div className="bg-gray-800/50 rounded px-2 py-1 text-xs">
        <span className="text-blue-300 font-medium">{property.name}</span>
        <span className="text-gray-500 mx-1">:</span>
        <span className="text-gray-400">{property.dataType}</span>
        {property.description && (
            <p className="text-gray-500 mt-0.5 truncate">{property.description}</p>
        )}
    </div>
);

const SuggestionCard: React.FC<{
    suggestion: EntityUpdateSuggestion;
    onApprove: () => void;
    onReject: () => void;
}> = ({ suggestion, onApprove, onReject }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const pendingCount = suggestion.suggestedProperties?.length || 0;

    return (
        <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
            <div 
                className="p-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1 mt-0.5">
                            {getTypeIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white truncate">{suggestion.entityName}</span>
                                <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                    {getSourceIcon(suggestion.source)}
                                    {getSourceLabel(suggestion.source)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {getTypeLabel(suggestion.type)}
                                {pendingCount > 0 && ` (${pendingCount} properties)`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700/50">
                    {suggestion.reason && (
                        <p className="text-xs text-gray-400 mt-2 mb-2">{suggestion.reason}</p>
                    )}

                    {suggestion.type === SuggestionType.UPDATED_DESCRIPTION && suggestion.suggestedDescription && (
                        <div className="mt-2 space-y-2">
                            {suggestion.currentDescription && (
                                <div>
                                    <span className="text-xs text-gray-500">Current:</span>
                                    <p className="text-xs text-gray-400 bg-red-900/20 rounded px-2 py-1 mt-1 line-through">
                                        {suggestion.currentDescription}
                                    </p>
                                </div>
                            )}
                            <div>
                                <span className="text-xs text-gray-500">Suggested:</span>
                                <p className="text-xs text-green-400 bg-green-900/20 rounded px-2 py-1 mt-1">
                                    {suggestion.suggestedDescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {suggestion.suggestedProperties && suggestion.suggestedProperties.length > 0 && (
                        <div className="mt-2">
                            <span className="text-xs text-gray-500 block mb-1">Suggested Properties:</span>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {suggestion.suggestedProperties.map((ps, idx) => (
                                    <PropertyPreview key={idx} property={ps.property} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); onReject(); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors"
                        >
                            <X size={14} />
                            Reject
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onApprove(); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded transition-colors"
                        >
                            <Check size={14} />
                            Approve
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
    suggestions,
    onApprove,
    onReject,
    isOpen,
    onToggle
}) => {
    const pendingSuggestions = suggestions.filter(s => s.status === SuggestionStatus.PENDING);
    const hasPending = pendingSuggestions.length > 0;

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    hasPending 
                        ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
                <Bell size={16} />
                <span>Suggestions</span>
                {hasPending && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingSuggestions.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-96 max-h-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <Bell size={16} className="text-amber-400" />
                            Entity Update Suggestions
                        </h3>
                        <button onClick={onToggle} className="text-gray-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-3 max-h-[400px] overflow-y-auto">
                        {pendingSuggestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No pending suggestions</p>
                                <p className="text-xs mt-1">Updates will appear here when detected</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingSuggestions.map(suggestion => (
                                    <SuggestionCard
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        onApprove={() => onApprove(suggestion.id)}
                                        onReject={() => onReject(suggestion.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {pendingSuggestions.length > 0 && (
                        <div className="p-3 border-t border-gray-700 flex justify-between">
                            <button
                                onClick={() => pendingSuggestions.forEach(s => onReject(s.id))}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Reject All
                            </button>
                            <button
                                onClick={() => pendingSuggestions.forEach(s => onApprove(s.id))}
                                className="text-xs text-green-400 hover:text-green-300"
                            >
                                Approve All
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SuggestionPanel;
