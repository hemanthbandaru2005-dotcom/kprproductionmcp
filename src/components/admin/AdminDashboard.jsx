import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import JobStatusTable from './JobStatusTable';
import CreateJobModal from './CreateJobModal';
import AssignWorkerModal from './AssignWorkerModal';
import WorkersPage from './WorkersPage';
import ClientsPage from './ClientsPage';
import ColorLabVerificationsPage from './ColorLabVerificationsPage';
import AdminSettingsPage from './AdminSettingsPage';
import AdminChatPanel from './AdminChatPanel';
import ClientUploadsManager from './ClientUploadsManager';
import CognifyDashboard from './CognifyDashboard';
import {
  fetchAllChatThreadsForAdmin,
  subscribeToChatChannel
} from '../../utils/chatService';
import {
  fetchAllClientUploadsForAdmin,
  subscribeToClientUploadsRealtime
} from '../../utils/clientUploadsService';
import PasswordManagementPage from './PasswordManagementPage';
import {
  LayoutDashboard, Users, UserCheck,
  Edit3, LogOut, Menu, X, ChevronRight,
  Plus, UserPlus, Activity, Palette,
  MessageSquare, Bell, CheckCircle, HardDrive, KeyRound,
  Settings, Sparkles, HelpCircle, Briefcase, Camera, ArrowUpRight
} from 'lucide-react';

const TOP_NAV_PILLS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'uploads', label: 'Uploads', icon: HardDrive },
  { key: 'colorlab', label: 'Color Lab', icon: CheckCircle },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'workers', label: 'Workers', icon: UserCheck },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'editor', label: 'Editor', icon: Edit3 },
  { key: 'passwords', label: 'Security', icon: KeyRound },
];

export default function AdminDashboard({ onLogout }) {
  const { user, profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [assignWorkerOpen, setAssignWorkerOpen] = useState(false);

  // Live status counts
  const [statusCounts, setStatusCounts] = useState({ in_progress: 0, review: 0, completed: 0 });
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [failedUploadsCount, setFailedUploadsCount] = useState(0);

  const fetchStatusCounts = async () => {
    const { data } = await supabase.from('jobs').select('status');
    if (data) {
      const counts = { in_progress: 0, review: 0, completed: 0 };
      data.forEach((j) => { if (counts[j.status] !== undefined) counts[j.status]++; });
      setStatusCounts(counts);
    }
  };

  const fetchUnreadCount = async () => {
    const allMsgs = await fetchAllChatThreadsForAdmin();
    const unread = allMsgs.filter(m => m.sender_role === 'staff' && !m.read_at).length;
    setTotalUnreadMessages(unread);
  };

  const fetchFailedUploads = async () => {
    const ups = await fetchAllClientUploadsForAdmin();
    const failed = ups.filter(u => u.drive_sync_status === 'failed').length;
    setFailedUploadsCount(failed);
  };

  useEffect(() => {
    fetchStatusCounts();
    fetchUnreadCount();
    fetchFailedUploads();

    const unsubscribeUploads = subscribeToClientUploadsRealtime(() => {
      fetchFailedUploads();
    });

    const jobChannel = supabase
      .channel('status-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchStatusCounts();
      })
      .subscribe();

    const unsubscribeChat = subscribeToChatChannel(
      () => fetchUnreadCount(),
      () => fetchUnreadCount()
    );

    return () => {
      supabase.removeChannel(jobChannel);
      unsubscribeChat();
      unsubscribeUploads();
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    if (onLogout) onLogout();
  };

  const totalJobs = statusCounts.in_progress + statusCounts.review + statusCounts.completed;
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111111] font-sans antialiased p-2 sm:p-5 lg:p-8 flex flex-col items-center justify-start selection:bg-[#141414] selection:text-white">

      {/* ════════════════════════════════════════════════════════════════════════════
          OUTER CONTAINER (32PX RADIUS FLOATING DASHBOARD CANVAS)
          ════════════════════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-[1440px] bg-[#F7F8FA] border border-[#E7E8EB] rounded-[20px] sm:rounded-[32px] p-3 sm:p-6 md:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] space-y-4 sm:space-y-8 overflow-hidden">

        {/* ════════════════════════════════════════════════════════════════════════════
            1. TOP NAV: FULL-WIDTH WHITE PILL
            Logo + Wordmark (Left) • Centered Nav Pills • Action Cluster (Right)
            ════════════════════════════════════════════════════════════════════════════ */}
        <header className="w-full bg-white rounded-full border border-[#E7E8EB] px-3 sm:px-6 py-2 sm:py-3 shadow-xs flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Left: Logged-in Admin Identity */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#141414] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs shrink-0">
              {(profile?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="block">
              <span className="text-xs sm:text-[14px] font-bold text-[#111111] tracking-tight block leading-tight">
                {profile?.full_name || (user?.email?.split('@')[0] || 'Admin')}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#9CA0A6] font-medium tracking-wider block lowercase">
                {user?.email || 'admin'}
              </span>
            </div>
          </div>

          {/* Centered Group of Nav Pills (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#F7F8FA] p-1 rounded-full border border-[#E7E8EB]">
            {TOP_NAV_PILLS.map((pill) => {
              const isActive = activeSection === pill.key;
              const isMessages = pill.key === 'messages';
              const isUploads = pill.key === 'uploads';

              return (
                <button
                  key={pill.key}
                  onClick={() => setActiveSection(pill.key)}
                  className={`relative px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#141414] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#111111] hover:bg-white/60'
                  }`}
                >
                  <span>{pill.label}</span>
                  
                  {isMessages && totalUnreadMessages > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-[#FF4D94] text-white">
                      {totalUnreadMessages}
                    </span>
                  )}

                  {isUploads && failedUploadsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FF5A45] text-white text-[10px] font-bold font-mono">
                      {failedUploadsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Icon Cluster: Settings Circle, Notification Bell, User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Notification Bell Circle (with small green dot badge) */}
            <button
              onClick={() => setActiveSection('messages')}
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
              title="Staff Messages"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-white" />
              )}
            </button>

            {/* Settings Circle button */}
            <button
              onClick={() => setActiveSection('passwords')}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
              title="Security & Settings"
            >
              <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Direct Logout Button */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-[#E7E8EB]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#F1F2F4] hover:bg-[#FEF2F2] text-[#6B7280] hover:text-[#DC2626] border border-[#E7E8EB] hover:border-[#FCA5A5] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Logout from Admin Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════════════════
            MOBILE HORIZONTAL SWIPE NAV BAR (ALWAYS ACCESSIBLE ON MOBILE & TABLET)
            ════════════════════════════════════════════════════════════════════════════ */}
        <div className="xl:hidden w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {TOP_NAV_PILLS.map((pill) => {
            const Icon = pill.icon;
            const isActive = activeSection === pill.key;
            const isMessages = pill.key === 'messages';
            const isUploads = pill.key === 'uploads';

            return (
              <button
                key={pill.key}
                onClick={() => setActiveSection(pill.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all shadow-2xs ${
                  isActive
                    ? 'bg-[#141414] text-white'
                    : 'bg-white text-[#6B7280] border border-[#E7E8EB] hover:text-[#111111]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pill.label}</span>
                {isMessages && totalUnreadMessages > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF4D94] text-white font-mono">
                    {totalUnreadMessages}
                  </span>
                )}
                {isUploads && failedUploadsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FF5A45] text-white font-mono">
                    {failedUploadsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation Dropdown (Alternative grid when hamburger is tapped) */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white rounded-2xl p-3 border border-[#E7E8EB] shadow-lg grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-fadeIn">
            {TOP_NAV_PILLS.map((pill) => {
              const Icon = pill.icon;
              const isActive = activeSection === pill.key;
              return (
                <button
                  key={pill.key}
                  onClick={() => {
                    setActiveSection(pill.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                    isActive ? 'bg-[#141414] text-white' : 'text-[#6B7280] hover:bg-[#F1F2F4]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            2. HEADER ROW: PAGE TITLE (LEFT) + PRIMARY ACTION BUTTON (RIGHT)
            ════════════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-[32px] font-bold text-[#111111] tracking-tight leading-tight">
              {activeSection === 'dashboard' && 'Project Management Overview'}
              {activeSection === 'jobs' && 'Photoshoot Pipeline & Orders'}
              {activeSection === 'uploads' && 'Client Uploads & Drive Sync'}
              {activeSection === 'colorlab' && 'Color Lab & Print Verifications'}
              {activeSection === 'messages' && 'Staff Live Communications'}
              {activeSection === 'workers' && 'Studio Staff & Photographers'}
              {activeSection === 'clients' && 'Client Directory & Accounts'}
              {activeSection === 'editor' && 'Studio Live Showcase Editor'}
              {activeSection === 'passwords' && 'Password & Access Security'}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#9CA0A6] font-normal mt-0.5">
              Welcome back, <strong className="text-[#111111]">{userName}</strong>. All studio systems running in real-time.
            </p>
          </div>

          {(activeSection === 'dashboard' || activeSection === 'jobs') && (
            <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto w-full sm:w-auto">
              {/* Secondary Button: Assign Staff */}
              <button
                onClick={() => setAssignWorkerOpen(true)}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-full bg-white hover:bg-[#F1F2F4] text-[#111111] border border-[#E7E8EB] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Staff</span>
              </button>

              {/* Primary Action Button: + New task (Solid Dark Pill) */}
              <button
                onClick={() => setCreateJobOpen(true)}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ New task</span>
              </button>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════════════
            3. MAIN CONTENT AREA (DYNAMICALLY SWITCHES BETWEEN SECTIONS)
            ════════════════════════════════════════════════════════════════════════════ */}
        <main className="w-full">
          {activeSection === 'dashboard' && (
            <CognifyDashboard
              statusCounts={statusCounts}
              totalJobs={totalJobs}
              onCreateJob={() => setCreateJobOpen(true)}
              onAssignWorker={() => setAssignWorkerOpen(true)}
              onNavigateSection={(sec) => setActiveSection(sec)}
              failedUploadsCount={failedUploadsCount}
              totalUnreadMessages={totalUnreadMessages}
            />
          )}

          {activeSection === 'jobs' && <JobStatusTable />}
          {activeSection === 'uploads' && <ClientUploadsManager />}
          {activeSection === 'colorlab' && <ColorLabVerificationsPage />}
          {activeSection === 'messages' && <AdminChatPanel />}
          {activeSection === 'workers' && <WorkersPage />}
          {activeSection === 'clients' && <ClientsPage />}
          {activeSection === 'editor' && <AdminSettingsPage />}
          {activeSection === 'passwords' && <PasswordManagementPage />}
        </main>

      </div>

      {/* ════════════════════════════════════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════════════════════════════════════ */}
      <CreateJobModal
        isOpen={createJobOpen}
        onClose={() => setCreateJobOpen(false)}
        onJobCreated={() => fetchStatusCounts()}
      />

      <AssignWorkerModal
        isOpen={assignWorkerOpen}
        onClose={() => setAssignWorkerOpen(false)}
        onWorkerAssigned={() => fetchStatusCounts()}
      />

    </div>
  );
}
