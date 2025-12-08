import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Entity, SemanticModel, EntityType, Relationship, Property, AspectAssignment, GlossaryTerm, DescriptionHistory } from '../types';
import { Plus, Database, Table as TableIcon, Columns, ArrowRight, Save, Wand2, X, Maximize2, Layers, ArrowLeft, GitCommit, Link, Pencil, Check, Rocket, ChevronDown, BarChart3, Settings2, PieChart, LineChart, Activity, Calendar, AlertCircle, TrendingUp, GripVertical, ExternalLink, ChevronRight, Minimize2, Search, FileText, BookOpen, Tag } from 'lucide-react';
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
  model: SemanticModel;
  setModel: React.Dispatch<React.SetStateAction<SemanticModel>>;
}

type Selection = 
  | { type: 'ENTITY'; id: string } 
  | { type: 'TABLE'; id: string }
  | { type: 'RELATIONSHIP'; id: string }
  | null;

type ViewMode = 'GRAPH' | 'AUTHORING' | 'FULL_PAGE_ENTITY';

export const SemanticBuilder: React.FC<SemanticBuilderProps> = ({ model, setModel }) => {
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

  // Deploy Modal State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  
  // Sidebar Tabs
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'configuration'>('dashboard');
  
  // Helper to get selected objects
  const selectedEntity = useMemo(() => 
    selection?.type === 'ENTITY' ? model.entities.find(e => e.id === selection.id) : null,
  [selection, model.entities]);

  const selectedRelationship = useMemo(() => 
    selection?.type === 'RELATIONSHIP' ? model.relationships.find(r => r.id === selection.id) : null,
  [selection, model.relationships]);

  // Handle Search Input Focus
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  // Filter Entities
  const filteredEntities = useMemo(() => {
    if (!searchQuery) return model.entities;
    return model.entities.filter(ent => 
        ent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ent.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [model.entities, searchQuery]);

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

  if (viewMode === 'FULL_PAGE_ENTITY') {
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

  return (
    <div className="flex h-full bg-white overflow-hidden relative">
      
      {/* Left Pane: Search/Navigator */}
      <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
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
                onClick={() => setIsDeployModalOpen(true)}
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

      {/* Deploy Modal */}
      {isDeployModalOpen && (
          <DeployModal onClose={() => setIsDeployModalOpen(false)} />
      )}
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
    const [activeTab, setActiveTab] = useState<'config' | 'dashboard'>('dashboard');

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
        <div className="h-full bg-gray-50 flex flex-col">
            <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm">
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

            <div className="bg-white border-b border-gray-200 px-8">
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

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Settings2 size={18} className="text-gray-500" />
                                    Entity Configuration
                                </h3>
                                <div className="space-y-6">
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
                                        minHeight="150px"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-base font-bold text-gray-800 mb-4">Metadata</h3>
                                <div className="space-y-6">
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

                                {/* Glossary Terms - Collapsible */}
                                {(entity.glossaryTerms?.length || 0) > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div 
                                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                                            onClick={() => setExpandedPropertyId(expandedPropertyId === 'glossary' ? null : 'glossary')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <ChevronRight 
                                                    size={14} 
                                                    className={`text-gray-400 transition-transform ${expandedPropertyId === 'glossary' ? 'rotate-90' : ''}`}
                                                />
                                                <BookOpen size={14} className="text-purple-500" />
                                                <span className="text-sm font-medium text-gray-800">Business Terms</span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {entity.glossaryTerms?.length} term{entity.glossaryTerms?.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {expandedPropertyId === 'glossary' && (
                                            <div className="px-5 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                                                <div className="space-y-2">
                                                    {entity.glossaryTerms?.map(term => (
                                                        <div key={term.id} className="text-xs">
                                                            <span className="font-medium text-purple-700">{term.name}</span>
                                                            {term.domain && (
                                                                <span className="ml-2 text-gray-400">({term.domain})</span>
                                                            )}
                                                            {term.description && (
                                                                <p className="text-gray-600 mt-0.5">{term.description}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                                                <div className="flex flex-wrap gap-1">
                                                                    {prop.glossaryTerms?.map(term => (
                                                                        <span key={term.id} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px]">
                                                                            {term.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {(prop.aspects?.length || 0) > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {prop.aspects?.map(aspect => {
                                                                        const aspectType = AVAILABLE_ASPECT_TYPES.find(at => at.id === aspect.aspectTypeId);
                                                                        const valueStr = Object.entries(aspect.values || {})
                                                                            .filter(([_, v]) => v !== undefined && v !== '')
                                                                            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                                                                            .join(', ');
                                                                        return (
                                                                            <span key={aspect.aspectTypeId} className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[10px]">
                                                                                {aspectType?.name || aspect.aspectTypeId}{valueStr ? ` (${valueStr})` : ''}
                                                                            </span>
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
        </div>
    );
};

const EntityConfigView: React.FC<any> = ({ 
    entity, model, setModel, availableColumns, currentEntityTableName, 
    editingBindingId, setEditingBindingId, tempBindingValue, setTempBindingValue, 
    saveBinding, startEditingBinding, onLinkClick 
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Physical Binding</label>
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
                                    
                                    {/* Binding Editor */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Column Binding</label>
                                        {editingBindingId === prop.id ? (
                                            <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={tempBindingValue}
                                                            onChange={(e) => setTempBindingValue(e.target.value)}
                                                            className="w-full text-xs border border-blue-300 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none"
                                                            autoFocus
                                                        >
                                                            <option value="">Select column...</option>
                                                            {availableColumns.map(col => (
                                                                <option key={col.name} value={`${currentEntityTableName}.${col.name}`}>
                                                                    {col.name} ({col.type})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={12}/>
                                                    </div>
                                                    <button onClick={() => saveBinding(entity.id, prop.id)} className="text-white bg-green-500 hover:bg-green-600 p-1 rounded shadow-sm"><Check size={14}/></button>
                                                    <button onClick={() => setEditingBindingId(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded"><X size={14}/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <Database size={14} className="text-blue-500" />
                                                    <span className="text-sm font-mono text-gray-700">
                                                        {prop.binding || 'Not bound'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditingBinding(prop.id, prop.binding);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Edit
                                                </button>
                                            </div>
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

const DeployModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [engine, setEngine] = useState('BigQuery');
    const [project, setProject] = useState('');
    const [dataset, setDataset] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    const handleDeploy = () => {
        setIsDeploying(true);
        // Simulate API call
        setTimeout(() => {
            setIsDeploying(false);
            setDeployed(true);
        }, 1500);
    };

    if (deployed) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-[480px] p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <Check size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Deployment Successful</h2>
                    <p className="text-gray-600 mb-6">Your semantic model has been deployed to {engine} and is ready for querying.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Done</button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                        <Rocket size={18} className="text-blue-600"/>
                        Deploy Semantic Model
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>
                
                <div className="p-6">
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
                        <Database size={18} className="shrink-0 mt-0.5"/>
                        <p>We will create a graph deployed on one of the following engines to retrieve data.</p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Pick engine</label>
                            <div className="relative">
                                <select 
                                    value={engine} 
                                    onChange={(e) => setEngine(e.target.value)}
                                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option value="BigQuery">BigQuery</option>
                                    <option value="Spanner">Spanner</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16}/>
                            </div>
                        </div>

                        {engine === 'BigQuery' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Project</label>
                                    <input 
                                        type="text" 
                                        value={project}
                                        onChange={(e) => setProject(e.target.value)}
                                        placeholder="e.g. my-gcp-project-id"
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Dataset</label>
                                    <input 
                                        type="text" 
                                        value={dataset}
                                        onChange={(e) => setDataset(e.target.value)}
                                        placeholder="e.g. semantic_layer_dataset"
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                        
                        {engine === 'Spanner' && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                                Note: Spanner Graph requires a pre-provisioned instance with Graph support enabled.
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                    <button 
                        onClick={handleDeploy}
                        disabled={(engine === 'BigQuery' && (!project || !dataset)) || isDeploying}
                        className="px-6 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 transition-colors"
                    >
                        {isDeploying ? 'Deploying...' : 'Confirm & Deploy'}
                    </button>
                </div>
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