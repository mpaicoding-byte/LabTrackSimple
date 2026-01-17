import { render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/button";

test("renders child element when asChild is true", () => {
  const AnyButton = Button as React.ComponentType<Record<string, unknown>>;

  render(
    <AnyButton asChild>
      <a href="/auth">Go to Sign In</a>
    </AnyButton>,
  );

  const link = screen.getByRole("link", { name: /go to sign in/i });
  expect(link).toHaveAttribute("href", "/auth");
  expect(screen.queryByRole("button", { name: /go to sign in/i })).toBeNull();
});

test("default button uses shadcn base styling", () => {
  render(<Button>Continue</Button>);

  const button = screen.getByRole("button", { name: /continue/i });
  expect(button).toHaveClass("rounded-md");
  expect(button).toHaveClass("bg-primary");
});
