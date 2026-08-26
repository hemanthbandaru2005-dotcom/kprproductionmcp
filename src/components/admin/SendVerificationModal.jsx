import React, { useState, useEffect } from 'react';
import {
  X, Send, BookOpen, Image as ImageIcon, Layers, Check,
  Loader2, User, Calendar, AlertCircle, HardDrive, ExternalLink,
  Edit3, Link2, UserPlus
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { AVAILABLE_ALBUMS, createVerification, saveEventDriveLink } from '../../utils/verificationService';
import { CLIENT_MEMBERS } from '../../context/AuthContext';

const SAMPLE_PROOF_PHOTOS = [
  { id: 'p1', title: 'Royal Mandap Decor', src: '/images/services/wedding_album_printing.png' },
  { id: 'p2', title: 'High-Res Canvas Portrait', src: '/images/services/large_format_printing.png' },
  { id: 'p3', title: 'Gold Foil Invitation Proof', src: '/images/services/laser_printing.png' },
  { id: 'p4', title: '3D Acrylic Frame Layout', src: '/images/services/acrylic_mdf_frames.png' },
  { id: 'p5', title: 'Antique Teakwood Frame', src: '/images/services/photo_frames.png' },
  { id: 'p6', title: 'HD Vinyl Backdrop Color Grade', src: '/images/services/flex_printing.png' },
];

export default function SendVerificationModal({ isOpen, onClose, onCreated }) {
  const [clients, setClients] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [customClientEmail, setCustomClientEmail] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [contentType, setContentType] = useState('album'); // 'album' | 'photos' | 'both'
  const [selectedAlbumId, setSelectedAlbumId] = useState(AVAILABLE_ALBUMS[0]?.id || '');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(['p1', 'p2']);

  // Drive Link State
  const [driveLinkInput, setDriveLinkInput] = useState('');

  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real clients from Supabase & localStorage
  useEffect(() => {
    if (!isOpen) return;

    async function loadClients() {
      setLoadingClients(true);
      setErrorMsg('');
      try {
        const clientMap = new Map();

        // 1. Registered clients from localStorage
        try {
          const raw = localStorage.getItem('kpr_registered_clients_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(c => {
                if (c && c.email && !c.email.includes('example.com')) {
                  clientMap.set(c.email.toLowerCase(), {
                    id: c.id || `client-${c.email.split('@')[0]}`,
                    full_name: c.full_name || c.email.split('@')[0],
                    email: c.email
                  });
                }
              });
            }
          }
        } catch (e) {}

        // 2. Real clients from Supabase profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'client')
          .order('full_name', { ascending: true });

        if (!error && data && data.length > 0) {
          data.forEach(c => {
            if (c.email && !c.email.includes('example.com')) {
              clientMap.set(c.email.toLowerCase(), { id: c.id, full_name: c.full_name, email: c.email });
            }
          });
        }

        // 3. Pre-add Nani if not already present
        if (!clientMap.has('nani@gmail.com') && !clientMap.has('nani@gamil.com')) {
          clientMap.set('nani@gmail.com', { id: 'client-nani', full_name: 'Nani', email: 'nani@gmail.com' });
        }

        const mergedClients = Array.from(clientMap.values());
        setClients(mergedClients);
        if (mergedClients.length > 0) {
          setSelectedClientId(mergedClients[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setLoadingClients(false);
      }
    }

    loadClients();
  }, [isOpen]);

  // When selectedClientId changes, load their real jobs or provide a default
  useEffect(() => {
    if (!selectedClientId) return;

    if (selectedClientId === 'custom') {
      setClientJobs([
        { id: 'custom-event', title: 'Grand Royal Wedding & Reception' },
        { id: 'custom-event-2', title: 'Pre-Wedding & Haldi Ceremony' },
        { id: 'custom-event-3', title: 'Custom Color Lab Order' }
      ]);
      setSelectedJobId('custom-event');
      return;
    }

    async function loadJobs() {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      const clientEmail = selectedClient?.email || '';

      const { data } = await supabase
        .from('jobs')
        .select('id, title, shoot_date')
        .or(`client_name.ilike.%${selectedClient?.full_name || ''}%,client_name.ilike.%${clientEmail}%`);

      if (data && data.length > 0) {
        setClientJobs(data);
        setSelectedJobId(data[0].id);
      } else {
        setClientJobs([
          { id: 'job-default-1', title: `${selectedClient?.full_name || 'Client'}'s Wedding Album Layout` },
          { id: 'job-default-2', title: `${selectedClient?.full_name || 'Client'}'s Haldi Ceremony Highlights` }
        ]);
        setSelectedJobId('job-default-1');
      }
    }

    loadJobs();
  }, [selectedClientId, clients]);

  const togglePhoto = (id) => {
    if (selectedPhotoIds.includes(id)) {
      setSelectedPhotoIds(selectedPhotoIds.filter(p => p !== id));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let targetClientId = selectedClientId;
    let targetClientName = '';
    let targetClientEmail = '';

    if (selectedClientId === 'custom') {
      if (!customClientName.trim() || !customClientEmail.trim()) {
        setErrorMsg('Please enter both the client name and email.');
        return;
      }
      targetClientName = customClientName.trim();
      targetClientEmail = customClientEmail.trim().toLowerCase();
      targetClientId = `client-${targetClientEmail.split('@')[0]}`;
    } else {
      const c = clients.find(cl => cl.id === selectedClientId);
      targetClientName = c?.full_name || 'Valued Client';
      targetClientEmail = c?.email || '';
    }

    const selJob = clientJobs.find(j => j.id === selectedJobId);
    const eventTitle = customEventTitle.trim() || selJob?.title || `${targetClientName}'s Event Proof`;

    const albumObj = AVAILABLE_ALBUMS.find(a => a.id === selectedAlbumId);
    const albumPages = (contentType === 'album' || contentType === 'both') ? (albumObj?.pages || []) : [];
    const photoItems = (contentType === 'photos' || contentType === 'both')
      ? SAMPLE_PROOF_PHOTOS.filter(p => selectedPhotoIds.includes(p.id))
      : [];

    if (albumPages.length === 0 && photoItems.length === 0 && !driveLinkInput.trim()) {
      setErrorMsg('Please select at least an album layout, photo items, or provide a verification link.');
      return;
    }

    setSubmitting(true);

    const payload = {
      client_id: targetClientId,
      client_name: targetClientName,
      client_email: targetClientEmail,
      event_title: eventTitle,
      album_title: albumObj ? albumObj.title : `${eventTitle} Album Proof`,
      album_pages: albumPages,
      photo_items: photoItems,
      verification_link: driveLinkInput.trim() || null,
      drive_link: driveLinkInput.trim() || null,
      status: 'pending'
    };

    const res = await createVerification(payload);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (onCreated) onCreated(res.data);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#111111]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7E8EB] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF] shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">
                Send Proofing & Verification
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Deliver interactive albums & approval links to clients
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Client & Job Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#1E74FF]" />
                Select Client
              </label>
              {loadingClients ? (
                <div className="p-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#9CA0A6]">
                  Loading client list…
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
                  required
                >
                  <option value="custom">➕ Enter Custom Client (Name & Email)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email || 'No email'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1E74FF]" />
                Event / Project
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
                required
              >
                {clientJobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Client Fields */}
          {selectedClientId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB] animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nani"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. nani@gmail.com"
                  value={customClientEmail}
                  onChange={(e) => setCustomClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  required
                />
              </div>
            </div>
          )}

          {/* 2. Verification Content Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
              Verification Content Type
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setContentType('album')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  contentType === 'album'
                    ? 'border-[#141414] bg-[#141414] text-white shadow-xs'
                    : 'border-[#E7E8EB] bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold">Full Album</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('photos')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  contentType === 'photos'
                    ? 'border-[#141414] bg-[#141414] text-white shadow-xs'
                    : 'border-[#E7E8EB] bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs font-semibold">Loose Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('both')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  contentType === 'both'
                    ? 'border-[#141414] bg-[#141414] text-white shadow-xs'
                    : 'border-[#E7E8EB] bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-xs font-semibold">Both (All)</span>
              </button>
            </div>
          </div>

          {/* 3. Verification / Approval Link Input */}
          <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E7E8EB] space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#1E74FF]" />
              <span>Approval Link (Canva layout, Online Album Proof, Video review, or Drive)</span>
            </label>
            <input
              type="url"
              placeholder="https://... (e.g. Canva layout, Online Album Proof, or Drive link)"
              value={driveLinkInput}
              onChange={(e) => setDriveLinkInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
            />
          </div>

          {/* 4. Album Selector */}
          {(contentType === 'album' || contentType === 'both') && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Select Layout Album
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AVAILABLE_ALBUMS.map(album => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedAlbumId === album.id
                        ? 'border-[#141414] bg-white shadow-md ring-1 ring-[#141414]'
                        : 'border-[#E7E8EB] bg-[#F7F8FA] hover:bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#111111]">{album.title}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{album.pages.length} design pages</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Deliver Verification to Client</span>
          </button>
        </form>
      </div>
    </div>
  );
}
