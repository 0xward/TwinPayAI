/**
 * Recurring Payments — Firestore-backed schedule service.
 * Mirrors the users/{address}/transactions and /contacts sub-collection
 * pattern already used in App.tsx. Execution is user-initiated (a "Run now"
 * action that reuses the existing AI decision + on-chain transfer flow) —
 * there is no background cron in this client-only app, so the UI surfaces
 * "due" schedules clearly and lets the user (or the Decision Engine) act on them.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RecurringPayment, TransactionToken } from '../types';

export function listenToRecurringPayments(
  address: string,
  onChange: (payments: RecurringPayment[]) => void
): Unsubscribe {
  const q = query(collection(db, `users/${address}/recurring`), orderBy('nextRunAt', 'asc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecurringPayment)));
  });
}

export async function createRecurringPayment(
  address: string,
  input: {
    label: string;
    amount: number;
    token: TransactionToken;
    recipient: string;
    recipientLabel?: string;
    intervalDays: number;
  }
): Promise<void> {
  const now = new Date();
  const nextRunAt = new Date(now.getTime() + input.intervalDays * 24 * 60 * 60 * 1000);
  const payload: Omit<RecurringPayment, 'id'> = {
    label: input.label,
    amount: input.amount,
    token: input.token,
    recipient: input.recipient,
    recipientLabel: input.recipientLabel,
    intervalDays: input.intervalDays,
    nextRunAt: nextRunAt.toISOString(),
    createdAt: now.toISOString(),
    active: true,
  };
  await addDoc(collection(db, `users/${address}/recurring`), payload);
}

export async function markRecurringPaymentRun(
  address: string,
  id: string,
  txId?: string
): Promise<void> {
  const next = new Date();
  // caller is responsible for adding the correct interval before persisting
  await updateDoc(doc(db, `users/${address}/recurring/${id}`), {
    lastRunAt: next.toISOString(),
    lastTxId: txId ?? null,
  });
}

export async function rescheduleRecurringPayment(
  address: string,
  id: string,
  nextRunAtIso: string
): Promise<void> {
  await updateDoc(doc(db, `users/${address}/recurring/${id}`), { nextRunAt: nextRunAtIso });
}

export async function toggleRecurringPayment(address: string, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, `users/${address}/recurring/${id}`), { active });
}

export async function deleteRecurringPayment(address: string, id: string): Promise<void> {
  await deleteDoc(doc(db, `users/${address}/recurring/${id}`));
}
