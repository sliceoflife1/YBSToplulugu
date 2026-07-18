"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

interface Props {
  profile: Profile;
}

export default function CvDownloadButton({ profile }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/cv/pdf?userId=${profile.id}`);
      if (!res.ok) throw new Error("PDF oluşturulamadı");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV_${profile.first_name}_${profile.last_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF indirilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {downloading ? <FileText className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
      {downloading ? "PDF Hazırlanıyor..." : "CV'yi İndir (PDF)"}
    </button>
  );
}
