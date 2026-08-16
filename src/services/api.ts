/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DesignPreset, RosterItem, GangSheetResult } from '../types/dtf';
import { DEFAULT_DESIGN_PRESETS } from '../utils/defaultPresets';

const PRESETS_STORAGE_KEY = 'spideydtf_presets_v2';
const ORDERS_STORAGE_KEY = 'spideydtf_orders_v2';

export interface CloudStatus {
  d1Connected: boolean;
  presetCount: number;
  r2Connected: boolean;
  status: 'connected' | 'offline' | 'local_only';
}

export const ApiService = {
  /**
   * Check connection to Cloudflare D1 & Worker backend
   */
  async checkCloudStatus(): Promise<CloudStatus> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        return {
          d1Connected: data.d1?.status === 'connected' || data.d1?.bound === true,
          presetCount: data.d1?.presetCount || 0,
          r2Connected: data.r2?.bound === true,
          status: data.d1?.bound ? 'connected' : 'local_only',
        };
      }
    } catch {
      // offline or local dev
    }
    return {
      d1Connected: false,
      presetCount: 0,
      r2Connected: false,
      status: 'offline',
    };
  },

  /**
   * Load presets (fetches from Cloudflare D1 first, merges with local state & defaults)
   */
  async getPresets(): Promise<DesignPreset[]> {
    let cloudPresets: DesignPreset[] = [];
    let d1Active = false;

    try {
      const res = await fetch('/api/presets');
      if (res.ok) {
        const data = await res.json();
        d1Active = data.d1_connected === true;
        if (data.presets && Array.isArray(data.presets) && data.presets.length > 0) {
          cloudPresets = data.presets.map((p: any) =>
            typeof p.config_json === 'string' ? JSON.parse(p.config_json) : p
          );
        }
      }
    } catch (e) {
      console.warn('Cloudflare D1 fetch offline / using cache:', e);
    }

    // If cloud has presets, use them as primary authority
    if (cloudPresets.length > 0) {
      const cloudIds = new Set(cloudPresets.map(p => p.id));
      const remainingDefaults = DEFAULT_DESIGN_PRESETS.filter(p => !cloudIds.has(p.id));
      const combined = [...cloudPresets, ...remainingDefaults];
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    }

    // If D1 is connected but currently empty, auto-seed defaults into D1 in background
    const localData = localStorage.getItem(PRESETS_STORAGE_KEY);
    let workingPresets = DEFAULT_DESIGN_PRESETS;
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          workingPresets = parsed;
        }
      } catch (e) {
        console.error('Failed to parse local presets:', e);
      }
    }

    // Auto seed to D1 if D1 is active
    if (d1Active && workingPresets.length > 0) {
      this.syncAllPresetsToCloud(workingPresets).catch(console.error);
    }

    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(workingPresets));
    return workingPresets;
  },

  /**
   * Save or update preset both locally and in Cloudflare D1
   */
  async savePreset(preset: DesignPreset): Promise<boolean> {
    // 1. Update localStorage immediately for fast responsive UI
    const current = await this.getPresets();
    const existingIndex = current.findIndex(p => p.id === preset.id);
    let updated: DesignPreset[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = preset;
    } else {
      updated = [preset, ...current];
    }
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));

    // 2. Persist to Cloudflare D1 backend
    try {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      if (res.ok) {
        console.log('✅ Preset synced to Cloudflare D1 database:', preset.name);
      }
    } catch (e) {
      console.warn('Backend sync failed, saved locally:', e);
    }

    return true;
  },

  /**
   * Bulk sync all presets to Cloudflare D1
   */
  async syncAllPresetsToCloud(presets: DesignPreset[]): Promise<boolean> {
    try {
      const res = await fetch('/api/presets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presets }),
      });
      if (res.ok) {
        console.log(`✅ Bulk synced ${presets.length} presets to Cloudflare D1`);
        return true;
      }
    } catch (e) {
      console.error('Failed to bulk sync presets to D1:', e);
    }
    return false;
  },

  /**
   * Delete preset from both LocalStorage and Cloudflare D1
   */
  async deletePreset(presetId: string): Promise<boolean> {
    const current = await this.getPresets();
    const filtered = current.filter(p => p.id !== presetId);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(filtered));

    try {
      await fetch(`/api/presets?id=${encodeURIComponent(presetId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend delete sync failed:', e);
    }

    return true;
  },

  /**
   * Save bulk order to D1 / local storage
   */
  async saveBulkOrder(payload: {
    orderNumber: string;
    teamName: string;
    sport: string;
    garmentType: string;
    garmentColor: string;
    roster: RosterItem[];
    gangSheet?: GangSheetResult;
  }): Promise<string> {
    const orderId = `ord_${Date.now()}`;
    const orderRecord = {
      id: orderId,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const existingOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    existingOrders.unshift(orderRecord);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(existingOrders.slice(0, 50)));

    // Try backend
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Cloud order sync failed, stored locally:', e);
    }

    return orderId;
  },

  /**
   * Upload asset to R2 Bucket
   */
  async uploadAsset(file: File, path: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        return data.url || `/api/assets/${path}`;
      }
    } catch (e) {
      console.error('R2 Asset upload failed:', e);
    }

    // Fallback: Read as base64 Data URL so local works seamlessly
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },
};
