import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SocialPilot AI",
  description: "Plateforme intelligente de gestion et d'automatisation des réseaux sociaux",
  applicationName: "SocialPilot AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SocialPilot AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
