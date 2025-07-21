"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    description: "5 clientes, 20 projetos, 20 campanhas, GA, Google Ads, Facebook",
    price: "R$ 99/mês",
    role: "agency_owner"
  },
  {
    key: "premium",
    name: "Premium",
    description: "25 clientes, 100 projetos, 100 campanhas, + LinkedIn, Automação",
    price: "R$ 299/mês",
    role: "agency_owner"
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Ilimitado, todas APIs, API Access",
    price: "R$ 999/mês",
    role: "agency_owner"
  },
  {
    key: "agency_basic",
    name: "Agency Basic",
    description: "50 clientes, 200 projetos, Multi-client Dashboard",
    price: "R$ 499/mês",
    role: "agency_owner"
  },
  {
    key: "agency_pro",
    name: "Agency Pro",
    description: "200 clientes, 1000 projetos, White Label, Automação",
    price: "R$ 1299/mês",
    role: "agency_owner"
  },
  {
    key: "independent_producer",
    name: "Produtor Independente",
    description: "Para produtores independentes e seus clientes",
    price: "Sob consulta",
    role: "independent_producer"
  },
  {
    key: "influencer",
    name: "Influencer",
    description: "Ferramentas individuais para criadores",
    price: "Sob consulta",
    role: "influencer"
  }
];

export default function UpgradePlanPage() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = supabaseBrowser();

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // Buscar usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Você precisa estar logado para fazer upgrade.");
        setLoading(false);
        return;
      }
      // Buscar plano e role
      const planObj = PLANS.find(p => p.key === selectedPlan);
      if (!planObj) {
        setError("Selecione um plano válido.");
        setLoading(false);
        return;
      }
      // Atualizar perfil
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ plan: planObj.key, role: planObj.role })
        .eq("id", user.id);
      if (updateError) {
        setError("Erro ao atualizar plano: " + updateError.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Erro inesperado ao fazer upgrade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
      <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Upgrade de Plano</h1>
        <form onSubmit={handleUpgrade} className="space-y-6">
          <div className="space-y-4">
            {PLANS.map(plan => (
              <label key={plan.key} className={`block border rounded-lg p-4 cursor-pointer transition-all ${selectedPlan === plan.key ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                <input
                  type="radio"
                  name="plan"
                  value={plan.key}
                  checked={selectedPlan === plan.key}
                  onChange={() => setSelectedPlan(plan.key)}
                  className="mr-3 accent-green-500"
                  disabled={loading}
                />
                <span className="font-semibold text-lg">{plan.name}</span>
                <span className="block text-sm text-gray-600 dark:text-gray-300">{plan.description}</span>
                <span className="block text-sm text-gray-800 dark:text-gray-200 font-bold mt-1">{plan.price}</span>
              </label>
            ))}
          </div>
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">Plano atualizado com sucesso! Redirecionando...</div>}
          <button
            type="submit"
            disabled={loading || !selectedPlan}
            className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Atualizando...' : 'Fazer upgrade'}
          </button>
        </form>
      </div>
    </div>
  );
}
