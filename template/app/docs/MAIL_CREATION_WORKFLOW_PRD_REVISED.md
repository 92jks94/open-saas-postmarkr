# Mail Creation Workflow - Revised Product Requirements Document (PRD)

## 📋 **Executive Summary**

This revised document addresses critical gaps identified in the original PRD audit and provides a comprehensive implementation plan for the Mail Creation Workflow feature. The revised approach ensures proper integration with existing systems while addressing all blocking dependencies and architectural considerations.

## 🎯 **Product Overview**

### **Vision Statement**
Enable users to seamlessly create, send, and track physical mail pieces with professional-grade features and Lob API integration, building upon the existing Postmarkr infrastructure.

### **Key Objectives**
- Provide intuitive mail piece creation interface leveraging existing components
- Integrate with existing address management and file upload systems
- Implement comprehensive status tracking and history
- Support Lob API integration for professional mail services
- Ensure scalable architecture using Wasp framework capabilities

## 🚨 **Critical Issues Resolution**

### **Issue 1: Database Schema Foundation**
**Problem**: Missing core database models for mail piece management.

**Solution**: Complete database schema implementation with proper relationships.

#### **Database Schema Requirements**
- **MailPiece Model**: Core mail piece entity with comprehensive tracking
- **MailPieceStatusHistory Model**: Temporal status tracking with audit trail
- **Enhanced MailAddress Model**: Add relationships to mail pieces
- **Proper Indexing**: Performance optimization for high-volume usage
- **Cascade Operations**: Data integrity and cleanup rules

#### **Implementation Strategy**
1. **Schema Design**: Define complete database models with all required fields
2. **Migration Strategy**: Create migration scripts for existing data
3. **Relationship Mapping**: Establish proper foreign key relationships
4. **Index Optimization**: Add performance indexes for common queries
5. **Data Validation**: Implement database-level constraints

### **Issue 2: Lob API Integration Architecture**
**Problem**: No Lob API client or integration infrastructure.

**Solution**: Comprehensive Lob API integration following existing patterns.

#### **Lob Integration Requirements**
- **API Client Setup**: Following Stripe integration patterns
- **Environment Configuration**: Proper API key management
- **Error Handling**: Robust error handling and retry logic
- **Webhook Integration**: Complete webhook endpoint for status updates
- **Rate Limiting**: Handle Lob API rate limits appropriately

#### **Implementation Strategy**
1. **Dependency Management**: Add Lob API client to package.json
2. **Client Architecture**: Create Lob client following Stripe patterns
3. **Service Layer**: Implement address validation, cost calculation, and mail submission services
4. **Webhook Handler**: Create webhook endpoint for status updates
5. **Error Recovery**: Implement comprehensive error handling and retry logic

### **Issue 3: Payment System Architecture**
**Problem**: Mail payments are fundamentally different from subscription payments.

**Solution**: Create mail-specific payment operations while leveraging existing Stripe infrastructure.

#### **Payment Architecture Requirements**
- **Mail-Specific Payments**: Transaction-based payment operations
- **Dynamic Pricing**: Calculate costs based on mail specifications
- **Payment Timing**: Process payment before Lob submission
- **Refund Handling**: Different refund logic for failed mail processing
- **Stripe Integration**: Leverage existing Stripe client and webhook patterns

#### **Implementation Strategy**
1. **Payment Operations**: Create mail-specific payment operations
2. **Cost Calculation**: Implement dynamic pricing based on mail specs
3. **Payment Flow**: Design payment-before-submission workflow
4. **Refund Logic**: Implement mail-specific refund handling
5. **Stripe Integration**: Reuse existing Stripe client and patterns

### **Issue 4: File Integration Architecture**
**Problem**: Mail creation needs file selection, not upload.

**Solution**: Create file selection components that leverage existing file infrastructure.

#### **File Integration Requirements**
- **File Selection Interface**: Allow users to select from existing uploaded files
- **File Validation**: Different validation rules for mail files
- **File Processing**: Process files for mail specifications
- **Reuse Existing Files**: Leverage existing file upload and validation system

#### **Implementation Strategy**
1. **File Selector Component**: Create mail-specific file selection interface
2. **File Validation**: Extend existing validation for mail compatibility
3. **File Processing**: Process files for mail specifications
4. **Existing File Integration**: Allow selection from already uploaded files

### **Issue 5: Wasp Configuration Architecture**
**Problem**: Missing Wasp configuration for mail operations.

**Solution**: Complete Wasp configuration following existing patterns.

#### **Wasp Configuration Requirements**
- **Route Configuration**: Mail creation and management routes
- **Page Configuration**: Mail creation and management pages
- **Operation Definitions**: All required queries and actions
- **Entity Relationships**: Proper entity access configuration
- **Webhook Endpoints**: Lob webhook API routes

#### **Implementation Strategy**
1. **Route Definition**: Add mail creation and management routes
2. **Page Configuration**: Configure mail creation and management pages
3. **Operation Configuration**: Define all required operations with proper entities
4. **Webhook Configuration**: Add Lob webhook API route
5. **Middleware Configuration**: Add any required middleware

## 🏗️ **Architectural Implementation**

### **Phase 0: Foundation (Critical Prerequisites)**
**Objective**: Address all blocking dependencies before feature implementation.

#### **Database Foundation**
- **Schema Implementation**: Add MailPiece and MailPieceStatusHistory models
- **Migration Execution**: Run database migrations
- **Relationship Testing**: Verify all relationships work correctly
- **Performance Testing**: Test with sample data

#### **Lob API Foundation**
- **Dependency Installation**: Add Lob API client to package.json
- **Client Setup**: Create Lob client following Stripe patterns
- **Environment Configuration**: Set up API key management
- **Basic Integration**: Test basic API connectivity

#### **Lob API Integration Details**
- **Client Architecture**: Create `src/server/lob/client.ts` following `src/server/stripe/client.ts` pattern
- **Environment Variables**: Add `LOB_API_KEY` to `.env.server`
- **Service Layer**: Create `src/server/lob/services.ts` with:
  - `validateAddress()` - Address validation using Lob API
  - `calculateCost()` - Cost calculation for mail specifications
  - `createMailPiece()` - Submit mail piece to Lob
  - `getMailPieceStatus()` - Retrieve status from Lob
- **Error Handling**: Implement retry logic and error recovery following Stripe patterns
- **Webhook Endpoint**: Create `src/server/lob/webhook.ts` for status updates

#### **Payment Foundation**
- **Payment Operations**: Create mail-specific payment operations
- **Cost Calculation**: Implement dynamic pricing logic
- **Stripe Integration**: Leverage existing Stripe client
- **Payment Testing**: Test payment flow end-to-end

#### **Stripe Payment Modification Details**
- **Mail Payment Operations**: Create `src/server/mail/payments.ts` with:
  - `createMailPaymentIntent()` - Create payment intent for mail cost
  - `confirmMailPayment()` - Confirm payment before Lob submission
  - `refundMailPayment()` - Handle refunds for failed mail processing
- **Cost Calculation**: Use Lob API `calculateCost()` to get exact pricing
- **Payment Flow**: Modify existing Stripe patterns for transaction-based payments
- **Webhook Integration**: Extend existing Stripe webhook handler for mail payments
- **Error Handling**: Reuse existing Stripe error handling patterns

#### **Wasp Configuration Foundation**
- **Route Configuration**: Add all required routes
- **Page Configuration**: Configure all pages
- **Operation Configuration**: Define all operations
- **Webhook Configuration**: Add Lob webhook endpoint

#### **Wasp Configuration Details**
- **Routes**: Add to `main.wasp`:
  ```wasp
  route MailCreationRoute { path: "/mail/create", to: MailCreationPage }
  route MailHistoryRoute { path: "/mail/history", to: MailHistoryPage }
  route MailDetailsRoute { path: "/mail/:id", to: MailDetailsPage }
  ```
- **Pages**: Add to `main.wasp`:
  ```wasp
  page MailCreationPage { component: import { MailCreationPage } from "@src/mail/MailCreationPage.tsx" }
  page MailHistoryPage { component: import { MailHistoryPage } from "@src/mail/MailHistoryPage.tsx" }
  page MailDetailsPage { component: import { MailDetailsPage } from "@src/mail/MailDetailsPage.tsx" }
  ```
- **Operations**: Add to `main.wasp`:
  ```wasp
  query getMailPieces { fn: import { getMailPieces } from "@src/mail/operations.ts", entities: [MailPiece, MailAddress, File] }
  action createMailPiece { fn: import { createMailPiece } from "@src/mail/operations.ts", entities: [MailPiece, MailAddress, File] }
  action updateMailPieceStatus { fn: import { updateMailPieceStatus } from "@src/mail/operations.ts", entities: [MailPiece, MailPieceStatusHistory] }
  ```
- **Webhook API**: Add to `main.wasp`:
  ```wasp
  api lobWebhook { fn: import { handleLobWebhook } from "@src/server/lob/webhook.ts", httpRoute: (POST, "/webhooks/lob") }
  ```

### **Phase 1: Core Mail Operations**
**Objective**: Implement basic mail piece CRUD operations.

#### **Database Operations**
- **Create Mail Piece**: Create new mail pieces with validation
- **Retrieve Mail Pieces**: Get user's mail pieces with status history
- **Update Mail Piece**: Modify existing mail pieces
- **Delete Mail Piece**: Remove mail pieces with proper cleanup

#### **Validation Framework**
- **Input Validation**: Comprehensive field validation using Zod schemas
- **Business Logic**: Address ownership verification, status transition rules
- **Error Handling**: Graceful error management with user-friendly messages
- **Security**: User authentication and authorization checks

#### **Status Management**
- **History Creation**: Automatic status history entry generation
- **Status Transitions**: Enforce valid status progression rules
- **Manual Updates**: Support for manual status modifications
- **Audit Trail**: Complete audit trail for all status changes

### **Phase 2: File Selection & Address Integration**
**Objective**: Implement file selection and address integration components.

#### **File Selection System**
- **File Selector Component**: Mail-specific file selection interface
- **File Validation**: Different validation rules for mail files
- **File Processing**: Process files for mail specifications
- **Existing File Integration**: Allow selection from already uploaded files

#### **File Processing Integration Details**
- **File Validation**: Extend existing file validation in `src/file-upload/validation.ts`:
  - Add mail-specific validation (PDF dimensions, page count, orientation)
  - Validate file compatibility with mail specifications
  - Check file size limits for mail processing
- **File Selection Component**: Create `src/mail/components/FileSelector.tsx`:
  - Reuse existing file list from `FileUploadPage.tsx`
  - Add mail-specific validation feedback
  - Filter files by mail compatibility
- **File Processing**: Create `src/server/mail/fileProcessing.ts`:
  - `validateFileForMail()` - Check file meets mail requirements
  - `getFileSpecifications()` - Extract file specs for mail processing
  - `processFileForMail()` - Prepare file for Lob submission

#### **Address Integration**
- **Address Selector Component**: Mail-specific address selection interface
- **Address Validation**: Real-time address verification
- **Default Address**: Automatic sender address selection
- **Address Management**: Direct links to address management page

#### **Address Integration Details**
- **Address Selector Component**: Create `src/mail/components/AddressSelector.tsx`:
  - Reuse existing address list from `AddressManagementPage.tsx`
  - Add sender/recipient address selection
  - Integrate with Lob address validation
- **Address Validation**: Extend existing address validation:
  - Use Lob API `validateAddress()` for real-time verification
  - Show validation status in address selector
  - Handle validation errors gracefully

#### **Component Architecture**
- **Reusable Components**: Create reusable file and address selection components
- **State Management**: Use React hooks to coordinate between components
- **Form Handling**: Follow form patterns from existing pages
- **Error Handling**: Use existing error display patterns

### **Phase 3: Payment Integration**
**Objective**: Implement mail-specific payment processing.

#### **Payment Operations**
- **Mail Payment Sessions**: Create mail-specific payment sessions
- **Cost Calculation**: Dynamic pricing based on mail specifications
- **Payment Processing**: Handle Stripe payment integration
- **Payment Confirmation**: Verify successful payment before Lob submission

#### **Payment Integration Details**
- **Cost Calculation**: Use Lob API `calculateCost()` to get exact pricing before payment
- **Payment Flow**: Modify existing Stripe payment patterns:
  - Create payment intent with calculated cost
  - Process payment before Lob submission
  - Handle payment failures with retry options
- **Refund Handling**: Extend existing Stripe refund patterns for failed mail processing
- **Payment Status**: Track payment status in MailPiece model

#### **Payment Flow**
- **Pre-validation**: Validate addresses and files before payment
- **Cost Calculation**: Calculate estimated costs based on specifications
- **Payment Processing**: Process Stripe payment for exact mail cost
- **Payment Confirmation**: Confirm payment before proceeding to Lob

#### **Error Handling**
- **Payment Failures**: Handle failed payments gracefully
- **Refund Logic**: Implement mail-specific refund handling
- **Retry Logic**: Allow retry for failed payments
- **User Feedback**: Clear error messages and recovery options

### **Phase 4: Lob API Integration**
**Objective**: Integrate with Lob API for professional mail services.

#### **Lob API Services**
- **Address Validation**: Real-time address verification using Lob API
- **Cost Calculation**: Use Lob pricing API for accurate costs
- **Mail Submission**: Submit validated mail pieces to Lob
- **Status Tracking**: Track mail piece status through Lob API

#### **Lob Integration Implementation**
- **Service Functions**: Implement in `src/server/lob/services.ts`:
  - `validateAddress()` - Address validation with error handling
  - `calculateCost()` - Cost calculation with fallback pricing
  - `createMailPiece()` - Submit mail piece with retry logic
  - `getMailPieceStatus()` - Status retrieval with caching
- **Webhook Handler**: Implement in `src/server/lob/webhook.ts`:
  - Verify webhook signatures
  - Update MailPiece status from Lob webhooks
  - Create MailPieceStatusHistory entries
  - Handle webhook errors gracefully

#### **Webhook Implementation**
- **Webhook Endpoint**: API route for Lob status updates
- **Status Synchronization**: Update local status from Lob webhooks
- **Error Handling**: Robust error handling and retry logic
- **Real-time Updates**: Efficient status update mechanisms

#### **Integration Testing**
- **API Connectivity**: Test all Lob API endpoints
- **Webhook Testing**: Test webhook endpoint functionality
- **Error Scenarios**: Test error handling and recovery
- **Performance Testing**: Test with various mail specifications

### **Phase 5: Advanced Features & Optimization**
**Objective**: Implement advanced features and optimize performance.

#### **Advanced Features**
- **Status Visualization**: Enhanced status timeline and history
- **Advanced Filtering**: Search and filter mail pieces
- **Real-time Updates**: WebSocket or polling for status updates
- **Bulk Operations**: Support for multiple mail pieces

#### **Performance Optimization**
- **Database Indexing**: Optimize database queries with proper indexing
- **Caching Strategy**: Implement appropriate caching for status updates
- **Pagination**: Support for large mail piece collections
- **Query Optimization**: Efficient database queries

#### **User Experience**
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Full keyboard accessibility support
- **Error Recovery**: Clear error messages and recovery options
- **Progress Indicators**: Loading states and progress feedback

## 🔧 **Technical Architecture**

### **Database Architecture**
- **MailPiece Model**: Comprehensive mail piece tracking
- **MailPieceStatusHistory Model**: Temporal status tracking
- **Enhanced MailAddress Model**: Relationships to mail pieces
- **Proper Indexing**: Performance optimization
- **Cascade Operations**: Data integrity rules

### **API Architecture**
- **Lob API Client**: Following Stripe integration patterns
- **Webhook Handler**: Complete webhook endpoint for status updates
- **Error Handling**: Robust error handling and retry logic
- **Rate Limiting**: Handle API rate limits appropriately

### **Payment Architecture**
- **Mail-Specific Operations**: Transaction-based payment operations
- **Dynamic Pricing**: Calculate costs based on mail specifications
- **Stripe Integration**: Leverage existing Stripe client
- **Refund Logic**: Mail-specific refund handling

### **Component Architecture**
- **File Selection**: Reusable file selection components
- **Address Selection**: Reusable address selection components
- **Mail Creation**: Step-by-step mail creation workflow
- **Status Tracking**: Visual status progression and history

### **Wasp Framework Integration**
- **Jobs**: Use Wasp Jobs for background processing
- **Middleware**: Configure middleware for webhook handling
- **Caching**: Leverage Wasp's built-in caching
- **Validation**: Use Wasp's validation system

## 📊 **Implementation Timeline**

### **Phase 0: Foundation (3-4 weeks)**
- Database schema implementation
- Lob API client setup
- Payment operations creation
- Wasp configuration
- File processing integration

### **Phase 1: Core Operations (1-2 weeks)**
- Basic CRUD operations
- Validation framework
- Status management

### **Phase 2: File & Address Integration (1-2 weeks)**
- File selection components
- Address integration
- Component architecture

### **Phase 3: Payment Integration (1-2 weeks)**
- Payment operations
- Payment flow
- Error handling

### **Phase 4: Lob Integration (2-3 weeks)**
- Lob API services
- Webhook implementation
- Integration testing

### **Phase 5: Advanced Features (1-2 weeks)**
- Advanced features
- Performance optimization
- User experience

**Total Timeline**: 10-16 weeks (depending on complexity and testing requirements)

## 🎯 **Success Criteria**

### **Phase 0 Success Criteria**
- ✅ Database models created and migrated
- ✅ Lob API client configured and tested
- ✅ Payment operations created and tested
- ✅ Wasp configuration complete
- ✅ File processing integration functional

### **Phase 1 Success Criteria**
- ✅ Basic CRUD operations working
- ✅ Validation framework implemented
- ✅ Status management functional

### **Phase 2 Success Criteria**
- ✅ File selection components working
- ✅ Address integration functional
- ✅ Component architecture complete

### **Phase 3 Success Criteria**
- ✅ Payment operations working
- ✅ Payment flow functional
- ✅ Error handling implemented

### **Phase 4 Success Criteria**
- ✅ Lob API integration working
- ✅ Webhook endpoint functional
- ✅ End-to-end workflow complete

### **Phase 5 Success Criteria**
- ✅ Advanced features implemented
- ✅ Performance optimized
- ✅ User experience polished

## 🚨 **Risk Mitigation**

### **Technical Risks**
- **Lob API Complexity**: Start with mock responses, add real integration gradually
- **Payment Integration**: Create mail-specific payment flow from scratch
- **Status Management**: Implement comprehensive error handling and retry logic
- **Performance**: Add database indexing and caching from the start

### **Business Risks**
- **Market Competition**: Focus on user experience and integration features
- **Regulatory Compliance**: Regular review of postal regulations
- **Cost Management**: Competitive pricing with margin analysis
- **User Adoption**: Continuous user feedback and iterative improvements

### **Mitigation Strategies**
- **Phased Implementation**: Implement in phases with testing at each phase
- **Comprehensive Testing**: Test each phase thoroughly before moving to next
- **Error Handling**: Implement robust error handling and recovery
- **Performance Monitoring**: Monitor performance and optimize as needed

## 📈 **Conclusion**

This revised PRD addresses all critical issues identified in the audit and provides a comprehensive implementation plan. The phased approach ensures steady progress while maintaining quality and user experience standards. Success depends on careful attention to the identified critical issues, robust technical implementation, and comprehensive testing at each phase.

**Key Success Factors**:
1. **Foundation First**: Address all blocking dependencies before feature implementation
2. **Phased Approach**: Implement in phases with testing at each phase
3. **Existing System Leverage**: Maximize reuse of existing infrastructure
4. **Wasp Framework Utilization**: Leverage all available Wasp capabilities
5. **Comprehensive Testing**: Test each phase thoroughly before moving to next

The revised approach ensures that all critical issues are addressed while maintaining the original vision and objectives of the mail creation workflow feature.

---

**Document Version**: 3.0  
**Last Updated**: January 2024  
**Next Review**: February 2024  
**Status**: Revised based on comprehensive audit and critical issues resolution
