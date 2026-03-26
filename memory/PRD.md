# Fiscal & Innovation Assessment Platform - PRD

## Original Problem Statement
Build a production-ready web-based user analysis and segmentation platform as a Progressive Web App (PWA) with:
- Assessment form with 10+ questions related to fiscal studies, innovation, and accounting
- Scoring system with 5 levels (Level 1: 10-14, Level 2: 15-18, Level 3: 19-22, Level 4: 23-26, Level 5: 27-30)
- Result pages with VSL video and Calendly scheduler (levels 3-5 only)
- Admin dashboard with user management, filtering, search, and CSV export
- Mock integrations for ActiveCampaign, WhatsApp, and Calendly

## User Personas
1. **Assessment Taker** - Business professionals evaluating their organization's capabilities
2. **Admin User** - Staff managing and analyzing assessment submissions

## Core Requirements (Static)
- PWA with manifest.json and service worker
- Mobile-first responsive design
- 10 multiple choice questions with 3 options each (1-3 points)
- Level assignment based on total score
- JWT-based admin authentication
- User data persistence in MongoDB

## What's Been Implemented

### January 26, 2026 - Initial MVP
- Assessment flow with 10 questions (fiscal/innovation/accounting)
- Typeform-style UX with progress bar
- Scoring system with 5 levels
- Result pages with VSL video embed
- Calendly placeholder for levels 3-5
- Admin dashboard with JWT auth
- User table with filters/search
- CSV export functionality
- PWA configuration (manifest.json, service worker)
- Mock integrations (ActiveCampaign, WhatsApp, Calendly)

### January 26, 2026 - Email Capture for Abandoned Assessments
- ✅ User info captured BEFORE questions start (name, email, phone)
- ✅ Users saved with "abandoned" status initially
- ✅ Status changes to "completed" upon assessment submission
- ✅ Admin dashboard shows Status column with color-coded badges
- ✅ Admin can filter by status (All/Completed/Abandoned)
- ✅ Stats display shows completed/abandoned counts separately
- ✅ User detail page shows status and handles "No Responses" for abandoned
- ✅ CSV export includes status column

### Database Schema (MongoDB)
- `users`: id, name, email, phone, score (nullable), level (nullable), status ("abandoned"/"completed"), created_at
- `responses`: id, user_id, question, answer, score
- `admins`: id, email, password (hashed), name, created_at

## Prioritized Backlog

### P0 - Critical (Complete)
- [x] Assessment flow end-to-end
- [x] Scoring system and level assignment
- [x] Admin authentication
- [x] User management
- [x] Email capture for lead recovery

### P1 - High Priority (Next)
- [ ] Real ActiveCampaign integration
- [ ] Real WhatsApp API integration
- [ ] Real Calendly embed integration
- [ ] Email notifications for completed assessments

### P2 - Medium Priority
- [ ] Automated follow-up emails for abandoned assessments
- [ ] Assessment analytics dashboard
- [ ] A/B testing for questions
- [ ] Multi-language support

### P3 - Nice to Have
- [ ] PDF export of results
- [ ] Team/organization assessments
- [ ] Historical comparison reports

## Next Tasks
1. Integrate real ActiveCampaign API when key provided
2. Integrate WhatsApp Business API for admin notifications
3. Add real Calendly embed URL
4. Set up automated abandoned cart email sequence
5. Add assessment retake tracking
