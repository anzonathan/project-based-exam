"use client";

import React, { useEffect, useState, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Film, Heart, Share2, Check, Trophy, Medal } from "lucide-react";
import type { Wrapped, WrappedTopMovie, WrappedTopGenre } from "@/types/movie";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wrapped?: Wrapped | null;
  shareToken?: string; // Optional for public view
}

const GRADIENTS = [
  "from-purple-600 via-indigo-600 to-blue-600",
  "from-pink-500 via-rose-500 to-orange-400",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-fuchsia-600 via-purple-600 to-pink-600",
  "from-blue-600 via-sky-500 to-teal-400",
];

export default function WrappedSlideshow({ isOpen, onClose, wrapped, shareToken }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build slides with commentary dialogue and Top 3 summaries
  const slides = useMemo(() => {
    const s: Array<{ type: string; data?: any; commentary?: string }> = [];
    if (wrapped) {
      s.push({ 
        type: "intro", 
        data: wrapped,
        commentary: "Ready to see how your year looked?"
      });

      // Commentary slide for genres
      const topGenre = wrapped.top_genres[0]?.name || "movies";
      s.push({ 
        type: "commentary", 
        commentary: `You spent a lot of time with ${topGenre} this year. Like, a lot.`
      });

      s.push({ 
        type: "genres", 
        data: wrapped.top_genres,
        commentary: "These were your top vibes."
      });

      // Top 3 Genres Summary
      s.push({
        type: "top3-genres",
        data: wrapped.top_genres.slice(0, 3),
        commentary: "Your ultimate genre podium."
      });

      // Commentary for movies
      if (wrapped.top_movies.length > 0) {
        s.push({ 
          type: "commentary", 
          commentary: "But there was one movie that lived in your head rent-free..."
        });
      }

      wrapped.top_movies.forEach((m, idx) => {
        if (idx < 3) { // Only do individual slides for top 3
            s.push({ 
              type: "movie", 
              data: m,
              commentary: idx === 0 ? "Your absolute favorite." : idx === 1 ? "The runner up." : "Rounding out the top 3."
            });
        }
      });

      // Top 3 Movies Summary
      s.push({
        type: "top3-movies",
        data: wrapped.top_movies.slice(0, 3),
        commentary: "Your year in three movies."
      });

      s.push({
        type: "outro",
        commentary: "That's a wrap! See you next year."
      });
    }
    return s;
  }, [wrapped]);

  const next = React.useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = React.useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isOpen) {
        setIndex(0);
        setPaused(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, next, prev]);

  useEffect(() => {
    if (!isOpen || paused || !slides.length) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isOpen, paused, slides.length]);

  const handleShare = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/wrapped/share/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !wrapped || !slides.length) return null;

  const clampedIndex = Math.max(0, Math.min(index, slides.length - 1));
  const slide = slides[clampedIndex];
  const bgGradient = GRADIENTS[clampedIndex % GRADIENTS.length];

  return (
    <div className={cn("fixed inset-0 z-[1000] flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-700 bg-gradient-to-br", bgGradient)}>
      {/* Top Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-[1100] flex gap-1.5 px-2">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-white transition-all duration-100 ease-linear",
                i < clampedIndex ? "w-full" : i === clampedIndex ? "animate-progress" : "w-0"
              )}
              style={{ animationPlayState: paused ? 'paused' : 'running' }}
            />
          </div>
        ))}
      </div>

      {/* FIXED CLOSE BUTTON */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
        aria-label="Close"
        className="absolute top-8 right-6 z-[1500] p-2 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="relative w-full h-full max-w-lg mx-auto flex flex-col items-center justify-center px-8 overflow-hidden">
        
        {/* Dialogue Box (Commentary) */}
        {slide.commentary && (
            <div key={`comm-${clampedIndex}`} className="absolute top-24 left-8 right-8 z-[1100] animate-slideUpFade">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl rotate-1">
                    <p className="text-white font-bold text-lg leading-tight tracking-tight">
                        “{slide.commentary}”
                    </p>
                </div>
            </div>
        )}

        {/* Animated Slide Content */}
        <div key={clampedIndex} className="w-full flex flex-col items-center text-center animate-slideUpFade">
          
          {slide.type === "intro" && (
            <div className="space-y-4 pt-12">
              <div className="inline-block animate-bounce mb-2">
                <Sparkles className="w-12 h-12 text-yellow-300 fill-yellow-300" />
              </div>
              <h1 className="font-black text-white tracking-tighter leading-none -rotate-2 drop-shadow-2xl uppercase">
                <span className="text-lg md:text-xl block mb-1 opacity-80 font-bold tracking-widest">{wrapped.username ? `${wrapped.username}'s` : 'Your'}</span>
                <span className="text-6xl md:text-8xl block">{wrapped.year}</span>
                <span className="text-6xl md:text-8xl block mt-2">
                  <span className="text-black bg-yellow-300 px-2">WRAPPED</span>
                </span>
              </h1>
            </div>
          )}

          {slide.type === "commentary" && (
              <div className="py-20">
                  <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-tight animate-pulse">
                      Wait for it...
                  </h2>
              </div>
          )}

          {slide.type === "genres" && (
            <div className="w-full space-y-8 pt-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Film className="w-8 h-8 text-white" />
                <h2 className="text-3xl font-bold text-white uppercase tracking-widest">Your Vibes</h2>
              </div>
              <div className="flex flex-col gap-4">
                {((slide.data as WrappedTopGenre[]) || []).slice(0, 5).map((g, i) => (
                  <div 
                    key={g.tmdb_id} 
                    className={cn(
                      "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 flex items-center justify-between transform transition-all duration-500 hover:scale-105",
                      i % 2 === 0 ? "rotate-1 translate-x-2" : "-rotate-1 -translate-x-2"
                    )}
                  >
                    <span className="text-2xl font-black text-white uppercase">{g.name}</span>
                    <div className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">
                      {g.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide.type === "top3-genres" && (
              <div className="w-full pt-20">
                  <h2 className="text-4xl font-black text-white mb-10 uppercase tracking-tighter italic">Top 3 Genres</h2>
                  <div className="flex flex-col gap-6">
                      {((slide.data as WrappedTopGenre[]) || []).map((g, i) => (
                          <div key={i} className={cn(
                              "relative p-6 rounded-3xl flex items-center gap-6 overflow-hidden",
                              i === 0 ? "bg-yellow-400 text-black scale-110 z-10" : "bg-white/10 text-white"
                          )}>
                              <div className="text-4xl font-black italic opacity-50">#{i + 1}</div>
                              <div className="text-2xl font-black uppercase tracking-tight">{g.name}</div>
                              {i === 0 && <Trophy className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 opacity-20" />}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {slide.type === "movie" && (
            <div className="w-full flex flex-col items-center gap-10 pt-24">
              <div className="relative animate-float">
                {slide.data.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={slide.data.poster_url} 
                    alt={slide.data.movie_title} 
                    className="w-64 md:w-80 h-auto rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/10 -rotate-2" 
                  />
                ) : (
                  <div className="w-64 md:w-80 h-[450px] bg-white/10 rounded-3xl flex items-center justify-center -rotate-2">
                    <Film className="w-20 h-20 text-white/20" />
                  </div>
                )}
                <div className="absolute -bottom-4 -right-4 bg-yellow-300 text-black p-4 rounded-2xl shadow-xl rotate-6">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
              </div>

              <div className="space-y-2 max-w-xs">
                <h3 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tighter">
                  {slide.data.movie_title}
                </h3>
              </div>
            </div>
          )}

          {slide.type === "top3-movies" && (
               <div className="w-full pt-20">
               <h2 className="text-4xl font-black text-white mb-10 uppercase tracking-tighter italic">Top 3 Movies</h2>
               <div className="grid grid-cols-1 gap-4">
                   {((slide.data as WrappedTopMovie[]) || []).map((m, i) => (
                       <div key={i} className={cn(
                           "relative p-4 rounded-2xl flex items-center gap-4 border border-white/10",
                           i === 0 ? "bg-white text-black scale-105 z-10" : "bg-white/5 text-white"
                       )}>
                           <div className="w-12 h-12 rounded-lg bg-black/10 flex items-center justify-center font-black italic text-xl">
                               {i + 1}
                           </div>
                           <div className="flex-1 text-left">
                               <div className="font-black uppercase text-sm truncate">{m.movie_title}</div>
                               <div className={cn("text-[10px] font-bold opacity-60", i === 0 ? "text-black" : "text-white")}>{m.count} interactions</div>
                           </div>
                           {i === 0 && <Medal className="w-6 h-6 text-yellow-500" />}
                       </div>
                   ))}
               </div>
           </div>
          )}

          {slide.type === "outro" && (
              <div className="space-y-8 py-20">
                  <h2 className="text-5xl font-black text-white tracking-tighter leading-none uppercase italic">
                      That&apos;s a <br/> <span className="text-yellow-300">wrap!</span>
                  </h2>
                  
                  {shareToken && (
                      <div className="pt-8">
                          <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold shadow-xl hover:scale-105 transition-transform active:scale-95"
                          >
                              {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                              {copied ? "Copied Link!" : "Share My Wrapped"}
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-y-0 left-0 w-1/4 z-[1200] cursor-pointer" onClick={prev} />
      <div className="absolute inset-y-0 right-0 w-1/4 z-[1200] cursor-pointer" onClick={next} />

      {/* Manual Controls */}
      <div className="absolute bottom-10 left-0 right-0 z-[1300] flex items-center justify-center gap-8 px-6">
        <button
          onClick={prev}
          disabled={clampedIndex === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-0 transition-all text-white"
          aria-label="Previous"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={() => setPaused(!paused)}
          className="px-6 py-2 rounded-full bg-white text-black font-bold text-sm tracking-tighter uppercase active:scale-95 transition-transform"
        >
          {paused ? "Resume" : "Pause"}
        </button>

        <button
          onClick={next}
          disabled={clampedIndex === slides.length - 1}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-0 transition-all text-white"
          aria-label="Next"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest text-white/40 uppercase">
        {clampedIndex + 1} of {slides.length}
      </div>
    </div>
  );
}
