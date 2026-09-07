export const PROFILE = {
  name: 'Siddam Kalyan',
  role: 'DevOps & AI Engineer',
  tagline: 'GenAI · RAG · Agentic AI · GCP · AWS',
  location: 'Singapore',
  phone: '+65 8959 3342',
  email: 'kalyansky93@gmail.com',
  linkedin: 'https://linkedin.com/in/kalyan-sky0193',
  linkedinLabel: 'linkedin.com/in/kalyan-sky0193',
  summary:
    'DevOps and AI Engineer with 4+ years building and running production cloud infrastructure on GCP and AWS, and delivering enterprise Generative AI / Agentic AI systems on top of it. Designs Terraform-based IaC, CI/CD pipelines, and Kubernetes platforms, and builds the RAG pipelines, LangGraph agents, and conversational AI that run on them.',
};

export const STATS = [
  { value: '4+', label: 'Years in Production DevOps & AI' },
  { value: '70–85%', label: 'Faster Deployments Shipped' },
  { value: '2,000+', label: 'Users on Platforms Owned' },
  { value: '99.5%+', label: 'Uptime Delivered' },
];

export const STRENGTHS = [
  {
    title: 'AI & Agentic Engineering',
    tag: 'GenAI',
    colorA: '#8b5cf6',
    colorB: '#ec4899',
    items: [
      'LangChain & LangGraph multi-agent workflows',
      'RAG pipelines, vector search & embeddings',
      'Vertex AI, Anthropic Claude, OpenAI APIs',
      'Prompt engineering & conversational AI',
      'n8n workflow automation',
    ],
  },
  {
    title: 'Cloud Platforms',
    tag: 'GCP · AWS',
    colorA: '#60a5fa',
    colorB: '#2dd4bf',
    items: [
      'GCP: GKE, Cloud Run, Cloud Functions, Compute Engine',
      'GCP: Cloud SQL, BigQuery, Artifact Registry',
      'AWS: EKS, Lambda, S3, EC2, IAM, VPC, CloudWatch',
    ],
  },
  {
    title: 'Infrastructure as Code & CI/CD',
    tag: 'IaC',
    colorA: '#22c55e',
    colorB: '#60a5fa',
    items: [
      'Terraform: reusable modules, remote state, workspaces',
      'Multi-cloud provisioning across dev/staging/prod',
      'GitHub Actions, Cloud Build, GitLab CI, Jenkins, Ansible',
    ],
  },
  {
    title: 'Containers & Orchestration',
    tag: 'Kubernetes',
    colorA: '#2dd4bf',
    colorB: '#8b5cf6',
    items: [
      'Docker, Kubernetes on GKE & EKS',
      'Helm charts, HPA/VPA autoscaling',
      'Blue-green & canary deployment strategies',
    ],
  },
  {
    title: 'Networking & Security',
    tag: 'IAM',
    colorA: '#f59e0b',
    colorB: '#ec4899',
    items: [
      'VPC, subnets, load balancing, Cloud NAT',
      'IAM, Workload Identity Federation, RBAC',
      'Least-privilege access design',
    ],
  },
  {
    title: 'Monitoring & FinOps',
    tag: 'Observability',
    colorA: '#ec4899',
    colorB: '#f59e0b',
    items: [
      'Cloud Monitoring, Cloud Logging, CloudWatch',
      'Grafana, Zabbix dashboards & alerting',
      'Cost optimization & Committed Use Discounts',
    ],
  },
  {
    title: 'Languages & Data',
    tag: 'Core',
    colorA: '#60a5fa',
    colorB: '#22c55e',
    items: ['Python, Bash, HCL, YAML, PHP', 'SQL (MySQL, PostgreSQL), GraphQL'],
  },
];

export const EXPERIENCE = [
  {
    role: 'AI Engineer & DevOps Engineer',
    company: 'Vation Digital Pvt. Ltd.',
    location: 'Bengaluru, India',
    period: 'Apr 2022 – Present',
    bullets: [
      'Designed and built enterprise Generative AI applications using Vertex AI, LangChain, LangGraph, Claude, Gemini, and OpenAI APIs, including RAG pipelines for document search, contextual reasoning, and knowledge retrieval.',
      'Built multi-agent LangGraph workflows and conversational AI systems integrated with enterprise APIs and backend services; automated AI workflows using n8n.',
      'Designed and implemented Terraform-based infrastructure across AWS and GCP, with reusable modules for VPC, IAM, S3/GCS, Lambda, EKS, GKE, Cloud SQL, BigQuery, and Pub/Sub, standardizing provisioning across dev, staging, and production.',
      'Built and optimized CI/CD pipelines (GitHub Actions, Cloud Build, GitLab CI, Jenkins) automating builds, Docker image creation, container scanning, and deployments to GKE, EKS, Cloud Run, and AWS Lambda.',
      'Implemented blue-green and canary deployment strategies with Kubernetes rollout controls, and tuned EKS/GKE workloads with HPA/VPA and node affinity.',
      'Implemented least-privilege IAM across AWS and GCP using custom roles, service accounts, Workload Identity Federation, and Terraform-managed policies; applied secrets management via Secret Manager and CSI driver integrations.',
      'Established monitoring, logging, and alerting (Cloud Monitoring, CloudWatch, Zabbix, Grafana) for production AI and infrastructure workloads.',
    ],
  },
];

export const CERTIFICATIONS = [
  'Google Cloud Certified — Professional Cloud Developer',
  'Google Cloud Certified — Professional Cloud DevOps Engineer',
  'Google Cloud Certified — Generative AI Leader',
  'Anthropic Certified — Claude, Agent Skills, Sub-Agents, MCP, Claude with GCP Vertex AI',
];

export const EDUCATION = {
  degree: 'Bachelor of Technology (B.Tech), Computer Science',
  school: 'Rajeev Gandhi Memorial College of Engineering & Technology (JNTU Anantapur)',
  location: 'Nandyala, India',
};

export const PROJECTS = [
  {
    slug: 'bitenxt',
    title: 'BiteNXT',
    subtitle: 'Dental Lab Ordering & CAD Platform',
    roles: ['Product Owner', 'AI Developer', 'Backend Engineer', 'Cloud & DevOps Lead'],
    tags: ['AI', 'Cloud', 'DevOps'],
    colorA: '#8b5cf6',
    colorB: '#2dd4bf',
    featured: true,
    bullets: [
      'Owned the product end-to-end, aligning business goals with technical execution across a live platform serving 500–2,000+ users/transactions.',
      'Architected multi-environment GCP infrastructure (Dev → UAT → Production); built Cloud Build CI/CD pipelines cutting deployment time by 70–85% and manual deployment errors by ~60%.',
      'Designed a production-grade conversational AI chatbot (LangGraph, Vertex AI Search, SSE streaming, Redis session persistence) improving response efficiency by 40%+.',
      'Reduced infrastructure costs 20–35% through billing analysis and resource right-sizing; improved platform uptime to 99.5%+ through secure infra design and SSL/reverse proxy setup.',
    ],
  },
  {
    slug: 'acesmartbid',
    title: 'Vation AURA — AcesmartBid',
    subtitle: 'Tender Management & Analysis',
    roles: ['AI Developer'],
    tags: ['AI', 'RAG'],
    colorA: '#ec4899',
    colorB: '#f59e0b',
    featured: true,
    bullets: [
      'Built a RAG pipeline over large tender documents using page indexing, chunking, and embeddings for contextual question-answering.',
      'Modeled domain knowledge with Knowledge Graph / Knowledge Base constructs and integrated Claude and other LLMs for summarization, classification, and clause extraction.',
    ],
  },
  {
    slug: 'v-opsora',
    title: 'V-OpsOra / V-Opsly',
    subtitle: 'AI-Based Resource & Operations Platform',
    roles: ['AI Developer', 'DevOps Engineer'],
    tags: ['AI', 'Automation'],
    colorA: '#60a5fa',
    colorB: '#8b5cf6',
    featured: true,
    bullets: [
      'Built an AI-powered operations agent (Gemini Code Assist, Vertex AI, n8n) automating HR and finance workflows including resume parsing, ATS scoring, and JD matching.',
      'Centralized GitHub, Cloud VM provisioning, and Cloud Build CI/CD with RBAC-based access control.',
    ],
  },
  {
    slug: 'esanchaya',
    title: 'eSanchaya',
    subtitle: 'Eenadu ERP Platform',
    roles: ['DevOps Engineer'],
    tags: ['DevOps', 'Infra'],
    colorA: '#22c55e',
    colorB: '#60a5fa',
    featured: false,
    bullets: [
      'Configured multi-environment (Dev → QA → UAT → Prod) deployment pipelines with Jenkins and Ansible; implemented Zabbix monitoring and Nginx/Certbot reverse proxy with SSL.',
    ],
  },
];

export const NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: 'projects.html', label: 'Projects' },
  { href: 'contact.html', label: 'Contact' },
];
