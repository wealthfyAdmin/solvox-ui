import { headers } from "next/headers";
import { Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

const outfit = Outfit({
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ Await headers to avoid "should be awaited" error
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        {/* ✅ Safe inline script using nonce */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `console.log("✅ Safe inline script executed with nonce: ${nonce}")`,
          }}
        />

        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
