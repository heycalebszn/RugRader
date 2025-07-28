// app/layout.tsx
"use client";

import "./globals.css";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconGauge,
  IconUser,
  IconShield,
} from "@tabler/icons-react";

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-white dark:bg-neutral-900">
        <Sidebar>
          <SidebarBody>
            <SidebarLink
              link={{
                label: "Wallet Scanner",
                href: "/",
                icon: <IconGauge size={18} />,
              }}
            />
            <SidebarLink
              link={{
                label: "NFT Analyzer",
                href: "/nft-analyzer",
                icon: <IconUser size={18} />,
              }}
            />
            <SidebarLink
              link={{
                label: "Collection Check",
                href: "/collection-check",
                icon: <IconShield size={18} />,
              }}
            />
          </SidebarBody>
        </Sidebar>

        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
