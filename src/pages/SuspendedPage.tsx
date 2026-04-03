import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Ban, LogOut, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SuspendedPage() {
  const { lang } = useAppStore();
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!appUser?.isSuspended) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full card-elevated p-8 text-center animate-slide-up border-destructive/30">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Ban className="w-10 h-10 text-destructive animate-pulse" />
        </div>
        
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-4">
          {lang === 'ar' ? 'تم تعليق الحساب' : 'Account Suspended'}
        </h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {lang === 'ar' 
            ? 'نعتذر منك، لقد تم تعليق حسابك من قبل الإدارة. يرجى التواصل مع الدعم الفني للاستفسار أو حل المشكلة.' 
            : 'We are sorry, your account has been suspended by the administration. Please contact support to resolve this issue.'}
        </p>

        <div className="space-y-4">
          <a 
            href="https://wa.me/201006115163" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <MessageSquare className="w-5 h-5" />
            {lang === 'ar' ? 'تواصل مع الدعم عبر واتساب' : 'Contact Support via WhatsApp'}
          </a>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
