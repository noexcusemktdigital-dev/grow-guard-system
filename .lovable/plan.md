

## Reestruturar Botão de Ajuda + FAQ + Chat de Suporte

### Problema
1. O ícone de suporte usa `LifeBuoy` em vez de um ícone de interrogação (?)
2. O popover atual apenas redireciona para a página de configurações -- não abre chat direto nem FAQ
3. Não existe página de FAQ dentro do portal do cliente
4. O fluxo de chamado/chat precisa ir diretamente para a matriz (organização pai)

### Solução

**1. Trocar ícone e redesenhar o popover (`SupportButton.tsx`)**
- Trocar `LifeBuoy` por `CircleHelp` (ícone de interrogação do Lucide)
- Popover com 2 opções claras:
  - "Falar com Suporte" → navega para `/cliente/suporte` (página de chamados com chat)
  - "Perguntas Frequentes (FAQ)" → navega para `/cliente/faq`

**2. Criar página de FAQ (`src/pages/cliente/ClienteFaq.tsx`)**
- Página com perguntas e respostas organizadas por categoria (Geral, CRM, Chat/WhatsApp, Créditos, Financeiro, Integrações)
- Layout accordion com busca por texto
- Dados hardcoded inicialmente (a matriz pode gerenciar depois via tabela)
- Rota: `/cliente/faq`

**3. Melhorar página de Suporte (`ClienteSuporte.tsx`)**
- Manter como está -- já funciona com tickets + chat por mensagens
- Os tickets já são vinculados à `organization_id` do cliente
- A matriz já visualiza via `get_network_tickets` RPC

**4. Registrar nova rota no App.tsx**
- Adicionar `<Route path="faq" element={<ClienteFaq />} />`

### Arquivos afetados
- `src/components/SupportButton.tsx` — trocar ícone e links
- `src/pages/cliente/ClienteFaq.tsx` — nova página de FAQ
- `src/App.tsx` — nova rota

### Detalhes técnicos
- O ícone muda de `LifeBuoy` para `CircleHelp` (Lucide)
- O FAQ usa dados estáticos organizados em categorias com accordion + campo de busca
- A navegação usa `useNavigate` do React Router
- A página de suporte existente já tem a arquitetura completa de chamados que vão para a matriz via `support_tickets` + `get_network_tickets`

