/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Grid,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  DollarSign,
  Layers,
  Scissors,
  CheckCircle,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  GangSheetResult,
  GangSheetConfig,
  DesignPreset,
  RosterItem,
  PackedItem,
} from '../types/dtf';
import { ROLL_PRESETS } from '../utils/defaultPresets';

interface GangSheetBuilderProps {
  gangSheetResult: GangSheetResult | null;
  gangConfig: GangSheetConfig;
  setGangConfig: React.Dispatch<React.SetStateAction<GangSheetConfig>>;
  onRepack: () => void;
  activePreset: DesignPreset;
  roster: RosterItem[];
  onOpenExport: () => void;
}

export const GangSheetBuilder: React.FC<GangSheetBuilderProps> = ({
  gangSheetResult,
  gangConfig,
  setGangConfig,
  onRepack,
  activePreset,
  roster,
  onOpenExport,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(0.65);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = gangSheetResult?.items.find(i => i.id === selectedItemId);

  const linearFeet = gangSheetResult
    ? (gangSheetResult.totalLengthInches / 12).toFixed(1)
    : '0.0';
  const linearMeters = gangSheetResult
    ? ((gangSheetResult.totalLengthInches * 0.0254)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-5">
      {/* Top Roll Dimensions & Packing Strategy Bar */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/30 border border-cyan-900/40 px-2 py-0.5 rounded font-bold">
                NESTING_ENGINE
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Automated 2D Gang Sheet Nesting & Packing
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              MaxRects 2D packing algorithm optimizes roll layout, minimises film waste, and calculates print costs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onRepack}
              className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-Nest & Optimize</span>
            </button>

            <button
              onClick={onOpenExport}
              className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Production PDF</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          {/* Roll Preset */}
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">ROLL WIDTH</label>
            <select
              value={gangConfig.rollWidthInches}
              onChange={(e) => {
                setGangConfig(prev => ({ ...prev, rollWidthInches: Number(e.target.value) }));
              }}
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold focus:border-red-500"
            >
              {ROLL_PRESETS.map(r => (
                <option key={r.id} value={r.widthInches}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Spacing / Gap */}
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">CUTTING GAP</label>
            <select
              value={gangConfig.gapInches}
              onChange={(e) =>
                setGangConfig(prev => ({ ...prev, gapInches: Number(e.target.value) }))
              }
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-red-500"
            >
              <option value={0.25}>0.25" (Tight Fit)</option>
              <option value={0.375}>0.375" (Standard)</option>
              <option value={0.5}>0.50" (Easy Cut)</option>
              <option value={0.75}>0.75" (Wide Space)</option>
            </select>
          </div>

          {/* Sort Strategy */}
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">PACKING ORDER</label>
            <select
              value={gangConfig.sortStrategy}
              onChange={(e) =>
                setGangConfig(prev => ({ ...prev, sortStrategy: e.target.value as any }))
              }
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-red-500"
            >
              <option value="area_desc">Max Area Desc</option>
              <option value="height_desc">Height Desc</option>
              <option value="width_desc">Width Desc</option>
              <option value="player_grouped">Grouped Player</option>
            </select>
          </div>

          {/* Film Type */}
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">FILM TYPE</label>
            <select
              value={gangConfig.filmType}
              onChange={(e) =>
                setGangConfig(prev => ({ ...prev, filmType: e.target.value as any }))
              }
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-red-500"
            >
              <option value="cold_peel_matte">Cold Peel Matte</option>
              <option value="hot_peel_glossy">Hot Peel Glossy</option>
              <option value="glitter_dtf">Glitter DTF Film</option>
              <option value="metallic_gold">Metallic Gold Foil</option>
            </select>
          </div>

          {/* Allow 90deg rotation */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-1.5 font-sans text-xs">
              <input
                type="checkbox"
                checked={gangConfig.allowRotation}
                onChange={(e) =>
                  setGangConfig(prev => ({ ...prev, allowRotation: e.target.checked }))
                }
                className="w-4 h-4 accent-red-500 rounded"
              />
              <span className="font-semibold">Auto-Rotate 90°</span>
            </label>
          </div>

          {/* Cutlines Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer py-1.5 font-sans text-xs">
              <input
                type="checkbox"
                checked={gangConfig.showCutLines}
                onChange={(e) =>
                  setGangConfig(prev => ({ ...prev, showCutLines: e.target.checked }))
                }
                className="w-4 h-4 accent-red-500 rounded"
              />
              <span className="font-semibold">Show Cut Marks</span>
            </label>
          </div>
        </div>
      </div>

      {/* Real-time Production & Cost Metrics Grid */}
      {gangSheetResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Roll Length */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-lg p-3 shadow-lg">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">ROLL LENGTH</div>
            <div className="text-base font-black text-cyan-400 font-mono mt-0.5">
              {gangSheetResult.totalLengthInches}"
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {linearFeet} ft ({linearMeters} m)
            </div>
          </div>

          {/* Total Nested Items */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-lg p-3 shadow-lg">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">TRANSFERS</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
              {gangSheetResult.totalItemsCount} PCS
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {roster.length} Players
            </div>
          </div>

          {/* Roll Utilization % */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-lg p-3 shadow-lg">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">EFFICIENCY</div>
            <div className="text-base font-black text-amber-400 font-mono mt-0.5">
              {gangSheetResult.utilizationPercentage}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {gangSheetResult.usedAreaSqInches} / {gangSheetResult.totalRollAreaSqInches} sq in
            </div>
          </div>

          {/* Film Cost */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-lg p-3 shadow-lg">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">FILM COST</div>
            <div className="text-base font-black text-slate-200 font-mono mt-0.5">
              ${gangSheetResult.estimatedFilmCost.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              @ ${(2.85 * (gangSheetResult.rollWidthInches / 22)).toFixed(2)}/ft
            </div>
          </div>

          {/* Ink & Powder Cost */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-lg p-3 shadow-lg">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">INK + POWDER</div>
            <div className="text-base font-black text-slate-200 font-mono mt-0.5">
              ${gangSheetResult.estimatedInkCost.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              CMYK + White
            </div>
          </div>

          {/* Total Job Cost & Suggested Retail */}
          <div className="bg-[#0F0F12] border border-emerald-500/40 rounded-lg p-3 shadow-lg">
            <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">TOTAL PRINT COST</div>
            <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
              ${gangSheetResult.estimatedTotalCost.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">
              Retail: ${(gangSheetResult.estimatedTotalCost * 2.6).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Main Gang Sheet Interactive Canvas Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Visualizer Canvas (9 cols) */}
        <div className="lg:col-span-9 bg-[#0F0F12] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
          
          {/* Top Zoom & Navigation Tools */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Roll Viewport</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                {gangConfig.rollWidthInches}" Roll Width × {gangSheetResult?.totalLengthInches || 0}" Length
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded border border-slate-800">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.3, prev - 0.15))}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-slate-300 w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.15))}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(0.65)}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              >
                1:1
              </button>
            </div>
          </div>

          {/* Roll Canvas Stage */}
          <div className="bg-[#141418] rounded-lg border border-slate-800 p-6 flex justify-center overflow-auto max-h-[700px] relative shadow-inner bg-dot-grid">
            {gangSheetResult && (
              <div
                className="relative bg-[#0A0A0C] border-2 border-dashed border-cyan-500/40 rounded shadow-2xl transition-all"
                style={{
                  width: `${gangSheetResult.rollWidthInches * 30 * zoomLevel}px`,
                  height: `${gangSheetResult.totalLengthInches * 30 * zoomLevel}px`,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                }}
              >
                {/* Top Job Production Header Banner */}
                {gangConfig.showJobHeader && (
                  <div
                    className="absolute top-0 left-0 right-0 bg-[#0F0F12] border-b border-slate-800 px-3 py-1 flex items-center justify-between text-[9px] font-mono text-slate-400 overflow-hidden"
                    style={{ height: `${0.6 * 30 * zoomLevel}px` }}
                  >
                    <span className="truncate">
                      SPD-DTF PRO | {gangConfig.rollWidthInches}" × {gangSheetResult.totalLengthInches}" | {activePreset.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {['#00FFFF', '#FF00FF', '#FFFF00', '#000000', '#FFFFFF'].map((col, idx) => (
                        <div
                          key={idx}
                          className="w-2.5 h-2.5 rounded-sm border border-slate-700"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Render All Nested Items */}
                {gangSheetResult.items.map(item => {
                  const isSelected = item.id === selectedItemId;
                  const itemWidthPx = item.widthInches * 30 * zoomLevel;
                  const itemHeightPx = item.heightInches * 30 * zoomLevel;
                  const itemLeftPx = item.xInches * 30 * zoomLevel;
                  const itemTopPx = item.yInches * 30 * zoomLevel;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`absolute rounded transition cursor-pointer group flex items-center justify-center overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 bg-cyan-950/40 z-20 shadow-lg'
                          : 'hover:ring-1 hover:ring-cyan-500/50 bg-[#0F0F12]/80'
                      }`}
                      style={{
                        left: `${itemLeftPx}px`,
                        top: `${itemTopPx}px`,
                        width: `${itemWidthPx}px`,
                        height: `${itemHeightPx}px`,
                        border: gangConfig.showCutLines
                          ? '1px dashed rgba(239, 68, 68, 0.4)'
                          : '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {/* SVG Render Preview */}
                      <div
                        className="w-full h-full p-0.5 flex items-center justify-center drop-shadow-md pointer-events-none"
                        style={{
                          transform: item.rotated ? 'rotate(90deg)' : 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: item.svgString }}
                      />

                      {/* Small Label Overlay */}
                      {gangConfig.showItemLabels && (
                        <div className="absolute bottom-0.5 left-1 text-[8px] font-mono text-slate-400 opacity-70 group-hover:opacity-100 truncate max-w-full">
                          {item.playerName || 'TEAM'} #{item.playerNumber || ''} ({item.garmentSize})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Inspector Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Selected Item Inspector */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-red-500" />
              <span>Transfer Inspector</span>
            </h3>

            {selectedItem ? (
              <div className="space-y-3 text-xs">
                <div className="bg-[#0A0A0C] p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">LABEL:</span>
                    <span className="font-bold text-cyan-400 truncate max-w-[140px]">
                      {selectedItem.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">PLAYER:</span>
                    <span className="font-bold text-white">
                      {selectedItem.playerName} #{selectedItem.playerNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">SIZE:</span>
                    <span className="font-bold text-emerald-400">{selectedItem.garmentSize}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">DIMENSIONS:</span>
                    <span className="text-amber-400">
                      {selectedItem.widthInches}" × {selectedItem.heightInches}"
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">ORIENTATION:</span>
                    <span className="text-slate-300">
                      {selectedItem.rotated ? 'Rotated 90°' : 'Standard 0°'}
                    </span>
                  </div>
                </div>

                {/* Mini SVG Preview */}
                <div className="h-32 bg-[#0A0A0C] rounded-lg border border-slate-800 p-2 flex items-center justify-center overflow-hidden">
                  <div
                    className="w-full h-full flex items-center justify-center drop-shadow-lg"
                    style={{ transform: selectedItem.rotated ? 'rotate(90deg)' : 'none' }}
                    dangerouslySetInnerHTML={{ __html: selectedItem.svgString }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-50" />
                <p>Click any transfer on the roll to inspect its physical print metrics.</p>
              </div>
            )}
          </div>

          {/* DTF RIP & Heat Press Instructions Quick Card */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>RIP & Press Specs</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-300 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">RESOLUTION:</span>
                <span className="font-bold text-emerald-400">300.00 DPI Vector</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PRESS TEMP:</span>
                <span className="font-bold text-amber-400">305°F (152°C)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PRESS TIME:</span>
                <span className="font-bold text-slate-200">12 - 15 Sec</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PRESSURE:</span>
                <span className="font-bold text-slate-200">45 PSI (Medium-Firm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PEEL MODE:</span>
                <span className="font-bold text-cyan-400">Cold Peel (30s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
