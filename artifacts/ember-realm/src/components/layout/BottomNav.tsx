import { Link, useLocation } from "wouter";
import { Home, Tv, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/anime", icon: Tv, label: "Anime" },
  { href: "/manga", icon: BookOpen, label: "Manga" },
  { href: "/anime?search=1", icon: Search, label: "Search" },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border"
      style={{ background: "hsl(var(--sidebar))" }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const basePath = href.split("?")[0];
        const isActive = basePath === "/" ? location === "/" : location.startsWith(basePath);
        return (
          <Link key={href} href={href} className="flex-1">
            <div
              data-testid={`bottom-nav-${label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center gap-1 py-3 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
