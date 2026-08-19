"use client";

import React, { useSyncExternalStore } from "react";
import { motion } from "framer-motion";

const noopSubscribe = () => () => {};

/** True only after client hydration. framer-motion formats the transform
 * string with different float precision between its SSR output and its
 * client-mounted output, so star positions (high-precision seeded floats)
 * cause a hydration-mismatch warning if rendered during SSR at all — this
 * defers them to the client instead of trying to out-guess that formatting. */
function useHasMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Deterministic pseudo-random in [0, 1) — same seed always yields the same
 * value, unlike Math.random(). Used so star layout is computable directly
 * during render (a pure function of `starCount`) instead of needing an
 * effect just to avoid re-rolling positions on every re-render. */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
}

type Star = { x: string; y: string; peakOpacity: number; duration: number; delay: number };

function buildStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    x: `${seededRandom(i * 12.9898 + 1) * 100}vw`,
    y: `${seededRandom(i * 78.233 + 2) * 100}vh`,
    peakOpacity: seededRandom(i * 39.425 + 3) * 0.8,
    duration: seededRandom(i * 93.989 + 4) * 3 + 2,
    delay: seededRandom(i * 15.732 + 5) * 5,
  }));
}

export interface AuroraBackgroundProps {
  /** Extra wrapper classes */
  className?: string;
  /** Content to render on top of the background */
  children?: React.ReactNode;
  /** Number of "star" points */
  starCount?: number;
  /** Two CSS-variable backed colors for the radial overlays */
  gradientColors?: [string, string];
  /** Pulse animation duration in seconds */
  pulseDuration?: number;
  /** ARIA label for the animated background */
  ariaLabel?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = "",
  children,
  starCount = 50,
  gradientColors = [
    "var(--aurora-color1, rgba(168,85,247,0.2))",
    "var(--aurora-color2, rgba(79,70,229,0.2))",
  ],
  pulseDuration = 10,
  ariaLabel = "Animated aurora background",
}) => {
  const [colorA, colorB] = gradientColors;
  const hasMounted = useHasMounted();
  const stars = hasMounted ? buildStars(starCount) : [];

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-black text-slate-50 ${className}`}
    >
      {/* Background layers (hidden from screen readers) */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Pulsing radial gradients */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle, ${colorA} 0%, transparent 80%),
              radial-gradient(circle, ${colorB} 0%, transparent 80%)
            `,
            backgroundSize: "100% 100%",
            animation: `aurora-pulse ${pulseDuration}s infinite`,
          }}
        />

        {/* Blurred color blobs */}
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-purple-600 opacity-40 blur-3xl filter"
            animate={{
              x: [-50, 50, -50],
              y: [-20, 20, -20],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -right-1/4 -bottom-1/4 h-1/2 w-1/2 rounded-full bg-fuchsia-600 opacity-40 blur-3xl filter"
            animate={{
              x: [50, -50, 50],
              y: [20, -20, 20],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/3 left-1/3 h-1/3 w-1/3 rounded-full bg-indigo-700 opacity-30 blur-3xl filter"
            animate={{
              x: [20, -20, 20],
              y: [-30, 30, -30],
              rotate: [0, 360, 0],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Twinkling stars */}
        {stars.map((s, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white"
            initial={{
              x: s.x,
              y: s.y,
              opacity: 0,
            }}
            animate={{
              opacity: [0, s.peakOpacity, 0],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              delay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Foreground content */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};

export default AuroraBackground;
