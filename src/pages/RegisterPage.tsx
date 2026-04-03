import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { lang } = useAppStore();
  const t = translations[lang].auth;
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, phone, username);
      navigate("/profile");
    } catch (err: any) {
      if (err.message === "Username is already taken") {
        setError(lang === "ar" ? "اسم المستخدم محجوز بالفعل" : "Username is already taken");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card-elevated w-full max-w-md p-8 animate-slide-up">
        <h1 className="font-heading text-3xl font-bold text-gradient-accent mb-6">{t.register}</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-slide-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">{t.fullName}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t.username}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t.phone}</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} 
              required 
              className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300" 
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted/50 border border-border focus:border-accent focus:outline-none transition-all duration-300" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-heading font-bold gradient-accent text-accent-foreground transition-all duration-300 hover:glow-accent-strong hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t.registerBtn}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          {t.hasAccount} <Link to="/login" className="text-accent hover:underline">{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
