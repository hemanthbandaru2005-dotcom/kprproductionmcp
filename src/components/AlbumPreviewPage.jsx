import React, { useState } from 'react';
import { loadSavedAlbum } from '../utils/defaultAlbumData';
import AlbumEditor from './album/AlbumEditor';
import AlbumViewerModal from './album/AlbumViewerModal';

/**
 * AlbumPreviewPage
 * Serves the full Luxury Digital Wedding Photobook Suite:
 * - Interactive Album Editor (photo tray, templates, fine-tuning)
 * - 3D Page-Turn Photobook Viewer
 */
export default function AlbumPreviewPage() {
  const [album] = useState(loadSavedAlbum);

  return (
    <div className="w-full min-h-[100vh] bg-[#F7F4EE]">
      <AlbumEditor initialAlbum={album} />
    </div>
  );
}
