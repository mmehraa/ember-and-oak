import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { initEmbers } from './embers';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

/* ---------- Smooth scroll (Lenis drives GSAP's ticker so they never drift) ---------- */
const lenis = reduce ? null : new Lenis({ lerp: 0.085 });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!;
    const target = id === '#' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView();
  }),
);

/* ---------- Header: hide on scroll down, show on scroll up ---------- */
const bar = $('#top-bar');
if (bar && lenis) {
  lenis.on('scroll', ({ scroll, direction }: Lenis) => {
    gsap.to(bar, { yPercent: direction === 1 && scroll > 300 ? -100 : 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
  });
}

/* ---------- WebGL hero ---------- */
const canvas = $<HTMLCanvasElement>('#embers');
if (canvas) {
  const embers = initEmbers(canvas, reduce);
  ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => embers.setScroll(s.progress) });
}

/* ---------- Custom cursor ---------- */
const cursor = $('#cursor');
if (cursor && finePointer && !reduce) {
  cursor.classList.remove('hidden');
  const ring = $('.cursor-ring', cursor)!, dot = $('.cursor-dot', cursor)!, label = $('.cursor-label', cursor)!;
  const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  window.addEventListener('pointermove', (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button, input, select, textarea');
    const text = el?.dataset.cursor ?? '';
    label.textContent = text;
    gsap.to(ring, { scale: text ? 3.2 : el ? 1.8 : 1, backgroundColor: text ? '#c8553d' : 'rgba(0,0,0,0)', borderColor: text ? '#c8553d' : '#f6efe2', duration: 0.4, ease: 'power3.out' });
    gsap.to(dot, { scale: el ? 0 : 1, duration: 0.2 });
  });
}

/* ---------- Magnetic buttons ---------- */
if (finePointer && !reduce) {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- Infinite marquee that reacts to scroll speed and direction ---------- */
const track = $('.marquee-track');
if (track && !reduce) {
  const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 35, repeat: -1 });
  const skew = gsap.quickTo(track, 'skewX', { duration: 0.4 });
  let dir = 1;
  gsap.ticker.add(() => {
    const v = lenis?.velocity ?? 0;
    if (Math.abs(v) > 0.1) dir = Math.sign(v);
    const want = dir * (1 + Math.min(Math.abs(v) * 0.25, 6));
    loop.timeScale(loop.timeScale() + (want - loop.timeScale()) * 0.08);
    skew(gsap.utils.clamp(-12, 12, -v * 0.6));
  });
}

/* ---------- Menu tabs + floating image that follows the cursor ---------- */
const tabs = $$<HTMLButtonElement>('.menu-tab');
const panels = $$('.menu-panel');
const selectTab = (i: number) => {
  tabs.forEach((t, j) => t.setAttribute('aria-selected', String(i === j)));
  panels.forEach((p, j) => p.classList.toggle('hidden', i !== j));
  if (!reduce) gsap.fromTo($$('.menu-row', panels[i]), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out' });
  ScrollTrigger.refresh();
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(i));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    selectTab(n); tabs[n].focus();
  });
});

const follow = $('#menu-follow');
if (follow && finePointer && !reduce) {
  const imgs = $$<HTMLImageElement>('img', follow);
  gsap.set(follow, { scale: 0.5 });
  const xTo = gsap.quickTo(follow, 'x', { duration: 0.7, ease: 'power3' });
  const yTo = gsap.quickTo(follow, 'y', { duration: 0.7, ease: 'power3' });
  const rTo = gsap.quickTo(follow, 'rotation', { duration: 0.8, ease: 'power3' });
  let px = -1, py = -1, current: string | undefined;
  // Check what is under the pointer on every move AND every scroll
  // (scrolling under a still mouse never fires pointerleave).
  const update = () => {
    const row = px < 0 ? null : document.elementFromPoint(px, py)?.closest<HTMLElement>('[data-menu-img]');
    const src = row?.dataset.menuImg;
    if (src === current) return;
    current = src;
    if (src) {
      imgs.forEach((im) => gsap.set(im, { opacity: im.dataset.src === src ? 1 : 0 }));
      gsap.to(follow, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
    } else gsap.to(follow, { opacity: 0, scale: 0.5, duration: 0.4, ease: 'power3.out' });
  };
  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX - follow.offsetWidth / 2);
    yTo(e.clientY - follow.offsetHeight / 2);
    rTo(gsap.utils.clamp(-18, 18, (e.clientX - px) * 0.8));
    px = e.clientX; py = e.clientY;
    update();
  });
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- Reservation form (demo only, no backend) ---------- */
const form = $<HTMLFormElement>('#reserve-form');
if (form) {
  const ok = $('#reserve-ok')!;
  $<HTMLInputElement>('input[name=date]', form)!.min = new Date().toISOString().slice(0, 10);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    ok.textContent = `Thanks, ${d.get('name')}! We've received your request for ${d.get('guests')} on ${d.get('date')} at ${d.get('time')}. We'll confirm by email shortly.`;
    ok.classList.remove('hidden');
    form.reset();
  });
}

/* ---------- Everything that needs fonts loaded before measuring text ---------- */
document.fonts.ready.then(() => {
  if (reduce) { $('#loader')?.remove(); return; }

  // Hero headline: characters rise out of masked lines.
  const heroSplit = SplitText.create('[data-hero-title]', { type: 'lines,chars', mask: 'lines', linesClass: 'split-line' });
  gsap.set('[data-hero-title]', { visibility: 'visible' });
  const heroIntro = gsap.timeline({ paused: true })
    .from(heroSplit.chars, { yPercent: 115, rotate: 6, duration: 1.3, ease: 'expo.out', stagger: 0.025 })
    .from('.hero-fade', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.4);

  // Hero content drifts up and fades as you scroll away.
  gsap.to('.hero-inner', { yPercent: 18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Preloader: count to 100, then wipe up and play the hero intro.
  const loader = $('#loader');
  if (loader) {
    lenis?.stop();
    const counter = $('#loader-count')!;
    const n = { v: 0 };
    gsap.timeline()
      .from('.loader-word', { yPercent: 110, duration: 1, ease: 'expo.out' })
      .to(n, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { counter.textContent = String(Math.round(n.v)); } }, 0)
      .to('.loader-inner', { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
      .add(() => heroIntro.play(), '-=0.6')
      .add(() => { loader.remove(); lenis?.start(); });
  } else heroIntro.play();

  // Section headings: lines slide up from a mask.
  $$('[data-split]').forEach((el) => {
    const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.set(el, { visibility: 'visible' });
    gsap.from(s.lines, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // Big paragraph: words light up one by one as you scroll through it.
  $$('[data-scrub]').forEach((el) => {
    const s = SplitText.create(el, { type: 'words' });
    gsap.fromTo(s.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  // Generic fade-ups.
  gsap.set('[data-fade]', { y: 50, opacity: 0 });
  ScrollTrigger.batch('[data-fade]', {
    start: 'top 90%',
    onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 }),
    once: true,
  });

  // Images: wipe in with a clip-path, then parallax inside their frame.
  $$('[data-clip]').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-parallax]').forEach((im) => {
    gsap.fromTo(im, { yPercent: -12 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Count-up stats.
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count), suffix = el.dataset.suffix ?? '', o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { el.textContent = Math.round(o.v) + suffix; } });
  });

  // Signature dishes: vertical scroll becomes a horizontal journey (desktop).
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const wrap = $('#dishes-wrap'), htrack = $('#dishes-track');
    if (!wrap || !htrack) return;
    const dist = () => htrack.scrollWidth - window.innerWidth;
    const h = gsap.to(htrack, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: wrap, pin: true, scrub: 1, end: () => '+=' + dist(), invalidateOnRefresh: true } });
    $$('.dish-img', htrack).forEach((im) => {
      gsap.fromTo(im, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: im.parentElement, containerAnimation: h, start: 'left right', end: 'right left', scrub: true } });
    });
    $$('.dish-card', htrack).forEach((card) => {
      gsap.from(card, { rotate: 4, yPercent: 8, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: h, start: 'left right', end: 'left 40%', scrub: true } });
    });
    gsap.to('#dishes-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top top', end: () => '+=' + dist(), scrub: true } });
  });

  // Gallery: the centre photo grows to full screen while the others fly outwards.
  const scales = [4, 5, 6, 5, 6, 8, 9];
  const gtl = gsap.timeline({ scrollTrigger: { trigger: '#gallery', start: 'top top', end: 'bottom bottom', scrub: true } });
  $$('.zoom-item').forEach((el, i) => gtl.to(el, { scale: scales[i] ?? 5, ease: 'none', duration: 1 }, 0));
  gtl.fromTo('.zoom-shade', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.7)
     .fromTo('.zoom-text', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.25 }, 0.75);

  // Footer: giant molten brand name wipes up into view.
  const big = $('[data-big]');
  if (big) {
    gsap.set(big, { visibility: 'visible' });
    gsap.fromTo(big, { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 30 }, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: big, start: 'top 98%' } });
  }

  ScrollTrigger.refresh();
});
