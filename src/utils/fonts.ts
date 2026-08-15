/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'Athletic Varsity' | 'Block College' | 'Modern Script' | 'Cyber Stencil' | 'Aggressive Impact' | 'Classic Retro';
  googleFont: string;
  sampleText: string;
  aspectRatioAdjustment: number;
  isMonospaceNumbers?: boolean;
}

export const AVAILABLE_FONTS: FontOption[] = [
  {
    id: 'oswald-heavy',
    name: 'Oswald Pro Athletic',
    family: "'Oswald', sans-serif",
    category: 'Aggressive Impact',
    googleFont: 'Oswald:wght@500;700',
    sampleText: 'KAKA 22',
    aspectRatioAdjustment: 0.6,
    isMonospaceNumbers: true,
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue Pro',
    family: "'Bebas Neue', sans-serif",
    category: 'Aggressive Impact',
    googleFont: 'Bebas+Neue',
    sampleText: 'NEYMAR 11',
    aspectRatioAdjustment: 0.55,
    isMonospaceNumbers: true,
  },
  {
    id: 'teko-bold',
    name: 'Teko Championship',
    family: "'Teko', sans-serif",
    category: 'Aggressive Impact',
    googleFont: 'Teko:wght@600;700',
    sampleText: 'RONALDO 7',
    aspectRatioAdjustment: 0.48,
    isMonospaceNumbers: true,
  },
  {
    id: 'orbitron-futuristic',
    name: 'Orbitron Tech',
    family: "'Orbitron', sans-serif",
    category: 'Cyber Stencil',
    googleFont: 'Orbitron:wght@700;900',
    sampleText: 'MESSI 10',
    aspectRatioAdjustment: 0.82,
    isMonospaceNumbers: true,
  },
  {
    id: 'varsity-graduate',
    name: 'Graduate Varsity',
    family: "'Graduate', Impact, sans-serif",
    category: 'Athletic Varsity',
    googleFont: 'Graduate',
    sampleText: 'RONALDO 7',
    aspectRatioAdjustment: 0.85,
    isMonospaceNumbers: true,
  },
  {
    id: 'anton-condensed',
    name: 'Anton Condensed',
    family: "'Anton', sans-serif",
    category: 'Aggressive Impact',
    googleFont: 'Anton',
    sampleText: 'RONALDINHO 11',
    aspectRatioAdjustment: 0.58,
    isMonospaceNumbers: true,
  },
  {
    id: 'montserrat-bold',
    name: 'Montserrat Pro',
    family: "'Montserrat', sans-serif",
    category: 'Modern Script',
    googleFont: 'Montserrat:wght@700;900',
    sampleText: 'MBAPPE 7',
    aspectRatioAdjustment: 0.78,
  },
  {
    id: 'russo-one',
    name: 'Russo Heavy Impact',
    family: "'Russo One', sans-serif",
    category: 'Block College',
    googleFont: 'Russo+One',
    sampleText: 'BULLDOGS 99',
    aspectRatioAdjustment: 0.8,
    isMonospaceNumbers: true,
  },
  {
    id: 'rubik-mono',
    name: 'Rubik Mono Block',
    family: "'Rubik Mono One', sans-serif",
    category: 'Block College',
    googleFont: 'Rubik+Mono+One',
    sampleText: 'EAGLES 12',
    aspectRatioAdjustment: 1.0,
    isMonospaceNumbers: true,
  },
  {
    id: 'saira-stencil',
    name: 'Saira Cyber Stencil',
    family: "'Saira Stencil One', cursive",
    category: 'Cyber Stencil',
    googleFont: 'Saira+Stencil+One',
    sampleText: 'CYBER 88',
    aspectRatioAdjustment: 0.75,
  },
  {
    id: 'black-ops',
    name: 'Black Ops Military',
    family: "'Black Ops One', cursive",
    category: 'Cyber Stencil',
    googleFont: 'Black+Ops+One',
    sampleText: 'STRIKE 01',
    aspectRatioAdjustment: 0.88,
  },
];

export function loadGoogleFonts() {
  const fontFamilies = AVAILABLE_FONTS.map(f => f.googleFont).join('&family=');
  const linkId = 'dtf-google-fonts';

  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
    document.head.appendChild(link);
  }
}
