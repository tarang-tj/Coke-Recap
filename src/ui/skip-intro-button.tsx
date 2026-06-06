// Floating button that jumps to the Agent act (the project centerpiece).
// Helps motion-sensitive visitors and recruiters skip past the intro.

export function SkipIntroButton() {
  const onClick = () => {
    const target = document.getElementById('section-agent');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 px-3 py-1.5 text-xs uppercase tracking-widest text-cream/70 hover:text-cream border border-cream/20 hover:border-cream/40 rounded-full bg-coke-black/40 backdrop-blur transition"
      aria-label="Skip intro to the agent section"
    >
      Skip to agent →
    </button>
  );
}
