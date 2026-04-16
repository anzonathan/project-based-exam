"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { recommendationsAPI } from "@/lib/api";
import WrappedSlideshow from "@/components/WrappedSlideshow";
import type { Wrapped } from "@/types/movie";

export default function SharedWrappedPage() {
  const { token } = useParams();
  const router = useRouter();
  const [wrapped, setWrapped] = useState<Wrapped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (token) {
      recommendationsAPI.getPublicWrapped(token as string)
        .then(setWrapped)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-surface-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !wrapped) {
    return (
      <div className="fixed inset-0 bg-surface-0 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold font-display mb-4 text-white">Oops!</h1>
        <p className="text-white/40 mb-8 max-w-md">
          This Wrapped link is either invalid or expired.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-gold text-surface-0 font-bold rounded-xl"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <WrappedSlideshow 
      isOpen={true} 
      onClose={() => router.push("/")} 
      wrapped={wrapped} 
    />
  );
}
