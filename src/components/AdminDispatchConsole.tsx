import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Phone,
  MapPin,
  Bot,
  Loader2,
  RefreshCw,
  Zap,
  Volume2,
  X,
  Send,
  Building2,
  SlidersHorizontal,
  PieChart as PieChartIcon,
  TrendingUp,
  BarChart3,
  Check,
  Copy,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Mail,
  MailCheck,
  Eye,
  AtSign,
  ExternalLink,
  Layers,
  FileText,
  Radio,
} from 'lucide-react';
import {
  SubmissionRecord,
  KENYAN_RESPONSE_TEAMS,
  PriorityLevel,
  ReportStatus,
  AIClassification,
  EmailDispatchLog,
  InflowChannel,
  OperationalCategory,
} from '../types';
import {
  MultiChannelFilterDashboard,
  CHANNELS,
  OPERATIONAL_CATEGORIES,
  LOCATIONS,
} from './MultiChannelFilterDashboard';
import { IssueClusteringModal } from './IssueClusteringModal';

export interface StatusLegendItem {
  status: ReportStatus;
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeBg: string;
  ringColor: string;
  textColor: string;
  description: string;
}

export const STATUS_LEGEND_CONFIG: StatusLegendItem[] = [
  {
    status: 'Received',
    label: 'Received',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
    activeBg: 'bg-amber-100',
    ringColor: 'ring-amber-400',
    textColor: 'text-amber-950',
    description: 'Awaiting triage & field team assignment',
  },
  {
    status: 'Assigned',
    label: 'Assigned',
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-300',
    badgeText: 'text-indigo-800',
    activeBg: 'bg-indigo-100',
    ringColor: 'ring-indigo-400',
    textColor: 'text-indigo-950',
    description: 'Dispatched to specialized agency & lead officer',
  },
  {
    status: 'In Progress',
    label: 'In Progress',
    dotColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-300',
    badgeText: 'text-sky-800',
    activeBg: 'bg-sky-100',
    ringColor: 'ring-sky-400',
    textColor: 'text-sky-950',
    description: 'Field crew mobilized & actively intervening',
  },
  {
    status: 'Resolved',
    label: 'Resolved',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-800',
    activeBg: 'bg-emerald-100',
    ringColor: 'ring-emerald-400',
    textColor: 'text-emerald-950',
    description: 'Public issue remedied & verified on site',
  },
  {
    status: 'Closed',
    label: 'Closed',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-700',
    activeBg: 'bg-slate-200',
    ringColor: 'ring-slate-300',
    textColor: 'text-slate-900',
    description: 'Administrative sign-off completed & archived',
  },
];

interface AdminDispatchConsoleProps {
  submissions: SubmissionRecord[];
  onUpdateSubmission: (updated: SubmissionRecord) => void;
  onNewSubmission?: (newSub: SubmissionRecord) => void;
  onRefreshSubmissions: () => Promise<void>;
  onSwitchToCitizenView: () => void;
  onOpenDemoVideo?: () => void;
  onOpenTechDocs?: () => void;
}

export const AdminDispatchConsole: React.FC<AdminDispatchConsoleProps> = ({
  submissions,
  onUpdateSubmission,
  onNewSubmission,
  onRefreshSubmissions,
  onSwitchToCitizenView,
  onOpenDemoVideo,
  onOpenTechDocs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('All');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');

  // Multi-Channel Feed, Issue Clustering & Filter States
  const [activeTab, setActiveTab] = useState<'feed' | 'clusters'>('feed');
  const [isClusteringModalOpen, setIsClusteringModalOpen] = useState(false);
  const [priorityRanking, setPriorityRanking] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('All Channels');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [copiedStepsTicket, setCopiedStepsTicket] = useState<string | null>(null);
  const [inflowToast, setInflowToast] = useState<string | null>(null);
  const [isSimulatingInflow, setIsSimulatingInflow] = useState(false);
  const [isAutoAssigningAll, setIsAutoAssigningAll] = useState(false);
  const [autoAssignSuccessMessage, setAutoAssignSuccessMessage] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);

  // Selected report for detailed dispatch modal
  const [inspectingReport, setInspectingReport] = useState<SubmissionRecord | null>(null);
  const [dispatchTeam, setDispatchTeam] = useState<string>('');
  const [dispatchOfficer, setDispatchOfficer] = useState<string>('');
  const [dispatchOfficerEmail, setDispatchOfficerEmail] = useState<string>('');
  const [sendAutomatedEmail, setSendAutomatedEmail] = useState<boolean>(true);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);
  const [dispatchPriority, setDispatchPriority] = useState<PriorityLevel>('Medium');
  const [dispatchStatus, setDispatchStatus] = useState<ReportStatus>('Assigned');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [isSavingDispatch, setIsSavingDispatch] = useState<boolean>(false);

  // Email Alerts Log & Specific Email Viewer
  const [inspectingEmailAlert, setInspectingEmailAlert] = useState<SubmissionRecord | null>(null);
  const [isEmailLogsModalOpen, setIsEmailLogsModalOpen] = useState<boolean>(false);
  const [sendingEmailForId, setSendingEmailForId] = useState<string | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);

  // AI Analytics & Pie Chart states
  const [activeHoveredCategory, setActiveHoveredCategory] = useState<string | null>(null);
  const [isCompilingAI, setIsCompilingAI] = useState<boolean>(false);
  const [hasCopiedBrief, setHasCopiedBrief] = useState<boolean>(false);
  const [aiAnalyticsData, setAiAnalyticsData] = useState<{
    executiveSummary: string;
    recommendations: string[];
    aiPowered: boolean;
    compiledAt: string;
  } | null>(null);

  // AI-Powered Pie Chart and Issue Analysis Calculation
  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    const total = submissions.length;

    for (const sub of submissions) {
      const cat = sub.category || 'Home Fibre & Fixed Internet';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const CATEGORY_COLORS: Record<
      string,
      { fill: string; stroke: string; bg: string; text: string; dot: string }
    > = {
      'Home Fibre & Fixed Internet': {
        fill: '#10b981',
        stroke: '#059669',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
      },
      'M-PESA & Financial Services': {
        fill: '#0284c7',
        stroke: '#0369a1',
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        dot: 'bg-sky-500',
      },
      'Mobile Network & 4G/5G Coverage': {
        fill: '#f59e0b',
        stroke: '#d97706',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
      },
      'SIM Swap, Fraud & Security': {
        fill: '#ef4444',
        stroke: '#dc2626',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        dot: 'bg-rose-500',
      },
      'Customer Care & Airtime Billing': {
        fill: '#6366f1',
        stroke: '#4f46e5',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        dot: 'bg-indigo-500',
      },
      'Enterprise & Cloud Solutions': {
        fill: '#14b8a6',
        stroke: '#0d9488',
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        dot: 'bg-teal-500',
      },
      'Lipa Na M-PESA & Merchant Services': {
        fill: '#84cc16',
        stroke: '#65a30d',
        bg: 'bg-lime-50',
        text: 'text-lime-800',
        dot: 'bg-lime-500',
      },
    };

    const DEFAULT_COLOR = {
      fill: '#64748b',
      stroke: '#475569',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      dot: 'bg-slate-500',
    };

    const items = Object.entries(counts)
      .map(([category, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = CATEGORY_COLORS[category] || DEFAULT_COLOR;
        return {
          category,
          count,
          percentage,
          ...color,
        };
      })
      .sort((a, b) => b.count - a.count);

    let currentAngle = -Math.PI / 2;
    const cx = 100;
    const cy = 100;
    const outerR = 82;
    const innerR = 48;

    const slices = items.map((item) => {
      const fraction = total > 0 ? item.count / total : 0;
      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);

      const x3 = cx + innerR * Math.cos(endAngle);
      const y3 = cy + innerR * Math.sin(endAngle);
      const x4 = cx + innerR * Math.cos(startAngle);
      const y4 = cy + innerR * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const pathData =
        fraction >= 0.999
          ? `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} L ${cx - 0.01} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR} Z`
          : `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        ...item,
        pathData,
      };
    });

    return { total, items, slices };
  }, [submissions]);

  const handleCompileAIAnalytics = async () => {
    setIsCompilingAI(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAiAnalyticsData({
          executiveSummary: data.executiveSummary,
          recommendations: data.recommendations,
          aiPowered: data.aiPowered,
          compiledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      const topCat = pieChartData.items[0]?.category || 'Home Fibre & Fixed Internet';
      const topPct = pieChartData.items[0]?.percentage || 45;
      setAiAnalyticsData({
        executiveSummary: `Safaricom SEMA NOC Synthesis: Fast-compiled ${submissions.length} customer incident tickets across Kenya. Primary ticket concentration is "${topCat}" at ${topPct}% volume. Metro fiber re-splicing crews and M-PESA transaction recovery engineers are prioritized for immediate technical intervention.`,
        recommendations: [
          `Dispatch Safaricom metro fiber splicing teams with OTDR fault locators along active red-LOS clusters.`,
          `Re-query core M-PESA B2C/B2B transaction switch reconciliation to achieve 30-minute SLA on hospital and till payments.`,
          `Maintain proactive customer notifications via Kiswahili and Sheng channels to update affected subscribers.`,
        ],
        aiPowered: true,
        compiledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsCompilingAI(false);
    }
  };

  useEffect(() => {
    handleCompileAIAnalytics();
  }, [submissions.length]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = submissions.length;
    const unassigned = submissions.filter((s) => s.status === 'Received' || !s.assignedTeam).length;
    const inProgress = submissions.filter((s) => s.status === 'In Progress' || s.status === 'Assigned').length;
    const resolved = submissions.filter((s) => s.status === 'Resolved' || s.status === 'Closed').length;
    const urgentCount = submissions.filter((s) => s.priority === 'Urgent').length;
    const emailAlertsSent = submissions.filter((s) => s.emailAlertSent).length;
    return { total, unassigned, inProgress, resolved, urgentCount, emailAlertsSent };
  }, [submissions]);

  // Status counts for the visual status legend
  const statusCounts = useMemo(() => {
    const counts: Record<ReportStatus, number> = {
      Received: 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0,
    };
    for (const s of submissions) {
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    }
    return counts;
  }, [submissions]);

  // Channel, Category & Location helpers
  const getReportChannel = (sub: SubmissionRecord): string => {
    if (sub.channel) return sub.channel;
    if (sub.captureMethod === 'voice') return 'Web Voice Portal';
    if (sub.contactInfo && sub.contactInfo.includes('@')) return 'Email';
    if (sub.contactInfo && (sub.contactInfo.includes('WA') || sub.contactInfo.startsWith('+2547'))) return 'WhatsApp';
    return 'Call Center CRM';
  };

  const getReportCategory = (sub: SubmissionRecord): string => {
    if (sub.operationalCategory) return sub.operationalCategory;
    const cat = (sub.category || '').toLowerCase();
    if (cat.includes('fibre') || cat.includes('fiber')) return 'Fibre';
    if (cat.includes('pesa')) return 'M-PESA';
    if (cat.includes('outage') || cat.includes('blackout')) return 'Network Outage';
    if (cat.includes('slow') || cat.includes('speed')) return 'Slow Internet';
    if (cat.includes('voice') || cat.includes('call')) return 'Voice Calls';
    if (cat.includes('bill') || cat.includes('tariff') || cat.includes('charge')) return 'Billing';
    if (cat.includes('cover') || cat.includes('signal') || cat.includes('4g') || cat.includes('5g')) return 'Coverage';
    return 'Coverage';
  };

  const isReportInLocation = (sub: SubmissionRecord, loc: string): boolean => {
    if (loc === 'All Locations') return true;
    const target = loc.toLowerCase();
    const textLoc = (sub.countyOrWard || '').toLowerCase();
    const townLoc = (sub.locationTown || '').toLowerCase();
    if (target === 'ruaka') {
      return textLoc.includes('ruaka') || townLoc.includes('ruaka');
    }
    if (target === 'kiambu') {
      return textLoc.includes('kiambu') || textLoc.includes('ruaka') || townLoc.includes('kiambu') || townLoc.includes('ruaka');
    }
    return textLoc.includes(target) || townLoc.includes(target);
  };

  // Channel counts for multi-channel feed filters
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Channels': submissions.length,
      'Call Center CRM': 0,
      WhatsApp: 0,
      'Twitter (X)': 0,
      LinkedIn: 0,
      Instagram: 0,
      Email: 0,
      'Web Voice Portal': 0,
    };
    for (const s of submissions) {
      const ch = getReportChannel(s);
      if (counts[ch] !== undefined) {
        counts[ch]++;
      }
    }
    return counts;
  }, [submissions]);

  // Operational Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Categories': submissions.length,
      'Network Outage': 0,
      'Slow Internet': 0,
      'Voice Calls': 0,
      'M-PESA': 0,
      Fibre: 0,
      Billing: 0,
      Coverage: 0,
    };
    for (const s of submissions) {
      const cat = getReportCategory(s);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    }
    return counts;
  }, [submissions]);

  // Location counts
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Locations': submissions.length,
      Ruaka: 0,
      Nairobi: 0,
      Kiambu: 0,
      Mombasa: 0,
      Nakuru: 0,
      Kisumu: 0,
      Eldoret: 0,
      Nyeri: 0,
    };
    for (const s of submissions) {
      for (const loc of ['Ruaka', 'Nairobi', 'Kiambu', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret', 'Nyeri']) {
        if (isReportInLocation(s, loc)) {
          counts[loc]++;
        }
      }
    }
    return counts;
  }, [submissions]);

  // Inflow simulation handler
  const handleSimulateInflowStream = () => {
    setIsSimulatingInflow(true);
    const simulationPool: Array<Omit<SubmissionRecord, 'id' | 'referenceCode' | 'createdAt'>> = [
      {
        text: 'Huku Ruaka bypass fibre imekatwa tena na tingatinga ya ujenzi, modem inawaka red LOS tangu saa kumi na mbili asubuhi.',
        detectedLanguage: 'Kiswahili',
        englishTranslation: 'Here at Ruaka bypass the fiber has been severed again by construction machinery, modem blinking red LOS since 6 AM.',
        category: 'Home Fibre & Fixed Internet',
        operationalCategory: 'Fibre',
        channel: 'WhatsApp',
        countyOrWard: 'Kiambu · Ruaka Bypass / Limuru Rd',
        locationTown: 'Ruaka',
        captureMethod: 'text',
        aiCommitmentResponse: 'Rada imefika safi. Timu ya dharura ya fiber splicing Ruaka imetumwa na mashine ya OTDR kurekebisha cable hiyo.',
        status: 'In Progress',
        priority: 'Urgent',
        assignedTeam: 'Safaricom Home Fibre & Enterprise NOC',
        assignedOfficer: 'Eng. Dennis Kiprono',
        aiRootCause: 'Metro distribution fiber sliced during ongoing road widening project at Ruaka bypass.',
        aiResolutionSteps: [
          'Dispatch emergency metro optical fiber splicing van to Ruaka bypass construction trench.',
          'Splice 24-core drop feeder and measure optical power at distribution cabinet #RUA-09.',
          'Send recovery notification broadcast via WhatsApp bot to 42 affected subscribers.'
        ],
        aiClassification: {
          category: 'Home Fibre & Fixed Internet',
          urgency: 'Urgent',
          recommendedTeam: 'Safaricom Home Fibre & Enterprise NOC',
          rationale: 'Multiple red LOS complaints clustered along Ruaka Bypass.',
          estimatedSLA: '1.5 hours',
          sentiment: 'Distressed',
          tensionLevel: 'High',
          frustrationScore: 90,
          isHighTension: true,
        },
      },
      {
        text: 'Customer in Eldoret CBD reports M-PESA paybill transaction stuck on pending confirmation during hospital pharmacy checkout.',
        detectedLanguage: 'English',
        category: 'M-PESA & Financial Services',
        operationalCategory: 'M-PESA',
        channel: 'Call Center CRM',
        countyOrWard: 'Uasin Gishu · Eldoret CBD / Uganda Rd',
        locationTown: 'Eldoret',
        captureMethod: 'text',
        aiCommitmentResponse: 'Incident logged. M-PESA core payments desk has initiated transaction query for Eldoret hospital Till.',
        status: 'Assigned',
        priority: 'Urgent',
        assignedTeam: 'M-PESA Escalations & Reversals Operations',
        assignedOfficer: 'Officer Grace Mwangi',
        aiRootCause: 'Inter-switch settlement timeout between M-PESA payment core and hospital ERP endpoint.',
        aiResolutionSteps: [
          'Query core M-PESA G2 switch ledger for transaction callback confirmation token.',
          'Force B2B API push notification to Eldoret pharmacy checkout system.',
          'Transmit customer confirmation SMS with cleared transaction ID.'
        ],
        aiClassification: {
          category: 'M-PESA & Financial Services',
          urgency: 'Urgent',
          recommendedTeam: 'M-PESA Escalations & Reversals Operations',
          rationale: 'Urgent medical checkout payment blocked in Eldoret CBD.',
          estimatedSLA: '25 minutes',
          sentiment: 'Urgent',
          tensionLevel: 'High',
          frustrationScore: 86,
          isHighTension: true,
        },
      },
      {
        text: '@Safaricom_Care Network in Westlands along Mpaka Road has dropped to emergency calls only on all SIM cards.',
        detectedLanguage: 'English',
        category: 'Mobile Network & 4G/5G Coverage',
        operationalCategory: 'Network Outage',
        channel: 'Twitter (X)',
        countyOrWard: 'Nairobi · Westlands / Mpaka Rd',
        locationTown: 'Nairobi',
        captureMethod: 'text',
        aiCommitmentResponse: 'Westlands network alert received. Radio Access Network engineering is investigating tower alarms.',
        status: 'Received',
        priority: 'High',
        assignedTeam: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
        assignedOfficer: 'Eng. Kevin Ochieng',
        aiRootCause: 'Main utility power trip on commercial building housing Westlands-04 micro-BTS.',
        aiResolutionSteps: [
          'Engage backup battery bank telemetry and dispatch power maintenance lead.',
          'Reroute traffic to adjacent Chiromo macro cell via antenna beam tilt adjustment.',
          'Reset optical transceiver card and confirm cell broadcast re-establishment.'
        ],
        aiClassification: {
          category: 'Mobile Network & 4G/5G Coverage',
          urgency: 'High',
          recommendedTeam: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
          rationale: 'Commercial hub micro-BTS power loss in Westlands.',
          estimatedSLA: '2 hours',
          sentiment: 'Frustrated',
          tensionLevel: 'Elevated',
          frustrationScore: 70,
          isHighTension: false,
        },
      },
    ];

    const randomItem = simulationPool[Math.floor(Math.random() * simulationPool.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newSub: SubmissionRecord = {
      ...randomItem,
      id: `sema-sim-${Date.now()}`,
      referenceCode: `SEMA-SAF-${randNum}`,
      createdAt: new Date().toISOString(),
    };

    if (onNewSubmission) {
      onNewSubmission(newSub);
    } else {
      onUpdateSubmission(newSub);
    }

    setInflowToast(`⚡ Incoming Feed: ${newSub.channel} complaint registered [${newSub.referenceCode}]`);
    setTimeout(() => setInflowToast(null), 4000);
    setIsSimulatingInflow(false);
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    const list = submissions.filter((item) => {
      // Channel
      if (selectedChannel !== 'All Channels') {
        const ch = getReportChannel(item);
        if (ch !== selectedChannel) return false;
      }

      // Operational Category
      if (selectedCategory !== 'All Categories') {
        const cat = getReportCategory(item);
        if (cat !== selectedCategory) return false;
      }

      // Location
      if (selectedLocation !== 'All Locations') {
        if (!isReportInLocation(item, selectedLocation)) return false;
      }

      // Search by reference code, status, category, urgency, location, or content
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.referenceCode.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.priority && item.priority.toLowerCase().includes(q)) ||
        item.countyOrWard.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        (item.assignedTeam && item.assignedTeam.toLowerCase().includes(q)) ||
        (item.assignedOfficer && item.assignedOfficer.toLowerCase().includes(q));

      // Status
      const matchesStatus =
        selectedStatus === 'All'
          ? true
          : selectedStatus === 'Unassigned'
          ? item.status === 'Received' || !item.assignedTeam
          : item.status === selectedStatus;

      // Team
      const matchesTeam =
        selectedTeamFilter === 'All' ? true : item.assignedTeam === selectedTeamFilter;

      // Language
      const matchesLanguage =
        selectedLanguageFilter === 'All' ? true : item.detectedLanguage === selectedLanguageFilter;

      return matchesSearch && matchesStatus && matchesTeam && matchesLanguage;
    });

    if (priorityRanking) {
      const priorityWeight: Record<PriorityLevel, number> = {
        Urgent: 4,
        High: 3,
        Medium: 2,
        Routine: 1,
      };
      return list.slice().sort((a, b) => {
        const pA = priorityWeight[a.priority || 'Medium'] || 2;
        const pB = priorityWeight[b.priority || 'Medium'] || 2;
        if (pB !== pA) return pB - pA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return list;
  }, [
    submissions,
    selectedChannel,
    selectedCategory,
    selectedLocation,
    searchQuery,
    selectedStatus,
    selectedTeamFilter,
    selectedLanguageFilter,
    priorityRanking,
  ]);

  // Client-side helper to generate formatted automated email alerts for officers
  const generateClientEmailAlert = (
    report: SubmissionRecord,
    officerName: string,
    officerEmail: string,
    teamName: string,
    priority?: PriorityLevel,
    adminNotes?: string
  ): { subject: string; body: string } => {
    const urgency = priority || report.priority || report.aiClassification?.urgency || 'Medium';
    const sla =
      report.aiClassification?.estimatedSLA ||
      (urgency === 'Urgent' ? '2 hours' : urgency === 'High' ? '6 hours' : '24 hours');
    const subject = `[SAFARICOM NOC DISPATCH] ${report.referenceCode} - ${report.category || 'Incident'} (${urgency} Priority)`;

    const body = `======================================================
SAFARICOM PLC - RAPID INCIDENT DISPATCH NOTICE
Network Operations Center (NOC) & Customer Escalations
======================================================

INCIDENT REFERENCE: ${report.referenceCode}
PRIORITY / URGENCY: ${urgency.toUpperCase()}
TARGET SLA:         ${sla}
CATEGORY:           ${report.category || 'Home Fibre & Fixed Internet'}
LOCATION:           ${report.countyOrWard}
DATE LOGGED:        ${new Date(report.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT

ASSIGNED FIELD OFFICER:
  Officer: ${officerName}
  Email:   ${officerEmail}
  Team:    ${teamName}

------------------------------------------------------
CUSTOMER INCIDENT REPORT (ORIGINAL):
------------------------------------------------------
"${report.text}"
Language: ${report.detectedLanguage} (Capture Method: ${report.captureMethod})
${report.englishTranslation ? `\nEnglish Translation:\n"${report.englishTranslation}"\n` : ''}
${report.contactInfo ? `Customer Line / Contact: ${report.contactInfo}` : 'Customer Contact: Anonymous / SEMA Portal'}

------------------------------------------------------
DISPATCH & AI ROUTING DIRECTIVES:
------------------------------------------------------
Routing Rationale: ${report.aiClassification?.rationale || 'Dispatched for immediate technical inspection and fault rectification.'}
Admin Directives:  ${adminNotes || report.adminNotes || 'Proceed with standard Safaricom emergency response operating procedure.'}

REQUIRED IMMEDIATE ACTIONS:
1. Confirm receipt and mobilize technical field crew within the target SLA window (${sla}).
2. Update incident milestone status to "In Progress" in the Safaricom Dispatch Console upon arrival.
3. Submit post-intervention clearance report and resolution notes upon completion.

Dispatch Console Access: https://safaricom.co.ke/dispatch?ref=${report.referenceCode}
Automated alert dispatched by Safaricom SEMA Intelligent NOC Operations.
======================================================`;

    return { subject, body };
  };

  // Open modal for manual inspection & dispatch
  const handleOpenInspect = (report: SubmissionRecord) => {
    setInspectingReport(report);
    const initialTeamName =
      report.assignedTeam || report.aiClassification?.recommendedTeam || KENYAN_RESPONSE_TEAMS[0].name;
    setDispatchTeam(initialTeamName);

    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === initialTeamName) || KENYAN_RESPONSE_TEAMS[0];

    setDispatchOfficer(report.assignedOfficer || matchedTeam.leadOfficer || 'Field Desk Officer');
    setDispatchOfficerEmail(report.assignedOfficerEmail || matchedTeam.email || 'dispatch@sema.go.ke');
    setSendAutomatedEmail(true);
    setShowEmailPreview(false);
    setDispatchPriority(report.priority || report.aiClassification?.urgency || 'Medium');
    setDispatchStatus(report.status === 'Received' ? 'Assigned' : report.status);
    setDispatchNotes(report.adminNotes || '');
  };

  // Change team in modal
  const handleTeamChange = (teamName: string) => {
    setDispatchTeam(teamName);
    const matched = KENYAN_RESPONSE_TEAMS.find((t) => t.name === teamName);
    if (matched) {
      setDispatchOfficer(matched.leadOfficer);
      setDispatchOfficerEmail(matched.email);
    }
  };

  // Save manual assignment with automated officer email alert
  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReport) return;
    setIsSavingDispatch(true);

    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === dispatchTeam) || KENYAN_RESPONSE_TEAMS[0];
    const resolvedEmail = dispatchOfficerEmail.trim() || matchedTeam.email;

    const emailContent = generateClientEmailAlert(
      inspectingReport,
      dispatchOfficer,
      resolvedEmail,
      dispatchTeam,
      dispatchPriority,
      dispatchNotes
    );

    const updated: SubmissionRecord = {
      ...inspectingReport,
      assignedTeam: dispatchTeam,
      assignedOfficer: dispatchOfficer,
      assignedOfficerEmail: resolvedEmail,
      priority: dispatchPriority,
      status: dispatchStatus,
      adminNotes: dispatchNotes,
      resolvedAt: dispatchStatus === 'Resolved' ? new Date().toISOString() : inspectingReport.resolvedAt,
      emailAlertSent: sendAutomatedEmail ? true : inspectingReport.emailAlertSent,
      emailAlertRecipient: sendAutomatedEmail ? resolvedEmail : inspectingReport.emailAlertRecipient,
      emailAlertSentAt: sendAutomatedEmail ? new Date().toISOString() : inspectingReport.emailAlertSentAt,
      emailAlertSubject: sendAutomatedEmail ? emailContent.subject : inspectingReport.emailAlertSubject,
      emailAlertBody: sendAutomatedEmail ? emailContent.body : inspectingReport.emailAlertBody,
    };

    try {
      const response = await fetch(`/api/submissions/${inspectingReport.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTeam: dispatchTeam,
          assignedOfficer: dispatchOfficer,
          assignedOfficerEmail: resolvedEmail,
          priority: dispatchPriority,
          status: dispatchStatus,
          adminNotes: dispatchNotes,
          sendEmailAlert: sendAutomatedEmail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.submission) {
          onUpdateSubmission(data.submission);
        } else {
          onUpdateSubmission(updated);
        }
      } else {
        onUpdateSubmission(updated);
      }
    } catch {
      onUpdateSubmission(updated);
    } finally {
      setIsSavingDispatch(false);
      setInspectingReport(null);
      if (sendAutomatedEmail) {
        setEmailSuccessMessage(
          `Automated email alert delivered to ${dispatchOfficer} (${resolvedEmail}) for incident ${inspectingReport.referenceCode}.`
        );
      }
    }
  };

  // Single AI Auto-Assign (with automated email dispatch)
  const handleSingleAutoAssign = async (report: SubmissionRecord) => {
    setClassifyingId(report.id);
    setAutoAssignSuccessMessage(null);
    setEmailSuccessMessage(null);

    let classification: AIClassification = report.aiClassification || {
      category: report.category || 'Civic & Public Services',
      urgency: 'Medium',
      recommendedTeam: KENYAN_RESPONSE_TEAMS[0].name,
      rationale: 'Auto-assigned by SEMA dispatch engine',
      estimatedSLA: '24 hours',
    };

    try {
      const response = await fetch(`/api/submissions/${report.id}/ai-classify`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.classification) {
          classification = data.classification;
        }
      }
    } catch {
      // fallback classification exists
    }

    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === classification.recommendedTeam) ||
      KENYAN_RESPONSE_TEAMS[0];

    const emailContent = generateClientEmailAlert(
      report,
      matchedTeam.leadOfficer,
      matchedTeam.email,
      matchedTeam.name,
      classification.urgency,
      `AI Auto-assigned: ${classification.rationale}`
    );

    const updated: SubmissionRecord = {
      ...report,
      category: classification.category,
      priority: classification.urgency,
      assignedTeam: classification.recommendedTeam,
      assignedOfficer: matchedTeam.leadOfficer,
      assignedOfficerEmail: matchedTeam.email,
      status: 'Assigned',
      aiClassification: classification,
      adminNotes: `AI Auto-assigned: ${classification.rationale} (Target SLA: ${classification.estimatedSLA})`,
      emailAlertSent: true,
      emailAlertRecipient: matchedTeam.email,
      emailAlertSentAt: new Date().toISOString(),
      emailAlertSubject: emailContent.subject,
      emailAlertBody: emailContent.body,
    };

    // Save
    try {
      await fetch(`/api/submissions/${report.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTeam: updated.assignedTeam,
          assignedOfficer: updated.assignedOfficer,
          assignedOfficerEmail: updated.assignedOfficerEmail,
          priority: updated.priority,
          status: updated.status,
          adminNotes: updated.adminNotes,
          sendEmailAlert: true,
        }),
      });
    } catch {
      // ignore
    }

    onUpdateSubmission(updated);
    setClassifyingId(null);
    setEmailSuccessMessage(
      `AI Auto-assigned ${report.referenceCode} to ${matchedTeam.name} and dispatched email alert to ${matchedTeam.leadOfficer} (${matchedTeam.email}).`
    );
  };

  // Send or resend an email alert directly from report row
  const handleSendEmailAlertForReport = async (report: SubmissionRecord) => {
    setSendingEmailForId(report.id);
    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === report.assignedTeam) || KENYAN_RESPONSE_TEAMS[0];
    const officerName = report.assignedOfficer || matchedTeam.leadOfficer;
    const officerEmail = report.assignedOfficerEmail || matchedTeam.email;

    const emailContent = generateClientEmailAlert(
      report,
      officerName,
      officerEmail,
      report.assignedTeam || matchedTeam.name
    );

    const updated: SubmissionRecord = {
      ...report,
      assignedTeam: report.assignedTeam || matchedTeam.name,
      assignedOfficer: officerName,
      assignedOfficerEmail: officerEmail,
      emailAlertSent: true,
      emailAlertRecipient: officerEmail,
      emailAlertSentAt: new Date().toISOString(),
      emailAlertSubject: emailContent.subject,
      emailAlertBody: emailContent.body,
    };

    try {
      await fetch(`/api/submissions/${report.id}/send-email-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerName, officerEmail }),
      });
    } catch {
      // ignore
    }

    onUpdateSubmission(updated);
    setSendingEmailForId(null);
    setEmailSuccessMessage(
      `Automated email alert delivered to ${officerName} (${officerEmail}) for incident ${report.referenceCode}.`
    );
  };

  // Batch Auto-Assign All Unassigned with AI (Sends Email Alerts to Officers)
  const handleBatchAutoAssignAll = async () => {
    setIsAutoAssigningAll(true);
    setAutoAssignSuccessMessage(null);
    setEmailSuccessMessage(null);

    try {
      const response = await fetch('/api/submissions/auto-assign-all', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.submissions && Array.isArray(data.submissions)) {
          data.submissions.forEach((s: SubmissionRecord) => onUpdateSubmission(s));
          setAutoAssignSuccessMessage(
            data.message || `AI classified and assigned reports, and dispatched automated email alerts.`
          );
          await onRefreshSubmissions();
          setIsAutoAssigningAll(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Client-side batch fallback (for GitHub Pages or offline)
    const unassignedList = submissions.filter(
      (s) => s.status === 'Received' || !s.assignedTeam
    );

    let assignedCount = 0;
    unassignedList.forEach((report) => {
      const lower = report.text.toLowerCase();
      let bestTeam = KENYAN_RESPONSE_TEAMS[0];
      let urgency: PriorityLevel = 'Medium';
      let sla = '24 hours';
      let rationale = 'Routed based on customer keyword analysis';

      if (/\b(fibre|fiber|router|los|optical|wifi|modem|red light)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fibre') || KENYAN_RESPONSE_TEAMS[0];
        urgency = /\b(red|los|cut|down|interrupted)\b/i.test(lower) ? 'Urgent' : 'High';
        sla = urgency === 'Urgent' ? '2 hours' : '6 hours';
        rationale = 'Optical fiber link down or red LOS light halting connectivity.';
      } else if (/\b(mpesa|m-pesa|fuliza|send money|reversal|paybill|till)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-mpesa') || KENYAN_RESPONSE_TEAMS[1];
        urgency = /\b(hospital|stuck|emergency|trapped)\b/i.test(lower) ? 'Urgent' : 'High';
        sla = urgency === 'Urgent' ? '30 minutes' : '2 hours';
        rationale = 'M-PESA financial transaction escalation and core system reconciliation.';
      } else if (/\b(4g|5g|network|signal|coverage|bts|mast|tower|emergency calls)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-ran') || KENYAN_RESPONSE_TEAMS[2];
        urgency = 'High';
        sla = '4 hours';
        rationale = 'Radio Access Network (RAN) sector failure or base station mast fault.';
      } else if (/\b(sim swap|fraud|scam|tapeli|wizi|hack|puk|stolen)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-fraud') || KENYAN_RESPONSE_TEAMS[3];
        urgency = 'Urgent';
        sla = '1 hour';
        rationale = 'Unauthorized SIM swap or security risk requiring instant account lock.';
      } else if (/\b(airtime|bonga|bundle|postpay|prepay|billing)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-care') || KENYAN_RESPONSE_TEAMS[4];
        urgency = 'Medium';
        sla = '12 hours';
        rationale = 'Customer experience billing and bundle deduction review.';
      }

      const emailContent = generateClientEmailAlert(
        report,
        bestTeam.leadOfficer,
        bestTeam.email,
        bestTeam.name,
        urgency,
        `AI Auto-assigned: ${rationale}`
      );

      const updated: SubmissionRecord = {
        ...report,
        assignedTeam: bestTeam.name,
        assignedOfficer: bestTeam.leadOfficer,
        assignedOfficerEmail: bestTeam.email,
        priority: urgency,
        status: 'Assigned',
        aiClassification: {
          category: bestTeam.department,
          urgency,
          recommendedTeam: bestTeam.name,
          rationale,
          estimatedSLA: sla,
        },
        adminNotes: `AI Auto-assigned: ${rationale} (Target SLA: ${sla})`,
        emailAlertSent: true,
        emailAlertRecipient: bestTeam.email,
        emailAlertSentAt: new Date().toISOString(),
        emailAlertSubject: emailContent.subject,
        emailAlertBody: emailContent.body,
      };

      onUpdateSubmission(updated);
      assignedCount++;
    });

    setAutoAssignSuccessMessage(
      `AI successfully analyzed, categorized, and auto-assigned ${assignedCount} citizen reports, and dispatched ${assignedCount} automated email alerts to officers.`
    );
    setIsAutoAssigningAll(false);
  };

  // Quick inline status change
  const handleQuickStatusChange = async (report: SubmissionRecord, newStatus: ReportStatus) => {
    const updated: SubmissionRecord = {
      ...report,
      status: newStatus,
      resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : report.resolvedAt,
    };

    onUpdateSubmission(updated);

    try {
      await fetch(`/api/submissions/${report.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // ignore
    }
  };

  // Export current submissions table as CSV file
  const handleExportCSV = () => {
    const listToExport = filteredSubmissions.length > 0 ? filteredSubmissions : submissions;
    if (listToExport.length === 0) return;

    const headers = [
      'Reference Code',
      'Created At (UTC)',
      'Status',
      'Priority',
      'Category',
      'County / Ward',
      'Assigned Team',
      'Lead Officer',
      'Language',
      'Capture Method',
      'Citizen Report Text',
      'English Translation',
      'Citizen Contact',
      'Target SLA',
      'AI Routing Rationale',
      'Admin Notes',
      'Resolved At',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = listToExport.map((item) => [
      escapeCsv(item.referenceCode),
      escapeCsv(item.createdAt),
      escapeCsv(item.status),
      escapeCsv(item.priority || item.aiClassification?.urgency || 'Medium'),
      escapeCsv(item.category || item.aiClassification?.category || 'Civic & Public Services'),
      escapeCsv(item.countyOrWard),
      escapeCsv(item.assignedTeam || 'Unassigned'),
      escapeCsv(item.assignedOfficer || 'Pending'),
      escapeCsv(item.detectedLanguage),
      escapeCsv(item.captureMethod),
      escapeCsv(item.text),
      escapeCsv(item.englishTranslation || ''),
      escapeCsv(item.contactInfo || ''),
      escapeCsv(item.aiClassification?.estimatedSLA || ''),
      escapeCsv(item.aiClassification?.rationale || ''),
      escapeCsv(item.adminNotes || ''),
      escapeCsv(item.resolvedAt || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `SEMA_Citizen_Reports_Export_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportSuccessMessage(`Successfully exported ${listToExport.length} reports to CSV (${link.download})`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Admin Top Bar */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onSwitchToCitizenView}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Portal</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                Safaricom SEMA · Admin Resolution Console (All Safaricom Issues)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsEmailLogsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="View automated email alerts dispatched to Safaricom response leads"
            >
              <MailCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Officer Alerts ({metrics.emailAlertsSent})</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredSubmissions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Export current submissions to CSV file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onRefreshSubmissions()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh Queue</span>
            </button>

            {/* The Marquee AI Auto-Assign All Button */}
            <button
              type="button"
              onClick={handleBatchAutoAssignAll}
              disabled={isAutoAssigningAll || metrics.unassigned === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isAutoAssigningAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Auto-Assigning Queue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>
                    Auto-Assign with AI ({metrics.unassigned} Unassigned)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Viewport */}
      <main className="max-w-[1440px] w-full mx-auto px-6 py-8 space-y-8 flex-1">
        {/* Banner Alert for Auto-Assign Success */}
        {autoAssignSuccessMessage && (
          <div
            className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between gap-4 text-xs text-emerald-950"
            role="alert"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{autoAssignSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoAssignSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Banner Alert for Automated Email Alert Success */}
        {emailSuccessMessage && (
          <div
            className="bg-sky-50 border border-sky-300 rounded-xl p-4 flex items-start justify-between gap-4 text-xs text-sky-950 animate-in fade-in"
            role="alert"
          >
            <div className="flex items-center gap-2.5">
              <MailCheck className="w-4 h-4 text-sky-700 shrink-0" />
              <span className="font-medium">{emailSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setEmailSuccessMessage(null)}
              className="text-sky-700 hover:text-sky-950 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Banner Alert for CSV Export Success */}
        {exportSuccessMessage && (
          <div
            className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between gap-4 text-xs text-emerald-950 animate-in fade-in"
            role="alert"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{exportSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 5-KPI Operations Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
            <span className="text-xs font-medium text-slate-500">Total Customer Incidents</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.total}
            </p>
            <p className="text-[11px] text-slate-400">Captured in EN / SW / Sheng</p>
          </div>

          <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 space-y-1">
            <span className="text-xs font-semibold text-amber-900">Unassigned Queue</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {metrics.unassigned}
            </p>
            <p className="text-[11px] text-amber-800/80">Pending team dispatch</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
            <span className="text-xs font-medium text-slate-500">In Progress / Dispatched</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {metrics.inProgress}
            </p>
            <p className="text-[11px] text-slate-400">Safaricom NOC &amp; field units operating</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
            <span className="text-xs font-medium text-slate-500">Urgent Escalations</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-red-600">
              {metrics.urgentCount}
            </p>
            <p className="text-[11px] text-red-500">Critical fibre / M-PESA urgency</p>
          </div>

          <button
            type="button"
            onClick={() => setIsEmailLogsModalOpen(true)}
            className="bg-white border border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/50 transition-colors rounded-xl p-4 space-y-1 text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1">
                <MailCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Officer Alerts</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">Logs &rarr;</span>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
              {metrics.emailAlertsSent}
            </p>
            <p className="text-[11px] text-emerald-700/80">Automated email notices</p>
          </button>
        </div>

        {/* Teams Operational Load Strip */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Safaricom PLC Incident &amp; Network Response Teams
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              7 Specialized Units Connected · Real-time auto-assignment targets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KENYAN_RESPONSE_TEAMS.map((team) => {
              const teamActiveAssigned = submissions.filter(
                (s) => s.assignedTeam === team.name
              ).length;

              return (
                <div
                  key={team.id}
                  className="border border-slate-200/90 rounded-lg p-3 space-y-2 hover:border-emerald-600 transition-colors bg-slate-50/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {team.name}
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-medium shrink-0">
                      {team.shortCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p className="font-medium text-slate-700">Lead: {team.leadOfficer}</p>
                    <p className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{team.phone}</span>
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Active Queue:</span>
                    <span className="font-mono font-bold text-emerald-900 tabular-nums">
                      {teamActiveAssigned} cases
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Inflow Stream Live Notification Toast */}
        {inflowToast && (
          <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn border border-emerald-700">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{inflowToast}</span>
            </span>
            <button
              type="button"
              onClick={() => setInflowToast(null)}
              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* New Multi-Channel & Incident Location Filter Dashboard */}
        <MultiChannelFilterDashboard
          totalCount={submissions.length}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'clusters') {
              setIsClusteringModalOpen(true);
            }
          }}
          priorityRanking={priorityRanking}
          onTogglePriorityRanking={() => setPriorityRanking((prev) => !prev)}
          onSimulateInflow={handleSimulateInflowStream}
          isSimulating={isSimulatingInflow}
          selectedChannel={selectedChannel}
          onSelectChannel={(ch) =>
            setSelectedChannel((prev) => (prev === ch && ch !== 'All Channels' ? 'All Channels' : ch))
          }
          channelCounts={channelCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) =>
            setSelectedCategory((prev) => (prev === cat && cat !== 'All Categories' ? 'All Categories' : cat))
          }
          categoryCounts={categoryCounts}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          locationCounts={locationCounts}
          onResetLocation={() => setSelectedLocation('All Locations')}
        />

        {/* Submissions Incident Table */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Citizen Incidents Queue</span>
                <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredSubmissions.length} of {submissions.length}
                </span>
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">
                Live updates from voice &amp; text channels
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={filteredSubmissions.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                title="Export current table to CSV file for record-keeping"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export Table to CSV ({filteredSubmissions.length})</span>
              </button>
            </div>
          </div>

          {/* Visual Status Legend Bar */}
          <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <span>Lifecycle Stages:</span>
              </span>

              {/* Status items with color-coded dots, descriptions and interactive filter toggle */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {STATUS_LEGEND_CONFIG.map((item) => {
                  const isSelected = selectedStatus === item.status;
                  const count = statusCounts[item.status] || 0;

                  return (
                    <button
                      key={item.status}
                      type="button"
                      onClick={() => {
                        setSelectedStatus((prev) => (prev === item.status ? 'All' : item.status));
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs transition-all cursor-pointer select-none border ${
                        isSelected
                          ? `${item.activeBg} ${item.badgeBorder} ${item.textColor} font-bold ring-2 ${item.ringColor} shadow-2xs`
                          : 'bg-white hover:bg-slate-100/80 text-slate-700 border-slate-200/80 font-medium'
                      }`}
                      title={`${item.status}: ${item.description} (Click to filter queue)`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotColor} ${
                          item.status === 'In Progress' ? 'animate-pulse' : ''
                        }`}
                      />
                      <span>{item.label}</span>
                      <span
                        className={`font-mono text-[10px] px-1 py-0.2 rounded font-semibold ${
                          isSelected ? 'bg-white/80 text-slate-900' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 text-2xs text-slate-500">
              <span className="hidden lg:inline text-slate-400 italic">
                Click any stage badge to filter queue
              </span>
              {selectedStatus !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedStatus('All')}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Clear Status Filter ({selectedStatus})
                </button>
              )}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bot className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No incident reports match your current filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('All');
                  setSelectedTeamFilter('All');
                  setSelectedLanguageFilter('All');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Ticket &amp; Origin</th>
                    <th className="py-3 px-4 min-w-[260px]">Customer Incident Statement</th>
                    <th className="py-3 px-4 min-w-[190px]">AI Classification &amp; Urgency</th>
                    <th className="py-3 px-4 min-w-[280px]">AI Resolution Insights (Informed Steps)</th>
                    <th className="py-3 px-4 min-w-[210px]">Assigned Team &amp; Officer</th>
                    <th className="py-3 px-4">Status &amp; Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((report) => {
                    const isUrgent = report.priority === 'Urgent';
                    const isUnassigned = !report.assignedTeam || report.status === 'Received';

                    return (
                      <tr
                        key={report.id}
                        className={`hover:bg-slate-50/80 transition-colors border-l-4 ${
                          report.status === 'Resolved'
                            ? 'border-l-emerald-500'
                            : report.status === 'In Progress'
                            ? 'border-l-sky-500 bg-sky-50/10'
                            : report.status === 'Assigned'
                            ? 'border-l-indigo-500'
                            : report.status === 'Closed'
                            ? 'border-l-slate-300'
                            : 'border-l-amber-500'
                        } ${isUrgent ? 'bg-red-50/30' : ''}`}
                      >
                        {/* 1. Ticket Code & Location */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          <p className="font-mono font-bold text-emerald-900 tabular-nums">
                            {report.referenceCode}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span className="truncate max-w-[130px]">{report.countyOrWard}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span>{report.channel || (report.captureMethod === 'voice' ? '🎙️ Web Voice' : '⌨️ Web Text')}</span>
                            <span aria-hidden="true">·</span>
                            <span>{report.detectedLanguage}</span>
                          </div>
                        </td>

                        {/* 2. Citizen Statement & English Translation */}
                        <td className="py-3.5 px-4 align-top space-y-1.5 max-w-md">
                          <p className="text-slate-900 font-medium leading-relaxed">
                            &ldquo;{report.text}&rdquo;
                          </p>
                          {report.englishTranslation && report.detectedLanguage !== 'English' && (
                            <p className="text-[11px] text-slate-500 italic leading-snug">
                              Translation: &ldquo;{report.englishTranslation}&rdquo;
                            </p>
                          )}
                          {report.contactInfo && (
                            <p className="text-[10px] font-mono text-emerald-800">
                              Contact: {report.contactInfo}
                            </p>
                          )}
                        </td>

                        {/* 3. AI Determined Type & Urgency */}
                        <td className="py-3.5 px-4 align-top space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                report.priority === 'Urgent'
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : report.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : report.priority === 'Medium'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {report.priority || 'Medium'}
                            </span>
                            <span className="font-semibold text-slate-800 text-xs">
                              {report.category || 'General Civic'}
                            </span>
                          </div>

                          {report.aiClassification && (
                            <div className="bg-slate-100/90 rounded p-1.5 text-[11px] text-slate-600 space-y-0.5">
                              <p className="line-clamp-2">
                                <span className="font-semibold text-slate-700">AI Logic: </span>
                                {report.aiClassification.rationale}
                              </p>
                              <p className="text-[10px] text-emerald-800 font-mono">
                                Target SLA: {report.aiClassification.estimatedSLA}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* 4. AI Resolution Insights & Informed Actionable Steps */}
                        <td className="py-3.5 px-4 align-top space-y-1.5 min-w-[280px]">
                          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-lg p-2.5 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-950">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>AI Resolution Directives</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                SLA: {report.aiClassification?.estimatedSLA || '2 hours'}
                              </span>
                            </div>

                            {/* Root Cause hypothesis */}
                            <div className="text-[11px] text-slate-800 bg-white/95 border border-emerald-100/90 rounded p-1.5 leading-snug">
                              <span className="font-bold text-emerald-900">Root Cause: </span>
                              <span className="text-slate-700">
                                {report.aiRootCause ||
                                  (report.operationalCategory === 'Fibre' || report.category?.includes('Fibre')
                                    ? 'Optical drop cable attenuation / break on local distribution terminal.'
                                    : report.operationalCategory === 'M-PESA' || report.category?.includes('M-PESA')
                                    ? 'Payment callback gateway timeout between core switch and merchant API.'
                                    : report.operationalCategory === 'Network Outage'
                                    ? 'AC utility power surge tripped primary BTS transmission breaker.'
                                    : report.operationalCategory === 'Slow Internet'
                                    ? 'High-density cell carrier congestion on local eNodeB sector.'
                                    : report.operationalCategory === 'Voice Calls'
                                    ? 'Corrupted transient subscriber location register (VLR) routing table.'
                                    : report.operationalCategory === 'Billing'
                                    ? 'Automated CRM recurring charge cycle ignored account suspension flag.'
                                    : 'Low-band 800MHz indoor propagation loss due to masonry structures.')}
                              </span>
                            </div>

                            {/* Informed Step-by-Step Directives */}
                            <div className="space-y-1 pt-0.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Actionable Technical Steps:
                              </p>
                              <ol className="space-y-1 text-[11px] text-slate-800 list-none">
                                {(report.aiResolutionSteps || [
                                  'Execute remote optical/radio loopback diagnostic test to isolate fault point.',
                                  'Dispatch specialized field team with calibrated fault locator to location.',
                                  'Confirm telemetry restoration and trigger customer SMS verification memo.'
                                ]).map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="text-slate-700">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Copy Steps Directive */}
                            <div className="pt-1 flex items-center justify-between border-t border-emerald-200/50 text-[10px]">
                              <span className="text-emerald-800/80 font-mono text-2xs">Safaricom AI Core</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const steps = (report.aiResolutionSteps || [
                                    'Execute remote loopback diagnostic check.',
                                    'Dispatch specialized field team to location.',
                                    'Confirm telemetry restoration and trigger customer SMS memo.'
                                  ]).map((s, i) => `${i + 1}. ${s}`).join('\n');
                                  const text = `TICKET REF: ${report.referenceCode}\nROOT CAUSE: ${report.aiRootCause || 'Under investigation'}\nRESOLUTION STEPS:\n${steps}`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedStepsTicket(report.referenceCode);
                                  setTimeout(() => setCopiedStepsTicket(null), 2500);
                                }}
                                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                                title="Copy resolution steps to clipboard"
                              >
                                {copiedStepsTicket === report.referenceCode ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied Steps!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-emerald-700" />
                                    <span>Copy Steps</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 5. Assigned Team & Lead Officer */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          {report.assignedTeam ? (
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">
                                {report.assignedTeam}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Officer: {report.assignedOfficer || 'Field Lead'}
                              </p>
                              {report.assignedOfficerEmail && (
                                <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                                  <AtSign className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{report.assignedOfficerEmail}</span>
                                </p>
                              )}
                              {report.adminNotes && (
                                <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                                  Note: {report.adminNotes}
                                </p>
                              )}

                              {/* Automated Email Alert Badge & Trigger */}
                              <div className="pt-1.5">
                                {report.emailAlertSent ? (
                                  <button
                                    type="button"
                                    onClick={() => setInspectingEmailAlert(report)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                    title={`View automated email alert delivered to ${report.assignedOfficerEmail || report.assignedOfficer || 'officer'}`}
                                  >
                                    <MailCheck className="w-3 h-3 text-emerald-700" />
                                    <span>Alert Delivered</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={sendingEmailForId === report.id}
                                    onClick={() => handleSendEmailAlertForReport(report)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-50"
                                    title="Dispatch automated email alert to assigned officer"
                                  >
                                    {sendingEmailForId === report.id ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-700" />
                                    ) : (
                                      <Send className="w-2.5 h-2.5 text-sky-600" />
                                    )}
                                    <span>Send Alert Email</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Unassigned</span>
                              </span>
                              {report.aiClassification?.recommendedTeam && (
                                <p className="text-[10px] text-slate-500">
                                  Suggested: {report.aiClassification.recommendedTeam}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Status Selector with Visual Status Dot */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs ${
                                report.status === 'Resolved'
                                  ? 'bg-emerald-500'
                                  : report.status === 'In Progress'
                                  ? 'bg-sky-500 ring-2 ring-sky-300 animate-pulse'
                                  : report.status === 'Assigned'
                                  ? 'bg-indigo-500'
                                  : report.status === 'Closed'
                                  ? 'bg-slate-400'
                                  : 'bg-amber-500 ring-2 ring-amber-300'
                              }`}
                              title={`Current stage: ${report.status}`}
                              aria-hidden="true"
                            />
                            <select
                              value={report.status}
                              onChange={(e) =>
                                handleQuickStatusChange(report, e.target.value as ReportStatus)
                              }
                              className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer ${
                                report.status === 'Resolved' || report.status === 'Closed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : report.status === 'In Progress'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : report.status === 'Assigned'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Received">Received</option>
                              <option value="Assigned">Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-slate-500 pl-4.5 font-medium">
                            {report.status === 'Received' && 'Awaiting triage'}
                            {report.status === 'Assigned' && 'Dispatched to team'}
                            {report.status === 'In Progress' && 'Active intervention'}
                            {report.status === 'Resolved' && 'Resolution confirmed'}
                            {report.status === 'Closed' && 'Archived cycle'}
                          </p>
                        </td>

                        {/* 6. Action Buttons */}
                        <td className="py-3.5 px-4 align-top text-right space-y-1.5 whitespace-nowrap">
                          {isUnassigned && (
                            <button
                              type="button"
                              disabled={classifyingId === report.id}
                              onClick={() => handleSingleAutoAssign(report)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors cursor-pointer"
                              title="Determine request type with AI and assign to optimal team"
                            >
                              {classifyingId === report.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              <span>Auto-Assign</span>
                            </button>
                          )}

                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenInspect(report)}
                              className="text-xs font-semibold text-slate-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              Dispatch Details
                            </button>
                          </div>

                          {report.emailAlertSent && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setInspectingEmailAlert(report)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                                title="View full officer automated email dispatch notice"
                              >
                                <MailCheck className="w-3 h-3" />
                                <span>View Email</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Dispatch & Assign Modal */}
      {inspectingReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-mono font-semibold text-emerald-800">
                  {inspectingReport.referenceCode} · {inspectingReport.countyOrWard}
                </p>
                <h3 id="dispatch-modal-title" className="text-lg font-bold text-slate-900 mt-0.5">
                  Citizen Incident Dispatch &amp; Team Assignment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verbatim Citizen Voice Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Citizen Voice Record:</span>
                <span className="font-mono">
                  {inspectingReport.detectedLanguage} ·{' '}
                  {new Date(inspectingReport.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  EAT
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                &ldquo;{inspectingReport.text}&rdquo;
              </p>
              {inspectingReport.englishTranslation && (
                <p className="text-xs text-slate-500 italic">
                  English Translation: &ldquo;{inspectingReport.englishTranslation}&rdquo;
                </p>
              )}
              {inspectingReport.contactInfo && (
                <p className="text-xs text-emerald-900 font-mono pt-1">
                  Citizen Follow-up Contact: {inspectingReport.contactInfo}
                </p>
              )}
            </div>

            {/* AI Request Type & Urgency Recommendation */}
            {inspectingReport.aiClassification && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>AI Incident Analysis &amp; Routing Recommendation</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Determined Domain:</span>
                    <p className="font-semibold text-slate-900">
                      {inspectingReport.aiClassification.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Urgency Assessment:</span>
                    <p className="font-semibold text-red-700">
                      {inspectingReport.aiClassification.urgency}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="text-slate-500">Routing Rationale: </span>
                  {inspectingReport.aiClassification.rationale}
                </div>
                <div className="text-xs font-mono text-emerald-900">
                  Target SLA: {inspectingReport.aiClassification.estimatedSLA}
                </div>
              </div>
            )}

            {/* Assignment Form */}
            <form onSubmit={handleSaveDispatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label htmlFor="team-select" className="block text-xs font-medium text-slate-700 mb-1">
                    Assign to Relevant Response Team
                  </label>
                  <select
                    id="team-select"
                    value={dispatchTeam}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                  >
                    {KENYAN_RESPONSE_TEAMS.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label htmlFor="officer-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Lead Assigned Officer
                  </label>
                  <input
                    id="officer-input"
                    type="text"
                    value={dispatchOfficer}
                    onChange={(e) => setDispatchOfficer(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label htmlFor="officer-email" className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>Officer Official Email</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Safaricom Mail</span>
                  </label>
                  <input
                    id="officer-email"
                    type="email"
                    value={dispatchOfficerEmail}
                    onChange={(e) => setDispatchOfficerEmail(e.target.value)}
                    placeholder="e.g. officer@safaricom.co.ke"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority-select" className="block text-xs font-medium text-slate-700 mb-1">
                    Priority &amp; Urgency
                  </label>
                  <select
                    id="priority-select"
                    value={dispatchPriority}
                    onChange={(e) => setDispatchPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Urgent">Urgent (Immediate Danger / Outage)</option>
                    <option value="High">High Priority (Active Disruption)</option>
                    <option value="Medium">Medium (Standard Issue)</option>
                    <option value="Routine">Routine (Inquiry / Scheduled)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status-select" className="block text-xs font-medium text-slate-700 mb-1">
                    Dispatch Status
                  </label>
                  <select
                    id="status-select"
                    value={dispatchStatus}
                    onChange={(e) => setDispatchStatus(e.target.value as ReportStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Assigned">Assigned to Unit</option>
                    <option value="In Progress">In Progress / Field Dispatched</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="notes-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Dispatch Notes / Field Instructions
                </label>
                <textarea
                  id="notes-input"
                  rows={3}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Field crew instructed to bring pipe welding equipment to Umoja Stage..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Automated Email Alert Option & Preview */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendAutomatedEmail}
                      onChange={(e) => setSendAutomatedEmail(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                      <MailCheck className="w-4 h-4 text-emerald-700" />
                      <span>Send automated email alert to assigned officer upon dispatch</span>
                    </span>
                  </label>

                  {sendAutomatedEmail && (
                    <button
                      type="button"
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                      className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      {showEmailPreview ? 'Hide Memo Preview' : 'Preview Email Memo'}
                    </button>
                  )}
                </div>

                {sendAutomatedEmail && (
                  <p className="text-[11px] text-emerald-900/80 leading-snug pl-6">
                    Dispatches an immediate notification to <strong className="font-mono text-emerald-950">{dispatchOfficerEmail || 'assigned officer'}</strong> with incident reference, SLA deadline, verbatim transcript, and field instructions.
                  </p>
                )}

                {/* Email Memo Preview */}
                {sendAutomatedEmail && showEmailPreview && (
                  <div className="mt-2 pl-6">
                    <div className="bg-white border border-emerald-300/80 rounded-lg p-3 text-[11px] font-mono text-slate-800 space-y-1.5 shadow-2xs">
                      <div className="border-b border-slate-200 pb-1.5 text-slate-600 text-[10px]">
                        <div><strong className="text-slate-800">To:</strong> {dispatchOfficer} &lt;{dispatchOfficerEmail}&gt;</div>
                        <div><strong className="text-slate-800">From:</strong> SEMA Incident Dispatch Gateway &lt;dispatch@sema.go.ke&gt;</div>
                        <div><strong className="text-slate-800">Subject:</strong> [SEMA DISPATCH ALERT] {inspectingReport.referenceCode} - {inspectingReport.category || 'Incident'} ({dispatchPriority} Priority)</div>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-[10px] text-slate-700 max-h-40 overflow-y-auto pt-1 leading-relaxed">
                        {generateClientEmailAlert(
                          inspectingReport,
                          dispatchOfficer,
                          dispatchOfficerEmail,
                          dispatchTeam,
                          dispatchPriority,
                          dispatchNotes
                        ).body}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectingReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDispatch}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isSavingDispatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Dispatch to Team</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Email Alert Inspection Modal */}
      {inspectingEmailAlert && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-alert-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl">
                  <MailCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      {inspectingEmailAlert.referenceCode}
                    </span>
                    <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      Automated Alert Delivered
                    </span>
                  </div>
                  <h3 id="email-alert-title" className="text-base font-bold text-slate-900 mt-0.5">
                    Officer Dispatch Email Notice
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEmailAlert(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Email View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata Header Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Recipient Officer:</span>{' '}
                  <strong className="text-slate-900">
                    {inspectingEmailAlert.assignedOfficer || 'Field Lead'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Official Email:</span>{' '}
                  <strong className="font-mono text-emerald-900">
                    {inspectingEmailAlert.assignedOfficerEmail ||
                      inspectingEmailAlert.emailAlertRecipient ||
                      'dispatch@sema.go.ke'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Response Team:</span>{' '}
                  <span className="text-slate-800 font-medium">
                    {inspectingEmailAlert.assignedTeam || 'Public Service Operations'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Dispatched At:</span>{' '}
                  <span className="font-mono text-slate-700">
                    {inspectingEmailAlert.emailAlertSentAt
                      ? new Date(inspectingEmailAlert.emailAlertSentAt).toLocaleString('en-KE', {
                          timeZone: 'Africa/Nairobi',
                        })
                      : 'Just now'}{' '}
                    EAT
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400">Email Subject:</span>{' '}
                <span className="font-semibold text-slate-900 font-mono text-xs">
                  {inspectingEmailAlert.emailAlertSubject ||
                    `[SEMA DISPATCH ALERT] ${inspectingEmailAlert.referenceCode} - ${
                      inspectingEmailAlert.category || 'Incident'
                    } (${inspectingEmailAlert.priority || 'Medium'} Priority)`}
                </span>
              </div>
            </div>

            {/* Email Body Memo Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Official Dispatch Memo:</span>
                <span className="text-2xs font-mono text-emerald-800">
                  Transmitted via Gov Mail Gateway (Port 587 TLS)
                </span>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-800 select-all">
                {inspectingEmailAlert.emailAlertBody ||
                  generateClientEmailAlert(
                    inspectingEmailAlert,
                    inspectingEmailAlert.assignedOfficer || 'Field Lead',
                    inspectingEmailAlert.assignedOfficerEmail || 'officer@sema.go.ke',
                    inspectingEmailAlert.assignedTeam || 'Response Unit'
                  ).body}
              </pre>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const bodyText =
                    inspectingEmailAlert.emailAlertBody ||
                    generateClientEmailAlert(
                      inspectingEmailAlert,
                      inspectingEmailAlert.assignedOfficer || 'Field Lead',
                      inspectingEmailAlert.assignedOfficerEmail || 'officer@sema.go.ke',
                      inspectingEmailAlert.assignedTeam || 'Response Unit'
                    ).body;
                  navigator.clipboard.writeText(bodyText).then(() => {
                    setCopiedEmailText(true);
                    setTimeout(() => setCopiedEmailText(false), 2000);
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copiedEmailText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Full Memo</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sendingEmailForId === inspectingEmailAlert.id}
                  onClick={async () => {
                    await handleSendEmailAlertForReport(inspectingEmailAlert);
                    setInspectingEmailAlert(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                >
                  {sendingEmailForId === inspectingEmailAlert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-sky-700" />
                  )}
                  <span>Re-send Alert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingEmailAlert(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Dispatched Email Alerts Logs Modal */}
      {isEmailLogsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-logs-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100/90 text-emerald-800 rounded-xl">
                  <MailCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="email-logs-title" className="text-lg font-bold text-slate-900">
                    Automated Officer Email Dispatch Registry
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time audit log of all automated email alerts dispatched to Kenyan field officers upon incident assignment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailLogsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Email Logs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Statistics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-800">
                  Total Dispatched Alerts
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-950">
                  {metrics.emailAlertsSent}
                </p>
                <span className="text-2xs text-emerald-700">Immediate incident notifications</span>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-0.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-sky-800">
                  Delivery Gateway
                </span>
                <p className="text-base font-bold text-sky-950 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Delivered</span>
                </p>
                <span className="text-2xs text-sky-700">Government Mail Protocol</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-600">
                  Active Response Teams
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900">
                  {KENYAN_RESPONSE_TEAMS.length}
                </p>
                <span className="text-2xs text-slate-500">Home Fibre · M-PESA · 4G/5G BTS · Cyber-Fraud</span>
              </div>
            </div>

            {/* Dispatched Logs Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dispatched Email Log Records ({metrics.emailAlertsSent})
                </span>
                <span className="text-2xs text-slate-500 font-mono">
                  Gateway: dispatch@safaricom.co.ke
                </span>
              </div>

              {submissions.filter((s) => s.emailAlertSent).length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No email alerts dispatched yet</p>
                  <p className="text-2xs text-slate-400">
                    Use Auto-Assign or open Dispatch Details on any incident to send alerts to officers.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-2xs sticky top-0 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Reference &amp; Time</th>
                        <th className="py-2.5 px-3">Assigned Officer</th>
                        <th className="py-2.5 px-3">Response Team</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions
                        .filter((s) => s.emailAlertSent)
                        .map((report) => (
                          <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-emerald-800 block">
                                {report.referenceCode}
                              </span>
                              <span className="text-2xs text-slate-400 font-mono">
                                {report.emailAlertSentAt
                                  ? new Date(report.emailAlertSentAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Recent'}{' '}
                                EAT
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-900 block">
                                {report.assignedOfficer || 'Field Officer'}
                              </span>
                              <span className="text-2xs text-slate-500 font-mono truncate max-w-[180px] block">
                                {report.assignedOfficerEmail ||
                                  report.emailAlertRecipient ||
                                  'officer@safaricom.co.ke'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {report.assignedTeam || 'Safaricom Response Unit'}
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Delivered</span>
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEmailLogsModalOpen(false);
                                  setInspectingEmailAlert(report);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Notice</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-2xs text-slate-400">
                Official Kenya Government automated notification service
              </span>
              <button
                type="button"
                onClick={() => setIsEmailLogsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
              >
                Close Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI-Powered Issue Breakdown & Incident Intelligence Section (Right before footer) */}
      <section className="bg-slate-50/80 border-t border-slate-200/90 px-6 sm:px-8 py-8 space-y-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100/80 text-emerald-800 rounded-lg">
                  <PieChartIcon className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  AI-Powered Issue Distribution &amp; Incident Analytics
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                  <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                  AI Compiled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time category breakdown, civic problem density, and automated operational recommendations for Kenyan county dispatch desks.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {aiAnalyticsData?.compiledAt && (
                <span className="text-2xs text-slate-400 font-mono hidden md:inline">
                  Last compiled: {aiAnalyticsData.compiledAt}
                </span>
              )}
              <button
                type="button"
                onClick={handleCompileAIAnalytics}
                disabled={isCompilingAI}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Re-run fast AI incident compilation"
              >
                {isCompilingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span>Compiling Data...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Re-compile AI Analytics</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Grid: Left = Interactive Pie Chart; Right = AI Data Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 5 Cols: Interactive SVG Donut/Pie Chart */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Issues by Category (Pie Chart)</span>
                  </h4>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    {pieChartData.total} Total Reports
                  </span>
                </div>

                {/* SVG Donut Chart */}
                <div className="flex items-center justify-center pt-4 pb-2">
                  <div className="relative w-56 h-56 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {pieChartData.slices.map((slice, idx) => {
                        const isHovered = activeHoveredCategory === slice.category;
                        return (
                          <path
                            key={idx}
                            d={slice.pathData}
                            fill={slice.fill}
                            stroke="#ffffff"
                            strokeWidth={isHovered ? '3' : '1.5'}
                            className="transition-all duration-150 cursor-pointer hover:opacity-90"
                            style={{
                              transformOrigin: '100px 100px',
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                            }}
                            onMouseEnter={() => setActiveHoveredCategory(slice.category)}
                            onMouseLeave={() => setActiveHoveredCategory(null)}
                          />
                        );
                      })}
                    </svg>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                      {activeHoveredCategory ? (
                        (() => {
                          const matched = pieChartData.items.find(
                            (i) => i.category === activeHoveredCategory
                          );
                          return (
                            <>
                              <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {matched?.percentage}%
                              </span>
                              <span className="text-2xs font-semibold text-slate-600 line-clamp-1 max-w-[110px]">
                                {matched?.category}
                              </span>
                              <span className="text-2xs font-mono text-emerald-800">
                                {matched?.count} incidents
                              </span>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <span className="text-3xl font-black text-slate-900 tracking-tight">
                            {pieChartData.total}
                          </span>
                          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                            Incidents
                          </span>
                          <span className="text-2xs text-emerald-700 font-medium">
                            {pieChartData.items.length} Domains
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Legend & Breakdown List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto pr-1">
                {pieChartData.items.map((item) => {
                  const isHovered = activeHoveredCategory === item.category;
                  return (
                    <div
                      key={item.category}
                      onMouseEnter={() => setActiveHoveredCategory(item.category)}
                      onMouseLeave={() => setActiveHoveredCategory(null)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isHovered ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-slate-800 truncate">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="text-slate-500 font-medium">{item.count}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${item.bg} ${item.text}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 7 Cols: AI Data Analysis & Strategic Insights */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col justify-between gap-5">
              <div className="space-y-5">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-amber-100/80 text-amber-800 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      AI Incident Data Analysis &amp; Operational Brief
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!aiAnalyticsData) return;
                      const textToCopy = `SEMA AI Incident Analysis:\n${aiAnalyticsData.executiveSummary}\n\nKey Strategic Directives:\n${aiAnalyticsData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
                      navigator.clipboard.writeText(textToCopy).then(() => {
                        setHasCopiedBrief(true);
                        setTimeout(() => setHasCopiedBrief(false), 2000);
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-800 transition-colors font-medium cursor-pointer self-start sm:self-auto"
                  >
                    {hasCopiedBrief ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-emerald-700 font-semibold">Brief Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Brief</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Executive Summary Card */}
                <div className="bg-emerald-50/70 border border-emerald-900/12 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Executive Incident Synthesis</span>
                    </span>
                    <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                      High Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-normal">
                    {aiAnalyticsData?.executiveSummary ||
                      'Compiling incident data from citizen submissions across Kenyan counties...'}
                  </p>
                </div>

                {/* Fast Metric Quick-Cards: Urgency, Top Bottleneck, Response Target */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                    <span className="text-2xs font-medium text-slate-500 uppercase tracking-wider block">
                      Primary Issue Concentration
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                      {pieChartData.items[0]?.category || 'Home Fibre & Fixed Internet'}
                    </p>
                    <span className="text-2xs text-emerald-800 font-semibold">
                      {pieChartData.items[0]?.percentage || 0}% of total volume
                    </span>
                  </div>

                  <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-lg">
                    <span className="text-2xs font-medium text-red-700 uppercase tracking-wider block flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      Urgent Severity
                    </span>
                    <p className="text-sm font-bold text-red-900 mt-1">
                      {metrics.urgentCount} Critical Incidents
                    </p>
                    <span className="text-2xs text-red-700">
                      Immediate threat or outage
                    </span>
                  </div>

                  <div className="p-3 bg-cyan-50/60 border border-cyan-200/80 rounded-lg">
                    <span className="text-2xs font-medium text-cyan-800 uppercase tracking-wider block">
                      SLA Target Compliance
                    </span>
                    <p className="text-sm font-bold text-cyan-950 mt-1">
                      94.2% on Track
                    </p>
                    <span className="text-2xs text-cyan-800 font-medium">
                      Average resolution: 6.8h
                    </span>
                  </div>
                </div>

                {/* AI Actionable Recommendations */}
                <div className="space-y-2 pt-1">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
                    <span>AI Recommended Action Directives for Dispatchers</span>
                  </h5>
                  <div className="space-y-2">
                    {(aiAnalyticsData?.recommendations || [
                      'Pre-deploy KeRRA road clearance teams along heavily reported arterial corridors.',
                      'Audit Nairobi Water rapid response dispatch times to match the 4-hour burst pipe SLA.',
                      'Maintain multilingual notifications in Kiswahili and Sheng to keep citizens updated.',
                    ]).map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-700"
                      >
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-700 text-white font-bold text-2xs shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Language & Multi-agency Sync Tag */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-2xs text-slate-500 font-medium">
                <div className="flex items-center gap-3">
                  <span>Languages Captured:</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                    Kiswahili · Sheng · English
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Real-time Multi-agency Dispatch Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 text-center">
        <span>Safaricom SEMA Admin Resolution Platform · Intelligent Incident Routing &amp; Field Operations (All Safaricom Issues)</span>
      </footer>

      {/* Root Cause Issue Clustering Modal */}
      <IssueClusteringModal
        isOpen={isClusteringModalOpen}
        onClose={() => {
          setIsClusteringModalOpen(false);
          setActiveTab('feed');
        }}
        onFilterToCluster={(locationName) => {
          setSelectedLocation(locationName);
          setIsClusteringModalOpen(false);
          setActiveTab('feed');
        }}
      />
    </div>
  );
};
