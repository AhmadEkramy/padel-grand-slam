import { useState } from "react";
import { useAppStore, type Booking } from "@/lib/store";
import { useFirestoreBookings } from "@/hooks/useFirestoreBookings";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/lib/translations";
import { X, CheckCircle, Loader2, Tag, Sparkles } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatHour } from "@/lib/utils";

const prices = { "1h": 300, "2h": 500, "3h": 750, vip: 950 };
const durations = { "1h": 1, "2h": 2, "3h": 3, vip: 4 };

interface Props {
  court: 1 | 2;
  startHour: number;
  onClose: () => void;
}

export default function BookingModal({ court, startHour, onClose }: Props) {
  const { lang } = useAppStore();
  const { bookings, addBooking } = useFirestoreBookings();
  const { appUser } = useAuth();
  const t = translations[lang].booking;
  const [name, setName] = useState(appUser?.name || "");
  const [phone, setPhone] = useState(appUser?.phone || "");
  const [type, setType] = useState<Booking["type"]>("1h");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<number | "">("");

  const endHour = startHour + durations[type];
  const today = new Date().toISOString().split("T")[0];

  const hasConflict = () => {
    return bookings
      .filter((b) => b.court === court && b.date === today && b.status !== "rejected")
      .some((b) => {
        return startHour < b.endHour && endHour > b.startHour;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasConflict() || !name || !phone) return;

    setSubmitting(true);
    setError("");

    try {
      const originalPrice = prices[type];
      const discountVal = Number(selectedBadge) || 0;
      const finalPrice = discountVal ? originalPrice * ((100 - discountVal) / 100) : originalPrice;

      await addBooking({
        userId: appUser?.uid || "",
        name,
        phone,
        court,
        type,
        startHour,
        endHour,
        date: today,
        price: finalPrice,
        status: "pending",
      });

      if (discountVal && appUser && appUser.activeBadges) {
        const badges = [...appUser.activeBadges];
        const badgeIdx = badges.indexOf(discountVal);
        if (badgeIdx > -1) {
          badges.splice(badgeIdx, 1);
          await updateDoc(doc(db, "users", appUser.uid), { activeBadges: badges });
          // Force reload after 1.5s to refresh AuthContext if they navigate to profile
          setTimeout(() => window.location.reload(), 1500);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Failed to create booking:", err);
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-slide-up">
      <div className="card-elevated w-full max-w-md max-h-[95vh] overflow-y-auto mx-auto p-6 relative flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 animate-slide-up">
            <CheckCircle className="w-16 h-16 mx-auto text-accent mb-4" />
            <p className="text-lg font-heading font-bold">{t.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-gradient-accent">{t.title}</h2>

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs md:text-sm text-muted-foreground">{t.name}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none focus:glow-accent transition-all duration-300 text-sm" />
            </div>

            <div>
              <label className="text-xs md:text-sm text-muted-foreground">{t.phone}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} required className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">{t.court}</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm">
                  Court {court}
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm text-muted-foreground">{t.type}</label>
                <select value={type} onChange={(e) => setType(e.target.value as Booking["type"])} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300 text-sm">
                  <option value="1h">{t.hour1}</option>
                  <option value="2h">{t.hour2}</option>
                  <option value="3h">{t.hour3}</option>
                  <option value="vip">{t.vip}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">{t.startTime}</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm">
                  {formatHour(startHour)}
                </div>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground">{t.endTime}</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm">
                  {formatHour(endHour)}
                </div>
              </div>
            </div>

            {hasConflict() && (
              <p className="text-sm text-destructive">This time slot conflicts with an existing booking.</p>
            )}

            {(appUser?.activeBadges && appUser.activeBadges.length > 0) && (
              <div className="p-3 rounded-xl border border-accent/30 bg-accent/5">
                <label className="text-xs md:text-sm font-bold flex items-center gap-1.5 mb-1.5 text-accent">
                  <Tag className="w-3.5 h-3.5 border" />
                  {lang === 'ar' ? 'استخدم شارة الخصم' : 'Apply Discount Badge'}
                </label>
                <select
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-accent/20 focus:border-accent focus:outline-none transition-all duration-300 text-sm"
                >
                  <option value="">{lang === 'ar' ? 'بدون خصم' : 'No Discount'}</option>
                  {Array.from(new Set(appUser.activeBadges)).map((discount, idx) => {
                    const count = appUser.activeBadges!.filter(b => b === discount).length;

                    let badgeName = '';
                    if (discount === 10) badgeName = lang === 'ar' ? 'فضية' : 'Silver';
                    else if (discount === 50) badgeName = lang === 'ar' ? 'ذهبية' : 'Golden';
                    else if (discount === 100) badgeName = lang === 'ar' ? 'ماسية' : 'Diamond';

                    return (
                      <option key={idx} value={discount}>
                        {badgeName} ({discount}% OFF) - {count} {lang === 'ar' ? 'متاح' : 'available'}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex justify-between items-center py-2 md:py-3 border-t border-border">
              <span className="font-medium text-sm md:text-base text-muted-foreground">{lang === 'ar' ? 'السعر النهائي:' : 'Total Price:'}</span>
              <span className="font-heading text-lg md:text-xl font-bold text-accent flex items-center gap-1.5">
                {selectedBadge && <Sparkles className="w-4 h-4 text-amber-500" />}
                {selectedBadge ? prices[type] * ((100 - Number(selectedBadge)) / 100) : prices[type]} EGP
                {selectedBadge && <span className="line-through text-xs text-muted-foreground ml-1.5">{prices[type]}</span>}
              </span>
            </div>

            <button
              type="submit"
              disabled={hasConflict() || submitting}
              className="w-full py-2.5 rounded-lg font-heading font-bold gradient-accent text-accent-foreground transition-all duration-300 hover:glow-accent-strong hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
