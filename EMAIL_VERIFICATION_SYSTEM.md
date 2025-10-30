# 📧 CQG Platform Email Verification System

A comprehensive email verification system built with Postmark, featuring professional templates and seamless integration with Firebase authentication.

## 🚀 Features

### Core Functionality
- **Email Verification**: 6-digit code verification system
- **Welcome Emails**: Automatic welcome emails after verification
- **Password Reset**: Secure password reset with time-limited codes
- **Tournament Invitations**: Beautiful invitation emails for tournaments
- **Rate Limiting**: Built-in protection against spam and abuse
- **Resend Functionality**: Smart resend with cooldown periods

### Professional Email Templates
- **Responsive Design**: Works across all email clients
- **CQG Branding**: Consistent with platform design system
- **Accessibility**: WCAG AA compliant templates
- **Mobile Optimized**: Perfect display on all devices
- **Professional Typography**: Inter font family with proper hierarchy
- **Support Integration**: All emails include support@theclosequarters.com for inquiries

## 🛠️ Technical Implementation

### Dependencies
```bash
npm install postmark uuid @types/uuid
```

### Environment Variables
```bash
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your_postmark_server_token
POSTMARK_FROM_EMAIL=noreply@theclosequarters.com
POSTMARK_FROM_NAME=CQG Platform
```

### API Endpoints

#### Send Verification Email
```typescript
POST /api/auth/send-verification
{
  "email": "user@example.com",
  "userId": "firebase-user-id",
  "userName": "Player Name",
  "tournamentName": "Tournament Name" // optional
}
```

#### Verify Email
```typescript
POST /api/auth/verify-email
{
  "code": "123456",
  "email": "user@example.com",
  "userId": "firebase-user-id"
}
```

#### Resend Verification
```typescript
POST /api/auth/resend-verification
{
  "email": "user@example.com",
  "userId": "firebase-user-id"
}
```

## 🎨 Email Templates

### 1. Email Verification Template
- **Purpose**: Verify new user email addresses
- **Features**: 6-digit code, direct verification link, security notes
- **Design**: Blue gradient header, professional layout
- **Expiration**: 24 hours

### 2. Welcome Email Template
- **Purpose**: Welcome verified users to the platform
- **Features**: Gamer tag display, tournament info, feature highlights
- **Design**: Green gradient header, success messaging
- **CTA**: Dashboard link

### 3. Password Reset Template
- **Purpose**: Secure password reset functionality
- **Features**: Reset code, direct reset link, security warnings
- **Design**: Orange gradient header, warning styling
- **Expiration**: 1 hour

### 4. Tournament Invitation Template
- **Purpose**: Invite players to tournaments
- **Features**: Tournament details, invite codes, join links
- **Design**: Purple gradient header, invitation styling
- **CTA**: Join tournament button

## 🔧 Integration Guide

### 1. AuthProvider Integration
The email verification is seamlessly integrated into the existing AuthProvider:

```typescript
const { 
  emailVerified, 
  sendEmailVerification, 
  verifyEmail, 
  resendVerificationEmail 
} = useAuth();
```

### 2. UI Components

#### EmailVerificationModal
```typescript
<EmailVerificationModal
  open={isOpen}
  onClose={handleClose}
  email="user@example.com"
  userName="Player Name"
  tournamentName="Tournament Name"
/>
```

#### EmailVerificationStatus
```typescript
<EmailVerificationStatus 
  email="user@example.com"
  className="custom-styles"
/>
```

### 3. Authentication Flow
1. User signs up with email/password
2. Verification email is automatically sent
3. User enters 6-digit code or clicks verification link
4. Email is marked as verified in Firebase
5. Welcome email is sent
6. User proceeds to gamer tag setup

## 📊 Database Schema

### Email Verifications Collection
```typescript
{
  userId: string;
  email: string;
  code: string;
  createdAt: Timestamp;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  lastSent?: Timestamp;
}
```

## 🎯 Usage Examples

### Basic Email Verification
```typescript
// Send verification email
const success = await sendEmailVerification(
  "user@example.com", 
  "Player Name", 
  "Tournament Name"
);

// Verify email
const verified = await verifyEmail("123456", "user@example.com");

// Resend verification
const resent = await resendVerificationEmail("user@example.com");
```

### Integration with Sign Up
```typescript
const signUp = async (email: string, password: string) => {
  const result = await signUp(email, password);
  
  if (result.needsEmailVerification) {
    // Show email verification modal
    setEmailVerificationModalOpen(true);
  }
};
```

## 🔒 Security Features

### Rate Limiting
- **Resend Cooldown**: 60 seconds between resend attempts
- **Attempt Limits**: Maximum 5 verification attempts
- **Expiration**: 24 hours for verification codes

### Data Protection
- **Secure Storage**: Verification data stored in Firestore
- **Automatic Cleanup**: Expired verifications are removed
- **User Isolation**: Each user's verification is isolated

## 🎨 Design System Integration

### Color Palette
- **Primary Blue**: #0ea5e9 (verification emails)
- **Success Green**: #22c55e (welcome emails)
- **Warning Orange**: #f59e0b (password reset)
- **Accent Purple**: #d946ef (tournament invites)

### Typography
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont
- **Font Scale**: Modular scale from 12px to 48px
- **Line Heights**: 1.25 to 2.0 for optimal readability

### Spacing
- **Grid System**: 8px base grid for consistent spacing
- **Component Padding**: 16px, 24px, 32px standard sizes
- **Border Radius**: 6px, 8px, 12px for modern appearance

## 🧪 Testing

### Test Page
Visit `/email-verification-test` to test the email verification system:

- Send test verification emails
- Test manual code verification
- Test resend functionality
- Preview email templates

### Manual Testing
1. Sign up with a new email address
2. Check email inbox for verification email
3. Enter verification code or click verification link
4. Verify welcome email is received
5. Test resend functionality

## 🚀 Deployment

### Postmark Setup
1. Create Postmark account
2. Generate server token
3. Add environment variables
4. Test email delivery

### Environment Configuration
```bash
# Production
POSTMARK_SERVER_TOKEN=your_production_token
POSTMARK_FROM_EMAIL=noreply@theclosequarters.com
POSTMARK_FROM_NAME=CQG Platform

# Development
POSTMARK_SERVER_TOKEN=your_test_token
POSTMARK_FROM_EMAIL=noreply@theclosequarters.com
POSTMARK_FROM_NAME=CQG Platform (Test)
```

## 📈 Monitoring & Analytics

### Postmark Analytics
- **Delivery Rates**: Track email delivery success
- **Open Rates**: Monitor email engagement
- **Click Rates**: Track verification link clicks
- **Bounce Rates**: Monitor email validity

### Custom Tracking
- **Verification Attempts**: Track failed attempts
- **Resend Frequency**: Monitor resend patterns
- **Verification Success**: Track completion rates

## 🔧 Troubleshooting

### Common Issues

#### Emails Not Sending
- Check Postmark server token
- Verify environment variables
- Check Postmark account status
- Review API rate limits

#### Verification Codes Not Working
- Check code expiration (24 hours)
- Verify attempt limits (5 max)
- Ensure correct user association
- Check Firestore permissions

#### Template Rendering Issues
- Test in multiple email clients
- Check HTML/CSS compatibility
- Verify responsive design
- Test with different email providers

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_EMAIL=true
```

## 📞 Support Contact

For all support inquiries and questions about the email verification system:

**Email**: support@theclosequarters.com

All email templates include this support contact information, ensuring users can easily reach out for assistance with:
- Email verification issues
- Account setup problems
- Technical support
- General inquiries

## 📧 Marketing Email System

The CQG Platform also includes a comprehensive marketing email system for campaigns and user engagement:

- **Campaign Management**: Create and send targeted marketing campaigns
- **Audience Segmentation**: Send to all users or specific tournament participants
- **Professional Templates**: 5 campaign types with unique branding
- **Rich Content**: Features, tournament info, CTAs, and more

For detailed information about the marketing email system, see:
**[Marketing Email System Documentation](./MARKETING_EMAIL_SYSTEM.md)**

## 📚 Additional Resources

- [Postmark Documentation](https://postmarkapp.com/developer)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Email Template Best Practices](https://postmarkapp.com/guides/email-template-best-practices)
- [CQG Platform Design System](./DESIGN_SYSTEM.md)
- [Marketing Email System](./MARKETING_EMAIL_SYSTEM.md)

## 🤝 Contributing

When adding new email templates:

1. Follow the existing design patterns
2. Use the established color palette
3. Maintain responsive design principles
4. Test across multiple email clients
5. Include both HTML and text versions
6. Add proper accessibility attributes

## 📄 License

This email verification system is part of the CQG Platform and follows the same licensing terms.
