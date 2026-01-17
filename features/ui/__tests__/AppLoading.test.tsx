"use client";

import { render } from "@testing-library/react";

import Loading from "@/app/loading";

test("app loading renders nothing to avoid double spinners", () => {
  const { container } = render(<Loading />);

  expect(container).toBeEmptyDOMElement();
});
