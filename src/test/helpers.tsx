import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Re-export for convenience
export * from "@testing-library/react";
export { screen, fireEvent, waitFor } from "@testing-library/dom";


// Auth context mock type
interface AuthOverrides {
  user?: any;
  session?: any;
  profile?: any;
  role?: "super_admin" | "admin" | "franqueado" | "cliente_admin" | "cliente_user" | null;
  loading?: boolean;
}

const defaultAuth: AuthOverrides = {
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: false,
};

// Mock AuthContext value builder
export function buildAuthValue(overrides: AuthOverrides = {}) {
  const merged = { ...defaultAuth, ...overrides };
  return {
    user: merged.user,
    session: merged.session,
    profile: merged.profile,
    role: merged.role,
    loading: merged.loading ?? false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  };
}

// Fake user factory
export function fakeUser(id = "user-1") {
  return {
    id,
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };
}

interface ProviderOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  authOverrides?: AuthOverrides;
}

export function renderWithProviders(ui: ReactNode, options: ProviderOptions = {}) {
  const { route = "/", authOverrides, ...renderOptions } = options;

  window.history.pushState({}, "Test page", route);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
