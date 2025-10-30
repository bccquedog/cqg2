"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({ children }: { children: ReactNode }) {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		if (!loading) {
			if (user) {
				setShouldRender(true);
			} else {
				// Redirect to home page if not authenticated
				router.push("/");
			}
		}
	}, [user, loading, router]);

	if (loading) {
		return (
			<div className="p-6 text-center">
				<div className="text-gray-600">Loading...</div>
			</div>
		);
	}

	if (!shouldRender) {
		return (
			<div className="p-6 text-center">
				<div className="text-gray-600">Redirecting...</div>
			</div>
		);
	}

	return <>{children}</>;
}
