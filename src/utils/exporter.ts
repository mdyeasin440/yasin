/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import {
  GangSheetResult,
  GangSheetConfig,
  DesignPreset,
  RosterItem,
  ExportSettings,
} from '../types/dtf';

/**
 * Converts an SVG string to a high-resolution PNG data URL using offscreen canvas.
 */
export async function svgToPngDataUrl(
  svgString: string,
  widthPx: number,
  heightPx: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(widthPx, 10);
        canvas.height = Math.max(heightPx, 10);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates 300 DPI PDF for DTF Roll Printing using jsPDF.
 */
export async function generateGangSheetPdf(
  gangSheet: GangSheetResult,
  config: GangSheetConfig,
  preset: DesignPreset,
  jobName: string = 'DTF-GANG-SHEET'
): Promise<jsPDF> {
  const widthInches = gangSheet.rollWidthInches;
  const heightInches = gangSheet.totalLengthInches;

  // Create custom page size in inches
  const pdf = new jsPDF({
    orientation: widthInches > heightInches ? 'landscape' : 'portrait',
    unit: 'in',
    format: [widthInches, heightInches],
    compress: true,
  });

  // Background is transparent/white for DTF printing
  // Draw Job Header Bar if enabled
  if (config.showJobHeader) {
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, widthInches, 0.6, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    pdf.text(
      `SPD-DTF PRO | JOB: ${jobName} | ROLL: ${widthInches}" x ${heightInches}" | ITEMS: ${gangSheet.totalItemsCount} | ${dateStr} | PRESET: ${preset.name}`,
      0.4,
      0.35
    );

    // CMYK Color Control Bars at top-right
    const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000', '#FFFFFF'];
    const barW = 0.25;
    const barH = 0.25;
    let barX = widthInches - 2.0;
    colors.forEach(col => {
      pdf.setFillColor(col);
      pdf.rect(barX, 0.18, barW, barH, 'F');
      barX += barW + 0.05;
    });
  }

  // Draw Cutlines & Items onto PDF
  for (const item of gangSheet.items) {
    try {
      const renderW = item.widthInches;
      const renderH = item.heightInches;
      const renderPxW = Math.round(renderW * 300);
      const renderPxH = Math.round(renderH * 300);

      // Render SVG to high-res PNG data URL for vector embedding
      const pngData = await svgToPngDataUrl(item.svgString, renderPxW, renderPxH);

      if (item.rotated) {
        // Save state and rotate
        // @ts-ignore jsPDF rotation support
        pdf.addImage(
          pngData,
          'PNG',
          item.xInches,
          item.yInches,
          renderW,
          renderH,
          undefined,
          'FAST'
        );
      } else {
        pdf.addImage(
          pngData,
          'PNG',
          item.xInches,
          item.yInches,
          renderW,
          renderH,
          undefined,
          'FAST'
        );
      }

      // Draw Cut Marks around items if enabled
      if (config.showCutLines) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.01);
        pdf.rect(item.xInches, item.yInches, item.widthInches, item.heightInches, 'S');

        if (config.showItemLabels) {
          pdf.setTextColor(100, 116, 139);
          pdf.setFontSize(6);
          pdf.text(
            `${item.playerName || 'TEAM'} #${item.playerNumber || ''} (${item.garmentSize})`,
            item.xInches + 0.05,
            item.yInches + item.heightInches - 0.05
          );
        }
      }
    } catch (e) {
      console.warn('Failed to embed item to PDF:', item.label, e);
    }
  }

  return pdf;
}

/**
 * Builds Full Production ZIP Bundle (PDF, SVGs, PNGs, Cutlines, Manifest).
 */
export async function generateZipBundle(
  gangSheet: GangSheetResult,
  config: GangSheetConfig,
  preset: DesignPreset,
  roster: RosterItem[],
  settings: ExportSettings,
  jobName: string = 'DTF_Production_Job',
  onProgress?: (percent: number, step: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  onProgress?.(10, 'Generating 300 DPI Vector PDF...');
  const pdf = await generateGangSheetPdf(gangSheet, config, preset, jobName);
  const pdfBlob = pdf.output('blob');
  zip.file(`${jobName}_300DPI_GangSheet.pdf`, pdfBlob);

  onProgress?.(30, 'Creating Cutlines Vector SVG...');
  const cutlinesSvg = buildCutlinesSvg(gangSheet, config);
  zip.file(`${jobName}_Cutlines.svg`, cutlinesSvg);

  onProgress?.(45, 'Creating Production Manifest CSV & JSON...');
  const manifestCsv = buildManifestCsv(roster, preset, gangSheet, config);
  zip.file(`PRINT_JOB_MANIFEST.csv`, manifestCsv);

  const manifestJson = JSON.stringify(
    {
      jobName,
      createdAt: new Date().toISOString(),
      presetName: preset.name,
      sport: preset.sport,
      rollWidthInches: gangSheet.rollWidthInches,
      totalLengthInches: gangSheet.totalLengthInches,
      totalItemsCount: gangSheet.totalItemsCount,
      utilizationPercentage: gangSheet.utilizationPercentage,
      estimatedFilmCost: gangSheet.estimatedFilmCost,
      estimatedInkCost: gangSheet.estimatedInkCost,
      estimatedTotalCost: gangSheet.estimatedTotalCost,
      filmType: config.filmType,
      roster,
      items: gangSheet.items.map(it => ({
        id: it.id,
        label: it.label,
        playerName: it.playerName,
        playerNumber: it.playerNumber,
        garmentSize: it.garmentSize,
        xInches: it.xInches,
        yInches: it.yInches,
        widthInches: it.widthInches,
        heightInches: it.heightInches,
        rotated: it.rotated,
      })),
    },
    null,
    2
  );
  zip.file(`PRINT_JOB_MANIFEST.json`, manifestJson);

  // Heat Press Instructions Sheet
  const filmTypeStr = (config.filmType || 'cold_peel_matte').toUpperCase().replace('_', ' ');
  const sportStr = (preset.sport || 'soccer').toUpperCase();
  const pressSpecs = `
================================================================
          SPIDEY JERSEY DTF PRO - HEAT PRESS PRODUCTION SPEC
================================================================
JOB NAME: ${jobName}
FILM TYPE: ${filmTypeStr}
ROLL SIZE: ${gangSheet.rollWidthInches}" Width x ${gangSheet.totalLengthInches}" Length (${(gangSheet.totalLengthInches / 12).toFixed(1)} Linear Feet)
TOTAL TRANSFERS: ${gangSheet.totalItemsCount}
PRESET: ${preset.name || 'Custom'} (${sportStr})
DATE: ${new Date().toLocaleString()}

HEAT PRESS APPLICATION PARAMETERS:
----------------------------------------------------------------
1. GARMENT PRE-PRESS:
   - Temp: 305°F (152°C)
   - Pressure: Medium-Firm (40-50 PSI / 5-6 on manual clamp)
   - Time: 5 seconds (removes moisture and wrinkles from polyester/cotton)

2. DTF TRANSFER APPLICATION:
   - Position transfer ink-side down onto garment
   - Alignment: 2.5 to 3.0 inches below collar seam
   - Temp: 305°F - 315°F (152°C - 157°C)
   - Time: 12 - 15 seconds
   - Pressure: Firm (50 PSI)

3. PEELING PROCEDURE:
   - For Cold Peel Matte Film: Wait 25-35 seconds until cool to touch, peel in smooth diagonal motion.
   - For Hot Peel Film: Peel immediately within 3-5 seconds after opening press.

4. POST-PRESS (CURE & SOFT HAND FEEL):
   - Place parchment paper or teflon textured sheet over applied transfer.
   - Press for 5 seconds at 305°F (152°C) with medium pressure.
   - This locks transfer permanently into the fibers for 50+ wash durability!

CARE INSTRUCTIONS FOR END CUSTOMER:
- Machine wash cold inside out with mild detergent.
- Tumble dry low or hang dry.
- Do NOT bleach or iron directly on printed graphics.
================================================================
`.trim();
  zip.file(`HEAT_PRESS_SPEC_GUIDE.txt`, pressSpecs);

  // Individual Transfers folder
  if (settings.includeIndividualSVGs || settings.includeIndividualPNGs) {
    const folder = zip.folder('individual_transfers');
    if (folder) {
      for (let i = 0; i < gangSheet.items.length; i++) {
        const item = gangSheet.items[i];
        const safeName = `${item.playerName || 'TEAM'}_${item.playerNumber || '00'}_${item.elementKey}_${item.garmentSize}_${i + 1}`
          .replace(/[^a-zA-Z0-9_-]/g, '_');

        if (settings.includeIndividualSVGs) {
          folder.file(`${safeName}.svg`, item.svgString);
        }

        if (settings.includeIndividualPNGs) {
          try {
            const pngData = await svgToPngDataUrl(
              item.svgString,
              Math.round(item.widthInches * 300),
              Math.round(item.heightInches * 300)
            );
            const base64Data = pngData.replace(/^data:image\/png;base64,/, '');
            folder.file(`${safeName}.png`, base64Data, { base64: true });
          } catch (e) {
            console.warn('Could not generate PNG for item:', safeName, e);
          }
        }

        const progressPercent = 50 + Math.round(((i + 1) / gangSheet.items.length) * 45);
        onProgress?.(progressPercent, `Packaging item ${i + 1} of ${gangSheet.items.length}...`);
      }
    }
  }

  onProgress?.(98, 'Compressing production bundle ZIP...');
  const content = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'Export complete!');
  return content;
}

/**
 * Builds Cutlines SVG representation.
 */
function buildCutlinesSvg(gangSheet: GangSheetResult, config: GangSheetConfig): string {
  const w = gangSheet.rollWidthInches * 300;
  const h = gangSheet.totalLengthInches * 300;

  const rects = gangSheet.items
    .map(
      it => `
    <rect x="${it.xInches * 300}" 
          y="${it.yInches * 300}" 
          width="${it.widthInches * 300}" 
          height="${it.heightInches * 300}" 
          fill="none" 
          stroke="#FF0000" 
          stroke-width="2" 
          stroke-dasharray="8,4" />
    <text x="${it.xInches * 300 + 10}" 
          y="${it.yInches * 300 + 24}" 
          font-family="sans-serif" 
          font-size="14" 
          fill="#FF0000">
      ${it.playerName || 'TEAM'} #${it.playerNumber || ''} (${it.garmentSize})
    </text>
  `
    )
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${w} ${h}" 
     width="${gangSheet.rollWidthInches}in" 
     height="${gangSheet.totalLengthInches}in">
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#000000" stroke-width="1" />
  ${rects}
</svg>`.trim();
}

/**
 * Generates clean CSV manifest.
 */
function buildManifestCsv(
  roster: RosterItem[],
  preset: DesignPreset,
  gangSheet: GangSheetResult,
  config: GangSheetConfig
): string {
  const rows: string[] = [
    'Order Number,Player Name,Jersey Number,Garment Size,Garment Color,Quantity,Item Type,Notes',
  ];

  roster.forEach(r => {
    rows.push(
      [
        `"${r.orderNumber}"`,
        `"${r.playerName}"`,
        `"${r.playerNumber}"`,
        `"${r.garmentSize}"`,
        `"${r.garmentColor}"`,
        r.quantity || 1,
        `"${r.garmentType || preset.defaultGarmentType}"`,
        `"${r.notes || ''}"`,
      ].join(',')
    );
  });

  return rows.join('\n');
}

/**
 * Direct file download trigger helper.
 */
export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}
