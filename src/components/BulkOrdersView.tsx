/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  Filter,
  Sparkles,
} from 'lucide-react';
import { ParsedOrderItem, DesignPreset } from '../types/dtf';
import { SAMPLE_ORDER_TEXT_1, SAMPLE_ORDER_TEXT_2 } from '../utils/defaultPresets';

interface BulkOrdersViewProps {
  orderText: string;
  setOrderText: (val: string) => void;
  parsedOrders: ParsedOrderItem[];
  presets: DesignPreset[];
  globalSizePreset: 'Adult' | 'Youth' | 'Infant';
  setGlobalSizePreset: (size: 'Adult' | 'Youth' | 'Infant') => void;
  onGenerateSheet: () => void;
}

export const BulkOrdersView: React.FC<BulkOrdersViewProps> = ({
  orderText,
  setOrderText,
  parsedOrders,
  presets,
  globalSizePreset,
  setGlobalSizePreset,
  onGenerateSheet,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setOrderText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto">
      
      {/* Top Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white tracking-wider font-mono uppercase">
            BULK ORDER DATA INPUT
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Paste comma-separated order lists. Each line is automatically matched with your team design database specifications.
          </p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Paste Order Lines & Sizing Preset */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card: Paste Order Lines */}
          <div className="bg-[#0E1017] border border-slate-800/90 rounded-xl p-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white font-mono uppercase">
                    PASTE ORDER LINES
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (([DESIGN CODE], [NAME], [NUMBER], [OPTIONAL SIZE]))
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOrderText(SAMPLE_ORDER_TEXT_1)}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono font-bold uppercase border border-slate-700 transition cursor-pointer"
                  >
                    LOAD SAMPLE 1
                  </button>
                  <button
                    onClick={() => setOrderText(SAMPLE_ORDER_TEXT_2)}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono font-bold uppercase border border-slate-700 transition cursor-pointer"
                  >
                    LOAD SAMPLE 2
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={orderText}
                  onChange={(e) => setOrderText(e.target.value)}
                  rows={12}
                  className="w-full bg-[#07080C] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none selection:bg-blue-600/40"
                  placeholder="SJ-Y5EMT, KAKA, 22&#10;SJ-S6NGQ, MESSI, 10&#10;BARCELONA 2016-17, NEYMAR, 11"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Bottom Bar: Total items, matched count, import button, clear */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-2 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Total Items: <strong className="text-white">{parsedOrders.length}</strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{parsedOrders.length} Matched</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded bg-[#161822] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold font-mono uppercase border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import CSV/TXT</span>
                </button>

                <button
                  onClick={() => setOrderText('')}
                  className="p-1.5 rounded bg-[#161822] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 transition cursor-pointer"
                  title="Clear all lines"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Batch Scale & Garment Sizing Preset */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              BATCH SCALE & GARMENT SIZING PRESET
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              {/* Adult Size */}
              <button
                onClick={() => setGlobalSizePreset('Adult')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  globalSizePreset === 'Adult'
                    ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'bg-[#0E1017] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-black font-mono text-white flex items-center justify-between">
                  <span>ADULT SIZE</span>
                  {globalSizePreset === 'Adult' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  100% (12" Name / 9.5" Num)
                </div>
              </button>

              {/* Youth Size */}
              <button
                onClick={() => setGlobalSizePreset('Youth')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  globalSizePreset === 'Youth'
                    ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'bg-[#0E1017] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-black font-mono text-white flex items-center justify-between">
                  <span>YOUTH SIZE</span>
                  {globalSizePreset === 'Youth' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  80% (9.6" Name / 7.6" Num)
                </div>
              </button>

              {/* Infant Size */}
              <button
                onClick={() => setGlobalSizePreset('Infant')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  globalSizePreset === 'Infant'
                    ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'bg-[#0E1017] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-black font-mono text-white flex items-center justify-between">
                  <span>INFANT SIZE</span>
                  {globalSizePreset === 'Infant' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  65% (7.8" Name / 6.1" Num)
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Parsed Orders Table & Generate CTA */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-[#0E1017] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between min-h-[460px]">
            
            {/* Table Top Bar */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#12141F]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider">
                  PARSED ORDERS TABLE ({parsedOrders.length})
                </h3>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Target Canvas: <strong className="text-blue-400">39" Roll Width</strong>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#090A10] text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-slate-800/90 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center text-slate-500">#</th>
                    <th className="py-2.5 px-3">DESIGN CODE</th>
                    <th className="py-2.5 px-3">NAME</th>
                    <th className="py-2.5 px-3 w-16">NUM</th>
                    <th className="py-2.5 px-3 w-20">SIZE</th>
                    <th className="py-2.5 px-3">DIMENSIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {parsedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500">
                        <p className="text-xs font-bold uppercase">NO ORDER LINES PARSED</p>
                        <p className="text-[10px] mt-1 text-slate-600">
                          Click "LOAD SAMPLE 1" or paste your CSV rows above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    parsedOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-blue-400 font-bold text-[11px]">
                          {order.designCode}
                        </td>
                        <td className="py-2.5 px-3 text-white font-black text-xs tracking-wider">
                          {order.playerName}
                        </td>
                        <td className="py-2.5 px-3 text-blue-400 font-black text-xs">
                          {order.playerNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {order.garmentSize}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                          {order.nameDimensions.width}" x {order.nameDimensions.height}" Name / {order.numDimensions.width}" x {order.numDimensions.height}" Num
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Generate CTA */}
            <div className="p-3 bg-[#0A0B10] border-t border-slate-800">
              <button
                onClick={onGenerateSheet}
                disabled={parsedOrders.length === 0}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>GENERATE SHEET & 39" DTF ROLL LAYOUT →</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
