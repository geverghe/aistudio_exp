import { SemanticModel, EntityType, PropertyType } from '../types';

export const comprehensiveSupplyChainModel: SemanticModel = {
  id: 'model_supply_chain',
  name: 'Enterprise Supply Chain',
  description: 'Comprehensive end-to-end supply chain semantic model covering procurement, manufacturing, logistics, inventory, distribution, and analytics',
  domain: 'Operations',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-12-17'),
  entities: [
    // SUPPLIERS & PROCUREMENT (10 entities)
    {
      id: 'ent_supplier',
      name: 'Supplier',
      type: EntityType.DIMENSION,
      description: 'External organizations providing raw materials, components, or services',
      properties: [
        { id: 'sup_1', name: 'Supplier ID', dataType: 'STRING', description: 'Unique supplier identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sup_2', name: 'Supplier Name', dataType: 'STRING', description: 'Legal business name', propertyType: PropertyType.DIMENSION },
        { id: 'sup_3', name: 'Supplier Type', dataType: 'STRING', description: 'Classification (Manufacturer, Distributor, Service Provider)', propertyType: PropertyType.DIMENSION },
        { id: 'sup_4', name: 'Reliability Score', dataType: 'FLOAT', description: 'Performance rating 0-100', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_supplier_contact',
      name: 'Supplier Contact',
      type: EntityType.DIMENSION,
      description: 'Key personnel at supplier organizations',
      properties: [
        { id: 'sc_1', name: 'Contact ID', dataType: 'STRING', description: 'Unique contact identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sc_2', name: 'Contact Name', dataType: 'STRING', description: 'Full name', propertyType: PropertyType.DIMENSION },
        { id: 'sc_3', name: 'Role', dataType: 'STRING', description: 'Job title or role', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_supplier_location',
      name: 'Supplier Location',
      type: EntityType.DIMENSION,
      description: 'Physical locations of supplier facilities',
      properties: [
        { id: 'sl_1', name: 'Location ID', dataType: 'STRING', description: 'Unique location identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sl_2', name: 'Country', dataType: 'STRING', description: 'Country code', propertyType: PropertyType.DIMENSION },
        { id: 'sl_3', name: 'Region', dataType: 'STRING', description: 'Geographic region', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_purchase_order',
      name: 'Purchase Order',
      type: EntityType.FACT,
      description: 'Orders placed with suppliers for materials and components',
      properties: [
        { id: 'po_1', name: 'PO Number', dataType: 'STRING', description: 'Purchase order number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'po_2', name: 'Order Date', dataType: 'DATE', description: 'Date order was placed', propertyType: PropertyType.DIMENSION },
        { id: 'po_3', name: 'Total Amount', dataType: 'FLOAT', description: 'Total order value', propertyType: PropertyType.MEASURE },
        { id: 'po_4', name: 'Status', dataType: 'STRING', description: 'Order status', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_po_line_item',
      name: 'PO Line Item',
      type: EntityType.FACT,
      description: 'Individual line items within purchase orders',
      properties: [
        { id: 'poli_1', name: 'Line ID', dataType: 'STRING', description: 'Line item identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'poli_2', name: 'Quantity', dataType: 'INTEGER', description: 'Ordered quantity', propertyType: PropertyType.MEASURE },
        { id: 'poli_3', name: 'Unit Price', dataType: 'FLOAT', description: 'Price per unit', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_supplier_contract',
      name: 'Supplier Contract',
      type: EntityType.ENTITY,
      description: 'Contractual agreements with suppliers',
      properties: [
        { id: 'scon_1', name: 'Contract ID', dataType: 'STRING', description: 'Contract identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'scon_2', name: 'Start Date', dataType: 'DATE', description: 'Contract start', propertyType: PropertyType.DIMENSION },
        { id: 'scon_3', name: 'End Date', dataType: 'DATE', description: 'Contract end', propertyType: PropertyType.DIMENSION },
        { id: 'scon_4', name: 'Contract Value', dataType: 'FLOAT', description: 'Total contract value', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_raw_material',
      name: 'Raw Material',
      type: EntityType.DIMENSION,
      description: 'Base materials used in manufacturing',
      properties: [
        { id: 'rm_1', name: 'Material ID', dataType: 'STRING', description: 'Material code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'rm_2', name: 'Material Name', dataType: 'STRING', description: 'Material description', propertyType: PropertyType.DIMENSION },
        { id: 'rm_3', name: 'Category', dataType: 'STRING', description: 'Material category', propertyType: PropertyType.DIMENSION },
        { id: 'rm_4', name: 'Unit Cost', dataType: 'FLOAT', description: 'Standard unit cost', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_component',
      name: 'Component',
      type: EntityType.DIMENSION,
      description: 'Manufactured or purchased components used in assembly',
      properties: [
        { id: 'comp_1', name: 'Component ID', dataType: 'STRING', description: 'Component SKU', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'comp_2', name: 'Component Name', dataType: 'STRING', description: 'Component description', propertyType: PropertyType.DIMENSION },
        { id: 'comp_3', name: 'Lead Time Days', dataType: 'INTEGER', description: 'Procurement lead time', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_supplier_performance',
      name: 'Supplier Performance',
      type: EntityType.FACT,
      description: 'Historical performance metrics for suppliers',
      properties: [
        { id: 'sp_1', name: 'Performance ID', dataType: 'STRING', description: 'Record identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sp_2', name: 'Period', dataType: 'DATE', description: 'Evaluation period', propertyType: PropertyType.DIMENSION },
        { id: 'sp_3', name: 'On-Time Rate', dataType: 'FLOAT', description: 'On-time delivery percentage', propertyType: PropertyType.MEASURE },
        { id: 'sp_4', name: 'Quality Score', dataType: 'FLOAT', description: 'Quality rating', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_procurement_category',
      name: 'Procurement Category',
      type: EntityType.DIMENSION,
      description: 'Categories for organizing procurement spend',
      properties: [
        { id: 'pc_1', name: 'Category ID', dataType: 'STRING', description: 'Category code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'pc_2', name: 'Category Name', dataType: 'STRING', description: 'Category description', propertyType: PropertyType.DIMENSION }
      ]
    },

    // MANUFACTURING (10 entities)
    {
      id: 'ent_plant',
      name: 'Manufacturing Plant',
      type: EntityType.DIMENSION,
      description: 'Production facilities for manufacturing goods',
      properties: [
        { id: 'plt_1', name: 'Plant ID', dataType: 'STRING', description: 'Plant code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'plt_2', name: 'Plant Name', dataType: 'STRING', description: 'Facility name', propertyType: PropertyType.DIMENSION },
        { id: 'plt_3', name: 'Location', dataType: 'STRING', description: 'Physical address', propertyType: PropertyType.DIMENSION },
        { id: 'plt_4', name: 'Capacity', dataType: 'INTEGER', description: 'Maximum production capacity', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_production_line',
      name: 'Production Line',
      type: EntityType.DIMENSION,
      description: 'Manufacturing lines within plants',
      properties: [
        { id: 'pl_1', name: 'Line ID', dataType: 'STRING', description: 'Production line code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'pl_2', name: 'Line Name', dataType: 'STRING', description: 'Line description', propertyType: PropertyType.DIMENSION },
        { id: 'pl_3', name: 'Line Type', dataType: 'STRING', description: 'Assembly, Packaging, etc.', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_work_order',
      name: 'Work Order',
      type: EntityType.FACT,
      description: 'Production work orders for manufacturing',
      properties: [
        { id: 'wo_1', name: 'Work Order ID', dataType: 'STRING', description: 'Work order number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'wo_2', name: 'Start Date', dataType: 'TIMESTAMP', description: 'Scheduled start', propertyType: PropertyType.DIMENSION },
        { id: 'wo_3', name: 'Planned Quantity', dataType: 'INTEGER', description: 'Target production quantity', propertyType: PropertyType.MEASURE },
        { id: 'wo_4', name: 'Actual Quantity', dataType: 'INTEGER', description: 'Completed quantity', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_bill_of_materials',
      name: 'Bill of Materials',
      type: EntityType.ENTITY,
      description: 'Recipe defining components needed to build a product',
      properties: [
        { id: 'bom_1', name: 'BOM ID', dataType: 'STRING', description: 'BOM identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'bom_2', name: 'Version', dataType: 'STRING', description: 'BOM version', propertyType: PropertyType.DIMENSION },
        { id: 'bom_3', name: 'Effective Date', dataType: 'DATE', description: 'When BOM becomes active', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_bom_component',
      name: 'BOM Component',
      type: EntityType.ENTITY,
      description: 'Components within a bill of materials',
      properties: [
        { id: 'bomc_1', name: 'BOM Component ID', dataType: 'STRING', description: 'Line identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'bomc_2', name: 'Quantity Required', dataType: 'FLOAT', description: 'Units needed per product', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_equipment',
      name: 'Equipment',
      type: EntityType.DIMENSION,
      description: 'Manufacturing machinery and equipment',
      properties: [
        { id: 'eq_1', name: 'Equipment ID', dataType: 'STRING', description: 'Asset tag', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'eq_2', name: 'Equipment Name', dataType: 'STRING', description: 'Machine name', propertyType: PropertyType.DIMENSION },
        { id: 'eq_3', name: 'Equipment Type', dataType: 'STRING', description: 'Machine category', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_maintenance_record',
      name: 'Maintenance Record',
      type: EntityType.FACT,
      description: 'Equipment maintenance history',
      properties: [
        { id: 'mr_1', name: 'Maintenance ID', dataType: 'STRING', description: 'Record identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'mr_2', name: 'Maintenance Date', dataType: 'DATE', description: 'Date performed', propertyType: PropertyType.DIMENSION },
        { id: 'mr_3', name: 'Cost', dataType: 'FLOAT', description: 'Maintenance cost', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_quality_check',
      name: 'Quality Check',
      type: EntityType.FACT,
      description: 'Quality inspection records',
      properties: [
        { id: 'qc_1', name: 'Check ID', dataType: 'STRING', description: 'Inspection ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'qc_2', name: 'Check Date', dataType: 'TIMESTAMP', description: 'Inspection timestamp', propertyType: PropertyType.DIMENSION },
        { id: 'qc_3', name: 'Pass Rate', dataType: 'FLOAT', description: 'Percentage passed', propertyType: PropertyType.MEASURE },
        { id: 'qc_4', name: 'Defect Count', dataType: 'INTEGER', description: 'Number of defects found', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_shift',
      name: 'Shift',
      type: EntityType.DIMENSION,
      description: 'Production shifts in manufacturing',
      properties: [
        { id: 'sh_1', name: 'Shift ID', dataType: 'STRING', description: 'Shift code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sh_2', name: 'Shift Name', dataType: 'STRING', description: 'Morning, Afternoon, Night', propertyType: PropertyType.DIMENSION },
        { id: 'sh_3', name: 'Start Hour', dataType: 'INTEGER', description: 'Shift start hour', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_operator',
      name: 'Operator',
      type: EntityType.DIMENSION,
      description: 'Manufacturing operators and technicians',
      properties: [
        { id: 'op_1', name: 'Operator ID', dataType: 'STRING', description: 'Employee ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'op_2', name: 'Operator Name', dataType: 'STRING', description: 'Full name', propertyType: PropertyType.DIMENSION },
        { id: 'op_3', name: 'Certification Level', dataType: 'STRING', description: 'Skill certification', propertyType: PropertyType.DIMENSION }
      ]
    },

    // PRODUCTS & INVENTORY (10 entities)
    {
      id: 'ent_product',
      name: 'Product',
      type: EntityType.DIMENSION,
      description: 'Finished goods available for sale',
      properties: [
        { id: 'prod_1', name: 'Product SKU', dataType: 'STRING', description: 'Stock keeping unit', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'prod_2', name: 'Product Name', dataType: 'STRING', description: 'Product description', propertyType: PropertyType.DIMENSION },
        { id: 'prod_3', name: 'Category', dataType: 'STRING', description: 'Product category', propertyType: PropertyType.DIMENSION },
        { id: 'prod_4', name: 'Unit Price', dataType: 'FLOAT', description: 'Standard selling price', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_product_category',
      name: 'Product Category',
      type: EntityType.DIMENSION,
      description: 'Hierarchical product categorization',
      properties: [
        { id: 'pcat_1', name: 'Category ID', dataType: 'STRING', description: 'Category code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'pcat_2', name: 'Category Name', dataType: 'STRING', description: 'Category description', propertyType: PropertyType.DIMENSION },
        { id: 'pcat_3', name: 'Parent Category', dataType: 'STRING', description: 'Parent category ID', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_warehouse',
      name: 'Warehouse',
      type: EntityType.DIMENSION,
      description: 'Storage facilities for inventory',
      properties: [
        { id: 'wh_1', name: 'Warehouse ID', dataType: 'STRING', description: 'Warehouse code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'wh_2', name: 'Warehouse Name', dataType: 'STRING', description: 'Facility name', propertyType: PropertyType.DIMENSION },
        { id: 'wh_3', name: 'Location', dataType: 'STRING', description: 'Address', propertyType: PropertyType.DIMENSION },
        { id: 'wh_4', name: 'Capacity Sqft', dataType: 'INTEGER', description: 'Storage capacity', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_storage_location',
      name: 'Storage Location',
      type: EntityType.DIMENSION,
      description: 'Specific bins and locations within warehouses',
      properties: [
        { id: 'sloc_1', name: 'Location Code', dataType: 'STRING', description: 'Bin location', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sloc_2', name: 'Zone', dataType: 'STRING', description: 'Warehouse zone', propertyType: PropertyType.DIMENSION },
        { id: 'sloc_3', name: 'Aisle', dataType: 'STRING', description: 'Aisle number', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_inventory',
      name: 'Inventory',
      type: EntityType.FACT,
      description: 'Current stock levels across locations',
      properties: [
        { id: 'inv_1', name: 'Inventory ID', dataType: 'STRING', description: 'Record identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'inv_2', name: 'Quantity On Hand', dataType: 'INTEGER', description: 'Available stock', propertyType: PropertyType.MEASURE },
        { id: 'inv_3', name: 'Reserved Quantity', dataType: 'INTEGER', description: 'Allocated stock', propertyType: PropertyType.MEASURE },
        { id: 'inv_4', name: 'Last Count Date', dataType: 'DATE', description: 'Last physical count', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_inventory_transaction',
      name: 'Inventory Transaction',
      type: EntityType.FACT,
      description: 'Stock movements and adjustments',
      properties: [
        { id: 'it_1', name: 'Transaction ID', dataType: 'STRING', description: 'Transaction identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'it_2', name: 'Transaction Type', dataType: 'STRING', description: 'Receipt, Issue, Transfer, Adjustment', propertyType: PropertyType.DIMENSION },
        { id: 'it_3', name: 'Quantity', dataType: 'INTEGER', description: 'Units moved', propertyType: PropertyType.MEASURE },
        { id: 'it_4', name: 'Transaction Date', dataType: 'TIMESTAMP', description: 'When occurred', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_lot',
      name: 'Lot',
      type: EntityType.DIMENSION,
      description: 'Production batches for traceability',
      properties: [
        { id: 'lot_1', name: 'Lot Number', dataType: 'STRING', description: 'Batch identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'lot_2', name: 'Production Date', dataType: 'DATE', description: 'When manufactured', propertyType: PropertyType.DIMENSION },
        { id: 'lot_3', name: 'Expiry Date', dataType: 'DATE', description: 'Best before date', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_serial_number',
      name: 'Serial Number',
      type: EntityType.DIMENSION,
      description: 'Individual unit tracking for serialized products',
      properties: [
        { id: 'sn_1', name: 'Serial Number', dataType: 'STRING', description: 'Unique unit ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sn_2', name: 'Status', dataType: 'STRING', description: 'Available, Sold, RMA', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_reorder_point',
      name: 'Reorder Point',
      type: EntityType.ENTITY,
      description: 'Inventory replenishment thresholds',
      properties: [
        { id: 'rp_1', name: 'Reorder ID', dataType: 'STRING', description: 'Configuration ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'rp_2', name: 'Min Quantity', dataType: 'INTEGER', description: 'Reorder trigger level', propertyType: PropertyType.MEASURE },
        { id: 'rp_3', name: 'Reorder Quantity', dataType: 'INTEGER', description: 'Standard order qty', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_stock_valuation',
      name: 'Stock Valuation',
      type: EntityType.FACT,
      description: 'Inventory value calculations',
      properties: [
        { id: 'sv_1', name: 'Valuation ID', dataType: 'STRING', description: 'Record ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sv_2', name: 'Valuation Date', dataType: 'DATE', description: 'As-of date', propertyType: PropertyType.DIMENSION },
        { id: 'sv_3', name: 'Total Value', dataType: 'FLOAT', description: 'Inventory value', propertyType: PropertyType.MEASURE }
      ]
    },

    // LOGISTICS & TRANSPORTATION (10 entities)
    {
      id: 'ent_carrier',
      name: 'Carrier',
      type: EntityType.DIMENSION,
      description: 'Freight and shipping carriers',
      properties: [
        { id: 'car_1', name: 'Carrier ID', dataType: 'STRING', description: 'Carrier code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'car_2', name: 'Carrier Name', dataType: 'STRING', description: 'Company name', propertyType: PropertyType.DIMENSION },
        { id: 'car_3', name: 'Carrier Type', dataType: 'STRING', description: 'Ground, Air, Ocean, Rail', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_shipment',
      name: 'Shipment',
      type: EntityType.FACT,
      description: 'Outbound shipments to customers',
      properties: [
        { id: 'shp_1', name: 'Shipment ID', dataType: 'STRING', description: 'Tracking number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'shp_2', name: 'Ship Date', dataType: 'DATE', description: 'Date shipped', propertyType: PropertyType.DIMENSION },
        { id: 'shp_3', name: 'Delivery Date', dataType: 'DATE', description: 'Actual delivery', propertyType: PropertyType.DIMENSION },
        { id: 'shp_4', name: 'Freight Cost', dataType: 'FLOAT', description: 'Shipping cost', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_shipment_line',
      name: 'Shipment Line',
      type: EntityType.FACT,
      description: 'Line items within shipments',
      properties: [
        { id: 'shl_1', name: 'Line ID', dataType: 'STRING', description: 'Line identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'shl_2', name: 'Quantity', dataType: 'INTEGER', description: 'Units shipped', propertyType: PropertyType.MEASURE },
        { id: 'shl_3', name: 'Weight', dataType: 'FLOAT', description: 'Line weight', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_route',
      name: 'Route',
      type: EntityType.DIMENSION,
      description: 'Delivery routes and lanes',
      properties: [
        { id: 'rte_1', name: 'Route ID', dataType: 'STRING', description: 'Route code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'rte_2', name: 'Origin', dataType: 'STRING', description: 'Starting point', propertyType: PropertyType.DIMENSION },
        { id: 'rte_3', name: 'Destination', dataType: 'STRING', description: 'End point', propertyType: PropertyType.DIMENSION },
        { id: 'rte_4', name: 'Distance Miles', dataType: 'FLOAT', description: 'Route distance', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_vehicle',
      name: 'Vehicle',
      type: EntityType.DIMENSION,
      description: 'Trucks and delivery vehicles',
      properties: [
        { id: 'veh_1', name: 'Vehicle ID', dataType: 'STRING', description: 'Vehicle number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'veh_2', name: 'Vehicle Type', dataType: 'STRING', description: 'Truck, Van, Trailer', propertyType: PropertyType.DIMENSION },
        { id: 'veh_3', name: 'Capacity', dataType: 'FLOAT', description: 'Load capacity', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_driver',
      name: 'Driver',
      type: EntityType.DIMENSION,
      description: 'Delivery drivers',
      properties: [
        { id: 'drv_1', name: 'Driver ID', dataType: 'STRING', description: 'Employee ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'drv_2', name: 'Driver Name', dataType: 'STRING', description: 'Full name', propertyType: PropertyType.DIMENSION },
        { id: 'drv_3', name: 'License Class', dataType: 'STRING', description: 'CDL classification', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_delivery_stop',
      name: 'Delivery Stop',
      type: EntityType.FACT,
      description: 'Individual stops on delivery routes',
      properties: [
        { id: 'ds_1', name: 'Stop ID', dataType: 'STRING', description: 'Stop identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ds_2', name: 'Stop Sequence', dataType: 'INTEGER', description: 'Order in route', propertyType: PropertyType.DIMENSION },
        { id: 'ds_3', name: 'Arrival Time', dataType: 'TIMESTAMP', description: 'Actual arrival', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_freight_rate',
      name: 'Freight Rate',
      type: EntityType.ENTITY,
      description: 'Shipping rate cards by carrier and lane',
      properties: [
        { id: 'fr_1', name: 'Rate ID', dataType: 'STRING', description: 'Rate identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'fr_2', name: 'Rate Per Mile', dataType: 'FLOAT', description: 'Cost per mile', propertyType: PropertyType.MEASURE },
        { id: 'fr_3', name: 'Fuel Surcharge', dataType: 'FLOAT', description: 'Fuel adjustment', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_container',
      name: 'Container',
      type: EntityType.DIMENSION,
      description: 'Shipping containers for ocean freight',
      properties: [
        { id: 'cnt_1', name: 'Container ID', dataType: 'STRING', description: 'Container number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'cnt_2', name: 'Container Type', dataType: 'STRING', description: '20ft, 40ft, Reefer', propertyType: PropertyType.DIMENSION },
        { id: 'cnt_3', name: 'Max Weight', dataType: 'FLOAT', description: 'Maximum load', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_customs_entry',
      name: 'Customs Entry',
      type: EntityType.FACT,
      description: 'Import/export customs declarations',
      properties: [
        { id: 'ce_1', name: 'Entry Number', dataType: 'STRING', description: 'Customs entry ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ce_2', name: 'Entry Date', dataType: 'DATE', description: 'Filing date', propertyType: PropertyType.DIMENSION },
        { id: 'ce_3', name: 'Duties Paid', dataType: 'FLOAT', description: 'Import duties', propertyType: PropertyType.MEASURE }
      ]
    },

    // SALES & ORDERS (10 entities)
    {
      id: 'ent_customer',
      name: 'Customer',
      type: EntityType.DIMENSION,
      description: 'Business and consumer customers',
      properties: [
        { id: 'cust_1', name: 'Customer ID', dataType: 'STRING', description: 'Customer number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'cust_2', name: 'Customer Name', dataType: 'STRING', description: 'Account name', propertyType: PropertyType.DIMENSION },
        { id: 'cust_3', name: 'Customer Type', dataType: 'STRING', description: 'B2B, B2C, Distributor', propertyType: PropertyType.DIMENSION },
        { id: 'cust_4', name: 'Credit Limit', dataType: 'FLOAT', description: 'Credit line', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_customer_address',
      name: 'Customer Address',
      type: EntityType.DIMENSION,
      description: 'Shipping and billing addresses',
      properties: [
        { id: 'ca_1', name: 'Address ID', dataType: 'STRING', description: 'Address identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ca_2', name: 'Address Type', dataType: 'STRING', description: 'Ship-to, Bill-to', propertyType: PropertyType.DIMENSION },
        { id: 'ca_3', name: 'City', dataType: 'STRING', description: 'City name', propertyType: PropertyType.DIMENSION },
        { id: 'ca_4', name: 'Country', dataType: 'STRING', description: 'Country code', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_sales_order',
      name: 'Sales Order',
      type: EntityType.FACT,
      description: 'Customer orders for products',
      properties: [
        { id: 'so_1', name: 'Order ID', dataType: 'STRING', description: 'Order number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'so_2', name: 'Order Date', dataType: 'DATE', description: 'Date ordered', propertyType: PropertyType.DIMENSION },
        { id: 'so_3', name: 'Total Amount', dataType: 'FLOAT', description: 'Order value', propertyType: PropertyType.MEASURE },
        { id: 'so_4', name: 'Status', dataType: 'STRING', description: 'Order status', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_order_line',
      name: 'Order Line',
      type: EntityType.FACT,
      description: 'Line items within sales orders',
      properties: [
        { id: 'ol_1', name: 'Line ID', dataType: 'STRING', description: 'Line identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ol_2', name: 'Quantity', dataType: 'INTEGER', description: 'Ordered quantity', propertyType: PropertyType.MEASURE },
        { id: 'ol_3', name: 'Unit Price', dataType: 'FLOAT', description: 'Selling price', propertyType: PropertyType.MEASURE },
        { id: 'ol_4', name: 'Discount', dataType: 'FLOAT', description: 'Line discount', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_sales_channel',
      name: 'Sales Channel',
      type: EntityType.DIMENSION,
      description: 'Distribution channels for sales',
      properties: [
        { id: 'sch_1', name: 'Channel ID', dataType: 'STRING', description: 'Channel code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sch_2', name: 'Channel Name', dataType: 'STRING', description: 'Direct, Retail, Online', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_sales_rep',
      name: 'Sales Representative',
      type: EntityType.DIMENSION,
      description: 'Sales team members',
      properties: [
        { id: 'sr_1', name: 'Rep ID', dataType: 'STRING', description: 'Employee ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sr_2', name: 'Rep Name', dataType: 'STRING', description: 'Full name', propertyType: PropertyType.DIMENSION },
        { id: 'sr_3', name: 'Territory', dataType: 'STRING', description: 'Assigned region', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_price_list',
      name: 'Price List',
      type: EntityType.ENTITY,
      description: 'Product pricing configurations',
      properties: [
        { id: 'pl_1', name: 'Price List ID', dataType: 'STRING', description: 'Price list code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'pl_2', name: 'Currency', dataType: 'STRING', description: 'Pricing currency', propertyType: PropertyType.DIMENSION },
        { id: 'pl_3', name: 'Effective Date', dataType: 'DATE', description: 'Valid from', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_promotion',
      name: 'Promotion',
      type: EntityType.ENTITY,
      description: 'Sales promotions and discounts',
      properties: [
        { id: 'prm_1', name: 'Promotion ID', dataType: 'STRING', description: 'Promo code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'prm_2', name: 'Promotion Name', dataType: 'STRING', description: 'Campaign name', propertyType: PropertyType.DIMENSION },
        { id: 'prm_3', name: 'Discount Percent', dataType: 'FLOAT', description: 'Discount rate', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_return_order',
      name: 'Return Order',
      type: EntityType.FACT,
      description: 'Customer returns and RMAs',
      properties: [
        { id: 'ro_1', name: 'Return ID', dataType: 'STRING', description: 'RMA number', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ro_2', name: 'Return Date', dataType: 'DATE', description: 'Date returned', propertyType: PropertyType.DIMENSION },
        { id: 'ro_3', name: 'Reason Code', dataType: 'STRING', description: 'Return reason', propertyType: PropertyType.DIMENSION },
        { id: 'ro_4', name: 'Refund Amount', dataType: 'FLOAT', description: 'Credit issued', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_invoice',
      name: 'Invoice',
      type: EntityType.FACT,
      description: 'Customer billing documents',
      properties: [
        { id: 'inv_1', name: 'Invoice Number', dataType: 'STRING', description: 'Invoice ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'inv_2', name: 'Invoice Date', dataType: 'DATE', description: 'Billing date', propertyType: PropertyType.DIMENSION },
        { id: 'inv_3', name: 'Due Date', dataType: 'DATE', description: 'Payment due', propertyType: PropertyType.DIMENSION },
        { id: 'inv_4', name: 'Amount', dataType: 'FLOAT', description: 'Invoice total', propertyType: PropertyType.MEASURE }
      ]
    },

    // ANALYTICS & PLANNING (10 entities)
    {
      id: 'ent_demand_forecast',
      name: 'Demand Forecast',
      type: EntityType.FACT,
      description: 'Predicted demand for products',
      properties: [
        { id: 'df_1', name: 'Forecast ID', dataType: 'STRING', description: 'Forecast identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'df_2', name: 'Period', dataType: 'DATE', description: 'Forecast period', propertyType: PropertyType.DIMENSION },
        { id: 'df_3', name: 'Forecasted Qty', dataType: 'INTEGER', description: 'Predicted demand', propertyType: PropertyType.MEASURE },
        { id: 'df_4', name: 'Confidence', dataType: 'FLOAT', description: 'Forecast confidence', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_supply_plan',
      name: 'Supply Plan',
      type: EntityType.ENTITY,
      description: 'Material and capacity planning',
      properties: [
        { id: 'spl_1', name: 'Plan ID', dataType: 'STRING', description: 'Plan identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'spl_2', name: 'Plan Period', dataType: 'DATE', description: 'Planning horizon', propertyType: PropertyType.DIMENSION },
        { id: 'spl_3', name: 'Planned Qty', dataType: 'INTEGER', description: 'Planned production', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_safety_stock',
      name: 'Safety Stock',
      type: EntityType.ENTITY,
      description: 'Buffer inventory levels',
      properties: [
        { id: 'ss_1', name: 'Safety Stock ID', dataType: 'STRING', description: 'Configuration ID', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ss_2', name: 'Min Level', dataType: 'INTEGER', description: 'Minimum buffer', propertyType: PropertyType.MEASURE },
        { id: 'ss_3', name: 'Max Level', dataType: 'INTEGER', description: 'Maximum buffer', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_kpi_metric',
      name: 'KPI Metric',
      type: EntityType.FACT,
      description: 'Key performance indicator measurements',
      properties: [
        { id: 'kpi_1', name: 'Metric ID', dataType: 'STRING', description: 'KPI identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'kpi_2', name: 'Metric Name', dataType: 'STRING', description: 'KPI name', propertyType: PropertyType.DIMENSION },
        { id: 'kpi_3', name: 'Value', dataType: 'FLOAT', description: 'Metric value', propertyType: PropertyType.MEASURE },
        { id: 'kpi_4', name: 'Period', dataType: 'DATE', description: 'Measurement period', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_cost_center',
      name: 'Cost Center',
      type: EntityType.DIMENSION,
      description: 'Financial responsibility centers',
      properties: [
        { id: 'cc_1', name: 'Cost Center ID', dataType: 'STRING', description: 'Center code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'cc_2', name: 'Cost Center Name', dataType: 'STRING', description: 'Center description', propertyType: PropertyType.DIMENSION },
        { id: 'cc_3', name: 'Manager', dataType: 'STRING', description: 'Responsible manager', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_budget',
      name: 'Budget',
      type: EntityType.ENTITY,
      description: 'Financial budgets and allocations',
      properties: [
        { id: 'bud_1', name: 'Budget ID', dataType: 'STRING', description: 'Budget identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'bud_2', name: 'Fiscal Year', dataType: 'STRING', description: 'Budget year', propertyType: PropertyType.DIMENSION },
        { id: 'bud_3', name: 'Amount', dataType: 'FLOAT', description: 'Budgeted amount', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_risk_assessment',
      name: 'Risk Assessment',
      type: EntityType.ENTITY,
      description: 'Supply chain risk evaluations',
      properties: [
        { id: 'ra_1', name: 'Risk ID', dataType: 'STRING', description: 'Risk identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'ra_2', name: 'Risk Type', dataType: 'STRING', description: 'Risk category', propertyType: PropertyType.DIMENSION },
        { id: 'ra_3', name: 'Probability', dataType: 'FLOAT', description: 'Likelihood score', propertyType: PropertyType.MEASURE },
        { id: 'ra_4', name: 'Impact', dataType: 'FLOAT', description: 'Impact severity', propertyType: PropertyType.MEASURE }
      ]
    },
    {
      id: 'ent_time_dimension',
      name: 'Time Dimension',
      type: EntityType.DIMENSION,
      description: 'Calendar and time hierarchy',
      properties: [
        { id: 'td_1', name: 'Date Key', dataType: 'DATE', description: 'Calendar date', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'td_2', name: 'Year', dataType: 'INTEGER', description: 'Calendar year', propertyType: PropertyType.DIMENSION },
        { id: 'td_3', name: 'Quarter', dataType: 'STRING', description: 'Fiscal quarter', propertyType: PropertyType.DIMENSION },
        { id: 'td_4', name: 'Month', dataType: 'STRING', description: 'Month name', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_geography',
      name: 'Geography',
      type: EntityType.DIMENSION,
      description: 'Geographic hierarchy for analysis',
      properties: [
        { id: 'geo_1', name: 'Geo ID', dataType: 'STRING', description: 'Geography code', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'geo_2', name: 'Country', dataType: 'STRING', description: 'Country name', propertyType: PropertyType.DIMENSION },
        { id: 'geo_3', name: 'Region', dataType: 'STRING', description: 'Geographic region', propertyType: PropertyType.DIMENSION },
        { id: 'geo_4', name: 'City', dataType: 'STRING', description: 'City name', propertyType: PropertyType.DIMENSION }
      ]
    },
    {
      id: 'ent_sustainability',
      name: 'Sustainability Metric',
      type: EntityType.FACT,
      description: 'Environmental and sustainability tracking',
      properties: [
        { id: 'sus_1', name: 'Metric ID', dataType: 'STRING', description: 'Metric identifier', isUniqueKey: true, propertyType: PropertyType.DIMENSION },
        { id: 'sus_2', name: 'Carbon Footprint', dataType: 'FLOAT', description: 'CO2 emissions (tons)', propertyType: PropertyType.MEASURE },
        { id: 'sus_3', name: 'Energy Usage', dataType: 'FLOAT', description: 'kWh consumed', propertyType: PropertyType.MEASURE },
        { id: 'sus_4', name: 'Waste Generated', dataType: 'FLOAT', description: 'Waste in kg', propertyType: PropertyType.MEASURE }
      ]
    }
  ],
  relationships: [
    // Supplier relationships
    { id: 'rel_1', sourceEntityId: 'ent_supplier', targetEntityId: 'ent_supplier_contact', type: 'ONE_TO_MANY', label: 'has contacts' },
    { id: 'rel_2', sourceEntityId: 'ent_supplier', targetEntityId: 'ent_supplier_location', type: 'ONE_TO_MANY', label: 'has locations' },
    { id: 'rel_3', sourceEntityId: 'ent_supplier', targetEntityId: 'ent_purchase_order', type: 'ONE_TO_MANY', label: 'receives orders' },
    { id: 'rel_4', sourceEntityId: 'ent_supplier', targetEntityId: 'ent_supplier_contract', type: 'ONE_TO_MANY', label: 'bound by' },
    { id: 'rel_5', sourceEntityId: 'ent_supplier', targetEntityId: 'ent_supplier_performance', type: 'ONE_TO_MANY', label: 'measured by' },
    { id: 'rel_6', sourceEntityId: 'ent_purchase_order', targetEntityId: 'ent_po_line_item', type: 'ONE_TO_MANY', label: 'contains' },
    { id: 'rel_7', sourceEntityId: 'ent_po_line_item', targetEntityId: 'ent_raw_material', type: 'MANY_TO_ONE', label: 'orders' },
    { id: 'rel_8', sourceEntityId: 'ent_po_line_item', targetEntityId: 'ent_component', type: 'MANY_TO_ONE', label: 'orders' },
    { id: 'rel_9', sourceEntityId: 'ent_raw_material', targetEntityId: 'ent_procurement_category', type: 'MANY_TO_ONE', label: 'categorized as' },
    
    // Manufacturing relationships
    { id: 'rel_10', sourceEntityId: 'ent_plant', targetEntityId: 'ent_production_line', type: 'ONE_TO_MANY', label: 'contains' },
    { id: 'rel_11', sourceEntityId: 'ent_production_line', targetEntityId: 'ent_work_order', type: 'ONE_TO_MANY', label: 'executes' },
    { id: 'rel_12', sourceEntityId: 'ent_work_order', targetEntityId: 'ent_product', type: 'MANY_TO_ONE', label: 'produces' },
    { id: 'rel_13', sourceEntityId: 'ent_product', targetEntityId: 'ent_bill_of_materials', type: 'ONE_TO_MANY', label: 'defined by' },
    { id: 'rel_14', sourceEntityId: 'ent_bill_of_materials', targetEntityId: 'ent_bom_component', type: 'ONE_TO_MANY', label: 'includes' },
    { id: 'rel_15', sourceEntityId: 'ent_bom_component', targetEntityId: 'ent_component', type: 'MANY_TO_ONE', label: 'uses' },
    { id: 'rel_16', sourceEntityId: 'ent_bom_component', targetEntityId: 'ent_raw_material', type: 'MANY_TO_ONE', label: 'uses' },
    { id: 'rel_17', sourceEntityId: 'ent_production_line', targetEntityId: 'ent_equipment', type: 'ONE_TO_MANY', label: 'utilizes' },
    { id: 'rel_18', sourceEntityId: 'ent_equipment', targetEntityId: 'ent_maintenance_record', type: 'ONE_TO_MANY', label: 'tracked by' },
    { id: 'rel_19', sourceEntityId: 'ent_work_order', targetEntityId: 'ent_quality_check', type: 'ONE_TO_MANY', label: 'inspected by' },
    { id: 'rel_20', sourceEntityId: 'ent_work_order', targetEntityId: 'ent_shift', type: 'MANY_TO_ONE', label: 'scheduled in' },
    { id: 'rel_21', sourceEntityId: 'ent_work_order', targetEntityId: 'ent_operator', type: 'MANY_TO_MANY', label: 'assigned to' },
    
    // Product & Inventory relationships
    { id: 'rel_22', sourceEntityId: 'ent_product', targetEntityId: 'ent_product_category', type: 'MANY_TO_ONE', label: 'belongs to' },
    { id: 'rel_23', sourceEntityId: 'ent_warehouse', targetEntityId: 'ent_storage_location', type: 'ONE_TO_MANY', label: 'contains' },
    { id: 'rel_24', sourceEntityId: 'ent_storage_location', targetEntityId: 'ent_inventory', type: 'ONE_TO_MANY', label: 'holds' },
    { id: 'rel_25', sourceEntityId: 'ent_product', targetEntityId: 'ent_inventory', type: 'ONE_TO_MANY', label: 'stocked as' },
    { id: 'rel_26', sourceEntityId: 'ent_inventory', targetEntityId: 'ent_inventory_transaction', type: 'ONE_TO_MANY', label: 'tracked by' },
    { id: 'rel_27', sourceEntityId: 'ent_inventory', targetEntityId: 'ent_lot', type: 'MANY_TO_ONE', label: 'from batch' },
    { id: 'rel_28', sourceEntityId: 'ent_lot', targetEntityId: 'ent_serial_number', type: 'ONE_TO_MANY', label: 'contains' },
    { id: 'rel_29', sourceEntityId: 'ent_product', targetEntityId: 'ent_reorder_point', type: 'ONE_TO_ONE', label: 'replenished by' },
    { id: 'rel_30', sourceEntityId: 'ent_warehouse', targetEntityId: 'ent_stock_valuation', type: 'ONE_TO_MANY', label: 'valued at' },
    
    // Logistics relationships
    { id: 'rel_31', sourceEntityId: 'ent_carrier', targetEntityId: 'ent_shipment', type: 'ONE_TO_MANY', label: 'transports' },
    { id: 'rel_32', sourceEntityId: 'ent_shipment', targetEntityId: 'ent_shipment_line', type: 'ONE_TO_MANY', label: 'contains' },
    { id: 'rel_33', sourceEntityId: 'ent_shipment', targetEntityId: 'ent_route', type: 'MANY_TO_ONE', label: 'follows' },
    { id: 'rel_34', sourceEntityId: 'ent_route', targetEntityId: 'ent_delivery_stop', type: 'ONE_TO_MANY', label: 'includes' },
    { id: 'rel_35', sourceEntityId: 'ent_shipment', targetEntityId: 'ent_vehicle', type: 'MANY_TO_ONE', label: 'loaded on' },
    { id: 'rel_36', sourceEntityId: 'ent_vehicle', targetEntityId: 'ent_driver', type: 'MANY_TO_ONE', label: 'operated by' },
    { id: 'rel_37', sourceEntityId: 'ent_carrier', targetEntityId: 'ent_freight_rate', type: 'ONE_TO_MANY', label: 'charges' },
    { id: 'rel_38', sourceEntityId: 'ent_shipment', targetEntityId: 'ent_container', type: 'MANY_TO_ONE', label: 'packed in' },
    { id: 'rel_39', sourceEntityId: 'ent_shipment', targetEntityId: 'ent_customs_entry', type: 'ONE_TO_ONE', label: 'declared via' },
    { id: 'rel_40', sourceEntityId: 'ent_warehouse', targetEntityId: 'ent_shipment', type: 'ONE_TO_MANY', label: 'ships from' },
    
    // Sales relationships
    { id: 'rel_41', sourceEntityId: 'ent_customer', targetEntityId: 'ent_customer_address', type: 'ONE_TO_MANY', label: 'located at' },
    { id: 'rel_42', sourceEntityId: 'ent_customer', targetEntityId: 'ent_sales_order', type: 'ONE_TO_MANY', label: 'places' },
    { id: 'rel_43', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_order_line', type: 'ONE_TO_MANY', label: 'contains' },
    { id: 'rel_44', sourceEntityId: 'ent_order_line', targetEntityId: 'ent_product', type: 'MANY_TO_ONE', label: 'orders' },
    { id: 'rel_45', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_sales_channel', type: 'MANY_TO_ONE', label: 'via' },
    { id: 'rel_46', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_sales_rep', type: 'MANY_TO_ONE', label: 'managed by' },
    { id: 'rel_47', sourceEntityId: 'ent_product', targetEntityId: 'ent_price_list', type: 'MANY_TO_MANY', label: 'priced in' },
    { id: 'rel_48', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_promotion', type: 'MANY_TO_ONE', label: 'applied' },
    { id: 'rel_49', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_return_order', type: 'ONE_TO_MANY', label: 'returned via' },
    { id: 'rel_50', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_invoice', type: 'ONE_TO_ONE', label: 'billed by' },
    { id: 'rel_51', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_shipment', type: 'ONE_TO_MANY', label: 'fulfilled by' },
    
    // Analytics relationships
    { id: 'rel_52', sourceEntityId: 'ent_product', targetEntityId: 'ent_demand_forecast', type: 'ONE_TO_MANY', label: 'forecasted by' },
    { id: 'rel_53', sourceEntityId: 'ent_demand_forecast', targetEntityId: 'ent_supply_plan', type: 'ONE_TO_ONE', label: 'drives' },
    { id: 'rel_54', sourceEntityId: 'ent_product', targetEntityId: 'ent_safety_stock', type: 'ONE_TO_ONE', label: 'buffered by' },
    { id: 'rel_55', sourceEntityId: 'ent_plant', targetEntityId: 'ent_kpi_metric', type: 'ONE_TO_MANY', label: 'measured by' },
    { id: 'rel_56', sourceEntityId: 'ent_warehouse', targetEntityId: 'ent_kpi_metric', type: 'ONE_TO_MANY', label: 'measured by' },
    { id: 'rel_57', sourceEntityId: 'ent_plant', targetEntityId: 'ent_cost_center', type: 'MANY_TO_ONE', label: 'reports to' },
    { id: 'rel_58', sourceEntityId: 'ent_cost_center', targetEntityId: 'ent_budget', type: 'ONE_TO_MANY', label: 'allocated' },
    { id: 'rel_59', sourceEntityId: 'ent_supplier', targetEntityId: 'ent_risk_assessment', type: 'ONE_TO_MANY', label: 'assessed for' },
    { id: 'rel_60', sourceEntityId: 'ent_sales_order', targetEntityId: 'ent_time_dimension', type: 'MANY_TO_ONE', label: 'dated' },
    { id: 'rel_61', sourceEntityId: 'ent_customer', targetEntityId: 'ent_geography', type: 'MANY_TO_ONE', label: 'located in' },
    { id: 'rel_62', sourceEntityId: 'ent_plant', targetEntityId: 'ent_sustainability', type: 'ONE_TO_MANY', label: 'tracked for' },
    { id: 'rel_63', sourceEntityId: 'ent_shipment', targetEntityId: 'ent_sustainability', type: 'ONE_TO_MANY', label: 'impacts' }
  ]
};
