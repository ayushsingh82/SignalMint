"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";

// 2 above, 1 left, 1 right, 2 below the heading
const initialImages = [
  { src: "https://picsum.photos/id/11/600/450", alt: "Art", top: 6, left: 12, rotate: -8, width: 220, height: 165 },
  { src: "https://picsum.photos/id/12/600/450", alt: "Art", top: 8, left: 72, rotate: 6, width: 200, height: 155 },
  { src: "https://picsum.photos/id/13/600/450", alt: "Art", top: 40, left: 2, rotate: -5, width: 180, height: 220 },
  { src: "https://picsum.photos/id/14/600/450", alt: "Art", top: 42, left: 82, rotate: 5, width: 190, height: 210 },
  { src: "https://picsum.photos/id/15/600/450", alt: "Art", top: 70, left: 18, rotate: 8, width: 220, height: 165 },
  { src: "https://picsum.photos/id/16/600/450", alt: "Art", top: 72, left: 68, rotate: -6, width: 210, height: 175 },
];

export function FloatingImagesSection() {
  const [images, setImages] = useState(initialImages);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingPosition = useRef({ left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setDraggingIndex(index);
    const rect = (e.target as HTMLElement).closest(".draggable-image")?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  const updatePosition = useCallback(() => {
    if (draggingIndex === null) return;
    setImages((prev) =>
      prev.map((img, i) =>
        i === draggingIndex ? { ...img, left: pendingPosition.current.left, top: pendingPosition.current.top } : img,
      ),
    );
    animationFrameRef.current = null;
  }, [draggingIndex]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingIndex === null || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      pendingPosition.current = {
        left: ((e.clientX - containerRect.left - dragOffset.current.x) / containerRect.width) * 100,
        top: ((e.clientY - containerRect.top - dragOffset.current.y) / containerRect.height) * 100,
      };
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updatePosition);
      }
    },
    [draggingIndex, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDraggingIndex(null);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#09090B]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Premium Dark Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-accentOnBlue)]/[0.03] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/[0.04] blur-[150px]" />

      {images.map((image, index) => (
        <div
          key={index}
          className={`draggable-image absolute hidden select-none md:block ${draggingIndex === index ? "z-50 cursor-grabbing" : "cursor-grab hover:z-50"
            }`}
          style={{
            top: `${image.top}%`,
            left: `${image.left}%`,
            transform: `rotate(${image.rotate}deg) scale(${draggingIndex === index ? 1.05 : 1})`,
            width: image.width,
            height: image.height,
            transition:
              draggingIndex === index
                ? "transform 0.1s ease-out, box-shadow 0.2s ease-out"
                : "top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease-out",
            boxShadow:
              draggingIndex === index
                ? "0 0 40px rgba(173, 255, 1, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 1)"
                : "0 10px 40px -10px rgba(0, 0, 0, 0.8)",
            willChange: draggingIndex === index ? "top, left, transform" : "auto",
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
        >
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm transition-all duration-500 hover:border-[var(--brand-accentOnBlue)]/50 hover:shadow-[0_0_30px_rgba(173,255,1,0.2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="pointer-events-none h-full w-full object-cover mix-blend-screen opacity-70 transition-all duration-700 hover:scale-110 hover:opacity-100 hover:mix-blend-normal"
              draggable={false}
            />
            {/* Subtle inner ring gloss */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </div>
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center px-4 relative">
          {/* Text glow effect behind main text */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-[200px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-accentOnBlue)] blur-[100px] opacity-20" />

          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-7xl md:text-[5.5rem] leading-[1.1]">
            <span className="block bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent drop-shadow-sm">Art shaped</span>
            <span className="block bg-gradient-to-br from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent drop-shadow-sm pb-2">by</span>
            <span className="block text-[var(--brand-accentOnBlue)] drop-shadow-[0_0_20px_rgba(173,255,1,0.4)]">market signals</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-xl font-medium">
            An autonomous agent mints NFTs from live market data — Rare Protocol auctions, prediction markets, and events. Strategy stays private; mints and gallery are public.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto">
            <Link
              href="/gallery"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-[var(--brand-accentOnBlue)] hover:shadow-[0_0_20px_rgba(173,255,1,0.4)] active:scale-95 text-center flex items-center justify-center"
            >
              View Gallery
            </Link>
            <Link
              href="/feed"
              className="rounded-full border border-white/20 bg-black/40 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:border-[var(--brand-accentOnBlue)] hover:text-[var(--brand-accentOnBlue)] hover:bg-white/5 active:scale-95 text-center flex items-center justify-center"
            >
              Live Feed
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
