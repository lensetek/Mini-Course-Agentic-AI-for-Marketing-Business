# Mini Course: Agentic AI for Marketing & Business

An interactive web learning platform for the **Agentic AI for Marketing & Business** mini course by Lensetek International. The app combines a course landing page, student classroom, bilingual learning modules, quiz verification, certificate flow, and a server-side AI Mentor sandbox.

The platform is designed for marketers, business owners, operators, consultants, educators, and enterprise teams who want to learn how to design AI agent workflows without starting from code.

## App Overview

The platform includes:

- **Course landing page** for benefits, use cases, competencies, and curriculum overview.
- **Student classroom** with private access through invitation codes.
- **Bilingual learning modules** in English and Bahasa Indonesia.
- **Interactive AI Sandbox Lab** for running an AI Mentor in the context of each module.
- **Quiz verification** to validate understanding in each module.
- **Certificate of Completion** after all module challenges are completed.
- **Certificate verification page** for checking certificate credentials.
- **Student profile management** using Firebase Authentication and Firestore.

## Course Modules

The course contains 5 main modules with a total of 20 learning hours:

1. **Foundations of Agentic AI**
   - Chatbots vs autonomous agents.
   - Custom AI assistants / Gemini Gems.
   - Chain-of-thought and structured reasoning workflows.

2. **Workflows & Multi-Agent Systems**
   - Designing specialized AI assistants.
   - Collaborative multi-agent workflows.
   - Reviewer agents, guardrails, and human-in-the-loop checkpoints.

3. **Marketing Automation**
   - Automated SEO writing workflows.
   - Trend research and competitor tracking.
   - Competitor SWOT automation.

4. **Business Operations with Google Opal**
   - Visual AI mini-apps with drag-and-drop workflows.
   - Sales outreach automation.
   - Lead scoring and SME operations.

5. **Low-Code Deployments & Launch**
   - Low-code connections and automation triggers.
   - Quota, cost, and usage-limit monitoring.
   - Security checklist before production release.

## Key Features

- Google login / registration via Firebase Authentication.
- Private classroom access through invitation codes.
- Progress, biodata, and certificate storage in Firestore.
- Learning materials with session breakdowns for each module.
- Module quizzes to unlock course progress.
- AI Mentor sandbox through an Express backend so the OpenAI API key is not exposed in the frontend.
- Certificate generator and verification URL.
- Responsive UI with React, Vite, Tailwind CSS, Framer Motion, and Lucide React.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Local backend API**: Express.js
- **AI runtime**: OpenAI Agents SDK
- **Authentication & database**: Firebase Authentication, Firestore, Firebase Analytics
- **Icons**: Lucide React
- **Build tools**: Vite, ESLint

## Installation

### Prerequisites

- Node.js 18 or newer.
- npm.
- A Firebase project with Authentication and Firestore enabled.
- An OpenAI API key to run the AI Mentor sandbox.

### 1. Clone the Repository

```bash
git clone https://github.com/lensetek/Mini-Course-Agentic-AI-for-Marketing-Business.git
cd Mini-Course-Agentic-AI-for-Marketing-Business
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root. Do not commit this file to the repository.

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_CREDENTIAL_URL=http://localhost:5173
VITE_AGENT_API_URL=http://localhost:3001/api/agent/run

OPENAI_API=your_openai_api_key
OPENAI_MODEL=gpt-4.1-nano
PORT=3001
```

Security notes:

- Variables with the `VITE_` prefix are bundled into the frontend by Vite. Use them only for public client configuration such as Firebase web config.
- Never store the OpenAI API key in a `VITE_` variable.
- The OpenAI key must stay on the backend through `OPENAI_API`, where it is used by `server.js`.
- `VITE_AGENT_API_URL` is safe to expose because it is only the public backend endpoint URL, not a secret.
- `.env.local`, `.env`, and other env files are ignored by `.gitignore`.
- Invitation codes should be stored in Firestore, not in frontend environment variables.

### 4. Run the AI Mentor Backend

Open the first terminal:

```bash
npm run server
```

The backend runs at:

```text
http://localhost:3001
```

AI Mentor endpoint:

```text
POST http://localhost:3001/api/agent/run
```

### 5. Run the Frontend

Open a second terminal:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Available Scripts

```bash
npm run dev
```

Runs the Vite frontend for development.

```bash
npm run server
```

Runs the Express backend for the AI Mentor sandbox.

```bash
npm run build
```

Creates a production build of the frontend.

```bash
npm run preview
```

Runs the Vite production preview.

```bash
npm run lint
```

Runs ESLint.

## Deployment

The frontend can be deployed to Firebase Hosting, Vercel, Netlify, or another static hosting platform that supports Vite. The `server.js` backend should be deployed as a separate Node.js service if the AI Mentor sandbox needs to be available in production.

Make sure secrets such as `OPENAI_API` are stored only in the backend environment, never in the frontend hosting configuration.

For production, if the frontend and `server.js` are deployed as the same service, use the same-origin endpoint:

```env
VITE_AGENT_API_URL=/api/agent/run
```

If the backend is deployed as a separate service, set `VITE_AGENT_API_URL` to the deployed backend endpoint, for example:

```env
VITE_AGENT_API_URL=https://your-backend.example.com/api/agent/run
```

## License

Copyright 2026 Lensetek International, LLC. All rights reserved.
