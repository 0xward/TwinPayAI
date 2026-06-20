/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, Trash2, User, CheckCircle, XCircle, Loader, X } from "lucide-react";
import { Contact } from "../types";
import { resolveBnsName } from "../stacks-config";

interface ContactsViewProps {
  contacts: Contact[];
  onAdd: (contact: Omit<Contact, "id">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type BnsStatus = "idle" | "resolving" | "resolved" | "error";

export default function ContactsView({ contacts, onAdd, onDelete }: ContactsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [bnsStatus, setBnsStatus] = useState<BnsStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isBns = addressInput.trim().endsWith(".btc");

  const handleAddressChange = async (val: string) => {
    setAddressInput(val);
    setResolvedAddress(null);
    setBnsStatus("idle");
    if (val.trim().endsWith(".btc")) {
      setBnsStatus("resolving");
      const addr = await resolveBnsName(val.trim());
      if (addr) {
        setResolvedAddress(addr);
        setBnsStatus("resolved");
      } else {
        setBnsStatus("error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || bnsStatus === "resolving" || bnsStatus === "error") return;
    const finalAddress = resolvedAddress ?? addressInput.trim();
    if (!finalAddress) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onAdd({
        name: name.trim(),
        address: finalAddress,
        bns: isBns ? addressInput.trim() : undefined,
      });
      setName("");
      setAddressInput("");
      setResolvedAddress(null);
      setBnsStatus("idle");
      setShowForm(false);
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-white mb-1">Address Book</h2>
          <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
            Stacks Contacts // Saved Addresses
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-ink rounded-lg text-xs font-bold uppercase tracking-widest glow-brand-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Add Contact Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-5 border-b border-line bg-surface-bright flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wide">New Contact</h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice"
                  className="w-full bg-ink border border-line p-3 rounded-lg focus:outline-none focus:border-brand-green/50 font-mono text-sm placeholder:text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">
                  Stacks Address or BNS Name (.btc)
                </label>
                <input
                  type="text"
                  required
                  value={addressInput}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="SP... or name.btc"
                  className="w-full bg-ink border border-line p-3 rounded-lg focus:outline-none focus:border-brand-green/50 font-mono text-xs placeholder:text-gray-700"
                />
                {bnsStatus === "resolving" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader className="w-3 h-3 text-ghost animate-spin" />
                    <span className="text-[10px] text-ghost">Resolving BNS...</span>
                  </div>
                )}
                {bnsStatus === "resolved" && resolvedAddress && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span className="text-[10px] text-brand-green font-mono bg-brand-green/5 border border-brand-green/20 rounded px-2 py-0.5 truncate">
                      {resolvedAddress}
                    </span>
                  </div>
                )}
                {bnsStatus === "error" && (
                  <div className="flex items-center gap-2 mt-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] text-red-400">BNS name not found.</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || bnsStatus === "resolving" || bnsStatus === "error"}
                  className="flex-1 py-3 bg-gradient-brand text-ink font-bold rounded-lg uppercase text-xs tracking-widest disabled:opacity-50 hover:opacity-90 transition-all"
                >
                  {saving ? "Saving..." : "Save Contact"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 border border-line text-ghost rounded-lg uppercase text-xs font-bold tracking-widest hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
              {saveError && (
                <div className="flex items-center gap-2 mt-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[10px] text-red-400">{saveError}</span>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts List */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
        {contacts.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-muted mx-auto mb-4 opacity-30" />
            <p className="text-ghost italic text-sm">No contacts saved yet.</p>
            <p className="text-[10px] text-muted mt-1">Add contacts to speed up future transactions.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-brand-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">{contact.name}</div>
                  <div className="text-[10px] font-mono text-muted truncate mt-0.5">
                    {contact.address}
                  </div>
                  {contact.bns && (
                    <div className="text-[10px] text-brand-gold mt-0.5">{contact.bns}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(contact.id)}
                  disabled={deletingId === contact.id}
                  className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 disabled:opacity-50 shrink-0"
                  title="Delete contact"
                >
                  {deletingId === contact.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 bg-[#0F121A] border-t border-line flex justify-between items-center text-[10px] text-muted font-mono uppercase tracking-widest">
          <div>{contacts.length} Contact{contacts.length !== 1 ? "s" : ""}</div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3" />
            Firestore Synced
          </div>
        </div>
      </div>
    </motion.div>
  );
}
