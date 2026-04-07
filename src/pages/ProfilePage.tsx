import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { useFirestoreBookings } from "@/hooks/useFirestoreBookings";
import { translations } from "@/lib/translations";
import { User, CreditCard, Download, Printer, LogOut, Shield, Loader2, CalendarCheck, Coins, Sparkles, ShoppingBag, Tag, Link2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatHour, formatLocalDate } from "@/lib/utils";
import { Trophy, Clock, Calendar, Banknote, RefreshCw, QrCode, Flame, Award, Crown, Star, Lock } from "lucide-react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const NumberTicker = ({ value }: { value: number | string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const totalDuration = 1000;
    const increment = end / (totalDuration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{typeof value === 'number' ? displayValue.toLocaleString() : value}</>;
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  user: "bg-accent/20 text-accent border-accent/30",
};

export default function ProfilePage() {
  const { lang } = useAppStore();
  const { username } = useParams();
  const { bookings, cancelBooking } = useFirestoreBookings();
  const t = translations[lang].profile;
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterDate, setFilterDate] = useState(formatLocalDate());
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!username) {
        setProfileUser(appUser);
        setProfileLoading(false);
        return;
      }

      if (appUser && appUser.username === username.toLowerCase()) {
        setProfileUser(appUser);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setProfileUser({
            uid: snap.docs[0].id,
            ...data
          });
        } else {
          setProfileUser(null);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [username, appUser]);

  const isOwnProfile = appUser && profileUser && appUser.uid === profileUser.uid;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePhotoUrlSave = async () => {
    if (!photoUrl.trim() || !appUser) return;

    setUploading(true);
    try {
      await updateDoc(doc(db, "users", appUser.uid), { photoURL: photoUrl.trim() });
      setShowUrlInput(false);
      setPhotoUrl("");
      window.location.reload();
    } catch (err) {
      console.error("Failed to save photo URL:", err);
      alert(lang === 'ar' ? 'فشل حفظ رابط الصورة.' : 'Failed to save photo URL.');
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = () => {
    const element = document.getElementById("id-card-print-container");
    if (!element) return;

    // Use a simpler approach: make it visible but transparent/hidden from view
    element.className = "flex flex-col gap-12 p-10 bg-white";
    element.style.opacity = "1";
    element.style.position = "relative";
    element.style.zIndex = "9999";

    const opt = {
      margin: 0,
      filename: `${profileUser?.name}-ID-Card.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Restore original state
      element.className = "hidden print:flex flex-col gap-8 fixed top-0 left-0 w-full z-[-1] bg-white";
      element.style.opacity = "";
      element.style.position = "";
      element.style.zIndex = "";
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 text-center">
        <div className="card-elevated p-8">
          <h2 className="font-heading text-2xl font-bold mb-4">
            {username ? "User not found" : "Please log in to view your profile"}
          </h2>
          <button
            onClick={() => navigate(username ? "/" : "/login")}
            className="px-6 py-3 rounded-lg font-heading font-bold gradient-accent text-accent-foreground transition-all duration-300 hover:glow-accent-strong hover:scale-[1.02]"
          >
            {username ? "Go Home" : "Go to Login"}
          </button>
        </div>
      </div>
    );
  }

  const userBookings = bookings.filter((b) => b.userId === profileUser.uid);
  const acceptedBookings = userBookings.filter((b) => b.status === "accepted");
  const totalPaid = acceptedBookings.reduce((s, b) => s + b.price, 0);
  const padelCoins = acceptedBookings.length - (profileUser.spentCoins || 0);

  const totalHours = acceptedBookings.reduce((s, b) => s + (b.endHour - b.startHour), 0);

  const dayCounts: Record<string, number> = {};
  acceptedBookings.forEach(b => {
    const [y, m, d] = b.date.split("-").map(Number);
    const day = new Date(y, m - 1, d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  let mostPlayedDay = "-";
  let maxCount = 0;
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostPlayedDay = day;
    }
  });

  const buyBadge = async (discountValue: number, cost: number) => {
    if (!isOwnProfile) return;
    if (padelCoins < cost) {
      alert(lang === 'ar' ? "ليس لديك عملات بادل كافية!" : "Not enough Padel Coins!");
      return;
    }
    try {
      setUploading(true);
      const newActiveBadges = [...(profileUser.activeBadges || []), discountValue];
      const newSpentCoins = (profileUser.spentCoins || 0) + cost;

      await updateDoc(doc(db, "users", profileUser.uid), {
        activeBadges: newActiveBadges,
        spentCoins: newSpentCoins
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? "فشلت عملية الشراء" : "Purchase failed");
      setUploading(false);
    }
  };

  const storeItems = [
    { name: 'Silver Badge', arName: 'الشارة الفضية', discount: 10, cost: 10, color: 'text-slate-400', bg: 'from-slate-400/20 to-transparent', border: 'border-slate-400/30', glow: 'hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]' },
    { name: 'Golden Badge', arName: 'الشارة الذهبية', discount: 50, cost: 50, color: 'text-amber-400', bg: 'from-amber-400/20 to-transparent', border: 'border-amber-400/30', glow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]' },
    { name: 'Diamond Badge', arName: 'الشارة الماسية', discount: 100, cost: 100, color: 'text-cyan-400', bg: 'from-cyan-400/20 to-transparent', border: 'border-cyan-400/30', glow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]' },
  ];

  const isCancelDisabled = (dateStr: string, startHour: number) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const startTime = new Date(year, month - 1, day, startHour, 0, 0);
    const diffHours = (startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return diffHours < 5;
  };

  const handleCancel = async (id: string, dateStr: string, startHour: number) => {
    try {
      await cancelBooking(id, dateStr, startHour);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">
          {lang === 'ar' ? `ملف ${profileUser.name}` : `${profileUser.name}'s Profile`}
        </h1>
        {isOwnProfile && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300 font-medium text-sm no-print"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ID Card */}
        <div className="lg:col-span-1 perspective-1000">
          <div
            className={`relative w-full h-[500px] transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            id="id-card"
          >
            {/* Front Side */}
            <div
              id="id-card-front"
              className="absolute inset-0 backface-hidden card-elevated p-6 pb-12 overflow-hidden bg-card border-border/50"
            >
              <div className="absolute top-0 left-0 right-0 h-24 gradient-accent opacity-20" />
              <div className="relative">
                {/* Profile Picture Upload Section */}
                <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={(e) => { e.stopPropagation(); if (isOwnProfile) setShowUrlInput(true); }}>
                  {uploading ? (
                    <div className="w-full h-full rounded-full gradient-primary flex items-center justify-center shadow-lg">
                      <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                    </div>
                  ) : profileUser.photoURL ? (
                    <img src={profileUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-card shadow-lg" />
                  ) : (
                    <div className="w-full h-full rounded-full gradient-primary flex items-center justify-center shadow-lg border-4 border-card">
                      <User className="w-12 h-12 text-primary-foreground" />
                    </div>
                  )}

                  {/* Link Overlay */}
                  {isOwnProfile && !uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Link2 className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-medium px-2 py-0.5 bg-black/30 rounded-full">{lang === 'ar' ? 'رابط' : 'Link'}</span>
                    </div>
                  )}
                </div>

                {/* Photo URL Input Popup */}
                {showUrlInput && (
                  <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-card border border-border rounded-2xl shadow-2xl animate-slide-up">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-heading font-bold text-sm">{lang === 'ar' ? 'رابط الصورة' : 'Photo URL'}</h4>
                      <button onClick={(e) => { e.stopPropagation(); setShowUrlInput(false); setPhotoUrl(''); }} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder={lang === 'ar' ? 'الصق رابط الصورة هنا...' : 'Paste image URL here...'}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300 text-sm mb-3"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    {photoUrl && (
                      <div className="mb-3 flex justify-center">
                        <img src={photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-accent/30" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePhotoUrlSave(); }}
                      disabled={!photoUrl.trim() || uploading}
                      className="w-full py-2 rounded-lg font-bold text-sm gradient-accent text-accent-foreground transition-all duration-300 hover:glow-accent-strong disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {lang === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                  </div>
                )}

                <h3 className="font-heading text-2xl font-bold text-center text-gradient-accent mb-1">{t.idCard}</h3>
                <p className="text-center text-sm font-medium text-muted-foreground mb-3">{profileUser.name}</p>

                {/* Role Badge */}
                <div className="flex justify-center mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColors[profileUser.role] || roleBadgeColors.user}`}>
                    <Shield className="w-3 h-3" />
                    {profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)}
                  </span>
                </div>

                <div className="mt-4 space-y-4 text-sm bg-muted/20 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Name</span><span className="font-medium text-right">{profileUser.name}</span></div>
                  {profileUser.username && <div className="flex justify-between items-center"><span className="text-muted-foreground">Username</span><span className="font-medium text-right text-accent">@{profileUser.username}</span></div>}
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Phone</span><span className="font-medium text-right">{profileUser.phone}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/50"><span className="text-muted-foreground">{t.memberSince}</span><span className="font-medium">{profileUser.memberSince}</span></div>
                </div>

                <div className="mt-6 mb-8 flex justify-center">
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 text-xs font-bold border border-accent/30"
                  >
                    <QrCode className="w-4 h-4" />
                    SHOW QR CODE
                  </button>
                </div>
              </div>
            </div>

            {/* Back Side (QR Code) */}
            <div
              className="absolute inset-0 backface-hidden rotate-y-180 card-elevated p-6 pb-12 flex flex-col items-center justify-center bg-card border-border/50"
            >
              <div className="absolute top-0 left-0 right-0 h-24 gradient-accent opacity-20" />
              <div className="relative flex flex-col items-center w-full">
                <h3 className="font-heading text-xl font-bold text-gradient-accent mb-6">Scan to Visit Profile</h3>

                <div className="mt-12 p-4 bg-white rounded-2xl shadow-xl border-4 border-accent/20">
                  <QRCodeSVG
                    value={`${window.location.origin}/profile/${profileUser.username}`}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <p className="mt-6 text-sm font-medium text-muted-foreground">@{profileUser.username}</p>

                <button
                  onClick={() => setIsFlipped(false)}
                  className="mt-8 flex items-center gap-2 px-6 py-2 rounded-full bg-muted text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 text-xs font-bold border border-border"
                >
                  <RefreshCw className="w-4 h-4" />
                  BACK TO CARD
                </button>
              </div>
            </div>
          </div>

          <div id="id-card-actions" className="flex gap-3 mt-6 no-print">
            <button onClick={handleSavePdf} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center justify-center gap-2 group border border-transparent hover:border-accent/50 shadow-sm">
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> {t.savePdf}
            </button>
            <button onClick={handlePrint} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center justify-center gap-2 group border border-transparent hover:border-accent/50 shadow-sm">
              <Printer className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> {t.print}
            </button>
          </div>

          {/* Special Print/Export Helper (Vertical Layout for Paper) */}
          <div id="id-card-print-container" className="hidden print:flex flex-col gap-8 fixed top-0 left-0 w-full z-[-1] bg-white">
            {/* Front Side Print Version */}
            <div id="id-card-front-print" className="card-elevated p-8 relative overflow-hidden bg-white text-black border-2 border-slate-200 mx-auto w-[350px] h-[500px] flex-shrink-0" style={{ breakAfter: 'page', pageBreakAfter: 'always' }}>
              <div className="absolute top-0 left-0 right-0 h-24 gradient-accent opacity-20" />
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-4">
                  {profileUser.photoURL ? (
                    <img src={profileUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center shadow-lg border-4 border-white">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-heading text-2xl font-bold text-center text-[#110555] mb-1">{t.idCard}</h3>
                <p className="text-center text-sm font-medium text-slate-500 mb-3">{profileUser.name}</p>
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-accent/30 bg-accent/10 text-accent">
                    <Shield className="w-3 h-3" />
                    {profileUser.role.toUpperCase()}
                  </span>
                </div>
                <div className="mt-4 space-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Name</span><span className="font-bold text-right">{profileUser.name}</span></div>
                  {profileUser.username && <div className="flex justify-between items-center"><span className="text-slate-500">Username</span><span className="font-bold text-right text-accent">@{profileUser.username}</span></div>}
                  <div className="flex justify-between items-center"><span className="text-slate-500">Phone</span><span className="font-bold text-right">{profileUser.phone}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200"><span className="text-slate-500">{t.memberSince}</span><span className="font-bold">{profileUser.memberSince}</span></div>
                </div>
              </div>
            </div>

            {/* Back Side Print Version */}
            <div id="id-card-back-print" className="card-elevated p-8 relative overflow-hidden bg-white text-black border-2 border-slate-200 mx-auto w-[350px] h-[500px] flex-shrink-0">
              <div className="absolute top-0 left-0 right-0 h-24 gradient-accent opacity-20" />
              <div className="relative flex flex-col items-center">
                <h3 className="font-heading text-xl font-bold text-[#110555] mb-6">SCAN TO VISIT PROFILE</h3>
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-accent/20">
                  <QRCodeSVG
                    value={`${window.location.origin}/profile/${profileUser.username}`}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="mt-12 text-lg font-bold text-slate-400 uppercase tracking-widest">@{profileUser.username}</p>
                <div className="mt-8 pt-8 border-t border-slate-100 w-full text-center">
                  <p className="text-[10px] text-slate-300">Grand Slam Padel Member Identity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 no-print">
            <div className="card-elevated p-5 text-center animate-slide-up bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30" style={{ animationDelay: "0.2s" }}>
              <Coins className="w-8 h-8 mx-auto text-amber-500 mb-3 drop-shadow-sm" />
              <p className="text-3xl font-heading font-bold text-amber-500 animate-count-up">
                <NumberTicker value={padelCoins} />
              </p>
              <p className="text-sm text-amber-600/80 mt-1 font-medium">{t.padelCoins}</p>
            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-2 no-print space-y-8">
          {/* Smart Stats Section */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-accent animate-pulse" />
              {t.smartStats}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-elevated p-6 flex flex-col items-center text-center bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.totalBookings}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  <NumberTicker value={acceptedBookings.length} />
                </h3>
              </div>

              <div className="card-elevated p-6 flex flex-col items-center text-center bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Banknote className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.totalPaid}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  <NumberTicker value={totalPaid} /> <span className="text-xs">EGP</span>
                </h3>
              </div>

              <div className="card-elevated p-6 flex flex-col items-center text-center bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.totalHours}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  <NumberTicker value={totalHours} />
                </h3>
              </div>

              <div className="card-elevated p-6 flex flex-col items-center text-center bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.mostPlayedDay}</p>
                <h3 className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight truncate w-full">
                  {mostPlayedDay}
                </h3>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="font-heading text-xl font-bold">{t.bookings}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{lang === 'ar' ? 'تصفية بالتاريخ:' : 'Filter by Date:'}</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-foreground border border-border focus:border-accent focus:outline-none transition-all duration-300 text-sm"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            {userBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{lang === 'ar' ? 'لم تقم بأي حجوزات حتى الآن.' : "You haven't made any bookings yet."}</p>
              </div>
            ) : (() => {
              const displayedBookings = userBookings.filter(b => !filterDate || b.date === filterDate);

              if (displayedBookings.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                    <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{lang === 'ar' ? 'لا توجد حجوزات في هذا التاريخ.' : "No bookings found for this date."}</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-2 text-muted-foreground font-medium">Court</th>
                        <th className="text-left py-4 px-2 text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-4 px-2 text-muted-foreground font-medium">Time</th>
                        <th className="text-left py-4 px-2 text-muted-foreground font-medium">Price</th>
                        <th className="text-left py-4 px-2 text-muted-foreground font-medium">{t.status}</th>
                        <th className="text-left py-4 px-2 text-muted-foreground font-medium">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedBookings.map((b) => (
                        <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-2 font-medium">Court {b.court}</td>
                          <td className="py-4 px-2 text-muted-foreground">{b.date}</td>
                          <td className="py-4 px-2 text-muted-foreground">{formatHour(b.startHour)} - {formatHour(b.endHour)}</td>
                          <td className="py-4 px-2 font-medium">{b.price} EGP</td>
                          <td className="py-4 px-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${b.status === "accepted" ? "bg-accent/20 text-accent border border-accent/20" :
                              b.status === "rejected" ? "bg-destructive/20 text-destructive border border-destructive/20" :
                                b.status === "cancelled" ? "bg-gray-500/20 text-gray-500 border border-gray-500/20" :
                                  "bg-sky/20 text-sky border border-sky/20"
                              }`}>
                              {(t as any)[b.status] || b.status}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            {(b.status === "pending" || b.status === "accepted") && (
                              <button
                                onClick={() => handleCancel(b.id, b.date, b.startHour)}
                                disabled={isCancelDisabled(b.date, b.startHour)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20"
                              >
                                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Achievements & Badges Section */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
            <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />
              {t.achievements}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const totalBookings = acceptedBookings.length;

                const badges = [
                  { id: 'firstMatch', icon: <Trophy className="w-6 h-6" />, title: t.firstMatch, desc: t.firstMatchDesc, current: totalBookings, target: 1 },
                  { id: 'tenBookings', icon: <Sparkles className="w-6 h-6" />, title: t.tenBookings, desc: t.tenBookingsDesc, current: totalBookings, target: 10 },
                  { id: 'fiftyMaster', icon: <Award className="w-6 h-6" />, title: t.fiftyMaster, desc: t.fiftyMasterDesc, current: totalBookings, target: 50 },
                  { id: 'hundredKing', icon: <Crown className="w-6 h-6" />, title: t.hundredKing, desc: t.hundredKingDesc, current: totalBookings, target: 100 },
                  { id: 'padelAddict', icon: <Flame className="w-6 h-6" />, title: t.padelAddict, desc: t.padelAddictDesc, current: totalBookings, target: 150 },
                  { id: 'legend', icon: <Star className="w-6 h-6" />, title: t.legend, desc: t.legendDesc, current: totalBookings, target: 250 },
                ];

                return badges.map((badge) => {
                  const isUnlocked = badge.current >= badge.target;
                  const progress = Math.min((badge.current / badge.target) * 100, 100);

                  return (
                    <div
                      key={badge.id}
                      className={`relative group overflow-hidden rounded-2xl border-2 p-5 transition-all duration-500 ${isUnlocked
                        ? "bg-gradient-to-br from-accent/10 to-transparent border-accent shadow-[0_0_20px_rgba(255,51,102,0.1)] hover:shadow-[0_0_30px_rgba(255,51,102,0.2)]"
                        : "bg-muted/30 border-border/50 grayscale"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${isUnlocked ? "bg-accent text-accent-foreground shadow-lg rotate-3" : "bg-muted text-muted-foreground"
                          }`}>
                          {isUnlocked ? badge.icon : <Lock className="w-5 h-5 opacity-50" />}
                        </div>
                        {isUnlocked && (
                          <div className="animate-pulse bg-accent/20 text-accent text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {lang === 'ar' ? 'تم الفتح' : 'Unlocked'}
                          </div>
                        )}
                      </div>

                      <h4 className={`font-heading font-bold text-sm mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-muted-foreground'}`}>
                        {badge.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 min-h-[2rem]">
                        {badge.desc}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className={isUnlocked ? 'text-accent' : 'text-muted-foreground'}>{t.progress}</span>
                          <span className={isUnlocked ? 'text-slate-900 dark:text-white' : 'text-muted-foreground'}>
                            {badge.current} / {badge.target}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/30">
                          <div
                            className={`h-full transition-all duration-1000 ease-out ${isUnlocked ? 'bg-gradient-to-r from-accent to-pink-500' : 'bg-slate-400'
                              }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Sparkle effects for unlocked items */}
                      {isUnlocked && (
                        <>
                          <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
                          <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-accent rounded-full animate-bounce opacity-50" />
                        </>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Discount Store & Active Badges */}
      {isOwnProfile && (
        <div className="mt-12 no-print animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="w-8 h-8 text-accent" />
            <h2 className="font-heading text-2xl font-bold">{lang === 'ar' ? 'متجر الخصومات' : 'Discount Store'}</h2>
          </div>

          {/* Active badges */}
          {(profileUser.activeBadges && profileUser.activeBadges.length > 0) && (
            <div className="mb-8 p-6 bg-card border border-border rounded-xl shadow-sm">
              <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-accent" />
                {lang === 'ar' ? 'شاراتك النشطة' : 'Your Active Badges'}
              </h3>
              <div className="flex flex-wrap gap-3">
                {profileUser.activeBadges.map((badge, idx) => {
                  const storeItem = storeItems.find(item => item.discount === badge);
                  if (!storeItem) return null;
                  return (
                    <div key={idx} className={`px-4 py-2 rounded-lg border font-medium flex items-center gap-2 bg-gradient-to-r opacity-90 ${storeItem.bg} ${storeItem.border} ${storeItem.color}`}>
                      <Sparkles className="w-4 h-4" />
                      {lang === 'ar' ? storeItem.arName : storeItem.name} ({badge}%)
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {lang === 'ar' ? 'ستتمكن من استخدامها في الحجز القادم.' : 'You can use them on your next booking.'}
              </p>
            </div>
          )}

          {/* Store Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {storeItems.map((item, idx) => (
              <div key={idx} className={`relative overflow-hidden card-elevated p-6 border transition-all duration-300 ${item.border} ${item.glow}`}>
                <div className={`absolute inset-0 bg-gradient-to-br opacity-50 ${item.bg}`} />
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-background border shadow-inner ${item.color}`}>
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className={`font-heading text-xl font-bold text-center mb-1 ${item.color}`}>
                    {lang === 'ar' ? item.arName : item.name}
                  </h3>
                  <p className="text-center font-bold text-2xl mb-4">{item.discount}% <span className="text-sm font-medium text-muted-foreground">OFF</span></p>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 font-bold text-amber-500">
                      <Coins className="w-5 h-5" />
                      {item.cost}
                    </div>
                    <button
                      onClick={() => buyBadge(item.discount, item.cost)}
                      disabled={padelCoins < item.cost || uploading}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${padelCoins >= item.cost ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                    >
                      {lang === 'ar' ? 'شراء' : 'Buy'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
