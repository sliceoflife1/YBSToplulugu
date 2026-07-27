import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30d";
    
    let daysBack = 30;
    if (period === "7d") daysBack = 7;
    else if (period === "90d") daysBack = 90;
    else if (period === "365d") daysBack = 365;

    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    // ==================== PLATFORM GENEL ============================
    const [
      { count: totalUsers },
      { count: totalPosts },
      { count: totalProjects },
      { count: totalJobs },
      { count: totalApplications },
      { count: totalOrganizations },
      { count: totalOpportunities },
      { count: totalAnnouncements },
    ] = await Promise.all([
      adminSupabase.from("profiles").select("*", { count: "exact", head: true }),
      adminSupabase.from("posts").select("*", { count: "exact", head: true }),
      adminSupabase.from("projects").select("*", { count: "exact", head: true }),
      adminSupabase.from("job_listings").select("*", { count: "exact", head: true }),
      adminSupabase.from("job_applications").select("*", { count: "exact", head: true }),
      adminSupabase.from("organizations").select("*", { count: "exact", head: true }),
      adminSupabase.from("opportunities").select("*", { count: "exact", head: true }),
      adminSupabase.from("announcements").select("*", { count: "exact", head: true }),
    ]);

    // ==================== KULLANICI İSTATİSTİKLERİ ====================
    const { data: allProfiles } = await adminSupabase
      .from("profiles")
      .select("role, department, class_year, is_active, is_mentor, is_open_to_work, created_at");

    const roleCounts: Record<string, number> = {};
    const departmentCounts: Record<string, number> = {};
    const classYearCounts: Record<string, number> = {};
    let activeCount = 0, inactiveCount = 0, mentorCount = 0, openToWorkCount = 0;
    let newUsersInPeriod = 0;

    (allProfiles || []).forEach((p: any) => {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
      if (p.department) departmentCounts[p.department] = (departmentCounts[p.department] || 0) + 1;
      if (p.class_year) classYearCounts[String(p.class_year)] = (classYearCounts[String(p.class_year)] || 0) + 1;
      if (p.is_active) activeCount++; else inactiveCount++;
      if (p.is_mentor) mentorCount++;
      if (p.is_open_to_work) openToWorkCount++;
      if (new Date(p.created_at) >= new Date(since)) newUsersInPeriod++;
    });

    // ==================== AKTİVİTE LOG İSTATİSTİKLERİ ================
    const { data: activityLogs } = await adminSupabase
      .from("activity_logs")
      .select("action_type, action_category, status, user_id, created_at")
      .gte("created_at", since);

    const categoryBreakdown: Record<string, number> = {};
    const actionBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    const dailyActivity: Record<string, number> = {};
    const hourlyActivity: Record<number, number> = {};
    const uniqueActiveUsers = new Set<string>();
    let totalActions = 0;
    let errorCount = 0;
    let unauthorizedCount = 0;

    (activityLogs || []).forEach((log: any) => {
      totalActions++;
      categoryBreakdown[log.action_category] = (categoryBreakdown[log.action_category] || 0) + 1;
      actionBreakdown[log.action_type] = (actionBreakdown[log.action_type] || 0) + 1;
      statusBreakdown[log.status] = (statusBreakdown[log.status] || 0) + 1;
      if (log.status === "error") errorCount++;
      if (log.status === "unauthorized") unauthorizedCount++;
      if (log.user_id) uniqueActiveUsers.add(log.user_id);

      const date = log.created_at.split("T")[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;

      const hour = new Date(log.created_at).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    // En aktif kullanıcılar
    const userActionCounts: Record<string, number> = {};
    (activityLogs || []).forEach((log: any) => {
      if (log.user_id) {
        userActionCounts[log.user_id] = (userActionCounts[log.user_id] || 0) + 1;
      }
    });
    const topActiveUserIds = Object.entries(userActionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([uid, count]) => ({ userId: uid, actionCount: count }));

    // En aktif kullanıcıların profil bilgilerini çek
    let topActiveUsers: any[] = [];
    if (topActiveUserIds.length > 0) {
      const { data: topProfiles } = await adminSupabase
        .from("profiles")
        .select("id, first_name, last_name, role, edu_email")
        .in("id", topActiveUserIds.map(u => u.userId));

      topActiveUsers = topActiveUserIds.map(u => {
        const p = (topProfiles || []).find((pr: any) => pr.id === u.userId);
        return { ...u, profile: p || null };
      });
    }

    // ==================== TOPLULUK İSTATİSTİKLERİ ====================
    const { data: subreddits } = await adminSupabase
      .from("subreddits")
      .select("id, name, slug, post_count")
      .eq("is_active", true)
      .order("post_count", { ascending: false })
      .limit(10);

    const { count: totalComments } = await adminSupabase
      .from("comments").select("*", { count: "exact", head: true });

    const { data: recentPosts } = await adminSupabase
      .from("posts")
      .select("created_at")
      .gte("created_at", since);

    const { data: recentComments } = await adminSupabase
      .from("comments")
      .select("created_at")
      .gte("created_at", since);

    // ==================== PROJE İSTATİSTİKLERİ =======================
    const { data: allProjectsData } = await adminSupabase
      .from("projects")
      .select("technologies, project_type, semester, year, team_members, license, upvote_count");

    const techCounts: Record<string, number> = {};
    const projectTypeCounts: Record<string, number> = {};
    const semesterCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};
    const licenseCounts: Record<string, number> = {};
    let teamProjectCount = 0;
    let soloProjectCount = 0;

    (allProjectsData || []).forEach((p: any) => {
      if (p.technologies) {
        (p.technologies as string[]).forEach((t: string) => {
          techCounts[t] = (techCounts[t] || 0) + 1;
        });
      }
      if (p.project_type) projectTypeCounts[p.project_type] = (projectTypeCounts[p.project_type] || 0) + 1;
      if (p.semester) semesterCounts[p.semester] = (semesterCounts[p.semester] || 0) + 1;
      if (p.year) yearCounts[String(p.year)] = (yearCounts[String(p.year)] || 0) + 1;
      if (p.license) licenseCounts[p.license] = (licenseCounts[p.license] || 0) + 1;
      if (p.team_members && p.team_members.length > 0) teamProjectCount++;
      else soloProjectCount++;
    });

    const topTechs = Object.entries(techCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // ==================== İŞ & KARİYER İSTATİSTİKLERİ ================
    const { data: allJobsData } = await adminSupabase
      .from("job_listings")
      .select("category, employment_type, work_mode, is_active, application_count");

    const jobCategoryCounts: Record<string, number> = {};
    const employmentTypeCounts: Record<string, number> = {};
    const workModeCounts: Record<string, number> = {};
    let activeJobCount = 0;
    let totalAppCount = 0;

    (allJobsData || []).forEach((j: any) => {
      if (j.category) jobCategoryCounts[j.category] = (jobCategoryCounts[j.category] || 0) + 1;
      if (j.employment_type) employmentTypeCounts[j.employment_type] = (employmentTypeCounts[j.employment_type] || 0) + 1;
      if (j.work_mode) workModeCounts[j.work_mode] = (workModeCounts[j.work_mode] || 0) + 1;
      if (j.is_active) activeJobCount++;
      totalAppCount += j.application_count || 0;
    });

    const { data: appStatusData } = await adminSupabase
      .from("job_applications")
      .select("status");

    const appStatusCounts: Record<string, number> = {};
    (appStatusData || []).forEach((a: any) => {
      appStatusCounts[a.status] = (appStatusCounts[a.status] || 0) + 1;
    });

    const { count: pendingOrgs } = await adminSupabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending");

    // ==================== GÜVENLİK İSTATİSTİKLERİ ===================
    const failedLogins = (activityLogs || []).filter(
      (l: any) => l.action_type === "auth.login_failed"
    ).length;

    const adminActions = (activityLogs || []).filter(
      (l: any) => l.action_category === "admin"
    ).length;

    // ==================== SONUÇ =====================================
    return NextResponse.json({
      period,
      daysBack,
      since,

      platform: {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalProjects: totalProjects || 0,
        totalJobs: totalJobs || 0,
        totalApplications: totalApplications || 0,
        totalOrganizations: totalOrganizations || 0,
        totalOpportunities: totalOpportunities || 0,
        totalAnnouncements: totalAnnouncements || 0,
        totalComments: totalComments || 0,
      },

      users: {
        roleCounts,
        departmentCounts,
        classYearCounts,
        activeCount,
        inactiveCount,
        mentorCount,
        openToWorkCount,
        newUsersInPeriod,
      },

      activity: {
        totalActions,
        uniqueActiveUsers: uniqueActiveUsers.size,
        categoryBreakdown,
        actionBreakdown,
        statusBreakdown,
        dailyActivity,
        hourlyActivity,
        errorCount,
        unauthorizedCount,
        topActiveUsers,
      },

      community: {
        topSubreddits: subreddits || [],
        newPostsInPeriod: recentPosts?.length || 0,
        newCommentsInPeriod: recentComments?.length || 0,
      },

      projects: {
        topTechnologies: topTechs,
        projectTypeCounts,
        semesterCounts,
        yearCounts,
        licenseCounts,
        teamProjectCount,
        soloProjectCount,
      },

      jobs: {
        jobCategoryCounts,
        employmentTypeCounts,
        workModeCounts,
        activeJobCount,
        totalApplicationCount: totalAppCount,
        applicationStatusCounts: appStatusCounts,
        pendingOrganizations: pendingOrgs || 0,
      },

      security: {
        failedLogins,
        unauthorizedAttempts: unauthorizedCount,
        adminActions,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
