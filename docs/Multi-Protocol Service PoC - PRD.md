Multi-Protocol Service PoC - Product Requirements Document

## Executive Summary

This document specifies the requirements for developing a Proof of Concept (PoC) that demonstrates the modernization of legacy WCF services using ASP.NET Core with multi-protocol support (REST, gRPC, SignalR). The PoC will showcase enterprise development patterns, real-time capabilities, and containerized deployment.

**Development Timeline:** 2 weeks
**Target Audience:** Technical stakeholders evaluating WCF modernization strategies
**Success Criteria:** Demonstrate that a single ASP.NET Core service can replace WCF while providing superior capabilities

## Business Context

### Current State
- Legacy WCF services requiring modernization
- Multiple client types (web applications, mobile devices, backend services)
- Need for real-time updates and monitoring capabilities
- Requirements for enterprise-grade patterns and scalability

### Future State Vision
- Modern, maintainable service architecture
- Multi-protocol support for diverse client needs
- Real-time monitoring and alerting capabilities
- Containerized deployment for cloud-native operations

## Functional Requirements

### Core Business Domain: Inventory Management System

The PoC will simulate a warehouse inventory management system where:
- Users scan products to update stock levels
- System provides real-time inventory visibility
- Business calculations support stock management decisions
- All operations are audited for compliance

### User Stories

#### US-001: Product Information Lookup
**As a** warehouse operator  
**I want to** scan a product code and see product details  
**So that** I can verify I'm updating the correct item  

**Acceptance Criteria:**
- Enter product code via scanner simulation interface
- System displays product description and current stock
- Invalid product codes show appropriate error messages
- Response time < 200ms for product lookups

#### US-002: Stock Level Updates
**As a** warehouse operator  
**I want to** update stock quantities via scanning  
**So that** inventory levels remain accurate  

**Acceptance Criteria:**
- Enter quantity adjustment (positive or negative)
- System validates quantity within business rules
- Stock level updates immediately in database
- All connected dashboards update in real-time

#### US-003: Real-Time Inventory Dashboard
**As a** warehouse manager  
**I want to** view live inventory status  
**So that** I can monitor operations and make informed decisions  

**Acceptance Criteria:**
- Grid displays all products with current stock levels
- Grid updates automatically when stock changes occur
- Color-coded indicators for stock status (low, adequate, overstocked)
- Filter capabilities by product code, description, or stock status

#### US-004: Business Intelligence Calculations
**As a** inventory planner  
**I want to** see calculated metrics like days cover and reorder points  
**So that** I can make informed purchasing decisions  

**Acceptance Criteria:**
- System calculates days cover remaining based on consumption rates
- Displays reorder points based on lead times
- Shows quantities on order
- Highlights products requiring attention

#### US-005: Audit Trail and Compliance
**As a** compliance officer  
**I want to** track all inventory changes  
**So that** we maintain accurate audit records  

**Acceptance Criteria:**
- All stock changes recorded with timestamp and user
- Audit trail includes old and new values
- Track which protocol/interface was used for changes
- Audit data accessible via reporting interface

#### US-006: System Monitoring
**As a** system administrator  
**I want to** monitor service health and performance  
**So that** I can ensure reliable operations  

**Acceptance Criteria:**
- Real-time metrics on active connections
- Request/response performance monitoring
- Error rate tracking
- Health status indicators

#### US-007: Bulk Inventory Management
**As an** inventory manager  
**I want to** edit product details directly in the grid  
**So that** I can efficiently maintain accurate inventory parameters  

**Acceptance Criteria:**
- Click on Quantity On Hand, Monthly Usage, or Lead Time cells to edit inline
- Changes validate according to business rules before saving
- Select multiple rows for bulk editing
- Bulk edit dialog allows updating common fields across selected products
- All changes trigger real-time updates to connected dashboards
- Changes create audit trail entries for compliance# Multi-Protocol Service PoC - Product Requirements Document

## Technical Requirements

### Architecture Standards
Must follow the **Technical Standards Document** for:
- Clean Architecture (4-layer structure)
- CQRS implementation with MediatR
- Domain-Driven Design principles
- Enterprise patterns (Repository, Result, etc.)

### Data Model

#### Product Entity
```
Product
├── ProductCode (string, PK) - Format: 3 letters + 3 numbers (e.g., ABC123)
├── Description (string, max 200 chars)
├── QuantityOnHand (int, >= 0)
├── AverageMonthlyConsumption (decimal, >= 0)
├── LeadTimeDays (int, 1-365)
├── QuantityOnOrder (int, >= 0)
├── LastUpdated (DateTime)
└── LastUpdatedBy (string)

Calculated Properties:
├── DaysCoverRemaining = QuantityOnHand ÷ (AverageMonthlyConsumption ÷ 30)
├── ReorderPoint = (AverageMonthlyConsumption ÷ 30) × LeadTimeDays
└── StockStatus = Enum based on DaysCoverRemaining thresholds
```

#### Scan Transaction Entity
```
ScanTransaction
├── Id (int, PK, auto-increment)
├── ProductCode (string, FK to Product)
├── QuantityScanned (int, can be negative for adjustments)
├── PreviousQuantity (int)
├── NewQuantity (int)
├── ScanDateTime (DateTime, UTC)
├── ScannedBy (string)
├── TransactionType (enum: StockCount, Adjustment, Receiving)
└── Notes (string, optional)
```

#### Audit Entry Entity
```
AuditEntry
├── Id (int, PK, auto-increment)
├── EntityType (string) - "Product", "ScanTransaction"
├── EntityId (string)
├── Action (string) - "Created", "Updated", "Deleted"
├── OldValues (JSON, nullable)
├── NewValues (JSON)
├── UserId (string)
├── Timestamp (DateTime, UTC)
├── Source (string) - "REST", "gRPC", "SignalR"
└── IpAddress (string)
```

### Protocol Requirements

#### REST API Endpoints
**Base URL:** `/api/v1`

**Product Operations:**
- `GET /products` - List products with optional filtering
- `GET /products/{code}` - Get specific product
- `POST /products/{code}/scan` - Submit scan transaction
- `PUT /products/{code}` - Update product details (qty, consumption, lead time)
- `PUT /products/bulk` - Bulk update multiple products

**Transaction Operations:**
- `GET /transactions` - Get scan history with pagination
- `POST /transactions/bulk` - Bulk transaction import

**System Operations:**
- `GET /health` - System health check
- `GET /metrics/live` - Real-time system metrics
- `GET /metrics/daily` - Daily statistics summary

#### gRPC Services
**ProductService:**
```protobuf
service ProductService {
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc GetProducts(GetProductsRequest) returns (GetProductsResponse);
}
```

**InventoryService:**
```protobuf
service InventoryService {
  rpc ProcessBulkScan(BulkScanRequest) returns (BulkScanResponse);
  rpc ImportInventory(ImportRequest) returns (ImportResponse);
  rpc UpdateProducts(BulkUpdateRequest) returns (BulkUpdateResponse);
}
```

**MetricsService:**
```protobuf
service MetricsService {
  rpc GetLiveMetrics(MetricsRequest) returns (LiveMetricsResponse);
  rpc GetConnectionStats(StatsRequest) returns (StatsResponse);
}
```

**LiveMetricsResponse Structure:**
```protobuf
message LiveMetricsResponse {
  string server_time = 1;           // Current server time (ISO 8601)
  int32 active_connections = 2;     // Current SignalR connections
  int32 total_requests_today = 3;   // REST + gRPC requests since midnight
  int32 total_scans_today = 4;      // Scan transactions since midnight
  double memory_usage_mb = 5;       // Current memory usage in MB
}
```

#### SignalR Hub
**InventoryHub:**
- `JoinGroup(groupName)` - Subscribe to specific updates
- `GetConnectionCount()` - Get active connection statistics

**Server-to-Client Events:**
- `ProductUpdated(productCode, newData)` - Product data changed
- `ScanProcessed(transactionData)` - New scan transaction
- `LiveMetrics(metricsData)` - Real-time system metrics (every 5 seconds)
- `LowStockAlert(productCode, daysRemaining)` - Reorder alerts

### Business Rules and Validation

#### Product Code Validation
- Format: Exactly 3 uppercase letters followed by 3 digits
- Must exist in database for scan operations
- Case-insensitive input, stored uppercase

#### Quantity Validation
- Quantity on hand cannot be negative
- Maximum quantity: 99,999
- Scan adjustments cannot result in negative stock
- Lead time: 1-365 days
- Average monthly consumption: >= 0

#### Business Logic Rules
- **Days Cover Calculation:** If average monthly consumption is 0, show "N/A"
- **Stock Status:**
  - Low: < 7 days cover
  - Adequate: 7-30 days cover  
  - Overstocked: > 60 days cover
- **Reorder Point:** Trigger when quantity drops below calculated reorder point

### User Interface Requirements

#### Scanner Simulation Interface
**Technology:** React 18+ with TypeScript, Vite, Tailwind CSS, shadcn/ui
**Features:**
- Clean, mobile-friendly form layout with responsive design
- Product code input with real-time validation and format hints
- Auto-lookup with loading skeleton and error states
- Quantity input with touch-friendly +/- buttons and numeric keypad
- Transaction type selector with visual icons
- Submit button with loading states and success animations
- Recent scans history with real-time updates via SignalR
- Quick scan mode for rapid inventory updates
- Success animations with Framer Motion
- Live notifications for scan confirmations and alerts
- Offline capability with IndexedDB queue
- Connection status indicator with quality metrics
- Keyboard shortcuts for power users
- Pull-to-refresh functionality
- Dark mode support with system preference detection

#### Dashboard Interface
**Technology:** React 18+ with TypeScript, Vite, Tailwind CSS, shadcn/ui
**Features:**
- **Live Inventory Grid:**
  - High-performance data table with TanStack Table
  - Virtual scrolling for large datasets
  - Sortable columns with visual indicators
  - Advanced filtering with debounced search
  - Color-coded rows based on stock status
  - Real-time updates via typed SignalR events
  - Responsive pagination with configurable page sizes
  - Inline editing with validation and auto-save
  - Bulk edit mode with optimistic updates
  - Column resizing and reordering
  - Export functionality (CSV, Excel)
  - Row selection for bulk operations
  - Loading skeletons during data fetches

- **Real-Time Metrics Panel:**
  - Live server time with smooth second transitions
  - Active SignalR connections with status indicators
  - Total requests counter with trend sparklines
  - Total scans counter with hourly breakdown chart
  - Memory usage gauge with visual thresholds
  - System health indicators with color coding
  - Performance metrics with historical data
  - Animated transitions using Framer Motion

- **Recent Activity Feed:**
  - Virtual scrolling for performance
  - User avatars with role-based colors
  - Relative timestamps using date-fns
  - Transaction type icons with Lucide
  - Expandable details with animations
  - Activity filtering and search
  - Auto-scroll with pause on hover
  - Activity grouping by time periods
  - Toast notifications for new activities
  - Export functionality for audit trails

- **Additional Features:**
  - Dark mode toggle with theme persistence
  - Responsive sidebar navigation
  - Breadcrumb navigation for context
  - Keyboard navigation support
  - PWA capabilities with offline support
  - Real-time connection quality monitoring

#### Responsive Design Requirements
- Mobile-first design approach with breakpoints at 640px, 768px, 1024px
- Optimized layouts for mobile, tablet, and desktop
- Touch-friendly controls with adequate spacing (min 44px touch targets)
- Gesture support for swipe actions and pull-to-refresh
- Accessible color schemes with WCAG 2.1 AA compliance
- System font stack for optimal readability
- Responsive typography with fluid scaling

### Frontend Architecture Standards

#### Component Architecture
- Functional components with React hooks
- Single Responsibility Principle for all components
- Custom hooks for business logic encapsulation
- Compound component patterns for complex UI
- Component composition over prop drilling
- Proper component lazy loading with React.lazy()

#### State Management
- TanStack Query for server state with caching strategies
- React Context for global UI state (theme, auth)
- Local component state with useState/useReducer
- Optimistic updates for better perceived performance
- Proper cache invalidation strategies

#### Code Organization
- Feature-based folder structure
- Shared utilities and services layer
- Type-safe API client with error handling
- Centralized constants and configuration
- Reusable custom hooks library

#### Performance Standards
- Code splitting at route level
- Dynamic imports for heavy components
- Virtual scrolling for large lists
- Image lazy loading and optimization
- Service worker for offline caching
- Target metrics: FCP < 1s, TTI < 3s, CLS < 0.1

### Authentication Requirements

#### JWT Implementation
- **Simple JWT for PoC:** Username/password login returning JWT token
- **Token Structure:** Include user ID, username, role claims
- **Token Expiry:** 8-hour sliding expiration
- **Cross-Protocol:** Same JWT validates across REST, gRPC, SignalR

#### User Roles
- **Scanner:** Can perform scan operations and view products
- **Manager:** Can view dashboard and access all data
- **Admin:** Full access including system metrics

#### Security Standards
- HTTPS enforcement
- Secure JWT signing keys
- Input sanitization
- SQL injection prevention
- XSS protection

### Performance Requirements

#### Response Time Targets
- Product lookups: < 200ms
- Scan submissions: < 500ms
- Dashboard grid loading: < 1 second
- Real-time updates: < 500ms from trigger to UI

#### Scalability Targets
- Support 100 concurrent users
- Handle 1000 scan transactions per hour
- Maintain < 100MB memory usage
- Database response < 50ms for standard queries

#### Connection Management
- Support 50 concurrent SignalR connections
- Graceful connection handling and reconnection
- Connection pooling for database access

### Infrastructure Requirements

#### Database
- **Development/PoC:** SQLite with EF Core
- **Database Design:** Structured to be SQL Server compatible
- **Migrations:** EF Core migrations for schema management
- **Sample Data:** Pre-loaded with 50+ sample products

#### Containerization
**Backend Container:**
- ASP.NET Core 8 runtime
- Exposes ports 5000 (HTTP) and 5001 (HTTPS)
- Includes SQLite database file
- Health check endpoint

**Frontend Container:**
- Nginx serving React build
- Proxy configuration for API calls
- Static asset optimization

**Docker Compose:**
- Single-command deployment
- Environment variable configuration
- Named volumes for persistent data
- Network configuration for container communication

#### Monitoring and Logging
- **Structured Logging:** Serilog with JSON output
- **Health Checks:** EF Core, memory, disk space
- **Metrics Collection:** Request counts, timing, errors
- **Log Levels:** Debug, Info, Warning, Error with appropriate usage

## Non-Functional Requirements

### Reliability
- 99.5% uptime during business hours
- Graceful degradation when dependencies unavailable
- Automatic retry logic for transient failures
- Data consistency across all protocols

### Maintainability
- Code coverage > 80% for business logic
- Documentation for all public APIs
- Clean Architecture principles enforced
- Comprehensive unit and integration tests

### Usability
- Intuitive interface requiring minimal training
- Error messages in plain language
- Responsive design for various screen sizes
- Accessibility compliance (WCAG 2.1 AA)

### Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Touch devices and traditional mouse/keyboard
- Various screen resolutions and orientations

## Implementation Phases

### Week 1: Core Infrastructure
**Days 1-2: Foundation**
- Project structure with Clean Architecture
- Entity Framework setup with SQLite
- Basic entities (Product, ScanTransaction, AuditEntry)
- MediatR and CQRS setup

**Days 3-4: Multi-Protocol Implementation**
- REST API controllers
- gRPC service implementation
- SignalR hub setup
- Basic JWT authentication

**Day 5: Frontend Foundation**
- React applications setup
- Scanner simulation interface
- Basic dashboard with grid
- Tailwind CSS styling

### Week 2: Enterprise Features & Polish
**Days 6-7: Business Logic**
- FluentValidation implementation
- Business calculations (days cover, reorder points)
- Audit trail implementation
- Advanced CQRS scenarios

**Days 8-9: Real-Time & Monitoring**
- SignalR real-time updates
- Connection monitoring
- System metrics dashboard
- Health checks implementation

**Day 10: Deployment & Documentation**
- Docker containerization
- Docker Compose setup
- API documentation
- Demo preparation

## Testing Requirements

### Unit Testing
- Domain entity business logic
- MediatR handlers (commands and queries)
- Validation rules
- Calculation logic

### Integration Testing
- Database operations
- API endpoints
- SignalR functionality
- Authentication flows

### End-to-End Testing
- Complete user workflows
- Multi-protocol scenarios
- Real-time update verification
- Error handling scenarios

## Success Criteria

### Functional Success
- [ ] All user stories completed and tested
- [ ] Multi-protocol access to same business logic
- [ ] Real-time updates working across all clients
- [ ] Business calculations accurate and performant
- [ ] Audit trail capturing all changes

### Technical Success
- [ ] Clean Architecture principles implemented
- [ ] CQRS pattern demonstrated effectively
- [ ] Performance targets met
- [ ] Security requirements satisfied
- [ ] Container deployment working

### Business Success
- [ ] Stakeholders can see clear WCF replacement path
- [ ] Enterprise patterns demonstrate maintainability
- [ ] Real-time capabilities show value over WCF
- [ ] Deployment model suitable for production

## Risk Mitigation

### Technical Risks
- **Complex authentication setup:** Mitigated by starting with simple JWT
- **SignalR connection issues:** Mitigated by implementing reconnection logic
- **Performance concerns:** Mitigated by establishing baseline measurements

### Timeline Risks
- **Feature creep:** Strictly enforce scope boundaries
- **Learning curve:** Use well-documented patterns and libraries
- **Integration complexity:** Build incrementally with frequent testing

## Deliverables

### Code Deliverables
- Complete source code with Clean Architecture
- Docker containers and compose files
- Database migrations and sample data
- Comprehensive unit and integration tests

### Documentation Deliverables
- API documentation (Swagger/OpenAPI)
- Architecture decision records
- Deployment guide
- Demo script and presentation materials

### Demo Assets
- Working containerized application
- Sample data and scenarios
- Performance comparison data
- Architecture visualization materials

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Approval Required:** Technical Lead, Project Manager  
**References:** Technical Standards Document