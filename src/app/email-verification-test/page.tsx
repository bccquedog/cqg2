"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";
import EmailVerificationModal from "@/components/EmailVerificationModal";
import EmailVerificationStatus from "@/components/EmailVerificationStatus";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function EmailVerificationTestPage() {
  const { user, emailVerified, sendEmailVerification, verifyEmail, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();
  const [emailVerificationModalOpen, setEmailVerificationModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendTestVerification = async () => {
    if (!user) {
      showToast("Please sign in first", "error");
      return;
    }

    setLoading(true);
    try {
      const success = await sendEmailVerification(testEmail, "Test User", "Test Tournament");
      if (success) {
        showToast("Test verification email sent!", "success");
        setEmailVerificationModalOpen(true);
      } else {
        showToast("Failed to send test verification email", "error");
      }
    } catch (error) {
      showToast("Failed to send test verification email", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTestCode = async () => {
    if (!user) {
      showToast("Please sign in first", "error");
      return;
    }

    setLoading(true);
    try {
      const success = await verifyEmail(verificationCode, testEmail);
      if (success) {
        showToast("Email verified successfully!", "success");
      } else {
        showToast("Invalid verification code", "error");
      }
    } catch (error) {
      showToast("Failed to verify email", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendTestVerification = async () => {
    if (!user) {
      showToast("Please sign in first", "error");
      return;
    }

    setLoading(true);
    try {
      const success = await resendVerificationEmail(testEmail);
      if (success) {
        showToast("Test verification email resent!", "success");
      } else {
        showToast("Failed to resend test verification email", "error");
      }
    } catch (error) {
      showToast("Failed to resend test verification email", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verification Test</h1>
            <p className="text-gray-600">Test the Postmark email verification system</p>
          </div>

          {/* User Status */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Status</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">User:</span>
                <span className="text-sm text-gray-600">{user ? user.email : "Not signed in"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Email Verified:</span>
                {emailVerified ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Yes</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">No</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Verification Status Component */}
          {user && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Verification Status</h2>
              <EmailVerificationStatus email={user.email || ""} />
            </div>
          )}

          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Email Verification</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter test email address"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSendTestVerification}
                    disabled={loading || !user}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Test Verification</span>
                  </button>

                  <button
                    onClick={handleResendTestVerification}
                    disabled={loading || !user}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Resend Test Verification</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Verification Code Test */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Verification Test</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-center"
                    placeholder="Enter 6-digit verification code"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleVerifyTestCode}
                  disabled={loading || !user || !verificationCode.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Email Templates Preview */}
          <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h2>
            <p className="text-gray-600 mb-4">
              The email verification system includes professionally designed templates for:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Email verification with 6-digit code</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Welcome email after successful verification</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Password reset emails</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Tournament invitation emails</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              All templates are designed with the CQG Platform branding, using professional colors,
              typography, and responsive layouts that work across all email clients.
            </p>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        open={emailVerificationModalOpen}
        onClose={() => setEmailVerificationModalOpen(false)}
        email={testEmail}
        userName="Test User"
        tournamentName="Test Tournament"
      />
    </div>
  );
}
