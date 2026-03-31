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

export interface Championship {
    id: string;
    title: string;
    description: string;
    img: string;
    date: string;
    time: string;
    teams: string[];
}

export function useFirestoreChampionships() {
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "championships"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: Championship[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    
                    // Migration support from teamA/teamB to teams array
                    let teams = Array.isArray(d.teams) ? d.teams : [];
                    if (d.teamA && !teams.includes(d.teamA)) teams.push(d.teamA);
                    if (d.teamB && !teams.includes(d.teamB)) teams.push(d.teamB);

                    return {
                        id: docSnap.id,
                        title: d.title || "",
                        description: d.description || "",
                        img: d.img || "",
                        date: d.date || "",
                        time: d.time || "",
                        teams: teams
                    };
                });
                setChampionships(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore championships listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    const addChampionshipFirestore = async (champ: Omit<Championship, "id">) => {
        await addDoc(collection(db, "championships"), {
            ...champ,
            createdAt: serverTimestamp(),
        });
    };

    const updateChampionshipFirestore = async (id: string, champData: Partial<Championship>) => {
        await updateDoc(doc(db, "championships", id), champData);
    };

    const removeChampionshipFirestore = async (id: string) => {
        await deleteDoc(doc(db, "championships", id));
    };

    return {
        championships,
        loading,
        error,
        addChampionshipFirestore,
        updateChampionshipFirestore,
        removeChampionshipFirestore,
    };
}
