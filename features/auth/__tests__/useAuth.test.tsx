"use client";

import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";

import { useAuth } from "../useAuth";

const signInMock = vi.fn();
const signUpMock = vi.fn();
const signOutMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: signInMock,
      signUp: signUpMock,
      signOut: signOutMock,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("signIn navigates on success", async () => {
  signInMock.mockResolvedValueOnce({ error: null });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    const response = await result.current.signIn("user@example.com", "pw");
    expect(response).toEqual({ success: true });
  });

  expect(pushMock).toHaveBeenCalledWith("/");
});

test("signOut navigates on success", async () => {
  signOutMock.mockResolvedValueOnce({ error: null });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    const response = await result.current.signOut();
    expect(response).toEqual({ success: true });
  });

  expect(pushMock).toHaveBeenCalledWith("/auth");
});
