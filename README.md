# Mini Course: Agentic AI for Marketing & Business

An interactive, web-based educational platform designed to teach marketers, business owners, and operational managers how to deploy and orchestrate Agentic AI systems. Built with React (Vite), Tailwind CSS, and Firebase.

## Product Overview

The platform serves as both a landing page and a student learning dashboard. It introduces participants to the core concepts of multi-agent orchestration without requiring prior coding experience.

### Key Features
- **Bilingual Interface**: Support for both English and Indonesian.
- **Student Dashboard**: Track learning progress through 5 comprehensive modules.
- **Interactive AI Sandbox**: A simulated terminal to run AI agents and get hands-on experience orchestrating tasks like market research, content writing, and SEO optimization.
- **Firebase Authentication**: Secure Google Login integration.
- **Automated Certification System**:
  - Dynamically generates professional Certificates of Completion and Transcripts upon passing all module quizzes.
  - Generates verifiable QR codes embedded into the certificate.
  - Built-in, publicly accessible certificate verification page to check the authenticity of a certificate.
- **Student Biodata Management**: Collects and locks participant identities to prevent certificate forgery.

## Technology Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion
- **Backend & Database**: Firebase Authentication, Firestore Database
- **Icons**: Lucide React
- **PDF/Image Generation**: `html2canvas`, `jspdf`
- **QR Code**: `qrcode.react`

## Installation Guide

Follow these instructions to run the project locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- A Firebase Project (with Authentication and Firestore Database enabled)

### 1. Clone the Repository
```bash
git clone https://github.com/lensetek/Mini-Course-Agentic-AI-for-Marketing-Business.git
cd Mini-Course-Agentic-AI-for-Marketing-Business
```

### 2. Install Dependencies
```bash
npm install
```
*(Alternatively, you can use `yarn install` or `pnpm install`)*

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory by copying the `.env.example` file:
```bash
cp .env.example .env.local
```
Fill in the Firebase configuration values in `.env.local` based on your Firebase Console settings:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

## Deployment
This project is built with Vite and can be easily deployed to services like Vercel, Netlify, or Firebase Hosting. Ensure that you set up your Firebase environment variables on your deployment platform.

## License
&copy; 2026 Lensetek International, LLC. All rights reserved.
