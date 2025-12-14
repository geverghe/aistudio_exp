# Dataplex Semantic Model

## Overview

This is a web-based semantic modeling tool for Google Cloud Dataplex. The application enables users to define business entities, manage relationships, and create an enterprise knowledge graph that powers AI-driven data analytics. Users can visually build semantic models by defining entities (such as Products, Inventory, Revenue) with properties bound to underlying data warehouse tables, establish relationships between entities, and interact with an AI agent that understands the semantic model to answer business questions.

The application serves as a next-generation semantic fabric that bridges the gap between business concepts and technical data structures, making data more accessible to both technical and non-technical users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 19.2.1 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Tailwind CSS for styling via CDN
- Lucide React for iconography

**Component Structure:**
The application follows a component-based architecture with clear separation of concerns:

- **App.tsx**: Root component managing global state (current view, semantic model) and orchestrating top-level navigation
- **View Components**: Three main views (Dashboard, SemanticBuilder, AgentChat) controlled by ViewState enum
- **Page Components**: Specialized full-page views within SemanticBuilder (ModelSettingsPage, DeploymentPage, FullPageEntityView)
- **Layout Components**: TopBar and SideNav provide consistent navigation chrome
- **Feature Components**: Specialized components for entity editing (WikiEditor, AspectSelector, GlossarySelector)

**State Management:**
Uses React's built-in useState for local component state without external state management libraries. The semantic model (entities, relationships, properties) is managed at the App level and passed down through props.

**Rationale**: This architecture keeps the application simple and maintainable while providing flexibility for future enhancements. The component-based approach ensures reusability and clear boundaries between features.

### Data Model Design

**Core Type System:**
Defined in `types.ts` with TypeScript interfaces and enums:

- **SemanticModel**: Container for a complete semantic model with metadata (id, name, description, domain, timestamps) plus entities and relationships
- **SemanticModelCollection**: Collection of multiple semantic models managed at the app level
- **Entity**: Represents business concepts (Product, Inventory, Revenue) with properties bound to physical data sources
- **EntityType**: Enum distinguishing between ENTITY, DIMENSION, and FACT types
- **Property**: Individual attributes of entities with data types, descriptions, and bindings to database columns
- **Relationship**: Connections between entities (ONE_TO_MANY, MANY_TO_MANY)
- **Aspects**: Extensible metadata framework for data quality, PII classification, governance, lineage
- **GlossaryTerms**: Business vocabulary linking to entity properties

**Data Binding Pattern:**
Properties use a binding field (e.g., 'DWH_DIM_PROD.sku_id') to map semantic model concepts to physical database tables. This creates a semantic layer over the data warehouse.

**Mock Schema:**
MOCK_BQ_SCHEMA in SemanticBuilder simulates BigQuery table schemas for property binding dropdowns.

**Rationale**: The type system provides a clear contract between components while the binding pattern enables the semantic model to abstract away technical complexity from business users. Aspects and glossary terms add rich metadata capabilities without cluttering the core model.

### AI Integration

**Service Layer:**
`geminiService.ts` handles all AI interactions using Google's Gemini API (@google/genai package v1.31.0).

**Key Functions:**
- `generateAssistantResponse`: Powers the chat agent by sending user prompts along with the complete semantic model as context
- `suggestEntitiesFromDescription`: (Imported but implementation not shown) Likely generates entity suggestions from natural language descriptions

**Context Management:**
The entire semantic model is serialized to JSON and included in system instructions, giving the AI agent full context about entities, relationships, and bindings.

**Chat History:**
Maintains conversation history by replaying previous messages to the chat session, enabling multi-turn conversations with context retention.

**Rationale**: Embedding the semantic model in system instructions allows the AI to provide contextually relevant responses about the user's specific data model. The Gemini 2.5 Flash model balances performance and capability for this use case.

### User Interface Patterns

**Multi-View Navigation:**
ViewState enum controls switching between Dashboard (overview), SemanticBuilder (modeling), and AgentChat (AI interaction).

**Graph + Authoring Pattern:**
SemanticBuilder supports multiple view modes (GRAPH, AUTHORING, FULL_PAGE_ENTITY) allowing users to visualize relationships or focus on detailed editing.

**Rich Metadata Editing:**
- WikiEditor: Markdown-style description editing with history tracking
- AspectSelector: Modal-based selection of predefined aspect types with form-based value entry
- GlossarySelector: Searchable modal for linking business terms to properties

**Responsive Layout:**
Resizable panels (tracked via panelWidth state) allow users to adjust workspace to their preferences.

**Rationale**: The multi-mode interface accommodates different user workflows—high-level exploration, detailed modeling, and AI-assisted querying. Rich metadata components ensure comprehensive documentation without overwhelming simple use cases.

### Development & Build System

**Vite Configuration:**
- Development server on port 5000 with host 0.0.0.0 for network access
- Environment variable injection for Gemini API key via process.env substitution
- Path aliases (@/) for cleaner imports
- React plugin with JSX transformation

**TypeScript Configuration:**
- ES2022 target with modern module resolution (bundler)
- Experimental decorators enabled for future framework features
- Path mapping for simplified imports
- Isolated modules for faster compilation

**Rationale**: Vite provides fast HMR and optimized production builds. The configuration balances modern JavaScript features with broad compatibility. TypeScript strict mode is not enabled, suggesting a pragmatic approach favoring development speed.

## External Dependencies

### Google Gemini AI API
- **Package**: @google/genai v1.31.0
- **Purpose**: Powers the conversational AI agent that interprets the semantic model and answers business questions
- **Authentication**: Requires GEMINI_API_KEY environment variable
- **Integration Point**: services/geminiService.ts
- **Model**: gemini-2.5-flash for balanced performance

### UI Component Libraries
- **lucide-react v0.556.0**: Icon library providing consistent iconography across the application
- **Tailwind CSS (CDN)**: Utility-first CSS framework loaded via script tag in index.html

### Build & Development Tools
- **Vite v6.2.0**: Build tool and dev server
- **@vitejs/plugin-react v5.0.0**: React integration for Vite with Fast Refresh
- **TypeScript v5.8.2**: Type checking and compilation
- **@types/node v22.14.0**: Node.js type definitions for build tooling

### Runtime Dependencies
- **React v19.2.1**: UI framework
- **React DOM v19.2.1**: DOM rendering for React
- **Import Maps**: Uses AI Studio CDN (aistudiocdn.com) for module resolution in browser

### External Services (Implied)
- **BigQuery**: The semantic model bindings reference BigQuery tables (DWH_DIM_PROD, OLTP_INV_SKU), indicating integration with Google Cloud's data warehouse
- **Google Cloud Dataplex**: The application is designed as a semantic layer for Dataplex's universal catalog

**Note**: The application uses import maps with a custom CDN (aistudiocdn.com), suggesting deployment within Google's AI Studio environment. This may impose constraints on package versions and deployment targets.