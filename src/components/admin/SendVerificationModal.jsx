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
  const [existingDriveLink, setExistingDriveLink] = useState('');
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [includeDriveLink, setIncludeDriveLink] = useState(false);
  const [isEditingDriveLink, setIsEditingDriveLink] = useState(false);

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

  // Fetch jobs for selected client
  useEffect(() => {
    if (!selectedClientId) return;

    if (selectedClientId === 'custom') {
      setClientJobs([{ id: 'job-custom', title: 'Color Lab Album Verification', drive_link: '' }]);
      setSelectedJobId('job-custom');
      return;
    }

    async function loadJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('client_id', selectedClientId);

        if (!error && data && data.length > 0) {
          setClientJobs(data);
          setSelectedJobId(data[0].id);
        } else {
          setClientJobs([{ id: 'job-default', title: 'Grand Royal Wedding — Proofing Job', drive_link: '' }]);
          setSelectedJobId('job-default');
        }
      } catch (err) {
        setClientJobs([{ id: 'job-default', title: 'Grand Royal Wedding — Proofing Job', drive_link: '' }]);
        setSelectedJobId('job-default');
      }
    }

    loadJobs();
  }, [selectedClientId]);

  // When selectedJobId changes, check for existing drive_link on that event
  useEffect(() => {
    if (!selectedJobId) return;
    const currentJob = clientJobs.find(j => j.id === selectedJobId);
    if (currentJob?.drive_link) {
      setExistingDriveLink(currentJob.drive_link);
      setDriveLinkInput(currentJob.drive_link);
      setIncludeDriveLink(true);
      setIsEditingDriveLink(false);
    } else {
      setExistingDriveLink('');
      setDriveLinkInput('');
      setIncludeDriveLink(false);
      setIsEditingDriveLink(true);
    }
  }, [selectedJobId, clientJobs]);

  if (!isOpen) return null;

  const togglePhotoSelection = (photoId) => {
    if (selectedPhotoIds.includes(photoId)) {
      setSelectedPhotoIds(selectedPhotoIds.filter(id => id !== photoId));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, photoId]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let finalClientId = selectedClientId;
    let finalClientName = '';
    let finalClientEmail = '';

    if (selectedClientId === 'custom') {
      if (!customClientEmail.trim()) {
        setErrorMsg('Please enter the client email address.');
        return;
      }
      finalClientEmail = customClientEmail.trim().toLowerCase();
      finalClientName = customClientName.trim() || finalClientEmail.split('@')[0];
      finalClientId = `client-${finalClientEmail.split('@')[0]}`;

      // Save to local registered list
      try {
        const raw = localStorage.getItem('kpr_registered_clients_v1');
        const list = raw ? JSON.parse(raw) : [];
        if (!list.some(c => c.email.toLowerCase() === finalClientEmail)) {
          list.push({ id: finalClientId, full_name: finalClientName, email: finalClientEmail, role: 'client', status: 'active' });
          localStorage.setItem('kpr_registered_clients_v1', JSON.stringify(list));
        }
      } catch (e) {}
    } else {
      const clientObj = clients.find(c => c.id === selectedClientId) || { full_name: 'Client', email: '' };
      finalClientName = clientObj.full_name || 'Client';
      finalClientEmail = (clientObj.email || '').trim().toLowerCase();
      finalClientId = clientObj.id || (finalClientEmail ? `client-${finalClientEmail.split('@')[0]}` : selectedClientId);
    }

    const jobObj = clientJobs.find(j => j.id === selectedJobId) || { title: customEventTitle || 'Color Lab Proofing Project' };
    const albumObj = AVAILABLE_ALBUMS.find(a => a.id === selectedAlbumId);

    if (contentType === 'album' && !selectedAlbumId) {
      setErrorMsg('Please select an album to send for review.');
      return;
    }

    if (contentType === 'photos' && selectedPhotoIds.length === 0) {
      setErrorMsg('Please select at least one photo.');
      return;
    }

    if (contentType === 'both' && (!selectedAlbumId || selectedPhotoIds.length === 0)) {
      setErrorMsg('Please select an album and at least one reference photo.');
      return;
    }

    setSubmitting(true);

    const chosenPhotos = SAMPLE_PROOF_PHOTOS.filter(p => selectedPhotoIds.includes(p.id));

    const finalLink = (driveLinkInput || '').trim() || null;

    // If new/updated link was entered, save back to jobs table so it is remembered
    if (finalLink && finalLink !== jobObj.drive_link && selectedJobId !== 'job-custom') {
      await saveEventDriveLink(selectedJobId, finalLink);
    }

    const payload = {
      client_id: finalClientId,
      client_name: finalClientName,
      client_email: finalClientEmail,
      event_id: selectedJobId,
      event_title: customEventTitle || jobObj.title,
      album_id: (contentType === 'album' || contentType === 'both') ? selectedAlbumId : null,
      album_title: (contentType === 'album' || contentType === 'both') ? (albumObj?.title || 'Wedding Album') : null,
      album_pages: (contentType === 'album' || contentType === 'both') ? (albumObj?.pages || []) : [],
      photo_ids: (contentType === 'photos' || contentType === 'both') ? selectedPhotoIds : [],
      photo_items: (contentType === 'photos' || contentType === 'both') ? chosenPhotos : [],
      verification_link: finalLink,
      drive_link: finalLink,
      link_title: 'Verification & Approval Link',
      drive_link_included: Boolean(finalLink),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Send for Client Verification</h3>
              <p className="text-xs text-white/50">Client Proofing & Verification Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-6 flex-1 text-white">
          
          {errorMsg && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Client & Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C5A880]" />
                Select Client
              </label>
              {loadingClients ? (
                <div className="flex items-center gap-2 text-xs text-white/40 p-2.5 bg-black/30 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading client list…
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                Event / Project
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
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

          {/* If Custom Client selected, show Name and Email input fields */}
          {selectedClientId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black/30 rounded-xl border border-[#C5A880]/30 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">
                  Client Full Name (e.g. Nani)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nani"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111827] border border-white/20 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">
                  Client Email (e.g. nani@gmail.com)
                </label>
                <input
                  type="email"
                  placeholder="e.g. nani@gmail.com"
                  value={customClientEmail}
                  onChange={(e) => setCustomClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111827] border border-white/20 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                  required
                />
              </div>
            </div>
          )}

          {/* 2. Content Type Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Verification Content Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setContentType('album')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  contentType === 'album'
                    ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                    : 'border-white/10 bg-[#111827]/60 text-white/60 hover:text-white hover:bg-[#111827]'
                }`}
              >
                <BookOpen className="w-5 h-5 text-[#C5A880]" />
                <span className="text-xs font-medium">Full Album</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('photos')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  contentType === 'photos'
                    ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                    : 'border-white/10 bg-[#111827]/60 text-white/60 hover:text-white hover:bg-[#111827]'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-[#C5A880]" />
                <span className="text-xs font-medium">Loose Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('both')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  contentType === 'both'
                    ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                    : 'border-white/10 bg-[#111827]/60 text-white/60 hover:text-white hover:bg-[#111827]'
                }`}
              >
                <Layers className="w-5 h-5 text-[#C5A880]" />
                <span className="text-xs font-medium">Both (Album + Proofs)</span>
              </button>
            </div>
          </div>

          {/* 3. SECTION: Verification / Approval Link */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#C5A880]/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#C5A880]" />
                <span>Verification / Approval Link (Proof URL, Canva, Album, Video, or Drive)</span>
                <span className="text-[10px] font-normal text-white/40 lowercase">(optional)</span>
              </label>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                placeholder="https://... (e.g. Canva layout, Online Album Proof, Video review, or Drive link)"
                value={driveLinkInput}
                onChange={(e) => setDriveLinkInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
              />
              <p className="text-[11px] text-white/50">
                Pasting a link here creates an instant <strong>"Open Verification Link"</strong> button in the Client Portal for the client to review and approve.
              </p>
            </div>
          </div>

          {/* 4. Album Selector (if contentType === 'album' || 'both') */}
          {(contentType === 'album' || contentType === 'both') && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                Select Layout Album
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AVAILABLE_ALBUMS.map(album => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAlbumId === album.id
                        ? 'border-[#C5A880] bg-[#C5A880]/10 shadow-lg'
                        : 'border-white/10 bg-[#111827] hover:border-white/25'
                    }`}
                  >
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <h4 className="text-xs font-bold text-white truncate">{album.title}</h4>
                    <p className="text-[10px] text-white/50">{album.pages.length} Pages • Flipbook</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Photos Multi-Select (if contentType === 'photos' || 'both') */}
          {(contentType === 'photos' || contentType === 'both') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                  Select Reference / Proof Photos
                </label>
                <span className="text-[11px] text-[#C5A880]">
                  {selectedPhotoIds.length} photo(s) selected
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 bg-[#111827] rounded-xl border border-white/10">
                {SAMPLE_PROOF_PHOTOS.map(photo => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => togglePhotoSelection(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${
                        isSelected ? 'border-[#C5A880] scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#C5A880]/30 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#C5A880] text-black flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Verification
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
