// AWS SES email service

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { User } from '../../types/entities';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name: string
): Promise<void> {
  const senderEmail = process.env.SES_VERIFIED_EMAIL;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!senderEmail) {
    throw new Error('SES_VERIFIED_EMAIL environment variable not set');
  }

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL environment variable not set');
  }

  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

  const htmlBody = generateHtmlEmailTemplate(name, resetLink);
  const textBody = generateTextEmailTemplate(name, resetLink);

  const params = {
    Source: senderEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Reset Your Doylee Dinners Password',
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Generate HTML email template
 */
function generateHtmlEmailTemplate(name: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🍽️ Doylee Dinners</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px;">Hi ${name},</h2>

              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Doylee Dinners account. Click the button below to create a new password:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>

              <p style="margin: 0 0 20px 0; color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>

              <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.6;">
                  ⏱️ <strong>This link will expire in 1 hour</strong> for security reasons.
                </p>
              </div>

              <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                This email was sent by Doylee Dinners. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email template
 */
function generateTextEmailTemplate(name: string, resetLink: string): string {
  return `
Hi ${name},

We received a request to reset your password for your Doylee Dinners account.

To reset your password, please visit the following link:

${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
This email was sent by Doylee Dinners. Please do not reply to this email.
  `.trim();
}

/**
 * Send meal announcement email to a user
 */
export async function sendMealAnnouncementEmail(
  toEmail: string,
  toName: string,
  mealDate: string,
  mealTime: string,
  menu: string,
  mealId: string
): Promise<void> {
  console.log(`Preparing email for ${toEmail}...`);
  const senderEmail = process.env.SES_VERIFIED_EMAIL;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!senderEmail) {
    console.error('SES_VERIFIED_EMAIL environment variable not set');
    throw new Error('SES_VERIFIED_EMAIL environment variable not set');
  }

  if (!frontendUrl) {
    console.error('FRONTEND_URL environment variable not set');
    throw new Error('FRONTEND_URL environment variable not set');
  }

  console.log(`Sending email from ${senderEmail} to ${toEmail}`);

  const mealUrl = `${frontendUrl}/meals/${mealId}`;

  // Format date nicely (e.g., "Monday, April 15, 2026")
  const formattedDate = new Date(mealDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `🍽️ New Dinner Available: ${formattedDate}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .menu-box { background: white; padding: 20px; margin: 20px 0;
                    border-left: 4px solid #667eea; border-radius: 4px; }
        .cta-button { display: inline-block; background: #667eea; color: white !important;
                      padding: 15px 40px; text-decoration: none; border-radius: 6px;
                      font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Dinner Posted! 🎉</h1>
        </div>
        <div class="content">
          <p>Hey ${toName}!</p>

          <p>Great news! A delicious dinner is now open for signups:</p>

          <div class="menu-box">
            <strong>📅 When:</strong> ${formattedDate} at ${mealTime}<br>
            <strong>🍴 Menu:</strong><br>
            <p style="margin: 10px 0; white-space: pre-wrap;">${menu}</p>
          </div>

          <p><strong>Spots fill up fast!</strong> Don't miss out on this amazing meal.</p>

          <center>
            <a href="${mealUrl}" class="cta-button">View Meal & Sign Up</a>
          </center>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            See you at dinner! 🍷
          </p>

          <div class="footer">
            <p>You're receiving this because you're a registered member of Doylee Dinners.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
🎉 New Dinner Posted! 🎉

Hey ${toName}!

Great news! A delicious dinner is now open for signups:

📅 When: ${formattedDate} at ${mealTime}
🍴 Menu:
${menu}

Spots fill up fast! Don't miss out on this amazing meal.

View the meal and sign up here:
${mealUrl}

See you at dinner! 🍷

---
You're receiving this because you're a registered member of Doylee Dinners.
  `;

  const params = {
    Source: `Doylee Dinners <${senderEmail}>`,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: htmlBody },
        Text: { Data: textBody },
      },
    },
  };

  console.log(`Calling SES to send email to ${toEmail}...`);
  await sesClient.send(new SendEmailCommand(params));
  console.log(`Email sent successfully to ${toEmail}`);
}

/**
 * Send meal announcement emails to all users
 * Uses Promise.allSettled to continue even if some emails fail
 */
export async function sendMealAnnouncementToAllUsers(
  mealId: string,
  mealDate: string,
  mealTime: string,
  menu: string,
  users: User[]
): Promise<{ sent: number; failed: number }> {
  console.log(`Sending meal announcement emails to ${users.length} users`);
  console.log(`About to create emailPromises array...`);
  console.log(`First user: ${users[0]?.email}`);

  const emailPromises = users.map((user) => {
    console.log(`Mapping user: ${user.email}`);
    return sendMealAnnouncementEmail(
      user.email,
      user.name || 'Friend',
      mealDate,
      mealTime,
      menu,
      mealId
    ).catch((error) => {
      console.error(`Failed to send email to ${user.email}:`, error);
      throw error;
    });
  });

  console.log('Starting Promise.allSettled...');
  const results = await Promise.allSettled(emailPromises);
  console.log('Promise.allSettled completed');

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    console.warn(`Failed to send ${failed} emails out of ${users.length}`);
  }

  console.log(`Successfully sent ${sent} meal announcement emails`);
  return { sent, failed };
}
