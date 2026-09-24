"use client";

import { useActionState } from "react";

import { signIn, type SignInState } from "../actions";

const initialState: SignInState = { error: null, email: "" };

const field =
  "mt-1 block w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-base text-ink";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={field}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="text-sm font-semibold text-ink">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
