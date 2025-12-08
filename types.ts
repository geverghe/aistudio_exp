export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SEMANTIC_MODELER = 'SEMANTIC_MODELER',
  AGENT_CHAT = 'AGENT_CHAT'
}

export enum EntityType {
  ENTITY = 'ENTITY',
  DIMENSION = 'DIMENSION',
  FACT = 'FACT'
}

export interface Property {
  id: string;
  name: string;
  dataType: string;
  description: string;
  binding?: string; // e.g., 'table.column_name'
  isComputed?: boolean;
}

export interface Entity {
  id: string;
  name: string;
  description: string;
  type: EntityType;
  properties: Property[];
  bindings?: {
    type: 'BIGQUERY' | 'SPANNNER' | 'LOOKER';
    resource: string;
  }[];
}

export interface Relationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourcePropertyId?: string;
  targetPropertyId?: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  description: string;
  label?: string; // Display title for the link
}

export interface SemanticModel {
  entities: Entity[];
  relationships: Relationship[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  metadata?: any;
}