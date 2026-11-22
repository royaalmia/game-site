import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { HelpCircle, AlertCircle, CheckCircle2, Send, History, X } from 'lucide-react';

export default function DisputesModal({ isOpen, onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'my'
  const [subject, setSubject] = useState('');
  const [matchId, setMatchId] = useState('');
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchMyComplaints = async () => {
    try {
      const res = await apiFetch('/api/complaints/my');
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMsg('');
      setError('');
      fetchMyComplaints();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      await apiFetch('/api/complaints/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId,
          subject,
          description,
          proofUrl
        })
      });
      setMsg('Dispute ticket submitted! An administrator will review and resolve it promptly.');
      setSubject('');
      setMatchId('');
      setDescription('');
      setProofUrl('');
      fetchMyComplaints();
      setActiveTab('my');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Dispute & Complaint Center</h2>
              <span className="text-xs text-slate-400">Report fair play issues, match disputes or deposit inquiries</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-bold gap-1">
          <button
            onClick={() => { setActiveTab('new'); setError(''); setMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'new' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" /> Open New Ticket
          </button>
          <button
            onClick={() => { setActiveTab('my'); setError(''); setMsg(''); }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'my' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" /> My Tickets ({complaints.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {msg && (
            <div className="mb-3 p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
            </div>
          )}
          {error && (
            <div className="mb-3 p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Subject / Issue Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opponent freeze, Disconnect dispute, Deposit issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Match ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter Match ID from your Match History if applicable"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Description (বিস্তারিত বিবরণ)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain exactly what happened so our moderation team can inspect match logs and resolve it."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Screenshot / Proof Link (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://imgur.com/your-screenshot"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg glow-gold transition mt-2"
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  You have not submitted any dispute tickets yet.
                </div>
              ) : (
                complaints.map(c => (
                  <div key={c.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-xs">{c.subject}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(c.createdAt).toLocaleString()} {c.matchId ? `• Match #${c.matchId.slice(0, 6)}` : ''}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        c.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px] bg-slate-900/60 p-2 rounded-xl">
                      {c.description}
                    </p>

                    {c.adminReply && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
                        <strong className="text-[10px] text-purple-400 block uppercase font-bold">Admin Resolution:</strong>
                        <span className="text-[11px]">{c.adminReply}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
