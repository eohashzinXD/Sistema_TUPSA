"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

type PostHogIdentifyProps = {
  userId: string;
  email?: string | null;
  name?: string | null;
};

export function PostHogIdentify({ userId, email, name }: PostHogIdentifyProps) {
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, { email: email ?? undefined, name: name ?? undefined });
    }
  }, [userId, email, name]);

  return null;
}
