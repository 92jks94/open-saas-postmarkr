# Mail Creation Workflow - Database Specification

## 📋 **Executive Summary**

This document provides detailed database specifications for the Mail Creation Workflow feature, including new models, relationships, indexes, and migration strategies. The design builds upon the existing Postmarkr database structure while adding comprehensive mail piece tracking capabilities.

## 🎯 **Database Design Objectives**

### **Primary Goals**
- Enable comprehensive mail piece tracking and management
- Support status history and audit trails
- Integrate with existing User, MailAddress, and File models
- Ensure high performance with proper indexing
- Maintain data integrity with proper relationships

### **Design Principles**
- **Consistency**: Follow existing naming conventions and patterns
- **Performance**: Optimize for common query patterns
- **Scalability**: Support high-volume mail processing
- **Integrity**: Ensure data consistency with proper constraints
- **Auditability**: Complete audit trail for all operations

## 🏗️ **New Database Models**

### **MailPiece Model**
The core entity for tracking individual mail pieces from creation to delivery.

```prisma
model MailPiece {
  id                String   @id @default(uuid())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // User relationship
  user              User     @relation(fields: [userId], references: [id])
  userId            String
  
  // Mail content and configuration
  description       String   // Mail piece description/title
  notes             String?  // Optional notes or special instructions
  pieceType         String   @default("letter") // "letter", "postcard", "flyer", "self_mailer", "brochure", "catalog"
  
  // File relationship (the document being mailed)
  file              File?    @relation(fields: [fileId], references: [id])
  fileId            String?
  
  // Address relationships
  senderAddress     MailAddress @relation("SentMailPieces", fields: [senderAddressId], references: [id])
  senderAddressId   String
  recipientAddress  MailAddress @relation("ReceivedMailPieces", fields: [recipientAddressId], references: [id])
  recipientAddressId String
  
  // Mail configuration
  serviceLevel      String   @default("first_class") // "first_class", "priority", "express", "certified", "registered"
  color             String   @default("color") // "color", "black_white"
  pageCount         Int      @default(1)
  orientation       String   @default("portrait") // "portrait", "landscape"
  weight            Float?   // Weight in ounces
  
  // Service options
  signatureRequired Boolean  @default(false)
  returnReceipt     Boolean  @default(false)
  certifiedMail     Boolean  @default(false)
  registeredMail    Boolean  @default(false)
  
  // Status and tracking
  status            String   @default("draft") // "draft", "pending_payment", "paid", "validating", "submitted", "processing", "printed", "mailed", "in_transit", "delivered", "failed", "returned"
  trackingNumber    String?
  cost              Float?   // Final cost in USD
  estimatedDelivery DateTime?
  actualDelivery    DateTime?
  
  // Lob integration
  lobId             String?  // Lob's internal ID
  lobStatus         String?  // Lob's status
  lobTrackingNumber String?  // Lob's tracking number
  lobDeliveryDate   DateTime?
  
  // Payment integration
  stripePaymentId   String?  // Stripe payment intent ID
  paymentStatus     String   @default("pending") // "pending", "paid", "failed", "refunded"
  paymentAmount     Float?   // Amount charged
  paymentCurrency   String   @default("usd")
  
  // Pre-validation status
  addressValidated  Boolean  @default(false)
  fileValidated     Boolean  @default(false)
  validationErrors  Json?   // Store validation errors as JSON
  
  // Error handling
  errorMessage      String?
  retryCount        Int      @default(0)
  lastRetryAt       DateTime?
  
  // Status history relationship
  statusHistory     MailPieceStatusHistory[]
  
  // Indexes for performance
  @@index([userId, status])
  @@index([userId, createdAt])
  @@index([status, createdAt])
  @@index([lobId])
  @@index([stripePaymentId])
  @@index([trackingNumber])
  @@index([senderAddressId])
  @@index([recipientAddressId])
  @@index([fileId])
}
```

### **MailPieceStatusHistory Model**
Tracks the complete status progression of each mail piece with comprehensive audit trail (FedEx-style tracking).

```prisma
model MailPieceStatusHistory {
  id          String    @id @default(uuid())
  createdAt   DateTime  @default(now())
  
  // Mail piece relationship
  mailPiece   MailPiece @relation(fields: [mailPieceId], references: [id], onDelete: Cascade)
  mailPieceId String
  
  // Status information
  status      String    // Current status: "draft", "pending_payment", "paid", "validating", "submitted", "processing", "printed", "mailed", "in_transit", "delivered", "failed", "returned"
  previousStatus String? // Previous status for transition tracking
  lobStatus   String?   // Lob's status if different from internal status
  trackingNumber String? // Tracking number when available
  
  // Context and notes
  notes       String?   // Human-readable status description (e.g., "Package printed and ready for mailing")
  source      String    @default("system") // "system", "webhook", "manual", "user", "lob_api"
  triggeredBy String?   // User ID or system process that triggered the change
  
  // External data
  lobData     Json?     // Store Lob webhook data as JSON (complete webhook payload)
  errorMessage String?  // Error message if status change failed
  
  // Delivery information
  deliveryDate DateTime?     // When status occurred (may differ from createdAt)
  deliveryLocation String?   // Delivery location details (e.g., "Post Office", "Sorting Facility", "Delivery Vehicle")
  facilityName String?       // Specific facility name (e.g., "USPS Distribution Center - Chicago")
  facilityAddress String?    // Facility address for transparency
  
  // Enhanced tracking fields
  estimatedDelivery DateTime? // Estimated delivery date for this status
  actualDelivery DateTime?    // Actual delivery date (only for "delivered" status)
  deliveryMethod String?      // How it was delivered (e.g., "handed to recipient", "left at door", "signature required")
  deliverySignature String?   // Signature if required
  deliveryPhoto String?       // Photo proof of delivery (URL to image)
  
  // Geographic tracking
  latitude Float?             // GPS coordinates of status location
  longitude Float?            // GPS coordinates of status location
  city String?               // City where status occurred
  state String?              // State where status occurred
  postalCode String?          // Postal code where status occurred
  country String?             // Country where status occurred
  
  // Indexes for performance
  @@index([mailPieceId, createdAt])
  @@index([status, createdAt])
  @@index([source, createdAt])
  @@index([deliveryDate])
  @@index([trackingNumber])
}
```

## 🔗 **Enhanced Existing Models**

### **Enhanced User Model**
Add relationship to mail pieces.

```prisma
model User {
  // ... existing fields ...
  
  // Add mail pieces relationship
  mailPieces        MailPiece[]
  
  // ... rest of existing model ...
}
```

### **Enhanced MailAddress Model**
Add relationships to sent and received mail pieces.

```prisma
model MailAddress {
  // ... existing fields ...
  
  // Add mail piece relationships
  sentMailPieces     MailPiece[] @relation("SentMailPieces")
  receivedMailPieces MailPiece[] @relation("ReceivedMailPieces")
  
  // ... rest of existing model ...
}
```

### **Enhanced File Model**
Add relationship to mail pieces.

```prisma
model File {
  // ... existing fields ...
  
  // Add mail pieces relationship
  mailPieces         MailPiece[]
  
  // ... rest of existing model ...
}
```

## 📦 **FedEx-Style Status Tracking**

### **Complete Audit Trail Example**
Here's how a mail piece would be tracked through the entire lifecycle:

```sql
-- Example: Mail piece #12345 journey from creation to delivery

-- 1. Initial Creation
INSERT INTO MailPieceStatusHistory (mailPieceId, status, notes, source, createdAt) 
VALUES ('12345', 'draft', 'Mail piece created by user', 'user', '2024-01-15 10:30:00');

-- 2. Payment Processed
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt) 
VALUES ('12345', 'paid', 'draft', 'Payment processed successfully', 'system', '2024-01-15 10:35:00');

-- 3. Validation Complete
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt) 
VALUES ('12345', 'validating', 'paid', 'Address and file validation completed', 'system', '2024-01-15 10:36:00');

-- 4. Submitted to Lob
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt) 
VALUES ('12345', 'submitted', 'validating', 'Submitted to Lob for processing', 'system', '2024-01-15 10:37:00');

-- 5. Processing Started
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt) 
VALUES ('12345', 'processing', 'submitted', 'Lob processing started', 'webhook', '2024-01-15 11:00:00');

-- 6. Printed
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt, facilityName, city, state) 
VALUES ('12345', 'printed', 'processing', 'Mail piece printed and ready for mailing', 'webhook', '2024-01-15 14:30:00', 'Lob Print Facility', 'San Francisco', 'CA');

-- 7. Mailed
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt, facilityName, city, state, trackingNumber) 
VALUES ('12345', 'mailed', 'printed', 'Mail piece handed over to postal service', 'webhook', '2024-01-15 16:45:00', 'USPS Processing Center', 'San Francisco', 'CA', '94001282062123456789');

-- 8. In Transit - Sorting Facility
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt, facilityName, city, state, deliveryLocation) 
VALUES ('12345', 'in_transit', 'mailed', 'Package arrived at sorting facility', 'webhook', '2024-01-16 08:15:00', 'USPS Distribution Center', 'Chicago', 'IL', 'Sorting Facility');

-- 9. In Transit - Out for Delivery
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt, facilityName, city, state, deliveryLocation, estimatedDelivery) 
VALUES ('12345', 'in_transit', 'in_transit', 'Package out for delivery', 'webhook', '2024-01-17 07:30:00', 'USPS Local Post Office', 'New York', 'NY', 'Delivery Vehicle', '2024-01-17 18:00:00');

-- 10. Delivered
INSERT INTO MailPieceStatusHistory (mailPieceId, status, previousStatus, notes, source, createdAt, facilityName, city, state, deliveryLocation, actualDelivery, deliveryMethod, deliverySignature) 
VALUES ('12345', 'delivered', 'in_transit', 'Package delivered successfully', 'webhook', '2024-01-17 14:22:00', 'USPS Local Delivery', 'New York', 'NY', 'Recipient Address', '2024-01-17 14:22:00', 'handed to recipient', 'John Smith');
```

### **Status Timeline Query**
```sql
-- Get complete timeline for a mail piece
SELECT 
  status,
  notes,
  source,
  createdAt,
  deliveryDate,
  facilityName,
  city,
  state,
  deliveryLocation,
  estimatedDelivery,
  actualDelivery,
  deliveryMethod,
  deliverySignature
FROM MailPieceStatusHistory 
WHERE mailPieceId = '12345' 
ORDER BY createdAt ASC;
```

### **Real-time Status Updates**
The system supports real-time updates through:
- **Lob Webhooks**: Automatic status updates from Lob API
- **Manual Updates**: Admin can manually update statuses
- **System Updates**: Automated status changes based on business logic
- **User Notifications**: Email/SMS notifications for status changes

## 📊 **Database Relationships**

### **Primary Relationships**
- **User → MailPiece**: One-to-many (user owns multiple mail pieces)
- **MailAddress → MailPiece**: One-to-many (address used in multiple mail pieces)
- **File → MailPiece**: One-to-many (file used in multiple mail pieces)
- **MailPiece → MailPieceStatusHistory**: One-to-many (mail piece has multiple status changes)

### **Relationship Details**

#### **User to MailPiece**
- **Type**: One-to-many
- **Constraint**: User can have unlimited mail pieces
- **Cascade**: Delete user → delete all mail pieces
- **Index**: `[userId, status]` for efficient user queries

#### **MailAddress to MailPiece**
- **Type**: One-to-many (bidirectional)
- **Constraint**: Address can be used in unlimited mail pieces
- **Cascade**: Delete address → set mail piece addresses to null (soft constraint)
- **Index**: `[senderAddressId]` and `[recipientAddressId]` for efficient queries

#### **File to MailPiece**
- **Type**: One-to-many
- **Constraint**: File can be used in unlimited mail pieces
- **Cascade**: Delete file → set mail piece file to null (soft constraint)
- **Index**: `[fileId]` for efficient file-based queries

#### **MailPiece to MailPieceStatusHistory**
- **Type**: One-to-many
- **Constraint**: Mail piece can have unlimited status changes
- **Cascade**: Delete mail piece → delete all status history
- **Index**: `[mailPieceId, createdAt]` for chronological status queries

## 🚀 **Performance Optimization**

### **Strategic Indexes**

#### **Primary Query Patterns**
- **User Mail Pieces**: `@@index([userId, status])` - Most common query
- **Recent Mail Pieces**: `@@index([userId, createdAt])` - Dashboard queries
- **Status Tracking**: `@@index([status, createdAt])` - Admin monitoring
- **Lob Integration**: `@@index([lobId])` - Webhook processing
- **Payment Tracking**: `@@index([stripePaymentId])` - Payment reconciliation

#### **Secondary Indexes**
- **Address Queries**: `@@index([senderAddressId])`, `@@index([recipientAddressId])`
- **File Queries**: `@@index([fileId])`
- **Tracking**: `@@index([trackingNumber])`
- **Status History**: `@@index([mailPieceId, createdAt])`

### **Query Optimization Strategies**

#### **Common Query Patterns**
1. **User Dashboard**: Get user's recent mail pieces with status
2. **Status Monitoring**: Get mail pieces by status for admin
3. **Lob Webhook**: Find mail piece by Lob ID for status updates
4. **Payment Reconciliation**: Find mail pieces by Stripe payment ID
5. **Address Usage**: Get mail pieces using specific address

#### **Performance Considerations**
- **Pagination**: All list queries should support pagination
- **Filtering**: Support filtering by status, date range, address
- **Sorting**: Default sort by creation date (newest first)
- **Caching**: Cache frequently accessed data (user's recent mail pieces)

## 🔒 **Data Integrity & Constraints**

### **Database Constraints**

#### **Required Fields**
- `userId`: Must reference existing User
- `senderAddressId`: Must reference existing MailAddress
- `recipientAddressId`: Must reference existing MailAddress
- `status`: Must be valid status enum value
- `pieceType`: Must be valid piece type enum value

#### **Foreign Key Constraints**
- `userId` → `User.id` (CASCADE DELETE)
- `senderAddressId` → `MailAddress.id` (SET NULL)
- `recipientAddressId` → `MailAddress.id` (SET NULL)
- `fileId` → `File.id` (SET NULL)
- `mailPieceId` → `MailPiece.id` (CASCADE DELETE)

#### **Business Logic Constraints**
- `senderAddressId` ≠ `recipientAddressId` (same address validation)
- `cost` ≥ 0 (positive cost validation)
- `pageCount` > 0 (positive page count)
- `weight` > 0 (positive weight if specified)

### **Status Transition Rules**

#### **Valid Status Transitions**
```
draft → pending_payment → paid → validating → submitted → processing → printed → mailed → in_transit → delivered
draft → pending_payment → paid → validating → submitted → processing → printed → mailed → failed
draft → pending_payment → paid → validating → submitted → processing → printed → mailed → in_transit → returned
```

#### **Status Validation**
- **System Status**: Only system can set certain statuses
- **User Status**: Users can only set draft, pending_payment
- **Webhook Status**: Only webhook can set Lob-specific statuses
- **Manual Status**: Admins can manually override statuses

## 📈 **Migration Strategy**

### **Migration Phases**

#### **Phase 1: Schema Creation**
1. **Create MailPiece Model**: Add with all fields and indexes
2. **Create MailPieceStatusHistory Model**: Add with relationships
3. **Add Relationships**: Update existing models with new relationships
4. **Create Indexes**: Add all performance indexes
5. **Test Schema**: Verify all constraints and relationships

#### **Phase 2: Data Migration**
1. **Backup Existing Data**: Full database backup
2. **Run Migration**: Execute Prisma migration
3. **Verify Relationships**: Test all foreign key constraints
4. **Performance Test**: Verify index performance
5. **Rollback Plan**: Prepare rollback strategy if needed

#### **Phase 3: Application Integration**
1. **Update Operations**: Modify existing operations to handle new relationships
2. **Test CRUD Operations**: Verify all create/read/update/delete operations
3. **Test Relationships**: Verify relationship queries work correctly
4. **Performance Test**: Test with sample data
5. **Deploy**: Deploy to production with monitoring

### **Migration Commands**

#### **Prisma Migration**
```bash
# Generate migration
npx prisma migrate dev --name add_mail_piece_models

# Apply migration
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

#### **Database Seeding**
```bash
# Seed with sample data
npx prisma db seed

# Verify data
npx prisma studio
```

## 🧪 **Testing Strategy**

### **Unit Tests**
- **Model Creation**: Test MailPiece and MailPieceStatusHistory creation
- **Relationship Tests**: Test all foreign key relationships
- **Constraint Tests**: Test all database constraints
- **Index Tests**: Verify index performance

### **Integration Tests**
- **CRUD Operations**: Test all create/read/update/delete operations
- **Relationship Queries**: Test complex relationship queries
- **Performance Tests**: Test query performance with sample data
- **Constraint Tests**: Test business logic constraints

### **Load Tests**
- **High Volume**: Test with large number of mail pieces
- **Concurrent Access**: Test concurrent read/write operations
- **Index Performance**: Test index performance under load
- **Memory Usage**: Monitor memory usage with large datasets

## 📊 **Monitoring & Maintenance**

### **Performance Monitoring**
- **Query Performance**: Monitor slow queries
- **Index Usage**: Monitor index utilization
- **Connection Pool**: Monitor database connections
- **Memory Usage**: Monitor database memory usage

### **Data Maintenance**
- **Archive Old Data**: Archive old status history
- **Cleanup Failed Records**: Clean up failed mail pieces
- **Optimize Indexes**: Regular index optimization
- **Update Statistics**: Regular statistics updates

### **Backup Strategy**
- **Daily Backups**: Full database backups
- **Transaction Logs**: Transaction log backups
- **Point-in-Time Recovery**: Support for point-in-time recovery
- **Disaster Recovery**: Disaster recovery procedures

## 🎯 **Success Criteria**

### **Database Performance**
- ✅ All queries execute under 100ms
- ✅ Indexes improve query performance by 90%+
- ✅ Support for 10,000+ mail pieces per user
- ✅ Concurrent access without performance degradation

### **Data Integrity**
- ✅ All foreign key constraints enforced
- ✅ Business logic constraints validated
- ✅ Status transition rules enforced
- ✅ Audit trail complete and accurate

### **Scalability**
- ✅ Database supports 100,000+ mail pieces
- ✅ Performance remains consistent under load
- ✅ Indexes scale with data growth
- ✅ Backup and recovery procedures tested

## 📈 **Future Enhancements**

### **Potential Additions**
- **Mail Templates**: Reusable mail piece templates
- **Bulk Operations**: Support for bulk mail operations
- **Advanced Analytics**: Mail piece analytics and reporting
- **Integration APIs**: Additional third-party integrations

### **Performance Optimizations**
- **Partitioning**: Table partitioning for large datasets
- **Read Replicas**: Read replicas for improved performance
- **Caching**: Advanced caching strategies
- **Compression**: Data compression for storage optimization

---

**Document Version**: 1.1  
**Last Updated**: January 2024  
**Next Review**: February 2024  
**Status**: Updated for physical mail - Ready for implementation
