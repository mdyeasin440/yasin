/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Printer,
  Flame,
  Clock,
  Thermometer,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { GangSheetResult, GangSheetConfig, DesignPreset, RosterItem } from '../types/dtf';

interface RipHubProps {
  gangSheetResult: GangSheetResult | null;
  gangConfig: GangSheetConfig;
  activePreset: DesignPreset;
  roster: RosterItem[];
  teamName: string;
  onOpenExport: () => void;
}

export const RipHub: React.FC<RipHubProps> = ({
  gangSheetResult,
  gangConfig,
  activePreset,
  roster,
  teamName,
  onOpenExport,
}) => {
  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded font-bold">
                RIP_CALIBRATION
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                DTF RIP Queue & Production Heat Press Hub
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Commercial DTF print profile calibration, color-bar guides, and heat press temperature protocols.
            </p>
          </div>

          <button
            onClick={onOpenExport}
            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Production PDF</span>
          </button>
        </div>
      </div>

      {/* Heat Press Parameters Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Step 1: Pre-Press */}
        <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5 relative overflow-hidden">
          <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-xs">
            01
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fabric Pre-Press</h3>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">TEMP:</span>
              <span className="font-bold text-white">305°F (152°C)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TIME:</span>
              <span className="font-bold text-cyan-400">5 Seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PRESSURE:</span>
              <span className="font-bold text-white">40 PSI (Medium)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
            Evaporates moisture from jersey fibers to guarantee zero transfer peeling.
          </p>
        </div>

        {/* Step 2: Transfer Application */}
        <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5 relative overflow-hidden">
          <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-mono font-bold text-xs">
            02
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Transfer Press</h3>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">TEMP:</span>
              <span className="font-bold text-amber-400">305°F - 315°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TIME:</span>
              <span className="font-bold text-cyan-400">12 - 15 Seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PRESSURE:</span>
              <span className="font-bold text-white">50 PSI (Firm)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
            Place transfer ink-side down 2.5" - 3.0" below collar seam with teflon sheet.
          </p>
        </div>

        {/* Step 3: Peeling Method */}
        <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5 relative overflow-hidden">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
            03
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Peeling Step</h3>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">TYPE:</span>
              <span className="font-bold text-emerald-400">Cold Peel Matte</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">COOLING:</span>
              <span className="font-bold text-cyan-400">25 - 35 Seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MOTION:</span>
              <span className="font-bold text-white">Smooth 45° Angle</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
            Wait until film is cold to touch before peeling for razor-sharp edges.
          </p>
        </div>

        {/* Step 4: Post-Press */}
        <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5 relative overflow-hidden">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
            04
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Post-Press Cure</h3>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">TEMP:</span>
              <span className="font-bold text-white">305°F (152°C)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TIME:</span>
              <span className="font-bold text-cyan-400">5 Seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">COVER:</span>
              <span className="font-bold text-white">Parchment / Teflon</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
            Imbeds hotmelt TPU powder deep into fabric weave for 50+ wash durability.
          </p>
        </div>
      </div>

      {/* Commercial RIP Software Compatibility Specs */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Commercial RIP Engine Compatibility</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-mono font-bold text-cyan-400 text-xs">CADlink Digital Factory</span>
            <p className="text-slate-400 text-[11px]">
              100% Vector PDF compatible. Color channels map automatically to White (W1/W2) and CMYK queues without manual mask generation.
            </p>
          </div>

          <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-mono font-bold text-amber-400 text-xs">AcroRIP / WhiteRIP</span>
            <p className="text-slate-400 text-[11px]">
              Supports 300 DPI high-resolution PNG transparent bitmaps. Zero haloing with auto choke margin (1-2 pixels).
            </p>
          </div>

          <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-mono font-bold text-red-400 text-xs">Maintop / Onyx RIP</span>
            <p className="text-slate-400 text-[11px]">
              Includes physical crop marks, barcode job reference tags, and standard 56cm/60cm roll borders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
