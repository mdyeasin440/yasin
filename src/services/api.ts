/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DesignPreset, RosterItem, GangSheetResult } from '../types/dtf';
import { DEFAULT_DESIGN_PRESETS } from '../utils/defaultPresets';

const PRESETS_STORAGE_KEY = 'spideydtf_presets_v2';
const ORDERS_STORAGE_KEY = 'spideydtf_orders_v2';

export const ApiService = {
  /**
   * Load presets (tries worker API first, falls back to LocalStorage & defaults)
   */
  async getPresets(): Promise<DesignPreset[]> {
    try {
      const res = await fetch('/api/presets');
      if (res.ok) {
        const data = await res.json();
        if (data.presets && data.presets.length > 0) {
          const parsed = data.presets.map((p: any) =>
            typeof p.config_json === 'string' ? JSON.parse(p.config_json) : p
          );
          return parsed;
        }
      }
    } catch (e) {
      // Offline / dev fallback
    }

    const localData = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse local presets:', e);
      }
    }

    // Default presets
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(DEFAULT_DESIGN_PRESETS));
    return DEFAULT_DESIGN_PRESETS;
  },

  /**
   * Save or update preset
   */
  async savePreset(preset: DesignPreset): Promise<boolean> {
    // 1. Update localStorage
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

    // 2. Try worker API
    try {
      await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
    } catch (e) {
      // Background sync fail silent
    }

    return true;
  },

  /**
   * Delete preset
   */
  async deletePreset(presetId: string): Promise<boolean> {
    const current = await this.getPresets();
    const filtered = current.filter(p => p.id !== presetId);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(filtered));
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
      await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Offline fallback
    }

    return orderId;
  },

  /**
   * Upload logo asset to R2 or Local Data URI
   */
  async uploadAsset(file: File): Promise<string> {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const key = `logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      const res = await fetch(`/api/assets/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'image/png' },
        body: file,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch (e) {
      console.warn('R2 upload skipped, falling back to local data URL:', e);
    }

    // Fallback to Data URL for instant local client preview
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
