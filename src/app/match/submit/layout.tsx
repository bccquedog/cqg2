"use client";

import RequireAuth from "@/components/RequireAuth";

export default function SubmitMatchLayout({ children }: { children: React.ReactNode }) {
	return <RequireAuth>{children}</RequireAuth>;
}


