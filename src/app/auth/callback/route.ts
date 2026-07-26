import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      const user = session.user;
      const adminSupabase = createAdminClient();

      // Fetch user profile using admin client (bypassing RLS)
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && (profile.role === "employer" || profile.role === "faculty")) {
        const roleTitle = profile.role === "employer" ? "İşveren" : "Akademisyen";
        const companyOrName = profile.first_name || user.user_metadata?.first_name || user.email;
        const nowStr = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

        // 1. Ensure Organization entry exists in 'pending' status for employers
        if (profile.role === "employer") {
          const { data: existingOrg } = await adminSupabase
            .from("organizations")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (!existingOrg) {
            await adminSupabase.from("organizations").insert({
              owner_id: user.id,
              name: companyOrName,
              type: user.user_metadata?.org_type || "employer",
              description: profile.bio || user.user_metadata?.bio || null,
              website_url: profile.website_url || user.user_metadata?.website || null,
              contact_email: user.email,
              contact_phone: profile.phone || user.user_metadata?.phone || null,
              approval_status: "pending",
              is_active: false,
            });
          }
        }

        // 2. Insert welcome / verification pending notification for the user
        const { data: userExistingNotif } = await adminSupabase
          .from("notifications")
          .select("id")
          .eq("recipient_id", user.id)
          .eq("type", "system")
          .filter("metadata->>link", "eq", "/dashboard")
          .maybeSingle();

        if (!userExistingNotif) {
          await adminSupabase.from("notifications").insert({
            recipient_id: user.id,
            type: "system",
            title: "E-posta Adresiniz Doğrulandı",
            message: "E-posta adresiniz başarıyla doğrulandı. Hesabınız ve başvuru detaylarınız şu an yönetici onayındadır. Onaylandığında bilgilendirileceksiniz.",
            metadata: { link: "/dashboard", role: profile.role },
            is_read: false,
          });
        }

        // 3. Notify all admins and moderators
        const { data: admins } = await adminSupabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "moderator"]);

        if (admins && admins.length > 0) {
          for (const adminRecord of admins) {
            // Prevent duplicate notifications
            const { data: existingNotif } = await adminSupabase
              .from("notifications")
              .select("id")
              .eq("recipient_id", adminRecord.id)
              .eq("type", "system")
              .filter("metadata->>user_id", "eq", user.id)
              .maybeSingle();

            if (!existingNotif) {
              await adminSupabase.from("notifications").insert({
                recipient_id: adminRecord.id,
                type: "system",
                title: `Yeni ${roleTitle} Kaydı (E-posta Doğrulandı): ${companyOrName}`,
                message: `${nowStr} tarihinde yeni bir ${roleTitle} e-posta adresini doğruladı ve onay bekliyor. Şirket/İsim: ${companyOrName}, E-posta: ${user.email}. İncelemek için tıklayın.`,
                metadata: {
                  link: `/admin/users?role=${profile.role}&status=pending`,
                  user_id: user.id,
                  role: profile.role,
                  email: user.email,
                },
                is_read: false,
              });
            }
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error - redirect to error page
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

