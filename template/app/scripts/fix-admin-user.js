#!/usr/bin/env node

/**
 * Script to fix admin user by updating email and admin status
 * Usage: node scripts/fix-admin-user.js [user-id] [email]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminUser(userId, email) {
  try {
    console.log('🔍 Finding user...\n');
    
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        hasBetaAccess: true,
        hasFullAccess: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log(`❌ No user found with ID: ${userId}`);
      return;
    }

    console.log('👤 Current user data:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email || 'null'}`);
    console.log(`   Username: ${user.username || 'null'}`);
    console.log(`   Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Beta Access: ${user.hasBetaAccess ? '✅ Yes' : '❌ No'}`);
    console.log(`   Full Access: ${user.hasFullAccess ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);

    // Check if this email should be admin based on environment
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const shouldBeAdmin = adminEmails.includes(email);

    console.log(`\n🔧 Admin emails configured: ${adminEmails.join(', ')}`);
    console.log(`🎯 Should be admin: ${shouldBeAdmin ? '✅ Yes' : '❌ No'}`);

    console.log('\n🔄 Updating user...');
    await prisma.user.update({
      where: { id: userId },
      data: { 
        email: email,
        username: email, // Set username to email as well
        isAdmin: shouldBeAdmin,
        hasBetaAccess: true // Grant beta access
      }
    });
    
    console.log('✅ User updated successfully!');
    console.log(`   New email: ${email}`);
    console.log(`   Admin status: ${shouldBeAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Beta access: ✅ Yes`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const userId = process.argv[2];
const email = process.argv[3];

if (!userId || !email) {
  console.log('Usage: node scripts/fix-admin-user.js <user-id> <email>');
  console.log('Example: node scripts/fix-admin-user.js "user-uuid-here" nathan@postmarkr.com');
  process.exit(1);
}

fixAdminUser(userId, email);
