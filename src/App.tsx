/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Activity,
  Info,
  X,
  Settings,
  Wallet,
  Power,
  HelpCircle,
  Sparkles,
  Menu,
  Home,
  Clock,
  LogOut,
  Terminal,
  CheckCircle,
  Users,
  Link,
  BarChart2,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { showConnect, openSTXTransfer, openContractCall } from "@stacks/connect";
import {
  uintCV,
  standardPrincipalCV,
  noneCV,
  someCV,
  bufferCVFromString,
  validateStacksAddress,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import {
  userSession,
  network,
  APP_DETAILS,
  TOKEN_CONTRACTS,
  fetchStacksBalances,
} from "./stacks-config";
import {
  fetchVaultInfo,
  encodeExecuteTransferArgs,
  VAULT_CONTRACT_ADDRESS,
  VAULT_CONTRACT_NAME,
  type VaultInfo,
} from "./services/vaultService";
import WalletCard from "./components/WalletCard";
import TransactionForm from "./components/TransactionForm";
import DecisionCard from "./components/DecisionCard";
import HistoryView from "./components/HistoryView";
import ContactsView from "./components/ContactsView";
import RequestView from "./components/RequestView";
import AnalyticsView from "./components/AnalyticsView";
import VaultView from "./components/VaultView";
import MoreView from "./components/MoreView";
import InsightDigest from "./components/InsightDigest";
import YieldView from "./components/YieldView";
import RecurringView from "./components/RecurringView";
import ReputationView from "./components/ReputationView";
import MultisigView from "./components/MultisigView";
import CreditLineView from "./components/CreditLineView";
import {
  makeDecision,
  compareSpending,
  generatePersonality,
} from "./services/groqService";
import {
  UserProfile,
  TransactionInput,
  DecisionResponse,
  CompareResponse,
  TransactionRecord,
  ViewType,
  Contact,
  RecurringPayment,
} from "./types";
import AboutModal from "./components/AboutModal";
import LandingPage from "./components/LandingPage";
import StacksDonation from "./components/StacksDonation";
import OnboardingModal from "./components/OnboardingModal";

function getStacksAddress(): string | null {
  try {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      return data.profile?.stxAddress?.mainnet || null;
    }
  } catch {}
  return null;
}

function AppContent() {
  const [address, setAddress] = useState<string | null>(getStacksAddress());
  const isConnected = Boolean(address);

  const [isReady, setIsReady] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    monthly_budget: 1200,
    personality: "balanced",
    current_balance: 0,
  });
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [stxPrice, setStxPrice] = useState<number>(2.0);
  const [activeView, setActiveView] = useState<ViewType>("landing");
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTx, setActiveTx] = useState<TransactionInput | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] TwinPay AI initialized...", "[NETWORK] Stacks Mainnet detected."]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // ── Vault state ────────────────────────────────────────────────────────
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);

  // ── Recurring payments: due-count for nav badges ───────────────────────
  const [recurringDueCount, setRecurringDueCount] = useState(0);

  const [analysisStatus, setAnalysisStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Autoconnect
  useEffect(() => {
    const addr = getStacksAddress();
    if (addr) {
      setAddress(addr);
      addLog(`[WALLET] Autoconnected: ${addr.slice(0, 8)}...`);
    }
  }, []);

  // Onboarding
  useEffect(() => {
    if (isConnected && !localStorage.getItem("twinpay_onboarded")) {
      setShowOnboarding(true);
    }
  }, [isConnected]);

  const completeOnboarding = () => {
    localStorage.setItem("twinpay_onboarded", "true");
    setShowOnboarding(false);
  };

  const connectWallet = useCallback(() => {
    addLog("[WALLET] Opening Stacks wallet...");
    showConnect({
      appDetails: APP_DETAILS,
      userSession,
      onFinish: () => {
        const addr = getStacksAddress();
        setAddress(addr);
        addLog(`[WALLET] Connected: ${addr ? addr.slice(0, 8) + "..." : "unknown"}`);
      },
      onCancel: () => addLog("[WALLET] Connection cancelled."),
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    try { userSession.signUserOut(); } catch {}
    setAddress(null);
    addLog("[WALLET] Disconnected.");
  }, []);

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => setAddress(getStacksAddress()));
    }
  }, []);

  // Load balances when wallet connected
  useEffect(() => {
    if (!address) {
      setProfile((p) => ({ ...p, current_balance: 0 }));
      setTokenBalances({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const b = await fetchStacksBalances(address);
        if (cancelled) return;
        setProfile((p) => ({ ...p, current_balance: b.stx }));
        setTokenBalances(b.tokens);
      } catch {}
    };
    load();
    const i = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(i); };
  }, [address]);

  // Load vault info when wallet connected
  useEffect(() => {
    if (!address) { setVaultInfo(null); return; }
    let cancelled = false;
    const loadVault = async () => {
      try {
        const info = await fetchVaultInfo(address);
        if (!cancelled) {
          setVaultInfo(info);
          if (info) {
            addLog(`[VAULT] Limit=${info.limitStx} STX | Remaining=${info.remainingStx.toFixed(4)} STX | ${info.active ? 'ACTIVE' : 'PAUSED'}`);
          }
        }
      } catch {}
    };
    loadVault();
    // Re-check vault every 60 s
    const iv = setInterval(loadVault, 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [address]);

  // Load user profile from Firestore using wallet address
  useEffect(() => {
    if (!address) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, `users/${address}`));
        if (snap.exists()) setProfile((p) => ({ ...p, ...snap.data() as UserProfile }));
      } catch {}
      setIsReady(true);
    })();
  }, [address]);

  // Listen to transactions
  useEffect(() => {
    if (!address) return;
    const q = query(collection(db, `users/${address}/transactions`), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => setHistory(snap.docs.map((d) => d.data() as TransactionRecord)));
  }, [address]);

  // Listen to contacts
  useEffect(() => {
    if (!address) return;
    const q = query(collection(db, `users/${address}/contacts`), orderBy("name", "asc"));
    return onSnapshot(q, (snap) =>
      setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact)))
    );
  }, [address]);

  // Listen to recurring payments — used only to compute a "due" badge count for nav
  useEffect(() => {
    if (!address) {
      setRecurringDueCount(0);
      return;
    }
    const q = query(collection(db, `users/${address}/recurring`), orderBy("nextRunAt", "asc"));
    return onSnapshot(q, (snap) => {
      const now = Date.now();
      const due = snap.docs.filter((d) => {
        const data = d.data() as RecurringPayment;
        return data.active && new Date(data.nextRunAt).getTime() <= now;
      }).length;
      setRecurringDueCount(due);
    });
  }, [address]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd");
        if (r.ok) { const d = await r.json(); if (d.blockstack?.usd) setStxPrice(d.blockstack.usd); }
      } catch {}
    })();
  }, []);

  // Persist profile to Firestore
  useEffect(() => {
    if (!address || !isReady) return;
    const t = setTimeout(() => {
      const { current_balance, ...rest } = profile;
      setDoc(doc(db, `users/${address}`), { ...rest, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [profile, address, isReady]);

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev.slice(0, 19)]);

  const verifyAddressOnChain = async (addr: string) => {
    const cleanAddr = addr.trim();
    const formatValid = validateStacksAddress(cleanAddr);
    try {
      const hiroKey = import.meta.env.VITE_HIRO_API_KEY as string | undefined;
      const headers: Record<string, string> = {};
      if (hiroKey) headers['x-api-key'] = hiroKey;
      // Use the transactions endpoint with limit=1 — reliable way to confirm on-chain activity
      const res = await fetch(
        `https://api.hiro.so/extended/v1/address/${cleanAddr}/transactions?limit=1`,
        { headers }
      );
      const apiOk = res.ok;
      let txCount = 0, balance = "0";
      if (apiOk) {
        const data = await res.json();
        txCount = data.total ?? data.results?.length ?? 0;
      }
      // Also fetch balance from stacks-config (already has hiroHeaders internally)
      try {
        const { fetchStacksBalances } = await import("./stacks-config");
        const b = await fetchStacksBalances(cleanAddr);
        balance = String(Math.round(b.stx * 1_000_000));
      } catch {}
      return { valid: formatValid || apiOk, tx_count: txCount, balance };
    } catch {
      return { valid: formatValid, tx_count: 0, balance: "0" };
    }
  };

  const getRecentTransactions = async (): Promise<TransactionRecord[]> => {
    if (!address) return [];
    try {
      const q = query(
        collection(db, `users/${address}/transactions`),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as TransactionRecord);
    } catch {
      return [];
    }
  };

  const handleProposeTx = async (tx: TransactionInput) => {
    setIsLoading(true);
    setDecision(null);
    setComparison(null);
    setActiveTx(tx);
    setAnalysisStatus(null);

    const cleanRecipient = tx.recipient.trim();
    addLog(`[DECISION] Analyzing ${tx.item} (to ${cleanRecipient.slice(0, 10)}...)`);

    const onChain = await verifyAddressOnChain(cleanRecipient);
    if (!onChain.valid) {
      addLog(`[SECURITY] Invalid Stacks address.`);
      setAnalysisStatus({ type: "error", message: "Invalid Stacks address." });
      setIsLoading(false);
      return;
    }
    addLog(`[SECURITY] Address verified (${onChain.tx_count} previous txs).`);

    try {
      const recentTxs = await getRecentTransactions();
      if (recentTxs.length > 0) {
        addLog(`[AI] Loaded ${recentTxs.length} recent transactions as context.`);
      }

      const result = await makeDecision(
        profile,
        { ...tx, recipient: cleanRecipient, onChain } as any,
        recentTxs
      );
      if (!result?.tx_plan || !result?.security_audit) throw new Error("Incomplete AI response");
      setDecision(result);
      addLog(`[AI] Verdict: ${result.decision.toUpperCase()} (confidence: ${result.confidence})`);
      setAnalysisStatus({
        type: "success",
        message: `AI ${result.decision.toUpperCase()}: ${result.reason}. Confidence: ${Math.round(result.confidence * 100)}%`,
      });
    } catch (error: any) {
      addLog(`[ERROR] AI analysis failed: ${error.message}`);
      setAnalysisStatus({ type: "error", message: `AI analysis failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  /** Bridges a due RecurringPayment into the normal propose/audit/approve flow. */
  const handleRunRecurringNow = (payment: RecurringPayment) => {
    addLog(`[RECURRING] Running "${payment.label}" (${payment.amount} ${payment.token})…`);
    setActiveView("engine");
    handleProposeTx({
      item: payment.label,
      price: payment.amount,
      category: "Recurring",
      token: payment.token,
      recipient: payment.recipient,
    });
  };

  const runSystemAudit = async () => {
    setIsAuditing(true);
    addLog("[AUDIT] Starting integrity protocol...");
    setActiveView("history");
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const p = await generatePersonality("I love saving money but occasionally buy coffee.");
      addLog(`[AUDIT] Personality: ${p.personality.toUpperCase()} (risk: ${p.risk_level})`);
      await new Promise((r) => setTimeout(r, 1000));
      const probeRecipient = address || "SP000000000000000000002Q6VF78";
      const onChain = await verifyAddressOnChain(probeRecipient);
      const d = await makeDecision(
        profile,
        { item: "Diagnostic Probe", category: "System", price: 10, token: "sBTC", recipient: probeRecipient, onChain } as any,
        []
      );
      addLog(`[AUDIT] Decision: ${d.decision.toUpperCase()} | Suggested: $${d.suggested_amount}`);
      await new Promise((r) => setTimeout(r, 1000));
      const c = await compareSpending(10, 8);
      addLog(`[AUDIT] Comparison: ${c.verdict.toUpperCase()} - ${c.message}`);
      addLog("[AUDIT] SUCCESS: All systems operational.");
    } catch (e: any) {
      addLog(`[AUDIT] FAIL: ${e.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExecute = () => {
    if (!decision) return;
    setIsConfirming(true);
    confirmExecution();
  };

  const confirmExecution = async () => {
    if (!decision || !activeTx) return;
    const currentAddress = getStacksAddress();
    if (!currentAddress) {
      addLog("[SYSTEM] Wallet not connected.");
      return;
    }
    setAddress(currentAddress);
    setIsLoading(true);
    setIsPending(true);

    try {
      const { token, recipient, amount } = decision.tx_plan;
      if (!validateStacksAddress(recipient)) throw new Error("Invalid recipient address");

      // ── Vault-routed STX transfer ──────────────────────────────────────────
      if (token === "STX" && vaultInfo?.active) {
        const amountUstx = Math.round(amount * 1_000_000);
        const remaining = vaultInfo.remaining;

        if (amountUstx > remaining) {
          addLog(`[VAULT] Insufficient allowance: need ${amountUstx} µSTX, have ${remaining} µSTX. Using direct transfer.`);
          // Fall through to direct STX transfer below
        } else {
          addLog(`[VAULT] Routing ${amount} STX via TwinPay Vault (${(remaining / 1_000_000).toFixed(4)} STX remaining)…`);
          const postCondition = Pc.principal(currentAddress)
            .willSendEq(BigInt(amountUstx))
            .ustx();

          openContractCall({
            contractAddress: VAULT_CONTRACT_ADDRESS,
            contractName: VAULT_CONTRACT_NAME,
            functionName: "execute-transfer",
            functionArgs: encodeExecuteTransferArgs(amount, recipient),
            postConditions: [postCondition],
            postConditionMode: PostConditionMode.Deny,
            network,
            appDetails: APP_DETAILS,
            onFinish: (data) => {
              addLog(`[VAULT] execute-transfer broadcast. TxID: ${data.txId?.slice(0, 10)}…`);
              // Optimistically update vault remaining
              setVaultInfo((prev) => prev
                ? { ...prev, spent: prev.spent + amountUstx, spentStx: prev.spentStx + amount, remaining: Math.max(0, prev.remaining - amountUstx), remainingStx: Math.max(0, prev.remainingStx - amount) }
                : prev
              );
              recordTransaction(data.txId || "pending");
            },
            onCancel: () => {
              addLog("[VAULT] execute-transfer cancelled.");
              setIsLoading(false);
              setIsPending(false);
              setIsConfirming(false);
            },
          });
          return;
        }
      }

      // ── Direct STX transfer (no vault / vault insufficient) ────────────────
      if (token === "STX") {
        const microStx = Math.round(amount * 1_000_000).toString();
        addLog(`[TX] Requesting STX transfer of ${microStx} microSTX to ${recipient.slice(0, 10)}...`);
        openSTXTransfer({
          recipient,
          amount: microStx,
          memo: activeTx.item.slice(0, 34),
          network,
          appDetails: APP_DETAILS,
          onFinish: (data) => {
            addLog(`[WALLET] STX broadcast sent. TxID: ${data.txId?.slice(0, 10)}...`);
            recordTransaction(data.txId || "pending");
          },
          onCancel: () => {
            addLog("[WALLET] Signature cancelled by user.");
            setIsLoading(false);
            setIsPending(false);
            setIsConfirming(false);
          },
        });
        return;
      } else {
        const tokenInfo = TOKEN_CONTRACTS[token];
        if (!tokenInfo) throw new Error(`Token ${token} not registered`);
        const [contractAddress, contractName] = tokenInfo.contract.split(".");
        const baseUnits = BigInt(Math.round(amount * 10 ** tokenInfo.decimals));
        const memo = activeTx.item.slice(0, 34);
        const postCondition = Pc.principal(currentAddress)
          .willSendEq(baseUnits)
          .ft(tokenInfo.contract as `${string}.${string}`, tokenInfo.assetName);

        await openContractCall({
          contractAddress,
          contractName,
          functionName: "transfer",
          functionArgs: [
            uintCV(baseUnits),
            standardPrincipalCV(currentAddress),
            standardPrincipalCV(recipient),
            memo ? someCV(bufferCVFromString(memo)) : noneCV(),
          ],
          postConditions: [postCondition],
          postConditionMode: PostConditionMode.Deny,
          network,
          appDetails: APP_DETAILS,
          onFinish: (data) => {
            addLog("[WALLET] Broadcast sent.");
            recordTransaction(data.txId);
          },
          onCancel: () => {
            addLog("[WALLET] Signature cancelled.");
            setIsLoading(false);
            setIsPending(false);
          },
        });
      }
    } catch (error: any) {
      addLog(`[ERROR] Broadcast failed: ${error.message}`);
      setIsLoading(false);
      setIsPending(false);
    }
  };

  const recordTransaction = async (txId: string) => {
    if (!activeTx || !decision) return;
    addLog(`[BLOCKCHAIN] Confirmed: ${txId.slice(0, 10)}...`);
    try {
      const compareResult = await compareSpending(decision.tx_plan.amount, decision.suggested_amount);
      setComparison(compareResult);
      addLog(`[COMPARE] ${compareResult.verdict.toUpperCase()}: ${compareResult.message}`);
      const record: TransactionRecord = {
        id: txId,
        item: activeTx.item,
        category: activeTx.category,
        amount: decision.tx_plan.amount,
        token: activeTx.token,
        recipient: activeTx.recipient,
        decision: decision.decision,
        verdict: compareResult.verdict,
        timestamp: new Date().toISOString(),
      };
      if (address) {
        addDoc(collection(db, `users/${address}/transactions`), record).catch(() => {});
      } else {
        setHistory((prev) => [record, ...prev]);
      }
      setShowSuccessPopup(true);
    } catch (e: any) {
      addLog(`[ERROR] Comparison failed: ${e.message}`);
    } finally {
      setIsLoading(false);
      setIsPending(false);
      setIsConfirming(false);
      setDecision(null);
      setActiveTx(null);
    }
  };

  // Contacts CRUD — uses wallet address as user ID
  const handleAddContact = async (contact: Omit<Contact, "id">) => {
    if (!address) {
      throw new Error("Connect your Stacks wallet first before saving contacts.");
    }
    await addDoc(collection(db, `users/${address}/contacts`), contact);
    addLog(`[CONTACTS] Saved: ${contact.name}`);
  };

  const handleDeleteContact = async (id: string) => {
    if (!address) return;
    await deleteDoc(doc(db, `users/${address}/contacts/${id}`));
    addLog(`[CONTACTS] Deleted contact ${id.slice(0, 6)}`);
  };

  const navItemClass = (view: ViewType) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      activeView === view
        ? "bg-brand-green/10 text-brand-green border border-brand-green/30"
        : "text-ghost hover:text-white hover:bg-white/5"
    }`;

  const mobileNavClass = (view: ViewType) =>
    `w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-2 ${
      activeView === view ? "bg-brand-green/10 text-brand-green" : "text-ghost"
    }`;

  if (activeView === "landing") {
    return (
      <>
        <LandingPage onEnterApp={() => setActiveView("engine")} onAbout={() => setIsAboutOpen(true)} />
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      </>
    );
  }

  const renderMainContent = () => {
    switch (activeView) {
      case "history":
        return <HistoryView history={history} />;
      case "contacts":
        return (
          <ContactsView
            contacts={contacts}
            onAdd={handleAddContact}
            onDelete={handleDeleteContact}
          />
        );
      case "request":
        return <RequestView userAddress={address} />;
      case "analytics":
        return <AnalyticsView history={history} />;
      case "vault":
        return (
          <VaultView
            address={address}
            onLog={addLog}
            profile={profile}
          />
        );
      case "more":
        return (
          <MoreView
            onNavigate={setActiveView}
            insightBadge={true}
            recurringDueCount={recurringDueCount}
          />
        );
      case "insights":
        return (
          <InsightDigest
            profile={profile}
            history={history}
            vault={vaultInfo}
            address={address}
          />
        );
      case "yield":
        return <YieldView address={address} profile={profile} />;
      case "recurring":
        return (
          <RecurringView
            address={address}
            contacts={contacts}
            onRunNow={handleRunRecurringNow}
          />
        );
      case "reputation":
        return <ReputationView address={address} history={history} />;
      case "multisig":
        return <MultisigView address={address} />;
      case "credit":
        return <CreditLineView address={address} profile={profile} tokenBalances={tokenBalances} />;
      default:
        return (
          <div className="space-y-8">
            {/* Premium engine heading with animated background */}
            <div className="relative overflow-hidden rounded-2xl p-8 border border-brand-green/20 ledger-strip"
              style={{
                background: "linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Animated mesh grid overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(255,122,24,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,24,0.04) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }} />
              {/* Glow orbs */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,122,24,0.12) 0%, transparent 70%)" }} />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,176,102,0.08) 0%, transparent 70%)" }} />

              <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green/70">Decision Engine Active</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
                    Propose
                    <span className="block text-gradient-brand">Transaction</span>
                  </h2>
                  <p className="text-sm text-ghost mt-3 max-w-sm">
                    Submit a payment for AI-powered analysis. TwinPay will audit, decide, and execute on Stacks Mainnet.
                  </p>
                  {/* Vault indicator */}
                  {vaultInfo?.active && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20">
                      <Shield className="w-3 h-3 text-brand-green" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green">
                        Vault Active — {vaultInfo.remainingStx.toFixed(4)} STX remaining
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl border border-brand-green/20 bg-brand-green/5">
                    <Bot className="w-6 h-6 text-brand-green" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <AnimatePresence mode="wait">
                  {decision ? (
                    <DecisionCard
                      decision={decision}
                      onExecute={handleExecute}
                      isPending={isPending || isConfirming}
                      onCancel={() => { setDecision(null); setIsConfirming(false); }}
                    />
                  ) : comparison ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl panel-glass border border-brand-gold/30"
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-brand-gold font-bold uppercase text-sm mb-3">Post-Payment Insight</h2>
                        <button onClick={() => setComparison(null)} className="text-muted hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-white/80 italic">"{comparison.message}"</p>
                      <div className="mt-4 text-2xl font-mono text-brand-gold">${comparison.difference.toFixed(2)}</div>
                    </motion.div>
                  ) : (
                    <>
                      <TransactionForm
                        onSubmit={handleProposeTx}
                        isLoading={isLoading}
                        balance={profile.current_balance}
                        contacts={contacts}
                      />
                      {analysisStatus && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-3 p-3 rounded-lg text-xs font-mono flex justify-between items-center ${
                            analysisStatus.type === "error"
                              ? "bg-red-500/10 border border-red-500/30 text-red-400"
                              : "bg-brand-green/10 border border-brand-green/30 text-brand-green"
                          }`}
                        >
                          <span>{analysisStatus.message}</span>
                          <button onClick={() => setAnalysisStatus(null)} className="text-muted hover:text-white ml-2">
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
              <aside className="lg:col-span-4 space-y-6">
                <InsightDigest profile={profile} history={history} vault={vaultInfo} address={address} variant="compact" />
                <WalletCard
                  profile={profile}
                  address={address || "SP0000..."}
                  stxPrice={stxPrice}
                  tokenBalances={tokenBalances}
                  vaultStatus={vaultInfo ? {
                    configured: true,
                    active: vaultInfo.active,
                    remainingStx: vaultInfo.remainingStx,
                    limitStx: vaultInfo.limitStx,
                    spentStx: vaultInfo.spentStx,
                  } : { configured: false, active: false, remainingStx: 0, limitStx: 0, spentStx: 0 }}
                  onOpenVault={() => setActiveView("vault")}
                />
                <div className="p-5 rounded-2xl panel-glass border border-line">
                  <h3 className="text-xs uppercase font-bold text-muted mb-3">Budget Impact</h3>
                  <div className="w-full h-2 bg-ink rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-brand rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, profile.current_balance > 0
                          ? ((profile.monthly_budget - (profile.current_balance % 500)) / profile.monthly_budget) * 100
                          : 0)}%`,
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-[11px] text-ghost mt-2 italic">
                    TwinPay AI monitors your {profile.personality} behavior on Stacks Mainnet.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink text-[#F4F4F7] relative">
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={completeOnboarding}
        onConnect={connectWallet}
        isConnected={isConnected}
      />

      {/* ===== SIDEBAR DESKTOP ===== */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-line bg-paper/95 backdrop-blur-xl">
        {/* Logo — clicking returns to landing */}
        <button
          onClick={() => setActiveView("landing")}
          className="p-5 border-b border-line flex items-center gap-3 hover:bg-white/3 transition-colors group w-full text-left"
          title="Back to Landing"
        >
          <img
            src="/TwinPayAI_Logo.png"
            alt="TwinPay AI Logo"
            className="w-10 h-10 rounded-xl object-contain glow-brand group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-sm font-black uppercase italic text-gradient-brand">TwinPay AI</h1>
            <span className="text-[9px] text-muted font-bold tracking-[0.3em]">Autonomous Finance</span>
          </div>
        </button>

        <div className="px-5 py-4 border-b border-line bg-brand-green/5">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-brand-green">
              <Info className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Core Intelligence</span>
            </div>
            <button
              onClick={runSystemAudit}
              disabled={isAuditing}
              className="text-[9px] font-bold uppercase text-ghost hover:text-brand-green disabled:opacity-50"
            >
              {isAuditing ? "Auditing..." : "Run Audit"}
            </button>
          </div>
          <p className="text-[10px] text-ghost italic opacity-80">
            Deterministic liquidity engine using behavioral AI to authorize Stacks Mainnet transactions.
          </p>
        </div>

        <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-brand-green" /> Financial Core
          </div>
          <button onClick={() => setActiveView("engine")} className={navItemClass("engine")}>
            <Bot className="w-4 h-4" /> Decision Engine
          </button>
          <button onClick={() => setActiveView("history")} className={navItemClass("history")}>
            <Activity className="w-4 h-4" /> History & Logs
          </button>
          <button onClick={() => setActiveView("vault")} className={navItemClass("vault")}>
            <Shield className="w-4 h-4" /> TwinPay Vault
            {vaultInfo?.active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            )}
          </button>
          <button onClick={() => setActiveView("contacts")} className={navItemClass("contacts")}>
            <Users className="w-4 h-4" /> Address Book
          </button>
          <button onClick={() => setActiveView("request")} className={navItemClass("request")}>
            <Link className="w-4 h-4" /> Payment Request
          </button>

          <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-4 mt-7 flex items-center gap-2">
            <MoreHorizontal className="w-3 h-3 text-brass" /> Growth Tools
          </div>
          <button
            onClick={() => setActiveView("more")}
            className={navItemClass("more")}
          >
            <MoreHorizontal className="w-4 h-4" /> More
            {recurringDueCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-brass/20 text-brass">
                {recurringDueCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveView("insights")} className={navItemClass("insights")}>
            <Sparkles className="w-4 h-4" /> AI Insight Digest
          </button>
          <button onClick={() => setActiveView("yield")} className={navItemClass("yield")}>
            <Wallet className="w-4 h-4" /> BTC Yield
          </button>
          <button onClick={() => setActiveView("recurring")} className={navItemClass("recurring")}>
            <Clock className="w-4 h-4" /> Recurring Payments
          </button>
          <button onClick={() => setActiveView("analytics")} className={navItemClass("analytics")}>
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>

          <div className="pt-8 mt-4 border-t border-line">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-3 h-3 text-muted" />
              <span className="text-[10px] uppercase text-muted font-bold tracking-widest">Engine Logs</span>
            </div>
            <div className="font-mono text-[10px] space-y-1 opacity-70 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`truncate ${
                    log.includes("[ERROR]")
                      ? "text-red-400"
                      : log.includes("[AI]")
                      ? "text-brand-green"
                      : "text-ghost"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-5">
          <div className="p-4 panel-glass rounded-2xl border border-line">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold text-muted">Profile</span>
              <button onClick={() => setIsSettingsOpen(true)} className="text-ghost hover:text-brand-green">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="text-lg font-bold">${profile.monthly_budget.toLocaleString()}</div>
            <div className="text-xs text-ghost">Monthly Budget</div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  profile.personality === "conservative" ? "bg-brand-green" : "bg-brand-orange"
                }`}
              />
              <span className="text-xs font-semibold uppercase">{profile.personality}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE SIDEBAR ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-paper border-r border-line p-5 flex flex-col lg:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                {/* Mobile sidebar logo — tapping returns to landing */}
                <button
                  onClick={() => { setActiveView("landing"); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 group"
                  title="Back to Landing"
                >
                  <img
                    src="/TwinPayAI_Logo.png"
                    alt="TwinPay AI Logo"
                    className="w-8 h-8 rounded-lg object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="text-sm font-bold text-white">TwinPay AI</span>
                </button>
                <button onClick={() => setMobileMenuOpen(false)} className="text-muted"><X className="w-6 h-6" /></button>
              </div>

              <button onClick={() => { setActiveView("engine"); setMobileMenuOpen(false); }} className={mobileNavClass("engine")}>
                <Bot className="w-5 h-5" /> Decision Engine
              </button>
              <button onClick={() => { setActiveView("history"); setMobileMenuOpen(false); }} className={mobileNavClass("history")}>
                <Activity className="w-5 h-5" /> History & Logs
              </button>
              <button onClick={() => { setActiveView("vault"); setMobileMenuOpen(false); }} className={mobileNavClass("vault")}>
                <Shield className="w-5 h-5" /> TwinPay Vault
                {vaultInfo?.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />}
              </button>
              <button onClick={() => { setActiveView("contacts"); setMobileMenuOpen(false); }} className={mobileNavClass("contacts")}>
                <Users className="w-5 h-5" /> Address Book
              </button>
              <button onClick={() => { setActiveView("request"); setMobileMenuOpen(false); }} className={mobileNavClass("request")}>
                <Link className="w-5 h-5" /> Payment Request
              </button>

              <div className="text-[10px] uppercase text-muted font-bold tracking-widest mt-5 mb-2 flex items-center gap-2">
                <MoreHorizontal className="w-3 h-3 text-brass" /> Growth Tools
              </div>
              <button onClick={() => { setActiveView("more"); setMobileMenuOpen(false); }} className={mobileNavClass("more")}>
                <MoreHorizontal className="w-5 h-5" /> More
                {recurringDueCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-brass/20 text-brass">{recurringDueCount}</span>
                )}
              </button>
              <button onClick={() => { setActiveView("insights"); setMobileMenuOpen(false); }} className={mobileNavClass("insights")}>
                <Sparkles className="w-5 h-5" /> AI Insight Digest
              </button>
              <button onClick={() => { setActiveView("yield"); setMobileMenuOpen(false); }} className={mobileNavClass("yield")}>
                <Wallet className="w-5 h-5" /> BTC Yield
              </button>
              <button onClick={() => { setActiveView("recurring"); setMobileMenuOpen(false); }} className={mobileNavClass("recurring")}>
                <Clock className="w-5 h-5" /> Recurring Payments
              </button>
              <button onClick={() => { setActiveView("analytics"); setMobileMenuOpen(false); }} className={mobileNavClass("analytics")}>
                <BarChart2 className="w-5 h-5" /> Analytics
              </button>
              <button onClick={() => { setIsSettingsOpen(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-ghost">
                <Settings className="w-5 h-5" /> Settings
              </button>

              <div className="mt-4 pt-4 border-t border-line">
                <StacksDonation isConnected={isConnected} />
              </div>

              <div className="mt-auto pt-6 border-t border-line">
                <button onClick={() => { setIsAboutOpen(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-ghost"><Info className="w-5 h-5" /> About</button>
                <button onClick={() => { setShowOnboarding(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-ghost"><HelpCircle className="w-5 h-5" /> Tutorial</button>
                {isConnected && (
                  <button onClick={() => { disconnectWallet(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-red-400/10 mt-2">
                    <LogOut className="w-5 h-5" /> Disconnect
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-ink">
        <header className="h-16 border-b border-line px-4 lg:px-8 flex items-center justify-between shrink-0 backdrop-blur-md bg-paper/80">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-muted hover:text-white p-1">
              <Menu className="w-6 h-6" />
            </button>
            {/* Mobile header logo — clicking returns to landing */}
            <button
              onClick={() => setActiveView("landing")}
              className="flex items-center gap-2 group"
              title="Back to Landing"
            >
              <img
                src="/TwinPayAI_Logo.png"
                alt="TwinPay AI Logo"
                className="w-8 h-8 rounded-lg object-contain glow-brand-sm group-hover:scale-105 transition-transform"
              />
              <h1 className="text-lg font-black uppercase italic text-gradient-brand hidden sm:block">TwinPay AI</h1>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isConnected ? (
              <button onClick={connectWallet} className="flex items-center gap-2 px-3 sm:px-4 h-9 bg-gradient-brand text-ink rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider glow-brand-sm hover:scale-105 transition-transform active:scale-95">
                <Wallet className="w-3.5 h-3.5" /> Connect
              </button>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-brand-green">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  Connected
                </div>
                <div className="sm:hidden text-xs font-mono text-brand-green">🟢 Connected</div>
                <button onClick={disconnectWallet} className="hidden sm:flex items-center gap-2 px-3 h-9 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all">
                  <Power className="w-3.5 h-3.5" /> Disconnect
                </button>
              </>
            )}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all text-ghost hover:text-white"
            >
              <Info className="w-3.5 h-3.5" /> About
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {renderMainContent()}
          </div>
        </div>

        {/* Mobile Payment Request Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setActiveView("request")}
            className={`fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border transition-all ${
              activeView === "request"
                ? "bg-gradient-brand border-brand-orange/50 text-ink"
                : "bg-paper border-line text-ghost hover:text-white"
            }`}
            title="Payment Request"
          >
            <Link className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-paper/95 backdrop-blur-xl border-t border-line flex items-center justify-around z-30 px-1">
          <button onClick={() => setActiveView("engine")} className={`flex flex-col items-center ${activeView === "engine" ? "text-brand-green" : "text-muted"}`}>
            <Home className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Engine</span>
          </button>
          <button onClick={() => setActiveView("history")} className={`flex flex-col items-center ${activeView === "history" ? "text-brand-green" : "text-muted"}`}>
            <Clock className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">History</span>
          </button>
          <button onClick={() => setActiveView("vault")} className={`flex flex-col items-center relative ${activeView === "vault" ? "text-brand-green" : "text-muted"}`}>
            <Shield className="w-5 h-5" />
            {vaultInfo?.active && <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-brand-green" />}
            <span className="text-[9px] font-bold uppercase">Vault</span>
          </button>
          <button onClick={() => setActiveView("contacts")} className={`flex flex-col items-center ${activeView === "contacts" ? "text-brand-green" : "text-muted"}`}>
            <Users className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Contacts</span>
          </button>
          <button
            onClick={() => setActiveView("more")}
            className={`flex flex-col items-center relative ${
              ["more", "insights", "yield", "recurring", "analytics", "reputation", "multisig", "credit"].includes(activeView)
                ? "text-brand-green"
                : "text-muted"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            {recurringDueCount > 0 && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
            )}
            <span className="text-[9px] font-bold uppercase">More</span>
          </button>
        </nav>
      </main>

      {/* Floating Help Button */}
      <button
        onClick={() => setShowOnboarding(true)}
        className="hidden lg:flex fixed bottom-6 left-6 z-50 w-12 h-12 bg-gradient-to-br from-brand-green to-brand-gold rounded-full items-center justify-center shadow-2xl hover:scale-110 transition-all"
        title="Open tutorial"
      >
        <HelpCircle className="w-5 h-5 text-black" />
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-line flex justify-between items-center bg-surface-bright">
                <h2 className="text-sm font-bold uppercase tracking-widest">Profile Configuration</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-muted hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">Monthly Budget Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={profile.monthly_budget || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setProfile({ ...profile, monthly_budget: val === "" ? 0 : Number(val) });
                      }}
                      className="w-full bg-ink border border-line p-4 pl-8 rounded-lg font-mono text-sm focus:border-brand-green outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">AI Spending Personality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["conservative", "balanced", "aggressive"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setProfile({ ...profile, personality: p as any })}
                        className={`py-3 rounded-lg border text-[10px] uppercase font-bold tracking-widest transition-all ${
                          profile.personality === p
                            ? "bg-brand-green/10 border-brand-green text-brand-green"
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
                <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-gradient-brand text-ink font-bold py-4 rounded-lg uppercase text-xs tracking-widest">
                  Save & Apply Config
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-brand-green/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button onClick={() => setShowSuccessPopup(false)} className="absolute top-4 right-4 text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-16 h-16 text-brand-green mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Transaction Successful!</h2>
                <p className="text-sm text-ghost mb-6">Your transaction has been broadcast to Stacks Mainnet.</p>
                <button onClick={() => setShowSuccessPopup(false)} className="px-6 py-2 bg-gradient-brand text-ink font-bold rounded-lg uppercase text-xs tracking-widest">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
