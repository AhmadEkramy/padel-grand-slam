import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import CourtAvailability from "@/components/CourtAvailability";
import BookingModal from "@/components/BookingModal";
import Packages from "@/components/Packages";
import SponsorsSection from "@/components/SponsorsSection";
import PadelShopSection from "@/components/PadelShopSection";
import TrainingSection from "@/components/TrainingSection";
import ChampionshipsSection from "@/components/ChampionshipsSection";
import Footer from "@/components/Footer";
export default function Index() {
  const { lang } = useAppStore();
  const t = translations[lang].hero;
  const ct = translations[lang].court;
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const [bookingState, setBookingState] = useState<{ court: 1 | 2; hour: number; date: string } | null>(null);

  const handleSelectSlot = (court: 1 | 2, hour: number, date: string) => {
    if (!appUser) {
      navigate("/login");
      return;
    }
    setBookingState({ court, hour, date });
  };

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/court") {
      setTimeout(() => {
        document.getElementById("courts")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.pathname]);

  const scrollToCourts = () => {
    document.getElementById("courts")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(248,100%,18%)] via-[hsl(215,100%,24%)] to-[hsl(197,73%,40%)]">
        {/* Decorative elements */}
        {/* Circles */}
        <div className="absolute top-16 left-8 w-28 h-28 rounded-full border-2 border-white/15 animate-float" />
        <div className="absolute top-24 left-12 w-16 h-16 rounded-full border-2 border-white/10" />
        <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full border-2 border-white/10 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-[25%] w-12 h-12 rounded-full bg-white/10" />
        {/* Diamond shapes */}
        <div className="absolute bottom-24 left-28 w-10 h-10 border-2 border-white/10 rotate-45" />
        <div className="absolute top-1/3 right-16 w-14 h-14 border-2 border-white/8 rotate-45" />
        {/* Court outline top-right */}
        <div className="absolute top-8 right-8 w-40 h-28 border-2 border-white/8 rounded-sm opacity-50">
          <div className="absolute inset-2 border border-white/5 rounded-sm" />
        </div>
        {/* Padel racket outline bottom-right */}
        <div className="absolute bottom-16 right-24 w-8 h-8 border-2 border-white/10 rotate-12 rounded-full" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 animate-slide-up max-w-4xl mx-auto">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            {lang === "en" ? "Welcome to the Grand Slam Padel Academy" : "مرحبًا بك في أكاديمية جراند سلام للبادل"}
          </h1>
          <p className="text-white/70 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {lang === "en"
              ? "Book your court today and enjoy playing padel on the best courts in Damietta Governorate inside the arena."
              : "احجز ملعبك اليوم واستمتع بلعب البادل على أفضل الملاعب في محافظة دمياط داخل الأرينا."}
          </p>
          <button
            onClick={scrollToCourts}
            className="px-10 py-4 rounded-full font-heading font-bold text-lg bg-accent text-accent-foreground transition-all duration-300 hover:glow-accent-strong hover:scale-105 animate-glow-pulse inline-flex items-center gap-2"
          >
            {t.cta}
          </button>
        </div>

        {/* Court illustrations at bottom */}
        <div className="relative z-10 mt-16 flex gap-8 px-4">
          {([1, 2] as const).map((court) => (
            <div
              key={court}
              className="w-44 h-32 md:w-56 md:h-36 rounded-xl bg-[hsl(215,100%,24%)]/80 border border-white/20 backdrop-blur-sm relative overflow-hidden shadow-lg"
            >
              {/* Court lines */}
              <div className="absolute inset-3 border border-white/30 rounded-sm" />
              <div className="absolute top-3 bottom-3 left-1/2 w-px bg-white/30" />
              <div className="absolute top-1/2 left-3 right-3 h-px bg-white/20" />
              {/* Label */}
              <div className="absolute bottom-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
                {court === 1 ? ct.court1 : ct.court2}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SponsorsSection />

      {/* Court Availability */}
      <div id="courts">
        <CourtAvailability onSelectSlot={handleSelectSlot} />
      </div>

      <Packages />

      <PadelShopSection />

      <TrainingSection />

      <ChampionshipsSection />

      <Footer />

      {bookingState && (
        <BookingModal
          court={bookingState.court}
          startHour={bookingState.hour}
          date={bookingState.date}
          onClose={() => setBookingState(null)}
        />
      )}
    </>
  );
}
