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
import {
  fetchJobs,
  cleanAllFakeTestData,
  subscribeToJobsRealtime
} from '../../utils/jobsService';
import PasswordManagementPage from './PasswordManagementPage';
import {
  LayoutDashboard, Users, UserCheck,
  Edit3, LogOut, Menu, X, ChevronRight,
  Plus, UserPlus, Activity, Palette,
  MessageSquare, Bell, CheckCircle, HardDrive, KeyRound,
  Settings, Sparkles, HelpCircle, Briefcase, Camera, ArrowUpRight,
  CheckCircle2
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

  // 100% Live metrics state
  const [statusCounts, setStatusCounts] = useState({ in_progress: 0, review: 0, completed: 0 });
  const [allJobsList, setAllJobsList] = useState([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [workersList, setWorkersList] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [failedUploadsCount, setFailedUploadsCount] = useState(0);
  const [cleanToast, setCleanToast] = useState('');

  const fetchAllDashboardData = async () => {
    // 1. Fetch Real Jobs
    try {
      const jobs = await fetchJobs();
      setAllJobsList(jobs || []);
      const counts = { in_progress: 0, review: 0, completed: 0 };
      (jobs || []).forEach((j) => {
        if (counts[j.status] !== undefined) counts[j.status]++;
      });
      setStatusCounts(counts);
    } catch (e) {
      console.warn('Failed fetching jobs for dashboard:', e);
    }

    // 2. Fetch Real Workers
    try {
      const { data: vWorkers } = await supabase.from('verifications').select('*').eq('album_id', 'SYSTEM_WORKER_REGISTRY');
      const { data: wProfiles } = await supabase.from('profiles').select('*').eq('role', 'worker');
      const rawWorkers = localStorage.getItem('kpr_registered_workers_v1');
      const parsedWorkers = rawWorkers ? JSON.parse(rawWorkers) : [];
      const deletedWorkers = localStorage.getItem('kpr_deleted_workers_v1') ? JSON.parse(localStorage.getItem('kpr_deleted_workers_v1')) : [];
      
      const workerMap = new Map();
      (vWorkers || []).forEach(v => {
        const email = (v.client_email || '').toLowerCase().trim();
        const meta = Array.isArray(v.photo_items) && v.photo_items[0] ? v.photo_items[0] : {};
        if (email && !deletedWorkers.includes(email)) {
          workerMap.set(email, {
            id: v.id || `worker-${v.client_id || email.split('@')[0]}`,
            client_id: v.client_id,
            full_name: meta.full_name || v.client_name,
            email: email,
            phone: meta.phone || v.client_note || 'N/A',
            role: 'worker',
            status: v.status || 'active',
            skill: meta.skill || 'Photographer / Editor'
          });
        }
      });

      (wProfiles || []).forEach(w => {
        const email = (w.email || '').toLowerCase().trim();
        if (email && !deletedWorkers.includes(email) && !workerMap.has(email)) {
          workerMap.set(email, w);
        }
      });

      (parsedWorkers || []).forEach(w => {
        const email = (w.email || '').toLowerCase().trim();
        if (email && !deletedWorkers.includes(email) && !workerMap.has(email)) {
          workerMap.set(email, w);
        }
      });

      const wArr = Array.from(workerMap.values());
      setWorkersList(wArr);
      setWorkerCount(wArr.length);
    } catch (e) {}

    // 3. Fetch Real Clients
    try {
      const { data: vClients } = await supabase.from('verifications').select('*').eq('album_id', 'SYSTEM_CLIENT_REGISTRY');
      const { data: cProfiles } = await supabase.from('profiles').select('*').eq('role', 'client');
      const rawClients = localStorage.getItem('kpr_registered_clients_v1');
      const parsedClients = rawClients ? JSON.parse(rawClients) : [];
      const deletedClients = localStorage.getItem('kpr_deleted_clients_v1') ? JSON.parse(localStorage.getItem('kpr_deleted_clients_v1')) : [];

      const clientMap = new Map();
      (vClients || []).forEach(v => {
        const email = (v.client_email || '').toLowerCase().trim();
        const meta = Array.isArray(v.photo_items) && v.photo_items[0] ? v.photo_items[0] : {};
        if (email && !deletedClients.includes(email) && !email.includes('example.com')) {
          clientMap.set(email, {
            id: v.id || `client-${email.split('@')[0]}`,
            full_name: meta.full_name || v.client_name,
            email: email,
            phone: meta.phone || v.client_note || 'N/A',
            role: 'client',
            status: v.status || 'active'
          });
        }
      });

      (cProfiles || []).forEach(c => {
        const email = (c.email || '').toLowerCase().trim();
        if (email && !deletedClients.includes(email) && !email.includes('example.com') && !clientMap.has(email)) {
          clientMap.set(email, c);
        }
      });

      (parsedClients || []).forEach(c => {
        const email = (c.email || '').toLowerCase().trim();
        if (email && !deletedClients.includes(email) && !clientMap.has(email)) {
          clientMap.set(email, c);
        }
      });

      setClientCount(clientMap.size);
    } catch (e) {}
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

  const handleCleanFakeData = async () => {
    const res = await cleanAllFakeTestData();
    await fetchAllDashboardData();
    await fetchUnreadCount();
    await fetchFailedUploads();
    setCleanToast(res.message || 'All fake test data deleted successfully.');
    setTimeout(() => setCleanToast(''), 4000);
    return res;
  };

  useEffect(() => {
    fetchAllDashboardData();
    fetchUnreadCount();
    fetchFailedUploads();

    const unsubscribeUploads = subscribeToClientUploadsRealtime(() => {
      fetchFailedUploads();
    });

    const unsubscribeJobs = subscribeToJobsRealtime(() => {
      fetchAllDashboardData();
    });

    const unsubscribeChat = subscribeToChatChannel(
      () => fetchUnreadCount(),
      () => fetchUnreadCount()
    );

    const onMessagesRead = () => {
      fetchUnreadCount();
    };
    window.addEventListener('kpr_chat_messages_read', onMessagesRead);

    return () => {
      unsubscribeJobs();
      unsubscribeChat();
      unsubscribeUploads();
      window.removeEventListener('kpr_chat_messages_read', onMessagesRead);
    };
  }, []);

  useEffect(() => {
    if (activeSection === 'messages') {
      fetchUnreadCount();
    }
  }, [activeSection]);

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

        {/* Global Toast Alert for Data Cleanup Confirmation */}
        {cleanToast && (
          <div className="w-full bg-[#DFF5E3] border border-[#16A34A]/30 text-[#16A34A] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cleanToast}</span>
            </div>
            <button onClick={() => setCleanToast('')} className="text-[#16A34A] hover:opacity-75 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            3. MAIN CONTENT AREA (DYNAMICALLY SWITCHES BETWEEN SECTIONS)
            ════════════════════════════════════════════════════════════════════════════ */}
        <main className="w-full">
          {activeSection === 'dashboard' && (
            <CognifyDashboard
              statusCounts={statusCounts}
              totalJobs={totalJobs}
              allJobsList={allJobsList}
              workerCount={workerCount}
              workersList={workersList}
              clientCount={clientCount}
              onCreateJob={() => setCreateJobOpen(true)}
              onAssignWorker={() => setAssignWorkerOpen(true)}
              onNavigateSection={(sec) => setActiveSection(sec)}
              onCleanFakeData={handleCleanFakeData}
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
