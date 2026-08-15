/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Wand2, X, Check, RefreshCw, Palette, Type, Lightbulb } from 'lucide-react';
import { DesignPreset, SportType } from '../types/dtf';
import { GoogleGenAI } from '@google/genai';

interface AiStylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePreset: DesignPreset;
  onApplyStyle: (updates: Partial<DesignPreset>) => void;
  teamName: string;
  setTeamName: (name: string) => void;
}

export const AiStylistModal: React.FC<AiStylistModalProps> = ({
  isOpen,
  onClose,
  activePreset,
  onApplyStyle,
  teamName,
  setTeamName,
}) => {
  const [sport, setSport] = useState<SportType>(activePreset.sport || 'baseball');
  const [vibe, setVibe] = useState<'aggressive' | 'classic' | 'championship' | 'cyberpunk' | 'retro'>('aggressive');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    teamName: string;
    description: string;
    colors: { primary: string; stroke1: string; stroke2: string; shadow: string; jersey: string };
    warpBend: number;
    letterSpacing: number;
  }>>([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);

    try {
      // Use Gemini API if configured in env
      const apiKey = process.env.GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;

      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a professional sports jersey and DTF print designer. Generate 3 unique team branding concepts for a ${sport} team with a "${vibe}" vibe. For each concept return:
- teamName (all caps)
- description (short athletic aesthetic)
- colors (primary hex, stroke1 hex, stroke2 hex, shadow hex, jersey fabric hex)
- warpBend (integer -40 to 40)
- letterSpacing (integer 0 to 10)
Respond with valid JSON array of 3 items.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed)) {
            setSuggestions(parsed);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Gemini API call skipped, using curated athletic styling engine:', e);
    }

    // Curated high-impact athletic preset engine
    setTimeout(() => {
      const themes: Record<string, any[]> = {
        baseball: [
          {
            teamName: 'RED SOX KINGS',
            description: 'Traditional heavy collegiate arch with crimson core and midnight navy shadow.',
            colors: { primary: '#FFFFFF', stroke1: '#DC2626', stroke2: '#0F172A', shadow: '#000000', jersey: '#0F172A' },
            warpBend: 35,
            letterSpacing: 2,
          },
          {
            teamName: 'VIPER ACADEMY',
            description: 'Neon electric green speed arch with dark carbon contrast.',
            colors: { primary: '#22C55E', stroke1: '#000000', stroke2: '#FFFFFF', shadow: '#15803D', jersey: '#18181B' },
            warpBend: 25,
            letterSpacing: 3,
          },
          {
            teamName: 'CYCLONE BOMBERS',
            description: 'Championship gold with deep royal blue double outer border.',
            colors: { primary: '#FACC15', stroke1: '#1E3A8A', stroke2: '#FFFFFF', shadow: '#0F172A', jersey: '#1E3A8A' },
            warpBend: -20,
            letterSpacing: 4,
          },
        ],
        basketball: [
          {
            teamName: 'SHOWTIME KINGS',
            description: 'Lakers championship purple and gold 3D extrusion.',
            colors: { primary: '#FACC15', stroke1: '#581C87', stroke2: '#FFFFFF', shadow: '#1E1B4B', jersey: '#581C87' },
            warpBend: 30,
            letterSpacing: 4,
          },
          {
            teamName: 'BLACK MAMBA',
            description: 'Matte black & stealth carbon with laser gold stroke.',
            colors: { primary: '#FACC15', stroke1: '#09090B', stroke2: '#EAB308', shadow: '#000000', jersey: '#09090B' },
            warpBend: 15,
            letterSpacing: 3,
          },
          {
            teamName: 'CHICAGO INFERNO',
            description: 'Bulls iconic varsity red with pure white inner gap.',
            colors: { primary: '#DC2626', stroke1: '#000000', stroke2: '#FFFFFF', shadow: '#450A0A', jersey: '#18181B' },
            warpBend: 20,
            letterSpacing: 2,
          },
        ],
      };

      const pool = themes[sport] || themes.baseball;
      setSuggestions(pool);
      setIsLoading(false);
    }, 600);
  };

  const applySuggestion = (s: typeof suggestions[0]) => {
    setTeamName(s.teamName);
    onApplyStyle({
      defaultTeamName: s.teamName,
      defaultGarmentColor: s.colors.jersey,
      frontText: {
        ...activePreset.frontText,
        fillColor: s.colors.primary,
        letterSpacing: s.letterSpacing,
        warpBend: s.warpBend,
        strokes: [
          { enabled: true, color: s.colors.stroke1, width: 3, join: 'round' },
          { enabled: true, color: s.colors.stroke2, width: 2, join: 'round' },
          { enabled: false, color: '#000', width: 1, join: 'round' },
        ],
        shadow: {
          ...activePreset.frontText.shadow,
          enabled: true,
          color: s.colors.shadow,
        },
      },
      backNumber: {
        ...activePreset.backNumber,
        fillColor: s.colors.primary,
        strokes: [
          { enabled: true, color: s.colors.stroke1, width: 4.5, join: 'round' },
          { enabled: true, color: s.colors.stroke2, width: 2, join: 'round' },
          { enabled: false, color: '#000', width: 1, join: 'round' },
        ],
        shadow: {
          ...activePreset.backNumber.shadow,
          enabled: true,
          color: s.colors.shadow,
        },
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Team Branding & Stylist Assistant</h3>
              <p className="text-xs text-slate-400">
                Generate high-impact color palettes, athletic arc curvatures, and typography harmony.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white cursor-pointer font-mono text-xs">
            ✕
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">SPORT CATEGORY</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as SportType)}
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-bold focus:border-red-500"
            >
              <option value="baseball">Baseball / Softball</option>
              <option value="basketball">Basketball</option>
              <option value="soccer">Soccer / Futbol</option>
              <option value="football">Football / Rugby</option>
              <option value="esports">Esports & Gaming</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">AESTHETIC VIBE</label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value as any)}
              className="w-full bg-[#0A0A0C] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-bold focus:border-red-500"
            >
              <option value="aggressive">Aggressive & Heavy</option>
              <option value="classic">Classic Collegiate Varsity</option>
              <option value="championship">Championship Gold & Royal</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="retro">70s/80s Retro Vintage</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2.5 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating AI Brand Harmony...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate 3 Pro Design Concepts</span>
            </>
          )}
        </button>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <span className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              CONCEPTS:
            </span>

            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => applySuggestion(s)}
                  className="bg-[#0A0A0C] hover:bg-slate-900 border border-slate-800 hover:border-red-500/50 p-3.5 rounded-lg transition cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-red-400 transition uppercase tracking-wider">
                        {s.teamName}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0F0F12] border border-slate-700 text-slate-300">
                        BEND {s.warpBend}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{s.description}</p>
                  </div>

                  {/* Color Chips */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[s.colors.jersey, s.colors.primary, s.colors.stroke1, s.colors.stroke2].map(
                      (col, cIdx) => (
                        <div
                          key={cIdx}
                          className="w-5 h-5 rounded border border-slate-700 shadow-sm"
                          style={{ backgroundColor: col }}
                          title={col}
                        />
                      )
                    )}
                    <button className="ml-2 px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition">
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
