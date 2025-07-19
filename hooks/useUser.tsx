"use client";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  agency_id?: string;
  phone?: string;
  avatar_url?: string;
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
          
          // Busca o perfil do usuário na tabela profiles
          const { data: profile, error } = await supabase
            .from('profiles')
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
              phone: profile.phone || undefined,
              avatar_url: profile.avatar_url || undefined,
            });
          } else {
            // Se não tem perfil, cria um básico
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                role: 'personal', // default role
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

export function useUser() {
  return useContext(UserContext);
}
