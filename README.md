# Mini Course: Agentic AI for Marketing & Business

Aplikasi web pembelajaran interaktif untuk mini course **Agentic AI for Marketing & Business** dari Lensetek International. Aplikasi ini menggabungkan landing page, student classroom, modul belajar bilingual, quiz verification, certificate flow, dan AI Mentor sandbox berbasis server.

Target utama aplikasi ini adalah membantu marketer, owner bisnis, operator, consultant, educator, dan tim perusahaan memahami cara merancang workflow AI agent tanpa harus memulai dari coding.

## Deskripsi Aplikasi

Platform ini berfungsi sebagai:

- **Landing page course** untuk menjelaskan manfaat, use case, kompetensi, dan kurikulum.
- **Student classroom** dengan akses privat menggunakan invitation code.
- **Modul belajar bilingual** dalam Bahasa Indonesia dan English.
- **Interactive AI Sandbox Lab** untuk menjalankan AI Mentor sesuai konteks modul.
- **Quiz verification** untuk memvalidasi pemahaman di tiap modul.
- **Certificate of Completion** setelah seluruh module challenge selesai.
- **Certificate verification page** untuk mengecek kredensial sertifikat.
- **Student profile management** menggunakan Firebase Authentication dan Firestore.

## Isi Modul Aplikasi

Course terdiri dari 5 modul utama dengan total 20 jam pembelajaran:

1. **Foundations of Agentic AI**
   - Chatbots vs autonomous agents.
   - Custom AI assistants / Gemini Gems.
   - Chain-of-thought dan structured reasoning workflow.

2. **Workflows & Multi-Agent Systems**
   - Desain specialized AI assistants.
   - Collaborative multi-agent workflow.
   - Reviewer agent, guardrails, dan human-in-the-loop checkpoint.

3. **Marketing Automation**
   - Automated SEO writing workflow.
   - Trend research dan competitor tracking.
   - Competitor SWOT automation.

4. **Business Operations with Google Opal**
   - Visual AI mini-apps dengan drag-and-drop workflow.
   - Sales outreach automation.
   - Lead scoring dan operasional UMKM.

5. **Low-Code Deployments & Launch**
   - Low-code connections dan automation triggers.
   - Monitoring kuota, biaya, dan usage limit.
   - Security checklist sebelum rilis produksi.

## Fitur Utama

- Login / register menggunakan Google via Firebase Authentication.
- Akses kelas privat menggunakan invitation code.
- Penyimpanan progress, biodata, dan sertifikat di Firestore.
- Materi belajar per modul dengan session breakdown.
- Quiz per modul untuk membuka progress course.
- AI Mentor sandbox melalui backend Express agar OpenAI API key tidak terekspos di frontend.
- Certificate generator dan verification URL.
- Responsive UI dengan React, Vite, Tailwind CSS, Framer Motion, dan Lucide React.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend local API**: Express.js
- **AI runtime**: OpenAI Agents SDK
- **Authentication & database**: Firebase Authentication, Firestore, Firebase Analytics
- **Icons**: Lucide React
- **Build tools**: Vite, ESLint

## Cara Install

### Prasyarat

- Node.js 18 atau lebih baru.
- npm.
- Firebase project dengan Authentication dan Firestore aktif.
- OpenAI API key untuk menjalankan AI Mentor sandbox.

### 1. Clone Repository

```bash
git clone https://github.com/lensetek/Mini-Course-Agentic-AI-for-Marketing-Business.git
cd Mini-Course-Agentic-AI-for-Marketing-Business
```

### 2. Install Dependency

```bash
npm install
```

### 3. Setup Environment

Buat file `.env.local` di root project. Jangan commit file ini ke repository.

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_CREDENTIAL_URL=http://localhost:5173

OPENAI_API=your_openai_api_key
OPENAI_MODEL=gpt-4.1-nano
PORT=3001
```

Catatan security:

- Variable dengan prefix `VITE_` akan dibundel ke frontend oleh Vite. Gunakan hanya untuk konfigurasi public client seperti Firebase web config.
- Jangan pernah menyimpan OpenAI API key dalam variable `VITE_`.
- OpenAI key harus tetap di backend melalui `OPENAI_API`, lalu dipakai oleh `server.js`.
- `.env.local`, `.env`, dan file env lain sudah di-ignore oleh `.gitignore`.

### 4. Jalankan Backend AI Mentor

Buka terminal pertama:

```bash
npm run server
```

Backend berjalan di:

```text
http://localhost:3001
```

Endpoint AI Mentor:

```text
POST http://localhost:3001/api/agent/run
```

### 5. Jalankan Frontend

Buka terminal kedua:

```bash
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

## Script yang Tersedia

```bash
npm run dev
```

Menjalankan frontend Vite untuk development.

```bash
npm run server
```

Menjalankan backend Express untuk AI Mentor sandbox.

```bash
npm run build
```

Membuat production build frontend.

```bash
npm run preview
```

Menjalankan preview build Vite.

```bash
npm run lint
```

Menjalankan ESLint.

## Deployment

Frontend dapat dideploy ke Firebase Hosting, Vercel, Netlify, atau platform static hosting lain yang mendukung Vite. Backend `server.js` perlu dideploy sebagai Node.js service terpisah jika AI Mentor sandbox ingin aktif di production.

Pastikan secret seperti `OPENAI_API` hanya disimpan di environment backend, bukan di frontend hosting config.

## License

Copyright 2026 Lensetek International, LLC. All rights reserved.
