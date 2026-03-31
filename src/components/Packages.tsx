import { Clock, Check, Star } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";

export default function Packages() {
    const { lang } = useAppStore();
    const t = translations[lang].packages;

    const packages = [
        {
            hours: t.hour1,
            price: t.price1,
            type: "1h",
            isVip: false,
        },
        {
            hours: t.hour2,
            price: t.price2,
            type: "2h",
            isVip: false,
        },
        {
            hours: t.hour3,
            price: t.price3,
            type: "3h",
            isVip: false,
        },
        {
            hours: t.hour4,
            price: t.price4,
            type: "vip",
            isVip: true,
        },
    ];

    return (
        <section className="py-20 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-16 animate-slide-up">
                    <h2 className="text-4xl md:text-5xl font-black text-primary mb-4">
                        {t.title}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {packages.map((pkg, idx) => (
                        <div
                            key={idx}
                            className={`relative p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 group ${pkg.isVip
                                ? "border-accent bg-accent/5 glow-accent"
                                : "border-border hover:border-primary/30 hover:shadow-xl bg-card"
                                }`}
                        >
                            {pkg.isVip && (
                                <div className="absolute top-4 right-4 bg-[#2edea6] text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                                    <span className="text-[8px] leading-none">↓</span>
                                    {t.vip}
                                </div>
                            )}

                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className={`w-6 h-6 ${pkg.isVip ? "text-[#2edea6]" : "text-[#2edea6]"}`} />
                                    <h3 className="text-2xl font-black text-[#110555]">
                                        {pkg.hours}
                                    </h3>
                                </div>

                                <div className="mb-6 flex flex-col items-center">
                                    <span className="text-6xl font-black text-[#110555] leading-tight">
                                        {pkg.price}
                                    </span>
                                    <span className="text-[#a0a4ae] text-sm font-bold uppercase tracking-widest">{t.currency}</span>
                                </div>

                                <button
                                    onClick={() => document.getElementById("courts")?.scrollIntoView({ behavior: "smooth" })}
                                    className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 transform shadow-md hover:scale-[1.02] active:scale-95 ${pkg.isVip
                                        ? "bg-gradient-to-r from-[#51e29e] to-[#25bed4] text-white"
                                        : "bg-[#110555] text-white hover:bg-[#1a0888]"
                                        }`}
                                >
                                    {t.cta}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
