import { useState } from "react";
import { useFirestoreChampionships } from "@/hooks/useFirestoreChampionships";
import { useFirestoreChampionshipRequests } from "@/hooks/useFirestoreChampionshipRequests";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/lib/translations";
import { Trophy, Calendar, Clock, Users, X, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { Championship } from "@/hooks/useFirestoreChampionships";

export default function ChampionshipsSection() {
  const { lang } = useAppStore();
  const { appUser } = useAuth();
  const { championships, loading: champsLoading } = useFirestoreChampionships();
  const { requests, addRequestFirestore, loading: reqsLoading } = useFirestoreChampionshipRequests();
  
  const [registeringChamp, setRegisteringChamp] = useState<Championship | null>(null);
  const [name, setName] = useState(appUser?.name || "");
  const [phone, setPhone] = useState(appUser?.phone || "");
  const [teamSelection, setTeamSelection] = useState<string>("");

  if (champsLoading || reqsLoading || championships.length === 0) return null;

  const handleOpenRegistration = (champ: Championship) => {
    if (!appUser) {
      toast({
        title: lang === "en" ? "Authentication Required" : "مطلوب تسجيل الدخول",
        description: lang === "en" ? "Please log in to register." : "يرجى تسجيل الدخول للتسجيل.",
        variant: "destructive"
      });
      return;
    }
    setRegisteringChamp(champ);
    setName(appUser.name || "");
    setPhone(appUser.phone || "");
    setTeamSelection("");
  };

  const submitRegistration = async () => {
    if (!registeringChamp || !name || !phone || !teamSelection || !appUser) return;

    try {
      await addRequestFirestore({
        userId: appUser.uid,
        userName: name,
        phone,
        championshipId: registeringChamp.id,
        championshipTitle: registeringChamp.title,
        teamName: teamSelection
      });

      // Redirect to WhatsApp
      const msg = `Hello, I want to register for a Championship!\n\nChampionship: ${registeringChamp.title}\nName: ${name}\nPhone: ${phone}\nTeam: ${teamSelection}`;
      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/201006115163?text=${encoded}`, '_blank');
      
      toast({
        title: lang === "en" ? "Request Sent!" : "تم إرسال الطلب!",
        description: lang === "en" ? "Your registration request is pending." : "طلب التسجيل الخاص بك قيد الانتظار.",
      });

      setRegisteringChamp(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to submit request.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <Trophy className="w-10 h-10 text-accent" />
          <h2 className="font-heading text-4xl md:text-5xl font-black text-center">
            {lang === "en" ? "Championships" : "البطولات"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {championships.map((champ, idx) => {
            // Find user's request for this champ
            const userReq = appUser ? requests.find(r => r.championshipId === champ.id && r.userId === appUser.uid) : null;
            

            return (
              <div 
                key={champ.id} 
                className="card-elevated group overflow-hidden flex flex-col md:flex-row hover:glow-accent transition-all duration-300 animate-slide-up bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="md:w-2/5 relative h-64 md:h-auto overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={champ.img} 
                    alt={champ.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:hidden" />
                </div>
                
                <div className="p-6 md:w-3/5 flex flex-col flex-grow relative">
                  <h3 className="font-heading font-black text-2xl mb-2 text-slate-800 dark:text-white uppercase tracking-tight">{champ.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed flex-grow">{champ.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-accent" /> {champ.date}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-accent" /> {champ.time}
                    </div>
                  </div>

                  {/* Teams and Accepted Players */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                      <Users className="w-4 h-4" /> Teams Playing
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {champ.teams && champ.teams.map(teamName => {
                        const teamPlayers = requests.filter(r => r.championshipId === champ.id && r.teamName === teamName && r.status === "accepted");
                        return (
                          <div key={teamName}>
                            <div className="font-bold text-accent mb-2">{teamName}</div>
                            {teamPlayers.length > 0 ? (
                              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                                {teamPlayers.map(p => <li key={p.id} className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-success" /> {p.userName}</li>)}
                              </ul>
                            ) : (
                              <span className="text-xs text-slate-400">No players yet</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {userReq ? (
                    <div className={`py-4 rounded-xl font-bold text-sm text-center uppercase tracking-wider border-2 ${
                      userReq.status === 'accepted' ? 'bg-success/10 text-success border-success/20' : 
                      userReq.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {userReq.status === 'accepted' ? '✅ Registration Accepted' : 
                       userReq.status === 'rejected' ? '❌ Registration Rejected' : 
                       '⏳ Pending Approval'}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleOpenRegistration(champ)}
                      className="w-full mt-auto py-4 rounded-xl bg-accent text-accent-foreground font-black text-sm uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      {lang === "en" ? "Register 🏆" : "سجل الآن 🏆"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Modal */}
      {registeringChamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 relative">
            <button
              onClick={() => setRegisteringChamp(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
             >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6 pr-8">
              Register for <span className="text-accent">{registeringChamp.title}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Phone Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Select Your Team</label>
                <select 
                  value={teamSelection} 
                  onChange={e => setTeamSelection(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors appearance-none"
                  required
                >
                  <option value="" disabled>Choose a team...</option>
                  {registeringChamp.teams && registeringChamp.teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={submitRegistration}
                disabled={!name || !phone || !teamSelection}
                className="w-full mt-6 py-4 rounded-xl bg-accent text-accent-foreground font-black text-sm uppercase hover:bg-accent/90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit & WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
