import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import CalendarPage from "@/components/calendar-page"

export default async function Calendar() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.role || !["admin", "agency_owner", "agency_staff", "agency_client", "independent_producer", "independent_client", "influencer"].includes(profile.role)) {
    redirect("/unauthorized")
  }

  return <CalendarPage />
}
