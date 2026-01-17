"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ProfileCompletionScreen } from "../ProfileCompletionScreen";

const updateEqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const queryChain = {} as {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

queryChain.select = vi.fn(() => queryChain);
queryChain.eq = vi.fn(() => queryChain);
queryChain.is = vi.fn(() => queryChain);
const maybeSingleMock = vi.fn().mockResolvedValue({
  data: { id: "person-1", date_of_birth: null, gender: null },
  error: null,
});
queryChain.maybeSingle = maybeSingleMock;
queryChain.update = updateMock;

const supabaseMock = {
  from: vi.fn(() => queryChain),
};

const pushMock = vi.fn();
const routerMock = { push: pushMock, replace: pushMock };

vi.mock("@/features/core/supabaseClient", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}));

const sessionMock = { user: { id: "user-1", email: "owner@example.com" } };
const sessionState = {
  session: sessionMock,
  loading: false,
  error: null as Error | null,
};

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => sessionState,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

test("requires date of birth and gender before enabling submit", async () => {
  render(<ProfileCompletionScreen />);

  const dobInput = await screen.findByLabelText(/date of birth/i);
  const genderSelect = screen.getByLabelText(/gender/i);
  const submitButton = screen.getByRole("button", {
    name: /save profile/i,
  });

  expect(submitButton).toHaveAttribute("data-slot", "button");
  expect(submitButton).toBeDisabled();

  fireEvent.change(dobInput, { target: { value: "1990-01-01" } });
  fireEvent.change(genderSelect, { target: { value: "female" } });

  await waitFor(() => {
    expect(submitButton).toBeEnabled();
  });
});

test("submits profile updates and redirects", async () => {
  render(<ProfileCompletionScreen />);

  const dobInput = await screen.findByLabelText(/date of birth/i);
  const genderSelect = screen.getByLabelText(/gender/i);
  const submitButton = screen.getByRole("button", {
    name: /save profile/i,
  });

  fireEvent.change(dobInput, { target: { value: "1991-02-03" } });
  fireEvent.change(genderSelect, { target: { value: "male" } });
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(updateMock).toHaveBeenCalledWith({
      date_of_birth: "1991-02-03",
      gender: "male",
    });
  });

  await waitFor(() => {
    expect(updateEqMock).toHaveBeenCalledWith("id", "person-1");
  });

  await waitFor(() => {
    expect(pushMock).toHaveBeenCalledWith("/people");
  });
});

test("profile completion uses shared loading state while session loads", () => {
  sessionState.loading = true;

  render(<ProfileCompletionScreen />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();

  sessionState.loading = false;
});
