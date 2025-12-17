import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, Filter, Search, Layers, 
  ChevronDown, ChevronRight, Box, Database, BarChart3,
  Move, Grid, List, Eye, EyeOff, Focus, Target, MessageSquare
} from 'lucide-react';
import { Entity, Relationship, EntityType } from '../types';

interface EnterpriseGraphViewProps {
  entities: Entity[];
  relationships: Relationship[];
  onSelectEntity?: (entity: Entity) => void;
  selectedEntityId?: string | null;
  onOpenChat?: () => void;
}

interface NodePosition {
  x: number;
  y: number;
  category: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Suppliers & Procurement': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  'Manufacturing': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'Products & Inventory': { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  'Logistics & Transportation': { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  'Sales & Orders': { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  'Analytics & Planning': { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  'Other': { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
};

const ENTITY_CATEGORIES: Record<string, string> = {
  'ent_supplier': 'Suppliers & Procurement',
  'ent_supplier_contact': 'Suppliers & Procurement',
  'ent_supplier_location': 'Suppliers & Procurement',
  'ent_purchase_order': 'Suppliers & Procurement',
  'ent_po_line_item': 'Suppliers & Procurement',
  'ent_supplier_contract': 'Suppliers & Procurement',
  'ent_raw_material': 'Suppliers & Procurement',
  'ent_component': 'Suppliers & Procurement',
  'ent_supplier_performance': 'Suppliers & Procurement',
  'ent_procurement_category': 'Suppliers & Procurement',
  
  'ent_plant': 'Manufacturing',
  'ent_production_line': 'Manufacturing',
  'ent_work_order': 'Manufacturing',
  'ent_bill_of_materials': 'Manufacturing',
  'ent_bom_component': 'Manufacturing',
  'ent_equipment': 'Manufacturing',
  'ent_maintenance_record': 'Manufacturing',
  'ent_quality_check': 'Manufacturing',
  'ent_shift': 'Manufacturing',
  'ent_operator': 'Manufacturing',
  
  'ent_product': 'Products & Inventory',
  'ent_product_category': 'Products & Inventory',
  'ent_warehouse': 'Products & Inventory',
  'ent_storage_location': 'Products & Inventory',
  'ent_inventory': 'Products & Inventory',
  'ent_inventory_transaction': 'Products & Inventory',
  'ent_lot': 'Products & Inventory',
  'ent_serial_number': 'Products & Inventory',
  'ent_reorder_point': 'Products & Inventory',
  'ent_stock_valuation': 'Products & Inventory',
  
  'ent_carrier': 'Logistics & Transportation',
  'ent_shipment': 'Logistics & Transportation',
  'ent_shipment_line': 'Logistics & Transportation',
  'ent_route': 'Logistics & Transportation',
  'ent_vehicle': 'Logistics & Transportation',
  'ent_driver': 'Logistics & Transportation',
  'ent_delivery_stop': 'Logistics & Transportation',
  'ent_freight_rate': 'Logistics & Transportation',
  'ent_container': 'Logistics & Transportation',
  'ent_customs_entry': 'Logistics & Transportation',
  
  'ent_customer': 'Sales & Orders',
  'ent_customer_address': 'Sales & Orders',
  'ent_sales_order': 'Sales & Orders',
  'ent_order_line': 'Sales & Orders',
  'ent_sales_channel': 'Sales & Orders',
  'ent_sales_rep': 'Sales & Orders',
  'ent_price_list': 'Sales & Orders',
  'ent_promotion': 'Sales & Orders',
  'ent_return_order': 'Sales & Orders',
  'ent_invoice': 'Sales & Orders',
  
  'ent_demand_forecast': 'Analytics & Planning',
  'ent_supply_plan': 'Analytics & Planning',
  'ent_safety_stock': 'Analytics & Planning',
  'ent_kpi_metric': 'Analytics & Planning',
  'ent_cost_center': 'Analytics & Planning',
  'ent_budget': 'Analytics & Planning',
  'ent_risk_assessment': 'Analytics & Planning',
  'ent_time_dimension': 'Analytics & Planning',
  'ent_geography': 'Analytics & Planning',
  'ent_sustainability': 'Analytics & Planning'
};

const getEntityCategory = (entityId: string): string => {
  return ENTITY_CATEGORIES[entityId] || 'Other';
};

const getEntityTypeIcon = (type: EntityType) => {
  switch (type) {
    case EntityType.DIMENSION:
      return <Box size={10} />;
    case EntityType.FACT:
      return <BarChart3 size={10} />;
    default:
      return <Database size={10} />;
  }
};

export const EnterpriseGraphView: React.FC<EnterpriseGraphViewProps> = ({
  entities,
  relationships,
  onSelectEntity,
  selectedEntityId,
  onOpenChat
}) => {
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_COLORS)));
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_COLORS)));
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showSemanticLayer, setShowSemanticLayer] = useState(true);
  const [showPhysicalLayer, setShowPhysicalLayer] = useState(false);
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats: Record<string, Entity[]> = {};
    entities.forEach(entity => {
      const category = getEntityCategory(entity.id);
      if (!cats[category]) cats[category] = [];
      cats[category].push(entity);
    });
    return cats;
  }, [entities]);

  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      const category = getEntityCategory(entity.id);
      const matchesCategory = selectedCategories.has(category);
      const matchesSearch = !searchQuery || 
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [entities, selectedCategories, searchQuery]);

  const baseNodePositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {};
    const categoryOrder = Object.keys(CATEGORY_COLORS);
    const categoryAngles: Record<string, number> = {};
    
    categoryOrder.forEach((cat, idx) => {
      categoryAngles[cat] = (idx / categoryOrder.length) * 2 * Math.PI - Math.PI / 2;
    });

    const centerX = 600;
    const centerY = 400;
    const categoryRadius = 320;
    const nodeRadius = 120;

    filteredEntities.forEach(entity => {
      const category = getEntityCategory(entity.id);
      const entitiesInCategory = filteredEntities.filter(e => getEntityCategory(e.id) === category);
      const indexInCategory = entitiesInCategory.findIndex(e => e.id === entity.id);
      const totalInCategory = entitiesInCategory.length;
      
      const categoryAngle = categoryAngles[category] || 0;
      const categoryCenterX = centerX + Math.cos(categoryAngle) * categoryRadius;
      const categoryCenterY = centerY + Math.sin(categoryAngle) * categoryRadius;
      
      const angleSpread = Math.min(Math.PI / 3, (totalInCategory * 0.15));
      const startAngle = categoryAngle - angleSpread / 2;
      const angleStep = totalInCategory > 1 ? angleSpread / (totalInCategory - 1) : 0;
      const nodeAngle = startAngle + indexInCategory * angleStep;
      
      const radiusVariation = (indexInCategory % 3) * 25;
      const effectiveRadius = nodeRadius + radiusVariation;
      
      positions[entity.id] = {
        x: categoryCenterX + Math.cos(nodeAngle) * effectiveRadius,
        y: categoryCenterY + Math.sin(nodeAngle) * effectiveRadius,
        category
      };
    });

    return positions;
  }, [filteredEntities]);

  const getNodePosition = (entityId: string): NodePosition | undefined => {
    if (customPositions[entityId]) {
      const base = baseNodePositions[entityId];
      return base ? { ...base, ...customPositions[entityId] } : undefined;
    }
    return baseNodePositions[entityId];
  };

  const visibleRelationships = useMemo(() => {
    const visibleEntityIds = new Set(filteredEntities.map(e => e.id));
    return relationships.filter(rel => 
      visibleEntityIds.has(rel.sourceEntityId) && visibleEntityIds.has(rel.targetEntityId)
    );
  }, [relationships, filteredEntities]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggingNodeId) return;
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setCustomPositions(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: mouseX - dragOffset.x,
          y: mouseY - dragOffset.y
        }
      }));
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const pos = getNodePosition(entityId);
    if (!pos) return;
    
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    
    setDraggingNodeId(entityId);
    setDragOffset({ x: mouseX - pos.x, y: mouseY - pos.y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleExpandCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const resetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
    setFocusedCategory(null);
  };

  const focusOnCategory = (category: string) => {
    const categoryEntities = filteredEntities.filter(e => getEntityCategory(e.id) === category);
    if (categoryEntities.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    categoryEntities.forEach(entity => {
      const pos = getNodePosition(entity.id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
      }
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;
    
    const newZoom = 1.2;
    setPan({
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom
    });
    setZoom(newZoom);
    setFocusedCategory(category);
  };

  const selectOnlyCategory = (category: string) => {
    setSelectedCategories(new Set([category]));
    focusOnCategory(category);
  };

  const showAllCategories = () => {
    setSelectedCategories(new Set(Object.keys(CATEGORY_COLORS)));
    setFocusedCategory(null);
    resetView();
  };

  return (
    <div className="flex h-full">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Categories</span>
            <div className="flex gap-1">
              <button
                onClick={showAllCategories}
                className="p-1 rounded text-gray-400 hover:bg-gray-100"
                title="Show all categories"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`p-1 rounded ${viewMode === 'graph' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {(Object.entries(categories) as [string, Entity[]][]).map(([category, ents]) => {
              const visibleCount = ents.filter((e: Entity) => 
                !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length;
              const isActive = selectedCategories.has(category);
              const isFocused = focusedCategory === category;
              return (
                <div key={category} className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 ${isFocused ? 'ring-1 ring-blue-400' : ''}`}
                  >
                    <div 
                      className="w-3 h-3 rounded-sm border-2"
                      style={{ 
                        backgroundColor: isActive ? CATEGORY_COLORS[category]?.bg : 'transparent',
                        borderColor: CATEGORY_COLORS[category]?.border 
                      }}
                    />
                    <span className={isActive ? 'text-gray-900' : 'text-gray-400'}>
                      {category}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {isActive ? visibleCount : ents.length}
                    </span>
                  </button>
                  <button
                    onClick={() => selectOnlyCategory(category)}
                    className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                    title={`Focus on ${category}`}
                  >
                    <Target size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Layers</span>
          <div className="space-y-1">
            <label className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showSemanticLayer}
                onChange={(e) => setShowSemanticLayer(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Database size={14} className="text-blue-600" />
              <span>Semantic Layer</span>
            </label>
            <label className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showPhysicalLayer}
                onChange={(e) => setShowPhysicalLayer(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <Box size={14} className="text-green-600" />
              <span>Physical Layer</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
            Entities ({filteredEntities.length})
          </div>
          {(Object.entries(categories) as [string, Entity[]][]).map(([category, ents]) => {
            if (!selectedCategories.has(category)) return null;
            const categoryEnts = ents.filter((e: Entity) => 
              !searchQuery || 
              e.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (categoryEnts.length === 0) return null;

            return (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleExpandCategory(category)}
                  className="w-full flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded"
                >
                  {expandedCategories.has(category) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[category]?.border }}
                  />
                  {category}
                </button>
                {expandedCategories.has(category) && (
                  <div className="ml-4 space-y-0.5">
                    {categoryEnts.map(entity => (
                      <button
                        key={entity.id}
                        onClick={() => onSelectEntity?.(entity)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
                          selectedEntityId === entity.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-400">{getEntityTypeIcon(entity.type)}</span>
                        <span className="truncate">{entity.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <div className="h-10 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {filteredEntities.length} entities, {visibleRelationships.length} relationships
            </span>
            {focusedCategory && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Focused: {focusedCategory}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(2, prev + 0.2))}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.max(0.3, prev - 0.2))}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              onClick={resetView}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="Reset view"
            >
              <Maximize2 size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              onClick={() => setCustomPositions({})}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="Reset node positions"
            >
              <Move size={16} />
            </button>
            {onOpenChat && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                  onClick={onOpenChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all"
                  title="Talk to Your Data"
                >
                  <MessageSquare size={14} />
                  <span>Talk to Your Data</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div 
          ref={containerRef}
          className={`flex-1 overflow-hidden ${draggingNodeId ? 'cursor-grabbing' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg 
            width="100%" 
            height="100%" 
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
              </marker>
              <marker
                id="arrowhead-rel"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#0EA5E9" />
              </marker>
              <marker
                id="arrowhead-physical"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#A855F7" />
              </marker>
            </defs>

            {showSemanticLayer && visibleRelationships.map(rel => {
              const sourcePos = getNodePosition(rel.sourceEntityId);
              const targetPos = getNodePosition(rel.targetEntityId);
              if (!sourcePos || !targetPos) return null;

              const startX = sourcePos.x + 100;
              const startY = sourcePos.y + 35;
              const endX = targetPos.x - 100;
              const endY = targetPos.y + 35;
              
              const cp1x = startX + 60;
              const cp1y = startY;
              const cp2x = endX - 60;
              const cp2y = endY;
              
              const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              return (
                <g key={rel.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke="#0EA5E9"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-rel)"
                  />
                  {rel.label && (
                    <g transform={`translate(${midX}, ${midY - 12})`}>
                      <rect
                        x="-35"
                        y="-8"
                        width="70"
                        height="16"
                        rx="8"
                        fill="white"
                        stroke="#BFDBFE"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fontWeight="500"
                        fill="#0284C7"
                        style={{ pointerEvents: 'none' }}
                      >
                        {rel.type === 'ONE_TO_MANY' ? '1:N' : rel.type === 'MANY_TO_ONE' ? 'N:1' : rel.type === 'MANY_TO_MANY' ? 'N:N' : '1:1'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {showPhysicalLayer && filteredEntities.map(entity => {
              const pos = getNodePosition(entity.id);
              if (!pos || !entity.properties?.some(p => p.binding)) return null;

              return entity.properties?.filter(p => p.binding).map((prop, idx) => {
                const bindingParts = prop.binding?.split('.') || [];
                const tableName = bindingParts[0] || 'Unknown Table';
                
                return (
                  <g key={`${entity.id}-binding-${idx}`}>
                    <line
                      x1={pos.x}
                      y1={pos.y + 25}
                      x2={pos.x}
                      y2={pos.y + 60 + idx * 25}
                      stroke="#10b981"
                      strokeWidth="1"
                      strokeDasharray="4,2"
                      opacity="0.6"
                    />
                    <rect
                      x={pos.x - 50}
                      y={pos.y + 50 + idx * 25}
                      width="100"
                      height="20"
                      rx="3"
                      fill="#d1fae5"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 63 + idx * 25}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#065f46"
                    >
                      {tableName.length > 14 ? tableName.substring(0, 12) + '...' : tableName}
                    </text>
                  </g>
                );
              });
            })}

            {showSemanticLayer && filteredEntities.map(entity => {
              const pos = getNodePosition(entity.id);
              if (!pos) return null;
              const category = getEntityCategory(entity.id);
              const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
              const isSelected = selectedEntityId === entity.id;
              const isDragging = draggingNodeId === entity.id;

              return (
                <foreignObject
                  key={entity.id}
                  x={pos.x - 100}
                  y={pos.y}
                  width="200"
                  height="70"
                  className="overflow-visible"
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <div
                    onMouseDown={(e) => handleNodeMouseDown(e, entity.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDragging) {
                        onSelectEntity?.(entity);
                      }
                    }}
                    className={`
                      w-[200px] rounded-lg shadow-sm border-2 p-3 transition-all hover:shadow-md select-none
                      ${isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}
                      ${isSelected ? 'ring-2 ring-sky-200' : ''}
                    `}
                    style={{ 
                      cursor: isDragging ? 'grabbing' : 'grab',
                      backgroundColor: colors.bg,
                      borderColor: isSelected ? '#0ea5e9' : colors.border
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="p-1.5 rounded"
                        style={{ backgroundColor: `${colors.border}20` }}
                      >
                        {entity.type === EntityType.DIMENSION ? (
                          <Box size={14} style={{ color: colors.border }} />
                        ) : entity.type === EntityType.FACT ? (
                          <BarChart3 size={14} style={{ color: colors.border }} />
                        ) : (
                          <Database size={14} style={{ color: colors.border }} />
                        )}
                      </div>
                      <div 
                        className="font-semibold text-sm truncate"
                        style={{ color: colors.text }}
                        title={entity.name}
                      >
                        {entity.name}
                      </div>
                    </div>
                    <div className="text-[10px] pl-8" style={{ color: colors.text, opacity: 0.7 }}>
                      {entity.properties?.length || 0} Properties
                    </div>
                    <div 
                      className="absolute -right-1 top-1/2 w-2 h-2 rounded-full border border-white transform -translate-y-1/2"
                      style={{ backgroundColor: colors.border }}
                    />
                  </div>
                </foreignObject>
              );
            })}
          </svg>
        </div>

        <div className="h-10 bg-white border-t border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {Object.entries(CATEGORY_COLORS).filter(([cat]) => cat !== 'Other').map(([category, colors]) => (
              <button
                key={category}
                onClick={() => selectOnlyCategory(category)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                  focusedCategory === category ? 'ring-1 ring-blue-400 bg-blue-50' : ''
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-sm border"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                />
                <span className="text-xs text-gray-600">{category}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Move size={12} /> Drag to pan
            </span>
            <span>|</span>
            <span>Scroll to zoom</span>
            <span>|</span>
            <span>Drag nodes to reposition</span>
          </div>
        </div>
      </div>
    </div>
  );
};
