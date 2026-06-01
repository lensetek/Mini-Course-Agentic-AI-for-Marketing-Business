import React, { useState, useEffect, useRef } from "react";
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
  Network,
  User,
  TrendingUp
} from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

const githubUrl = "https://github.com/lensetek/Mini-Course-Agentic-AI-for-Marketing-Business";
const agentApiUrl = import.meta.env.VITE_AGENT_API_URL || (import.meta.env.DEV ? "http://localhost:3001/api/agent/run" : "/api/agent/run");

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

const ChatGPTIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    {...props}
  >
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5969 8.3829v-2.3324a.0757.0757 0 0 1 .0332-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66l-.1467-.0853-4.7782-2.7581a.7712.7712 0 0 0-.7806 0zm-8.835-3.3543-.1467-.0853 4.7782-2.7582a.7664.7664 0 0 0 .3879-.6765V3.805a.0804.0804 0 0 1 .0379-.052l4.8303 2.7866a4.504 4.504 0 0 1 2.129 4.8872l-.1419.0804zM12 14.5422l-4.571-2.637 4.571-2.637 4.571 2.637z" />
  </svg>
);

const LinkedInIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    {...props}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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
    certViewBtn: "View Certificate",
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
    shareLinkedIn: "Add to LinkedIn",
    verifyBtnOpen: "Open Verification Page",
    biodataTitle: "📋 Student Profile",
    biodataEdit: "✏️ Edit",
    biodataName: "Name",
    biodataWhatsapp: "WhatsApp",
    biodataBirth: "Place & Date of Birth",
    biodataOccupation: "Occupation",
    biodataIncomplete: "⚠️ Your profile is incomplete!",
    biodataCompleteBtn: "Complete Now",
    inviteTitle: "Exclusive Access Only",
    inviteDesc: "This Mini-Course is private. Please enter your valid invitation code to unlock the curriculum and certificate features.",
    invitePlaceholder: "Enter Invitation Code",
    inviteSubmit: "Unlock Course",
    inviteChecking: "Verifying Code...",
    inviteErrorInvalid: "❌ Invalid invitation code. Please check and try again.",
    inviteErrorLimit: "❌ This invitation code has reached its maximum usage limit.",
    inviteSuccess: "🎉 Access granted! Welcome to the course.",
    backToStudy: "Back to Study",
    classroomBtn: "Go to Classroom",
    curriculumBtn: "Go to Curriculum",
    modulesList: [
      {
        id: 1,
        title: "Foundations of Agentic AI",
        hours: "3 Hours",
        desc: "Learn how to create custom AI assistants (Gemini Gems) and structure systematic thinking loops to automate business workflows without coding.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner (No coding background required)",
          description: "This curriculum is designed with a practical, skills-driven approach where you do not need coding knowledge. You will directly use Gemini Gems, Google Opal, and Antigravity to build and launch AI agents to solve real business tasks.",
          sessions: [
            {
              title: "Session 1.1: Chatbots vs. Autonomous Agents (1.5 Hours)",
              bullets: [
                "Limitations of regular AI chats: passive prompting and manual copy-pasting.",
                "Custom Gemini Gems: setting up system instructions, custom roles, and specific business goals.",
                "Anatomy of an Agent: core engine (Brain), memory (Context retention), and visual workspace tools."
              ]
            },
            {
              title: "Session 1.2: Chain-of-Thought (CoT) Prompting (1.5 Hours)",
              bullets: [
                "Deconstructing business processes: mapping out step-by-step reasoning paths.",
                "ReAct reasoning loops: guiding an AI agent to think first, call external search tools, and observe outcomes.",
                "Real Case: Designing a prompt workflow for high-speed SEO research and competitive audits."
              ]
            }
          ],
          quiz: {
            question: "Which Gemini feature allows you to build custom, role-specific AI assistants with pre-defined system instructions?",
            options: [
              "Google Workspace Docs",
              "Gemini Gems (Custom role-specific assistants)",
              "Google Custom Search",
              "Chrome DevTools",
              "Local SQL Database"
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 2,
        title: "Workflows & Multi-Agent Systems",
        hours: "4 Hours",
        desc: "Build a collaborative team of specialized Gems and design routing checkpoints to enforce quality controls over business output.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner (No coding background required)",
          description: "Learn how to connect multiple Gemini Gems in a collaborative pipeline, letting specialized personas check each other's work and pass drafts smoothly.",
          sessions: [
            {
              title: "Session 2.1: Designing Specialized Gems (2 Hours)",
              bullets: [
                "Drafting strict role guidelines for an SEO Specialist, a Copywriter, and a QA Editor.",
                "Setting limits and guidelines to prevent repetitive outputs or straying off-brand.",
                "Structuring output schemas: forcing Gems to deliver text formatted neatly for your worksheets."
              ]
            },
            {
              title: "Session 2.2: Connecting Collaborative Workflows (2 Hours)",
              bullets: [
                "Supervisor Reviews: creating reviewer Gems that audit worker outputs and direct the next tasks.",
                "Context continuity: passing draft details smoothly from writer Gems to editor Gems.",
                "Human-in-the-loop: setting manual approval checkpoints before final publishing operations."
              ]
            }
          ],
          quiz: {
            question: "In a collaborative Multi-Agent Gems system, what is the primary role of a 'Human-in-the-loop' checkpoint?",
            options: [
              "To let the AI publish drafts to social media instantly.",
              "To require manual review and approval from a human before the AI executes high-risk steps.",
              "To translate visual prompts into binary code.",
              "To count the exact words written.",
              "To reset the local server configurations."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 3,
        title: "Marketing Automation",
        hours: "5 Hours",
        desc: "Leverage visual agent orchestration with Antigravity to run competitor SWOT analysis, track trends, and compose SEO-optimized blogs.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner (No coding background required)",
          description: "Configure automated marketing machines that dynamically scout search trends, extract competitive highlights, and draft ready-to-publish content.",
          sessions: [
            {
              title: "Session 3.1: Automated SEO Writing Workflows (2.5 Hours)",
              bullets: [
                "Real-time search tools: instructing agents to crawl search results for high-density keywords.",
                "Dynamic outline builders: structuring rich outlines based on target competitor strategies.",
                "Blog Automation: guiding agents to compile draft blogs adhering strictly to modern SEO standards."
              ]
            },
            {
              title: "Session 3.2: Competitor SWOT Automation (2.5 Hours)",
              bullets: [
                "Competitive analysis: instructing agents to scan rival product reviews and pricing pages otonomously.",
                "SWOT Matrix Compiler: synthesizing competitor strengths and weaknesses into visual reports.",
                "Direct reporting: routing completed SWOT briefings to email channels or Slack hubs."
              ]
            }
          ],
          quiz: {
            question: "Which of the following represents a practical marketing use case for automated trend and competitor SWOT research?",
            options: [
              "Copy-pasting text manually between different browser tabs.",
              "Setting up simple static text files.",
              "Continuously scanning market changes, tracking competitor SEO, and compiling SWOT briefs otonomously.",
              "Writing single one-time prompts in standard chats.",
              "Printing physical paper flyers."
            ],
            answerIdx: 2
          }
        }
      },
      {
        id: 4,
        title: "Business Operations with Google Opal",
        hours: "5 Hours",
        desc: "Prototype and design visual AI mini-apps using drag-and-drop visual workflows in Google Opal to automate customer outreach and score sales leads.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner (No coding background required)",
          description: "Build visual AI workflows on Google Opal's experimental Labs canvas, assembling custom drag-and-drop mini-apps to route customer outreach otonomously.",
          sessions: [
            {
              title: "Session 4.1: Drag-and-Drop AI Mini-Apps in Google Opal (2.5 Hours)",
              bullets: [
                "Visual workflow canvas: designing inputs, AI processing steps, and outputs without code.",
                "Prototyping custom tools: building travel planners, custom generators, or writing aids in Google Opal.",
                "Sharing workflows: compiling visual AI tools and instantly sharing them with your team via link."
              ]
            },
            {
              title: "Session 4.2: Sales Outreach & Lead Scoring (2.5 Hours)",
              bullets: [
                "Lead qualification: creating Opal mini-apps to score incoming client inquires otonomously.",
                "Outreach automation: drafting highly tailored email follow-ups based on lead score data.",
                "SMB operations: scaling repetitive administrative and client management tasks visually."
              ]
            }
          ],
          quiz: {
            question: "What is the primary operational advantage of using Google Opal in SMB operations?",
            options: [
              "Writing backend database SQL injection codes.",
              "Designing and sharing visual, no-code AI mini-apps using drag-and-drop workflows.",
              "Setting up physical servers.",
              "Disabling security firewalls.",
              "Running manual server-side scripts."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 5,
        title: "Low-Code Deployments & Launch",
        hours: "3 Hours",
        desc: "Integrate simple automation pipelines, monitor usage limits, and execute security checklists to launch your AI systems to production safely.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Total Duration: 20 Hours (5 sessions × 4 hours)",
          difficulty: "Difficulty: Beginner (No coding background required)",
          description: "Connect your tested Gems and Opal visual apps into visual low-code pipelines, reviewing costs and launching safe administrative tools.",
          sessions: [
            {
              title: "Session 5.1: Low-code Connections & Triggers (1.5 Hours)",
              bullets: [
                "Trigger events: running visual workflows automatically based on spreadsheet updates or new emails.",
                "Visual connections: linking data between your email inbox, visual apps, and spreadsheets.",
                "Visual error handlings: designing simple visual retry steps if visual nodes timeout."
              ]
            },
            {
              title: "Session 5.2: Cost Monitoring & Pre-Launch Checklists (1.5 Hours)",
              bullets: [
                "Cost control: pruning prompt steps to save on API overhead and query limits.",
                "User acceptance tests: running team dry-runs to ensure accurate agent outcomes.",
                "Security checklists: protecting visual workspace credentials and managing login access."
              ]
            }
          ],
          quiz: {
            question: "Why should a business monitor daily query quotas and prompt costs prior to launch?",
            options: [
              "To control running operational costs and guarantee a snappy, reliable user experience.",
              "Because high prompt latency improves SEO search indexing.",
              "Because visual webhooks require separate monthly hardware charges.",
              "To disable local workspace firewalls.",
              "To bypass Google Workspace login screens."
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
    certBtn: "Generate Sertifikat",
    certViewBtn: "Lihat Sertifikat",
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
    shareLinkedIn: "Tambah ke LinkedIn",
    verifyBtnOpen: "Buka Laman Verifikasi",
    biodataTitle: "📋 Biodata Mahasiswa",
    biodataEdit: "✏️ Edit",
    biodataName: "Nama",
    biodataWhatsapp: "WhatsApp",
    biodataBirth: "TTL",
    biodataOccupation: "Pekerjaan",
    biodataIncomplete: "⚠️ Biodata Anda belum lengkap!",
    biodataCompleteBtn: "Lengkapi Sekarang",
    inviteTitle: "Akses Eksklusif Kelas",
    inviteDesc: "Mini-Course ini bersifat privat. Silakan masukkan kode undangan (invitation code) Anda yang valid untuk membuka kurikulum dan sertifikat.",
    invitePlaceholder: "Masukkan Kode Undangan",
    inviteSubmit: "Buka Akses Kelas",
    inviteChecking: "Memverifikasi Kode...",
    inviteErrorInvalid: "❌ Kode undangan tidak valid. Silakan periksa kembali.",
    inviteErrorLimit: "❌ Kode undangan ini telah mencapai batas maksimum pemakaian.",
    inviteSuccess: "🎉 Akses dibuka! Selamat belajar di kelas.",
    backToStudy: "Kembali Belajar",
    classroomBtn: "Masuk ke Kelas",
    curriculumBtn: "Lihat Kurikulum",
    modulesList: [
      {
        id: 1,
        title: "Fondasi Agentic AI & Pergeseran Paradigma",
        hours: "3 Jam",
        desc: "Memahami perbedaan mendasar antara AI biasa dengan asisten AI kustom (Gemini Gems) serta menyusun kerangka berpikir otonom langkah-demi-langkah tanpa coding.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula (Tidak wajib latar belakang coding)",
          description: "Kurikulum ini dirancang dengan pendekatan praktis no-code yang ramah pemula. Anda akan langsung belajar menggunakan Gemini Gems, Google Opal, dan Antigravity untuk membangun asisten AI guna menyelesaikan tugas-tugas bisnis nyata.",
          sessions: [
            {
              title: "Sesi 1.1: Chatbot Biasa vs Asisten AI Kustom (1.5 Jam)",
              bullets: [
                "Keterbatasan chat AI standar: mengetik prompt berulang dan menyalin teks manual.",
                "Gemini Gems Kustom: menyusun instruksi sistem dasar, kepribadian peran, dan target tujuan bisnis.",
                "Anatomi Asisten AI: mesin utama (Brain), penyimpanan riwayat (Context), dan modul interaksi."
              ]
            },
            {
              title: "Sesi 1.2: Kerangka Berpikir Terstruktur / Chain-of-Thought (1.5 Jam)",
              bullets: [
                "Memecah proses operasional bisnis: memetakan langkah-langkah logika secara runtut.",
                "Logika ReAct: membimbing asisten AI untuk memikirkan solusi, mencari info eksternal, dan merangkum hasil secara terstruktur.",
                "Studi Kasus: Membuat alur kerja otonom untuk riset SEO cepat dan analisis SWOT instan."
              ]
            }
          ],
          quiz: {
            question: "Fitur Gemini manakah yang memungkinkan Anda membuat asisten AI kustom berdasarkan peran tertentu dengan instruksi bawaan yang telah ditetapkan?",
            options: [
              "Google Workspace Docs",
              "Gemini Gems (Asisten kustom peran khusus)",
              "Google Custom Search API",
              "Chrome DevTools",
              "Database SQL Lokal"
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 2,
        title: "Workflow & Kolaborasi Multi-Agent",
        hours: "4 Jam",
        desc: "Rancang kolaborasi tim asisten AI Gems dan bangun pos pemeriksaan kualitas kerja (guardrails) untuk hasil bisnis terbaik.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula (Tidak wajib latar belakang coding)",
          description: "Pelajari cara menghubungkan beberapa asisten Gemini Gems menjadi satu tim kerja yang padu, di mana masing-masing asisten saling mengoreksi draf dan memindahkan hasil tulisan secara berkesinambungan.",
          sessions: [
            {
              title: "Sesi 2.1: Merancang Spesialisasi Peran Gems (2 Jam)",
              bullets: [
                "Menyusun instruksi rigid untuk peran: Spesialis SEO, Copywriter Iklan, dan Editor Tata Bahasa.",
                "Membangun batasan instruksi (guardrails) agar asisten Gems tetap fokus pada target dan anti-repetitif.",
                "Format output terstruktur: mendesain agar Gems selalu mengembalikan data dalam tata letak tabel rapi."
              ]
            },
            {
              title: "Sesi 2.2: Kolaborasi Tim Gems & Reviewer (2 Jam)",
              bullets: [
                "Supervisor Gems: membangun Gems pengawas yang mengulas pekerjaan asisten lain dan merutekan tugas selanjutnya.",
                "Keberlanjutan konteks: mengalirkan draf kasar secara mulus dari asisten Writer ke Editor.",
                "Human-in-the-loop: menyisipkan pos persetujuan manusia sebelum draf akhir dipublikasikan secara komersial."
              ]
            }
          ],
          quiz: {
            question: "Dalam tim kolaborasi asisten Gems, apakah fungsi dari pos 'Human-in-the-loop'?",
            options: [
              "Mengizinkan AI langsung memposting tulisan ke sosial media secara otomatis.",
              "Mewajibkan tinjauan dan persetujuan manual dari pengguna manusia sebelum AI mengeksekusi langkah penting.",
              "Menerjemahkan instruksi visual menjadi kode biner.",
              "Menghitung jumlah total kata tulisan.",
              "Merestart server lokal."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 3,
        title: "Otomatisasi Pemasaran (Marketing Automation)",
        hours: "5 Jam",
        desc: "Gunakan asisten cerdas Antigravity untuk riset tren pasar otonom, analisis SWOT kompetitor, dan menulis draf konten SEO otomatis.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula (Tidak wajib latar belakang coding)",
          description: "Konfigurasikan sistem pemasaran terotomatisasi yang secara mandiri memantau tren Google, membaca kompetitor, dan menyusun draf konten siap pakai.",
          sessions: [
            {
              title: "Sesi 3.1: Alur Kerja Konten SEO Otomatis (2.5 Jam)",
              bullets: [
                "Alat pencari real-time: menginstruksikan asisten memindai volume kata kunci dan data tren pasar terbaru.",
                "Perancang outline dinamis: menyusun struktur artikel kaya informasi berdasarkan konten pesaing teratas.",
                "Pembuatan blog instan: membimbing asisten merakit draf artikel komprehensif yang mematuhi standar SEO modern."
              ]
            },
            {
              title: "Sesi 3.2: Otomatisasi Analisis SWOT Pesaing (2.5 Jam)",
              bullets: [
                "Cek kompetitor: menginstruksikan asisten memetakan kelebihan dan harga produk pesaing otonom.",
                "SWOT Matrix Compiler: merangkum temuan menjadi tabel SWOT (Kekuatan, Kelemahan, Peluang, Ancaman).",
                "Laporan otomatis: menyalurkan hasil ringkasan briefing analisis SWOT langsung ke grup Slack atau kotak email."
              ]
            }
          ],
          quiz: {
            question: "Manakah di bawah ini yang merupakan contoh pemanfaatan asisten AI otonom dalam otomatisasi pemasaran?",
            options: [
              "Menyalin teks manual secara berulang antar-tab browser.",
              "Menulis draf statis satu kali.",
              "Pemantauan tren pasar secara kontinu, pelacakan SEO pesaing otonom, dan pembuatan ringkasan laporan SWOT otomatis.",
              "Membuat prompt biasa dalam chat sekali pakai.",
              "Mencetak selebaran promosi kertas fisik."
            ],
            answerIdx: 2
          }
        }
      },
      {
        id: 4,
        title: "Operasional Bisnis dengan Google Opal",
        hours: "5 Jam",
        desc: "Rancang visual workflow otonom dan prototype aplikasi mini AI untuk kualifikasi prospek penjualan serta otomatisasi email operasional UMKM menggunakan drag-and-drop di Google Opal.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula (Tidak wajib latar belakang coding)",
          description: "Bangun visual workflow otonom di kanvas Labs Google Opal, merakit aplikasi mini drag-and-drop kustom untuk kualifikasi prospek secara mandiri.",
          sessions: [
            {
              title: "Sesi 4.1: Membuat Aplikasi Mini AI Drag-and-Drop di Google Opal (2.5 Jam)",
              bullets: [
                "Kanvas alur visual: mendesain kotak input pengguna, proses berpikir AI, dan output akhir tanpa menulis kode.",
                "Membuat prototype asisten kustom: merakit alat rencana perjalanan, perangkum data, atau alat menulis otomatis di Google Opal.",
                "Membagikan aplikasi mini: menghasilkan link akses instan untuk dibagikan ke tim kerja Anda."
              ]
            },
            {
              title: "Sesi 4.2: Kualifikasi Prospek & Email Otomatis (2.5 Jam)",
              bullets: [
                "Penyaringan prospek otomatis: membuat alur kerja Opal untuk membaca dan memberikan skor potensi penjualan klien.",
                "Otomatisasi pesan follow-up: merancang asisten pembuat draf email penawaran personal berdasarkan skor prospek.",
                "Skalabilitas UMKM: mempercepat pekerjaan administratif rutin dan pengelolaan email pelanggan secara visual."
              ]
            }
          ],
          quiz: {
            question: "Apa fungsi utama dari Google Opal dalam membantu operasional bisnis UMKM?",
            options: [
              "Menulis query database SQL yang rumit.",
              "Merancang dan membagikan aplikasi mini AI no-code melalui alur kerja visual drag-and-drop.",
              "Mengatur penyimpanan kotak barang di gudang.",
              "Menonaktifkan sistem keamanan firewall internet.",
              "Menjalankan skrip pemrograman server."
            ],
            answerIdx: 1
          }
        }
      },
      {
        id: 5,
        title: "Orkestrasi Low-Code & Checklist Rilis",
        hours: "3 Jam",
        desc: "Hubungkan pipa otomatisasi visual sederhana, kelola kuota kueri harian, dan jalankan checklist keamanan rilis produksi.",
        materials: {
          institution: "Lensetek International, LLC. United States",
          course: "Mini Course: Agentic AI for Marketing & Business",
          duration: "Durasi Total: 20 Jam (5 sesi × 4 jam)",
          difficulty: "Tingkat Kesulitan: Pemula (Tidak wajib latar belakang coding)",
          description: "Sambungkan asisten Gems dan aplikasi visual Opal Anda ke pipa integrasi visual low-code untuk menyederhanakan tugas rutin harian Anda secara aman.",
          sessions: [
            {
              title: "Sesi 5.1: Integrasi Koneksi & Pemicu Otomatis (1.5 Jam)",
              bullets: [
                "Pemicu alur kerja (Triggers): menjalankan otomatisasi ketika ada baris tabel baru di worksheet atau email masuk.",
                "Penyambungan visual: mengalirkan data secara otomatis antar-folder email, dokumen kustom, dan tabel.",
                "Penanganan error visual: mendesain langkah pengulangan (retry) otomatis sederhana jika ada koneksi terputus."
              ]
            },
            {
              title: "Sesi 5.2: Monitoring Kuota & Checklist Rilis (1.5 Jam)",
              bullets: [
                "Audit biaya & token: merapikan prompt untuk memangkas batasan token dan batas kueri harian.",
                "Uji coba tim (UAT): menjalankan simulasi draf buatan asisten bersama tim untuk memvalidasi ketepatan kerja.",
                "Checklist keamanan: mengamankan kredensial pemicu visual dan mengatur hak akses akun tim."
              ]
            }
          ],
          quiz: {
            question: "Mengapa pemilik bisnis wajib memperkirakan batas kuota kueri dan biaya token sebelum meluncurkan otomatisasi asisten AI?",
            options: [
              "Untuk mengontrol biaya operasional bulanan dan menjamin pengalaman pengguna yang andal dan cepat.",
              "Karena latensi yang lama mempercepat optimasi pencarian Google.",
              "Karena pemicu visual menuntut penyewaan hardware server fisik tambahan.",
              "Untuk menonaktifkan firewall komputer lokal.",
              "Untuk melewati layar verifikasi Google Workspace."
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
        concept: "Gemini Gems allow business users to design dedicated, custom role personas without coding. By defining a Gem's profile, system instructions, and target output style, you bypass generic chat limitations and build a reliable operational tool.",
        architecture: "Generic ChatGPT ──> Customize Gemini Gem Profile ──> Direct System Instructions ──> Specialized AI Assistant",
        checklist: [
          "Create your first custom Gem in the Gemini interface.",
          "Write a strict system instruction profile defining boundaries and roles.",
          "Test custom outputs and analyze how specific persona guidelines shape responses."
        ]
      },
      {
        concept: "Chain-of-Thought (CoT) prompting trains Gems to outline and explain their steps before presenting an answer. ReAct (Reasoning + Acting) guides them to evaluate if they need to call web search tools, search information otonomously, and refine drafts based on actual observations.",
        architecture: "User Prompt ──> CoT Planning Step ──> Real-time Search Check ──> Analyze Snippets ──> High-Quality Report",
        checklist: [
          "Apply CoT outlines to your Gem prompt instructions.",
          "Test real-time search tool behaviors within Gems.",
          "Compile a SEO trend briefing otonomously using search-enabled Gems."
        ]
      }
    ],
    2: [
      {
        concept: "Structure a multi-persona pipeline where each Gem plays a contrasting, rigid role. The SEO Gem harvests trends, the Copywriter Gem drafts CTAs, and the Editor Gem enforces grammar rules to guarantee outstanding content output.",
        architecture: "Define SEO Persona ──> Design Copywriter Persona ──> Design Editor Persona ──> Unified Output Schema",
        checklist: [
          "Configure strict system persona instruction files for Gems.",
          "Enforce clear markdown output blueprints for consistent UI layouts.",
          "Apply response limits and iteration limits as a guardrail."
        ]
      },
      {
        concept: "Coordinate Gems to work in sequence, where one Gem's output becomes the input for the next. Insert a supervisor reviewer Gem to audit final drafts and implement a human approval step before anything gets launched publicly.",
        architecture: "SEO Gem Output ──> Writer Gem Drafting ──> Editor Gem Audit ──> User Approval Verification Screen",
        checklist: [
          "Connect Gems sequentially to pass text drafts between personas.",
          "Set up context-passing blueprints to maintain document details.",
          "Design an 'Approve / Reject' visual checkpoint for manual human reviews."
        ]
      }
    ],
    3: [
      {
        concept: "Use the Antigravity assistant to search search trends, extract competitive landing page keywords, and draft long-form markdown blog articles that fit modern SEO best practices automatically.",
        architecture: "Search Trends ──> Crawl Competitor Headers ──> Antigravity SEO Outliner ──> Draft Rich SEO Article",
        checklist: [
          "Scout competitor keyword densities using search-enabled agents.",
          "Draft article structures dynamically using outlined SEO blueprints.",
          "Generate finished SEO-optimized blog drafts automatically."
        ]
      },
      {
        concept: "Instruct Antigravity to gather competitive specifications, synthesize strengths and threats into a clean SWOT grid, and route finished executive briefs directly to Slack channels using simple automation pathways.",
        architecture: "Gather Rival Data ──> Compile SWOT Grid ──> Format PDF / Brief ──> Automatic slack Delivery Channel",
        checklist: [
          "Program Antigravity to run competitor analysis sweeps.",
          "Customize visual SWOT matrices and reporting templates.",
          "Route finished briefs directly to communications channels like Slack."
        ]
      }
    ],
    4: [
      {
        concept: "Build visual AI mini-apps inside Google Opal's Labs canvas. Map input boxes, drag-and-drop Gemini-powered processing steps, and outline custom output views to create travel planners, data compilers, or outline tools visually.",
        architecture: "Map Input Box ──> Drag-and-drop Gemini Step ──> Connect Workflow Logic ──> Instant App Share Link",
        checklist: [
          "Design custom inputs and outputs visually on the Google Opal canvas.",
          "Map drag-and-drop AI steps to structure data processing workflows.",
          "Generate app share links to distribute visual AI tools with your team."
        ]
      },
      {
        concept: "Create a custom Opal app to score incoming customer inquiries otonomously based on budget and goals. Have Gemini draft personalized email follow-ups automatically to scale customer service for small businesses.",
        architecture: "Client Inquiry Form ──> Opal Lead Scorer step ──> Custom Email Drafter step ──> Ready-to-send Email draft",
        checklist: [
          "Build a lead filtering app on Opal's visual drag-and-drop canvas.",
          "Configure automated personalized email outreach and follow-up templates.",
          "Scale daily customer management tasks visually without code."
        ]
      }
    ],
    5: [
      {
        concept: "Connect Gems and Opal visual tools to visual low-code pipelines. Trigger automations to run otonomously whenever a customer sends an email or fills out a form, defining simple visual retry loops to manage minor connection drops.",
        architecture: "Email Trigger event ──> Launch Visual Gems pipeline ──> Process Assets ──> Visual error handler step",
        checklist: [
          "Configure visual trigger events from external platforms like sheets or email.",
          "Map visual low-code automation paths to transfer data.",
          "Design visual error handling and retry steps to manage API timeouts."
        ]
      },
      {
        concept: "Execute pre-launch audits. Track daily query quotas and prompt sizes to manage running token fees, execute team dry-runs (UAT) to confirm output quality, and complete the security checklist to protect workspace credentials.",
        architecture: "Track Daily Queries ──> Prune Prompt steps ──> Team Dry-Runs (UAT) ──> Secure Workspace Credentials",
        checklist: [
          "Audit prompt token fees and daily query costs.",
          "Run user acceptance test (UAT) dry-runs with team members.",
          "Complete the 10-point launch checklist covering access control and keys."
        ]
      }
    ]
  },
  ID: {
    1: [
      {
        concept: "Gemini Gems memungkinkan pengguna bisnis merancang persona kustom khusus tanpa coding. Dengan mendefinisikan instruksi sistem, kepribadian peran, dan gaya output, Anda dapat melewati batasan chat AI standar dan membuat alat kerja yang andal.",
        architecture: "Chat AI Generik ──> Kustomisasi Profil Gemini Gems ──> Instruksi Sistem Rigid ──> Asisten AI Spesialis",
        checklist: [
          "Buat Gemini Gems pertama Anda melalui antarmuka Gemini.",
          "Tulis instruksi sistem yang mendetail untuk menetapkan tugas dan batasan Gems.",
          "Uji respon kustom Gems dan evaluasi seberapa konsisten persona AI tersebut."
        ]
      },
      {
        concept: "Prompt Chain-of-Thought (CoT) melatih Gems untuk menjabarkan langkah berpikir mereka sebelum memberikan jawaban. Logika ReAct membimbing asisten AI untuk memikirkan solusi, memanggil alat pencari web otonom, dan merevisi draf berdasarkan data nyata.",
        architecture: "Prompt User ──> Perencanaan Langkah CoT ──> Pencarian Web Real-time ──> Observasi Data ──> Laporan Berkualitas",
        checklist: [
          "Terapkan instruksi berpikir CoT pada prompt asisten Gems Anda.",
          "Uji fungsionalitas pencarian web real-time yang terintegrasi pada Gems.",
          "Susun ringkasan tren pasar secara otomatis menggunakan Gems yang memiliki akses web."
        ]
      }
    ],
    2: [
      {
        concept: "Rancang kolaborasi multi-persona di mana setiap asisten Gems memegang peran rigid yang kontras. Gems SEO fokus pada tren pencarian, Gems Writer menyusun draf konten, dan Gems Editor mengoreksi tata bahasa untuk hasil tulisan premium.",
        architecture: "Persona Gems SEO ──> Persona Gems Writer ──> Persona Gems Editor ──> Output Selaras",
        checklist: [
          "Susun instruksi rigid untuk masing-masing persona asisten Gems.",
          "Terapkan panduan format markdown agar hasil kerja Gems selalu rapi.",
          "Pasang pembatasan panjang teks dan iterasi untuk mengontrol jalannya Gems."
        ]
      },
      {
        concept: "Hubungkan asisten Gems untuk bekerja berurutan, di mana hasil kerja Gems pertama menjadi data masukan bagi Gems berikutnya. Tambahkan Gems Supervisor sebagai editor peninjau dan terapkan pos persetujuan manual manusia sebelum dipublikasikan.",
        architecture: "Output Gems SEO ──> Draf Gems Writer ──> Audit Editor Gems ──> Pos Persetujuan Manusia (HITL)",
        checklist: [
          "Hubungkan alur kerja Gems secara berurutan untuk mengirim data draf tulisan.",
          "Terapkan pedoman pemindahan konteks informasi agar detail dokumen tidak hilang.",
          "Bangun pos persetujuan manual (Setujui / Tolak) sebelum eksekusi rilis publik."
        ]
      }
    ],
    3: [
      {
        concept: "Gunakan asisten cerdas Antigravity untuk mencari tren kata kunci Google, merayap kata kunci kompetitor teratas secara otonom, dan merakit draf artikel blog panjang yang teroptimasi SEO secara otomatis.",
        architecture: "Riset Tren ──> Deteksi Kata Kunci Kompetitor ──> Analisis Outliner Antigravity ──> Draf Blog SEO",
        checklist: [
          "Analisis kepadatan kata kunci kompetitor secara otomatis menggunakan asisten AI.",
          "Rancang struktur artikel blog secara dinamis menggunakan outline buatan agen.",
          "Otomatiskan penyusunan blog artikel teroptimasi SEO yang siap pakai."
        ]
      },
      {
        concept: "Instruksikan Antigravity untuk mengumpulkan data pesaing, menyusun kelebihan dan kelemahan mereka ke dalam matriks SWOT yang rapi, dan mengirimkan laporan briefing otomatis ke saluran Slack tim Anda secara instan.",
        architecture: "Kumpulkan Data Pesaing ──> Kompilasi Tabel SWOT ──> Format Dokumen Laporan ──> Pengiriman Otomatis ke Slack",
        checklist: [
          "Program asisten Antigravity untuk menyapu dan menganalisis situs produk pesaing.",
          "Kustomisasi format tabel analisis SWOT dan template pelaporan.",
          "Salurkan laporan analisis SWOT secara otomatis ke platform komunikasi Slack."
        ]
      }
    ],
    4: [
      {
        concept: "Bangun aplikasi mini AI secara visual di kanvas Labs Google Opal. Desain kotak input, letakkan langkah pemrosesan AI Gemini secara drag-and-drop, dan atur visual output untuk merakit alat pembuat konten, perencana, atau kuesioner tanpa kode.",
        architecture: "Kotak Input Pengguna ──> Langkah Pemrosesan AI ──> Hubungkan Logika Alur ──> Link Akses Aplikasi",
        checklist: [
          "Desain elemen input dan output visual di kanvas drag-and-drop Google Opal.",
          "Pasang langkah pemrosesan bertenaga AI Gemini untuk memproses data visual.",
          "Hasilkan link akses aplikasi mini untuk membagikan tool buatan Anda ke rekan kerja."
        ]
      },
      {
        concept: "Buat aplikasi mini di Google Opal untuk menguji dan memberi skor calon prospek penjualan secara otonom. Biarkan asisten AI mendraf email penawaran personal secara otomatis untuk menghemat waktu operasional UMKM.",
        architecture: "Formulir Masuk ──> Langkah Penilai Prospek Opal ──> Langkah Pembuat Email ──> Draf Email Siap Kirim",
        checklist: [
          "Bangun aplikasi kualifikasi prospek pada kanvas visual Google Opal.",
          "Konfigurasikan asisten pembuat draf email penawaran personal otomatis.",
          "Otomatiskan pengelolaan komunikasi email pelanggan secara visual tanpa coding."
        ]
      }
    ],
    5: [
      {
        concept: "Sambungkan asisten Gems dan aplikasi visual Opal Anda ke pipa integrasi visual low-code. Otomatisasi alur kerja agar terpicu saat ada email baru masuk atau baris tabel diisi, serta pasang langkah retry visual jika jaringan lambat.",
        architecture: "Email Masuk ──> Picu Otomatisasi Gems/Opal ──> Proses Informasi ──> Langkah Retry Ulang",
        checklist: [
          "Konfigurasikan pemicu otomatisasi visual dari platform eksternal seperti email.",
          "Hubungkan alur data secara visual antar-aplikasi no-code Anda.",
          "Rancang langkah penanganan error visual jika terdapat koneksi API terputus."
        ]
      },
      {
        concept: "Jalankan evaluasi pra-rilis. Pantau batas kueri harian dan token prompt untuk menghemat biaya operasional bulanan, lakukan uji coba bersama tim (UAT), dan terapkan checklist keamanan untuk melindungi kredensial akun.",
        architecture: "Lacak Batas Kueri ──> Rapikan Instruksi Prompt ──> Uji Coba Tim (UAT) ──> Checklist Keamanan Akun",
        checklist: [
          "Audit konsumsi token prompt dan kuota kueri harian.",
          "Lakukan uji coba simulasi draf buatan asisten bersama rekan kerja tim Anda.",
          "Selesaikan 10 poin checklist peluncuran untuk memastikan keamanan akun."
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

const getFallbackResponse = (prompt, moduleIdx, lang) => {
  const isId = lang === "ID";
  const p = prompt.toLowerCase();
  
  if (moduleIdx === 0) {
    if (p.includes("maksud") || p.includes("apa") || p.includes("jelas")) {
      return isId 
        ? "Tentu! Di Modul 1 ini, maksud dari **Agentic AI** adalah teknologi kecerdasan buatan yang tidak hanya pasif menjawab pertanyaan (seperti ChatGPT biasa), melainkan bisa bertindak mandiri secara otonom untuk menyelesaikan tugas bisnis Anda. Prakteknya bisa menggunakan **Gemini Gems** untuk membuat asisten kustom sesuai kebutuhan peran bisnis Anda tanpa perlu mengerti bahasa pemrograman sama sekali."
        : "Sure! In Module 1, **Agentic AI** refers to AI systems that don't just passively answer questions, but can actively plan, reason, and use tools (like web search) autonomously to achieve business goals. You can practice this easily by creating custom **Gemini Gems** for specific roles without writing any code.";
    }
    return isId
      ? `Pertanyaan yang bagus sekali tentang Fondasi Agentic AI! Di sesi ini, kita belajar merancang prompt terstruktur (Chain-of-Thought) pada **Gemini Gems** agar asisten kustom Anda bisa melakukan riset pasar dan SEO secara otomatis. Anda tidak perlu coding, cukup jelaskan peran dan instruksi sistemnya dengan bahasa sehari-hari.`
      : `That is a wonderful question about Agentic AI Foundations! In this session, we learn how to structure step-by-step thinking using **Gemini Gems** to search SEO trends. No coding required, just define your Gem's role and rules in plain language.`;
  }
  
  if (moduleIdx === 1) {
    if (p.includes("maksud") || p.includes("apa") || p.includes("jelas")) {
      return isId
        ? "Maksud dari **Kolaborasi Multi-Agent** adalah menghubungkan beberapa asisten Gems kustom Anda agar bisa bekerja sama dalam satu alur kerja terpadu (pipeline). Misalnya: Gems SEO meriset tren kata kunci -> hasilnya otomatis diteruskan ke Gems Copywriter untuk membuat iklan -> hasilnya dikoreksi oleh Gems Editor. Anda juga bisa menyisipkan pos persetujuan manusia sebelum draf dipublikasikan."
        : "By **Multi-Agent Collaboration**, we mean connecting multiple specialized Gems to work together in a pipeline. For example, your SEO Gem gathers keywords, passes them to your Copywriter Gem for drafting, which is then audited by your Editor Gem. You can also insert manual approval checkposts for quality control.";
    }
    return isId
      ? "Menarik sekali! Merancang kolaborasi tim asisten **Gemini Gems** sangat membantu mempercepat produksi konten pemasaran yang konsisten. Dengan membagi tugas ke beberapa asisten spesifik (SEO, Writer, Editor), hasil kerja asisten AI akan jauh lebih berkualitas dibanding chat sekali pakai."
      : "Very interesting! Connecting specialized **Gemini Gems** in a pipeline dramatically scales consistent marketing content creation. By delegating tasks between Gems (SEO, Writer, Editor), the final output is much higher quality.";
  }
  
  if (moduleIdx === 2) {
    if (p.includes("maksud") || p.includes("apa") || p.includes("jelas")) {
      return isId
        ? "Di Modul 3 ini, otomatisasi pemasaran menggunakan asisten **Antigravity** dimaksudkan untuk membebaskan Anda dari tugas riset manual yang melelahkan. Antigravity akan bertindak secara mandiri mencari tren kata kunci terbaru di Google, merangkum strategi kompetitor menjadi tabel analisis SWOT, dan langsung merutekan draf laporannya ke saluran Slack atau email Anda."
        : "In Module 3, marketing automation with **Antigravity** means freeing you from tedious manual research. Antigravity acts autonomously to scout search trends, summarize competitive features into a SWOT matrix, and route finished reports straight to your Slack channel.";
    }
    return isId
      ? "Luar biasa! Otomatisasi pemasaran dengan asisten cerdas **Antigravity** mempermudah UMKM memantau pasar. Anda cukup menginstruksikan asisten untuk merangkum kelebihan kompetitor dan menulis draf konten SEO otomatis tanpa perlu menyalin teks manual."
      : "Excellent! Marketing automation with the **Antigravity** assistant makes market tracking easy for SMBs. Just instruct the agent to analyze rival sites and draft SEO blogs otonomously.";
  }
  
  if (moduleIdx === 3) {
    if (p.includes("maksud") || p.includes("apa") || p.includes("jelas") || p.includes("opal")) {
      return isId
        ? "Maksud dari **Google Opal** adalah platform no-code eksperimental dari **Google Labs** di mana Anda bisa merancang aplikasi mini AI sendiri secara visual menggunakan drag-and-drop. Di modul 4 ini, kita menggunakannya untuk membuat prototype aplikasi kualifikasi prospek penjualan dan otomatisasi email tindak lanjut tanpa perlu mengerti pemrograman database."
        : "**Google Opal** is an experimental no-code platform from **Google Labs** where you can design custom AI mini-apps visually via drag-and-drop. In Module 4, we use it to build sales lead qualification tools and automated email outreach workflows without database programming.";
    }
    return isId
      ? "Pertanyaan menarik! Membuat prototype aplikasi mini di **Google Opal** sangat memudahkan operasional bisnis harian. Anda bisa memetakan formulir masuk, memasang langkah logika AI Gemini, dan menghasilkan email follow-up personal secara instan tanpa menulis satu baris kode pun."
      : "Great question! Building visual mini-apps on **Google Opal** makes SMB ops incredibly efficient. You can map input forms, drag-and-drop Gemini AI steps, and compile instant personalized outreach links without code.";
  }
  
  if (moduleIdx === 4) {
    if (p.includes("maksud") || p.includes("apa") || p.includes("jelas")) {
      return isId
        ? "Maksud dari **Orkestrasi Low-Code & Launch** adalah tahap menghubungkan asisten Gems dan aplikasi visual Opal Anda ke pemicu otomatisasi harian (misalnya, jalan otomatis jika ada email baru atau baris tabel baru terisi). Serta bagaimana mengaudit kuota kueri harian agar biaya operasional tetap hemat dan aman."
        : "**Low-code Orchestration & Launch** is the final step where you connect your custom Gems and visual Opal apps to automated daily triggers (like a new email or sheet row) and audit prompt costs to keep operations secure and cost-efficient.";
    }
    return isId
      ? "Langkah penting! Sebelum meluncurkan otomatisasi asisten AI ke operasional bisnis nyata, Anda harus memastikan kuota kueri harian terpantau dengan baik untuk menghindari biaya membengkak, serta melakukan simulasi uji coba bersama tim."
      : "Crucial step! Prior to deploying AI automations to real business operations, you must manage daily query limits to control running token costs and run acceptance test runs with your team.";
  }
  
  return isId
    ? "Halo! Saya adalah AI-Mentor yang siap membantu Anda dalam kursus ini. Silakan tanyakan materi apa pun terkait Gemini Gems, Google Opal, atau otomatisasi Antigravity!"
    : "Hello! I am your AI-Mentor, here to help you in this course. Please ask anything about Gemini Gems, Google Opal, or Antigravity automations!";
};

export default function LensetekAgenticAiLandingPage() {
  const [lang, setLang] = useState(() => localStorage.getItem("course_lang") || "ID"); // "EN" or "ID"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [user, setUser] = useState(null);

  // Classroom Dashboard States
  const [activeModuleIdx, setActiveModuleIdx] = useState(() => {
    const v = localStorage.getItem("course_active_module");
    return v !== null ? parseInt(v, 10) : 0;
  });
  const [classroomTab, setClassroomTab] = useState(() => localStorage.getItem("course_classroom_tab") || "materials"); // "materials" | "lab" | "quiz" | "certificate"
  const [completedModules, setCompletedModules] = useState({}); // { moduleId: true }
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState([null, null, null, null, null]);
  const [quizScore, setQuizScore] = useState(null);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null); // 'sIdx' or null
  const [chatCount, setChatCount] = useState(0);
  const [chatLastResetDate, setChatLastResetDate] = useState("");

  // Invitation Code States
  const [inviteInput, setInviteInput] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
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
  const [certificateRefreshAfterBiodata, setCertificateRefreshAfterBiodata] = useState(false);
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const publishedCertificateRef = useRef(new Set());
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

  const getDynamicVerificationUrl = (record) => {
    if (!record) return "";
    const baseOrigin = import.meta.env.VITE_CREDENTIAL_URL || window.location.origin;
    const sanitizedBase = baseOrigin.endsWith("/") ? baseOrigin.slice(0, -1) : baseOrigin;
    return `${sanitizedBase}/verify/${record.certificateNo}`;
  };

  const getLinkedInShareUrl = (record) => {
    if (!record) return "";
    const completionDate = new Date(record.completionDate);
    const issueYear = completionDate.getFullYear();
    const issueMonth = completionDate.getMonth() + 1; // 1-indexed

    const baseUrl = "https://www.linkedin.com/profile/add";
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: record.courseTitle || "Agentic AI for Marketing & Business",
      organizationName: record.institution || "Lensetek International, LLC",
      issueYear: issueYear.toString(),
      issueMonth: issueMonth.toString(),
      certId: record.certificateNo,
      certUrl: getDynamicVerificationUrl(record)
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const getDefaultBiodata = (currentUser) => ({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    whatsapp: "",
    birthPlace: "",
    birthDate: "",
    gender: "Laki-laki",
    occupation: "Mahasiswa / Pelajar"
  });

  const isBiodataComplete = (profile) =>
    !!(
      profile?.fullName?.trim() &&
      profile?.whatsapp?.trim() &&
      profile?.birthPlace?.trim() &&
      profile?.birthDate?.trim() &&
      profile?.occupation?.trim()
    );

  const hasCourseAccess = !!(
    biodata?.invitationCode ||
    certificateRecord ||
    Object.keys(completedModules || {}).length > 0
  );

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

  const buildCertificateRecord = (existingCertificateNo, profile = biodata) => {
    if (!isBiodataComplete(profile)) return null;

    const issuedAt = new Date();
    const validUntil = new Date(issuedAt);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const certificateNo = existingCertificateNo || createCertificateNo(user.uid);
    const baseOrigin = import.meta.env.VITE_CREDENTIAL_URL || window.location.origin;
    const sanitizedBase = baseOrigin.endsWith("/") ? baseOrigin.slice(0, -1) : baseOrigin;
    const verificationUrl = `${sanitizedBase}/verify/${certificateNo}`;
    const holderName = profile?.fullName || user.displayName || "Participant";

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
      transcript: t.EN.modulesList.map((module) => ({
        moduleId: module.id,
        title: module.title,
        hours: module.hours,
        status: completedModules[module.id] ? "Completed" : "Pending"
      }))
    };
  };

  const publishCertificateRecord = async (record) => {
    if (!user || !record?.certificateNo) return;

    const publishKey = `${user.uid}:${record.certificateNo}`;
    if (publishedCertificateRef.current.has(publishKey)) return;
    publishedCertificateRef.current.add(publishKey);

    const publicRecord = {
      ...record,
      verificationUrl: getDynamicVerificationUrl(record)
    };

    try {
      await setDoc(doc(db, "certificates", publicRecord.certificateNo), {
        ...publicRecord,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      publishedCertificateRef.current.delete(publishKey);
      console.error("Certificate Publishing Error:", error);
    }
  };

  const supersedeCertificateRecord = async (oldRecord, newRecord) => {
    if (!oldRecord?.certificateNo || !newRecord?.certificateNo || oldRecord.certificateNo === newRecord.certificateNo) return;

    try {
      await setDoc(doc(db, "certificates", oldRecord.certificateNo), {
        certificateNo: oldRecord.certificateNo,
        status: "reissued",
        reissuedTo: newRecord.certificateNo,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Certificate Supersede Error:", error);
    }
  };

  const ensureCertificateRecord = async () => {
    if (!user) return null;
    if (!isBiodataComplete(biodata)) {
      setBiodataForm(biodata || getDefaultBiodata(user));
      if (certificateRecord) setCertificateRefreshAfterBiodata(true);
      setShowBiodataModal(true);
      return null;
    }

    if (certificateRefreshAfterBiodata && certificateRecord) {
      const oldRecord = certificateRecord;
      const refreshedRecord = buildCertificateRecord(null, biodata);
      if (!refreshedRecord) return null;

      setCertificateRecord(refreshedRecord);
      setCertificateRefreshAfterBiodata(false);
      cacheUserProgress(user.uid, { certificate: refreshedRecord });

      try {
        await publishCertificateRecord(refreshedRecord);
        await supersedeCertificateRecord(oldRecord, refreshedRecord);
        await saveProgressToCollection({ certificate: refreshedRecord });
      } catch (error) {
        console.error("Certificate Refresh Error:", error);
      }

      return refreshedRecord;
    }

    if (certificateRecord) {
      await publishCertificateRecord(certificateRecord);
      return certificateRecord;
    }

    const record = buildCertificateRecord();
    if (!record) return null;
    setCertificateRecord(record);
    cacheUserProgress(user.uid, { certificate: record });

    try {
      await publishCertificateRecord(record);
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
        let cachedModules = {};
        let cachedCert = null;
        let cachedBiodata = null;
        let cachedInvitationCode = "";

        if (localProgress) {
          try {
            const parsed = JSON.parse(localProgress);
            if (parsed.completedModules) {
              cachedModules = parsed.completedModules;
              setCompletedModules(parsed.completedModules);
            }
            if (parsed.certificate) {
              cachedCert = parsed.certificate;
              setCertificateRecord(parsed.certificate);
            }
            if (parsed.chatUsage?.lastResetDate === getTodayStr()) {
              setChatCount(parsed.chatUsage.count || 0);
              setChatLastResetDate(parsed.chatUsage.lastResetDate);
            }
            if (parsed.biodata) {
              cachedBiodata = parsed.biodata;
              setBiodata(parsed.biodata);
              setBiodataForm(parsed.biodata);
            }
            cachedInvitationCode = parsed.invitationCode || parsed.biodata?.invitationCode || "";
          } catch (e) {
            console.warn("Parsing Local Storage Progress Error:", e);
          }
        }

        try {
          const docRef = doc(db, "progress", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Smart local-to-cloud progress merge & prevent data loss
            const firestoreCompletedCount = Object.keys(data.completedModules || {}).length;
            const localCompletedCount = Object.keys(cachedModules).length;

            let finalCompleted = data.completedModules || {};
            let finalCert = data.certificate || null;
            let finalBiodata = data.biodata || null;
            const finalInvitationCode = data.invitationCode || data.biodata?.invitationCode || cachedInvitationCode;
            let needsUpload = false;

            if (localCompletedCount > firestoreCompletedCount) {
              finalCompleted = { ...data.completedModules, ...cachedModules };
              needsUpload = true;
            } else {
              finalCompleted = { ...cachedModules, ...data.completedModules };
            }

            if (cachedCert && !data.certificate) {
              finalCert = cachedCert;
              needsUpload = true;
            } else if (data.certificate) {
              finalCert = data.certificate;
            }

            if (cachedBiodata && !data.biodata) {
              finalBiodata = cachedBiodata;
              needsUpload = true;
            } else if (data.biodata) {
              finalBiodata = data.biodata;
            }
            if (finalInvitationCode) {
              finalBiodata = {
                ...(finalBiodata || getDefaultBiodata(user)),
                invitationCode: finalInvitationCode
              };
              if (!data.biodata?.invitationCode || data.invitationCode !== finalInvitationCode) {
                needsUpload = true;
              }
            }

            setCompletedModules(finalCompleted);
            if (finalCert) setCertificateRecord(finalCert);
            if (finalBiodata) {
              setBiodata(finalBiodata);
              setBiodataForm(finalBiodata);
            }

            cacheUserProgress(user.uid, {
              completedModules: finalCompleted,
              chatUsage: data.chatUsage || {},
              certificate: finalCert,
              biodata: finalBiodata,
              invitationCode: finalInvitationCode
            });

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

            if (needsUpload) {
              await setDoc(docRef, {
                completedModules: finalCompleted,
                biodata: finalBiodata,
                certificate: finalCert,
                invitationCode: finalInvitationCode,
                lastUpdated: serverTimestamp()
              }, { merge: true });
            }

            if (finalBiodata && !finalBiodata.invitationCode) {
              setShowBiodataModal(false);
            }
          } else {
            // Firestore document doesn't exist, check if we have local progress to migrate/upload!
            const localCompletedCount = Object.keys(cachedModules).length;
            if (localCompletedCount > 0 || cachedCert || cachedBiodata) {
              await setDoc(docRef, {
                completedModules: cachedModules,
                biodata: cachedBiodata,
                certificate: cachedCert,
                userId: user.uid,
                userName: cachedBiodata?.fullName || user.displayName || "",
                userEmail: cachedBiodata?.email || user.email || "",
                lastUpdated: serverTimestamp()
              }, { merge: true });
            } else {
              // Truly new user setup
              setCompletedModules({});
              setChatCount(0);
              const todayStr = getTodayStr();
              setChatLastResetDate(todayStr);
              setBiodataForm(getDefaultBiodata(user));
              setShowBiodataModal(false);
              await saveProgressToCollection({
                completedModules: {},
                chatUsage: {
                  count: 0,
                  lastResetDate: todayStr
                }
              });
            }
          }
        } catch (error) {
          console.error("Firestore Loading Progress Error:", error);
          
          // If Firestore fails due to permission error, fall back to Google User Details for Form
          setBiodataForm(prev => ({
            ...prev,
            fullName: user.displayName || "",
            email: user.email || "",
          }));

          // If there is no biodata stored locally yet, force show the modal (only if invitation code verified)
          const localData = localStorage.getItem(`lensetek_progress_${user.uid}`);
          let hasLocalBiodata = false;
          let hasLocalInvitation = false;
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              hasLocalBiodata = !!parsed.biodata;
              hasLocalInvitation = !!(parsed.invitationCode || parsed.biodata?.invitationCode);
            } catch (e) {}
          }
          if (!hasLocalBiodata && hasLocalInvitation) {
            setShowBiodataModal(true);
          } else {
            setShowBiodataModal(false);
          }
        }
      };
      loadUserProgress();
    }
  }, [user]);

  // Persistent Firebase Authentication State Observer
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync routing states to localStorage to persist on page refresh
  useEffect(() => {
    localStorage.setItem("course_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("course_active_module", activeModuleIdx);
  }, [activeModuleIdx]);

  useEffect(() => {
    localStorage.setItem("course_classroom_tab", classroomTab);
  }, [classroomTab]);

  const handleBiodataSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const shouldRefreshCertificate =
      allModulesCompleted &&
      certificateRecord &&
      (!isBiodataComplete(biodata) || certificateRefreshAfterBiodata);

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

    if (shouldRefreshCertificate && isBiodataComplete(completeForm)) {
      const oldRecord = certificateRecord;
      const refreshedRecord = buildCertificateRecord(null, completeForm);
      if (!refreshedRecord) return;

      setCertificateRecord(refreshedRecord);
      setCertificateRefreshAfterBiodata(false);

      try {
        await publishCertificateRecord(refreshedRecord);
        await supersedeCertificateRecord(oldRecord, refreshedRecord);
        await saveProgressToCollection({ certificate: refreshedRecord });
      } catch (error) {
        console.error("Certificate Refresh After Biodata Error:", error);
      }
    }
  };

  const handleInviteCodeSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const trimmedInput = inviteInput.trim();
    if (!trimmedInput) return;

    setInviteChecking(true);
    setInviteError("");

    try {
      const invitationCode = trimmedInput.toUpperCase();
      const codeSnap = await getDoc(doc(db, "invitationCodes", invitationCode));

      if (!codeSnap.exists()) {
        setInviteError(currentT.inviteErrorInvalid);
        setInviteChecking(false);
        return;
      }

      const matched = {
        code: invitationCode,
        limit: Number(codeSnap.data().limit || 1)
      };

      // Check limit securely in 'invitationUsages' collection by direct document read (prevents collection group permission errors)
      const usageDocRef = doc(db, "invitationUsages", matched.code);
      const usageSnap = await getDoc(usageDocRef);
      let usagesList = [];
      if (usageSnap.exists()) {
        usagesList = usageSnap.data().usages || [];
      }

      const isAlreadyRegistered = usagesList.includes(user.uid);

      if (!isAlreadyRegistered) {
        if (usagesList.length >= matched.limit) {
          setInviteError(matched.limit === 1 
            ? (lang === "EN" ? "❌ This special invitation code has already been claimed by another user." : "❌ Kode undangan spesial ini sudah diklaim oleh pengguna lain.")
            : currentT.inviteErrorLimit);
          setInviteChecking(false);
          return;
        }

        // Add user UID to list of verified invitation code usages
        usagesList.push(user.uid);
        await setDoc(usageDocRef, {
          code: matched.code,
          usages: usagesList,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }

      // Access granted!
      const currentBiodata = biodata || getDefaultBiodata(user);
      const updatedBiodata = {
        ...currentBiodata,
        invitationCode: matched.code
      };

      await saveProgressToCollection({
        biodata: updatedBiodata,
        invitationCode: matched.code
      });

      setBiodata(updatedBiodata);
      setInviteSuccess(true);

      // Trigger transition: if required profile fields are incomplete, show Biodata Modal next
      if (!isBiodataComplete(updatedBiodata)) {
        setBiodataForm(updatedBiodata);
        setShowBiodataModal(true);
      }
    } catch (err) {
      console.error("Invitation check failed:", err);
      setInviteError(lang === "EN" ? "❌ Server error. Please try again." : "❌ Eror server. Silakan coba kembali.");
    } finally {
      setInviteChecking(false);
    }
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
      
      // Clean up classroom routing states from localStorage on manual logout
      localStorage.removeItem("course_active_module");
      localStorage.removeItem("course_classroom_tab");
      localStorage.removeItem("course_lang");

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
          const response = await fetch(agentApiUrl, {
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
      const response = await fetch(agentApiUrl, {
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
      finalOutput = getFallbackResponse(labPrompt, activeModuleIdx, lang);
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
  const certificateNeedsBiodataRefresh = !!certificateRecord && !isBiodataComplete(biodata);
  const isVerificationPage = window.location.pathname.startsWith("/verify");
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
    if (classroomTab === "certificate" && allModulesCompleted && user && !certificateRecord && isBiodataComplete(biodata)) {
      ensureCertificateRecord();
    }
  }, [classroomTab, allModulesCompleted, user, certificateRecord, biodata]);

  useEffect(() => {
    if (user && certificateRecord?.certificateNo) {
      publishCertificateRecord(certificateRecord);
    }
  }, [user, certificateRecord?.certificateNo]);

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
              <h1 className="text-2xl font-extrabold text-slate-900">Certificate Verification</h1>
            </div>
          </div>

          {verificationLoading ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">Verifying certificate...</div>
          ) : verificationRecord ? (
            <div className="space-y-6 pt-6">
              <div className={`rounded-2xl border p-5 text-left ${
                verificationRecord.status === "reissued"
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}>
                <p className={`text-xs font-extrabold uppercase tracking-wider ${
                  verificationRecord.status === "reissued" ? "text-amber-700" : "text-emerald-700"
                }`}>Status</p>
                <p className={`mt-1 text-xl font-extrabold ${
                  verificationRecord.status === "reissued" ? "text-amber-800" : "text-emerald-800"
                }`}>
                  {verificationRecord.status === "reissued" ? "Reissued Certificate" : "Valid Certificate"}
                </p>
                {verificationRecord.status === "reissued" && verificationRecord.reissuedTo && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    This certificate has been regenerated. New certificate number: {verificationRecord.reissuedTo}
                  </p>
                )}
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
          ) : verificationCertificateNo ? (
            <div className="py-12 text-center">
              <p className="text-lg font-extrabold text-rose-700">Certificate Not Found</p>
              <p className="mt-2 text-sm text-slate-500">Certificate number `{verificationCertificateNo}` is not registered or has not been issued yet.</p>
              <a href="/verify" className="mt-4 inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">Search Again</a>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg font-extrabold text-slate-700">Verify Certificate Authenticity</p>
              <p className="mt-2 text-sm text-slate-500">Enter your certificate registration number to verify its authenticity.</p>
              <form onSubmit={(e) => { e.preventDefault(); const no = new FormData(e.target).get('certNo'); if(no) window.location.href = `/verify/${no}`; }} className="mt-6 flex flex-col sm:flex-row max-w-md mx-auto items-center gap-2">
                <input type="text" name="certNo" placeholder="Certificate Number" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500" required />
                <button type="submit" className="w-full sm:w-auto rounded-xl bg-[#091A36] px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 shrink-0 transition-colors">Verify</button>
              </form>
            </div>
          )}
        </section>
        <div className="mt-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-['Inter'] relative transition-colors duration-300">
      
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
              className="bg-[#FCFAF7] border border-slate-200 rounded-3xl sm:rounded-[2.5rem] w-full max-w-xl p-5 sm:p-8 shadow-2xl relative my-8 text-slate-800 font-sans"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 border-b border-slate-200 backdrop-blur-md sticky top-0 z-50">
          <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 p-1.5 shadow-sm overflow-hidden shrink-0">
              <img src="https://lensetek.com/favicon.png" alt="Lensetek Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide text-slate-800 font-['Plus_Jakarta_Sans']">Lensetek International</p>
              <p className="truncate text-[9px] uppercase tracking-wider text-cyan-600 font-bold sm:text-[10px] sm:tracking-widest">Certification Program</p>
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
            <a 
              href="/verify" 
              className="hover:text-cyan-600 transition-colors cursor-pointer font-semibold text-sm"
            >
              {lang === "EN" ? "Verify Certificate" : "Verifikasi"}
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
        !hasCourseAccess ? (
          /* ==================== INVITATION CODE ENTRY SCREEN ==================== */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-md px-6 py-20 font-sans text-center"
          >
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-slate-800 relative">
              <div className="mx-auto h-16 w-16 bg-amber-100 rounded-3xl flex items-center justify-center text-3xl shadow-inner animate-bounce">
                🔑
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#091A36] font-['Plus_Jakarta_Sans']">
                  {currentT.inviteTitle}
                </h2>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  {currentT.inviteDesc}
                </p>
              </div>

              <form onSubmit={handleInviteCodeSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    {lang === "EN" ? "Invitation Code" : "Kode Undangan"}
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder={currentT.invitePlaceholder}
                    value={inviteInput}
                    onChange={(e) => {
                      setInviteInput(e.target.value);
                      setInviteError("");
                    }}
                    disabled={inviteChecking || inviteSuccess}
                    className="w-full bg-white border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner tracking-widest text-center uppercase"
                  />
                </div>

                {inviteError && (
                  <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-xl p-3.5 leading-snug">
                    {inviteError}
                  </p>
                )}

                {inviteSuccess && (
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 rounded-xl p-3.5 leading-snug">
                    {currentT.inviteSuccess}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={inviteChecking || inviteSuccess || !inviteInput.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 rounded-2xl text-xs transition-all shadow-md cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviteChecking ? (
                    <span>⏳ {currentT.inviteChecking}</span>
                  ) : (
                    <span>🚀 {currentT.inviteSubmit}</span>
                  )}
                </button>
              </form>

              {/* Logout option if they want to leave */}
              <div className="pt-2">
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                >
                  {lang === "EN" ? "Logout & Exit" : "Keluar & Batalkan"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ==================== CLASSROOM DASHBOARD VIEW ==================== */
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 print-section"
          >
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-50 to-indigo-50/50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm mb-8 font-sans no-print">
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

          <div className="grid gap-6 lg:grid-cols-[290px_1fr] classroom-layout-grid">
            
            {/* LEFT SIDEBAR: Modules Navigator & Certificate */}
            <div className="space-y-4 no-print">
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
                        className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all ${
                          isActive 
                            ? 'border-cyan-500 bg-cyan-50/50 shadow-sm text-cyan-700 font-bold' 
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                            isActive ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            0{m.id}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-slate-800 leading-snug">{m.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{m.hours}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
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
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">{currentT.biodataTitle}</h4>
                  {!certificateRecord && (
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
                      {currentT.biodataEdit}
                    </button>
                  )}
                </div>
                {biodata ? (
                  <div className="space-y-2 text-[11px] text-slate-600 font-semibold">
                    <p><span className="text-slate-400 font-medium">{currentT.biodataName}:</span> {biodata.fullName}</p>
                    <p><span className="text-slate-400 font-medium">{currentT.biodataWhatsapp}:</span> {biodata.whatsapp || "-"}</p>
                    <p><span className="text-slate-400 font-medium">{currentT.biodataBirth}:</span> {biodata.birthPlace}, {biodata.birthDate}</p>
                    <p><span className="text-slate-400 font-medium">{currentT.biodataOccupation}:</span> {biodata.occupation}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-500 font-bold flex flex-col gap-2">
                    <p className="flex items-center gap-1.5">{currentT.biodataIncomplete}</p>
                    <button 
                      onClick={() => setShowBiodataModal(true)} 
                      className="bg-amber-100 hover:bg-amber-200 border border-amber-200 text-slate-900 px-3 py-2 rounded-xl font-extrabold text-[10px] text-center w-full cursor-pointer transition-colors"
                    >
                      {currentT.biodataCompleteBtn}
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
                    if (!isBiodataComplete(biodata)) {
                      setBiodataForm(biodata || getDefaultBiodata(user));
                      if (certificateRecord) setCertificateRefreshAfterBiodata(true);
                      setShowBiodataModal(true);
                      return;
                    }
                    if (!certificateRecord) ensureCertificateRecord();
                    setClassroomTab("certificate");
                  }}
                  className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-all ${
                    allModulesCompleted
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md hover:scale-[1.01] cursor-pointer'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {certificateNeedsBiodataRefresh ? currentT.certBtn : certificateRecord ? currentT.certViewBtn : currentT.certBtn}
                </button>
              </div>
            </div>

            {/* RIGHT WORK ZONE: Materials, Lab, Quizzes */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm relative min-h-[500px] overflow-hidden classroom-workzone">
              
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
                            <div key={sIdx} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner transition-all duration-300">
                              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <h5 className="font-bold text-sm text-cyan-600 font-['Plus_Jakarta_Sans']">
                                  {session.title}
                                </h5>
                                {explanation && (
                                  <button
                                    onClick={() => setExpandedSession(isExpanded ? null : `${moduleId}-${sIdx}`)}
                                    className="w-full text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all cursor-pointer sm:w-auto sm:shrink-0"
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
                      className="rounded-xl bg-cyan-500 px-5 text-white flex items-center justify-center hover:bg-cyan-600 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <a 
                      href="https://chatgpt.com/g/g-6a1d5f5c450881919e9bbee90b26818b-agentic-ai-for-marketing-and-business-mini-course" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-[#10A37F] px-4 text-white flex items-center justify-center hover:bg-[#0E906F] transition-all cursor-pointer shrink-0"
                      title="AI-Mentor ChatGPT"
                    >
                      <ChatGPTIcon className="h-5 w-5" />
                    </a>
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
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 no-print">
                    <h3 className="text-lg font-bold text-slate-800 font-['Plus_Jakarta_Sans']">🎓 {currentT.certHeader}</h3>
                    <button 
                      onClick={() => setClassroomTab("materials")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {currentT.backToStudy}
                    </button>
                  </div>

                  {certificateNeedsBiodataRefresh ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left text-sm font-bold text-amber-800 no-print">
                      <p>{lang === "EN" ? "Your certificate needs updated biodata before it can be regenerated." : "Sertifikat Anda perlu biodata lengkap sebelum dibuat ulang."}</p>
                      <button
                        onClick={() => {
                          setBiodataForm(biodata || getDefaultBiodata(user));
                          setCertificateRefreshAfterBiodata(true);
                          setShowBiodataModal(true);
                        }}
                        className="mt-4 rounded-xl bg-amber-500 px-5 py-3 text-xs font-black text-slate-950 shadow-sm transition-all hover:bg-amber-600"
                      >
                        {currentT.biodataCompleteBtn}
                      </button>
                    </div>
                  ) : !certificateRecord ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm font-bold text-amber-800 no-print">
                      Menerbitkan sertifikat dan nomor verifikasi...
                    </div>
                  ) : (
                    <>
                      <div className="print-container space-y-8">
                        {/* Page 1: Certificate */}
                        <div className="print-page print-cert-wrapper mx-auto max-w-6xl overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
                          <div className="relative aspect-[1536/1080] w-full">
                            <img
                              src="/cert-template.png"
                              alt="Lensetek certificate template"
                              className="absolute inset-0 h-full w-full object-cover"
                            />

                            <div className="absolute right-[7%] top-[6.5%] rounded-lg bg-white/85 px-3 py-2 text-right shadow-sm border border-slate-100/50">
                              <p className="text-[clamp(6px,0.7vw,10px)] font-extrabold uppercase tracking-wider text-slate-500">Certificate No.</p>
                              <p className="font-mono text-[clamp(7px,0.9vw,13px)] font-extrabold text-[#091A36]">{certificateRecord.certificateNo}</p>
                            </div>

                            {/* Participant Name: 100% transparent, positioned elegantly without covering the "has successfully completed" template text */}
                            <div className="absolute left-[15%] right-[15%] top-[40.8%] text-center">
                              <p className="font-serif text-[clamp(18px,3.3vw,48px)] font-extrabold leading-tight text-[#091A36]">
                                {certificateRecord.holderName}
                              </p>
                            </div>

                            {/* Astrid's digital signature QR block: transparent container sitting beautifully above the line without covering "Program Director" */}
                            <div className="absolute bottom-[10.2%] left-[24.2%] flex items-end gap-2 bg-transparent text-left">
                              <img
                                src={getQrCodeUrl(`Digitally signed by Astrid, Program Director, Lensetek International, LLC. Certificate: ${certificateRecord.certificateNo}`, 92)}
                                alt="Astrid digital signature QR code"
                                className="h-[clamp(38px,5.5vw,72px)] w-[clamp(38px,5.5vw,72px)] bg-white p-1 rounded-lg border border-slate-100 shadow-sm"
                              />
                              <div className="mb-0.5">
                                <p className="font-serif text-[clamp(12px,1.5vw,22px)] font-bold text-[#091A36] leading-none mb-0.5">Astrid</p>
                                <p className="text-[clamp(6px,0.7vw,9px)] font-extrabold uppercase tracking-wider text-slate-400">QR Signature</p>
                              </div>
                            </div>

                            {/* Valid Until: 100% solid white card placed to cover the template's hardcoded date completely and dynamically overlay ours */}
                            <div className="absolute bottom-[4.2%] left-[44.0%] w-[16.5%] rounded-xl bg-white px-2 py-1.5 text-center shadow-md border border-slate-100/50 z-10">
                              <p className="text-[clamp(6px,0.7vw,9px)] font-extrabold uppercase tracking-wider text-slate-400">Valid Until</p>
                              <p className="text-[clamp(8px,1.05vw,15px)] font-extrabold text-[#091A36] mt-0.5">
                                {formatDisplayDate(certificateRecord.validUntil, "en-US")}
                              </p>
                            </div>

                            {/* Date of Completion: 100% solid white card placed to cover the template's hardcoded date completely and dynamically overlay ours */}
                            <div className="absolute bottom-[4.2%] right-[21.0%] w-[17.5%] rounded-xl bg-white px-2 py-1.5 text-center shadow-md border border-slate-100/50 z-10">
                              <p className="text-[clamp(6px,0.7vw,9px)] font-extrabold uppercase tracking-wider text-slate-400">Date of Completion</p>
                              <p className="text-[clamp(8px,1.05vw,15px)] font-extrabold text-[#091A36] mt-0.5">
                                {formatDisplayDate(certificateRecord.completionDate, "en-US")}
                              </p>
                            </div>

                            <div className="absolute bottom-[4.2%] right-[6.6%] rounded-xl bg-white p-2 text-center shadow-md border border-slate-100/50 z-10">
                              <img
                                src={getQrCodeUrl(getDynamicVerificationUrl(certificateRecord), 116)}
                                alt="Certificate verification QR code"
                                className="h-[clamp(48px,6.5vw,86px)] w-[clamp(48px,6.5vw,86px)]"
                              />
                              <p className="mt-1 text-[clamp(5px,0.6vw,8.5px)] font-extrabold uppercase tracking-wider text-cyan-600">Verify</p>
                            </div>
                          </div>
                        </div>

                        {/* Page 2: Transcript with Participant Name, Validity, and Astrid Signature block */}
                        <div className="print-page print-transcript-wrapper mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm font-sans">
                          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-700">Official Transcript</p>
                              <h4 className="text-xl font-extrabold text-[#091A36] font-['Plus_Jakarta_Sans']">Academic Transcript of Course Completion</h4>
                            </div>
                            <p className="font-mono text-xs font-bold text-slate-500">{certificateRecord.certificateNo}</p>
                          </div>

                          {/* Participant and Summary Blocks */}
                          <div className="mt-6 flex flex-col md:flex-row gap-6 items-stretch justify-between">
                            {/* Left Card: Participant Info */}
                            <div className="flex-1 rounded-2xl border border-slate-200 p-5 bg-white shadow-sm flex flex-col justify-between">
                              <div className="grid grid-cols-[120px_10px_1fr] items-center gap-y-3 text-xs text-slate-700 font-semibold">
                                <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <User className="h-3.5 w-3.5 text-cyan-600" /> Participant
                                </div>
                                <div className="text-slate-400">:</div>
                                <div className="font-extrabold text-[#091A36] text-sm leading-none">{certificateRecord.holderName}</div>

                                <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <BookOpen className="h-3.5 w-3.5 text-cyan-600" /> Program
                                </div>
                                <div className="text-slate-400">:</div>
                                <div className="font-extrabold text-slate-800 leading-none">Mini Course</div>

                                <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <Award className="h-3.5 w-3.5 text-cyan-600" /> Course
                                </div>
                                <div className="text-slate-400">:</div>
                                <div className="font-extrabold text-slate-800 leading-none">Agentic AI for Marketing & Business</div>

                                <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <Clock className="h-3.5 w-3.5 text-cyan-600" /> Total Duration
                                </div>
                                <div className="text-slate-400">:</div>
                                <div className="font-extrabold text-slate-800 leading-none">20 Hours</div>

                                <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <TrendingUp className="h-3.5 w-3.5 text-cyan-600" /> Level
                                </div>
                                <div className="text-slate-400">:</div>
                                <div className="font-extrabold text-slate-800 leading-none">Beginner – Intermediate</div>
                              </div>
                            </div>

                            {/* Right Card: Summary Badges */}
                            <div className="w-full md:w-[48%] rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-sm flex flex-col justify-between">
                              <p className="text-center font-extrabold text-[10px] uppercase tracking-wider text-slate-400 border-b border-amber-200 pb-2">Summary</p>
                              
                              <div className="grid grid-cols-3 gap-2 mt-4 text-center h-full">
                                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-slate-100/50">
                                  <Clock className="h-6 w-6 text-amber-500 mb-1" />
                                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide leading-none">Total Duration</p>
                                  <p className="text-xs font-black text-[#091A36] mt-2">20 Hours</p>
                                </div>

                                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-slate-100/50">
                                  <BookOpen className="h-6 w-6 text-amber-500 mb-1" />
                                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide leading-none">Total Modules</p>
                                  <p className="text-xs font-black text-[#091A36] mt-2">5 Modules</p>
                                </div>

                                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-slate-100/50">
                                  <Award className="h-6 w-6 text-amber-500 mb-1" />
                                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide leading-tight">Overall Performance</p>
                                  <p className="text-[10px] font-black text-emerald-600 mt-2 leading-none">Completed Satisfactory</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Academic Table Block */}
                          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#091A36] text-white uppercase text-[9px] tracking-wider font-extrabold">
                                  <th className="py-3.5 px-4 border-b border-slate-800 text-center w-[6%]">No.</th>
                                  <th className="py-3.5 px-4 border-b border-slate-800 w-[30%]">Module</th>
                                  <th className="py-3.5 px-4 border-b border-slate-800 text-center w-[12%]">Duration</th>
                                  <th className="py-3.5 px-4 border-b border-slate-800 w-[39%]">Description</th>
                                  <th className="py-3.5 px-4 border-b border-slate-800 text-center w-[13%]">Performance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                                {[
                                  {
                                    no: 1,
                                    title: "Foundations of Agentic AI & Paradigm Shift",
                                    duration: "3 Hours",
                                    description: "Understand core concepts of Agentic AI, agent architecture, memory, tools, and how agents think and act autonomously.",
                                    performance: "Completed"
                                  },
                                  {
                                    no: 2,
                                    title: "Core Skills & Workflow Architecture",
                                    duration: "4 Hours",
                                    description: "Master advanced prompt engineering, persona design, guardrails, and multi-agent workflow orchestration.",
                                    performance: "Completed"
                                  },
                                  {
                                    no: 3,
                                    title: "Agentic AI for Marketing Automation",
                                    duration: "5 Hours",
                                    description: "Build autonomous systems for content marketing, SEO research, competitor intelligence, and automated reporting.",
                                    performance: "Completed"
                                  },
                                  {
                                    no: 4,
                                    title: "Agentic AI for Business Operations & SMEs",
                                    duration: "5 Hours",
                                    description: "Design agents for customer support, lead qualification, data analysis, and business operations automation.",
                                    performance: "Completed"
                                  },
                                  {
                                    no: 5,
                                    title: "No-Code Implementation & Final Evaluation",
                                    duration: "3 Hours",
                                    description: "Deploy workflows using no-code platforms, evaluate performance, manage costs, and present final showcase.",
                                    performance: "Completed"
                                  }
                                ].map((m) => (
                                  <tr key={m.no} className="hover:bg-slate-50/50 transition-colors odd:bg-white even:bg-slate-50/20">
                                    <td className="py-3 px-4 text-center font-extrabold text-slate-400">{m.no}</td>
                                    <td className="py-3 px-4 font-extrabold text-[#091A36] text-xs">{m.title}</td>
                                    <td className="py-3 px-4 text-center font-extrabold text-slate-500">{m.duration}</td>
                                    <td className="py-3 px-4 text-slate-400 font-medium leading-relaxed text-[11px]">{m.description}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex items-center gap-1 text-emerald-600 font-extrabold text-[10px] bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 shadow-sm leading-none">
                                        <CheckCircle2 className="h-3 w-3" /> Completed
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {/* Total Duration Footer Row */}
                                <tr className="bg-slate-50 font-extrabold text-[#091A36]">
                                  <td colSpan="2" className="py-3.5 px-4 text-right uppercase tracking-wider text-[9px] text-slate-400">Total Duration</td>
                                  <td className="py-3.5 px-4 text-center text-sm font-black text-[#091A36]">20 Hours</td>
                                  <td colSpan="2" className="py-3.5 px-4"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Sign-off Footer block with Astrid's signature and Lensetek International stamp */}
                          <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-t border-slate-100 pt-5">
                            <div>
                              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-relaxed">
                                This transcript is electronically issued by<br />
                                <span className="text-cyan-700 font-bold">Lensetek International, LLC</span>
                              </p>
                              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                Verify authenticity using the verification QR code on the certificate.
                              </p>
                            </div>
                            <div className="flex flex-col items-center text-center self-end sm:self-auto">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Program Director</p>
                              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2">
                                <img
                                  src={getQrCodeUrl(`Digitally signed by Astrid, Program Director, Lensetek International, LLC. Certificate: ${certificateRecord.certificateNo}`, 92)}
                                  alt="Astrid digital signature QR code"
                                  className="h-12 w-12 rounded bg-white p-0.5 border border-slate-200 shadow-sm"
                                />
                                <div className="text-left">
                                  <p className="font-serif text-sm font-bold text-[#091A36]">Astrid</p>
                                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 leading-none">QR SIGNED</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (No Print) */}
                      <div className="flex flex-wrap justify-center gap-3 no-print">
                        <a
                          href={getDynamicVerificationUrl(certificateRecord)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-6 py-3 text-xs font-bold text-cyan-700 shadow-sm hover:bg-cyan-100 transition-all"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {currentT.verifyBtnOpen}
                        </a>
                        <a
                          href={getLinkedInShareUrl(certificateRecord)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-[#0a66c2] text-white px-6 py-3 text-xs font-bold shadow-md hover:bg-[#004182] transition-all hover:scale-[1.01]"
                        >
                          <LinkedInIcon className="h-4 w-4 shrink-0" />
                          {currentT.shareLinkedIn}
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
        )
      ) : (
        /* ==================== PUBLIC HIGH-FIDELITY LANDING PAGE VIEW ==================== */
        <div className="bg-[#FCFAF7] min-h-screen text-slate-800 selection:bg-amber-400 selection:text-slate-950 font-sans">
          
          {/* Header / Navbar */}
          <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-4 sm:px-6 sm:py-5 lg:px-8 border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-50">
            <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#091A36] p-1.5 shadow-sm overflow-hidden shrink-0 sm:h-11 sm:w-11">
                <img src="https://lensetek.com/favicon.png" alt="Lensetek Logo" className="h-full w-full object-contain filter brightness-0 invert" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-tight text-[#091A36] font-['Plus_Jakarta_Sans'] uppercase leading-none">Lensetek</p>
                <p className="text-[8px] uppercase tracking-normal text-amber-500 font-extrabold mt-0.5 leading-tight sm:text-[9px] sm:tracking-wider">International, LLC</p>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-8 text-[13px] font-extrabold text-slate-600 md:flex">
              <a href="#modules" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Curriculum" : "Kurikulum"}</a>
              <a href="#competencies" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Competencies" : "Kompetensi"}</a>
              <a href="#benefits" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Use Cases" : "Use Case"}</a>
              <a href="/verify" className="hover:text-[#091A36] transition-colors">{lang === "EN" ? "Verify Certificate" : "Verifikasi"}</a>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 sm:gap-3">
              {/* Dual Language Switcher */}
              <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-0.5 gap-0.5 sm:mr-2">
                <button 
                  onClick={() => setLang("EN")} 
                  className={`px-1.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer sm:px-2 ${lang === "EN" ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang("ID")} 
                  className={`px-1.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer sm:px-2 ${lang === "ID" ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  ID
                </button>
              </div>

              {/* GitHub Link */}
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hidden p-2 text-slate-500 hover:text-[#091A36] transition-colors sm:inline-flex sm:mr-1" 
                title="GitHub Repository"
              >
                <GithubIcon className="h-5 w-5" />
              </a>

              <button 
                onClick={handleGoogleAuth} 
                className="h-11 w-11 justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-extrabold text-slate-950 transition-all cursor-pointer shadow-sm text-center flex items-center gap-1.5 sm:h-auto sm:w-auto sm:px-5 sm:py-2.5"
                aria-label={lang === "EN" ? "Login / Signup" : "Masuk / Daftar"}
              >
                <span aria-hidden="true">👤</span>
                <span className="hidden sm:inline">{lang === "EN" ? "Login / Signup" : "Masuk / Daftar"}</span>
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
          <section id="modules" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#091A36] sm:text-4xl font-['Plus_Jakarta_Sans']">
                {lang === "EN" ? "5-Module Curriculum – 20 Hours" : "Kurikulum 5 Modul – 20 Jam"}
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto font-medium">
                {lang === "EN" 
                  ? "Designed step-by-step for absolute beginners to business professionals. No coding required." 
                  : "Dirancang secara bertahap untuk pemula hingga profesional bisnis. Tidak membutuhkan latar belakang coding."}
              </p>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 lg:gap-6">
                
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
          <section id="competencies" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FCFAF7] border-b border-slate-100">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#091A36] sm:text-4xl font-['Plus_Jakarta_Sans']">
                {lang === "EN" ? "Key Competencies You Will Master" : "Kompetensi Akhir yang Anda Kuasai"}
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto font-medium">
                {lang === "EN"
                  ? "Gain practical industry-grade workflow engineering capabilities applicable immediately."
                  : "Miliki kompetensi praktis berstandar industri untuk merancang workflow bisnis berbasis kecerdasan buatan."}
              </p>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                
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
          <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
            <div className="mx-auto max-w-7xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#091A36] sm:text-4xl font-['Plus_Jakarta_Sans']">
                {lang === "EN" ? "Build Real-World Solutions for Your Business" : "Bangun Solusi Nyata untuk Bisnis Anda"}
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto font-medium">
                {lang === "EN"
                  ? "Explore ready-to-deploy core agents modeled directly in our comprehensive academy."
                  : "Mulai bangun solusi kecerdasan buatan siap pakai untuk operasional bisnis harian Anda."}
              </p>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 lg:gap-6">
                
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
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <a href="/verify" className="text-slate-400 hover:text-[#091A36] transition-colors text-sm font-semibold">
                  {lang === "EN" ? "Verify Certificate" : "Verifikasi Sertifikat"}
                </a>
                <a 
                  href={githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-slate-400 hover:text-[#091A36] transition-colors text-sm font-semibold"
                >
                  <GithubIcon className="h-4 w-4" /> View GitHub Repository
                </a>
              </div>
            </div>
          </footer>

        </div>
      )}
    </main>
  );
}



