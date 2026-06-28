import { type ReactNode } from "react";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pt-16 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}