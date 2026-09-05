/** Persian (fa-IR) and Toman formatting helpers. */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function formatNumber(value: number): string {
  return toPersianDigits(value.toLocaleString("en-US"));
}

/** Format a Toman price, e.g. 68000 → "۶۸,۰۰۰ تومان" */
export function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}

/** Compact price for cards: 1_450_000 → "۱٫۴۵ میلیون" */
export function formatTomanShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const text = m % 1 === 0 ? String(m) : m.toFixed(2).replace(/0+$/, "").replace(".", "٫");
    return `${toPersianDigits(text)} میلیون تومان`;
  }
  return formatToman(value);
}

const FA_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** Gregorian→Jalali conversion (integer arithmetic, no dependencies). */
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gDm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gDm[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/** Format a timestamp/ISO date as e.g. "۲۸ مرداد ۱۴۰۵" */
export function formatJalali(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${toPersianDigits(jd)} ${FA_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

/** Format an ISO date string (YYYY-MM-DD) without timezone shifts. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const [jy, jm, jd] = toJalali(y, m, d);
  return `${toPersianDigits(jd)} ${FA_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

// --- Domain label maps (single source of truth for UI text) ---

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  confirmed: "تأیید شده",
  processing: "در حال آماده‌سازی",
  ready: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "پرداخت در انتظار",
  paid: "پرداخت شده",
  failed: "پرداخت ناموفق",
  refunded: "بازگشت داده شده",
};

export const QUALITY_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  passed: "تأیید کیفیت",
  conditional: "تأیید مشروط",
  failed: "رد شده",
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: "ورود کالا",
  sale: "فروش",
  adjustment: "اصلاح",
  return: "بازگشت",
};

/** Tailwind badge classes per status (vintage palette). */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground border border-border",
  confirmed: "bg-card text-foreground border border-border",
  processing: "bg-accent/20 text-accent-foreground border border-accent/40",
  ready: "bg-accent/30 text-accent-foreground border border-accent/50",
  shipped: "bg-primary/15 text-primary border border-primary/40",
  delivered: "bg-primary/25 text-primary-foreground border border-primary",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/30",
  returned: "bg-destructive/15 text-destructive border border-destructive/40",
  paid: "bg-primary/20 text-primary border border-primary/40",
  failed: "bg-destructive/10 text-destructive border border-destructive/30",
  refunded: "bg-muted text-muted-foreground border border-border",
  passed: "bg-primary/15 text-primary border border-primary/40",
  conditional: "bg-accent/20 text-accent-foreground border border-accent/40",
};
