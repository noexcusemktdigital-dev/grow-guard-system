# Glossário Técnico e de Negócio — Sistema Noé

> Documento de referência em PT-BR. Ordem alfabética.
> Veja também: [ARCHITECTURE.md](ARCHITECTURE.md) | [SECURITY-POLICY.md](SECURITY-POLICY.md) | [docs/runbooks/](runbooks/) | [docs/adr/](adr/)

---

## Termos de Negócio

### Apresentação (compartilhável)
Documento ou página gerada pelo sistema e compartilhada publicamente com um cliente externo via link único (token de curta duração). Não requer autenticação; acesso é controlado por token assinado. Ver ADR de acesso público e runbook de compartilhamento.

### Charge (Asaas)
Cobrança individual gerada na plataforma Asaas (gateway de pagamento). Cada `charge` representa uma fatura ou boleto associado a um `Plan` ou `Pack` de créditos. Status possíveis: `PENDING`, `CONFIRMED`, `OVERDUE`, `CANCELLED`.

### Cliente (org type)
Tipo de organização (`Org`) que representa o cliente final da rede de franquias. Possui acesso restrito ao **Portal do Cliente** — apenas visualização de dados próprios. Não confundir com `franqueado`. Ver também: `Org`, `Tenant Isolation`.

### Funil
Sequência de estágios (`Stage`) pela qual um `Lead` percorre até se tornar cliente ativo. Cada franqueado configura seu próprio funil; dados são isolados por tenant. Ver `Lead`, `Stage`.

### Franqueado
Usuário do tipo `franqueado` ou `franqueado_master` dentro de uma `Org` de rede de franquias. Gerencia suas próprias operações, leads e equipe dentro dos limites de sua unidade. Subordinado ao `Franqueador`. Ver roles: `franqueado`, `franqueado_master`.

### Franqueador
Entidade que administra a rede de franquias. No sistema, corresponde ao papel de `admin` ou `gestor_marca`, com acesso a dados agregados de múltiplos franqueados. Responsável pela configuração de planos e regras da rede.

### Lead
Potencial cliente registrado no CRM. Possui `stage` (etapa do funil), histórico de interações e scoring de qualificação. Associado a um franqueado específico via `RLS`. Ver `Stage`, `Funil`.

### Membership (organization_memberships)
Tabela de junção que vincula um usuário (`auth.users`) a uma `Org` com um papel específico (`role`). Um usuário pode ter memberships em múltiplas orgs com roles diferentes. Rege o acesso multi-tenant via `RLS`.

### Org (organization)
Unidade organizacional central do sistema. Pode representar uma rede de franquias inteira, uma franquia individual ou um cliente. Toda entidade de negócio está subordinada a uma `Org`. Ver `Tenant Isolation`, `Multi-tenant SaaS`.

### Pack (créditos)
Pacote de créditos pré-pago que uma `Org` adquire para consumir funcionalidades do sistema (ex: disparos de WhatsApp, relatórios avançados). Associado a um `Charge` no Asaas. Saldo decrementado por consumo.

### Plan
Plano de assinatura contratado por uma `Org`. Define limites de uso, funcionalidades habilitadas e valor recorrente. Gera `Charges` periódicos via Asaas. Ver `Pack`, `Charge`.

### Stage
Etapa do funil de vendas à qual um `Lead` está associado. Ex: `novo`, `qualificado`, `proposta`, `fechado`. Configurável por franqueado; muda ao longo do ciclo comercial. Ver `Funil`, `Lead`.

---

## Termos Técnicos

### Assertion (Lighthouse CI)
Regra de qualidade configurada no Lighthouse CI que define um valor mínimo ou máximo para uma métrica de performance (ex: `lcp < 2500ms`, `cls < 0.1`). Falha na assertion bloqueia o merge do PR. Ver `CWV`, [PERFORMANCE.md](PERFORMANCE.md).

### BOLA (Broken Object Level Authorization)
Vulnerabilidade em que uma API retorna ou modifica dados de outro tenant por ausência de verificação de propriedade do objeto. Mitigado no sistema via `RLS` + helper `assertOwnership` em todas as Edge Functions. Ver `RLS`, [SECURITY-POLICY.md](SECURITY-POLICY.md), [docs/audits/](audits/).

### Chain of Trust (CORS allowlist)
Cadeia de origens confiáveis configuradas no header `Access-Control-Allow-Origin` das Edge Functions. Apenas domínios na allowlist podem realizar chamadas autenticadas. Qualquer origem não listada recebe `403`. Ver [SECURITY-POLICY.md](SECURITY-POLICY.md).

### Correlation ID (x-request-id)
Header HTTP (`x-request-id`) propagado em toda a cadeia de chamadas — frontend → Edge Function → integrações externas. Permite rastrear uma requisição de ponta a ponta nos logs. Gerado no cliente com `crypto.randomUUID()` se ausente. Ver `DLQ`, [docs/runbooks/](runbooks/).

### DLQ (Dead Letter Queue, job_failures)
Fila de reprocessamento para jobs que falharam após todos os retries configurados. No sistema, a tabela `job_failures` (ou equivalente) registra o payload, erro e timestamp de cada falha. Monitorada via alertas automáticos. Ver `Correlation ID`, [ARCHITECTURE.md](ARCHITECTURE.md).

### DSR (Data Subject Request, LGPD Art. 18)
Requisição formal de titular de dados conforme Art. 18 da LGPD. O sistema expõe endpoints para: acesso, retificação, portabilidade, anonimização e exclusão de dados pessoais. Processado pelo módulo `lgpd-dsr`. Ver `Soft-delete`, `LGPD`, [SECURITY-POLICY.md](SECURITY-POLICY.md).

### Edge Function (Supabase, Deno)
Função serverless executada no runtime Deno dentro da infraestrutura Supabase. Cada função é um handler HTTP isolado, sem estado compartilhado entre invocações. Usada para lógica de backend, webhooks e integrações externas. Configuração: `verify_jwt` sempre `false` (autenticação manual). Ver [ARCHITECTURE.md](ARCHITECTURE.md).

### HMAC SHA-256 (webhook)
Algoritmo de autenticação de mensagens usado para validar a origem de webhooks recebidos (Meta, WhatsApp, Asaas). O payload é assinado com uma chave secreta compartilhada; o receptor recomputa o hash e rejeita se divergir. Implementado no helper `verifyHmac`. Ver [SECURITY-POLICY.md](SECURITY-POLICY.md).

### Idempotency-Key (header)
Header HTTP (`Idempotency-Key`) enviado pelo cliente para garantir que requisições repetidas (retry, falha de rede) não causem efeitos duplicados. O servidor armazena a resposta da primeira requisição com aquela chave e a reutiliza nas seguintes. Ver `Correlation ID`, [docs/runbooks/](runbooks/).

### Multi-tenant SaaS
Arquitetura em que múltiplos clientes (tenants/`Org`) compartilham a mesma infraestrutura, mas com isolamento completo de dados. O isolamento é garantido por `RLS` no PostgreSQL e por `Tenant Isolation` nas Edge Functions. Ver `RLS`, `Tenant Isolation`, [ARCHITECTURE.md](ARCHITECTURE.md).

### PWA (Progressive Web App)
Aplicação web instalável com suporte offline, notificações push e ícone na tela inicial. O sistema implementa PWA via `vite-plugin-pwa` com Service Worker, manifesto JSON e cache de assets estáticos. Ver [ARCHITECTURE.md](ARCHITECTURE.md), [docs/adr/](adr/).

### Rate Limit (sliding window)
Controle de taxa de requisições baseado em janela deslizante. Cada IP ou usuário tem um limite de N requisições por janela de tempo (ex: 60 req/min). Implementado nas Edge Functions via contador em memória ou Supabase. Retorna `429 Too Many Requests` ao exceder. Ver [SECURITY-POLICY.md](SECURITY-POLICY.md).

### RLS (Row Level Security)
Funcionalidade do PostgreSQL que aplica políticas de acesso a nível de linha. Cada `SELECT`, `INSERT`, `UPDATE` e `DELETE` é filtrado automaticamente pela política da tabela, baseada no `auth.uid()` e `org_id` do usuário autenticado. Linha de defesa primária contra `BOLA`. Ver [ARCHITECTURE.md](ARCHITECTURE.md), [docs/audits/rls-audit-2026-05-01.md](rls-audit-2026-05-01.md).

### Soft-delete (deleted_at)
Padrão de exclusão lógica em que o registro não é removido fisicamente do banco, mas recebe um timestamp em `deleted_at`. Consultas padrão filtram `WHERE deleted_at IS NULL`. Necessário para conformidade com `DSR`/`LGPD` (rastreabilidade) e recuperação de dados. Ver `DSR`.

### Tenant Isolation
Garantia de que dados de um tenant (`Org`) jamais são acessíveis por outro. Implementado em duas camadas: `RLS` no banco e verificação explícita de `org_id` em cada Edge Function. Falha em qualquer camada constitui `BOLA`. Ver `Multi-tenant SaaS`, `RLS`.

### Tipos Primitivos (Tables<>, TablesInsert<>)
Tipos TypeScript gerados automaticamente pelo Supabase CLI a partir do schema do banco (`database.types.ts`). `Tables<'nome_tabela'>` representa uma linha de leitura; `TablesInsert<'nome_tabela'>` representa o payload de inserção (campos obrigatórios sem defaults). Devem ser usados em todo o código TypeScript em vez de tipos manuais.

---

## Roles

### super_admin
Acesso irrestrito ao sistema. Reservado para operações de suporte e manutenção da plataforma. Não deve ser atribuído a usuários de negócio.

### admin
Administrador da `Org`. Gerencia usuários, configurações e dados da organização inteira. Equivale ao `Franqueador` em contextos de rede de franquias.

### franqueado
Usuário com acesso à gestão de sua unidade de franquia: leads, clientes, CRM, financeiro próprio. Não acessa dados de outras unidades. Ver `franqueado_master`.

### franqueado_master
Variante do `franqueado` com permissões expandidas dentro do grupo de franquias (ex: visualização de relatórios consolidados de sub-unidades).

### cliente_admin
Administrador do portal do cliente. Gerencia usuários da organização cliente e configurações básicas. Acesso restrito aos dados da própria `Org`.

### cliente_user
Usuário final do portal do cliente. Visualização somente-leitura de dados pertinentes à sua `Org`. Permissão mínima do sistema.

---

## Acrônimos

### CI/CD (Continuous Integration / Continuous Deployment)
Práticas de integração e entrega contínua. No sistema: GitHub Actions executa lint, testes e Lighthouse CI a cada PR; merge na `main` dispara deploy automático via Supabase CLI. Ver [DEPLOYMENT.md](DEPLOYMENT.md).

### CLS (Cumulative Layout Shift)
Métrica `CWV` que mede instabilidade visual da página (elementos que mudam de posição durante o carregamento). Meta: `< 0.1`. Ver `CWV`, `Assertion`.

### CRM (Customer Relationship Management)
Módulo de gestão de relacionamento com clientes. No sistema: pipeline Kanban de leads, histórico de interações, scoring e automações de follow-up.

### CWV (Core Web Vitals)
Conjunto de métricas de performance definidas pelo Google: `LCP`, `FCP`, `CLS`, `INP`, `TBT`. Medidas via Lighthouse CI a cada PR. Ver `Assertion`, [PERFORMANCE.md](PERFORMANCE.md).

### FCP (First Contentful Paint)
Tempo até o primeiro elemento de conteúdo ser renderizado na tela. Meta: `< 1800ms`. Ver `CWV`.

### IA (Inteligência Artificial)
Funcionalidades do sistema que utilizam modelos de linguagem (LLM) para geração de conteúdo, triagem de suporte, scoring de leads e recomendações comerciais.

### INP (Interaction to Next Paint)
Métrica `CWV` que mede a responsividade da página a interações do usuário. Substitui FID. Meta: `< 200ms`. Ver `CWV`.

### LCP (Largest Contentful Paint)
Tempo até o maior elemento de conteúdo visível ser renderizado. Principal indicador de performance percebida. Meta: `< 2500ms`. Ver `CWV`, `Assertion`.

### LGPD (Lei Geral de Proteção de Dados)
Lei brasileira nº 13.709/2018 que regula o tratamento de dados pessoais. O sistema implementa conformidade via `Soft-delete`, `DSR` endpoints, `PII redaction` em logs e política de retenção de dados. Ver `DSR`, [SECURITY-POLICY.md](SECURITY-POLICY.md).

### SLA (Service Level Agreement)
Acordo de nível de serviço que define tempo máximo de resposta para suporte, disponibilidade de sistema e resolução de incidentes. No módulo de suporte/tickets: SLA por prioridade (`critical`, `high`, `medium`, `low`).

### TBT (Total Blocking Time)
Soma do tempo em que o thread principal está bloqueado entre `FCP` e `TTI`. Indica travamentos durante o carregamento. Meta: `< 300ms`. Ver `CWV`.
