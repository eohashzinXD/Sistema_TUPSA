"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const storageKey = "tupsa-theme";

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(storageKey, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <Button
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={toggleTheme}
      size="sm"
      type="button"
      variant="outline"
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{isDark ? "Claro" : "Escuro"}</span>
    </Button>
  );
}
