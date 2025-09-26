# TODO - Remaining Tasks

## File Upload System
- ✅ Metadata extraction (PDF metadata extraction with background job processing)
- ⏳ Add file preview and cards
- ⏳ Add a cleanup function of files in S3 which are deleted in the database
- ⏳ Add a test where a user can delete a document

## Address Management System - ✅ COMPLETE
- ✅ MailAddress and State models implemented
- ✅ Create CRUD operations for MailAddress management
- ✅ Build address management UI components
- ✅ Integrate Lob API for address validation
- ✅ Add address selection to mail creation workflow

## Mail Creation Workflow - ✅ COMPLETE
- ✅ Database schema (MailPiece, MailPieceStatusHistory models)
- ✅ Lob API integration (address validation, cost calculation, mail submission)
- ✅ Payment integration (Stripe for mail services)
- ✅ Webhook system (real-time status updates)
- ✅ Advanced error handling and retry logic
- ⏳ Build mail creation UI components and workflow
- ⏳ Integrate address selection with mail creation

## Phase 5 Advanced Features - ⏳ PENDING
- ⏳ Status visualization (enhanced timeline and history)
- ⏳ Advanced filtering (search and filter mail pieces)
- ⏳ Real-time updates (WebSocket or polling)
- ⏳ Bulk operations (multiple mail pieces)
- ⏳ Performance optimization (caching, query optimization)

## Production Readiness - ⏳ PENDING
- ⏳ Environment configuration for production
- ⏳ Monitoring and alerting setup
- ⏳ Security audit and hardening
- ⏳ Performance testing and optimization