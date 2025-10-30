# 📧 CQG Platform Marketing Email System

A comprehensive marketing email system built with Postmark, featuring professional templates, campaign management, and targeted audience segmentation.

## 🚀 Features

### Core Functionality
- **Campaign Management**: Create and send targeted marketing campaigns
- **Audience Segmentation**: Send to all users or specific tournament participants
- **Professional Templates**: 5 campaign types with unique branding
- **Rich Content**: Features, tournament info, CTAs, and more
- **Analytics Integration**: Track opens, clicks, and engagement
- **Support Integration**: All emails include support@theclosequarters.com

### Campaign Types
1. **Welcome Campaign** - Onboard new users (Green theme)
2. **Tournament Announcement** - Promote tournaments (Purple theme)
3. **Weekly Digest** - Weekly updates (Blue theme)
4. **Feature Highlight** - Showcase new features (Amber theme)
5. **Promotional** - Special offers (Red theme)

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

#### Send Marketing Campaign
```typescript
POST /api/marketing/send-campaign
{
  "campaignType": "welcome" | "tournament_announcement" | "weekly_digest" | "feature_highlight" | "promotional",
  "subject": "Email Subject",
  "content": {
    "title": "Email Title",
    "subtitle": "Optional Subtitle",
    "mainMessage": "Main message content",
    "ctaText": "Call to Action Text",
    "ctaUrl": "https://example.com",
    "features": ["Feature 1", "Feature 2"],
    "tournamentInfo": {
      "name": "Tournament Name",
      "date": "March 15, 2024",
      "prize": "$5,000",
      "participants": 128
    }
  },
  "targetAudience": "all" | "tournament",
  "tournamentId": "tournament-id" // Required if targetAudience is "tournament"
}
```

#### Send Single Marketing Email
```typescript
POST /api/marketing/send-single
{
  "email": "user@example.com",
  "userName": "User Name",
  "gamerTag": "GamerTag",
  "campaignType": "welcome",
  "subject": "Email Subject",
  "content": {
    "title": "Email Title",
    "subtitle": "Optional Subtitle",
    "mainMessage": "Main message content",
    "ctaText": "Call to Action Text",
    "ctaUrl": "https://example.com",
    "features": ["Feature 1", "Feature 2"]
  }
}
```

## 🎨 Email Templates

### Template Design System
- **Responsive Design**: Works across all email clients
- **CQG Branding**: Consistent with platform design system
- **Color-Coded Campaigns**: Each campaign type has unique colors
- **Professional Typography**: Inter font family with proper hierarchy
- **Mobile Optimized**: Perfect display on all devices

### Campaign Color Schemes
- **Welcome**: Green gradient (#22c55e → #16a34a)
- **Tournament**: Purple gradient (#d946ef → #a855f7)
- **Weekly Digest**: Blue gradient (#0ea5e9 → #0284c7)
- **Feature Highlight**: Amber gradient (#f59e0b → #d97706)
- **Promotional**: Red gradient (#ef4444 → #dc2626)

### Template Features
- **Hero Section**: Title and subtitle with campaign-specific styling
- **Main Message**: Highlighted content area with proper spacing
- **Features List**: Bulleted list with icons for feature highlights
- **Tournament Card**: Special card for tournament information
- **CTA Button**: Prominent call-to-action with hover effects
- **Footer**: Support contact and unsubscribe links

## 🔧 Integration Guide

### 1. Marketing Email Manager Component
```typescript
import MarketingEmailManager from '@/components/MarketingEmailManager';

<MarketingEmailManager className="custom-styles" />
```

### 2. API Integration
```typescript
// Send campaign to all users
const response = await fetch('/api/marketing/send-campaign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignType: 'welcome',
    subject: 'Welcome to CQG Platform!',
    content: {
      title: 'Welcome to CQG Platform!',
      mainMessage: 'We\'re excited to have you join our community!',
      ctaText: 'Get Started',
      ctaUrl: 'https://cqgplatform.com/dashboard'
    },
    targetAudience: 'all'
  })
});
```

### 3. Single Email Sending
```typescript
// Send single marketing email
const response = await fetch('/api/marketing/send-single', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    userName: 'User Name',
    campaignType: 'tournament_announcement',
    subject: 'New Tournament Available!',
    content: {
      title: 'Championship Tournament',
      mainMessage: 'Join our biggest tournament of the year!',
      ctaText: 'Join Tournament',
      ctaUrl: 'https://cqgplatform.com/tournaments/championship'
    }
  })
});
```

## 📊 Campaign Management

### Target Audiences
1. **All Users**: Send to entire user base
2. **Tournament Participants**: Send to specific tournament participants

### Campaign Content Structure
```typescript
interface MarketingEmailData {
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
```

## 🎯 Usage Examples

### Welcome Campaign
```typescript
const welcomeCampaign = {
  campaignType: 'welcome',
  subject: 'Welcome to CQG Platform! 🎮',
  content: {
    title: 'Welcome to CQG Platform!',
    subtitle: 'Your gaming journey starts here',
    mainMessage: 'We\'re excited to have you join the CQG Platform community! Get ready to compete in tournaments, climb leaderboards, and connect with fellow gamers.',
    ctaText: 'Get Started',
    ctaUrl: 'https://cqgplatform.com/dashboard',
    features: [
      'Join competitive tournaments',
      'Track your performance',
      'Connect with the community',
      'Earn achievements and rewards'
    ]
  }
};
```

### Tournament Announcement
```typescript
const tournamentCampaign = {
  campaignType: 'tournament_announcement',
  subject: '🏆 Championship Tournament Now Live!',
  content: {
    title: 'Championship Tournament',
    subtitle: 'The biggest tournament of the year',
    mainMessage: 'Join our Championship Tournament with a $10,000 prize pool! Compete against the best players and prove your skills.',
    ctaText: 'Join Tournament',
    ctaUrl: 'https://cqgplatform.com/tournaments/championship',
    tournamentInfo: {
      name: 'Championship Tournament',
      date: 'March 20, 2024',
      prize: '$10,000',
      participants: 256
    }
  }
};
```

### Weekly Digest
```typescript
const weeklyDigest = {
  campaignType: 'weekly_digest',
  subject: '📊 Your Weekly CQG Update',
  content: {
    title: 'Weekly CQG Update',
    subtitle: 'Your gaming week in review',
    mainMessage: 'Here\'s what happened in the CQG community this week and what\'s coming up next.',
    ctaText: 'View Full Report',
    ctaUrl: 'https://cqgplatform.com/dashboard',
    features: [
      'Your performance this week',
      'Upcoming tournaments',
      'Community highlights',
      'New features and updates'
    ]
  }
};
```

## 🧪 Testing

### Test Page
Visit `/marketing-email-test` to test the marketing email system:

- Create and send marketing campaigns
- Test different campaign types
- Preview email templates
- Send test emails to specific addresses

### Manual Testing
1. Use the Marketing Email Manager component
2. Fill in campaign details
3. Select target audience
4. Send campaign or test email
5. Check email delivery and formatting

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

## 📈 Analytics & Monitoring

### Postmark Analytics
- **Delivery Rates**: Track email delivery success
- **Open Rates**: Monitor email engagement
- **Click Rates**: Track CTA button clicks
- **Bounce Rates**: Monitor email validity
- **Campaign Performance**: Compare different campaign types

### Custom Tracking
- **Campaign Tags**: Each campaign type has unique tags
- **Audience Segmentation**: Track performance by audience type
- **Content Performance**: Monitor which content performs best
- **CTA Effectiveness**: Track which CTAs get the most clicks

## 🔒 Security & Compliance

### Data Protection
- **User Privacy**: Only send to opted-in users
- **Unsubscribe Links**: Every email includes unsubscribe option
- **Support Contact**: Clear support contact information
- **Rate Limiting**: Built-in protection against spam

### Compliance Features
- **Unsubscribe Management**: Easy unsubscribe process
- **Preference Updates**: Users can update email preferences
- **Support Contact**: Clear support contact information
- **Data Retention**: Proper data handling and retention

## 📚 Template Examples

### Welcome Email Template
```html
<!-- Professional welcome email with green theme -->
<div class="header" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
  <h1>🎮 CQG Platform</h1>
</div>
<div class="content">
  <h2>Welcome to CQG Platform!</h2>
  <p>Your gaming journey starts here</p>
  <!-- Content continues... -->
</div>
```

### Tournament Announcement Template
```html
<!-- Tournament announcement with purple theme -->
<div class="header" style="background: linear-gradient(135deg, #d946ef 0%, #a855f7 100%);">
  <h1>🎮 CQG Platform</h1>
</div>
<div class="content">
  <h2>Championship Tournament</h2>
  <p>The biggest tournament of the year</p>
  <!-- Tournament card with details -->
</div>
```

## 🤝 Contributing

When adding new marketing email features:

1. Follow the existing design patterns
2. Use the established color palette
3. Maintain responsive design principles
4. Test across multiple email clients
5. Include proper accessibility attributes
6. Add unsubscribe and support links

## 📄 License

This marketing email system is part of the CQG Platform and follows the same licensing terms.

## 📞 Support Contact

For all support inquiries and questions about the marketing email system:

**Email**: support@theclosequarters.com

All marketing email templates include this support contact information, ensuring users can easily reach out for assistance with:
- Email delivery issues
- Unsubscribe requests
- Technical support
- General inquiries
