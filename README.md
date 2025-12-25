# CompeteIQ

**AI-Powered Market Analysis for App Founders**

CompeteIQ helps founders analyze their app ideas against the current market using AI-powered competitor research, feature analysis, and strategic insights. Get comprehensive market intelligence in minutes, not weeks.

---

## Features

### Core Analysis Engine
- **Competitor Identification**: Automatically discovers 4 direct and 2 indirect competitors using Perplexity AI's real-time search
- **Feature Matrix**: AI-generated comparison across 10 industry-specific parameters
- **Gap Analysis**: Identifies competitive deficits and unique standouts
- **Blue Ocean Discovery**: Finds market vacuum opportunities
- **MVP Scoping**: Prioritizes features as P0/P1/P2 based on market analysis

### Advanced Capabilities
- **AI Persona Testing**: Chat with 3 AI personas (Price-Sensitive, Power User, Corporate Buyer)
- **Sentiment Simulation**: 10 AI-generated reviews (positive, mixed, negative)
- **Dynamic Positioning**: Value vs Complexity 2x2 positioning map
- **Export Options**: PDF reports and Markdown summaries

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM 7
- **Database**: PostgreSQL (Vercel Postgres recommended)
- **Authentication**: Clerk
- **AI Services**:
  - OpenAI GPT-4o (analysis, scoring, content generation)
  - Perplexity API (real-time competitor search)
- **Visualization**: Recharts
- **Export**: react-pdf, Puppeteer

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or Vercel Postgres)
- API keys for: Clerk, OpenAI, Perplexity

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is required due to React 19 compatibility with some dependencies.

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/competeiq"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# AI APIs
OPENAI_API_KEY="sk-..."
PERPLEXITY_API_KEY="pplx-..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Get API Keys:**
- Clerk: https://dashboard.clerk.com
- OpenAI: https://platform.openai.com/api-keys
- Perplexity: https://www.perplexity.ai/settings/api

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
compete-iq-main/
├── prisma/
│   ├── schema.prisma              # Database schema (12 tables)
│   └── schema.sql                 # Backup SQL script
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Clerk
│   │   ├── page.tsx               # Landing page
│   │   ├── dashboard/             # User dashboard
│   │   ├── new-analysis/          # Analysis creation form
│   │   ├── analysis/[analysisId]/ # Results page
│   │   └── api/analyses/          # API endpoints
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   ├── FeatureList.tsx        # Dynamic feature input
│   │   ├── AnalysisForm.tsx       # Main form
│   │   ├── AnalysisLoadingState.tsx
│   │   └── AnalysisDashboard.tsx  # Results dashboard
│   ├── lib/
│   │   ├── ai/                    # AI processing modules
│   │   │   ├── competitor-search.ts
│   │   │   ├── feature-analysis.ts
│   │   │   ├── gap-analysis.ts
│   │   │   ├── mvp-scoper.ts
│   │   │   ├── persona-generator.ts
│   │   │   ├── positioning-map.ts
│   │   │   └── processing-pipeline.ts
│   │   ├── db/prisma.ts           # Prisma client singleton
│   │   └── utils/                 # Utilities
│   ├── types/                     # TypeScript types
│   └── middleware.ts              # Clerk authentication
├── .env.local                     # Environment variables
├── IMPLEMENTATION.md              # Detailed implementation docs
└── package.json
```

---

## API Endpoints

### `POST /api/analyses`
Creates a new analysis and triggers AI processing.

**Request Body:**
```json
{
  "appName": "MyApp",
  "targetAudience": "Small business owners",
  "description": "A project management tool for...",
  "features": [
    {
      "name": "Task Management",
      "description": "Create, assign, and track tasks"
    }
  ]
}
```

**Response:**
```json
{
  "analysisId": "uuid",
  "status": "processing"
}
```

### `GET /api/analyses/[analysisId]`
Fetches complete analysis with all related data.

**Response:** Full analysis object with all 12 related tables.

### `GET /api/analyses/[analysisId]/status`
Polls analysis status for progress updates.

**Response:**
```json
{
  "status": "processing",
  "aiProcessingStage": "matrix_progress_45/70",
  "errorMessage": null
}
```

---

## Database Schema

CompeteIQ uses 12 PostgreSQL tables with complete cascade deletion:

1. **analyses** - Core analysis records
2. **user_features** - User's planned features with MVP priorities
3. **competitors** - Identified competitors (4 direct + 2 indirect)
4. **competitor_features** - Features offered by competitors
5. **comparison_parameters** - AI-determined evaluation criteria
6. **feature_matrix_scores** - Scores for matrix (user app + competitors)
7. **gap_analysis_items** - Deficits and standouts
8. **blue_ocean_insight** - Market vacuum opportunity
9. **personas** - 3 AI personas
10. **persona_chat_messages** - Chat history
11. **positioning_data** - Value vs Complexity positioning
12. **simulated_reviews** - AI-generated reviews

See `prisma/schema.prisma` for complete schema details.

---

## AI Processing Pipeline

When an analysis is created, a 7-stage AI pipeline runs in the background:

1. **Competitor Identification** (20%)
   - Perplexity API search
   - 4 direct + 2 indirect competitors
   - Feature extraction per competitor

2. **Feature Analysis & Matrix** (20-45%)
   - Generate 10 comparison parameters
   - Score user app + all competitors (0-10 scale)
   - 70 total scores with reasoning

3. **Gap Analysis** (45-60%)
   - Identify deficits (what user lacks)
   - Identify standouts (unique advantages)
   - Severity and opportunity scoring

4. **Blue Ocean Discovery** (60-65%)
   - Find market vacuum opportunity
   - Supporting evidence
   - Strategic recommendations

5. **MVP Scoping** (65-70%)
   - Tag features as P0/P1/P2
   - AI reasoning for each priority

6. **Persona Generation** (70-85%)
   - Create 3 AI personas
   - Generate 10 simulated reviews

7. **Positioning Map** (85-100%)
   - Value vs Complexity scoring
   - Quadrant assignment

**Total Processing Time**: 2-3 minutes

Frontend polls status every 2 seconds for real-time progress updates.

---

## Development Workflow

### Running Tests
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### Database Operations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

### Debugging
- API logs: Check terminal running `npm run dev`
- Database queries: Set `log: ['query']` in `src/lib/db/prisma.ts`
- AI responses: Check console.log statements in `src/lib/ai/*` modules

---

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy on Vercel**
   - Connect GitHub repository at https://vercel.com
   - Add environment variables in project settings
   - Auto-deploys on every push to main

3. **Set Up Database**
   - Use Vercel Postgres (native integration)
   - Run migrations: `npx prisma migrate deploy`

4. **Configure Clerk**
   - Add production domain to Clerk dashboard
   - Update `NEXT_PUBLIC_CLERK_AFTER_SIGN_*_URL` to production URL

### Other Platforms
CompeteIQ can be deployed on any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- Docker container

Ensure PostgreSQL database is accessible and all environment variables are set.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4 |
| `PERPLEXITY_API_KEY` | Yes | Perplexity API key for search |
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL (with protocol) |
| `NODE_ENV` | No | Environment (development/production) |

---

## Troubleshooting

### "ERESOLVE unable to resolve dependency tree"
**Solution**: Use `npm install --legacy-peer-deps`

### "P1012 - datasource property 'url' is no longer supported"
**Solution**: Prisma 7 changed configuration. Ensure `url` is removed from `datasource db` block in schema.prisma

### Analysis stuck at "processing"
**Check**:
1. API keys are valid (OPENAI_API_KEY, PERPLEXITY_API_KEY)
2. Check server logs for errors
3. Verify database connection

### Authentication not working
**Check**:
1. Clerk keys are correct
2. Public routes configured in `src/middleware.ts`
3. `NEXT_PUBLIC_CLERK_*` variables have `NEXT_PUBLIC_` prefix

---

## Additional Documentation

- **IMPLEMENTATION.md**: Detailed implementation status, all completed features, testing guide
- **prisma/schema.prisma**: Complete database schema with comments
- **prisma/schema.sql**: Standalone SQL script for manual setup

---

## Contributing

This is a proprietary project. For issues or questions, contact the development team.

---

## License

All rights reserved. This project is not open source.

---

**Built with Next.js 16, TypeScript, and AI**

Last Updated: December 25, 2024
