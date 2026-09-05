import React from 'react';
import { Check } from 'lucide-react';

export interface ThemeColorOption {
  id: string;
  label: string;
  value: string;
  bg: string;
  ring: string;
  gradient: string;
  category: 'Emerald' | 'Blue' | 'Purple' | 'Warm' | 'Vibrant' | 'Neutral';
}

export const EXPANDED_COLOR_PALETTE: ThemeColorOption[] = [
  // Greens & Teals
  { id: 'emerald', label: 'Emerald Green', value: '#10B981', bg: 'bg-emerald-500', ring: 'ring-emerald-500', gradient: 'from-emerald-500 to-teal-700', category: 'Emerald' },
  { id: 'forest', label: 'Forest Jade', value: '#059669', bg: 'bg-emerald-600', ring: 'ring-emerald-600', gradient: 'from-emerald-600 to-green-900', category: 'Emerald' },
  { id: 'mint', label: 'Mint Breeze', value: '#14B8A6', bg: 'bg-teal-500', ring: 'ring-teal-500', gradient: 'from-teal-400 to-emerald-700', category: 'Emerald' },
  { id: 'cyan', label: 'Cyan Teal', value: '#06B6D4', bg: 'bg-cyan-500', ring: 'ring-cyan-500', gradient: 'from-cyan-500 to-teal-800', category: 'Emerald' },

  // Blues & Sky
  { id: 'royal_blue', label: 'Royal Blue', value: '#3B82F6', bg: 'bg-blue-500', ring: 'ring-blue-500', gradient: 'from-blue-500 to-indigo-700', category: 'Blue' },
  { id: 'sky', label: 'Sky Azure', value: '#0284C7', bg: 'bg-sky-600', ring: 'ring-sky-600', gradient: 'from-sky-500 to-blue-800', category: 'Blue' },
  { id: 'deep_ocean', label: 'Ocean Navy', value: '#1D4ED8', bg: 'bg-blue-700', ring: 'ring-blue-700', gradient: 'from-blue-700 to-slate-900', category: 'Blue' },
  { id: 'indigo', label: 'Electric Indigo', value: '#6366F1', bg: 'bg-indigo-500', ring: 'ring-indigo-500', gradient: 'from-indigo-500 to-purple-800', category: 'Blue' },

  // Purples & Violets
  { id: 'violet', label: 'Violet Purple', value: '#8B5CF6', bg: 'bg-purple-500', ring: 'ring-purple-500', gradient: 'from-purple-500 to-indigo-800', category: 'Purple' },
  { id: 'amethyst', label: 'Royal Amethyst', value: '#7C3AED', bg: 'bg-violet-600', ring: 'ring-violet-600', gradient: 'from-violet-600 to-purple-950', category: 'Purple' },
  { id: 'fuchsia', label: 'Neon Fuchsia', value: '#D946EF', bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-500', gradient: 'from-fuchsia-500 to-pink-800', category: 'Purple' },
  { id: 'berry', label: 'Plum Berry', value: '#A21CAF', bg: 'bg-fuchsia-700', ring: 'ring-fuchsia-700', gradient: 'from-fuchsia-700 to-rose-950', category: 'Purple' },

  // Pinks & Reds
  { id: 'rose', label: 'Rose Pink', value: '#EC4899', bg: 'bg-pink-500', ring: 'ring-pink-500', gradient: 'from-pink-500 to-rose-700', category: 'Vibrant' },
  { id: 'crimson', label: 'Ruby Crimson', value: '#EF4444', bg: 'bg-red-500', ring: 'ring-red-500', gradient: 'from-red-500 to-rose-800', category: 'Vibrant' },
  { id: 'coral', label: 'Coral Blossom', value: '#F43F5E', bg: 'bg-rose-500', ring: 'ring-rose-500', gradient: 'from-rose-500 to-orange-600', category: 'Vibrant' },
  { id: 'blood_orange', label: 'Sunset Tangerine', value: '#F97316', bg: 'bg-orange-500', ring: 'ring-orange-500', gradient: 'from-orange-500 to-red-700', category: 'Vibrant' },

  // Ambers & Golds
  { id: 'amber', label: 'Amber Orange', value: '#F59E0B', bg: 'bg-amber-500', ring: 'ring-amber-500', gradient: 'from-amber-500 to-orange-700', category: 'Warm' },
  { id: 'golden', label: 'Golden Honey', value: '#EAB308', bg: 'bg-yellow-500', ring: 'ring-yellow-500', gradient: 'from-yellow-500 to-amber-700', category: 'Warm' },
  { id: 'warm_bronze', label: 'Warm Bronze', value: '#B45309', bg: 'bg-amber-700', ring: 'ring-amber-700', gradient: 'from-amber-700 to-yellow-950', category: 'Warm' },
  { id: 'espresso', label: 'Espresso Mocha', value: '#78350F', bg: 'bg-amber-900', ring: 'ring-amber-900', gradient: 'from-amber-900 to-stone-950', category: 'Warm' },

  // Neutrals & Modern Dark
  { id: 'slate', label: 'Midnight Slate', value: '#475569', bg: 'bg-slate-600', ring: 'ring-slate-600', gradient: 'from-slate-600 to-slate-900', category: 'Neutral' },
  { id: 'charcoal', label: 'Carbon Charcoal', value: '#334155', bg: 'bg-slate-700', ring: 'ring-slate-700', gradient: 'from-slate-700 to-black', category: 'Neutral' },
  { id: 'obsidian', label: 'Black Obsidian', value: '#0F172A', bg: 'bg-slate-900', ring: 'ring-slate-900', gradient: 'from-slate-900 to-black', category: 'Neutral' },
];

/**
 * Generates an accessible, rich, high-contrast dynamic CSS card styling based on hex color
 */
export function getThemedCardStyle(color?: string, fallback = '#3B82F6'): React.CSSProperties {
  const hex = (color && color.startsWith('#')) ? color : fallback;
  return {
    background: `linear-gradient(135deg, ${hex} 0%, ${hex}cc 55%, #0a0f1d 100%)`,
    borderColor: `${hex}80`,
    boxShadow: `0 8px 24px -4px ${hex}35`,
  };
}

/**
 * Generates subtle tinted badge / border style for list items
 */
export function getThemedAccentStyle(color?: string, fallback = '#3B82F6') {
  const hex = (color && color.startsWith('#')) ? color : fallback;
  return {
    borderLeftColor: hex,
    backgroundColor: `${hex}15`,
    color: hex,
  };
}

interface ThemeColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  allowCustom?: boolean;
}

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  value = '#10B981',
  onChange,
  label = 'Color Accent & Theme',
  className = '',
  allowCustom = true,
}) => {
  const selectedHex = (value || '#10B981').toUpperCase();
  const matchedPreset = EXPANDED_COLOR_PALETTE.find(
    p => p.value.toUpperCase() === selectedHex
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: value }}
            />
            <span>{matchedPreset ? matchedPreset.label : value}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750">
        {EXPANDED_COLOR_PALETTE.map(c => {
          const isSelected = selectedHex === c.value.toUpperCase();
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.value)}
              title={c.label}
              className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-900 shadow-md z-10'
                  : 'hover:scale-110 opacity-90 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.value }}
            >
              {isSelected && <Check size={12} className="text-white drop-shadow-sm stroke-[3]" />}
            </button>
          );
        })}

        {allowCustom && (
          <label
            title="Custom Hex Color"
            className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full border-2 border-dashed border-slate-400 dark:border-slate-500 hover:border-slate-600 dark:hover:border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden relative"
          >
            <input
              type="color"
              value={value || '#10B981'}
              onChange={e => onChange(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">+</span>
          </label>
        )}
      </div>
    </div>
  );
};
