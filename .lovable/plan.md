

## Reformulação — Ferramenta de Sites com tipos, edição por seção e publicação

### Visão geral

Reestruturar o fluxo de criação de sites em 3 fases: (1) Escolha do tipo de site com perguntas específicas, (2) Edição por seção após geração, (3) Publicação via link compartilhável.

### Fase 1 — Tipos de site com wizard adaptativo

O primeiro passo do wizard será escolher o **tipo de site**, e as etapas seguintes mudarão conforme o tipo:

| Tipo | Seções geradas | Perguntas específicas |
|------|---------------|----------------------|
| **Landing Page de Captação** | Hero + Problema + Solução + Benefícios + Prova Social + Formulário + CTA | Qual oferta? Qual lead magnet? Campos do formulário? |
| **Site Institucional** | Hero + Sobre + Equipe + Serviços + Valores + Contato | História da empresa? Equipe (nomes/cargos)? Missão/Visão? |
| **Site de Vendas** | Hero + Produto + Benefícios + Preço + Depoimentos + Garantia + CTA | Qual produto? Preço? Garantia? Urgência? |
| **Portfólio** | Hero + Projetos + Sobre + Processo + Contato | Quantos projetos destacar? Categorias? |
| **Link na Bio** | Hero + Links + Redes + Mini-Sobre | Quais links? Quais redes? |

Cada tipo define um array de `sections` que determina quais seções o site terá e quais perguntas serão feitas. As perguntas comuns (empresa, contato, estilo, CTA) permanecem, mas as específicas mudam.

### Fase 2 — Checklist de edição por seção

Após o site ser gerado, em vez de ir direto para aprovação, o usuário vê um **checklist de seções** onde pode:

```text
┌────────────────────────────────────────────┐
│  Preview do site (iframe)                  │
├────────────────────────────────────────────┤
│  SEÇÕES DO SITE                            │
│                                            │
│  [✓] Hero                    [Editar]      │
│      Título: "Transforme seu negócio"      │
│      Subtítulo: "Agência líder em..."      │
│      Imagem: hero-bg.jpg                   │
│                                            │
│  [✓] Sobre                   [Editar]      │
│      Texto: "Somos uma empresa..."         │
│                                            │
│  [ ] Serviços                [Editar]      │
│      3 serviços listados                   │
│                                            │
│  [ ] Depoimentos             [Editar]      │
│  [ ] Contato                 [Editar]      │
│  [ ] Footer                  [Editar]      │
├────────────────────────────────────────────┤
│  [Regenerar com alterações] [Aprovar site] │
└────────────────────────────────────────────┘
```

Ao clicar em **Editar** uma seção, abre um painel onde o usuário pode:
- Alterar textos (título, subtítulo, parágrafos)
- Trocar/adicionar imagem (upload ou URL)
- Adicionar/remover elementos (ex: mais um serviço, mais um depoimento)
- Escrever uma instrução livre (ex: "Mude a cor do fundo para azul")

Ao clicar em **"Regenerar com alterações"**, uma nova chamada à Edge Function `generate-site` é feita passando o HTML atual + as instruções de alteração por seção, gerando uma versão atualizada. Isso **não cobra créditos adicionais** (apenas a primeira geração cobra).

### Fase 3 — Publicação e compartilhamento

Após aprovação, o site pode ser utilizado de 3 formas:

1. **Link compartilhável** (principal): O HTML aprovado é salvo no Storage bucket `marketing-assets` como arquivo público. O sistema gera uma URL pública tipo `https://gxrhdpbbxfipeopdyygn.supabase.co/storage/v1/object/public/marketing-assets/sites/{org_id}/{site_id}/index.html`. O usuário copia e compartilha.

2. **Download do código**: Já existe, mantém.

3. **Exportar para GitHub**: Botão que gera um arquivo ZIP com o HTML + assets e orienta o deploy via Vercel/Netlify (tutorial já existente no `SiteDeployGuide`).

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteSitesWizardSteps.tsx` | Adicionar step "Tipo de Site" como primeiro passo. Criar perguntas condicionais por tipo. Definir `SITE_TYPES` com seções e perguntas específicas |
| `src/pages/cliente/ClienteSites.tsx` | Adaptar wizard para novo fluxo com tipo no step 0. Adicionar fase de edição por seção entre geração e aprovação. Implementar upload do HTML aprovado ao Storage para gerar link público |
| `src/components/sites/SiteSectionEditor.tsx` | **Novo** — Componente de checklist de seções com painel de edição inline (textos, imagens, instruções) |
| `src/components/sites/SitePreview.tsx` | Adicionar botão "Compartilhar Link" que copia a URL pública do Storage. Adicionar botão "Exportar GitHub" |
| `supabase/functions/generate-site/index.ts` | Aceitar campo `edit_instructions` (objeto com alterações por seção) + `current_html` para regeneração parcial. Quando presente, o prompt pede para manter o HTML base e aplicar apenas as alterações solicitadas |

### Detalhes técnicos

**Tipos de site e seções**: Cada tipo define um `sections: string[]` (ex: `["hero", "sobre", "servicos", "depoimentos", "contato", "footer"]`). O wizard adapta as perguntas e o prompt da IA recebe as seções como instrução obrigatória.

**Edição por seção**: O componente `SiteSectionEditor` parseia o HTML gerado por `<section>` tags (ou `id`s convencionados como `section-hero`, `section-sobre`, etc.) e exibe um resumo de cada. As alterações são coletadas como objeto `{ hero: { titulo: "Novo título", instrucao: "Mude a cor" }, servicos: { adicionar: "Novo serviço X" } }` e enviadas na regeneração.

**Regeneração sem custo**: A Edge Function recebe `edit_mode: true` e não debita créditos. O prompt recebe o HTML atual + instruções de edição, pedindo para manter a estrutura e aplicar apenas as mudanças.

**Link público via Storage**: Ao aprovar, o HTML é uploaded para `marketing-assets/sites/{org_id}/{site_id}/index.html` via `supabase.storage.from('marketing-assets').upload(...)`. A URL pública é salva no campo `url` da tabela `client_sites`.

**Convenção de seções no HTML**: O system prompt da IA será atualizado para gerar `<section id="section-hero">`, `<section id="section-sobre">`, etc., permitindo parsing confiável para o editor.

