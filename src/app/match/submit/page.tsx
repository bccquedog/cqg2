"use client";

import { useAuth } from "@/hooks/useAuth";
import { useToastContext } from "@/contexts/ToastContext";

export default function MatchSubmitPage() {
  const { user } = useAuth();
  const { success, info, error } = useToastContext();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Submit Match Result</h1>
        
        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Authenticated Access</h3>
            <p className="text-green-700 mb-4">
              Welcome, {user.displayName || user.email}! You can submit match results here.
            </p>
            <div className="text-sm text-gray-600">
              <p><strong>User ID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => {
                  info("Awaiting Opponent Confirmation…", { important: false });
                  console.log("[toast] Awaiting Opponent Confirmation…");
                }}
              >
                Submit (Pending)
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={() => {
                  success("Match Submitted Successfully!");
                  console.log("[toast] Match Submitted Successfully!");
                }}
              >
                Submit (Success)
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  error("Submission Failed. Please Try Again.");
                  console.log("[toast] Submission Failed. Please Try Again.");
                }}
              >
                Submit (Error)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">🔒 Protected Route</h3>
            <p className="text-red-700">
              This page is protected and requires authentication. You should have been redirected to the home page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
