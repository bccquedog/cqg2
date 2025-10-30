"use client";

import RequireAuth from "@/components/RequireAuth";

export default function ProfileSectionLayout({ children }: { children: React.ReactNode }) {
	return <RequireAuth>{children}</RequireAuth>;
}


