import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TrialGuard } from "../components/TrialGuard";
import * as useTrialModule from "../hooks/useTrial";

vi.mock("@/hooks/useTrial", () => ({
  useTrial: vi.fn(),
}));

const renderGuard = (storeId = "store-1", children = <div>App Content</div>) =>
  render(
    <BrowserRouter>
      <TrialGuard storeId={storeId}>{children}</TrialGuard>
    </BrowserRouter>
  );

describe("TrialGuard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing while loading", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "loading", daysLeft: 0, trialDays: 30 });
    const { container } = renderGuard();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders expired screen when trial has ended", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "expired", daysLeft: 0, trialDays: 30 });
    renderGuard();
    expect(screen.getByText(/Período de teste encerrado/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver planos/i })).toBeInTheDocument();
  });

  it("renders children with yellow banner when trial is active", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "active", daysLeft: 20, trialDays: 30 });
    renderGuard();
    expect(screen.getByText(/período de teste/i)).toBeInTheDocument();
    expect(screen.getByText("App Content")).toBeInTheDocument();
  });

  it("renders children with red banner when expiring soon", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "expiring_soon", daysLeft: 3, trialDays: 30 });
    renderGuard();
    expect(screen.getByText(/expira em 3 dias/i)).toBeInTheDocument();
    expect(screen.getByText("App Content")).toBeInTheDocument();
  });

  it("renders children without banner when subscription is paid", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "paid", daysLeft: 0, trialDays: 30 });
    renderGuard();
    expect(screen.getByText("App Content")).toBeInTheDocument();
    expect(screen.queryByText(/período de teste/i)).not.toBeInTheDocument();
  });

  it("renders children without banner when no_trial", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "no_trial", daysLeft: 0, trialDays: 30 });
    renderGuard();
    expect(screen.getByText("App Content")).toBeInTheDocument();
  });

  it("shows singular 'dia' when 1 day left", () => {
    vi.mocked(useTrialModule.useTrial).mockReturnValue({ status: "expiring_soon", daysLeft: 1, trialDays: 30 });
    renderGuard();
    expect(screen.getByText(/expira em 1 dia\./i)).toBeInTheDocument();
  });
});
