import { create } from "zustand";
import type { Lang } from "./translations";

export interface Booking {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  court: 1 | 2;
  type: "1h" | "2h" | "3h" | "vip";
  startHour: number;
  endHour: number;
  date: string;
  price: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt?: string;
  discountBadge?: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin" | "moderator";
  memberSince: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  img: string;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  dark: boolean;
  toggleDark: () => void;
  user: User | null;
  setUser: (u: User | null) => void;
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBookingStatus: (id: string, status: Booking["status"]) => void;
  deleteBooking: (id: string) => void;
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const sampleBookings: Booking[] = [
  { id: "1", name: "Ahmed Hassan", phone: "01012345678", court: 1, type: "2h", startHour: 16, endHour: 18, date: "2026-02-27", price: 450, status: "accepted" },
  { id: "2", name: "Sara Ali", phone: "01198765432", court: 2, type: "1h", startHour: 10, endHour: 11, date: "2026-02-27", price: 250, status: "pending" },
  { id: "3", name: "Omar Khaled", phone: "01234567890", court: 1, type: "vip", startHour: 20, endHour: 24, date: "2026-02-27", price: 850, status: "accepted" },
  { id: "4", name: "Nour Mohamed", phone: "01087654321", court: 2, type: "3h", startHour: 14, endHour: 17, date: "2026-02-27", price: 650, status: "rejected" },
];

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Pro Padel Racket",
    price: "2,500 EGP",
    description: "High-performance carbon fiber racket for professional play.",
    img: "https://images.unsplash.com/photo-1622279457486-640c4cb71652?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "2",
    name: "Premium Padel Balls (3)",
    price: "350 EGP",
    description: "Tournament quality padel balls with maximum durability.",
    img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "3",
    name: "Court Shoes",
    price: "1,800 EGP",
    description: "Lightweight, breathable shoes with excellent grip for padel courts.",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "4",
    name: "Sports Bag",
    price: "900 EGP",
    description: "Spacious bag to carry your racket, shoes, and accessories.",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "5",
    name: "Wristband Set",
    price: "150 EGP",
    description: "Absorbent wristbands for a comfortable and dry grip.",
    img: "https://images.unsplash.com/photo-1616616422345-0d4872c050a4?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "6",
    name: "Grand Slam Jersey",
    price: "650 EGP",
    description: "Premium breathable jersey with Grand Slam Padel branding.",
    img: "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?auto=format&fit=crop&q=80&w=800"
  },
];

export const useAppStore = create<AppState>((set) => ({
  lang: "en",
  setLang: (lang) => set({ lang }),
  dark: false,
  toggleDark: () => set((s) => {
    const next = !s.dark;
    document.documentElement.classList.toggle("dark", next);
    return { dark: next };
  }),
  user: null,
  setUser: (user) => set({ user }),
  bookings: sampleBookings,
  addBooking: (b) => set((s) => ({ bookings: [...s.bookings, b] })),
  updateBookingStatus: (id, status) => set((s) => ({
    bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
  })),
  deleteBooking: (id) => set((s) => ({
    bookings: s.bookings.filter((b) => b.id !== id),
  })),
  products: initialProducts,
  addProduct: (p) => set((s) => ({
    products: [...s.products, { ...p, id: Math.random().toString(36).substring(7) }]
  })),
  updateProduct: (id, p) => set((s) => ({
    products: s.products.map(prod => prod.id === id ? { ...prod, ...p } : prod)
  })),
  deleteProduct: (id) => set((s) => ({
    products: s.products.filter(prod => prod.id !== id)
  }))
}));
