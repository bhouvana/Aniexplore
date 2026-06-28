import { Link, useLocation } from "wouter";
import { Home, Tv, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/anime", icon: Tv, label: "Anime" },
  { href: "/manga", icon: BookOpen, label: "Manga" },
];

export default function BottomNav() {
  const [location] = useLocation();

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("aniexplore:open-search"));
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 glass">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = href === "/" ? location === "/" : location.startsWith(href);
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

      {/* Search button */}
      <button
        data-testid="bottom-nav-search"
        onClick={openSearch}
        className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground transition-colors"
      >
        <Search size={20} />
        <span className="text-xs font-medium">Search</span>
      </button>
    </nav>
  );
}
