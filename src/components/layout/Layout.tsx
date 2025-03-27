// src/components/layout/Layout.tsx
import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BackgroundProvider } from "../../contexts/BackgroundContext";
import { BackgroundEffects } from "../ui/BackgroundEffects";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <BackgroundProvider>
      <div className="flex h-screen overflow-hidden relative">
        {/* Don't specify intensity here - let the context handle it */}
        <BackgroundEffects />

        <Sidebar />
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-700/30 scrollbar-track-blue-900/10">
          <Header />
          <div className="relative min-h-[calc(100vh-250px)]">{children}</div>
        </main>
      </div>
    </BackgroundProvider>
  );
};
