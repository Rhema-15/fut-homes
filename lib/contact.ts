// Rhema's WhatsApp, for reports and agent sign-ups (concierge launch:
// no forms or tables, everything comes to WhatsApp).
export const FUT_HOMES_WHATSAPP = "2349133615232";

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
