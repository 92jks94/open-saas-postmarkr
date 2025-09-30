const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'c16b7b26-8bad-459a-b249-126f433a5722';
  
  // Check User table
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  console.log('User:', JSON.stringify(user, null, 2));
  
  // Check Auth table
  const auth = await prisma.auth.findFirst({
    where: { userId: userId }
  });
  
  console.log('Auth:', JSON.stringify(auth, null, 2));
  
  if (auth) {
    // Check AuthIdentity table
    const identities = await prisma.authIdentity.findMany({
      where: { authId: auth.id }
    });
    
    console.log('Identities:', JSON.stringify(identities, null, 2));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
