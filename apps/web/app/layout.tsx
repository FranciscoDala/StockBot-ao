import type { Metadata } from "next";
import { Zalando_Sans_Expanded, Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const zalando = Zalando_Sans_Expanded({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-zalando",
  display: "swap",
  adjustFontFallback: false, // <- Tira o warning
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
  adjustFontFallback: false, // <- Tira o warning também
});

export const metadata: Metadata = {
  title: "StockBot AO",
  description: "Gestão de Lojas Angola",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO" className={cn(zalando.variable, bricolage.variable, "font-sans", geist.variable)}>
      <body className="font-[var(--font-zalando)]">{children}</body>
    </html>
  );
}
