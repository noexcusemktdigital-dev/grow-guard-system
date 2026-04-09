

# Atualizar `verify_jwt` no `supabase/config.toml`

Alterar 4 entradas existentes para `verify_jwt = false`:

- `ads-sync-metrics`: `true` → `false`
- `ads-get-config`: já é `false` (sem mudança)
- `ads-oauth-callback`: já é `false` (sem mudança)
- `meta-ads-insights`: já é `false` (sem mudança)

**Única mudança real**: `ads-sync-metrics` de `verify_jwt = true` para `verify_jwt = false`.

