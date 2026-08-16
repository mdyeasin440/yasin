/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Layers,
  Sparkles,
  Download,
  Paperclip,
  Clock,
  Cloud,
  RefreshCw,
  Check,
  Database,
} from 'lucide-react';
import { GangSheetResult } from '../types/dtf';
import { CloudStatus } from '../services/api';

export type ActiveNavTab = 'bulk_orders' | 'nesting_canvas' | 'design_presets' | 'export_dtf';

interface HeaderProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  orderCount: number;
  presetCount: number;
  gangSheetResult: GangSheetResult | null;
  cloudStatus?: CloudStatus;
  onSyncAllToCloud?: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  orderCount,
  presetCount,
  gangSheetResult,
  cloudStatus,
  onSyncAllToCloud,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedJustNow, setSyncedJustNow] = useState(false);

  const rollDimensions = gangSheetResult
    ? `${gangSheetResult.rollWidthInches}" x ${gangSheetResult.totalLengthInches}"`
    : '39" x 36.35"';

  const efficiency = gangSheetResult
    ? `${gangSheetResult.utilizationPercentage}%`
    : '83.3%';

  const printTime = gangSheetResult
    ? `~${Math.round(gangSheetResult.estimatedPrintTimeMinutes)}m`
    : '~3m';

  const handleManualSync = async () => {
    if (!onSyncAllToCloud || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncAllToCloud();
      setSyncedJustNow(true);
      setTimeout(() => setSyncedJustNow(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-[#0B0C10] border-b border-slate-800/80 sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: App Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider text-white font-mono uppercase">
                SPIDEY JERSEY
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                DTF PRO v2.5
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-tight">
              39" ROLL DTF PRINT SHEET AUTOMATION & NESTING ENGINE
            </p>
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          
          {/* 1. Bulk Orders Tab */}
          <button
            onClick={() => setActiveTab('bulk_orders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'bulk_orders'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. BULK ORDERS</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeTab === 'bulk_orders'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {orderCount}
            </span>
          </button>

          {/* 2. 39" Nesting Canvas Tab */}
          <button
            onClick={() => setActiveTab('nesting_canvas')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'nesting_canvas'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. 39" NESTING CANVAS</span>
          </button>

          {/* Design Presets Tab */}
          <button
            onClick={() => setActiveTab('design_presets')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'design_presets'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>DESIGN PRESETS</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeTab === 'design_presets'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {presetCount > 9 ? `${presetCount}+` : presetCount}
            </span>
          </button>

          {/* Export DTF File Tab */}
          <button
            onClick={() => setActiveTab('export_dtf')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'export_dtf'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT DTF FILE</span>
          </button>
        </div>

        {/* Right: Roll Stats & Cloud Sync Indicators */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Cloud Sync Button / Badge */}
          {onSyncAllToCloud && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Click to force-sync all local presets & settings to Cloudflare D1"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
                syncedJustNow
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : cloudStatus?.d1Connected
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/50'
                  : 'bg-[#12131A] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : syncedJustNow ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Database className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden sm:inline font-bold">
                {isSyncing ? 'Syncing...' : syncedJustNow ? 'Cloud Synced' : 'Cloud Sync'}
              </span>
            </button>
          )}

          {/* Dimensions Tag */}
          <div className="bg-[#12131A] border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-200 font-bold">{rollDimensions}</span>
          </div>

          {/* Efficiency Tag */}
          <div className="bg-[#12131A] border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 font-bold">%</span>
            <span className="text-slate-400">Eff:</span>
            <span className="text-emerald-400 font-black">{efficiency}</span>
          </div>

          {/* Print Time Tag */}
          <div className="bg-[#12131A] border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-bold">{printTime}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
