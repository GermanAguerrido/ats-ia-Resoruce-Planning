import type { Metadata } from "next";
import { ATSProvider } from "./providers/ATSProvider";
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
        <ATSProvider>
          <ThemeProvider>
            <div className="flex">
              <Sidebar />
              <main className="flex-1">{children}</main>
            </div>
          </ThemeProvider>
        </ATSProvider>
      </body>
    </html>
  );
}
