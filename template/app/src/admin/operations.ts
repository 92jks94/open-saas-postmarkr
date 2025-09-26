import { HttpError } from 'wasp/server';
import type { GetAppSettings, UpdateAppSetting } from 'wasp/server/operations';
import type { AppSettings } from 'wasp/entities';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

const updateAppSettingInputSchema = z.object({
  key: z.string().nonempty(),
  value: z.string().nonempty(),
});

type UpdateAppSettingInput = z.infer<typeof updateAppSettingInputSchema>;

export const updateAppSetting: UpdateAppSetting<UpdateAppSettingInput, AppSettings> = async (
  rawArgs,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const { key, value } = ensureArgsSchemaOrThrowHttpError(updateAppSettingInputSchema, rawArgs);

  // Upsert the setting
  return context.entities.AppSettings.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      description: getSettingDescription(key),
    },
  });
};

export const getAppSettings: GetAppSettings<void, AppSettings[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  return context.entities.AppSettings.findMany({
    orderBy: { key: 'asc' },
  });
};

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'beta_access_code': 'Beta access code required for new user signups',
    'maintenance_mode': 'Enable/disable maintenance mode for the application',
    'max_file_size_mb': 'Maximum file upload size in megabytes',
    'email_from_name': 'Default sender name for emails',
    'email_from_address': 'Default sender email address',
  };

  return descriptions[key] || 'Application setting';
}
