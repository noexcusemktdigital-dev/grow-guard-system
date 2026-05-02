import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/dom";
import { renderWithProviders } from "@/test/helpers";
import { WhatsAppProviderModules } from "../ClienteIntegracoesHelpers";

const noop = vi.fn();

const instances = [
  {
    id: "meta-1",
    organization_id: "org-1",
    instance_id: "phone-number-123",
    token: "",
    client_token: "",
    status: "connected",
    phone_number: "+55 11 90000-0001",
    webhook_url: "https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/whatsapp-cloud-webhook",
    label: "NoExcuse Oficial",
    provider: "whatsapp_cloud",
    base_url: null,
    waba_id: "waba-789",
    phone_number_id: "phone-number-123",
    business_account_id: "bm-456",
    verified_name: "NoExcuse Digital",
    cloud_metadata: { quality_rating: "GREEN", messaging_limit: "1K" },
    access_token_encrypted: "encrypted",
    created_at: "2026-05-02T00:00:00Z",
    updated_at: "2026-05-02T00:00:00Z",
  },
  {
    id: "izitech-1",
    organization_id: "org-1",
    instance_id: "noexcuse-comercial",
    token: "token",
    client_token: "api-key",
    status: "connected",
    phone_number: "+55 11 90000-0002",
    webhook_url: "https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/evolution-webhook/org-1",
    label: "Comercial Izitech",
    provider: "evolution",
    base_url: "https://evolution.example.com",
    created_at: "2026-05-02T00:00:00Z",
    updated_at: "2026-05-02T00:00:00Z",
  },
] as any[];

describe("WhatsAppProviderModules", () => {
  it("separates official Meta Cloud API from Izitech QR/Evolution operation", () => {
    renderWithProviders(
      <WhatsAppProviderModules
        instances={instances}
        isPending={false}
        projectId="gxrhdpbbxfipeopdyygn"
        onOpenMetaSetup={noop}
        onOpenIzitechSetup={noop}
        onCheckStatus={noop}
        onDisconnect={noop}
        onEdit={noop}
        onReconnect={noop}
        onReconfigureWebhook={noop}
      />,
    );

    expect(screen.getByText("WhatsApp Cloud API — Meta oficial")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp via Izitech")).toBeInTheDocument();

    expect(screen.getByText("NoExcuse Oficial")).toBeInTheDocument();
    expect(screen.getByText(/WABA ID/i)).toBeInTheDocument();
    expect(screen.getByText("waba-789")).toBeInTheDocument();
    expect(screen.getAllByText(/Phone Number ID/i).length).toBeGreaterThan(0);
    expect(screen.getByText("phone-number-123")).toBeInTheDocument();
    expect(screen.getAllByText(/whatsapp-cloud-webhook/i).length).toBeGreaterThan(0);

    expect(screen.getByText("Comercial Izitech")).toBeInTheDocument();
    expect(screen.getByText(/Instâncias conectadas por QR Code/i)).toBeInTheDocument();
  });
});
