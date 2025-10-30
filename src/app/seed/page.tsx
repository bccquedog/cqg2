"use client";

import { useState } from "react";
import { seedTestData } from "@/utils/seedTestData";

export default function SeedPage() {
  const [status, setStatus] = useState("");

  const runSeeder = async () => {
    setStatus("⏳ Seeding...");
    await seedTestData();
    setStatus("✅ Done seeding!");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">CQG Seeder</h1>
      <button
        onClick={runSeeder}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Run Seeder
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
