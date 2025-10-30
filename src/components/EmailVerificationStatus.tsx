"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface EmailVerificationStatusProps {
  email: string;
  className?: string;
}

export default function EmailVerificationStatus({ 
  email, 
  className = "" 
}: EmailVerificationStatusProps) {
  const { emailVerified, sendEmailVerification, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const success = await resendVerificationEmail(email);
      if (success) {
        showToast("Verification email sent!", "success");
      } else {
        showToast("Failed to send verification email. Please try again.", "error");
      }
    } catch (error) {
      showToast("Failed to send verification email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (emailVerified) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Email verified</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2 text-amber-800">
        <AlertCircle className="w-4 h-4" />
        <div>
          <p className="text-sm font-medium">Email not verified</p>
          <p className="text-xs text-amber-700">Check your inbox for verification email</p>
        </div>
      </div>
      <button
        onClick={handleResendVerification}
        disabled={loading}
        className="flex items-center space-x-1 text-amber-700 hover:text-amber-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Mail className="w-3 h-3" />
            <span>Resend</span>
          </>
        )}
      </button>
    </div>
  );
}
