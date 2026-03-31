import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useFirestoreProducts } from "@/hooks/useFirestoreProducts";

export default function ShopPage() {
  const { lang } = useAppStore();
  const { products } = useFirestoreProducts();
  const t = translations[lang].shop;

  const handleBuyNow = (product: { name: string; description: string; price: string }) => {
    const message = `Hello, I'm interested in buying this product:\n\nProduct Name: ${product.name}\nDescription: ${product.description}\nPrice: ${product.price}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/201006115163?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-accent" /> {t.title}
      </h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p, i) => (
          <div 
            key={i} 
            className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300 hover:scale-[1.02] animate-slide-up" 
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="relative h-48 sm:h-56 overflow-hidden bg-muted">
              <img 
                src={p.img} 
                alt={p.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="font-heading font-bold text-xl mb-2">{p.name}</h3>
              <p className="text-muted-foreground text-sm mb-4 flex-grow">{p.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <span className="text-accent font-bold text-lg">{p.price}</span>
                <button 
                  onClick={() => handleBuyNow(p)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-md font-semibold flex items-center gap-2 transition-all group-hover:shadow-[0_0_15px_rgba(206,255,26,0.3)]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {lang === 'ar' ? 'شراء الآن' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
