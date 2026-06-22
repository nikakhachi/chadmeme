/**
 * A field of twinkling stars. Positions are derived deterministically from the
 * index (no Math.random), so server and client render identically — no
 * hydration mismatch. Purely decorative.
 */
export function StarField({ count = 60 }: { count?: number }) {
  const stars = Array.from({ length: count }, (_, i) => {
    // Cheap, stable pseudo-scatter from the index.
    const left = (i * 73 + 11) % 100;
    const top = (i * 37 + 7) % 100;
    const size = (i % 3) + 1;
    const delay = (i % 7) * 0.5;
    const duration = 3 + (i % 4);
    return { left, top, size, delay, duration };
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="lp-twinkle absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
