"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Compass,
  Settings,
  Shield,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        setUser(profile);
      }
      setLoading(false);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(profile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const toggleLocale = () => {
    const currentLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1] || "tr";
    const newLocale = currentLocale === "tr" ? "en" : "tr";
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  const navLinks = user
    ? [
        { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/projects", label: t("nav.projects"), icon: FolderKanban },
        { href: "/cv", label: t("nav.cv"), icon: FileText },
        { href: "/community", label: t("nav.community"), icon: MessageSquare },
        { href: "/explore", label: t("nav.explore"), icon: Compass },
      ]
    : [];

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isFaculty = user?.role === "faculty";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <span className="text-lg font-bold text-white">Y</span>
          </div>
          <span className="hidden text-lg font-bold sm:block">
            <span className="gradient-text">YBS</span>{" "}
            <span className="text-[var(--color-foreground)]">Topluluğu</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {(isAdmin || isFaculty) && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <Shield className="h-4 w-4" />
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            title="Dil Değiştir / Change Language"
          >
            <Globe className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* User menu or auth buttons */}
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--color-muted)]" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] sm:flex"
              >
                <User className="h-4 w-4" />
                {user.first_name || t("nav.profile")}
              </Link>
              <Link
                href="/settings"
                className="hidden items-center justify-center rounded-lg px-2 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] sm:flex"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("common.logout")}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
              >
                {t("common.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-lg"
              >
                {t("common.register")}
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] p-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                >
                  <User className="h-5 w-5" />
                  {t("nav.profile")}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                >
                  <Settings className="h-5 w-5" />
                  {t("nav.settings")}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
