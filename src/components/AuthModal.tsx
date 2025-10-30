"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentContext } from "@/hooks/useTournamentContext";
import { useToast } from "@/components/Toast";
import GamerTagModal from "@/components/GamerTagModal";
import EmailVerificationModal from "@/components/EmailVerificationModal";

interface AuthModalProps {
	open: boolean;
	onClose: () => void;
	initialMode?: "signin" | "signup";
}

export default function AuthModal({ open, onClose, initialMode = "signin" }: AuthModalProps) {
	const { signIn, signUp, completeSignUp, signInWithGoogle, signInWithDiscord } = useAuth();
	const { tournamentId, isJoinPage } = useTournamentContext();
	const { showToast } = useToast();
	const [mode, setMode] = useState<"signin" | "signup">(initialMode);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [gamerTagModalOpen, setGamerTagModalOpen] = useState(false);
	const [emailVerificationModalOpen, setEmailVerificationModalOpen] = useState(false);
	const [pendingTournament, setPendingTournament] = useState<{id: string, name: string} | null>(null);

	// Update mode when initialMode changes
	useEffect(() => {
		setMode(initialMode);
	}, [initialMode]);

	if (!open) return null;

	const submit = async () => {
		setLoading(true);
		setError(null);
		try {
			if (mode === "signin") {
				await signIn(email, password);
				onClose();
			} else {
				const result = await signUp(email, password, isJoinPage ? tournamentId : undefined);
				
				if (result.needsEmailVerification) {
					// Show email verification modal
					setEmailVerificationModalOpen(true);
				} else if (result.needsGamerTag) {
					// Get tournament info from session storage
					const storedTournament = sessionStorage.getItem('pendingTournament');
					if (storedTournament) {
						setPendingTournament(JSON.parse(storedTournament));
					}
					setGamerTagModalOpen(true);
				} else {
					onClose();
					// Show success toast
					if (result.tournamentName) {
						showToast(`Welcome to CQG! You've been added to ${result.tournamentName}.`, "success");
					} else {
						showToast("Welcome to CQG! Profile created successfully.", "success");
					}
				}
			}
		} catch (e: any) {
			setError(e?.message || "Authentication failed");
		} finally {
			setLoading(false);
		}
	};

	const handleGamerTagComplete = async (gamerTag: string) => {
		try {
			const result = await completeSignUp(gamerTag, pendingTournament?.id);
			setGamerTagModalOpen(false);
			onClose();
			
			// Show success toast
			if (result.tournamentName) {
				showToast(`Welcome to CQG! You've been added to ${result.tournamentName}.`, "success");
			} else {
				showToast("Welcome to CQG! Profile created successfully.", "success");
			}
		} catch (e: any) {
			setError(e?.message || "Failed to complete signup");
		}
	};

	return (
		<>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				{/* Backdrop with blur */}
				<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
				
				{/* Modal */}
				<div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden">
					{/* Gradient header */}
					<div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 text-white relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
						<div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
						
						<div className="relative z-10 flex items-center justify-between">
							<div>
								<h3 className="text-2xl font-bold">{mode === "signin" ? "Welcome Back" : "Join CQG"}</h3>
								<p className="text-blue-100 text-sm mt-1">
									{mode === "signin" ? "Sign in to your account" : "Create your gaming profile"}
								</p>
							</div>
							<button 
								onClick={onClose} 
								className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 space-y-6">
						{isJoinPage && tournamentId && (
							<div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
										<span className="text-white text-sm">🏆</span>
									</div>
									<div>
										<p className="text-amber-800 font-medium text-sm">Tournament Auto-Join</p>
										<p className="text-amber-700 text-xs mt-1">
											After signing up, you'll automatically be added to this tournament!
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Form */}
						<div className="space-y-4">
							<div className="space-y-2">
								<label className="block text-sm font-semibold text-gray-700">Email Address</label>
								<div className="relative">
									<input 
										value={email} 
										onChange={(e) => setEmail(e.target.value)} 
										type="email" 
										className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500" 
										placeholder="you@example.com"
									/>
									<div className="absolute inset-y-0 right-0 flex items-center pr-3">
										<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
										</svg>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<label className="block text-sm font-semibold text-gray-700">Password</label>
								<div className="relative">
									<input 
										value={password} 
										onChange={(e) => setPassword(e.target.value)} 
										type="password" 
										className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500" 
										placeholder="••••••••••"
									/>
									<div className="absolute inset-y-0 right-0 flex items-center pr-3">
										<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
								</div>
							</div>
						</div>

						{/* Error message */}
						{error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-xl">
								<div className="flex items-center gap-2">
									<svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<p className="text-red-700 text-sm font-medium">{error}</p>
								</div>
							</div>
						)}

						{/* Primary button */}
						<button 
							onClick={submit} 
							disabled={loading} 
							className="w-full min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									<span>Working...</span>
								</>
							) : (
								<>
									<span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</>
							)}
						</button>

						{/* Social sign-in */}
						<div className="space-y-3">
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-4 bg-white text-gray-500">Or continue with</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								{/* Google Sign In */}
								<button
									onClick={() => signInWithGoogle(isJoinPage ? tournamentId : undefined)}
									className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-700 font-medium"
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									<span>Google</span>
								</button>

								{/* Discord Sign In */}
								<button
									onClick={() => signInWithDiscord(isJoinPage ? tournamentId : undefined)}
									className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 border border-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200 text-white font-medium"
								>
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
									</svg>
									<span>Discord</span>
								</button>
							</div>
						</div>

						{/* Switch mode */}
						<div className="text-center pt-4">
							{mode === "signin" ? (
								<p className="text-gray-600 text-sm">
									Don't have an account?{" "}
									<button 
										className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200" 
										onClick={() => setMode("signup")}
									>
										Sign Up
									</button>
								</p>
							) : (
								<p className="text-gray-600 text-sm">
									Already have an account?{" "}
									<button 
										className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200" 
										onClick={() => setMode("signin")}
									>
										Sign In
									</button>
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
			<GamerTagModal
				open={gamerTagModalOpen}
				onComplete={handleGamerTagComplete}
				onCancel={() => {
					setGamerTagModalOpen(false);
					// Sign out the user if they cancel gamer tag selection
					signOut();
				}}
				tournamentName={pendingTournament?.name}
			/>
			<EmailVerificationModal
				open={emailVerificationModalOpen}
				onClose={() => {
					setEmailVerificationModalOpen(false);
					// Get tournament info from session storage for gamer tag modal
					const storedTournament = sessionStorage.getItem('pendingTournament');
					if (storedTournament) {
						setPendingTournament(JSON.parse(storedTournament));
						setGamerTagModalOpen(true);
					}
				}}
				email={email}
				userName={email.split('@')[0]}
				tournamentName={pendingTournament?.name}
			/>
		</>
	);
}
