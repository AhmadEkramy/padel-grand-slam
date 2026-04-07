import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { useFirestoreBookings } from "@/hooks/useFirestoreBookings";
import { useFirestoreUsers } from "@/hooks/useFirestoreUsers";
import { useFirestoreProducts } from "@/hooks/useFirestoreProducts";
import { useFirestoreSponsors } from "@/hooks/useFirestoreSponsors";
import { useFirestoreTrainings } from "@/hooks/useFirestoreTrainings";
import { useFirestoreChampionships } from "@/hooks/useFirestoreChampionships";
import { useFirestoreChampionshipRequests } from "@/hooks/useFirestoreChampionshipRequests";
import { translations } from "@/lib/translations";
import { DollarSign, CalendarCheck, Trophy, Package, Users, TrendingUp, Check, X, Trash2, ShieldAlert, Loader2, Search, Filter, Ban, BadgePercent, CheckCircle, Sparkles, HeartHandshake, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isThisWeek, isThisMonth, parseISO, subMonths, isSameMonth, startOfMonth, endOfMonth, format, subDays } from "date-fns";
import { formatHour, formatLocalDate } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, FileSpreadsheet, FileText, PieChart } from "lucide-react";
import type { UserRole } from "@/contexts/AuthContext";

const statIcons = [DollarSign, TrendingUp, TrendingUp, DollarSign, CalendarCheck, Trophy, Package, Users];

const BADGE_TYPES = [
  { id: 10, key: 'silver', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  { id: 50, key: 'golden', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 100, key: 'diamond', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

export default function AdminPage() {
  const { lang } = useAppStore();
  const { bookings, loading: bookingsLoading, updateBookingStatus, removeBooking } = useFirestoreBookings();
  const { users, loading: usersLoading, updateUserRole, deleteUser, toggleSuspension, updateBadges } = useFirestoreUsers();
  const { products, loading: productsLoading, addProductFirestore, updateProductFirestore, removeProductFirestore } = useFirestoreProducts();
  const { sponsors, loading: sponsorsLoading, addSponsorFirestore, updateSponsorFirestore, removeSponsorFirestore } = useFirestoreSponsors();
  const { trainings, loading: trainingsLoading, addTrainingFirestore, updateTrainingFirestore, removeTrainingFirestore } = useFirestoreTrainings();
  const { championships, loading: champsLoading, addChampionshipFirestore, updateChampionshipFirestore, removeChampionshipFirestore } = useFirestoreChampionships();
  const { requests, loading: reqsLoading, updateRequestStatusFirestore, removeRequestFirestore } = useFirestoreChampionshipRequests();
  const t = translations[lang].admin;
  const { appUser, loading } = useAuth();
  const navigate = useNavigate();

  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState(formatLocalDate());
  const [filterCourt, setFilterCourt] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUserForBadge, setSelectedUserForBadge] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [userDeleteConfirm, setUserDeleteConfirm] = useState<string | null>(null);
  const [suspensionConfirm, setSuspensionConfirm] = useState<{ uid: string; status: boolean } | null>(null);

  const [activeTab, setActiveTab] = useState<"reservations" | "analytics" | "users" | "reports" | "shop" | "sponsors" | "trainings" | "championships" | "championship_requests">("reservations");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", price: "", description: "", img: "" });

  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingForm, setTrainingForm] = useState({ title: "", description: "", img: "", price: 0 });

  const handleOpenTrainingModal = (training: any = null) => {
    if (training) {
      setEditingTrainingId(training.id);
      setTrainingForm({ title: training.title, description: training.description, img: training.img, price: training.price });
    } else {
      setEditingTrainingId(null);
      setTrainingForm({ title: "", description: "", img: "", price: 0 });
    }
    setShowTrainingModal(true);
  };

  const handleSaveTraining = async () => {
    if (!trainingForm.title || !trainingForm.description || !trainingForm.img || !trainingForm.price) return;
    if (editingTrainingId) {
      await updateTrainingFirestore(editingTrainingId, trainingForm);
    } else {
      await addTrainingFirestore(trainingForm);
    }
    setShowTrainingModal(false);
  };

  const [editingChampionshipId, setEditingChampionshipId] = useState<string | null>(null);
  const [showChampionshipModal, setShowChampionshipModal] = useState(false);
  const [championshipForm, setChampionshipForm] = useState<{ title: string; description: string; img: string; date: string; time: string; teams: string[] }>({ title: "", description: "", img: "", date: "", time: "", teams: ["", ""] });

  const handleOpenChampionshipModal = (champ: any = null) => {
    if (champ) {
      setEditingChampionshipId(champ.id);
      setChampionshipForm({ title: champ.title, description: champ.description, img: champ.img, date: champ.date, time: champ.time, teams: champ.teams || [] });
    } else {
      setEditingChampionshipId(null);
      setChampionshipForm({ title: "", description: "", img: "", date: "", time: "", teams: ["", ""] });
    }
    setShowChampionshipModal(true);
  };

  const handleSaveChampionship = async () => {
    // Basic validation
    if (!championshipForm.title || !championshipForm.description || !championshipForm.img || !championshipForm.date || !championshipForm.time) return;
    const validTeams = championshipForm.teams.filter(t => t.trim() !== "");
    if (validTeams.length < 2) return; // ensure at least 2 teams

    const finalForm = { ...championshipForm, teams: validTeams };

    if (editingChampionshipId) {
      await updateChampionshipFirestore(editingChampionshipId, finalForm);
    } else {
      await addChampionshipFirestore(finalForm);
    }
    setShowChampionshipModal(false);
  };

  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({ title: "", description: "", img: "", link: "" });

  const handleOpenSponsorModal = (sponsor: any = null) => {
    if (sponsor) {
      setEditingSponsorId(sponsor.id);
      setSponsorForm({ title: sponsor.title, description: sponsor.description, img: sponsor.img, link: sponsor.link || "" });
    } else {
      setEditingSponsorId(null);
      setSponsorForm({ title: "", description: "", img: "", link: "" });
    }
    setShowSponsorModal(true);
  };

  const handleSaveSponsor = async () => {
    if (!sponsorForm.title || !sponsorForm.description || !sponsorForm.img) return;
    if (editingSponsorId) {
      await updateSponsorFirestore(editingSponsorId, sponsorForm);
    } else {
      await addSponsorFirestore(sponsorForm);
    }
    setShowSponsorModal(false);
  };

  const handleOpenProductModal = (product: any = null) => {
    if (product) {
      setEditingProductId(product.id);
      setProductForm({ name: product.name, price: product.price, description: product.description, img: product.img });
    } else {
      setEditingProductId(null);
      setProductForm({ name: "", price: "", description: "", img: "" });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return;
    if (editingProductId) {
      await updateProductFirestore(editingProductId, productForm);
    } else {
      await addProductFirestore(productForm);
    }
    setShowProductModal(false);
  };

  if (loading || bookingsLoading || usersLoading || productsLoading || sponsorsLoading || trainingsLoading || champsLoading || reqsLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!appUser || (appUser.role !== "admin" && appUser.role !== "moderator")) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card-elevated p-8 text-center animate-slide-up max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Only admins and moderators can view the dashboard.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-lg font-heading font-bold gradient-accent text-accent-foreground transition-all duration-300 hover:glow-accent-strong hover:scale-[1.02]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const accepted = bookings.filter((b) => b.status === "accepted");
  const totalRevenue = accepted.reduce((s, b) => s + b.price, 0);

  const todayStr = formatLocalDate();
  const todayRevenue = accepted.filter((b) => b.date === todayStr).reduce((s, b) => s + b.price, 0);
  const weekRevenue = accepted.filter((b) => b.date && isThisWeek(parseISO(b.date))).reduce((s, b) => s + b.price, 0);
  const monthRevenue = accepted.filter((b) => b.date && isThisMonth(parseISO(b.date))).reduce((s, b) => s + b.price, 0);

  const lastMonthDate = subMonths(new Date(), 1);
  const lastMonthRevenue = accepted.filter((b) => b.date && isSameMonth(parseISO(b.date), lastMonthDate)).reduce((s, b) => s + b.price, 0);

  // Advanced Analytics Calculations
  const hourCounts: Record<number, number> = {};
  accepted.forEach(b => {
    for (let h = b.startHour; h < b.endHour; h++) {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
  });
  const mostBookedHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count);

  const customerStats: Record<string, { name: string, phone: string, totalSpend: number, count: number }> = {};
  accepted.forEach(b => {
    const key = `${b.name}-${b.phone}`;
    if (!customerStats[key]) {
      customerStats[key] = { name: b.name, phone: b.phone, totalSpend: 0, count: 0 };
    }
    customerStats[key].totalSpend += b.price;
    customerStats[key].count += 1;
  });
  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10);

  const stats = [
    { label: t.today, value: `${todayRevenue} EGP` },
    { label: t.week, value: `${weekRevenue} EGP` },
    { label: t.month, value: `${monthRevenue} EGP` },
    { label: t.total, value: `${totalRevenue} EGP` },
    { label: t.totalBookings, value: bookings.length },
    { label: t.activeChamps, value: 0 },
    { label: t.products, value: 0 },
    { label: t.users, value: users.length },
  ];

  const handleStatusUpdate = async (id: string, status: "accepted" | "rejected") => {
    try {
      await updateBookingStatus(id, status);
    } catch (err) {
      console.error("Failed to update booking status:", err);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeBooking(deleteConfirmId);
    } catch (err) {
      console.error("Failed to delete booking:", err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleUserRoleUpdate = async (uid: string, role: UserRole) => {
    try {
      await updateUserRole(uid, role);
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  const handleUserDelete = (uid: string) => {
    setUserDeleteConfirm(uid);
  };

  const confirmUserDelete = async () => {
    if (!userDeleteConfirm) return;
    try {
      await deleteUser(userDeleteConfirm);
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setUserDeleteConfirm(null);
    }
  };

  const handleToggleSuspension = (uid: string, currentStatus: boolean) => {
    setSuspensionConfirm({ uid, status: currentStatus });
  };

  const confirmSuspension = async () => {
    if (!suspensionConfirm) return;
    try {
      await toggleSuspension(suspensionConfirm.uid, suspensionConfirm.status);
    } catch (err) {
      console.error("Failed to toggle suspension:", err);
    } finally {
      setSuspensionConfirm(null);
    }
  };

  const handleUpdateBadgeQuantity = async (uid: string, currentBadges: number[] = [], badgeId: number, delta: number) => {
    let newBadges = [...currentBadges];

    if (delta > 0) {
      // Add one
      newBadges.push(badgeId);
    } else {
      // Remove one instance
      const index = newBadges.indexOf(badgeId);
      if (index > -1) {
        newBadges.splice(index, 1);
      }
    }

    try {
      await updateBadges(uid, newBadges);
      return newBadges;
    } catch (err) {
      console.error("Failed to update badges:", err);
      return currentBadges;
    }
  };

  const exportToExcel = () => {
    const data = bookings.map(b => ({
      'Customer': b.name,
      'Phone': b.phone,
      'Court': `Court ${b.court}`,
      'Date': b.date,
      'Time': `${formatHour(b.startHour)} - ${formatHour(b.endHour)}`,
      'Price': b.price,
      'Status': b.status,
      'Created': format(parseISO(b.createdAt || new Date().toISOString()), 'yyyy-MM-dd HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `GrandSlam_Bookings_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportMonthlyPdf = () => {
    const doc = new jsPDF();
    const currentMonth = format(new Date(), 'MMMM yyyy');

    doc.setFontSize(20);
    doc.text("Grand Slam Padel - Monthly Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`Period: ${currentMonth}`, 14, 32);

    const monthBookings = bookings.filter(b => b.date && isThisMonth(parseISO(b.date)));
    const monthAccepted = monthBookings.filter(b => b.status === 'accepted');
    const revenue = monthAccepted.reduce((sum, b) => sum + b.price, 0);

    doc.text(`Total Bookings: ${monthBookings.length}`, 14, 42);
    doc.text(`Accepted Bookings: ${monthAccepted.length}`, 14, 50);
    doc.text(`Total Revenue: ${revenue} EGP`, 14, 58);

    const tableData = monthBookings.map(b => [
      b.name,
      b.date,
      `${formatHour(b.startHour)} - ${formatHour(b.endHour)}`,
      b.price + " EGP",
      b.status
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Customer', 'Date', 'Time', 'Price', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [45, 212, 191] } // Accent color teal
    });

    doc.save(`Monthly_Report_${format(new Date(), 'yyyy_MM')}.pdf`);
  };

  const exportProfitReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(22, 163, 74); // Emerald color
    doc.text("Detailed Profit Analysis", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);

    const now = new Date();
    const periods = [
      { name: 'Last 7 Days', date: subDays(now, 7) },
      { name: 'Last 30 Days', date: subDays(now, 30) },
      { name: 'All Time', date: new Date(0) }
    ];

    let startY = 45;
    periods.forEach(period => {
      const filtered = bookings.filter(b => b.date && parseISO(b.date) >= period.date && b.status === 'accepted');
      const revenue = filtered.reduce((sum, b) => sum + b.price, 0);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(period.name, 14, startY);
      doc.setFontSize(10);
      doc.setTextColor(70);
      doc.text(`Accepted Bookings: ${filtered.length}`, 14, startY + 7);
      doc.text(`Gross Revenue: ${revenue} EGP`, 14, startY + 12);

      doc.setDrawColor(240);
      doc.line(14, startY + 18, 196, startY + 18);
      startY += 30;
    });

    doc.save("Detailed_Profit_Report.pdf");
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterName && !b.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterDate && b.date !== filterDate) return false;
    if (filterCourt !== "all" && b.court.toString() !== filterCourt) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-[1600px]">
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex items-center gap-4">
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">{t.title}</h1>
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-accent/10 text-accent border border-accent/20 tracking-[0.2em] uppercase">
            {appUser.role}
          </span>
        </div>

        {/* Tab Switcher - Now as a responsive grid to ensure visibility */}
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => setActiveTab("reservations")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "reservations"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "reservations" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <CalendarCheck className="w-5 h-5" />
              </div>
              {t.reservations}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "analytics"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "analytics" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              {t.income}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "users"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "users" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <Users className="w-5 h-5" />
              </div>
              {t.usersManagement}
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "reports"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "reports" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <FileDown className="w-5 h-5" />
              </div>
              {t.reports}
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "shop"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "shop" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <Package className="w-5 h-5" />
              </div>
              {t.products || "Shop Control"}
            </button>
            <button
              onClick={() => setActiveTab("sponsors")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "sponsors"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "sponsors" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <HeartHandshake className="w-5 h-5" />
              </div>
              Sponsors
            </button>
            <button
              onClick={() => setActiveTab("trainings")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "trainings"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "trainings" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <Dumbbell className="w-5 h-5" />
              </div>
              Trainings
            </button>
            <button
              onClick={() => setActiveTab("championships")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "championships"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "championships" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <Trophy className="w-5 h-5" />
              </div>
              Championships
            </button>
            <button
              onClick={() => setActiveTab("championship_requests")}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-300 border-2 ${activeTab === "championship_requests"
                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200"
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "championship_requests" ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"}`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="leading-none">Champ Requests</p>
                {requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded-md font-bold ${activeTab === "championship_requests" ? "bg-white/20 text-white" : "bg-accent/10 text-accent"}`}>
                    {requests.filter(r => r.status === 'pending').length} Pending
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "analytics" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-6 h-6 text-slate-800 dark:text-white" />
            <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.income}</h2>
          </div>

          {/* Premium Income Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: t.today, value: `${todayRevenue} EGP`, color: "text-emerald-600", border: "border-l-[6px] border-l-emerald-500", icon: "💵" },
              { label: t.week, value: `${weekRevenue} EGP`, color: "text-blue-600", border: "border-l-[6px] border-l-blue-500", icon: "🗓️" },
              { label: t.month, value: `${monthRevenue} EGP`, color: "text-purple-600", border: "border-l-[6px] border-l-purple-500", icon: "📊" },
              { label: t.total, value: `${totalRevenue} EGP`, color: "text-orange-600", border: "border-l-[6px] border-l-orange-500", icon: "🎯" },
            ].map((s, i) => (
              <div key={i} className={`bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-all hover:shadow-xl hover:-translate-y-1 ${s.border}`}>
                <div>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-800">
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Professional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: t.totalBookings, value: bookings.length, color: "text-slate-900", icon: "🎾" },
              { label: t.activeChamps, value: 0, color: "text-indigo-600", icon: "🏆" },
              { label: t.products, value: 0, color: "text-sky-600", icon: "🛍️" },
              { label: t.users, value: users.length, color: "text-emerald-600", icon: "👥" },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-lg">
                <p className="text-sm font-black text-slate-800 dark:text-white mb-6 flex items-center justify-between">
                  {s.label}
                  <span className="opacity-50">{s.icon}</span>
                </p>
                <p className={`text-5xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 mb-10">
            {/* Top 10 Customers */}
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 animate-slide-up">
              <div className="flex items-center gap-2 mb-8">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h3 className="font-heading text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.topCustomers}</h3>
              </div>
              <div className="space-y-4">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${i === 0 ? "bg-amber-100 text-amber-600 shadow-amber-100 dark:bg-amber-900/30" :
                        i === 1 ? "bg-slate-100 text-slate-500 dark:bg-slate-800" :
                          i === 2 ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30" :
                            "bg-slate-50 text-slate-400 dark:bg-slate-900"
                        }`}>
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white group-hover:text-accent transition-colors">{c.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white">{c.totalSpend} EGP</p>
                      <p className="text-[11px] text-emerald-500 font-black uppercase">{c.count} {t.bookingsCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {/* Most Booked Hours */}
              <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 flex-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                    <h3 className="font-heading text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.popularHours}</h3>
                  </div>
                  <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-lg uppercase">{t.capacityPeak}</span>
                </div>
                <div className="space-y-6">
                  {mostBookedHours.slice(0, 5).map((h, i) => (
                    <div key={i} className="relative transition-all hover:translate-x-1">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">{formatHour(h.hour)}</span>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">{h.count} {t.sessions}</span>
                      </div>
                      <div className="h-3 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(h.count / (mostBookedHours[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Comparison */}
              <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-2 mb-8">
                  <CalendarCheck className="w-6 h-6 text-purple-500" />
                  <h3 className="font-heading text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.revenueGrowth}</h3>
                </div>
                <div className="flex items-end justify-between gap-8 h-40 px-6">
                  <div className="flex-1 flex flex-col items-center gap-4 group">
                    <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl relative transition-all group-hover:bg-slate-100 dark:group-hover:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-800" style={{ height: '70%' }}>
                      <div className="absolute inset-x-0 bottom-0 bg-slate-200 dark:bg-slate-700" style={{ height: '100%' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.lastMonth}</p>
                      <p className="text-sm font-black text-slate-600 dark:text-slate-400">{lastMonthRevenue} EGP</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-4 group">
                    <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl relative transition-all group-hover:bg-purple-50 dark:group-hover:bg-purple-900/10 overflow-hidden border border-slate-100 dark:border-slate-800" style={{ height: '100%' }}>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-purple-600 to-purple-400 shadow-lg shadow-purple-100 dark:shadow-purple-900/20" style={{ height: `${(monthRevenue / (Math.max(monthRevenue, lastMonthRevenue) || 1)) * 100}%` }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none mb-1 text-glow-purple">{t.thisMonth}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{monthRevenue} EGP</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.monthlyConversion}</p>
                    <p className={`text-lg font-black ${monthRevenue >= lastMonthRevenue ? "text-emerald-500" : "text-rose-500"}`}>
                      {lastMonthRevenue > 0 ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : "100"}%
                      {monthRevenue >= lastMonthRevenue ? " ↑" : " ↓"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${monthRevenue >= lastMonthRevenue ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500" : "bg-rose-50 dark:bg-rose-900/30 text-rose-500"}`}>
                    <TrendingUp className={`w-6 h-6 ${monthRevenue < lastMonthRevenue && "rotate-180"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Reservations Table */}
          <div className="card-elevated p-6 animate-slide-up bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50" style={{ animationDelay: "0.1s" }}>
            <h3 className="font-heading text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
              {t.reservations}
            </h3>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/20 rounded-xl border border-border/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:border-accent text-sm dark:text-white"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:border-accent text-sm text-slate-600 dark:text-slate-300"
                />
              </div>
              <div>
                <select
                  value={filterCourt}
                  onChange={(e) => setFilterCourt(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:border-accent text-sm text-slate-600 dark:text-slate-300"
                >
                  <option value="all">All Courts</option>
                  <option value="1">Court 1</option>
                  <option value="2">Court 2</option>
                </select>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:border-accent text-sm text-slate-600 dark:text-slate-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="accepted">Accepted</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No bookings found matching your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto pb-4">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 text-muted-foreground font-medium">Name</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Phone</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Court</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Time</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Price</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 font-bold text-slate-800 dark:text-white tracking-tight">{b.name}</td>
                          <td className="py-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">{b.phone}</td>
                          <td className="py-4 font-black text-slate-700 dark:text-slate-300">Court {b.court}</td>
                          <td className="py-4 text-slate-500 dark:text-slate-400 font-bold">{b.date}</td>
                          <td className="py-4 font-black text-slate-900 dark:text-white">{formatHour(b.startHour)} – {formatHour(b.endHour)}</td>
                          <td className="py-4 font-black text-emerald-600 dark:text-emerald-400">{b.price} EGP</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.status === "accepted" ? "bg-accent/20 text-accent" :
                              b.status === "rejected" ? "bg-destructive/20 text-destructive" :
                                b.status === "cancelled" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500" :
                                  "bg-sky/20 text-sky"
                              }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <button onClick={() => handleStatusUpdate(b.id, "accepted")} className="p-1.5 rounded-lg hover:bg-accent/20 text-accent transition-colors" title={t.accept}>
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleStatusUpdate(b.id, "rejected")} className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title={t.reject}>
                                <X className="w-5 h-5" />
                              </button>
                              {appUser.role === "admin" && (
                                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title={t.delete}>
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {filteredBookings.map((b) => (
                    <div key={b.id} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-base">{b.name}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{b.phone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${b.status === "accepted" ? "bg-accent/10 text-accent border border-accent/20" :
                          b.status === "rejected" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                            b.status === "cancelled" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20" :
                              "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                          }`}>
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Court</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">Court {b.court}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{b.date}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{formatHour(b.startHour)} – {formatHour(b.endHour)}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                          <p className="font-black text-emerald-600 dark:text-emerald-400">{b.price} EGP</p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => handleStatusUpdate(b.id, "accepted")} className="flex-1 py-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors flex items-center justify-center gap-1 text-xs font-bold" title={t.accept}>
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button onClick={() => handleStatusUpdate(b.id, "rejected")} className="flex-1 py-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors flex items-center justify-center gap-1 text-xs font-bold" title={t.reject}>
                          <X className="w-4 h-4" /> Reject
                        </button>
                        {appUser.role === "admin" && (
                          <button onClick={() => handleDelete(b.id)} className="p-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors flex items-center justify-center" title={t.delete}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-elevated p-6 animate-slide-up bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50" style={{ animationDelay: "0.1s" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                {t.usersManagement}
              </h3>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === "ar" ? "ابحث عن اسم، هاتف أو بريد..." : "Search name, phone or email..."}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-accent outline-none transition-all text-sm font-bold shadow-sm"
                />
              </div>
            </div>

            {(() => {
              const filteredUsers = users.filter(u => {
                if (!userSearchQuery) return true;
                const q = userSearchQuery.toLowerCase();
                return u.name.toLowerCase().includes(q) || (u.phone && u.phone.includes(q)) || (u.email && u.email.toLowerCase().includes(q));
              });

              if (users.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No users found.</p>
                  </div>
                );
              }

              if (filteredUsers.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{lang === "ar" ? "لا يوجد مستخدمين بهذا الاسم أو الهاتف." : "No users found matching your search."}</p>
                    <button onClick={() => setUserSearchQuery("")} className="mt-4 text-accent font-bold hover:underline">
                      {lang === "ar" ? "مسح البحث" : "Clear search"}
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <div className="hidden md:block overflow-x-auto pb-4">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/50">
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">Name</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.email}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.phone}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.bookings}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.totalPaid}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">Padel Coins</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.badges}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.role}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.status}</th>
                          <th className="py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => {
                          const userBookings = accepted.filter(b => b.phone === user.phone || b.name === user.name);
                          const userTotalPaid = userBookings.reduce((s, b) => s + b.price, 0);
                          const userPadelCoins = userBookings.length - (user.spentCoins || 0);
                          const userProfilePath = user.username ? `/profile/${user.username}` : "";

                          return (
                            <tr key={user.uid} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors ${user.isSuspended ? "bg-rose-50/30 dark:bg-rose-900/10 opacity-80" : ""}`}>
                              <td className="py-4 font-bold">
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => userProfilePath && navigate(userProfilePath)}
                                    disabled={!userProfilePath}
                                    className="text-left text-slate-800 dark:text-white hover:text-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {user.name}
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.joined}: {user.memberSince}</span>
                                </div>
                              </td>
                              <td className="py-4 text-slate-500 dark:text-slate-400 font-bold">{user.email}</td>
                              <td className="py-4 text-slate-400 dark:text-slate-500 font-bold">{user.phone || "N/A"}</td>
                              <td className="py-4 font-black text-slate-900 dark:text-white">{userBookings.length}</td>
                              <td className="py-4 font-black text-emerald-600 dark:text-emerald-400">{userTotalPaid} EGP</td>
                              <td className="py-4 font-black text-amber-600 dark:text-amber-400">{userPadelCoins}</td>
                              <td className="py-4">
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-wrap gap-1 min-h-[1.25rem]">
                                    {BADGE_TYPES.map((bt) => {
                                      const count = (user.activeBadges || []).filter((id: number) => id === bt.id).length;
                                      if (count === 0) return null;
                                      return (
                                        <div key={bt.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-black shadow-sm ${bt.bg} ${bt.color} ${bt.border} animate-in zoom-in-50`}>
                                          <Sparkles className="w-2.5 h-2.5" />
                                          <span>{count}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <button
                                    onClick={() => setSelectedUserForBadge(user)}
                                    className="px-3 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent text-[10px] font-black uppercase hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2 self-start w-full sm:w-auto"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {t.addBadge}
                                  </button>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === "admin" ? "bg-accent/20 text-accent border border-accent/30" :
                                  user.role === "moderator" ? "bg-sky/20 text-sky border border-sky/30" :
                                    "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                  }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.isSuspended ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"}`}>
                                  {user.isSuspended ? t.suspend : t.activate}
                                </span>
                              </td>
                              <td className="py-4">
                                <div className="flex gap-2">
                                  {appUser.role === "admin" && user.uid !== appUser.uid && (
                                    <>
                                      <button
                                        onClick={() => {
                                          const roles: UserRole[] = ["user", "moderator", "admin"];
                                          const currentIndex = roles.indexOf(user.role);
                                          const nextRole = roles[(currentIndex + 1) % roles.length];
                                          handleUserRoleUpdate(user.uid, nextRole);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-accent/20 text-accent transition-colors"
                                        title={t.changeRole}
                                      >
                                        <ShieldAlert className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleToggleSuspension(user.uid, user.isSuspended || false)}
                                        className={`p-1.5 rounded-lg transition-colors ${user.isSuspended ? "hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600" : "hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600"}`}
                                        title={user.isSuspended ? t.activate : t.suspend}
                                      >
                                        {user.isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => handleUserDelete(user.uid)}
                                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 transition-colors"
                                        title={t.delete}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden grid grid-cols-1 gap-4 mt-2">
                    {filteredUsers.map((user) => {
                      const userBookings = accepted.filter(b => b.phone === user.phone || b.name === user.name);
                      const userTotalPaid = userBookings.reduce((s, b) => s + b.price, 0);
                      const userPadelCoins = userBookings.length - (user.spentCoins || 0);
                      const userProfilePath = user.username ? `/profile/${user.username}` : "";

                      return (
                        <div key={user.uid} className={`bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-4 ${user.isSuspended ? "opacity-70 bg-rose-50/30 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30" : ""}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <button
                                type="button"
                                onClick={() => userProfilePath && navigate(userProfilePath)}
                                disabled={!userProfilePath}
                                className="font-bold text-slate-800 dark:text-white text-base hover:text-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {user.name}
                              </button>
                              <p className="text-[11px] text-slate-400 font-bold tracking-widest">{user.phone || "N/A"}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-accent">{t.joined}: {user.memberSince}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider leading-none ${user.role === "admin" ? "bg-accent/20 text-accent border border-accent/30" :
                                user.role === "moderator" ? "bg-sky-500/20 text-sky-500 border border-sky-500/30" :
                                  "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                }`}>
                                {user.role}
                              </span>
                              {user.isSuspended && (
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider leading-none bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">{t.bookings}</p>
                              <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">{userBookings.length}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">{t.totalPaid}</p>
                              <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{userTotalPaid} <span className="text-xs">EGP</span></p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Padel Coins</p>
                              <p className="font-black text-amber-600 dark:text-amber-400 text-lg">{userPadelCoins}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">{t.badges}</p>
                              <div className="flex flex-wrap gap-1 min-h-[1.25rem] mb-2">
                                {BADGE_TYPES.map((bt) => {
                                  const count = (user.activeBadges || []).filter((id: number) => id === bt.id).length;
                                  if (count === 0) return null;
                                  return (
                                    <div key={bt.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-black shadow-sm ${bt.bg} ${bt.color} ${bt.border} animate-in zoom-in-50`}>
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => setSelectedUserForBadge(user)}
                                className="w-full py-2.5 rounded-lg border border-accent/30 bg-accent/10 text-accent text-[10px] font-black uppercase hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2"
                              >
                                <Sparkles className="w-3 h-3" />
                                {t.addBadge}
                              </button>
                            </div>
                          </div>

                          {appUser.role === "admin" && user.uid !== appUser.uid && (
                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => {
                                  const roles: UserRole[] = ["user", "moderator", "admin"];
                                  const currentIndex = roles.indexOf(user.role);
                                  const nextRole = roles[(currentIndex + 1) % roles.length];
                                  handleUserRoleUpdate(user.uid, nextRole);
                                }}
                                className="flex-1 p-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors flex items-center justify-center gap-1 text-xs font-bold"
                                title={t.changeRole}
                              >
                                <ShieldAlert className="w-3 h-3" /> Role
                              </button>
                              <button
                                onClick={() => handleToggleSuspension(user.uid, user.isSuspended || false)}
                                className={`flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-bold ${user.isSuspended ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-rose-100 dark:bg-rose-900/40 text-rose-600"}`}
                                title={user.isSuspended ? t.activate : t.suspend}
                              >
                                {user.isSuspended ? <><CheckCircle className="w-3 h-3" /> Reactivate</> : <><Ban className="w-3 h-3" /> Suspend</>}
                              </button>
                              <button
                                onClick={() => handleUserDelete(user.uid)}
                                className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 hover:opacity-80 transition-colors flex items-center justify-center"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t.exportExcel}</h3>
            <p className="text-sm text-slate-400 font-bold mb-8">Download all bookings history in Excel format for external analysis.</p>
            <button
              onClick={exportToExcel}
              className="w-full py-4 rounded-2xl bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <FileDown className="w-5 h-5" />
              {t.download}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t.exportPdf}</h3>
            <p className="text-sm text-slate-400 font-bold mb-8">Professional PDF report containing this month's activity and summary.</p>
            <button
              onClick={exportMonthlyPdf}
              className="w-full py-4 rounded-2xl bg-teal-600/10 dark:bg-teal-600/20 text-teal-600 dark:text-teal-400 font-black text-sm uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <FileDown className="w-5 h-5" />
              {t.download}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-950 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t.profitReport}</h3>
            <p className="text-sm text-slate-400 font-bold mb-8">Detailed financial breakdown including net profits and growth comparison.</p>
            <button
              onClick={exportProfitReport}
              className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3"
            >
              <FileDown className="w-5 h-5" />
              {t.download}
            </button>
          </div>
        </div>
      )}

      {activeTab === "shop" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-elevated p-6 bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Package className="w-6 h-6 text-accent" /> Shop Management
              </h3>
              <button
                onClick={() => handleOpenProductModal()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
              >
                + Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No products available. Add one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(p => (
                  <div key={p.id} className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300">
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-heading font-bold text-lg mb-1 dark:text-white">{p.name}</h3>
                      <p className="text-accent font-bold mb-2">{p.price}</p>
                      <p className="text-muted-foreground text-xs mb-4 line-clamp-2 flex-grow">{p.description}</p>
                      <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
                        <button onClick={() => handleOpenProductModal(p)} className="p-2 text-xs font-bold rounded-lg hover:bg-accent/20 text-accent transition-colors flex items-center gap-1" title="Edit">
                          <CheckCircle className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => removeProductFirestore(p.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trainings Management */}
      {activeTab === "trainings" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-elevated p-6 bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Dumbbell className="w-6 h-6 text-accent" /> Trainings Management
              </h3>
              <button
                onClick={() => handleOpenTrainingModal()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
              >
                + Add Training
              </button>
            </div>

            {trainings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No training programs available. Add one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trainings.map(t => (
                  <div key={t.id} className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300">
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img src={t.img} alt={t.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-heading font-bold text-lg mb-1 dark:text-white">{t.title}</h3>
                      <p className="font-bold text-accent mb-2">{t.price} EGP</p>
                      <p className="text-muted-foreground text-xs mb-4 line-clamp-2 flex-grow">{t.description}</p>
                      <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
                        <button onClick={() => handleOpenTrainingModal(t)} className="p-2 text-xs font-bold rounded-lg hover:bg-accent/20 text-accent transition-colors flex items-center gap-1" title="Edit">
                          <CheckCircle className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => removeTrainingFirestore(t.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sponsors Management */}
      {activeTab === "sponsors" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-elevated p-6 bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <HeartHandshake className="w-6 h-6 text-accent" /> Sponsors Management
              </h3>
              <button
                onClick={() => handleOpenSponsorModal()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
              >
                + Add Sponsor
              </button>
            </div>

            {sponsors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                <HeartHandshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No sponsors available. Add one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sponsors.map(s => (
                  <div key={s.id} className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300">
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-heading font-bold text-lg mb-1 dark:text-white">{s.title}</h3>
                      <p className="text-muted-foreground text-xs mb-4 line-clamp-2 flex-grow">{s.description}</p>
                      {s.link && <p className="text-xs text-accent mb-2 truncate">{s.link}</p>}
                      <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
                        <button onClick={() => handleOpenSponsorModal(s)} className="p-2 text-xs font-bold rounded-lg hover:bg-accent/20 text-accent transition-colors flex items-center gap-1" title="Edit">
                          <CheckCircle className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => removeSponsorFirestore(s.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Championships Management */}
      {activeTab === "championships" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-elevated p-6 bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Trophy className="w-6 h-6 text-accent" /> Championships Management
              </h3>
              <button
                onClick={() => handleOpenChampionshipModal()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
              >
                + Add Championship
              </button>
            </div>

            {championships.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No championships available. Add one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {championships.map(champ => (
                  <div key={champ.id} className="card-elevated group overflow-hidden flex flex-col hover:glow-accent transition-all duration-300">
                    <div className="relative h-40 overflow-hidden bg-muted">
                      <img src={champ.img} alt={champ.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-heading font-bold text-lg mb-1 dark:text-white uppercase">{champ.title}</h3>
                      <p className="text-xs font-bold text-accent mb-2">{champ.date} - {champ.time}</p>
                      <p className="text-muted-foreground text-xs mb-4 line-clamp-2">{champ.description}</p>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{champ.teams?.join(" VS ")}</div>

                      <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
                        <button onClick={() => handleOpenChampionshipModal(champ)} className="p-2 text-xs font-bold rounded-lg hover:bg-accent/20 text-accent transition-colors flex items-center gap-1" title="Edit">
                          <CheckCircle className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => removeChampionshipFirestore(champ.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Championship Requests */}
      {activeTab === "championship_requests" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="card-elevated p-6 bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50">
            <h3 className="font-heading text-xl font-bold flex items-center gap-2 mb-6 text-slate-800 dark:text-white">
              <CheckCircle className="w-6 h-6 text-accent" /> Championship Registration Requests
            </h3>

            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border dark:border-slate-700">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No registration requests yet.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto pb-4">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                        <th className="p-4 font-black">Player Name</th>
                        <th className="p-4 font-black">Phone</th>
                        <th className="p-4 font-black">Championship</th>
                        <th className="p-4 font-black">Team Selected</th>
                        <th className="p-4 font-black text-center">Status</th>
                        <th className="p-4 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map(req => (
                        <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-bold text-slate-800 dark:text-white">{req.userName}</td>
                          <td className="p-4 ">{req.phone}</td>
                          <td className="p-4 font-bold text-accent uppercase">{req.championshipTitle}</td>
                          <td className="p-4 font-bold">{req.teamName}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${req.status === 'accepted' ? 'bg-success/10 text-success' :
                              req.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                                'bg-amber-500/10 text-amber-500'
                              }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              {req.status === 'pending' && (
                                <>
                                  <button onClick={() => updateRequestStatusFirestore(req.id, "accepted")} className="p-2 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-colors" title="Accept">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => updateRequestStatusFirestore(req.id, "rejected")} className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors" title="Reject">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button onClick={() => removeRequestFirestore(req.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors" title="Delete record">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden grid grid-cols-1 gap-4 mt-2">
                  {requests.map(req => (
                    <div key={req.id} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-base">{req.userName}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{req.phone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'accepted' ? 'bg-success/10 text-success border border-success/20' :
                          req.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Championship</p>
                          <p className="font-bold text-accent text-sm uppercase">{req.championshipTitle}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Team Selected</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{req.teamName}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => updateRequestStatusFirestore(req.id, "accepted")} className="flex-1 py-2.5 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-colors flex items-center justify-center gap-1 text-xs font-bold" title="Accept">
                              <Check className="w-4 h-4" /> Accept
                            </button>
                            <button onClick={() => updateRequestStatusFirestore(req.id, "rejected")} className="flex-1 py-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors flex items-center justify-center gap-1 text-xs font-bold" title="Reject">
                              <X className="w-4 h-4" /> Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => removeRequestFirestore(req.id)} className="p-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors flex items-center justify-center" title="Delete record">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{editingSponsorId ? "Edit Sponsor" : "Add Sponsor"}</h3>
              <button
                onClick={() => setShowSponsorModal(false)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Title *</label>
                <input type="text" value={sponsorForm.title} onChange={e => setSponsorForm({ ...sponsorForm, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Description *</label>
                <textarea rows={3} value={sponsorForm.description} onChange={e => setSponsorForm({ ...sponsorForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors resize-none" required></textarea>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Image URL *</label>
                <input type="text" value={sponsorForm.img} onChange={e => setSponsorForm({ ...sponsorForm, img: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Link (Optional)</label>
                <input type="text" value={sponsorForm.link} onChange={e => setSponsorForm({ ...sponsorForm, link: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" />
              </div>

              <button
                onClick={handleSaveSponsor}
                className="w-full mt-4 py-4 rounded-2xl bg-accent text-accent-foreground font-black text-sm uppercase hover:bg-accent/90 transition-all shadow-lg active:scale-95 text-center"
              >
                Save Sponsor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{editingTrainingId ? "Edit Training" : "Add Training"}</h3>
              <button
                onClick={() => setShowTrainingModal(false)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Title *</label>
                <input type="text" value={trainingForm.title} onChange={e => setTrainingForm({ ...trainingForm, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Description *</label>
                <textarea rows={3} value={trainingForm.description} onChange={e => setTrainingForm({ ...trainingForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors resize-none" required></textarea>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Image URL *</label>
                <input type="text" value={trainingForm.img} onChange={e => setTrainingForm({ ...trainingForm, img: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Price (EGP) *</label>
                <input type="number" value={trainingForm.price} onChange={e => setTrainingForm({ ...trainingForm, price: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>

              <button
                onClick={handleSaveTraining}
                className="w-full mt-4 py-4 rounded-2xl bg-accent text-accent-foreground font-black text-sm uppercase hover:bg-accent/90 transition-all shadow-lg active:scale-95 text-center"
              >
                Save Training
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Championship Modal */}
      {showChampionshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{editingChampionshipId ? "Edit Championship" : "Add Championship"}</h3>
              <button
                onClick={() => setShowChampionshipModal(false)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Title *</label>
                <input type="text" value={championshipForm.title} onChange={e => setChampionshipForm({ ...championshipForm, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Description *</label>
                <textarea rows={3} value={championshipForm.description} onChange={e => setChampionshipForm({ ...championshipForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors resize-none" required></textarea>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Image URL *</label>
                <input type="text" value={championshipForm.img} onChange={e => setChampionshipForm({ ...championshipForm, img: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Date *</label>
                  <input type="date" value={championshipForm.date} onChange={e => setChampionshipForm({ ...championshipForm, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Time *</label>
                  <input type="time" value={championshipForm.time} onChange={e => setChampionshipForm({ ...championshipForm, time: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" required />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">Teams *</label>
                  <button
                    onClick={() => setChampionshipForm({ ...championshipForm, teams: [...championshipForm.teams, ""] })}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    + Add Team
                  </button>
                </div>
                {championshipForm.teams.map((team, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Team ${idx + 1}`}
                      value={team}
                      onChange={e => {
                        const newTeams = [...championshipForm.teams];
                        newTeams[idx] = e.target.value;
                        setChampionshipForm({ ...championshipForm, teams: newTeams });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors"
                      required
                    />
                    {championshipForm.teams.length > 2 && (
                      <button
                        onClick={() => {
                          const newTeams = championshipForm.teams.filter((_, i) => i !== idx);
                          setChampionshipForm({ ...championshipForm, teams: newTeams });
                        }}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveChampionship}
                className="w-full mt-4 py-4 rounded-2xl bg-accent text-accent-foreground font-black text-sm uppercase hover:bg-accent/90 transition-all shadow-lg active:scale-95 text-center"
              >
                Save Championship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{editingProductId ? "Edit Product" : "Add Product"}</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Product Name</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Price</label>
                <input type="text" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Description</label>
                <textarea rows={3} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors resize-none"></textarea>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1">Image URL</label>
                <input type="text" value={productForm.img} onChange={e => setProductForm({ ...productForm, img: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:border-accent outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors" />
              </div>

              <button
                onClick={handleSaveProduct}
                className="w-full mt-4 py-4 rounded-2xl bg-accent text-accent-foreground font-black text-sm uppercase hover:bg-accent/90 transition-all shadow-lg active:scale-95"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Management Modal */}
      {selectedUserForBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t.badges}</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{selectedUserForBadge.name}</p>
              </div>
              <button
                onClick={() => setSelectedUserForBadge(null)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {BADGE_TYPES.map((b) => {
                const badgeCount = (selectedUserForBadge.activeBadges || []).filter((id: number) => id === b.id).length;
                const active = badgeCount > 0;

                return (
                  <div
                    key={b.id}
                    className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${active ? `${b.border} ${b.bg}` : "border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 grayscale opacity-60"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/50 ${active ? b.bg : "bg-white dark:bg-slate-800"}`}>
                        <Sparkles className={`w-6 h-6 ${active ? b.color : "text-slate-200 dark:text-slate-700"}`} />
                      </div>
                      <div>
                        <p className={`font-black uppercase tracking-wider ${active ? b.color : "text-slate-400"}`}>
                          {t[b.key as keyof typeof t] as string}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {b.id}% Discount per badge
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateBadgeQuantity(selectedUserForBadge.uid, selectedUserForBadge.activeBadges, b.id, -1).then((newBadges) => {
                          setSelectedUserForBadge({ ...selectedUserForBadge, activeBadges: newBadges });
                        })}
                        disabled={badgeCount === 0}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${badgeCount > 0 ? "border-slate-200 bg-white text-slate-600 hover:border-slate-400" : "border-slate-100 text-slate-200"
                          }`}
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="min-w-[24px] text-center">
                        <span className={`text-lg font-black ${active ? "text-slate-900" : "text-slate-300"}`}>
                          {badgeCount}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUpdateBadgeQuantity(selectedUserForBadge.uid, selectedUserForBadge.activeBadges, b.id, 1).then((newBadges) => {
                          setSelectedUserForBadge({ ...selectedUserForBadge, activeBadges: newBadges });
                        })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${b.border + " bg-white " + b.color + " hover:scale-110 active:scale-95"
                          }`}
                      >
                        <Check className="w-4 h-4 translate-y-[1px]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Inventory Summary Section */}
            {(selectedUserForBadge.activeBadges || []).length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">
                  {t.currentInventory}
                </h4>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-wrap gap-2">
                  {BADGE_TYPES.map((bt) => {
                    const count = (selectedUserForBadge.activeBadges || []).filter((id: number) => id === bt.id).length;
                    if (count === 0) return null;
                    return (
                      <div key={bt.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black shadow-sm ${bt.bg} ${bt.color} ${bt.border}`}>
                        <Sparkles className="w-3 h-3" />
                        <span className="uppercase">{t[bt.key as keyof typeof t] as string}</span>
                        <span className="opacity-40 ml-1">×</span>
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedUserForBadge(null)}
              className="w-full mt-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-heading text-xl font-black text-slate-900 dark:text-white mb-2">
                {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متأكد من حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to delete this booking? This action cannot be undone.'}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-destructive text-white font-bold text-sm hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-destructive/20"
                >
                  {lang === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Confirmation Modal */}
      {userDeleteConfirm && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-heading text-xl font-black text-slate-900 dark:text-white mb-2">
                {lang === 'ar' ? 'حذف المستخدم' : 'Delete User'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متأكد من حذف هذا المستخدم نهائياً؟ هذا الإجراء سيقوم بمسح كافة بياناته ولا يمكن التراجع عنه.'
                  : 'Are you sure you want to permanently delete this user? This action will erase all their data and cannot be undone.'}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setUserDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={confirmUserDelete}
                  className="flex-1 py-3 rounded-xl bg-destructive text-white font-bold text-sm hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-destructive/20"
                >
                  {lang === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Confirmation Modal */}
      {suspensionConfirm && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
                <ShieldAlert className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-heading text-xl font-black text-slate-900 dark:text-white mb-2">
                {lang === 'ar' ? 'تعديل حالة الحساب' : 'Change Account Status'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {lang === 'ar'
                  ? `هل أنت متأكد من ${suspensionConfirm.status ? 'إلغاء حظر' : 'حظر'} هذا المستخدم؟`
                  : `Are you sure you want to ${suspensionConfirm.status ? 'unblock' : 'block'} this user?`}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setSuspensionConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={confirmSuspension}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${suspensionConfirm.status
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                      : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                    }`}
                >
                  {lang === 'ar' ? (suspensionConfirm.status ? 'تفعيل' : 'حظر') : (suspensionConfirm.status ? 'Unblock' : 'Block')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

