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

export enum PropertyType {
  DIMENSION = 'DIMENSION',
  MEASURE = 'MEASURE',
  OTHER = 'OTHER'
}

export interface AspectType {
  id: string;
  name: string;
  description: string;
  fields: { name: string; type: string; required?: boolean }[];
}

export interface AspectAssignment {
  aspectTypeId: string;
  values: Record<string, any>;
}

export interface GlossaryTerm {
  id: string;
  name: string;
  description: string;
  domain?: string;
}

export interface DescriptionHistory {
  content: string;
  timestamp: Date;
  author?: string;
}

export interface Property {
  id: string;
  name: string;
  dataType: string;
  description: string;
  overview?: string;
  descriptionHistory?: DescriptionHistory[];
  aspects?: AspectAssignment[];
  glossaryTerms?: GlossaryTerm[];
  binding?: string;
  isComputed?: boolean;
  propertyType?: PropertyType;
  definition?: string;
}

export interface Entity {
  id: string;
  name: string;
  description: string;
  overview?: string;
  descriptionHistory?: DescriptionHistory[];
  aspects?: AspectAssignment[];
  glossaryTerms?: GlossaryTerm[];
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

export interface SemanticModelGraph {
  entities: Entity[];
  relationships: Relationship[];
}

export interface SemanticModel extends SemanticModelGraph {
  id: string;
  name: string;
  description?: string;
  overview?: string;
  descriptionHistory?: DescriptionHistory[];
  domain?: string;
  aspects?: AspectAssignment[];
  glossaryTerms?: GlossaryTerm[];
  gitFile?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SemanticModelCollection {
  models: SemanticModel[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  metadata?: any;
}