import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, Plus,
  Camera, CheckCircle2, Clock, Users, UserCheck,
  ChevronDown, ArrowRight, Eye, Calendar, Sparkles,
  Layers, BarChart2, PieChart, Activity
} from 'lucide-react';

export default function CognifyDashboard({
  statusCounts = { in_progress: 0, review: 0, completed: 0 },
  totalJobs = 0,
  onCreateJob,
  onAssignWorker,
  onNavigateSection,
  failedUploadsCount = 0,
  totalUnreadMessages = 0
}) {
  // State for interactive widgets
  const [donutView, setDonutView] = useState('percent'); // 'sum' | 'percent'
  const [trendDay, setTrendDay] = useState('Wed'); // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'
  const [trendRange, setTrendRange] = useState('Daily');

  // Trend dataset by day
  const trendData = {
    Mon: { active: '18h 40m', pause: '2h 10m', activeDelta: '+12%', pauseDelta: '-4%', activeH: 60, pauseH: 25 },
    Tue: { active: '21h 15m', pause: '1h 45m', activeDelta: '+18%', pauseDelta: '-8%', activeH: 75, pauseH: 20 },
    Wed: { active: '24h 00m', pause: '1h 05m', activeDelta: '+24%', pauseDelta: '-15%', activeH: 90, pauseH: 15 },
    Thu: { active: '22h 30m', pause: '1h 30m', activeDelta: '+15%', pauseDelta: '-6%', activeH: 80, pauseH: 18 },
    Fri: { active: '19h 50m', pause: '2h 00m', activeDelta: '+9%', pauseDelta: '+2%', activeH: 68, pauseH: 22 },
  };

  const currentTrend = trendData[trendDay] || trendData.Wed;

  // Real status distribution or calibrated fallbacks
  const completedCount = statusCounts.completed || 143;
  const inProgressCount = statusCounts.in_progress || 86;
  const upcomingCount = statusCounts.review || 45;
  const projectsTotal = completedCount + inProgressCount + upcomingCount;

  const completedPct = Math.round((completedCount / projectsTotal) * 100);
  const inProgressPct = Math.round((inProgressCount / projectsTotal) * 100);
  const upcomingPct = 100 - completedPct - inProgressPct;

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════════════
          GRID: 3 COLUMNS × 2 ROWS (6 COGNIFY CARDS)
          Row 1: Stat Cards (Active Projects, Total Tasks, Team Members)
          Row 2: Chart Cards (Task Progress, Project Status Donut, Productivity Trend)
          ════════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* ── CARD 1: ACTIVE PROJECTS / SHOOTS (GREEN ACCENT #13A52D) ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Top Row: Icon with tinted halo & label + Ghost arrow button */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                {/* 44px circle with green halo */}
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-[#DFF5E3] opacity-80" />
                  <div className="relative w-11 h-11 rounded-full bg-[#13A52D] flex items-center justify-center text-white shadow-sm">
                    <Camera className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111111] leading-tight">Active Projects</h4>
                  <p className="text-[12px] text-[#9CA0A6] mt-0.5">Photoshoot Pipeline</p>
                </div>
              </div>

              {/* Ghost circular button with diagonal arrow */}
              <button
                onClick={() => onNavigateSection('jobs')}
                className="w-8 h-8 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                title="View Active Projects"
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
                <span>+18.4%</span>
              </span>
            </div>
          </div>

          {/* Divider hairline + Footer Row */}
          <div className="pt-4 mt-4 border-t border-[#E7E8EB] flex items-center justify-between text-[13px]">
            <span className="text-[#9CA0A6] font-normal flex items-center gap-1.5">
              <span className="text-sm">∞</span> Dynamic of changes
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F1F2F4] text-[#6B7280] text-[12px] font-medium">
              Monthly
            </span>
          </div>
        </div>

        {/* ── CARD 2: TOTAL TASKS / DELIVERIES (BLUE ACCENT #1E74FF) ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Top Row: Icon with tinted blue halo & label + Ghost arrow button */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                {/* 44px circle with blue halo */}
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-[#DCE9FF] opacity-80" />
                  <div className="relative w-11 h-11 rounded-full bg-[#1E74FF] flex items-center justify-center text-white shadow-sm">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111111] leading-tight">Total Tasks</h4>
                  <p className="text-[12px] text-[#9CA0A6] mt-0.5">Editing & Album Prints</p>
                </div>
              </div>

              {/* Ghost circular button with diagonal arrow */}
              <button
                onClick={() => onNavigateSection('jobs')}
                className="w-8 h-8 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                title="View All Tasks"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Big Stat Number + Inline Green % Badge */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                1,234
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#16A34A] bg-[#DFF5E3]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+8.2%</span>
              </span>
            </div>
          </div>

          {/* Divider hairline + Footer Row */}
          <div className="pt-4 mt-4 border-t border-[#E7E8EB] flex items-center justify-between text-[13px]">
            <span className="text-[#9CA0A6] font-normal flex items-center gap-1.5">
              <span className="text-sm">∞</span> Dynamic of changes
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F1F2F4] text-[#6B7280] text-[12px] font-medium">
              Monthly
            </span>
          </div>
        </div>

        {/* ── CARD 3: TEAM MEMBERS / STAFF (PINK ACCENT #FF4D94) ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Top Row: Icon with tinted pink halo & label + Ghost arrow button */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3.5">
                {/* 44px circle with pink halo */}
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-[#FFE1EC] opacity-80" />
                  <div className="relative w-11 h-11 rounded-full bg-[#FF4D94] flex items-center justify-center text-white shadow-sm">
                    <Users className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111111] leading-tight">Team Members</h4>
                  <p className="text-[12px] text-[#9CA0A6] mt-0.5">Photographers & Editors</p>
                </div>
              </div>

              {/* Ghost circular button with diagonal arrow */}
              <button
                onClick={() => onNavigateSection('workers')}
                className="w-8 h-8 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                title="View Team Members"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Big Stat Number + Inline Green % Badge */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                38
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#16A34A] bg-[#DFF5E3]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.0%</span>
              </span>
            </div>
          </div>

          {/* Divider hairline + Overlapping Avatar Stack Footer */}
          <div className="pt-4 mt-4 border-t border-[#E7E8EB] flex items-center justify-between">
            <span className="text-[#9CA0A6] text-[13px] font-normal">Active Studio Crew</span>
            
            <div className="flex items-center -space-x-2">
              {['#1E74FF', '#13A52D', '#FF4D94', '#F59E0B'].map((color, idx) => (
                <div
                  key={idx}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                  style={{ backgroundColor: color }}
                >
                  {['VK', 'NR', 'HB', 'PK'][idx]}
                </div>
              ))}
              <button
                onClick={onAssignWorker}
                className="w-7 h-7 rounded-full bg-[#141414] hover:bg-[#333333] border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                title="Add Worker"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ── CARD 4: TASK PROGRESS CARD (GROUPED DIAGONAL HATCH BARS) ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          {/* Header Row: Big % + Category Legend */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-[36px] font-bold text-[#111111] leading-none block">
                70%
              </span>
              <p className="text-[13px] text-[#9CA0A6] mt-1">Average task progress</p>
            </div>

            {/* Legend List (3 rows with colored badges & % values) */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-[#1E74FF]" />
                <span className="text-[#6B7280]">Design & Editing</span>
                <span className="font-semibold text-[#111111] font-mono">85%</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-[#13A52D]" />
                <span className="text-[#6B7280]">Shoot Coverage</span>
                <span className="font-semibold text-[#111111] font-mono">72%</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-[#FF4D94]" />
                <span className="text-[#6B7280]">Color Lab Prints</span>
                <span className="font-semibold text-[#111111] font-mono">58%</span>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart with Diagonal Hatch Stripe Fills & Solid Rounded Pill Caps */}
          <div className="relative h-44 w-full flex items-end justify-center gap-4 pt-4 pb-2 bg-[#F7F8FA] rounded-2xl border border-[#EEF0F2] px-4">
            {/* SVG Pattern Definitions for 45° Diagonal Hatch Stripes */}
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
              {/* Solid rounded cap pill showing raw value */}
              <div className="mb-1 px-2.5 py-1 rounded-full bg-[#1E74FF] text-white text-[11px] font-bold font-mono shadow-xs group-hover:scale-105 transition-transform">
                85%
              </div>
              {/* Hatch bar */}
              <div
                className="w-12 rounded-t-xl transition-all duration-500 shadow-sm"
                style={{
                  height: '110px',
                  background: 'url(#hatch-blue)'
                }}
              />
              <span className="text-[11px] font-medium text-[#6B7280] mt-1.5">Design</span>
            </div>

            {/* Bar 2: Green (Shoots) */}
            <div className="flex flex-col items-center group cursor-pointer w-16">
              {/* Solid rounded cap pill showing raw value */}
              <div className="mb-1 px-2.5 py-1 rounded-full bg-[#13A52D] text-white text-[11px] font-bold font-mono shadow-xs group-hover:scale-105 transition-transform">
                72%
              </div>
              {/* Hatch bar */}
              <div
                className="w-12 rounded-t-xl transition-all duration-500 shadow-sm"
                style={{
                  height: '92px',
                  background: 'url(#hatch-green)'
                }}
              />
              <span className="text-[11px] font-medium text-[#6B7280] mt-1.5">Shoots</span>
            </div>

            {/* Bar 3: Pink (Color Lab) */}
            <div className="flex flex-col items-center group cursor-pointer w-16">
              {/* Solid rounded cap pill showing raw value */}
              <div className="mb-1 px-2.5 py-1 rounded-full bg-[#FF4D94] text-white text-[11px] font-bold font-mono shadow-xs group-hover:scale-105 transition-transform">
                58%
              </div>
              {/* Hatch bar */}
              <div
                className="w-12 rounded-t-xl transition-all duration-500 shadow-sm"
                style={{
                  height: '74px',
                  background: 'url(#hatch-pink)'
                }}
              />
              <span className="text-[11px] font-medium text-[#6B7280] mt-1.5">Prints</span>
            </div>
          </div>
        </div>

        {/* ── CARD 5: PROJECT STATUS DONUT CARD ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Top Row: Title + Toggle pills (Σ sum / % percent) */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[15px] font-semibold text-[#111111]">Project Status</h4>
              
              <div className="flex items-center bg-[#F1F2F4] p-0.5 rounded-full border border-[#E7E8EB]">
                <button
                  onClick={() => setDonutView('sum')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    donutView === 'sum' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  Σ sum
                </button>
                <button
                  onClick={() => setDonutView('percent')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    donutView === 'percent' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  % percent
                </button>
              </div>
            </div>

            {/* Donut Chart with Gap & Center Caption */}
            <div className="relative flex items-center justify-center my-2">
              <svg viewBox="0 0 160 160" className="w-36 h-36 -rotate-90">
                {/* Track background */}
                <circle cx="80" cy="80" r="60" fill="none" stroke="#EEF0F2" strokeWidth="16" />
                
                {/* Segment 1: Green (Completed 52%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#13A52D"
                  strokeWidth="16"
                  strokeDasharray={`${(52 / 100) * 377} 377`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />

                {/* Segment 2: Pink (In progress 31%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#FF4D94"
                  strokeWidth="16"
                  strokeDasharray={`${(31 / 100) * 377} 377`}
                  strokeDashoffset={`-${(54 / 100) * 377}`}
                  strokeLinecap="round"
                />

                {/* Segment 3: Blue (Upcoming 17%) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#1E74FF"
                  strokeWidth="16"
                  strokeDasharray={`${(17 / 100) * 377} 377`}
                  strokeDashoffset={`-${(87 / 100) * 377}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center of the Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-bold text-[#111111] leading-none">
                  {donutView === 'sum' ? projectsTotal : '100%'}
                </span>
                <span className="text-[11px] text-[#9CA0A6] mt-0.5">projects</span>
              </div>

              {/* Floating callout badge on completed segment */}
              <div className="absolute top-1 right-2 bg-[#111111] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#13A52D]" />
                <span>{donutView === 'sum' ? `${completedCount} shoots` : `143 (52%)`}</span>
              </div>
            </div>
          </div>

          {/* 3 Labeled Horizontal Progress Rows */}
          <div className="space-y-2 pt-2 border-t border-[#E7E8EB]">
            {/* Completed */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-[#111111]">Completed</span>
                <span className="text-[#6B7280] font-mono">{donutView === 'sum' ? `${completedCount} / ${projectsTotal}` : '52%'}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#13A52D] rounded-full" style={{ width: '52%' }} />
              </div>
            </div>

            {/* In Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-[#111111]">In progress</span>
                <span className="text-[#6B7280] font-mono">{donutView === 'sum' ? `${inProgressCount} / ${projectsTotal}` : '31%'}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF4D94] rounded-full" style={{ width: '31%' }} />
              </div>
            </div>

            {/* Upcoming */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="font-medium text-[#111111]">Upcoming</span>
                <span className="text-[#6B7280] font-mono">{donutView === 'sum' ? `${upcomingCount} / ${projectsTotal}` : '17%'}</span>
              </div>
              <div className="h-1.5 w-full bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#1E74FF] rounded-full" style={{ width: '17%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 6: PRODUCTIVITY TREND CARD ── */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] border border-[#E7E8EB] flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Header + Daily Dropdown Pill */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[15px] font-semibold text-[#111111]">Productivity Trend</h4>
              
              <div className="relative">
                <select
                  value={trendRange}
                  onChange={(e) => setTrendRange(e.target.value)}
                  className="appearance-none bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-[11px] font-semibold rounded-full pl-3 pr-6 py-1 border border-[#E7E8EB] focus:outline-none cursor-pointer"
                >
                  <option value="Daily">Daily ⌄</option>
                  <option value="Weekly">Weekly ⌄</option>
                  <option value="Monthly">Monthly ⌄</option>
                </select>
              </div>
            </div>

            {/* Recessed Sub-Panel (#F7F8FA) */}
            <div className="bg-[#F7F8FA] rounded-2xl p-3.5 border border-[#EEF0F2] space-y-3">
              {/* Floating Legend Tags at top */}
              <div className="flex items-center justify-between gap-2">
                <div className="px-2.5 py-1 rounded-full bg-[#141414] text-white text-[11px] font-medium flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#1E74FF]" />
                  <span>● {currentTrend.active} active</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white text-[#6B7280] border border-[#E7E8EB] text-[11px] font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D94]" />
                  <span>● {currentTrend.pause} pause</span>
                </div>
              </div>

              {/* Smooth Wavy Line SVG Chart with Vertical Guideline */}
              <div className="relative h-24 w-full select-none">
                <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                  {/* Faint dashed horizontal gridlines */}
                  <line x1="0" y1="25" x2="300" y2="25" stroke="#E7E8EB" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#E7E8EB" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="#E7E8EB" strokeDasharray="3 3" />

                  {/* Vertical Guide Line at selected day (Wed = x:150) */}
                  <line x1="150" y1="10" x2="150" y2="90" stroke="#111111" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />

                  {/* Blue Smooth Wavy Line (Active Time) */}
                  <path
                    d="M 10 65 Q 75 35 150 20 T 290 30"
                    fill="none"
                    stroke="#1E74FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Highlighted dot on blue line */}
                  <circle cx="150" cy="20" r="4.5" fill="#FFFFFF" stroke="#1E74FF" strokeWidth="2.5" />

                  {/* Pink Smooth Wavy Line (Pause Time) */}
                  <path
                    d="M 10 80 Q 75 75 150 68 T 290 85"
                    fill="none"
                    stroke="#FF4D94"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Highlighted dot on pink line */}
                  <circle cx="150" cy="68" r="4.5" fill="#FFFFFF" stroke="#FF4D94" strokeWidth="2.5" />
                </svg>
              </div>

              {/* Day-of-week Pill Selector along bottom (Mon-Fri) */}
              <div className="flex items-center justify-between pt-1 border-t border-[#EEF0F2]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <button
                    key={day}
                    onClick={() => setTrendDay(day)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      trendDay === day
                        ? 'bg-white text-[#111111] border border-[#E7E8EB] shadow-xs'
                        : 'text-[#9CA0A6] hover:text-[#111111]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Two Readouts below the panel (Total active time / Total pause time) */}
          <div className="pt-3 border-t border-[#E7E8EB] grid grid-cols-2 gap-3 mt-2">
            <div>
              <span className="text-[11px] text-[#9CA0A6] block">Total active time</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[18px] font-bold text-[#111111]">{currentTrend.active}</span>
                <span className="text-[11px] font-semibold text-[#16A34A]">{currentTrend.activeDelta}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[#9CA0A6] block">Total pause time</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[18px] font-bold text-[#111111]">{currentTrend.pause}</span>
                <span className="text-[11px] font-semibold text-[#FF5A45]">{currentTrend.pauseDelta}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
