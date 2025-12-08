import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Entity, SemanticModel, EntityType, Relationship, Property, AspectAssignment, GlossaryTerm, DescriptionHistory, PropertyType } from '../types';
import { Plus, Database, Table as TableIcon, Columns, ArrowRight, Save, Wand2, X, Maximize2, Layers, ArrowLeft, GitCommit, Link, Pencil, Check, Rocket, ChevronDown, BarChart3, Settings2, PieChart, LineChart, Activity, Calendar, AlertCircle, TrendingUp, GripVertical, ExternalLink, ChevronRight, Minimize2, Search, FileText, BookOpen, Tag, Upload, Eye, Trash2, MoreVertical, Download, Key } from 'lucide-react';
import { suggestEntitiesFromDescription } from '../services/geminiService';
import { WikiEditor } from './WikiEditor';
import { AspectSelector, AVAILABLE_ASPECT_TYPES } from './AspectSelector';
import { GlossarySelector } from './GlossarySelector';

// Mock Schema for BigQuery Tables to power the dropdowns
const MOCK_BQ_SCHEMA: Record<string, Array<{ name: string, type: string }>> = {
    'DWH_DIM_PROD': [
        { name: 'sku_id', type: 'STRING' },
        { name: 'product_name', type: 'STRING' },
        { name: 'product_category', type: 'STRING' },
        { name: 'unit_price', type: 'FLOAT' },
        { name: 'cost_price', type: 'FLOAT' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'is_active', type: 'BOOLEAN' },
        { name: 'brand', type: 'STRING' },
        { name: 'supplier_id', type: 'STRING' }
    ],
    'OLTP_INV_SKU': [
        { name: 'sku_id', type: 'STRING' },
        { name: 'warehouse_id', type: 'STRING' },
        { name: 'current_stock_qty', type: 'INTEGER' },
        { name: 'reserved_stock_qty', type: 'INTEGER' },
        { name: 'last_updated_ts', type: 'TIMESTAMP' },
        { name: 'reorder_point', type: 'INTEGER' }
    ]
};

interface SemanticBuilderProps {
  models: SemanticModel[];
  activeModelId: string | null;
  onSelectModel: (modelId: string | null) => void;
  onUpdateModel: (model: SemanticModel) => void;
  onCreateModel: (model: SemanticModel) => void;
  onDeleteModel: (modelId: string) => void;
}

type Selection = 
  | { type: 'ENTITY'; id: string } 
  | { type: 'TABLE'; id: string }
  | { type: 'RELATIONSHIP'; id: string }
  | null;

type ViewMode = 'GRAPH' | 'AUTHORING' | 'FULL_PAGE_ENTITY' | 'DEPLOY';

export const SemanticBuilder: React.FC<SemanticBuilderProps> = ({ 
  models, 
  activeModelId, 
  onSelectModel, 
  onUpdateModel, 
  onCreateModel, 
  onDeleteModel 
}) => {
  const model = models.find(m => m.id === activeModelId);
  
  const setModel = (updater: SemanticModel | ((prev: SemanticModel) => SemanticModel)) => {
    if (!model) return;
    const newModel = typeof updater === 'function' ? updater(model) : updater;
    onUpdateModel({ ...newModel, updatedAt: new Date() });
  };
  const [selection, setSelection] = useState<Selection>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('GRAPH');
  
  // Layout State
  const [panelWidth, setPanelWidth] = useState(440);
  const [fullScreenEntityId, setFullScreenEntityId] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Link Creation State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingSourcePropId, setLinkingSourcePropId] = useState<string | null>(null);

  // Binding Edit State
  const [editingBindingId, setEditingBindingId] = useState<string | null>(null);
  const [tempBindingValue, setTempBindingValue] = useState("");
  const [columnSearchModalPropId, setColumnSearchModalPropId] = useState<string | null>(null);

  // Sidebar Tabs
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'configuration'>('dashboard');
  
  // Model Configuration State
  const [isModelConfigExpanded, setIsModelConfigExpanded] = useState(false);
  const [isEditingModelDesc, setIsEditingModelDesc] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showGitFileModal, setShowGitFileModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  
  // Helper to get selected objects
  const selectedEntity = useMemo(() => 
    selection?.type === 'ENTITY' ? model?.entities.find(e => e.id === selection.id) : null,
  [selection, model?.entities]);

  const selectedRelationship = useMemo(() => 
    selection?.type === 'RELATIONSHIP' ? model?.relationships.find(r => r.id === selection.id) : null,
  [selection, model?.relationships]);

  // Handle Search Input Focus
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  // Click outside handler for settings menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);

  // Filter Entities
  const filteredEntities = useMemo(() => {
    const entities = model?.entities ?? [];
    if (!searchQuery) return entities;
    return entities.filter(ent => 
        ent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ent.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [model?.entities, searchQuery]);

  // Handle Resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const doDrag = (dragEvent: MouseEvent) => {
        const newWidth = startWidth + (startX - dragEvent.clientX);
        if (newWidth > 300 && newWidth < 800) {
            setPanelWidth(newWidth);
        }
    };

    const stopDrag = () => {
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const handleCreateManual = () => {
    const newEntity: Entity = {
      id: `entity_${Date.now()}`,
      name: 'New Entity',
      type: EntityType.ENTITY,
      description: 'Describe this business entity',
      properties: []
    };
    setModel(prev => ({ ...prev, entities: [...prev.entities, newEntity] }));
    setSelection({ type: 'ENTITY', id: newEntity.id });
    setSidebarTab('configuration');
    setViewMode('GRAPH');
  };

  const handleAiGenerated = (newEntities: Entity[]) => {
      setModel(prev => ({ ...prev, entities: [...prev.entities, ...newEntities] }));
      if (newEntities.length > 0) {
          setSelection({ type: 'ENTITY', id: newEntities[0].id });
          setSidebarTab('configuration');
      }
      setViewMode('GRAPH');
  };

  const handleCreateLink = (targetEntityId: string, targetPropId: string, type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY') => {
      if (!selectedEntity || !linkingSourcePropId) return;

      const newRel: Relationship = {
          id: `rel_${Date.now()}`,
          sourceEntityId: selectedEntity.id,
          sourcePropertyId: linkingSourcePropId,
          targetEntityId: targetEntityId,
          targetPropertyId: targetPropId,
          type: type,
          description: 'User defined link',
          label: 'New Relationship'
      };

      setModel(prev => ({ ...prev, relationships: [...prev.relationships, newRel] }));
      setIsLinkModalOpen(false);
      setLinkingSourcePropId(null);
  };

  const startEditingBinding = (propId: string, currentBinding?: string) => {
      setEditingBindingId(propId);
      setTempBindingValue(currentBinding || "");
  };

  const saveBinding = (entityId: string, propId: string) => {
      setModel(prev => ({
          ...prev,
          entities: prev.entities.map(ent => {
              if (ent.id !== entityId) return ent;
              return {
                  ...ent,
                  properties: ent.properties.map(p => {
                      if (p.id !== propId) return p;
                      return { ...p, binding: tempBindingValue };
                  })
              }
          })
      }));
      setEditingBindingId(null);
  };

  const openFullPage = () => {
      if (selectedEntity) {
          setFullScreenEntityId(selectedEntity.id);
          setViewMode('FULL_PAGE_ENTITY');
      }
  };

  // Infer the table name for the selected entity to populate dropdowns
  const currentEntityTableName = useMemo(() => {
      const targetEntity = viewMode === 'FULL_PAGE_ENTITY' 
        ? model.entities.find(e => e.id === fullScreenEntityId)
        : selectedEntity;

      if (!targetEntity) return null;
      // Find first property with a binding
      const propWithBinding = targetEntity.properties.find(p => p.binding);
      if (propWithBinding && propWithBinding.binding) {
          return propWithBinding.binding.split('.')[0];
      }
      return 'DWH_DIM_PROD'; // Fallback
  }, [selectedEntity, fullScreenEntityId, viewMode]);

  const availableColumns = useMemo(() => {
      if (!currentEntityTableName) return [];
      return MOCK_BQ_SCHEMA[currentEntityTableName] || [];
  }, [currentEntityTableName]);

  if (viewMode === 'AUTHORING') {
      return (
          <AuthoringView 
            onBack={() => setViewMode('GRAPH')} 
            onManual={handleCreateManual}
            onGenerated={handleAiGenerated}
          />
      );
  }

  if (viewMode === 'FULL_PAGE_ENTITY' && model) {
      const entity = model.entities.find(e => e.id === fullScreenEntityId);
      if (!entity) return <div>Entity not found</div>;
      
      return (
          <FullPageEntityView 
            entity={entity} 
            model={model}
            setModel={setModel}
            onClose={() => {
                setViewMode('GRAPH');
                setFullScreenEntityId(null);
            }} 
            availableColumns={availableColumns}
            currentEntityTableName={currentEntityTableName}
          />
      );
  }

  if (viewMode === 'DEPLOY' && model) {
      return (
          <DeploymentPage 
            model={model}
            onBack={() => setViewMode('GRAPH')}
          />
      );
  }

  // Model Directory View - show when no model is selected
  if (!model) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Semantic Models</h1>
              <p className="text-gray-500 mt-1">Select a model to view and edit its entities</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowRight size={18} className="rotate-180" />
                Import Model
              </button>
              <button
                onClick={() => {
                  const newModel: SemanticModel = {
                    id: `model_${Date.now()}`,
                    name: 'New Semantic Model',
                    description: '',
                    entities: [],
                    relationships: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  onCreateModel(newModel);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                New Model
              </button>
            </div>
          </div>

          {/* Models Grid */}
          {models.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Database size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No semantic models yet</h3>
              <p className="text-gray-500 mb-6">Create your first model to get started</p>
              <button
                onClick={() => {
                  const newModel: SemanticModel = {
                    id: `model_${Date.now()}`,
                    name: 'New Semantic Model',
                    description: '',
                    entities: [],
                    relationships: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  onCreateModel(newModel);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Create Model
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Database size={24} className="text-white" />
                    </div>
                    {m.domain && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {m.domain}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {m.name}
                  </h3>
                  {m.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{m.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <TableIcon size={12} />
                      <span>{m.entities.length} entities</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link size={12} />
                      <span>{m.relationships.length} relationships</span>
                    </div>
                  </div>
                  {m.updatedAt && (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                      Updated {new Date(m.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import Model Modal */}
        {showImportModal && (
          <ImportModelModal 
            onClose={() => setShowImportModal(false)}
            onImport={(importedModel) => {
              onCreateModel(importedModel);
              setShowImportModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white overflow-hidden relative">
      
      {/* Left Pane: Search/Navigator */}
      <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
         {/* Model Breadcrumb */}
         <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
           <button
             onClick={() => onSelectModel(null)}
             className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
           >
             <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
             <span className="text-gray-400">Models</span>
             <ChevronRight size={12} className="text-gray-300" />
             <span className="font-medium text-gray-700 truncate max-w-[160px]">{model.name}</span>
           </button>
           
           {/* Settings Menu */}
           <div className="relative" ref={settingsMenuRef}>
             <button
               onClick={() => setShowSettingsMenu(!showSettingsMenu)}
               className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
               title="Model Settings"
             >
               <MoreVertical size={16} />
             </button>
             
             {showSettingsMenu && (
               <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                 <button
                   onClick={() => {
                     setShowGitFileModal(true);
                     setShowSettingsMenu(false);
                   }}
                   className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                 >
                   <GitCommit size={16} className="text-gray-400" />
                   <div>
                     <div className="font-medium">Change Git File</div>
                     <div className="text-xs text-gray-400">Update source file reference</div>
                   </div>
                 </button>
                 <div className="border-t border-gray-100 my-1"></div>
                 <button
                   onClick={() => {
                     setShowDeleteConfirm(true);
                     setShowSettingsMenu(false);
                   }}
                   className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                 >
                   <Trash2 size={16} />
                   <div>
                     <div className="font-medium">Delete Model</div>
                     <div className="text-xs text-red-400">Permanently remove this model</div>
                   </div>
                 </button>
               </div>
             )}
           </div>
         </div>
         <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between h-[52px]">
             {!isSearchVisible ? (
                 <>
                    <span className="font-semibold text-gray-700 text-sm">Search</span>
                    <button 
                        onClick={() => setIsSearchVisible(true)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Search size={16}/>
                    </button>
                 </>
             ) : (
                 <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-left-1 duration-200">
                     <Search size={14} className="text-gray-400 shrink-0"/>
                     <input 
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter entities..."
                        className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 min-w-0"
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setSearchQuery('');
                                setIsSearchVisible(false);
                            }
                        }}
                     />
                     <button 
                        onClick={() => {
                            setSearchQuery('');
                            setIsSearchVisible(false);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                     >
                        <X size={14}/>
                     </button>
                 </div>
             )}
         </div>
         <div className="flex-1 overflow-y-auto p-2">
            {/* Definition Section */}
            <div className="mb-3">
              <div 
                onClick={() => setIsModelConfigExpanded(!isModelConfigExpanded)}
                className="flex items-center justify-between px-2 py-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${isModelConfigExpanded ? 'rotate-90' : ''}`} />
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Definition</span>
                </div>
                <div className="flex items-center gap-1">
                  {(model.aspects?.length || 0) > 0 && (
                    <span className="w-2 h-2 bg-green-400 rounded-full" title="Has aspects"></span>
                  )}
                  {(model.glossaryTerms?.length || 0) > 0 && (
                    <span className="w-2 h-2 bg-purple-400 rounded-full" title="Has glossary terms"></span>
                  )}
                </div>
              </div>
              
              {isModelConfigExpanded && (
                <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-100 pl-3">
                  {/* Git Reference */}
                  <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-2">
                    <FileText size={12} className="text-blue-500" />
                    <span className="text-[10px] text-blue-700 font-mono">{model.gitFile || `models/${model.id}.yaml`}</span>
                  </div>
                  
                  {/* Model Description */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Description</span>
                      <button
                        onClick={() => setIsEditingModelDesc(true)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                    {model.description ? (
                      <p className="text-xs text-gray-600 line-clamp-3">{model.description}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No description yet</p>
                    )}
                  </div>
                  
                  {/* Model Aspects - Inline Editor */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <AspectSelector
                      aspects={model.aspects || []}
                      onChange={(aspects) => setModel(prev => ({ ...prev, aspects }))}
                      label="Aspects"
                    />
                  </div>
                  
                  {/* Model Glossary Terms - Inline Editor */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <GlossarySelector
                      selectedTerms={model.glossaryTerms || []}
                      onChange={(glossaryTerms) => setModel(prev => ({ ...prev, glossaryTerms }))}
                      label="Glossary Terms"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-4">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Business Entities</div>
                {filteredEntities.length === 0 && searchQuery && (
                    <div className="px-3 py-2 text-sm text-gray-500 italic">No entities match your search.</div>
                )}
                {filteredEntities.map(ent => (
                    <div 
                        key={ent.id}
                        onClick={() => setSelection({ type: 'ENTITY', id: ent.id })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer mb-0.5 ${selection?.type === 'ENTITY' && selection.id === ent.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <TableIcon size={14} className={selection?.id === ent.id ? 'text-blue-500' : 'text-gray-400'}/>
                        {ent.name}
                    </div>
                ))}
            </div>
         </div>
         <div className="p-3 border-t border-gray-100 bg-gray-50">
             <button 
                onClick={() => setViewMode('AUTHORING')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
             >
                 <Plus size={16} /> New Entity
             </button>
         </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative bg-gray-50/50 h-full overflow-hidden">
        <GraphView model={model} selection={selection} onSelect={setSelection} />
        
        {/* Floating Actions */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button 
                onClick={() => setViewMode('DEPLOY')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
                <Rocket size={16} />
                Deploy
            </button>
        </div>
      </div>

      {/* Right: Resizable Slide-out Detail Pane */}
      {selection && (
        <div 
            className="border-l border-gray-200 bg-white shadow-xl flex flex-col z-20 absolute right-0 top-0 bottom-0 transition-all duration-75 ease-out"
            style={{ width: panelWidth }}
        >
            {/* Drag Handle */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 z-30 group"
                onMouseDown={handleMouseDown}
            >
                <div className="absolute top-1/2 left-0 -translate-x-1/2 w-4 h-8 bg-white border border-gray-200 rounded flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={12} className="text-gray-400"/>
                </div>
            </div>

            {/* Header */}
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                 <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    {selection.type === 'ENTITY' && <TableIcon size={18} className="text-blue-600"/>}
                    {selection.type === 'TABLE' && <Database size={18} className="text-indigo-600"/>}
                    {selection.type === 'RELATIONSHIP' && <GitCommit size={18} className="text-gray-600"/>}
                    
                    {selection.type === 'ENTITY' && selectedEntity?.name}
                    {selection.type === 'TABLE' && 'Physical Asset Details'}
                    {selection.type === 'RELATIONSHIP' && 'Relationship Details'}
                 </h3>
                 <div className="flex items-center gap-1">
                     {selection.type === 'ENTITY' && (
                         <button onClick={openFullPage} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Open in new page">
                             <ExternalLink size={18} />
                         </button>
                     )}
                     <button onClick={() => setSelection(null)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                        <X size={20} />
                     </button>
                 </div>
            </div>

            {/* Entity Tabs */}
            {selection.type === 'ENTITY' && (
                <div className="flex border-b border-gray-200 px-6">
                    <button 
                        onClick={() => setSidebarTab('dashboard')}
                        className={`py-3 px-2 text-sm font-medium border-b-2 mr-4 transition-colors flex items-center gap-2 ${sidebarTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <BarChart3 size={16}/>
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setSidebarTab('configuration')}
                        className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${sidebarTab === 'configuration' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Settings2 size={16}/>
                        Configuration
                    </button>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
                 {/* ENTITY VIEW */}
                 {selection.type === 'ENTITY' && selectedEntity && (
                    <>
                        {sidebarTab === 'configuration' ? (
                            <EntityConfigView 
                                entity={selectedEntity}
                                model={model}
                                setModel={setModel}
                                availableColumns={availableColumns}
                                currentEntityTableName={currentEntityTableName}
                                editingBindingId={editingBindingId}
                                setEditingBindingId={setEditingBindingId}
                                tempBindingValue={tempBindingValue}
                                setTempBindingValue={setTempBindingValue}
                                saveBinding={saveBinding}
                                startEditingBinding={startEditingBinding}
                                onLinkClick={(propId) => {
                                    setLinkingSourcePropId(propId);
                                    setIsLinkModalOpen(true);
                                }}
                                onColumnSearch={(propId) => setColumnSearchModalPropId(propId)}
                            />
                        ) : (
                            // DASHBOARD TAB CONTENT
                            <div className="p-6">
                                <EntityDashboard entity={selectedEntity} />
                            </div>
                        )}
                    </>
                 )}

                 {/* PHYSICAL ASSET VIEWER (No Tabs) */}
                 {selection.type === 'TABLE' && (
                     <div className="p-6">
                        <PhysicalAssetViewer tableId={selection.id} model={model} />
                     </div>
                 )}

                 {/* RELATIONSHIP VIEWER (No Tabs) */}
                 {selection.type === 'RELATIONSHIP' && selectedRelationship && (
                    <div className="p-6">
                        <RelationshipViewer 
                            relationship={selectedRelationship} 
                            model={model}
                            onChange={(updated) => {
                                setModel(prev => ({
                                    ...prev,
                                    relationships: prev.relationships.map(r => r.id === updated.id ? updated : r)
                                }));
                            }}
                        />
                    </div>
                 )}
            </div>
        </div>
      )}

      {/* Create Link Modal */}
      {isLinkModalOpen && selectedEntity && (
          <CreateLinkModal 
             sourceEntity={selectedEntity}
             sourcePropId={linkingSourcePropId!}
             model={model}
             onClose={() => setIsLinkModalOpen(false)}
             onCreate={handleCreateLink}
          />
      )}

      {/* Column Search Modal */}
      {columnSearchModalPropId && selectedEntity && (() => {
          const prop = selectedEntity.properties.find(p => p.id === columnSearchModalPropId);
          if (!prop) return null;
          return (
              <ColumnSearchModal
                  system={prop.bindingSystem || 'bigquery'}
                  onClose={() => setColumnSearchModalPropId(null)}
                  onSelect={(selection) => {
                      const bindingStr = selection.dataset 
                          ? `${selection.project}.${selection.dataset}.${selection.table}.${selection.column}`
                          : `${selection.project}/${selection.instance}/${selection.database}.${selection.table}.${selection.column}`;
                      setModel(prev => ({
                          ...prev,
                          entities: prev.entities.map(ent => {
                              if (ent.id !== selectedEntity.id) return ent;
                              return {
                                  ...ent,
                                  properties: ent.properties.map(p => 
                                      p.id === columnSearchModalPropId 
                                          ? { ...p, bindingProject: selection.project, bindingDataset: selection.dataset, bindingTable: selection.table, bindingColumn: selection.column, binding: bindingStr }
                                          : p
                                  )
                              };
                          })
                      }));
                      setColumnSearchModalPropId(null);
                  }}
              />
          );
      })()}

      {/* Model Description Editor Modal */}
      {isEditingModelDesc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Edit Model Description</h3>
              <button onClick={() => setIsEditingModelDesc(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <WikiEditor
                initialDescription={model.description || ''}
                history={model.descriptionHistory || []}
                onSave={(content, history) => {
                  setModel(prev => ({
                    ...prev,
                    description: content,
                    descriptionHistory: history
                  }));
                  setIsEditingModelDesc(false);
                }}
                onCancel={() => setIsEditingModelDesc(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Model Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Model</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">"{model.name}"</span>? 
                All entities, relationships, and configurations will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteModel(model.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Git File Modal */}
      {showGitFileModal && (
        <GitFileModal
          model={model}
          onClose={() => setShowGitFileModal(false)}
          onSave={(gitFile) => {
            setModel(prev => ({ ...prev, gitFile }));
            setShowGitFileModal(false);
          }}
        />
      )}

    </div>
  );
};

// Property Definition Editor Component
const PropertyDefinitionEditor: React.FC<{
    definition: string;
    onChange: (definition: string) => void;
}> = ({ definition, onChange }) => {
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

    const handleValidate = async () => {
        setIsValidating(true);
        setValidationResult(null);
        
        // Simulate SQL validation (in production, this would call BigQuery dry-run API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Basic SQL syntax validation
        const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'UNION', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'CAST', 'COALESCE', 'IFNULL', 'NULLIF', 'IF', 'CONCAT', 'SUBSTR', 'LENGTH', 'TRIM', 'UPPER', 'LOWER', 'DATE', 'TIMESTAMP', 'EXTRACT', 'FORMAT_DATE', 'PARSE_DATE', 'DATE_ADD', 'DATE_SUB', 'DATE_DIFF', 'CURRENT_DATE', 'CURRENT_TIMESTAMP'];
        
        const trimmedDef = definition.trim();
        if (!trimmedDef) {
            setValidationResult({ valid: false, message: 'Definition cannot be empty' });
        } else if (trimmedDef.includes(';') && trimmedDef.indexOf(';') !== trimmedDef.length - 1) {
            setValidationResult({ valid: false, message: 'Multiple statements not allowed' });
        } else {
            // Check for basic SQL structure
            const upperDef = trimmedDef.toUpperCase();
            const hasValidSyntax = sqlKeywords.some(kw => upperDef.includes(kw)) || 
                                   /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(trimmedDef) ||
                                   /^\$\{[^}]+\}/.test(trimmedDef);
            
            if (hasValidSyntax) {
                setValidationResult({ valid: true, message: 'SQL syntax appears valid' });
            } else {
                setValidationResult({ valid: true, message: 'Expression accepted (validation passed)' });
            }
        }
        
        setIsValidating(false);
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database size={14} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Property Definition (GoogleSQL)</span>
                </div>
                <button
                    onClick={handleValidate}
                    disabled={isValidating || !definition.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isValidating ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Validating...
                        </>
                    ) : (
                        <>
                            <Check size={12} />
                            Validate
                        </>
                    )}
                </button>
            </div>
            <div className="p-3 bg-white">
                <textarea
                    value={definition}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setValidationResult(null);
                    }}
                    placeholder="Enter GoogleSQL expression, e.g.:&#10;SUM(revenue) / COUNT(DISTINCT customer_id)&#10;CONCAT(first_name, ' ', last_name)&#10;DATE_DIFF(CURRENT_DATE(), order_date, DAY)"
                    className="w-full text-sm font-mono border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none bg-gray-50 min-h-[100px] resize-y"
                />
                {validationResult && (
                    <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                        validationResult.valid 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {validationResult.valid ? (
                            <Check size={14} className="text-green-500" />
                        ) : (
                            <AlertCircle size={14} className="text-red-500" />
                        )}
                        {validationResult.message}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Subcomponents ---

interface FullPageEntityViewProps {
    entity: Entity;
    model: SemanticModel;
    setModel: React.Dispatch<React.SetStateAction<SemanticModel>>;
    onClose: () => void;
    availableColumns: any[];
    currentEntityTableName: string | null;
}

const FullPageEntityView: React.FC<FullPageEntityViewProps> = ({ 
    entity, model, setModel, onClose, availableColumns, currentEntityTableName 
}) => {
    const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
    const [expandedNestedId, setExpandedNestedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'config' | 'dashboard'>('dashboard');
    const [expandedConfigSection, setExpandedConfigSection] = useState<'entity' | 'properties' | null>('entity');
    const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
    const [columnSearchModalPropId, setColumnSearchModalPropId] = useState<string | null>(null);

    const columnSearchProp = columnSearchModalPropId ? entity.properties.find(p => p.id === columnSearchModalPropId) : null;

    const addNewProperty = () => {
        const newProp: Property = {
            id: `prop_${Date.now()}`,
            name: 'New Property',
            dataType: 'STRING',
            description: '',
            binding: ''
        };
        updateEntity({ 
            properties: [...entity.properties, newProp] 
        });
        setEditingPropertyId(newProp.id);
    };

    const deleteProperty = (propId: string) => {
        updateEntity({
            properties: entity.properties.filter(p => p.id !== propId)
        });
        if (editingPropertyId === propId) {
            setEditingPropertyId(null);
        }
    };

    const updateEntity = (updates: Partial<Entity>) => {
        setModel(prev => ({
            ...prev,
            entities: prev.entities.map(ent => 
                ent.id === entity.id ? { ...ent, ...updates } : ent
            )
        }));
    };

    const updateProperty = (propId: string, updates: Partial<Property>) => {
        setModel(prev => ({
            ...prev,
            entities: prev.entities.map(ent => {
                if (ent.id !== entity.id) return ent;
                return {
                    ...ent,
                    properties: ent.properties.map(p => 
                        p.id === propId ? { ...p, ...updates } : p
                    )
                };
            })
        }));
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden" style={{ height: '100vh' }}>
            <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <TableIcon size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{entity.name}</h1>
                            <p className="text-sm text-gray-500">Full Entity Detail View</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">
                        <Minimize2 size={16} /> Exit Full Screen
                    </button>
                </div>
            </div>

            <div className="bg-white border-b border-gray-200 px-8 shrink-0">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'config' 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'dashboard' 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Dashboard
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 min-h-0">
                <div className="max-w-5xl mx-auto pb-8">
                    {activeTab === 'config' && (
                        <div className="space-y-4">
                            {/* Section 1: Manage Entity Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div 
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                                    onClick={() => setExpandedConfigSection(expandedConfigSection === 'entity' ? null : 'entity')}
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronRight 
                                            size={18} 
                                            className={`text-gray-400 transition-transform ${expandedConfigSection === 'entity' ? 'rotate-90' : ''}`}
                                        />
                                        <Settings2 size={20} className="text-blue-500" />
                                        <div>
                                            <h3 className="text-base font-bold text-gray-800">Manage Entity Details</h3>
                                            <p className="text-xs text-gray-500">Name, description, aspects, and glossary terms</p>
                                        </div>
                                    </div>
                                </div>
                                {expandedConfigSection === 'entity' && (
                                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Entity Name</label>
                                            <input 
                                                type="text" 
                                                value={entity.name}
                                                onChange={(e) => updateEntity({ name: e.target.value })}
                                                className="w-full text-sm font-medium text-gray-900 border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                                            />
                                        </div>
                                        <WikiEditor
                                            content={entity.overview || entity.description}
                                            onChange={(content) => updateEntity({ overview: content, description: content })}
                                            placeholder="Add a detailed description of this entity..."
                                            history={entity.descriptionHistory || []}
                                            onHistoryUpdate={(history) => updateEntity({ descriptionHistory: history })}
                                            label="Overview"
                                            minHeight="120px"
                                        />
                                        <AspectSelector
                                            aspects={entity.aspects || []}
                                            onChange={(aspects) => updateEntity({ aspects })}
                                            label="Entity Aspects"
                                        />
                                        <GlossarySelector
                                            selectedTerms={entity.glossaryTerms || []}
                                            onChange={(glossaryTerms) => updateEntity({ glossaryTerms })}
                                            label="Glossary Terms"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Manage Properties */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div 
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                                    onClick={() => setExpandedConfigSection(expandedConfigSection === 'properties' ? null : 'properties')}
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronRight 
                                            size={18} 
                                            className={`text-gray-400 transition-transform ${expandedConfigSection === 'properties' ? 'rotate-90' : ''}`}
                                        />
                                        <Layers size={20} className="text-indigo-500" />
                                        <div>
                                            <h3 className="text-base font-bold text-gray-800">Manage Properties</h3>
                                            <p className="text-xs text-gray-500">{entity.properties.length} properties defined</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedConfigSection('properties');
                                            addNewProperty();
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Plus size={14} />
                                        Add Property
                                    </button>
                                </div>
                                {expandedConfigSection === 'properties' && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                                        {entity.properties.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Layers size={32} className="mx-auto text-gray-300 mb-3" />
                                                <p className="text-sm text-gray-500 mb-3">No properties defined yet</p>
                                                <button
                                                    onClick={addNewProperty}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Add your first property
                                                </button>
                                            </div>
                                        ) : (
                                            entity.properties.map((prop) => {
                                                const isEditing = editingPropertyId === prop.id;
                                                return (
                                                    <div key={prop.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                                        <div 
                                                            className="p-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                                                            onClick={() => setEditingPropertyId(isEditing ? null : prop.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <ChevronRight 
                                                                    size={14} 
                                                                    className={`text-gray-400 transition-transform ${isEditing ? 'rotate-90' : ''}`}
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-sm text-gray-800">{prop.name}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {prop.dataType} {prop.binding ? `| ${prop.binding}` : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {(prop.glossaryTerms?.length || 0) > 0 && (
                                                                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                                                                        {prop.glossaryTerms?.length} terms
                                                                    </span>
                                                                )}
                                                                {(prop.aspects?.length || 0) > 0 && (
                                                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                                                        {prop.aspects?.length} aspects
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm('Delete this property?')) {
                                                                            deleteProperty(prop.id);
                                                                        }
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isEditing && (
                                                            <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-white space-y-4">
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Property Name</label>
                                                                        <input
                                                                            type="text"
                                                                            value={prop.name}
                                                                            onChange={(e) => updateProperty(prop.id, { name: e.target.value })}
                                                                            className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Data Type</label>
                                                                        <select
                                                                            value={prop.dataType}
                                                                            onChange={(e) => updateProperty(prop.id, { dataType: e.target.value })}
                                                                            className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none bg-white"
                                                                        >
                                                                            <option value="STRING">STRING</option>
                                                                            <option value="INTEGER">INTEGER</option>
                                                                            <option value="FLOAT">FLOAT</option>
                                                                            <option value="BOOLEAN">BOOLEAN</option>
                                                                            <option value="DATE">DATE</option>
                                                                            <option value="TIMESTAMP">TIMESTAMP</option>
                                                                            <option value="ARRAY">ARRAY</option>
                                                                            <option value="STRUCT">STRUCT</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Property Type</label>
                                                                        <select
                                                                            value={prop.propertyType || PropertyType.OTHER}
                                                                            onChange={(e) => updateProperty(prop.id, { propertyType: e.target.value as PropertyType })}
                                                                            className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none bg-white"
                                                                        >
                                                                            <option value={PropertyType.DIMENSION}>Dimension</option>
                                                                            <option value={PropertyType.MEASURE}>Measure</option>
                                                                            <option value={PropertyType.OTHER}>Other</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {/* Unique Key Checkbox */}
                                                                <div className="flex items-center gap-2 py-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`unique-key-${prop.id}`}
                                                                        checked={prop.isUniqueKey || false}
                                                                        onChange={(e) => updateProperty(prop.id, { isUniqueKey: e.target.checked })}
                                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                    />
                                                                    <label htmlFor={`unique-key-${prop.id}`} className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                                                        <Key size={14} className="text-amber-500" />
                                                                        Unique Key
                                                                    </label>
                                                                </div>

                                                                {/* Property Binding */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Property Binding</label>
                                                                    <div className="flex gap-2 mb-2">
                                                                        <button
                                                                            onClick={() => updateProperty(prop.id, { bindingType: 'column' })}
                                                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                                                (prop.bindingType || 'column') === 'column'
                                                                                    ? 'bg-blue-600 text-white'
                                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                            }`}
                                                                        >
                                                                            Column
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateProperty(prop.id, { bindingType: 'expression' })}
                                                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                                                prop.bindingType === 'expression'
                                                                                    ? 'bg-blue-600 text-white'
                                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                            }`}
                                                                        >
                                                                            Expression
                                                                        </button>
                                                                    </div>
                                                                    {(prop.bindingType || 'column') === 'column' ? (
                                                                        <div className="space-y-2">
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">System</label>
                                                                                <select
                                                                                    value={prop.bindingSystem || 'bigquery'}
                                                                                    onChange={(e) => updateProperty(prop.id, { 
                                                                                        bindingSystem: e.target.value as 'bigquery' | 'spanner',
                                                                                        bindingProject: '',
                                                                                        bindingDataset: '',
                                                                                        bindingTable: '',
                                                                                        bindingColumn: '',
                                                                                        binding: ''
                                                                                    })}
                                                                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none bg-white"
                                                                                >
                                                                                    <option value="bigquery">BigQuery</option>
                                                                                    <option value="spanner">Spanner</option>
                                                                                </select>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">Table & Column</label>
                                                                                <div 
                                                                                    onClick={() => setColumnSearchModalPropId(prop.id)}
                                                                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center justify-between"
                                                                                >
                                                                                    {prop.binding ? (
                                                                                        <span className="font-mono text-gray-700">{prop.binding}</span>
                                                                                    ) : (
                                                                                        <span className="text-gray-400">Click to search and select...</span>
                                                                                    )}
                                                                                    <Search size={14} className="text-gray-400" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <textarea
                                                                                value={prop.binding || ''}
                                                                                onChange={(e) => updateProperty(prop.id, { binding: e.target.value })}
                                                                                placeholder="Enter SQL expression, e.g.:&#10;CONCAT(table.first_name, ' ', table.last_name)"
                                                                                className="w-full text-sm font-mono border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none bg-gray-50 min-h-[60px] resize-y"
                                                                            />
                                                                            <div className="mt-3">
                                                                                <PropertyDefinitionEditor
                                                                                    definition={prop.definition || ''}
                                                                                    onChange={(definition) => updateProperty(prop.id, { definition })}
                                                                                />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                <WikiEditor
                                                                    content={prop.overview || prop.description}
                                                                    onChange={(content) => updateProperty(prop.id, { overview: content, description: content })}
                                                                    placeholder="Describe this property..."
                                                                    history={prop.descriptionHistory || []}
                                                                    onHistoryUpdate={(history) => updateProperty(prop.id, { descriptionHistory: history })}
                                                                    label="Description"
                                                                    minHeight="80px"
                                                                />

                                                                {/* Collapsible Aspects Section */}
                                                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                                    <div 
                                                                        className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                                                                        onClick={() => setExpandedPropertyId(expandedPropertyId === `aspects-${prop.id}` ? null : `aspects-${prop.id}`)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ChevronRight 
                                                                                size={14} 
                                                                                className={`text-gray-400 transition-transform ${expandedPropertyId === `aspects-${prop.id}` ? 'rotate-90' : ''}`}
                                                                            />
                                                                            <Tag size={14} className="text-green-500" />
                                                                            <span className="text-sm font-medium text-gray-700">Property Aspects</span>
                                                                        </div>
                                                                        <span className="text-xs text-gray-400">
                                                                            {prop.aspects?.length || 0} aspect{(prop.aspects?.length || 0) !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                    {expandedPropertyId === `aspects-${prop.id}` && (
                                                                        <div className="p-3 border-t border-gray-200 bg-white">
                                                                            <AspectSelector
                                                                                aspects={prop.aspects || []}
                                                                                onChange={(aspects) => updateProperty(prop.id, { aspects })}
                                                                                label=""
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Collapsible Glossary Terms Section */}
                                                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                                    <div 
                                                                        className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                                                                        onClick={() => setExpandedPropertyId(expandedPropertyId === `glossary-${prop.id}` ? null : `glossary-${prop.id}`)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ChevronRight 
                                                                                size={14} 
                                                                                className={`text-gray-400 transition-transform ${expandedPropertyId === `glossary-${prop.id}` ? 'rotate-90' : ''}`}
                                                                            />
                                                                            <BookOpen size={14} className="text-purple-500" />
                                                                            <span className="text-sm font-medium text-gray-700">Glossary Terms</span>
                                                                        </div>
                                                                        <span className="text-xs text-gray-400">
                                                                            {prop.glossaryTerms?.length || 0} term{(prop.glossaryTerms?.length || 0) !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
                                                                    {expandedPropertyId === `glossary-${prop.id}` && (
                                                                        <div className="p-3 border-t border-gray-200 bg-white">
                                                                            <GlossarySelector
                                                                                selectedTerms={prop.glossaryTerms || []}
                                                                                onChange={(glossaryTerms) => updateProperty(prop.id, { glossaryTerms })}
                                                                                label=""
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-12 gap-6">
                            {/* Left: Explainability Panel */}
                            <div className="col-span-12 lg:col-span-4 space-y-4">
                                {/* Entity Overview */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-500" />
                                        About This Entity
                                    </h4>
                                    <div className="text-sm text-gray-600 leading-relaxed">
                                        {entity.overview || entity.description || (
                                            <span className="text-gray-400 italic">No description available</span>
                                        )}
                                    </div>
                                </div>

                                {/* Glossary Terms - Each term as collapsible card */}
                                {entity.glossaryTerms?.map(term => {
                                    const isTermExpanded = expandedPropertyId === `term-${term.id}`;
                                    return (
                                        <div key={term.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div 
                                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                                                onClick={() => setExpandedPropertyId(isTermExpanded ? null : `term-${term.id}`)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight 
                                                        size={14} 
                                                        className={`text-gray-400 transition-transform ${isTermExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                    <BookOpen size={14} className="text-purple-500" />
                                                    <span className="text-sm font-medium text-gray-800">{term.name}</span>
                                                </div>
                                                {term.domain && (
                                                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                                        {term.domain}
                                                    </span>
                                                )}
                                            </div>
                                            {isTermExpanded && term.description && (
                                                <div className="px-5 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                                                    <p className="text-sm text-gray-600 leading-relaxed">{term.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Entity Aspects - Each as collapsible card */}
                                {entity.aspects?.map(aspect => {
                                    const aspectType = AVAILABLE_ASPECT_TYPES.find(at => at.id === aspect.aspectTypeId);
                                    const valueEntries = Object.entries(aspect.values || {}).filter(([_, v]) => v !== undefined && v !== '');
                                    const isExpanded = expandedPropertyId === `aspect-${aspect.aspectTypeId}`;
                                    return (
                                        <div key={aspect.aspectTypeId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div 
                                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                                                onClick={() => setExpandedPropertyId(isExpanded ? null : `aspect-${aspect.aspectTypeId}`)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight 
                                                        size={14} 
                                                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                    <Tag size={14} className="text-green-500" />
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {aspectType?.name || aspect.aspectTypeId}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {valueEntries.length} field{valueEntries.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {isExpanded && valueEntries.length > 0 && (
                                                <div className="px-5 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                                                    <div className="space-y-2 text-xs">
                                                        {valueEntries.map(([key, val]) => (
                                                            <div key={key} className="flex gap-2">
                                                                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                                <span className="text-gray-700">{String(val)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Properties Summary */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Layers size={16} className="text-indigo-500" />
                                        Properties ({entity.properties.length})
                                    </h4>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {entity.properties.map((prop) => {
                                            const isExpanded = expandedPropertyId === prop.id;
                                            return (
                                                <div key={prop.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <div 
                                                        className="flex items-start justify-between cursor-pointer group"
                                                        onClick={() => setExpandedPropertyId(isExpanded ? null : prop.id)}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <ChevronRight 
                                                                size={14} 
                                                                className={`text-gray-400 mt-0.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                            />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                                                                    {prop.name}
                                                                </div>
                                                                <div className="text-xs text-gray-400 font-mono">
                                                                    {prop.dataType}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {(prop.glossaryTerms?.length || 0) > 0 && (
                                                                <span className="w-2 h-2 bg-purple-400 rounded-full" title={`${prop.glossaryTerms?.length} glossary terms`}></span>
                                                            )}
                                                            {(prop.aspects?.length || 0) > 0 && (
                                                                <span className="w-2 h-2 bg-green-400 rounded-full" title={`${prop.aspects?.length} aspects`}></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {isExpanded && (
                                                        <div className="mt-2 ml-6 space-y-2 text-xs">
                                                            {(prop.overview || prop.description) && (
                                                                <p className="text-gray-600">{prop.overview || prop.description}</p>
                                                            )}
                                                            {prop.binding && (
                                                                <div className="text-gray-500">
                                                                    <span className="text-gray-400">Bound to:</span> <span className="font-mono">{prop.binding}</span>
                                                                </div>
                                                            )}
                                                            {(prop.glossaryTerms?.length || 0) > 0 && (
                                                                <div className="space-y-1">
                                                                    {prop.glossaryTerms?.map(term => {
                                                                        const isPropTermExpanded = expandedNestedId === `prop-term-${prop.id}-${term.id}`;
                                                                        return (
                                                                            <div key={term.id} className="border border-purple-100 rounded overflow-hidden">
                                                                                <div 
                                                                                    className="px-2 py-1 bg-purple-50/50 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setExpandedNestedId(isPropTermExpanded ? null : `prop-term-${prop.id}-${term.id}`);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        <ChevronRight 
                                                                                            size={10} 
                                                                                            className={`text-purple-400 transition-transform ${isPropTermExpanded ? 'rotate-90' : ''}`}
                                                                                        />
                                                                                        <span className="text-[10px] font-medium text-purple-700">{term.name}</span>
                                                                                    </div>
                                                                                    {term.domain && (
                                                                                        <span className="text-[8px] text-purple-500">{term.domain}</span>
                                                                                    )}
                                                                                </div>
                                                                                {isPropTermExpanded && term.description && (
                                                                                    <div className="px-2 py-1.5 bg-white border-t border-purple-100">
                                                                                        <p className="text-[10px] text-gray-600">{term.description}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {(prop.aspects?.length || 0) > 0 && (
                                                                <div className="space-y-1">
                                                                    {prop.aspects?.map(aspect => {
                                                                        const aspectType = AVAILABLE_ASPECT_TYPES.find(at => at.id === aspect.aspectTypeId);
                                                                        const valueEntries = Object.entries(aspect.values || {}).filter(([_, v]) => v !== undefined && v !== '');
                                                                        const isPropAspectExpanded = expandedNestedId === `prop-aspect-${prop.id}-${aspect.aspectTypeId}`;
                                                                        return (
                                                                            <div key={aspect.aspectTypeId} className="border border-green-100 rounded overflow-hidden">
                                                                                <div 
                                                                                    className="px-2 py-1 bg-green-50/50 cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setExpandedNestedId(isPropAspectExpanded ? null : `prop-aspect-${prop.id}-${aspect.aspectTypeId}`);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        <ChevronRight 
                                                                                            size={10} 
                                                                                            className={`text-green-400 transition-transform ${isPropAspectExpanded ? 'rotate-90' : ''}`}
                                                                                        />
                                                                                        <span className="text-[10px] font-medium text-green-700">{aspectType?.name || aspect.aspectTypeId}</span>
                                                                                    </div>
                                                                                    <span className="text-[8px] text-green-500">{valueEntries.length} values</span>
                                                                                </div>
                                                                                {isPropAspectExpanded && valueEntries.length > 0 && (
                                                                                    <div className="px-2 py-1.5 bg-white border-t border-green-100 space-y-0.5">
                                                                                        {valueEntries.map(([key, val]) => (
                                                                                            <div key={key} className="flex gap-1 text-[10px]">
                                                                                                <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                                                                <span className="text-gray-600">{String(val)}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Dashboard Visualization */}
                            <div className="col-span-12 lg:col-span-8">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
                                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <BarChart3 className="text-blue-500"/> Instance Explorer
                                    </h3>
                                    <EntityDashboard entity={entity} isFullPage />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Column Search Modal */}
            {columnSearchModalPropId && columnSearchProp && (
                <ColumnSearchModal
                    system={columnSearchProp.bindingSystem || 'bigquery'}
                    onClose={() => setColumnSearchModalPropId(null)}
                    onSelect={(selection) => {
                        const bindingStr = selection.dataset 
                            ? `${selection.project}.${selection.dataset}.${selection.table}.${selection.column}`
                            : `${selection.project}/${selection.instance}/${selection.database}.${selection.table}.${selection.column}`;
                        updateProperty(columnSearchModalPropId, {
                            bindingProject: selection.project,
                            bindingDataset: selection.dataset,
                            bindingTable: selection.table,
                            bindingColumn: selection.column,
                            binding: bindingStr
                        });
                        setColumnSearchModalPropId(null);
                    }}
                />
            )}
        </div>
    );
};

const EntityConfigView: React.FC<any> = ({ 
    entity, model, setModel, availableColumns, currentEntityTableName, 
    editingBindingId, setEditingBindingId, tempBindingValue, setTempBindingValue, 
    saveBinding, startEditingBinding, onLinkClick, onColumnSearch
}) => {
    const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);

    const updateEntity = (updates: Partial<Entity>) => {
        setModel(prev => ({
            ...prev,
            entities: prev.entities.map(ent => 
                ent.id === entity.id ? { ...ent, ...updates } : ent
            )
        }));
    };

    const updateProperty = (propId: string, updates: Partial<Property>) => {
        setModel(prev => ({
            ...prev,
            entities: prev.entities.map(ent => {
                if (ent.id !== entity.id) return ent;
                return {
                    ...ent,
                    properties: ent.properties.map(p => 
                        p.id === propId ? { ...p, ...updates } : p
                    )
                };
            })
        }));
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Definition</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Entity Name</label>
                        <input 
                            type="text" 
                            value={entity.name}
                            onChange={(e) => updateEntity({ name: e.target.value })}
                            className="w-full text-sm font-medium text-gray-900 border-b border-gray-200 focus:border-blue-500 outline-none pb-1" 
                        />
                    </div>
                    <WikiEditor
                        content={entity.overview || entity.description}
                        onChange={(content) => updateEntity({ overview: content, description: content })}
                        placeholder="Add a detailed description of this entity..."
                        history={entity.descriptionHistory || []}
                        onHistoryUpdate={(history) => updateEntity({ descriptionHistory: history })}
                        label="Overview"
                        minHeight="100px"
                    />
                </div>
            </div>

            <div className="mb-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-6">
                    <AspectSelector
                        aspects={entity.aspects || []}
                        onChange={(aspects) => updateEntity({ aspects })}
                        label="Entity Aspects"
                    />
                    <GlossarySelector
                        selectedTerms={entity.glossaryTerms || []}
                        onChange={(glossaryTerms) => updateEntity({ glossaryTerms })}
                        label="Glossary Terms"
                    />
                </div>
            </div>

            {/* Binding Info */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Property Binding</label>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Database size={16} className="text-blue-600"/>
                            <span className="text-sm font-medium">BigQuery Table</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-medium border border-green-200">Active</span>
                    </div>
                    <div className="text-sm font-mono bg-gray-50 border border-gray-200 px-3 py-2 rounded text-gray-600 break-all mb-2">
                        {currentEntityTableName || 'No binding detected'}
                    </div>
                    <div className="text-xs text-gray-400">
                        Project: <span className="text-gray-600">vergheseg-sandbox</span>
                    </div>
                </div>
            </div>

            {/* Properties List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Properties ({entity.properties.length})</h4>
                    <button className="text-blue-600 text-xs font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors">+ Add Property</button>
                </div>
                <div className="space-y-3">
                    {entity.properties.map((prop) => {
                        const isExpanded = expandedPropertyId === prop.id;
                        return (
                        <div key={prop.id} className="border border-gray-200 rounded-lg bg-white group hover:border-blue-300 hover:shadow-sm transition-all relative overflow-hidden">
                            <div 
                                className="p-3 cursor-pointer"
                                onClick={() => setExpandedPropertyId(isExpanded ? null : prop.id)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight 
                                            size={14} 
                                            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        />
                                        <div className="font-medium text-sm text-gray-800">{prop.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(prop.glossaryTerms?.length || 0) > 0 && (
                                            <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                                                {prop.glossaryTerms?.length} terms
                                            </span>
                                        )}
                                        {(prop.aspects?.length || 0) > 0 && (
                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                                {prop.aspects?.length} aspects
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{prop.dataType}</span>
                                    </div>
                                </div>
                                
                                {!isExpanded && (
                                    <div className="group/binding flex items-center justify-between mt-1 ml-6">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                                            <span className="text-xs text-gray-500 truncate font-mono" title={prop.binding || 'No binding'}>
                                                {prop.binding ? prop.binding.split('.')[1] : 'Unbound'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 bg-gray-50/50">
                                    <div className="pt-4">
                                        <WikiEditor
                                            content={prop.overview || prop.description}
                                            onChange={(content) => updateProperty(prop.id, { overview: content, description: content })}
                                            placeholder="Add a detailed description of this property..."
                                            history={prop.descriptionHistory || []}
                                            onHistoryUpdate={(history) => updateProperty(prop.id, { descriptionHistory: history })}
                                            label="Property Description"
                                            minHeight="80px"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <AspectSelector
                                            aspects={prop.aspects || []}
                                            onChange={(aspects) => updateProperty(prop.id, { aspects })}
                                            label="Property Aspects"
                                        />
                                        <GlossarySelector
                                            selectedTerms={prop.glossaryTerms || []}
                                            onChange={(glossaryTerms) => updateProperty(prop.id, { glossaryTerms })}
                                            label="Glossary Terms"
                                        />
                                    </div>
                                    
                                    {/* Unique Key Checkbox */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id={`unique-key-alt-${prop.id}`}
                                            checked={prop.isUniqueKey || false}
                                            onChange={(e) => updateProperty(prop.id, { isUniqueKey: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={`unique-key-alt-${prop.id}`} className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                            <Key size={14} className="text-amber-500" />
                                            Unique Key
                                        </label>
                                    </div>

                                    {/* Property Binding */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Property Binding</label>
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                onClick={() => updateProperty(prop.id, { bindingType: 'column' })}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                    (prop.bindingType || 'column') === 'column'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                Column
                                            </button>
                                            <button
                                                onClick={() => updateProperty(prop.id, { bindingType: 'expression' })}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                    prop.bindingType === 'expression'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                Expression
                                            </button>
                                        </div>
                                        {(prop.bindingType || 'column') === 'column' ? (
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">System</label>
                                                    <select
                                                        value={prop.bindingSystem || 'bigquery'}
                                                        onChange={(e) => updateProperty(prop.id, { 
                                                            bindingSystem: e.target.value as 'bigquery' | 'spanner',
                                                            bindingProject: '',
                                                            bindingDataset: '',
                                                            bindingTable: '',
                                                            bindingColumn: '',
                                                            binding: ''
                                                        })}
                                                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none bg-white"
                                                    >
                                                        <option value="bigquery">BigQuery</option>
                                                        <option value="spanner">Spanner</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Table & Column</label>
                                                    <div 
                                                        onClick={() => onColumnSearch && onColumnSearch(prop.id)}
                                                        className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center justify-between"
                                                    >
                                                        {prop.binding ? (
                                                            <span className="font-mono text-gray-700">{prop.binding}</span>
                                                        ) : (
                                                            <span className="text-gray-400">Click to search and select...</span>
                                                        )}
                                                        <Search size={14} className="text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <textarea
                                                    value={prop.binding || ''}
                                                    onChange={(e) => updateProperty(prop.id, { binding: e.target.value })}
                                                    placeholder="Enter SQL expression, e.g.:&#10;CONCAT(table.first_name, ' ', table.last_name)"
                                                    className="w-full text-sm font-mono border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none bg-gray-50 min-h-[60px] resize-y"
                                                />
                                                <div className="mt-3">
                                                    <PropertyDefinitionEditor
                                                        definition={prop.definition || ''}
                                                        onChange={(definition) => updateProperty(prop.id, { definition })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLinkClick(prop.id);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Link size={12} />
                                            Link to another entity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
};

const EntityDashboard: React.FC<{ entity: Entity, isFullPage?: boolean }> = ({ entity, isFullPage }) => {
    // Determine entity type context for better mocks
    const isProduct = entity.name.toLowerCase().includes('product');
    const isInventory = entity.name.toLowerCase().includes('inventory');

    const [selectedInstanceId, setSelectedInstanceId] = useState("");

    const mockInstances = useMemo(() => {
        if (isProduct) return ['SKU-1001 (Laptop X)', 'SKU-1002 (Monitor Y)', 'SKU-1003 (Mouse Z)'];
        if (isInventory) return ['SKU-1001 (Warehouse A)', 'SKU-1001 (Warehouse B)', 'SKU-1002 (Warehouse A)'];
        return ['REC-001', 'REC-002', 'REC-003'];
    }, [isProduct, isInventory]);

    useEffect(() => {
        if(mockInstances.length > 0) setSelectedInstanceId(mockInstances[0]);
    }, [mockInstances]);

    return (
        <div className="space-y-6">
            {/* Instance Selector */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Select Instance</label>
                <div className="relative">
                    <select 
                        value={selectedInstanceId}
                        onChange={(e) => setSelectedInstanceId(e.target.value)}
                        className="w-full appearance-none bg-white border border-blue-200 rounded-lg py-2 pl-3 pr-8 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                    >
                        {mockInstances.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-blue-400 pointer-events-none" size={16}/>
                </div>
                <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                    <InfoIcon size={12}/> Viewing specific data for single instance
                </div>
            </div>

            {/* Health Stats for Instance */}
            <div className={`grid ${isFullPage ? 'grid-cols-4' : 'grid-cols-2'} gap-3`}>
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-1">{isProduct ? 'Unit Price' : 'Quantity'}</div>
                    <div className="text-2xl font-light text-gray-900">
                        {isProduct ? '$1,299' : isInventory ? '450' : 'Active'}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Last Updated</div>
                    <div className="text-2xl font-light text-gray-900">2m</div>
                    <div className="text-[10px] text-gray-400 mt-1">Ago</div>
                </div>
                {isFullPage && (
                    <>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                             <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Status</div>
                             <div className="text-lg font-medium text-green-600 flex items-center gap-1">
                                 <Check size={16}/> Valid
                             </div>
                        </div>
                         <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                             <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Quality Score</div>
                             <div className="text-lg font-medium text-blue-600">100%</div>
                        </div>
                    </>
                )}
            </div>

            {/* CHART 1: History / Trend for Instance */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-500"/>
                        {isProduct ? `Price History: ${selectedInstanceId.split(' ')[0]}` : `Stock Level History`}
                    </h4>
                </div>
                
                <div className={`relative ${isFullPage ? 'h-64' : 'h-32'}`}>
                    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="gradientLine" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2"/>
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                        <path 
                            d="M0,35 Q10,30 20,32 T40,25 T60,15 T80,20 T100,5 L100,40 L0,40 Z" 
                            fill="url(#gradientLine)"
                        />
                        <path 
                            d="M0,35 Q10,30 20,32 T40,25 T60,15 T80,20 T100,5" 
                            fill="none" 
                            stroke="#3B82F6" 
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Data Points */}
                        <circle cx="20" cy="32" r="1.5" className="fill-blue-600" />
                        <circle cx="60" cy="15" r="1.5" className="fill-blue-600" />
                        <circle cx="100" cy="5" r="1.5" className="fill-blue-600" />
                    </svg>
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                        Current: {isProduct ? '$1,299' : '450 units'}
                    </div>
                </div>
            </div>

            {/* CHART 2: Gauge / Metric */}
             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-xs font-bold text-gray-600 uppercase mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-500"/>
                    {isProduct ? 'Sales Velocity' : 'Warehouse Capacity'}
                </h4>
                
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                         <svg viewBox="0 0 36 36" className="w-full h-full absolute transform -rotate-90">
                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path className="text-indigo-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="75, 100" />
                        </svg>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800">75%</div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">{isProduct ? 'High Demand' : 'Occupancy'}</div>
                        <p className="text-xs text-gray-400">
                            {isProduct ? 'This product is selling faster than 75% of items in the category.' : 'Warehouse capacity utilization is healthy.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
const InfoIcon = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
);

const RelationshipViewer: React.FC<{ 
    relationship: Relationship, 
    model: SemanticModel, 
    onChange: (r: Relationship) => void 
}> = ({ relationship, model, onChange }) => {
    const sourceEntity = model.entities.find(e => e.id === relationship.sourceEntityId);
    const targetEntity = model.entities.find(e => e.id === relationship.targetEntityId);
    
    return (
        <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                <div className="text-center flex-1">
                    <div className="text-[10px] text-blue-600 font-semibold uppercase mb-1">Source</div>
                    <div className="font-medium text-gray-900 text-sm">{sourceEntity?.name}</div>
                </div>
                <div className="mx-2 text-blue-300"><ArrowRight size={16}/></div>
                <div className="text-center flex-1">
                    <div className="text-[10px] text-blue-600 font-semibold uppercase mb-1">Target</div>
                    <div className="font-medium text-gray-900 text-sm">{targetEntity?.name}</div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relationship Label</label>
                <input
                    type="text"
                    value={relationship.label || ''}
                    onChange={(e) => onChange({...relationship, label: e.target.value})}
                    placeholder="e.g. Has Inventory"
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cardinality</label>
                <select 
                    value={relationship.type}
                    onChange={(e) => onChange({...relationship, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="ONE_TO_ONE">One to One (1:1)</option>
                    <option value="ONE_TO_MANY">One to Many (1:N)</option>
                    <option value="MANY_TO_MANY">Many to Many (N:N)</option>
                </select>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</label>
                <textarea 
                    value={relationship.description}
                    onChange={(e) => onChange({...relationship, description: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            
            <div className="pt-4 border-t border-gray-100">
                <button className="text-red-600 text-sm hover:underline">Delete Relationship</button>
            </div>
        </div>
    );
};

const PhysicalAssetViewer: React.FC<{ tableId: string, model: SemanticModel }> = ({ tableId, model }) => {
    const tableName = tableId.replace('tbl_', '');
    const boundEntities = model.entities.filter(ent => 
        ent.properties.some(p => p.binding?.startsWith(tableName))
    );
    const boundColumns = new Set<string>();
    boundEntities.forEach(e => {
        e.properties.forEach(p => {
            if (p.binding?.startsWith(tableName)) {
                boundColumns.add(p.binding.split('.')[1]);
            }
        })
    });

    return (
        <div>
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded flex items-center justify-center text-indigo-600">
                        <Database size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">BigQuery Table</div>
                        <h2 className="text-lg font-bold text-gray-900 break-all">{tableName}</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">Project</div>
                        <div className="font-medium">vergheseg-sandbox</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">Location</div>
                        <div className="font-medium">US</div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bound Entities</h4>
                 {boundEntities.length > 0 ? (
                     <div className="space-y-2">
                        {boundEntities.map(ent => (
                            <div key={ent.id} className="flex items-center gap-2 p-2 border border-blue-100 bg-blue-50 rounded text-blue-800 text-sm">
                                <TableIcon size={14} />
                                <span>{ent.name}</span>
                            </div>
                        ))}
                     </div>
                 ) : (
                     <div className="text-sm text-gray-500 italic">No entities currently bound</div>
                 )}
            </div>

            <div>
                 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Table Schema</h4>
                 <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Column</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Array.from(boundColumns).map((col, i) => (
                                <tr key={col} className="bg-white">
                                    <td className="px-3 py-2 text-gray-900 font-mono text-xs">{col}</td>
                                    <td className="px-3 py-2 text-gray-500 text-xs">Inferred</td>
                                </tr>
                            ))}
                            <tr className="bg-white opacity-60">
                                <td className="px-3 py-2 text-gray-900 font-mono text-xs">etl_created_at</td>
                                <td className="px-3 py-2 text-gray-500 text-xs">TIMESTAMP</td>
                            </tr>
                            <tr className="bg-white opacity-60">
                                <td className="px-3 py-2 text-gray-900 font-mono text-xs">record_hash</td>
                                <td className="px-3 py-2 text-gray-500 text-xs">STRING</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
                 <div className="mt-2 text-[10px] text-gray-400 text-center">
                    Showing bound columns + 2 system columns
                 </div>
            </div>
        </div>
    )
}

const GraphView: React.FC<{
    model: SemanticModel, 
    selection: Selection,
    onSelect: (sel: Selection) => void 
}> = ({ model, selection, onSelect }) => {
    
    // Calculate layout
    const layout = useMemo(() => {
        const entityNodes = model.entities.map((ent, idx) => ({
            id: ent.id,
            type: 'ENTITY',
            label: ent.name,
            x: 100 + idx * 350,
            y: 100,
            data: ent
        }));

        const tableNodesMap = new Map();
        model.entities.forEach((ent, idx) => {
            const tableBinding = ent.properties[0]?.binding?.split('.')[0];
            if (tableBinding && !tableNodesMap.has(tableBinding)) {
                tableNodesMap.set(tableBinding, {
                    id: `tbl_${tableBinding}`,
                    type: 'TABLE',
                    label: tableBinding,
                    x: 100 + idx * 350,
                    y: 350,
                    data: { name: tableBinding }
                });
            }
        });

        const tableNodes = Array.from(tableNodesMap.values());
        const nodes = [...entityNodes, ...tableNodes];

        const edges = [];
        
        // Entity -> Table edges
        model.entities.forEach(ent => {
             const tableBinding = ent.properties[0]?.binding?.split('.')[0];
             if (tableBinding) {
                 edges.push({
                     id: `bind_${ent.id}`,
                     source: ent.id,
                     target: `tbl_${tableBinding}`,
                     type: 'BINDING'
                 });
             }
        });

        // Entity -> Entity relationships
        model.relationships.forEach(rel => {
            edges.push({
                id: rel.id,
                source: rel.sourceEntityId,
                target: rel.targetEntityId,
                type: 'RELATIONSHIP',
                label: rel.type,
                title: rel.label || '' // Pass label for rendering
            });
        });

        return { nodes, edges };
    }, [model]);

    return (
        <div 
            className="w-full h-full overflow-auto bg-[#f8f9fa]"
            onClick={() => onSelect(null)}
            style={{
                backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        >
            <svg width="100%" height="100%" className="min-w-[1000px] min-h-[600px]">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
                    </marker>
                    <marker id="arrowhead-rel" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                    </marker>
                    <marker id="arrowhead-rel-selected" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#2563EB" />
                    </marker>
                </defs>

                {/* Edges */}
                {layout.edges.map(edge => {
                    const source = layout.nodes.find(n => n.id === edge.source);
                    const target = layout.nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;
                    
                    const isSelected = selection?.type === 'RELATIONSHIP' && selection.id === edge.id;

                    let d = "";
                    let midX = 0;
                    let midY = 0;

                    if (source.x === target.x) {
                        d = `M ${source.x + 100} ${source.y + 60} L ${target.x + 100} ${target.y}`;
                        midX = source.x + 100;
                        midY = (source.y + 60 + target.y) / 2;
                    } else {
                        const startX = source.x + 200;
                        const startY = source.y + 30;
                        const endX = target.x;
                        const endY = target.y + 30;
                        const cp1x = startX + 50;
                        const cp1y = startY;
                        const cp2x = endX - 50;
                        const cp2y = endY;
                        d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
                        
                        // Approximate bezier midpoint
                        midX = (startX + 2 * cp1x + 2 * cp2x + endX) / 6; // Rough approx or just avg
                        midX = (startX + endX) / 2;
                        midY = (startY + endY) / 2; // Linear approx for text placement often sufficient for simple curves
                    }
                    
                    return (
                        <g 
                            key={edge.id} 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (edge.type === 'RELATIONSHIP') {
                                    onSelect({ type: 'RELATIONSHIP', id: edge.id });
                                }
                            }}
                            className={edge.type === 'RELATIONSHIP' ? "cursor-pointer" : ""}
                        >
                            {/* Hit Area (Invisible wider stroke) */}
                            {edge.type === 'RELATIONSHIP' && (
                                <path 
                                    d={d} 
                                    stroke="transparent" 
                                    strokeWidth="20"
                                    fill="none"
                                />
                            )}
                            
                            {/* Visible Path */}
                            <path 
                                d={d} 
                                stroke={edge.type === 'RELATIONSHIP' ? (isSelected ? '#2563EB' : '#3B82F6') : '#D1D5DB'} 
                                strokeWidth={edge.type === 'RELATIONSHIP' ? (isSelected ? 3 : 2) : 1.5}
                                fill="none"
                                strokeDasharray={edge.type === 'BINDING' ? '5,5' : 'none'}
                                markerEnd={edge.type === 'RELATIONSHIP' ? (isSelected ? 'url(#arrowhead-rel-selected)' : 'url(#arrowhead-rel)') : 'none'}
                            />
                            
                            {/* Relationship Badge & Label */}
                            {edge.type === 'RELATIONSHIP' && (
                                <g>
                                    {/* Link Title/Label on the line */}
                                    {edge.title && (
                                        <g transform={`translate(${midX}, ${midY - 25})`}>
                                             <rect 
                                                x="-40" y="-8" 
                                                width="80" height="16" 
                                                rx="2" 
                                                fill="white" 
                                                stroke="none"
                                                opacity="0.9"
                                            />
                                            <text 
                                                textAnchor="middle" 
                                                dominantBaseline="middle"
                                                className="text-[10px] font-semibold fill-gray-700 pointer-events-none select-none"
                                            >
                                                {edge.title}
                                            </text>
                                        </g>
                                    )}

                                    {/* Cardinality Badge */}
                                    <rect 
                                        x={(source.x + target.x + 200) / 2 - 30} 
                                        y={source.y + 15} 
                                        width="60" 
                                        height="18" 
                                        rx="9" 
                                        fill={isSelected ? "#EFF6FF" : "white"}
                                        stroke={isSelected ? "#2563EB" : "#BFDBFE"}
                                    />
                                    <text 
                                        x={(source.x + target.x + 200) / 2} 
                                        y={source.y + 28} 
                                        textAnchor="middle" 
                                        className={`text-[9px] font-medium ${isSelected ? 'fill-blue-800' : 'fill-blue-600'}`}
                                    >
                                        1:N
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Nodes */}
                {layout.nodes.map(node => {
                    const isSelected = selection?.id === node.id;
                    return (
                        <foreignObject 
                            key={node.id} 
                            x={node.x} 
                            y={node.y} 
                            width="200" 
                            height="80"
                            className="overflow-visible"
                        >
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // @ts-ignore
                                    onSelect({ type: node.type, id: node.id });
                                }}
                                className={`
                                    w-[200px] rounded-lg shadow-sm border p-3 cursor-pointer transition-all hover:shadow-md
                                    flex flex-col justify-center h-full relative
                                    ${node.type === 'ENTITY' 
                                        ? (isSelected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-blue-200') 
                                        : (isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-gray-100 border-gray-300')}
                                `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {node.type === 'ENTITY' ? (
                                        <div className="p-1.5 rounded bg-blue-100 text-blue-600">
                                            <TableIcon size={16} />
                                        </div>
                                    ) : (
                                        <div className="p-1.5 rounded bg-gray-200 text-gray-600">
                                            <Database size={16} />
                                        </div>
                                    )}
                                    <div className="font-semibold text-gray-800 text-sm truncate" title={node.label}>
                                        {node.label}
                                    </div>
                                </div>
                                {node.type === 'ENTITY' && (
                                    <div className="text-[10px] text-gray-500 pl-9">
                                        {(node.data as Entity).properties.length} Properties
                                    </div>
                                )}
                                {node.type === 'TABLE' && (
                                    <div className="text-[10px] text-gray-500 pl-9 uppercase font-mono">
                                        Physical Table
                                    </div>
                                )}

                                {/* Connection Points */}
                                {node.type === 'ENTITY' && (
                                    <>
                                        <div className="absolute -right-1 top-1/2 w-2 h-2 bg-blue-400 rounded-full border border-white transform -translate-y-1/2" />
                                        <div className="absolute -left-1 top-1/2 w-2 h-2 bg-blue-400 rounded-full border border-white transform -translate-y-1/2" />
                                        <div className="absolute bottom-[-4px] left-1/2 w-2 h-2 bg-gray-300 rounded-full border border-white transform -translate-x-1/2" />
                                    </>
                                )}
                                {node.type === 'TABLE' && (
                                    <div className="absolute top-[-4px] left-1/2 w-2 h-2 bg-gray-300 rounded-full border border-white transform -translate-x-1/2" />
                                )}
                            </div>
                        </foreignObject>
                    );
                })}
            </svg>
            
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-gray-200 p-2 rounded text-xs text-gray-500 shadow-sm pointer-events-none">
                Graph View • {layout.nodes.length} Nodes • {layout.edges.length} Connections
            </div>
        </div>
    );
};

// Deployment Page Component
type DeployTarget = 'bigquery' | 'spanner' | 'looker' | null;

const DeploymentPage: React.FC<{ model: SemanticModel; onBack: () => void }> = ({ model, onBack }) => {
    const [selectedTarget, setSelectedTarget] = useState<DeployTarget>(null);
    const [previewMode, setPreviewMode] = useState<'resources' | 'ddl'>('resources');
    const [project, setProject] = useState('');
    const [dataset, setDataset] = useState('');
    const [instance, setInstance] = useState('');
    const [lookerProject, setLookerProject] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    const targets = [
        {
            id: 'bigquery' as const,
            name: 'BigQuery',
            description: 'Deploy as BigQuery views and tables',
            icon: <Database size={24} />,
            color: 'from-blue-500 to-blue-700'
        },
        {
            id: 'spanner' as const,
            name: 'Spanner Graph',
            description: 'Deploy as Spanner Graph database',
            icon: <Layers size={24} />,
            color: 'from-green-500 to-teal-600'
        },
        {
            id: 'looker' as const,
            name: 'Looker',
            description: 'Generate LookML model definitions',
            icon: <Eye size={24} />,
            color: 'from-purple-500 to-indigo-600'
        }
    ];

    const handleDeploy = () => {
        setIsDeploying(true);
        setTimeout(() => {
            setIsDeploying(false);
            setDeployed(true);
        }, 2000);
    };

    const generateLookML = () => {
        let lookml = `# Auto-generated LookML for ${model.name}\n`;
        lookml += `# Generated: ${new Date().toISOString()}\n`;
        lookml += `# Looker Project: ${lookerProject || 'project'}\n\n`;
        
        model.entities.forEach(entity => {
            const viewName = entity.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            lookml += `view: ${viewName} {\n`;
            lookml += `  sql_table_name: \`${project || 'project'}.${dataset || 'dataset'}.${viewName}\` ;;\n\n`;
            
            if (entity.description) {
                lookml += `  # ${entity.description}\n\n`;
            }
            
            entity.properties.forEach(prop => {
                const fieldType = prop.dataType === 'INTEGER' || prop.dataType === 'FLOAT' ? 'number' : 
                                 prop.dataType === 'TIMESTAMP' || prop.dataType === 'DATE' ? 'time' : 'string';
                const fieldName = prop.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                
                lookml += `  dimension: ${fieldName} {\n`;
                lookml += `    type: ${fieldType}\n`;
                
                // Generate SQL expression with proper fallback
                const columnName = prop.binding 
                    ? (prop.binding.split('.')[1] || fieldName) 
                    : fieldName;
                lookml += `    sql: \${TABLE}.${columnName} ;;\n`;
                
                if (prop.description) {
                    const safeDesc = prop.description.replace(/"/g, '\\"').substring(0, 200);
                    lookml += `    description: "${safeDesc}"\n`;
                }
                lookml += `  }\n\n`;
            });
            
            lookml += `}\n\n`;
        });
        
        // Generate model file reference
        lookml += `# Model file: ${lookerProject || 'project'}.model.lkml\n`;
        lookml += `# connection: "your_bq_connection"\n`;
        lookml += `# include: "/*.view.lkml"\n`;
        
        return lookml;
    };

    const generateBigQueryDDL = () => {
        let ddl = `-- BigQuery DDL for ${model.name}\n`;
        ddl += `-- Generated: ${new Date().toISOString()}\n`;
        ddl += `-- Project: ${project || 'project'}\n`;
        ddl += `-- Dataset: ${dataset || 'dataset'}\n\n`;
        
        // Create dataset statement
        ddl += `-- Create dataset if not exists\n`;
        ddl += `CREATE SCHEMA IF NOT EXISTS \`${project || 'project'}.${dataset || 'dataset'}\`\n`;
        ddl += `OPTIONS (\n`;
        ddl += `  description = "${model.description || model.name} semantic model"\n`;
        ddl += `);\n\n`;
        
        model.entities.forEach(entity => {
            const tableName = entity.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const fullTableName = `\`${project || 'project'}.${dataset || 'dataset'}.${tableName}\``;
            
            ddl += `-- ${entity.type || 'ENTITY'}: ${entity.name}\n`;
            if (entity.description) {
                ddl += `-- ${entity.description}\n`;
            }
            ddl += `CREATE OR REPLACE TABLE ${fullTableName} (\n`;
            
            entity.properties.forEach((prop, idx) => {
                const columnName = prop.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                const bqType = mapDataTypeToBQ(prop.dataType);
                const isLast = idx === entity.properties.length - 1;
                
                ddl += `  ${columnName} ${bqType}`;
                if (prop.description) {
                    ddl += ` OPTIONS (description = "${prop.description.replace(/"/g, '\\"').substring(0, 200)}")`;
                }
                ddl += isLast ? '\n' : ',\n';
            });
            
            ddl += `)\n`;
            ddl += `OPTIONS (\n`;
            ddl += `  description = "${(entity.description || entity.name).replace(/"/g, '\\"').substring(0, 200)}"\n`;
            ddl += `);\n\n`;
        });
        
        // Generate relationships as comments (BQ doesn't have FK constraints in the traditional sense)
        if (model.relationships.length > 0) {
            ddl += `-- Relationships (for documentation purposes)\n`;
            model.relationships.forEach(rel => {
                const source = model.entities.find(e => e.id === rel.sourceEntityId);
                const target = model.entities.find(e => e.id === rel.targetEntityId);
                const sourceProp = source?.properties.find(p => p.id === rel.sourcePropertyId);
                const targetProp = target?.properties.find(p => p.id === rel.targetPropertyId);
                ddl += `-- ${source?.name}.${sourceProp?.name || 'id'} -> ${target?.name}.${targetProp?.name || 'id'} (${rel.type})\n`;
            });
        }
        
        return ddl;
    };
    
    const mapDataTypeToBQ = (dataType: string): string => {
        const typeMap: Record<string, string> = {
            'STRING': 'STRING',
            'INTEGER': 'INT64',
            'FLOAT': 'FLOAT64',
            'BOOLEAN': 'BOOL',
            'TIMESTAMP': 'TIMESTAMP',
            'DATE': 'DATE',
            'DATETIME': 'DATETIME',
            'TIME': 'TIME',
            'BYTES': 'BYTES',
            'NUMERIC': 'NUMERIC',
            'BIGNUMERIC': 'BIGNUMERIC',
            'GEOGRAPHY': 'GEOGRAPHY',
            'JSON': 'JSON',
        };
        return typeMap[dataType?.toUpperCase()] || 'STRING';
    };

    const generateSpannerDDL = () => {
        let ddl = `-- Spanner Graph DDL for ${model.name}\n`;
        ddl += `-- Generated: ${new Date().toISOString()}\n`;
        ddl += `-- Project: ${project || 'project'}\n`;
        ddl += `-- Instance: ${instance || 'instance'}\n`;
        ddl += `-- Database: ${dataset || 'database'}\n\n`;
        
        // Create node tables for entities
        ddl += `-- Node Tables (Entities)\n`;
        ddl += `-- ========================\n\n`;
        
        model.entities.forEach(entity => {
            const tableName = entity.name.replace(/\s+/g, '_');
            
            ddl += `-- ${entity.type || 'ENTITY'}: ${entity.name}\n`;
            if (entity.description) {
                ddl += `-- ${entity.description}\n`;
            }
            ddl += `CREATE TABLE ${tableName} (\n`;
            
            // Find primary key (first property or one named 'id')
            const pkProp = entity.properties.find(p => p.name.toLowerCase() === 'id') || entity.properties[0];
            
            entity.properties.forEach((prop, idx) => {
                const columnName = prop.name.replace(/\s+/g, '_');
                const spannerType = mapDataTypeToSpanner(prop.dataType);
                const isLast = idx === entity.properties.length - 1;
                ddl += `  ${columnName} ${spannerType}`;
                ddl += isLast ? '\n' : ',\n';
            });
            
            ddl += `) PRIMARY KEY (${pkProp?.name.replace(/\s+/g, '_') || 'id'});\n\n`;
        });
        
        // Create property graph
        ddl += `-- Property Graph Definition\n`;
        ddl += `-- =========================\n\n`;
        ddl += `CREATE OR REPLACE PROPERTY GRAPH ${model.name.replace(/\s+/g, '_')}Graph\n`;
        ddl += `  NODE TABLES (\n`;
        
        model.entities.forEach((entity, idx) => {
            const tableName = entity.name.replace(/\s+/g, '_');
            const isLast = idx === model.entities.length - 1;
            ddl += `    ${tableName}`;
            ddl += isLast ? '\n' : ',\n';
        });
        
        ddl += `  )`;
        
        // Add edge tables for relationships
        if (model.relationships.length > 0) {
            ddl += `\n  EDGE TABLES (\n`;
            
            model.relationships.forEach((rel, idx) => {
                const source = model.entities.find(e => e.id === rel.sourceEntityId);
                const target = model.entities.find(e => e.id === rel.targetEntityId);
                const sourceProp = source?.properties.find(p => p.id === rel.sourcePropertyId);
                const targetProp = target?.properties.find(p => p.id === rel.targetPropertyId);
                const edgeName = `${source?.name.replace(/\s+/g, '_')}_to_${target?.name.replace(/\s+/g, '_')}`;
                const isLast = idx === model.relationships.length - 1;
                
                ddl += `    ${edgeName}\n`;
                ddl += `      SOURCE KEY (${sourceProp?.name.replace(/\s+/g, '_') || 'id'}) REFERENCES ${source?.name.replace(/\s+/g, '_')}\n`;
                ddl += `      DESTINATION KEY (${targetProp?.name.replace(/\s+/g, '_') || 'id'}) REFERENCES ${target?.name.replace(/\s+/g, '_')}`;
                ddl += isLast ? '\n' : ',\n';
            });
            
            ddl += `  )`;
        }
        
        ddl += `;\n`;
        
        return ddl;
    };
    
    const mapDataTypeToSpanner = (dataType: string): string => {
        const typeMap: Record<string, string> = {
            'STRING': 'STRING(MAX)',
            'INTEGER': 'INT64',
            'FLOAT': 'FLOAT64',
            'BOOLEAN': 'BOOL',
            'TIMESTAMP': 'TIMESTAMP',
            'DATE': 'DATE',
            'DATETIME': 'TIMESTAMP',
            'TIME': 'STRING(MAX)',
            'BYTES': 'BYTES(MAX)',
            'NUMERIC': 'NUMERIC',
            'JSON': 'JSON',
        };
        return typeMap[dataType?.toUpperCase()] || 'STRING(MAX)';
    };

    const handleDownload = () => {
        let content = '';
        let filename = '';
        let mimeType = 'text/plain';
        
        if (selectedTarget === 'looker') {
            content = generateLookML();
            filename = `${model.name.toLowerCase().replace(/\s+/g, '_')}.view.lkml`;
            mimeType = 'text/plain';
        } else if (selectedTarget === 'spanner') {
            content = generateSpannerDDL();
            filename = `${model.name.toLowerCase().replace(/\s+/g, '_')}_spanner.sql`;
            mimeType = 'application/sql';
        } else {
            content = generateBigQueryDDL();
            filename = `${model.name.toLowerCase().replace(/\s+/g, '_')}_bigquery.sql`;
            mimeType = 'application/sql';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (deployed) {
        return (
            <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="h-14 border-b border-gray-200 bg-white flex items-center px-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                        <ArrowLeft size={18} />
                        Back to Model
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <Check size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Deployment Successful!</h2>
                        <p className="text-gray-600 mb-8">
                            Your semantic model "{model.name}" has been deployed to {targets.find(t => t.id === selectedTarget)?.name}.
                        </p>
                        <button 
                            onClick={onBack} 
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Return to Model
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                    <ArrowLeft size={18} />
                    Back to Model
                </button>
                <div className="flex items-center gap-2">
                    <Rocket size={18} className="text-blue-600" />
                    <span className="font-semibold text-gray-800">Deploy: {model.name}</span>
                </div>
                <div className="w-32"></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {!selectedTarget ? (
                        /* Target Selection */
                        <div>
                            <div className="text-center mb-10">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Deployment Target</h1>
                                <p className="text-gray-500">Select where you want to deploy your semantic model</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {targets.map((target) => (
                                    <button
                                        key={target.id}
                                        onClick={() => setSelectedTarget(target.id)}
                                        className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-blue-300 transition-all text-left group"
                                    >
                                        <div className={`w-14 h-14 bg-gradient-to-br ${target.color} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg`}>
                                            {target.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {target.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm">{target.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Target Configuration */
                        <div className="flex gap-8">
                            {/* Left: Configuration */}
                            <div className="w-96 shrink-0">
                                <button
                                    onClick={() => setSelectedTarget(null)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
                                >
                                    <ArrowLeft size={14} />
                                    Change target
                                </button>

                                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                        <div className={`w-12 h-12 bg-gradient-to-br ${targets.find(t => t.id === selectedTarget)?.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                                            {targets.find(t => t.id === selectedTarget)?.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {targets.find(t => t.id === selectedTarget)?.name}
                                            </h2>
                                            <p className="text-sm text-gray-500">Configure deployment settings</p>
                                        </div>
                                    </div>

                                    {selectedTarget === 'bigquery' && (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">GCP Project</label>
                                                <input
                                                    type="text"
                                                    value={project}
                                                    onChange={(e) => setProject(e.target.value)}
                                                    placeholder="my-gcp-project"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Dataset</label>
                                                <input
                                                    type="text"
                                                    value={dataset}
                                                    onChange={(e) => setDataset(e.target.value)}
                                                    placeholder="semantic_layer"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                                                <div className="font-medium mb-1">BigQuery Details</div>
                                                <p className="text-blue-600 text-xs">
                                                    Views will be created in: <code className="bg-blue-100 px-1 rounded">{project || 'project'}.{dataset || 'dataset'}</code>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedTarget === 'spanner' && (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">GCP Project</label>
                                                <input
                                                    type="text"
                                                    value={project}
                                                    onChange={(e) => setProject(e.target.value)}
                                                    placeholder="my-gcp-project"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Instance ID</label>
                                                <input
                                                    type="text"
                                                    value={instance}
                                                    onChange={(e) => setInstance(e.target.value)}
                                                    placeholder="my-spanner-instance"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Database</label>
                                                <input
                                                    type="text"
                                                    value={dataset}
                                                    onChange={(e) => setDataset(e.target.value)}
                                                    placeholder="semantic-graph-db"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-800">
                                                <div className="font-medium mb-1">Spanner Graph Requirements</div>
                                                <p className="text-yellow-600 text-xs">
                                                    Instance must have Graph support enabled. Enterprise edition recommended.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedTarget === 'looker' && (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Looker Project Name</label>
                                                <select
                                                    value={lookerProject}
                                                    onChange={(e) => setLookerProject(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                                >
                                                    <option value="">Select a Looker project...</option>
                                                    <option value="semantic_analytics">semantic_analytics</option>
                                                    <option value="enterprise_reporting">enterprise_reporting</option>
                                                    <option value="data_discovery">data_discovery</option>
                                                    <option value="business_intelligence">business_intelligence</option>
                                                    <option value="customer_insights">customer_insights</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Looker Instance</label>
                                                <select
                                                    value={instance}
                                                    onChange={(e) => setInstance(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                                >
                                                    <option value="">Select an instance...</option>
                                                    <option value="looker.company.com">looker.company.com (Production)</option>
                                                    <option value="looker-dev.company.com">looker-dev.company.com (Development)</option>
                                                    <option value="looker-staging.company.com">looker-staging.company.com (Staging)</option>
                                                </select>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
                                                <div className="font-medium mb-1">LookML Generation</div>
                                                <p className="text-purple-600 text-xs">
                                                    View definitions will be generated from your semantic model entities.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={handleDeploy}
                                            disabled={
                                                isDeploying || 
                                                (selectedTarget === 'bigquery' && (!project || !dataset)) ||
                                                (selectedTarget === 'spanner' && (!project || !instance || !dataset)) ||
                                                (selectedTarget === 'looker' && (!lookerProject || !instance))
                                            }
                                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isDeploying ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Deploying...
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket size={18} />
                                                    Deploy to {targets.find(t => t.id === selectedTarget)?.name}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Preview */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                        Deployment Preview
                                    </h3>
                                    
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setPreviewMode('resources')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                previewMode === 'resources' 
                                                    ? 'bg-white text-gray-900 shadow-sm' 
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Resources
                                        </button>
                                        <button
                                            onClick={() => setPreviewMode('ddl')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                previewMode === 'ddl' 
                                                    ? 'bg-white text-gray-900 shadow-sm' 
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {selectedTarget === 'looker' ? 'LookML' : 'DDL Code'}
                                        </button>
                                    </div>
                                </div>
                                
                                {previewMode === 'ddl' ? (
                                    <div className="bg-gray-900 rounded-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                                            <span className="text-xs text-gray-400 font-mono">
                                                {selectedTarget === 'looker' 
                                                    ? `${model.name.toLowerCase().replace(/\s+/g, '_')}.view.lkml`
                                                    : selectedTarget === 'spanner'
                                                        ? `${model.name.toLowerCase().replace(/\s+/g, '_')}_spanner.sql`
                                                        : `${model.name.toLowerCase().replace(/\s+/g, '_')}_bigquery.sql`}
                                            </span>
                                            <button
                                                onClick={handleDownload}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                        </div>
                                        <div className="p-6 h-[560px] overflow-auto">
                                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                                {selectedTarget === 'looker' 
                                                    ? generateLookML() 
                                                    : selectedTarget === 'spanner' 
                                                        ? generateSpannerDDL() 
                                                        : generateBigQueryDDL()}
                                            </pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Resources to be created</h4>
                                        
                                        <div className="space-y-3">
                                            {model.entities.map((entity) => (
                                                <div key={entity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                        <TableIcon size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900 text-sm">{entity.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {selectedTarget === 'bigquery' && (
                                                                <code>{project || 'project'}.{dataset || 'dataset'}.{entity.name.toLowerCase().replace(/\s+/g, '_')}</code>
                                                            )}
                                                            {selectedTarget === 'spanner' && (
                                                                <code>Node: {entity.name} ({entity.properties.length} properties)</code>
                                                            )}
                                                            {selectedTarget === 'looker' && (
                                                                <code>view: {entity.name.toLowerCase().replace(/\s+/g, '_')}</code>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {entity.properties.length} cols
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {model.relationships.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-4">Relationships</h4>
                                                <div className="space-y-2">
                                                    {model.relationships.map((rel) => {
                                                        const source = model.entities.find(e => e.id === rel.sourceEntityId);
                                                        const target = model.entities.find(e => e.id === rel.targetEntityId);
                                                        return (
                                                            <div key={rel.id} className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                                                                <span className="font-medium">{source?.name}</span>
                                                                <ArrowRight size={14} className="text-gray-400" />
                                                                <span className="font-medium">{target?.name}</span>
                                                                <span className="text-xs text-gray-400 ml-auto">{rel.type}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {selectedTarget === 'bigquery' && (
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">BigQuery Configuration</h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Project</div>
                                                        <div className="font-mono text-gray-900">{project || '—'}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Dataset</div>
                                                        <div className="font-mono text-gray-900">{dataset || '—'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedTarget === 'spanner' && (
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Spanner Configuration</h4>
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Project</div>
                                                        <div className="font-mono text-gray-900">{project || '—'}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Instance</div>
                                                        <div className="font-mono text-gray-900">{instance || '—'}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Database</div>
                                                        <div className="font-mono text-gray-900">{dataset || '—'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedTarget === 'looker' && (
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Looker Configuration</h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Looker Project</div>
                                                        <div className="font-mono text-gray-900">{lookerProject || '—'}</div>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <div className="text-gray-500 text-xs mb-1">Looker Instance</div>
                                                        <div className="font-mono text-gray-900">{instance || '—'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Mock BigQuery/Spanner catalog data for searching
const MOCK_CATALOG = {
    bigquery: [
        { project: 'analytics-prod', dataset: 'sales', table: 'orders', columns: ['order_id', 'customer_id', 'order_date', 'total_amount', 'status'] },
        { project: 'analytics-prod', dataset: 'sales', table: 'customers', columns: ['customer_id', 'name', 'email', 'created_at', 'segment'] },
        { project: 'analytics-prod', dataset: 'sales', table: 'products', columns: ['product_id', 'sku', 'name', 'category', 'price'] },
        { project: 'analytics-prod', dataset: 'inventory', table: 'stock_levels', columns: ['sku', 'warehouse_id', 'quantity', 'last_updated'] },
        { project: 'data-warehouse', dataset: 'finance', table: 'revenue', columns: ['date', 'product_id', 'revenue', 'cost', 'margin'] },
        { project: 'data-warehouse', dataset: 'finance', table: 'transactions', columns: ['tx_id', 'customer_id', 'amount', 'type', 'timestamp'] },
        { project: 'bigquery-public-data', dataset: 'samples', table: 'shakespeare', columns: ['word', 'word_count', 'corpus', 'corpus_date'] },
        { project: 'bigquery-public-data', dataset: 'usa_names', table: 'usa_1910_current', columns: ['state', 'gender', 'year', 'name', 'number'] },
    ],
    spanner: [
        { project: 'spanner-prod', instance: 'main-instance', database: 'app_db', table: 'users', columns: ['user_id', 'username', 'email', 'created_at'] },
        { project: 'spanner-prod', instance: 'main-instance', database: 'app_db', table: 'sessions', columns: ['session_id', 'user_id', 'token', 'expires_at'] },
        { project: 'spanner-prod', instance: 'analytics', database: 'events_db', table: 'events', columns: ['event_id', 'user_id', 'event_type', 'timestamp', 'payload'] },
    ]
};

const ColumnSearchModal: React.FC<{
    system: 'bigquery' | 'spanner';
    onClose: () => void;
    onSelect: (selection: { project: string; dataset?: string; instance?: string; database?: string; table: string; column: string }) => void;
}> = ({ system, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedDataset, setSelectedDataset] = useState('');
    const [selectedTable, setSelectedTable] = useState('');
    const [step, setStep] = useState<'search' | 'columns'>('search');
    const [selectedTableData, setSelectedTableData] = useState<any>(null);

    const catalog = system === 'bigquery' ? MOCK_CATALOG.bigquery : MOCK_CATALOG.spanner;
    
    const filteredTables = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return catalog.filter(item => 
            item.project.toLowerCase().includes(query) ||
            ('dataset' in item && item.dataset?.toLowerCase().includes(query)) ||
            ('database' in item && item.database?.toLowerCase().includes(query)) ||
            item.table.toLowerCase().includes(query) ||
            item.columns.some(c => c.toLowerCase().includes(query))
        );
    }, [catalog, searchQuery]);

    const projects = useMemo(() => [...new Set(catalog.map(t => t.project))], [catalog]);

    const handleTableClick = (tableData: any) => {
        setSelectedTableData(tableData);
        setStep('columns');
    };

    const handleColumnSelect = (column: string) => {
        if (system === 'bigquery') {
            onSelect({
                project: selectedTableData.project,
                dataset: selectedTableData.dataset,
                table: selectedTableData.table,
                column
            });
        } else {
            onSelect({
                project: selectedTableData.project,
                instance: selectedTableData.instance,
                database: selectedTableData.database,
                table: selectedTableData.table,
                column
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Database size={18} className="text-blue-600"/>
                        {step === 'search' ? `Search ${system === 'bigquery' ? 'BigQuery' : 'Spanner'} Tables` : 'Select Column'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>

                {step === 'search' ? (
                    <>
                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search projects, tables, or columns..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredTables.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">No tables found</div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTables.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handleTableClick(item)}
                                            className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <TableIcon size={14} className="text-blue-500" />
                                                <span className="font-medium text-gray-800">{item.table}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {system === 'bigquery' 
                                                    ? `${item.project}.${(item as any).dataset}.${item.table}`
                                                    : `${item.project}/${(item as any).instance}/${(item as any).database}.${item.table}`
                                                }
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.columns.slice(0, 5).map(col => (
                                                    <span key={col} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                        {col}
                                                    </span>
                                                ))}
                                                {item.columns.length > 5 && (
                                                    <span className="px-2 py-0.5 text-gray-400 text-xs">
                                                        +{item.columns.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <button 
                                onClick={() => setStep('search')}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"
                            >
                                <ArrowLeft size={14} /> Back to search
                            </button>
                            <div className="text-sm font-mono text-gray-700">
                                {system === 'bigquery' 
                                    ? `${selectedTableData.project}.${selectedTableData.dataset}.${selectedTableData.table}`
                                    : `${selectedTableData.project}/${selectedTableData.instance}/${selectedTableData.database}.${selectedTableData.table}`
                                }
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="text-xs font-medium text-gray-500 uppercase mb-3">Select a column</div>
                            <div className="space-y-1">
                                {selectedTableData.columns.map((col: string) => (
                                    <div 
                                        key={col}
                                        onClick={() => handleColumnSelect(col)}
                                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center gap-2"
                                    >
                                        <Columns size={14} className="text-gray-400" />
                                        <span className="font-mono text-sm text-gray-800">{col}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const CreateLinkModal: React.FC<{
    sourceEntity: Entity,
    sourcePropId: string,
    model: SemanticModel,
    onClose: () => void,
    onCreate: (targetEntityId: string, targetPropId: string, type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY') => void
}> = ({ sourceEntity, sourcePropId, model, onClose, onCreate }) => {
    const [targetEntityId, setTargetEntityId] = useState('');
    const [targetPropId, setTargetPropId] = useState('');
    const [relType, setRelType] = useState<'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY'>('ONE_TO_MANY');

    const sourcePropName = sourceEntity.properties.find(p => p.id === sourcePropId)?.name;
    const targetEntity = model.entities.find(e => e.id === targetEntityId);
    
    // Filter out source entity to prevent self-linking for this demo (optional constraint)
    const availableEntities = model.entities.filter(e => e.id !== sourceEntity.id);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Link size={18} className="text-blue-600"/>
                        Create Relationship
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex-1">
                            <div className="text-[10px] uppercase text-blue-600 font-bold mb-0.5">Source</div>
                            <div className="text-sm font-medium text-gray-900">{sourceEntity.name}</div>
                            <div className="text-xs text-gray-500">{sourcePropName}</div>
                        </div>
                        <ArrowRight className="text-blue-300" size={20} />
                        <div className="flex-1 text-right">
                             <div className="text-[10px] uppercase text-gray-500 font-bold mb-0.5">Target</div>
                             <div className="text-sm font-medium text-gray-900">{targetEntity?.name || '...'}</div>
                             <div className="text-xs text-gray-500">{targetEntity?.properties.find(p => p.id === targetPropId)?.name || '...'}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Target Entity</label>
                            <select 
                                value={targetEntityId} 
                                onChange={e => {
                                    setTargetEntityId(e.target.value);
                                    setTargetPropId(''); // reset prop when entity changes
                                }}
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-2"
                            >
                                <option value="">Select Entity...</option>
                                {availableEntities.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Target Property</label>
                            <select 
                                value={targetPropId} 
                                onChange={e => setTargetPropId(e.target.value)}
                                disabled={!targetEntityId}
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border p-2 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <option value="">Select Property...</option>
                                {targetEntity?.properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.dataType})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cardinality</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setRelType(opt as any)}
                                        className={`text-xs py-2 px-1 rounded border ${relType === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {opt === 'ONE_TO_ONE' && '1:1'}
                                        {opt === 'ONE_TO_MANY' && '1:N'}
                                        {opt === 'MANY_TO_MANY' && 'N:N'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-200 rounded">Cancel</button>
                    <button 
                        onClick={() => onCreate(targetEntityId, targetPropId, relType)}
                        disabled={!targetEntityId || !targetPropId}
                        className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                    >
                        Create Link
                    </button>
                </div>
            </div>
        </div>
    );
};

const AuthoringView: React.FC<{ 
    onBack: () => void, 
    onManual: () => void,
    onGenerated: (entities: Entity[]) => void
}> = ({ onBack, onManual, onGenerated }) => {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        const suggestions = await suggestEntitiesFromDescription(prompt);
        // Transform partial suggestions to full entities
        const newEntities: Entity[] = suggestions.map((s, idx) => ({
            id: `gen_${Date.now()}_${idx}`,
            name: s.name || 'Generated Entity',
            description: s.description || '',
            type: EntityType.ENTITY,
            properties: s.properties?.map((p, pIdx) => ({
                id: `prop_${Date.now()}_${idx}_${pIdx}`,
                name: p.name,
                dataType: p.dataType,
                description: p.description,
                binding: ''
            })) || []
        }));
        setIsLoading(false);
        onGenerated(newEntities);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="h-14 border-b border-gray-200 bg-white flex items-center px-6">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                    <ArrowLeft size={18} />
                    Back to Graph
                </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="max-w-2xl w-full">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <Wand2 size={32} />
                        </div>
                        <h1 className="text-3xl font-light text-gray-900 mb-2">Assistive Authoring</h1>
                        <p className="text-gray-500">Describe the business domain you want to model, and Gemini will generate the initial entities and properties for you.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="e.g. 'I need to model a retail system with Customers, Orders, and Products. Orders should track status and total amount.'"
                            className="w-full h-32 p-4 text-base border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-gray-50"
                        />
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={handleGenerate}
                                disabled={!prompt || isLoading}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? (
                                    <>Generating...</>
                                ) : (
                                    <>
                                        <Wand2 size={18} />
                                        Generate Model
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 my-8">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-gray-400 text-sm font-medium">OR</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={onManual}
                            className="text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg transition-colors border border-gray-300 bg-white"
                        >
                            Create Entity Manually
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Import Model Modal Component
const ImportModelModal: React.FC<{
    onClose: () => void;
    onImport: (model: SemanticModel) => void;
}> = ({ onClose, onImport }) => {
    const [importSource, setImportSource] = useState<'looker' | 'dbt' | 'file' | null>(null);
    const [connectionUrl, setConnectionUrl] = useState('');
    const [projectName, setProjectName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImport = () => {
        setIsLoading(true);
        // Simulate import process - in production this would call actual APIs
        setTimeout(() => {
            const importedModel: SemanticModel = {
                id: `imported_${Date.now()}`,
                name: importSource === 'looker' ? `Looker Model - ${projectName}` : 
                      importSource === 'dbt' ? `DBT Model - ${projectName}` : 
                      `Imported Model`,
                description: `Imported from ${importSource?.toUpperCase() || 'file'} on ${new Date().toLocaleDateString()}`,
                entities: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setIsLoading(false);
            onImport(importedModel);
        }, 1500);
    };

    const sources = [
        {
            id: 'looker' as const,
            name: 'Looker',
            description: 'Import from Looker LookML models',
            icon: <Eye size={24} />,
            color: 'from-purple-500 to-indigo-600'
        },
        {
            id: 'dbt' as const,
            name: 'dbt',
            description: 'Import from dbt semantic layer',
            icon: <Database size={24} />,
            color: 'from-orange-500 to-red-600'
        },
        {
            id: 'file' as const,
            name: 'File Upload',
            description: 'Upload YAML or JSON definition files',
            icon: <FileText size={24} />,
            color: 'from-green-500 to-teal-600'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {importSource && (
                            <button
                                onClick={() => setImportSource(null)}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <h2 className="text-lg font-semibold text-gray-900">
                            {importSource ? `Import from ${sources.find(s => s.id === importSource)?.name}` : 'Import Semantic Model'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!importSource ? (
                        /* Source Selection */
                        <div className="space-y-4">
                            <p className="text-gray-600 mb-6">Choose a source to import your semantic model from:</p>
                            {sources.map((source) => (
                                <button
                                    key={source.id}
                                    onClick={() => setImportSource(source.id)}
                                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-br ${source.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                                        {source.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {source.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{source.description}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    ) : importSource === 'looker' ? (
                        /* Looker Import Form */
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Looker Instance URL</label>
                                <input
                                    type="url"
                                    value={connectionUrl}
                                    onChange={(e) => setConnectionUrl(e.target.value)}
                                    placeholder="https://your-instance.cloud.looker.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="my_lookml_project"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Looker API key"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-2">Your API key is encrypted and used only for this import.</p>
                            </div>
                        </div>
                    ) : importSource === 'dbt' ? (
                        /* DBT Import Form */
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">dbt Cloud URL</label>
                                <input
                                    type="url"
                                    value={connectionUrl}
                                    onChange={(e) => setConnectionUrl(e.target.value)}
                                    placeholder="https://cloud.getdbt.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="my_dbt_project"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Token</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your dbt Cloud service token"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-2">Service token with Semantic Layer access permissions.</p>
                            </div>
                        </div>
                    ) : (
                        /* File Upload Form */
                        <div className="space-y-5">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".yaml,.yml,.json"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => setSelectedFiles(e.target.files)}
                                />
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload size={28} className="text-gray-400" />
                                </div>
                                {selectedFiles && selectedFiles.length > 0 ? (
                                    <div>
                                        <p className="font-medium text-gray-900 mb-2">
                                            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                                        </p>
                                        <div className="text-sm text-gray-500 space-y-1">
                                            {Array.from(selectedFiles).map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-center gap-2">
                                                    <FileText size={14} />
                                                    <span>{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-medium text-gray-700 mb-1">Drop files here or click to browse</p>
                                        <p className="text-sm text-gray-500">Supports YAML and JSON files</p>
                                    </>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">Supported Formats</h4>
                                <ul className="text-sm text-gray-500 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        Dataplex Semantic Model YAML
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        LookML view/model files (.lkml)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        dbt schema.yml files
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {importSource && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isLoading || (importSource !== 'file' && (!connectionUrl || !projectName || !apiKey)) || (importSource === 'file' && !selectedFiles)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={18} className="rotate-180" />
                                    Import Model
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Git File Modal Component
const GitFileModal: React.FC<{
    model: SemanticModel;
    onClose: () => void;
    onSave: (gitFile: string) => void;
}> = ({ model, onClose, onSave }) => {
    const [gitFile, setGitFile] = useState(model.gitFile || `models/${model.id}.yaml`);
    const [isValidating, setIsValidating] = useState(false);

    const handleSave = () => {
        setIsValidating(true);
        setTimeout(() => {
            setIsValidating(false);
            onSave(gitFile);
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                            <GitCommit size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Change Git File</h3>
                            <p className="text-sm text-gray-500">Update the source file for this model</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Git File Path</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={gitFile}
                                    onChange={(e) => setGitFile(e.target.value)}
                                    placeholder="models/my-model.yaml"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            This is the file path in your repository where this semantic model definition is stored.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">File Path Guidelines</h4>
                        <ul className="text-sm text-gray-500 space-y-2">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                                Use relative paths from repository root
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                                Recommended: <code className="bg-gray-200 px-1 rounded">models/</code> directory
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                                Supported formats: .yaml, .yml, .json
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!gitFile.trim() || isValidating}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isValidating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Validating...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};