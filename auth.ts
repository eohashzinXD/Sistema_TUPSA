import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { getUserPermissionKeys } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPostHogClient } from "@/lib/posthog-server";

const credentialsSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1)
});

function getTokenPermissions(permissions: unknown): string[] {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return permissions.filter(
    (permission): permission is string => typeof permission === "string"
  );
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: parsedCredentials.data.email
          },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            active: true
          }
        });

        if (!user?.active) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsedCredentials.data.password,
          user.password
        );

        if (!passwordMatches) {
          return null;
        }

        const permissions = await getUserPermissionKeys(user.id);

        const posthog = getPostHogClient();
        posthog.identify({ distinctId: user.id, properties: { email: user.email, name: user.name } });
        posthog.capture({ distinctId: user.id, event: "user_authenticated", properties: { email: user.email } });
        await posthog.shutdown();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          permissions
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.permissions = user.permissions ?? [];
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : "";
      session.user.permissions = getTokenPermissions(token.permissions);

      return session;
    }
  }
});
