"use client";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type { User } from "@supabase/supabase-js";
import { DepartmentPermission } from "@/types/departments";

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  agency_id?: string;
  department_id?: string;
  specialization_id?: string;
  skills?: string[];
  phone?: string;
  avatar_url?: string;
  // Permissões departamentais
  department_permissions?: DepartmentPermission[];
  can_assign_tasks?: boolean;
  can_view_team_metrics?: boolean;
  can_manage_team?: boolean;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  supabaseUser: User | null;
}

const UserContext = createContext<UserContextType>({ 
  user: null, 
  loading: true,
  supabaseUser: null 
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser();

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      
      try {
        // Pega a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Busca o perfil do usuário na tabela user_profiles
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            setUser({
              id: profile.id,
              name: profile.name || undefined,
              email: profile.email || session.user.email || undefined,
              role: profile.role || undefined,
              agency_id: profile.agency_id || undefined,
              department_id: profile.department_id || undefined,
              specialization_id: profile.specialization_id || undefined,
              skills: profile.skills ? JSON.parse(profile.skills) : undefined,
              phone: profile.phone || undefined,
              avatar_url: profile.avatar_url || undefined,
              // Definir permissões baseadas no role
              department_permissions: getDepartmentPermissions(profile.role, profile.specialization_id),
              can_assign_tasks: ['agency_owner', 'agency_manager', 'agency_staff'].includes(profile.role),
              can_view_team_metrics: ['agency_owner', 'agency_manager', 'agency_staff'].includes(profile.role),
              can_manage_team: ['agency_owner', 'agency_manager'].includes(profile.role),
            });
          } else {
            // Se não tem perfil, cria um básico
            const { data: newProfile } = await supabase
              .from('user_profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                name: session.user.email?.split('@')[0] || 'Usuário',
                role: 'free_user', // default role
              })
              .select()
              .single();

            if (newProfile) {
              setUser({
                id: newProfile.id,
                name: newProfile.name || undefined,
                email: newProfile.email || undefined,
                role: newProfile.role || undefined,
                agency_id: newProfile.agency_id || undefined,
                phone: newProfile.phone || undefined,
                avatar_url: newProfile.avatar_url || undefined,
              });
            }
          }
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        setSupabaseUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSupabaseUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, supabaseUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Função para determinar permissões baseadas no role e especialização
function getDepartmentPermissions(role?: string, specializationId?: string): DepartmentPermission[] {
  if (!role) return [];
  
  switch (role) {
    case 'agency_owner':
      return [
        DepartmentPermission.VIEW_ALL,
        DepartmentPermission.MANAGE_ALL,
        DepartmentPermission.MANAGE_DEPARTMENT,
        DepartmentPermission.VIEW_DEPARTMENT,
        DepartmentPermission.VIEW_OWN
      ];
    case 'agency_manager':
      // Gerentes podem ver todos os departamentos e gerenciar equipes, mas não têm acesso total
      return [
        DepartmentPermission.VIEW_ALL,
        DepartmentPermission.MANAGE_DEPARTMENT,
        DepartmentPermission.VIEW_DEPARTMENT,
        DepartmentPermission.VIEW_OWN
      ];
    case 'agency_staff':
      // Se tem especialização, pode ver tarefas do departamento
      if (specializationId) {
        return [
          DepartmentPermission.VIEW_DEPARTMENT,
          DepartmentPermission.VIEW_OWN
        ];
      }
      // Senão, só pode ver as próprias
      return [DepartmentPermission.VIEW_OWN];
    default:
      return [DepartmentPermission.VIEW_OWN];
  }
}

export function useUser() {
  return useContext(UserContext);
}
