import { useFirestoreTrainings } from "@/hooks/useFirestoreTrainings";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Dumbbell, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function TrainingSection() {
  const { lang } = useAppStore();
  const { trainings, loading } = useFirestoreTrainings();
  const { appUser } = useAuth();
  
  if (loading || trainings.length === 0) return null;

  return (
    <section className="py-16 bg-muted/5 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-accent" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              {lang === "en" ? "Training Programs" : "برامج التدريب"}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainings.map((t, idx) => (
            <div 
              key={t.id} 
              className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300 animate-slide-up bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div className="relative h-60 overflow-hidden bg-muted">
                <img 
                  src={t.img} 
                  alt={t.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border font-black text-lg text-accent shadow-lg">
                  {t.price} EGP
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-heading font-bold text-xl mb-3 dark:text-white">{t.title}</h3>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed flex-grow">{t.description}</p>
                
                <button 
                  onClick={() => {
                    const userInfo = appUser ? `\nMy Info: ${appUser.name} (${appUser.phone})` : "";
                    const message = `Hello, I want to subscribe to this training:\n\nTitle: ${t.title}\nDescription: ${t.description}\nPrice: ${t.price} EGP${userInfo}`;
                    const encodedMessage = encodeURIComponent(message);
                    window.open(`https://wa.me/201006115163?text=${encodedMessage}`, '_blank');
                  }}
                  className="w-full mt-auto py-4 rounded-xl bg-accent text-accent-foreground font-black text-sm uppercase tracking-wide hover:bg-accent/90 transition-all shadow-[0_4px_14px_0_rgba(206,255,26,0.39)] hover:shadow-[0_6px_20px_rgba(206,255,26,0.23)] hover:-translate-y-1 active:scale-[0.98]"
                >
                  {lang === "en" ? "Subscribe Now" : "اشترك الآن"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
