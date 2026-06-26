import NextAuth from "next-auth/next";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Try real Database Authentication first
        if (process.env.MONGODB_URI) {
          try {
            const connectDB = (await import("@/lib/db")).default;
            const User = (await import("@/models/User")).default;
            const bcrypt = (await import("bcryptjs")).default;
            
            await connectDB();
            const user = await User.findOne({ email: credentials.email.toLowerCase() });
            
            if (user) {
              const isValid = await bcrypt.compare(credentials.password, user.password);
              if (isValid) {
                return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
              }
              return null; // Invalid password
            }
          } catch (err) {
            console.error("DB Auth Error:", err);
          }
        }

        // 2. Support for User's Custom Credentials (Mock fallback)
        if (credentials.email === "lalli1@admin" && credentials.password === "lalli1") {
          return { id: "99", name: "Lalith (Admin)", email: "lalli1@admin", role: "Administrator" };
        }

        // 3. Quick Mock DB Bypass for Testing Phase
        if (credentials.password === "password") {
          const mockUsers: Record<string, any> = {
            "admin@test.com": { id: "1", name: "Admin User", email: "admin@test.com", role: "Administrator" },
            "manager@test.com": { id: "2", name: "Manager User", email: "manager@test.com", role: "Manager" },
            "lead@test.com": { id: "3", name: "Team Lead User", email: "lead@test.com", role: "Team Lead" },
            "employee@test.com": { id: "4", name: "Employee User", email: "employee@test.com", role: "Employee" },
            "client@test.com": { id: "5", name: "Client User", email: "client@test.com", role: "Client" },
          };
          
          if (mockUsers[credentials.email]) {
            return mockUsers[credentials.email];
          }
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
  pages: {
    signIn: "/",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
