"use client";

import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Wrapped, WrappedTopMovie, WrappedTopGenre } from "@/types/movie";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wrapped?: Wrapped | null;
}

export default function WrappedSlideshow({ isOpen, onClose, wrapped }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !wrapped) return null;

  // Build slides: intro, genres, then each top movie
  const slides: Array<{ type: string; data?: any }> = [];
  slides.push({ type: "intro", data: wrapped });
  slides.push({ type: "genres", data: wrapped.top_genres });
  wrapped.top_movies.forEach((m) => slides.push({ type: "movie", data: m }));

  const clampedIndex = Math.max(0, Math.min(index, slides.length - 1));

  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  // Autoplay (4s interval) when open and not paused
  useEffect(() => {
    if (!isOpen) return;
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [isOpen, paused, slides.length]);

  const slide = slides[clampedIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-6 p-2 rounded-md bg-white/5 hover:bg-white/10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="max-w-5xl w-full h-full md:h-[80vh] bg-transparent relative flex items-center justify-center">
        {/* Background image for movie slides */}
        {slide.type === "movie" && slide.data.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.data.poster_url}
            alt={slide.data.movie_title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-4">
          {slide.type === "intro" && (
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">Your {wrapped.year} Wrapped</h1>
              <p className="text-lg text-white/70 mb-6">{wrapped.total_interactions_year} interactions this year — here are the highlights.</p>
              <div className="mt-2 text-sm text-white/60">
                <strong>Top genres:</strong> {wrapped.top_genres.map((g: WrappedTopGenre) => g.name).join(", ")}
              </div>
            </div>
          )}

          {slide.type === "genres" && (
            <div className="w-full">
              <h2 className="text-2xl font-semibold text-white mb-4">Top Genres</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {((slide.data as WrappedTopGenre[]) || []).map((g) => (
                  <div key={g.tmdb_id} className="bg-white/3 rounded-lg p-4">
                    <div className="text-lg font-semibold">{g.name}</div>
                    <div className="text-sm text-white/60">{g.count} interactions</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === "movie" && (
            <div className="flex flex-col items-center gap-4">
              {slide.data.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.data.poster_url} alt={slide.data.movie_title} className="w-44 md:w-72 h-auto rounded-lg shadow-2xl" />
              ) : (
                <div className="w-44 md:w-72 h-96 bg-white/5 rounded-lg" />
              )}
              <div>
                <h3 className="text-2xl font-bold">{slide.data.movie_title}</h3>
                <div className="text-sm text-white/60">{slide.data.count} interactions</div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4">
          <button
            onClick={prev}
            disabled={clampedIndex === 0}
            className="pointer-events-auto p-2 rounded-full bg-white/5 hover:bg-white/10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          <button
            onClick={next}
            disabled={clampedIndex === slides.length - 1}
            className="pointer-events-auto p-2 rounded-full bg-white/5 hover:bg-white/10"
            aria-label="Next"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60">
          {clampedIndex + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}
