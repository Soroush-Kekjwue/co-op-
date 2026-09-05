import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Loader2, Mail, UserRound } from "lucide-react";
import { Suspense, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ارسال کد تأیید ناموفق بود. دوباره تلاش کنید.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch {
      setError("کد تأیید واردشده نادرست است.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ورود به‌عنوان مهمان ناموفق بود.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="paper-grain min-h-screen bg-secondary/30">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <Link to="/" className="mb-8 flex flex-col items-center gap-3">
          <span className="vintage-stamp flex size-14 items-center justify-center bg-card font-display text-3xl">
            هـ
          </span>
          <span className="font-display text-2xl text-primary">هم‌بن</span>
          <span className="text-xs text-muted-foreground">
            از مزرعه تا سفره شما
          </span>
        </Link>

        <Card className="archival-frame border-border bg-card">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl">
                  ورود | عضویت
                </CardTitle>
                <CardDescription>
                  ایمیل خود را وارد کنید؛ کد تأیید برایتان ارسال می‌شود. با اولین
                  ورود، حساب عضویت هم‌بن شما ساخته می‌شود.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute right-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        dir="ltr"
                        className="pr-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowLeft className="size-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}

                  <div className="mt-5">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">
                          یا
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserRound className="ml-2 size-4" />
                      مرور سریع بدون عضویت (مهمان)
                    </Button>
                    <p className="mt-2 text-center text-[11px] leading-5 text-muted-foreground">
                      حساب مهمان فقط برای مرور فروشگاه است؛ برای ثبت سفارش و
                      ارسال پیام باید با ایمیل وارد شوید.
                    </p>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="mt-4 text-center">
                <CardTitle className="font-display text-xl">
                  کد تأیید را وارد کنید
                </CardTitle>
                <CardDescription dir="ltr">
                  {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          otp.length === 6 &&
                          !isLoading
                        ) {
                          const form = (e.target as HTMLElement).closest("form");
                          form?.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-3 text-center text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    کد دریافت نکردید؟{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => setStep("signIn")}
                    >
                      تلاش دوباره
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 size-4 animate-spin" />
                        در حال بررسی…
                      </>
                    ) : (
                      <>
                        تأیید و ورود
                        <ArrowLeft className="mr-2 size-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    تغییر ایمیل
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="link-archival">
            بازگشت به صفحه اصلی
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={null}>
      <Auth {...props} />
    </Suspense>
  );
}
