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
      case "agency":
        redirect("/agency")  // Agências - Com níveis hierárquicos
      case "independent":
        redirect("/independent")  // Produtores Independentes - Autônomos
      case "influencer":
        redirect("/influencer")  // Influencers/Criadores - Individual
      case "free":
        redirect("/free")  // Plano Gratuito - Limitado
      case "client":
        redirect(`/client/${user.id}`)  // Clientes das agências
      default:
        redirect("/unauthorized")
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
