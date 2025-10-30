"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";
import { X, Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  userName?: string;
  tournamentName?: string;
}

export default function EmailVerificationModal({
  open,
  onClose,
  email,
  userName,
  tournamentName
}: EmailVerificationModalProps) {
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!open) return null;

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await verifyEmail(verificationCode, email);
      
      if (success) {
        showToast("Email verified successfully! Welcome to CQG Platform!", "success");
        onClose();
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      setError("Failed to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);

    try {
      const success = await resendVerificationEmail(email);
      
      if (success) {
        showToast("New verification email sent!", "success");
        setResendCooldown(60); // 60 second cooldown
      } else {
        setError("Failed to resend verification email. Please try again.");
      }
    } catch (error) {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Verify Your Email</h2>
              <p className="text-sm text-gray-600">Check your inbox for the verification code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Verification email sent to:</span>
            </div>
            <p className="text-blue-700 font-mono text-sm mt-1">{email}</p>
            {tournamentName && (
              <p className="text-blue-600 text-sm mt-1">
                Tournament: <span className="font-medium">{tournamentName}</span>
              </p>
            )}
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
              Enter Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
              maxLength={6}
              disabled={loading}
            />
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">What to do next:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Look for an email from CQG Platform</li>
              <li>3. Enter the 6-digit verification code above</li>
              <li>4. Click "Verify Email" to complete setup</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleVerify}
              disabled={loading || !verificationCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify Email</span>
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend in {resendCooldown}s</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                resend verification email
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
