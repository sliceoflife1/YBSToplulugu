import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { GraduationCap, BookOpen, Building2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/navbar";

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  const tc = await getTranslations("common");

  const options = [
    {
      href: "/register/student",
      icon: GraduationCap,
      title: t("student"),
      description: "@ogr.deu.edu.tr e-posta adresi ile kayıt olun",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "hover:border-blue-500/50",
    },
    {
      href: "/register/faculty",
      icon: BookOpen,
      title: t("faculty"),
      description: "@deu.edu.tr e-posta adresi ile kayıt olun",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "hover:border-emerald-500/50",
    },
    {
      href: "/register/organization",
      icon: Building2,
      title: t("organization"),
      description: "İşveren, vakıf veya dernek olarak başvurun",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10",
      borderColor: "hover:border-orange-500/50",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-fade-in">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Link>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                {t("registerTitle")}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {t("registerAs")}
              </p>
            </div>

            <div className="space-y-4">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <Link
                    key={option.href}
                    href={option.href}
                    className={`group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${option.borderColor}`}
                  >
                    <div className={`rounded-xl ${option.bgColor} p-3`}>
                      <Icon className="h-6 w-6 text-[var(--color-foreground)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--color-foreground)]">
                        {option.title}
                      </h3>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {option.description}
                      </p>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>

            <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-[var(--color-primary)] transition-colors hover:underline"
              >
                {tc("login")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
