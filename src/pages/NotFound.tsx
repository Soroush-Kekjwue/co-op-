import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col bg-background"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="vintage-stamp mb-6 flex size-16 items-center justify-center font-display text-3xl">
          هـ
        </span>
        <h1 className="font-display text-6xl font-extrabold text-primary">
          ۴۰۴
        </h1>
        <p className="mt-3 font-display text-xl font-bold">
          این صفحه پیدا نشد
        </p>
        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          آدرسی که دنبال آن هستید وجود ندارد یا جابه‌جا شده است. از فروشگاه
          هم‌بن دیدن کنید.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/shop">
              <Sprout className="size-4" />
              مشاهده محصولات
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">صفحه اصلی</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
