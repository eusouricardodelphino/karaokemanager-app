import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  setDoc: vi.fn(),
  doc: vi.fn(() => ({ id: "mock-doc-ref" })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("Owner SignUp (tab Sou uma loja)", () => {
  beforeEach(() => vi.clearAllMocks());

  const goToOwnerTab = () => {
    renderWithRouter(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /Sou uma loja/i }));
  };

  it("renders owner form when owner tab is selected", () => {
    goToOwnerTab();
    expect(screen.getByLabelText(/Nome da loja/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
  });

  it("submit button is disabled when owner form is empty", () => {
    goToOwnerTab();
    expect(screen.getByTestId("submit-button")).toBeDisabled();
  });

  it("submit button enables when owner form is filled", async () => {
    goToOwnerTab();
    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
  });

  it("calls createUserWithEmailAndPassword on owner form submit", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const { setDoc, addDoc, updateDoc } = await import("firebase/firestore");
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "owner-uid", email: "bar@ze.com" },
    } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "store-id" } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    goToOwnerTab();
    fireEvent.change(screen.getByLabelText(/Nome da loja/i), { target: { value: "Bar do Zé" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "bar@ze.com" } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: "senha123" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "bar@ze.com",
        "senha123"
      );
    });
  });
});
