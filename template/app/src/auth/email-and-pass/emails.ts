import { type GetVerificationEmailContentFn, type GetPasswordResetEmailContentFn } from 'wasp/server/auth';

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({ verificationLink }) => ({
  subject: 'Verify your email - Postmarkr',
  text: `Welcome to Postmarkr! Please click the link below to verify your email address: ${verificationLink}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Welcome to Postmarkr!</h2>
      <p style="color: #666; line-height: 1.6;">
        Thank you for signing up. Please click the button below to verify your email address and activate your account.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, you can also copy and paste this link into your browser:<br>
        <a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This verification link will expire in 24 hours. If you didn't create an account with Postmarkr, you can safely ignore this email.
      </p>
    </div>
  `,
});

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({ passwordResetLink }) => ({
  subject: 'Reset your password - Postmarkr',
  text: `You requested a password reset for your Postmarkr account. Click the link below to reset your password: ${passwordResetLink}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="color: #666; line-height: 1.6;">
        You requested to reset your password for your Postmarkr account. Click the button below to create a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${passwordResetLink}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, you can also copy and paste this link into your browser:<br>
        <a href="${passwordResetLink}" style="color: #dc3545;">${passwordResetLink}</a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This password reset link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `,
});
