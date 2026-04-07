import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/contexts/AuthContext";

export function useFirestoreUsers() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: AppUser[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    return {
                        uid: docSnap.id,
                        username: d.username || "",
                        name: d.name || "",
                        email: d.email || "",
                        phone: d.phone || "",
                        role: d.role || "user",
                        memberSince: d.memberSince || "",
                        isSuspended: d.isSuspended || false,
                        spentCoins: d.spentCoins || 0,
                        discountPercentage: d.discountPercentage || 0,
                        activeBadges: d.activeBadges || [],
                    };
                });
                setUsers(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore users listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    const updateUserRole = async (uid: string, role: UserRole) => {
        try {
            await updateDoc(doc(db, "users", uid), { role });
        } catch (err) {
            console.error("Error updating user role:", err);
            throw err;
        }
    };

    const deleteUser = async (uid: string) => {
        try {
            await deleteDoc(doc(db, "users", uid));
        } catch (err) {
            console.error("Error deleting user:", err);
            throw err;
        }
    };

    const toggleSuspension = async (uid: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "users", uid), { isSuspended: !currentStatus });
        } catch (err) {
            console.error("Error toggling suspension:", err);
            throw err;
        }
    };

    const updateDiscount = async (uid: string, discount: number) => {
        try {
            await updateDoc(doc(db, "users", uid), { discountPercentage: discount });
        } catch (err) {
            console.error("Error updating discount:", err);
            throw err;
        }
    };

    const updateBadges = async (uid: string, badges: number[]) => {
        try {
            await updateDoc(doc(db, "users", uid), { activeBadges: badges });
        } catch (err) {
            console.error("Error updating badges:", err);
            throw err;
        }
    };

    return { users, loading, error, updateUserRole, deleteUser, toggleSuspension, updateDiscount, updateBadges };
}
