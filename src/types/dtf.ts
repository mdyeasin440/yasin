/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JerseyViewMode = 'front' | 'back' | 'sleeve_left' | 'sleeve_right';

export type SportType =
  | 'baseball'
  | 'basketball'
  | 'soccer'
  | 'football'
  | 'hockey'
  | 'esports'
  | 'track'
  | 'volleyball'
  | 'custom';

export type GarmentType =
  | 'baseball_jersey'
  | 'basketball_tank'
  | 'soccer_kit'
  | 'football_jersey'
  | 'crewneck_tee'
  | 'athletic_hoodie'
  | 'polo_shirt';

export type WarpStyle =
  | 'flat'
  | 'arc_top'
  | 'arc_bottom'
  | 'arch_bridge'
  | 'fisheye'
  | 'wave'
  | 'pennant'
  | 'pinch';

export type SizingCategory = 'adult' | 'youth' | 'infant' | 'toddler';

export interface OutlineLayer {
  enabled: boolean;
  color: string;
  width: number;
  join: 'round' | 'miter' | 'bevel';
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  style: 'hard_extrusion' | 'soft_shadow' | 'retro_3d';
}

export interface TextPresetConfig {
  fontFamily: string;
  fontSizeInches: number;
  fillColor: string;
  letterSpacing: number;
  warpStyle: WarpStyle;
  warpBend: number;
  warpRadius?: number;
  uppercase: boolean;
  strokes: OutlineLayer[];
  shadow: ShadowConfig;
}

export interface NumberPresetConfig extends TextPresetConfig {
  numberStyle: 'single_digit' | 'double_digit' | 'all';
  digitSpacing: number;
  showZeroPrefix: boolean;
}

export interface SizePresetRule {
  sizeCategory: SizingCategory;
  sizes: string[];
  frontNameWidthInches: number;
  frontNameHeightInches: number;
  backNameWidthInches: number;
  backNameHeightInches: number;
  backNumberHeightInches: number;
  frontNumberHeightInches: number;
  sleeveNumberHeightInches: number;
  sleeveBadgeWidthInches: number;
}

export interface DesignPreset {
  id: string;
  code: string; // e.g. SJ-Y5EMT, BARCELONA 2016-17
  name: string;
  category: string;
  league?: string;
  season?: string;
  sport: SportType;
  description?: string;
  isDefault?: boolean;
  customFontFile?: string;
  customFontUrl?: string;
  customNumberAssets?: Record<string, string>; // digit 0-9 image data urls
  customLetterAssets?: Record<string, string>; // letter A-Z image data urls
  arcCurveAngle?: number; // e.g. 12 deg
  nameWidthInches?: number;
  nameHeightInches?: number;
  numberHeightInches?: number;
  letterSpacingPx?: number;
  frontText: TextPresetConfig;
  backName: TextPresetConfig;
  backNumber: NumberPresetConfig;
  frontNumber?: NumberPresetConfig;
  sleeveNumber?: NumberPresetConfig;
  sleeveBadge?: {
    enabled: boolean;
    shape: 'shield' | 'circle' | 'flag' | 'star' | 'custom_logo';
    logoUrl?: string;
    widthInches: number;
    heightInches: number;
    primaryColor: string;
    secondaryColor: string;
  };
  sizingRules: SizePresetRule[];
  defaultTeamName: string;
  defaultGarmentType: GarmentType;
  defaultGarmentColor: string;
  defaultFabricTexture: 'mesh' | 'poly_knit' | 'cotton_heather' | 'sublimation_smooth';
}

export interface ParsedOrderItem {
  id: string;
  rawLine: string;
  designCode: string;
  playerName: string;
  playerNumber: string;
  garmentSize: string; // 'Adult' | 'Youth' | 'Infant' | 'S' | 'M' | 'L' | 'XL'
  matchedPreset?: DesignPreset;
  nameDimensions: { width: number; height: number };
  numDimensions: { width: number; height: number };
  isValid: boolean;
}

export interface RosterItem {
  id: string;
  orderNumber: string;
  designCode?: string;
  playerName: string;
  playerNumber: string;
  garmentSize: string;
  garmentColor: string;
  garmentType?: GarmentType;
  quantity: number;
  notes?: string;
  sleeveBadgeEnabled?: boolean;
  includeFrontName?: boolean;
  includeBackName?: boolean;
  includeBackNumber?: boolean;
  includeFrontNumber?: boolean;
  includeSleeveNumbers?: boolean;
  customWidthOverrideInches?: number;
}

export interface PackedItem {
  id: string;
  rosterItemId: string;
  elementKey: 'front_team' | 'back_name' | 'back_number' | 'front_number' | 'sleeve_left' | 'sleeve_right';
  label: string;
  playerName: string;
  playerNumber: string;
  designCode: string;
  garmentSize: string;
  widthInches: number;
  heightInches: number;
  xInches: number;
  yInches: number;
  rotation: number; // 0, 90, 180, 270
  rotated: boolean;
  svgString: string;
  fillColor?: string;
  strokeColor?: string;
  preset?: DesignPreset;
}

export interface GangSheetConfig {
  rollWidthInches: number; // default 39.0
  gapInches: number; // e.g. 0.10
  marginInches: number;
  allowRotation: boolean;
  sequenceMode: 'row_names_numbers' | 'paired_sets' | 'area_maxrects' | 'compact_grid';
  showCutLines: boolean;
  showItemLabels: boolean;
  showJobHeader: boolean;
  customerName?: string;
  orderRef?: string;
  filmType: 'cold_peel_matte' | 'hot_peel_glossy' | 'glitter_dtf' | 'metallic_gold';
}

export interface GangSheetResult {
  items: PackedItem[];
  totalLengthInches: number;
  rollWidthInches: number;
  totalItemsCount: number;
  utilizationPercentage: number;
  usedAreaSqInches: number;
  totalRollAreaSqInches: number;
  estimatedPrintTimeMinutes: number;
  estimatedFilmCost: number;
  estimatedInkCost: number;
  estimatedTotalCost: number;
}

export interface ExportSettings {
  format: 'zip_bundle' | 'pdf_300dpi' | 'png_hires' | 'manifest_only';
  resolutionDpi: number;
  includeCutlines: boolean;
  includeJobHeader: boolean;
  includeColorBars: boolean;
  includeHeatPressInstructions: boolean;
  includeIndividualSVGs: boolean;
  includeIndividualPNGs: boolean;
  includeManifestCsv: boolean;
  includeManifestJson: boolean;
}
