import { Component, type ReactNode } from 'react';
import { hero, learnings, contact } from '../data/portfolio-content';
import { Logo } from './brand/logo';

// Error boundary around the whole experience shell (canvas + chrome). If
// WebGL can't initialise (blocked in the browser, ancient GPU, headless
// crawler) or the 3-D tree throws while mounting, the broken experience's
// chrome unmounts with it — no invisible StartGate listeners, no loader —
// and visitors get a readable one-page summary instead of a blank red void.

type Props = { children: ReactNode };
type State = { failed: boolean };

export class WebglFallbackBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('3-D experience failed to start — showing fallback.', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-[#2a0507] to-coke-black">
        <div className="mx-auto flex min-h-full w-[min(92vw,38rem)] flex-col justify-center gap-8 py-16">
          <Logo variant="white" className="w-36" />

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-off-white">
              {hero.role}
            </h1>
            <p className="mt-1 font-body text-sm uppercase tracking-[0.3em] text-coke-red">
              {hero.org}
            </p>
            <p className="mt-5 font-body text-base leading-relaxed text-off-white/85">
              {hero.tagline}
            </p>
            <p className="mt-3 font-body text-sm leading-relaxed text-off-white/55">
              The full experience is an interactive 3-D walk through 1886
              Atlanta — your browser couldn&rsquo;t start WebGL, so here&rsquo;s
              the short pour.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {learnings.map((line) => (
              <li
                key={line}
                className="border-l-2 border-coke-red/80 pl-4 font-display italic text-xl leading-snug text-off-white"
              >
                &ldquo;{line}&rdquo;
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-6">
            {[
              { label: 'GitHub', href: contact.github, external: true },
              { label: 'LinkedIn', href: contact.linkedin, external: true },
              { label: 'Email', href: `mailto:${contact.email}`, external: false },
            ].map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="font-body text-[0.65rem] uppercase tracking-[0.3em] text-off-white/70 underline-offset-4 hover:underline hover:text-off-white transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
