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
  bindingType?: 'column' | 'expression';
  bindingSystem?: 'bigquery' | 'spanner';
  bindingProject?: string;
  bindingDataset?: string;
  bindingTable?: string;
  bindingColumn?: string;
  isComputed?: boolean;
  isUniqueKey?: boolean;
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
  title?: string;
  label?: string;
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

export enum SuggestionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum SuggestionSource {
  AI_GENERATION = 'AI_GENERATION',
  IMPORT = 'IMPORT',
  DATA_SCAN = 'DATA_SCAN',
  SCHEMA_SYNC = 'SCHEMA_SYNC'
}

export enum SuggestionType {
  NEW_PROPERTY = 'NEW_PROPERTY',
  UPDATED_DESCRIPTION = 'UPDATED_DESCRIPTION',
  NEW_ENTITY = 'NEW_ENTITY',
  UPDATED_ENTITY = 'UPDATED_ENTITY'
}

export interface PropertySuggestion {
  property: Property;
  reason?: string;
}

export interface EntityUpdateSuggestion {
  id: string;
  entityId: string;
  entityName: string;
  type: SuggestionType;
  source: SuggestionSource;
  status: SuggestionStatus;
  suggestedProperties?: PropertySuggestion[];
  suggestedDescription?: string;
  currentDescription?: string;
  reason?: string;
  createdAt: Date;
  reviewedAt?: Date;
}