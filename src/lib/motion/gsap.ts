import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase);

// House eases: long, confident expo curves; "tear" is a hard pull with a soft settle.
CustomEase.create('tear', 'M0,0 C0.5,0 0.18,1.02 1,1');
gsap.defaults({ ease: 'expo.out', duration: 1 });

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const coarsePointer = window.matchMedia('(pointer: coarse)');

export { gsap, ScrollTrigger, SplitText };
