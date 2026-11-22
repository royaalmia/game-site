import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { apiFetch } from '../utils/api';
import { sound } from '../utils/sound';
import { 
  X, Wallet, ArrowDownRight, ArrowUpRight, History, 
  CreditCard, CheckCircle2, AlertTriangle, Copy, Check, Sparkles, ShieldCheck 
} from 'lucide-react';

export default function WalletModal({ 
  isOpen, 
  onClose, 
  user, 
  onBalanceUpdate,
  initialTab = 'deposit',
  defaultAmount = ''
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'deposit');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Deposit Form
  const [depositMethod, setDepositMethod] = useState('bKash');
  const [depositAmount, setDepositAmount] = useState('100');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [lastDepositedAmount, setLastDepositedAmount] = useState(0);

  // Withdraw Form
  const [withdrawMethod, setWithdrawMethod] = useState('bKash');
  const [withdrawAmount, setWithdrawAmount] = useState('100');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [error, setError] = useState('');

  const PAYMENT_DETAILS = {
    bKash: {
      number: '01711-000000',
      type: 'Personal (Send Money)',
      color: 'from-[#d8195a] to-[#e2136e]',
      borderColor: 'border-[#e2136e]/40',
      tagColor: 'bg-[#e2136e]/20 text-rose-300'
    },
    Nagad: {
      number: '01811-000000',
      type: 'Personal (Send Money)',
      color: 'from-[#e65c00] to-[#f7941d]',
      borderColor: 'border-[#f7941d]/40',
      tagColor: 'bg-[#f7941d]/20 text-amber-300'
    },
    Rocket: {
      number: '01911-000000',
      type: 'Personal (Send Money)',
      color: 'from-[#6c1d7e] to-[#8c3494]',
      borderColor: 'border-[#8c3494]/40',
      tagColor: 'bg-[#8c3494]/20 text-purple-300'
    }
  };

  const fetchWalletSummary = async () => {
    try {
      const data = await apiFetch('/api/wallet/summary');
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (defaultAmount) setDepositAmount(String(defaultAmount));
      setError('');
      setDepositSuccess(false);
      setWithdrawSuccess(false);
      fetchWalletSummary();
    }
  }, [isOpen, initialTab, defaultAmount]);

  if (!isOpen) return null;

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const amt = parseFloat(depositAmount);
    try {
      const res = await apiFetch('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({
          method: depositMethod,
          senderNumber,
          amount: amt,
          transactionId: trxId
        })
      });

      setLastDepositedAmount(amt);
      setDepositSuccess(true);
      setSenderNumber('');
      setTrxId('');
      sound.playWin();
      confetti({ particleCount: 70, spread: 60 });
      fetchWalletSummary();
      if (onBalanceUpdate) onBalanceUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const amt = parseFloat(withdrawAmount);
    try {
      await apiFetch('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          method: withdrawMethod,
          accountNo: withdrawAccount,
          amount: amt
        })
      });
      setWithdrawSuccess(true);
      setWithdrawAccount('');
      sound.playWin();
      fetchWalletSummary();
      if (onBalanceUpdate) onBalanceUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/[^0-9]/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const currentBal = summary?.balance ?? user?.balance ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                অ্যাকাউন্ট ক্যাশিয়ার <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold">ইনস্ট্যান্ট</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>বর্তমান ব্যালেন্স:</span>
                <strong className="text-emerald-400 font-black font-mono text-sm">
                  {currentBal.toFixed(2)} ৳
                </strong>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/80 border-b border-slate-800 text-xs font-bold gap-1.5">
          <button
            onClick={() => { setActiveTab('deposit'); setError(''); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'deposit' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white bg-slate-900/40'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> রিচার্জ (Deposit)
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setError(''); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'withdraw' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white bg-slate-900/40'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> উত্তোলন (Withdraw)
          </button>
          <button
            onClick={() => { setActiveTab('history'); setError(''); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-slate-800 text-white font-black' 
                : 'text-slate-400 hover:text-white bg-slate-900/40'
            }`}
          >
            <History className="w-4 h-4" /> হিস্টোরি
          </button>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. DEPOSIT TAB */}
          {activeTab === 'deposit' && (
            <div>
              {depositSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-white">রিচার্জ সফল হয়েছে!</h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    আপনার অ্যাকাউন্টে <strong className="text-emerald-400 font-bold">{lastDepositedAmount} ৳</strong> সফলভাবে যুক্ত হয়েছে। এখন আপনি যেকোনো ম্যাচে অংশ নিতে পারেন!
                  </p>
                  <div className="pt-2 flex gap-2 justify-center">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl shadow-lg transition"
                    >
                      এখনই গেম খেলুন
                    </button>
                    <button
                      onClick={() => setDepositSuccess(false)}
                      className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:text-white transition"
                    >
                      আরও রিচার্জ করুন
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  {/* Payment Method Selector */}
                  <div>
                    <label className="font-bold text-slate-300 block mb-1.5">
                      ১. পেমেন্ট মেথড বেছে নিন:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['bKash', 'Nagad', 'Rocket'].map(m => {
                        const isSel = depositMethod === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setDepositMethod(m)}
                            className={`py-2 px-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSel 
                                ? `border-amber-400 bg-amber-500/15 text-white ring-2 ring-amber-400/30` 
                                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              m === 'bKash' ? 'bg-[#d8195a]/20 text-rose-300' :
                              m === 'Nagad' ? 'bg-[#e65c00]/20 text-amber-300' : 'bg-[#6c1d7e]/20 text-purple-300'
                            }`}>
                              {m}
                            </span>
                            <span>{m === 'bKash' ? 'বিকাশ' : m === 'Nagad' ? 'নগদ' : 'রকেট'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Send Money Guide & Copy Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        নিচের নম্বরে <strong className="text-white">Send Money</strong> করুন:
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PAYMENT_DETAILS[depositMethod].tagColor}`}>
                        {PAYMENT_DETAILS[depositMethod].type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono font-black text-amber-400 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-sm tracking-wide">{PAYMENT_DETAILS[depositMethod].number}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PAYMENT_DETAILS[depositMethod].number)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedNumber ? 'কপি হয়েছে' : 'কপি করুন'}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      টাকা পাঠানোর পর বিকাশ/নগদ অ্যাপ থেকে প্রেরক নম্বর এবং TrxID নিচে লিখুন।
                    </p>
                  </div>

                  {/* Preset Amount Chips */}
                  <div>
                    <label className="font-bold text-slate-300 block mb-1.5">
                      ২. রিচার্জের পরিমাণ (টাকা):
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-2">
                      {['50', '100', '200', '500', '1000', '2000'].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                            depositAmount === amt 
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-black' 
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {amt} ৳
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      required
                      min="20"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="অন্য পরিমাণ লিখুন (যেমন: ১৫০)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Sender Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-400 block mb-1">প্রেরক মোবাইল নম্বর:</label>
                      <input
                        type="text"
                        required
                        placeholder="01XXXXXXXXX"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-400 block mb-1">Transaction ID (TrxID):</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: BL9A7K8"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    {loading ? 'যাচাই করা হচ্ছে...' : `রিচার্জ সম্পন্ন করুন (${depositAmount || 0} ৳)`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. WITHDRAW TAB */}
          {activeTab === 'withdraw' && (
            <div>
              {withdrawSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-white">উত্তোলন রিকোয়েস্ট গৃহীত হয়েছে!</h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    আপনার <strong className="text-white">{withdrawAmount} ৳</strong> উত্তোলনের আবেদন সফলভাবে জমা হয়েছে। আগামী ৫-১৫ মিনিটের মধ্যে আপনার অ্যাকাউন্টে টাকা পাঠিয়ে দেওয়া হবে।
                  </p>
                  <button
                    onClick={() => setWithdrawSuccess(false)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition"
                  >
                    আরেকটি রিকোয়েস্ট করুন
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {/* Balance Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-amber-300 block">উত্তোলনযোগ্য ব্যালেন্স:</span>
                      <span className="text-base font-black text-white font-mono">{currentBal.toFixed(2)} ৳</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">মিনিমাম ৫০ ৳</span>
                  </div>

                  {/* Method Selector */}
                  <div>
                    <label className="font-bold text-slate-300 block mb-1.5">১. গ্রহণের মেথড:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['bKash', 'Nagad', 'Rocket'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setWithdrawMethod(m)}
                          className={`py-2 px-3 rounded-2xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            withdrawMethod === m 
                              ? 'border-amber-400 bg-amber-500/15 text-white ring-2 ring-amber-400/30' 
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            m === 'bKash' ? 'bg-[#d8195a]/20 text-rose-300' :
                            m === 'Nagad' ? 'bg-[#e65c00]/20 text-amber-300' : 'bg-[#6c1d7e]/20 text-purple-300'
                          }`}>
                            {m}
                          </span>
                          <span>{m === 'bKash' ? 'বিকাশ' : m === 'Nagad' ? 'নগদ' : 'রকেট'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="font-semibold text-slate-400 block mb-1">
                      ২. আপনার {withdrawMethod} পার্সোনাল নম্বর:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="01XXXXXXXXX"
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-300">৩. উত্তোলনের পরিমাণ (টাকা):</label>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(Math.floor(currentBal)))}
                        className="text-[10px] font-bold text-amber-400 hover:underline"
                      >
                        সব ব্যালেন্স ({Math.floor(currentBal)} ৳)
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {['50', '100', '200', '500'].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setWithdrawAmount(amt)}
                          className={`py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer ${
                            withdrawAmount === amt 
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-black' 
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {amt} ৳
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      required
                      min="50"
                      max={currentBal}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="পরিমাণ লিখুন (যেমন: ২০০)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> ০% উইথড্র ফি
                    </p>
                    <p>ম্যাচ জয়ের সময়ই ৫% প্ল্যাটফর্ম ফি স্বয়ংক্রিয়ভাবে কাটা হয়েছে। উত্তোলনে কোনো চার্জ নেই।</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || currentBal < 50}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl glow-gold transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {loading ? 'প্রসেসিং হচ্ছে...' : `উত্তোলন রিকোয়েস্ট পাঠান (${withdrawAmount || 0} ৳)`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 mb-2">সাম্প্রতিক লেনদেন হিস্টোরি:</h4>
              {(!summary?.recentTransactions || summary.recentTransactions.length === 0) ? (
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center text-slate-400">
                  এখনো কোনো লেনদেন সম্পন্ন হয়নি।
                </div>
              ) : (
                summary.recentTransactions.map(tx => (
                  <div 
                    key={tx.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white block capitalize text-xs">
                        {tx.type === 'deposit' ? 'টাকা রিচার্জ (Deposit)' :
                         tx.type === 'withdraw' ? 'টাকা উত্তোলন (Withdraw)' :
                         tx.type === 'match_win' ? 'ম্যাচ জয় (Win)' :
                         tx.type === 'match_entry' ? 'ম্যাচ ফি (Entry)' :
                         tx.type === 'daily_bonus' ? 'দৈনিক বোনাস' : tx.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()} • {tx.note || tx.paymentMethod || 'Wallet'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-black text-xs block ${
                        tx.amount > 0 && ['deposit', 'match_win', 'daily_bonus', 'refund'].includes(tx.type)
                          ? 'text-emerald-400' 
                          : 'text-rose-400'
                      }`}>
                        {['deposit', 'match_win', 'daily_bonus', 'refund'].includes(tx.type) ? '+' : '-'}
                        {Math.abs(tx.amount).toFixed(2)} ৳
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        tx.status === 'completed' || tx.status === 'approved' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : tx.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
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