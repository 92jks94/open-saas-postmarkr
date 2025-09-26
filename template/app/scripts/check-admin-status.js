#!/usr/bin/env node

/**
 * Script to check and update admin status for users
 * Usage: node scripts/check-admin-status.js [email]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndUpdateAdminStatus(email) {
  try {
    console.log('🔍 Checking admin status...\n');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email },
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
      console.log(`❌ No user found with email: ${email}`);
      console.log('\n📋 Available users:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          isAdmin: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. ${u.email} (${u.username}) - Admin: ${u.isAdmin ? '✅' : '❌'} - Created: ${u.createdAt.toISOString()}`);
      });
      return;
    }

    console.log('👤 User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Beta Access: ${user.hasBetaAccess ? '✅ Yes' : '❌ No'}`);
    console.log(`   Full Access: ${user.hasFullAccess ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);

    // Check if this email should be admin based on environment
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const shouldBeAdmin = adminEmails.includes(email);

    console.log(`\n🔧 Admin emails configured: ${adminEmails.join(', ')}`);
    console.log(`🎯 Should be admin: ${shouldBeAdmin ? '✅ Yes' : '❌ No'}`);

    if (shouldBeAdmin && !user.isAdmin) {
      console.log('\n🔄 Updating user to admin...');
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isAdmin: true,
          hasBetaAccess: true // Also grant beta access
        }
      });
      console.log('✅ User updated to admin successfully!');
    } else if (!shouldBeAdmin && user.isAdmin) {
      console.log('\n⚠️  User is admin but not in ADMIN_EMAILS list. No changes made.');
    } else {
      console.log('\n✅ User admin status is correct.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-admin-status.js <email>');
  console.log('Example: node scripts/check-admin-status.js nathan@postmarkr.com');
  process.exit(1);
}

checkAndUpdateAdminStatus(email);
