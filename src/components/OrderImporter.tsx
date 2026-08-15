/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  Sparkles,
  Layers,
  Copy,
  Filter,
} from 'lucide-react';
import { RosterItem, DesignPreset } from '../types/dtf';
import { SAMPLE_TEAM_ROSTERS } from '../utils/defaultPresets';

interface OrderImporterProps {
  roster: RosterItem[];
  setRoster: React.Dispatch<React.SetStateAction<RosterItem[]>>;
  activePreset: DesignPreset;
  teamName: string;
  setTeamName: (name: string) => void;
}

const COMMON_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'YXS', 'YS', 'YM', 'YL', 'YXL', '2T', '3T', '4T'];

export const OrderImporter: React.FC<OrderImporterProps> = ({
  roster,
  setRoster,
  activePreset,
  teamName,
  setTeamName,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Validation analysis
  const validationMap = useMemo(() => {
    const map = new Map<string, { errors: string[]; warnings: string[] }>();
    const seenNumbers = new Map<string, string[]>();

    roster.forEach(player => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const cleanNum = (player.playerNumber || '').trim();
      const cleanName = (player.playerName || '').trim();
      const cleanSize = (player.garmentSize || '').trim().toUpperCase();

      if (!cleanNum && !cleanName) {
        errors.push('Row is empty (needs name or number)');
      }

      if (!cleanNum) {
        warnings.push('No jersey number assigned');
      } else {
        if (!seenNumbers.has(cleanNum)) {
          seenNumbers.set(cleanNum, []);
        }
        seenNumbers.get(cleanNum)!.push(player.id);
      }

      if (!cleanSize) {
        errors.push('Garment size required');
      } else if (!COMMON_SIZES.includes(cleanSize)) {
        warnings.push(`Non-standard size: "${cleanSize}"`);
      }

      if (cleanName.length > 13) {
        warnings.push('Name > 13 letters; will be condensed on print');
      }

      map.set(player.id, { errors, warnings });
    });

    // Check for duplicate jersey numbers
    seenNumbers.forEach((ids, num) => {
      if (ids.length > 1) {
        ids.forEach(id => {
          const val = map.get(id);
          if (val) {
            val.warnings.push(`Duplicate number #${num} (${ids.length} players)`);
          }
        });
      }
    });

    return map;
  }, [roster]);

  // Total error / warning counts
  const totalErrors = useMemo(() => {
    let count = 0;
    validationMap.forEach(v => {
      count += v.errors.length;
    });
    return count;
  }, [validationMap]);

  const totalWarnings = useMemo(() => {
    let count = 0;
    validationMap.forEach(v => {
      count += v.warnings.length;
    });
    return count;
  }, [validationMap]);

  // Size distribution breakdown
  const sizeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    roster.forEach(r => {
      const s = (r.garmentSize || 'UNKNOWN').toUpperCase();
      dist[s] = (dist[s] || 0) + (r.quantity || 1);
    });
    return dist;
  }, [roster]);

  // Filtered roster
  const filteredRoster = useMemo(() => {
    return roster.filter(item => {
      const search = searchQuery.toLowerCase();
      const pName = (item.playerName || '').toLowerCase();
      const pNum = String(item.playerNumber ?? '');
      const oNum = (item.orderNumber || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();

      const matchesSearch =
        pName.includes(search) ||
        pNum.includes(search) ||
        oNum.includes(search) ||
        notes.includes(search);

      const matchesSize = sizeFilter === 'ALL' || (item.garmentSize || '').toUpperCase() === sizeFilter;

      return matchesSearch && matchesSize;
    });
  }, [roster, searchQuery, sizeFilter]);

  // Parse pasted CSV / TSV text
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split(/\r?\n/);
    const parsedItems: RosterItem[] = [];

    // Check if line 0 is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('name') ||
      firstLine.includes('number') ||
      firstLine.includes('size') ||
      firstLine.includes('order');

    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tab or comma (handling basic quotes)
      const cols = line.includes('\t')
        ? line.split('\t')
        : line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

      const cleanCols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());

      // Smart column heuristics
      let orderNumber = `ORD-${100 + i}`;
      let playerName = '';
      let playerNumber = '';
      let garmentSize = 'L';
      let garmentColor = activePreset.defaultGarmentColor || '#0F172A';
      let quantity = 1;
      let notes = '';

      if (cleanCols.length === 1) {
        // e.g. "23 JOHNSON" or "JOHNSON 23"
        const parts = cleanCols[0].split(/\s+/);
        if (/^\d+$/.test(parts[0])) {
          playerNumber = parts[0];
          playerName = parts.slice(1).join(' ');
        } else if (/^\d+$/.test(parts[parts.length - 1])) {
          playerNumber = parts[parts.length - 1];
          playerName = parts.slice(0, -1).join(' ');
        } else {
          playerName = cleanCols[0];
        }
      } else if (cleanCols.length === 2) {
        // [Name, Number] or [Number, Name]
        if (/^\d+$/.test(cleanCols[0])) {
          playerNumber = cleanCols[0];
          playerName = cleanCols[1];
        } else {
          playerName = cleanCols[0];
          playerNumber = cleanCols[1];
        }
      } else if (cleanCols.length >= 3) {
        // If first col looks like Order ID (starts with #, ORD, BKB, etc.)
        if (/^(ORD|#|[A-Z]{2,4}-\d)/i.test(cleanCols[0])) {
          orderNumber = cleanCols[0];
          playerName = cleanCols[1] || '';
          playerNumber = cleanCols[2] || '';
          garmentSize = cleanCols[3] || 'L';
          notes = cleanCols[4] || '';
        } else {
          playerName = cleanCols[0] || '';
          playerNumber = cleanCols[1] || '';
          garmentSize = cleanCols[2] || 'L';
          quantity = Number(cleanCols[3]) || 1;
          notes = cleanCols[4] || '';
        }
      }

      parsedItems.push({
        id: `roster-${Date.now()}-${i}`,
        orderNumber,
        playerName: playerName.toUpperCase(),
        playerNumber: playerNumber.replace(/#/g, ''),
        garmentSize: garmentSize.toUpperCase(),
        garmentColor,
        garmentType: activePreset.defaultGarmentType,
        quantity: Math.max(quantity, 1),
        notes,
        includeFrontName: true,
        includeBackName: true,
        includeBackNumber: true,
        includeFrontNumber: false,
        includeSleeveNumbers: false,
        sleeveBadgeEnabled: activePreset.sleeveBadge?.enabled || false,
      });
    }

    if (parsedItems.length > 0) {
      setRoster(prev => [...prev, ...parsedItems]);
      setPasteText('');
      setShowPasteModal(false);
    }
  };

  // 1-Click Roster Templates
  const handleLoadSample = (sportKey: string) => {
    const sample = SAMPLE_TEAM_ROSTERS[sportKey];
    if (!sample) return;

    setTeamName(sample.teamName);
    const items: RosterItem[] = sample.items.map((item, idx) => ({
      id: `sample-${sportKey}-${idx}-${Date.now()}`,
      orderNumber: item.orderNumber,
      playerName: item.playerName,
      playerNumber: item.playerNumber,
      garmentSize: item.garmentSize,
      garmentColor: item.garmentColor,
      garmentType: activePreset.defaultGarmentType,
      quantity: item.quantity || 1,
      notes: item.notes || '',
      includeFrontName: true,
      includeBackName: true,
      includeBackNumber: true,
      includeFrontNumber: false,
      includeSleeveNumbers: false,
      sleeveBadgeEnabled: activePreset.sleeveBadge?.enabled || false,
    }));

    setRoster(items);
  };

  // Add individual row
  const handleAddRow = () => {
    const newItem: RosterItem = {
      id: `roster-${Date.now()}`,
      orderNumber: `ORD-${roster.length + 101}`,
      playerName: '',
      playerNumber: '',
      garmentSize: 'L',
      garmentColor: activePreset.defaultGarmentColor || '#0F172A',
      garmentType: activePreset.defaultGarmentType,
      quantity: 1,
      notes: '',
      includeFrontName: true,
      includeBackName: true,
      includeBackNumber: true,
      includeFrontNumber: false,
      includeSleeveNumbers: false,
      sleeveBadgeEnabled: activePreset.sleeveBadge?.enabled || false,
    };
    setRoster([newItem, ...roster]);
  };

  // Update item field
  const handleUpdateItem = (id: string, key: keyof RosterItem, value: any) => {
    setRoster(prev =>
      prev.map(item => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setRoster(prev => prev.filter(item => item.id !== id));
  };

  // Export CSV
  const handleExportCsv = () => {
    const header = 'Order Number,Player Name,Jersey Number,Garment Size,Color,Quantity,Notes\n';
    const rows = roster
      .map(
        r =>
          `"${r.orderNumber}","${r.playerName}","${r.playerNumber}","${r.garmentSize}","${r.garmentColor}",${r.quantity},"${r.notes || ''}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teamName.toLowerCase().replace(/\s+/g, '_')}_roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Fast Actions */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded font-bold">
                BATCH_INGEST
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Bulk Order Processing & Roster Importer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Paste customer rosters directly from Excel / Google Sheets or load sample team templates.
            </p>
          </div>

          {/* Quick Team Roster Loader Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs text-slate-500 font-mono font-semibold mr-1">PRESETS:</span>
            <button
              onClick={() => handleLoadSample('baseball')}
              className="px-2.5 py-1.5 rounded bg-[#0A0A0C] hover:bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>⚾ Spiders (9)</span>
            </button>
            <button
              onClick={() => handleLoadSample('basketball')}
              className="px-2.5 py-1.5 rounded bg-[#0A0A0C] hover:bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🏀 Vipers (5)</span>
            </button>
            <button
              onClick={() => handleLoadSample('soccer')}
              className="px-2.5 py-1.5 rounded bg-[#0A0A0C] hover:bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>⚽ Titans FC (6)</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Team Name Input */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Active Team / Club Name (Front Chest Print)
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value.toUpperCase())}
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-3 py-1.5 text-sm text-white font-bold tracking-wider uppercase focus:outline-none focus:border-red-500"
              placeholder="e.g. SPIDERS BASEBALL"
            />
          </div>

          <div className="md:col-span-8 flex items-center flex-wrap justify-end gap-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Paste Spreadsheet / CSV</span>
            </button>

            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Row</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={roster.length === 0}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {roster.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all players from this roster?')) setRoster([]);
                }}
                className="px-2.5 py-1.5 rounded bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-semibold border border-red-800/40 transition cursor-pointer"
                title="Clear Roster"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation & Size Distribution Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Validation Status Card */}
        <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {totalErrors > 0 ? (
              <div className="w-9 h-9 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            ) : totalWarnings > 0 ? (
              <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Validation Engine</div>
              <div className="text-[11px] text-slate-400">
                {totalErrors > 0
                  ? `${totalErrors} Fatal Errors`
                  : totalWarnings > 0
                  ? `${totalWarnings} Warnings`
                  : 'All Roster Items 100% Valid'}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300">
            {roster.length} Rows
          </span>
        </div>

        {/* Size Distribution Summary */}
        <div className="md:col-span-2 bg-[#0F0F12] border border-slate-800 rounded-xl p-4 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Sizes:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(sizeDistribution).map(([size, count]) => (
                <span
                  key={size}
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#0A0A0C] border border-slate-800 text-cyan-400"
                >
                  {size}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F0F12] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by player name, number, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0A0C] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">SIZE:</span>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="bg-[#0A0A0C] border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
          >
            <option value="ALL">ALL SIZES</option>
            {COMMON_SIZES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Roster Data Table */}
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0A0A0C] text-slate-400 font-mono font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">Order ID</th>
                <th className="p-3">Player Name</th>
                <th className="p-3 w-24">Number</th>
                <th className="p-3 w-28">Size</th>
                <th className="p-3 w-20 text-center">Qty</th>
                <th className="p-3">Print Layers</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-16 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 font-mono">
                    <p className="text-sm font-semibold">NO ROSTER ROWS LOADED</p>
                    <p className="text-xs mt-1 text-slate-600">Paste spreadsheet CSV or click a sample team above.</p>
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item, idx) => {
                  const validation = validationMap.get(item.id);
                  const hasError = validation && validation.errors.length > 0;
                  const hasWarning = validation && validation.warnings.length > 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-900/40 transition ${
                        hasError ? 'bg-red-950/20' : hasWarning ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Row Index */}
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>

                      {/* Order Number */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.orderNumber}
                          onChange={(e) => handleUpdateItem(item.id, 'orderNumber', e.target.value)}
                          className="w-full bg-[#0A0A0C] border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono focus:border-red-500"
                        />
                      </td>

                      {/* Player Name */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.playerName}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'playerName', e.target.value.toUpperCase())
                          }
                          className="w-full bg-[#0A0A0C] border border-slate-800 rounded px-2 py-1 text-xs text-white font-bold uppercase tracking-wider focus:border-red-500"
                          placeholder="e.g. PARKER"
                        />
                      </td>

                      {/* Jersey Number */}
                      <td className="p-3">
                        <input
                          type="text"
                          maxLength={3}
                          value={item.playerNumber}
                          onChange={(e) => handleUpdateItem(item.id, 'playerNumber', e.target.value)}
                          className="w-full bg-[#0A0A0C] border border-slate-800 rounded px-2 py-1 text-xs text-white font-black text-center focus:border-red-500"
                          placeholder="00"
                        />
                      </td>

                      {/* Garment Size */}
                      <td className="p-3">
                        <select
                          value={item.garmentSize}
                          onChange={(e) => handleUpdateItem(item.id, 'garmentSize', e.target.value)}
                          className="w-full bg-[#0A0A0C] border border-slate-800 rounded px-2 py-1 text-xs text-cyan-400 font-mono font-bold focus:border-red-500"
                        >
                          {COMMON_SIZES.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                          }
                          className="w-12 bg-[#0A0A0C] border border-slate-800 rounded px-1 py-1 text-xs text-white text-center font-bold focus:border-red-500"
                        />
                      </td>

                      {/* Toggle Elements */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeFrontName !== false}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'includeFrontName', e.target.checked)
                              }
                              className="accent-red-500 rounded"
                            />
                            <span>Front</span>
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeBackName !== false}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'includeBackName', e.target.checked)
                              }
                              className="accent-red-500 rounded"
                            />
                            <span>Name</span>
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.includeBackNumber !== false}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'includeBackNumber', e.target.checked)
                              }
                              className="accent-red-500 rounded"
                            />
                            <span>Num</span>
                          </label>
                        </div>
                      </td>

                      {/* Validation Badges */}
                      <td className="p-3">
                        {hasError ? (
                          <div className="flex items-center gap-1 text-red-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{validation.errors[0]}</span>
                          </div>
                        ) : hasWarning ? (
                          <div className="flex items-center gap-1 text-amber-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{validation.warnings[0]}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center gap-1 font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>VALID</span>
                          </span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-600 hover:text-red-400 p-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spreadsheet / CSV Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Paste Roster Spreadsheet / CSV</span>
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy columns from Excel, Google Sheets, or CSV file. Auto-detects columns:
              <br />
              <code className="text-emerald-400 font-mono text-[11px]">
                Order ID | Player Name | Jersey # | Size (S/M/L/XL) | Notes
              </code>
            </p>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Example:\nORD-101\tPARKER\t07\tL\tCaptain\nORD-102\tMORALES\t10\tM\tShortstop\nORD-103\tSTACY\t24\tS\tPitcher`}
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded p-3 text-xs text-white font-mono focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
