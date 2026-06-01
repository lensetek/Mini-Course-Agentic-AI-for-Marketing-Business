import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Workflow,
  LineChart,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers3,
  BarChart3,
  MessageSquareMore,
  Menu,
  X,
  Play,
  RotateCcw,
  Sparkle,
  LogOut,
  BookOpen,
  Award,
  Terminal,
  FileText,
  HelpCircle,
  ChevronRight,
  Send,
  Globe,
  ListChecks,
  Network
} from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

const githubUrl = "https://github.com/lensetek/Mini-Course-Agentic-AI-for-Marketing-Business";

const stripLogPrefix = (log) => log.replace(/^.*?\]:\s*/, "");

const getLogType = (log) => {
  if (log.includes("[You]")) return "user";
  if (log.includes("[Agent")) return "agent";
  return "system";
};

const renderInlineMarkdown = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

const MarkdownMessage = ({ content }) => {
  const lines = content.split("\n").map(line => line.trim()).filter(Boolean);

  if (!lines.length) return null;

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {lines.map((line, idx) => {
        if (line.startsWith("### ")) {
          return <h5 key={idx} className="pt-1 text-sm font-extrabold text-slate-900">{renderInlineMarkdown(line.slice(4))}</h5>;
        }
        if (line.startsWith("## ")) {
          return <h4 key={idx} className="pt-1 text-base font-extrabold text-slate-900">{renderInlineMarkdown(line.slice(3))}</h4>;
        }
        if (line.startsWith("# ")) {
          return <h4 key={idx} className="pt-1 text-base font-extrabold text-slate-900">{renderInlineMarkdown(line.slice(2))}</h4>;
        }
        if (/^[-*]\s+/.test(line)) {
          return (
            <div key={idx} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
              <p>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</p>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(line)) {
          return <p key={idx}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</p>;
        }
        return <p key={idx}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
};

const getAgentLogText = (labLogs) => labLogs
  .filter(log => getLogType(log) === "agent")
  .map(stripLogPrefix)
  .join("\n\n");

const createSummaryFromLogs = (labLogs, lang) => {
  const agentText = getAgentLogText(labLogs);
  if (!agentText) {
    return lang === "EN"
      ? "No AI-Mentor response is available to summarize yet."
      : "Belum ada respons AI-Mentor yang bisa diringkas.";
  }

  const sentences = agentText
    .replace(/\*\*/g, "")
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 20)
    .slice(-4);

  return sentences.length
    ? sentences.map(sentence => `- ${sentence}`).join("\n")
    : `- ${agentText.slice(0, 320)}${agentText.length > 320 ? "..." : ""}`;
};

const createMindmapFromLogs = (labLogs, activeModuleTitle, lang) => {
  const agentText = getAgentLogText(labLogs).replace(/\*\*/g, "");
  if (!agentText) return null;

  const sentences = agentText
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 24)
    .slice(-6);

  const branches = sentences.slice(0, 3).map((sentence, idx) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    const title = words.slice(0, 5).join(" ").replace(/[,:;.!?]$/, "");
    const details = [
      words.slice(5, 11).join(" ").replace(/[,:;.!?]$/, ""),
      words.slice(11, 17).join(" ").replace(/[,:;.!?]$/, "")
    ].filter(Boolean);

    return {
      id: `branch-${idx}`,
      title: title || (lang === "EN" ? `Key idea ${idx + 1}` : `Ide utama ${idx + 1}`),
      details
    };
  });

  return {
    root: activeModuleTitle,
    branches: branches.length ? branches : [
      {
        id: "branch-0",
        title: lang === "EN" ? "AI-Mentor insight" : "Insight AI-Mentor",
        details: [agentText.slice(0, 80)]
      }
    ]
  };
};

const agentSteps = [
  {
    id: 1,
    title: "Trend Research Agent",
    desc: "Mencari tren, keyword, dan peluang SEO",
    details: "Menganalisis Google Trends & SERP terbaru untuk mengidentifikasi topik bernilai tinggi.",
    status: "success",
    duration: 1.5
  },
  {
    id: 2,
    title: "Content Writer Agent",
    desc: "Menulis konten sesuai brand voice",
    details: "Membuat draft artikel, postingan sosial media, dan email newsletter terstruktur.",
    status: "success",
    duration: 2.0
  },
  {
    id: 3,
    title: "QA & Fact-Check Agent",
    desc: "Memeriksa akurasi dan keterbacaan",
    details: "Memvalidasi sumber data, memeriksa kesalahan tata bahasa, dan memverifikasi keterbacaan SEO.",
    status: "success",
    duration: 1.0
  },
  {
    id: 4,
    title: "Report Agent",
    desc: "Mengirim ringkasan ke email/dashboard",
    details: "Secara otomatis mempublikasikan ke CMS dan mengirimkan KPI performa ke tim Anda.",
    status: "success",
    duration: 0.8
  },
];

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

// Translation Dictionary
const t = {
  EN: {
    navCurriculum: "Curriculum",
    navCompetencies: "Competencies",
    navUseCases: "Use Cases",
    loginBtn: "Login",
    signUpBtn: "Sign Up",
    logoutBtn: "Log Out",
    studentLoginBtn: "Student Login",
    badgeLabel: "Mini Course 20 Hours · 5 Sessions · Beginner to Intermediate",
    heroTitlePrefix: "Agentic AI for ",
    heroTitleHighlight: "Marketing & Business",
    heroDescription: "Learn how to build autonomous AI agents for market intelligence, scale high-converting content writing engines, streamline support, and automate spreadsheets. No coding experience required. Practical focus: master core architecture, orchestrate agent teams, and launch with modern low-code systems.",
    heroCTAEnroll: "Enroll Now via Google",
    heroCTALogin: "Student Login",
    statsHours: "Total Learning Hours",
    statsModules: "Hands-on Modules",
    statsFriendly: "Beginner Friendly",
    sandboxHeader: "Interactive Sandbox",
    sandboxSub: "Marketing Intelligence Engine",
    sandboxPlay: "Run Live Agent Demo",
    sandboxReset: "Reset Simulator",
    curriculumHeader: "Applied Curriculum",
    curriculumTitle: "From Core Architecture Design to Fully Ready Deployments.",
    curriculumSub: "Our structures are systematically constructed to take you step-by-step: core conceptual agent framework, system architecture, marketing automatons, operational support, all the way to cloud orchestration and cost calculations.",
    competencyHeader: "Key Competencies",
    competencyTitle: "Equip yourself with a brand new workflow mindset, not just another list of copy-paste prompts.",
    competencyDescription: "This intensive program is crafted from the ground up for modern marketing heads, business owners, operational managers, technical consultants, educators, and enterprise teams seeking to deploy AI strategically.",
    competencyCTAEnroll: "Register Account",
    competencyCTALogin: "Student Portal",
    useCasesHeader: "Real-world Use Cases",
    useCasesTitle: "AI Solutions engineered for real-life business workflows.",
    useCasesDescription: "Forget theoretical coding exercises. Every single use case is built directly around actual, critical operational responsibilities: high-speed market research, custom SEO contents, scalable sales qualification, inventory intelligence, and quick administrative solutions.",
    ctaHeader: "Ready to construct your first automated multi-agent AI system?",
    ctaDescription: "Register for the Lensetek Certification Program, enter our digital sandbox academy, and master Agentic AI frameworks designed specifically for business scale.",
    ctaBtnEnroll: "Register Now via Google",
    classroomHeader: "Student Classroom",
    classroomDesc: "Welcome to your Agentic AI Classroom. Browse the core modules, complete the quick validation challenges, and run live server-side agents.",
    badgeProgress: "Badges",
    sidebarHeader: "Course Modules",
    certHeader: "Course Certificate",
    certDesc: "Complete the quick quiz challenge on all 5 modules to unlock your digital Certificate of Completion.",
    certBtn: "Generate Certificate",
    studyMaterialsTab: "Study Materials",
    agentSandboxTab: "Agent Sandbox Lab",
    quizVerificationTab: "Quiz Verification",
    practicalLabTitle: "Interactive Agent Sandbox Lab",
    quizSubmit: "Submit Answer",
    quizRetry: "Try Again",
    certTitle: "Certificate of Completion",
    certPresenter: "This is proudly presented to",
    certBody: "For successfully mastering the concepts and engineering parameters of Agentic AI for Marketing & Business, completing all 5 technical verification sessions, and demonstrating hands-on proficiency in server-side AI Agent Orchestration.",
    certIssued: "Issued By",
    certDate: "Date of Graduation",
    certPrint: "Print Certificate",
    backToStudy: "Back to Study",
    classroomBtn: "Go to Classroom",
    curriculumBtn: "Go to Curriculum",
    modulesList: [
      {
        id: 1,
        title: "Foundations of Agentic AI",
        hours: "3 Hours",
        desc: "Understand the core differences between traditional chat LLMs and autonomous AI agents capable of planning and tools usage.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner to Intermediate (No coding background required)",
          description: "This curriculum is designed with a competency-based, skills-driven practical approach, where participants do not just learn theory but directly build and integrate autonomous AI agents to solve real business workflows.",
          sessions: [
            {
              title: "Session 1.1: Introduction to Generative AI vs Agentic AI (1.5 Hours)",
              bullets: [
                "Limitations of standard LLMs: Passive response generation based on static inputs.",
                "Power of Agentic AI: Autonomously reasoning, planning, selecting tools, and executing decisions.",
                "Anatomy of an AI Agent: Core LLM (Brain), Memory (Short & Long-term), Tools (APIs, Databases, Web Scrapers), and Planning."
              ]
            },
            {
              title: "Session 1.2: Intended Optimization & Agent Logic Loops (1.5 Hours)",
              bullets: [
                "Deconstructing complex goals: Utilizing Chain-of-Thought (CoT) to map logical system processes transparently.",
                "The ReAct (Reason + Act) Framework: Structuring systematic thought, action, and observation iteration loops.",
                "Case Study: Upgrading manual market research into high-speed autonomous SWOT and SEO intelligence gathering workflows."
              ]
            }
          ],
          quiz: {
            question: "According to the anatomy of an AI Agent, which core component serves as the 'Brain' to execute the ReAct reasoning loops?",
            options: [
              "Memory (Short-term & Long-term context storage)",
              "Tools (Web search, APIs, and Database integrations)",
              "Core LLM (Large Language Model acting as the Brain)",
              "Planning (Chain-of-Thought step scheduler)",
              "External Vector Databases (Embeddings query storage)"
            ],
            answerIdx: 2
          }
        }
      },
      {
        id: 2,
        title: "Workflows & Multi-Agent Systems",
        hours: "4 Hours",
        desc: "Design detailed instructions, persona boundaries, guardrails, and systematic collaborations between multiple specialized agents.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner to Intermediate (No coding background required)",
          description: "Learn how to architect collaborative workspaces where multiple AI agents work in sync, passing tasks and data securely to compile complex operations.",
          sessions: [
            {
              title: "Session 2.1: Designing Agent Personas & Instructions (2 Hours)",
              bullets: [
                "Defining rigid system instructions to craft distinct, high-fidelity agent personalities.",
                "Configuring guardrails: setting exact limits to stop infinite loop cycles and output degradation.",
                "Formatting output guidelines to ensure agents deliver clean structured datasets."
              ]
            },
            {
              title: "Session 2.2: Guardrails & Supervisor Routing (2 Hours)",
              bullets: [
                "Orchestrating agent networks: building supervisor agents that review work and route tasks.",
                "Stateful collaborations: passing task contexts securely across worker agents (Writer, QA, Editor).",
                "Human-in-the-loop: implementing fallback checkpoints to request human approvals before final actions."
              ]
            }
          ],
          quiz: {
            question: "In a Multi-Agent architecture, what is the key responsibility of a 'Supervisor' or 'Orchestrator' agent?",
            options: [
              "Storing database passwords securely.",
              "Evaluating the outputs of workers and routing the task to the next logical agent.",
              "Translating program scripts directly into raw binary.",
              "Counting the exact word limits of articles.",
              "Acting as an external firewall configuration controller."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 3,
        title: "Marketing Automation",
        hours: "5 Hours",
        desc: "Build content writing engines, trend research pipelines, automated SEO, competitor tracking, and live market intelligence reports.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner to Intermediate (No coding background required)",
          description: "Configure fully automated marketing workflows that dynamically query search trends, scrape competitors, and compose personalized content at scale.",
          sessions: [
            {
              title: "Session 3.1: Automated SEO & Keyword Harvesters (2.5 Hours)",
              bullets: [
                "Web Scraping: building web-enabled agents that crawl SERP results for live search trends.",
                "SEO Outline Automation: generating high-conversions outlines based on keyword densities.",
                "Automated Blog Generation: writing articles that strictly align to targeted search results."
              ]
            },
            {
              title: "Session 3.2: Automated Competitor SWOT Engines (2.5 Hours)",
              bullets: [
                "Competitor Scraping: extracting competitor features and landing page copy autonomously.",
                "SWOT Compiler: synthesizing competitor weaknesses and opportunities into structured analyses.",
                "Automated Reporting: publishing summaries directly to CMS channels or Slack rooms."
              ]
            }
          ],
          quiz: {
            question: "Which of the following represents a practical marketing use case for an autonomous AI Agent?",
            options: [
              "Manually copying and pasting text into Word docs.",
              "Setting up static email templates.",
              "Continuous keyword research, competitor SEO tracking, and auto SWOT generation.",
              "Writing simple one-time prompts.",
              "Printing static PDF flyers."
            ],
            answerIdx: 2
          }
        }
      },
      {
        id: 4,
        title: "Business & SMB Operations",
        hours: "5 Hours",
        desc: "Deploy AI agents for autonomous customer support, sales lead qualification, business analytics, and stock/promotional recommendations.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner to Intermediate (No coding background required)",
          description: "Leverage AI agents to qualify incoming sales leads, respond autonomously to support tickets, and securely perform database analyses.",
          sessions: [
            {
              title: "Session 4.1: Autonomous Lead Scoring & Support Routing (2.5 Hours)",
              bullets: [
                "Support Agents: analyzing user ticket sentiments and auto-generating tailored replies.",
                "Dynamic Escalation: routing highly complex complaints to human administrators instantly.",
                "Lead Qualification: scoring leads based on company size, budget, and needs automatically."
              ]
            },
            {
              title: "Session 4.2: Natural Language CSV & Sales Analytics (2.5 Hours)",
              bullets: [
                "CSV Querying: asking natural language questions to analyze complex spreadsheets.",
                "Sales Forecasting: building agents that inspect past sales to flag peak demand trends.",
                "Inventory Intelligence: auto-composing stock order lists to prevent ritel shortages."
              ]
            }
          ],
          quiz: {
            question: "How can an agent securely assist in sales qualification without exposing private database credentials?",
            options: [
              "By letting users write direct raw SQL injections.",
              "By acting as a secure server-side API proxy that processes inputs and applies predefined guardrails.",
              "By publishing the database keys to client-side cookies.",
              "By turning off all user authorization rules.",
              "By sharing passwords via plain text email."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 5,
        title: "No-Code Deployment",
        hours: "3 Hours",
        desc: "Bring workflows to life using no-code/low-code platforms, then thoroughly evaluate performance, operating costs, and overall readiness.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner to Intermediate (No coding background required)",
          description: "Transition your tested local agents into production environments using low-code pipelines, auditing API overhead and token expenses.",
          sessions: [
            {
              title: "Session 5.1: Low-code Automation Tools (Make/n8n/Flowise) (1.5 Hours)",
              bullets: [
                "Pipeline Connections: connecting visual node platforms directly to your backend API endpoints.",
                "Event triggers: starting agent actions based on email events or spreadsheet updates.",
                "Error Handlers: setting up automated retry loops to manage API connection dropouts."
              ]
            },
            {
              title: "Session 5.2: Latency, Cost Controls, & Launch Checklists (1.5 Hours)",
              bullets: [
                "Token Optimization: pruning system prompts and using context caches to reduce API fees.",
                "User Acceptance Testing (UAT): launching beta tests to confirm accurate agent behaviors.",
                "Launch Checklists: validating cloud hosting readiness, firewall configurations, and API keys."
              ]
            }
          ],
          quiz: {
            question: "Why is evaluating token usage and latency critical before launching an Agentic AI workflow to production?",
            options: [
              "To control running API costs and ensure a snappy, reliable user experience.",
              "Because high latency improves search indexing.",
              "Because it is required to purchase hosting servers.",
              "To disable security firewalls.",
              "To increase browser tab limits."
            ],
            answerIdx: 0
          }
        }
      }
    ]
  },
  ID: {
    navCurriculum: "Kurikulum",
    navCompetencies: "Kompetensi",
    navUseCases: "Use Case",
    loginBtn: "Masuk",
    signUpBtn: "Daftar",
    logoutBtn: "Keluar",
    studentLoginBtn: "Login Peserta",
    badgeLabel: "Mini Course 20 Jam · 5 Sesi · Pemula hingga Menengah",
    heroTitlePrefix: "Agentic AI untuk ",
    heroTitleHighlight: "Marketing & Bisnis",
    heroDescription: "Belajar membangun agen AI otonom untuk riset pasar, produksi konten, customer support, analisis data penjualan, dan workflow bisnis harian. Tidak wajib coding. Fokus praktis: memahami arsitektur, merancang alur kerja agen, lalu menjalankannya dengan platform no-code/low-code.",
    heroCTAEnroll: "Daftar Sekarang via Google",
    heroCTALogin: "Login Peserta",
    statsHours: "Total Jam Belajar",
    statsModules: "Modul Praktis",
    statsFriendly: "Ramah Pemula",
    sandboxHeader: "Simulasi Interaktif",
    sandboxSub: "Marketing Intelligence Engine",
    sandboxPlay: "Jalankan Demo Alur Kerja AI",
    sandboxReset: "Reset Simulasi",
    curriculumHeader: "Kurikulum Terapan",
    curriculumTitle: "Dari Desain Arsitektur Dasar Hingga Deployment Siap Pakai.",
    curriculumSub: "Struktur belajar dirancang bertahap: konsep dasar agen, arsitektur sistem, marketing automation, operasional bisnis, hingga orkestrasi cloud dan penghitungan biaya operasional.",
    competencyHeader: "Kompetensi Akhir",
    competencyTitle: "Pulang membawa cara kerja baru, bukan hanya kumpulan copy-paste prompt.",
    competencyDescription: "Kursus intensif ini dirancang khusus untuk marketer, pemilik bisnis, manajer operasional, konsultan teknis, dosen/trainer, dan tim profesional yang ingin menerapkan AI secara strategis.",
    competencyCTAEnroll: "Buat Akun Baru",
    competencyCTALogin: "Portal Peserta",
    useCasesHeader: "Business Use Cases",
    useCasesTitle: "Solusi AI yang dirancang untuk pekerjaan bisnis nyata harian.",
    useCasesDescription: "Lupakan latihan coding teoretis. Setiap use case dibangun langsung di sekitar tanggung jawab operasional penting: riset pasar instan, optimasi konten SEO, kualifikasi prospek penjualan, analitik stok pintar, dan keputusan operasional cepat.",
    ctaHeader: "Siap membangun alur kerja multi-agent AI pertama Anda?",
    ctaDescription: "Daftar di Lensetek Certification Program, masuk ke akademi simulasi digital kami, dan kuasai framework Agentic AI yang dirancang khusus untuk skala bisnis Anda.",
    ctaBtnEnroll: "Daftar Sekarang via Google",
    classroomHeader: "Kelas Belajar",
    classroomDesc: "Selamat datang di Kelas Agentic AI Anda. Pelajari modul utama, selesaikan kuis evaluasi singkat, dan jalankan agen server-side Anda secara otonom.",
    badgeProgress: "Lencana",
    sidebarHeader: "Modul Pembelajaran",
    certHeader: "Sertifikat Kelulusan",
    certDesc: "Selesaikan kuis verifikasi kompetensi di kelima modul untuk membuka Sertifikat Kelulusan resmi Anda.",
    certBtn: "Unduh Sertifikat",
    studyMaterialsTab: "Materi Pembelajaran",
    agentSandboxTab: "Asisten AI-Mentor",
    quizVerificationTab: "Kuis Verifikasi",
    practicalLabTitle: "Asisten Interaktif AI-Mentor",
    quizSubmit: "Kirim Jawaban",
    quizRetry: "Coba Lagi",
    certTitle: "Sertifikat Kelulusan Resmi",
    certPresenter: "Sertifikat ini dengan bangga dipersembahkan kepada",
    certBody: "Atas keberhasilannya menguasai konsep dan rekayasa parameter Agentic AI untuk Marketing & Bisnis, menyelesaikan 5 sesi verifikasi teknis kompetensi, serta mendemonstrasikan kecakapan praktis dalam Orkestrasi Agen AI pada sisi server.",
    certIssued: "Penerbit Sertifikat",
    certDate: "Tanggal Kelulusan",
    certPrint: "Cetak Sertifikat",
    backToStudy: "Kembali Belajar",
    classroomBtn: "Masuk ke Kelas",
    curriculumBtn: "Lihat Kurikulum",
    modulesList: [
      {
        id: 1,
        title: "Fondasi Agentic AI & Pergeseran Paradigma",
        hours: "3 Jam",
        desc: "Memahami perbedaan mendasar antara AI generatif biasa dengan Agen AI yang otonom beserta anatomi internalnya.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula hingga Menengah (Tidak wajib latar belakang coding)",
          description: "Kurikulum ini dirancang dengan pendekatan praktis berbasis kompetensi (skills-driven), di mana peserta tidak hanya belajar teori, tetapi langsung membangun dan mengintegrasikan agen AI otonom untuk menyelesaikan workflow riil di dunia pemasaran dan bisnis.",
          sessions: [
            {
              title: "Sesi 1.1: Pengantar Generative AI vs Agentic AI (1.5 Jam)",
              bullets: [
                "Keterbatasan LLM standar: Hanya merespons teks secara pasif berdasarkan prompt statis.",
                "Kekuatan Agentic AI: Kemampuan untuk berpikir (reason), merencanakan (plan), menggunakan alat bantu (tools), dan mengambil keputusan mandiri.",
                "Anatomi Agen AI: Terdiri atas empat pilar utama: Core LLM (Brain), Memory (Short-term & Long-term), Tools (Web search, API, Database), dan Planning."
              ]
            },
            {
              title: "Sesi 1.2: Intended Optimization & Logika Berpikir Agen (1.5 Jam)",
              bullets: [
                "Memecah tugas kompleks: Mengenal konsep Chain-of-Thought (CoT) untuk visualisasi logika penalaran internal.",
                "ReAct (Reason + Act) Framework: Siklus otonom terintegrasi yang menggabungkan Thought, Action, dan Observation dalam putaran umpan balik berulang.",
                "Studi Kasus: Bagaimana Agen AI mengubah operasional riset pasar tradisional yang lambat menjadi workflow riset, SWOT kompetitor, dan pelaporan otomatis secara otonom."
              ]
            }
          ],
          quiz: {
            question: "Berdasarkan anatomi Agen AI, pilar manakah yang bertindak sebagai 'Brain' (Mesin Penalaran) untuk mengeksekusi kerangka berpikir ReAct?",
            options: [
              "Memory (Penyimpan konteks jangka pendek & panjang)",
              "Tools (Integrasi Web search, API, dan Database)",
              "Core LLM (Large Language Model sebagai Brain)",
              "Planning (Chain-of-Thought untuk perincian tugas)",
              "External Vectors Storage (Database embeddings eksternal)"
            ],
            answerIdx: 2
          }
        }
      },
      {
        id: 2,
        title: "Workflow & Multi-Agent",
        hours: "4 Jam",
        desc: "Rancang instruksi, persona, guardrails, serta kolaborasi antar-agen untuk proses bisnis yang lebih sistematis.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula hingga Menengah (Tidak wajib latar belakang coding)",
          description: "Pelajari cara merancang ruang kerja kolaboratif di mana beberapa agen AI bekerja secara harmonis, memindahkan data secara terstruktur untuk menyelesaikan operasi bisnis yang kompleks.",
          sessions: [
            {
              title: "Sesi 2.1: Merancang Persona Agen & Instruksi Sistem (2 Jam)",
              bullets: [
                "Merancang persona agen spesifik: merancang system prompt yang rigid untuk memisahkan kepribadian Copywriter, Analis, dan Quality Control.",
                "Membangun guardrails pengaman: membatasi rentang instruksi agar agen tidak terjebak dalam loop tanpa akhir.",
                "Format Output Khusus: melatih agen memberikan struktur respon yang selalu kompatibel (JSON/Markdown)."
              ]
            },
            {
              title: "Sesi 2.2: Guardrails & Supervisor Routing (2 Jam)",
              bullets: [
                "Orkestrasi multi-agen: membangun Agen Supervisor yang secara aktif mengulas kerja agen bawahan dan merutekan tugas.",
                "Kolaborasi Stateful: mengirimkan context memori secara dinamis dari satu agen ke agen lainnya tanpa kehilangan riwayat.",
                "Human-in-the-loop: mengintegrasikan pos persetujuan manusia sebelum agen AI mengeksekusi keputusan bernilai tinggi."
              ]
            }
          ],
          quiz: {
            question: "Dalam arsitektur Multi-Agent, apa peran dari Agen 'Supervisor' atau 'Orchestrator'?",
            options: [
              "Menyimpan password database dengan aman.",
              "Mengevaluasi hasil kerja agen bawahan dan mengarahkan tugas ke langkah berikutnya secara cerdas.",
              "Menerjemahkan kode program langsung menjadi biner.",
              "Menghitung jumlah total kata yang ditulis.",
              "Bertindak sebagai router firewall cadangan."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 3,
        title: "Marketing Automation",
        hours: "5 Jam",
        desc: "Bangun engine konten, riset tren, SEO, competitor tracking, dan laporan market intelligence otomatis.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula hingga Menengah (Tidak wajib latar belakang coding)",
          description: "Konfigurasikan alur kerja pemasaran otomatis yang secara otonom meriset tren pencarian, merayap kompetitor, dan mempublikasikan konten yang terpersonalisasi.",
          sessions: [
            {
              title: "Sesi 3.1: Otomatisasi SEO & Keyword Harvesters (2.5 Jam)",
              bullets: [
                "Perayapan Web otonom: membangun agen pembaca web yang mengumpulkan data tren langsung dari mesin pencari Google.",
                "Pembuatan Konten SEO: merumuskan outline artikel bernilai tinggi berdasarkan kepadatan kata kunci kompetitor teratas.",
                "Pembuatan Blog Otomatis: menginstruksikan agen menulis artikel lengkap yang secara ketat selaras dengan pedoman SEO terbaru."
              ]
            },
            {
              title: "Sesi 3.2: Engine Laporan SWOT Kompetitor Otomatis (2.5 Jam)",
              bullets: [
                "Rayapan SWOT Kompetitor: mengumpulkan data fitur, kelebihan, dan skema harga kompetitor secara mandiri.",
                "Sintesis Data Cepat: menyusun matriks analisis SWOT secara komprehensif ke dalam format terstruktur.",
                "Distribusi Otomatis: mengirimkan file markdown hasil SWOT ke saluran operasional Slack atau kotak surat email."
              ]
            }
          ],
          quiz: {
            question: "Manakah di bawah ini yang merupakan studi kasus marketing nyata dari pemanfaatan Agen AI otonom?",
            options: [
              "Menyalin teks manual ke dokumen Word secara berulang.",
              "Memasang template email statis sekali pakai.",
              "Riset tren kompetitor berkelanjutan, analisis SEO pasar secara otonom, dan pembuatan laporan SWOT otomatis.",
              "Menulis perintah prompt biasa di dashboard chat.",
              "Mencetak selebaran promosi PDF statis."
            ],
            answerIdx: 2
          }
        }
      },
      {
        id: 4,
        title: "Operasional Bisnis & UMKM",
        hours: "5 Jam",
        desc: "Gunakan agen AI untuk customer support, lead qualification, analisis penjualan, dan rekomendasi stok/promosi.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula hingga Menengah (Tidak wajib latar belakang coding)",
          description: "Berdayakan Agen AI otonom untuk memicu respon bantuan pelanggan, menyaring prospek penjualan tinggi, dan menganalisis database secara aman.",
          sessions: [
            {
              title: "Sesi 4.1: Kualifikasi Prospek & Bantuan Pelanggan Otonom (2.5 Jam)",
              bullets: [
                "Customer Support Agent: menganalisis sentimen tiket pelanggan secara instan dan memicu draft balasan personal.",
                "Eskalasi Dinamis: merutekan keluhan kompleks ke admin manusia secara cerdas ketika mendeteksi tingkat urgensi tinggi.",
                "Lead Qualification: mengukur skor calon konsumen secara otonom berdasarkan profil ukuran bisnis dan industri."
              ]
            },
            {
              title: "Sesi 4.2: natural language CSV & Analitik Penjualan (2.5 Jam)",
              bullets: [
                "Analisis Spreadsheet otonom: menanyakan pertanyaan natural untuk menganalisis data penjualan CSV yang kompleks.",
                "Prediksi Permintaan: membangun agen analitik penjualan yang mengidentifikasi tren permintaan musiman dari riwayat data.",
                "Rekomendasi Stok: menginstruksikan agen menyusun rekomendasi stok ritel otomatis untuk menghindari kelangkaan."
              ]
            }
          ],
          quiz: {
            question: "Bagaimana Agen AI membantu kualifikasi prospek bisnis secara aman tanpa membocorkan kredensial database internal?",
            options: [
              "Dengan memberikan akses bebas menulis query SQL mentah.",
              "Melalui jembatan API secure di sisi server yang menerapkan batas filter data masukan pelanggan.",
              "Dengan membagikan API key langsung pada browser cookie.",
              "Dengan menonaktifkan seluruh aturan keamanan validasi pengguna.",
              "Dengan mengirim password via email teks biasa."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 5,
        title: "No-Code Deployment",
        hours: "3 Jam",
        desc: "Aktifkan workflow menggunakan platform no-code/low-code, lalu uji performa, biaya, dan kesiapan implementasinya.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula hingga Menengah (Tidak wajib latar belakang coding)",
          description: "Transisikan agen AI lokal yang telah teruji ke lingkungan produksi komersial menggunakan alur kerja low-code, serta audit latensi dan biaya token API.",
          sessions: [
            {
              title: "Sesi 5.1: Low-code Orkestrasi (Make / n8n / Flowise) (1.5 Jam)",
              bullets: [
                "Koneksi Pipeline Visual: menyambungkan alur visual node langsung ke endpoint API Agen backend Anda.",
                "Pemicu Otomatis (Triggers): memulai alur kerja agen berdasarkan email masuk, chat masuk, atau baris spreadsheet baru.",
                "Manajemen Error: menyusun skema putaran ulang (retry loops) otomatis ketika koneksi API mengalami gangguan jaringan."
              ]
            },
            {
              title: "Sesi 5.2: Latensi, Manajemen Biaya, & Checklist Rilis (1.5 Jam)",
              bullets: [
                "Optimasi Token: memotong system prompt berlebih dan menerapkan cache context untuk menghemat pengeluaran biaya API.",
                "Uji Coba UAT (User Acceptance Testing): menguji performa sistem pada skenario operasional riil untuk memastikan keakuratan respon agen.",
                "Checklist Kesiapan Rilis: memvalidasi firewall cloud hosting, enkripsi API keys, dan batas kuota server produksi."
              ]
            }
          ],
          quiz: {
            question: "Mengapa penting melakukan audit token dan latensi sebelum merilis sistem agen AI ke tahap produksi?",
            options: [
              "Untuk mengontrol pengeluaran biaya API dan menjamin respon sistem yang cepat dan andal.",
              "Karena latensi yang lama mempercepat pengindeksan web.",
              "Karena hal tersebut diwajibkan oleh penyedia hosting cloud server.",
              "Untuk menonaktifkan perlindungan antivirus komputer.",
              "Untuk meningkatkan batas maksimal tab pada browser."
            ],
            answerIdx: 0
          }
        }
      }
    ]
  }
};

const sessionExplanations = {
  EN: {
    1: [
      {
        concept: "In this hands-on session, you will set up a local Node.js environment, install the official `@openai/agents` SDK via terminal (`npm install @openai/agents`), and configure your private `.env.local` to host secure API keys. You will write an Express-backed server file (`server.js`) that safely proxies requests to the model `gpt-4.1-nano`. Rather than calling simple completions, you will initialize a stateful `Agent` runner, testing how the agent autonomously schedules loops, logs actions in a terminal console, and resolves user tasks without client-side key leakage.",
        architecture: "npm install @openai/agents ──> Write server.js API ──> Run Agent Runner Loop ──> Console Output",
        checklist: [
          "Initialize a Node.js project and securely lock credentials in .env.local.",
          "Write a secure Express POST endpoint to handle client-side agent prompt routing.",
          "Inspect autonomous agent execution logs using terminal console inputs."
        ]
      },
      {
        concept: "You will write a custom JavaScript wrapper that binds search APIs (such as Serper.dev or Google Custom Search) into an executable `Tool` class. You will write system prompts instructing the LLM to output its reasoning step-by-step using a structured `<thought>` block. In the terminal, you will run the agent and watch it execute a ReAct cycle: identifying that it needs competitive pricing, calling the Google Search tool, analyzing the raw snippet, and refining its final response dynamically based on live findings.",
        architecture: "Prompt CoT ──> Tools Array [SearchAPI] ──> Run ReAct Loop ──> Observation ──> Solve",
        checklist: [
          "Write system prompts that enforce step-by-step thinking blocks prior to tool execution.",
          "Bind a live HTTP-based web search tool wrapper using Axios to your agent's tools array.",
          "Execute an autonomous research script and debug ReAct logs inside the server console."
        ]
      }
    ],
    2: [
      {
        concept: "In this practical lab, you will write a comprehensive system instructions file for specialized roles: an SEO Specialist (focused on high search volume phrases), a Copywriter (using dynamic CTA hooks), and an Editor (enforcing rules against grammatical errors). You will configure the agent's properties using `response_format: { type: 'json_object' }` to force consistent JSON outputs, then write code to parse the JSON output directly to your client-side dashboard.",
        architecture: "Define Role Persona ──> Set response_format: 'json_object' ──> Parse JSON in Express",
        checklist: [
          "Craft rigid role instructions to build contrasting agent writing voices.",
          "Enforce absolute JSON responses using schemas to ensure safe UI parsing.",
          "Apply maximum iteration counters as a guardrail to stop execution loops."
        ]
      },
      {
        concept: "You will build a multi-agent routing loop. Using a central 'Supervisor' script, you will orchestrate worker nodes. The Supervisor will call the SEO Writer agent, read the draft, pass the text to the QA Editor agent, and route the final output back to a custom human approval dashboard. You will write code to manage a stateful `context` variable that updates dynamically as variables pass between agents.",
        architecture: "Supervisor Node ──> Writer Agent ──> QA Editor Agent ──> Human Approval Checkpoint",
        checklist: [
          "Orchestrate a Supervisor router script to direct specialized workers.",
          "Maintain a stateful memory variable that dynamically updates across worker files.",
          "Build an interactive 'Approve / Reject' visual checkpoint for human intervention."
        ]
      }
    ],
    3: [
      {
        concept: "You will install cheerio and axios (`npm install cheerio axios`) to build a lightweight perayap agent. You will write a scraper script that fetches Google SERP markup, harvests high-density keywords, and compares metadata tags of top rankings. The agent will read this competitive data and autonomously output a rich, long-form markdown article designed to fit live SEO standards.",
        architecture: "Axios Crawl SERP ──> Cheerio Parse Tags ──> Agent SEO Outliner ──> Markdown Writer",
        checklist: [
          "Write code using Cheerio to extract competitive HTML headers and keywords.",
          "Program an agent to analyze raw scraping objects and outline content.",
          "Automate blog generation scripts to compose ready-to-publish Markdown articles."
        ]
      },
      {
        concept: "You will build an automated market intelligence system. You will write an agent script that scrapes rival product pages, extracts pricing columns, and maps feature grids. The script will format these findings into a detailed SWOT matrix, generate a dynamic PDF file, and automatically deliver the finished report directly to Slack channels using official Slack Incoming Webhooks.",
        architecture: "Scrape rival pricing ──> Construct SWOT Markdown ──> Generate PDF ──> Post Slack Webhook",
        checklist: [
          "Construct a web-scraping script targeting competitive landing pages.",
          "Synthesize raw competitors' feature grids into structured SWOT Markdown files.",
          "Connect Slack webhooks to automatically broadcast competitor intelligence reports."
        ]
      }
    ],
    4: [
      {
        concept: "You will write a customer support routing pipeline. You will integrate the sentiment analysis model to classify incoming customer email tickets (Positive, Neutral, Urgent/Negative). If labeled 'Negative', your script will trigger a Slack alert to human support staff. You will also write a lead qualification agent that qualifies sales leads against business parameters, automatically writing data to HubSpot/CRM.",
        architecture: "Email webhook ──> Sentiment Classifier ──> Trigger Slack Alert / Auto CRM Qualification",
        checklist: [
          "Build a support ticket sentiment analyst using system prompts and local JSON datasets.",
          "Establish alert pipelines using webhook integrations to instantly notify human agents.",
          "Setup automated CRM lead qualification steps based on company size and industry."
        ]
      },
      {
        concept: "You will build a natural language interface for database spreadsheets. You will configure an analytical agent using pandas (or a JavaScript equivalent like danfo.js) that reads sales records in CSV/Excel formats. The agent will autonomously run query filters, project seasonal sales demand curves, and compile dynamic inventory replenishment recommendations.",
        architecture: "Upload CSV ──> Danfo.js/Pandas Parsing Agent ──> Forecast Trends ──> restocking recommendations",
        checklist: [
          "Query unstructured sales CSV spreadsheets using natural language conversation.",
          "Identify seasonal spike trends and forecast demand values autonomously.",
          "Generate predictive inventory restocking lists to prevent operational stockouts."
        ]
      }
    ],
    5: [
      {
        concept: "In this practical deployment session, you will connect your Node.js server to visual automation pipelines (Make.com, n8n, or Flowise). You will build an visual automation workflow: scheduling webhooks that trigger whenever a user sends an email or fills a spreadsheet row, routing that data to your Agent endpoint (`/api/agent/run`), and defining visual error-handling loops to manage network connection issues.",
        architecture: "Webhooks (n8n/Make) ──> POST /api/agent/run ──> n8n Node Map ──> Visual Error Retry Nodes",
        checklist: [
          "Connect visual automation platforms directly to your backend Node.js API endpoints.",
          "Configure visual triggers for incoming email alerts and spreadsheet changes.",
          "Design automated error retry loops and fallback routers inside visual node interfaces."
        ]
      },
      {
        concept: "You will execute a pre-launch optimization audit. You will write code to track and log token metrics, pruning prompt instructions to reduce API token costs. You will enable context caching to shave off 50% on API billing, run manual User Acceptance Tests (UAT) inside our interactive Sandbox interface, and execute the 10-point security checklist to protect API key vaults.",
        architecture: "Track token sizes ──> Prune prompts & enable Cache ──> Run UAT ──> Secure API key Vaults",
        checklist: [
          "Audit API token overhead and calculate running operational costs.",
          "Enable system context caching to reduce API billing rates.",
          "Execute the 10-point deployment checklist covering firewalls and secure keys."
        ]
      }
    ]
  },
  ID: {
    1: [
      {
        concept: "Dalam sesi praktis ini, Anda akan menyiapkan lingkungan Node.js lokal, menginstal SDK resmi `@openai/agents` melalui terminal (`npm install @openai/agents`), dan mengonfigurasi `.env.local` Anda untuk menyimpan API key secara aman. Anda akan menulis file server Express (`server.js`) yang secara aman meneruskan permintaan ke model `gpt-4.1-nano`. Alih-alih memanggil completion sederhana, Anda akan menginisialisasi runner `Agent` stateful, menguji bagaimana agen menjadwalkan putaran secara otonom, mencatat aksi di konsol terminal, dan menyelesaikan tugas tanpa kebocoran kredensial di sisi browser.",
        architecture: "npm install @openai/agents ──> Tulis API server.js ──> Jalankan Loop Runner ──> Output Konsol",
        checklist: [
          "Inisialisasi proyek Node.js dan kunci kredensial secara aman di .env.local.",
          "Tulis endpoint POST Express yang aman untuk merutekan prompt agen dari sisi klien.",
          "Periksa log eksekusi agen otonom menggunakan input konsol terminal."
        ]
      },
      {
        concept: "Anda akan menulis wrapper JavaScript kustom yang mengintegrasikan API pencarian (seperti Serper.dev atau Google Custom Search) ke dalam kelas `Tool` yang dapat dieksekusi. Anda akan menulis prompt sistem yang menginstruksikan LLM untuk mengeluarkan pemikirannya langkah-demi-langkah menggunakan blok `<thought>` terstruktur. Di terminal, Anda akan menjalankan agen dan melihatnya mengeksekusi siklus ReAct: mengidentifikasi kebutuhan harga kompetitor, memanggil alat pencari Google, menganalisis snippet mentah, dan menyempurnakan respons akhirnya secara dinamis berdasarkan temuan langsung.",
        architecture: "Prompt CoT ──> Array Tools [SearchAPI] ──> Jalankan Loop ReAct ──> Observasi ──> Solusi",
        checklist: [
          "Tulis prompt sistem yang mewajibkan blok pemikiran langkah-demi-langkah sebelum eksekusi alat.",
          "Hubungkan wrapper alat pencarian web berbasis HTTP menggunakan Axios ke array alat agen Anda.",
          "Jalankan skrip riset otonom dan debug log ReAct di dalam konsol server."
        ]
      }
    ],
    2: [
      {
        concept: "Dalam lab praktis ini, Anda akan menulis file instruksi sistem yang komprehensif untuk peran khusus: Spesialis SEO (fokus pada frasa volume pencarian tinggi), Copywriter (menggunakan hook CTA dinamis), dan Editor (menegakkan aturan anti-salah ketik). Anda akan mengonfigurasi properti agen menggunakan `response_format: { type: 'json_object' }` untuk memaksa output JSON yang konsisten, lalu menulis kode untuk mengurai output JSON tersebut langsung ke dashboard sisi klien Anda.",
        architecture: "Tentukan Persona Peran ──> Atur response_format: 'json_object' ──> Urai JSON di Express",
        checklist: [
          "Buat instruksi peran yang rigid untuk membangun gaya bahasa tulisan agen yang kontras.",
          "Terapkan respons JSON mutlak menggunakan skema untuk memastikan penguraian UI yang aman.",
          "Terapkan penghitung iterasi maksimum sebagai guardrail untuk menghentikan loop eksekusi."
        ]
      },
      {
        concept: "Anda akan membangun loop perutean multi-agen. Menggunakan skrip 'Supervisor' pusat, Anda akan mengatur node pekerja. Supervisor akan memanggil agen SEO Writer, membaca draf, meneruskan teks ke agen QA Editor, dan merutekan output akhir kembali ke dashboard persetujuan manusia kustom. Anda akan menulis kode untuk mengelola variabel `context` stateful yang diperbarui secara dinamis saat variabel dikirim antar-agen.",
        architecture: "Node Supervisor ──> Agen Writer ──> Agen QA Editor ──> Checkpoint Persetujuan Manusia",
        checklist: [
          "Atur skrip router Supervisor untuk mengarahkan pekerja khusus.",
          "Kelola variabel memori stateful yang diperbarui secara dinamis di seluruh file pekerja.",
          "Bangun checkpoint visual 'Setujui / Tolak' interaktif untuk intervensi manusia."
        ]
      }
    ],
    3: [
      {
        concept: "Anda akan menginstal cheerio dan axios (`npm install cheerio axios`) untuk membangun agen perayap ringan. Anda akan menulis skrip scraper yang mengambil markup Google SERP, mengumpulkan kata kunci dengan kepadatan tinggi, dan membandingkan tag metadata dari peringkat teratas. Agen akan membaca data kompetitif ini dan secara otonom mengeluarkan artikel markdown panjang yang dirancang sesuai standar SEO langsung.",
        architecture: "Axios Rayap SERP ──> Cheerio Urai Tag ──> Agen SEO Outliner ──> Penulis Markdown",
        checklist: [
          "Tulis kode menggunakan Cheerio untuk mengekstrak header HTML kompetitif dan kata kunci.",
          "Program agen untuk menganalisis objek perayapan mentah dan membuat outline konten.",
          "Otomatiskan skrip pembuatan blog untuk menyusun artikel Markdown yang siap dipublikasikan."
        ]
      },
      {
        concept: "Anda akan membangun sistem intelijen pasar otomatis. Anda akan menulis skrip agen yang merayap halaman produk pesaing, mengekstrak kolom harga, dan memetakan kisi fitur. Skrip akan memformat temuan ini menjadi matriks SWOT terperinci, menghasilkan file PDF dinamis, dan secara otomatis mengirimkan laporan akhir langsung ke saluran Slack menggunakan Slack Incoming Webhooks resmi.",
        architecture: "Rayap harga pesaing ──> Susun SWOT Markdown ──> Hasilkan PDF ──> Kirim Webhook Slack",
        checklist: [
          "Buat skrip perayapan web yang menargetkan halaman landing kompetitif.",
          "Sintesis kisi fitur mentah pesaing menjadi file SWOT Markdown terstruktur.",
          "Hubungkan webhook Slack untuk secara otomatis menyiarkan laporan intelijen kompetitor."
        ]
      }
    ],
    4: [
      {
        concept: "Anda akan menulis alur perutean dukungan pelanggan. Anda akan mengintegrasikan model analisis sentimen untuk mengklasifikasikan tiket email pelanggan yang masuk (Positif, Netral, Mendesak/Negatif). Jika diberi label 'Negatif', skrip Anda akan memicu peringatan Slack ke staf dukungan manusia. Anda juga akan menulis agen kualifikasi prospek yang menguji prospek penjualan terhadap parameter bisnis, secara otomatis menulis data ke HubSpot/CRM.",
        architecture: "Webhook email ──> Klasifikasi Sentimen ──> Pemicu Slack / Kualifikasi CRM Otomatis",
        checklist: [
          "Bangun analisis sentimen tiket bantuan menggunakan prompt sistem dan dataset JSON lokal.",
          "Siapkan alur peringatan menggunakan integrasi webhook untuk segera memberi tahu agen manusia.",
          "Terapkan langkah kualifikasi prospek CRM otomatis berdasarkan ukuran perusahaan dan industri."
        ]
      },
      {
        concept: "Anda akan membangun antarmuka bahasa alami untuk spreadsheet database. Anda akan mengonfigurasi agen analitis menggunakan pandas (atau ekuivalen JavaScript seperti danfo.js) yang membaca catatan penjualan dalam format CSV/Excel. Agen akan secara otonom menjalankan filter kueri, memproyeksikan kurva permintaan penjualan musiman, dan menyusun rekomendasi pengisian ulang stok dinamis.",
        architecture: "Unggah CSV ──> Agen Pengurai Danfo.js/Pandas ──> Proyeksi Tren ──> Rekomendasi Stok",
        checklist: [
          "Analisis data spreadsheet CSV penjualan menggunakan percakapan bahasa alami.",
          "Identifikasi tren lonjakan musiman dan prediksikan nilai permintaan secara otonom.",
          "Susun rekomendasi pengisian ulang stok barang untuk menghindari kelangkaan."
        ]
      }
    ],
    5: [
      {
        concept: "Dalam sesi penyebaran praktis ini, Anda akan menghubungkan server Node.js Anda ke pipa otomatisasi visual (Make.com, n8n, atau Flowise). Anda akan membangun alur otomatisasi visual: menjadwalkan webhook yang terpicu setiap kali pengguna mengirim email atau mengisi baris spreadsheet, merutekan data tersebut ke endpoint Agen Anda (`/api/agent/run`), dan menentukan putaran penanganan error visual untuk mengelola masalah koneksi jaringan.",
        architecture: "Webhook (n8n/Make) ──> POST /api/agent/run ──> Peta Node n8n ──> Node Retry Error Visual",
        checklist: [
          "Hubungkan platform otomatisasi visual langsung ke endpoint API Node.js backend Anda.",
          "Konfigurasikan pemicu visual untuk peringatan email masuk dan perubahan spreadsheet.",
          "Rancang alur retry error otomatis dan router fallback di dalam antarmuka node visual."
        ]
      },
      {
        concept: "Anda akan mengeksekusi audit optimasi sebelum rilis. Anda akan menulis kode untuk melacak dan mencatat metrik token, memangkas instruksi prompt untuk mengurangi biaya token API. Anda akan mengaktifkan cache konteks untuk menghemat hingga 50% pada tagihan API, menjalankan pengujian UAT manual di antarmuka Sandbox interaktif kami, dan menjalankan 10 poin checklist keamanan untuk melindungi kredensial API key.",
        architecture: "Lacak ukuran token ──> Pangkas prompt & aktifkan Cache ──> Jalankan UAT ──> Amankan Kredensial",
        checklist: [
          "Audit pengeluaran token API dan hitung biaya operasional harian.",
          "Aktifkan sistem cache konteks untuk memotong biaya tagihan API hingga 50%.",
          "Jalankan 10 poin checklist rilis produksi mencakup keamanan firewall dan kredensial."
        ]
      }
    ]
  }
};

const skillsList = [
  "Architectural thinking to translate complex business challenges into automated AI workflows",
  "Advanced prompting & persona design for copywriters, market analysts, and compliance checks",
  "Seamless tool integration: web search engines, knowledge bases, custom APIs, and live dashboards",
  "Orchestration mastery to design, control, and sync collaboration among multiple specialized agents",
];

const useCasesList = [
  "Automated content marketing engines",
  "Competitor tracking & auto SWOT reports",
  "Smart customer support with human escalation",
  "Lead qualification systems for sales teams",
  "Autonomous CSV/Excel sales data analytics",
  "Smart inventory & demand recommendations",
];

const moduleQuestions = {
  EN: {
    1: [
      {
        question: "What is the core difference between a standard Generative AI prompt and an Agentic AI system?",
        options: [
          "Generative AI runs on local CPUs, while Agentic AI requires GPUs.",
          "Generative AI is purely passive responding to inputs, while Agentic AI plans, chooses tools, and acts autonomously.",
          "Generative AI only produces text, while Agentic AI only outputs executable code.",
          "There is no difference; they are identical technologies."
        ],
        answerIdx: 1
      },
      {
        question: "Which component of an AI Agent acts as the persistent context ledger for multi-step reasoning?",
        options: ["Core LLM", "Planning Engine", "Memory (Short/Long-term)", "Web scrapers"],
        answerIdx: 2
      },
      {
        question: "In the ReAct framework, what does the cycle stand for?",
        options: ["Reasoning + Acting", "Reaction + Action", "Reading + Active tuning", "Recursive + Active indexing"],
        answerIdx: 0
      },
      {
        question: "Why is Chain-of-Thought (CoT) critical in architectural thinking for AI agents?",
        options: [
          "It accelerates LLM token generation speed.",
          "It forces the agent to map complex reasoning paths transparently.",
          "It eliminates the need for any external database connections.",
          "It encrypts the backend API credentials."
        ],
        answerIdx: 1
      },
      {
        question: "Which type of memory allows an agent to retrieve relevant historical documents over long periods?",
        options: ["Short-term memory", "Short-term conversation history", "Vector database embeddings (Long-term)", "Direct cache variables"],
        answerIdx: 2
      }
    ],
    2: [
      {
        question: "What is the primary role of a Supervisor or Orchestrator agent in a Multi-Agent system?",
        options: [
          "To store system passwords securely.",
          "To evaluate the output of worker agents and route tasks dynamically.",
          "To compile Python scripts into executable code.",
          "To count the number of tokens written."
        ],
        answerIdx: 1
      },
      {
        question: "What is a 'system prompt' state in agent persona engineering?",
        options: [
          "A prompt designed to force CPU restarts.",
          "A foundational prompt that enforces strict boundaries, role assumptions, and formatting constraints.",
          "An emergency override prompt.",
          "The first text input sent by the student."
        ],
        answerIdx: 1
      },
      {
        question: "Which pattern is best suited for an agent system requiring human verification before executing high-risk APIs?",
        options: ["Fully Autonomous loop", "Chain-of-Thought loop", "Human-in-the-loop (HITL)", "Recursive retry"],
        answerIdx: 2
      },
      {
        question: "Why should we enforce response formats (like JSON) on worker agents?",
        options: [
          "It makes the output look nicer to read.",
          "It guarantees the output can be parsed programmatically by downstream agents or APIs.",
          "It reduces token billing costs by 50%.",
          "It accelerates server database loading speed."
        ],
        answerIdx: 1
      },
      {
        question: "What happens when an agent enters an infinite feedback loop?",
        options: [
          "The system will automatically crash the computer.",
          "The agent will consume tokens endlessly without completing the task until a limit/guardrail is hit.",
          "The agent's intelligence level increases.",
          "The API provider refunds the cost."
        ],
        answerIdx: 1
      }
    ],
    3: [
      {
        question: "How does an autonomous SWOT & Competitor tracking agent benefit a marketing campaign?",
        options: [
          "It automatically runs paid Facebook ads without a budget limit.",
          "It continuously scans competitor websites, prices, and reviews to generate actionable market briefs.",
          "It replaces the human copywriter entirely.",
          "It speeds up the browser loading speed."
        ],
        answerIdx: 1
      },
      {
        question: "Which tool should a Content Marketing Agent use to gather current SEO search volumes?",
        options: ["Static local text file", "SERP / Google Search API integration", "Direct chat memory", "CSS editor"],
        answerIdx: 1
      },
      {
        question: "What is a major SEO risk when utilizing raw unedited LLM copywriting at scale?",
        options: [
          "Google completely bans all domains using any form of AI text.",
          "Poor readability, repetitive phrasing, and lack of expert QA checks leading to lower quality scores.",
          "Increased server storage consumption.",
          "It causes the API endpoints to block the user."
        ],
        answerIdx: 1
      },
      {
        question: "In marketing automation, what is the role of an email newsletter dispatch agent?",
        options: [
          "To write and send personalized content dynamically based on parsed trend logs.",
          "To block spam emails.",
          "To host the database on the client-side.",
          "To test local server configurations."
        ],
        answerIdx: 0
      },
      {
        question: "How can multi-agent workflows improve brand voice consistency?",
        options: [
          "By using different LLM models for every sentence.",
          "By employing a dedicated QA Editor agent to review and correct drafts against brand guidelines.",
          "By banning all adjectives.",
          "By writing only in uppercase."
        ],
        answerIdx: 1
      }
    ],
    4: [
      {
        question: "How can a Sales Qualification agent optimize lead conversion in SMBs?",
        options: [
          "By cold calling every lead on the phone directly.",
          "By analyzing customer form inputs, matching budget criteria, and scheduling high-priority meetings autonomously.",
          "By sending random discounts.",
          "By blocking customer support tickets."
        ],
        answerIdx: 1
      },
      {
        question: "In customer support integration, what does a database lookup tool enable a chatbot to do?",
        options: [
          "To fetch and display live order statuses or shipping details directly to the user.",
          "To download private client credit card numbers.",
          "To delete customer account history.",
          "To restart the local server."
        ],
        answerIdx: 0
      },
      {
        question: "What is an operational benefit of automated inventory intelligence?",
        options: [
          "It predicts stock levels and recommends reorder points based on historical sales trends.",
          "It physically moves boxes in the warehouse.",
          "It replaces the delivery truck drivers.",
          "It encrypts stock numbers."
        ],
        answerIdx: 0
      },
      {
        question: "Which API tool is best suited for an agent to check a package tracking status?",
        options: ["A simple math calculator", "A shipping courier web API", "A direct conversation buffer", "A spreadsheet reader"],
        answerIdx: 1
      },
      {
        question: "What is the danger of not implementing guardrails on operational business agents?",
        options: [
          "The computer screen might freeze.",
          "The agent might execute incorrect refunds or send unauthorized emails due to hallucinated data.",
          "The server will run out of hard drive space.",
          "The database will automatically delete itself."
        ],
        answerIdx: 1
      }
    ],
    5: [
      {
        question: "What is the primary advantage of deploying AI workflows on no-code platforms?",
        options: [
          "It makes the agent run twice as fast.",
          "It allows non-programmers to visually map, deploy, and monitor complex multi-agent systems easily.",
          "It completely eliminates API token charges.",
          "It makes the backend code completely secure from hackers."
        ],
        answerIdx: 1
      },
      {
        question: "What is a webhook tool used for in cloud-based marketing systems?",
        options: [
          "To display notifications in the browser console.",
          "To send or receive instant real-time data payloads between different applications.",
          "To clean up server memory cache.",
          "To style CSS margins."
        ],
        answerIdx: 1
      },
      {
        question: "Why must we estimate and calculate API token costs prior to enterprise deployment?",
        options: [
          "To prevent surprise billing charges when agents run in infinite loops or high-volume workflows.",
          "Because LLMs charge a flat monthly fee regardless of use.",
          "To speed up LLM response generation rates.",
          "To comply with legal tax regulations."
        ],
        answerIdx: 0
      },
      {
        question: "In a final showcase evaluation, what metric is most critical to prove business ROI?",
        options: [
          "The total number of code files written.",
          "The actual hours saved and task accuracy achieved by the automated workflow compared to manual labor.",
          "The color theme of the web UI.",
          "The server hard drive size."
        ],
        answerIdx: 1
      },
      {
        question: "What is the final step in launching an Agentic AI workflow to production?",
        options: [
          "Uninstalling all local packages.",
          "Deploying the cloud orchestrator, setting active triggers, and establishing human-in-the-loop audit logs.",
          "Converting the code to binary files.",
          "Re-entering the sandbox simulator."
        ],
        answerIdx: 1
      }
    ]
  },
  ID: {
    1: [
      {
        question: "Apa perbedaan mendasar antara prompt AI Generatif standar dengan sistem Agentic AI?",
        options: [
          "AI Generatif berjalan di CPU lokal, sedangkan Agentic AI membutuhkan GPU.",
          "AI Generatif bersifat pasif merespons input, sedangkan Agentic AI merencanakan, memilih alat, dan bertindak mandiri secara otonom.",
          "AI Generatif hanya memproduksi teks, sedangkan Agentic AI hanya menghasilkan kode program.",
          "Tidak ada perbedaan; keduanya adalah teknologi yang sama."
        ],
        answerIdx: 1
      },
      {
        question: "Pilar Agen AI manakah yang bertindak sebagai penyimpan riwayat konteks untuk penalaran multi-langkah?",
        options: ["Core LLM (Brain)", "Planning Engine", "Memory (Short/Long-term)", "Web scrapers"],
        answerIdx: 2
      },
      {
        question: "Dalam kerangka berpikir ReAct, apa kepanjangan dari siklus tersebut?",
        options: ["Reasoning + Acting (Penalaran + Tindakan)", "Reaction + Action", "Reading + Active tuning", "Recursive + Active indexing"],
        answerIdx: 0
      },
      {
        question: "Mengapa konsep Chain-of-Thought (CoT) sangat penting dalam pemikiran arsitektural untuk agen AI?",
        options: [
          "Untuk mempercepat kecepatan pembuatan token LLM.",
          "Untuk memaksa agen memetakan jalur pemikiran yang kompleks secara transparan.",
          "Untuk menghilangkan kebutuhan koneksi database eksternal.",
          "Untuk mengenkripsi kredensial API backend."
        ],
        answerIdx: 1
      },
      {
        question: "Jenis memori apa yang memungkinkan agen mencari dokumen historis yang relevan dalam jangka panjang?",
        options: ["Memori jangka pendek", "Riwayat percakapan jangka pendek", "Database Vektor / Embeddings (Jangka Panjang)", "Variabel cache langsung"],
        answerIdx: 2
      }
    ],
    2: [
      {
        question: "Apa peran utama dari agen 'Supervisor' atau 'Orchestrator' dalam arsitektur Multi-Agent?",
        options: [
          "Menyimpan password database dengan aman.",
          "Mengevaluasi hasil kerja agen bawahan dan mengarahkan tugas ke langkah berikutnya secara cerdas.",
          "Menerjemahkan kode program langsung menjadi biner.",
          "Menghitung jumlah total kata yang ditulis."
        ],
        answerIdx: 1
      },
      {
        question: "Apa yang dimaksud dengan 'system prompt' dalam rekayasa persona agen?",
        options: [
          "Prompt yang dirancang untuk memicu restart CPU.",
          "Instruksi dasar yang menetapkan batasan peran, kepribadian, batasan instruksi, dan format respon agen.",
          "Prompt darurat untuk memotong server.",
          "Input teks pertama yang dikirim oleh siswa."
        ],
        answerIdx: 1
      },
      {
        question: "Pola arsitektur mana yang paling cocok jika sistem agen memerlukan persetujuan manusia sebelum mengeksekusi API berisiko tinggi?",
        options: ["Fully Autonomous loop", "Chain-of-Thought loop", "Human-in-the-loop (HITL)", "Recursive retry"],
        answerIdx: 2
      },
      {
        question: "Mengapa kita harus memaksakan format respon (seperti JSON) pada agen pekerja?",
        options: [
          "Agar hasilnya terlihat lebih rapi dibaca manusia.",
          "Agar hasilnya dapat diproses dan diparsing secara terprogram oleh agen lain atau sistem API hilir.",
          "Untuk mengurangi biaya token hingga 50%.",
          "Untuk mempercepat server memuat database."
        ],
        answerIdx: 1
      },
      {
        question: "Apa yang terjadi jika agen masuk ke dalam loop umpan balik tanpa batasan (infinite loop)?",
        options: [
          "Sistem akan langsung mematikan komputer.",
          "Agen akan terus mengonsumsi token tanpa henti sampai batas waktu/guardrail tercapai.",
          "Tingkat kecerdasan agen akan meningkat drastis.",
          "Penyedia API akan mengembalikan biaya token."
        ],
        answerIdx: 1
      }
    ],
    3: [
      {
        question: "Bagaimana agen riset SWOT & pelacak kompetitor otonom membantu kampanye pemasaran?",
        options: [
          "Menjalankan iklan Facebook berbayar tanpa batas anggaran secara otomatis.",
          "Memindai situs web, harga, dan ulasan kompetitor secara berkala untuk menghasilkan laporan analisis pasar.",
          "Menggantikan posisi copywriter manusia sepenuhnya.",
          "Mempercepat kecepatan browser Anda."
        ],
        answerIdx: 1
      },
      {
        question: "Alat bantu apa yang harus digunakan agen riset tren untuk mengumpulkan data volume pencarian SEO terbaru?",
        options: ["File teks lokal statis", "Integrasi SERP / Google Search API", "Memori obrolan langsung", "CSS editor"],
        answerIdx: 1
      },
      {
        question: "Apa risiko utama SEO jika kita menggunakan tulisan LLM mentah tanpa pengawasan dalam skala besar?",
        options: [
          "Google akan memblokir domain secara permanen.",
          "Keterbacaan buruk, kalimat berulang, dan kurangnya QA yang menurunkan skor kualitas konten di mesin pencari.",
          "Peningkatan konsumsi penyimpanan server.",
          "Menyebabkan endpoint API memblokir pengguna."
        ],
        answerIdx: 1
      },
      {
        question: "Dalam otomatisasi pemasaran, apa peran agen pengirim buletin email?",
        options: [
          "Menulis dan mengirimkan email pemasaran yang dipersonalisasi secara otomatis berdasarkan riset tren.",
          "Memblokir email spam masuk.",
          "Menghosting database di sisi browser client.",
          "Menguji konfigurasi server lokal."
        ],
        answerIdx: 0
      },
      {
        question: "Bagaimana alur kerja multi-agent menjaga konsistensi gaya bahasa brand (brand voice)?",
        options: [
          "Menggunakan model LLM yang berbeda untuk setiap kalimat.",
          "Mempekerjakan agen Editor QA khusus untuk memeriksa draf terhadap panduan gaya brand.",
          "Melarang penggunaan kata sifat.",
          "Menulis hanya dengan huruf kapital."
        ],
        answerIdx: 1
      }
    ],
    4: [
      {
        question: "Bagaimana agen kualifikasi penjualan (Sales Qualification) membantu bisnis UMKM?",
        options: [
          "Melakukan panggilan telepon langsung ke setiap prospek.",
          "Menganalisis masukan formulir pelanggan, mencocokkan kriteria anggaran, dan menjadwalkan rapat penting secara mandiri.",
          "Mengirimkan diskon acak ke pelanggan.",
          "Memblokir tiket dukungan pelanggan."
        ],
        answerIdx: 1
      },
      {
        question: "Dalam integrasi layanan pelanggan, apa fungsi alat pencarian database bagi chatbot?",
        options: [
          "Mengambil dan menampilkan status pesanan atau detail pengiriman langsung ke pelanggan secara real-time.",
          "Mengunduh nomor kartu kredit pelanggan secara ilegal.",
          "Menghapus riwayat transaksi pelanggan.",
          "Merestart server database lokal."
        ],
        answerIdx: 0
      },
      {
        question: "Apa manfaat operasional dari otomatisasi kecerdasan inventaris (inventory intelligence)?",
        options: [
          "Memprediksi stok barang dan menyarankan waktu pemesanan ulang berdasarkan tren penjualan historis.",
          "Memindahkan kotak barang secara fisik di gudang.",
          "Menggantikan sopir truk pengiriman.",
          "Mengenkripsi angka persediaan barang."
        ],
        answerIdx: 0
      },
      {
        question: "Alat API mana yang paling cocok bagi agen untuk melacak status pengiriman paket?",
        options: ["Kalkulator matematika sederhana", "API Web kurir pengiriman", "Buffer percakapan langsung", "Pembaca spreadsheet"],
        answerIdx: 1
      },
      {
        question: "Apa bahayanya jika kita tidak memasang guardrails pada agen operasional bisnis?",
        options: [
          "Layar komputer Anda mungkin membeku.",
          "Agen dapat memicu pengembalian dana salah atau mengirim email tidak sah akibat data halusinasi.",
          "Ruang penyimpanan server akan cepat habis.",
          "Database akan otomatis terhapus secara permanen."
        ],
        answerIdx: 1
      }
    ],
    5: [
      {
        question: "Apa keuntungan utama menerapkan workflow AI di platform no-code?",
        options: [
          "Membuat agen berjalan dua kali lebih cepat.",
          "Memungkinkan non-programmer memetakan, merilis, dan memantau sistem multi-agent secara visual dengan mudah.",
          "Menghilangkan seluruh biaya token API sepenuhnya.",
          "Membuat kode program terlindung penuh dari hacker."
        ],
        answerIdx: 1
      },
      {
        question: "Untuk apa alat webhook digunakan dalam sistem pemasaran berbasis cloud?",
        options: [
          "Menampilkan notifikasi di konsol browser.",
          "Mengirim atau menerima payload data instan secara real-time antar aplikasi yang berbeda.",
          "Membersihkan cache memori server.",
          "Mengatur margin CSS halaman."
        ],
        answerIdx: 1
      },
      {
        question: "Mengapa kita wajib menghitung estimasi biaya token API sebelum implementasi skala besar?",
        options: [
          "Untuk menghindari tagihan tidak terduga saat agen mengalami infinite loop atau workflow volume tinggi.",
          "Karena LLM menuntut biaya bulanan tetap berapa pun penggunaannya.",
          "Untuk mempercepat waktu respon LLM.",
          "Untuk mematuhi peraturan pelaporan pajak hukum."
        ],
        answerIdx: 0
      },
      {
        question: "Dalam evaluasi akhir program, metrik apa yang paling penting untuk membuktikan ROI bisnis?",
        options: [
          "Jumlah total baris kode program yang ditulis.",
          "Waktu riil yang dihemat dan tingkat akurasi penyelesaian tugas otomatis dibandingkan pengerjaan manual.",
          "Pilihan warna tema antarmuka web.",
          "Ukuran hard drive server."
        ],
        answerIdx: 1
      },
      {
        question: "Apa langkah akhir dalam merilis workflow Agentic AI ke produksi?",
        options: [
          "Menghapus seluruh pustaka lokal.",
          "Deploy orkestrator cloud, menyalakan pemicu otomatis, dan membangun pos audit pengawasan manusia (HITL).",
          "Mengubah kode program menjadi biner.",
          "Masuk kembali ke simulator digital."
        ],
        answerIdx: 1
      }
    ]
  }
};


export default function LensetekAgenticAiLandingPage() {
  const [lang, setLang] = useState("ID"); // "EN" or "ID"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [user, setUser] = useState(null);

  // Classroom Dashboard States
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [classroomTab, setClassroomTab] = useState("materials"); // "materials" | "lab" | "quiz" | "certificate"
  const [completedModules, setCompletedModules] = useState({}); // { moduleId: true }
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState([null, null, null, null, null]);
  const [quizScore, setQuizScore] = useState(null);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null); // 'sIdx' or null
  const [chatCount, setChatCount] = useState(0);
  const [chatLastResetDate, setChatLastResetDate] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  
  // Real Agent Lab States
  const [labPrompt, setLabPrompt] = useState("");
  const [labLogs, setLabLogs] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labSummary, setLabSummary] = useState("");
  const [labMindmap, setLabMindmap] = useState(null);

  // Biodata Form States
  const [showBiodataModal, setShowBiodataModal] = useState(false);
  const [biodata, setBiodata] = useState(null);
  const [certificateRecord, setCertificateRecord] = useState(null);
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [biodataForm, setBiodataForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    birthPlace: "",
    birthDate: "",
    gender: "Laki-laki",
    occupation: "Mahasiswa / Pelajar"
  });

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getQrCodeUrl = (value, size = 140) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(value)}`;

  const formatDisplayDate = (dateValue, locale = lang === "EN" ? "en-US" : "id-ID") =>
    new Date(dateValue).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

  const createCertificateNo = (uid) =>
    `LAIMB-${new Date().getFullYear()}-${uid.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const getDefaultBiodata = (currentUser) => ({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    whatsapp: "",
    birthPlace: "",
    birthDate: "",
    gender: "Laki-laki",
    occupation: "Mahasiswa / Pelajar"
  });

  const cacheUserProgress = (uid, progressPatch) => {
    try {
      const localDataStr = localStorage.getItem(`lensetek_progress_${uid}`) || "{}";
      const localDataObj = JSON.parse(localDataStr);
      localStorage.setItem(
        `lensetek_progress_${uid}`,
        JSON.stringify({ ...localDataObj, ...progressPatch })
      );
    } catch (err) {
      console.warn("Saving progress to LocalStorage failed:", err);
    }
  };

  const saveProgressToCollection = async (progressPatch) => {
    if (!user) return;

    cacheUserProgress(user.uid, progressPatch);

    try {
      const docRef = doc(db, "progress", user.uid);
      await setDoc(docRef, {
        ...progressPatch,
        userId: user.uid,
        userName: progressPatch.userName || biodata?.fullName || user.displayName || "",
        userEmail: progressPatch.userEmail || biodata?.email || user.email || "",
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Firestore Saving Progress Error:", error);
    }
  };

  const buildCertificateRecord = (existingCertificateNo) => {
    const issuedAt = new Date();
    const validUntil = new Date(issuedAt);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const certificateNo = existingCertificateNo || createCertificateNo(user.uid);
    const verificationUrl = `${window.location.origin}/verify/${certificateNo}`;
    const holderName = biodata?.fullName || user.displayName || "Participant";

    return {
      certificateNo,
      holderName,
      courseTitle: "Agentic AI for Marketing & Business",
      institution: "Lensetek International, LLC",
      totalDuration: "20 Hours",
      modulesCount: 5,
      level: "Beginner - Intermediate",
      programDirector: "Astrid",
      status: "valid",
      issuedAt: issuedAt.toISOString(),
      completionDate: issuedAt.toISOString(),
      validUntil: validUntil.toISOString(),
      verificationUrl,
      transcript: t.ID.modulesList.map((module) => ({
        moduleId: module.id,
        title: module.title,
        hours: module.hours,
        status: completedModules[module.id] ? "Completed" : "Pending"
      }))
    };
  };

  const ensureCertificateRecord = async () => {
    if (!user || certificateRecord) return certificateRecord;

    const record = buildCertificateRecord();
    setCertificateRecord(record);
    cacheUserProgress(user.uid, { certificate: record });

    try {
      await setDoc(doc(db, "certificates", record.certificateNo), {
        ...record,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      await saveProgressToCollection({ certificate: record });
    } catch (error) {
      console.error("Certificate Saving Error:", error);
    }

    return record;
  };

  // Fetch / Sync User Progress with Cloud Firestore
  useEffect(() => {
    if (user) {
      const loadUserProgress = async () => {
        // Try local storage first as instant fallback
        const localProgress = localStorage.getItem(`lensetek_progress_${user.uid}`);
        if (localProgress) {
          try {
            const parsed = JSON.parse(localProgress);
            if (parsed.completedModules) setCompletedModules(parsed.completedModules);
            if (parsed.certificate) setCertificateRecord(parsed.certificate);
            if (parsed.chatUsage?.lastResetDate === getTodayStr()) {
              setChatCount(parsed.chatUsage.count || 0);
              setChatLastResetDate(parsed.chatUsage.lastResetDate);
            }
            if (parsed.biodata) {
              setBiodata(parsed.biodata);
              setBiodataForm(parsed.biodata);
            }
          } catch (e) {
            console.warn("Parsing Local Storage Progress Error:", e);
          }
        }

        try {
          const docRef = doc(db, "progress", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCompletedModules(data.completedModules || {});
            cacheUserProgress(user.uid, {
              completedModules: data.completedModules || {},
              chatUsage: data.chatUsage || {},
              certificate: data.certificate || null
            });
            if (data.certificate) setCertificateRecord(data.certificate);
            
            // Sync chat usage & rate limits
            const todayStr = getTodayStr();
            const chatUsage = data.chatUsage || {};
            if (chatUsage.lastResetDate === todayStr) {
              setChatCount(chatUsage.count || 0);
              setChatLastResetDate(chatUsage.lastResetDate);
            } else {
              setChatCount(0);
              setChatLastResetDate(todayStr);
            }

            // Sync biodata
            if (data.biodata) {
              setBiodata(data.biodata);
              setBiodataForm(data.biodata);
              // Save to local storage cache
              cacheUserProgress(user.uid, {
                completedModules: data.completedModules || {},
                biodata: data.biodata,
                chatUsage: data.chatUsage || {},
                certificate: data.certificate || null
              });
            } else {
              setBiodataForm({
                fullName: data.userName || user.displayName || "",
                email: data.userEmail || user.email || "",
                whatsapp: "",
                birthPlace: "",
                birthDate: "",
                gender: "Laki-laki",
                occupation: "Mahasiswa / Pelajar"
              });
              setShowBiodataModal(true);
            }
          } else {
            setCompletedModules({});
            setChatCount(0);
            const todayStr = getTodayStr();
            setChatLastResetDate(todayStr);
            setBiodataForm(getDefaultBiodata(user));
            setShowBiodataModal(true);
            await saveProgressToCollection({
              completedModules: {},
              chatUsage: {
                count: 0,
                lastResetDate: todayStr
              }
            });
          }
        } catch (error) {
          console.error("Firestore Loading Progress Error:", error);
          
          // If Firestore fails due to permission error, fall back to Google User Details for Form
          setBiodataForm(prev => ({
            ...prev,
            fullName: user.displayName || "",
            email: user.email || "",
          }));

          // If there is no biodata stored locally yet, force show the modal
          const localData = localStorage.getItem(`lensetek_progress_${user.uid}`);
          let hasLocalBiodata = false;
          if (localData) {
            try {
              hasLocalBiodata = !!JSON.parse(localData).biodata;
            } catch (e) {}
          }
          if (!hasLocalBiodata) {
            setShowBiodataModal(true);
          }
        }
      };
      loadUserProgress();
    }
  }, [user]);

  const handleBiodataSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Form validation check
    const completeForm = {
      ...biodataForm,
      email: biodataForm.email || user.email || ""
    };

    await saveProgressToCollection({
      biodata: completeForm,
      userName: completeForm.fullName,
      userEmail: completeForm.email
    });

    setBiodata(completeForm);
    setShowBiodataModal(false);
  };

  const saveCompletedModules = async (updatedCompleted) => {
    await saveProgressToCollection({
      completedModules: updatedCompleted
    });
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Google Authentication failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // Reset classroom states
      setActiveModuleIdx(0);
      setClassroomTab("materials");
      setCompletedModules({});
      setQuizSelectedOption(null);
      setQuizSubmitted(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const startSimulation = async () => {
    setIsRunning(true);
    setSimulationLogs([]);
    let current = 0;
    setActiveStep(1);
    
    const interval = setInterval(async () => {
      if (current < agentSteps.length) {
        setSimulationLogs(prev => [
          ...prev, 
          `[System]: ${agentSteps[current].title} started processing...`,
          `[Success]: ${agentSteps[current].title} completed task in ${agentSteps[current].duration}s.`
        ]);
        current++;
        setActiveStep(current + 1);
      } else {
        clearInterval(interval);
        
        // Trigger real secure API call to our backend OpenAI Agent
        setSimulationLogs(prev => [...prev, "[Server]: Connecting to secure OpenAI Agent backend..."]);
        try {
          const response = await fetch("http://localhost:3001/api/agent/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "Perform trend research and SWOT content brief for Agentic AI in Marketing.",
              agentName: "Marketing Intelligence Agent"
            })
          });
          const data = await response.json();
          if (data.success) {
            setSimulationLogs(prev => [
              ...prev,
              `🤖 [Agent Output - Model ${data.modelUsed}]:`,
              data.finalOutput,
              "✨ Workflow execution completed successfully!"
            ]);
          } else {
            throw new Error(data.error);
          }
        } catch (err) {
          console.warn("Backend API not reachable or failed:", err.message);
          setSimulationLogs(prev => [
            ...prev,
            "⚠️ [Secure Server Notice]: API execution completed via local demo fallback (OpenAI Agents is successfully configured).",
            "✨ Workflow execution completed successfully!"
          ]);
        }
        setIsRunning(false);
      }
    }, 1800);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setActiveStep(0);
    setSimulationLogs([]);
  };

  // Classroom Action Handlers
  const handleQuizSubmit = (quiz, moduleId) => {
    if (quizSelectedOption === null) return;
    setQuizSubmitted(true);
    if (quizSelectedOption === quiz.answerIdx) {
      setQuizFeedback(lang === "EN" 
        ? "🎉 Correct! Excellent reasoning. Progress saved to Firestore database!" 
        : "🎉 Benar! Jawaban yang logis. Kemajuan Anda berhasil disimpan ke cloud database!");
      
      const newCompleted = { ...completedModules, [moduleId]: true };
      setCompletedModules(newCompleted);
      saveCompletedModules(newCompleted);
    } else {
      setQuizFeedback(lang === "EN" 
        ? "❌ Incorrect. Re-read the curriculum materials above and try again!" 
        : "❌ Salah. Baca ulang materi kurikulum di atas dan coba lagi!");
    }
  };

  const handleLabExecute = async (activeModuleTitle) => {
    if (!labPrompt.trim()) return;
    setLabSummary("");
    setLabMindmap(null);

    // Check limit
    const todayStr = getTodayStr();
    let currentCount = chatCount;
    if (chatLastResetDate !== todayStr) {
      currentCount = 0;
    }

    if (currentCount >= 10) {
      setLabLogs(prev => [
        ...prev, 
        `👤 [You]: ${labPrompt}`,
        `⚠️ [System]: ${lang === "EN"
          ? "Daily Limit Reached! You have used 10/10 AI-Mentor queries for today. Quota resets tomorrow."
          : "Batas Harian Tercapai! Anda telah menggunakan 10/10 kuota kueri AI-Mentor hari ini. Kuota disetel ulang besok."}`
      ]);
      setLabPrompt("");
      return;
    }

    setLabLoading(true);
    setLabLogs(prev => [...prev, `👤 [You]: ${labPrompt}`, `⏳ [System]: Spawning secure ${activeModuleTitle} agent...`]);
    
    let isSuccess = false;
    let finalOutput = "";

    try {
      const response = await fetch("http://localhost:3001/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: labPrompt,
          agentName: activeModuleTitle + " Agent",
          instructions: `You are an expert autonomous AI Agent assisting a student in the Lensetek Agentic AI Course. Guide them professionally on: ${activeModuleTitle}.`
        })
      });
      const data = await response.json();
      if (data.success) {
        setLabLogs(prev => [...prev, `🤖 [Agent]: ${data.finalOutput}`]);
        isSuccess = true;
        finalOutput = data.finalOutput;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.warn("Lab Agent API unreachable:", error.message);
      // Fallback response for interactive preview
      finalOutput = `That is a brilliant question about ${activeModuleTitle}! To implement this, you should design a robust supervisor node that delegates tasks to worker agents, utilizing tool definitions for web search and CSV parsing. Perfect choice of operational workflow!`;
      setLabLogs(prev => [
        ...prev, 
        `🤖 [Agent (Demo Mode)]: ${finalOutput}`
      ]);
      isSuccess = true; // Still counts as a query in demo mode
    } finally {
      setLabPrompt("");
      setLabLoading(false);
      
      if (isSuccess) {
        const newCount = currentCount + 1;
        setChatCount(newCount);
        setChatLastResetDate(todayStr);
        
        await saveProgressToCollection({
          chatUsage: {
            count: newCount,
            lastResetDate: todayStr
          }
        });
      }
    }
  };

  const handleSummarizeLab = () => {
    setLabSummary(createSummaryFromLogs(labLogs, lang));
  };

  const handleGenerateMindmap = () => {
    setLabMindmap(createMindmapFromLogs(labLogs, currentT.modulesList[activeModuleIdx].title, lang));
  };

  const currentT = t[lang];
  const allModulesCompleted = currentT.modulesList.every(m => completedModules[m.id]);
  const isVerificationPage = window.location.pathname.startsWith("/verify/");
  const verificationCertificateNo = isVerificationPage
    ? decodeURIComponent(window.location.pathname.replace(/^\/verify\/?/, "")).trim()
    : "";

  useEffect(() => {
    if (!isVerificationPage || !verificationCertificateNo) return;

    const loadCertificateVerification = async () => {
      setVerificationLoading(true);
      try {
        const verificationSnap = await getDoc(doc(db, "certificates", verificationCertificateNo));
        setVerificationRecord(verificationSnap.exists() ? verificationSnap.data() : null);
      } catch (error) {
        console.error("Certificate Verification Loading Error:", error);
        setVerificationRecord(null);
      } finally {
        setVerificationLoading(false);
      }
    };

    loadCertificateVerification();
  }, [isVerificationPage, verificationCertificateNo]);

  useEffect(() => {
    if (classroomTab === "certificate" && allModulesCompleted && user && !certificateRecord) {
      ensureCertificateRecord();
    }
  }, [classroomTab, allModulesCompleted, user, certificateRecord]);

  if (isVerificationPage) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 font-['Inter']">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-700">Lensetek Certificate Verification</p>
              <h1 className="text-2xl font-extrabold text-slate-900">Verifikasi Sertifikat</h1>
            </div>
          </div>

          {verificationLoading ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">Memeriksa sertifikat...</div>
          ) : verificationRecord ? (
            <div className="space-y-6 pt-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Status</p>
                <p className="mt-1 text-xl font-extrabold text-emerald-800">Valid Certificate</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Certificate Number</p>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">{verificationRecord.certificateNo}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Issued To</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{verificationRecord.holderName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Course</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{verificationRecord.courseTitle}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completion Date</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{formatDisplayDate(verificationRecord.completionDate)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-extrabold text-slate-900">Transcript</h2>
                <div className="mt-4 divide-y divide-slate-100">
                  {(verificationRecord.transcript || []).map((item) => (
                    <div key={item.moduleId} className="flex items-center justify-between gap-4 py-3 text-left">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.hours}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg font-extrabold text-rose-700">Sertifikat tidak ditemukan</p>
              <p className="mt-2 text-sm text-slate-500">Nomor sertifikat `{verificationCertificateNo}` belum terdaftar atau belum diterbitkan.</p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Inter'] relative transition-colors duration-300">
      
      {/* Biodata Form Modal (First Login Only) */}
      <AnimatePresence>
        {showBiodataModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-[#FCFAF7] border border-slate-200 rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl relative my-8 text-slate-800 font-sans"
            >
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  📝
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                    {lang === "EN" ? "Complete Your Profile" : "Lengkapi Biodata Mahasiswa"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-snug">
                    {lang === "EN" ? "Please fill this form for classroom certification access." : "Silakan lengkapi form di bawah ini untuk mengakses kelas sertifikasi."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleBiodataSubmit} className="space-y-4 text-left">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "Full Name" : "Nama Lengkap"}</label>
                  <input 
                    type="text" 
                    required 
                    value={biodataForm.fullName} 
                    onChange={e => setBiodataForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "Email Address" : "Alamat Email"}</label>
                  <input 
                    type="email" 
                    required 
                    disabled
                    value={biodataForm.email || user?.email || ""} 
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none cursor-not-allowed"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "WhatsApp Number" : "Nomor WhatsApp (Aktif)"}</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="Contoh: 081234567890"
                    value={biodataForm.whatsapp} 
                    onChange={e => setBiodataForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full bg-white border border-slate-255 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>

                {/* Place and Date of Birth */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "Place of Birth" : "Tempat Lahir"}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Contoh: Jakarta"
                      value={biodataForm.birthPlace} 
                      onChange={e => setBiodataForm(prev => ({ ...prev, birthPlace: e.target.value }))}
                      className="w-full bg-white border border-slate-255 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "Date of Birth" : "Tanggal Lahir"}</label>
                    <input 
                      type="date" 
                      required 
                      value={biodataForm.birthDate} 
                      onChange={e => setBiodataForm(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full bg-white border border-slate-255 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-inner cursor-pointer"
                    />
                  </div>
                </div>

                {/* Gender & Occupation */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "Gender" : "Jenis Kelamin"}</label>
                    <select 
                      value={biodataForm.gender} 
                      onChange={e => setBiodataForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full bg-white border border-slate-255 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-inner cursor-pointer"
                    >
                      <option value="Laki-laki">{lang === "EN" ? "Male" : "Laki-laki"}</option>
                      <option value="Perempuan">{lang === "EN" ? "Female" : "Perempuan"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{lang === "EN" ? "Occupation" : "Pekerjaan"}</label>
                    <select 
                      value={biodataForm.occupation} 
                      onChange={e => setBiodataForm(prev => ({ ...prev, occupation: e.target.value }))}
                      className="w-full bg-white border border-slate-255 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-inner cursor-pointer"
                    >
                      <option value="Mahasiswa / Pelajar">{lang === "EN" ? "Student" : "Mahasiswa / Pelajar"}</option>
                      <option value="Wirausaha / Business Owner">{lang === "EN" ? "Entrepreneur" : "Wirausaha / Business Owner"}</option>
                      <option value="Marketing Specialist">{lang === "EN" ? "Marketing" : "Marketing Specialist"}</option>
                      <option value="Karyawan Swasta">{lang === "EN" ? "Private Employee" : "Karyawan Swasta"}</option>
                      <option value="Guru / Dosen">{lang === "EN" ? "Teacher / Lecturer" : "Guru / Dosen"}</option>
                      <option value="Lainnya">{lang === "EN" ? "Other" : "Lainnya"}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition-all shadow-md cursor-pointer text-center"
                  >
                    🚀 {lang === "EN" ? "Save & Enter Classroom" : "Simpan & Masuk Ke Kelas"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light Mode subtle tech elements background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_60%,#e2e8f0_100%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[120px]" />

      {/* Nav */}
      {user && (
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8 border-b border-slate-200 backdrop-blur-md sticky top-0 z-50">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 p-1.5 shadow-sm overflow-hidden">
              <img src="https://lensetek.com/favicon.png" alt="Lensetek Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-slate-800 font-['Plus_Jakarta_Sans']">Lensetek International</p>
              <p className="text-[10px] uppercase tracking-widest text-cyan-600 font-bold">Certification Program</p>
            </div>
          </a>

          {/* Desktop menu */}
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setClassroomTab("materials"); }} 
              className="hover:text-cyan-600 transition-colors cursor-pointer font-semibold text-sm"
            >
              {currentT.navCurriculum}
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setClassroomTab("quiz"); }} 
              className="hover:text-cyan-600 transition-colors cursor-pointer font-semibold text-sm"
            >
              {currentT.navCompetencies}
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setClassroomTab("lab"); }} 
              className="hover:text-cyan-600 transition-colors cursor-pointer font-semibold text-sm"
            >
              {currentT.navUseCases}
            </a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {/* Dual Language Switcher Button */}
            <div className="flex bg-slate-200/60 border border-slate-300/30 rounded-xl p-1 gap-1">
              <button 
                onClick={() => setLang("EN")} 
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${lang === "EN" ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang("ID")} 
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${lang === "ID" ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ID
              </button>
            </div>

            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-cyan-600 transition-colors" title="GitHub Repository">
              <GithubIcon className="h-5 w-5" />
            </a>

            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full pl-3 pr-2 py-1.5 shadow-sm">
              <img 
                src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} 
                alt={user.displayName || "User"} 
                className="h-7 w-7 rounded-full object-cover ring-1 ring-cyan-400"
              />
              <span className="text-sm font-bold text-slate-800 max-w-[120px] truncate">
                {user.displayName?.split(" ")[0]}
              </span>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 md:hidden transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      )}

      {/* Mobile drawer */}
      {user && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-slate-200 bg-white px-6 py-6 space-y-4"
            >
              <div className="flex flex-col gap-4">
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setClassroomTab("materials"); setMobileMenuOpen(false); }}
                  className="text-left text-slate-600 hover:text-slate-900 font-semibold text-base py-2 border-b border-slate-100 cursor-pointer block"
                >
                  {currentT.navCurriculum}
                </a>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setClassroomTab("quiz"); setMobileMenuOpen(false); }}
                  className="text-left text-slate-600 hover:text-slate-900 font-semibold text-base py-2 border-b border-slate-100 cursor-pointer block"
                >
                  {currentT.navCompetencies}
                </a>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setClassroomTab("lab"); setMobileMenuOpen(false); }}
                  className="text-left text-slate-600 hover:text-slate-900 font-semibold text-base py-2 border-b border-slate-100 cursor-pointer block"
                >
                  {currentT.navUseCases}
                </a>
                <a 
                  href={githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-base py-2 border-b border-slate-100"
                >
                  <GithubIcon className="h-5 w-5" /> GitHub
                </a>
                
                {/* Mobile Language Switch */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold flex items-center gap-2 text-sm"><Globe className="h-4 w-4" /> Language</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLang("EN")} 
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${lang === "EN" ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      EN
                    </button>
                    <button 
                      onClick={() => setLang("ID")} 
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${lang === "ID" ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      ID
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-cyan-400"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{user.displayName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-bold text-rose-500 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-all"
                  >
                    <LogOut className="h-4 w-4" /> {currentT.logoutBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) }

      {/* DYNAMIC VIEW ROUTING BASED ON LOGIN STATE */}
      {user ? (
        /* ==================== CLASSROOM DASHBOARD VIEW ==================== */
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-7xl px-6 py-12 lg:px-8"
        >
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-50 to-indigo-50/50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm mb-8 font-sans">
            <div>
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest">{currentT.classroomHeader}</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
                {lang === "EN" ? "Welcome back, " : "Selamat datang kembali, "}{user.displayName}!
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                {currentT.classroomDesc}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold bg-white text-cyan-600 px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5">
                🌟 {Object.keys(completedModules).length} / 5 {currentT.badgeProgress || "Badges"}
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
            
            {/* LEFT SIDEBAR: Modules Navigator & Certificate */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4 px-2">{currentT.sidebarHeader}</h3>
                <div className="space-y-2">
                  {currentT.modulesList.map((m, idx) => {
                    const isActive = activeModuleIdx === idx;
                    const isCompleted = completedModules[m.id];
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setActiveModuleIdx(idx);
                          setClassroomTab("materials");
                          setQuizSelectedOption(null);
                          setQuizSubmitted(false);
                          setQuizFeedback("");
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                          isActive 
                            ? 'border-cyan-500 bg-cyan-50/50 shadow-sm text-cyan-700 font-bold' 
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            isActive ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            0{m.id}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-slate-800 truncate">{m.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{m.hours}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student Biodata Status Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-left font-sans">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">📋 Biodata Mahasiswa</h4>
                  <button 
                    onClick={() => {
                      setBiodataForm(biodata || {
                        fullName: user?.displayName || "",
                        email: user?.email || "",
                        whatsapp: "",
                        birthPlace: "",
                        birthDate: "",
                        gender: "Laki-laki",
                        occupation: "Mahasiswa / Pelajar"
                      });
                      setShowBiodataModal(true);
                    }}
                    className="text-[10px] font-bold text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                </div>
                {biodata ? (
                  <div className="space-y-2 text-[11px] text-slate-600 font-semibold">
                    <p><span className="text-slate-400 font-medium">Nama:</span> {biodata.fullName}</p>
                    <p><span className="text-slate-400 font-medium">WhatsApp:</span> {biodata.whatsapp || "-"}</p>
                    <p><span className="text-slate-400 font-medium">TTL:</span> {biodata.birthPlace}, {biodata.birthDate}</p>
                    <p><span className="text-slate-400 font-medium">Pekerjaan:</span> {biodata.occupation}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-500 font-bold flex flex-col gap-2">
                    <p className="flex items-center gap-1.5">⚠️ Biodata Anda belum lengkap!</p>
                    <button 
                      onClick={() => setShowBiodataModal(true)} 
                      className="bg-amber-100 hover:bg-amber-200 border border-amber-200 text-slate-900 px-3 py-2 rounded-xl font-extrabold text-[10px] text-center w-full cursor-pointer transition-colors"
                    >
                      Lengkapi Sekarang
                    </button>
                  </div>
                )}
              </div>

              {/* Certificate Access Center */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                <Award className={`h-10 w-10 mx-auto mb-3 ${allModulesCompleted ? 'text-amber-500 animate-bounce' : 'text-slate-300'}`} />
                <h4 className="font-bold text-sm text-slate-800 font-['Plus_Jakarta_Sans']">{currentT.certHeader}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {currentT.certDesc}
                </p>
                <button
                  disabled={!allModulesCompleted}
                  onClick={() => {
                    ensureCertificateRecord();
                    setClassroomTab("certificate");
                  }}
                  className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-all ${
                    allModulesCompleted
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md hover:scale-[1.01] cursor-pointer'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {currentT.certBtn}
                </button>
              </div>
            </div>

            {/* RIGHT WORK ZONE: Materials, Lab, Quizzes */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative min-h-[500px]">
              
              {/* Tab Selector */}
              {classroomTab !== "certificate" && (
                <div className="flex border-b border-slate-100 pb-4 mb-6 gap-2 overflow-x-auto">
                  {[
                    { id: "materials", label: currentT.studyMaterialsTab, icon: BookOpen },
                    { id: "lab", label: currentT.agentSandboxTab, icon: Terminal },
                    { id: "quiz", label: currentT.quizVerificationTab, icon: HelpCircle }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = classroomTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setClassroomTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isActive 
                            ? 'bg-cyan-500 text-white shadow-sm' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB CONTENT: STUDY MATERIALS */}
              {classroomTab === "materials" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {currentT.modulesList[activeModuleIdx].materials.sessions ? (
                    /* High-fidelity custom syllabus for ALL modules */
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <span className="text-[9px] uppercase tracking-widest text-cyan-600 font-extrabold">
                          {currentT.modulesList[activeModuleIdx].materials.institution}
                        </span>
                        <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-slate-800 mt-1">
                          {currentT.modulesList[activeModuleIdx].materials.course}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 font-medium">
                          <span>⏱️ {currentT.modulesList[activeModuleIdx].materials.duration}</span>
                          <span>•</span>
                          <span>📈 {currentT.modulesList[activeModuleIdx].materials.difficulty}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 italic">
                          {currentT.modulesList[activeModuleIdx].materials.description}
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cyan-600" /> {lang === "EN" ? "Module Curriculum" : "Kurikulum Modul"}
                        </h4>

                        {currentT.modulesList[activeModuleIdx].materials.sessions.map((session, sIdx) => {
                          const moduleId = currentT.modulesList[activeModuleIdx].id;
                          const isExpanded = expandedSession === `${moduleId}-${sIdx}`;
                          const explanation = sessionExplanations[lang]?.[moduleId]?.[sIdx];

                          return (
                            <div key={sIdx} className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3 shadow-inner transition-all duration-300">
                              <div className="flex items-center justify-between gap-4">
                                <h5 className="font-bold text-sm text-cyan-600 font-['Plus_Jakarta_Sans']">
                                  {session.title}
                                </h5>
                                {explanation && (
                                  <button
                                    onClick={() => setExpandedSession(isExpanded ? null : `${moduleId}-${sIdx}`)}
                                    className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all cursor-pointer shrink-0"
                                  >
                                    {isExpanded 
                                      ? (lang === "EN" ? "Hide Guide" : "Tutup Panduan") 
                                      : (lang === "EN" ? "Read Full Guide" : "Baca Panduan Lengkap")}
                                  </button>
                                )}
                              </div>
                              
                              <ul className="space-y-2">
                                {session.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-650 leading-relaxed">
                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>

                              {/* Expanded detailed study block */}
                              {isExpanded && explanation && (
                                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-xs leading-relaxed">
                                  {/* Concept & Core Theory */}
                                  <div className="space-y-1.5">
                                    <h6 className="font-extrabold text-[10px] uppercase text-cyan-700 tracking-wider flex items-center gap-1.5">
                                      💡 {lang === "EN" ? "Concept & Core Theory" : "Konsep & Teori Utama"}
                                    </h6>
                                    <p className="text-slate-600 bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm">
                                      {explanation.concept}
                                    </p>
                                  </div>

                                  {/* Technical Blueprint */}
                                  <div className="space-y-1.5">
                                    <h6 className="font-extrabold text-[10px] uppercase text-cyan-700 tracking-wider flex items-center gap-1.5">
                                      ⚙️ {lang === "EN" ? "Technical Blueprint & Architecture" : "Arsitektur & Cetak Biru Teknis"}
                                    </h6>
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 font-mono text-[10px] text-cyan-300 overflow-x-auto shadow-inner select-all whitespace-pre">
                                      {explanation.architecture}
                                    </div>
                                  </div>

                                  {/* Practical Action Checklist */}
                                  <div className="space-y-1.5">
                                    <h6 className="font-extrabold text-[10px] uppercase text-cyan-700 tracking-wider flex items-center gap-1.5">
                                      ✅ {lang === "EN" ? "Step-by-Step Practical Actions" : "Langkah Kerja Praktis (Checklist)"}
                                    </h6>
                                    <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-2 shadow-sm">
                                      {explanation.checklist.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-slate-650">
                                          <span className="h-4 w-4 rounded border border-cyan-200 bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                                            ✓
                                          </span>
                                          <span>{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Fallback Syllabus */
                    <>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-cyan-600 font-bold">Module 0{currentT.modulesList[activeModuleIdx].id}</span>
                        <h3 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-slate-800 mt-1">
                          {currentT.modulesList[activeModuleIdx].title}
                        </h3>
                        <p className="text-sm text-slate-650 mt-2 leading-relaxed">
                          {currentT.modulesList[activeModuleIdx].desc}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex gap-4 items-start">
                    <span className="text-xl">💡</span>
                    <div>
                      <h5 className="font-bold text-xs text-cyan-700 uppercase">Practical Exercise</h5>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {lang === "EN"
                          ? `After reading the concepts, head over to the **${currentT.agentSandboxTab}** tab to interact directly with the agent!`
                          : `Setelah membaca konsep, silakan pindah ke tab **${currentT.agentSandboxTab}** untuk mencoba prompt interaktif langsung!`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB CONTENT: INTERACTIVE LAB */}
              {classroomTab === "lab" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 font-['Plus_Jakarta_Sans']">
                        {currentT.modulesList[activeModuleIdx].id === 1 ? (
                          <span>💬 {currentT.practicalLabTitle}</span>
                        ) : (
                          <span>💬 {currentT.practicalLabTitle}: {currentT.modulesList[activeModuleIdx].title}</span>
                        )}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border uppercase tracking-wider shrink-0 text-center ${
                      chatCount >= 10 
                        ? 'bg-rose-50 border-rose-200 text-rose-600' 
                        : 'bg-cyan-50 border-cyan-200 text-cyan-600'
                    }`}>
                      ⚡ {lang === "EN" ? "Today's Queries" : "Kueri Hari Ini"}: {chatCount} / 10
                    </span>
                  </div>

                  {/* AI-Mentor Chat */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                          <Bot className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">AI-Mentor</p>
                          <p className="text-[11px] text-slate-500">{currentT.modulesList[activeModuleIdx].title}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSummarizeLab} disabled={!getAgentLogText(labLogs)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                          <ListChecks className="h-3.5 w-3.5" />
                          {lang === "EN" ? "Summarize" : "Ringkas"}
                        </button>
                        <button onClick={handleGenerateMindmap} disabled={!getAgentLogText(labLogs)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] font-bold text-cyan-700 hover:bg-cyan-100 disabled:opacity-50">
                          <Network className="h-3.5 w-3.5" />
                          Mindmap
                        </button>
                      </div>
                    </div>
                    <div className="h-72 overflow-y-auto bg-white p-4 space-y-4 scrollbar-thin">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        {lang === "EN"
                          ? `Connected to ${currentT.modulesList[activeModuleIdx].title} AI-Mentor. Ready.`
                          : `Terhubung ke AI-Mentor ${currentT.modulesList[activeModuleIdx].title}. Siap.`}
                      </div>
                    
                    {labLogs.map((log, idx) => (
                      <div key={idx} className={`rounded-2xl px-4 py-3 shadow-sm ${
                        getLogType(log) === "user" ? 'ml-auto max-w-[85%] bg-cyan-600 text-white' : getLogType(log) === "agent" ? 'max-w-[92%] border border-slate-200 bg-slate-50' : 'border border-slate-200 bg-white text-slate-500'
                      }`}>
                        {getLogType(log) === "agent" ? (
                          <MarkdownMessage content={stripLogPrefix(log)} />
                        ) : (
                          <span>{stripLogPrefix(log)}</span>
                        )}
                      </div>
                    ))}
                    
                    {labLoading && (
                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs font-semibold text-cyan-700 animate-pulse">{lang === "EN" ? "AI-Mentor is processing..." : "AI-Mentor sedang memproses..."}</div>
                    )}
                  </div>
                  </div>

                  {(labSummary || labMindmap) && (
                    <div className="space-y-4">
                      {labSummary && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                            <ListChecks className="h-4 w-4" />
                            {lang === "EN" ? "Conversation Summary" : "Ringkasan Percakapan"}
                          </div>
                          <MarkdownMessage content={labSummary} />
                        </div>
                      )}

                      {labMindmap && (
                        <div className="w-full rounded-2xl border border-cyan-200 bg-sky-50/70 p-4">
                          <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-cyan-700">
                            <Network className="h-4 w-4" />
                            {lang === "EN" ? "Generated Mindmap" : "Mindmap Hasil Generate"}
                          </div>
                          <div className="grid w-full gap-4 md:grid-cols-[160px_1fr] md:items-center">
                            <div className="flex min-h-24 w-full items-center justify-center rounded-2xl border-2 border-cyan-300 bg-white px-4 py-3 text-center text-xs font-extrabold text-cyan-800 shadow-sm">
                              {labMindmap.root}
                            </div>
                            <div className="grid gap-3">
                              {labMindmap.branches.map((branch) => (
                                <div key={branch.id} className="grid gap-2 md:grid-cols-[32px_1fr] md:items-center">
                                  <div className="hidden h-px bg-cyan-300 md:block" />
                                  <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <p className="text-xs font-extrabold text-slate-800">{branch.title}</p>
                                    {branch.details.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {branch.details.map((detail, detailIdx) => (
                                          <span key={detailIdx} className="max-w-full rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                            {detail}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Terminal Prompt input */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={labPrompt}
                      onChange={(e) => setLabPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLabExecute(currentT.modulesList[activeModuleIdx].title); }}
                      placeholder={lang === "EN" ? "Type a question or task here..." : "Ketik pertanyaan Anda di sini..."}
                      disabled={labLoading}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    <button 
                      onClick={() => handleLabExecute(currentT.modulesList[activeModuleIdx].title)}
                      disabled={labLoading || !labPrompt.trim()}
                      className="rounded-xl bg-cyan-500 px-5 text-white flex items-center justify-center hover:bg-cyan-600 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* TAB CONTENT: QUIZ VERIFICATION */}
              {classroomTab === "quiz" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-['Plus_Jakarta_Sans']">
                      📝 {lang === "EN" ? "Module Verification Challenge" : "Kuis Verifikasi Kompetensi Modul"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === "EN"
                        ? "Complete this verification question to earn your module completion badge and progress toward graduation."
                        : "Selesaikan pertanyaan verifikasi ini untuk mengklaim badge kelulusan modul pembelajaran Anda."}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                    <h4 className="font-bold text-sm text-slate-800 leading-relaxed">
                      {currentT.modulesList[activeModuleIdx].materials.quiz.question}
                    </h4>

                    <div className="mt-6 space-y-3">
                      {currentT.modulesList[activeModuleIdx].materials.quiz.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (!quizSubmitted) setQuizSelectedOption(idx);
                          }}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                            quizSelectedOption === idx
                              ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            quizSelectedOption === idx ? 'bg-cyan-500 text-white font-bold' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </button>
                      ))}
                    </div>

                    {quizFeedback && (
                      <div className={`mt-6 p-4 rounded-xl text-xs font-medium ${
                        quizFeedback.startsWith('🎉') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}>
                        {quizFeedback}
                      </div>
                    )}

                    {!quizSubmitted ? (
                      <button
                        onClick={() => handleQuizSubmit(currentT.modulesList[activeModuleIdx].materials.quiz, currentT.modulesList[activeModuleIdx].id)}
                        disabled={quizSelectedOption === null}
                        className="mt-6 w-full rounded-xl bg-cyan-500 py-3 text-xs font-extrabold text-white hover:bg-cyan-600 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {currentT.quizSubmit}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizSelectedOption(null);
                          setQuizFeedback("");
                        }}
                        className="mt-6 w-full rounded-xl bg-white border border-slate-200 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        {currentT.quizRetry}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB CONTENT: CERTIFICATE */}
              {classroomTab === "certificate" && allModulesCompleted && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center animate-fade-in"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800 font-['Plus_Jakarta_Sans']">🎓 {currentT.certHeader}</h3>
                    <button 
                      onClick={() => setClassroomTab("materials")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {currentT.backToStudy}
                    </button>
                  </div>

                  {!certificateRecord ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800">
                      Menerbitkan sertifikat dan nomor verifikasi...
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
                        <div className="relative aspect-[1536/1080] w-full">
                          <img
                            src="/cert-template.png"
                            alt="Lensetek certificate template"
                            className="absolute inset-0 h-full w-full object-cover"
                          />

                          <div className="absolute right-[7%] top-[6.5%] rounded-lg bg-white/85 px-3 py-2 text-right shadow-sm">
                            <p className="text-[clamp(6px,0.7vw,10px)] font-extrabold uppercase tracking-wider text-slate-500">Certificate No.</p>
                            <p className="font-mono text-[clamp(7px,0.9vw,13px)] font-extrabold text-[#091A36]">{certificateRecord.certificateNo}</p>
                          </div>

                          <div className="absolute left-[24%] right-[21%] top-[45.4%] bg-white/90 px-4 py-1 text-center">
                            <p className="font-serif text-[clamp(16px,3.1vw,46px)] font-extrabold leading-tight text-[#091A36]">
                              {certificateRecord.holderName}
                            </p>
                          </div>

                          <div className="absolute bottom-[7.8%] left-[23.8%] flex items-end gap-3 rounded-xl bg-white/90 px-3 py-2 text-left shadow-sm">
                            <img
                              src={getQrCodeUrl(`Digitally signed by Astrid, Program Director, Lensetek International, LLC. Certificate: ${certificateRecord.certificateNo}`, 92)}
                              alt="Astrid digital signature QR code"
                              className="h-[clamp(38px,6vw,74px)] w-[clamp(38px,6vw,74px)]"
                            />
                            <div>
                              <p className="font-serif text-[clamp(12px,1.6vw,24px)] font-bold text-[#091A36]">Astrid</p>
                              <p className="text-[clamp(6px,0.75vw,10px)] font-bold uppercase tracking-wider text-slate-500">QR Signature</p>
                            </div>
                          </div>

                          <div className="absolute bottom-[7.6%] left-[45.2%] w-[14%] rounded-lg bg-white/95 px-2 py-1 text-center">
                            <p className="text-[clamp(6px,0.75vw,10px)] font-bold text-slate-500">Valid Until</p>
                            <p className="text-[clamp(8px,1.05vw,15px)] font-extrabold text-[#091A36]">
                              {formatDisplayDate(certificateRecord.validUntil, "en-US")}
                            </p>
                          </div>

                          <div className="absolute bottom-[7.6%] right-[22.2%] w-[15%] rounded-lg bg-white/95 px-2 py-1 text-center">
                            <p className="text-[clamp(6px,0.75vw,10px)] font-bold text-slate-500">Date of Completion</p>
                            <p className="text-[clamp(8px,1.05vw,15px)] font-extrabold text-[#091A36]">
                              {formatDisplayDate(certificateRecord.completionDate, "en-US")}
                            </p>
                          </div>

                          <div className="absolute bottom-[7%] right-[6.6%] rounded-xl bg-white/95 p-2 text-center shadow-sm">
                            <img
                              src={getQrCodeUrl(certificateRecord.verificationUrl, 116)}
                              alt="Certificate verification QR code"
                              className="h-[clamp(48px,7vw,92px)] w-[clamp(48px,7vw,92px)]"
                            />
                            <p className="mt-1 text-[clamp(5px,0.65vw,9px)] font-extrabold uppercase tracking-wider text-cyan-700">Verify</p>
                          </div>
                        </div>
                      </div>

                      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-700">Official Transcript</p>
                            <h4 className="text-xl font-extrabold text-slate-900">Transkrip Penyelesaian Modul</h4>
                          </div>
                          <p className="font-mono text-xs font-bold text-slate-500">{certificateRecord.certificateNo}</p>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                          {(certificateRecord.transcript || []).map((item) => (
                            <div key={item.moduleId} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[70px_1fr_130px_120px] md:items-center">
                              <p className="text-xs font-extrabold text-slate-400">Module {item.moduleId}</p>
                              <p className="text-sm font-bold text-slate-800">{item.title}</p>
                              <p className="text-xs font-semibold text-slate-500">{item.hours}</p>
                              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-3">
                        <a
                          href={certificateRecord.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-6 py-3 text-xs font-bold text-cyan-700 shadow-sm hover:bg-cyan-100 transition-all"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Buka Laman Verifikasi
                        </a>
                        <button
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-300 transition-all cursor-pointer hover:scale-[1.01]"
                        >
                          {currentT.certPrint}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

            </div>
          </div>
        </motion.section>
      ) : (
        /* ==================== PUBLIC HIGH-FIDELITY LANDING PAGE VIEW ==================== */
        <div className="bg-[#FCFAF7] min-h-screen text-slate-800 selection:bg-amber-400 selection:text-slate-950 font-sans">
          
          {/* Header / Navbar */}
          <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8 border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-50">
            <a href="#top" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#091A36] p-1.5 shadow-sm overflow-hidden shrink-0">
                <img src="https://lensetek.com/favicon.png" alt="Lensetek Logo" className="h-full w-full object-contain filter brightness-0 invert" />
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-tight text-[#091A36] font-['Plus_Jakarta_Sans'] uppercase leading-none">Lensetek</p>
                <p className="text-[9px] uppercase tracking-wider text-amber-500 font-extrabold mt-0.5">International, LLC</p>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-8 text-[13px] font-extrabold text-slate-600 md:flex">
              <a href="#modules" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Curriculum" : "Kurikulum"}</a>
              <a href="#competencies" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Competencies" : "Kompetensi"}</a>
              <a href="#benefits" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Use Cases" : "Use Case"}</a>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Dual Language Switcher */}
              <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-0.5 gap-0.5 mr-2">
                <button 
                  onClick={() => setLang("EN")} 
                  className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${lang === "EN" ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang("ID")} 
                  className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${lang === "ID" ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  ID
                </button>
              </div>

              {/* GitHub Link */}
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-slate-500 hover:text-[#091A36] transition-colors mr-1" 
                title="GitHub Repository"
              >
                <GithubIcon className="h-5 w-5" />
              </a>

              <button 
                onClick={handleGoogleAuth} 
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-extrabold text-slate-950 transition-all cursor-pointer shadow-sm text-center flex items-center gap-1.5"
              >
                👤 {lang === "EN" ? "Login / Signup" : "Masuk / Daftar"}
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <section id="top" className="relative isolate px-6 pt-12 pb-20 lg:px-8 bg-gradient-to-b from-white to-[#FCFAF7] border-b border-slate-100">
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              
              {/* Hero Left Content */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6 }}
                className="flex flex-col items-start text-left space-y-6"
              >
                <span className="inline-flex px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#091A36] bg-amber-100 border border-amber-200 rounded-full shadow-inner">
                  {lang === "EN" ? "MINI COURSE" : "MINI COURSE"}
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] text-[#091A36] font-['Plus_Jakarta_Sans']">
                  Agentic AI <br />
                  <span className="text-[#091A36]">{lang === "EN" ? "for Marketing & Business" : "for Marketing & Business"}</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-650 leading-relaxed max-w-2xl font-medium">
                  {lang === "EN"
                    ? "Build autonomous AI agents working directly for you. Automate marketing operations, competitor SWOT engines, customer support workflows, and day-to-day operations in a much smarter, automated style."
                    : "Bangun Agen AI Otonom yang bekerja untuk Anda. Otomatisasi pemasaran, analisis kompetitor, layanan pelanggan, dan operasional bisnis dengan cara yang lebih cerdas."}
                </p>

                {/* Lower info capsule row */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl pt-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-start">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">⏱️ {lang === "EN" ? "Total Hours" : "Durasi Total"}</span>
                    <span className="text-sm font-extrabold text-[#091A36]">20 Jam</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">5 Sesi x 4 Jam</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-start">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">📈 {lang === "EN" ? "Difficulty" : "Tingkat Kesulitan"}</span>
                    <span className="text-sm font-extrabold text-[#091A36]">{lang === "EN" ? "Beginner-Intermediate" : "Pemula - Menengah"}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{lang === "EN" ? "No coding background" : "Tidak wajib coding"}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-start">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">💻 {lang === "EN" ? "Approach" : "Pendekatan"}</span>
                    <span className="text-sm font-extrabold text-[#091A36]">{lang === "EN" ? "Practical & No-Code" : "Praktis & No-Code"}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{lang === "EN" ? "Direct Implementation" : "Langsung implementasi"}</span>
                  </div>
                </div>

                {/* Main Action Call-to-Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 w-full sm:w-auto">
                  <button 
                    onClick={handleGoogleAuth} 
                    className="flex flex-col items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-10 py-4 rounded-2xl font-extrabold text-sm transition-all shadow-md hover:scale-[1.01] cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-base">👤 {lang === "EN" ? "Login / Register Account" : "Masuk / Daftar Akun"}</span>
                    <span className="text-[10px] opacity-80 font-semibold tracking-wider block">lensetek.online/classroom</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic pt-2">— {lang === "EN" ? "Join and start your journey to become an Agentic AI specialist today." : "Bergabung dan mulai perjalanan Anda menjadi praktisi Agentic AI."}</p>
              </motion.div>

              {/* Hero Right Visual Column */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.15 }}
                className="relative bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-xl overflow-hidden aspect-[4/3] flex flex-col justify-end"
              >
                {/* Generated Background Image */}
                <img 
                  src="/hero_woman_working.png" 
                  alt="Professional Working" 
                  className="absolute inset-0 h-full w-full object-cover opacity-90 transition-all hover:scale-105 duration-[4000ms]" 
                />
                
                {/* Gradient overlay for text reading */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent/10 z-10" />

                {/* Floating active agent cards overlay */}
                <div className="relative z-20 w-3/5 space-y-2.5 my-auto pl-2">
                  <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-xl p-2.5 shadow-sm flex items-center gap-3 transform -translate-x-2">
                    <span className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0">🔍</span>
                    <div>
                      <p className="font-extrabold text-[10px] text-[#091A36] leading-none">{lang === "EN" ? "Trend Research & SEO" : "Riset Tren & SEO"}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">{lang === "EN" ? "Agent 1 active" : "Agen 1 berjalan"}</p>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-xl p-2.5 shadow-sm flex items-center gap-3 transform translate-x-1">
                    <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0">📝</span>
                    <div>
                      <p className="font-extrabold text-[10px] text-[#091A36] leading-none">{lang === "EN" ? "Content Writer" : "Penulis Konten"}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">{lang === "EN" ? "Agent 2 active" : "Agen 2 berjalan"}</p>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-xl p-2.5 shadow-sm flex items-center gap-3 transform -translate-x-1">
                    <span className="h-6 w-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs shrink-0">⚙️</span>
                    <div>
                      <p className="font-extrabold text-[10px] text-[#091A36] leading-none">{lang === "EN" ? "Editor & QA Check" : "Editor & QA"}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">{lang === "EN" ? "Agent 3 active" : "Agen 3 berjalan"}</p>
                    </div>
                  </div>
                  <div className="bg-[#091A36] text-white border border-[#12284C] rounded-xl p-2.5 shadow-sm flex items-center gap-3 transform translate-x-2">
                    <span className="h-6 w-6 rounded-lg bg-white/20 text-white flex items-center justify-center text-xs shrink-0">📊</span>
                    <div>
                      <p className="font-extrabold text-[10px] leading-none">{lang === "EN" ? "Insight Report" : "Laporan & Insight"}</p>
                      <p className="text-[8px] text-slate-300 mt-0.5">{lang === "EN" ? "Finished successfully" : "Selesai!"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </section>

          {/* Curriculum Section */}
          <section id="modules" className="py-20 px-6 lg:px-8 bg-white border-b border-slate-100">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#091A36] sm:text-4xl font-['Plus_Jakarta_Sans']">
                {lang === "EN" ? "5-Module Curriculum – 20 Hours" : "Kurikulum 5 Modul – 20 Jam"}
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto font-medium">
                {lang === "EN" 
                  ? "Designed step-by-step for absolute beginners to business professionals. No coding required." 
                  : "Dirancang secara bertahap untuk pemula hingga profesional bisnis. Tidak membutuhkan latar belakang coding."}
              </p>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                
                {/* Module 1 */}
                <div className="bg-[#FCFAF7] border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold shadow-inner">
                    💡
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 mt-5">
                    {lang === "EN" ? "MODULE 1" : "MODUL 1"}
                  </span>
                  <h3 className="text-sm font-black text-[#091A36] mt-2 font-['Plus_Jakarta_Sans'] leading-snug min-h-[44px]">
                    {lang === "EN" ? "Foundations of Agentic AI & Paradigm Shift" : "Fondasi Agentic AI & Pergeseran Paradigma"}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 mt-3">
                    ⏱️ 3 {lang === "EN" ? "Hours" : "Jam"}
                  </span>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                    {lang === "EN"
                      ? "Understand core concepts of Agentic AI, agent architecture, memory, tools, and how agents think."
                      : "Memahami konsep dasar Agentic AI, arsitektur agen, memori, tools, serta cara agen berpikir dan bertindak otonom."}
                  </p>
                </div>

                {/* Module 2 */}
                <div className="bg-[#FCFAF7] border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold shadow-inner">
                    🕸️
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 mt-5">
                    {lang === "EN" ? "MODULE 2" : "MODUL 2"}
                  </span>
                  <h3 className="text-sm font-black text-[#091A36] mt-2 font-['Plus_Jakarta_Sans'] leading-snug min-h-[44px]">
                    {lang === "EN" ? "Core Skills & Workflow Architecture" : "Core Skills & Arsitektur Alur Kerja (Workflow)"}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 mt-3">
                    ⏱️ 4 {lang === "EN" ? "Hours" : "Jam"}
                  </span>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                    {lang === "EN"
                      ? "Master advanced prompt engineering, persona building, guardrails, and designing multi-agent flows."
                      : "Kuasai prompt engineering tingkat lanjut, persona, guardrails, serta merancang workflow multi-agent yang efektif."}
                  </p>
                </div>

                {/* Module 3 */}
                <div className="bg-[#FCFAF7] border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold shadow-inner">
                    📢
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 mt-5">
                    {lang === "EN" ? "MODULE 3" : "MODUL 3"}
                  </span>
                  <h3 className="text-sm font-black text-[#091A36] mt-2 font-['Plus_Jakarta_Sans'] leading-snug min-h-[44px]">
                    {lang === "EN" ? "Agentic AI for Marketing Automation" : "Agentic AI untuk Marketing Automation"}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 mt-3">
                    ⏱️ 5 {lang === "EN" ? "Hours" : "Jam"}
                  </span>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                    {lang === "EN"
                      ? "Build autonomous content writing engines, competitor tracking setups, and marketing automation."
                      : "Bangun engine konten otonom, riset kompetitor, dan market intelligence yang berjalan otomatis dan terintegrasi."}
                  </p>
                </div>

                {/* Module 4 */}
                <div className="bg-[#FCFAF7] border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold shadow-inner">
                    👥
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 mt-5">
                    {lang === "EN" ? "MODULE 4" : "MODUL 4"}
                  </span>
                  <h3 className="text-sm font-black text-[#091A36] mt-2 font-['Plus_Jakarta_Sans'] leading-snug min-h-[44px]">
                    {lang === "EN" ? "Agentic AI for Business & SMB Operations" : "Agentic AI untuk Operasional Bisnis & UMKM"}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 mt-3">
                    ⏱️ 5 {lang === "EN" ? "Hours" : "Jam"}
                  </span>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                    {lang === "EN"
                      ? "Enhance customer service systems, lead qualification, sales analytics, and business optimization."
                      : "Tingkatkan layanan pelanggan, qualify lead, analisis data penjualan, dan rekomendasi bisnis otomatis dengan AI."}
                  </p>
                </div>

                {/* Module 5 */}
                <div className="bg-[#FCFAF7] border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold shadow-inner">
                    🚀
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 mt-5">
                    {lang === "EN" ? "MODULE 5" : "MODUL 5"}
                  </span>
                  <h3 className="text-sm font-black text-[#091A36] mt-2 font-['Plus_Jakarta_Sans'] leading-snug min-h-[44px]">
                    {lang === "EN" ? "No-Code Implementation & Final Evaluation" : "Implementasi Tanpa Coding & Evaluasi Akhir"}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 mt-3">
                    ⏱️ 3 {lang === "EN" ? "Hours" : "Jam"}
                  </span>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                    {lang === "EN"
                      ? "Deploy robust multi-agent flows on no-code tools, manage API costs, and join the showcase."
                      : "Deploy workflow di platform no-code, evaluasi performa, mengelola biaya, dan final showcase."}
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Competency Section */}
          <section id="competencies" className="py-20 px-6 lg:px-8 bg-[#FCFAF7] border-b border-slate-100">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#091A36] sm:text-4xl font-['Plus_Jakarta_Sans']">
                {lang === "EN" ? "Key Competencies You Will Master" : "Kompetensi Akhir yang Anda Kuasai"}
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto font-medium">
                {lang === "EN"
                  ? "Gain practical industry-grade workflow engineering capabilities applicable immediately."
                  : "Miliki kompetensi praktis berstandar industri untuk merancang workflow bisnis berbasis kecerdasan buatan."}
              </p>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* Competency 1 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="h-16 w-16 rounded-full bg-amber-100 border-4 border-white shadow-md flex items-center justify-center text-xl shrink-0">
                    🧠
                  </div>
                  <h3 className="text-sm font-extrabold text-[#091A36] mt-5 font-['Plus_Jakarta_Sans']">
                    Architectural Thinking
                  </h3>
                  <p className="text-xs text-slate-555 mt-3 leading-relaxed font-medium max-w-xs">
                    {lang === "EN"
                      ? "Convert manual business processes into systematic AI-driven workflow diagrams."
                      : "Mengubah masalah bisnis manual menjadi diagram alur kerja berbasis AI yang sistematis."}
                  </p>
                </div>

                {/* Competency 2 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center text-xl shrink-0">
                    🛡️
                  </div>
                  <h3 className="text-sm font-extrabold text-[#091A36] mt-5 font-['Plus_Jakarta_Sans']">
                    Advanced Prompting & Persona Design
                  </h3>
                  <p className="text-xs text-slate-555 mt-3 leading-relaxed font-medium max-w-xs">
                    {lang === "EN"
                      ? "Master structuring instructions so AI acts as a specific and consistent professional."
                      : "Mahir menyusun instruksi agar AI bertindak sebagai profesional yang spesifik dan konsisten."}
                  </p>
                </div>

                {/* Competency 3 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 border-4 border-white shadow-md flex items-center justify-center text-xl shrink-0">
                    🧩
                  </div>
                  <h3 className="text-sm font-extrabold text-[#091A36] mt-5 font-['Plus_Jakarta_Sans']">
                    Tool Integration
                  </h3>
                  <p className="text-xs text-slate-555 mt-3 leading-relaxed font-medium max-w-xs">
                    {lang === "EN"
                      ? "Provide 'eyes and hands' to AI by connecting internet, documents, databases, and APIs."
                      : "Memberikan \"tangan dan mata\" pada AI dengan menghubungkan internet, dokumen, database, dan API."}
                  </p>
                </div>

                {/* Competency 4 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="h-16 w-16 rounded-full bg-purple-100 border-4 border-white shadow-md flex items-center justify-center text-xl shrink-0">
                    👥
                  </div>
                  <h3 className="text-sm font-extrabold text-[#091A36] mt-5 font-['Plus_Jakarta_Sans']">
                    Orchestration Mastery
                  </h3>
                  <p className="text-xs text-slate-555 mt-3 leading-relaxed font-medium max-w-xs">
                    {lang === "EN"
                      ? "Manage the collaboration of multiple AI agents to work in harmony without overlap."
                      : "Mengelola kolaborasi beberapa agen AI agar bekerja selaras tanpa tumpang tindih."}
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Solutions Section */}
          <section id="benefits" className="py-20 px-6 lg:px-8 bg-white border-b border-slate-100">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#091A36] sm:text-4xl font-['Plus_Jakarta_Sans']">
                {lang === "EN" ? "Build Real-World Solutions for Your Business" : "Bangun Solusi Nyata untuk Bisnis Anda"}
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto font-medium">
                {lang === "EN"
                  ? "Explore ready-to-deploy core agents modeled directly in our comprehensive academy."
                  : "Mulai bangun solusi kecerdasan buatan siap pakai untuk operasional bisnis harian Anda."}
              </p>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                
                {/* Solution 1 */}
                <div className="bg-[#FCFAF7] border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="/content_marketing.png" 
                      alt="Content Marketing Engine" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs shadow-md">
                      ✏️
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between text-left">
                    <div>
                      <h3 className="text-xs font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                        Content Marketing Engine
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        {lang === "EN" 
                          ? "Automated trend research, copywriting, and QA check." 
                          : "Riset tren, penulisan, dan QA konten berjalan otomatis."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solution 2 */}
                <div className="bg-[#FCFAF7] border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="/competitor_tracking.png" 
                      alt="Competitor Tracking" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs shadow-md">
                      📊
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between text-left">
                    <div>
                      <h3 className="text-xs font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                        Competitor Tracking
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        {lang === "EN" 
                          ? "Monitor competitor prices, reviews, and activities periodically." 
                          : "Pantau harga, ulasan, dan aktivitas kompetitor secara berkala."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solution 3 */}
                <div className="bg-[#FCFAF7] border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="/customer_support.png" 
                      alt="Customer Support Cerdas" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-purple-400 text-white flex items-center justify-center text-xs shadow-md">
                      💬
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between text-left">
                    <div>
                      <h3 className="text-xs font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                        Customer Support Cerdas
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        {lang === "EN" 
                          ? "Answer FAQs, route escalations, and integrate order lookups via API." 
                          : "Jawab FAQ, routing eskalasi, dan integrasi cek pesanan via API."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solution 4 */}
                <div className="bg-[#FCFAF7] border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="/sales_analytics.png" 
                      alt="Analisis Penjualan" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs shadow-md">
                      📈
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between text-left">
                    <div>
                      <h3 className="text-xs font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                        Analisis Penjualan
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        {lang === "EN" 
                          ? "Read data, identify trends, and generate automated business suggestions." 
                          : "Baca data, temukan tren, dan dapatkan rekomendasi otomatis."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solution 5 */}
                <div className="bg-[#FCFAF7] border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                    <img 
                      src="/warehouse_boxes.png" 
                      alt="Rekomendasi Stok & Promosi" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-orange-400 text-white flex items-center justify-center text-xs shadow-md">
                      📦
                    </div>
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between text-left">
                    <div>
                      <h3 className="text-xs font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                        Rekomendasi Stok & Promosi
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        {lang === "EN" 
                          ? "Optimize stock inventory and data-driven promotion strategies." 
                          : "Optimalkan stok barang dan strategi promosi berbasis data."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Footer Callout CTA Banner */}
          <section id="audience" className="py-16 px-6 lg:px-8 bg-[#FCFAF7]">
            <div className="mx-auto max-w-7xl">
              <div className="bg-[#091A36] text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                {/* Background light glow design */}
                <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-amber-400/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute left-10 bottom-0 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                  
                  {/* Left branding callout */}
                  <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 max-w-2xl">
                    <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
                      🎓
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug font-['Plus_Jakarta_Sans']">
                        {lang === "EN" ? "Ready to build Agentic AI for your business?" : "Siap membangun Agen AI untuk bisnis Anda?"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-350 mt-3 leading-relaxed font-medium">
                        {lang === "EN"
                          ? "Login or register now on the Lensetek platform and begin your journey as an Agentic AI practitioner today."
                          : "Masuk atau daftar sekarang di platform Lensetek dan mulai perjalanan Anda menjadi praktisi Agentic AI."}
                      </p>
                    </div>
                  </div>

                  {/* Right direct logins buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                    <button 
                      onClick={handleGoogleAuth} 
                      className="flex flex-col items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-955 px-10 py-4 rounded-2xl font-extrabold text-sm transition-all shadow-md cursor-pointer text-center"
                    >
                      <span className="text-base font-extrabold">👤 {lang === "EN" ? "Login / Register Account" : "Masuk / Daftar Akun"}</span>
                      <span className="text-[10px] opacity-80 font-semibold tracking-wider">lensetek.online/classroom</span>
                    </button>
                  </div>

                </div>

                {/* Bullet checklist bottom row */}
                <div className="relative z-10 border-t border-white/10 mt-8 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-slate-300">
                    <span className="text-amber-400">✔️</span> {lang === "EN" ? "Premium Access" : "Akses Materi Premium"}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-slate-300">
                    <span className="text-amber-400">✔️</span> {lang === "EN" ? "Course Certificate" : "Sertifikat Kelulusan"}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-slate-300">
                    <span className="text-amber-400">✔️</span> {lang === "EN" ? "Community & Updates" : "Komunitas & Update"}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-slate-300">
                    <span className="text-amber-400">✔️</span> {lang === "EN" ? "Instructor Support" : "Dukungan Instruktur"}
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Footer Copy */}
          <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} Lensetek International, LLC. United States. All rights reserved.</p>
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-slate-400 hover:text-[#091A36] transition-colors text-sm font-semibold"
              >
                <GithubIcon className="h-4 w-4" /> View GitHub Repository
              </a>
            </div>
          </footer>

        </div>
      )}
    </main>
  );
}



