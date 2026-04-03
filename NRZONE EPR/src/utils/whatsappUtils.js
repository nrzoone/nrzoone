/**
 * WhatsApp Utility for NRZONE Factory ERP
 * Handles automated production alerts, payments, and summaries.
 */

const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.startsWith("880") ? cleaned : "880" + cleaned.replace(/^0/, "");
};

/**
 * Open a WhatsApp message window
 */
export const sendWhatsApp = (phone, message) => {
    const intl = formatPhone(phone);
    if (!intl) return false;
    const url = `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    return true;
};

/**
 * Automated Production Alert
 * Sends: "ধন্যবাদ [নাম], আপনার [১০টি] মাল জমা নেওয়া হয়েছে। আপনার আজকের অর্জিত বিল: [৫০০] টাকা।"
 */
export const sendProductionAlert = (name, amount, bill, phone) => {
    const msg = `ধন্যবাদ ${name}, আপনার [${amount}টি] মাল জমা নেওয়া হয়েছে।\nআপনার আজকের অর্জিত বিল: [${bill}] টাকা। \n\nNRZOONE FACTORY LOGISTICS`;
    return sendWhatsApp(phone, msg);
};

/**
 * Weekly Summary Alert
 * Sends: "এই সপ্তাহে মোট কাজ: [৫০টি], মোট বিল: [৫০০০ টাকা], অগ্রিম কাটা হয়েছে: [১০০০ টাকা], আপনার বর্তমান পাওনা: [৪০০০ টাকা]।"
 */
export const sendWeeklySummary = (name, stats, phone) => {
    const { totalQty, totalBill, paid, balance } = stats;
    const msg = `সালাম ${name}, আপনার সাপ্তাহিক কাজের সামারি:\n\n` +
                `এই সপ্তাহে মোট কাজ: [${totalQty}টি]\n` +
                `মোট বিল: [${totalBill} টাকা]\n` +
                `অগ্রিম নেওয়া হয়েছে: [${paid} টাকা]\n` +
                `আপনার বর্তমান পাওনা: [${balance} টাকা]\n\n` +
                `শুভেচ্ছান্তে,\nNRZOONE MANAGEMENT`;
    return sendWhatsApp(phone, msg);
};

/**
 * Interaction Receipt (Template with fake interactive format)
 * WhatsApp web-link doesn't support real buttons, so we use clear text triggers.
 */
export const sendInteractionReceipt = (name, type, amount, phone) => {
    const msg = `সালাম ${name},\nআপনার ${type} বাবদ [${amount} টাকা] জমা প্রদান করা হয়েছে।\n\n` +
                `সঠিক হলে নিচের লিংকে ক্লিক করুন:\n` +
                `[সঠিক] - wa.me/8801XXXXXXXXX?text=CONFIRM_${Date.now()}\n` +
                `[ভুল আছে] - wa.me/8801XXXXXXXXX?text=FLAG_${Date.now()}\n\n` +
                `NRZOONE FINANCE`;
    return sendWhatsApp(phone, msg);
};
