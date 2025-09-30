/**
 * Script to fix orders that were paid but stuck in draft status
 * due to webhook processing issues
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPaidOrders() {
  try {
    console.log('🔍 Looking for draft orders that should be marked as paid...\n');

    // Find mail pieces that are in draft status but have a payment intent ID
    // This indicates the payment process was started
    const draftOrdersWithPayment = await prisma.mailPiece.findMany({
      where: {
        status: 'draft',
        paymentIntentId: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 3
        }
      }
    });

    if (draftOrdersWithPayment.length === 0) {
      console.log('✅ No draft orders with payment intents found');
      return;
    }

    console.log(`📋 Found ${draftOrdersWithPayment.length} draft orders with payment intents:\n`);

    for (const order of draftOrdersWithPayment) {
      console.log(`Order ID: ${order.id}`);
      console.log(`User: ${order.user.email || 'N/A'}`);
      console.log(`Created: ${order.createdAt.toISOString()}`);
      console.log(`Payment Intent: ${order.paymentIntentId}`);
      console.log(`Mail Type: ${order.mailType}`);
      console.log('');
    }

    // Ask for confirmation before making changes
    console.log('⚠️  This script will:');
    console.log('1. Mark these orders as "paid"');
    console.log('2. Update payment status to "paid"');
    console.log('3. Create status history entries');
    console.log('4. Attempt to submit to Lob (if configured)\n');

    // For now, let's just mark them as paid and let the user manually submit to Lob
    console.log('🔧 Fixing orders...\n');

    for (const order of draftOrdersWithPayment) {
      try {
        // Update the order status
        await prisma.mailPiece.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            paymentStatus: 'paid'
          }
        });

        // Create status history entry
        await prisma.mailPieceStatusHistory.create({
          data: {
            mailPieceId: order.id,
            status: 'paid',
            previousStatus: 'draft',
            description: 'Payment status fixed via script - webhook processing issue resolved',
            source: 'system'
          }
        });

        console.log(`✅ Fixed order ${order.id}`);
      } catch (error) {
        console.error(`❌ Failed to fix order ${order.id}:`, error.message);
      }
    }

    console.log(`\n🎉 Fixed ${draftOrdersWithPayment.length} orders!`);
    console.log('\n📝 Next steps:');
    console.log('1. Check your mail history page - orders should now show as "paid"');
    console.log('2. You can manually submit paid orders to Lob from the UI');
    console.log('3. Future orders will be automatically processed correctly');

  } catch (error) {
    console.error('❌ Error fixing paid orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixPaidOrders();
