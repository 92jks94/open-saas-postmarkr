import { type User } from 'wasp/entities';
import { faker } from '@faker-js/faker';
import type { PrismaClient } from '@prisma/client';
import { getPageBasedPaymentPlanIds, SubscriptionStatus } from '../../payment/plans';

type MockUserData = Omit<User, 'id'>;

/**
 * This function, which we've imported in `app.db.seeds` in the `main.wasp` file,
 * seeds the database with mock users via the `wasp db seed` command.
 * For more info see: https://wasp.sh/docs/data-model/backends#seeding-the-database
 */
export async function seedMockUsers(prismaClient: PrismaClient) {
  await Promise.all(generateMockUsersData(50).map((data) => prismaClient.user.create({ data })));
  
  // Initialize default app settings
  await seedAppSettings(prismaClient);
}

async function seedAppSettings(prismaClient: PrismaClient) {
  const defaultSettings = [
    {
      key: 'beta_access_code',
      value: '312',
      description: 'Beta access code required for new user signups',
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable/disable maintenance mode for the application',
    },
    {
      key: 'max_file_size_mb',
      value: '10',
      description: 'Maximum file upload size in megabytes',
    },
  ];

  for (const setting of defaultSettings) {
    await prismaClient.appSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}

function generateMockUsersData(numOfUsers: number): MockUserData[] {
  return faker.helpers.multiple(generateMockUserData, { count: numOfUsers });
}

function generateMockUserData(): MockUserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const subscriptionStatus = faker.helpers.arrayElement<SubscriptionStatus | null>([
    ...Object.values(SubscriptionStatus),
    null,
  ]);
  const now = new Date();
  const createdAt = faker.date.past({ refDate: now });
  const timePaid = faker.date.between({ from: createdAt, to: now });
  const credits = subscriptionStatus ? 0 : faker.number.int({ min: 0, max: 10 });
  const hasUserPaidOnStripe = !!subscriptionStatus || credits > 3;
  return {
    email: faker.internet.email({ firstName, lastName }),
    username: faker.internet.userName({ firstName, lastName }),
    createdAt,
    isAdmin: false,
    hasBetaAccess: faker.datatype.boolean({ probability: 0.7 }), // 70% chance of beta access
    hasFullAccess: faker.datatype.boolean({ probability: 0.3 }), // 30% chance of full access
    credits,
    subscriptionStatus,
    paymentProcessorUserId: hasUserPaidOnStripe ? `cus_test_${faker.string.uuid()}` : null,
    datePaid: hasUserPaidOnStripe ? faker.date.between({ from: createdAt, to: timePaid }) : null,
    subscriptionPlan: subscriptionStatus ? faker.helpers.arrayElement(getPageBasedPaymentPlanIds()) : null,
  };
}
