import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { SideNav } from './components/SideNav';
import { Dashboard } from './components/Dashboard';
import { SemanticBuilder } from './components/SemanticBuilder';
import { AgentChat } from './components/AgentChat';
import { ViewState, SemanticModel, EntityType } from './types';

// Mock initial data based on the PDF examples (Revenue Domain)
const INITIAL_MODEL: SemanticModel = {
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
};

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [semanticModel, setSemanticModel] = useState<SemanticModel>(INITIAL_MODEL);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav currentView={currentView} onNavigate={setCurrentView} />
        <main className="flex-1 overflow-auto relative">
            {currentView === ViewState.DASHBOARD && <Dashboard />}
            {currentView === ViewState.SEMANTIC_MODELER && (
                <SemanticBuilder model={semanticModel} setModel={setSemanticModel} />
            )}
            {currentView === ViewState.AGENT_CHAT && (
                <AgentChat model={semanticModel} />
            )}
        </main>
      </div>
    </div>
  );
}

export default App;