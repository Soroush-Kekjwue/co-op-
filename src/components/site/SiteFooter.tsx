import { Link } from "react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/80 bg-card/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="vintage-stamp flex size-9 items-center justify-center font-display text-lg">
              هـ
            </span>
            <span className="font-display text-xl text-primary">هم‌بن</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            هم‌بن پلی است میان تولیدکنندگان منتخب و خانوارها؛ هر محصول با منشأ
            مشخص، شماره بچ ثبت‌شده و کنترل کیفیت مستند به دست شما می‌رسد.
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold">دسترسی سریع</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="link-archival hover:text-primary">
                فروشگاه
              </Link>
            </li>
            <li>
              <Link
                to="/shop?filter=seasonal"
                className="link-archival hover:text-primary"
              >
                محصولات فصلی
              </Link>
            </li>
            <li>
              <Link to="/cart" className="link-archival hover:text-primary">
                سبد خرید
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="link-archival hover:text-primary">
                پیشخوان من
              </Link>
            </li>
            <li>
              <Link to="/account" className="link-archival hover:text-primary">
                سفارش‌های من
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold">اعتماد و اصالت</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>✦ منشأ مشخص برای هر محصول</li>
            <li>✦ شماره بچ و تاریخ برداشت ثبت‌شده</li>
            <li>✦ کنترل کیفیت پیش از عرضه</li>
            <li>✦ پاسخ مستقیم تیم هم‌بن به پرسش‌های شما</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} هم‌بن — از مزرعه تا سفره شما
      </div>
    </footer>
  );
}
