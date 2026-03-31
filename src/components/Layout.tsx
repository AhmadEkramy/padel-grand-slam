import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/lib/translations";
import { Moon, Sun, Globe, Menu, X, MessageCircle } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, dark, toggleDark } = useAppStore();
  const { appUser } = useAuth();
  const t = translations[lang].nav;
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build nav items dynamically based on auth state and role
  const navItems: { key: string; path: string }[] = [
    { key: "home", path: "/" },
    { key: "court", path: "/court" },
    { key: "shop", path: "/shop" },
    { key: "championships", path: "/championships" },
  ];

  // Show admin for admin/moderator
  if (appUser && (appUser.role === "admin" || appUser.role === "moderator")) {
    navItems.push({ key: "admin", path: "/admin" });
  }

  // Show profile or login based on auth
  if (appUser) {
    navItems.push({ key: "profile", path: "/profile" });
  } else {
    navItems.push({ key: "login", path: "/login" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Grand Slam Logo" className="w-10 h-10 object-contain" />
            <span className="font-heading text-2xl font-bold text-gradient-accent hidden sm:inline-block">
              Grand Slam
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(({ key, path }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={key}
                  to={path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${active
                    ? "bg-accent/10 text-accent glow-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {(t as any)[key]}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lang === "en"
                  ? "bg-accent text-accent-foreground glow-accent"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lang === "ar"
                  ? "bg-accent text-accent-foreground glow-accent"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                AR
              </button>
            </div>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
              title="Toggle Dark Mode"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-slide-up">
            <div className="container mx-auto p-4 flex flex-col gap-1">
              {navItems.map(({ key, path }) => (
                <Link
                  key={key}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === path
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {(t as any)[key]}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/201006115163"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-[0_0_15px_rgba(37,211,102,0.8)] transition-all duration-300 hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
