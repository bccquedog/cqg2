# CQG Platform - Competitive Gaming Tournament Platform

[![Deployment Status](https://img.shields.io/badge/status-ready_for_production-green.svg)](https://github.com/natenasty21/cqg-platform)
[![Node.js Version](https://img.shields.io/badge/node-20.x-blue.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black.svg)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.2.1-orange.svg)](https://firebase.google.com/)

The **CQG Platform** is a comprehensive competitive gaming tournament and league management system built with modern web technologies. It provides everything needed to run, manage, and participate in gaming tournaments and leagues with real-time updates, automated scoring, and professional tournament features.

## 🎯 Overview

CQG Platform is designed for gaming communities, esports organizations, and tournament organizers who need a robust, scalable solution for managing competitive gaming events. The platform supports both tournaments (single/multi-day events) and leagues (season-based competitions) with advanced features like automated bracket generation, real-time scoring, streaming integration, and comprehensive analytics.

### Key Features

- 🏆 **Tournament Management**: Single/double elimination brackets, automated seeding, real-time updates
- 🏅 **League Systems**: Season-based competitions with standings and playoffs
- 👥 **Player Management**: User profiles, gamer tags, tier systems, statistics tracking
- 📊 **Leaderboards**: Global and competition-specific rankings with detailed statistics
- 🎮 **Multi-Game Support**: Call of Duty, FIFA, NBA 2K, Rocket League, and more
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🔐 **Authentication**: Firebase Auth with role-based access control
- 📺 **Streaming Integration**: OBS WebSocket support for live tournament overlays
- 💳 **Payment Integration**: Stripe integration for tournament buy-ins
- 🔔 **Notification System**: Automated reminders and alerts
- 📈 **Analytics**: Comprehensive reporting and performance tracking

## 🛠 Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.9.2** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & Database
- **Firebase 12.2.1** - Backend-as-a-Service
  - **Firestore** - NoSQL database
  - **Firebase Auth** - Authentication
  - **Cloud Functions** - Serverless functions
  - **Firebase Storage** - File storage
- **Firebase Admin SDK** - Server-side Firebase operations

### Additional Services
- **Stripe** - Payment processing
- **Vercel** - Deployment and hosting
- **Playwright** - End-to-end testing
- **Discord Webhooks** - Deployment notifications

## 📁 Project Structure

```
cqg-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── competitions/      # Competition pages
│   │   ├── tournaments/       # Tournament-specific pages
│   │   ├── players/           # Player directory
│   │   ├── leaderboards/      # Global leaderboards
│   │   └── test-competition/  # Testing utilities
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── BracketViewer.tsx # Tournament bracket display
│   │   ├── LeaderboardViewer.tsx
│   │   └── ScheduleViewer.tsx
│   ├── contexts/             # React contexts (Auth, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── firebase.ts       # Firebase configuration
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript type definitions
├── functions/                # Firebase Cloud Functions
│   ├── src/                 # Function source code
│   ├── scripts/             # Utility scripts
│   └── package.json         # Function dependencies
├── tests/                   # Playwright E2E tests
├── scripts/                 # Development and seeding scripts
└── docs/                    # Documentation files
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 20.x** or higher
- **npm** or **pnpm** package manager
- **Firebase CLI** for deployment
- **Firebase project** with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/natenasty21/cqg-platform.git
   cd cqg-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit with your Firebase credentials
   nano .env.local
   ```

   Required environment variables:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   
   # Optional: Discord webhook for notifications
   ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking

# Testing
npm run test:e2e         # Run Playwright E2E tests
npm run test:smoke       # Run smoke tests
npm run test:harness     # Run master test harness

# Database & Seeding
npm run seed             # Seed test data
npm run reset            # Reset database
npm run emulator:dev     # Start Firestore emulator with dev rules

# Firebase
npm run deploy:firebase  # Deploy to Firebase
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:full      # Full deployment with security checks

# Rules Management
npm run rules:dev        # Switch to development rules
npm run rules:prod       # Switch to production rules
```

### Firebase Emulator Setup

For local development, use the Firebase emulator:

```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# In another terminal, start the app with emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 npm run dev
```

### Seeding Test Data

The platform includes comprehensive seeding scripts for testing:

```bash
# Seed basic test data
npm run seed

# Seed with specific tournament types
npm run seed:gamer       # Seed with gamer tags
npm run seed:admin       # Seed admin tournaments

# Run complete test harness
npm run test:harness     # Full tournament simulation
```

## 🏗 Architecture

### Frontend Architecture

The application uses **Next.js 15** with the App Router, providing:

- **Server-Side Rendering (SSR)** for improved SEO and performance
- **Client-Side Navigation** with React Server Components
- **API Routes** for backend functionality
- **Middleware** for authentication and routing

### Database Design

**Firestore Collections:**

- `players` - User profiles and statistics
- `tournaments` - Tournament data and configurations
- `leagues` - League data and standings
- `matches` - Individual match results
- `events` - Tournament events and schedules
- `reports` - Tournament/league completion reports

### Authentication & Authorization

- **Firebase Authentication** with email/password and Google OAuth
- **Role-based access control** with custom claims
- **Tier system** for premium features (Gamer, Mamba, King, Elite)
- **Admin privileges** for tournament management

### Real-time Features

- **Firestore real-time listeners** for live updates
- **Presence system** for online user tracking
- **Live tournament overlays** with OBS integration
- **Automated notifications** via Cloud Functions

## 🎮 Core Features

### Tournament Management

- **Bracket Generation**: Automated single/double elimination brackets
- **Seeding**: Random or skill-based player seeding
- **Match Management**: Score submission, dispute handling, verification
- **Live Updates**: Real-time bracket updates and notifications
- **Streaming Integration**: OBS WebSocket support for live overlays

### League Systems

- **Season Management**: Multi-week competitions with standings
- **Team Registration**: Solo and clan-based leagues
- **Schedule Management**: Automated match scheduling
- **Playoffs**: Automatic playoff bracket generation

### Player Features

- **Profile Management**: Gamer tags, avatars, statistics
- **Tier System**: Progressive unlock system for features
- **Statistics Tracking**: Win/loss records, tournament history
- **Achievement System**: Badges and accomplishments

### Admin Dashboard

- **Tournament Creation**: Full tournament setup and management
- **User Management**: Player administration and moderation
- **Analytics**: Performance metrics and reporting
- **Content Management**: Game configurations and settings

## 🚀 Deployment

### Vercel Deployment (Recommended)

The platform is optimized for deployment on Vercel:

1. **Connect Repository**
   - Import the GitHub repository to Vercel
   - Configure build settings (auto-detected for Next.js)

2. **Environment Variables**
   - Add all Firebase credentials to Vercel
   - Configure Discord webhook for notifications

3. **Deploy**
   ```bash
   npm run deploy:vercel
   ```

### Firebase Deployment

For full-stack deployment including Cloud Functions:

```bash
# Deploy everything
npm run deploy:full

# Deploy specific services
npm run deploy:firebase  # Functions, Firestore, Storage
npm run deploy:rules:prod # Security rules
```

### Environment Configuration

**Development:**
- Uses Firebase emulator
- Open security rules for testing
- Local environment variables

**Production:**
- Secure Firebase rules with authentication
- Environment variables in deployment platform
- CDN optimization via Vercel

## 🧪 Testing

### End-to-End Testing

The platform includes comprehensive E2E tests using Playwright:

```bash
# Run all tests
npm run test:e2e

# Run specific test suites
npm run test:smoke       # Critical path tests
npm run test:e2e:headed  # Run with browser UI
```

### Test Harness

The master test harness simulates complete tournament flows:

```bash
# Run complete tournament simulation
npm run test:harness

# Keep data for debugging
npm run test:harness:keep
```

## 📊 Monitoring & Analytics

### Built-in Analytics

- **Tournament Performance**: Completion rates, participant engagement
- **Player Statistics**: Win/loss ratios, tier progression
- **System Health**: Error tracking, performance metrics

### Alert System

- **Discord Integration**: Deployment notifications
- **Build Status**: Success/failure alerts
- **Error Monitoring**: Automated error reporting

## 🔐 Security

### Firebase Security Rules

The platform implements comprehensive security rules:

- **Production Rules**: Strict authentication requirements
- **Development Rules**: Open access for testing
- **Role-based Access**: Admin and user permission levels

### Data Protection

- **Input Validation**: Zod schema validation
- **Authentication**: Firebase Auth with custom claims
- **Authorization**: Role-based access control
- **Data Sanitization**: XSS and injection protection

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
3. **Make changes with tests**
4. **Run the test suite**
5. **Submit a pull request**

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (if configured)
- **Testing**: E2E tests for new features

## 📚 Documentation

Additional documentation is available in the `docs/` directory:

- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `FIREBASE_RULES.md` - Security rules documentation
- `DESIGN_SYSTEM.md` - UI/UX guidelines
- `ALERT_SYSTEM.md` - Notification system setup

## 🆘 Support

### Common Issues

**Build Errors:**
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Firebase Connection Issues:**
- Verify environment variables
- Check Firebase project configuration
- Ensure Firestore is enabled

**Authentication Problems:**
- Verify Firebase Auth configuration
- Check custom claims setup
- Review security rules

### Getting Help

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Documentation**: Check the `docs/` directory for detailed guides
- **Community**: Join our Discord for support and discussions

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- **Firebase** for backend infrastructure
- **Vercel** for deployment platform
- **Next.js** team for the excellent framework
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

---

**Built with ❤️ for the gaming community**

For more information, visit our [deployment guide](DEPLOYMENT_GUIDE.md) or [setup instructions](VERCEL_SETUP_GUIDE.md).