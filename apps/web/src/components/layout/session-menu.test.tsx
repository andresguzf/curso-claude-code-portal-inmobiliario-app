import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  logOut: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ logOut: mocks.logOut }));
vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({
    refresh: mocks.refresh,
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

import { SessionMenu } from "./session-menu";

const MARIA = {
  id: "u1",
  name: "María González",
  email: "maria@example.com",
  role: "USER",
} as const;

afterEach(() => {
  mocks.pathname = "/";
  mocks.logOut.mockReset();
  mocks.refresh.mockReset();
});

describe("SessionMenu sin sesión", () => {
  it("ofrece entrar", () => {
    render(<SessionMenu currentUser={null} isMobile={false} />);

    expect(screen.getByRole("link", { name: "Ingresar" })).toBeVisible();
  });

  it("recuerda desde dónde se pulsó, para volver ahí después", () => {
    mocks.pathname = "/properties";

    render(<SessionMenu currentUser={null} isMobile={false} />);

    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute(
      "href",
      "/login?next=%2Fproperties",
    );
  });

  it("no se enreda consigo mismo estando ya en el login", () => {
    mocks.pathname = "/login";

    render(<SessionMenu currentUser={null} isMobile={false} />);

    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});

describe("SessionMenu con sesión", () => {
  it("saluda por el nombre y ofrece salir", () => {
    render(<SessionMenu currentUser={MARIA} isMobile={false} />);

    expect(screen.getByText("María González")).toBeVisible();
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Ingresar" })).toBeNull();
  });

  it("cierra la sesión y pide la página de nuevo al servidor", async () => {
    const user = userEvent.setup();

    mocks.logOut.mockResolvedValue(undefined);
    render(<SessionMenu currentUser={MARIA} isMobile={false} />);
    await user.click(screen.getByRole("button", { name: "Salir" }));

    await waitFor(() => expect(mocks.logOut).toHaveBeenCalledTimes(1));
    // El header lo pinta el servidor: sin refresh seguiría mostrando la sesión.
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
