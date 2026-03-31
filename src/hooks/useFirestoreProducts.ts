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
import type { Product } from "@/lib/store";

export function useFirestoreProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener on "products" collection
    useEffect(() => {
        const q = query(collection(db, "products"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: Product[] = snapshot.docs.map((docSnap) => {
                    const d = docSnap.data();
                    return {
                        id: docSnap.id,
                        name: d.name || "",
                        price: d.price || "",
                        description: d.description || "",
                        img: d.img || ""
                    };
                });
                setProducts(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Firestore products listener error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    // Add a product to Firestore
    async function addProductFirestore(product: Omit<Product, "id">) {
        await addDoc(collection(db, "products"), {
            ...product,
            createdAt: serverTimestamp(),
        });
    }

    // Update product in Firestore
    async function updateProductFirestore(id: string, productData: Partial<Product>) {
        await updateDoc(doc(db, "products", id), productData);
    }

    // Delete a product from Firestore
    async function removeProductFirestore(id: string) {
        await deleteDoc(doc(db, "products", id));
    }

    return {
        products,
        loading,
        error,
        addProductFirestore,
        updateProductFirestore,
        removeProductFirestore,
    };
}
