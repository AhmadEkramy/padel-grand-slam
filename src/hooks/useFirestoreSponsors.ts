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

export interface Sponsor {
    id: string;
    title: string;
    description: string;
    img: string;
    link?: string;
}

export function useFirestoreSponsors() {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener on "sponsors" collection
    useEffect(() => {
        const q = query(collection(db, "sponsors"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: Sponsor[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    return {
                        id: docSnap.id,
                        title: d.title || "",
                        description: d.description || "",
                        img: d.img || "",
                        link: d.link || ""
                    };
                });
                setSponsors(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore sponsors listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    // Add a sponsor to Firestore
    async function addSponsorFirestore(sponsor: Omit<Sponsor, "id">) {
        await addDoc(collection(db, "sponsors"), {
            ...sponsor,
            createdAt: serverTimestamp(),
        });
    }

    // Update sponsor in Firestore
    async function updateSponsorFirestore(id: string, sponsorData: Partial<Sponsor>) {
        await updateDoc(doc(db, "sponsors", id), sponsorData);
    }

    // Delete a sponsor from Firestore
    async function removeSponsorFirestore(id: string) {
        await deleteDoc(doc(db, "sponsors", id));
    }

    return {
        sponsors,
        loading,
        error,
        addSponsorFirestore,
        updateSponsorFirestore,
        removeSponsorFirestore,
    };
}
