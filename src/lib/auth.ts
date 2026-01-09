import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "./prisma"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('[Auth] Login attempt with:', credentials?.email)

        const parsed = loginSchema.safeParse(credentials)

        if (!parsed.success) {
          console.log('[Auth] Validation failed:', parsed.error)
          return null
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            subscription: true,
          },
        })

        if (!user) {
          console.log('[Auth] User not found:', email)
          return null
        }

        console.log('[Auth] User found:', { id: user.id, email: user.email })

        const isPasswordValid = await compare(password, user.passwordHash)

        if (!isPasswordValid) {
          console.log('[Auth] Invalid password for:', email)
          return null
        }

        console.log('[Auth] Login successful:', email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Use NEXT_PUBLIC_APP_URL if available, otherwise use baseUrl
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || baseUrl

      // If the URL is relative, prepend the app URL
      if (url.startsWith("/")) {
        return `${appUrl}${url}`
      }

      // If the URL is already absolute and starts with our baseUrl or appUrl, allow it
      if (url.startsWith(baseUrl) || (process.env.NEXT_PUBLIC_APP_URL && url.startsWith(process.env.NEXT_PUBLIC_APP_URL))) {
        return url
      }

      // For external URLs or other cases, redirect to the app URL root
      return appUrl
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes in seconds
  },
  secret: process.env.NEXTAUTH_SECRET,
})
