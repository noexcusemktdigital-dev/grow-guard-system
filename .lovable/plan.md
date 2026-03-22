

# Configurar Secrets do Google Ads

## Situação

Preciso configurar 3 secrets no backend (Edge Functions) e 1 variável no frontend. Porém, no modo atual (planejamento), não consigo adicionar secrets — isso será feito na implementação.

## O que será configurado

### Backend (Edge Functions) — 3 secrets
Esses secrets ficam disponíveis para as Edge Functions (`ads-oauth-callback`, `ads-sync-metrics`):

| Secret | Onde obter |
|--------|-----------|
| `GOOGLE_ADS_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | Mesmo local acima (Client Secret) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads MCC → Tools → API Center |

### Frontend — 1 variável
| Variável | Uso |
|----------|-----|
| `VITE_GOOGLE_ADS_CLIENT_ID` | Usada no `getOAuthUrl()` para montar a URL de consentimento OAuth no navegador do cliente. Valor idêntico ao `GOOGLE_ADS_CLIENT_ID`. |

A variável `VITE_` será adicionada diretamente no código como constante de ambiente (é uma chave pública — Client ID OAuth não é secret).

## Implementação

1. Usar a ferramenta `add_secret` para solicitar ao usuário os 3 valores: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`
2. Adicionar `VITE_GOOGLE_ADS_CLIENT_ID` no `.env` do projeto (ou como fallback hardcoded caso o `.env` seja auto-gerenciado)
3. Verificar que o `getOAuthUrl()` em `useAdPlatforms.ts` lê corretamente `import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID`

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Secrets do projeto | Adicionar 3 secrets backend |
| `src/hooks/useAdPlatforms.ts` | Confirmar leitura do `VITE_GOOGLE_ADS_CLIENT_ID` (já implementado) |

