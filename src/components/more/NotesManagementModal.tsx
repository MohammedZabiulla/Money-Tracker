import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Copy,
  Check,
  ShoppingCart,
  Hash,
  Sparkles,
  Lightbulb,
  X,
  Tag,
  Save,
} from 'lucide-react';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: 'Grocery' | 'Numbers' | 'Mindful' | 'General' | 'Ideas';
  isPinned: boolean;
  updatedAt: string;
}

interface NotesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'money_tracker_saved_notes_v1';

export const NotesManagementModal: React.FC<NotesManagementModalProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    }
    // Default initial notes if empty
    return [
      {
        id: '1',
        title: 'Weekly Grocery List',
        content: '- Organic Milk\n- Whole Wheat Bread\n- Fresh Avocados\n- Free-range Eggs\n- Greek Yogurt\n- Almonds & Walnuts',
        category: 'Grocery',
        isPinned: true,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Important Account & Card Numbers',
        content: 'Savings IBAN: PK35SCBL0000001234567801\nUtility Ref: 88471920381\nInsurance Policy: POL-99281-X',
        category: 'Numbers',
        isPinned: true,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Mindful Intention for Today',
        content: '"Be grateful for what you have while working wisely towards what you want. Stay calm, breathe deeply, and prioritize peace over perfection."',
        category: 'Mindful',
        isPinned: false,
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<Note['category']>('General');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  }, [notes]);

  if (!isOpen) return null;

  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: 'All Notes', icon: FileText },
    { id: 'Grocery', label: 'Groceries', icon: ShoppingCart },
    { id: 'Numbers', label: 'Numbers & IDs', icon: Hash },
    { id: 'Mindful', label: 'Mindful Thoughts', icon: Sparkles },
    { id: 'Ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'General', label: 'General', icon: Tag },
  ];

  const handleOpenCreate = (defaultCategory: Note['category'] = 'General') => {
    setCurrentNoteId(null);
    setTitleInput('');
    setContentInput('');
    setCategoryInput(defaultCategory);
    setIsEditing(true);
  };

  const handleOpenEdit = (note: Note) => {
    setCurrentNoteId(note.id);
    setTitleInput(note.title);
    setContentInput(note.content);
    setCategoryInput(note.category);
    setIsEditing(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() && !contentInput.trim()) return;

    const now = new Date().toISOString();

    if (currentNoteId) {
      setNotes(prev =>
        prev.map(n =>
          n.id === currentNoteId
            ? { ...n, title: titleInput || 'Untitled Note', content: contentInput, category: categoryInput, updatedAt: now }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: titleInput || 'Untitled Note',
        content: contentInput,
        category: categoryInput,
        isPinned: false,
        updatedAt: now,
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsEditing(false);
    setTitleInput('');
    setContentInput('');
  };

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredNotes = notes.filter(note => {
    const matchesCat = selectedCategory === 'all' || note.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  // Sort: Pinned first, then by updatedAt descending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Mindful Notes & Quick Lists
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Save numbers, grocery lists, and mindful thoughts securely for anytime use
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search notes, numbers, or groceries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs text-slate-900 dark:text-white border border-transparent focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {/* New Note Button */}
            <button
              type="button"
              onClick={() => handleOpenCreate('General')}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center space-x-2 shadow-sm cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Plus size={16} />
              <span>New Note</span>
            </button>
          </div>

          {/* Categories Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Edit / Create Note Inline Modal or Form */}
          {isEditing && (
            <form onSubmit={handleSaveNote} className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {currentNoteId ? 'Edit Note' : 'Create New Note'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Note Title (e.g. Grocery List, Passwords, Ideas)"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-emerald-500 outline-none font-bold"
                  autoFocus
                />

                <select
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value as Note['category'])}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-emerald-500 outline-none font-bold cursor-pointer"
                >
                  <option value="General">General Tag</option>
                  <option value="Grocery">🛒 Groceries</option>
                  <option value="Numbers">🔢 Numbers & IDs</option>
                  <option value="Mindful">🧘 Mindful Thought</option>
                  <option value="Ideas">💡 Idea</option>
                </select>
              </div>

              <textarea
                rows={4}
                placeholder="Write your note, grocery items, numbers, or mindful thoughts here..."
                value={contentInput}
                onChange={e => setContentInput(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:border-emerald-500 outline-none resize-y"
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Save size={14} />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Action Presets */}
          {!isEditing && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTitleInput('New Grocery List');
                  setContentInput('- Milk\n- Bread\n- Eggs\n- Fruits');
                  setCategoryInput('Grocery');
                  setIsEditing(true);
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center space-x-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Grocery List</p>
                  <p className="text-[10px] text-slate-400">Quick preset</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitleInput('Important Numbers');
                  setContentInput('Account No: \nPIN Code: \nRef Number: ');
                  setCategoryInput('Numbers');
                  setIsEditing(true);
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center space-x-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Hash size={16} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Quick Numbers</p>
                  <p className="text-[10px] text-slate-400">Save digits</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitleInput('Mindful Thought');
                  setContentInput('Today I am grateful for...');
                  setCategoryInput('Mindful');
                  setIsEditing(true);
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center space-x-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Mindful Note</p>
                  <p className="text-[10px] text-slate-400">Inner reflection</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitleInput('Quick Idea');
                  setContentInput('Idea: ');
                  setCategoryInput('Ideas');
                  setIsEditing(true);
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center space-x-2.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">New Idea</p>
                  <p className="text-[10px] text-slate-400">Brainstorm</p>
                </div>
              </button>
            </div>
          )}

          {/* Notes Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Saved Notes ({sortedNotes.length})
              </span>
            </div>

            {sortedNotes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No notes found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Create your first grocery list or mindful thought above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sortedNotes.map(note => (
                  <div
                    key={note.id}
                    className={`p-4 bg-white dark:bg-slate-900 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-xs relative group ${
                      note.isPinned
                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              note.category === 'Grocery'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : note.category === 'Numbers'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                : note.category === 'Mindful'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : note.category === 'Ideas'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {note.category}
                          </span>
                          {note.isPinned && (
                            <span className="flex items-center space-x-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                              <Pin size={10} className="fill-current" />
                              <span>Pinned</span>
                            </span>
                          )}
                        </div>

                        {/* Top Right Action Buttons */}
                        <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(note.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              note.isPinned
                                ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={note.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin size={13} className={note.isPinned ? 'fill-current' : ''} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(note.id, `${note.title}\n\n${note.content}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Copy note text"
                          >
                            {copiedId === note.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(note)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit note"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{note.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-normal bg-slate-50/70 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        {note.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                      <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                      {copiedId === note.id && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                          <Check size={11} />
                          <span>Copied to clipboard!</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
