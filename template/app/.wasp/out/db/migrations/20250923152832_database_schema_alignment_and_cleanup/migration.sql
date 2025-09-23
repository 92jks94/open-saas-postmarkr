-- AlterTable
ALTER TABLE "File" ADD COLUMN     "lastProcessedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MailAddress" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "companyName" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "addressType" TEXT NOT NULL DEFAULT 'both',
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validationDate" TIMESTAMP(3),
    "validationError" TEXT,
    "lobAddressId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "MailAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailAddress_userId_addressType_idx" ON "MailAddress"("userId", "addressType");

-- CreateIndex
CREATE INDEX "MailAddress_userId_isDefault_idx" ON "MailAddress"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "MailAddress_postalCode_idx" ON "MailAddress"("postalCode");

-- CreateIndex
CREATE INDEX "MailAddress_country_idx" ON "MailAddress"("country");

-- CreateIndex
CREATE INDEX "State_country_idx" ON "State"("country");

-- CreateIndex
CREATE UNIQUE INDEX "State_code_country_key" ON "State"("code", "country");

-- AddForeignKey
ALTER TABLE "MailAddress" ADD CONSTRAINT "MailAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
