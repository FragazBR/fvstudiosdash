// app/dashboard/page.tsx
import Dashboard from "@/components/dashboard";
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  "use server";

  const supabase = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    console.error("❌ Usuário não autenticado:", userError);
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profileError || profile.role !== "agency") {
    console.error("❌ Acesso negado:", profileError);
    redirect("/unauthorized");
  }

  return <Dashboard />;
}
