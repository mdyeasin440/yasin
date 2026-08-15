/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Type,
  Hash,
  Shield,
  Sliders,
  Plus,
  Copy,
  Save,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  DesignPreset,
  TextPresetConfig,
  NumberPresetConfig,
  WarpStyle,
  SizingCategory,
} from '../types/dtf';
import { AVAILABLE_FONTS } from '../utils/fonts';
import { buildTextSvg, buildBadgeSvg } from '../utils/svgRenderer';
import { DEFAULT_DESIGN_PRESETS } from '../utils/defaultPresets';

interface PresetManagerProps {
  presets: DesignPreset[];
  activePreset: DesignPreset;
  onSelectPreset: (preset: DesignPreset) => void;
  onSavePreset: (preset: DesignPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onResetPresets: () => void;
}

type SubTab = 'front_team' | 'back_name' | 'back_number' | 'sleeve_badge' | 'sizing_rules';

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  activePreset,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onResetPresets,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('front_team');
  const [editingPreset, setEditingPreset] = useState<DesignPreset>(activePreset);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewText, setPreviewText] = useState('SPIDERS');
  const [previewNumber, setPreviewNumber] = useState('23');

  // Sync editingPreset when activePreset changes
  React.useEffect(() => {
    setEditingPreset(activePreset);
    setPreviewText(activePreset.defaultTeamName || 'SPIDERS');
  }, [activePreset.id]);

  const handleSave = () => {
    onSavePreset(editingPreset);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDuplicate = () => {
    const duplicated: DesignPreset = {
      ...editingPreset,
      id: `preset-${Date.now()}`,
      name: `${editingPreset.name} (Copy)`,
      isDefault: false,
    };
    onSavePreset(duplicated);
    onSelectPreset(duplicated);
  };

  const handleCreateNew = () => {
    const base = DEFAULT_DESIGN_PRESETS[0];
    const newPreset: DesignPreset = {
      ...base,
      id: `preset-${Date.now()}`,
      name: 'Custom Team Style',
      isDefault: false,
      defaultTeamName: 'WARRIORS',
    };
    onSavePreset(newPreset);
    onSelectPreset(newPreset);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(editingPreset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editingPreset.name.toLowerCase().replace(/\s+/g, '_')}_preset.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as DesignPreset;
        imported.id = `imported-${Date.now()}`;
        onSavePreset(imported);
        onSelectPreset(imported);
      } catch (err) {
        alert('Invalid preset JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Generate live SVG preview for the active sub-tab
  const renderSubTabPreview = () => {
    if (subTab === 'front_team') {
      const { svgString } = buildTextSvg({
        text: previewText || 'SPIDERS',
        config: editingPreset.frontText,
        targetWidthInches: 10,
        targetHeightInches: 3.5,
      });
      return <div className="w-full max-w-xl mx-auto drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: svgString }} />;
    }

    if (subTab === 'back_name') {
      const { svgString } = buildTextSvg({
        text: 'PARKER',
        config: editingPreset.backName,
        targetWidthInches: 10,
        targetHeightInches: 2.75,
      });
      return <div className="w-full max-w-xl mx-auto drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: svgString }} />;
    }

    if (subTab === 'back_number') {
      const { svgString } = buildTextSvg({
        text: previewNumber || '23',
        config: editingPreset.backNumber,
        targetWidthInches: 7,
        targetHeightInches: 9,
      });
      return <div className="w-full max-w-sm mx-auto drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: svgString }} />;
    }

    if (subTab === 'sleeve_badge' && editingPreset.sleeveBadge) {
      const { svgString } = buildBadgeSvg(
        editingPreset.sleeveBadge.shape,
        4,
        4,
        editingPreset.sleeveBadge.primaryColor,
        editingPreset.sleeveBadge.secondaryColor,
        editingPreset.defaultTeamName.slice(0, 3)
      );
      return <div className="w-full max-w-xs mx-auto drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: svgString }} />;
    }

    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top Preset Carousel Bar */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded font-bold">
                PRESET_ENGINE
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Athletic Design Presets Library
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select or customize multi-layer vector typography, arc warping bends, and physical print sizing.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleCreateNew}
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Preset</span>
            </button>
            <button
              onClick={handleDuplicate}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone</span>
            </button>
            <label className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onResetPresets}
              className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-800 transition cursor-pointer"
              title="Reset to Factory Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Preset Cards Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {presets.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  setEditingPreset(preset);
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#141418] border-red-500 ring-1 ring-red-500/40 shadow-lg shadow-red-950/40'
                    : 'bg-[#0A0A0C] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-slate-900 text-slate-400 border border-slate-800">
                      {preset.sport}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                    {preset.description || `${preset.frontText.warpStyle} · ${preset.frontText.strokes?.length || 1} Outlines`}
                  </p>
                </div>

                {/* Mini Preview */}
                <div className="h-10 bg-[#0A0A0C] rounded p-1 flex items-center justify-center overflow-hidden border border-slate-800/80">
                  <span
                    className="text-xs font-black tracking-wider truncate"
                    style={{
                      fontFamily: preset.frontText.fontFamily,
                      color: preset.frontText.fillColor,
                      textShadow: `0 0 4px ${preset.frontText.strokes?.[0]?.color || '#000'}`,
                    }}
                  >
                    {preset.defaultTeamName || 'SPIDERS 23'}
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Preset Editor Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left / Center: Controls & Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F0F12] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
          
          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSubTab('front_team')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'front_team'
                  ? 'bg-red-950/30 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Front Team Text</span>
            </button>

            <button
              onClick={() => setSubTab('back_name')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'back_name'
                  ? 'bg-red-950/30 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Back Player Name</span>
            </button>

            <button
              onClick={() => setSubTab('back_number')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'back_number'
                  ? 'bg-red-950/30 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Back Numbers</span>
            </button>

            <button
              onClick={() => setSubTab('sleeve_badge')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'sleeve_badge'
                  ? 'bg-red-950/30 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Sleeve Badges</span>
            </button>

            <button
              onClick={() => setSubTab('sizing_rules')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'sizing_rules'
                  ? 'bg-red-950/30 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Size Rules (Inches)</span>
            </button>
          </div>

          {/* Preset Name & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preset Name</label>
              <input
                type="text"
                value={editingPreset.name}
                onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Default Team Name</label>
              <input
                type="text"
                value={editingPreset.defaultTeamName}
                onChange={(e) => {
                  setEditingPreset({ ...editingPreset, defaultTeamName: e.target.value });
                  setPreviewText(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white uppercase focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Sub-tab 1: Front Team Text */}
          {subTab === 'front_team' && (
            <TextConfigEditor
              config={editingPreset.frontText}
              onChange={(updatedConfig) =>
                setEditingPreset({ ...editingPreset, frontText: updatedConfig })
              }
              title="Front Chest Vector Typography"
              allowWarp
            />
          )}

          {/* Sub-tab 2: Back Player Name */}
          {subTab === 'back_name' && (
            <TextConfigEditor
              config={editingPreset.backName}
              onChange={(updatedConfig) =>
                setEditingPreset({ ...editingPreset, backName: updatedConfig })
              }
              title="Back Player Name Vector Typography"
              allowWarp
            />
          )}

          {/* Sub-tab 3: Back Number */}
          {subTab === 'back_number' && (
            <TextConfigEditor
              config={editingPreset.backNumber}
              onChange={(updatedConfig) =>
                setEditingPreset({
                  ...editingPreset,
                  backNumber: { ...editingPreset.backNumber, ...updatedConfig },
                })
              }
              title="Back Jersey Numbers (10-12 Inch Vector)"
              allowWarp={false}
            />
          )}

          {/* Sub-tab 4: Sleeve Badges */}
          {subTab === 'sleeve_badge' && (
            <SleeveBadgeEditor
              badgeConfig={editingPreset.sleeveBadge}
              onChange={(badge) =>
                setEditingPreset({ ...editingPreset, sleeveBadge: badge })
              }
            />
          )}

          {/* Sub-tab 5: Sizing Rules */}
          {subTab === 'sizing_rules' && (
            <SizingRulesEditor
              sizingRules={editingPreset.sizingRules}
              onChange={(rules) =>
                setEditingPreset({ ...editingPreset, sizingRules: rules })
              }
            />
          )}

          {/* Save / Apply Footer Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-mono">
              Changes auto-sync to D1 store & local cache
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved to D1!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Preset</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Interactive Vector Stage (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F0F12] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>300 DPI Vector Stage</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                VECTOR_ACTIVE
              </span>
            </div>

            {/* Test input field for live typing */}
            <div className="mb-4">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Preview String:
              </label>
              {subTab === 'back_number' ? (
                <input
                  type="text"
                  maxLength={3}
                  value={previewNumber}
                  onChange={(e) => setPreviewNumber(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-mono text-center focus:outline-none focus:border-red-500"
                />
              ) : (
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-3 py-1.5 text-sm text-white uppercase focus:outline-none focus:border-red-500"
                />
              )}
            </div>
          </div>

          {/* Interactive Canvas Canvas Area */}
          <div className="min-h-[280px] bg-[#141418] rounded-lg border border-slate-800 flex items-center justify-center p-6 relative overflow-hidden group shadow-inner bg-dot-grid">
            {/* Rendered SVG Element */}
            <div className="relative z-10 w-full flex items-center justify-center">
              {renderSubTabPreview()}
            </div>

            {/* 300 DPI Badge */}
            <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono">
              300.00 DPI Vector Path
            </div>
          </div>

          {/* Color & Stroke Breakdown Specs */}
          <div className="bg-[#0A0A0C] p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">FONT:</span>
              <span className="font-semibold text-slate-200">{editingPreset.frontText.fontFamily.split(',')[0].replace(/'/g, '')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">WARP / BEND:</span>
              <span className="font-semibold text-amber-400">
                {editingPreset.frontText.warpStyle} ({editingPreset.frontText.warpBend}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">OUTLINES:</span>
              <span className="font-semibold text-cyan-400">
                {editingPreset.frontText.strokes.filter((s) => s.enabled).length} Active Layers
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   Helper Sub-Component: Text & Stroke Configuration Editor
-------------------------------------------------------------- */
interface TextConfigEditorProps {
  config: TextPresetConfig;
  onChange: (config: TextPresetConfig) => void;
  title: string;
  allowWarp?: boolean;
}

const TextConfigEditor: React.FC<TextConfigEditorProps> = ({
  config,
  onChange,
  title,
  allowWarp = true,
}) => {
  const handleStrokeChange = (index: number, key: string, value: any) => {
    const updatedStrokes = [...config.strokes];
    updatedStrokes[index] = { ...updatedStrokes[index], [key]: value };
    onChange({ ...config, strokes: updatedStrokes });
  };

  const handleShadowChange = (key: string, value: any) => {
    onChange({
      ...config,
      shadow: { ...config.shadow, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      {/* Font Family Picker */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Select Athletic Font Family
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVAILABLE_FONTS.map((f) => {
            const isSelected = config.fontFamily === f.family;
            return (
              <button
                key={f.id}
                onClick={() => onChange({ ...config, fontFamily: f.family })}
                className={`p-2 rounded text-left border transition cursor-pointer ${
                  isSelected
                    ? 'bg-red-950/20 border-red-500 text-white shadow-sm'
                    : 'bg-[#0A0A0C] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="text-xs font-bold truncate">{f.name}</div>
                <div
                  className="text-sm font-black truncate mt-0.5 text-slate-200"
                  style={{ fontFamily: f.family }}
                >
                  {f.sampleText}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Fill Color & Letter Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Primary Fill Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.fillColor}
              onChange={(e) => onChange({ ...config, fillColor: e.target.value })}
              className="w-9 h-9 rounded bg-slate-900 border border-slate-700 p-0.5 cursor-pointer"
            />
            <input
              type="text"
              value={config.fillColor}
              onChange={(e) => onChange({ ...config, fillColor: e.target.value })}
              className="flex-1 bg-[#0A0A0C] border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Letter Spacing ({config.letterSpacing}px)
          </label>
          <input
            type="range"
            min="-5"
            max="30"
            step="1"
            value={config.letterSpacing}
            onChange={(e) => onChange({ ...config, letterSpacing: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-red-500 mt-2.5"
          />
        </div>
      </div>

      {/* Arc Warping Engine (if allowed) */}
      {allowWarp && (
        <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Text Warping & Arc Curve Engine</span>
            </label>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Bend: {config.warpBend}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {(
              [
                { id: 'flat', label: 'Flat' },
                { id: 'arc_top', label: 'Arch Up' },
                { id: 'arc_bottom', label: 'Arc Down' },
                { id: 'wave', label: 'Wave' },
                { id: 'pennant', label: 'Pennant' },
              ] as const
            ).map((w) => (
              <button
                key={w.id}
                onClick={() => onChange({ ...config, warpStyle: w.id as WarpStyle })}
                className={`px-2 py-1.5 rounded text-xs font-semibold border transition cursor-pointer ${
                  config.warpStyle === w.id
                    ? 'bg-red-950/30 border-red-500 text-red-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {config.warpStyle !== 'flat' && (
            <div>
              <input
                type="range"
                min="-80"
                max="80"
                step="2"
                value={config.warpBend}
                onChange={(e) => onChange({ ...config, warpBend: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500 mt-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Multi-layer Stroke Outlines */}
      <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-3">
        <label className="block text-xs font-bold text-white mb-2">
          Multi-Layer Stroke Outlines (Inner · Middle · Outer)
        </label>

        {config.strokes.map((stroke, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 bg-slate-900/70 p-2 rounded border border-slate-800"
          >
            <input
              type="checkbox"
              checked={stroke.enabled}
              onChange={(e) => handleStrokeChange(idx, 'enabled', e.target.checked)}
              className="w-4 h-4 accent-red-500 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-300 w-24">
              Layer {idx + 1} {idx === 0 ? '(Inner)' : idx === 1 ? '(Mid Gap)' : '(Outer)'}
            </span>
            <input
              type="color"
              value={stroke.color}
              onChange={(e) => handleStrokeChange(idx, 'color', e.target.value)}
              className="w-7 h-7 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer"
            />
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">Width:</span>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={stroke.width}
                onChange={(e) => handleStrokeChange(idx, 'width', Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-red-500"
              />
              <span className="text-xs font-mono text-slate-300 w-8">{stroke.width}pt</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3D Extrusion Shadow */}
      <div className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shadow?.enabled}
              onChange={(e) => handleShadowChange('enabled', e.target.checked)}
              className="w-4 h-4 accent-red-500 rounded cursor-pointer"
            />
            <span>3D Block Extrusion & Drop Shadow</span>
          </label>
        </div>

        {config.shadow?.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Shadow Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.shadow.color}
                  onChange={(e) => handleShadowChange('color', e.target.value)}
                  className="w-7 h-7 rounded bg-slate-900 border border-slate-700 p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.shadow.color}
                  onChange={(e) => handleShadowChange('color', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Offset X ({config.shadow.offsetX}pt)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={config.shadow.offsetX}
                onChange={(e) => handleShadowChange('offsetX', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-red-500 mt-2"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Offset Y ({config.shadow.offsetY}pt)
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={config.shadow.offsetY}
                onChange={(e) => handleShadowChange('offsetY', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-red-500 mt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   Helper Sub-Component: Sleeve Badge Editor
-------------------------------------------------------------- */
interface SleeveBadgeEditorProps {
  badgeConfig?: DesignPreset['sleeveBadge'];
  onChange: (badge: DesignPreset['sleeveBadge']) => void;
}

const SleeveBadgeEditor: React.FC<SleeveBadgeEditorProps> = ({ badgeConfig, onChange }) => {
  const current = badgeConfig || {
    enabled: true,
    shape: 'shield',
    widthInches: 3.25,
    heightInches: 3.25,
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={current.enabled}
          onChange={(e) => onChange({ ...current, enabled: e.target.checked })}
          className="w-4 h-4 accent-red-500 rounded cursor-pointer"
        />
        <label className="text-xs font-bold text-white">Enable Sleeve Patches / Badges</label>
      </div>

      {current.enabled && (
        <div className="space-y-4 bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Badge Shape</label>
            <div className="grid grid-cols-3 gap-2">
              {(['shield', 'circle', 'star'] as const).map((shape) => (
                <button
                  key={shape}
                  onClick={() => onChange({ ...current, shape })}
                  className={`p-2 rounded text-xs font-bold uppercase border transition cursor-pointer ${
                    current.shape === shape
                      ? 'bg-red-950/30 border-red-500 text-red-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={current.primaryColor}
                  onChange={(e) => onChange({ ...current, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded bg-slate-900 border border-slate-700 p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  value={current.primaryColor}
                  onChange={(e) => onChange({ ...current, primaryColor: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Border & Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={current.secondaryColor}
                  onChange={(e) => onChange({ ...current, secondaryColor: e.target.value })}
                  className="w-8 h-8 rounded bg-slate-900 border border-slate-700 p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  value={current.secondaryColor}
                  onChange={(e) => onChange({ ...current, secondaryColor: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   Helper Sub-Component: Sizing Rules Editor
-------------------------------------------------------------- */
interface SizingRulesEditorProps {
  sizingRules: DesignPreset['sizingRules'];
  onChange: (rules: DesignPreset['sizingRules']) => void;
}

const SizingRulesEditor: React.FC<SizingRulesEditorProps> = ({ sizingRules, onChange }) => {
  const handleRuleChange = (idx: number, key: string, value: number) => {
    const updated = [...sizingRules];
    updated[idx] = { ...updated[idx], [key]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Define exact physical dimensions in inches for each garment category. The gang sheet engine automatically scales transfers according to player shirt size.
      </p>

      {sizingRules.map((rule, idx) => (
        <div key={rule.sizeCategory} className="bg-[#0A0A0C] p-3.5 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {rule.sizeCategory} Sizing Rule ({rule.sizes.join(', ')})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Front Chest Width</label>
              <input
                type="number"
                step="0.25"
                value={rule.frontNameWidthInches}
                onChange={(e) => handleRuleChange(idx, 'frontNameWidthInches', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">inches</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Back Name Width</label>
              <input
                type="number"
                step="0.25"
                value={rule.backNameWidthInches}
                onChange={(e) => handleRuleChange(idx, 'backNameWidthInches', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">inches</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Back Number Height</label>
              <input
                type="number"
                step="0.5"
                value={rule.backNumberHeightInches}
                onChange={(e) => handleRuleChange(idx, 'backNumberHeightInches', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">inches</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Sleeve Badge Width</label>
              <input
                type="number"
                step="0.25"
                value={rule.sleeveBadgeWidthInches}
                onChange={(e) => handleRuleChange(idx, 'sleeveBadgeWidthInches', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">inches</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
