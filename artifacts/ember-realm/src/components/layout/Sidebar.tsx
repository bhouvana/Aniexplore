import { Link, useLocation } from "wouter";
import { Home, Tv, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/anime", icon: Tv, label: "Anime" },
  { href: "/manga", icon: BookOpen, label: "Manga" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-sidebar border-r border-sidebar-border z-50">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/">
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer select-none">
            EmberRealm
          </span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Anime & Manga Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "group-hover:text-foreground"
                  )}
                />
                <span className="font-medium">{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Fan project for personal use only.
          <br />
          Support official releases.
        </p>
      </div>
    </aside>
  );
}
