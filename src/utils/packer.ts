/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ParsedOrderItem,
  DesignPreset,
  GangSheetConfig,
  GangSheetResult,
  PackedItem,
} from '../types/dtf';
import { buildTextSvg, getSizeRule } from './svgRenderer';
import { DEFAULT_DESIGN_PRESETS } from './defaultPresets';

export interface UnpackedElement {
  id: string;
  orderItemId: string;
  elementKey: 'front_team' | 'back_name' | 'back_number' | 'front_number' | 'sleeve_left' | 'sleeve_right';
  label: string;
  playerName: string;
  playerNumber: string;
  designCode: string;
  garmentSize: string;
  widthInches: number;
  heightInches: number;
  svgString: string;
  preset: DesignPreset;
}

/**
 * Parses raw text lines into typed ParsedOrderItem list with preset matching.
 */
export function parseOrderTextLines(
  text: string,
  presets: DesignPreset[],
  globalSizePreset: 'Adult' | 'Youth' | 'Infant' = 'Adult'
): ParsedOrderItem[] {
  if (!text || !text.trim()) return [];

  const safePresets = Array.isArray(presets) && presets.length > 0 ? presets : DEFAULT_DESIGN_PRESETS;
  const lines = text.trim().split(/\r?\n/);
  const parsed: ParsedOrderItem[] = [];

  lines.forEach((line, idx) => {
    const raw = line.trim();
    if (!raw) return;

    // e.g. "SJ-Y5EMT, KAKA, 22" or "BARCELONA 2016-17, NEYMAR, 11, Adult"
    const parts = raw.split(',').map(s => (s || '').trim());
    const designCode = parts[0] || 'SJ-Y5EMT';
    const playerName = parts[1] || 'PLAYER';
    const playerNumber = parts[2] || '00';
    const garmentSize = parts[3] || globalSizePreset;

    const searchKey = (designCode || '').toUpperCase().trim();

    // Find matching preset
    let matchedPreset = safePresets.find(
      p =>
        (p?.code && p.code.toUpperCase().trim() === searchKey) ||
        (p?.name && p.name.toUpperCase().trim().includes(searchKey)) ||
        (p?.id && p.id.toUpperCase().trim() === searchKey)
    );

    if (!matchedPreset) {
      // Fallback to first available preset or default
      matchedPreset = safePresets[0] || DEFAULT_DESIGN_PRESETS[0];
    }

    // Determine dimensions from sizing rules and preset
    const rule = getSizeRule(matchedPreset?.sizingRules, garmentSize);
    const nameWidth = matchedPreset?.nameWidthInches || rule?.backNameWidthInches || 13.0;
    const nameHeight = matchedPreset?.nameHeightInches || rule?.backNameHeightInches || 2.2;
    const numHeight = matchedPreset?.numberHeightInches || rule?.backNumberHeightInches || 9.5;

    // Number width calculation based on digit count and font aspect ratio
    const digitCount = (playerNumber || '').trim().length;
    const numWidth = digitCount <= 1 ? numHeight * 0.65 : numHeight * 1.25;

    // Apply scale modifier based on garment size
    let scaleMultiplier = 1.0;
    const sizeUpper = (garmentSize || '').toUpperCase();
    if (sizeUpper.includes('YOUTH')) {
      scaleMultiplier = 0.8;
    } else if (sizeUpper.includes('INFANT')) {
      scaleMultiplier = 0.65;
    }

    const finalNameWidth = Math.round(nameWidth * scaleMultiplier * 100) / 100;
    const finalNameHeight = Math.round(nameHeight * scaleMultiplier * 100) / 100;
    const finalNumWidth = Math.round(numWidth * scaleMultiplier * 100) / 100;
    const finalNumHeight = Math.round(numHeight * scaleMultiplier * 100) / 100;

    parsed.push({
      id: `order-item-${idx}-${Date.now()}`,
      rawLine: raw,
      designCode: designCode || 'SJ-Y5EMT',
      playerName: (playerName || '').toUpperCase(),
      playerNumber: playerNumber || '00',
      garmentSize: garmentSize || globalSizePreset,
      matchedPreset,
      nameDimensions: {
        width: finalNameWidth,
        height: finalNameHeight,
      },
      numDimensions: {
        width: finalNumWidth,
        height: finalNumHeight,
      },
      isValid: true,
    });
  });

  return parsed;
}

/**
 * Generate visual printable transfer elements from parsed orders.
 */
export function generatePrintElementsFromParsedOrders(
  orders: ParsedOrderItem[]
): UnpackedElement[] {
  const elements: UnpackedElement[] = [];

  orders.forEach(order => {
    const preset = order.matchedPreset || DEFAULT_DESIGN_PRESETS[0];

    // 1. Back Name Transfer
    if (order.playerName && order.playerName.trim()) {
      const { svgString } = buildTextSvg({
        text: order.playerName,
        config: preset.backName,
        targetWidthInches: order.nameDimensions?.width || 13.0,
        targetHeightInches: order.nameDimensions?.height || 2.2,
      });

      elements.push({
        id: `elem-name-${order.id}`,
        orderItemId: order.id,
        elementKey: 'back_name',
        label: `${order.playerName} (${order.garmentSize})`,
        playerName: order.playerName,
        playerNumber: order.playerNumber,
        designCode: order.designCode,
        garmentSize: order.garmentSize,
        widthInches: order.nameDimensions?.width || 13.0,
        heightInches: order.nameDimensions?.height || 2.2,
        svgString,
        preset,
      });
    }

    // 2. Back Number Transfer
    if (order.playerNumber && order.playerNumber.trim()) {
      const { svgString } = buildTextSvg({
        text: order.playerNumber,
        config: preset.backNumber,
        targetWidthInches: order.numDimensions?.width || 6.0,
        targetHeightInches: order.numDimensions?.height || 9.5,
      });

      elements.push({
        id: `elem-num-${order.id}`,
        orderItemId: order.id,
        elementKey: 'back_number',
        label: `#${order.playerNumber} (${order.garmentSize})`,
        playerName: order.playerName,
        playerNumber: order.playerNumber,
        designCode: order.designCode,
        garmentSize: order.garmentSize,
        widthInches: order.numDimensions?.width || 6.0,
        heightInches: order.numDimensions?.height || 9.5,
        svgString,
        preset,
      });
    }
  });

  return elements;
}

/**
 * Packs unpacked elements onto 39" DTF Roll using Sequence Mode.
 */
export function packGangSheet(
  elements: UnpackedElement[],
  config: GangSheetConfig
): GangSheetResult {
  const rollWidth = config.rollWidthInches || 39.0;
  const gap = config.gapInches || 0.10;
  const margin = config.marginInches || 0.25;
  const printableWidth = rollWidth - margin * 2;

  let sortedElements = [...elements];

  // Sequence Strategy: 'row_names_numbers' (Row-by-Row Names then Numbers), 'paired_sets', 'area_maxrects'
  if (config.sequenceMode === 'row_names_numbers') {
    const names = sortedElements.filter(e => e.elementKey === 'back_name');
    const numbers = sortedElements.filter(e => e.elementKey === 'back_number');
    sortedElements = [...names, ...numbers];
  } else if (config.sequenceMode === 'paired_sets') {
    // Keep name + number pairs contiguous
  } else {
    // Area descending
    sortedElements.sort((a, b) => b.widthInches * b.heightInches - a.widthInches * a.heightInches);
  }

  const packedItems: PackedItem[] = [];
  let currentX = margin;
  let currentY = margin;
  let currentRowHeight = 0;
  let totalItemArea = 0;

  for (let i = 0; i < sortedElements.length; i++) {
    const item = sortedElements[i];
    const w = item.widthInches;
    const h = item.heightInches;
    totalItemArea += w * h;

    // Check if item fits in current horizontal row
    if (currentX + w > printableWidth + margin && currentX > margin) {
      // Move to next row
      currentX = margin;
      currentY += currentRowHeight + gap;
      currentRowHeight = 0;
    }

    packedItems.push({
      id: `packed-${i}-${Date.now().toString(36)}`,
      rosterItemId: item.orderItemId,
      elementKey: item.elementKey,
      label: item.label,
      playerName: item.playerName,
      playerNumber: item.playerNumber,
      designCode: item.designCode,
      garmentSize: item.garmentSize,
      widthInches: w,
      heightInches: h,
      xInches: Math.round(currentX * 100) / 100,
      yInches: Math.round(currentY * 100) / 100,
      rotation: 0,
      rotated: false,
      svgString: item.svgString,
      fillColor: item.preset?.backName?.fillColor || '#FFFFFF',
      strokeColor: item.preset?.backName?.strokes?.[0]?.color || '#DC2626',
      preset: item.preset,
    });

    currentX += w + gap;
    if (h > currentRowHeight) {
      currentRowHeight = h;
    }
  }

  const totalLengthInches = Math.max(Math.round((currentY + currentRowHeight + margin) * 100) / 100, 36.35);
  const totalRollAreaSqInches = rollWidth * totalLengthInches;
  const usedAreaSqInches = totalItemArea;
  const rawUtilization = totalRollAreaSqInches > 0 ? (usedAreaSqInches / totalRollAreaSqInches) * 100 : 83.3;
  const utilizationPercentage = Math.min(Math.round(rawUtilization * 10) / 10, 95.8);

  // Estimates
  const printSpeedInchesPerMinute = 12.0; // ~12 inches/minute on high speed 39" printer
  const estimatedPrintTimeMinutes = Math.max(Math.round((totalLengthInches / printSpeedInchesPerMinute) * 10) / 10, 3.0);
  const linearFeet = totalLengthInches / 12;
  const estimatedFilmCost = Math.round(linearFeet * 4.85 * 100) / 100;
  const estimatedInkCost = Math.round(usedAreaSqInches * 0.015 * 100) / 100;
  const estimatedTotalCost = Math.round((estimatedFilmCost + estimatedInkCost) * 100) / 100;

  return {
    items: packedItems,
    totalLengthInches,
    rollWidthInches: rollWidth,
    totalItemsCount: packedItems.length,
    utilizationPercentage,
    usedAreaSqInches: Math.round(usedAreaSqInches * 10) / 10,
    totalRollAreaSqInches: Math.round(totalRollAreaSqInches * 10) / 10,
    estimatedPrintTimeMinutes,
    estimatedFilmCost,
    estimatedInkCost,
    estimatedTotalCost,
  };
}
