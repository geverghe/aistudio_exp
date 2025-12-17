import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { SideNav } from './components/SideNav';
import { Dashboard } from './components/Dashboard';
import { SemanticBuilder } from './components/SemanticBuilder';
import { AgentChat } from './components/AgentChat';
import { BigQueryAgents } from './components/BigQueryAgents';
import { ViewState, SemanticModel, SemanticModelCollection, EntityType, PropertyType, EntityUpdateSuggestion, SuggestionStatus, SuggestionSource, SuggestionType, DescriptionHistory, Property } from './types';

// Mock initial data based on the PDF examples (Revenue Domain)
const INITIAL_MODELS: SemanticModelCollection = {
  models: [
    {
      id: 'model_revenue',
      name: 'Revenue Domain',
      description: 'Semantic model for revenue analytics including products, inventory, and sales data',
      domain: 'Finance',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-12-01'),
      entities: [
        {
          id: 'ent_prod',
          name: 'Product',
          type: EntityType.ENTITY,
          description: 'Physical goods sold by the company',
          properties: [
            { id: 'p1', name: 'Product SKU', dataType: 'STRING', description: 'Unique identifier', binding: 'DWH_DIM_PROD.sku_id' },
            { id: 'p2', name: 'Product Name', dataType: 'STRING', description: 'Display name', binding: 'DWH_DIM_PROD.product_name' },
            { id: 'p3', name: 'Category', dataType: 'STRING', description: 'Product category', binding: 'DWH_DIM_PROD.product_category' }
          ]
        },
        {
          id: 'ent_inventory',
          name: 'Inventory',
          type: EntityType.ENTITY,
          description: 'Current stock levels in warehouses',
          properties: [
            { id: 'i1', name: 'Product SKU', dataType: 'STRING', description: 'Foreign key to Product', binding: 'OLTP_INV_SKU.sku_id' },
            { id: 'i2', name: 'Current Stock', dataType: 'INTEGER', description: 'Quantity on hand', binding: 'OLTP_INV_SKU.current_stock_qty' },
            { id: 'i3', name: 'Last Updated', dataType: 'TIMESTAMP', description: 'Time of last check', binding: 'OLTP_INV_SKU.last_updated_ts' }
          ]
        }
      ],
      relationships: [
        {
          id: 'rel_prod_inv',
          sourceEntityId: 'ent_prod',
          targetEntityId: 'ent_inventory',
          type: 'ONE_TO_MANY',
          description: 'Inventory availability for products',
          label: 'Has Inventory'
        }
      ]
    },
    {
      id: 'model_customer',
      name: 'Customer Domain',
      description: 'Customer lifecycle and engagement analytics',
      domain: 'Marketing',
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-11-20'),
      entities: [],
      relationships: []
    },
    {
      id: 'model_operations',
      name: 'Operations Domain',
      description: 'Supply chain and logistics semantic model',
      domain: 'Operations',
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-10-15'),
      entities: [],
      relationships: []
    },
    {
      id: 'model_nyc_taxi',
      name: 'NYC Taxi Analytics',
      description: 'Semantic model for NYC Taxi & Limousine Commission trip data analysis, fare prediction, and transportation insights',
      domain: 'Transportation',
      createdAt: new Date('2024-12-14'),
      updatedAt: new Date('2024-12-14'),
      entities: [
        {
          id: 'ent_trip',
          name: 'Trip',
          type: EntityType.FACT,
          description: 'Individual taxi trip records capturing ride details, fares, and passenger information',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_yellow_trips_2024' }],
          properties: [
            { id: 'trip_1', name: 'Trip ID', dataType: 'STRING', description: 'Unique identifier for the trip', binding: 'tlc_yellow_trips_2024.trip_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'trip_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'trip_2', name: 'Vendor ID', dataType: 'STRING', description: 'Code indicating the provider associated with the trip record', binding: 'tlc_yellow_trips_2024.vendor_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'vendor_id', propertyType: PropertyType.DIMENSION },
            { id: 'trip_3', name: 'Pickup Datetime', dataType: 'TIMESTAMP', description: 'Date and time when the meter was engaged', binding: 'tlc_yellow_trips_2024.pickup_datetime', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'pickup_datetime', propertyType: PropertyType.DIMENSION },
            { id: 'trip_4', name: 'Dropoff Datetime', dataType: 'TIMESTAMP', description: 'Date and time when the meter was disengaged', binding: 'tlc_yellow_trips_2024.dropoff_datetime', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'dropoff_datetime', propertyType: PropertyType.DIMENSION },
            { id: 'trip_5', name: 'Passenger Count', dataType: 'INTEGER', description: 'Number of passengers in the vehicle', binding: 'tlc_yellow_trips_2024.passenger_count', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'passenger_count', propertyType: PropertyType.MEASURE },
            { id: 'trip_6', name: 'Trip Distance', dataType: 'FLOAT', description: 'Elapsed trip distance in miles', binding: 'tlc_yellow_trips_2024.trip_distance', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'trip_distance', propertyType: PropertyType.MEASURE },
            { id: 'trip_7', name: 'Pickup Location ID', dataType: 'INTEGER', description: 'TLC Taxi Zone where the meter was engaged', binding: 'tlc_yellow_trips_2024.PULocationID', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'PULocationID', propertyType: PropertyType.DIMENSION },
            { id: 'trip_8', name: 'Dropoff Location ID', dataType: 'INTEGER', description: 'TLC Taxi Zone where the meter was disengaged', binding: 'tlc_yellow_trips_2024.DOLocationID', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'DOLocationID', propertyType: PropertyType.DIMENSION },
            { id: 'trip_9', name: 'Rate Code ID', dataType: 'INTEGER', description: 'Final rate code in effect at end of trip', binding: 'tlc_yellow_trips_2024.rate_code_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'rate_code_id', propertyType: PropertyType.DIMENSION },
            { id: 'trip_10', name: 'Payment Type', dataType: 'STRING', description: 'How the passenger paid for the trip', binding: 'tlc_yellow_trips_2024.payment_type', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'payment_type', propertyType: PropertyType.DIMENSION },
            { id: 'trip_11', name: 'Fare Amount', dataType: 'FLOAT', description: 'Time-and-distance fare calculated by the meter', binding: 'tlc_yellow_trips_2024.fare_amount', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'fare_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_12', name: 'Tip Amount', dataType: 'FLOAT', description: 'Tip amount (automatically populated for credit card payments)', binding: 'tlc_yellow_trips_2024.tip_amount', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'tip_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_13', name: 'Tolls Amount', dataType: 'FLOAT', description: 'Total amount of all tolls paid in trip', binding: 'tlc_yellow_trips_2024.tolls_amount', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'tolls_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_14', name: 'Total Amount', dataType: 'FLOAT', description: 'Total amount charged to passengers (excludes cash tips)', binding: 'tlc_yellow_trips_2024.total_amount', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'total_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_15', name: 'Congestion Surcharge', dataType: 'FLOAT', description: 'CBD congestion fee for trips in Manhattan', binding: 'tlc_yellow_trips_2024.cbd_congestion_fee', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'cbd_congestion_fee', propertyType: PropertyType.MEASURE }
          ]
        },
        {
          id: 'ent_pickup_zone',
          name: 'Pickup Zone',
          type: EntityType.DIMENSION,
          description: 'Geographic zones where taxi pickups occur, based on TLC taxi zone boundaries',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york_taxi_trips.taxi_zone_geom' }],
          properties: [
            { id: 'pz_1', name: 'Zone ID', dataType: 'INTEGER', description: 'Unique identifier for the taxi zone', binding: 'taxi_zone_geom.zone_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'pz_2', name: 'Zone Name', dataType: 'STRING', description: 'Name of the taxi zone', binding: 'taxi_zone_geom.zone_name', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_name', propertyType: PropertyType.DIMENSION },
            { id: 'pz_3', name: 'Borough', dataType: 'STRING', description: 'NYC borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)', binding: 'taxi_zone_geom.borough', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'borough', propertyType: PropertyType.DIMENSION },
            { id: 'pz_4', name: 'Zone Geometry', dataType: 'GEOGRAPHY', description: 'Spatial polygon boundary of the zone', binding: 'taxi_zone_geom.zone_geom', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_geom', propertyType: PropertyType.OTHER }
          ]
        },
        {
          id: 'ent_dropoff_zone',
          name: 'Dropoff Zone',
          type: EntityType.DIMENSION,
          description: 'Geographic zones where taxi dropoffs occur, based on TLC taxi zone boundaries',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york_taxi_trips.taxi_zone_geom' }],
          properties: [
            { id: 'dz_1', name: 'Zone ID', dataType: 'INTEGER', description: 'Unique identifier for the taxi zone', binding: 'taxi_zone_geom.zone_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'dz_2', name: 'Zone Name', dataType: 'STRING', description: 'Name of the taxi zone', binding: 'taxi_zone_geom.zone_name', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_name', propertyType: PropertyType.DIMENSION },
            { id: 'dz_3', name: 'Borough', dataType: 'STRING', description: 'NYC borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)', binding: 'taxi_zone_geom.borough', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'borough', propertyType: PropertyType.DIMENSION }
          ]
        },
        {
          id: 'ent_vendor',
          name: 'Vendor',
          type: EntityType.DIMENSION,
          description: 'Taxi technology providers that supply trip data to TLC',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_vendor' }],
          properties: [
            { id: 'v_1', name: 'Vendor ID', dataType: 'STRING', description: 'Unique code for the vendor', binding: 'tlc_vendor.vendor_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_vendor', bindingColumn: 'vendor_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'v_2', name: 'Vendor Name', dataType: 'STRING', description: 'Name of the technology provider (e.g., Creative Mobile Technologies, VeriFone)', binding: 'tlc_vendor.vendor_name', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_vendor', bindingColumn: 'vendor_name', propertyType: PropertyType.DIMENSION }
          ]
        },
        {
          id: 'ent_payment_type',
          name: 'Payment Type',
          type: EntityType.DIMENSION,
          description: 'Methods of payment accepted for taxi trips',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_payment_type' }],
          properties: [
            { id: 'pt_1', name: 'Payment Code', dataType: 'STRING', description: 'Code representing payment method', binding: 'tlc_payment_type.payment_type', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_payment_type', bindingColumn: 'payment_type', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'pt_2', name: 'Payment Method', dataType: 'STRING', description: 'Description of payment type (Credit Card, Cash, No Charge, Dispute, Unknown)', binding: 'tlc_payment_type.payment_description', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_payment_type', bindingColumn: 'payment_description', propertyType: PropertyType.DIMENSION }
          ]
        },
        {
          id: 'ent_rate_code',
          name: 'Rate Code',
          type: EntityType.DIMENSION,
          description: 'Rate codes determining how the fare is calculated',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_rate_code' }],
          properties: [
            { id: 'rc_1', name: 'Rate Code ID', dataType: 'INTEGER', description: 'Numeric code for the rate type', binding: 'tlc_rate_code.rate_code_id', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_rate_code', bindingColumn: 'rate_code_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'rc_2', name: 'Rate Description', dataType: 'STRING', description: 'Description of rate (Standard, JFK, Newark, Nassau/Westchester, Negotiated, Group Ride)', binding: 'tlc_rate_code.rate_description', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_rate_code', bindingColumn: 'rate_description', propertyType: PropertyType.DIMENSION }
          ]
        }
      ],
      relationships: [
        {
          id: 'rel_trip_pickup',
          sourceEntityId: 'ent_pickup_zone',
          sourcePropertyId: 'pz_1',
          targetEntityId: 'ent_trip',
          targetPropertyId: 'trip_7',
          type: 'ONE_TO_MANY',
          title: 'Pickup Location',
          label: 'picked_up_at',
          description: 'Links pickup zone to trips that originated there'
        },
        {
          id: 'rel_trip_dropoff',
          sourceEntityId: 'ent_dropoff_zone',
          sourcePropertyId: 'dz_1',
          targetEntityId: 'ent_trip',
          targetPropertyId: 'trip_8',
          type: 'ONE_TO_MANY',
          title: 'Dropoff Location',
          label: 'dropped_off_at',
          description: 'Links dropoff zone to trips that ended there'
        },
        {
          id: 'rel_trip_vendor',
          sourceEntityId: 'ent_vendor',
          sourcePropertyId: 'v_1',
          targetEntityId: 'ent_trip',
          targetPropertyId: 'trip_2',
          type: 'ONE_TO_MANY',
          title: 'Serviced By',
          label: 'serviced_by',
          description: 'Links vendor to trips they processed'
        },
        {
          id: 'rel_trip_payment',
          sourceEntityId: 'ent_payment_type',
          sourcePropertyId: 'pt_1',
          targetEntityId: 'ent_trip',
          targetPropertyId: 'trip_10',
          type: 'ONE_TO_MANY',
          title: 'Paid With',
          label: 'paid_with',
          description: 'Links payment method to trips using it'
        },
        {
          id: 'rel_trip_rate',
          sourceEntityId: 'ent_rate_code',
          sourcePropertyId: 'rc_1',
          targetEntityId: 'ent_trip',
          targetPropertyId: 'trip_9',
          type: 'ONE_TO_MANY',
          title: 'Rate Applied',
          label: 'charged_at',
          description: 'Links rate code to trips that used it'
        }
      ]
    }
  ]
};

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [modelCollection, setModelCollection] = useState<SemanticModelCollection>(INITIAL_MODELS);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<EntityUpdateSuggestion[]>([]);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(false);
  
  const activeModel = activeModelId ? modelCollection.models.find(m => m.id === activeModelId) : null;
  
  const updateActiveModel = (updatedModel: SemanticModel) => {
    setModelCollection(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === updatedModel.id ? updatedModel : m)
    }));
  };

  const handleAddSuggestion = useCallback((suggestion: Omit<EntityUpdateSuggestion, 'id' | 'createdAt' | 'status'>) => {
    const newSuggestion: EntityUpdateSuggestion = {
      ...suggestion,
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: SuggestionStatus.PENDING
    };
    setSuggestions(prev => [...prev, newSuggestion]);
    console.log(`[Suggestion] New ${suggestion.type} for "${suggestion.entityName}": ${suggestion.reason || 'Review suggested changes'}`);
    return newSuggestion;
  }, []);

  const handleApproveSuggestion = useCallback((suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion || !activeModel || suggestion.status !== SuggestionStatus.PENDING) return;

    if (suggestion.type === SuggestionType.NEW_PROPERTY && suggestion.suggestedProperties) {
      const entity = activeModel.entities.find(e => e.id === suggestion.entityId);
      if (entity) {
        const existingPropNames = new Set(entity.properties.map(p => p.name));
        const newProperties = suggestion.suggestedProperties
          .map(ps => ps.property)
          .filter(p => !existingPropNames.has(p.name));
        
        if (newProperties.length > 0) {
          updateActiveModel({
            ...activeModel,
            entities: activeModel.entities.map(e => 
              e.id === suggestion.entityId 
                ? { ...e, properties: [...e.properties, ...newProperties] }
                : e
            ),
            updatedAt: new Date()
          });
          console.log(`[Suggestion] APPROVED: Added ${newProperties.length} new properties to "${suggestion.entityName}"`);
        }
      }
    } else if (suggestion.type === SuggestionType.UPDATED_DESCRIPTION && suggestion.suggestedDescription) {
      updateActiveModel({
        ...activeModel,
        entities: activeModel.entities.map(e => {
          if (e.id !== suggestion.entityId) return e;
          
          const historyEntry: DescriptionHistory = {
            content: e.description,
            timestamp: new Date(),
            author: 'System'
          };
          const existingHistory = e.descriptionHistory || [];
          
          return {
            ...e,
            description: suggestion.suggestedDescription!,
            descriptionHistory: [...existingHistory, historyEntry]
          };
        }),
        updatedAt: new Date()
      });
      console.log(`[Suggestion] APPROVED: Updated description for "${suggestion.entityName}" (previous saved to history)`);
    }

    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: SuggestionStatus.APPROVED, reviewedAt: new Date() }
        : s
    ));
  }, [suggestions, activeModel]);

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion || suggestion.status !== SuggestionStatus.PENDING) return;
    
    console.log(`[Suggestion] REJECTED: ${suggestion.type} for "${suggestion.entityName}"`);
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: SuggestionStatus.REJECTED, reviewedAt: new Date() }
        : s
    ));
  }, [suggestions]);

  const handleTopBarNotificationClick = () => {
    if (currentView !== ViewState.SEMANTIC_MODELER) {
      setCurrentView(ViewState.SEMANTIC_MODELER);
    }
    setIsSuggestionPanelOpen(true);
  };

  // Simulate backend schema sync - creates suggestions when supply chain model is active
  useEffect(() => {
    if (!activeModel) return;
    
    // Check if this is a supply chain model with specific entities
    const hasSupplierEntity = activeModel.entities.some(e => e.id === 'entity_supplier');
    const hasWarehouseEntity = activeModel.entities.some(e => e.id === 'entity_warehouse');
    
    if (!hasSupplierEntity && !hasWarehouseEntity) return;
    
    // Simulate backend sync after a short delay
    const syncTimer = setTimeout(() => {
      const pendingSuggestions = suggestions.filter(s => s.status === SuggestionStatus.PENDING);
      
      // Mock new properties for supplier entity
      if (hasSupplierEntity) {
        const supplierEntity = activeModel.entities.find(e => e.id === 'entity_supplier');
        if (supplierEntity) {
          const existingPropNames = new Set(supplierEntity.properties.map(p => p.name));
          const newProps = [
            { id: 'prop_supplier_contact_email', name: 'contact_email', dataType: 'STRING', description: 'Primary contact email for the supplier' },
            { id: 'prop_supplier_payment_terms', name: 'payment_terms', dataType: 'STRING', description: 'Standard payment terms (Net 30, Net 60, etc.)' }
          ].filter(p => !existingPropNames.has(p.name));
          
          const hasPendingSuggestion = pendingSuggestions.some(s => 
            s.entityId === 'entity_supplier' && s.type === SuggestionType.NEW_PROPERTY
          );
          
          if (newProps.length > 0 && !hasPendingSuggestion) {
            handleAddSuggestion({
              entityId: 'entity_supplier',
              entityName: supplierEntity.name,
              type: SuggestionType.NEW_PROPERTY,
              source: SuggestionSource.SCHEMA_SYNC,
              suggestedProperties: newProps.map(p => ({ property: p, reason: 'Detected in data source schema' })),
              reason: `Found ${newProps.length} new column(s) in the data source`
            });
          }
        }
      }
      
      // Mock description update for warehouse entity
      if (hasWarehouseEntity) {
        const warehouseEntity = activeModel.entities.find(e => e.id === 'entity_warehouse');
        const suggestedDesc = 'Distribution centers, fulfillment hubs, and cold storage facilities for inventory management';
        
        if (warehouseEntity && warehouseEntity.description !== suggestedDesc) {
          const hasPendingDescSuggestion = pendingSuggestions.some(s => 
            s.entityId === 'entity_warehouse' && s.type === SuggestionType.UPDATED_DESCRIPTION
          );
          
          if (!hasPendingDescSuggestion) {
            handleAddSuggestion({
              entityId: 'entity_warehouse',
              entityName: warehouseEntity.name,
              type: SuggestionType.UPDATED_DESCRIPTION,
              source: SuggestionSource.AI_GENERATION,
              currentDescription: warehouseEntity.description,
              suggestedDescription: suggestedDesc,
              reason: 'AI-suggested improved description based on data patterns'
            });
          }
        }
      }
    }, 2000); // 2 second delay to simulate backend processing
    
    return () => clearTimeout(syncTimer);
  }, [activeModelId, activeModel?.entities]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar 
        suggestions={suggestions}
        onSuggestionClick={handleTopBarNotificationClick}
        onNavigateToBigQuery={() => setCurrentView(ViewState.BIGQUERY)}
      />
      <div className="flex flex-1 overflow-hidden">
        {currentView !== ViewState.BIGQUERY && (
          <SideNav currentView={currentView} onNavigate={setCurrentView} />
        )}
        <main className="flex-1 overflow-auto relative">
            {currentView === ViewState.DASHBOARD && <Dashboard />}
            {currentView === ViewState.SEMANTIC_MODELER && (
                <SemanticBuilder 
                  models={modelCollection.models}
                  activeModelId={activeModelId}
                  onSelectModel={setActiveModelId}
                  onUpdateModel={updateActiveModel}
                  onCreateModel={(newModel) => {
                    setModelCollection(prev => ({
                      ...prev,
                      models: [...prev.models, newModel]
                    }));
                    setActiveModelId(newModel.id);
                  }}
                  onDeleteModel={(modelId) => {
                    setModelCollection(prev => ({
                      ...prev,
                      models: prev.models.filter(m => m.id !== modelId)
                    }));
                    if (activeModelId === modelId) {
                      setActiveModelId(null);
                    }
                  }}
                  suggestions={suggestions}
                  onAddSuggestion={handleAddSuggestion}
                  onApproveSuggestion={handleApproveSuggestion}
                  onRejectSuggestion={handleRejectSuggestion}
                  isSuggestionPanelOpen={isSuggestionPanelOpen}
                  setIsSuggestionPanelOpen={setIsSuggestionPanelOpen}
                />
            )}
            {currentView === ViewState.AGENT_CHAT && (
                <AgentChat model={activeModel} />
            )}
            {currentView === ViewState.BIGQUERY && (
                <BigQueryAgents onBack={() => setCurrentView(ViewState.DASHBOARD)} />
            )}
        </main>
      </div>
    </div>
  );
}

export default App;
