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
import {
  FiUpload, FiFile, FiCopy, FiDownload, FiTrash2,
  FiClock, FiChevronLeft, FiChevronRight, FiX, FiCheck,
  FiAlertCircle, FiUser, FiMail, FiPhone, FiMapPin,
  FiLinkedin, FiGithub, FiGlobe, FiBookOpen, FiAward,
  FiBriefcase, FiCode
} from 'react-icons/fi'

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

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────

const AGENT_ID = '699ec2e39a2868b8ab9f774a'
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

// ──────────────────────────────────────────
// Sample Data
// ──────────────────────────────────────────

const SAMPLE_DATA: ParsedResume = {
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

    // Match key-value pairs, standalone values, brackets, etc.
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

      // Find earliest match
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
// Sub-Components
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
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────

export default function Page() {
  // ── State ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const [rawJson, setRawJson] = useState<string>('')
  const [activeTab, setActiveTab] = useState('summary')
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<ParseHistoryItem[]>([])
  const [showSample, setShowSample] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

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
      setParsedData(SAMPLE_DATA)
      setRawJson(JSON.stringify(SAMPLE_DATA, null, 2))
      setError(null)
      setSuccessMsg('Showing sample data.')
    } else {
      setParsedData(null)
      setRawJson('')
      setSuccessMsg(null)
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
      setError('Invalid file type. Please upload a PDF or Word document (.pdf, .docx).')
      return
    }

    setSelectedFile(file)
    setError(null)
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
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setParsedData(null)
    setRawJson('')
    setActiveAgentId(AGENT_ID)

    try {
      // Step 1: Upload file
      const uploadResult = await uploadFiles(selectedFile)
      if (!uploadResult.success || (uploadResult.asset_ids?.length ?? 0) === 0) {
        setError('Failed to upload file. Please try again.')
        setLoading(false)
        setActiveAgentId(null)
        return
      }

      // Step 2: Call agent with asset_ids
      const result = await callAIAgent(
        'Parse this resume document and extract all fields into structured ATS-optimized JSON. Extract contact info, professional summary, skills with proficiency levels, work experience with responsibilities and achievements, education, certifications, languages, and projects. Use null for any missing or ambiguous fields.',
        AGENT_ID,
        { assets: uploadResult.asset_ids }
      )

      if (result.success && result?.response?.result) {
        const parsed = result.response.result as unknown as ParsedResume
        setParsedData(parsed)
        const jsonStr = JSON.stringify(parsed, null, 2)
        setRawJson(jsonStr)
        setSuccessMsg('Resume parsed successfully.')
        setShowSample(false)

        // Determine status
        const hasContact = parsed?.contact_info?.full_name || parsed?.contact_info?.email
        const hasExperience = Array.isArray(parsed?.work_experience) && parsed.work_experience.length > 0
        const status: 'success' | 'partial' = hasContact && hasExperience ? 'success' : 'partial'

        // Save to history
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
        setError(result?.error ?? 'Failed to parse resume. Please ensure it is a valid PDF or Word document.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
    setActiveAgentId(null)
  }

  // ── Reset ──
  const handleReset = () => {
    setSelectedFile(null)
    setParsedData(null)
    setRawJson('')
    setError(null)
    setSuccessMsg(null)
    setShowSample(false)
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

  // ── Load from History ──
  const loadHistoryItem = (item: ParseHistoryItem) => {
    setParsedData(item.data)
    setRawJson(item.rawJson)
    setSuccessMsg(`Loaded parse result for "${item.fileName}".`)
    setError(null)
    setShowSample(false)
    setSelectedFile(null)
    setSidebarOpen(false)
  }

  // ── Clear History ──
  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem(HISTORY_KEY) } catch { /* ignore */ }
  }

  // Display data: either parsed or sample
  const displayData = parsedData

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans" >
        {/* Gradient Background Layer */}
        <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, hsl(210 20% 97%) 0%, hsl(220 25% 95%) 35%, hsl(200 20% 96%) 70%, hsl(230 15% 97%) 100%)' }} />

        {/* ──── Header ──── */}
        <header className="sticky top-0 z-30 border-b border-border" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FiFile className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">ResumeForge</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <span>Sample Data</span>
                <Switch checked={showSample} onCheckedChange={setShowSample} />
              </label>
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <FiClock className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
          {/* ──── Sidebar (Parse History) ──── */}
          <aside className={`${sidebarOpen ? 'fixed inset-0 z-40 bg-black/20 lg:bg-transparent lg:static lg:inset-auto' : 'hidden lg:block'} lg:w-64 flex-shrink-0`}>
            <div className={`${sidebarOpen ? 'absolute right-0 top-0 h-full w-72 shadow-xl' : ''} lg:relative lg:w-full lg:shadow-none`} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: sidebarOpen ? '0' : '0.875rem', border: sidebarOpen ? 'none' : '1px solid rgba(255,255,255,0.18)' }}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2"><FiClock className="w-4 h-4" />Parse History</h2>
                {sidebarOpen && (
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                    <FiX className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[calc(100vh-14rem)] lg:h-[calc(100vh-12rem)]">
                <div className="p-3 space-y-2">
                  {history.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No parse history yet.</p>
                  ) : (
                    history.map((item) => (
                      <button key={item.id} onClick={() => loadHistoryItem(item)} className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors duration-200 group">
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
          </aside>

          {/* ──── Main Content ──── */}
          <main className="flex-1 min-w-0">
            {/* Inline Notifications */}
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto"><FiX className="w-4 h-4" /></button>
              </div>
            )}
            {successMsg && !error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <FiCheck className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg(null)} className="ml-auto"><FiX className="w-4 h-4" /></button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* ──── Left Column: Upload ──── */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border shadow-md" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FiUpload className="w-4 h-4" />Upload Resume
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Drag and drop or browse for a PDF or Word document.</p>
                  </CardHeader>
                  <CardContent>
                    {/* Dropzone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => !loading && fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : error ? 'border-red-300 bg-red-50/50' : 'border-border hover:border-primary/50 hover:bg-accent/50'} ${loading ? 'opacity-50 pointer-events-none' : ''}`}
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
                          <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="p-1.5 rounded-md hover:bg-muted transition-colors">
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

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                      <Button onClick={handleParse} disabled={!selectedFile || loading} className="w-full h-10 font-medium" style={{ borderRadius: '0.875rem' }}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Parsing...
                          </span>
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

                {/* Action Buttons Card (when data available) */}
                {displayData && rawJson && (
                  <Card className="border shadow-md" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
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

                {/* Agent Info Card */}
                <Card className="border shadow-sm" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Powered by</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span className="text-sm font-medium">Resume Parser Agent</span>
                      <span className="text-xs text-muted-foreground ml-auto">{activeAgentId ? 'Processing...' : 'Ready'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Extracts structured fields from resumes including contact info, skills, experience, education, certifications, languages, and projects.</p>
                  </CardContent>
                </Card>
              </div>

              {/* ──── Right Column: Output ──── */}
              <div className="lg:col-span-3">
                {loading ? (
                  <Card className="border shadow-md" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
                    <CardContent className="pt-6">
                      <LoadingSkeleton />
                    </CardContent>
                  </Card>
                ) : displayData ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold">Parsed Profile</h2>
                      <TabsList className="h-9" style={{ borderRadius: '0.875rem' }}>
                        <TabsTrigger value="summary" className="text-sm px-4">Summary</TabsTrigger>
                        <TabsTrigger value="json" className="text-sm px-4">JSON</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* ──── Summary Tab ──── */}
                    <TabsContent value="summary" className="mt-0">
                      <Card className="border shadow-md" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
                        <ScrollArea className="h-[calc(100vh-13rem)]">
                          <CardContent className="pt-6 space-y-6">
                            {/* Contact Info */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiUser className="w-4 h-4 text-muted-foreground" />Contact Information
                              </h3>
                              <ContactInfoSection contact={displayData?.contact_info} />
                            </section>

                            <Separator />

                            {/* Professional Summary */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiBookOpen className="w-4 h-4 text-muted-foreground" />Professional Summary
                              </h3>
                              {displayData?.professional_summary ? (
                                renderMarkdown(displayData.professional_summary)
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No professional summary provided.</p>
                              )}
                            </section>

                            <Separator />

                            {/* Skills */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiCode className="w-4 h-4 text-muted-foreground" />Skills
                              </h3>
                              <SkillsSection skills={displayData?.skills} />
                            </section>

                            <Separator />

                            {/* Work Experience */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiBriefcase className="w-4 h-4 text-muted-foreground" />Work Experience
                              </h3>
                              <ExperienceSection experience={displayData?.work_experience} />
                            </section>

                            <Separator />

                            {/* Education */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiBookOpen className="w-4 h-4 text-muted-foreground" />Education
                              </h3>
                              <EducationSection education={displayData?.education} />
                            </section>

                            <Separator />

                            {/* Certifications */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiAward className="w-4 h-4 text-muted-foreground" />Certifications
                              </h3>
                              <CertificationsSection certifications={displayData?.certifications} />
                            </section>

                            <Separator />

                            {/* Languages */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiGlobe className="w-4 h-4 text-muted-foreground" />Languages
                              </h3>
                              <LanguagesSection languages={displayData?.languages} />
                            </section>

                            <Separator />

                            {/* Projects */}
                            <section>
                              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                <FiCode className="w-4 h-4 text-muted-foreground" />Projects
                              </h3>
                              <ProjectsSection projects={displayData?.projects} />
                            </section>
                          </CardContent>
                        </ScrollArea>
                      </Card>
                    </TabsContent>

                    {/* ──── JSON Tab ──── */}
                    <TabsContent value="json" className="mt-0">
                      <Card className="border shadow-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
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
                  </Tabs>
                ) : (
                  /* ──── Empty State ──── */
                  <Card className="border shadow-md" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: '0.875rem' }}>
                    <CardContent className="flex flex-col items-center justify-center py-24">
                      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
                        <FiFile className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Upload a resume to get started</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
                        Drop a PDF or Word document in the upload zone to extract structured, ATS-optimized data from any resume.
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Or toggle "Sample Data" to preview the output format.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
