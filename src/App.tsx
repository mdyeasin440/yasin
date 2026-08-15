/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, ActiveNavTab } from './components/Header';
import { BulkOrdersView } from './components/BulkOrdersView';
import { NestingCanvasView } from './components/NestingCanvasView';
import { DesignPresetsView } from './components/DesignPresetsView';
import { EditPresetModal } from './components/EditPresetModal';
import { ExportView } from './components/ExportView';
import {
  DesignPreset,
  ParsedOrderItem,
  PackedItem,
  GangSheetConfig,
  GangSheetResult,
} from './types/dtf';
import {
  DEFAULT_DESIGN_PRESETS,
  SAMPLE_ORDER_TEXT_1,
} from './utils/defaultPresets';
import { loadGoogleFonts } from './utils/fonts';
import {
  parseOrderTextLines,
  generatePrintElementsFromParsedOrders,
  packGangSheet,
} from './utils/packer';
import { ApiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('bulk_orders');
  const [presets, setPresets] = useState<DesignPreset[]>(DEFAULT_DESIGN_PRESETS);
  const [orderText, setOrderText] = useState<string>(SAMPLE_ORDER_TEXT_1);
  const [globalSizePreset, setGlobalSizePreset] = useState<'Adult' | 'Youth' | 'Infant'>('Adult');
  const [editingPreset, setEditingPreset] = useState<DesignPreset | null>(null);

  // Gang sheet configuration (Default 39" roll width & 0.10" gap)
  const [gangConfig, setGangConfig] = useState<GangSheetConfig>({
    rollWidthInches: 39.0,
    gapInches: 0.10,
    marginInches: 0.25,
    allowRotation: false,
    sequenceMode: 'row_names_numbers',
    showCutLines: true,
    showItemLabels: true,
    showJobHeader: true,
    filmType: 'cold_peel_matte',
  });

  // Custom packed items on canvas
  const [canvasItems, setCanvasItems] = useState<PackedItem[]>([]);
  const [isManualCanvasEdited, setIsManualCanvasEdited] = useState<boolean>(false);

  // Load fonts and stored presets
  useEffect(() => {
    loadGoogleFonts();

    ApiService.getPresets().then(loaded => {
      if (loaded && loaded.length > 0) {
        setPresets(loaded);
      }
    });
  }, []);

  // Parse order text lines with matched presets
  const parsedOrders: ParsedOrderItem[] = useMemo(() => {
    return parseOrderTextLines(orderText, presets, globalSizePreset);
  }, [orderText, presets, globalSizePreset]);

  // Compute automatic Gang Sheet packing
  const autoGangResult: GangSheetResult | null = useMemo(() => {
    try {
      if (parsedOrders.length === 0) return null;
      const elements = generatePrintElementsFromParsedOrders(parsedOrders);
      if (elements.length === 0) return null;
      return packGangSheet(elements, gangConfig);
    } catch (err) {
      console.error('Packing calculation error:', err);
      return null;
    }
  }, [parsedOrders, gangConfig]);

  // Synchronize canvas items with auto packing result unless manually modified
  useEffect(() => {
    if (!isManualCanvasEdited && autoGangResult) {
      setCanvasItems(autoGangResult.items);
    }
  }, [autoGangResult, isManualCanvasEdited]);

  // Re-nest trigger
  const handleReNest = useCallback(() => {
    if (parsedOrders.length === 0) return;
    const elements = generatePrintElementsFromParsedOrders(parsedOrders);
    const packed = packGangSheet(elements, gangConfig);
    setCanvasItems(packed.items);
    setIsManualCanvasEdited(false);
  }, [parsedOrders, gangConfig]);

  // Generate sheet & transition to 39" canvas
  const handleGenerateSheetAndNavigate = useCallback(() => {
    handleReNest();
    setActiveTab('nesting_canvas');
  }, [handleReNest]);

  // Preset management
  const handleSavePreset = useCallback(async (updatedPreset: DesignPreset) => {
    setPresets(prev => {
      const idx = prev.findIndex(p => p.id === updatedPreset.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedPreset;
        return next;
      }
      return [updatedPreset, ...prev];
    });
    setEditingPreset(null);
    await ApiService.savePreset(updatedPreset);
  }, []);

  const handleCreateNewPreset = useCallback(() => {
    const newPreset: DesignPreset = {
      id: `preset-${Date.now()}`,
      code: `CUSTOM-${presets.length + 1}`,
      name: `Custom Team Preset ${presets.length + 1}`,
      category: 'Custom',
      league: 'Custom',
      season: '2023-24',
      sport: 'soccer',
      description: 'Custom team specification preset',
      arcCurveAngle: 12,
      nameWidthInches: 13.0,
      nameHeightInches: 2.2,
      numberHeightInches: 9.5,
      letterSpacingPx: 3,
      frontText: { ...DEFAULT_DESIGN_PRESETS[0].frontText },
      backName: { ...DEFAULT_DESIGN_PRESETS[0].backName },
      backNumber: { ...DEFAULT_DESIGN_PRESETS[0].backNumber },
      sizingRules: DEFAULT_DESIGN_PRESETS[0].sizingRules,
      defaultTeamName: 'CUSTOM FC',
      defaultGarmentType: 'soccer_kit',
      defaultGarmentColor: '#0F172A',
      defaultFabricTexture: 'poly_knit',
    };
    setEditingPreset(newPreset);
  }, [presets.length]);

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Universal Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orderCount={parsedOrders.length}
        presetCount={presets.length}
        gangSheetResult={autoGangResult}
      />

      {/* Main App Workspace */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 py-5">
        
        {/* Tab 1: Bulk Orders Input */}
        {activeTab === 'bulk_orders' && (
          <BulkOrdersView
            orderText={orderText}
            setOrderText={setOrderText}
            parsedOrders={parsedOrders}
            presets={presets}
            globalSizePreset={globalSizePreset}
            setGlobalSizePreset={setGlobalSizePreset}
            onGenerateSheet={handleGenerateSheetAndNavigate}
          />
        )}

        {/* Tab 2: 39" Nesting Canvas */}
        {activeTab === 'nesting_canvas' && (
          <NestingCanvasView
            items={canvasItems}
            setItems={(itemsOrUpdater) => {
              setIsManualCanvasEdited(true);
              setCanvasItems(itemsOrUpdater);
            }}
            gangConfig={gangConfig}
            setGangConfig={setGangConfig}
            gangSheetResult={autoGangResult}
            onReNest={handleReNest}
          />
        )}

        {/* Tab 3: Design Presets */}
        {activeTab === 'design_presets' && (
          <DesignPresetsView
            presets={presets}
            setPresets={setPresets}
            onEditPreset={(p) => setEditingPreset(p)}
            onCreateNewPreset={handleCreateNewPreset}
          />
        )}

        {/* Tab 4: Export DTF File */}
        {activeTab === 'export_dtf' && (
          <ExportView
            items={canvasItems.length > 0 ? canvasItems : autoGangResult?.items || []}
            gangConfig={gangConfig}
            gangSheetResult={autoGangResult}
            parsedOrders={parsedOrders}
          />
        )}

      </main>

      {/* Edit Preset Modal (Screenshot 4) */}
      {editingPreset && (
        <EditPresetModal
          preset={editingPreset}
          onSave={handleSavePreset}
          onClose={() => setEditingPreset(null)}
        />
      )}

      {/* Persistent System Footer */}
      <footer className="border-t border-slate-900 bg-[#090A10] py-3 text-xs text-slate-500 font-mono">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-white font-black">SPIDEY JERSEY DTF PRO</span>
            <span className="text-slate-700">|</span>
            <span>39.00" ROLL DTF PRINT ENGINE</span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-bold">READY AT 300 DPI</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>D1: spideydtf.db</span>
            <span>R2: dtf-bucket-assets</span>
            <span>v2.4.0-pro</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
