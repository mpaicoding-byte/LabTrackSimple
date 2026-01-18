import { Eye, EyeOff, Loader2 } from "lucide-react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export type LoginFormMode = "sign-in" | "sign-up"

export type LoginFormValues = {
  email: string
  password: string
  householdName?: string
}

export function LoginForm({
  className,
  mode,
  onModeChange,
  onSubmit,
  register,
  errors,
  loading = false,
  authError,
  showPassword,
  onTogglePassword,
  ...props
}: React.ComponentProps<"div"> & {
  mode: LoginFormMode
  onModeChange: (mode: LoginFormMode) => void
  onSubmit: React.FormEventHandler<HTMLFormElement>
  register: UseFormRegister<LoginFormValues>
  errors: FieldErrors<LoginFormValues>
  loading?: boolean
  authError?: string | null
  showPassword: boolean
  onTogglePassword: () => void
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {mode === "sign-in"
              ? "Login with your Apple or Google account"
              : "Sign up with your Apple or Google account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" disabled className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Apple
                </Button>
                <Button variant="outline" type="button" disabled className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="ml-auto h-auto px-0 text-xs"
                    disabled
                  >
                    Forgot your password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    aria-invalid={Boolean(errors.password)}
                    className="pr-10"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <Button
                    type="button"
                    onClick={onTogglePassword}
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <FieldDescription className="text-destructive">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>
              {mode === "sign-up" && (
                <Field>
                  <FieldLabel htmlFor="household">
                    Household name{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Input
                    id="household"
                    type="text"
                    placeholder="e.g., The Smith Family"
                    {...register("householdName")}
                  />
                </Field>
              )}
              {authError && (
                <div className="rounded-md border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {authError}
                </div>
              )}
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "sign-in" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : mode === "sign-in" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        {mode === "sign-in" ? (
          <p>
            Don&apos;t have an account?{" "}
            <Button
              variant="link"
              className="h-auto px-0"
              onClick={() => onModeChange("sign-up")}
            >
              Create account
            </Button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Button
              variant="link"
              className="h-auto px-0"
              onClick={() => onModeChange("sign-in")}
            >
              Sign in
            </Button>
          </p>
        )}
        <FieldDescription className="text-center">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>.
        </FieldDescription>
      </div>
    </div>
  )
}
