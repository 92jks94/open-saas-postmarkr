import { prisma } from 'wasp/server';

/**
 * Get the current beta access code from the database
 * Falls back to environment variable or default value
 */
export async function getCurrentBetaAccessCode(): Promise<string> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'beta_access_code' },
    });
    
    if (setting) {
      return setting.value;
    }
  } catch (error) {
    console.warn('Failed to fetch beta access code from database:', error);
  }
  
  // Fallback to environment variable or default
  return process.env.BETA_ACCESS_CODE || '312';
}

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
