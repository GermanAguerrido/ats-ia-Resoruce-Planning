export type ProjectStatus =
  | "active_search"
  | "active_no_search"
  | "coming_soon"
  | "inactive";

export type PositionStatus = "open" | "hired" | "on_hold" | "cancelled";

export type CandidateStatus =
  | "contacted"
  | "resume"
  | "wip_resume"
  | "approved"
  | "tech_interview"
  | "interviewed"
  | "hired"
  | "trick_internal";

export type CandidateProcessStatus =
  | "sourced"
  | "contacted"
  | "screening"
  | "presented"
  | "tech_interview"
  | "client_interview"
  | "offer"
  | "hired"
  | "rejected"
  | "stand_by";

export type CandidateResumeStatus = "none" | "wip_resume" | "resume_ready";

export type CandidateTalentType = "external" | "internal_candidate" | "trick_internal";

export type CandidateTimelineItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
};

export type CandidateMini = {
  id: string;
  name: string;
  role: string;
  location: string;
  status: CandidateStatus[];
  processStatus: CandidateProcessStatus;
  resumeStatus: CandidateResumeStatus;
  talentType: CandidateTalentType;
  email?: string;
  linkedin?: string;
  portfolio?: string;
  salaryCurrent?: string;
  salaryExpected?: string;
  workRelation?: string;
  englishLevel?: string;
  source?: string;
  notes?: string;
  recruiterOwner?: string;
  lastContactAt?: string;
  daysInProcess?: number;
  timeline?: CandidateTimelineItem[];
};

export type PositionCard = {
  id: string;
  title: string;
  seniority: string;
  status: PositionStatus;
  owner: string;
  quantity?: number;
  candidates: CandidateMini[];
};

export type ProjectColumn = {
  id: string;
  clientName: string;
  projectName: string;
  status: ProjectStatus;
  priority: "high" | "medium" | "low";
  confidential: boolean;
  cover: string;
  description: string;
  positions: PositionCard[];
};

export const resourcePlanningMock: ProjectColumn[] = [
  {
    id: "project-1",
    clientName: "Tiki Games",
    projectName: "Live Game Operations",
    status: "active_search",
    priority: "high",
    confidential: true,
    cover:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
    description: "Proyecto mobile live ops con múltiples features activas.",
    positions: [
      {
        id: "pos-1",
        title: "Unity Engineer",
        seniority: "SR",
        status: "open",
        owner: "Ana",
        quantity: 2,
        candidates: [
          {
            id: "cand-1",
            name: "Juan Pérez",
            role: "Unity Engineer",
            location: "Argentina",
            status: ["resume", "tech_interview"],
            processStatus: "tech_interview",
            resumeStatus: "resume_ready",
            talentType: "external",
            email: "juan.perez@email.com",
            linkedin: "linkedin.com/in/juan-perez",
            portfolio: "github.com/juanperez",
            salaryCurrent: "USD 3.500",
            salaryExpected: "USD 4.500",
            workRelation: "Contractor",
            englishLevel: "Intermediate / Advanced",
            source: "LinkedIn",
            recruiterOwner: "Ana",
            lastContactAt: "2026-06-02",
            daysInProcess: 11,
            notes:
              "Perfil fuerte en Unity gameplay. Pendiente feedback de entrevista técnica.",
            timeline: [
              {
                id: "tl-1",
                title: "Candidate sourced",
                description: "Perfil identificado por sourcing en LinkedIn.",
                date: "2026-05-24",
                author: "Ana",
              },
              {
                id: "tl-2",
                title: "Recruiter screening completed",
                description:
                  "Screening inicial completo. Buen fit por experiencia en Unity y disponibilidad.",
                date: "2026-05-27",
                author: "Ana",
              },
              {
                id: "tl-3",
                title: "Internal resume ready",
                description: "Resume interno validado para presentación.",
                date: "2026-05-29",
                author: "Germán",
              },
              {
                id: "tl-4",
                title: "Technical interview scheduled",
                description: "Entrevista técnica coordinada con el equipo.",
                date: "2026-06-02",
                author: "Ana",
              },
            ],
          },
          {
            id: "cand-2",
            name: "María Gómez",
            role: "Unity Engineer",
            location: "Uruguay",
            status: ["contacted", "wip_resume"],
            processStatus: "screening",
            resumeStatus: "wip_resume",
            talentType: "external",
            email: "maria.gomez@email.com",
            linkedin: "linkedin.com/in/maria-gomez",
            portfolio: "behance.net/mariagomez",
            salaryCurrent: "USD 2.800",
            salaryExpected: "USD 3.800",
            workRelation: "Contractor",
            englishLevel: "Intermediate",
            source: "Referral",
            recruiterOwner: "Ana",
            lastContactAt: "2026-06-03",
            daysInProcess: 5,
            notes:
              "Buen fit inicial. Falta completar resume interno antes de presentar.",
            timeline: [
              {
                id: "tl-5",
                title: "Referral received",
                description: "Perfil recomendado por contacto interno.",
                date: "2026-05-30",
                author: "Ana",
              },
              {
                id: "tl-6",
                title: "Candidate contacted",
                description: "Primer contacto realizado. Interesada en avanzar.",
                date: "2026-06-01",
                author: "Ana",
              },
              {
                id: "tl-7",
                title: "WIP resume started",
                description: "Resume interno en preparación.",
                date: "2026-06-03",
                author: "Ana",
              },
            ],
          },
        ],
      },
      {
        id: "pos-2",
        title: "Technical Artist",
        seniority: "SSR",
        status: "on_hold",
        owner: "Germán",
        quantity: 1,
        candidates: [
          {
            id: "cand-3",
            name: "Lucas Díaz",
            role: "Tech Artist",
            location: "Argentina",
            status: ["approved"],
            processStatus: "stand_by",
            resumeStatus: "resume_ready",
            talentType: "external",
            email: "lucas.diaz@email.com",
            linkedin: "linkedin.com/in/lucas-diaz",
            portfolio: "artstation.com/lucasdiaz",
            salaryCurrent: "USD 2.600",
            salaryExpected: "USD 3.400",
            workRelation: "Contractor",
            englishLevel: "Intermediate",
            source: "Database",
            recruiterOwner: "Germán",
            lastContactAt: "2026-05-28",
            daysInProcess: 14,
            notes:
              "Aprobado internamente. La posición está en hold por definición del cliente.",
            timeline: [
              {
                id: "tl-8",
                title: "Database match",
                description: "Perfil encontrado en base interna.",
                date: "2026-05-21",
                author: "Germán",
              },
              {
                id: "tl-9",
                title: "Approved internally",
                description: "Perfil validado para avanzar cuando se reactive la posición.",
                date: "2026-05-28",
                author: "Germán",
              },
              {
                id: "tl-10",
                title: "Position moved to hold",
                description: "Cliente pausó temporalmente la búsqueda.",
                date: "2026-05-29",
                author: "Germán",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "project-2",
    clientName: "Pixel Forge",
    projectName: "Console Port",
    status: "active_search",
    priority: "medium",
    confidential: false,
    cover:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    description: "Porting de juego premium a consolas current gen.",
    positions: [
      {
        id: "pos-3",
        title: "Game Console Engineer",
        seniority: "SR",
        status: "open",
        owner: "Sofía",
        quantity: 2,
        candidates: [
          {
            id: "cand-4",
            name: "Carlos Ruiz",
            role: "Console Engineer",
            location: "Chile",
            status: ["resume", "interviewed"],
            processStatus: "client_interview",
            resumeStatus: "resume_ready",
            talentType: "external",
            email: "carlos.ruiz@email.com",
            linkedin: "linkedin.com/in/carlos-ruiz",
            portfolio: "github.com/carlosruiz",
            salaryCurrent: "USD 4.000",
            salaryExpected: "USD 5.200",
            workRelation: "Contractor",
            englishLevel: "Advanced",
            source: "LinkedIn",
            recruiterOwner: "Sofía",
            lastContactAt: "2026-06-01",
            daysInProcess: 18,
            notes:
              "Experiencia fuerte en consolas. Ya entrevistado, falta decisión final.",
            timeline: [
              {
                id: "tl-11",
                title: "Candidate sourced",
                description: "Perfil identificado por experiencia en consolas.",
                date: "2026-05-15",
                author: "Sofía",
              },
              {
                id: "tl-12",
                title: "Presented to client",
                description: "Perfil presentado con resume interno.",
                date: "2026-05-22",
                author: "Sofía",
              },
              {
                id: "tl-13",
                title: "Client interview completed",
                description: "Entrevista con cliente realizada. Feedback pendiente.",
                date: "2026-06-01",
                author: "Sofía",
              },
            ],
          },
          {
            id: "cand-5",
            name: "Gabriel Silva",
            role: "C++ Engineer",
            location: "Argentina",
            status: ["contacted"],
            processStatus: "contacted",
            resumeStatus: "none",
            talentType: "external",
            email: "gabriel.silva@email.com",
            linkedin: "linkedin.com/in/gabriel-silva",
            portfolio: "github.com/gabrielsilva",
            salaryCurrent: "USD 3.700",
            salaryExpected: "USD 4.800",
            workRelation: "Full-time employee",
            englishLevel: "Intermediate / Advanced",
            source: "Sourcing",
            recruiterOwner: "Sofía",
            lastContactAt: "2026-06-04",
            daysInProcess: 2,
            notes:
              "Perfil C++ interesante. Todavía no se avanzó a screening completo.",
            timeline: [
              {
                id: "tl-14",
                title: "Candidate contacted",
                description: "Primer mensaje enviado por sourcing.",
                date: "2026-06-04",
                author: "Sofía",
              },
            ],
          },
        ],
      },
      {
        id: "pos-4",
        title: "QA Tester",
        seniority: "SSR",
        status: "hired",
        owner: "Ana",
        quantity: 1,
        candidates: [
          {
            id: "cand-6",
            name: "Camila Ortega",
            role: "QA Tester",
            location: "Argentina",
            status: ["hired", "trick_internal"],
            processStatus: "hired",
            resumeStatus: "resume_ready",
            talentType: "trick_internal",
            email: "camila.ortega@email.com",
            linkedin: "linkedin.com/in/camila-ortega",
            portfolio: "",
            salaryCurrent: "USD 1.800",
            salaryExpected: "USD 2.200",
            workRelation: "Contractor",
            englishLevel: "Intermediate",
            source: "Referral",
            recruiterOwner: "Ana",
            lastContactAt: "2026-05-31",
            daysInProcess: 21,
            notes:
              "Contratada. Cambiar status a Trick Internal manteniendo métricas del proceso.",
            timeline: [
              {
                id: "tl-15",
                title: "Candidate presented",
                description: "Perfil presentado al cliente.",
                date: "2026-05-18",
                author: "Ana",
              },
              {
                id: "tl-16",
                title: "Offer accepted",
                description: "Oferta aceptada por la candidata.",
                date: "2026-05-30",
                author: "Ana",
              },
              {
                id: "tl-17",
                title: "Moved to Trick Internal",
                description:
                  "Candidata contratada y actualizada como talento interno.",
                date: "2026-05-31",
                author: "Germán",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "project-3",
    clientName: "Arcade Labs",
    projectName: "New IP Proposal",
    status: "coming_soon",
    priority: "medium",
    confidential: true,
    cover:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    description: "Propuesta en revisión. Pendiente de aprobación del cliente.",
    positions: [
      {
        id: "pos-5",
        title: "Gameplay Engineer",
        seniority: "SR",
        status: "on_hold",
        owner: "Germán",
        quantity: 1,
        candidates: [],
      },
    ],
  },
  {
    id: "project-4",
    clientName: "North Star",
    projectName: "Completed Support",
    status: "active_no_search",
    priority: "low",
    confidential: false,
    cover:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1200&auto=format&fit=crop",
    description: "Proyecto activo pero sin búsquedas abiertas por el momento.",
    positions: [
      {
        id: "pos-6",
        title: "UI Artist",
        seniority: "SR",
        status: "cancelled",
        owner: "Sofía",
        quantity: 1,
        candidates: [],
      },
    ],
  },
];
