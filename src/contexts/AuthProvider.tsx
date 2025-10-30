"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
	User,
	onAuthStateChanged,
	setPersistence,
	browserLocalPersistence,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	GoogleAuthProvider,
	signInWithPopup,
	OAuthProvider
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, arrayUnion, updateDoc, getDoc } from "firebase/firestore";
import { createGamerTagRecord } from "@/lib/gamerTagSystem";
import { useRouter } from "next/navigation";

interface AuthContextValue {
	user: User | null;
	loading: boolean;
	needsGamerTagSetup: boolean;
	emailVerified: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, tournamentId?: string) => Promise<{ success: boolean; tournamentName?: string; needsGamerTag: boolean; needsEmailVerification: boolean }>;
	completeSignUp: (gamerTag: string, tournamentId?: string) => Promise<{ success: boolean; tournamentName?: string }>;
	signOut: () => Promise<void>;
	signInWithGoogle: (tournamentId?: string) => Promise<{ success: boolean; tournamentName?: string; needsGamerTag: boolean }>;
	signInWithDiscord: (tournamentId?: string) => Promise<{ success: boolean; tournamentName?: string; needsGamerTag: boolean }>;
	completeGamerTagSetup: () => void;
	sendEmailVerification: (email: string, userName?: string, tournamentName?: string) => Promise<boolean>;
	verifyEmail: (code: string, email: string) => Promise<boolean>;
	resendVerificationEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [needsGamerTagSetup, setNeedsGamerTagSetup] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setPersistence(auth, browserLocalPersistence).catch(() => {});
		const unsub = onAuthStateChanged(auth, async (u) => {
			setUser(u);
			if (u) {
				// Check email verification status
				setEmailVerified(u.emailVerified);
				
				// Check if user needs gamer tag setup
				try {
					const playerRef = doc(db, "players", u.uid);
					const playerSnap = await getDoc(playerRef);
					
					if (!playerSnap.exists() || !playerSnap.data()?.gamerTag) {
						setNeedsGamerTagSetup(true);
					} else {
						setNeedsGamerTagSetup(false);
					}
				} catch (error) {
					console.error("Error checking player profile:", error);
					setNeedsGamerTagSetup(false);
				}
			} else {
				setNeedsGamerTagSetup(false);
				setEmailVerified(false);
			}
			setLoading(false);
		});
		return () => unsub();
	}, []);

	const signIn = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password);
	};

	const signUp = async (email: string, password: string, tournamentId?: string) => {
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		const uid = cred.user.uid;
		
		// Store tournament context for later use
		let tournamentName: string | undefined;
		if (tournamentId) {
			try {
				const tournamentRef = doc(db, "tournaments", tournamentId);
				const tournamentSnap = await getDoc(tournamentRef);
				
				if (tournamentSnap.exists()) {
					const tournamentData = tournamentSnap.data();
					tournamentName = tournamentData.name;
					// Store tournament info in sessionStorage for gamer tag completion
					sessionStorage.setItem('pendingTournament', JSON.stringify({
						id: tournamentId,
						name: tournamentData.name
					}));
				}
			} catch (error) {
				console.error("Failed to get tournament info:", error);
			}
		}

		// Send email verification
		try {
			const response = await fetch('/api/auth/send-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					userId: uid,
					userName: email.split('@')[0], // Use email prefix as default name
					tournamentName
				}),
			});

			if (!response.ok) {
				console.error('Failed to send verification email');
			}
		} catch (error) {
			console.error('Error sending verification email:', error);
		}

		return { 
			success: true, 
			tournamentName, 
			needsGamerTag: true, 
			needsEmailVerification: true 
		};
	};

	const completeSignUp = async (gamerTag: string, tournamentId?: string) => {
		if (!auth.currentUser) throw new Error("No authenticated user");
		
		const uid = auth.currentUser.uid;
		
		// Create player profile in Firestore with gamer tag
		await setDoc(doc(db, "players", uid), {
			displayName: gamerTag,
			gamerTag: gamerTag,
			email: auth.currentUser.email,
			createdAt: serverTimestamp(),
			status: "active",
			stats: {},
			wallet: 1000 // Starting CQG Coins
		});

		// Create gamer tag record
		await createGamerTagRecord(gamerTag, uid);

		let tournamentName: string | undefined;
		
		// Auto-join tournament if tournamentId provided
		if (tournamentId) {
			try {
				const tournamentRef = doc(db, "tournaments", tournamentId);
				const tournamentSnap = await getDoc(tournamentRef);
				
				if (tournamentSnap.exists()) {
					const tournamentData = tournamentSnap.data();
					tournamentName = tournamentData.name;
					
					// Add player to tournament players array
					await updateDoc(tournamentRef, {
						players: arrayUnion(uid)
					});
					
					// Create roster record with gamer tag
					await setDoc(doc(db, "tournaments", tournamentId, "roster", uid), {
						playerId: uid,
						gamerTag: gamerTag,
						joinedAt: serverTimestamp(),
						status: "active"
					});
				}
			} catch (error) {
				console.error("Failed to auto-join tournament:", error);
			}
		}

		// Clear pending tournament from session
		sessionStorage.removeItem('pendingTournament');

		return { success: true, tournamentName };
	};

	const signOut = async () => {
		await firebaseSignOut(auth);
	};

	const completeGamerTagSetup = () => {
		setNeedsGamerTagSetup(false);
		// Redirect to profile after setup
		if (user) {
			router.push(`/profile/${user.uid}`);
		}
	};

	const sendEmailVerification = async (email: string, userName?: string, tournamentName?: string): Promise<boolean> => {
		if (!user) return false;

		try {
			const response = await fetch('/api/auth/send-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					userId: user.uid,
					userName,
					tournamentName
				}),
			});

			return response.ok;
		} catch (error) {
			console.error('Error sending verification email:', error);
			return false;
		}
	};

	const verifyEmail = async (code: string, email: string): Promise<boolean> => {
		if (!user) return false;

		try {
			const response = await fetch('/api/auth/verify-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					code,
					email,
					userId: user.uid
				}),
			});

			if (response.ok) {
				// Refresh user to get updated email verification status
				await user.reload();
				setEmailVerified(user.emailVerified);
			}

			return response.ok;
		} catch (error) {
			console.error('Error verifying email:', error);
			return false;
		}
	};

	const resendVerificationEmail = async (email: string): Promise<boolean> => {
		if (!user) return false;

		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					userId: user.uid
				}),
			});

			return response.ok;
		} catch (error) {
			console.error('Error resending verification email:', error);
			return false;
		}
	};

	const signInWithGoogle = async (tournamentId?: string) => {
		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);
		const uid = result.user.uid;
		
		// Check if user profile exists
		const playerRef = doc(db, "players", uid);
		const playerSnap = await getDoc(playerRef);
		
		if (!playerSnap.exists()) {
			// New Google user - needs gamer tag
			if (tournamentId) {
				try {
					const tournamentRef = doc(db, "tournaments", tournamentId);
					const tournamentSnap = await getDoc(tournamentRef);
					
					if (tournamentSnap.exists()) {
						const tournamentData = tournamentSnap.data();
						// Store tournament info in sessionStorage for gamer tag completion
						sessionStorage.setItem('pendingTournament', JSON.stringify({
							id: tournamentId,
							name: tournamentData.name
						}));
					}
				} catch (error) {
					console.error("Failed to get tournament info:", error);
				}
			}
			
			return { success: true, tournamentName: undefined, needsGamerTag: true };
		}

		// Existing user - auto-join tournament if provided
		let tournamentName: string | undefined;
		
		if (tournamentId) {
			try {
				const tournamentRef = doc(db, "tournaments", tournamentId);
				const tournamentSnap = await getDoc(tournamentRef);
				
				if (tournamentSnap.exists()) {
					const tournamentData = tournamentSnap.data();
					tournamentName = tournamentData.name;
					
					// Add player to tournament players array
					await updateDoc(tournamentRef, {
						players: arrayUnion(uid)
					});
					
					// Create roster record with gamer tag
					const playerData = playerSnap.data();
					await setDoc(doc(db, "tournaments", tournamentId, "roster", uid), {
						playerId: uid,
						gamerTag: playerData.gamerTag || playerData.displayName,
						joinedAt: serverTimestamp(),
						status: "active"
					});
				}
			} catch (error) {
				console.error("Failed to auto-join tournament:", error);
			}
		}

		return { success: true, tournamentName, needsGamerTag: false };
	};

	const signInWithDiscord = async (tournamentId?: string) => {
		// Note: Discord OAuth2 is handled differently from Google OAuth
		// We'll redirect to Discord OAuth and handle the callback separately
		const discordClient = (await import('@/lib/discordClient')).discordClient;
		const state = tournamentId || 'default';
		const authUrl = discordClient.generateAuthUrl(state);
		
		// Store tournament info in sessionStorage for callback handling
		if (tournamentId) {
			try {
				const tournamentRef = doc(db, "tournaments", tournamentId);
				const tournamentSnap = await getDoc(tournamentRef);
				
				if (tournamentSnap.exists()) {
					const tournamentData = tournamentSnap.data();
					sessionStorage.setItem('pendingTournament', JSON.stringify({
						id: tournamentId,
						name: tournamentData.name
					}));
				}
			} catch (error) {
				console.error("Failed to get tournament info:", error);
			}
		}
		
		// Redirect to Discord OAuth
		window.location.href = authUrl;
		
		// Return a placeholder response since we're redirecting
		return { success: false, tournamentName: undefined, needsGamerTag: false };
	};

	const value = useMemo(() => ({ 
		user, 
		loading, 
		needsGamerTagSetup, 
		emailVerified,
		signIn, 
		signUp, 
		completeSignUp, 
		signOut, 
		signInWithGoogle, 
		signInWithDiscord,
		completeGamerTagSetup,
		sendEmailVerification,
		verifyEmail,
		resendVerificationEmail
	}), [user, loading, needsGamerTagSetup, emailVerified]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
	return ctx;
}
