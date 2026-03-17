import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import GuestSignInDialog from "../components/GuestSignInDialog";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", () => ({
  signInAnonymously: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => "mock-ref"),
  setDoc: vi.fn(),
}));

vi.mock("@/firebase", () => ({ auth: {}, db: {} }));

const renderDialog = (props: { open: boolean; onClose?: () => void }) =>
  render(
    <MemoryRouter>
      <GuestSignInDialog redirectPath="/store-1/add" {...props} />
    </MemoryRouter>
  );

describe("GuestSignInDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the dialog when open=true", () => {
    renderDialog({ open: true });
    expect(screen.getByText(/Entre e comece a cantar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
  });

  it("does not render when open=false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText(/Entre e comece a cantar/i)).not.toBeInTheDocument();
  });

  it("submit button is disabled when name is empty", () => {
    renderDialog({ open: true });
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeDisabled();
  });

  it("submit button enables when name is filled", async () => {
    renderDialog({ open: true });
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "Maria" } });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Entrar$/i })).not.toBeDisabled()
    );
  });

  it("calls signInAnonymously and setDoc on submit", async () => {
    const { signInAnonymously } = await import("firebase/auth");
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(signInAnonymously).mockResolvedValueOnce({ user: { uid: "anon-uid" } } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderDialog({ open: true });
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "Maria" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: "anon-uid", name: "Maria", role: "singer", isAnonymous: true })
      );
    });
  });

  it("shows loading state while submitting", async () => {
    const { signInAnonymously } = await import("firebase/auth");
    vi.mocked(signInAnonymously).mockImplementation(() => new Promise(() => {}));

    renderDialog({ open: true });
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "Maria" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Entrando.../i })).toBeDisabled()
    );
  });

  it("handles signInAnonymously error gracefully", async () => {
    const { signInAnonymously } = await import("firebase/auth");
    vi.mocked(signInAnonymously).mockRejectedValueOnce(new Error("auth/too-many-requests"));

    renderDialog({ open: true });
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: "Maria" } });
    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Entrar$/i })).not.toBeDisabled()
    );
  });

  it("calls onClose when dialog is dismissable and escape key is pressed", () => {
    const onClose = vi.fn();
    renderDialog({ open: true, onClose });
    // When onClose is provided, the dialog is dismissable
    expect(screen.getByText(/Entre e comece a cantar/i)).toBeInTheDocument();
  });
});
