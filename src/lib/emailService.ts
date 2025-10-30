import { ServerClient } from 'postmark';

// Initialize Postmark client
const client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');

export interface EmailVerificationData {
  email: string;
  verificationCode: string;
  userName?: string;
  tournamentName?: string;
}

export interface WelcomeEmailData {
  email: string;
  userName: string;
  gamerTag: string;
  tournamentName?: string;
}

export interface PasswordResetData {
  email: string;
  resetCode: string;
  userName?: string;
}

export interface TournamentInviteData {
  email: string;
  inviterName: string;
  tournamentName: string;
  tournamentId: string;
  inviteCode: string;
}

export interface MarketingEmailData {
  email: string;
  userName: string;
  gamerTag?: string;
  campaignType: 'welcome' | 'tournament_announcement' | 'weekly_digest' | 'feature_highlight' | 'promotional';
  subject: string;
  content: {
    title: string;
    subtitle?: string;
    mainMessage: string;
    ctaText: string;
    ctaUrl: string;
    features?: string[];
    tournamentInfo?: {
      name: string;
      date: string;
      prize: string;
      participants: number;
    };
  };
}

class EmailService {
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.POSTMARK_FROM_EMAIL || 'noreply@theclosequarters.com';
    this.fromName = process.env.POSTMARK_FROM_NAME || 'CQG Platform';
  }

  /**
   * Send email verification code
   */
  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    try {
      const template = this.getVerificationEmailTemplate(data);
      
      const response = await client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: data.email,
        Subject: 'Verify Your CQG Platform Account',
        HtmlBody: template.html,
        TextBody: template.text,
        Tag: 'email-verification',
        TrackOpens: true,
        TrackLinks: 'HtmlAndText'
      });

      console.log('Verification email sent:', response.MessageID);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const template = this.getWelcomeEmailTemplate(data);
      
      const response = await client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: data.email,
        Subject: 'Welcome to CQG Platform! 🎮',
        HtmlBody: template.html,
        TextBody: template.text,
        Tag: 'welcome',
        TrackOpens: true,
        TrackLinks: 'HtmlAndText'
      });

      console.log('Welcome email sent:', response.MessageID);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    try {
      const template = this.getPasswordResetEmailTemplate(data);
      
      const response = await client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: data.email,
        Subject: 'Reset Your CQG Platform Password',
        HtmlBody: template.html,
        TextBody: template.text,
        Tag: 'password-reset',
        TrackOpens: true,
        TrackLinks: 'HtmlAndText'
      });

      console.log('Password reset email sent:', response.MessageID);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send tournament invitation email
   */
  async sendTournamentInviteEmail(data: TournamentInviteData): Promise<boolean> {
    try {
      const template = this.getTournamentInviteEmailTemplate(data);
      
      const response = await client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: data.email,
        Subject: `You're Invited to ${data.tournamentName} on CQG Platform!`,
        HtmlBody: template.html,
        TextBody: template.text,
        Tag: 'tournament-invite',
        TrackOpens: true,
        TrackLinks: 'HtmlAndText'
      });

      console.log('Tournament invite email sent:', response.MessageID);
      return true;
    } catch (error) {
      console.error('Failed to send tournament invite email:', error);
      return false;
    }
  }

  /**
   * Send marketing email
   */
  async sendMarketingEmail(data: MarketingEmailData): Promise<boolean> {
    try {
      const template = this.getMarketingEmailTemplate(data);
      
      const response = await client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: data.email,
        Subject: data.subject,
        HtmlBody: template.html,
        TextBody: template.text,
        Tag: `marketing-${data.campaignType}`,
        TrackOpens: true,
        TrackLinks: 'HtmlAndText'
      });

      console.log('Marketing email sent:', response.MessageID);
      return true;
    } catch (error) {
      console.error('Failed to send marketing email:', error);
      return false;
    }
  }

  /**
   * Get verification email template
   */
  private getVerificationEmailTemplate(data: EmailVerificationData) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/verify-email?code=${data.verificationCode}&email=${encodeURIComponent(data.email)}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your CQG Platform Account</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #171717;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px 24px;
        }
        .verification-code {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .verification-code .code {
            font-size: 32px;
            font-weight: 700;
            color: #0284c7;
            letter-spacing: 4px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.2s ease;
        }
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 CQG Platform</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Welcome to CQG Platform! To complete your account setup, please verify your email address.</p>
            
            <div class="verification-code">
                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">Your verification code:</p>
                <div class="code">${data.verificationCode}</div>
            </div>
            
            <p>Or click the button below to verify automatically:</p>
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <div class="security-note">
                <strong>Security Note:</strong> This verification code will expire in 24 hours. If you didn't create an account with CQG Platform, please ignore this email.
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:support@theclosequarters.com" style="color: #0284c7; text-decoration: none;">support@theclosequarters.com</a>.</p>
            <p>Best regards,<br>The CQG Platform Team</p>
        </div>
        <div class="footer">
            <p>© 2024 CQG Platform. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
CQG Platform - Email Verification

Welcome to CQG Platform!

To complete your account setup, please verify your email address.

Your verification code: ${data.verificationCode}

Or visit this link to verify automatically:
${verificationUrl}

This verification code will expire in 24 hours.

If you didn't create an account with CQG Platform, please ignore this email.

Best regards,
The CQG Platform Team

© 2024 CQG Platform. All rights reserved.
This email was sent to ${data.email}
`;

    return { html, text };
  }

  /**
   * Get welcome email template
   */
  private getWelcomeEmailTemplate(data: WelcomeEmailData) {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/dashboard`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CQG Platform!</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #171717;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px 24px;
        }
        .welcome-badge {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .gamer-tag {
            font-size: 24px;
            font-weight: 700;
            color: #16a34a;
            margin: 8px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.2s ease;
        }
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
        .features {
            background: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .feature {
            display: flex;
            align-items: center;
            margin: 12px 0;
        }
        .feature-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            color: #22c55e;
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to CQG Platform!</h1>
        </div>
        <div class="content">
            <h2>Account Verified Successfully!</h2>
            <p>Hi ${data.userName},</p>
            <p>Your email has been verified and your CQG Platform account is now active!</p>
            
            <div class="welcome-badge">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Your gamer tag:</p>
                <div class="gamer-tag">${data.gamerTag}</div>
            </div>
            
            ${data.tournamentName ? `<p><strong>Tournament:</strong> ${data.tournamentName}</p>` : ''}
            
            <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <div class="features">
                <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
                <div class="feature">
                    <span class="feature-icon">🏆</span>
                    <span>Join tournaments and compete with other players</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">📊</span>
                    <span>Track your performance and climb the leaderboards</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🎮</span>
                    <span>Connect with the gaming community</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🔔</span>
                    <span>Get notified about upcoming matches and events</span>
                </div>
            </div>
            
            <p>If you have any questions, our support team is here to help! Contact us at <a href="mailto:support@theclosequarters.com" style="color: #16a34a; text-decoration: none;">support@theclosequarters.com</a>.</p>
            <p>Best regards,<br>The CQG Platform Team</p>
        </div>
        <div class="footer">
            <p>© 2024 CQG Platform. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
CQG Platform - Welcome!

Hi ${data.userName},

Your email has been verified and your CQG Platform account is now active!

Your gamer tag: ${data.gamerTag}
${data.tournamentName ? `Tournament: ${data.tournamentName}` : ''}

Go to your dashboard: ${dashboardUrl}

What's Next?
🏆 Join tournaments and compete with other players
📊 Track your performance and climb the leaderboards
🎮 Connect with the gaming community
🔔 Get notified about upcoming matches and events

If you have any questions, our support team is here to help! Contact us at support@theclosequarters.com

Best regards,
The CQG Platform Team

© 2024 CQG Platform. All rights reserved.
This email was sent to ${data.email}
`;

    return { html, text };
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetEmailTemplate(data: PasswordResetData) {
    const resetUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/reset-password?code=${data.resetCode}&email=${encodeURIComponent(data.email)}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your CQG Platform Password</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #171717;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px 24px;
        }
        .reset-code {
            background: #fffbeb;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .reset-code .code {
            font-size: 32px;
            font-weight: 700;
            color: #d97706;
            letter-spacing: 4px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.2s ease;
        }
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .security-note {
            background: #fef2f2;
            border: 1px solid #ef4444;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            color: #dc2626;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 CQG Platform</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>We received a request to reset your CQG Platform password.</p>
            
            <div class="reset-code">
                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">Your reset code:</p>
                <div class="code">${data.resetCode}</div>
            </div>
            
            <p>Or click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="security-note">
                <strong>Security Note:</strong> This reset code will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:support@theclosequarters.com" style="color: #d97706; text-decoration: none;">support@theclosequarters.com</a>.</p>
            <p>Best regards,<br>The CQG Platform Team</p>
        </div>
        <div class="footer">
            <p>© 2024 CQG Platform. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
CQG Platform - Password Reset

Hi ${data.userName || 'there'},

We received a request to reset your CQG Platform password.

Your reset code: ${data.resetCode}

Or visit this link to reset your password:
${resetUrl}

This reset code will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

If you have any questions, contact our support team at support@theclosequarters.com

Best regards,
The CQG Platform Team

© 2024 CQG Platform. All rights reserved.
This email was sent to ${data.email}
`;

    return { html, text };
  }

  /**
   * Get tournament invite email template
   */
  private getTournamentInviteEmailTemplate(data: TournamentInviteData) {
    const inviteUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/join-tournament?code=${data.inviteCode}&tournament=${data.tournamentId}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Invitation - CQG Platform</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #171717;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #d946ef 0%, #a855f7 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px 24px;
        }
        .tournament-card {
            background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
            border: 2px solid #d946ef;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .tournament-name {
            font-size: 24px;
            font-weight: 700;
            color: #a855f7;
            margin: 8px 0;
        }
        .invite-code {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
            font-size: 16px;
            color: #475569;
            margin: 16px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #d946ef 0%, #a855f7 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.2s ease;
        }
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(217, 70, 239, 0.3);
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 Tournament Invitation</h1>
        </div>
        <div class="content">
            <h2>You're Invited to a Tournament!</h2>
            <p>Hi there,</p>
            <p><strong>${data.inviterName}</strong> has invited you to join a tournament on CQG Platform!</p>
            
            <div class="tournament-card">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Tournament:</p>
                <div class="tournament-name">${data.tournamentName}</div>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">Invite Code:</p>
                <div class="invite-code">${data.inviteCode}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Join Tournament</a>
            </div>
            
            <p>Don't have an account yet? No problem! You can create one when you join the tournament.</p>
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:support@theclosequarters.com" style="color: #a855f7; text-decoration: none;">support@theclosequarters.com</a>.</p>
            <p>Best regards,<br>The CQG Platform Team</p>
        </div>
        <div class="footer">
            <p>© 2024 CQG Platform. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
CQG Platform - Tournament Invitation

Hi there,

${data.inviterName} has invited you to join a tournament on CQG Platform!

Tournament: ${data.tournamentName}
Invite Code: ${data.inviteCode}

Join the tournament: ${inviteUrl}

Don't have an account yet? No problem! You can create one when you join the tournament.

If you have any questions, feel free to reach out to our support team at support@theclosequarters.com

Best regards,
The CQG Platform Team

© 2024 CQG Platform. All rights reserved.
This email was sent to ${data.email}
`;

    return { html, text };
  }

  /**
   * Get marketing email template
   */
  private getMarketingEmailTemplate(data: MarketingEmailData) {
    const campaignColors = {
      welcome: { primary: '#22c55e', secondary: '#16a34a', gradient: 'from-green-600 to-emerald-600' },
      tournament_announcement: { primary: '#d946ef', secondary: '#a855f7', gradient: 'from-purple-600 to-pink-600' },
      weekly_digest: { primary: '#0ea5e9', secondary: '#0284c7', gradient: 'from-blue-600 to-cyan-600' },
      feature_highlight: { primary: '#f59e0b', secondary: '#d97706', gradient: 'from-amber-600 to-orange-600' },
      promotional: { primary: '#ef4444', secondary: '#dc2626', gradient: 'from-red-600 to-rose-600' }
    };

    const colors = campaignColors[data.campaignType];
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.subject}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #171717;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 32px 24px;
        }
        .hero-section {
            text-align: center;
            margin-bottom: 32px;
        }
        .hero-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .hero-subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 24px;
        }
        .main-message {
            background: #f8fafc;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            color: #374151;
            line-height: 1.7;
        }
        .features {
            background: #f0f9ff;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .feature {
            display: flex;
            align-items: center;
            margin: 12px 0;
        }
        .feature-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            color: ${colors.primary};
        }
        .tournament-card {
            background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
            border: 2px solid #d946ef;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .tournament-name {
            font-size: 20px;
            font-weight: 700;
            color: #a855f7;
            margin: 8px 0;
        }
        .tournament-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 16px;
            margin: 16px 0;
        }
        .tournament-detail {
            text-align: center;
        }
        .tournament-detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .tournament-detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-top: 4px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: all 0.2s ease;
            text-align: center;
        }
        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(${colors.primary.replace('#', '')}, 0.3);
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .social-links {
            margin: 16px 0;
        }
        .social-link {
            display: inline-block;
            margin: 0 8px;
            color: #6b7280;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 CQG Platform</h1>
        </div>
        <div class="content">
            <div class="hero-section">
                <h2 class="hero-title">${data.content.title}</h2>
                ${data.content.subtitle ? `<p class="hero-subtitle">${data.content.subtitle}</p>` : ''}
            </div>
            
            <div class="main-message">
                ${data.content.mainMessage}
            </div>
            
            ${data.content.features && data.content.features.length > 0 ? `
            <div class="features">
                <h3 style="margin-top: 0; color: #1f2937;">What's New:</h3>
                ${data.content.features.map(feature => `
                <div class="feature">
                    <span class="feature-icon">✨</span>
                    <span>${feature}</span>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${data.content.tournamentInfo ? `
            <div class="tournament-card">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Upcoming Tournament:</p>
                <div class="tournament-name">${data.content.tournamentInfo.name}</div>
                <div class="tournament-details">
                    <div class="tournament-detail">
                        <div class="tournament-detail-label">Date</div>
                        <div class="tournament-detail-value">${data.content.tournamentInfo.date}</div>
                    </div>
                    <div class="tournament-detail">
                        <div class="tournament-detail-label">Prize Pool</div>
                        <div class="tournament-detail-value">${data.content.tournamentInfo.prize}</div>
                    </div>
                    <div class="tournament-detail">
                        <div class="tournament-detail-label">Participants</div>
                        <div class="tournament-detail-value">${data.content.tournamentInfo.participants}</div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="${data.content.ctaUrl}" class="button">${data.content.ctaText}</a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:support@theclosequarters.com" style="color: ${colors.primary}; text-decoration: none;">support@theclosequarters.com</a>.</p>
            <p>Best regards,<br>The CQG Platform Team</p>
        </div>
        <div class="footer">
            <p>© 2024 CQG Platform. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
            <div class="social-links">
                <a href="#" class="social-link">Unsubscribe</a>
                <a href="#" class="social-link">Update Preferences</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = `
CQG Platform - ${data.subject}

Hi ${data.userName},

${data.content.title}
${data.content.subtitle ? `\n${data.content.subtitle}` : ''}

${data.content.mainMessage}

${data.content.features && data.content.features.length > 0 ? `
What's New:
${data.content.features.map(feature => `✨ ${feature}`).join('\n')}
` : ''}

${data.content.tournamentInfo ? `
Upcoming Tournament: ${data.content.tournamentInfo.name}
Date: ${data.content.tournamentInfo.date}
Prize Pool: ${data.content.tournamentInfo.prize}
Participants: ${data.content.tournamentInfo.participants}
` : ''}

${data.content.ctaText}: ${data.content.ctaUrl}

If you have any questions, contact our support team at support@theclosequarters.com

Best regards,
The CQG Platform Team

© 2024 CQG Platform. All rights reserved.
This email was sent to ${data.email}

Unsubscribe | Update Preferences
`;

    return { html, text };
  }
}

export const emailService = new EmailService();
