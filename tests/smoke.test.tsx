import { describe, expect, it } from 'vitest';
import { render, screen } from "@testing-library/react";

describe("test setup", () => {
  it("provides jsdom and jest-dom matchers", () => {
    render(<div>Hello, Copymind</div>);

    expect(screen.getByText("Hello, Copymind")).toBeInTheDocument();
  });
});
