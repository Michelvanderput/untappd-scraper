import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { useGSAP } from '@gsap/react';

// One place to register every GSAP plugin we use (all free since GSAP 3.13).
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MorphSVGPlugin);

/** Shared easing language, mirrors `ease-out-expo` in tailwind.config.js */
export const EASE_OUT_EXPO = 'expo.out';
export const EASE_IN_OUT = 'power3.inOut';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MorphSVGPlugin, useGSAP };
