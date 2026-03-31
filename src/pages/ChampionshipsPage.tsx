import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Trophy, Calendar, Clock, Users, Loader2, X, CheckCircle } from "lucide-react";
import { useFirestoreChampionships } from "@/hooks/useFirestoreChampionships";
import { useFirestoreChampionshipRequests } from "@/hooks/useFirestoreChampionshipRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ChampionshipsPage() {
  const { lang } = useAppStore();
  const navigate = useNavigate();
  const t = translations[lang].champs;
  const common = translations[lang];
  const { championships, loading: champsLoading } = useFirestoreChampionships();
  const { requests, addRequestFirestore } = useFirestoreChampionshipRequests();
  const { appUser } = useAuth();
  
  const [selectedChamp, setSelectedChamp] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!appUser) {
      toast.error(lang === 'ar' ? "يرجى تسجيل الدخول للمشاركة" : "Please login to register");
      return;
    }

    if (!selectedTeam) {
      toast.error(lang === 'ar' ? "يرجى اختيار فريق" : "Please select a team");
      return;
    }

    setIsSubmitting(true);
    try {
      await addRequestFirestore({
        userId: appUser.uid,
        userName: appUser.name,
        phone: appUser.phone || "",
        championshipId: selectedChamp.id,
        championshipTitle: selectedChamp.title,
        teamName: selectedTeam,
      });

      // WhatsApp Redirect
      const msg = `Hello, I want to register for a Championship!\n\nChampionship: ${selectedChamp.title}\nName: ${appUser.name}\nPhone: ${appUser.phone}\nTeam: ${selectedTeam}`;
      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/201006115163?text=${encoded}`, '_blank');

      toast.success(lang === 'ar' ? "تم إرسال طلب الانضمام بنجاح" : "Registration request sent successfully");
      setSelectedChamp(null);
      setSelectedTeam("");
    } catch (error) {
      console.error("Error registering:", error);
      toast.error(lang === 'ar' ? "حدث خطأ أثناء التسجيل" : "Error during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-black flex items-center gap-4 tracking-tight">
          <Trophy className="w-10 h-10 text-accent animate-bounce-slow" /> {t.title}
        </h1>
        <p className="text-muted-foreground font-medium max-w-md">
          {lang === 'ar' ? "انضم إلى أقوى البطولات ونافس أفضل لاعبي البادل في جراند سلام." : "Join the most prestigious tournaments and compete with top padel players at Grand Slam."}
        </p>
      </div>

      {champsLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <p className="text-muted-foreground font-bold animate-pulse">{lang === 'ar' ? "جاري تحميل البطولات..." : "Loading tournaments..."}</p>
        </div>
      ) : championships.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted flex flex-col items-center">
          <Trophy className="w-16 h-16 text-muted mb-4 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">{t.comingSoon}</h2>
          <p className="text-muted-foreground">{lang === 'ar' ? "لا توجد بطولات متاحة حالياً. تابعنا للمزيد!" : "No tournaments available right now. Stay tuned!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {championships.map((c, i) => {
             const userReq = appUser ? requests.find(r => r.championshipId === c.id && r.userId === appUser.uid) : null;

             return (
              <div 
                key={c.id} 
                className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={c.img || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80"} 
                    alt={c.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex gap-2 mb-3">
                      <span className="bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                        {lang === 'ar' ? "بطولة" : "Championship"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight line-clamp-1">{c.title}</h3>
                  </div>
                </div>
                
                <div className="p-8 pb-10">
                  <p className="text-muted-foreground text-sm font-medium mb-8 line-clamp-2 leading-relaxed h-10">
                    {c.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <Calendar className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">{lang === 'ar' ? "التاريخ" : "Date"}</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{c.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <Clock className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">{lang === 'ar' ? "الوقت" : "Time"}</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{c.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <Users className="w-4 h-4" /> {lang === 'ar' ? "الفرق المشاركة" : "Participating Teams"}
                      </span>
                      <span className="text-[10px] font-black bg-accent/10 text-accent px-2 py-0.5 rounded-lg">{c.teams?.length || 0} {lang === 'ar' ? "فرق" : "Teams"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.teams?.map((team: string, idx: number) => (
                        <span key={idx} className="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>

                  {userReq ? (
                    <div className={`w-full py-4 rounded-2xl font-black text-sm text-center uppercase tracking-widest border-2 transition-all duration-300 ${
                      userReq.status === 'accepted' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                      userReq.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                      'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse'
                    }`}>
                      {userReq.status === 'accepted' ? (lang === 'ar' ? '✅ تم قبول التسجيل' : '✅ Registration Accepted') : 
                       userReq.status === 'rejected' ? (lang === 'ar' ? '❌ تم رفض التسجيل' : '❌ Registration Rejected') : 
                       (lang === 'ar' ? '⏳ قيد الانتظار' : '⏳ Pending Approval')}
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedChamp(c)}
                      className="w-full py-4 rounded-2xl bg-accent text-accent-foreground font-black text-sm uppercase tracking-widest hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {lang === 'ar' ? "سجل الآن" : "Register Now"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      {selectedChamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">{lang === 'ar' ? "تسجيل في البطولة" : "Register for Tournament"}</h3>
                  <p className="text-sm text-accent font-bold uppercase tracking-widest">{selectedChamp.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedChamp(null)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!appUser ? (
              <div className="text-center py-8">
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 mb-8">
                  <p className="font-bold text-lg mb-2">{lang === 'ar' ? "يلزم تسجيل الدخول" : "Login Required"}</p>
                  <p className="text-sm opacity-80">{lang === 'ar' ? "يرجى تسجيل الدخول أولاً لتتمكن من التسجيل في هذه البطولة." : "Please login first to be able to register for this championship."}</p>
                </div>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                  {translations[lang].nav.login}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-4">
                   <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">{lang === 'ar' ? "اللاعب" : "Player"}</p>
                    <p className="font-bold bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{appUser.name}</p>
                   </div>
                   <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">{lang === 'ar' ? "رقم الهاتف" : "Phone Number"}</p>
                    <p className="font-bold bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{appUser.phone || "N/A"}</p>
                   </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block px-1">
                    {lang === 'ar' ? "اختر الفريق للمنافسة" : "Select Team to Compete"}
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedChamp.teams?.map((team: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTeam(team)}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                          selectedTeam === team 
                            ? "border-accent bg-accent/5 shadow-inner" 
                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200"
                        }`}
                      >
                        <span className={`font-black uppercase tracking-tight ${selectedTeam === team ? "text-accent" : "text-slate-600 dark:text-slate-400"}`}>
                          {team}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedTeam === team ? "border-accent bg-accent text-white" : "border-slate-200"
                        }`}>
                          {selectedTeam === team && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                    {lang === 'ar' 
                      ? "بعد الإرسال، سيقوم المشرف بمراجعة طلبك وتأكيده. ستتلقى إشعاراً عند القبول." 
                      : "After submission, an admin will review your request. You will receive a confirmation once accepted."}
                  </p>
                </div>

                <button 
                  onClick={handleRegister}
                  disabled={isSubmitting || !selectedTeam}
                  className="w-full py-5 rounded-[2rem] bg-accent text-accent-foreground font-black text-sm uppercase tracking-widest hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {lang === 'ar' ? "جاري الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {lang === 'ar' ? "تأكيد التسجيل" : "Confirm Registration"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
