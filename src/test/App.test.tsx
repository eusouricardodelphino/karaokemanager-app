import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";

// Mock heavy Firebase-connected pages, keeping only routing logic under test
vi.mock("../pages/Home", () => ({ default: () => <div>Home Page</div> }));
vi.mock("../pages/AddToQueue", () => ({ default: () => <div>AddToQueue Page</div> }));
vi.mock("../pages/Settings", () => ({ default: () => <div>Settings Page</div> }));
vi.mock("../pages/Login", () => ({ default: () => <div>Login Page</div> }));
vi.mock("../pages/SignUp", () => ({ default: () => <div>SignUp Page</div> }));
vi.mock("../pages/GuestSignIn", () => ({ default: () => <div>GuestSignIn Page</div> }));
vi.mock("../pages/NotFound", () => ({ default: () => <div>NotFound Page</div> }));

// ScrollToTop does a scrollTo which jsdom doesn't implement fully
vi.mock("../components/ScrollToTop", () => ({ ScrollToTop: () => null }));

describe("App Component - Routing", () => {
  // Helper: change the URL and render App
  const renderAt = (url: string) => {
    window.history.pushState({}, "", url);
    return render(<App />);
  };

  it("renders the Login page at /login", () => {
    renderAt("/login");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders the SignUp page at /signup", () => {
    renderAt("/signup");
    expect(screen.getByText("SignUp Page")).toBeInTheDocument();
  });

  it("renders the GuestSignIn page at /guest", () => {
    renderAt("/guest");
    expect(screen.getByText("GuestSignIn Page")).toBeInTheDocument();
  });

  it("renders the NotFound page for unknown routes", () => {
    renderAt("/this/does/not/exist/at/all");
    expect(screen.getByText("NotFound Page")).toBeInTheDocument();
  });
});
