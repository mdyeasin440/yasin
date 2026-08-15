/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextPresetConfig, NumberPresetConfig, SizingCategory, SizePresetRule } from '../types/dtf';

export const DPI = 300; // Physical print calibration: 300 dots per inch

export interface RenderSvgOptions {
  text: string;
  config: TextPresetConfig | NumberPresetConfig;
  targetWidthInches?: number;
  targetHeightInches?: number;
  viewBoxWidth?: number;
  viewBoxHeight?: number;
  includeTransparentBg?: boolean;
}

export function getSizeCategory(sizeString: string): SizingCategory {
  const s = (sizeString || '').toUpperCase().trim();
  if (s.startsWith('Y') || s.includes('YOUTH') || ['YS', 'YM', 'YL', 'YXL', 'Y2XL'].includes(s)) {
    return 'youth';
  }
  if (['2T', '3T', '4T', '5T', 'TODDLER'].includes(s)) {
    return 'toddler';
  }
  if (['0-3M', '3-6M', '6-12M', '12-18M', '18-24M', 'INFANT'].includes(s)) {
    return 'infant';
  }
  return 'adult';
}

export function getSizeRule(sizingRules?: SizePresetRule[], sizeString: string = 'Adult'): SizePresetRule {
  const category = getSizeCategory(sizeString);
  if (!sizingRules || !Array.isArray(sizingRules) || sizingRules.length === 0) {
    return {
      sizeCategory: 'adult',
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      frontNameWidthInches: 11.5,
      frontNameHeightInches: 3.5,
      backNameWidthInches: 13.0,
      backNameHeightInches: 2.2,
      backNumberHeightInches: 9.5,
      frontNumberHeightInches: 4.0,
      sleeveNumberHeightInches: 3.0,
      sleeveBadgeWidthInches: 3.0,
    };
  }
  const found = sizingRules.find(r => r && r.sizeCategory === category);
  return found || sizingRules[0];
}

/**
 * Generates an SVG path data string for curved textPath.
 */
export function generateCurvedPath(
  warpStyle: string,
  bendPercent: number,
  width: number,
  height: number
): { pathD: string; textAnchor: string; startOffset: string } {
  const padX = width * 0.05;
  const w = width - padX * 2;
  const startX = padX;
  const endX = width - padX;
  const midX = width / 2;
  const bend = (bendPercent / 100) * (height * 0.45);

  switch (warpStyle) {
    case 'arc_top': {
      // Classic Athletic Arch (curving upwards in middle)
      const baseEndY = height * 0.75;
      const ctrlY = baseEndY - bend * 1.5;
      return {
        pathD: `M ${startX} ${baseEndY} Q ${midX} ${ctrlY} ${endX} ${baseEndY}`,
        textAnchor: 'middle',
        startOffset: '50%',
      };
    }
    case 'arc_bottom': {
      // Smile curve
      const baseEndY = height * 0.35;
      const ctrlY = baseEndY + bend * 1.5;
      return {
        pathD: `M ${startX} ${baseEndY} Q ${midX} ${ctrlY} ${endX} ${baseEndY}`,
        textAnchor: 'middle',
        startOffset: '50%',
      };
    }
    case 'wave': {
      // S-curve wave
      const baseMidY = height * 0.55;
      const cp1X = startX + w * 0.25;
      const cp1Y = baseMidY - bend;
      const cp2X = startX + w * 0.75;
      const cp2Y = baseMidY + bend;
      return {
        pathD: `M ${startX} ${baseMidY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${baseMidY}`,
        textAnchor: 'middle',
        startOffset: '50%',
      };
    }
    case 'pennant': {
      // Angled pennant slope
      const startY = height * 0.65 + bend * 0.5;
      const endY = height * 0.65 - bend * 0.8;
      return {
        pathD: `M ${startX} ${startY} L ${endX} ${endY}`,
        textAnchor: 'middle',
        startOffset: '50%',
      };
    }
    default: {
      // Flat horizontal path
      const baselineY = height * 0.68;
      return {
        pathD: `M ${startX} ${baselineY} L ${endX} ${baselineY}`,
        textAnchor: 'middle',
        startOffset: '50%',
      };
    }
  }
}

/**
 * Builds standalone SVG string for jersey text or numbers.
 */
export function buildTextSvg(options: RenderSvgOptions): {
  svgString: string;
  widthPx: number;
  heightPx: number;
  widthInches: number;
  heightInches: number;
} {
  const {
    text,
    config,
    targetWidthInches = 10,
    targetHeightInches = 3.5,
  } = options;

  const widthPx = Math.round(targetWidthInches * DPI);
  const heightPx = Math.round(targetHeightInches * DPI);
  const pathId = `path_${Math.random().toString(36).substring(2, 9)}`;

  const safeText = String(text ?? '');
  const displayText = config?.uppercase ? safeText.toUpperCase() : safeText;
  const warpStyle = config?.warpStyle || 'flat';
  const warpBend = config?.warpBend || 0;
  const isCurved = warpStyle !== 'flat' && warpBend !== 0;
  const { pathD, textAnchor, startOffset } = generateCurvedPath(
    warpStyle,
    warpBend,
    widthPx,
    heightPx
  );

  // Approximate font sizing to fit target box
  const charCount = Math.max(displayText.length, 1);
  const fontPtSize = Math.min(
    (heightPx * 0.65),
    (widthPx * 0.9) / (charCount * 0.52)
  );

  const strokes = config.strokes || [];
  const shadow = config.shadow;

  // Calculate cumulative stroke widths for multi-outline layered rendering
  let cumulativeWidth = 0;
  const strokeLayers: Array<{ color: string; strokeWidth: number; join: string }> = [];

  // Active strokes in reverse (outermost rendered first)
  const activeStrokes = strokes.filter(s => s.enabled);
  let totalStrokeExpansion = 0;
  for (let i = 0; i < activeStrokes.length; i++) {
    totalStrokeExpansion += (activeStrokes[i].width * (DPI / 72)) * 2;
  }

  let runningStroke = totalStrokeExpansion;
  for (let i = activeStrokes.length - 1; i >= 0; i--) {
    const s = activeStrokes[i];
    strokeLayers.push({
      color: s.color,
      strokeWidth: runningStroke,
      join: s.join || 'round',
    });
    runningStroke -= (s.width * (DPI / 72)) * 2;
  }

  // Shadow rendering
  let shadowSvg = '';
  if (shadow?.enabled) {
    const offX = (shadow.offsetX * (DPI / 72));
    const offY = (shadow.offsetY * (DPI / 72));
    const shadowStrokeWidth = (totalStrokeExpansion > 0 ? totalStrokeExpansion : 4);

    if (shadow.style === 'hard_extrusion') {
      // 3D extrusion effect: multiple stepped layers
      const steps = 4;
      for (let step = 1; step <= steps; step++) {
        const stepX = (offX / steps) * step;
        const stepY = (offY / steps) * step;
        shadowSvg += renderTextNode({
          text: displayText,
          isCurved,
          pathId,
          fontFamily: config.fontFamily,
          fontSize: fontPtSize,
          letterSpacing: config.letterSpacing,
          fillColor: shadow.color,
          strokeColor: shadow.color,
          strokeWidth: shadowStrokeWidth,
          strokeJoin: 'round',
          transform: `translate(${stepX}, ${stepY})`,
          textAnchor,
          startOffset,
          widthPx,
          heightPx,
        });
      }
    } else {
      shadowSvg = renderTextNode({
        text: displayText,
        isCurved,
        pathId,
        fontFamily: config.fontFamily,
        fontSize: fontPtSize,
        letterSpacing: config.letterSpacing,
        fillColor: shadow.color,
        strokeColor: shadow.color,
        strokeWidth: shadowStrokeWidth,
        strokeJoin: 'round',
        transform: `translate(${offX}, ${offY})`,
        textAnchor,
        startOffset,
        widthPx,
        heightPx,
      });
    }
  }

  // Generate stroke layers from outer to inner
  let strokeLayersSvg = '';
  for (const layer of strokeLayers) {
    strokeLayersSvg += renderTextNode({
      text: displayText,
      isCurved,
      pathId,
      fontFamily: config.fontFamily,
      fontSize: fontPtSize,
      letterSpacing: config.letterSpacing,
      fillColor: layer.color,
      strokeColor: layer.color,
      strokeWidth: layer.strokeWidth,
      strokeJoin: layer.join,
      textAnchor,
      startOffset,
      widthPx,
      heightPx,
    });
  }

  // Top core fill layer
  const fillSvg = renderTextNode({
    text: displayText,
    isCurved,
    pathId,
    fontFamily: config.fontFamily,
    fontSize: fontPtSize,
    letterSpacing: config.letterSpacing,
    fillColor: config.fillColor,
    strokeColor: 'none',
    strokeWidth: 0,
    strokeJoin: 'round',
    textAnchor,
    startOffset,
    widthPx,
    heightPx,
  });

  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${widthPx} ${heightPx}" 
     width="${targetWidthInches}in" 
     height="${targetHeightInches}in"
     style="background: transparent;">
  <defs>
    <path id="${pathId}" d="${pathD}" fill="none" />
  </defs>
  <g id="shadow-group">${shadowSvg}</g>
  <g id="strokes-group">${strokeLayersSvg}</g>
  <g id="fill-group">${fillSvg}</g>
</svg>`.trim();

  return {
    svgString,
    widthPx,
    heightPx,
    widthInches: targetWidthInches,
    heightInches: targetHeightInches,
  };
}

interface TextNodeParams {
  text: string;
  isCurved: boolean;
  pathId: string;
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeJoin: string;
  transform?: string;
  textAnchor: string;
  startOffset: string;
  widthPx: number;
  heightPx: number;
}

function renderTextNode(p: TextNodeParams): string {
  const transformAttr = p.transform ? `transform="${p.transform}"` : '';
  const strokeAttrs = p.strokeWidth > 0
    ? `stroke="${p.strokeColor}" stroke-width="${p.strokeWidth}" stroke-linejoin="${p.strokeJoin}" stroke-linecap="round" paint-order="stroke fill"`
    : 'stroke="none"';

  const letterSpacingCss = p.letterSpacing ? `letter-spacing: ${p.letterSpacing}px;` : '';

  if (p.isCurved) {
    return `
      <text font-family="${p.fontFamily}" 
            font-size="${p.fontSize}px" 
            font-weight="bold" 
            fill="${p.fillColor}" 
            ${strokeAttrs} 
            ${transformAttr}
            style="${letterSpacingCss} dominant-baseline: central;">
        <textPath href="#${p.pathId}" startOffset="${p.startOffset}" text-anchor="${p.textAnchor}">
          ${escapeXml(p.text)}
        </textPath>
      </text>
    `;
  }

  // Flat aligned text
  const x = p.widthPx / 2;
  const y = p.heightPx * 0.68;
  return `
    <text x="${x}" 
          y="${y}" 
          font-family="${p.fontFamily}" 
          font-size="${p.fontSize}px" 
          font-weight="bold" 
          fill="${p.fillColor}" 
          text-anchor="middle"
          ${strokeAttrs} 
          ${transformAttr}
          style="${letterSpacingCss} dominant-baseline: central;">
      ${escapeXml(p.text)}
    </text>
  `;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Builds vector badge or sleeve insignia
 */
export function buildBadgeSvg(
  shape: 'shield' | 'circle' | 'flag' | 'star' | 'custom_logo',
  widthInches: number,
  heightInches: number,
  primaryColor: string,
  secondaryColor: string,
  teamInitials: string = 'SP'
): { svgString: string; widthPx: number; heightPx: number; widthInches: number; heightInches: number } {
  const widthPx = Math.round(widthInches * DPI);
  const heightPx = Math.round(heightInches * DPI);

  let shapeContent = '';
  if (shape === 'shield') {
    shapeContent = `
      <path d="M ${widthPx * 0.5} ${heightPx * 0.08} 
               L ${widthPx * 0.88} ${heightPx * 0.22} 
               L ${widthPx * 0.88} ${heightPx * 0.6} 
               C ${widthPx * 0.88} ${heightPx * 0.82} ${widthPx * 0.5} ${heightPx * 0.94} ${widthPx * 0.5} ${heightPx * 0.94} 
               C ${widthPx * 0.5} ${heightPx * 0.94} ${widthPx * 0.12} ${heightPx * 0.82} ${widthPx * 0.12} ${heightPx * 0.6} 
               L ${widthPx * 0.12} ${heightPx * 0.22} Z" 
            fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="${widthPx * 0.04}" stroke-linejoin="round" />
      <path d="M ${widthPx * 0.5} ${heightPx * 0.16} 
               L ${widthPx * 0.8} ${heightPx * 0.26} 
               L ${widthPx * 0.8} ${heightPx * 0.58} 
               C ${widthPx * 0.8} ${heightPx * 0.75} ${widthPx * 0.5} ${heightPx * 0.86} ${widthPx * 0.5} ${heightPx * 0.86} 
               C ${widthPx * 0.5} ${heightPx * 0.86} ${widthPx * 0.2} ${heightPx * 0.75} ${widthPx * 0.2} ${heightPx * 0.58} 
               L ${widthPx * 0.2} ${heightPx * 0.26} Z" 
            fill="none" stroke="${secondaryColor}" stroke-width="${widthPx * 0.02}" />
      <text x="${widthPx * 0.5}" y="${heightPx * 0.56}" font-family="'Graduate', Impact, sans-serif" font-size="${heightPx * 0.32}px" font-weight="bold" fill="${secondaryColor}" text-anchor="middle" dominant-baseline="central">
        ${escapeXml(teamInitials.slice(0, 3))}
      </text>
    `;
  } else if (shape === 'star') {
    shapeContent = `
      <polygon points="${widthPx * 0.5},${heightPx * 0.1} ${widthPx * 0.62},${heightPx * 0.38} ${widthPx * 0.92},${heightPx * 0.38} ${widthPx * 0.68},${heightPx * 0.56} ${widthPx * 0.77},${heightPx * 0.86} ${widthPx * 0.5},${heightPx * 0.68} ${widthPx * 0.23},${heightPx * 0.86} ${widthPx * 0.32},${heightPx * 0.56} ${widthPx * 0.08},${heightPx * 0.38} ${widthPx * 0.38},${heightPx * 0.38}"
               fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="${widthPx * 0.035}" stroke-linejoin="round" />
    `;
  } else {
    // Circle badge
    const cx = widthPx * 0.5;
    const cy = heightPx * 0.5;
    const r = Math.min(widthPx, heightPx) * 0.42;
    shapeContent = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="${widthPx * 0.04}" />
      <circle cx="${cx}" cy="${cy}" r="${r * 0.8}" fill="none" stroke="${secondaryColor}" stroke-width="${widthPx * 0.02}" stroke-dasharray="6,4" />
      <text x="${cx}" y="${cy}" font-family="'Russo One', sans-serif" font-size="${heightPx * 0.3}px" font-weight="bold" fill="${secondaryColor}" text-anchor="middle" dominant-baseline="central">
        ${escapeXml(teamInitials.slice(0, 3))}
      </text>
    `;
  }

  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${widthPx} ${heightPx}" 
     width="${widthInches}in" 
     height="${heightInches}in">
  ${shapeContent}
</svg>`.trim();

  return {
    svgString,
    widthPx,
    heightPx,
    widthInches,
    heightInches,
  };
}
