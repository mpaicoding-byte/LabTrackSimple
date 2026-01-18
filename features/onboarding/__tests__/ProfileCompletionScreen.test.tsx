"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ProfileCompletionScreen } from "../ProfileCompletionScreen";

let mockedSelectedDate: Date | undefined;

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

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect?: (date: Date | undefined) => void }) => (
    <button
      type="button"
      data-testid="calendar-mock"
      onClick={() => onSelect?.(mockedSelectedDate)}
    />
  ),
}));

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

test("shows validation errors when required fields are missing", async () => {
  render(<ProfileCompletionScreen />);

  const submitButton = await screen.findByRole("button", {
    name: /save profile/i,
  });

  await userEvent.click(submitButton);

  expect(await screen.findByText(/date of birth is required/i)).toBeInTheDocument();
  expect(screen.getByText(/gender is required/i)).toBeInTheDocument();
  expect(updateMock).not.toHaveBeenCalled();
});

test("submits profile updates and redirects", async () => {
  render(<ProfileCompletionScreen />);

  const dobTrigger = await screen.findByLabelText(/date of birth/i);
  const genderTrigger = screen.getByLabelText(/gender/i);
  const submitButton = screen.getByRole("button", {
    name: /save profile/i,
  });

  await userEvent.click(dobTrigger);
  const today = new Date();
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), 1);
  mockedSelectedDate = selectedDate;
  await userEvent.click(screen.getByTestId("calendar-mock"));
  await userEvent.click(genderTrigger);
  await userEvent.click(screen.getByRole("option", { name: /^male$/i }));
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(updateMock).toHaveBeenCalledWith({
      date_of_birth: formatDateValue(selectedDate),
      gender: "male",
    });
  });

  await waitFor(() => {
    expect(updateEqMock).toHaveBeenCalledWith("id", "person-1");
  });

  await waitFor(() => {
    expect(pushMock).toHaveBeenCalledWith("/people");
  });
  expect(toastMock.success).toHaveBeenCalled();
});

test("profile completion uses shared loading state while session loads", () => {
  sessionState.loading = true;

  render(<ProfileCompletionScreen />);

  expect(screen.getByTestId("loading-state")).toBeInTheDocument();

  sessionState.loading = false;
});
