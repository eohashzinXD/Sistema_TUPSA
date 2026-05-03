import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão da Casa",
  description: "Sistema interno de estudos, pontos e comunicados"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = "tupsa-theme";
                  var storedTheme = localStorage.getItem(storageKey);
                  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var theme = storedTheme === "light" || storedTheme === "dark"
                    ? storedTheme
                    : prefersDark ? "dark" : "light";
                  document.documentElement.classList.toggle("dark", theme === "dark");
                } catch (_) {}
              })();
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
