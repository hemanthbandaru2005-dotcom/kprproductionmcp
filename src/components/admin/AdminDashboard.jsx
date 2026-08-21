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
  MessageSquare, Bell, CheckCircle, HardDrive, KeyRound
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'uploads', label: 'Client Uploads', icon: HardDrive },
  { key: 'colorlab', label: 'Verifications', icon: CheckCircle },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'workers', label: 'Workers', icon: UserCheck },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'editor', label: 'Editor', icon: Edit3 },
  { key: 'passwords', label: 'Passwords', icon: KeyRound },
];

export default function AdminDashboard({ onLogout }) {
  const { user, profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

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
      () => {
        fetchUnreadCount();
      },
      () => {
        fetchUnreadCount();
      }
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

  return (
    <div className="flex min-h-screen bg-[#111827] overflow-x-hidden">

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ═══════ SIDEBAR ═══════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-[72px]'
        } bg-[#0F1623] border-r border-white/5`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-white/5">
          {sidebarOpen ? (
            <div>
              <h1 className="font-serif text-lg tracking-[0.25em] uppercase text-white font-light">
                Studio <span className="text-[#C5A880] font-bold">Admin</span>
              </h1>
              <p className="text-[8px] tracking-[0.4em] uppercase text-white/30 mt-0.5">KPR PRODUCTIONS</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#C5A880] flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xs">K</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 py-5 px-3 space-y-1">
          <p className={`text-[9px] font-semibold text-white/20 uppercase tracking-[0.3em] mb-2 ${sidebarOpen ? 'px-3' : 'text-center'}`}>
            {sidebarOpen ? 'MAIN MENU' : '•'}
          </p>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            const isMessages = item.key === 'messages';
            const isUploads = item.key === 'uploads';

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveSection(item.key);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#C5A880]/15 text-[#C5A880] shadow-lg shadow-[#C5A880]/5'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
                title={item.label}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#C5A880]' : ''}`} />
                {sidebarOpen && (
                  <>
                    <span className="tracking-wider uppercase">{item.label}</span>
                    {isMessages && totalUnreadMessages > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold font-mono animate-pulse">
                        {totalUnreadMessages}
                      </span>
                    )}
                    {isUploads && failedUploadsCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono animate-pulse" title={`${failedUploadsCount} Drive sync failures`}>
                        {failedUploadsCount}
                      </span>
                    )}
                    {isActive && !isMessages && (!isUploads || failedUploadsCount === 0) && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#C5A880]/60" />
                    )}
                  </>
                )}
                {!sidebarOpen && isMessages && totalUnreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#0F1623]" />
                )}
                {!sidebarOpen && isUploads && failedUploadsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0F1623]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          {sidebarOpen && (
            <div className="px-3 mb-3">
              <p className="text-xs text-white/80 font-medium truncate">{profile?.full_name || user?.email}</p>
              <p className="text-[9px] uppercase tracking-widest text-[#C5A880]/70 mt-0.5">{profile?.role || 'Admin'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {sidebarOpen && <span className="tracking-wider uppercase font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'} ml-0 min-w-0`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#111827]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 text-white/70 hover:text-white"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-lg sm:text-xl text-white font-light capitalize tracking-wide">
                {activeSection.replace('_', ' ')}
              </h2>
              <p className="text-[8px] sm:text-[9px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-white/30 mt-0.5">
                KPR PRODUCTIONS — ADMIN PANEL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveSection('messages')}
              className="relative p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Staff Messages"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#111827]" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-600/80 text-white/70 hover:text-white text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-white/10 hover:border-red-500"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className={(activeSection === 'messages' || activeSection === 'chat') ? "h-[calc(100dvh-60px)] sm:h-auto p-0 sm:p-8 flex flex-col" : "p-3 sm:p-8"}>

          {/* ──── DASHBOARD PAGE ──── */}
          {activeSection === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">

              {/* Quick Action Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Create Job */}
                <button
                  onClick={() => setCreateJobOpen(true)}
                  className="group bg-[#1E2433] hover:bg-[#232A3B] border border-white/5 hover:border-[#C5A880]/30 rounded-xl p-6 text-left transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#C5A880]/10 group-hover:bg-[#C5A880]/20 flex items-center justify-center transition-colors">
                      <Plus className="w-5 h-5 text-[#C5A880]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wider uppercase">Create Job</h4>
                      <p className="text-[10px] text-white/40">New photoshoot</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30">Add a new job with client details, type, and date assignment.</p>
                </button>

                {/* Assign Worker */}
                <button
                  onClick={() => setAssignWorkerOpen(true)}
                  className="group bg-[#1E2433] hover:bg-[#232A3B] border border-white/5 hover:border-blue-500/30 rounded-xl p-6 text-left transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                      <UserPlus className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wider uppercase">Assign Worker</h4>
                      <p className="text-[10px] text-white/40">Link to job</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30">Assign a photographer or editor to an existing job.</p>
                </button>

                {/* Live Status */}
                <div className="bg-[#1E2433] border border-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wider uppercase">Live Status</h4>
                      <p className="text-[10px] text-white/40">{totalJobs} total jobs</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] text-white/60">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress
                      </span>
                      <span className="text-sm font-bold text-white/90 font-mono">{statusCounts.in_progress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] text-white/60">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Review
                      </span>
                      <span className="text-sm font-bold text-white/90 font-mono">{statusCounts.review}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] text-white/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                      </span>
                      <span className="text-sm font-bold text-white/90 font-mono">{statusCounts.completed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Job Status Table */}
              <JobStatusTable />

            </div>
          )}

          {/* ──── CLIENT UPLOADS & DRIVE SYNC CENTER ──── */}
          {activeSection === 'uploads' && <ClientUploadsManager />}

          {/* ──── COLOR LAB VERIFICATIONS PAGE ──── */}
          {activeSection === 'colorlab' && <ColorLabVerificationsPage />}

          {/* ──── STAFF MESSAGES (ADMIN <-> WORKER CHAT) ──── */}
          {(activeSection === 'messages' || activeSection === 'chat') && <AdminChatPanel />}

          {/* ──── WORKERS PAGE ──── */}
          {activeSection === 'workers' && <WorkersPage />}

          {/* ──── CLIENTS PAGE ──── */}
          {activeSection === 'clients' && <ClientsPage />}

          {/* ──── EDITOR PAGE (PHOTO GALLERY & PACKAGES) ──── */}
          {activeSection === 'editor' && <AdminSettingsPage />}

          {/* ──── PASSWORD MANAGEMENT ──── */}
          {activeSection === 'passwords' && <PasswordManagementPage />}

        </div>
      </main>

      {/* ═══════ MODALS ═══════ */}
      <CreateJobModal isOpen={createJobOpen} onClose={() => setCreateJobOpen(false)} />
      <AssignWorkerModal isOpen={assignWorkerOpen} onClose={() => setAssignWorkerOpen(false)} />

    </div>
  );
}
