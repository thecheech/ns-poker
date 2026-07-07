export function GlitchBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="glitch-glow glitch-glow-a absolute -left-24 top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="glitch-glow glitch-glow-b absolute -right-16 top-1/3 size-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="glitch-noise absolute inset-0" />
      <div className="glitch-scanlines absolute inset-0" />
      <div className="glitch-grid absolute inset-0" />
    </div>
  );
}
