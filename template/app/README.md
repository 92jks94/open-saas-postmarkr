# Postmarkr - Physical Mail Service Platform

**Postmarkr** is a comprehensive physical mail service platform that enables remote workers, freelancers, and businesses to send physical mail from anywhere in the world. Upload PDF documents, manage addresses, process payments, and track delivery - all through a modern web interface powered by Lob API integration.

Built with [Wasp](https://wasp.sh) - a full-stack React, Node.js, and Prisma framework.

## 🚀 Features

### Document Management
- **PDF Upload & Processing** - Secure file upload to AWS S3 with metadata extraction
- **File Validation** - Automatic PDF validation and page count detection
- **Document Preview** - Preview documents before sending with thumbnail generation
- **Page Selection** - Choose specific pages from multi-page PDFs
- **File Organization** - Manage and organize uploaded documents

### Address Management
- **Address Book** - Store and manage sender/recipient addresses
- **Address Validation** - Real-time address validation via Lob API
- **Default Addresses** - Set default sender addresses for quick sending
- **Address History** - Track frequently used addresses
- **International Support** - Support for domestic and international addresses

### Mail Creation Workflow
- **Mail Piece Creation** - Create mail pieces with document and address selection
- **Service Options** - Choose from First Class, Express, and Priority mail
- **Printing Preferences** - Configure color printing and double-sided options
- **Service Add-ons** - Signature confirmation, return receipt, tracking
- **Cost Calculation** - Real-time pricing based on mail type and options

### Payment Processing
- **Stripe Integration** - Secure payment processing for mail services
- **Per-Mail Pricing** - Pay only for what you send
- **Payment History** - Track payment status and transaction history
- **Refund Support** - Process refunds for cancelled or failed mail pieces
- **Payment Verification** - Automated payment status verification

### Delivery Tracking
- **Real-time Status Updates** - Webhook-based status updates from Lob API
- **Delivery Tracking** - Track mail pieces from creation to delivery
- **Status History** - Complete audit trail of mail piece status changes
- **Notification System** - Email and in-app notifications for status changes
- **Webhook Monitoring** - Health monitoring and metrics for webhook processing

### Admin & Monitoring
- **Admin Dashboard** - Comprehensive admin interface for system management
- **User Management** - Manage user accounts and access levels
- **Mail Analytics** - Track mail volume, success rates, and performance metrics
- **System Monitoring** - Health checks, webhook monitoring, and error tracking
- **Debug Tools** - Debug mail pieces and troubleshoot issues

### Background Processing
- **Job Queue System** - PgBoss-powered background job processing
- **PDF Processing** - Automated PDF metadata extraction and thumbnail generation
- **Mail Submission** - Background submission to Lob API
- **File Cleanup** - Automated cleanup of orphaned S3 files
- **Payment Verification** - Automated payment status verification

## 🛠 Technology Stack

### Core Framework & Database
- **[Wasp](https://wasp.sh)** - Full-stack React, NodeJS, Prisma framework with type-safe operations
- **[PostgreSQL](https://postgresql.org)** - Production-ready database with advanced features
- **[PgBoss](https://github.com/timgit/pg-boss)** - Background job processing for mail operations
- **[Prisma](https://prisma.io)** - Type-safe database ORM with migrations

### Mail Service Integration
- **[Lob API](https://lob.com)** - Professional mail printing and delivery services
- **[Stripe](https://stripe.com)** - Payment processing for mail services
- **[AWS S3](https://aws.amazon.com/s3/)** - Secure file storage for PDF documents

### Frontend & UI
- **[React](https://reactjs.org)** - Modern UI framework
- **[TailwindCSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[ShadCN UI](https://ui.shadcn.com/)** - Beautiful, accessible React components
- **[Radix UI](https://radix-ui.com)** - Unstyled, accessible UI primitives

### Email & Communication
- **[SendGrid](https://sendgrid.com)** - Transactional email delivery
- **[React Hook Form](https://react-hook-form.com)** - Form management
- **[Zod](https://zod.dev)** - Schema validation

### Development & Deployment
- **[TypeScript](https://typescriptlang.org)** - Type-safe JavaScript
- **[Vitest](https://vitest.dev)** - Fast unit testing framework
- **[Fly.io](https://fly.io)** - Cloud deployment platform
- **[Docker](https://docker.com)** - Containerization

### Optional Integrations
- **[Google Analytics](https://analytics.google.com/)** - Usage analytics
- **[Sentry](https://sentry.io)** - Error monitoring and performance tracking

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 22.12 (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **Docker** - For PostgreSQL database
- **Wasp CLI** - Install from [wasp.sh](https://wasp.sh)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd postmarkr
   ```

2. **Install Wasp**
   ```bash
   curl -sSL https://get.wasp.sh/installer.sh | sh
   ```

3. **Set up environment variables**
   ```bash
   cp .env.server.example .env.server
   cp .env.client.example .env.client
   ```

4. **Start the database**
   ```bash
   wasp start db
   ```

5. **Run database migrations**
   ```bash
   wasp db migrate-dev
   ```

6. **Start the application**
   ```bash
   wasp start
   ```

The application will be available at `http://localhost:3000`.

### Environment Configuration

Create `.env.server` with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/postmarkr

# Authentication
JWT_SECRET=your_jwt_secret_here

# Application URLs
WASP_SERVER_URL=http://localhost:3001
WASP_CLIENT_URL=http://localhost:3000

# Lob API
LOB_TEST_KEY=test_your_test_key_here
LOB_PROD_KEY=live_your_prod_key_here
LOB_ENVIRONMENT=test
LOB_WEBHOOK_SECRET=your_webhook_secret_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# AWS S3
AWS_S3_IAM_ACCESS_KEY=your_access_key_here
AWS_S3_IAM_SECRET_KEY=your_secret_key_here
AWS_S3_FILES_BUCKET=your_bucket_name_here
AWS_S3_REGION=us-east-2

# Email
SENDGRID_API_KEY=your_sendgrid_key_here

# Analytics (Optional)
GOOGLE_ANALYTICS_CLIENT_EMAIL=your_client_email_here
GOOGLE_ANALYTICS_PROPERTY_ID=your_property_id_here
GOOGLE_ANALYTICS_PRIVATE_KEY=your_private_key_here

# Error Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_here
```

## 📁 Project Structure

```
src/
├── address-management/     # Address book and validation
├── admin/                 # Admin dashboard and monitoring
├── analytics/             # Analytics and statistics
├── auth/                  # Authentication and user management
├── client/                # Shared client components
├── components/            # Reusable UI components
├── file-upload/           # PDF upload and processing
├── landing-page/          # Marketing and landing page
├── legal/                 # Privacy policy and terms
├── lib/                   # Utility functions
├── mail/                  # Core mail piece creation and tracking
├── payment/               # Stripe payment integration
├── server/                # Server-side code
│   ├── lob/              # Lob API integration
│   ├── email/            # Email services
│   └── monitoring/       # Health checks and monitoring
├── shared/               # Shared constants and utilities
└── user/                 # User account management
```

## 🔧 Key Features Documentation

### Mail Creation Workflow

1. **Upload Document** - Upload PDF files up to 25MB
2. **Select Mail Type** - Choose from First Class, Priority, Express
3. **Choose Addresses** - Select sender and recipient from address book
4. **Configure Options** - Set printing preferences and service add-ons
5. **Review & Pay** - Review details and process payment
6. **Track Delivery** - Monitor status through webhook updates

### Address Management

- **Real-time Validation** - Addresses validated via Lob API
- **Address Book** - Save frequently used addresses
- **Default Settings** - Set default sender address
- **International Support** - Handle domestic and international addresses
- **Usage Tracking** - Track address usage and frequency

### File Upload & Processing

- **PDF Validation** - Automatic format and integrity validation
- **Metadata Extraction** - Extract page count and document properties
- **Thumbnail Generation** - Generate preview thumbnails
- **Page Selection** - Choose specific pages from multi-page documents
- **Secure Storage** - Files stored securely in AWS S3

### Payment Processing

- **Per-Mail Pricing** - Pay only for individual mail pieces
- **Real-time Calculation** - Dynamic pricing based on service and destination
- **Stripe Integration** - Secure payment processing
- **Payment Verification** - Automated verification of payment status
- **Refund Support** - Process refunds for failed deliveries

### Delivery Tracking

- **Webhook Integration** - Real-time updates from Lob API
- **Status History** - Complete audit trail of status changes
- **Notification System** - Email and in-app notifications
- **Tracking Numbers** - Unique tracking for each mail piece
- **Delivery Confirmation** - Proof of delivery when available

### Background Jobs

- **`processPDFMetadata`** - Extract PDF metadata and generate thumbnails
- **`submitPaidMailToLob`** - Submit paid mail pieces to Lob API
- **`verifyPaymentStatus`** - Verify payment completion every 5 minutes
- **`cleanupOrphanedS3Files`** - Clean up orphaned S3 files daily
- **`cleanupExtractedFiles`** - Clean up extracted PDF files daily
- **`monitorWebhookHealth`** - Monitor webhook processing health hourly

## 🚀 Deployment

Deploy to Fly.io with a single command:

```bash
npm run deploy
```

**Quick deployment** (no health checks):
```bash
npm run deploy:quick
```

**Note**: Make sure you're authenticated with Fly.io first:
```bash
flyctl auth login
```

### Available Commands

- **`npm run deploy`** - Basic deployment script
- **`npm run deploy:quick`** - Quick deployment script
- **`npm run sync:secrets`** - Sync environment variables to Fly.io
- **`npm run check:production`** - Pre-deployment production readiness check
- **`npm run check:health`** - Check application health status

### Health Check Endpoints

- **`/health`** - Basic health check endpoint
- **`/health/simple`** - Minimal health status
- **`/health/detailed`** - Comprehensive system metrics
- **`/api/webhooks/health`** - Webhook processing health
- **`/api/webhooks/metrics`** - Webhook performance metrics
- **`/api/webhooks/events`** - Recent webhook events

## 🔌 API Documentation

### Key Endpoints

- **`POST /webhooks/lob`** - Lob webhook receiver for status updates
- **`GET /api/webhooks/health`** - Webhook processing health check
- **`GET /api/webhooks/metrics`** - Webhook performance metrics
- **`GET /api/webhooks/events`** - Recent webhook events for debugging
- **`GET /health`** - Application health check
- **`GET /health/simple`** - Simple health status
- **`GET /health/detailed`** - Detailed system metrics

### Webhook Security

- **HMAC-SHA256** signature verification
- **Timestamp validation** (5-minute tolerance)
- **Idempotency handling** for duplicate events
- **Rate limiting** protection
- **Comprehensive error handling**

## 🧪 Development

### Running Locally

```bash
# Start database
wasp start db

# Run migrations
wasp db migrate-dev

# Start application
wasp start
```

### Database Management

```bash
# Create new migration
wasp db migrate-dev "Migration description"

# Open Prisma Studio
wasp db studio

# Reset database
wasp db reset
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:critical

# Run with coverage
npm run test:coverage

# Run E2E tests
cd e2e-tests
npm test
```

### Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🏗 Architecture

### High-Level Architecture

- **Frontend**: React with TailwindCSS and ShadCN UI components
- **Backend**: Node.js with Wasp framework
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: AWS S3 for PDF documents and thumbnails
- **Mail Processing**: Lob API for physical mail services
- **Payments**: Stripe for payment processing
- **Background Jobs**: PgBoss for job queue management
- **Email**: SendGrid for transactional emails

### Data Models

- **`User`** - User accounts and authentication
- **`MailPiece`** - Core mail piece entity with status tracking
- **`MailAddress`** - Standardized address storage
- **`File`** - PDF file metadata and validation
- **`MailPieceStatusHistory`** - Status change audit trail
- **`Notification`** - User notifications and preferences
- **`WebhookMetrics`** - Webhook performance tracking

### Integration Points

- **Lob API** - Physical mail processing and delivery tracking
- **Stripe API** - Payment processing and webhook handling
- **AWS S3** - File storage and retrieval
- **SendGrid** - Email notifications and confirmations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

## 🔗 Related Documentation

- [Lob API Setup Guide](docs/LOB_SETUP_GUIDE.md)
- [Physical Mail App Plan](docs/PHYSICAL_MAIL_APP_PLAN.md)
- [Deployment Guide](DEPLOYMENT.md)
- [E2E Testing Guide](e2e-tests/README.md)