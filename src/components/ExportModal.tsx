/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  FileCheck,
  FileArchive,
  FileText,
  Printer,
  Sparkles,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import {
  GangSheetResult,
  GangSheetConfig,
  DesignPreset,
  RosterItem,
  ExportSettings,
} from '../types/dtf';
import {
  generateGangSheetPdf,
  generateZipBundle,
  downloadBlob,
} from '../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gangSheetResult: GangSheetResult | null;
  gangConfig: GangSheetConfig;
  activePreset: DesignPreset;
  roster: RosterItem[];
  teamName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  gangSheetResult,
  gangConfig,
  activePreset,
  roster,
  teamName,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'zip_bundle',
    resolutionDpi: 300,
    includeCutlines: true,
    includeJobHeader: true,
    includeColorBars: true,
    includeHeatPressInstructions: true,
    includeIndividualSVGs: true,
    includeIndividualPNGs: true,
    includeManifestCsv: true,
    includeManifestJson: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen || !gangSheetResult) return null;

  const jobName = `${(teamName || 'TEAM').replace(/[^a-zA-Z0-9_-]/g, '_')}_${gangConfig.rollWidthInches}IN_DTF`;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPercent(5);
    setProgressStep('Initializing 300 DPI Export Engine...');
    setExportComplete(false);

    try {
      if (settings.format === 'pdf_300dpi') {
        setProgressPercent(40);
        setProgressStep('Rendering 300 DPI Vector PDF...');
        const pdf = await generateGangSheetPdf(gangSheetResult, gangConfig, activePreset, jobName);
        setProgressPercent(90);
        setProgressStep('Downloading PDF...');
        pdf.save(`${jobName}_300DPI.pdf`);
      } else {
        // Full ZIP Production Bundle
        const zipBlob = await generateZipBundle(
          gangSheetResult,
          gangConfig,
          activePreset,
          roster,
          settings,
          jobName,
          (pct, step) => {
            setProgressPercent(pct);
            setProgressStep(step);
          }
        );
        downloadBlob(zipBlob, `${jobName}_ProductionBundle.zip`);
      }

      setExportComplete(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Production Export Engine (300 DPI)</h3>
              <p className="text-xs text-slate-400">
                Vector PDFs, High-Res Gang Sheets, Cutlines, and Roster Manifests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer font-mono text-xs"
          >
            ✕
          </button>
        </div>

        {/* Format Selection Cards */}
        <div className="space-y-2.5">
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            OUTPUT PACKAGE FORMAT
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: Full ZIP */}
            <div
              onClick={() => setSettings({ ...settings, format: 'zip_bundle' })}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                settings.format === 'zip_bundle'
                  ? 'bg-red-950/20 border-red-500 ring-1 ring-red-500/40 text-white'
                  : 'bg-[#0A0A0C] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileArchive className="w-4 h-4 text-red-400" />
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-300">
                  RECOMMENDED
                </span>
              </div>
              <div className="text-xs font-bold text-white">Full Production ZIP</div>
              <div className="text-[11px] text-slate-400 mt-1">
                300 DPI PDF + Individual SVGs & PNGs + Cutlines + CSV Manifest.
              </div>
            </div>

            {/* Option 2: PDF Only */}
            <div
              onClick={() => setSettings({ ...settings, format: 'pdf_300dpi' })}
              className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                settings.format === 'pdf_300dpi'
                  ? 'bg-red-950/20 border-red-500 ring-1 ring-red-500/40 text-white'
                  : 'bg-[#0A0A0C] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                  RIP READY
                </span>
              </div>
              <div className="text-xs font-bold text-white">300 DPI Vector PDF</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Single master roll document with color control bars & cutting guides.
              </div>
            </div>
          </div>
        </div>

        {/* Export Inclusions Checklist */}
        <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
          <span className="block font-mono font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            INCLUSIONS & RIP OPTIONS
          </span>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeCutlines}
                onChange={(e) => setSettings({ ...settings, includeCutlines: e.target.checked })}
                className="accent-red-500 rounded"
              />
              <span>Cutting Guidelines</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeJobHeader}
                onChange={(e) => setSettings({ ...settings, includeJobHeader: e.target.checked })}
                className="accent-red-500 rounded"
              />
              <span>Job Barcode Header</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeHeatPressInstructions}
                onChange={(e) =>
                  setSettings({ ...settings, includeHeatPressInstructions: e.target.checked })
                }
                className="accent-red-500 rounded"
              />
              <span>Heat Press Spec Sheet</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeManifestCsv}
                onChange={(e) =>
                  setSettings({ ...settings, includeManifestCsv: e.target.checked })
                }
                className="accent-red-500 rounded"
              />
              <span>Roster CSV Manifest</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeIndividualSVGs}
                onChange={(e) =>
                  setSettings({ ...settings, includeIndividualSVGs: e.target.checked })
                }
                className="accent-red-500 rounded"
              />
              <span>Individual Vector SVGs</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeIndividualPNGs}
                onChange={(e) =>
                  setSettings({ ...settings, includeIndividualPNGs: e.target.checked })
                }
                className="accent-red-500 rounded"
              />
              <span>Individual Lossless PNGs</span>
            </label>
          </div>
        </div>

        {/* Progress Bar (while generating) */}
        {isExporting && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                <span>{progressStep}</span>
              </span>
              <span className="text-cyan-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Export Complete Success Banner */}
        {exportComplete && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-2.5 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>EXPORT SUCCESSFUL · DOWNLOAD STARTED</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
          >
            Close
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Files...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download {settings.format === 'zip_bundle' ? 'ZIP Bundle' : '300 DPI PDF'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
