import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import ContactsPage from "@/components/contacts-page"

export default async function Contacts() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.role || !["agency", "client"].includes(profile.role)) {
    redirect("/unauthorized")
  }

  return <ContactsPage />
}
