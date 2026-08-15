/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shirt,
  Eye,
  Sliders,
  Ruler,
  Maximize2,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DesignPreset,
  RosterItem,
  GarmentType,
  JerseyViewMode,
} from '../types/dtf';
import { buildTextSvg, buildBadgeSvg, getSizeRule } from '../utils/svgRenderer';

interface LivePreviewCanvasProps {
  activePreset: DesignPreset;
  roster: RosterItem[];
  teamName: string;
}

const ATHLETIC_COLORS = [
  { name: 'Midnight Navy', hex: '#0F172A' },
  { name: 'Athletic Red', hex: '#DC2626' },
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Forest Green', hex: '#15803D' },
  { name: 'Championship Gold', hex: '#EAB308' },
  { name: 'Jet Black', hex: '#09090B' },
  { name: 'Heather Grey', hex: '#64748B' },
  { name: 'Ice White', hex: '#F8FAFC' },
  { name: 'Deep Purple', hex: '#581C87' },
  { name: 'Neon Cyan', hex: '#06B6D4' },
];

export const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({
  activePreset,
  roster,
  teamName,
}) => {
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<JerseyViewMode>('combo');
  const [garmentType, setGarmentType] = useState<GarmentType>(activePreset.defaultGarmentType);
  const [garmentColor, setGarmentColor] = useState<string>(activePreset.defaultGarmentColor || '#0F172A');
  const [fabricTexture, setFabricTexture] = useState<'mesh' | 'poly' | 'heather'>('mesh');

  // Layer Toggles
  const [showRuler, setShowRuler] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [showFrontText, setShowFrontText] = useState(true);
  const [showBackName, setShowBackName] = useState(true);
  const [showBackNumber, setShowBackNumber] = useState(true);
  const [showSleeveBadge, setShowSleeveBadge] = useState(true);

  // Position offsets in inches
  const [frontOffsetY, setFrontOffsetY] = useState(0); // inches
  const [backOffsetY, setBackOffsetY] = useState(0);

  const currentPlayer = roster[selectedPlayerIndex] || {
    id: 'preview-player',
    orderNumber: 'PREVIEW-1',
    playerName: 'PARKER',
    playerNumber: '07',
    garmentSize: 'L',
    garmentColor: garmentColor,
    quantity: 1,
    sleeveBadgeEnabled: true,
  };

  const sizeRule = getSizeRule(activePreset.sizingRules, currentPlayer.garmentSize);

  // Generate SVG strings for Front, Back Name, Back Number, Sleeve Badge
  const frontSvg = buildTextSvg({
    text: teamName || activePreset.defaultTeamName || 'SPIDERS',
    config: activePreset.frontText,
    targetWidthInches: sizeRule.frontNameWidthInches,
    targetHeightInches: sizeRule.frontNameHeightInches,
  });

  const backNameSvg = buildTextSvg({
    text: currentPlayer.playerName || 'PARKER',
    config: activePreset.backName,
    targetWidthInches: sizeRule.backNameWidthInches,
    targetHeightInches: sizeRule.backNameHeightInches,
  });

  const backNumberSvg = buildTextSvg({
    text: currentPlayer.playerNumber || '07',
    config: activePreset.backNumber,
    targetWidthInches: sizeRule.backNumberHeightInches * (currentPlayer.playerNumber.length > 1 ? 1.15 : 0.65),
    targetHeightInches: sizeRule.backNumberHeightInches,
  });

  const sleeveBadgeSvg = activePreset.sleeveBadge ? buildBadgeSvg(
    activePreset.sleeveBadge.shape,
    sizeRule.sleeveBadgeWidthInches,
    sizeRule.sleeveBadgeWidthInches * 1.1,
    activePreset.sleeveBadge.primaryColor,
    activePreset.sleeveBadge.secondaryColor,
    teamName.slice(0, 3)
  ) : null;

  return (
    <div className="space-y-5">
      {/* Top Banner & Player Switcher */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded font-bold">
                MOCKUP_CALIBRATOR
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Interactive 2D Jersey Preview & 300 DPI Calibration
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Photorealistic athletic mockup with true physical inch scaling and heat-press safe-zone guides.
            </p>
          </div>

          {/* Active Player Selector */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() =>
                setSelectedPlayerIndex(prev => (prev > 0 ? prev - 1 : Math.max(roster.length - 1, 0)))
              }
              disabled={roster.length <= 1}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedPlayerIndex}
              onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
              className="flex-1 lg:w-64 bg-[#0A0A0C] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-red-500"
            >
              {roster.length === 0 ? (
                <option value={0}>PREVIEW: PARKER #07 (SIZE L)</option>
              ) : (
                roster.map((player, idx) => (
                  <option key={player.id} value={idx}>
                    #{player.playerNumber || '00'} {player.playerName || 'NAME'} (SIZE {player.garmentSize})
                  </option>
                ))
              )}
            </select>

            <button
              onClick={() =>
                setSelectedPlayerIndex(prev => (prev < roster.length - 1 ? prev + 1 : 0))
              }
              disabled={roster.length <= 1}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher & Garment Type Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Views */}
          <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-lg border border-slate-800">
            {(
              [
                { id: 'combo', label: 'Combo (Front + Back)' },
                { id: 'front', label: 'Front View' },
                { id: 'back', label: 'Back View' },
                { id: 'left_sleeve', label: 'Sleeve Badge' },
              ] as const
            ).map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  viewMode === v.id
                    ? 'bg-red-950/30 text-red-400 border border-red-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Garment Style */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">GARMENT:</span>
            <select
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value as GarmentType)}
              className="bg-[#0A0A0C] border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-red-500"
            >
              <option value="baseball_jersey">Baseball Button-Up</option>
              <option value="basketball_tank">Basketball Tank</option>
              <option value="soccer_kit">Soccer Pro Kit</option>
              <option value="football_jersey">Football Gridiron</option>
              <option value="crewneck_tee">Athletic Crew Tee</option>
              <option value="athletic_hoodie">Tech Fleece Hoodie</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Preview Stage & Customizer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Jersey Mockup 2D Interactive Stage (8 cols) */}
        <div className="lg:col-span-8 bg-[#0F0F12] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[540px] bg-dot-grid">
          
          {/* 300 DPI Calibrated Inch Ruler (Top & Left) */}
          {showRuler && (
            <div className="absolute top-3 left-3 bg-[#0A0A0C]/90 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center gap-2 z-20">
              <Ruler className="w-3.5 h-3.5" />
              <span>300.00 DPI Scale: 1 in = 25.4mm</span>
            </div>
          )}

          {/* Jersey Mockup Visual Container */}
          <div className="w-full max-w-2xl py-4 relative z-10 flex items-center justify-center gap-6">
            
            {/* Front Mockup */}
            {(viewMode === 'combo' || viewMode === 'front') && (
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Front Chest Placement
                </span>
                <JerseyMockup
                  type={garmentType}
                  view="front"
                  color={garmentColor}
                  texture={fabricTexture}
                  showSafeZone={showSafeZone}
                  elements={{
                    frontText: showFrontText ? frontSvg.svgString : undefined,
                    sleeveBadge: showSleeveBadge && sleeveBadgeSvg ? sleeveBadgeSvg.svgString : undefined,
                  }}
                  offsetY={frontOffsetY}
                />
              </div>
            )}

            {/* Back Mockup */}
            {(viewMode === 'combo' || viewMode === 'back') && (
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Back Name & Number
                </span>
                <JerseyMockup
                  type={garmentType}
                  view="back"
                  color={garmentColor}
                  texture={fabricTexture}
                  showSafeZone={showSafeZone}
                  elements={{
                    backName: showBackName ? backNameSvg.svgString : undefined,
                    backNumber: showBackNumber ? backNumberSvg.svgString : undefined,
                  }}
                  offsetY={backOffsetY}
                />
              </div>
            )}

            {/* Sleeve Detail View */}
            {viewMode === 'left_sleeve' && (
              <div className="w-full max-w-sm flex flex-col items-center">
                <span className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Left Sleeve Patch View
                </span>
                <div className="w-full h-80 bg-[#0A0A0C] rounded-xl border border-slate-800 p-8 flex items-center justify-center relative shadow-inner">
                  {sleeveBadgeSvg ? (
                    <div
                      className="w-44 h-44 drop-shadow-2xl"
                      dangerouslySetInnerHTML={{ __html: sleeveBadgeSvg.svgString }}
                    />
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">NO SLEEVE BADGE CONFIGURED</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Physical Print Dimension Legend Footer */}
          <div className="w-full mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div>
              SIZE: <span className="font-bold text-white">{currentPlayer.garmentSize}</span> · PLAYER:{' '}
              <span className="font-bold text-white">{currentPlayer.playerName} #{currentPlayer.playerNumber}</span>
            </div>
            <div className="text-emerald-400 font-bold">
              FRONT: {sizeRule.frontNameWidthInches}"W | BACK: {sizeRule.backNameWidthInches}"W | NUM: {sizeRule.backNumberHeightInches}"H
            </div>
          </div>
        </div>

        {/* Right Side: Fabric Color & Layer Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Garment Color Swatches */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shirt className="w-3.5 h-3.5 text-red-500" />
              <span>Jersey Fabric Color</span>
            </h3>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {ATHLETIC_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setGarmentColor(c.hex)}
                  className={`h-8 rounded border transition transform active:scale-95 cursor-pointer relative ${
                    garmentColor === c.hex
                      ? 'border-red-500 ring-1 ring-red-500/50 shadow-sm'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Custom Hex input */}
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="color"
                value={garmentColor}
                onChange={(e) => setGarmentColor(e.target.value)}
                className="w-7 h-7 rounded bg-slate-900 border border-slate-700 p-0.5 cursor-pointer"
              />
              <input
                type="text"
                value={garmentColor}
                onChange={(e) => setGarmentColor(e.target.value)}
                className="flex-1 bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono uppercase"
              />
            </div>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Toggle Print Layers</span>
            </h3>

            <div className="space-y-2 text-xs">
              <LayerCheckbox
                checked={showFrontText}
                onChange={setShowFrontText}
                label="Front Team Vector Arc"
              />
              <LayerCheckbox
                checked={showBackName}
                onChange={setShowBackName}
                label="Back Player Name"
              />
              <LayerCheckbox
                checked={showBackNumber}
                onChange={setShowBackNumber}
                label="Back Big Jersey Number"
              />
              <LayerCheckbox
                checked={showSleeveBadge}
                onChange={setShowSleeveBadge}
                label="Sleeve Insignia / Shield"
              />
              <LayerCheckbox
                checked={showSafeZone}
                onChange={setShowSafeZone}
                label="Heat-Press Safe Platen Guide"
              />
              <LayerCheckbox
                checked={showRuler}
                onChange={setShowRuler}
                label="300 DPI Conversion Calibration"
              />
            </div>
          </div>

          {/* Vertical Heat-Press Position Offset Sliders */}
          <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Platen Heat-Press Offset</span>
            </h3>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Front Chest Offset</span>
                <span className="font-mono text-amber-400">{frontOffsetY > 0 ? `+${frontOffsetY}"` : `${frontOffsetY}"`}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="3"
                step="0.25"
                value={frontOffsetY}
                onChange={(e) => setFrontOffsetY(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Back Number Offset</span>
                <span className="font-mono text-amber-400">{backOffsetY > 0 ? `+${backOffsetY}"` : `${backOffsetY}"`}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="3"
                step="0.25"
                value={backOffsetY}
                onChange={(e) => setBackOffsetY(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   Helper: Jersey Vector Mockup Component
-------------------------------------------------------------- */
interface JerseyMockupProps {
  type: GarmentType;
  view: 'front' | 'back';
  color: string;
  texture: string;
  showSafeZone: boolean;
  offsetY: number;
  elements: {
    frontText?: string;
    backName?: string;
    backNumber?: string;
    sleeveBadge?: string;
  };
}

const JerseyMockup: React.FC<JerseyMockupProps> = ({
  type,
  view,
  color,
  showSafeZone,
  offsetY,
  elements,
}) => {
  return (
    <div className="w-full max-w-[280px] aspect-[3/4] relative bg-[#0A0A0C] rounded-lg border border-slate-800 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
      
      {/* Jersey Fabric Outline Vector */}
      <svg
        viewBox="0 0 300 400"
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))' }}
      >
        {/* Main Garment Body */}
        {type === 'basketball_tank' ? (
          // Basketball Tank Cut
          <path
            d="M 90 20 C 120 40 180 40 210 20 L 235 70 C 215 110 215 140 230 170 L 235 380 L 65 380 L 70 170 C 85 140 85 110 65 70 Z"
            fill={color}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
        ) : (
          // Baseball / Football / Soccer T-Shirt Cut
          <path
            d="M 95 20 C 125 45 175 45 205 20 L 285 85 L 245 145 L 230 130 L 230 380 L 70 380 L 70 130 L 55 145 L 15 85 Z"
            fill={color}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
        )}

        {/* Collar & Neck Ribbing */}
        <path
          d="M 95 20 C 125 50 175 50 205 20"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Baseball Button Placket / Seam (if baseball) */}
        {type === 'baseball_jersey' && (
          <line
            x1="150"
            y1="40"
            x2="150"
            y2="380"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
            strokeDasharray="10,6"
          />
        )}

        {/* Athletic Seam Contours & Shading */}
        <path
          d="M 70 130 L 95 20 M 230 130 L 205 20"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="2"
          fill="none"
        />

        {/* Heat-Press Safe Zone Boundary (12x16 inch platen equivalent) */}
        {showSafeZone && (
          <rect
            x="80"
            y="70"
            width="140"
            height="220"
            fill="none"
            stroke="rgba(6,182,212,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        )}
      </svg>

      {/* Render Applied DTF Transfers onto Jersey */}
      <div className="absolute inset-0 flex flex-col items-center pointer-events-none">
        
        {/* Front Chest Text */}
        {view === 'front' && elements.frontText && (
          <div
            className="absolute w-[68%] top-[24%] drop-shadow-xl transition-all"
            style={{ transform: `translateY(${offsetY * 12}px)` }}
            dangerouslySetInnerHTML={{ __html: elements.frontText }}
          />
        )}

        {/* Back Player Name */}
        {view === 'back' && elements.backName && (
          <div
            className="absolute w-[64%] top-[18%] drop-shadow-xl transition-all"
            style={{ transform: `translateY(${offsetY * 12}px)` }}
            dangerouslySetInnerHTML={{ __html: elements.backName }}
          />
        )}

        {/* Back Number */}
        {view === 'back' && elements.backNumber && (
          <div
            className="absolute w-[58%] top-[34%] drop-shadow-xl transition-all"
            style={{ transform: `translateY(${offsetY * 12}px)` }}
            dangerouslySetInnerHTML={{ __html: elements.backNumber }}
          />
        )}

        {/* Sleeve Badge */}
        {elements.sleeveBadge && view === 'front' && (
          <div
            className="absolute w-[16%] top-[28%] left-[7%] drop-shadow-lg"
            dangerouslySetInnerHTML={{ __html: elements.sleeveBadge }}
          />
        )}
      </div>
    </div>
  );
};

const LayerCheckbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => {
  return (
    <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-red-500 rounded cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
};
