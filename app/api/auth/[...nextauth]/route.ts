import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        // Simulação de login fixo (substituir com validação real)
        if (credentials.email === "admin@agencia.com" && credentials.password === "admin123") {
          return { id: "1", name: "Agência", email: credentials.email, role: "agency" }
        }

        if (credentials.email === "cliente@xyz.com" && credentials.password === "cliente123") {
          return { id: "2", name: "Cliente XYZ", email: credentials.email, role: "client" }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role as string
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
