/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Copy,
  Trash2,
  Layers,
  Filter,
  Check,
} from 'lucide-react';
import { DesignPreset } from '../types/dtf';
import { buildTextSvg } from '../utils/svgRenderer';

interface DesignPresetsViewProps {
  presets: DesignPreset[];
  setPresets: React.Dispatch<React.SetStateAction<DesignPreset[]>>;
  onEditPreset: (preset: DesignPreset) => void;
  onCreateNewPreset: () => void;
  onDuplicatePreset: (preset: DesignPreset) => void;
  onDeletePreset: (id: string) => void;
}

export const DesignPresetsView: React.FC<DesignPresetsViewProps> = ({
  presets,
  onEditPreset,
  onCreateNewPreset,
  onDuplicatePreset,
  onDeletePreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('ALL');

  const leagues = useMemo(() => {
    const set = new Set<string>();
    presets.forEach(p => {
      if (p.league) set.add(p.league);
      else if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [presets]);

  const filteredPresets = useMemo(() => {
    return presets.filter(p => {
      const pName = (p?.name || '').toLowerCase();
      const pCode = (p?.code || '').toLowerCase();
      const pLeague = (p?.league || '').toLowerCase();
      const pSeason = (p?.season || '').toLowerCase();
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        pName.includes(search) ||
        pCode.includes(search) ||
        pLeague.includes(search) ||
        pSeason.includes(search);

      const matchesLeague =
        selectedLeague === 'ALL' ||
        p.league === selectedLeague ||
        p.category === selectedLeague;

      return matchesSearch && matchesLeague;
    });
  }, [presets, searchQuery, selectedLeague]);

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto">
      
      {/* Top Header & Fast Actions */}
      <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white font-mono uppercase tracking-wider">
              DESIGN PRESETS SPECIFICATION DATABASE ({presets.length})
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Manage club typography, letter spacing, curved text paths, multi-layer strokes, and number styles.
            </p>
          </div>
        </div>

        {/* New Preset Button */}
        <button
          onClick={onCreateNewPreset}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black font-mono uppercase tracking-wider flex items-center gap-2 transition shadow-md shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ NEW PRESET</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0E1017] p-3 rounded-xl border border-slate-800 font-mono">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by code (e.g. SJ-Y5EMT, BARCELONA), team name, font, or season..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07080C] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* League Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto justify-start sm:justify-end">
          {leagues.map(l => (
            <button
              key={l}
              onClick={() => setSelectedLeague(l)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedLeague === l
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-[#161822] text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Presets Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map(preset => {
          const pCode = (preset.code || '').toUpperCase();
          // Generate sample preview text e.g. "KAKA 22" or "RONALDO 7"
          const sampleName =
            pCode === 'SJ-Y5EMT' ? 'KAKA' :
            pCode === 'SJ-S6NGQ' ? 'MESSI' :
            pCode.includes('BARCELONA') ? 'NEYMAR' :
            pCode.includes('REAL MADRID') ? 'RONALDO' :
            pCode.includes('ARGENTINA') ? 'MESSI' :
            pCode.includes('MAN UNITED') ? 'RONALDO' :
            pCode.includes('INTER MIAMI') ? 'MESSI' :
            pCode.includes('PSG') ? 'MBAPPE' :
            pCode.includes('ARSENAL') ? 'HENRY' :
            pCode.includes('BRAZIL') ? 'RONALDINHO' :
            'RONALDO';

          const sampleNum =
            pCode === 'SJ-Y5EMT' ? '22' :
            pCode === 'SJ-S6NGQ' ? '10' :
            pCode.includes('BARCELONA') ? '11' :
            pCode.includes('REAL MADRID') ? '7' :
            pCode.includes('ARGENTINA') ? '10' :
            pCode.includes('MAN UNITED') ? '7' :
            pCode.includes('INTER MIAMI') ? '10' :
            pCode.includes('PSG') ? '7' :
            pCode.includes('ARSENAL') ? '14' :
            pCode.includes('BRAZIL') ? '11' :
            '7';

          const nameSvg = buildTextSvg({
            text: sampleName,
            config: preset.backName,
            targetWidthInches: 10,
            targetHeightInches: 2.2,
          });

          const numSvg = buildTextSvg({
            text: sampleNum,
            config: preset.backNumber,
            targetWidthInches: 6,
            targetHeightInches: 4.8,
          });

          return (
            <div
              key={preset.id}
              className="bg-[#0E1017] border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between transition group font-mono"
            >
              {/* Card Header */}
              <div className="p-3.5 border-b border-slate-800/80 bg-[#12141F] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-blue-400 font-bold px-1.5 py-0.2 rounded bg-blue-950/40 border border-blue-800/40">
                    {preset.code}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 uppercase">
                  {preset.league || preset.category || 'CLUB'}
                </span>
              </div>

              {/* Subtitle / Season / Font info */}
              <div className="px-3.5 pt-2.5 pb-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{preset.season || '2023-24'}</span>
                <span className="text-slate-300 font-bold">
                  {preset.backName.fontFamily.replace(/['",]/g, '').split(' ')[0]}
                </span>
              </div>

              {/* Live Rendered SVG Mockup Box */}
              <div className="p-4 mx-3 my-2 bg-[#07080C] rounded-lg border border-slate-800/80 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group-hover:border-slate-700 transition">
                <div
                  className="w-full max-w-[200px] h-9 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: nameSvg.svgString }}
                />
                <div
                  className="w-full max-w-[140px] h-20 mt-1 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: numSvg.svgString }}
                />
              </div>

              {/* Bottom Specs Details */}
              <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.backName.fillColor }}
                  />
                  <span>Text: <strong className="text-slate-200">{preset.backName.fillColor}</strong></span>
                </div>
                <span className="text-slate-500">Vector Font</span>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-3 bg-[#0A0B10] border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onEditPreset(preset)}
                  className="flex-1 py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>EDIT SPECS</span>
                </button>

                <button
                  onClick={() => onDuplicatePreset(preset)}
                  className="p-1.5 rounded bg-[#161822] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
                  title="Clone / Duplicate Preset"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeletePreset(preset.id)}
                  className="p-1.5 rounded bg-[#161822] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 transition cursor-pointer"
                  title="Delete Preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
