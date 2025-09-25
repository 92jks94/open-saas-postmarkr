import { z } from 'zod';
import { defineUserSignupFields } from 'wasp/auth/providers/types';

const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
const betaEmails = process.env.BETA_EMAILS?.split(',') || [];

const emailDataSchema = z.object({
  email: z.string(),
});

export const getEmailUserFields = defineUserSignupFields({
  email: (data) => {
    const emailData = emailDataSchema.parse(data);
    return emailData.email;
  },
  username: (data) => {
    const emailData = emailDataSchema.parse(data);
    return emailData.email;
  },
  isAdmin: (data) => {
    const emailData = emailDataSchema.parse(data);
    return adminEmails.includes(emailData.email);
  },
  hasBetaAccess: (data) => {
    const emailData = emailDataSchema.parse(data);
    return betaEmails.includes(emailData.email) || adminEmails.includes(emailData.email);
  },
  hasFullAccess: () => false, // No one gets full access initially
});


const googleDataSchema = z.object({
  profile: z.object({
    email: z.string(),
    email_verified: z.boolean(),
  }),
});

export const getGoogleUserFields = defineUserSignupFields({
  email: (data) => {
    const googleData = googleDataSchema.parse(data);
    return googleData.profile.email;
  },
  username: (data) => {
    const googleData = googleDataSchema.parse(data);
    return googleData.profile.email;
  },
  isAdmin: (data) => {
    const googleData = googleDataSchema.parse(data);
    if (!googleData.profile.email_verified) {
      return false;
    }
    return adminEmails.includes(googleData.profile.email);
  },
  hasBetaAccess: (data) => {
    const googleData = googleDataSchema.parse(data);
    if (!googleData.profile.email_verified) {
      return false;
    }
    return betaEmails.includes(googleData.profile.email) || adminEmails.includes(googleData.profile.email);
  },
  hasFullAccess: () => false, // No one gets full access initially
});

export function getGoogleAuthConfig() {
  return {
    scopes: ['profile', 'email'], // must include at least 'profile' for Google
  };
}

