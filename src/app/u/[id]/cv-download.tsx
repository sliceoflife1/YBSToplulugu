"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Profile } from "@/types/database";
import CvDownloadModal from "@/components/cv/cv-download-modal";

interface Props {
  profile: Profile;
}

export default function CvDownloadButton({ profile }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <Download className="h-4 w-4" />
        <span>CV'yi İndir (PDF)</span>
      </button>

      <CvDownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={profile.id}
        userName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
      />
    </>
  );
}
