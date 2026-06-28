import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Tv, BookOpen, Search, ChevronDown, TrendingUp, Calendar, Zap, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchModal from "./SearchModal";

const browseItems = [
  { icon: TrendingUp, label: "Trending This Week", href: "/anime" },
  { icon: Star, label: "Top Rated", href: "/anime" },
  { icon: Calendar, label: "Currently Airing", href: "/anime" },
  { icon: Zap, label: "New Releases", href: "/anime" },
  { icon: BookOpen, label: "Browse Manga", href: "/manga" },
];

export default function TopNav() {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const browseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    const eventHandler = () => setSearchOpen(true);
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("aniexplore:open-search", eventHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("aniexplore:open-search", eventHandler);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) {
        setBrowseOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAnimeActive = location === "/" || location.startsWith("/anime") || location.startsWith("/watch");
  const isMangaActive = location.startsWith("/manga");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto flex items-center h-16 px-4 md:px-6 gap-2 md:gap-3">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer select-none mr-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-[0_0_14px_rgba(201,154,31,0.45)]">
                <Flame size={15} className="text-white fill-white" />
              </div>
              <span className="text-xl font-black tracking-tight hidden sm:block">
                <span className="text-white">Ani</span><span className="text-gradient">explore</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {/* Browse dropdown */}
            <div ref={browseRef} className="relative">
              <button
                onClick={() => setBrowseOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  browseOpen
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                Browse
                <ChevronDown
                  size={13}
                  className={cn("transition-transform duration-200", browseOpen && "rotate-180")}
                />
              </button>

              {browseOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-[#0d0a06] border border-amber-400/12 shadow-2xl py-1.5 overflow-hidden animate-scale-in">
                  {browseItems.map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}>
                      <div
                        onClick={() => setBrowseOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <Icon size={14} className="flex-shrink-0" />
                        {label}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/anime">
              <div
                data-testid="nav-anime"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  isAnimeActive && !location.startsWith("/manga")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Tv size={14} />
                Anime
              </div>
            </Link>

            <Link href="/manga">
              <div
                data-testid="nav-manga"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  isMangaActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <BookOpen size={14} />
                Manga
              </div>
            </Link>
          </nav>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Desktop search bar */}
            <button
              data-testid="search-trigger"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all text-sm min-w-[160px]"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Mobile search icon */}
            <button
              data-testid="search-trigger-mobile"
              onClick={() => setSearchOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
