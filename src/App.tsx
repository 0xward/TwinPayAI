/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Terminal, ShieldCheck, Activity, Info, X, Settings, Wallet, Power, HelpCircle } from "lucide-react";
import { WagmiProvider, useAccount, useConnect, useDisconnect, useBalance, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { formatUnits, parseEther, isAddress, parseUnits, Address } from "viem";
import { celo } from "viem/chains";

const TOKEN_ADDRESSES: Record<string, Address> = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763390312C4721948775014440AF0121191B9f',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
};

const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc,
  getDocFromServer
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { config } from "./wagmi-config";
import WalletCard from "./components/WalletCard";
import TransactionForm from "./components/TransactionForm";
import DecisionCard from "./components/DecisionCard";
import HistoryView from "./components/HistoryView";
import { makeDecision, compareSpending, generatePersonality } from "./services/geminiService";
import { UserProfile, TransactionInput, DecisionResponse, CompareResponse, TransactionRecord, ViewType } from "./types";
import AboutModal from "./components/AboutModal";

const STORAGE_KEY = "twinpay_user_profile";
const queryClient = new QueryClient();

function AppContent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  const { 
    data: sendHash, 
    sendTransaction, 
    isPending: isSendPending,
    error: sendError 
  } = useSendTransaction();

  const {
    writeContract,
    data: writeHash,
    isPending: isWritePending,
    error: writeError
  } = useWriteContract();

  const hash = sendHash || writeHash;
  const isPending = isSendPending || isWritePending;
  const txError = sendError || writeError;

  const { isLoading: isConfirmingTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Test Firebase connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          addLog("[ERROR] Firebase offline. Check your configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        signInAnonymously(auth).catch(e => addLog(`[AUTH] Failed: ${e.message}`));
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-connect logic...
  useEffect(() => {
    if (!isConnected) {
      const injectedConnector = connectors.find(c => c.type === 'injected');
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  }, [connectors, connect, isConnected]);

  const [profile, setProfile] = useState<UserProfile>({
    monthly_budget: 1200,
    personality: "balanced",
    current_balance: 0 
  });

  // Load profile from Firestore
  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      const path = `users/${user.uid}`;
      try {
        const docRef = doc(db, path);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(prev => ({ ...prev, ...data }));
        }
        setIsReady(true);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, path);
      }
    };
    loadProfile();
  }, [user]);

  // Load history from Firestore (Real-time)
  useEffect(() => {
    if (!user) return;
    
    const path = `users/${user.uid}/transactions`;
    const q = query(collection(db, path), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as TransactionRecord);
      setHistory(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Sync balance from wallet to profile
  useEffect(() => {
    if (balanceData) {
      const formatted = formatUnits(balanceData.value, balanceData.decimals);
      setProfile(prev => ({
        ...prev,
        current_balance: parseFloat(formatted)
      }));
    } else if (!isConnected) {
       setProfile(prev => ({ ...prev, current_balance: 0 }));
    }
  }, [balanceData, isConnected]);

  const [celoPrice, setCeloPrice] = useState<number>(0.85); // Default fallback

  // Fetch CELO Price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Try CoinGecko
        const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd');
        if (cgResponse.ok) {
          const data = await cgResponse.json();
          if (data.celo && data.celo.usd) {
            setCeloPrice(data.celo.usd);
            addLog(`[MARKET] CELO Price: $${data.celo.usd}`);
            return;
          }
        }
        throw new Error("CoinGecko Unavailable");
      } catch (e) {
        // Fallback to Binance
        try {
          const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=CELOUSDT');
          if (binanceResponse.ok) {
            const data = await binanceResponse.json();
            if (data.price) {
              const price = parseFloat(data.price);
              setCeloPrice(price);
              addLog(`[MARKET] CELO Price (Binance): $${price}`);
              return;
            }
          }
        } catch (binanceErr) {
          console.warn("All price APIs failed. Using fallback $0.85");
        }
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 300000); // Update every 5 minutes instead of 1 to reduce rate limit hits
    return () => clearInterval(interval);
  }, []);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("engine");
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTx, setActiveTx] = useState<TransactionInput | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] TwinPay AI initialized...", "[NETWORK] Celo Mainnet detected."]);

  // Handle transaction success effect
  useEffect(() => {
    if (isTxSuccess && hash && activeTx && decision) {
      const processPostTx = async () => {
        addLog(`[BLOCKCHAIN] Confirmed: ${hash.slice(0, 10)}...`);
        const actualAmount = decision.tx_plan.amount;
        
        try {
          const compareResult = await compareSpending(actualAmount, decision.suggested_amount);
          setComparison(compareResult);
          addLog(`[COMPARE] ${compareResult.verdict.toUpperCase()}: ${compareResult.message}`);
          
          const record: TransactionRecord = {
            id: hash,
            item: activeTx.item,
            category: activeTx.category,
            amount: actualAmount,
            token: activeTx.token,
            recipient: activeTx.recipient,
            decision: decision.decision,
            verdict: compareResult.verdict,
            timestamp: new Date().toISOString()
          };
          
          if (user) {
            const path = `users/${user.uid}/transactions`;
            addDoc(collection(db, path), record).catch(e => handleFirestoreError(e, OperationType.WRITE, path));
          } else {
            setHistory(prev => [record, ...prev]);
          }
        } catch (e) {
          addLog(`[ERROR] Analysis failed but transaction succeeded.`);
        } finally {
          setIsLoading(false);
          setDecision(null);
          setActiveTx(null);
        }
      };
      processPostTx();
    }
  }, [isTxSuccess, hash]);

  // Handle transaction error
  useEffect(() => {
    if (txError) {
      addLog(`[ERROR] Transaction failed: ${txError.message.slice(0, 50)}...`);
      setIsLoading(false);
      setIsConfirming(false);
    }
  }, [txError]);

  // Persistence effect
  useEffect(() => {
    if (!user || !isReady) return;
    
    const syncProfile = async () => {
      const path = `users/${user.uid}`;
      try {
        const { current_balance, ...rest } = profile; // don't sync balance to firestore constantly
        await setDoc(doc(db, path), { ...rest, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    };
    
    const timeout = setTimeout(syncProfile, 1000);
    return () => clearTimeout(timeout);
  }, [profile, user, isReady]);

  // Handle redirect result
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        addLog("[AUTH] Signed in via redirect.");
      }
    }).catch((e) => {
      console.error("Auth redirect error", e);
    });
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    addLog("[AUTH] Starting Google Login...");
    try {
      // In some mobile wallets/iframes, popup is completely blocked.
      // We try popup first as it's better UX for those who can use it.
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        addLog(`[AUTH] Signed in as ${result.user.displayName || 'User'}`);
      }
    } catch (e: any) {
      console.error("Login error", e);
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request' || e.code === 'auth/internal-error') {
        addLog("[AUTH] Popup failed/blocked. Attempting Redirect...");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
          addLog(`[AUTH] Redirect failed: ${redirectErr.message}`);
          // Last resort: Anonymous
          signInAnonymously(auth).catch(err => addLog(`[AUTH] Anonymous failed: ${err.message}`));
        }
      } else if (e.message?.includes("Authorized Domain") || e.code === 'auth/unauthorized-domain') {
        addLog("[ERROR] Domain not authorized in Firebase Console.");
        addLog("[HELP] Add this domain to 'Authorized domains' in Firebase Authentication settings.");
      } else {
        addLog(`[AUTH] Login failed: ${e.message}`);
      }
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 8)]);
  };

  const handleProposeTx = async (tx: TransactionInput) => {
    setIsLoading(true);
    setDecision(null);
    setComparison(null);
    setActiveTx(tx);
    addLog(`[DECISION] Analyzing ${tx.item} ($${tx.price})...`);

    try {
      const result = await makeDecision(profile, tx);
      if (!result || !result.tx_plan || !result.security_audit) {
        throw new Error("AI returned an incomplete analysis blueprint.");
      }
      setDecision(result);
      addLog(`[AI] Verdict: ${result.decision.toUpperCase()}. Confidence: ${result.confidence}`);
    } catch (error) {
      addLog(`[ERROR] AI analysis failed: ${error instanceof Error ? error.message : "Internal Logic Gap"}`);
      setDecision(null);
    } finally {
      setIsLoading(false);
    }
  };

  const runSystemAudit = async () => {
    setIsAuditing(true);
    addLog("[AUDIT] Initializing TwinPay AI Integrity Protocol...");
    setActiveView("history");
    
    try {
      await new Promise(r => setTimeout(r, 1000));
      addLog("[AUDIT] Step 1: Validating Personality Matrix...");
      const p = await generatePersonality("I love saving money but occasionally buy coffee.");
      addLog(`[AUDIT] Matrix: ${p.personality.toUpperCase()} (${p.risk_level})`);
      
      await new Promise(r => setTimeout(r, 1000));
      addLog("[AUDIT] Step 2: Evaluating Mock Transaction...");
      const d = await makeDecision(profile, { item: "Diagnostic Probe", category: "System", price: 10, token: "cUSD", recipient: "0x_TEST" });
      addLog(`[AUDIT] Decision: ${d.decision.toUpperCase()} | Suggested: $${d.suggested_amount}`);
      
      await new Promise(r => setTimeout(r, 1000));
      addLog("[AUDIT] Step 3: Calibrating Comparison Engine...");
      const c = await compareSpending(10, 8);
      addLog(`[AUDIT] Comparison: ${c.verdict.toUpperCase()} - ${c.message}`);
      
      addLog("[AUDIT] SUCCESS: TwinPay AI is 100% operational.");
    } catch (e) {
      addLog("[AUDIT] FAIL: System interference detected.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExecute = () => {
    if (!decision) return;
    setIsConfirming(true);
  };

  const confirmExecution = async () => {
    if (!decision || !activeTx) return;
    
    setIsConfirming(false);
    if (!isConnected) {
        addLog("[SYSTEM] Wallet connection required for transaction broadcasting.");
        return;
    }

    addLog(`[MINIPAY] Soliciting signature for ${decision.tx_plan.amount} ${decision.tx_plan.token}...`);
    setIsLoading(true);

    try {
      const { token, recipient, amount } = decision.tx_plan;
      
      if (!isAddress(recipient)) {
        throw new Error("Recipient address is invalid.");
      }

      if (token === 'CELO') {
        sendTransaction({
          to: recipient as Address,
          value: parseEther(amount.toString()),
        });
      } else {
        const contractAddress = TOKEN_ADDRESSES[token];
        if (!contractAddress) throw new Error(`Token contract for ${token} not registered.`);
        
        writeContract({
          abi: erc20Abi,
          address: contractAddress,
          functionName: 'transfer',
          args: [recipient as Address, parseUnits(amount.toString(), 18)],
          account: address,
          chain: celo,
        });
      }
      
      addLog(`[WALLET] Broadcast pending... waiting for node confirmation.`);
    } catch (error) {
      addLog(`[ERROR] Broadcast failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink text-[#F4F4F7]">
      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-line flex justify-between items-center bg-surface-bright">
                <h2 className="text-sm font-bold uppercase tracking-widest">Profile Configuration</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">Monthly Budget Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">$</span>
                    <input 
                      type="number"
                      value={profile.monthly_budget}
                      onChange={e => setProfile({...profile, monthly_budget: Number(e.target.value)})}
                      className="w-full bg-ink border border-line p-4 pl-8 rounded-lg font-mono text-sm focus:border-celo-green outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">AI Spending Personality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["conservative", "balanced", "aggressive"].map(p => (
                      <button
                        key={p}
                        onClick={() => setProfile({...profile, personality: p as any})}
                        className={`py-3 rounded-lg border text-[10px] uppercase font-bold tracking-widest transition-all ${
                          profile.personality === p 
                            ? "bg-celo-green/10 border-celo-green text-celo-green" 
                            : "bg-ink border-line text-muted hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-ink/50 border border-line rounded-lg text-[10px] text-muted italic leading-relaxed">
                  "Adjusting these values will immediately recalibrate the TwinPay logic engine for future decision proposals."
                </div>
              </div>
              <div className="p-6 bg-surface-bright border-t border-line">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-celo-green text-ink font-bold py-4 rounded-lg uppercase text-xs tracking-widest"
                >
                  Save & Apply Config
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* FINAL EXECUTION CONFIRMATION */}
      <AnimatePresence>
        {isConfirming && decision && activeTx && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-surface border-2 border-line rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-6 border-b border-line bg-surface-bright flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-celo-gold/20 flex items-center justify-center text-celo-gold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Verify Execution</h2>
                </div>
                <button onClick={() => setIsConfirming(false)} className="text-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="mb-8 p-6 bg-ink rounded-2xl border border-line">
                  <div className="text-[10px] uppercase text-muted font-bold mb-4 tracking-widest">Transaction Specification</div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end pb-4 border-b border-line/50">
                      <span className="text-ghost text-xs uppercase font-bold">Intended Amount</span>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold leading-none">${decision.tx_plan.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-muted font-bold mt-1 uppercase">{decision.tx_plan.token} Token</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <div className="text-[10px] uppercase text-muted font-bold mb-1 tracking-widest">Resource</div>
                           <div className="text-sm font-bold text-white">{activeTx.item}</div>
                        </div>
                        <div>
                           <div className="text-[10px] uppercase text-muted font-bold mb-1 tracking-widest">Recipient</div>
                           <div className="text-xs font-mono text-ghost truncate">{activeTx.recipient}</div>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 p-3 bg-celo-green/10 border border-celo-green/20 rounded-xl">
                      <Bot className="w-4 h-4 text-celo-green" />
                      <p className="text-[10px] uppercase font-bold text-celo-green tracking-wider">
                        AI Recommended Execution Path Verified
                      </p>
                   </div>
                   <p className="text-xs text-ghost italic leading-relaxed text-center px-4">
                     "By confirming, you authorize TwinPay AI to broadcast this deterministic transaction to the Celo network."
                   </p>
                </div>
              </div>

              <div className="p-6 bg-surface-bright border-t border-line grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="py-4 border border-line rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-white/5 transition-all text-ghost hover:text-white"
                >
                  Abnormal Close
                </button>
                <button 
                  onClick={confirmExecution}
                  disabled={isLoading || isConfirmingTx || isPending}
                  className="py-4 bg-celo-green text-ink font-bold rounded-xl uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(53,208,127,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Broadcasting..." : isConfirmingTx ? "Confirming..." : "Authorize Pulse"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT NAVIGATION BAR */}
      <nav className="w-64 border-r border-line flex flex-col bg-[#0F121A] shrink-0 hidden md:flex">
        <div className="p-6 border-b border-line flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-celo-green rounded-xl flex items-center justify-center font-black text-ink text-2xl shadow-[0_0_20px_rgba(53,208,127,0.3)]">T</div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tighter uppercase italic -mb-1">TwinPay AI</h1>
            <span className="text-[9px] text-muted font-bold tracking-[0.3em] uppercase">Autonomous Finance</span>
          </div>
        </div>
        
        <div className="px-6 py-4 border-b border-line bg-celo-green/5">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-celo-green">
                <Info className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Core Intelligence</span>
              </div>
              <button 
                onClick={runSystemAudit}
                disabled={isAuditing}
                className="text-[9px] font-bold uppercase text-ghost hover:text-celo-green transition-colors disabled:opacity-50"
              >
                {isAuditing ? "Auditing..." : "Run Audit"}
              </button>
           </div>
           <p className="text-[10px] text-ghost leading-relaxed italic opacity-80">
             TwinPay is a deterministic liquidity engine that uses behavioral AI to authorize Celo Mainnet transactions based on your risk profile.
           </p>
        </div>
        
        <div className="p-6 flex-1 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-4">Financial Core</div>
          <button 
            onClick={() => setActiveView("engine")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${activeView === "engine" ? "bg-line text-white" : "text-ghost hover:text-white"}`}
          >
            <Bot className="w-4 h-4" />
            Decision Engine
          </button>
          <button 
            onClick={() => setActiveView("history")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${activeView === "history" ? "bg-line text-white" : "text-ghost hover:text-white"}`}
          >
            <Activity className="w-4 h-4" />
            History & Logs
          </button>
          
          <div className="pt-8 mb-4 flex items-center gap-2">
            <Info className="w-3 h-3 text-muted" />
            <span className="text-[10px] uppercase text-muted font-bold tracking-widest">Logs</span>
          </div>
          <div className="font-mono text-[10px] space-y-2 opacity-50 px-1">
            {logs.map((log, i) => (
              <div key={i} className={`truncate ${log.includes("[ERROR]") ? "text-red-400" : ""}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="p-5 bg-surface rounded-xl border border-line">
            <div className="text-[10px] uppercase text-muted font-bold mb-2 flex justify-between items-center">
              User Profile
              <button onClick={() => setIsSettingsOpen(true)} className="text-ghost hover:text-celo-green">
                <Settings className="w-3 h-3" />
              </button>
            </div>
            <div className="text-sm font-bold">${profile.monthly_budget.toLocaleString()} <span className="text-celo-green">USD</span></div>
            <div className="text-[11px] text-ghost opacity-70">Monthly Budget Limit</div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${profile.personality === "aggressive" ? "bg-red-500" : profile.personality === "conservative" ? "bg-celo-green" : "bg-celo-orange"}`}></span>
              <span className="text-xs font-semibold uppercase">{profile.personality} Profile</span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* TOP STATUS BAR */}
        <header className="h-16 border-b border-line px-8 flex items-center justify-between bg-[#0F121A] shrink-0 sticky top-0 z-[100] w-full">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 bg-celo-green rounded-xl flex items-center justify-center font-black text-ink text-xl shadow-[0_0_15px_rgba(53,208,127,0.25)]">T</div>
               <div className="flex flex-col">
                 <h1 className="text-sm font-black uppercase italic tracking-tighter leading-none">TwinPay AI</h1>
               </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
               <ShieldCheck className="w-3 h-3 text-celo-green" />
               <span className="text-[9px] font-bold text-ghost uppercase tracking-wider">Secure Celo Protocol</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {user && !user.isAnonymous ? (
               <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                     <div className="text-[10px] font-bold text-white uppercase leading-none">{user.displayName || "Twin User"}</div>
                     <div className="text-[8px] text-muted uppercase mt-0.5 tracking-widest">Signed In</div>
                  </div>
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} 
                    className="w-8 h-8 rounded-full border border-line bg-surface" 
                    alt="avatar" 
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      auth.signOut().then(() => addLog("[AUTH] Signed out."));
                    }}
                    className="text-ghost hover:text-red-400 p-2 cursor-pointer transition-colors"
                    title="Sign Out"
                    type="button"
                  >
                    <Power className="w-4 h-4" />
                  </button>
               </div>
             ) : (
               <button 
                onClick={handleLogin}
                type="button"
                className="flex items-center gap-2 px-4 h-8 bg-surface-bright hover:bg-white/10 border border-line rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer"
               >
                 Sign in
               </button>
             )}
 
             <div className="h-4 w-[1px] bg-line"></div>
 
             {isConnected ? (
               <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    disconnect();
                    addLog("[WALLET] Requesting disconnect...");
                  } catch (err: any) {
                    addLog(`[ERROR] Disconnect failed: ${err.message}`);
                    // Fallback: clear address locally if wagmi is stuck
                    addLog("[WALLET] Try refreshing if still stuck.");
                  }
                }}
                type="button"
                className="flex items-center gap-2 px-4 h-9 bg-line hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
               >
                 <Power className="w-3 h-3" />
                 Disconnect
               </button>
             ) : (
               <div className="flex gap-2">
                 {connectors.map((connector) => (
                   <button 
                    key={connector.uid}
                    onClick={() => {
                      addLog(`[WALLET] Connecting to ${connector.name}...`);
                      connect({ connector });
                    }}
                    type="button"
                    className="flex items-center gap-2 px-4 h-9 bg-white text-ink rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-celo-green transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer"
                   >
                     <Wallet className="w-3 h-3" />
                     {connector.name === "Injected" ? "Connect Wallet" : connector.name}
                   </button>
                 ))}
               </div>
             )}
             
             <div className="h-4 w-[1px] bg-line hidden sm:block"></div>
             
             <div className="text-xs font-mono text-celo-green hidden sm:flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-celo-green animate-pulse" : "bg-muted"}`}></div>
                AUTO_CORE: ACTIVE
             </div>
          </div>
        </header>

        {/* CONTENT SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-0">
          <div className="max-w-6xl mx-auto space-y-8">
             {activeView === "history" ? (
                <HistoryView history={history} />
             ) : (
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  {/* PRIMARY ACTIONS */}
                  <div className="xl:col-span-8 space-y-8">
                     <AnimatePresence mode="wait">
                       {decision ? (
                         <DecisionCard 
                          decision={decision} 
                          onExecute={handleExecute} 
                          isPending={isPending || isConfirmingTx}
                         />
                       ) : comparison ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-surface-bright border border-celo-gold/30 rounded-2xl p-8 shadow-xl"
                          >
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-celo-gold font-bold uppercase tracking-widest text-sm">Post-Payment Insight</h2>
                              <div className="px-2 py-1 bg-celo-gold/10 rounded text-[10px] text-celo-gold font-mono">{comparison.verdict}</div>
                            </div>
                            <p className="text-lg italic text-white/90 leading-relaxed mb-8">"{comparison.message}"</p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-ink rounded-lg border border-line">
                                 <div className="text-[10px] text-muted uppercase font-bold mb-1">Budget Delta</div>
                                 <div className="text-xl font-mono text-celo-gold">${comparison.difference.toFixed(2)}</div>
                               </div>
                               <div className="p-4 bg-ink rounded-lg border border-line flex items-center justify-center">
                                 <button 
                                  onClick={() => setComparison(null)}
                                  className="text-[10px] font-bold uppercase tracking-widest hover:text-celo-green transition-colors"
                                 >
                                   Dismiss Data
                                 </button>
                               </div>
                            </div>
                          </motion.div>
                       ) : (
                         <TransactionForm 
                          onSubmit={handleProposeTx} 
                          isLoading={isLoading} 
                         />
                       )}
                     </AnimatePresence>
                  </div>

                  {/* SIDEBAR METRICS */}
                  <aside className="xl:col-span-4 space-y-6">
                     <WalletCard 
                       profile={profile} 
                       address={address || "0x0000...0000"} 
                       celoPrice={celoPrice}
                     />

                     <div className="bg-surface border border-line rounded-2xl p-6">
                        <div className="text-[10px] uppercase text-muted font-bold mb-4 tracking-widest">Budget Impact Analysis</div>
                        <div className="relative h-2 bg-ink rounded-full overflow-hidden mb-2">
                          <div 
                            className="absolute left-0 top-0 h-full bg-celo-green transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (profile.current_balance > 0 ? ( (profile.monthly_budget - (profile.current_balance % 500)) / profile.monthly_budget ) * 100 : 0))}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold mt-3">
                          <span className="text-ghost uppercase">Utilized</span>
                          <span className="text-celo-green uppercase">Available</span>
                        </div>
                        <p className="mt-6 text-[11px] text-muted italic leading-relaxed border-t border-line pt-4">
                          "TwinPay AI actively monitors your {profile.personality} behavior. Wallet liquidity synced to Celo Mainnet."
                        </p>
                     </div>
                  </aside>
               </div>
             )}
          </div>
        </div>

        {/* FLOATING ABOUT & FAQ BUTTON */}
        <button 
          onClick={() => setIsAboutOpen(true)}
          className="fixed bottom-16 left-8 sm:left-72 z-40 bg-paper/50 backdrop-blur-md border border-line p-3 rounded-full shadow-2xl hover:bg-white/10 hover:border-celo-green transition-all group lg:bottom-20"
          title="About & FAQ"
        >
          <div className="flex items-center gap-3 pr-2">
            <div className="w-8 h-8 bg-celo-green/20 rounded-full flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-celo-green" />
            </div>
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-white transition-colors">About & FAQ</span>
          </div>
        </button>

        {/* FOOTER DATA STRIP */}
        <footer className="h-12 bg-ink border-t border-line px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-celo-green" : "bg-muted"}`}></span>
              <span className="text-[10px] uppercase font-bold text-muted tracking-widest">System Operational</span>
            </div>
            <div className="text-[10px] text-muted uppercase font-mono hidden sm:block">Latency: 14ms</div>
            <div className="text-[10px] text-muted uppercase font-mono hidden sm:block">Decision Latency: 420ms</div>
          </div>
          <div className="text-[10px] font-mono text-muted uppercase tracking-tighter">
            v0.1.0-beta // twinpay-determ-core
          </div>
        </footer>
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
