"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSession } from "next-auth/react";

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  agency_id?: string;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const session = await getSession();
      if (session?.user) {
        setUser({
          id: (session.user as any).id ?? "",
          name: session.user.name ?? undefined,
          email: session.user.email ?? undefined,
          role: (session.user as any).role,
          agency_id: (session.user as any).agency_id,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
