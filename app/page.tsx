import React from "react"
import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabaseServer"
import { Loader2 } from "lucide-react"

export default async function HomePage() {
  const supabase = await supabaseServer()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single<any>()

    if (!profile || !profile.role) {
      redirect("/login")
    }

    // Redirecionamentos baseados no role
    switch (profile.role) {
      case "admin":
        redirect("/admin")  // FVStudios - Controle total
      case "agency_owner":
      case "agency_manager": 
      case "agency_staff":
        redirect("/dashboard")  // Agências - Dashboard principal
      case "independent_producer":
        redirect("/dashboard")  // Produtores Independentes - Dashboard
      case "influencer":
        redirect("/dashboard")  // Influencers/Criadores - Dashboard
      case "free_user":
        redirect("/dashboard")  // Plano Gratuito - Dashboard básico
      case "agency_client":
        redirect(`/client/${user.id}`)  // Clientes das agências
      case "independent_client":
        redirect(`/client/${user.id}`)  // Clientes independentes
      // Legacy support para roles antigos
      case "agency":
        redirect("/dashboard")
      case "independent":
        redirect("/dashboard")
      case "free":
        redirect("/dashboard")
      case "client":
        redirect(`/client/${user.id}`)
      default:
        redirect("/dashboard")  // Default para dashboard
    }
  } catch (error) {
    console.error("Error in HomePage:", error)
    redirect("/login")
  }

  // Loading state (nunca deve chegar aqui devido aos redirects)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-gray-600 dark:text-gray-300">Redirecionando...</span>
      </div>
    </div>
  )
}
