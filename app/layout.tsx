import type { Metadata } from "next";
import { ThemeProvider } from "./components/layout/ThemeProvider";
import { Sidebar } from "./components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS - Resource Planning",
  description: "Applicant Tracking System for video game recruitment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <Sidebar />
          <main className="w-full">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
