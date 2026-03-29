// @ts-nocheck
import { get, set } from "idb-keyval";
import type { WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";

const CONTACTS_KEY = "chat_contacts_cache";
const MESSAGES_PREFIX = "chat_messages_";

export async function getCachedContacts(): Promise<WhatsAppContact[]> {
  try {
    return (await get(CONTACTS_KEY)) || [];
  } catch {
    return [];
  }
}

export async function setCachedContacts(contacts: WhatsAppContact[]) {
  try {
    await set(CONTACTS_KEY, contacts.slice(0, 50));
  } catch {}
}

export async function getCachedMessages(contactId: string): Promise<WhatsAppMessage[]> {
  try {
    return (await get(MESSAGES_PREFIX + contactId)) || [];
  } catch {
    return [];
  }
}

export async function setCachedMessages(contactId: string, messages: WhatsAppMessage[]) {
  try {
    await set(MESSAGES_PREFIX + contactId, messages.slice(-100));
  } catch {}
}
