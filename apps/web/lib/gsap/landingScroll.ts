import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Shared scroll-reveal — fires once, respects reduced motion via caller guard */
export function revealOnScroll(
  targets: gsap.TweenTarget,
  trigger: Element,
  options?: { start?: string; y?: number; stagger?: number; duration?: number },
) {
  const { start = 'top 80%', y = 24, stagger = 0, duration = 0.55 } = options ?? {};
  return gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease: 'power2.out',
      scrollTrigger: { trigger, start, once: true },
    },
  );
}

/** Kill ScrollTriggers scoped to a section element */
export function killSectionScrollTriggers(section: HTMLElement | null) {
  if (!section) return;
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.trigger === section) st.kill();
  });
}

export function scrollPastSection(section: HTMLElement | null) {
  if (!section) return;
  const end = section.offsetTop + section.offsetHeight;
  window.scrollTo({ top: end, behavior: 'smooth' });
}
