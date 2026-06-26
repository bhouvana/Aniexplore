import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
