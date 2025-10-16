/**
 * Cleanup Invalid Files Script
 * 
 * This script deletes files from the database that are marked as invalid
 * (typically because they failed to upload to S3).
 * 
 * Run with: wasp db seed scripts/cleanup-invalid-files.ts
 * Or: npx tsx scripts/cleanup-invalid-files.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding invalid files...');

  // Find all files with invalid status
  const invalidFiles = await prisma.file.findMany({
    where: {
      validationStatus: 'invalid',
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      validationError: true,
    },
  });

  console.log(`Found ${invalidFiles.length} invalid files`);

  if (invalidFiles.length === 0) {
    console.log('✅ No invalid files to clean up!');
    return;
  }

  // Display files that will be deleted
  console.log('\n📋 Files to be deleted:');
  invalidFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.name}`);
    console.log(`     Created: ${file.createdAt.toLocaleString()}`);
    console.log(`     Error: ${file.validationError}`);
    console.log('');
  });

  // Delete invalid files
  console.log('🗑️  Deleting invalid files...');
  const result = await prisma.file.deleteMany({
    where: {
      validationStatus: 'invalid',
    },
  });

  console.log(`✅ Deleted ${result.count} invalid files`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

