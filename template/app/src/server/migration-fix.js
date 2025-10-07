#!/usr/bin/env node

/**
 * Migration Fix Script
 * 
 * This script fixes the missing _prisma_migrations table in production
 * and resets the migration state to match the current schema.
 */

import { PrismaClient } from '@prisma/client';

async function fixMigrationState() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking if _prisma_migrations table exists...');
    
    // Check if _prisma_migrations table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.log('❌ _prisma_migrations table does not exist. Creating it...');
      
      // Create the _prisma_migrations table
      await prisma.$executeRaw`
        CREATE TABLE "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMP(3),
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMP(3),
          "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `;
      
      console.log('✅ Created _prisma_migrations table');
    } else {
      console.log('✅ _prisma_migrations table already exists');
    }
    
    // Clear any problematic migration records
    console.log('🧹 Cleaning up migration records...');
    
    // Remove any migration records that don't correspond to actual migration files
    const currentMigrations = [
      '20250928131431_9_28_newe',
      '20250928140000_add_address_placement_field', 
      '20250928140001_convert_address_placement_enum',
      '20250929115148_add_database_index',
      '20251002193806_add_lob_preview_fields',
      '20251002195402_add_webhook_metrics',
      '20251005171234_sync_schema',
      '20251006160000_fresh_schema_reset'
    ];
    
    // Delete any migration records that don't match current migrations
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations" 
      WHERE "migration_name" NOT IN (${currentMigrations.join("', '")})
    `;
    
    console.log(`🗑️  Removed ${deleteResult} invalid migration records`);
    
    // Insert the current migration records
    console.log('📝 Inserting current migration records...');
    
    for (const migrationName of currentMigrations) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "_prisma_migrations" (
            "id", 
            "checksum", 
            "migration_name", 
            "started_at", 
            "finished_at", 
            "applied_steps_count"
          ) VALUES (
            ${crypto.randomUUID()},
            '0000000000000000000000000000000000000000000000000000000000000000',
            ${migrationName},
            NOW(),
            NOW(),
            1
          ) ON CONFLICT ("migration_name") DO NOTHING;
        `;
      } catch (error) {
        console.log(`⚠️  Could not insert migration ${migrationName}:`, error.message);
      }
    }
    
    console.log('✅ Migration state reset successfully');
    
    // Verify the current state
    const migrationCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "_prisma_migrations"
    `;
    
    console.log(`📊 Current migration records: ${migrationCount[0].count}`);
    
    // Test a simple query to make sure everything works
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    console.log('🎉 Migration fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing migration state:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMigrationState();