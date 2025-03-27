// src/components/ui/BackgroundEffects.tsx
import React, { useEffect, useState, useRef } from "react";
import { useBackground } from "../../contexts/BackgroundContext";
import { BackgroundEffectsProps } from "../../types";

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  intensity,
}) => {
  // Always use context intensity instead of prop to avoid conflicts
  const { intensity: contextIntensity } = useBackground();
  const effectIntensity = contextIntensity; // Ignore the prop intensity

  // State for subtle parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Ref for animation frame and debounce timer
  const animationFrameRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Add subtle mouse parallax effect with performance optimization
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Add debounce to mouse movement to reduce jitter
      debounceTimerRef.current = window.setTimeout(() => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          // Calculate percentage of window size with reduced sensitivity
          const x = e.clientX / window.innerWidth;
          const y = e.clientY / window.innerHeight;
          setMousePosition({ x, y });
        });
      }, 50); // 50ms debounce
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Calculate transform values with REDUCED movement (3px max instead of 12px)
  const transformX = (mousePosition.x - 0.5) * 3;
  const transformY = (mousePosition.y - 0.5) * 3;

  // Calculate opacity based on intensity setting
  const baseOpacity =
    effectIntensity === "low"
      ? 0.75
      : effectIntensity === "medium"
      ? 0.85
      : 0.95;

  // Check if user prefers reduced motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // If reduced motion is preferred, don't apply transforms
  const noMotion = prefersReducedMotion
    ? { transform: "none", transition: "none" }
    : {};

  return (
    <>
      {/* Primary premium gradient background - Simpler, fixed position */}
      <div
        className="fixed inset-0 z-[-5] pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg, 
              #0e3878 0%, 
              #1e5fc2 50%,
              #4791f0 100%
            )`,
          opacity: baseOpacity,
        }}
      />

      {/* Rich color overlay with reduced motion */}
      <div
        className="fixed inset-0 z-[-4] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at ${75 - transformX * 0.4}% ${30 - transformY * 0.4}%,
              rgba(100, 200, 255, 0.15) 0%,
              rgba(56, 182, 255, 0.05) 30%,
              transparent 70%
            )
          `,
          ...(prefersReducedMotion
            ? noMotion
            : {
                transform: `translate(${transformX * 0.5}px, ${
                  transformY * 0.5
                }px)`,
                transition: "transform 0.5s ease-out",
              }),
        }}
      />

      {/* Yellow/gold accent that ties into our UI color scheme */}
      <div
        className="fixed inset-0 z-[-4] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at ${20 + transformX * 0.3}% ${80 + transformY * 0.3}%,
              rgba(245, 158, 11, 0.05) 0%,
              rgba(245, 158, 11, 0.01) 30%,
              transparent 70%
            )
          `,
          ...(prefersReducedMotion
            ? noMotion
            : {
                transform: `translate(${-transformX * 0.3}px, ${
                  -transformY * 0.3
                }px)`,
                transition: "transform 0.5s ease-out",
              }),
        }}
      />

      {/* Subtle particles (static, no movement) */}
      <div
        className="fixed inset-0 z-[-2] pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.8'%3E%3Ccircle cx='100' cy='100' r='0.8'/%3E%3Ccircle cx='200' cy='150' r='1.2'/%3E%3Ccircle cx='50' cy='200' r='0.6'/%3E%3Ccircle cx='300' cy='50' r='0.9'/%3E%3Ccircle cx='250' cy='300' r='1.1'/%3E%3Ccircle cx='150' cy='250' r='0.7'/%3E%3Ccircle cx='350' cy='350' r='0.6'/%3E%3Ccircle cx='75' cy='325' r='0.9'/%3E%3Ccircle cx='275' cy='75' r='0.7'/%3E%3Ccircle cx='325' cy='225' r='1.1'/%3E%3Ccircle cx='125' cy='175' r='0.6'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle vignette (static, no movement) */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at 50% 50%,
              transparent 60%,
              rgba(0, 0, 0, 0.15) 100%
            )
          `,
        }}
      />
    </>
  );
};
