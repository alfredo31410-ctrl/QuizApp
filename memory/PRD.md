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

## What's Been Implemented (January 26, 2026)

### Backend (FastAPI)
- ✅ Assessment questions endpoint (`/api/questions`)
- ✅ Assessment submission with score calculation (`/api/assessment/submit`)
- ✅ Admin registration and login with JWT (`/api/admin/register`, `/api/admin/login`)
- ✅ User listing with level filtering and search (`/api/admin/users`)
- ✅ User detail with responses (`/api/admin/users/{user_id}`)
- ✅ CSV export functionality (`/api/admin/export`)
- ✅ Mock ActiveCampaign and WhatsApp integrations

### Frontend (React PWA)
- ✅ PWA configuration (manifest.json, service worker)
- ✅ Swiss Brutalist design with Cabinet Grotesk + IBM Plex Sans fonts
- ✅ Typeform-style assessment flow with progress bar
- ✅ User info form with validation
- ✅ Question screens with option selection animations
- ✅ 5 Result pages with level-specific content
- ✅ VSL video embed (placeholder YouTube)
- ✅ Calendly placeholder for levels 3-5
- ✅ Admin login/registration page
- ✅ Admin dashboard with stats, filtering, search
- ✅ User detail page with all responses
- ✅ CSV download functionality

### Database Schema (MongoDB)
- `users`: id, name, email, phone, score, level, created_at
- `responses`: id, user_id, question, answer, score
- `admins`: id, email, password (hashed), name, created_at

## Prioritized Backlog

### P0 - Critical (Complete)
- [x] Assessment flow end-to-end
- [x] Scoring system and level assignment
- [x] Admin authentication
- [x] User management

### P1 - High Priority (Next)
- [ ] Real ActiveCampaign integration
- [ ] Real WhatsApp API integration
- [ ] Real Calendly embed integration
- [ ] Email notifications

### P2 - Medium Priority
- [ ] Assessment analytics dashboard
- [ ] A/B testing for questions
- [ ] Multi-language support
- [ ] Custom branding options

### P3 - Nice to Have
- [ ] PDF export of results
- [ ] Team/organization assessments
- [ ] Historical comparison reports

## Next Tasks
1. Integrate real ActiveCampaign API when key provided
2. Integrate WhatsApp Business API for admin notifications
3. Add real Calendly embed URL
4. Add user email notifications on completion
5. Add assessment retake tracking
