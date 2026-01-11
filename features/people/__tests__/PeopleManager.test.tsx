"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { PeopleManager } from "../PeopleManager";

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

vi.mock("@/features/auth/SessionProvider", () => ({
  useSession: () => ({
    session: { user: { id: "user-1", email: "owner@example.com" } },
    loading: false,
    error: null,
  }),
}));

test("owners can include a date of birth when creating a person", async () => {
  render(<PeopleManager />);

  const nameInput = await screen.findByPlaceholderText(/full name/i);
  const dobInput = screen.getByLabelText(/date of birth/i);
  const addButton = screen.getByRole("button", { name: /add person/i });

  await waitFor(() => {
    expect(addButton).toBeEnabled();
  });

  await userEvent.type(nameInput, "Ada Lovelace");
  await userEvent.type(dobInput, "1990-01-01");
  await userEvent.click(addButton);

  await waitFor(() => {
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        date_of_birth: "1990-01-01",
      }),
    );
  });
});
