import { useState, useEffect } from "react";
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booking } from "@/lib/store";

export function useFirestoreBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener on "bookings" collection
    useEffect(() => {
        const q = query(collection(db, "bookings"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: Booking[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    return {
                        id: docSnap.id,
                        userId: d.userId || "",
                        name: d.name || "",
                        phone: d.phone || "",
                        court: d.court as 1 | 2,
                        type: d.type as Booking["type"],
                        startHour: d.startHour,
                        endHour: d.endHour,
                        date: d.date || "",
                        price: d.price || 0,
                        status: (d.status || "pending") as Booking["status"],
                        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
                        discountBadge: d.discountBadge as Booking["discountBadge"] | undefined,
                    };
                });
                setBookings(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore bookings listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    // Add a booking to Firestore
    async function addBooking(booking: Omit<Booking, "id">) {
        await addDoc(collection(db, "bookings"), {
            ...booking,
            createdAt: serverTimestamp(),
        });
    }

    // Update booking status in Firestore
    async function updateBookingStatus(id: string, status: Booking["status"]) {
        await updateDoc(doc(db, "bookings", id), { status });
    }

    // Delete a booking from Firestore
    async function removeBooking(id: string) {
        await deleteDoc(doc(db, "bookings", id));
    }

    // Cancel a booking from Firestore checking 5 hours difference
    async function cancelBooking(id: string, dateStr: string, startHour: number) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const startTime = new Date(year, month - 1, day, startHour, 0, 0);
        const now = new Date();
        
        const diffMs = startTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 5) {
            throw new Error("You cannot cancel this reservation less than 5 hours before the start time.");
        }

        await updateDoc(doc(db, "bookings", id), { status: "cancelled" });
    }

    return {
        bookings,
        loading,
        error,
        addBooking,
        updateBookingStatus,
        removeBooking,
        cancelBooking,
    };
}
