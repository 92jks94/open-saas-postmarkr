#!/usr/bin/env node

/**
 * Script to check user details by ID
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser(userId) {
  try {
    console.log(`🔍 Checking user with ID: ${userId}\n`);
    
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

    console.log('👤 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email || 'NULL/Not set'}`);
    console.log(`   Username: ${user.username || 'NULL/Not set'}`);
    console.log(`   Admin: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Beta Access: ${user.hasBetaAccess ? '✅ Yes' : '❌ No'}`);
    console.log(`   Full Access: ${user.hasFullAccess ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);

    // Try to find auth information
    try {
      // First find the Auth record for this user
      const authRecord = await prisma.auth.findFirst({
        where: { userId: userId },
        select: {
          id: true,
          userId: true
        }
      });

      if (authRecord) {
        console.log(`\n🔐 Auth Record Found: ${authRecord.id}`);
        
        // Now find auth identities
        const authIdentities = await prisma.authIdentity.findMany({
          where: { authId: authRecord.id },
          select: {
            providerName: true,
            providerUserId: true,
            providerData: true
          }
        });

        console.log(`\n🔐 Auth Identities (${authIdentities.length}):`);
        authIdentities.forEach((identity, index) => {
          console.log(`   ${index + 1}. Provider: ${identity.providerName}`);
          console.log(`      Provider User ID: ${identity.providerUserId}`);
          if (identity.providerData) {
            try {
              const data = typeof identity.providerData === 'string' ? JSON.parse(identity.providerData) : identity.providerData;
              console.log(`      Provider Data:`, JSON.stringify(data, null, 2));
              if (data.email) {
                console.log(`      ✉️  Auth Email: ${data.email}`);
              }
              if (data.hashedPassword) {
                console.log(`      🔒 Has Password: Yes`);
              }
              if (data.isEmailVerified !== undefined) {
                console.log(`      ✅ Email Verified: ${data.isEmailVerified ? 'Yes' : 'No'}`);
              }
            } catch (e) {
              console.log(`      Provider Data (raw): ${identity.providerData}`);
            }
          }
          console.log('');
        });
      } else {
        console.log(`\n⚠️  No Auth record found for user`);
      }
    } catch (authError) {
      console.log(`\n⚠️  Could not fetch auth identities: ${authError.message}`);
    }

    // Check admin configuration
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    console.log(`🔧 Admin emails configured: ${adminEmails.join(', ') || 'None configured'}`);
    
    if (user.email) {
      console.log(`🎯 Should be admin: ${adminEmails.includes(user.email) ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log(`⚠️  No email set in User table - cannot determine admin status`);
    }

  } catch (error) {
    console.error('❌ Error checking user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get user ID from command line argument
const userId = process.argv[2] || 'c16b7b26-8bad-459a-b249-126f433a5722';
checkUser(userId);
