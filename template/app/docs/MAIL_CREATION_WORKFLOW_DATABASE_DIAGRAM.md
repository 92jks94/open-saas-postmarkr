# Mail Creation Workflow - Database Relationship Diagram

## 📊 **Database Schema Overview**

### **🔄 Key Updates for Physical Mail**
- **`subject` → `description`**: More appropriate for physical mail pieces
- **`message` → `notes`**: Better reflects optional instructions/notes  
- **Status values**: Added "printed" and "mailed" statuses specific to physical mail
- **Service levels**: Changed "standard" to "first_class" and added "registered"
- **Piece types**: Added "brochure" and "catalog" for physical mail

```
┌─────────────────┐
│      User       │
│                 │
│ • id (PK)       │
│ • email         │
│ • username      │
│ • createdAt     │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   MailPiece     │
│                 │
│ • id (PK)       │
│ • userId (FK)   │
│ • fileId (FK)   │
│ • senderAddrId  │
│ • recipientId   │
│ • description   │
│ • notes         │
│ • pieceType     │
│ • serviceLevel  │
│ • status        │
│ • cost          │
│ • lobId         │
│ • stripePayId   │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│MailPieceStatus  │
│    History      │
│                 │
│ • id (PK)       │
│ • mailPieceId   │
│ • status        │
│ • createdAt     │
│ • deliveryDate  │
│ • source        │
│ • notes         │
│ • facilityName  │
│ • city/state    │
│ • trackingNumber│
│ • deliveryMethod│
│ • signature     │
│ • GPS coords    │
└─────────────────┘

┌─────────────────┐
│   MailAddress   │
│                 │
│ • id (PK)       │
│ • userId (FK)   │
│ • contactName   │
│ • addressLine1  │
│ • city          │
│ • state         │
│ • postalCode    │
│ • country       │
│ • isValidated   │
│ • lobAddressId  │
└─────────────────┘
         │
         │ 1:N (Sent)
         ▼
┌─────────────────┐
│   MailPiece     │
│                 │
│ • senderAddress │
│ • recipientAddr │
└─────────────────┘

┌─────────────────┐
│      File       │
│                 │
│ • id (PK)       │
│ • userId (FK)   │
│ • name          │
│ • type          │
│ • key           │
│ • size          │
│ • pageCount     │
│ • pdfMetadata   │
│ • validationStatus│
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   MailPiece     │
│                 │
│ • fileId (FK)   │
└─────────────────┘
```

## 🔗 **Relationship Details**

### **Primary Relationships**
- **User** → **MailPiece** (1:N) - User owns multiple mail pieces
- **MailPiece** → **MailPieceStatusHistory** (1:N) - Mail piece has multiple status changes
- **MailAddress** → **MailPiece** (1:N) - Address used in multiple mail pieces (both sender and recipient)
- **File** → **MailPiece** (1:N) - File used in multiple mail pieces

### **Foreign Key Constraints**
- `MailPiece.userId` → `User.id` (CASCADE DELETE)
- `MailPiece.fileId` → `File.id` (SET NULL)
- `MailPiece.senderAddressId` → `MailAddress.id` (SET NULL)
- `MailPiece.recipientAddressId` → `MailAddress.id` (SET NULL)
- `MailPieceStatusHistory.mailPieceId` → `MailPiece.id` (CASCADE DELETE)

## 📊 **Key Indexes**

### **Performance Indexes**
- `[userId, status]` - User's mail pieces by status
- `[userId, createdAt]` - User's recent mail pieces
- `[status, createdAt]` - Mail pieces by status
- `[lobId]` - Lob integration queries
- `[stripePaymentId]` - Payment reconciliation
- `[trackingNumber]` - Tracking queries
- `[mailPieceId, createdAt]` - Status history queries

## 📦 **FedEx-Style Tracking Capabilities**

### **Complete Status Timeline**
The `MailPieceStatusHistory` model provides comprehensive tracking with:

- **Timestamp Tracking**: Every status change recorded with exact date/time
- **Location Tracking**: GPS coordinates, facility names, city/state for each status
- **Delivery Details**: Method, signature, photo proof of delivery
- **Source Attribution**: Track whether updates came from webhooks, manual entry, or system
- **Audit Trail**: Complete history of who/what triggered each status change

### **Example Status Progression**
```
📅 2024-01-15 10:30:00 - draft (User created mail piece)
📅 2024-01-15 10:35:00 - paid (Payment processed)
📅 2024-01-15 10:36:00 - validating (Address/file validation)
📅 2024-01-15 10:37:00 - submitted (Sent to Lob)
📅 2024-01-15 11:00:00 - processing (Lob processing started)
📅 2024-01-15 14:30:00 - printed (Lob Print Facility, San Francisco, CA)
📅 2024-01-15 16:45:00 - mailed (USPS Processing Center, San Francisco, CA)
📅 2024-01-16 08:15:00 - in_transit (USPS Distribution Center, Chicago, IL)
📅 2024-01-17 07:30:00 - in_transit (Out for delivery, New York, NY)
📅 2024-01-17 14:22:00 - delivered (Handed to recipient, John Smith signature)
```

### **Real-time Updates**
- **Lob Webhooks**: Automatic status updates from Lob API
- **Manual Updates**: Admin can manually update statuses
- **System Updates**: Automated status changes
- **User Notifications**: Email/SMS for status changes

## 🎯 **Query Patterns**

### **Common Queries**
1. **User Dashboard**: Get user's recent mail pieces with status
2. **Status Monitoring**: Get mail pieces by status for admin
3. **Lob Webhook**: Find mail piece by Lob ID for status updates
4. **Payment Reconciliation**: Find mail pieces by Stripe payment ID
5. **Address Usage**: Get mail pieces using specific address

### **Sample Queries**
```sql
-- User's recent mail pieces
SELECT * FROM MailPiece 
WHERE userId = ? 
ORDER BY createdAt DESC 
LIMIT 20;

-- Mail pieces by status
SELECT * FROM MailPiece 
WHERE status = ? 
ORDER BY createdAt DESC;

-- Complete status timeline for a mail piece (FedEx-style)
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
  deliverySignature,
  latitude,
  longitude
FROM MailPieceStatusHistory 
WHERE mailPieceId = ? 
ORDER BY createdAt ASC;

-- Current status with latest update
SELECT 
  mp.id,
  mp.description,
  mp.status,
  mp.trackingNumber,
  mph.createdAt as lastUpdate,
  mph.notes as lastStatusNote,
  mph.facilityName,
  mph.city,
  mph.state
FROM MailPiece mp
LEFT JOIN MailPieceStatusHistory mph ON mp.id = mph.mailPieceId
WHERE mp.id = ? 
ORDER BY mph.createdAt DESC 
LIMIT 1;

-- Mail pieces currently in transit
SELECT 
  mp.id,
  mp.description,
  mp.trackingNumber,
  mph.facilityName,
  mph.city,
  mph.state,
  mph.estimatedDelivery
FROM MailPiece mp
JOIN MailPieceStatusHistory mph ON mp.id = mph.mailPieceId
WHERE mp.status = 'in_transit'
AND mph.createdAt = (
  SELECT MAX(createdAt) 
  FROM MailPieceStatusHistory 
  WHERE mailPieceId = mp.id
);

-- Address usage statistics
SELECT COUNT(*) FROM MailPiece 
WHERE senderAddressId = ? OR recipientAddressId = ?;
```

## 🚀 **Migration Strategy**

### **Step 1: Add New Models**
```prisma
// Add to schema.prisma
model MailPiece {
  id                String   @id @default(uuid())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // User relationship
  user              User     @relation(fields: [userId], references: [id])
  userId            String
  
  // Mail content and configuration (UPDATED FOR PHYSICAL MAIL)
  description       String   // Mail piece description/title (was "subject")
  notes             String?  // Optional notes or special instructions (was "message")
  pieceType         String   @default("letter") // "letter", "postcard", "flyer", "self_mailer", "brochure", "catalog"
  
  // File relationship
  file              File?    @relation(fields: [fileId], references: [id])
  fileId            String?
  
  // Address relationships
  senderAddress     MailAddress @relation("SentMailPieces", fields: [senderAddressId], references: [id])
  senderAddressId   String
  recipientAddress  MailAddress @relation("ReceivedMailPieces", fields: [recipientAddressId], references: [id])
  recipientAddressId String
  
  // Mail configuration (UPDATED FOR PHYSICAL MAIL)
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
  
  // Status and tracking (UPDATED FOR PHYSICAL MAIL)
  status            String   @default("draft") // "draft", "pending_payment", "paid", "validating", "submitted", "processing", "printed", "mailed", "in_transit", "delivered", "failed", "returned"
  trackingNumber    String?
  cost              Float?   // Final cost in USD
  estimatedDelivery DateTime?
  actualDelivery    DateTime?
  
  // Lob integration
  lobId             String?
  lobStatus         String?
  lobTrackingNumber String?
  lobDeliveryDate   DateTime?
  
  // Payment integration
  stripePaymentId   String?
  paymentStatus     String   @default("pending") // "pending", "paid", "failed", "refunded"
  paymentAmount     Float?
  paymentCurrency   String   @default("usd")
  
  // Pre-validation status
  addressValidated  Boolean  @default(false)
  fileValidated     Boolean  @default(false)
  validationErrors  Json?
  
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

model MailPieceStatusHistory {
  id          String    @id @default(uuid())
  createdAt   DateTime  @default(now())
  
  // Mail piece relationship
  mailPiece   MailPiece @relation(fields: [mailPieceId], references: [id], onDelete: Cascade)
  mailPieceId String
  
  // Status information
  status      String    // Current status
  previousStatus String? // Previous status for transition tracking
  lobStatus   String?   // Lob's status if different from internal status
  trackingNumber String? // Tracking number when available
  
  // Context and notes
  notes       String?   // Human-readable status description
  source      String    @default("system") // "system", "webhook", "manual", "user"
  triggeredBy String?   // User ID or system process that triggered the change
  
  // External data
  lobData     Json?     // Store Lob webhook data as JSON
  errorMessage String?  // Error message if status change failed
  
  // Delivery information
  deliveryDate DateTime?
  deliveryLocation String? // Delivery location details
  
  // Indexes for performance
  @@index([mailPieceId, createdAt])
  @@index([status, createdAt])
  @@index([source, createdAt])
}
```

### **Step 2: Update Existing Models**
```prisma
model User {
  // ... existing fields
  mailPieces MailPiece[]
}

model MailAddress {
  // ... existing fields
  sentMailPieces MailPiece[] @relation("SentMailPieces")
  receivedMailPieces MailPiece[] @relation("ReceivedMailPieces")
}

model File {
  // ... existing fields
  mailPieces MailPiece[]
}
```

### **Step 3: Run Migration**
```bash
npx prisma migrate dev --name add_mail_piece_models
npx prisma generate
```

## 📈 **Performance Considerations**

### **Optimization Strategies**
- **Pagination**: All list queries support pagination
- **Filtering**: Support filtering by status, date range, address
- **Caching**: Cache frequently accessed data
- **Indexing**: Strategic indexes for common query patterns

### **Scalability**
- **Partitioning**: Consider table partitioning for large datasets
- **Read Replicas**: Use read replicas for improved performance
- **Connection Pooling**: Optimize database connections
- **Query Optimization**: Regular query performance analysis

---

**Document Version**: 1.1  
**Last Updated**: January 2024  
**Status**: Updated for physical mail - Database design ready for implementation
