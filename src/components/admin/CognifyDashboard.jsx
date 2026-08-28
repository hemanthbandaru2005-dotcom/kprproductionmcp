import React, { useState } from 'react';
import {
  TrendingUp, ArrowUpRight,
  Camera, CheckCircle2, Clock, Users, UserCheck,
  CheckCircle, Activity
} from 'lucide-react';

export default function CognifyDashboard({
  statusCounts = { in_progress: 0, review: 0, completed: 0 },
  totalJobs = 0,
  allJobsList = [],
  workerCount = 0,
  workersList = [],
  clientCount = 0,
  onCreateJob,
  onAssignWorker,
  onNavigateSection,
  failedUploadsCount = 0,
  totalUnreadMessages = 0
}) {
  // State for interactive widgets
  const [donutView, setDonutView] = useState('percent'); // 'sum' | 'percent'

  // 100% Real Live Metric Calculations
  const completedCount = Number(statusCounts?.completed) || 0;
  const inProgressCount = Number(statusCounts?.in_progress) || 0;
  const upcomingCount = Number(statusCounts?.review) || 0;
  const projectsTotal = totalJobs !== undefined ? Number(totalJobs) : (completedCount + inProgressCount + upcomingCount);
  const activeShootsCount = inProgressCount + upcomingCount;

  // Real percentages (0 when empty)
  const completedPct = projectsTotal > 0 ? Math.round((completedCount / projectsTotal) * 100) : 0;
  const inProgressPct = projectsTotal > 0 ? Math.round((inProgressCount / projectsTotal) * 100) : 0;
  const upcomingPct = projectsTotal > 0 ? Math.max(0, 100 - completedPct - inProgressPct) : 0;

  // Real worker counts
  const actualWorkerCount = workerCount !== undefined ? Number(workerCount) : (workersList?.length || 0);

  // Category progress derived directly from live jobs
  const shootsJobs = (allJobsList || []).filter(j => {
    const st = (j.shoot_type || '').toLowerCase();
    return st.includes('shoot') || st.includes('wedding') || st.includes('photo') || st.includes('candid');
  });
  const designJobs = (allJobsList || []).filter(j => {
    const st = (j.shoot_type || '').toLowerCase();
    const notes = (j.notes || '').toLowerCase();
    return st.includes('edit') || st.includes('design') || notes.includes('edit') || notes.includes('video');
  });
  const printJobs = (allJobsList || []).filter(j => {
    const st = (j.shoot_type || '').toLowerCase();
    return st.includes('print') || st.includes('album') || st.includes('lab') || st.includes('color');
  });

  const getProg = (list) => {
    if (!list || list.length === 0) return projectsTotal > 0 ? completedPct : 0;
    const comp = list.filter(j => j.status === 'completed').length;
    return Math.round((comp / list.length) * 100);
  };

  const shootsProgress = shootsJobs.length > 0 ? getProg(shootsJobs) : (projectsTotal > 0 ? completedPct : 0);
  const designProgress = designJobs.length > 0 ? getProg(designJobs) : (projectsTotal > 0 ? completedPct : 0);
  const printProgress = printJobs.length > 0 ? getProg(printJobs) : (projectsTotal > 0 ? completedPct : 0);
  const overallProgress = completedPct;

  const handleNav = (e, section) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onNavigateSection) {
      onNavigateSection(section);
    }
  };

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════════════
          GRID: 3 COLUMNS × 2 ROWS (6 COGNIFY CARDS)
          Row 1: Stat Cards (Active Projects, Total Tasks, Team Members)
          Row 2: Chart Cards (Task Progress, Project Status Donut, Productivity Trend)
          ════════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* ── CARD 1: ACTIVE PROJECTS / SHOOTS (GREEN ACCENT #13A52D) ── */}
        <div
          onClick={(e) => handleNav(e, 'jobs')}
          className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group hover:border-[#13A52D]/40"
        >
          <div>
            {/* Top Row: Icon with tinted halo & label + Ghost arrow button */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-[#DFF5E3] opacity-80" />
                  <div className="relative w-11 h-11 rounded-full bg-[#13A52D] flex items-center justify-center text-white shadow-sm">
                    <Camera className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111111] leading-tight group-hover:text-[#13A52D] transition-colors">
                    Active Projects
                  </h4>
                  <p className="text-[12px] text-[#9CA0A6] mt-0.5">Photoshoot Pipeline</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleNav(e, 'jobs')}
                className="w-8 h-8 rounded-full bg-[#F1F2F4] group-hover:bg-[#DFF5E3] flex items-center justify-center text-[#6B7280] group-hover:text-[#13A52D] transition-colors cursor-pointer"
                title="View Active Projects"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Big Stat Number + Inline Green % Badge */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                {activeShootsCount}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#16A34A] bg-[#DFF5E3]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{projectsTotal > 0 ? `${completedPct}% done` : 'Live'}</span>
              </span>
            </div>
          </div>

          {/* Divider hairline + Footer Row */}
          <div className="pt-4 mt-4 border-t border-[#E7E8EB] flex items-center justify-between text-[13px]">
            <span className="text-[#9CA0A6] font-normal flex items-center gap-1.5">
              <span className="text-sm">●</span> {projectsTotal} Total Shoots
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F1F2F4] text-[#6B7280] text-[12px] font-medium">
              Real-time
            </span>
          </div>
        </div>

        {/* ── CARD 2: TOTAL TASKS / DELIVERIES (BLUE ACCENT #1E74FF) ── */}
        <div
          onClick={(e) => handleNav(e, 'jobs')}
          className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group hover:border-[#1E74FF]/40"
        >
          <div>
            {/* Top Row: Icon with tinted blue halo & label + Ghost arrow button */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-[#DCE9FF] opacity-80" />
                  <div className="relative w-11 h-11 rounded-full bg-[#1E74FF] flex items-center justify-center text-white shadow-sm">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111111] leading-tight group-hover:text-[#1E74FF] transition-colors">
                    Total Tasks
                  </h4>
                  <p className="text-[12px] text-[#9CA0A6] mt-0.5">Editing & Album Prints</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleNav(e, 'jobs')}
                className="w-8 h-8 rounded-full bg-[#F1F2F4] group-hover:bg-[#DCE9FF] flex items-center justify-center text-[#6B7280] group-hover:text-[#1E74FF] transition-colors cursor-pointer"
                title="View All Tasks"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Big Stat Number + Inline Green % Badge */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                {projectsTotal}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#16A34A] bg-[#DFF5E3]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{projectsTotal > 0 ? `${completedCount} completed` : '0 pending'}</span>
              </span>
            </div>
          </div>

          {/* Divider hairline + Footer Row */}
          <div className="pt-4 mt-4 border-t border-[#E7E8EB] flex items-center justify-between text-[13px]">
            <span className="text-[#9CA0A6] font-normal flex items-center gap-1.5">
              <span className="text-sm">●</span> {inProgressCount} in progress, {upcomingCount} review
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F1F2F4] text-[#6B7280] text-[12px] font-medium">
              Live tasks
            </span>
          </div>
        </div>

        {/* ── CARD 3: TEAM MEMBERS / STAFF (PINK ACCENT #FF4D94) ── */}
        <div
          onClick={(e) => handleNav(e, 'workers')}
          className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group hover:border-[#FF4D94]/40"
        >
          <div>
            {/* Top Row: Icon with tinted pink halo & label + Ghost arrow button */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-[#FFE1EC] opacity-80" />
                  <div className="relative w-11 h-11 rounded-full bg-[#FF4D94] flex items-center justify-center text-white shadow-sm">
                    <Users className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111111] leading-tight group-hover:text-[#FF4D94] transition-colors">
                    Team Members
                  </h4>
                  <p className="text-[12px] text-[#9CA0A6] mt-0.5">Photographers & Editors</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleNav(e, 'workers')}
                className="w-8 h-8 rounded-full bg-[#F1F2F4] group-hover:bg-[#FFE1EC] flex items-center justify-center text-[#6B7280] group-hover:text-[#FF4D94] transition-colors cursor-pointer"
                title="View Team Members"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Big Stat Number + Inline Green % Badge */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                {actualWorkerCount}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#16A34A] bg-[#DFF5E3]">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{actualWorkerCount > 0 ? 'Active Staff' : 'No staff yet'}</span>
              </span>
            </div>
          </div>

          {/* Divider hairline + Overlapping Avatar Stack Footer */}
          <div className="pt-4 mt-4 border-t border-[#E7E8EB] flex items-center justify-between">
            <span className="text-[#9CA0A6] text-[13px] font-normal">Active Studio Crew</span>
            
            <div className="flex items-center -space-x-2">
              {workersList && workersList.length > 0 ? (
                workersList.slice(0, 4).map((w, idx) => {
                  const initials = (w.full_name || w.name || w.email || 'W').substring(0, 2).toUpperCase();
                  const colors = ['#1E74FF', '#13A52D', '#FF4D94', '#F59E0B'];
                  return (
                    <div
                      key={w.id || idx}
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                      title={w.full_name || w.email}
                    >
                      {initials}
                    </div>
                  );
                })
              ) : (
                <span className="text-[11px] text-[#9CA0A6]">0 registered</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAssignWorker && onAssignWorker();
                }}
                className="w-7 h-7 rounded-full bg-[#141414] hover:bg-[#333333] border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                title="Add Worker"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ── CARD 4: TASK PROGRESS CARD (DYNAMIC HATCH BARS) ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          {/* Header Row: Big % + Category Legend */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-[36px] font-bold text-[#111111] leading-none block">
                {overallProgress}%
              </span>
              <p className="text-[13px] text-[#9CA0A6] mt-1">Average task progress</p>
            </div>

            {/* Legend List (3 rows with colored badges & % values) */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-[#1E74FF]" />
                <span className="text-[#6B7280]">Design & Editing</span>
                <span className="font-semibold text-[#111111] font-mono">{designProgress}%</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-[#13A52D]" />
                <span className="text-[#6B7280]">Shoot Coverage</span>
                <span className="font-semibold text-[#111111] font-mono">{shootsProgress}%</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-[#FF4D94]" />
                <span className="text-[#6B7280]">Color Lab Prints</span>
                <span className="font-semibold text-[#111111] font-mono">{printProgress}%</span>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart with Diagonal Hatch Stripe Fills & Solid Rounded Pill Caps */}
          <div className="relative h-44 w-full flex items-end justify-center gap-4 pt-4 pb-2 bg-[#F7F8FA] rounded-2xl border border-[#EEF0F2] px-4">
            <svg className="absolute w-0 h-0">
              <defs>
                <pattern id="hatch-blue" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#1E74FF" strokeWidth="4" />
                  <line x1="4" y1="0" x2="4" y2="8" stroke="#DCE9FF" strokeWidth="4" />
                </pattern>
                <pattern id="hatch-green" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#13A52D" strokeWidth="4" />
                  <line x1="4" y1="0" x2="4" y2="8" stroke="#DFF5E3" strokeWidth="4" />
                </pattern>
                <pattern id="hatch-pink" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#FF4D94" strokeWidth="4" />
                  <line x1="4" y1="0" x2="4" y2="8" stroke="#FFE1EC" strokeWidth="4" />
                </pattern>
              </defs>
            </svg>

            {/* Bar 1: Blue (Design) */}
            <div className="flex flex-col items-center group cursor-pointer w-16">
              <div className="mb-1 px-2.5 py-1 rounded-full bg-[#1E74FF] text-white text-[11px] font-bold font-mono shadow-xs group-hover:scale-105 transition-transform">
                {designProgress}%
              </div>
              <div
                className="w-12 rounded-t-xl transition-all duration-500 shadow-sm"
                style={{
                  height: `${Math.max(8, Math.round((designProgress / 100) * 110))}px`,
                  background: 'url(#hatch-blue)'
                }}
              />
              <span className="text-[11px] font-medium text-[#6B7280] mt-1.5">Design</span>
            </div>

            {/* Bar 2: Green (Shoots) */}
            <div className="flex flex-col items-center group cursor-pointer w-16">
              <div className="mb-1 px-2.5 py-1 rounded-full bg-[#13A52D] text-white text-[11px] font-bold font-mono shadow-xs group-hover:scale-105 transition-transform">
                {shootsProgress}%
              </div>
              <div
                className="w-12 rounded-t-xl transition-all duration-500 shadow-sm"
                style={{
                  height: `${Math.max(8, Math.round((shootsProgress / 100) * 110))}px`,
                  background: 'url(#hatch-green)'
                }}
              />
              <span className="text-[11px] font-medium text-[#6B7280] mt-1.5">Shoots</span>
            </div>

            {/* Bar 3: Pink (Color Lab) */}
            <div className="flex flex-col items-center group cursor-pointer w-16">
              <div className="mb-1 px-2.5 py-1 rounded-full bg-[#FF4D94] text-white text-[11px] font-bold font-mono shadow-xs group-hover:scale-105 transition-transform">
                {printProgress}%
              </div>
              <div
                className="w-12 rounded-t-xl transition-all duration-500 shadow-sm"
                style={{
                  height: `${Math.max(8, Math.round((printProgress / 100) * 110))}px`,
                  background: 'url(#hatch-pink)'
                }}
              />
              <span className="text-[11px] font-medium text-[#6B7280] mt-1.5">Prints</span>
            </div>
          </div>
        </div>

        {/* ── CARD 5: PROJECT STATUS DONUT CARD (LIVE RATIOS) ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Top Row: Title + Toggle pills (Σ sum / % percent) */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[15px] font-semibold text-[#111111]">Project Status</h4>
              
              <div className="flex items-center bg-[#F1F2F4] p-0.5 rounded-full border border-[#E7E8EB]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDonutView('sum');
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    donutView === 'sum' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  Σ sum
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDonutView('percent');
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    donutView === 'percent' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  % percent
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <svg viewBox="0 0 160 160" className="w-36 h-36 -rotate-90">
                {/* Track background */}
                <circle cx="80" cy="80" r="60" fill="none" stroke="#EEF0F2" strokeWidth="16" />
                
                {projectsTotal > 0 && completedPct > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#13A52D"
                    strokeWidth="16"
                    strokeDasharray={`${(completedPct / 100) * 377} 377`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                )}

                {projectsTotal > 0 && inProgressPct > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#FF4D94"
                    strokeWidth="16"
                    strokeDasharray={`${(inProgressPct / 100) * 377} 377`}
                    strokeDashoffset={`-${((completedPct + 2) / 100) * 377}`}
                    strokeLinecap="round"
                  />
                )}

                {projectsTotal > 0 && upcomingPct > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#1E74FF"
                    strokeWidth="16"
                    strokeDasharray={`${(upcomingPct / 100) * 377} 377`}
                    strokeDashoffset={`-${((completedPct + inProgressPct + 4) / 100) * 377}`}
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Center of the Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-bold text-[#111111] leading-none">
                  {donutView === 'sum' ? projectsTotal : (projectsTotal > 0 ? '100%' : '0%')}
                </span>
                <span className="text-[11px] text-[#9CA0A6] mt-0.5">projects</span>
              </div>

              {/* Floating callout badge */}
              <div className="absolute top-1 right-2 bg-[#111111] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#13A52D]" />
                <span>{donutView === 'sum' ? `${completedCount} completed` : `${completedPct}% completed`}</span>
              </div>
            </div>
          </div>

          {/* 3 Labeled Horizontal Progress Rows */}
          <div className="space-y-2 pt-2 border-t border-[#E7E8EB]">
            {/* Completed */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-[#111111]">Completed</span>
                <span className="text-[#6B7280] font-mono">{donutView === 'sum' ? `${completedCount} / ${projectsTotal}` : `${completedPct}%`}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#13A52D] rounded-full transition-all duration-500" style={{ width: `${completedPct}%` }} />
              </div>
            </div>

            {/* In Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-[#111111]">In progress</span>
                <span className="text-[#6B7280] font-mono">{donutView === 'sum' ? `${inProgressCount} / ${projectsTotal}` : `${inProgressPct}%`}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF4D94] rounded-full transition-all duration-500" style={{ width: `${inProgressPct}%` }} />
              </div>
            </div>

            {/* Upcoming / Review */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-[#111111]">Under Review / Upcoming</span>
                <span className="text-[#6B7280] font-mono">{donutView === 'sum' ? `${upcomingCount} / ${projectsTotal}` : `${upcomingPct}%`}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#1E74FF] rounded-full transition-all duration-500" style={{ width: `${upcomingPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 6: STUDIO ACTIVITY & COMMUNICATIONS OVERVIEW ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[15px] font-semibold text-[#111111]">Live Studio Operations</h4>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DFF5E3] text-[#16A34A] text-[11px] font-bold">
                Online
              </span>
            </div>

            {/* Recessed Sub-Panel (#F7F8FA) */}
            <div className="bg-[#F7F8FA] rounded-2xl p-4 border border-[#EEF0F2] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1E74FF]/10 flex items-center justify-center text-[#1E74FF]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111111] block">Active Shoots</span>
                    <span className="text-[11px] text-[#6B7280]">In pipeline right now</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#111111]">{activeShootsCount}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EEF0F2]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#13A52D]/10 flex items-center justify-center text-[#13A52D]">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111111] block">Delivery Rate</span>
                    <span className="text-[11px] text-[#6B7280]">Finished deliverables</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#13A52D]">{completedPct}%</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EEF0F2]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FF4D94]/10 flex items-center justify-center text-[#FF4D94]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111111] block">Unread Chats</span>
                    <span className="text-[11px] text-[#6B7280]">Client / Worker inquiries</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#111111]">{totalUnreadMessages}</span>
              </div>
            </div>
          </div>

          {/* Two Readouts below the panel */}
          <div className="pt-3 border-t border-[#E7E8EB] grid grid-cols-2 gap-3 mt-2">
            <div>
              <span className="text-[11px] text-[#9CA0A6] block">Client Accounts</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[18px] font-bold text-[#111111]">{clientCount}</span>
                <span className="text-[11px] font-semibold text-[#16A34A]">Active</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[#9CA0A6] block">Sync Health</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[18px] font-bold text-[#111111]">
                  {failedUploadsCount === 0 ? '100%' : `${failedUploadsCount} Alert`}
                </span>
                <span className={`text-[11px] font-semibold ${failedUploadsCount === 0 ? 'text-[#16A34A]' : 'text-[#FF5A45]'}`}>
                  {failedUploadsCount === 0 ? 'Optimal' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
