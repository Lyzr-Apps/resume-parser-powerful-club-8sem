'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  FiUpload, FiFile, FiCopy, FiDownload, FiTrash2,
  FiClock, FiX, FiCheck,
  FiAlertCircle, FiUser, FiMail, FiPhone, FiMapPin,
  FiLinkedin, FiGithub, FiGlobe, FiBookOpen, FiAward,
  FiBriefcase, FiCode, FiTarget, FiFileText, FiZap,
  FiTrendingUp, FiChevronDown, FiChevronUp, FiArrowRight,
  FiCheckCircle, FiAlertTriangle, FiStar
} from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'

// ──────────────────────────────────────────
// TypeScript Interfaces
// ──────────────────────────────────────────

interface ContactInfo {
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  github_url: string | null
}

interface Skill {
  skill_name: string
  proficiency_level: string | null
  years_of_experience: number | string | null
}

interface WorkExperience {
  company_name: string | null
  job_title: string | null
  start_date: string | null
  end_date: string | null
  location: string | null
  responsibilities: string[]
  achievements: string[]
}

interface Education {
  institution: string | null
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  gpa: number | string | null
  honors: string | null
}

interface Certification {
  name: string | null
  issuing_organization: string | null
  date_obtained: string | null
  expiry_date: string | null
  credential_id: string | null
}

interface Language {
  language: string
  proficiency: string | null
}

interface Project {
  project_name: string | null
  description: string | null
  technologies_used: string[]
  url: string | null
}

interface ParsedResume {
  contact_info: ContactInfo
  professional_summary: string | null
  skills: Skill[]
  work_experience: WorkExperience[]
  education: Education[]
  certifications: Certification[]
  languages: Language[]
  projects: Project[]
}

interface ParseHistoryItem {
  id: string
  fileName: string
  parsedAt: string
  status: 'success' | 'partial' | 'error'
  data: ParsedResume
  rawJson: string
}

interface CategoryScores {
  keyword_optimization: number
  formatting_structure: number
  experience_relevance: number
  skills_coverage: number
  education_certifications: number
  quantifiable_achievements: number
  content_quality: number
}

interface ATSSuggestion {
  category: string
  priority: string
  current: string
  recommended: string
  impact: string
}

interface KeywordAnalysis {
  matched_keywords: string[]
  missing_keywords: string[]
  keyword_density_score: number
}

interface ATSScoreResult {
  overall_score: number
  category_scores: CategoryScores
  strengths: string[]
  weaknesses: string[]
  suggestions: ATSSuggestion[]
  keyword_analysis: KeywordAnalysis
  summary: string
}

interface CoverLetterResult {
  cover_letter: string
  key_highlights: string[]
  tone: string
  word_count: number
  matched_qualifications: string[]
  customization_notes: string[]
}

interface ChangesMade {
  section: string
  original: string
  optimized: string
  reason: string
}

interface ATSImprovementEstimate {
  original_estimated_score: number
  optimized_estimated_score: number
  improvement_points: number
}

interface ResumeOptimizerResult {
  optimized_resume: ParsedResume
  changes_made: ChangesMade[]
  ats_improvement_estimate: ATSImprovementEstimate
  optimization_summary: string
  keywords_added: string[]
  keywords_emphasized: string[]
}

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────

const PARSER_AGENT_ID = '699ec2e39a2868b8ab9f774a'
const ATS_AGENT_ID = '699ec7789a2868b8ab9f7a8f'
const COVER_LETTER_AGENT_ID = '699ec77863b93379f288d2f2'
const OPTIMIZER_AGENT_ID = '699ec779fb412608ab723762'

const HISTORY_KEY = 'resumeforge_history'
const MAX_HISTORY = 20

const THEME_VARS = {
  '--background': '0 0% 100%',
  '--foreground': '222 47% 11%',
  '--card': '0 0% 98%',
  '--card-foreground': '222 47% 11%',
  '--popover': '0 0% 96%',
  '--primary': '222 47% 11%',
  '--primary-foreground': '210 40% 98%',
  '--secondary': '210 40% 96%',
  '--secondary-foreground': '222 47% 11%',
  '--accent': '210 40% 92%',
  '--muted': '210 40% 94%',
  '--muted-foreground': '215 16% 47%',
  '--border': '214 32% 91%',
  '--input': '214 32% 85%',
  '--ring': '222 47% 11%',
  '--destructive': '0 84% 60%',
  '--sidebar-background': '210 40% 97%',
  '--sidebar-border': '214 32% 91%',
  '--radius': '0.875rem',
} as React.CSSProperties

const AGENTS_INFO = [
  { id: PARSER_AGENT_ID, name: 'Resume Parser', desc: 'Extracts structured data from resumes' },
  { id: ATS_AGENT_ID, name: 'ATS Score Analyzer', desc: 'Scores resume for ATS compatibility' },
  { id: COVER_LETTER_AGENT_ID, name: 'Cover Letter Generator', desc: 'Creates tailored cover letters' },
  { id: OPTIMIZER_AGENT_ID, name: 'Resume Optimizer', desc: 'Optimizes resume for target JD' },
]

// ──────────────────────────────────────────
// Sample Data
// ──────────────────────────────────────────

const SAMPLE_RESUME: ParsedResume = {
  contact_info: {
    full_name: 'Alexandra Chen',
    email: 'alexandra.chen@email.com',
    phone: '+1 (415) 555-0182',
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/alexandrachen',
    portfolio_url: 'https://alexandrachen.dev',
    github_url: 'https://github.com/alexchen',
  },
  professional_summary: 'Senior Full-Stack Engineer with 8+ years of experience building scalable web applications and distributed systems. Expertise in React, Node.js, and cloud-native architectures. Led engineering teams at two YC-backed startups through successful Series A raises. Passionate about developer experience, performance optimization, and mentoring junior engineers.',
  skills: [
    { skill_name: 'React / Next.js', proficiency_level: 'Expert', years_of_experience: 6 },
    { skill_name: 'TypeScript', proficiency_level: 'Expert', years_of_experience: 5 },
    { skill_name: 'Node.js', proficiency_level: 'Advanced', years_of_experience: 7 },
    { skill_name: 'Python', proficiency_level: 'Advanced', years_of_experience: 4 },
    { skill_name: 'PostgreSQL', proficiency_level: 'Advanced', years_of_experience: 6 },
    { skill_name: 'AWS', proficiency_level: 'Advanced', years_of_experience: 5 },
    { skill_name: 'Docker / Kubernetes', proficiency_level: 'Intermediate', years_of_experience: 3 },
    { skill_name: 'GraphQL', proficiency_level: 'Advanced', years_of_experience: 4 },
  ],
  work_experience: [
    {
      company_name: 'Streamline AI',
      job_title: 'Senior Software Engineer',
      start_date: 'Jan 2022',
      end_date: 'Present',
      location: 'San Francisco, CA',
      responsibilities: [
        'Architected and built the core data pipeline processing 2M+ events/day using Node.js and Kafka',
        'Led a team of 5 engineers in redesigning the frontend platform, improving load times by 40%',
        'Implemented CI/CD pipelines with GitHub Actions reducing deployment time from 45min to 8min',
      ],
      achievements: [
        'Reduced infrastructure costs by 35% through containerization and auto-scaling',
        'Mentored 3 junior developers, all promoted within 12 months',
      ],
    },
    {
      company_name: 'DataVault Inc.',
      job_title: 'Full-Stack Developer',
      start_date: 'Mar 2019',
      end_date: 'Dec 2021',
      location: 'Remote',
      responsibilities: [
        'Built real-time analytics dashboard serving 50K+ daily active users',
        'Designed RESTful and GraphQL APIs for mobile and web clients',
        'Conducted code reviews and established coding standards for the engineering team',
      ],
      achievements: [
        'Shipped a feature that increased user retention by 22%',
        'Won internal hackathon with an AI-powered search prototype',
      ],
    },
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      start_date: '2013',
      end_date: '2017',
      gpa: 3.85,
      honors: 'Magna Cum Laude',
    },
  ],
  certifications: [
    {
      name: 'AWS Solutions Architect - Associate',
      issuing_organization: 'Amazon Web Services',
      date_obtained: 'Mar 2023',
      expiry_date: 'Mar 2026',
      credential_id: 'AWS-SAA-29481',
    },
    {
      name: 'Google Professional Cloud Developer',
      issuing_organization: 'Google Cloud',
      date_obtained: 'Nov 2022',
      expiry_date: 'Nov 2024',
      credential_id: 'GCP-PCD-18274',
    },
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Mandarin Chinese', proficiency: 'Fluent' },
    { language: 'Spanish', proficiency: 'Conversational' },
  ],
  projects: [
    {
      project_name: 'DevBoard',
      description: 'Open-source developer productivity dashboard aggregating GitHub, Jira, and Slack metrics into a unified view with customizable widgets.',
      technologies_used: ['React', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'],
      url: 'https://github.com/alexchen/devboard',
    },
    {
      project_name: 'QuickDeploy CLI',
      description: 'A command-line tool that automates cloud deployment workflows across AWS, GCP, and Azure with a single configuration file.',
      technologies_used: ['Go', 'Terraform', 'AWS SDK', 'GCP SDK'],
      url: 'https://github.com/alexchen/quickdeploy',
    },
  ],
}

const SAMPLE_ATS: ATSScoreResult = {
  overall_score: 78,
  category_scores: {
    keyword_optimization: 72,
    formatting_structure: 90,
    experience_relevance: 85,
    skills_coverage: 70,
    education_certifications: 82,
    quantifiable_achievements: 80,
    content_quality: 75,
  },
  strengths: [
    'Strong quantifiable achievements with specific metrics (40% load time improvement, 35% cost reduction)',
    'Well-structured work experience with clear responsibilities and achievements separation',
    'Relevant certifications from major cloud providers (AWS, GCP)',
    'Diverse technical skill set covering full-stack development',
  ],
  weaknesses: [
    'Professional summary could be more targeted to specific roles',
    'Missing some industry-standard keywords for senior engineering roles',
    'Skills section lacks categorization (frontend vs backend vs devops)',
    'No mention of specific Agile/Scrum methodology experience',
  ],
  suggestions: [
    {
      category: 'Keywords',
      priority: 'high',
      current: 'Generic skill listing without context',
      recommended: 'Add role-specific keywords like "system design", "microservices", "CI/CD pipeline"',
      impact: 'Could improve ATS keyword matching by 15-20%',
    },
    {
      category: 'Summary',
      priority: 'medium',
      current: 'Broad professional summary',
      recommended: 'Tailor summary to include target job title and 2-3 key differentiators',
      impact: 'Increases recruiter engagement in first 6 seconds',
    },
    {
      category: 'Skills',
      priority: 'low',
      current: 'Flat skills list',
      recommended: 'Group skills into categories: Languages, Frameworks, Cloud, DevOps, Databases',
      impact: 'Improves readability and ATS section parsing',
    },
  ],
  keyword_analysis: {
    matched_keywords: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'GraphQL', 'Docker', 'CI/CD', 'Kubernetes'],
    missing_keywords: ['system design', 'microservices', 'REST API', 'Agile', 'Scrum', 'TDD', 'monitoring', 'observability'],
    keyword_density_score: 68,
  },
  summary: 'This resume demonstrates strong technical experience and quantifiable achievements. The main areas for improvement are keyword optimization and better alignment with common ATS parsing patterns. With targeted adjustments, the ATS score could improve to 85-90.',
}

const SAMPLE_COVER_LETTER: CoverLetterResult = {
  cover_letter: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Software Engineer position at your company. With over 8 years of experience building scalable web applications and leading engineering teams, I am confident in my ability to make a significant contribution to your organization.\n\nIn my current role as Senior Software Engineer at Streamline AI, I have architected core data pipelines processing over 2 million events daily and led a team of 5 engineers in a complete frontend platform redesign that improved load times by 40%. My expertise in React, Node.js, and cloud-native architectures aligns directly with your technical requirements.\n\nAt DataVault Inc., I built real-time analytics dashboards serving 50,000+ daily active users and designed APIs that powered both mobile and web clients. I have a proven track record of shipping features that drive measurable business impact, including a 22% improvement in user retention.\n\nI hold AWS Solutions Architect and Google Cloud Professional Developer certifications, demonstrating my commitment to staying current with cloud technologies. My experience with CI/CD pipelines, containerization, and auto-scaling has consistently delivered cost savings and improved deployment velocity.\n\nI would welcome the opportunity to discuss how my experience and skills can contribute to your team. Thank you for your consideration.\n\nSincerely,\nAlexandra Chen',
  key_highlights: [
    '8+ years of full-stack engineering experience',
    'Led teams and mentored junior developers to promotion',
    'Quantifiable impact: 40% load time improvement, 35% cost reduction',
    'Cloud certifications from AWS and Google',
  ],
  tone: 'Professional',
  word_count: 223,
  matched_qualifications: [
    'Full-stack development with React and Node.js',
    'Cloud infrastructure experience (AWS, GCP)',
    'Team leadership and mentoring',
    'Performance optimization and scalability',
  ],
  customization_notes: [
    'Emphasized cloud certifications to match cloud-first requirement',
    'Highlighted quantifiable achievements to demonstrate impact',
    'Focused on leadership experience for senior-level positioning',
  ],
}

const SAMPLE_OPTIMIZER: ResumeOptimizerResult = {
  optimized_resume: {
    ...SAMPLE_RESUME,
    professional_summary: 'Results-driven Senior Full-Stack Engineer with 8+ years of experience architecting scalable microservices and cloud-native web applications. Expert in React, Node.js, TypeScript, and AWS with a track record of leading cross-functional engineering teams, driving 40% performance improvements, and reducing infrastructure costs by 35%. Passionate about system design, developer experience, and building high-performing teams through mentorship.',
  },
  changes_made: [
    {
      section: 'Professional Summary',
      original: 'Senior Full-Stack Engineer with 8+ years of experience building scalable web applications and distributed systems.',
      optimized: 'Results-driven Senior Full-Stack Engineer with 8+ years of experience architecting scalable microservices and cloud-native web applications.',
      reason: 'Added action-oriented language and specific keywords like "microservices" and "cloud-native" for better ATS matching.',
    },
    {
      section: 'Skills',
      original: 'Flat list of skills without categorization',
      optimized: 'Categorized skills with emphasis on system design and microservices architecture',
      reason: 'ATS systems better parse categorized skill sections and look for architecture-level keywords.',
    },
  ],
  ats_improvement_estimate: {
    original_estimated_score: 78,
    optimized_estimated_score: 91,
    improvement_points: 13,
  },
  optimization_summary: 'The resume has been optimized with stronger action verbs, better keyword alignment, and more targeted language for senior engineering positions. Key improvements include a rewritten professional summary with specific metrics, enhanced skill categorization, and added industry-standard keywords throughout.',
  keywords_added: ['microservices', 'system design', 'cross-functional', 'cloud-native', 'REST API', 'Agile'],
  keywords_emphasized: ['scalable', 'performance', 'leadership', 'CI/CD', 'mentorship', 'architecture'],
}

// ──────────────────────────────────────────
// Utility Helpers
// ──────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function syntaxHighlightJson(json: string): React.ReactNode[] {
  const lines = json.split('\n')
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = []
    let remaining = line
    let keyIdx = 0

    const keyRegex = /("(?:[^"\\]|\\.)*")\s*:/
    const stringRegex = /("(?:[^"\\]|\\.)*")/
    const numberRegex = /\b(\d+\.?\d*)\b/
    const boolRegex = /\b(true|false)\b/
    const nullRegex = /\bnull\b/

    let safetyCounter = 0
    while (remaining.length > 0 && safetyCounter < 100) {
      safetyCounter++
      const keyMatch = remaining.match(keyRegex)
      const strMatch = remaining.match(stringRegex)
      const numMatch = remaining.match(numberRegex)
      const boolMatch = remaining.match(boolRegex)
      const nullMatch = remaining.match(nullRegex)

      type MatchInfo = { index: number; length: number; type: string; value: string }
      const matches: MatchInfo[] = []

      if (keyMatch?.index !== undefined) {
        matches.push({ index: keyMatch.index, length: keyMatch[0].length, type: 'key', value: keyMatch[1] })
      }
      if (strMatch?.index !== undefined && (!keyMatch || strMatch.index !== keyMatch.index)) {
        matches.push({ index: strMatch.index, length: strMatch[0].length, type: 'string', value: strMatch[1] })
      }
      if (numMatch?.index !== undefined) {
        matches.push({ index: numMatch.index, length: numMatch[0].length, type: 'number', value: numMatch[1] })
      }
      if (boolMatch?.index !== undefined) {
        matches.push({ index: boolMatch.index, length: boolMatch[0].length, type: 'boolean', value: boolMatch[1] })
      }
      if (nullMatch?.index !== undefined) {
        matches.push({ index: nullMatch.index, length: nullMatch[0].length, type: 'null', value: 'null' })
      }

      if (matches.length === 0) {
        parts.push(<span key={`${i}-rest-${keyIdx}`}>{remaining}</span>)
        break
      }

      matches.sort((a, b) => a.index - b.index)
      const earliest = matches[0]

      if (earliest.index > 0) {
        parts.push(<span key={`${i}-pre-${keyIdx}`}>{remaining.slice(0, earliest.index)}</span>)
      }

      const colorClass =
        earliest.type === 'key' ? 'text-blue-600' :
        earliest.type === 'string' ? 'text-green-600' :
        earliest.type === 'number' ? 'text-orange-500' :
        earliest.type === 'boolean' ? 'text-purple-500' :
        'text-gray-400'

      if (earliest.type === 'key') {
        parts.push(
          <span key={`${i}-key-${keyIdx}`} className={colorClass}>{earliest.value}</span>,
          <span key={`${i}-colon-${keyIdx}`}>: </span>
        )
        remaining = remaining.slice(earliest.index + earliest.length)
      } else {
        parts.push(
          <span key={`${i}-val-${keyIdx}`} className={colorClass}>{earliest.value}</span>
        )
        remaining = remaining.slice(earliest.index + earliest.length)
      }
      keyIdx++
    }

    return (
      <div key={i} className="flex">
        <span className="inline-block w-10 text-right pr-4 text-gray-400 select-none text-xs">{i + 1}</span>
        <span className="flex-1">{parts}</span>
      </div>
    )
  })
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function getScoreStroke(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function getPriorityColor(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p === 'high') return 'bg-red-100 text-red-700 border-red-200'
  if (p === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-blue-100 text-blue-700 border-blue-200'
}

// ──────────────────────────────────────────
// Glass style helper
// ──────────────────────────────────────────

const GLASS_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderColor: 'rgba(255,255,255,0.18)',
  borderRadius: '0.875rem',
}

// ──────────────────────────────────────────
// Spinner
// ──────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? 'h-4 w-4'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ──────────────────────────────────────────
// ErrorBoundary
// ──────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ──────────────────────────────────────────
// Resume Sub-Components
// ──────────────────────────────────────────

function ContactInfoSection({ contact }: { contact?: ContactInfo }) {
  if (!contact) return <p className="text-sm text-muted-foreground">No contact information found.</p>

  const fields: { icon: React.ReactNode; label: string; value: string | null; isLink?: boolean }[] = [
    { icon: <FiUser className="w-4 h-4" />, label: 'Name', value: contact.full_name },
    { icon: <FiMail className="w-4 h-4" />, label: 'Email', value: contact.email, isLink: true },
    { icon: <FiPhone className="w-4 h-4" />, label: 'Phone', value: contact.phone },
    { icon: <FiMapPin className="w-4 h-4" />, label: 'Location', value: contact.location },
    { icon: <FiLinkedin className="w-4 h-4" />, label: 'LinkedIn', value: contact.linkedin_url, isLink: true },
    { icon: <FiGithub className="w-4 h-4" />, label: 'GitHub', value: contact.github_url, isLink: true },
    { icon: <FiGlobe className="w-4 h-4" />, label: 'Portfolio', value: contact.portfolio_url, isLink: true },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((f, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="text-muted-foreground flex-shrink-0">{f.icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            {f.value ? (
              f.isLink && f.value.startsWith('http') ? (
                <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">{f.value.replace(/^https?:\/\/(www\.)?/, '')}</a>
              ) : f.isLink && f.label === 'Email' ? (
                <a href={`mailto:${f.value}`} className="text-sm font-medium text-blue-600 hover:underline">{f.value}</a>
              ) : (
                <p className="text-sm font-medium">{f.value}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground italic">Not specified</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsSection({ skills }: { skills?: Skill[] }) {
  const items = Array.isArray(skills) ? skills : []
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No skills listed.</p>

  const proficiencyColor = (level: string | null) => {
    const l = (level ?? '').toLowerCase()
    if (l === 'expert') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (l === 'advanced') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (l === 'intermediate') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (l === 'beginner') return 'bg-gray-100 text-gray-600 border-gray-200'
    return 'bg-secondary text-secondary-foreground border-border'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((skill, i) => (
        <div key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${proficiencyColor(skill.proficiency_level)}`}>
          <span>{skill.skill_name ?? 'Unnamed'}</span>
          {skill.proficiency_level && <span className="opacity-70">({skill.proficiency_level})</span>}
          {skill.years_of_experience != null && <span className="opacity-60">{skill.years_of_experience}y</span>}
        </div>
      ))}
    </div>
  )
}

function ExperienceSection({ experience }: { experience?: WorkExperience[] }) {
  const items = Array.isArray(experience) ? experience : []
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No work experience listed.</p>

  return (
    <div className="space-y-5">
      {items.map((exp, i) => (
        <div key={i} className="relative pl-6 border-l-2 border-border">
          <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary" />
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h4 className="font-semibold text-sm">{exp.job_title ?? 'Untitled Role'}</h4>
            <span className="text-sm text-muted-foreground">at {exp.company_name ?? 'Unknown Company'}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
            {(exp.start_date || exp.end_date) && (
              <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{exp.start_date ?? '?'} - {exp.end_date ?? 'Present'}</span>
            )}
            {exp.location && <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" />{exp.location}</span>}
          </div>
          {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Responsibilities</p>
              <ul className="space-y-1">
                {exp.responsibilities.map((r, j) => (
                  <li key={j} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-muted-foreground mt-1.5 flex-shrink-0">-</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Achievements</p>
              <ul className="space-y-1">
                {exp.achievements.map((a, j) => (
                  <li key={j} className="text-sm leading-relaxed flex gap-2">
                    <FiCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EducationSection({ education }: { education?: Education[] }) {
  const items = Array.isArray(education) ? education : []
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No education listed.</p>

  return (
    <div className="space-y-4">
      {items.map((edu, i) => (
        <div key={i} className="p-3 rounded-lg bg-secondary/50">
          <h4 className="font-semibold text-sm">{edu.degree ?? 'Degree'}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</h4>
          <p className="text-sm text-muted-foreground">{edu.institution ?? 'Unknown Institution'}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            {(edu.start_date || edu.end_date) && (
              <span>{edu.start_date ?? '?'} - {edu.end_date ?? 'Present'}</span>
            )}
            {edu.gpa != null && <span>GPA: {edu.gpa}</span>}
            {edu.honors && <Badge variant="secondary" className="text-xs">{edu.honors}</Badge>}
          </div>
        </div>
      ))}
    </div>
  )
}

function CertificationsSection({ certifications }: { certifications?: Certification[] }) {
  const items = Array.isArray(certifications) ? certifications : []
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No certifications listed.</p>

  return (
    <div className="space-y-3">
      {items.map((cert, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
          <FiAward className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm">{cert.name ?? 'Unnamed Certification'}</h4>
            <p className="text-xs text-muted-foreground">{cert.issuing_organization ?? 'Unknown Organization'}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
              {cert.date_obtained && <span>Obtained: {cert.date_obtained}</span>}
              {cert.expiry_date && <span>Expires: {cert.expiry_date}</span>}
              {cert.credential_id && <span>ID: {cert.credential_id}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LanguagesSection({ languages }: { languages?: Language[] }) {
  const items = Array.isArray(languages) ? languages : []
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No languages listed.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((lang, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm">
          <span className="font-medium">{lang.language}</span>
          {lang.proficiency && <Badge variant="outline" className="text-xs">{lang.proficiency}</Badge>}
        </div>
      ))}
    </div>
  )
}

function ProjectsSection({ projects }: { projects?: Project[] }) {
  const items = Array.isArray(projects) ? projects : []
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">No projects listed.</p>

  return (
    <div className="space-y-4">
      {items.map((proj, i) => (
        <div key={i} className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{proj.project_name ?? 'Unnamed Project'}</h4>
            {proj.url && (
              <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1 flex-shrink-0">
                <FiGlobe className="w-3 h-3" />Link
              </a>
            )}
          </div>
          {proj.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{proj.description}</p>}
          {Array.isArray(proj.technologies_used) && proj.technologies_used.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {proj.technologies_used.map((tech, j) => (
                <Badge key={j} variant="secondary" className="text-xs font-normal">{tech}</Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// ATS Score Circle SVG
// ──────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safeScore / 100) * circumference
  const strokeColor = getScoreStroke(safeScore)

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(safeScore)}`}>{safeScore}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Category Score Bar
// ──────────────────────────────────────────

function CategoryScoreBar({ label, score }: { label: string; score: number }) {
  const safeScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium capitalize">{label.replace(/_/g, ' ')}</span>
        <span className={`text-xs font-semibold ${getScoreColor(safeScore)}`}>{safeScore}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${getScoreBgColor(safeScore)}`} style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Resume Summary Renderer (reusable)
// ──────────────────────────────────────────

function ResumeSummaryView({ data }: { data: ParsedResume }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiUser className="w-4 h-4 text-muted-foreground" />Contact Information
        </h3>
        <ContactInfoSection contact={data?.contact_info} />
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiBookOpen className="w-4 h-4 text-muted-foreground" />Professional Summary
        </h3>
        {data?.professional_summary ? renderMarkdown(data.professional_summary) : <p className="text-sm text-muted-foreground italic">No professional summary provided.</p>}
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiCode className="w-4 h-4 text-muted-foreground" />Skills
        </h3>
        <SkillsSection skills={data?.skills} />
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiBriefcase className="w-4 h-4 text-muted-foreground" />Work Experience
        </h3>
        <ExperienceSection experience={data?.work_experience} />
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiBookOpen className="w-4 h-4 text-muted-foreground" />Education
        </h3>
        <EducationSection education={data?.education} />
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiAward className="w-4 h-4 text-muted-foreground" />Certifications
        </h3>
        <CertificationsSection certifications={data?.certifications} />
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiGlobe className="w-4 h-4 text-muted-foreground" />Languages
        </h3>
        <LanguagesSection languages={data?.languages} />
      </section>
      <Separator />
      <section>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <FiCode className="w-4 h-4 text-muted-foreground" />Projects
        </h3>
        <ProjectsSection projects={data?.projects} />
      </section>
    </div>
  )
}

// ──────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────

export default function Page() {
  // ── Core State ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const [rawJson, setRawJson] = useState<string>('')
  const [jobDescription, setJobDescription] = useState<string>('')
  const [activeTab, setActiveTab] = useState('summary')
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<ParseHistoryItem[]>([])
  const [showSample, setShowSample] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [jdExpanded, setJdExpanded] = useState(true)

  // ── Loading States ──
  const [parsingLoading, setParsingLoading] = useState(false)
  const [atsLoading, setAtsLoading] = useState(false)
  const [coverLetterLoading, setCoverLetterLoading] = useState(false)
  const [optimizerLoading, setOptimizerLoading] = useState(false)

  // ── Result States ──
  const [atsResult, setAtsResult] = useState<ATSScoreResult | null>(null)
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterResult | null>(null)
  const [optimizerResult, setOptimizerResult] = useState<ResumeOptimizerResult | null>(null)

  // ── Error States ──
  const [parseError, setParseError] = useState<string | null>(null)
  const [atsError, setAtsError] = useState<string | null>(null)
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null)
  const [optimizerError, setOptimizerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Active Agent ──
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ── Copied States for different sections ──
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false)
  const [copiedOptimized, setCopiedOptimized] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load history from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // ── Save history to localStorage ──
  const saveHistory = useCallback((items: ParseHistoryItem[]) => {
    const trimmed = items.slice(0, MAX_HISTORY)
    setHistory(trimmed)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
    } catch {
      // Ignore storage errors
    }
  }, [])

  // ── Handle Sample Data Toggle ──
  useEffect(() => {
    if (showSample) {
      setParsedData(SAMPLE_RESUME)
      setRawJson(JSON.stringify(SAMPLE_RESUME, null, 2))
      setAtsResult(SAMPLE_ATS)
      setCoverLetterResult(SAMPLE_COVER_LETTER)
      setOptimizerResult(SAMPLE_OPTIMIZER)
      setParseError(null)
      setAtsError(null)
      setCoverLetterError(null)
      setOptimizerError(null)
      setSuccessMsg('Showing sample data with all agent results.')
      setJobDescription('Senior Software Engineer at a fast-growing startup. Requirements: 5+ years experience with React, Node.js, TypeScript. Cloud experience (AWS/GCP). Team leadership. System design skills.')
    } else {
      setParsedData(null)
      setRawJson('')
      setAtsResult(null)
      setCoverLetterResult(null)
      setOptimizerResult(null)
      setSuccessMsg(null)
      setJobDescription('')
    }
  }, [showSample])

  // ── File Selection ──
  const handleFileSelect = useCallback((file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    const validExt = /\.(pdf|docx?)$/i

    if (!validTypes.includes(file.type) && !validExt.test(file.name)) {
      setParseError('Invalid file type. Please upload a PDF or Word document (.pdf, .docx).')
      return
    }

    setSelectedFile(file)
    setParseError(null)
    setSuccessMsg(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // ── Parse Resume ──
  const handleParse = async () => {
    if (!selectedFile) return
    setParsingLoading(true)
    setParseError(null)
    setSuccessMsg(null)
    setParsedData(null)
    setRawJson('')
    setAtsResult(null)
    setCoverLetterResult(null)
    setOptimizerResult(null)
    setActiveAgentId(PARSER_AGENT_ID)

    try {
      const uploadResult = await uploadFiles(selectedFile)
      if (!uploadResult.success || (uploadResult.asset_ids?.length ?? 0) === 0) {
        setParseError('Failed to upload file. Please try again.')
        setParsingLoading(false)
        setActiveAgentId(null)
        return
      }

      const result = await callAIAgent(
        'Parse this resume document and extract all fields into structured ATS-optimized JSON. Extract contact info, professional summary, skills with proficiency levels, work experience with responsibilities and achievements, education, certifications, languages, and projects. Use null for any missing or ambiguous fields.',
        PARSER_AGENT_ID,
        { assets: uploadResult.asset_ids }
      )

      if (result.success && result?.response?.result) {
        const parsed = result.response.result as unknown as ParsedResume
        setParsedData(parsed)
        const jsonStr = JSON.stringify(parsed, null, 2)
        setRawJson(jsonStr)
        setSuccessMsg('Resume parsed successfully.')
        setShowSample(false)

        const hasContact = parsed?.contact_info?.full_name || parsed?.contact_info?.email
        const hasExperience = Array.isArray(parsed?.work_experience) && parsed.work_experience.length > 0
        const status: 'success' | 'partial' = hasContact && hasExperience ? 'success' : 'partial'

        const newItem: ParseHistoryItem = {
          id: String(Date.now()),
          fileName: selectedFile.name,
          parsedAt: new Date().toLocaleString(),
          status,
          data: parsed,
          rawJson: jsonStr,
        }
        saveHistory([newItem, ...history])
      } else {
        setParseError(result?.error ?? 'Failed to parse resume. Please ensure it is a valid PDF or Word document.')
      }
    } catch {
      setParseError('An unexpected error occurred. Please try again.')
    }

    setParsingLoading(false)
    setActiveAgentId(null)
  }

  // ── ATS Score Analysis ──
  const handleATSAnalysis = async () => {
    if (!parsedData) return
    setAtsLoading(true)
    setAtsError(null)
    setActiveAgentId(ATS_AGENT_ID)

    try {
      const message = jobDescription.trim()
        ? `Analyze this resume for ATS compatibility against the following job description.\n\nRESUME DATA:\n${JSON.stringify(parsedData, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`
        : `Analyze this resume for general ATS compatibility.\n\nRESUME DATA:\n${JSON.stringify(parsedData, null, 2)}`

      const result = await callAIAgent(message, ATS_AGENT_ID)

      if (result.success && result?.response?.result) {
        setAtsResult(result.response.result as unknown as ATSScoreResult)
        setActiveTab('ats')
      } else {
        setAtsError(result?.error ?? 'Failed to analyze ATS score. Please try again.')
      }
    } catch {
      setAtsError('An unexpected error occurred during ATS analysis.')
    }

    setAtsLoading(false)
    setActiveAgentId(null)
  }

  // ── Cover Letter Generation ──
  const handleCoverLetter = async () => {
    if (!parsedData || !jobDescription.trim()) return
    setCoverLetterLoading(true)
    setCoverLetterError(null)
    setActiveAgentId(COVER_LETTER_AGENT_ID)

    try {
      const message = `Generate a professional cover letter based on this resume and job description. Use ONLY information from the resume — do NOT fabricate any details.\n\nRESUME DATA:\n${JSON.stringify(parsedData, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`

      const result = await callAIAgent(message, COVER_LETTER_AGENT_ID)

      if (result.success && result?.response?.result) {
        setCoverLetterResult(result.response.result as unknown as CoverLetterResult)
        setActiveTab('coverletter')
      } else {
        setCoverLetterError(result?.error ?? 'Failed to generate cover letter. Please try again.')
      }
    } catch {
      setCoverLetterError('An unexpected error occurred during cover letter generation.')
    }

    setCoverLetterLoading(false)
    setActiveAgentId(null)
  }

  // ── Resume Optimization ──
  const handleOptimize = async () => {
    if (!parsedData || !jobDescription.trim()) return
    setOptimizerLoading(true)
    setOptimizerError(null)
    setActiveAgentId(OPTIMIZER_AGENT_ID)

    try {
      const message = `Optimize this resume for the following job description. Improve keyword alignment, strengthen action verbs, and restructure content for better ATS compatibility. Use ONLY factual information from the original resume.\n\nORIGINAL RESUME DATA:\n${JSON.stringify(parsedData, null, 2)}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}`

      const result = await callAIAgent(message, OPTIMIZER_AGENT_ID)

      if (result.success && result?.response?.result) {
        setOptimizerResult(result.response.result as unknown as ResumeOptimizerResult)
        setActiveTab('optimized')
      } else {
        setOptimizerError(result?.error ?? 'Failed to optimize resume. Please try again.')
      }
    } catch {
      setOptimizerError('An unexpected error occurred during resume optimization.')
    }

    setOptimizerLoading(false)
    setActiveAgentId(null)
  }

  // ── Reset ──
  const handleReset = () => {
    setSelectedFile(null)
    setParsedData(null)
    setRawJson('')
    setParseError(null)
    setAtsError(null)
    setCoverLetterError(null)
    setOptimizerError(null)
    setSuccessMsg(null)
    setShowSample(false)
    setAtsResult(null)
    setCoverLetterResult(null)
    setOptimizerResult(null)
    setJobDescription('')
    setActiveTab('summary')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Copy JSON ──
  const handleCopy = async () => {
    if (!rawJson) return
    const success = await copyToClipboard(rawJson)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Download JSON ──
  const handleDownload = () => {
    if (!rawJson) return
    const blob = new Blob([rawJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const baseName = selectedFile?.name?.replace(/\.[^.]+$/, '') ?? 'resume'
    a.href = url
    a.download = `${baseName}_parsed.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Copy Cover Letter ──
  const handleCopyCoverLetter = async () => {
    const text = coverLetterResult?.cover_letter
    if (!text) return
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedCoverLetter(true)
      setTimeout(() => setCopiedCoverLetter(false), 2000)
    }
  }

  // ── Download Cover Letter ──
  const handleDownloadCoverLetter = () => {
    const text = coverLetterResult?.cover_letter
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover_letter.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Copy Optimized JSON ──
  const handleCopyOptimized = async () => {
    if (!optimizerResult?.optimized_resume) return
    const jsonStr = JSON.stringify(optimizerResult.optimized_resume, null, 2)
    const success = await copyToClipboard(jsonStr)
    if (success) {
      setCopiedOptimized(true)
      setTimeout(() => setCopiedOptimized(false), 2000)
    }
  }

  // ── Download Optimized JSON ──
  const handleDownloadOptimized = () => {
    if (!optimizerResult?.optimized_resume) return
    const jsonStr = JSON.stringify(optimizerResult.optimized_resume, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized_resume.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Load from History ──
  const loadHistoryItem = (item: ParseHistoryItem) => {
    setParsedData(item.data)
    setRawJson(item.rawJson)
    setSuccessMsg(`Loaded parse result for "${item.fileName}".`)
    setParseError(null)
    setAtsResult(null)
    setCoverLetterResult(null)
    setOptimizerResult(null)
    setShowSample(false)
    setSelectedFile(null)
    setSidebarOpen(false)
    setActiveTab('summary')
  }

  // ── Clear History ──
  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem(HISTORY_KEY) } catch { /* ignore */ }
  }

  const displayData = parsedData
  const anyLoading = parsingLoading || atsLoading || coverLetterLoading || optimizerLoading

  // Build tab list dynamically
  const availableTabs: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'summary', label: 'Summary', icon: <FiUser className="w-3.5 h-3.5" /> },
    { value: 'json', label: 'JSON', icon: <FiCode className="w-3.5 h-3.5" /> },
  ]
  if (atsResult) availableTabs.push({ value: 'ats', label: 'ATS Score', icon: <FiTarget className="w-3.5 h-3.5" /> })
  if (coverLetterResult) availableTabs.push({ value: 'coverletter', label: 'Cover Letter', icon: <FiFileText className="w-3.5 h-3.5" /> })
  if (optimizerResult) availableTabs.push({ value: 'optimized', label: 'Optimized', icon: <FiZap className="w-3.5 h-3.5" /> })

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
        {/* Gradient Background Layer */}
        <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, hsl(210 20% 97%) 0%, hsl(220 25% 95%) 35%, hsl(200 20% 96%) 70%, hsl(230 15% 97%) 100%)' }} />

        {/* ──── Header ──── */}
        <header className="sticky top-0 z-30 border-b border-border" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FiFile className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">ResumeForge</h1>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">4 Agents</Badge>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <span>Sample Data</span>
                <Switch checked={showSample} onCheckedChange={setShowSample} />
              </label>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <FiClock className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
          {/* Inline Notifications */}
          {parseError && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
              <button onClick={() => setParseError(null)} className="ml-auto"><FiX className="w-4 h-4" /></button>
            </div>
          )}
          {successMsg && !parseError && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <FiCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="ml-auto"><FiX className="w-4 h-4" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ──── Left Column: Upload + JD + Actions ──── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Upload Card */}
              <Card className="border shadow-md" style={GLASS_STYLE}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiUpload className="w-4 h-4" />Upload Resume
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Drag and drop or browse for a PDF or Word document.</p>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !anyLoading && fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : parseError ? 'border-red-300 bg-red-50/50' : 'border-border hover:border-primary/50 hover:bg-accent/50'} ${anyLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(f)
                      }}
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FiFile className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
                            <Badge variant="secondary" className="text-xs">{selectedFile.name.split('.').pop()?.toUpperCase() ?? 'FILE'}</Badge>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setParseError(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                          <FiX className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                          <FiUpload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">Drop your resume here</p>
                        <p className="text-xs text-muted-foreground">or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-2">Supports PDF, DOCX</p>
                      </>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button onClick={handleParse} disabled={!selectedFile || anyLoading} className="w-full h-10 font-medium" style={{ borderRadius: '0.875rem' }}>
                      {parsingLoading ? (
                        <span className="flex items-center gap-2"><Spinner />Parsing...</span>
                      ) : (
                        'Parse Resume'
                      )}
                    </Button>
                    {displayData && (
                      <Button variant="outline" onClick={handleReset} className="w-full h-10 font-medium" style={{ borderRadius: '0.875rem' }}>
                        Parse Another
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Description Card */}
              {displayData && (
                <Card className="border shadow-md" style={GLASS_STYLE}>
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => setJdExpanded(!jdExpanded)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FiFileText className="w-4 h-4" />Job Description
                      </CardTitle>
                      {jdExpanded ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Optional for ATS Score, Required for Cover Letter & Optimizer</p>
                  </CardHeader>
                  {jdExpanded && (
                    <CardContent className="pt-0">
                      <Textarea
                        placeholder="Paste the target job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={6}
                        className="text-sm"
                        style={{ borderRadius: '0.625rem' }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{jobDescription.length} characters</span>
                        {jobDescription.trim() && (
                          <button onClick={() => setJobDescription('')} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                            <FiX className="w-3 h-3" />Clear
                          </button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Action Buttons */}
              {displayData && (
                <Card className="border shadow-md" style={GLASS_STYLE}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <HiSparkles className="w-4 h-4" />AI Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={handleATSAnalysis}
                      disabled={anyLoading}
                      variant="outline"
                      className="w-full h-10 justify-start font-medium text-sm"
                      style={{ borderRadius: '0.875rem' }}
                    >
                      {atsLoading ? (
                        <span className="flex items-center gap-2"><Spinner />Analyzing...</span>
                      ) : (
                        <span className="flex items-center gap-2"><FiTarget className="w-4 h-4" />Analyze ATS Score {!jobDescription.trim() && <span className="text-xs text-muted-foreground ml-auto">(General)</span>}</span>
                      )}
                    </Button>

                    {atsError && <p className="text-xs text-red-600 px-1">{atsError}</p>}

                    <Button
                      onClick={handleCoverLetter}
                      disabled={anyLoading || !jobDescription.trim()}
                      variant="outline"
                      className="w-full h-10 justify-start font-medium text-sm"
                      style={{ borderRadius: '0.875rem' }}
                    >
                      {coverLetterLoading ? (
                        <span className="flex items-center gap-2"><Spinner />Generating...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <FiFileText className="w-4 h-4" />Generate Cover Letter
                          {!jobDescription.trim() && <span className="text-xs text-muted-foreground ml-auto">Needs JD</span>}
                        </span>
                      )}
                    </Button>

                    {coverLetterError && <p className="text-xs text-red-600 px-1">{coverLetterError}</p>}

                    <Button
                      onClick={handleOptimize}
                      disabled={anyLoading || !jobDescription.trim()}
                      variant="outline"
                      className="w-full h-10 justify-start font-medium text-sm"
                      style={{ borderRadius: '0.875rem' }}
                    >
                      {optimizerLoading ? (
                        <span className="flex items-center gap-2"><Spinner />Optimizing...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <FiZap className="w-4 h-4" />Optimize Resume
                          {!jobDescription.trim() && <span className="text-xs text-muted-foreground ml-auto">Needs JD</span>}
                        </span>
                      )}
                    </Button>

                    {optimizerError && <p className="text-xs text-red-600 px-1">{optimizerError}</p>}
                  </CardContent>
                </Card>
              )}

              {/* Copy/Download Parsed JSON */}
              {displayData && rawJson && (
                <Card className="border shadow-md" style={GLASS_STYLE}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCopy} className="flex-1 h-9 text-sm" style={{ borderRadius: '0.875rem' }}>
                        {copied ? <><FiCheck className="w-3.5 h-3.5 mr-1.5" />Copied!</> : <><FiCopy className="w-3.5 h-3.5 mr-1.5" />Copy JSON</>}
                      </Button>
                      <Button variant="outline" onClick={handleDownload} className="flex-1 h-9 text-sm" style={{ borderRadius: '0.875rem' }}>
                        <FiDownload className="w-3.5 h-3.5 mr-1.5" />Download .json
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agent Status Card */}
              <Card className="border shadow-sm" style={GLASS_STYLE}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Powered by 4 AI Agents</p>
                  <div className="space-y-2">
                    {AGENTS_INFO.map((agent) => (
                      <div key={agent.id} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-medium flex-1">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">{activeAgentId === agent.id ? 'Processing...' : 'Ready'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ──── Right Column: Output ──── */}
            <div className="lg:col-span-3">
              {parsingLoading ? (
                <Card className="border shadow-md" style={GLASS_STYLE}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Spinner className="h-5 w-5" />
                      <span className="text-sm font-medium">Parsing your resume...</span>
                    </div>
                    <LoadingSkeleton />
                  </CardContent>
                </Card>
              ) : displayData ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <h2 className="text-lg font-semibold flex-shrink-0">Results</h2>
                    <TabsList className="h-9 flex-wrap" style={{ borderRadius: '0.875rem' }}>
                      {availableTabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm px-2 sm:px-3 gap-1">
                          {tab.icon}
                          <span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* ──── Summary Tab ──── */}
                  <TabsContent value="summary" className="mt-0">
                    <Card className="border shadow-md" style={GLASS_STYLE}>
                      <ScrollArea className="h-[calc(100vh-13rem)]">
                        <CardContent className="pt-6">
                          <ResumeSummaryView data={displayData} />
                        </CardContent>
                      </ScrollArea>
                    </Card>
                  </TabsContent>

                  {/* ──── JSON Tab ──── */}
                  <TabsContent value="json" className="mt-0">
                    <Card className="border shadow-md overflow-hidden" style={GLASS_STYLE}>
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                        <span className="text-xs font-mono text-muted-foreground">parsed_resume.json</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                            {copied ? <><FiCheck className="w-3 h-3 mr-1" />Copied</> : <><FiCopy className="w-3 h-3 mr-1" />Copy</>}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2 text-xs">
                            <FiDownload className="w-3 h-3 mr-1" />Download
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="h-[calc(100vh-15rem)]">
                        <pre className="p-4 text-xs font-mono leading-5 overflow-x-auto">
                          {rawJson ? syntaxHighlightJson(rawJson) : null}
                        </pre>
                      </ScrollArea>
                    </Card>
                  </TabsContent>

                  {/* ──── ATS Score Tab ──── */}
                  {atsResult && (
                    <TabsContent value="ats" className="mt-0">
                      <Card className="border shadow-md" style={GLASS_STYLE}>
                        <ScrollArea className="h-[calc(100vh-13rem)]">
                          <CardContent className="pt-6 space-y-6">
                            {/* Score Circle & Summary */}
                            <div className="text-center">
                              <h3 className="text-sm font-semibold mb-4 flex items-center justify-center gap-2">
                                <FiTarget className="w-4 h-4" />ATS Compatibility Score
                              </h3>
                              <ScoreCircle score={atsResult?.overall_score ?? 0} />
                              {atsResult?.summary && (
                                <div className="mt-4 text-left p-4 rounded-lg bg-secondary/50">
                                  {renderMarkdown(atsResult.summary)}
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* Category Scores */}
                            <section>
                              <h3 className="text-sm font-semibold mb-3">Category Scores</h3>
                              <div className="space-y-3">
                                {atsResult?.category_scores && Object.entries(atsResult.category_scores).map(([key, value]) => (
                                  <CategoryScoreBar key={key} label={key} score={typeof value === 'number' ? value : 0} />
                                ))}
                              </div>
                            </section>

                            <Separator />

                            {/* Strengths */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiCheckCircle className="w-4 h-4 text-emerald-500" />Strengths
                              </h3>
                              <div className="space-y-2">
                                {Array.isArray(atsResult?.strengths) && atsResult.strengths.length > 0 ? (
                                  atsResult.strengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                      <FiCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-emerald-800">{s}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No strengths identified.</p>
                                )}
                              </div>
                            </section>

                            <Separator />

                            {/* Weaknesses */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiAlertTriangle className="w-4 h-4 text-amber-500" />Weaknesses
                              </h3>
                              <div className="space-y-2">
                                {Array.isArray(atsResult?.weaknesses) && atsResult.weaknesses.length > 0 ? (
                                  atsResult.weaknesses.map((w, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                                      <FiAlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-amber-800">{w}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No weaknesses identified.</p>
                                )}
                              </div>
                            </section>

                            <Separator />

                            {/* Suggestions */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiStar className="w-4 h-4 text-blue-500" />Suggestions
                              </h3>
                              <div className="space-y-3">
                                {Array.isArray(atsResult?.suggestions) && atsResult.suggestions.length > 0 ? (
                                  atsResult.suggestions.map((sug, i) => (
                                    <div key={i} className="p-3 rounded-lg border border-border bg-card">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={`text-xs border ${getPriorityColor(sug?.priority ?? '')}`} variant="outline">
                                          {sug?.priority ?? 'N/A'}
                                        </Badge>
                                        <span className="text-xs font-medium text-muted-foreground">{sug?.category ?? 'General'}</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                        <div className="p-2 rounded bg-red-50 border border-red-100">
                                          <p className="text-xs font-medium text-red-600 mb-1">Current</p>
                                          <p className="text-xs text-red-800">{sug?.current ?? ''}</p>
                                        </div>
                                        <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
                                          <p className="text-xs font-medium text-emerald-600 mb-1">Recommended</p>
                                          <p className="text-xs text-emerald-800">{sug?.recommended ?? ''}</p>
                                        </div>
                                      </div>
                                      {sug?.impact && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <FiTrendingUp className="w-3 h-3" />Impact: {sug.impact}
                                        </p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No suggestions available.</p>
                                )}
                              </div>
                            </section>

                            <Separator />

                            {/* Keyword Analysis */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiCode className="w-4 h-4" />Keyword Analysis
                              </h3>

                              {atsResult?.keyword_analysis?.keyword_density_score != null && (
                                <div className="mb-4">
                                  <CategoryScoreBar label="Keyword Density Score" score={typeof atsResult.keyword_analysis.keyword_density_score === 'number' ? atsResult.keyword_analysis.keyword_density_score : 0} />
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-emerald-600 mb-2">Matched Keywords</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.isArray(atsResult?.keyword_analysis?.matched_keywords) && atsResult.keyword_analysis.matched_keywords.length > 0 ? (
                                      atsResult.keyword_analysis.matched_keywords.map((kw, i) => (
                                        <Badge key={i} className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">{kw}</Badge>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">None</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-amber-600 mb-2">Missing Keywords</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.isArray(atsResult?.keyword_analysis?.missing_keywords) && atsResult.keyword_analysis.missing_keywords.length > 0 ? (
                                      atsResult.keyword_analysis.missing_keywords.map((kw, i) => (
                                        <Badge key={i} className="text-xs bg-amber-100 text-amber-700 border-amber-200" variant="outline">{kw}</Badge>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">None</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </section>
                          </CardContent>
                        </ScrollArea>
                      </Card>
                    </TabsContent>
                  )}

                  {/* ──── Cover Letter Tab ──── */}
                  {coverLetterResult && (
                    <TabsContent value="coverletter" className="mt-0">
                      <Card className="border shadow-md" style={GLASS_STYLE}>
                        <ScrollArea className="h-[calc(100vh-13rem)]">
                          <CardContent className="pt-6 space-y-6">
                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={handleCopyCoverLetter} className="h-8 text-xs" style={{ borderRadius: '0.875rem' }}>
                                {copiedCoverLetter ? <><FiCheck className="w-3 h-3 mr-1" />Copied!</> : <><FiCopy className="w-3 h-3 mr-1" />Copy</>}
                              </Button>
                              <Button variant="outline" onClick={handleDownloadCoverLetter} className="h-8 text-xs" style={{ borderRadius: '0.875rem' }}>
                                <FiDownload className="w-3 h-3 mr-1" />Download .txt
                              </Button>
                              {coverLetterResult?.tone && (
                                <Badge variant="secondary" className="ml-auto text-xs">{coverLetterResult.tone}</Badge>
                              )}
                              {coverLetterResult?.word_count != null && (
                                <Badge variant="outline" className="text-xs">{coverLetterResult.word_count} words</Badge>
                              )}
                            </div>

                            {/* Cover Letter Content */}
                            <div className="p-6 rounded-xl border border-border bg-white shadow-sm">
                              {coverLetterResult?.cover_letter ? (
                                <div className="space-y-4 text-sm leading-relaxed font-serif">
                                  {coverLetterResult.cover_letter.split('\n\n').map((paragraph, i) => (
                                    <div key={i}>
                                      {paragraph.split('\n').map((line, j) => (
                                        <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No cover letter content generated.</p>
                              )}
                            </div>

                            <Separator />

                            {/* Key Highlights */}
                            {Array.isArray(coverLetterResult?.key_highlights) && coverLetterResult.key_highlights.length > 0 && (
                              <section>
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                  <FiStar className="w-4 h-4 text-amber-500" />Key Highlights
                                </h3>
                                <ul className="space-y-2">
                                  {coverLetterResult.key_highlights.map((h, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                      <FiCheck className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                      <span>{h}</span>
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            )}

                            {/* Matched Qualifications */}
                            {Array.isArray(coverLetterResult?.matched_qualifications) && coverLetterResult.matched_qualifications.length > 0 && (
                              <>
                                <Separator />
                                <section>
                                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />Matched Qualifications
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    {coverLetterResult.matched_qualifications.map((q, i) => (
                                      <Badge key={i} className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">{q}</Badge>
                                    ))}
                                  </div>
                                </section>
                              </>
                            )}

                            {/* Customization Notes */}
                            {Array.isArray(coverLetterResult?.customization_notes) && coverLetterResult.customization_notes.length > 0 && (
                              <>
                                <Separator />
                                <section>
                                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                    <FiFileText className="w-4 h-4 text-blue-500" />Customization Notes
                                  </h3>
                                  <ul className="space-y-2">
                                    {coverLetterResult.customization_notes.map((n, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm">
                                        <FiAlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span>{n}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              </>
                            )}
                          </CardContent>
                        </ScrollArea>
                      </Card>
                    </TabsContent>
                  )}

                  {/* ──── Optimized Resume Tab ──── */}
                  {optimizerResult && (
                    <TabsContent value="optimized" className="mt-0">
                      <Card className="border shadow-md" style={GLASS_STYLE}>
                        <ScrollArea className="h-[calc(100vh-13rem)]">
                          <CardContent className="pt-6 space-y-6">
                            {/* Improvement Banner */}
                            {optimizerResult?.ats_improvement_estimate && (
                              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-emerald-200">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <FiTrendingUp className="w-4 h-4 text-emerald-600" />ATS Score Improvement
                                </h3>
                                <div className="flex items-center justify-center gap-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-amber-600">{optimizerResult.ats_improvement_estimate?.original_estimated_score ?? '?'}</p>
                                    <p className="text-xs text-muted-foreground">Original</p>
                                  </div>
                                  <FiArrowRight className="w-6 h-6 text-muted-foreground" />
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{optimizerResult.ats_improvement_estimate?.optimized_estimated_score ?? '?'}</p>
                                    <p className="text-xs text-muted-foreground">Optimized</p>
                                  </div>
                                  <div className="ml-4 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200">
                                    <span className="text-sm font-bold text-emerald-700">+{optimizerResult.ats_improvement_estimate?.improvement_points ?? 0} pts</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Optimization Summary */}
                            {optimizerResult?.optimization_summary && (
                              <section>
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                  <HiSparkles className="w-4 h-4 text-blue-500" />Optimization Summary
                                </h3>
                                <div className="p-4 rounded-lg bg-secondary/50">
                                  {renderMarkdown(optimizerResult.optimization_summary)}
                                </div>
                              </section>
                            )}

                            <Separator />

                            {/* Keywords */}
                            <section>
                              <h3 className="text-sm font-semibold mb-3">Keywords</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-emerald-600 mb-2">Keywords Added</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.isArray(optimizerResult?.keywords_added) && optimizerResult.keywords_added.length > 0 ? (
                                      optimizerResult.keywords_added.map((kw, i) => (
                                        <Badge key={i} className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">{kw}</Badge>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">None</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-blue-600 mb-2">Keywords Emphasized</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.isArray(optimizerResult?.keywords_emphasized) && optimizerResult.keywords_emphasized.length > 0 ? (
                                      optimizerResult.keywords_emphasized.map((kw, i) => (
                                        <Badge key={i} className="text-xs bg-blue-100 text-blue-700 border-blue-200" variant="outline">{kw}</Badge>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground italic">None</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </section>

                            <Separator />

                            {/* Changes Made */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiCode className="w-4 h-4" />Changes Made
                              </h3>
                              <div className="space-y-3">
                                {Array.isArray(optimizerResult?.changes_made) && optimizerResult.changes_made.length > 0 ? (
                                  optimizerResult.changes_made.map((change, i) => (
                                    <div key={i} className="p-3 rounded-lg border border-border bg-card">
                                      <Badge variant="secondary" className="text-xs mb-2">{change?.section ?? 'Unknown Section'}</Badge>
                                      <div className="grid grid-cols-1 gap-2 mt-2">
                                        <div className="p-2 rounded bg-red-50 border border-red-100">
                                          <p className="text-xs font-medium text-red-600 mb-1">Original</p>
                                          <p className="text-xs text-red-800">{change?.original ?? ''}</p>
                                        </div>
                                        <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
                                          <p className="text-xs font-medium text-emerald-600 mb-1">Optimized</p>
                                          <p className="text-xs text-emerald-800">{change?.optimized ?? ''}</p>
                                        </div>
                                      </div>
                                      {change?.reason && (
                                        <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                                          <FiAlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          <span>{change.reason}</span>
                                        </p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No changes recorded.</p>
                                )}
                              </div>
                            </section>

                            <Separator />

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={handleCopyOptimized} className="h-8 text-xs" style={{ borderRadius: '0.875rem' }}>
                                {copiedOptimized ? <><FiCheck className="w-3 h-3 mr-1" />Copied!</> : <><FiCopy className="w-3 h-3 mr-1" />Copy Optimized JSON</>}
                              </Button>
                              <Button variant="outline" onClick={handleDownloadOptimized} className="h-8 text-xs" style={{ borderRadius: '0.875rem' }}>
                                <FiDownload className="w-3 h-3 mr-1" />Download .json
                              </Button>
                            </div>

                            <Separator />

                            {/* Optimized Resume Preview */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiFileText className="w-4 h-4" />Optimized Resume Preview
                              </h3>
                              {optimizerResult?.optimized_resume ? (
                                <div className="p-4 rounded-lg border border-border bg-white">
                                  <ResumeSummaryView data={optimizerResult.optimized_resume} />
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No optimized resume data available.</p>
                              )}
                            </section>
                          </CardContent>
                        </ScrollArea>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              ) : (
                /* ──── Empty State ──── */
                <Card className="border shadow-md" style={GLASS_STYLE}>
                  <CardContent className="flex flex-col items-center justify-center py-24">
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
                      <FiFile className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Upload a resume to get started</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
                      Drop a PDF or Word document in the upload zone to extract structured, ATS-optimized data. Then analyze your ATS score, generate cover letters, and optimize your resume.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      <Badge variant="secondary" className="text-xs flex items-center gap-1"><FiTarget className="w-3 h-3" />ATS Scoring</Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1"><FiFileText className="w-3 h-3" />Cover Letters</Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1"><FiZap className="w-3 h-3" />Resume Optimization</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Or toggle "Sample Data" to preview all features.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Loading overlays for secondary agents */}
              {(atsLoading || coverLetterLoading || optimizerLoading) && displayData && (
                <div className="mt-4">
                  <Card className="border shadow-md" style={GLASS_STYLE}>
                    <CardContent className="py-8 flex flex-col items-center justify-center">
                      <Spinner className="h-6 w-6 mb-3" />
                      <p className="text-sm font-medium">
                        {atsLoading && 'Analyzing ATS compatibility...'}
                        {coverLetterLoading && 'Generating your cover letter...'}
                        {optimizerLoading && 'Optimizing your resume...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">This may take a minute.</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──── Sidebar (Parse History) ──── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSidebarOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-72 shadow-xl border-l border-border" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2"><FiClock className="w-4 h-4" />Parse History</h2>
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <FiX className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-3 space-y-2">
                  {history.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No parse history yet.</p>
                  ) : (
                    history.map((item) => (
                      <button key={item.id} onClick={() => loadHistoryItem(item)} className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors duration-200">
                        <div className="flex items-center gap-2 mb-1">
                          <FiFile className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{item.fileName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{item.parsedAt}</span>
                          <Badge variant={item.status === 'success' ? 'default' : 'secondary'} className="text-xs">{item.status}</Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
              {history.length > 0 && (
                <div className="p-3 border-t border-border">
                  <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors w-full text-center flex items-center justify-center gap-1">
                    <FiTrash2 className="w-3 h-3" />Clear History
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
