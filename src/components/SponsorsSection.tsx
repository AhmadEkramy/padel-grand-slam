import { useFirestoreSponsors } from "@/hooks/useFirestoreSponsors";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { ExternalLink } from "lucide-react";

export default function SponsorsSection() {
  const { sponsors, loading } = useFirestoreSponsors();
  const { lang } = useAppStore();

  if (loading || sponsors.length === 0) return null;

  return (
    <section className="py-16 bg-muted/10">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-10 text-center animate-slide-up">
          {lang === 'en' ? 'Our Sponsors' : 'رعاتنا'}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sponsors.map((sponsor, idx) => (
            <div 
              key={sponsor.id} 
              className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300 hover:scale-[1.02] animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="relative h-48 overflow-hidden bg-muted flex-shrink-0">
                <img 
                  src={sponsor.img || 'https://via.placeholder.com/400x200?text=Sponsor'} 
                  alt={sponsor.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-heading font-bold text-xl mb-2 text-slate-800 dark:text-white">{sponsor.title}</h3>
                <p className="text-muted-foreground text-sm mb-6 flex-grow">{sponsor.description}</p>
                
                {sponsor.link ? (
                  <a 
                    href={sponsor.link.startsWith('http') ? sponsor.link : `https://${sponsor.link}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-lg bg-accent/10 border border-accent/30 text-accent font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(206,255,26,0.3)]"
                  >
                    {lang === 'en' ? 'View Details' : 'عرض التفاصيل'}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button 
                    disabled 
                    className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm uppercase tracking-wider opacity-70 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {lang === 'en' ? 'View Details' : 'عرض التفاصيل'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
