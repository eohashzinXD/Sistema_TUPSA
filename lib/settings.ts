import { prisma } from "@/lib/prisma";

export const SYSTEM_SETTINGS_ID = "terreiro";

export type SystemSettingsValue = {
  templeName: string;
  logoUrl: string | null;
};

export const defaultSystemSettings: SystemSettingsValue = {
  templeName: "TUPSA",
  logoUrl: null
};

export async function getSystemSettings(): Promise<SystemSettingsValue> {
  const settings = await prisma.systemSettings.findUnique({
    where: {
      id: SYSTEM_SETTINGS_ID
    },
    select: {
      templeName: true,
      logoUrl: true
    }
  });

  return settings ?? defaultSystemSettings;
}
