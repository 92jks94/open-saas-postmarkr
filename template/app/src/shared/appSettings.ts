import { prisma } from 'wasp/server';


/**
 * Get a specific app setting by key
 */
export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key },
    });
    
    return setting?.value || null;
  } catch (error) {
    console.warn(`Failed to fetch app setting ${key}:`, error);
    return null;
  }
}
