import { useFirestoreProducts } from "@/hooks/useFirestoreProducts";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PadelShopSection() {
  const { lang } = useAppStore();
  const { products, loading } = useFirestoreProducts();
  const t = translations[lang].shop;

  if (loading || products.length === 0) return null;

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-accent" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              {t.title}
            </h2>
          </div>
          <Link 
            to="/shop" 
            className="flex items-center gap-2 text-accent font-bold hover:text-accent/80 transition-colors group"
          >
            {lang === "en" ? "View All Products" : "عرض كل المنتجات"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0, 4).map((p, idx) => (
            <div 
              key={p.id} 
              className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300 animate-slide-up bg-white dark:bg-slate-800/50"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="relative h-56 overflow-hidden bg-muted">
                <img 
                  src={p.img} 
                  alt={p.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-heading font-bold text-lg mb-1 dark:text-white">{p.name}</h3>
                <p className="text-accent font-black text-xl mb-3">{p.price}</p>
                <p className="text-muted-foreground text-sm mb-6 line-clamp-2">{p.description}</p>
                
                <button 
                  onClick={() => {
                    const message = `Hello, I'm interested in buying this product:\n\nProduct Name: ${p.name}\nDescription: ${p.description}\nPrice: ${p.price}`;
                    const encodedMessage = encodeURIComponent(message);
                    window.open(`https://wa.me/201006115163?text=${encodedMessage}`, '_blank');
                  }}
                  className="w-full mt-auto py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm uppercase hover:bg-accent/90 transition-all shadow-lg active:scale-95"
                >
                  {t.buyNow}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
