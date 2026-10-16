import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  SubmissionRecord,
  KENYAN_RESPONSE_TEAMS,
  PriorityLevel,
  ReportStatus,
  AIClassification,
} from '../types';

interface AdminDispatchConsoleProps {
  submissions: SubmissionRecord[];
  onUpdateSubmission: (updated: SubmissionRecord) => void;
  onRefreshSubmissions: () => Promise<void>;
  onSwitchToCitizenView: () => void;
}

export const AdminDispatchConsole: React.FC<AdminDispatchConsoleProps> = ({
  submissions,
  onUpdateSubmission,
  onRefreshSubmissions,
  onSwitchToCitizenView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('All');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');
  const [isAutoAssigningAll, setIsAutoAssigningAll] = useState(false);
  const [autoAssignSuccessMessage, setAutoAssignSuccessMessage] = useState<string | null>(null);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);

  // Selected report for detailed dispatch modal
  const [inspectingReport, setInspectingReport] = useState<SubmissionRecord | null>(null);
  const [dispatchTeam, setDispatchTeam] = useState<string>('');
  const [dispatchOfficer, setDispatchOfficer] = useState<string>('');
  const [dispatchPriority, setDispatchPriority] = useState<PriorityLevel>('Medium');
  const [dispatchStatus, setDispatchStatus] = useState<ReportStatus>('Assigned');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [isSavingDispatch, setIsSavingDispatch] = useState<boolean>(false);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = submissions.length;
    const unassigned = submissions.filter((s) => s.status === 'Received' || !s.assignedTeam).length;
    const inProgress = submissions.filter((s) => s.status === 'In Progress' || s.status === 'Assigned').length;
    const resolved = submissions.filter((s) => s.status === 'Resolved' || s.status === 'Closed').length;
    const urgentCount = submissions.filter((s) => s.priority === 'Urgent').length;
    return { total, unassigned, inProgress, resolved, urgentCount };
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        item.referenceCode.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        item.countyOrWard.toLowerCase().includes(q) ||
        (item.assignedTeam && item.assignedTeam.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

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
  }, [submissions, searchQuery, selectedStatus, selectedTeamFilter, selectedLanguageFilter]);

  // Open modal
  const handleOpenInspect = (report: SubmissionRecord) => {
    setInspectingReport(report);
    setDispatchTeam(report.assignedTeam || report.aiClassification?.recommendedTeam || KENYAN_RESPONSE_TEAMS[0].name);

    const initialTeam = KENYAN_RESPONSE_TEAMS.find(
      (t) => t.name === (report.assignedTeam || report.aiClassification?.recommendedTeam)
    );
    setDispatchOfficer(report.assignedOfficer || initialTeam?.leadOfficer || 'Field Desk Officer');
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
    }
  };

  // Save manual assignment
  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReport) return;
    setIsSavingDispatch(true);

    const updated: SubmissionRecord = {
      ...inspectingReport,
      assignedTeam: dispatchTeam,
      assignedOfficer: dispatchOfficer,
      priority: dispatchPriority,
      status: dispatchStatus,
      adminNotes: dispatchNotes,
      resolvedAt: dispatchStatus === 'Resolved' ? new Date().toISOString() : inspectingReport.resolvedAt,
    };

    try {
      const response = await fetch(`/api/submissions/${inspectingReport.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTeam: dispatchTeam,
          assignedOfficer: dispatchOfficer,
          priority: dispatchPriority,
          status: dispatchStatus,
          adminNotes: dispatchNotes,
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
    }
  };

  // Single AI Auto-Assign
  const handleSingleAutoAssign = async (report: SubmissionRecord) => {
    setClassifyingId(report.id);
    setAutoAssignSuccessMessage(null);

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

    const matchedTeam = KENYAN_RESPONSE_TEAMS.find(
      (t) => t.name === classification.recommendedTeam
    ) || KENYAN_RESPONSE_TEAMS[0];

    const updated: SubmissionRecord = {
      ...report,
      category: classification.category,
      priority: classification.urgency,
      assignedTeam: classification.recommendedTeam,
      assignedOfficer: matchedTeam.leadOfficer,
      status: 'Assigned',
      aiClassification: classification,
      adminNotes: `AI Auto-assigned: ${classification.rationale} (Target SLA: ${classification.estimatedSLA})`,
    };

    // Save
    try {
      await fetch(`/api/submissions/${report.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTeam: updated.assignedTeam,
          assignedOfficer: updated.assignedOfficer,
          priority: updated.priority,
          status: updated.status,
          adminNotes: updated.adminNotes,
        }),
      });
    } catch {
      // ignore
    }

    onUpdateSubmission(updated);
    setClassifyingId(null);
  };

  // Batch Auto-Assign All Unassigned with AI
  const handleBatchAutoAssignAll = async () => {
    setIsAutoAssigningAll(true);
    setAutoAssignSuccessMessage(null);

    try {
      const response = await fetch('/api/submissions/auto-assign-all', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.submissions && Array.isArray(data.submissions)) {
          data.submissions.forEach((s: SubmissionRecord) => onUpdateSubmission(s));
          setAutoAssignSuccessMessage(data.message || `AI classified and assigned all unassigned reports.`);
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
      let rationale = 'Routed based on citizen keyword analysis';

      if (/\b(stima|power|lights?|electricity|transformer|cheche)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-kplc')!;
        urgency = /\b(spark|fire|cheche|danger)\b/i.test(lower) ? 'Urgent' : 'High';
        sla = urgency === 'Urgent' ? '2 hours' : '6 hours';
        rationale = 'Electrical infrastructure failure requiring urgent isolation and repair.';
      } else if (/\b(maji|water|pipe|bomba|burst|sewer)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-water')!;
        urgency = /\b(burst|sewer|chafu)\b/i.test(lower) ? 'High' : 'Medium';
        sla = urgency === 'High' ? '4 hours' : '24 hours';
        rationale = 'Water supply loss or pipeline burst requiring maintenance response.';
      } else if (/\b(road|barabara|pothole|matatu|nduthi|matatu)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-roads')!;
        urgency = 'Medium';
        sla = '36 hours';
        rationale = 'Roadway impassability or drainage silt clearance.';
      } else if (/\b(security|usalama|police|wezi|thief)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-safety')!;
        urgency = 'Urgent';
        sla = '1 hour';
        rationale = 'Public security threat or night patrol requirement.';
      } else if (/\b(hospital|clinic|dawa|medicine|afya)\b/i.test(lower)) {
        bestTeam = KENYAN_RESPONSE_TEAMS.find((t) => t.id === 'team-health')!;
        urgency = 'High';
        sla = '8 hours';
        rationale = 'Public health clinic service inquiry.';
      }

      const updated: SubmissionRecord = {
        ...report,
        assignedTeam: bestTeam.name,
        assignedOfficer: bestTeam.leadOfficer,
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
      };

      onUpdateSubmission(updated);
      assignedCount++;
    });

    setAutoAssignSuccessMessage(
      `AI successfully analyzed, categorized, and auto-assigned ${assignedCount} citizen reports to relevant teams.`
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
              <span>Back to Citizen Portal</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                SEMA National Incident Dispatch Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        {/* 4-KPI Operations Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
            <span className="text-xs font-medium text-slate-500">Total Citizen Reports</span>
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
            <p className="text-[11px] text-slate-400">Ground units operating</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
            <span className="text-xs font-medium text-slate-500">Urgent Hazards</span>
            <p className="text-2xl font-bold font-mono tabular-nums text-red-600">
              {metrics.urgentCount}
            </p>
            <p className="text-[11px] text-red-500">Immediate public safety</p>
          </div>
        </div>

        {/* Teams Operational Load Strip */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Kenyan Municipal &amp; Rapid Response Teams
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              7 Units Connected · Real-time auto-assignment targets
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

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket code, voice text, county/ward, or team..."
                className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Quick Segmented Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Status:</span>
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="All">All Statuses ({submissions.length})</option>
                <option value="Unassigned">Unassigned ({metrics.unassigned})</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="All">All Teams</option>
                {KENYAN_RESPONSE_TEAMS.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedLanguageFilter}
                onChange={(e) => setSelectedLanguageFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="All">All Languages</option>
                <option value="English">English</option>
                <option value="Kiswahili">Kiswahili</option>
                <option value="Sheng">Sheng</option>
              </select>

              {(searchQuery || selectedStatus !== 'All' || selectedTeamFilter !== 'All' || selectedLanguageFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                    setSelectedTeamFilter('All');
                    setSelectedLanguageFilter('All');
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submissions Incident Table */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Citizen Incidents Queue ({filteredSubmissions.length} of {submissions.length})
            </h3>
            <span className="text-xs text-slate-500">
              Live updates from voice &amp; text channels
            </span>
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
                    <th className="py-3 px-4 min-w-[280px]">Citizen Voice Statement</th>
                    <th className="py-3 px-4 min-w-[200px]">AI Classification &amp; Urgency</th>
                    <th className="py-3 px-4 min-w-[220px]">Assigned Team &amp; Officer</th>
                    <th className="py-3 px-4">Status</th>
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
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isUrgent ? 'bg-red-50/30' : ''
                        }`}
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
                            <span>{report.captureMethod === 'voice' ? '🎙️ Voice' : '⌨️ Text'}</span>
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

                        {/* 4. Assigned Team & Lead Officer */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          {report.assignedTeam ? (
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">
                                {report.assignedTeam}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Officer: {report.assignedOfficer || 'Field Lead'}
                              </p>
                              {report.adminNotes && (
                                <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                                  Note: {report.adminNotes}
                                </p>
                              )}
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

                        {/* 5. Status Selector */}
                        <td className="py-3.5 px-4 align-top">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
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

                <div>
                  <label htmlFor="officer-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Lead Assigned Officer / Supervisor
                  </label>
                  <input
                    id="officer-input"
                    type="text"
                    value={dispatchOfficer}
                    onChange={(e) => setDispatchOfficer(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600"
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

      {/* Admin Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 text-center">
        <span>SEMA Kenya Administrative Operations · Multi-agency Citizen Incident Resolution</span>
      </footer>
    </div>
  );
};
