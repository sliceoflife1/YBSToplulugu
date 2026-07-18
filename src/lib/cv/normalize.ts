import type { CvEducation, CvExperience } from "@/types/database";

/**
 * Eski CV veri şeması (school/department/startYear/endYear ve
 * company/position/duration) ile yeni, daha kapsamlı şema
 * (degree/field/location/gpa/description ve startDate/endDate/current)
 * arasında geriye dönük uyumluluk sağlar. Kaydedilmiş eski veriler bu
 * fonksiyonlar sayesinde otomatik olarak yeni forma taşınır.
 */

const CURRENT_HINTS = /devam|present|current|güncel|halen/i;

type RawRecord = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeEducationItem(input: unknown): CvEducation {
  if (!input || typeof input !== "object") {
    return { school: "", degree: "", field: "", startDate: "" };
  }
  const raw = input as RawRecord;

  const hasNewShape = "startDate" in raw || "degree" in raw || "field" in raw;

  if (hasNewShape) {
    return {
      school: asString(raw.school),
      degree: asString(raw.degree),
      field: asString(raw.field) || asString(raw.department),
      location: asString(raw.location),
      gpa: asString(raw.gpa),
      description: asString(raw.description),
      startDate: asString(raw.startDate) || asString(raw.startYear),
      endDate: asString(raw.endDate) || asString(raw.endYear),
      current: Boolean(raw.current),
    };
  }

  // Eski şema: { school, department, startYear, endYear }
  const endYear = asString(raw.endYear);
  const isCurrent = CURRENT_HINTS.test(endYear);

  return {
    school: asString(raw.school),
    degree: "",
    field: asString(raw.department),
    location: "",
    gpa: "",
    description: "",
    startDate: asString(raw.startYear),
    endDate: isCurrent ? "" : endYear,
    current: isCurrent,
  };
}

export function normalizeExperienceItem(input: unknown): CvExperience {
  if (!input || typeof input !== "object") {
    return { company: "", title: "", startDate: "" };
  }
  const raw = input as RawRecord;

  const hasNewShape = "startDate" in raw || "title" in raw;

  if (hasNewShape) {
    return {
      company: asString(raw.company),
      title: asString(raw.title) || asString(raw.position),
      location: asString(raw.location),
      description: asString(raw.description),
      startDate: asString(raw.startDate),
      endDate: asString(raw.endDate),
      current: Boolean(raw.current),
    };
  }

  // Eski şema: { company, position, duration, description }
  const duration = asString(raw.duration);
  let startDate = duration;
  let endDate = "";
  let current = false;

  if (duration.includes("-")) {
    const [start, end] = duration.split("-").map((s: string) => s.trim());
    startDate = start || "";
    if (CURRENT_HINTS.test(end || "")) {
      current = true;
    } else {
      endDate = end || "";
    }
  }

  return {
    company: asString(raw.company),
    title: asString(raw.position),
    location: "",
    description: asString(raw.description),
    startDate,
    endDate,
    current,
  };
}

export function normalizeEducationList(list: unknown): CvEducation[] {
  return Array.isArray(list) ? list.map(normalizeEducationItem) : [];
}

export function normalizeExperienceList(list: unknown): CvExperience[] {
  return Array.isArray(list) ? list.map(normalizeExperienceItem) : [];
}

export function parseJsonArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function formatDateRange(
  startDate?: string,
  endDate?: string,
  current?: boolean,
  isEn = false
): string {
  const presentLabel = isEn ? "Present" : "Devam Ediyor";
  const parts = [startDate || "", current ? presentLabel : endDate || ""].filter(Boolean);
  return parts.join(" - ");
}
