import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, Filter, Search, Layers, 
  ChevronDown, ChevronRight, Box, Database, BarChart3,
  Move, Grid, List
} from 'lucide-react';
import { Entity, Relationship, EntityType } from '../types';

interface EnterpriseGraphViewProps {
  entities: Entity[];
  relationships: Relationship[];
  onSelectEntity?: (entity: Entity) => void;
  selectedEntityId?: string | null;
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
  selectedEntityId
}) => {
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_COLORS)));
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_COLORS)));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const nodePositions = useMemo(() => {
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

  const visibleRelationships = useMemo(() => {
    const visibleEntityIds = new Set(filteredEntities.map(e => e.id));
    return relationships.filter(rel => 
      visibleEntityIds.has(rel.sourceEntityId) && visibleEntityIds.has(rel.targetEntityId)
    );
  }, [relationships, filteredEntities]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50"
                  >
                    <div 
                      className="w-3 h-3 rounded-sm border-2"
                      style={{ 
                        backgroundColor: selectedCategories.has(category) ? CATEGORY_COLORS[category]?.bg : 'transparent',
                        borderColor: CATEGORY_COLORS[category]?.border 
                      }}
                    />
                    <span className={selectedCategories.has(category) ? 'text-gray-900' : 'text-gray-400'}>
                      {category}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {selectedCategories.has(category) ? visibleCount : ents.length}
                    </span>
                  </button>
                </div>
              );
            })}
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
          </div>
        </div>

        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
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
              transformOrigin: 'center center'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="4"
                refX="5"
                refY="2"
                orient="auto"
              >
                <polygon points="0 0, 6 2, 0 4" fill="#9ca3af" />
              </marker>
            </defs>

            {visibleRelationships.map(rel => {
              const sourcePos = nodePositions[rel.sourceEntityId];
              const targetPos = nodePositions[rel.targetEntityId];
              if (!sourcePos || !targetPos) return null;

              const dx = targetPos.x - sourcePos.x;
              const dy = targetPos.y - sourcePos.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const unitX = dx / len;
              const unitY = dy / len;
              
              const startX = sourcePos.x + unitX * 35;
              const startY = sourcePos.y + unitY * 20;
              const endX = targetPos.x - unitX * 40;
              const endY = targetPos.y - unitY * 25;

              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              const curvature = 20;
              const perpX = -unitY * curvature;
              const perpY = unitX * curvature;

              return (
                <g key={rel.id}>
                  <path
                    d={`M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`}
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}

            {filteredEntities.map(entity => {
              const pos = nodePositions[entity.id];
              if (!pos) return null;
              const category = getEntityCategory(entity.id);
              const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
              const isSelected = selectedEntityId === entity.id;

              return (
                <g 
                  key={entity.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onSelectEntity?.(entity)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x="-55"
                    y="-18"
                    width="110"
                    height="36"
                    rx="4"
                    fill={colors.bg}
                    stroke={isSelected ? '#3b82f6' : colors.border}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="500"
                    fill={colors.text}
                  >
                    {entity.name.length > 14 ? entity.name.substring(0, 12) + '...' : entity.name}
                  </text>
                  <text
                    x="0"
                    y="11"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fill={colors.text}
                    opacity="0.7"
                  >
                    {entity.type}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="h-8 bg-white border-t border-gray-200 flex items-center justify-center gap-4 px-4">
          {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
            <div key={category} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              />
              <span className="text-xs text-gray-500">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
