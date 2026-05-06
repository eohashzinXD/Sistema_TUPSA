"use client";

import { BellRing, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type PushNotificationToggleProps = {
  publicKey?: string;
};

type PushState = "unsupported" | "blocked" | "disabled" | "enabled" | "loading";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer as ArrayBuffer;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  return navigator.serviceWorker.register("/sw.js");
}

export function PushNotificationToggle({
  publicKey
}: PushNotificationToggleProps) {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    let active = true;

    async function syncState() {
      if (
        !publicKey ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }

      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (active) {
        setState(subscription ? "enabled" : "disabled");
      }
    }

    syncState().catch(() => {
      if (active) setState("unsupported");
    });

    return () => {
      active = false;
    };
  }, [publicKey]);

  async function enablePushNotifications() {
    if (!publicKey) return;

    setState("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("blocked");
        return;
      }

      if (permission !== "granted") {
        setState("disabled");
        return;
      }

      const registration = await getServiceWorkerRegistration();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        }));

      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subscription.toJSON())
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar inscrição");
      }

      setState("enabled");
    } catch {
      setState("disabled");
    }
  }

  async function disablePushNotifications() {
    setState("loading");

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }

      setState("disabled");
    } catch {
      setState("enabled");
    }
  }

  const isEnabled = state === "enabled";
  const isLoading = state === "loading";
  const disabled = state === "unsupported" || state === "blocked" || isLoading;
  const label = isEnabled
    ? "Desativar notificações do navegador"
    : state === "blocked"
      ? "Notificações bloqueadas no navegador"
      : state === "unsupported"
        ? "Notificações indisponíveis"
        : "Ativar notificações do navegador";

  return (
    <Button
      aria-label={label}
      disabled={disabled}
      onClick={isEnabled ? disablePushNotifications : enablePushNotifications}
      size="sm"
      title={label}
      type="button"
      variant="outline"
      className="h-9 w-9 px-0"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : isEnabled ? (
        <BellRing className="size-4" aria-hidden="true" />
      ) : (
        <BellOff className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
