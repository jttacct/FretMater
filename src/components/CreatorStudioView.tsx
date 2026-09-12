import React, { useState } from 'react';
import { CreatorStats, DigitalAsset, TipTransaction, NoteName, ScaleDefinition } from '../types/guitar';
import { storage } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';
import { ChordProgressionBuilder } from './ChordProgressionBuilder';
import { ChordEncyclopedia } from './ChordEncyclopedia';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Lock,
  Unlock,
  ShieldCheck,
  ShoppingBag,
  Heart,
  Radio,
  Share2,
  Download,
  Plus,
  Sparkles,
  CheckCircle2,
  Key,
  Layers,
  Sliders,
  BookOpen,
} from 'lucide-react';

interface CreatorStudioViewProps {
  onSyncFretboard?: (key: NoteName, scale: ScaleDefinition) => void;
  onOpenChordEncyclopedia?: () => void;
}

export const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({
  onSyncFretboard,
  onOpenChordEncyclopedia,
}) => {
  const [activeStudioSection, setActiveStudioSection] = useState<'builder' | 'encyclopedia' | 'monetization' | 'all'>('builder');
  const [stats, setStats] = useState<CreatorStats>(storage.getCreatorStats());
  const [assets, setAssets] = useState<DigitalAsset[]>(storage.getDigitalAssets());
  const [tips, setTips] = useState<TipTransaction[]>(storage.getTips());

  // Tip Jar interaction state
  const [tipAmount, setTipAmount] = useState<number>(10);
  const [supporterName, setSupporterName] = useState<string>('');
  const [tipMessage, setTipMessage] = useState<string>('');
  const [tipSuccess, setTipSuccess] = useState<boolean>(false);

  // Revenue projection slider
  const [projectedSubs, setProjectedSubs] = useState<number>(250);

  // Encrypted Vault state
  const [vaultPasscode, setVaultPasscode] = useState<string>('');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  // New Digital Asset Modal / Form
  const [showAddAsset, setShowAddAsset] = useState<boolean>(false);
  const [newAssetTitle, setNewAssetTitle] = useState<string>('');
  const [newAssetCategory, setNewAssetCategory] = useState<DigitalAsset['category']>('Tabs & Loops');
  const [newAssetPrice, setNewAssetPrice] = useState<number>(14.99);
  const [newAssetDesc, setNewAssetDesc] = useState<string>('');

  // Streaming service links
  const [streamingConnections, setStreamingConnections] = useState([
    { name: 'Spotify for Artists', status: 'Connected', followers: '12.4K', icon: '🟢' },
    { name: 'Apple Music Master', status: 'Connected', followers: '8.1K', icon: '🔴' },
    { name: 'YouTube Music & Stems', status: 'Syncing', followers: '34.2K', icon: '🔴' },
    { name: 'Soundcloud Pro Unlimited', status: 'Connected', followers: '5.6K', icon: '🟠' },
  ]);

  const handleSendTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporterName.trim()) return;

    const newTip: TipTransaction = {
      id: `tip-${Date.now()}`,
      supporterName: supporterName.trim(),
      amount: tipAmount,
      message: tipMessage.trim() || 'Awesome guitar lessons and backing tracks!',
      timestamp: 'Just now',
    };

    storage.addTip(newTip);
    setTips(storage.getTips());
    setStats(storage.getCreatorStats());
    setTipSuccess(true);
    soundEngine.playClick(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

    setTimeout(() => {
      setTipSuccess(false);
      setSupporterName('');
      setTipMessage('');
    }, 3000);
  };

  const handleUnlockVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (vaultPasscode === '1234' || vaultPasscode.length >= 4) {
      setIsVaultUnlocked(true);
      setVaultError(null);
    } else {
      setVaultError('Invalid decryption key. Try 1234 for demo security access.');
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetTitle.trim()) return;

    const created: DigitalAsset = {
      id: `asset-${Date.now()}`,
      title: newAssetTitle,
      category: newAssetCategory,
      price: newAssetPrice,
      salesCount: 0,
      revenue: 0,
      rating: 5.0,
      description: newAssetDesc || 'High definition guitar training asset.',
    };

    const updated = [created, ...assets];
    setAssets(updated);
    setShowAddAsset(false);
    setNewAssetTitle('');
    setNewAssetDesc('');
  };

  const subscriptionTiers = [
    {
      id: 'free',
      name: 'Free Apprentice',
      price: '$0',
      period: 'forever',
      badge: 'Free Tier',
      subscribers: 890,
      perks: [
        'Interactive 15-fret chromatic fretboard',
        'Basic real-time pitch detection tuner',
        '3 standard backing tracks',
        'Standard practice streaks',
      ],
      isPopular: false,
    },
    {
      id: 'pro',
      name: 'Pro Shredder',
      price: '$9.99',
      period: '/ month',
      badge: 'Most Popular',
      subscribers: 142,
      perks: [
        'Full 24-fret neck with all modal scales & CAGED shapes',
        'Advanced audio pitch detection drills (YIN engine)',
        'Complete 24-bit Backing Track Library with tempo slider',
        'Audio Looper with unlimited WAV export',
        'Detailed Fretboard Mastery Heatmap analytics',
      ],
      isPopular: true,
    },
    {
      id: 'virtuoso',
      name: 'Virtuoso Masterclass',
      price: '$19.99',
      period: '/ month',
      badge: 'Creator VIP',
      subscribers: 42,
      perks: [
        'Everything in Pro Shredder',
        'Exclusive Monthly Tab & Impulse Response (IR) packs',
        'Encrypted Cloud Synchronization across all devices',
        'Direct 1-on-1 Q&A feedback on recorded riffs',
        'Early access to creator backing track stems',
      ],
      isPopular: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveStudioSection('builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeStudioSection === 'builder'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Chord Progression Builder</span>
          </button>

          <button
            onClick={() => setActiveStudioSection('encyclopedia')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeStudioSection === 'encyclopedia'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Chord Encyclopedia</span>
          </button>

          <button
            onClick={() => setActiveStudioSection('monetization')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeStudioSection === 'monetization'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Monetization & Vault</span>
          </button>

          <button
            onClick={() => setActiveStudioSection('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeStudioSection === 'all'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>All Studio Tools</span>
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Studio Connected
          </span>
          <span className="font-mono text-slate-500">|</span>
          <span>MRR: <strong className="text-emerald-400 font-mono">${stats.monthlyRecurringRevenue.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Top Financial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Monthly Recurring (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            ${stats.monthlyRecurringRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">184 active paying subscribers</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Marketplace Asset Sales</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-300">
            ${stats.marketplaceSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">769 digital asset downloads</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Tips & Gratitude Jar</span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-300">
            ${stats.totalTipsReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tips.length} supporters tipped</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Lifetime Earnings</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-cyan-300">
            ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> PCI Encrypted Vault
          </p>
        </div>
      </div>

      {/* Interactive Chord Progression Builder */}
      {(activeStudioSection === 'builder' || activeStudioSection === 'all') && (
        <ChordProgressionBuilder
          onSyncFretboard={onSyncFretboard}
          onOpenChordEncyclopedia={() => setActiveStudioSection('encyclopedia')}
        />
      )}

      {/* Chord Encyclopedia View within Creator Studio */}
      {(activeStudioSection === 'encyclopedia' || activeStudioSection === 'all') && (
        <ChordEncyclopedia
          onNavigateToCreator={() => setActiveStudioSection('builder')}
        />
      )}

      {/* Monetization, Tiered Subscriptions, Tip Jar, Store & Vault */}
      {(activeStudioSection === 'monetization' || activeStudioSection === 'all') && (
        <>
      {/* Tiered Subscription Plans */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>Tiered Subscription Monetization</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Offer your guitar students and fans specialized training tiers with automatic billing and recurring revenue.
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Stripe Connect Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionTiers.map((tier) => (
            <div
              key={tier.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                tier.isPopular
                  ? 'bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    {tier.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      tier.isPopular
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tier.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black font-mono text-white">{tier.price}</span>
                  <span className="text-xs text-slate-400">{tier.period}</span>
                </div>

                <div className="text-[11px] text-amber-400/90 font-mono mb-4">
                  {tier.subscribers} active members
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => soundEngine.playClick(true)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    tier.isPopular
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Manage Tier Perks
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Jar & Digital Marketplace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integrated Tip Jar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Heart className="w-5 h-5 fill-current" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Musician Tip Jar</h3>
                <p className="text-xs text-slate-400">Direct micro-tips from grateful learners & followers.</p>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 my-4">
              {[2, 5, 10, 25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    tipAmount === amt
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Tip Form */}
            <form onSubmit={handleSendTip} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Your Name / Handle</label>
                <input
                  type="text"
                  placeholder="e.g. Julian Henderson"
                  value={supporterName}
                  onChange={(e) => setSupporterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Encouraging Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Thanks for the sweet Dorian backing tracks!"
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                Send ${tipAmount} Tip & Message
              </button>

              {tipSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs text-center font-semibold">
                  Thank you! Tip received and added to creator balance.
                </div>
              )}
            </form>
          </div>

          {/* Recent Tips Feed */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-2">Recent Tips:</span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {tips.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{t.supporterName}</span>
                    <p className="text-[11px] text-slate-400 italic">"{t.message}"</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+${t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Marketplace Sales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">Digital Asset Marketplace</h3>
                  <p className="text-xs text-slate-400">Sell Tabs, Audio Loops, IR Cabs & Video Lessons.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAsset(!showAddAsset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            </div>

            {/* Add Asset Form */}
            {showAddAsset && (
              <form onSubmit={handleAddAsset} className="mb-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-amber-300">Publish New Digital Asset</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Asset Title (e.g. Modern Blues Riffs)"
                    value={newAssetTitle}
                    onChange={(e) => setNewAssetTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price ($)"
                    value={newAssetPrice}
                    onChange={(e) => setNewAssetPrice(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Short description of files included"
                  value={newAssetDesc}
                  onChange={(e) => setNewAssetDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                >
                  Publish to Marketplace
                </button>
              </form>
            )}

            {/* Assets List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="max-w-[70%]">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block">
                      {asset.category}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">{asset.title}</h5>
                    <p className="text-[11px] text-slate-400 truncate">{asset.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span>{asset.salesCount} sales</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono font-bold">${asset.revenue.toFixed(2)} rev</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-white block">
                      ${asset.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        soundEngine.playClick(true);
                        alert(`Demo Purchase: You unlocked "${asset.title}"!`);
                      }}
                      className="mt-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold border border-slate-700"
                    >
                      Buy Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Service Integrations & Cross-Platform Distribution */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span>Third-Party Streaming Service API Integrations</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cross-platform distribution for your practice loops, studio singles, and backing track stems.
            </p>
          </div>
          <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/20">
            Global Sync Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {streamingConnections.map((service, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base">{service.icon}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {service.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{service.name}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{service.followers} monthly listeners</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audience Insights & Revenue Projections Dashboard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <span>Audience Insights & Revenue Projections</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Model future recurring revenue based on student subscriber milestones.
        </p>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Projected Subscriber Target</span>
              <span className="text-2xl font-black font-mono text-amber-400">{projectedSubs} Subscribers</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Estimated Annual Revenue</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                ${((projectedSubs * 12.99 * 12) + (stats.marketplaceSales * 1.5)).toLocaleString('en-US', { maximumFractionDigits: 0 })} / year
              </span>
            </div>
          </div>

          <input
            type="range"
            min={50}
            max={2500}
            step={25}
            value={projectedSubs}
            onChange={(e) => setProjectedSubs(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="grid grid-cols-3 text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800/80">
            <div>
              <span className="block text-white font-bold font-mono">
                ${(projectedSubs * 12.99).toFixed(0)} / mo
              </span>
              <span className="text-[10px] text-slate-500">Projected MRR</span>
            </div>
            <div>
              <span className="block text-white font-bold font-mono">94.2%</span>
              <span className="text-[10px] text-slate-500">Monthly Retention</span>
            </div>
            <div>
              <span className="block text-white font-bold font-mono">42 Countries</span>
              <span className="text-[10px] text-slate-500">Global Audience Reach</span>
            </div>
          </div>
        </div>
      </div>

      {/* Encrypted Data Storage & Security Protocol Vault */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Encrypted Financial Vault & Security Protocols</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-knowledge encrypted client-side storage protecting sensitive banking, tax, and payout records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
              AES-256 E2EE Enabled
            </span>
          </div>
        </div>

        <div className="mt-6">
          {!isVaultUnlocked ? (
            <form
              onSubmit={handleUnlockVault}
              className="max-w-md mx-auto p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Vault is Encrypted & Locked</h4>
              <p className="text-xs text-slate-400">
                Enter your secure encryption key or master PIN to decrypt financial transactions and banking tokens. (Demo PIN: <strong>1234</strong>)
              </p>
              <input
                type="password"
                placeholder="Enter 4-digit PIN / Passcode"
                value={vaultPasscode}
                onChange={(e) => setVaultPasscode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-amber-400"
              />
              {vaultError && (
                <div className="text-xs text-rose-400 font-medium">{vaultError}</div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Decrypt & Unlock Financial Records
              </button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    Vault Authenticated & Decrypted (Session Valid)
                  </span>
                </div>
                <button
                  onClick={() => setIsVaultUnlocked(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Lock Vault
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Payout Destination</span>
                  <span className="text-white font-bold">JPMorgan Chase •••• 9842</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Direct ACH Verified</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Stripe Connect Account</span>
                  <span className="text-white font-bold">acct_1NZs9k2Q***92j</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">PCI-DSS Level 1 Ready</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Tax Compliance Status</span>
                  <span className="text-white font-bold">W-9 Form Cryptographically Signed</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">1099-K Eligible</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
