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

export interface Training {
    id: string;
    title: string;
    description: string;
    img: string;
    price: number;
}

export function useFirestoreTrainings() {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener on "trainings" collection
    useEffect(() => {
        const q = query(collection(db, "trainings"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: Training[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    return {
                        id: docSnap.id,
                        title: d.title || "",
                        description: d.description || "",
                        img: d.img || "",
                        price: Number(d.price) || 0
                    };
                });
                setTrainings(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore trainings listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    // Add a training to Firestore
    async function addTrainingFirestore(training: Omit<Training, "id">) {
        await addDoc(collection(db, "trainings"), {
            ...training,
            createdAt: serverTimestamp(),
        });
    }

    // Update training in Firestore
    async function updateTrainingFirestore(id: string, trainingData: Partial<Training>) {
        await updateDoc(doc(db, "trainings", id), trainingData);
    }

    // Delete a training from Firestore
    async function removeTrainingFirestore(id: string) {
        await deleteDoc(doc(db, "trainings", id));
    }

    return {
        trainings,
        loading,
        error,
        addTrainingFirestore,
        updateTrainingFirestore,
        removeTrainingFirestore,
    };
}
