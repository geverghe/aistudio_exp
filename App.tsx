import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { SideNav } from './components/SideNav';
import { Dashboard } from './components/Dashboard';
import { SemanticBuilder } from './components/SemanticBuilder';
import { AgentChat } from './components/AgentChat';
import { ViewState, SemanticModel, SemanticModelCollection, EntityType, PropertyType } from './types';

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
            { id: 'trip_1', name: 'Trip ID', dataType: 'STRING', description: 'Unique identifier for the trip', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'trip_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'trip_2', name: 'Vendor ID', dataType: 'STRING', description: 'Code indicating the provider associated with the trip record', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'vendor_id', propertyType: PropertyType.DIMENSION },
            { id: 'trip_3', name: 'Pickup Datetime', dataType: 'TIMESTAMP', description: 'Date and time when the meter was engaged', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'pickup_datetime', propertyType: PropertyType.DIMENSION },
            { id: 'trip_4', name: 'Dropoff Datetime', dataType: 'TIMESTAMP', description: 'Date and time when the meter was disengaged', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'dropoff_datetime', propertyType: PropertyType.DIMENSION },
            { id: 'trip_5', name: 'Passenger Count', dataType: 'INTEGER', description: 'Number of passengers in the vehicle', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'passenger_count', propertyType: PropertyType.MEASURE },
            { id: 'trip_6', name: 'Trip Distance', dataType: 'FLOAT', description: 'Elapsed trip distance in miles', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'trip_distance', propertyType: PropertyType.MEASURE },
            { id: 'trip_7', name: 'Pickup Location ID', dataType: 'INTEGER', description: 'TLC Taxi Zone where the meter was engaged', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'PULocationID', propertyType: PropertyType.DIMENSION },
            { id: 'trip_8', name: 'Dropoff Location ID', dataType: 'INTEGER', description: 'TLC Taxi Zone where the meter was disengaged', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'DOLocationID', propertyType: PropertyType.DIMENSION },
            { id: 'trip_9', name: 'Rate Code ID', dataType: 'INTEGER', description: 'Final rate code in effect at end of trip', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'rate_code_id', propertyType: PropertyType.DIMENSION },
            { id: 'trip_10', name: 'Payment Type', dataType: 'STRING', description: 'How the passenger paid for the trip', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'payment_type', propertyType: PropertyType.DIMENSION },
            { id: 'trip_11', name: 'Fare Amount', dataType: 'FLOAT', description: 'Time-and-distance fare calculated by the meter', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'fare_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_12', name: 'Tip Amount', dataType: 'FLOAT', description: 'Tip amount (automatically populated for credit card payments)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'tip_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_13', name: 'Tolls Amount', dataType: 'FLOAT', description: 'Total amount of all tolls paid in trip', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'tolls_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_14', name: 'Total Amount', dataType: 'FLOAT', description: 'Total amount charged to passengers (excludes cash tips)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'total_amount', propertyType: PropertyType.MEASURE },
            { id: 'trip_15', name: 'Congestion Surcharge', dataType: 'FLOAT', description: 'CBD congestion fee for trips in Manhattan', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_yellow_trips_2024', bindingColumn: 'cbd_congestion_fee', propertyType: PropertyType.MEASURE }
          ]
        },
        {
          id: 'ent_pickup_zone',
          name: 'Pickup Zone',
          type: EntityType.DIMENSION,
          description: 'Geographic zones where taxi pickups occur, based on TLC taxi zone boundaries',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york_taxi_trips.taxi_zone_geom' }],
          properties: [
            { id: 'pz_1', name: 'Zone ID', dataType: 'INTEGER', description: 'Unique identifier for the taxi zone', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'pz_2', name: 'Zone Name', dataType: 'STRING', description: 'Name of the taxi zone', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_name', propertyType: PropertyType.DIMENSION },
            { id: 'pz_3', name: 'Borough', dataType: 'STRING', description: 'NYC borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'borough', propertyType: PropertyType.DIMENSION },
            { id: 'pz_4', name: 'Zone Geometry', dataType: 'GEOGRAPHY', description: 'Spatial polygon boundary of the zone', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_geom', propertyType: PropertyType.OTHER }
          ]
        },
        {
          id: 'ent_dropoff_zone',
          name: 'Dropoff Zone',
          type: EntityType.DIMENSION,
          description: 'Geographic zones where taxi dropoffs occur, based on TLC taxi zone boundaries',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york_taxi_trips.taxi_zone_geom' }],
          properties: [
            { id: 'dz_1', name: 'Zone ID', dataType: 'INTEGER', description: 'Unique identifier for the taxi zone', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'dz_2', name: 'Zone Name', dataType: 'STRING', description: 'Name of the taxi zone', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'zone_name', propertyType: PropertyType.DIMENSION },
            { id: 'dz_3', name: 'Borough', dataType: 'STRING', description: 'NYC borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york_taxi_trips', bindingTable: 'taxi_zone_geom', bindingColumn: 'borough', propertyType: PropertyType.DIMENSION }
          ]
        },
        {
          id: 'ent_vendor',
          name: 'Vendor',
          type: EntityType.DIMENSION,
          description: 'Taxi technology providers that supply trip data to TLC',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_vendor' }],
          properties: [
            { id: 'v_1', name: 'Vendor ID', dataType: 'STRING', description: 'Unique code for the vendor', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_vendor', bindingColumn: 'vendor_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'v_2', name: 'Vendor Name', dataType: 'STRING', description: 'Name of the technology provider (e.g., Creative Mobile Technologies, VeriFone)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_vendor', bindingColumn: 'vendor_name', propertyType: PropertyType.DIMENSION }
          ]
        },
        {
          id: 'ent_payment_type',
          name: 'Payment Type',
          type: EntityType.DIMENSION,
          description: 'Methods of payment accepted for taxi trips',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_payment_type' }],
          properties: [
            { id: 'pt_1', name: 'Payment Code', dataType: 'STRING', description: 'Code representing payment method', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_payment_type', bindingColumn: 'payment_type', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'pt_2', name: 'Payment Method', dataType: 'STRING', description: 'Description of payment type (Credit Card, Cash, No Charge, Dispute, Unknown)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_payment_type', bindingColumn: 'payment_description', propertyType: PropertyType.DIMENSION }
          ]
        },
        {
          id: 'ent_rate_code',
          name: 'Rate Code',
          type: EntityType.DIMENSION,
          description: 'Rate codes determining how the fare is calculated',
          bindings: [{ type: 'BIGQUERY', resource: 'bigquery-public-data.new_york.tlc_rate_code' }],
          properties: [
            { id: 'rc_1', name: 'Rate Code ID', dataType: 'INTEGER', description: 'Numeric code for the rate type', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_rate_code', bindingColumn: 'rate_code_id', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
            { id: 'rc_2', name: 'Rate Description', dataType: 'STRING', description: 'Description of rate (Standard, JFK, Newark, Nassau/Westchester, Negotiated, Group Ride)', bindingType: 'column', bindingSystem: 'bigquery', bindingProject: 'bigquery-public-data', bindingDataset: 'new_york', bindingTable: 'tlc_rate_code', bindingColumn: 'rate_description', propertyType: PropertyType.DIMENSION }
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
  
  const activeModel = activeModelId ? modelCollection.models.find(m => m.id === activeModelId) : null;
  
  const updateActiveModel = (updatedModel: SemanticModel) => {
    setModelCollection(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === updatedModel.id ? updatedModel : m)
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav currentView={currentView} onNavigate={setCurrentView} />
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
                />
            )}
            {currentView === ViewState.AGENT_CHAT && (
                <AgentChat model={activeModel} />
            )}
        </main>
      </div>
    </div>
  );
}

export default App;