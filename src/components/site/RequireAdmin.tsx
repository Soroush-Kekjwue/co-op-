import { api } from "@/convex/_generated/api";
import { useQuery as useQueryCompat, useMutation as useMutationCompat } from "convex/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();

  const bootstrap = api.admin.bootstrapStatus;
  const status = useQueryCompat(bootstrap);

  if (isLoading || status === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  // Owner flow: no admin exists yet → first real (non-anonymous) account can claim it.
  if (!status.hasAdmin) {
    if (user?.isAnonymous) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle className="font-display">دسترسی مدیریتی</CardTitle>
              <CardDescription>
                برای ایجاد حساب مدیر، با ایمیل واقعی وارد شوید.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      );
    }
    return <AdminClaim />;
  }

  if (user?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="font-display">دسترسی غیرمجاز</CardTitle>
            <CardDescription>
              این بخش فقط برای مدیر تعاونی است.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return children;
}

function AdminClaim() {
  const { user } = useAuth();
  const claim = useMutationCompat(api.admin.bootstrapAccount);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      await claim({});
      // role refresh happens reactively via the auth query
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد حساب مدیر.");
      setClaiming(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="font-display">ایجاد حساب مدیر</CardTitle>
          <CardDescription>
            هنوز هیچ مدیر برای این فروشگاه تعریف نشده است. با تأیید این
            بخش، حساب فعلی شما ({user?.email}) به مدیر تعاونی تبدیل می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={claiming} onClick={handleClaim}>
            {claiming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "این حساب را مدیر کن"
            )}
          </Button>
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            این کار فقط یک‌بار امکان‌پذیر است؛ پس از آن، نقش مدیر فقط از
            سرور قابل تغییر است.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
