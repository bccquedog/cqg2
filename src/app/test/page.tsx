"use client";
import { useEffect } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";

export default function TestPage() {
  useEffect(() => {
    const run = async () => {
      const snapshot = await getDocs(collection(db, "membershipPlans"));
      snapshot.forEach(doc => console.log(doc.id, doc.data()));
    };
    run();
  }, []);

  return <h1>Firestore Connection Test</h1>;
}


