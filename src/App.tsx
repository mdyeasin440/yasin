/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DesignPreset, ParsedOrderItem, PackedItem, GangSheetConfig, GangSheetResult } from './types/dtf';
import { DEFAULT_DESIGN_PRESETS } from './utils/defaultPresets';
import { parseOrderTextLines, generatePrintElementsFromParsedOrders, packGangSheet } from './utils/packer';
import { loadGoogleFonts } from './utils/fonts';
import { ApiService, CloudStatus } from './services/api';

import { Header, ActiveNavTab } from './components/Header';
import { BulkOrdersView } from './components/BulkOrdersView';
import { NestingCanvasView } from './components/NestingCanvasView';
import { DesignPresetsView } from './components/DesignPresetsView';
import { ExportView } from './components/ExportView';
import { EditPresetModal } from './components/EditPresetModal';

const INITIAL_SAMPLE_ORDER_TEXT = `YASIN / 7 / L / TEAM TH / FRONT
MESSI / 10 / M / BARCELONA 2016-17
RONALDO / 7 / XL / REAL MADRID 2014-15
KAKA / 22 / M / AC MILAN CLASSIC 2007
BENZEMA / 9 / L / REAL MADRID 2023-24
PEDRI / 8 / S / BARCELONA 2023-24
SAKA / 7 / M / ARSENAL 2023-24
SALAH / 11 / L / LIVERPOOL 2023-24
HAALAND / 9 / XL / MAN CITY 2023-24
MBAPPE / 7 / M / PSG 2023-24`;

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('bulk_orders');

  // Core Data
  const [orderText, setOrderText] = useState<string>(INITIAL_SAMPLE_ORDER_TEXT);
  const [presets, setPresets] = useState<DesignPreset[]>(DEFAULT_DESIGN_PRESETS);
  const [editingPreset, setEditingPreset] = useState<DesignPreset | null>(null);
  const [globalSizePreset, setGlobalSizePreset] = useState<string>('ADULT_STANDARD');
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>({
    d1Connected: false,
    presetCount: 0,
    r2Connected: false,
    status: 'local_only',
  });

  // Nesting Sheet Engine Configuration (39" Roll Standard)
  const [gangConfig, setGangConfig] = useState<GangSheetConfig>({
    rollWidthInches: 39.0,
    gapInches: 0.375,
    marginInches: 0.25,
    maxSheetLengthInches: 120.0,
    allowRotation: true,
    sortStrategy: 'HEIGHT_DESC',
  });

  // Custom packed items on canvas
  const [canvasItems, setCanvasItems] = useState<PackedItem[]>([]);
  const [isManualCanvasEdited, setIsManualCanvasEdited] = useState<boolean>(false);

  // Load fonts, cloud status, and stored presets
  useEffect(() => {
    loadGoogleFonts();

    // Check Cloud connection
    ApiService.checkCloudStatus().then(status => {
      setCloudStatus(status);
    });

    // Fetch presets from Cloud / Storage
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
    ApiService.checkCloudStatus().then(setCloudStatus);
  }, []);

  const handleDuplicatePreset = useCallback(async (preset: DesignPreset) => {
    const newPreset: DesignPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
      code: `${preset.code || 'CUSTOM'}-COPY`,
      name: `${preset.name || 'Custom Preset'} (Copy)`,
      isDefault: false,
    };
    setPresets(prev => [newPreset, ...prev]);
    await ApiService.savePreset(newPreset);
    ApiService.checkCloudStatus().then(setCloudStatus);
  }, []);

  const handleDeletePreset = useCallback(async (id: string) => {
    if (presets.length <= 1) {
      alert('You must keep at least one active design preset.');
      return;
    }
    if (confirm('Delete this design preset?')) {
      setPresets(prev => prev.filter(p => p.id !== id));
      await ApiService.deletePreset(id);
      ApiService.checkCloudStatus().then(setCloudStatus);
    }
  }, [presets.length]);

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

  const handleSyncAllToCloud = useCallback(async () => {
    await ApiService.syncAllPresetsToCloud(presets);
    const status = await ApiService.checkCloudStatus();
    setCloudStatus(status);
  }, [presets]);

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-200 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Universal Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orderCount={parsedOrders.length}
        presetCount={presets.length}
        gangSheetResult={autoGangResult}
        cloudStatus={cloudStatus}
        onSyncAllToCloud={handleSyncAllToCloud}
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
            onDuplicatePreset={handleDuplicatePreset}
            onDeletePreset={handleDeletePreset}
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

      {/* Edit Preset Modal */}
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
            <span className="text-blue-400 font-semibold">
              {cloudStatus.d1Connected ? '● Cloud D1 Database: Connected' : '○ Offline / Local Mode'}
            </span>
            <span>v2.5.0-pro</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
