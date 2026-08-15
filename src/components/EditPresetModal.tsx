/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Save,
  Check,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { DesignPreset } from '../types/dtf';
import { AVAILABLE_FONTS } from '../utils/fonts';

interface EditPresetModalProps {
  preset: DesignPreset;
  onSave: (updatedPreset: DesignPreset) => void;
  onClose: () => void;
}

export const EditPresetModal: React.FC<EditPresetModalProps> = ({
  preset,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<DesignPreset>({ ...preset });
  const [activeNumberAssets, setActiveNumberAssets] = useState<Record<string, string>>(
    preset.customNumberAssets || {}
  );
  const [activeLetterAssets, setActiveLetterAssets] = useState<Record<string, string>>(
    preset.customLetterAssets || {}
  );

  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Handle number asset upload
  const handleDigitUpload = (digit: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setActiveNumberAssets(prev => ({ ...prev, [digit]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle letter asset upload
  const handleLetterUpload = (letter: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setActiveLetterAssets(prev => ({ ...prev, [letter]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleDigits = () => {
    const sampleDigits: Record<string, string> = {};
    digits.forEach(d => {
      sampleDigits[d] = `sample_${d}.png`;
    });
    setActiveNumberAssets(sampleDigits);
  };

  const handleLoadSampleLetters = () => {
    const sampleLetters: Record<string, string> = {};
    alphabet.forEach(l => {
      sampleLetters[l] = `sample_${l}.png`;
    });
    setActiveLetterAssets(sampleLetters);
  };

  const handleSave = () => {
    const updated: DesignPreset = {
      ...formData,
      customNumberAssets: activeNumberAssets,
      customLetterAssets: activeLetterAssets,
      backName: {
        ...formData.backName,
        fontSizeInches: formData.nameHeightInches || 2.2,
        letterSpacing: formData.letterSpacingPx || 3,
        warpBend: formData.arcCurveAngle || 12,
      },
      backNumber: {
        ...formData.backNumber,
        fontSizeInches: formData.numberHeightInches || 9.5,
      },
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-mono">
      <div className="bg-[#0E1017] border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                EDIT PRESET: {formData.code || formData.name}
              </h2>
              <p className="text-[10px] text-slate-400">
                Vector font properties, dual outlines, text warping arcs, and custom PNG letter/number sets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161822] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: General Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              DESIGN CODE (MATCHING KEY)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full bg-[#07080C] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-blue-500"
              placeholder="e.g. SJ-Y5EMT"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              TEAM NAME
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#07080C] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-blue-500"
              placeholder="e.g. AC Milan Classic 2007"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              LEAGUE / CATEGORY
            </label>
            <select
              value={formData.league || formData.category}
              onChange={(e) =>
                setFormData({ ...formData, league: e.target.value, category: e.target.value })
              }
              className="w-full bg-[#07080C] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-blue-500"
            >
              <option value="Serie A">Serie A</option>
              <option value="La Liga">La Liga</option>
              <option value="Premier League">Premier League</option>
              <option value="International">International</option>
              <option value="MLS">MLS</option>
              <option value="Ligue 1">Ligue 1</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              SEASON / ERA
            </label>
            <input
              type="text"
              value={formData.season || ''}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              className="w-full bg-[#07080C] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-blue-500"
              placeholder="e.g. 2006-07"
            />
          </div>
        </div>

        {/* Section 2: Font Specification & Custom Upload */}
        <div className="bg-[#0A0B10] p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>FONT SPECIFICATION & CUSTOM UPLOAD</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">FONT FAMILY</label>
              <select
                value={formData.backName.fontFamily}
                onChange={(e) => {
                  const fontVal = e.target.value;
                  setFormData({
                    ...formData,
                    frontText: { ...formData.frontText, fontFamily: fontVal },
                    backName: { ...formData.backName, fontFamily: fontVal },
                    backNumber: { ...formData.backNumber, fontFamily: fontVal },
                  });
                }}
                className="w-full bg-[#07080C] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:border-blue-500"
              >
                {AVAILABLE_FONTS.map(f => (
                  <option key={f.id} value={f.family}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                UPLOAD CUSTOM FONT (.TTF / .WOFF / .OTF)
              </label>
              <input
                type="file"
                accept=".ttf,.woff,.woff2,.otf"
                className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Upload Number Assets (0-9) */}
        <div className="bg-[#0A0B10] p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              UPLOAD NUMBER ASSETS (0-9)
            </span>
            <button
              onClick={handleLoadSampleDigits}
              className="px-2 py-0.5 rounded bg-[#161822] hover:bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700 cursor-pointer"
            >
              SAMPLE 0-9 SET
            </button>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {digits.map(d => {
              const hasAsset = Boolean(activeNumberAssets[d]);
              return (
                <label
                  key={d}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition ${
                    hasAsset
                      ? 'bg-blue-950/40 border-blue-500/80 text-blue-400'
                      : 'bg-[#07080C] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black">{d}</span>
                  <span className="text-[8px] mt-0.5">{hasAsset ? '✓' : '+...'}</span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml"
                    onChange={(e) => handleDigitUpload(d, e)}
                    className="hidden"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 4: Upload Custom Letter PNG Assets (A-Z) */}
        <div className="bg-[#0A0B10] p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              UPLOAD CUSTOM LETTER PNG ASSETS (A-Z DUAL MODE)
            </span>
            <button
              onClick={handleLoadSampleLetters}
              className="px-2 py-0.5 rounded bg-[#161822] hover:bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700 cursor-pointer"
            >
              SAMPLE A-Z SET
            </button>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-13 gap-1">
            {alphabet.map(l => {
              const hasAsset = Boolean(activeLetterAssets[l]);
              return (
                <label
                  key={l}
                  className={`p-1.5 rounded border flex flex-col items-center justify-center cursor-pointer transition ${
                    hasAsset
                      ? 'bg-blue-950/40 border-blue-500/80 text-blue-400'
                      : 'bg-[#07080C] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold">{l}</span>
                  <span className="text-[7px]">{hasAsset ? '✓' : '+'}</span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml"
                    onChange={(e) => handleLetterUpload(l, e)}
                    className="hidden"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 5: Text Styling Controls */}
        <div className="bg-[#0A0B10] p-3.5 rounded-xl border border-slate-800 space-y-3">
          <div className="text-[11px] font-bold text-white uppercase tracking-wider">
            TEXT STYLING CONTROLS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Fill Color */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">TEXT FILL COLOR</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.backName.fillColor}
                  onChange={(e) => {
                    const col = e.target.value;
                    setFormData({
                      ...formData,
                      frontText: { ...formData.frontText, fillColor: col },
                      backName: { ...formData.backName, fillColor: col },
                      backNumber: { ...formData.backNumber, fillColor: col },
                    });
                  }}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={formData.backName.fillColor}
                  onChange={(e) => {
                    const col = e.target.value;
                    setFormData({
                      ...formData,
                      frontText: { ...formData.frontText, fillColor: col },
                      backName: { ...formData.backName, fillColor: col },
                      backNumber: { ...formData.backNumber, fillColor: col },
                    });
                  }}
                  className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">OUTER STROKE COLOR</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.backName.strokes?.[0]?.color || '#D4AF37'}
                  onChange={(e) => {
                    const col = e.target.value;
                    const updatedStrokes = [...(formData.backName.strokes || [])];
                    if (updatedStrokes.length > 0) {
                      updatedStrokes[0] = { ...updatedStrokes[0], color: col };
                    }
                    setFormData({
                      ...formData,
                      backName: { ...formData.backName, strokes: updatedStrokes },
                      backNumber: { ...formData.backNumber, strokes: updatedStrokes },
                    });
                  }}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={formData.backName.strokes?.[0]?.color || '#D4AF37'}
                  onChange={(e) => {
                    const col = e.target.value;
                    const updatedStrokes = [...(formData.backName.strokes || [])];
                    if (updatedStrokes.length > 0) {
                      updatedStrokes[0] = { ...updatedStrokes[0], color: col };
                    }
                    setFormData({
                      ...formData,
                      backName: { ...formData.backName, strokes: updatedStrokes },
                      backNumber: { ...formData.backNumber, strokes: updatedStrokes },
                    });
                  }}
                  className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">OUTER STROKE (PX)</label>
              <input
                type="number"
                min={0}
                max={20}
                value={formData.backName.strokes?.[0]?.width || 6}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  const updatedStrokes = [...(formData.backName.strokes || [])];
                  if (updatedStrokes.length > 0) {
                    updatedStrokes[0] = { ...updatedStrokes[0], width: w };
                  }
                  setFormData({
                    ...formData,
                    backName: { ...formData.backName, strokes: updatedStrokes },
                    backNumber: { ...formData.backNumber, strokes: updatedStrokes },
                  });
                }}
                className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>

            {/* Text Effect & Curve Angle */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                TEXT EFFECT & ARC ({formData.arcCurveAngle || 12}°)
              </label>
              <div className="space-y-1">
                <select
                  value={formData.backName.warpStyle}
                  onChange={(e) => {
                    const styleVal = e.target.value as any;
                    setFormData({
                      ...formData,
                      backName: { ...formData.backName, warpStyle: styleVal },
                    });
                  }}
                  className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold mb-1"
                >
                  <option value="arc_top">Curved Arc</option>
                  <option value="flat">Straight (Flat)</option>
                  <option value="arch_bridge">Arch Bridge</option>
                  <option value="pennant">Pennant</option>
                </select>
                <input
                  type="range"
                  min={0}
                  max={35}
                  value={formData.arcCurveAngle || 12}
                  onChange={(e) =>
                    setFormData({ ...formData, arcCurveAngle: parseInt(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Sizing Rules (Inches) */}
        <div className="bg-[#0A0B10] p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-white uppercase tracking-wider">
            SIZING RULES (INCHES)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">NAME WIDTH (INCHES)</label>
              <input
                type="number"
                step="0.1"
                value={formData.nameWidthInches || 13}
                onChange={(e) =>
                  setFormData({ ...formData, nameWidthInches: parseFloat(e.target.value) })
                }
                className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">NAME HEIGHT (INCHES)</label>
              <input
                type="number"
                step="0.1"
                value={formData.nameHeightInches || 2.2}
                onChange={(e) =>
                  setFormData({ ...formData, nameHeightInches: parseFloat(e.target.value) })
                }
                className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">NUMBER HEIGHT (INCHES)</label>
              <input
                type="number"
                step="0.1"
                value={formData.numberHeightInches || 9.5}
                onChange={(e) =>
                  setFormData({ ...formData, numberHeightInches: parseFloat(e.target.value) })
                }
                className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">LETTER SPACING (PX)</label>
              <input
                type="number"
                value={formData.letterSpacingPx || 3}
                onChange={(e) =>
                  setFormData({ ...formData, letterSpacingPx: parseInt(e.target.value) })
                }
                className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Notes */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            NOTES / DESCRIPTION
          </label>
          <textarea
            rows={2}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#07080C] border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 resize-none"
            placeholder="e.g. Kaka Champions League Final style with gold stroke and red/black accenting."
          />
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#161822] hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase border border-slate-700 cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE PRESET SPECIFICATIONS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
