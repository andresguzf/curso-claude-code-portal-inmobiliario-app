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
    render(
      <SessionMenu currentUser={null} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.getByRole("link", { name: "Ingresar" })).toBeVisible();
  });

  it("recuerda desde dónde se pulsó, para volver ahí después", () => {
    mocks.pathname = "/properties";

    render(
      <SessionMenu currentUser={null} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute(
      "href",
      "/login?next=%2Fproperties",
    );
  });

  it("no se enreda consigo mismo estando ya en el login", () => {
    mocks.pathname = "/login";

    render(
      <SessionMenu currentUser={null} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});

describe("SessionMenu con sesión", () => {
  it("saluda por el nombre y ofrece salir", () => {
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.getByText("María González")).toBeVisible();
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Ingresar" })).toBeNull();
  });

  it("lleva a la cuenta desde el nombre, que es donde se busca", () => {
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={0} isMobile={false} />,
    );

    expect(
      screen.getByRole("link", { name: /María González/ }),
    ).toHaveAttribute("href", "/account");
  });

  it("cierra la sesión y pide la página de nuevo al servidor", async () => {
    const user = userEvent.setup();

    mocks.logOut.mockResolvedValue(undefined);
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={0} isMobile={false} />,
    );
    await user.click(screen.getByRole("button", { name: "Salir" }));

    await waitFor(() => expect(mocks.logOut).toHaveBeenCalledTimes(1));
    // El header lo pinta el servidor: sin refresh seguiría mostrando la sesión.
    expect(mocks.refresh).toHaveBeenCalled();
  });
});

describe("SessionMenu — contador de guardadas", () => {
  it("no lo muestra a quien no ha iniciado sesión", () => {
    render(
      <SessionMenu currentUser={null} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.queryByRole("link", { name: /guardada/ })).toBeNull();
  });

  it("dice cuántas hay, no solo el número", () => {
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={3} isMobile={false} />,
    );

    const enlace = screen.getByRole("link", {
      name: "3 propiedades guardadas",
    });

    expect(enlace).toHaveTextContent("3");
    expect(enlace).toHaveAttribute("href", "/account#propiedades-interesadas");
  });

  it("concuerda en singular", () => {
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={1} isMobile={false} />,
    );

    expect(
      screen.getByRole("link", { name: "1 propiedad guardada" }),
    ).toBeInTheDocument();
  });

  it("se muestra también en cero, para no hacer saltar la barra", () => {
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={0} isMobile={false} />,
    );

    expect(
      screen.getByRole("link", { name: "0 propiedades guardadas" }),
    ).toBeInTheDocument();
  });
});

describe("SessionMenu — acceso a administración", () => {
  it("ofrece el panel a un ADMIN", () => {
    render(
      <SessionMenu
        currentUser={{ ...MARIA, role: "ADMIN" }}
        favoriteCount={0}
        isMobile={false}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Administración" }),
    ).toHaveAttribute("href", "/admin");
  });

  it("no lo menciona a un USER", () => {
    // Esconderlo es cortesía; quien protege es la guarda del servidor.
    render(
      <SessionMenu currentUser={MARIA} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.queryByRole("link", { name: "Administración" })).toBeNull();
  });

  it("tampoco a quien no ha iniciado sesión", () => {
    render(
      <SessionMenu currentUser={null} favoriteCount={0} isMobile={false} />,
    );

    expect(screen.queryByRole("link", { name: "Administración" })).toBeNull();
  });
});
