"use client";

import "./globals.css";
import "../styles/mobile-optimizations.css";
import { useEffect, useState } from "react";
import { ensureGuestAuth } from "@/lib/firebase";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import ConsolidatedAuthModal from "@/components/ConsolidatedAuthModal";
import OnboardingSystem from "@/components/OnboardingSystem";
import CQGToast from "@/components/ui/CQGToast";
import PageTransition from "@/components/PageTransition";
import DiscordCallbackHandler from "@/components/DiscordCallbackHandler";
import { Suspense } from "react";

function HeaderNav() {
	const { user, signOut, needsGamerTagSetup, completeGamerTagSetup } = useAuth();
	const { needsOnboarding, completeOnboarding } = useOnboarding();
	const [authOpen, setAuthOpen] = useState(false);
	const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	
	return (
		<>
			<nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo and Brand */}
						<div className="flex items-center">
							<a href="/" className="flex items-center space-x-2 group min-h-[44px] min-w-[44px] flex items-center">
								<div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
									<span className="text-white font-bold text-sm">CQG</span>
								</div>
								<span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
									Platform
								</span>
							</a>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center space-x-1">
							<a href="/" className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
								Home
							</a>
							<a href="/tournaments" className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
								Tournaments
							</a>
							<a href="/players" className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
								Players
							</a>
							{process.env.NODE_ENV !== 'production' && (
								<a href="/dev-test" className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200">
									Dev Test
								</a>
							)}
						</div>

						{/* Desktop Auth Section */}
						<div className="hidden md:flex items-center space-x-3">
							{user ? (
								<>
									<a 
										href={`/profile/${user.uid}`} 
										className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm transition-all duration-200"
									>
										My Profile
									</a>
									<a 
										href="/settings" 
										className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200"
									>
										Settings
									</a>
									<button 
										onClick={() => signOut()} 
										className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200"
									>
										Sign Out
									</button>
								</>
							) : (
								<div className="flex items-center space-x-3">
									<button 
										onClick={() => {
											setAuthMode("signin");
											setAuthOpen(true);
										}} 
										className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200"
									>
										Sign In
									</button>
									<button 
										onClick={() => {
											setAuthMode("signup");
											setAuthOpen(true);
										}} 
										className="min-h-[44px] min-w-[44px] flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm transition-all duration-200"
									>
										Sign Up
									</button>
								</div>
							)}
						</div>

						{/* Mobile menu button */}
						<div className="md:hidden flex items-center space-x-2">
							{user ? (
								<button 
									onClick={() => signOut()} 
									className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
								>
									Sign Out
								</button>
							) : (
								<button 
									onClick={() => {
										setAuthMode("signup");
										setAuthOpen(true);
									}} 
									className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm transition-all duration-200"
								>
									Sign Up
								</button>
							)}
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
								aria-label="Toggle mobile menu"
							>
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{mobileMenuOpen ? (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									) : (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
									)}
								</svg>
							</button>
						</div>
					</div>

					{/* Mobile Navigation Menu */}
					{mobileMenuOpen && (
						<div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
							<div className="px-2 pt-2 pb-3 space-y-1">
								<a 
									href="/" 
									className="min-h-[44px] flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
									onClick={() => setMobileMenuOpen(false)}
								>
									Home
								</a>
								<a 
									href="/tournaments" 
									className="min-h-[44px] flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
									onClick={() => setMobileMenuOpen(false)}
								>
									Tournaments
								</a>
								<a 
									href="/players" 
									className="min-h-[44px] flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
									onClick={() => setMobileMenuOpen(false)}
								>
									Players
								</a>
								{process.env.NODE_ENV !== 'production' && (
									<a 
										href="/dev-test" 
										className="min-h-[44px] flex items-center px-4 py-3 text-base font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200"
										onClick={() => setMobileMenuOpen(false)}
									>
										Dev Test
									</a>
								)}
								{user && (
									<>
										<a 
											href={`/profile/${user.uid}`} 
											className="min-h-[44px] flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
											onClick={() => setMobileMenuOpen(false)}
										>
											My Profile
										</a>
										<a 
											href="/settings" 
											className="min-h-[44px] flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
											onClick={() => setMobileMenuOpen(false)}
										>
											Settings
										</a>
									</>
								)}
								{!user && (
									<button 
										onClick={() => {
											setAuthMode("signin");
											setAuthOpen(true);
											setMobileMenuOpen(false);
										}} 
										className="min-h-[44px] w-full flex items-center px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
									>
										Sign In
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</nav>
			<ConsolidatedAuthModal 
				open={authOpen} 
				onClose={() => setAuthOpen(false)} 
				initialMode={authMode}
			/>
			{user && needsOnboarding && (
				<OnboardingSystem
					open={needsOnboarding}
					onComplete={completeOnboarding}
				/>
			)}
			<CQGToast />
		</>
	);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		ensureGuestAuth();
	}, []);
	return (
		<html lang="en">
            <body className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 min-h-screen">
                <AuthProvider>
                    <ToastProvider>
                        <HeaderNav />
                        <main className="min-h-screen mobile-viewport">
                            <Suspense fallback={null}>
                                <DiscordCallbackHandler />
                            </Suspense>
                            <PageTransition>
                                {children}
                            </PageTransition>
                        </main>
                    </ToastProvider>
                </AuthProvider>
            </body>
		</html>
	);
}
