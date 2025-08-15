# CrawlGuard LLC - Professional Waterproofing Services

## Overview

CrawlGuard LLC is a professional waterproofing and crawl space solutions business serving Asheville, NC and surrounding areas. This is a full-stack web application built to showcase their services, handle customer inquiries, and provide a professional online presence. The application features a modern React frontend with a Node.js/Express backend, designed to generate leads and provide information about waterproofing services including crawl space encapsulation, basement waterproofing, and mold remediation.

## Recent Updates

- **August 15, 2025**: Integrated comprehensive appointment booking system with lead management
  - Created centralized AppointmentBooking component replacing inline scheduling
  - Added lead dropdown selection that auto-fills client information for existing leads
  - Integrated appointment booking with calendar views (monthly, weekly, daily)
  - Supports scheduling new appointments for both existing leads and new clients
  - Fixed time blocks display in all calendar views with color-coded styling
  - Resolved working hours validation and database constraint issues
  - Enhanced calendar functionality with time blocking and availability management

- **January 15, 2025**: Replaced all stock photography with authentic CrawlGuard project photos
  - Added 10 professional project photos showcasing actual waterproofing work
  - Updated hero sections across Home, About, and Gallery pages
  - Enhanced gallery with real before/after photos and detailed project descriptions
  - All images now reflect authentic CrawlGuard work including crawl space encapsulation, vapor barriers, sump pumps, French drains, and dehumidification systems
  - Updated hero section styling with black background, white/turquoise text, and red CTA button
  - Removed years of experience references throughout site to reflect newer company status
  - Replaced "Years Experience" stat with "Customer Satisfaction" metric

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **SEO**: React Helmet Async for meta tags and structured data
- **Design System**: Custom CrawlGuard brand colors and typography with responsive design

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Development**: TSX for TypeScript execution in development
- **API Design**: RESTful API endpoints for contact form submission and admin functionality
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Request Logging**: Custom middleware for API request/response logging

### Data Storage Solutions
- **Development Storage**: In-memory storage implementation for development and testing
- **Production Ready**: Drizzle ORM configured for PostgreSQL with Neon Database serverless driver
- **Database Schema**: User management and contact submission tables with proper relationships
- **Migrations**: Drizzle Kit for database schema management and migrations

### External Dependencies
- **Database**: Neon Database (PostgreSQL) for production data persistence
- **UI Components**: Extensive use of Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and responsive utilities
- **Form Validation**: Zod for runtime type checking and validation
- **Image Assets**: Static assets served from attached_assets directory
- **Development Tools**: Replit-specific plugins for runtime error handling and development banner

The architecture follows a monorepo structure with shared TypeScript definitions, separation of concerns between client and server code, and a scalable foundation for a local service business website with lead generation capabilities.