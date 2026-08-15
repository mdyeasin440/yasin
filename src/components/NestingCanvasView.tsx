/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Copy,
  Trash2,
  Sparkles,
  Layers,
  Move,
  Clock,
  Percent,
  Check,
} from 'lucide-react';
import { PackedItem, GangSheetConfig, GangSheetResult } from '../types/dtf';

interface NestingCanvasViewProps {
  items: PackedItem[];
  setItems: React.Dispatch<React.SetStateAction<PackedItem[]>>;
  gangConfig: GangSheetConfig;
  setGangConfig: React.Dispatch<React.SetStateAction<GangSheetConfig>>;
  gangSheetResult: GangSheetResult | null;
  onReNest: () => void;
}

export const NestingCanvasView: React.FC<NestingCanvasViewProps> = ({
  items,
  setItems,
  gangConfig,
  setGangConfig,
  gangSheetResult,
  onReNest,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(65); // 65% default like screenshot
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [batchWidthInput, setBatchWidthInput] = useState<string>('14.0');
  const [batchHeightInput, setBatchHeightInput] = useState<string>('2.5');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize selection with first 4 items if nothing selected to match screenshot 2
  useEffect(() => {
    if (items.length > 0 && selectedItemIds.length === 0) {
      setSelectedItemIds(items.slice(0, Math.min(4, items.length)).map(i => i.id));
    }
  }, [items]);

  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
  const selectedCount = selectedItems.length;

  // Toggle selection
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedItemIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedItemIds([id]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedItemIds([]);
    }
  };

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent, item: PackedItem) => {
    e.stopPropagation();
    if (!selectedItemIds.includes(item.id)) {
      setSelectedItemIds([item.id]);
    }
    setDraggingId(item.id);
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const dx = (e.clientX - dragOffset.x) / ((zoomLevel / 100) * 20); // 20px per inch scale
    const dy = (e.clientY - dragOffset.y) / ((zoomLevel / 100) * 20);

    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      setItems(prev =>
        prev.map(it => {
          if (selectedItemIds.includes(it.id)) {
            return {
              ...it,
              xInches: Math.round((it.xInches + dx) * 100) / 100,
              yInches: Math.round((it.yInches + dy) * 100) / 100,
            };
          }
          return it;
        })
      );
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Alignment actions
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedItems.length < 2) return;

    if (type === 'left') {
      const minX = Math.min(...selectedItems.map(i => i.xInches));
      setItems(prev =>
        prev.map(i => (selectedItemIds.includes(i.id) ? { ...i, xInches: minX } : i))
      );
    } else if (type === 'right') {
      const maxRight = Math.max(...selectedItems.map(i => i.xInches + i.widthInches));
      setItems(prev =>
        prev.map(i =>
          selectedItemIds.includes(i.id)
            ? { ...i, xInches: maxRight - i.widthInches }
            : i
        )
      );
    } else if (type === 'center') {
      const avgCenter =
        selectedItems.reduce((acc, i) => acc + (i.xInches + i.widthInches / 2), 0) /
        selectedItems.length;
      setItems(prev =>
        prev.map(i =>
          selectedItemIds.includes(i.id)
            ? { ...i, xInches: avgCenter - i.widthInches / 2 }
            : i
        )
      );
    } else if (type === 'top') {
      const minY = Math.min(...selectedItems.map(i => i.yInches));
      setItems(prev =>
        prev.map(i => (selectedItemIds.includes(i.id) ? { ...i, yInches: minY } : i))
      );
    } else if (type === 'bottom') {
      const maxBottom = Math.max(...selectedItems.map(i => i.yInches + i.heightInches));
      setItems(prev =>
        prev.map(i =>
          selectedItemIds.includes(i.id)
            ? { ...i, yInches: maxBottom - i.heightInches }
            : i
        )
      );
    } else if (type === 'middle') {
      const avgMiddle =
        selectedItems.reduce((acc, i) => acc + (i.yInches + i.heightInches / 2), 0) /
        selectedItems.length;
      setItems(prev =>
        prev.map(i =>
          selectedItemIds.includes(i.id)
            ? { ...i, yInches: avgMiddle - i.heightInches / 2 }
            : i
        )
      );
    }
  };

  // Nudge actions
  const handleNudge = (dx: number, dy: number) => {
    setItems(prev =>
      prev.map(i =>
        selectedItemIds.includes(i.id)
          ? {
              ...i,
              xInches: Math.max(0, Math.round((i.xInches + dx) * 100) / 100),
              yInches: Math.max(0, Math.round((i.yInches + dy) * 100) / 100),
            }
          : i
      )
    );
  };

  // Scale actions
  const handleScaleWidth = (deltaPercent: number) => {
    const factor = 1 + deltaPercent / 100;
    setItems(prev =>
      prev.map(i =>
        selectedItemIds.includes(i.id)
          ? { ...i, widthInches: Math.round(i.widthInches * factor * 100) / 100 }
          : i
      )
    );
  };

  const handleScaleHeight = (deltaPercent: number) => {
    const factor = 1 + deltaPercent / 100;
    setItems(prev =>
      prev.map(i =>
        selectedItemIds.includes(i.id)
          ? { ...i, heightInches: Math.round(i.heightInches * factor * 100) / 100 }
          : i
      )
    );
  };

  const handleUniformScale = (deltaPercent: number) => {
    const factor = 1 + deltaPercent / 100;
    setItems(prev =>
      prev.map(i =>
        selectedItemIds.includes(i.id)
          ? {
              ...i,
              widthInches: Math.round(i.widthInches * factor * 100) / 100,
              heightInches: Math.round(i.heightInches * factor * 100) / 100,
            }
          : i
      )
    );
  };

  // Batch dimension apply
  const handleApplyBatchDimensions = () => {
    const w = parseFloat(batchWidthInput);
    const h = parseFloat(batchHeightInput);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      setItems(prev =>
        prev.map(i =>
          selectedItemIds.includes(i.id)
            ? { ...i, widthInches: w, heightInches: h }
            : i
        )
      );
    }
  };

  // Batch rotation
  const handleRotate = (angle: number) => {
    setItems(prev =>
      prev.map(i =>
        selectedItemIds.includes(i.id)
          ? { ...i, rotation: angle, rotated: angle === 90 || angle === 270 }
          : i
      )
    );
  };

  // Duplicate selected
  const handleDuplicate = () => {
    const newItems: PackedItem[] = selectedItems.map((item, idx) => ({
      ...item,
      id: `packed-dup-${Date.now()}-${idx}`,
      xInches: item.xInches + 0.5,
      yInches: item.yInches + 0.5,
    }));
    setItems(prev => [...prev, ...newItems]);
    setSelectedItemIds(newItems.map(i => i.id));
  };

  // Delete selected
  const handleDelete = () => {
    setItems(prev => prev.filter(i => !selectedItemIds.includes(i.id)));
    setSelectedItemIds([]);
  };

  // Compute selection group bounds
  const groupBounds = selectedItems.length > 0
    ? {
        minX: Math.min(...selectedItems.map(i => i.xInches)),
        minY: Math.min(...selectedItems.map(i => i.yInches)),
        maxX: Math.max(...selectedItems.map(i => i.xInches + i.widthInches)),
        maxY: Math.max(...selectedItems.map(i => i.yInches + i.heightInches)),
      }
    : null;

  // Scale factor: 1 inch = 20px base * (zoomLevel / 100)
  const scale = 20 * (zoomLevel / 100);
  const rollWidthInches = gangConfig.rollWidthInches || 39.0;
  const sheetLengthInches = gangSheetResult?.totalLengthInches || 36.35;

  return (
    <div className="space-y-3 max-w-[1700px] mx-auto">
      
      {/* Top Action Bar */}
      <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-2.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Tools */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Roll Width Badge */}
          <div className="px-3 py-1 rounded-lg border border-red-500/80 bg-red-950/30 text-red-400 text-xs font-black font-mono tracking-wider">
            WIDTH: 39 INCHES
          </div>

          {/* Cut Gap Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#161822] border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono">
            <span className="text-slate-400 font-bold">CUT GAP:</span>
            <select
              value={gangConfig.gapInches}
              onChange={(e) =>
                setGangConfig(prev => ({ ...prev, gapInches: parseFloat(e.target.value) }))
              }
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="0.10" className="bg-[#161822]">0.10" Minimal (2.5mm)</option>
              <option value="0.25" className="bg-[#161822]">0.25" Standard (6.3mm)</option>
              <option value="0.375" className="bg-[#161822]">0.375" Relaxed</option>
              <option value="0.50" className="bg-[#161822]">0.50" Wide Cut</option>
            </select>
          </div>

          {/* Sequence Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#161822] border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono">
            <span className="text-slate-400 font-bold">SEQUENCE:</span>
            <select
              value={gangConfig.sequenceMode}
              onChange={(e) =>
                setGangConfig(prev => ({ ...prev, sequenceMode: e.target.value as any }))
              }
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="row_names_numbers" className="bg-[#161822]">Row-by-Row Names then Numbers</option>
              <option value="paired_sets" className="bg-[#161822]">Paired Sets</option>
              <option value="area_maxrects" className="bg-[#161822]">Area Optimized MaxRects</option>
              <option value="compact_grid" className="bg-[#161822]">Compact Grid</option>
            </select>
          </div>

          {/* Cut Lines Toggle */}
          <button
            onClick={() =>
              setGangConfig(prev => ({ ...prev, showCutLines: !prev.showCutLines }))
            }
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-1.5 border transition cursor-pointer ${
              gangConfig.showCutLines
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#161822] border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>CUT LINES</span>
          </button>

          {/* Auto Re-Nest Sheet Button */}
          <button
            onClick={onReNest}
            className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black font-mono uppercase tracking-wider flex items-center gap-1.5 transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>AUTO RE-NEST SHEET</span>
          </button>

        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#161822] border border-slate-700 px-2 py-1 rounded-lg text-xs font-mono text-slate-300">
          <button
            onClick={() => setZoomLevel(prev => Math.max(30, prev - 10))}
            className="p-1 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold px-1.5 text-white">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
            className="p-1 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(65)}
            className="p-1 hover:text-white border-l border-slate-700 ml-1 pl-1.5 cursor-pointer"
            title="Reset Zoom (65%)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main Workspace: Canvas (Left) + Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left 9-Cols: 2D Interactive Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 bg-[#07080C] border border-slate-800 rounded-xl p-4 shadow-2xl overflow-auto min-h-[640px] select-none">
          
          {/* Top Ruler Markers */}
          <div
            className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800/80 pb-2 mb-4 whitespace-nowrap"
            style={{ width: `${(rollWidthInches + 20) * scale}px`, minWidth: '100%' }}
          >
            <span>WEST PASTEBOARD (-10")</span>
            <span className="text-slate-400 font-bold">0.0" (LEFT SHEET EDGE)</span>
            <span className="text-blue-400 font-bold">19.5" (SHEET CENTER)</span>
            <span className="text-slate-400 font-bold">39.0" (RIGHT SHEET EDGE)</span>
            <span>EAST PASTEBOARD (+10")</span>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative bg-[#0A0B10] border border-slate-800/60 rounded-lg mx-auto overflow-visible"
            style={{
              width: `${(rollWidthInches + 10) * scale}px`,
              minHeight: `${Math.max(sheetLengthInches + 8, 40) * scale}px`,
              backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)',
              backgroundSize: `${scale}px ${scale}px`,
            }}
          >
            {/* Active 39.0" Sheet Box */}
            <div
              className="absolute top-4 left-6 border-2 border-red-500/80 bg-slate-950/40 rounded shadow-2xl pointer-events-none"
              style={{
                width: `${rollWidthInches * scale}px`,
                height: `${sheetLengthInches * scale}px`,
              }}
            >
              <div className="absolute -top-3 left-3 px-2 py-0.5 bg-red-600 text-white text-[9px] font-mono font-black uppercase rounded shadow">
                39.0" ACTIVE PRINT SHEET
              </div>
            </div>

            {/* Cut Lines (if enabled) */}
            {gangConfig.showCutLines && (
              <div
                className="absolute top-4 left-6 pointer-events-none"
                style={{
                  width: `${rollWidthInches * scale}px`,
                  height: `${sheetLengthInches * scale}px`,
                }}
              >
                {/* Horizontal Cut Guidelines */}
                {Array.from({ length: Math.ceil(sheetLengthInches / 6) }).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-b border-dashed border-cyan-500/40"
                    style={{ top: `${(idx + 1) * 6 * scale}px` }}
                  />
                ))}
              </div>
            )}

            {/* Printable Items */}
            {items.map(item => {
              const isSelected = selectedItemIds.includes(item.id);
              const itemWidthPx = item.widthInches * scale;
              const itemHeightPx = item.heightInches * scale;
              const itemLeftPx = 24 + item.xInches * scale;
              const itemTopPx = 16 + item.yInches * scale;

              return (
                <div
                  key={item.id}
                  onClick={(e) => handleItemClick(e, item.id)}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  className={`absolute transition-all cursor-move group ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/20 z-20'
                      : 'hover:ring-1 hover:ring-slate-500 z-10'
                  }`}
                  style={{
                    left: `${itemLeftPx}px`,
                    top: `${itemTopPx}px`,
                    width: `${itemWidthPx}px`,
                    height: `${itemHeightPx}px`,
                    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                  }}
                >
                  {/* Visual SVG Content */}
                  <div
                    className="w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: item.svgString }}
                  />

                  {/* Dimension tag on hover */}
                  <div className="absolute -bottom-4 left-0 px-1 py-0.2 bg-black/90 text-[8px] font-mono text-slate-300 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-30">
                    {item.widthInches}" x {item.heightInches}" • {item.label}
                  </div>
                </div>
              );
            })}

            {/* Unified Multi-Selection Group Bounding Box */}
            {groupBounds && selectedItems.length > 1 && (
              <div
                className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/5 pointer-events-none z-30 shadow-lg"
                style={{
                  left: `${24 + groupBounds.minX * scale - 4}px`,
                  top: `${16 + groupBounds.minY * scale - 4}px`,
                  width: `${(groupBounds.maxX - groupBounds.minX) * scale + 8}px`,
                  height: `${(groupBounds.maxY - groupBounds.minY) * scale + 8}px`,
                }}
              >
                {/* Corner Resizing Anchor Handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />

                {/* Group Badge */}
                <div className="absolute -top-6 left-2 px-2 py-0.5 bg-cyan-600 text-black text-[9px] font-mono font-black uppercase rounded shadow">
                  UNIFIED GROUP SELECTION ({selectedCount} ITEMS)
                </div>
              </div>
            )}

          </div>

          {/* Footer Workspace Notice */}
          <div className="text-[11px] font-mono text-slate-500 mt-4 text-center">
            Illustrator Pasteboard Workspace: Park extra items outside the 39" sheet box, or drag items into the active sheet.
          </div>

        </div>

        {/* Right 3-Cols: Adobe Element Inspector Panel */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3.5">
          
          <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 font-mono">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                ADOBE ELEMENT INSPECTOR
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                {selectedCount} SELECTED
              </span>
            </div>

            {/* Align Selected Elements */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ALIGN SELECTED ELEMENTS:
              </div>
              <div className="grid grid-cols-6 gap-1 bg-[#090A10] p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => handleAlign('left')}
                  disabled={selectedCount < 2}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAlign('center')}
                  disabled={selectedCount < 2}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAlign('right')}
                  disabled={selectedCount < 2}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAlign('top')}
                  disabled={selectedCount < 2}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="Align Top"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAlign('middle')}
                  disabled={selectedCount < 2}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="Align Middle"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAlign('bottom')}
                  disabled={selectedCount < 2}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  title="Align Bottom"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Unified Group Position & Nudge */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                UNIFIED GROUP POSITION & NUDGE:
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => handleNudge(0, -0.1)}
                  disabled={selectedCount === 0}
                  className="px-2 py-1.5 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3 text-blue-400" />
                  <span>0.1"</span>
                </button>
                <button
                  onClick={() => handleNudge(0, 0.1)}
                  disabled={selectedCount === 0}
                  className="px-2 py-1.5 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3 text-blue-400" />
                  <span>0.1"</span>
                </button>
                <button
                  onClick={() => handleNudge(-0.1, 0)}
                  disabled={selectedCount === 0}
                  className="px-2 py-1.5 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3 text-blue-400" />
                  <span>0.1"</span>
                </button>
                <button
                  onClick={() => handleNudge(0.1, 0)}
                  disabled={selectedCount === 0}
                  className="px-2 py-1.5 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-400" />
                  <span>0.1"</span>
                </button>
              </div>
            </div>

            {/* Independent Group Scaling */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                INDEPENDENT GROUP SCALING:
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => handleScaleWidth(-5)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                  >
                    Width -5%
                  </button>
                  <button
                    onClick={() => handleScaleWidth(5)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                  >
                    Width +5%
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => handleScaleHeight(-5)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                  >
                    Height -5%
                  </button>
                  <button
                    onClick={() => handleScaleHeight(5)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                  >
                    Height +5%
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => handleUniformScale(-5)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-blue-950/40 hover:bg-blue-900/50 disabled:opacity-40 text-blue-400 text-[10px] font-bold border border-blue-800/50 cursor-pointer"
                  >
                    Uniform (-5%)
                  </button>
                  <button
                    onClick={() => handleUniformScale(5)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-blue-950/40 hover:bg-blue-900/50 disabled:opacity-40 text-blue-400 text-[10px] font-bold border border-blue-800/50 cursor-pointer"
                  >
                    Uniform (+5%)
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Dimension Inputs */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                BATCH DIMENSION INPUTS:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block mb-0.5">SET WIDTH (ALL)</label>
                  <input
                    type="text"
                    value={batchWidthInput}
                    onChange={(e) => setBatchWidthInput(e.target.value)}
                    onBlur={handleApplyBatchDimensions}
                    className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold text-center focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-0.5">SET HEIGHT (ALL)</label>
                  <input
                    type="text"
                    value={batchHeightInput}
                    onChange={(e) => setBatchHeightInput(e.target.value)}
                    onBlur={handleApplyBatchDimensions}
                    className="w-full bg-[#07080C] border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold text-center focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Batch Angle Rotation */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                BATCH ANGLE ROTATION:
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 90, 180, 270].map(deg => (
                  <button
                    key={deg}
                    onClick={() => handleRotate(deg)}
                    disabled={selectedCount === 0}
                    className="px-2 py-1 rounded bg-[#161822] hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Duplicate & Delete Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleDuplicate}
                disabled={selectedCount === 0}
                className="py-1.5 px-2 rounded bg-emerald-950/30 hover:bg-emerald-900/40 disabled:opacity-40 text-emerald-400 text-xs font-bold border border-emerald-800/40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>DUPLICATE ALL</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedCount === 0}
                className="py-1.5 px-2 rounded bg-red-950/30 hover:bg-red-900/40 disabled:opacity-40 text-red-400 text-xs font-bold border border-red-800/40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE ALL</span>
              </button>
            </div>

          </div>

          {/* DTF Roll Print Stats Card */}
          <div className="bg-[#0E1017] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                DTF ROLL PRINT STATS
              </h4>
              <span className="text-[10px] text-blue-400 font-bold">39" WIDTH</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#090A10] p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">FILM EFFICIENCY</div>
                <div className="text-emerald-400 font-black text-sm mt-0.5">
                  {gangSheetResult?.utilizationPercentage || 83.3}%
                </div>
              </div>
              <div className="bg-[#090A10] p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">ROLL LENGTH</div>
                <div className="text-white font-black text-sm mt-0.5">
                  {sheetLengthInches}"
                </div>
              </div>
              <div className="bg-[#090A10] p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">TOTAL ELEMENTS</div>
                <div className="text-blue-400 font-black text-sm mt-0.5">
                  {items.length} Items
                </div>
              </div>
              <div className="bg-[#090A10] p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">PRINT TIME</div>
                <div className="text-amber-400 font-black text-sm mt-0.5">
                  ~{gangSheetResult ? Math.round(gangSheetResult.estimatedPrintTimeMinutes) : 3} Mins
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
