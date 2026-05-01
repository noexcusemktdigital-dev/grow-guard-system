# ADR-001: Lovable Cloud como plataforma única

- Status: Aceito
- Data: 2026-05-01
- Decisores: Rafael Marutaka (founder/CTO), Davi Tesch (cliente NOEXCUSE)

## Contexto

O Sistema Noé serve uma rede de franquias (NOEXCUSE) com 3 portais (admin rede, franqueado, cliente final), 125 páginas e 60+ edge functions. A equipe é pequena (1-2 devs), o ciclo de iteração precisa ser curto e o orçamento de DevOps é mínimo. Não há equipe dedicada de plataforma para manter pipelines CI/CD complexos, gerenciar migrations manualmente via Supabase CLI, configurar secrets em múltiplos ambientes ou operar runners dedicados.

A Lovable Cloud oferece um pacote integrado: hospedagem do frontend (Vite/React), aplicação automática de migrations SQL a partir do repositório, gerenciamento de secrets, deploy de edge functions, e integração nativa com Supabase. O canal de operação é único — qualquer mudança (SQL, secret, código) flui pelo mesmo pipeline.

Outros projetos do ecossistema (Opportunity OS) usam Supabase CLI direto por terem requisitos diferentes (workers BullMQ em VPS, mais de 100 jobs distribuídos), mas o Sistema Noé é majoritariamente CRUD + edge functions, perfil ideal para a Lovable.

## Decisão

**Toda a operação do Sistema Noé é feita via Lovable Cloud:** SQL/migrations, secrets, deploy do frontend, deploy de edge functions e integração com Supabase. Não usar `supabase db push`, `supabase functions deploy` nem Vercel/Netlify direto. O Supabase CLI fica reservado exclusivamente para inspeção (read-only) e para o projeto Opportunity OS.

## Consequências

### Positivas
- Um único pipeline para frontend, backend e DB — reduz drift entre ambientes
- Deploy em minutos, sem precisar manter GitHub Actions de deploy
- Secrets centralizados, sem `.env` espalhados
- Migrations versionadas no repo + aplicadas automaticamente reduzem erro humano
- Equipe pequena consegue operar 125 páginas + 60+ edge fns sem SRE dedicado

### Negativas / Trade-offs
- Dependência do uptime e roadmap da Lovable — outage da plataforma = outage do produto
- Menos controle granular sobre o pipeline (não dá pra inserir gates customizados facilmente)
- Lock-in moderado: migrar pra outro PaaS exigiria reescrever fluxo de deploy
- Debugging de edge functions depende dos logs/UI da Lovable

## Alternativas consideradas

- **Supabase CLI + Vercel:** mais controle, mas exige GitHub Actions, gestão de secrets em 2 lugares, e disciplina manual para migrations. Rejeitado pelo custo operacional para uma equipe pequena.
- **Supabase CLI + self-hosted (VPS):** ainda mais controle, mas exigiria SRE part-time. Não compensa para o perfil CRUD do projeto.
- **Manter frontend na Lovable e backend no Supabase CLI:** dois canais de deploy, fonte garantida de drift. Rejeitado.
