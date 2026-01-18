"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { PeopleManager } from "../PeopleManager";

let mockedSelectedDate: Date | undefined;

vi.mock("next/navigation", () => ({
  usePathname: () => "/people",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const insertMock = vi.fn().mockResolvedValue({ error: null });

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === "household_members") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { household_id: "household-1", role: "owner" },
          error: null,
        }),
      };
    }

    if (table === "people") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: insertMock,
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
  }),
};

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

beforeEach(() => {
  insertMock.mockClear();
  toastMock.success.mockClear();
  toastMock.error.mockClear();
});

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sessionMock = { user: { id: "user-1", email: "owner@example.com" } };

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: sessionMock,
    loading: false,
    error: null,
  }),
}));

test("owners can include a date of birth and gender when creating a person", async () => {
  render(<PeopleManager />);

  const startButton = await screen.findByRole("button", {
    name: /add family member/i,
  });
  await userEvent.click(startButton);

  const nameInput = await screen.findByLabelText(/full name/i);
  const dobTrigger = screen.getByLabelText(/date of birth/i);
  const genderTrigger = screen.getByLabelText(/gender/i);
  const addButton = screen.getByRole("button", { name: /save person/i });

  await userEvent.type(nameInput, "Ada Lovelace");
  await userEvent.click(dobTrigger);
  const today = new Date();
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), 10);
  mockedSelectedDate = selectedDate;
  await userEvent.click(screen.getByTestId("calendar-mock"));
  await userEvent.click(genderTrigger);
  await userEvent.click(screen.getByRole("option", { name: /female/i }));

  await userEvent.click(addButton);

  await waitFor(() => {
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        date_of_birth: formatDateValue(selectedDate),
        gender: "female",
      }),
    );
  });
  expect(toastMock.success).toHaveBeenCalled();
});

test("shows validation errors when required fields are missing", async () => {
  render(<PeopleManager />);

  const startButton = await screen.findByRole("button", {
    name: /add family member/i,
  });
  await userEvent.click(startButton);

  const addButton = screen.getByRole("button", { name: /save person/i });
  await userEvent.click(addButton);

  expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
  expect(screen.getByText(/gender is required/i)).toBeInTheDocument();
  expect(insertMock).not.toHaveBeenCalled();
});
