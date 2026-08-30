import React, { useState } from 'react';
import {
  Mail,
  User,
  Send,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Shield,
  Terminal,
} from 'lucide-react';

export const FAQGuideSection: React.FC = () => {
  // Bug Report / Feature Request Form State
  const [ticketType, setTicketType] = useState<'bug' | 'feature' | 'feedback'>('bug');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [reproduceSteps, setReproduceSteps] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('Production Web App');
  const [userEmail, setUserEmail] = useState('muhammadzabiulla786@gmail.com');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();

    const recipient = 'muhammadzabiulla786@gmail.com';
    const subjectLine = `[Sovereign Finance - ${ticketType.toUpperCase()}] ${ticketSubject || 'Feedback Inquiry'}`;
    
    let bodyText = `Type: ${ticketType.toUpperCase()}\n`;
    bodyText += `Environment: ${selectedEnvironment}\n`;
    bodyText += `Sender: ${userEmail}\n\n`;
    bodyText += `Description:\n${ticketDescription || 'No description provided.'}\n\n`;
    if (ticketType === 'bug' && reproduceSteps) {
      bodyText += `Steps to Reproduce:\n${reproduceSteps}\n\n`;
    }
    bodyText += `--- \nSent from Sovereign Finance Tracker support wizard.`;

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoUrl;

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6" id="developer-support-hub">
      {/* Head Title */}
      <div className="flex flex-col space-y-1 px-1">
        <div className="flex items-center space-x-2">
          <Terminal className="text-emerald-500" size={20} />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Developer Profile & Bug/Feature Portal
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Send bug reports, request features, or submit feedback directly to the lead full-stack developer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Developer Card & Checklist */}
        <div className="lg:col-span-5 space-y-4">
          {/* Developer Card */}
          <div className="p-5 bg-gradient-to-tr from-slate-900 to-slate-850 dark:from-slate-950 dark:to-slate-900 text-white rounded-3xl space-y-4 relative overflow-hidden shadow-sm border border-slate-800">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center space-x-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl border border-emerald-500/30 overflow-hidden flex items-center justify-center bg-slate-800 shadow-sm shrink-0">
                {!imageError ? (
                  <img
                    src="/Mohammed_Zabiulla_PP_Size_March_2026.jpg"
                    alt="Muhammed Zabiulla"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      console.log("Developer portrait not found in public/ directory, falling back to styled initials.");
                      setImageError(true);
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xs tracking-wider">
                    MZ
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Lead Architect</h4>
                <p className="text-sm font-extrabold text-white mt-0.5">Muhammed Zabiulla</p>
                <p className="text-[10px] text-slate-400">Full-Stack Sovereign Architect</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
              <div className="flex items-center space-x-2">
                <Mail size={12} className="text-emerald-400" />
                <span>muhammadzabiulla786@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Email Support Wizard Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-850 space-y-4">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Support / Ticket Dispatch</span>
          
          <form onSubmit={handleSendEmail} className="space-y-3.5">
            {/* Type Select */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTicketType('bug')}
                className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  ticketType === 'bug'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                    : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle size={12} className="inline mr-1" /> Bug Report
              </button>
              <button
                type="button"
                onClick={() => setTicketType('feature')}
                className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  ticketType === 'feature'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Lightbulb size={12} className="inline mr-1" /> Feature Request
              </button>
              <button
                type="button"
                onClick={() => setTicketType('feedback')}
                className={`py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                  ticketType === 'feedback'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-500'
                    : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Send size={12} className="inline mr-1" /> General Feedback
              </button>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ticket Subject</label>
              <input
                type="text"
                required
                placeholder="e.g., Cannot save mortgage interest rate..."
                value={ticketSubject}
                onChange={e => setTicketSubject(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Environment / Platform */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Deploy Target</label>
                <select
                  value={selectedEnvironment}
                  onChange={e => setSelectedEnvironment(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="Production Web App">Production Web App</option>
                  <option value="Local Developer Build">Local Developer Build</option>
                  <option value="Firebase Hosting Container">Firebase Container</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Email</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Detailed Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe your issue or feature idea comprehensively..."
                value={ticketDescription}
                onChange={e => setTicketDescription(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Reproduce Steps (Only for bugs) */}
            {ticketType === 'bug' && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[9px] font-black text-rose-400 uppercase tracking-wider">Steps to Reproduce</label>
                <textarea
                  rows={2}
                  placeholder="1. Open Transactions tab&#10;2. Click Add Expense...&#10;3. See error code X"
                  value={reproduceSteps}
                  onChange={e => setReproduceSteps(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <Mail size={14} />
              <span>Dispatch Support Email</span>
            </button>
          </form>

          {/* Success Toast */}
          {showSuccessToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Redirecting you to your email client to dispatch the ticket!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
