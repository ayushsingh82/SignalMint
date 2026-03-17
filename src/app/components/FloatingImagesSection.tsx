"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";

// 2 above, 1 left, 1 right, 2 below the heading
const initialImages = [
  { src: "https://picsum.photos/id/11/600/450", alt: "Art", top: 6, left: 12, rotate: -8, width: 200, height: 150 },
  { src: "https://picsum.photos/id/12/600/450", alt: "Art", top: 8, left: 72, rotate: 6, width: 180, height: 140 },
  { src: "https://picsum.photos/id/13/600/450", alt: "Art", top: 40, left: 2, rotate: -5, width: 160, height: 200 },
  { src: "https://picsum.photos/id/14/600/450", alt: "Art", top: 42, left: 82, rotate: 5, width: 170, height: 190 },
  { src: "https://picsum.photos/id/15/600/450", alt: "Art", top: 70, left: 18, rotate: 8, width: 200, height: 150 },
  { src: "https://picsum.photos/id/16/600/450", alt: "Art", top: 72, left: 68, rotate: -6, width: 190, height: 160 },
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
    [draggingIndex, updatePosition],
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
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[var(--brand-primaryBg)]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {images.map((image, index) => (
        <div
          key={index}
          className={`draggable-image absolute hidden select-none md:block ${
            draggingIndex === index ? "z-50 cursor-grabbing" : "cursor-grab hover:z-50"
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
                : "top 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease-out",
            boxShadow:
              draggingIndex === index
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.3)"
                : "0 10px 40px -10px rgba(0, 0, 0, 0.4)",
            willChange: draggingIndex === index ? "top, left, transform" : "auto",
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
        >
          <div className="relative h-full w-full overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="pointer-events-none h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              draggable={false}
            />
          </div>
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-[var(--brand-primaryText)] sm:text-5xl md:text-6xl">
            <span className="block">Art shaped</span>
            <span className="block">by</span>
            <span className="block text-[var(--brand-accentOnBlue)]">market signals</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--brand-primaryText)]/90 md:text-lg">
            An autonomous agent mints NFTs from live market data — Rare Protocol auctions, prediction markets, and events. Strategy stays private; mints and gallery are public. Built with Protocol Labs and SuperRare.
          </p>
        </div>
      </div>
    </section>
  );
}
