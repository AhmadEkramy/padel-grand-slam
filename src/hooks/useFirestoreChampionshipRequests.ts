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

export interface ChampionshipRequest {
    id: string;
    userId: string;
    userName: string;
    phone: string;
    championshipId: string;
    championshipTitle: string;
    teamName: string;
    status: "pending" | "accepted" | "rejected";
}

export function useFirestoreChampionshipRequests() {
    const [requests, setRequests] = useState<ChampionshipRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "championshipRequests"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: ChampionshipRequest[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    return {
                        id: docSnap.id,
                        userId: d.userId || "",
                        userName: d.userName || "",
                        phone: d.phone || "",
                        championshipId: d.championshipId || "",
                        championshipTitle: d.championshipTitle || "",
                        teamName: d.teamName || "",
                        status: (d.status || "pending") as ChampionshipRequest["status"],
                    };
                });
                setRequests(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore championship requests listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    const addRequestFirestore = async (req: Omit<ChampionshipRequest, "id" | "status">) => {
        await addDoc(collection(db, "championshipRequests"), {
            ...req,
            status: "pending",
            createdAt: serverTimestamp(),
        });
    };

    const updateRequestStatusFirestore = async (id: string, status: ChampionshipRequest["status"]) => {
        await updateDoc(doc(db, "championshipRequests", id), { status });
    };

    const removeRequestFirestore = async (id: string) => {
        await deleteDoc(doc(db, "championshipRequests", id));
    };

    return {
        requests,
        loading,
        error,
        addRequestFirestore,
        updateRequestStatusFirestore,
        removeRequestFirestore,
    };
}
