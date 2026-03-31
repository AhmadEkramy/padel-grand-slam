import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "user" | "admin" | "moderator";

export interface AppUser {
    uid: string;
    username: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    memberSince: string;
    photoURL?: string | null;
    spentCoins?: number;
    activeBadges?: number[];
    isSuspended?: boolean;
    discountPercentage?: number;
}

interface AuthContextType {
    currentUser: FirebaseUser | null;
    appUser: AppUser | null;
    loading: boolean;
    register: (email: string, password: string, name: string, phone: string, username: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user document from Firestore
    async function fetchUserDoc(uid: string): Promise<AppUser | null> {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            const data = snap.data();
            return {
                uid: snap.id,
                username: data.username || "",
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role as UserRole,
                memberSince: data.memberSince,
                photoURL: data.photoURL || null,
                spentCoins: data.spentCoins || 0,
                activeBadges: data.activeBadges || [],
                isSuspended: data.isSuspended || false,
                discountPercentage: data.discountPercentage || 0,
            };
        }
        return null;
    }

    // Register a new user
    async function register(email: string, password: string, name: string, phone: string, username: string) {
        // Check if username is unique
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
            throw new Error("Username is already taken");
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        const memberSince = new Date().toISOString().split("T")[0];

        const appUserData: AppUser = {
            uid: user.uid,
            username: username.toLowerCase(),
            name,
            email,
            phone,
            role: "user",
            memberSince,
        };

        // Create user document in "users" collection
        try {
            await setDoc(doc(db, "users", user.uid), {
                username: username.toLowerCase(),
                name,
                email,
                phone,
                role: "user" as UserRole,
                memberSince,
                createdAt: serverTimestamp(),
            });
        } catch (firestoreError: any) {
            console.error("Firestore write failed:", firestoreError);
            // If it's a permissions error, the Auth user was still created.
            // Set the local user so the app works, the doc will be retried on next login.
            if (firestoreError.code === "permission-denied") {
                console.warn("Firestore permission denied. Please update your Firestore security rules.");
            }
        }

        setAppUser(appUserData);
    }

    // Login existing user
    async function login(email: string, password: string) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        try {
            const userData = await fetchUserDoc(credential.user.uid);
            if (userData) {
                setAppUser(userData);
            } else {
                // User doc doesn't exist yet (e.g. Firestore write failed during registration)
                // Try to create it now
                const memberSince = new Date().toISOString().split("T")[0];
                const fallbackUser: AppUser = {
                    uid: credential.user.uid,
                    username: credential.user.uid.substring(0, 8), // Fallback if no username
                    name: credential.user.displayName || "Player",
                    email: credential.user.email || "",
                    phone: "",
                    role: "user",
                    memberSince,
                    photoURL: credential.user.photoURL || null,
                    spentCoins: 0,
                    activeBadges: [],
                };
                try {
                    await setDoc(doc(db, "users", credential.user.uid), {
                        username: fallbackUser.username,
                        name: fallbackUser.name,
                        email: fallbackUser.email,
                        phone: fallbackUser.phone,
                        role: "user" as UserRole,
                        memberSince,
                        createdAt: serverTimestamp(),
                    });
                } catch {
                    console.warn("Could not create missing user document in Firestore.");
                }
                setAppUser(fallbackUser);
            }
        } catch (err) {
            console.error("Error fetching user document:", err);
            // Still set a basic user so the app functions
            setAppUser({
                uid: credential.user.uid,
                username: credential.user.uid.substring(0, 8),
                name: credential.user.displayName || "Player",
                email: credential.user.email || "",
                phone: "",
                role: "user",
                memberSince: new Date().toISOString().split("T")[0],
            });
        }
    }

    // Logout
    async function logout() {
        await signOut(auth);
        setAppUser(null);
    }

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userData = await fetchUserDoc(user.uid);
                    setAppUser(userData);
                } catch (err) {
                    console.warn("Could not fetch user doc on auth change:", err);
                    // Set a basic user from auth data
                    setAppUser({
                        uid: user.uid,
                        username: user.uid.substring(0, 8),
                        name: user.displayName || "Player",
                        email: user.email || "",
                        phone: "",
                        role: "user",
                        memberSince: new Date().toISOString().split("T")[0],
                    });
                }
            } else {
                setAppUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        appUser,
        loading,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
