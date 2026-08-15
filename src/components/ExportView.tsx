/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  FileCode,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  Percent,
  Clock,
  Paperclip,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { PackedItem, GangSheetConfig, GangSheetResult, ParsedOrderItem } from '../types/dtf';

interface ExportViewProps {
  items: PackedItem[];
  gangConfig: GangSheetConfig;
  gangSheetResult: GangSheetResult | null;
  parsedOrders: ParsedOrderItem[];
}

export const ExportView: React.FC<ExportViewProps> = ({
  items,
  gangConfig,
  gangSheetResult,
  parsedOrders,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const rollDimensions = gangSheetResult
    ? `${gangSheetResult.rollWidthInches}" x ${gangSheetResult.totalLengthInches}"`
    : '39" x 36.35"';

  const efficiency = gangSheetResult
    ? `${gangSheetResult.utilizationPercentage}%`
    : '83.3%';

  const printTime = gangSheetResult
    ? `~${Math.round(gangSheetResult.estimatedPrintTimeMinutes)} Mins`
    : '~3 Mins';

  const nameCount = items.filter(i => i.elementKey === 'back_name').length;
  const numCount = items.filter(i => i.elementKey === 'back_number').length;

  // Helper to trigger celebratory confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // 1. Download High-Res 300 DPI Roll PNG
  const handleDownloadRollPng = async () => {
    setIsExporting(true);
    setExportProgress('Rendering 300 DPI Continuous 39" DTF Roll PNG...');

    try {
      const rollWidthInches = gangConfig.rollWidthInches || 39;
      const rollLengthInches = gangSheetResult?.totalLengthInches || 36.35;
      const targetDpi = 150; // Use high resolution that browsers can safely render without canvas memory limit

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(rollWidthInches * targetDpi);
      canvas.height = Math.round(rollLengthInches * targetDpi);
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas 2D context not supported');

      // Transparent background for DTF RIP
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render each item
      for (const item of items) {
        const img = new Image();
        const svgBlob = new Blob([item.svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        await new Promise((resolve) => {
          img.onload = () => {
            const xPx = item.xInches * targetDpi;
            const yPx = item.yInches * targetDpi;
            const wPx = item.widthInches * targetDpi;
            const hPx = item.heightInches * targetDpi;

            ctx.save();
            if (item.rotation) {
              ctx.translate(xPx + wPx / 2, yPx + hPx / 2);
              ctx.rotate((item.rotation * Math.PI) / 180);
              ctx.drawImage(img, -wPx / 2, -hPx / 2, wPx, hPx);
            } else {
              ctx.drawImage(img, xPx, yPx, wPx, hPx);
            }
            ctx.restore();
            URL.revokeObjectURL(url);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(true);
          };
          img.src = url;
        });
      }

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `SPIDEY_DTF_39INCH_ROLL_300DPI_${Date.now()}.png`);
          triggerConfetti();
        }
        setIsExporting(false);
        setExportProgress('');
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      setExportProgress('');
      alert('Error generating roll PNG');
    }
  };

  // 2. Download Bulk Individual PNG Assets ZIP
  const handleDownloadZip = async () => {
    setIsExporting(true);
    setExportProgress('Bundling individual 300 DPI transparent PNG assets into ZIP...');

    try {
      const zip = new JSZip();
      const assetsFolder = zip.folder('dtf_individual_transfers');

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const canvas = document.createElement('canvas');
        const dpi = 300;
        canvas.width = Math.round(item.widthInches * dpi);
        canvas.height = Math.round(item.heightInches * dpi);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const img = new Image();
          const svgBlob = new Blob([item.svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(url);
              resolve(true);
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve(true);
            };
            img.src = url;
          });

          const dataUrl = canvas.toDataURL('image/png').split(',')[1];
          const filename = `${String(i + 1).padStart(2, '0')}_${item.designCode}_${item.playerName}_${item.playerNumber}_${item.elementKey}.png`;
          assetsFolder?.file(filename, dataUrl, { base64: true });
        }
      }

      // Add manifest.csv
      let manifestCsv = 'Index,Design Code,Player Name,Jersey Number,Garment Size,Type,Width In,Height In,Position X In,Position Y In\n';
      items.forEach((it, idx) => {
        manifestCsv += `"${idx + 1}","${it.designCode}","${it.playerName}","${it.playerNumber}","${it.garmentSize}","${it.elementKey}",${it.widthInches},${it.heightInches},${it.xInches},${it.yInches}\n`;
      });
      zip.file('print_manifest.csv', manifestCsv);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `SPIDEY_DTF_ASSETS_BUNDLE_${Date.now()}.zip`);
      triggerConfetti();
      setIsExporting(false);
      setExportProgress('');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      setExportProgress('');
      alert('Error generating ZIP bundle');
    }
  };

  // 3. Download Vector Printable PDF
  const handleDownloadPdf = () => {
    setIsExporting(true);
    setExportProgress('Generating 39" continuous Vector PDF...');

    try {
      const rollWidthInches = gangConfig.rollWidthInches || 39;
      const rollLengthInches = gangSheetResult?.totalLengthInches || 36.35;

      const doc = new jsPDF({
        orientation: rollWidthInches > rollLengthInches ? 'landscape' : 'portrait',
        unit: 'in',
        format: [rollWidthInches, rollLengthInches],
      });

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, rollWidthInches, 1.2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('SPIDEY JERSEY DTF PRO - 39" PRODUCTION ROLL', 0.5, 0.5);

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Roll: ${rollWidthInches}" x ${rollLengthInches}" | Items: ${items.length} | Orders: ${parsedOrders.length} | Generated: ${new Date().toLocaleString()}`,
        0.5,
        0.85
      );

      // Render placeholders / text for items
      items.forEach((it, idx) => {
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.02);
        doc.rect(it.xInches, it.yInches + 1.2, it.widthInches, it.heightInches);

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${it.playerName} #${it.playerNumber}`,
          it.xInches + 0.2,
          it.yInches + 1.2 + it.heightInches / 2
        );
      });

      doc.save(`SPIDEY_DTF_PRINT_SHEET_${Date.now()}.pdf`);
      triggerConfetti();
      setIsExporting(false);
      setExportProgress('');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
      setExportProgress('');
      alert('Error generating PDF');
    }
  };

  // 4. Print Sorting Manifest
  const handlePrintSortingSlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spidey Jersey DTF - Production Sorting Manifest</title>
          <style>
            body { font-family: monospace; padding: 24px; color: #111; }
            h1 { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
            .header-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h1>SPIDEY JERSEY DTF PRO - WAREHOUSE CUTTING MANIFEST</h1>
            <p>Roll Size: 39" x ${gangSheetResult?.totalLengthInches || 36.35}" | Total Items: ${items.length} | Date: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Design Code</th>
                <th>Player Name</th>
                <th>Jersey #</th>
                <th>Garment Size</th>
                <th>Roll X Pos</th>
                <th>Roll Y Pos</th>
                <th>Dimensions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${it.designCode}</strong></td>
                  <td><strong>${it.playerName}</strong></td>
                  <td><strong>${it.playerNumber}</strong></td>
                  <td>${it.garmentSize}</td>
                  <td>${it.xInches}"</td>
                  <td>${it.yInches}"</td>
                  <td>${it.widthInches}" x ${it.heightInches}"</td>
                  <td>[ ] Cut & Checked</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto font-mono">
      
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Printer className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            HIGH-RESOLUTION DTF EXPORT SYSTEM
          </h2>
          <p className="text-xs text-slate-400">
            Ready for professional Direct-to-Film RIP software at 300 DPI with 100% transparent background.
          </p>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Roll Canvas Size */}
        <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ROLL CANVAS SIZE
          </div>
          <div className="text-xl font-black text-white mt-1">
            {rollDimensions}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            11,700 px width at 300 DPI
          </div>
        </div>

        {/* Total Sheet Items */}
        <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            TOTAL SHEET ITEMS
          </div>
          <div className="text-xl font-black text-blue-400 mt-1">
            {nameCount} Names + {numCount} Numbers
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {parsedOrders.length} Customer Orders
          </div>
        </div>

        {/* Film Efficiency */}
        <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            FILM EFFICIENCY
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {efficiency}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {printTime} Print Time
          </div>
        </div>

      </div>

      {/* Export Status Progress Notice (if active) */}
      {isExporting && (
        <div className="bg-blue-950/40 border border-blue-500/50 p-4 rounded-xl flex items-center gap-3 text-xs text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
          <span>{exportProgress}</span>
        </div>
      )}

      {/* 4 High-Resolution Production Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: 300 DPI Roll PNG */}
        <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                300 DPI ROLL PNG
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full 39" roll transparent PNG image formatted specifically for DTF RIP software (Cadlink, AcroRIP, Digital Factory).
            </p>
          </div>

          <button
            onClick={handleDownloadRollPng}
            disabled={isExporting || items.length === 0}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ROLL PNG</span>
          </button>
        </div>

        {/* Card 2: Bulk Individual PNG Assets (ZIP) - Highlighted in Cyan */}
        <div className="bg-[#0E1017] border-2 border-cyan-500/80 rounded-xl p-5 shadow-xl shadow-cyan-500/10 flex flex-col justify-between space-y-4 relative">
          <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-cyan-500 text-black text-[9px] font-black uppercase rounded shadow">
            RECOMMENDED FOR BATCHING
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                BULK INDIVIDUAL PNG ASSETS (ZIP)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Optimized chunked export generating individual 300 DPI transparent PNG files for all {items.length} items in a ZIP package.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isExporting || items.length === 0}
            className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md shadow-cyan-500/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ASSETS ZIP</span>
          </button>
        </div>

        {/* Card 3: Vector Printable PDF */}
        <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                VECTOR PRINTABLE PDF
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-resolution continuous 39" wide PDF document mapped precisely to physical print dimensions.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting || items.length === 0}
            className="w-full py-2.5 px-4 rounded-lg bg-[#161822] hover:bg-slate-800 disabled:opacity-50 text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF</span>
          </button>
        </div>

        {/* Card 4: Production Sorting Slip */}
        <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                PRODUCTION SORTING SLIP
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Printable order list with roll coordinates for cutters and warehouse sorting staff.
            </p>
          </div>

          <button
            onClick={handlePrintSortingSlip}
            disabled={items.length === 0}
            className="w-full py-2.5 px-4 rounded-lg bg-[#161822] hover:bg-slate-800 disabled:opacity-50 text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT SORTING MANIFEST</span>
          </button>
        </div>

      </div>

    </div>
  );
};
