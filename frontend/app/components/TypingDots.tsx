export default function TypingDots() {
  const dot = (delay: string) => ({
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.75)",
    display: "inline-block",
    animation: "kvWave 900ms ease-in-out infinite",
    animationDelay: delay,
    willChange: "transform, opacity",
  });

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      {/* keyframes GLOBAL dentro del componente */}
      <style jsx global>{`
        @keyframes kvWave {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          25% {
            transform: translateY(-5px);
            opacity: 0.95;
          }
          50% {
            transform: translateY(0);
            opacity: 0.55;
          }
          75% {
            transform: translateY(3px);
            opacity: 0.35;
          }
        }
      `}</style>

      <span style={dot("0ms")} />
      <span style={dot("120ms")} />
      <span style={dot("240ms")} />
    </span>
  );
}
