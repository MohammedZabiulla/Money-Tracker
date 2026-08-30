import React, { useState, useMemo } from 'react';
import {
  Emblem3D,
  NAMED_3D_EMBLEMS,
  Emblem3DPreset,
  EmblemShape,
  EmblemFinish,
  getStoredCustomEmblems,
  saveCustomEmblem,
  deleteCustomEmblem,
} from './Emblem3DSystem';
import { Custom3DEmblem } from '../../types';
import * as LucideIcons from 'lucide-react';
import {
  X,
  Sparkles,
  Plus,
  Search,
  Check,
  Trash2,
  Copy,
  Layers,
  Palette,
  Eye,
  Sliders,
  Shield,
  Circle,
  Square,
  Gem,
  Hexagon,
  Award,
  Zap,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface Emblem3DStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmblem?: (emblemData: { name: string; icon: string; color: string; gradient?: string; shape?: string }) => void;
}

const GRADIENT_PRESETS = [
  { name: 'Imperial Gold', from: '#f59e0b', via: '#d97706', to: '#78350f', shadow: 'rgba(217,119,6,0.55)', finish: 'metallic' as EmblemFinish },
  { name: 'Emerald Surge', from: '#10b981', via: '#059669', to: '#064e3b', shadow: 'rgba(16,185,129,0.55)', finish: 'crystal' as EmblemFinish },
  { name: 'Cyber Neon', from: '#8b5cf6', via: '#ec4899', to: '#3b82f6', shadow: 'rgba(236,72,153,0.55)', finish: 'neon' as EmblemFinish },
  { name: 'Sapphire Abyss', from: '#38bdf8', via: '#0284c7', to: '#1e3a8a', shadow: 'rgba(56,189,248,0.55)', finish: 'crystal' as EmblemFinish },
  { name: 'Ruby Blaze', from: '#f43f5e', via: '#e11d48', to: '#4c0519', shadow: 'rgba(244,63,94,0.55)', finish: 'gloss' as EmblemFinish },
  { name: 'Obsidian Matte', from: '#475569', via: '#1e293b', to: '#090d16', shadow: 'rgba(30,41,59,0.6)', finish: 'metallic' as EmblemFinish },
  { name: 'Sunset Solar', from: '#fb923c', via: '#ea580c', to: '#7c2d12', shadow: 'rgba(234,88,12,0.55)', finish: 'gloss' as EmblemFinish },
  { name: 'Amethyst Velvet', from: '#a855f7', via: '#7c3aed', to: '#2e1065', shadow: 'rgba(168,85,247,0.55)', finish: 'glass' as EmblemFinish },
  { name: 'Rose Gold Luxe', from: '#fb7185', via: '#e11d48', to: '#881337', shadow: 'rgba(251,113,133,0.5)', finish: 'metallic' as EmblemFinish },
  { name: 'Arctic Diamond', from: '#06b6d4', via: '#0284c7', to: '#0c4a6e', shadow: 'rgba(6,182,212,0.5)', finish: 'crystal' as EmblemFinish },
  { name: 'Mint Fresh', from: '#34d399', via: '#059669', to: '#064e3b', shadow: 'rgba(52,211,153,0.5)', finish: 'gloss' as EmblemFinish },
  { name: 'Deep Cosmic', from: '#6366f1', via: '#4338ca', to: '#1e1b4b', shadow: 'rgba(99,102,241,0.55)', finish: 'hologram' as EmblemFinish },
  { name: 'Platinum Silver', from: '#cbd5e1', via: '#64748b', to: '#1e293b', shadow: 'rgba(100,116,139,0.5)', finish: 'metallic' as EmblemFinish },
  { name: 'Copper Bronze', from: '#d97706', via: '#b45309', to: '#451a03', shadow: 'rgba(217,119,6,0.55)', finish: 'metallic' as EmblemFinish },
  { name: 'Electric Lime', from: '#a3e635', via: '#65a30d', to: '#1a2e05', shadow: 'rgba(163,230,53,0.5)', finish: 'neon' as EmblemFinish },
];

const CURATED_ICON_LIBRARY: { category: string; icons: string[] }[] = [
  {
    category: 'Finance & Wealth',
    icons: [
      'Landmark', 'Coins', 'TrendingUp', 'PiggyBank', 'Gem', 'Crown', 'IndianRupee',
      'Wallet', 'CreditCard', 'ShieldCheck', 'Banknote', 'Scale', 'Percent', 'Vault', 'BadgePercent'
    ],
  },
  {
    category: 'Tech & Gaming',
    icons: [
      'Rocket', 'Sparkles', 'Cpu', 'Terminal', 'Cloud', 'Gamepad2', 'Zap', 'Bot',
      'Database', 'Code', 'Headphones', 'Laptop', 'Smartphone', 'Radio', 'Wifi'
    ],
  },
  {
    category: 'Lifestyle & Food',
    icons: [
      'Utensils', 'Coffee', 'ShoppingBag', 'Wine', 'Apple', 'Pizza', 'Cake',
      'ChefHat', 'Cookie', 'CupSoda', 'Fish', 'Soup', 'Store', 'Receipt', 'Gift'
    ],
  },
  {
    category: 'Travel & Vehicles',
    icons: [
      'Plane', 'Car', 'Compass', 'Mountain', 'Palmtree', 'Fuel', 'Ship', 'Train',
      'Bike', 'MapPin', 'Luggage', 'Hotel', 'Sun', 'Navigation', 'Tent'
    ],
  },
  {
    category: 'Health & Living',
    icons: [
      'HeartPulse', 'Dumbbell', 'Flower2', 'Home', 'Dog', 'Cat', 'Users',
      'Activity', 'Sparkle', 'Smile', 'Bed', 'Building', 'Shirt', 'Flame', 'Award'
    ],
  },
  {
    category: 'Media & Knowledge',
    icons: [
      'Film', 'Music', 'Tv', 'GraduationCap', 'BookOpen', 'Camera', 'Mic',
      'Palette', 'Book', 'Video', 'Newspaper', 'Lightbulb', 'Feather', 'Bookmark', 'Layers'
    ],
  },
];

export const Emblem3DStudioModal: React.FC<Emblem3DStudioModalProps> = ({
  isOpen,
  onClose,
  onSelectEmblem,
}) => {
  const [activeTab, setActiveTab] = useState<'GALLERY' | 'CREATOR' | 'MY_EMBLEMS'>('GALLERY');

  // Creator state
  const [emblemName, setEmblemName] = useState('Super Star Emblem');
  const [emblemTag, setEmblemTag] = useState('Luxury & Perks');
  const [selectedIcon, setSelectedIcon] = useState('Crown');
  const [selectedShape, setSelectedShape] = useState<EmblemShape>('squircle');
  const [selectedFinish, setSelectedFinish] = useState<EmblemFinish>('metallic');
  const [glowEnabled, setGlowEnabled] = useState(true);

  // Gradient state
  const [fromColor, setFromColor] = useState('#f59e0b');
  const [viaColor, setViaColor] = useState('#d97706');
  const [toColor, setToColor] = useState('#78350f');
  const [shadowColor, setShadowColor] = useState('rgba(217, 119, 6, 0.55)');

  // Gallery search & filter
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<string>('ALL');

  // Custom emblems state
  const [customEmblems, setCustomEmblems] = useState<Custom3DEmblem[]>(() => getStoredCustomEmblems());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Refresh stored emblems on tab or open
  const reloadCustomEmblems = () => {
    setCustomEmblems(getStoredCustomEmblems());
  };

  const handleApplyPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
    setFromColor(preset.from);
    setViaColor(preset.via);
    setToColor(preset.to);
    setShadowColor(preset.shadow);
    setSelectedFinish(preset.finish);
  };

  const handleSaveCustomEmblem = () => {
    if (!emblemName.trim()) {
      alert('Please give your 3D emblem a name');
      return;
    }

    const saved = saveCustomEmblem({
      name: emblemName.trim(),
      icon: selectedIcon,
      shape: selectedShape,
      theme: 'custom',
      fromColor,
      viaColor,
      toColor,
      shadowColor,
      accentColor: '#ffffff',
      glow: glowEnabled,
      texture: selectedFinish,
      tag: emblemTag.trim() || 'Custom Emblem',
    });

    reloadCustomEmblems();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);

    if (onSelectEmblem) {
      onSelectEmblem({
        name: saved.name,
        icon: saved.icon,
        color: saved.fromColor,
        gradient: `linear-gradient(135deg, ${saved.fromColor}, ${saved.toColor})`,
        shape: saved.shape,
      });
    }
  };

  const handleDeleteEmblem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomEmblem(id);
    reloadCustomEmblems();
  };

  const filteredPresets = useMemo(() => {
    return NAMED_3D_EMBLEMS.filter(p => {
      const matchSearch =
        !gallerySearch.trim() ||
        p.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        p.icon.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        (p.tag && p.tag.toLowerCase().includes(gallerySearch.toLowerCase()));
      const matchCat = galleryCategory === 'ALL' || p.category === galleryCategory;
      return matchSearch && matchCat;
    });
  }, [gallerySearch, galleryCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-300">
                <Sparkles size={20} />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  3D Icon Emblem Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold tracking-wide uppercase border border-amber-500/20">
                  Custom Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design, craft & collect named 3D icon emblems with rich specular lighting & gradients
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('GALLERY')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'GALLERY'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Preset Emblems Gallery ({NAMED_3D_EMBLEMS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATOR')}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'CREATOR'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>3D Emblem Creator / Builder</span>
          </button>

          <button
            onClick={() => {
              reloadCustomEmblems();
              setActiveTab('MY_EMBLEMS');
            }}
            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
              activeTab === 'MY_EMBLEMS'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Palette size={14} />
            <span>My Custom Emblems ({customEmblems.length})</span>
          </button>
        </div>

        {/* Tab 1: PRESET GALLERY */}
        {activeTab === 'GALLERY' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search named 3D emblems or icons..."
                  value={gallerySearch}
                  onChange={e => setGallerySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
                {[
                  'ALL',
                  'Wealth & Vault',
                  'Tech & Cyber',
                  'Luxury & Gems',
                  'Lifestyle & Food',
                  'Travel & Adventure',
                  'Power & Health',
                  'Home & Living',
                  'Entertainment & Art',
                ].map((cat, idx) => (
                  <button
                    key={`${cat}_${idx}`}
                    onClick={() => setGalleryCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                      galleryCategory === cat
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Named 3D Emblems */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredPresets.map((preset, idx) => (
                <div
                  key={`preset_${preset.id}_${idx}`}
                  onClick={() => {
                    if (onSelectEmblem) {
                      onSelectEmblem({
                        name: preset.name,
                        icon: preset.icon,
                        color: preset.from,
                        gradient: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                        shape: preset.shape,
                      });
                      onClose();
                    } else {
                      // Load into creator
                      setEmblemName(preset.name);
                      setEmblemTag(preset.tag || preset.category);
                      setSelectedIcon(preset.icon);
                      setSelectedShape(preset.shape || 'squircle');
                      setSelectedFinish(preset.finish || 'gloss');
                      setFromColor(preset.from);
                      setViaColor(preset.via || preset.from);
                      setToColor(preset.to);
                      setShadowColor(preset.shadow);
                      setActiveTab('CREATOR');
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 cursor-pointer group hover:shadow-md active:scale-97"
                >
                  <Emblem3D
                    icon={preset.icon}
                    from={preset.from}
                    via={preset.via}
                    to={preset.to}
                    shadow={preset.shadow}
                    shape={preset.shape}
                    finish={preset.finish}
                    size="lg"
                    interactive={true}
                  />

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {preset.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {preset.tag || preset.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 pt-1 opacity-80 group-hover:opacity-100">
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      {onSelectEmblem ? 'Select Emblem' : 'Customize 3D'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: 3D EMBLEM CREATOR / BUILDER */}
        {activeTab === 'CREATOR' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Preview & Lighting Stage (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-start space-y-4 p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-inner relative overflow-hidden">
              {/* Background Aura Glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20 blur-3xl"
                style={{ background: `radial-gradient(circle at center, ${fromColor} 0%, transparent 70%)` }}
              />

              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                <Eye size={12} className="text-amber-400" />
                <span>Live 3D Specular Stage</span>
              </span>

              {/* Master 3D Icon Presentation */}
              <div className="py-6 flex flex-col items-center justify-center">
                <Emblem3D
                  icon={selectedIcon}
                  from={fromColor}
                  via={viaColor}
                  to={toColor}
                  shadow={shadowColor}
                  shape={selectedShape}
                  finish={selectedFinish}
                  glow={glowEnabled}
                  size={84}
                  interactive={true}
                  className="animate-in zoom-in-95 duration-300"
                />

                <h4 className="font-extrabold text-base text-white mt-4 text-center">
                  {emblemName || 'Untitled Emblem'}
                </h4>
                <p className="text-xs text-amber-400 font-medium">{emblemTag || 'Custom Design'}</p>
              </div>

              {/* Scale Preview Strip */}
              <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-around">
                <div className="flex flex-col items-center space-y-1">
                  <Emblem3D
                    icon={selectedIcon}
                    from={fromColor}
                    via={viaColor}
                    to={toColor}
                    shadow={shadowColor}
                    shape={selectedShape}
                    finish={selectedFinish}
                    glow={glowEnabled}
                    size="xs"
                  />
                  <span className="text-[9px] text-slate-500 font-mono">24px</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <Emblem3D
                    icon={selectedIcon}
                    from={fromColor}
                    via={viaColor}
                    to={toColor}
                    shadow={shadowColor}
                    shape={selectedShape}
                    finish={selectedFinish}
                    glow={glowEnabled}
                    size="sm"
                  />
                  <span className="text-[9px] text-slate-500 font-mono">30px</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <Emblem3D
                    icon={selectedIcon}
                    from={fromColor}
                    via={viaColor}
                    to={toColor}
                    shadow={shadowColor}
                    shape={selectedShape}
                    finish={selectedFinish}
                    glow={glowEnabled}
                    size="md"
                  />
                  <span className="text-[9px] text-slate-500 font-mono">40px</span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <Emblem3D
                    icon={selectedIcon}
                    from={fromColor}
                    via={viaColor}
                    to={toColor}
                    shadow={shadowColor}
                    shape={selectedShape}
                    finish={selectedFinish}
                    glow={glowEnabled}
                    size="lg"
                  />
                  <span className="text-[9px] text-slate-500 font-mono">48px</span>
                </div>
              </div>

              {/* Save / Apply CTA */}
              <div className="w-full pt-2 space-y-2">
                <button
                  onClick={handleSaveCustomEmblem}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-98 transition-transform"
                >
                  <Sparkles size={14} />
                  <span>Save to My 3D Emblems</span>
                </button>

                {saveSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center space-x-1.5">
                    <CheckCircle2 size={13} />
                    <span>Emblem Saved Successfully!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Customization Controls (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Name & Tag Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Emblem Name
                  </label>
                  <input
                    type="text"
                    value={emblemName}
                    onChange={e => setEmblemName(e.target.value)}
                    placeholder="e.g. Phoenix Gold, Titan Safe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Emblem Category / Tag
                  </label>
                  <input
                    type="text"
                    value={emblemTag}
                    onChange={e => setEmblemTag(e.target.value)}
                    placeholder="e.g. Investments, VIP, Crypto"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 3D Shape Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  3D Emblem Geometric Shape
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: 'squircle', label: 'Squircle', icon: Square },
                    { id: 'circle', label: 'Circle', icon: Circle },
                    { id: 'shield', label: 'Shield', icon: Shield },
                    { id: 'diamond', label: 'Diamond', icon: Gem },
                    { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
                    { id: 'octagon', label: 'Octagon', icon: Award },
                  ].map(s => {
                    const SIcon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedShape(s.id as EmblemShape)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                          selectedShape === s.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <SIcon size={16} />
                        <span className="text-[10px]">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Material & Finish */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Surface Material & Finish
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: 'metallic', label: 'Metallic' },
                    { id: 'gloss', label: 'High Gloss' },
                    { id: 'crystal', label: 'Gem Crystal' },
                    { id: 'neon', label: 'Neon Glow' },
                    { id: 'hologram', label: 'Hologram' },
                    { id: 'glass', label: 'Frosted Glass' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFinish(f.id as EmblemFinish)}
                      className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                        selectedFinish === f.id
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Palette Preset Chips */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Gradient Shader Presets
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {GRADIENT_PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center space-x-1.5 hover:border-amber-400 transition-all text-left"
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                      />
                      <span className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-300">
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-750 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  Custom Color Shaders
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">From Color</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="color"
                        value={fromColor}
                        onChange={e => setFromColor(e.target.value)}
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={fromColor}
                        onChange={e => setFromColor(e.target.value)}
                        className="w-full text-[10px] font-mono p-1 rounded bg-white dark:bg-slate-800 border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Via Color</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="color"
                        value={viaColor}
                        onChange={e => setViaColor(e.target.value)}
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={viaColor}
                        onChange={e => setViaColor(e.target.value)}
                        className="w-full text-[10px] font-mono p-1 rounded bg-white dark:bg-slate-800 border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">To Color</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="color"
                        value={toColor}
                        onChange={e => setToColor(e.target.value)}
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={toColor}
                        onChange={e => setToColor(e.target.value)}
                        className="w-full text-[10px] font-mono p-1 rounded bg-white dark:bg-slate-800 border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon Selector from Library */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Icon Symbol
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {CURATED_ICON_LIBRARY.map((cat, cIdx) => (
                    <div key={`${cat.category}_${cIdx}`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {cat.category}
                      </span>
                      <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                        {cat.icons.map((ic, idx) => {
                          const IconComponent = (LucideIcons as any)[ic] || LucideIcons.Sparkles;
                          return (
                            <button
                              key={`${ic}_${idx}`}
                              type="button"
                              onClick={() => setSelectedIcon(ic)}
                              className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                                selectedIcon === ic
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm scale-105'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={ic}
                            >
                              <IconComponent size={16} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MY CUSTOM EMBLEMS */}
        {activeTab === 'MY_EMBLEMS' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  My Designed 3D Emblems ({customEmblems.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Custom emblems created by you, available anywhere across the app
                </p>
              </div>
              <button
                onClick={() => setActiveTab('CREATOR')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-sm flex items-center space-x-1"
              >
                <Plus size={13} />
                <span>Create New</span>
              </button>
            </div>

            {customEmblems.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-850 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <Sparkles size={36} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No custom 3D emblems designed yet
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Use the 3D Emblem Creator tab to design your first custom emblem!
                </p>
                <button
                  onClick={() => setActiveTab('CREATOR')}
                  className="px-4 py-2 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-md"
                >
                  Open 3D Creator
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {customEmblems.map(emblem => (
                  <div
                    key={emblem.id}
                    onClick={() => {
                      if (onSelectEmblem) {
                        onSelectEmblem({
                          name: emblem.name,
                          icon: emblem.icon,
                          color: emblem.fromColor,
                          gradient: `linear-gradient(135deg, ${emblem.fromColor}, ${emblem.toColor})`,
                          shape: emblem.shape,
                        });
                        onClose();
                      } else {
                        setEmblemName(emblem.name);
                        setEmblemTag(emblem.tag || 'Custom Emblem');
                        setSelectedIcon(emblem.icon);
                        setSelectedShape(emblem.shape);
                        setSelectedFinish((emblem.texture as EmblemFinish) || 'gloss');
                        setFromColor(emblem.fromColor);
                        setViaColor(emblem.viaColor || emblem.fromColor);
                        setToColor(emblem.toColor);
                        setShadowColor(emblem.shadowColor);
                        setActiveTab('CREATOR');
                      }
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-500 transition-all flex flex-col items-center text-center space-y-2 cursor-pointer group relative"
                  >
                    {/* Delete button */}
                    <button
                      onClick={e => handleDeleteEmblem(emblem.id, e)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Emblem"
                    >
                      <Trash2 size={12} />
                    </button>

                    <Emblem3D
                      icon={emblem.icon}
                      from={emblem.fromColor}
                      via={emblem.viaColor}
                      to={emblem.toColor}
                      shadow={emblem.shadowColor}
                      shape={emblem.shape}
                      finish={(emblem.texture as EmblemFinish) || 'gloss'}
                      size="lg"
                      interactive={true}
                    />

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {emblem.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {emblem.tag || 'Custom'}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {onSelectEmblem ? 'Select Emblem' : 'Edit Emblem'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
