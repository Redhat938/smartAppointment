# Service Booking Platform

## Overview

This is a full-stack service booking platform built with React, Express, and PostgreSQL. The application allows users to discover and book appointments with various service providers across different categories like healthcare, legal, education, business consulting, wellness, and technology. Service providers can create profiles, manage their availability, and handle bookings, while clients can search for providers, view profiles, and schedule appointments.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Custom component library built on Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with structured error handling

### Database Architecture
- **Database**: PostgreSQL 16 
- **ORM**: Drizzle ORM with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon serverless connection pooling

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **User Management**: Automatic user creation and profile management
- **Role-based Access**: Support for 'user' and 'provider' roles

### User Management
- **User Profiles**: Basic user information with profile images
- **Provider Profiles**: Extended profiles for service providers including business details, specialties, and availability
- **Role Switching**: Users can upgrade to provider status

### Booking System
- **Appointment Scheduling**: Date and time-based booking system
- **Availability Management**: Provider-controlled availability slots
- **Appointment Types**: Support for video calls and in-person meetings
- **Status Tracking**: Comprehensive appointment status management (pending, confirmed, cancelled, completed, no_show)

### Search and Discovery
- **Category-based Search**: Organized by service categories
- **Location Filtering**: Geographic search capabilities
- **Rating System**: Provider ratings and reviews
- **Featured Providers**: Highlighted provider profiles

## Data Flow

1. **User Registration/Login**: Users authenticate via Replit Auth, user records are created/updated in PostgreSQL
2. **Provider Onboarding**: Users can upgrade to provider status and complete detailed profile setup
3. **Service Discovery**: Users search and filter providers based on categories, location, ratings, and availability
4. **Booking Process**: Users select providers, view availability, and book appointments
5. **Appointment Management**: Both users and providers can view, manage, and update appointment statuses
6. **Review System**: Users can leave reviews after completed appointments

## External Dependencies

### Core Dependencies
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication and user management service
- **Radix UI**: Unstyled, accessible UI component primitives
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database toolkit

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express
- **express-session**: Session middleware for Express

## Deployment Strategy

### Development Environment
- **Runtime**: Replit with Node.js 20 and PostgreSQL 16 modules
- **Development Server**: Vite dev server with HMR (Hot Module Replacement)
- **Database**: Neon serverless PostgreSQL instance
- **Port Configuration**: Application runs on port 5000 with external port 80

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit infrastructure
- **Static Assets**: Served by Express with Vite-generated assets

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable for Neon connection
- **Sessions**: Requires `SESSION_SECRET` for session encryption
- **Auth**: Requires `REPL_ID` and `ISSUER_URL` for Replit Auth integration

## Changelog

```
Changelog:
- June 26, 2025: Initial setup of BookEase platform with React frontend and Express backend
- June 26, 2025: Added comprehensive test data including 10 sample providers across all categories
- June 26, 2025: Fixed SelectItem error in search filters and verified search functionality working
- June 26, 2025: Updated sample providers to be verified/active, enabling featured providers display
- June 26, 2025: Enhanced booking system with configurable booking types (token, timeslot, service, teleconsult)
- June 26, 2025: Added provider booking settings with daily capacity, slot duration, buffer time, and auto-ETA
- June 26, 2025: Implemented booking settings UI in provider dashboard with validation and API endpoints
- June 26, 2025: Localized platform for Indian market with Indian cities, names, currency (₹), and phone numbers
- June 26, 2025: Fixed appointment booking calendar with proper date/time formatting and 30-minute slots
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```