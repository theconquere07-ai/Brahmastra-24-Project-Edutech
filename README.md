# DU-01 AI-Powered Learning Gap Detector

This is the functional backend for the DU-01 Learning Gap Detection Platform.

## Features

- **Hybrid Intelligence Engine:** Uses deterministic grading combined with AI to identify actual learning gaps based on collected evidence.
- **Role-Based Access Control:** Distinct workflows for Students, Teachers, and Admins.
- **Adaptive Practice Generation:** Uses AI to generate personalized practice questions based on a student's specific learning gap.

## Setup

1. Copy `.env.example` to `.env` and configure your `GEMINI_API_KEY`.
2. Run `npm install` to install dependencies.
3. Run `npx prisma db push` to initialize the local SQLite database.
4. Run `npm run seed` to populate the database with the "Aarav Sharma" demo data.
5. Run `npm run dev` to start the server.

## API Usage

The backend runs on `http://localhost:3000`.

- **Login Student:**
  - POST `/api/auth/login`
  - Body: `{ "email": "aarav@test.com", "password": "password123" }`

- **Login Teacher:**
  - POST `/api/auth/login`
  - Body: `{ "email": "smith@test.com", "password": "password123" }`

- **Take Assessment:**
  - POST `/api/assessments/:id/attempt`
  - POST `/api/assessments/:id/attempt/:attemptId/submit` (with responses)

- **View Dashboard (Student/Teacher):**
  - GET `/api/student/dashboard`
  - GET `/api/teacher/dashboard`

## Architecture

- **Express.js + TypeScript**
- **Prisma + SQLite** (Easily swappable to PostgreSQL)
- **Google GenAI (Gemini)** for deep analysis
