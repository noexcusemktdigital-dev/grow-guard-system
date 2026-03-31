

## Plano — Melhorar diagramação da estratégia + campanhas pós-aprovação

### Problemas identificados

1. **Estrutura de campanha mal diagramada**: O código em `ClienteTrafegoPagoResult.tsx` (linhas 522-538) assume que `campaign_structure` tem formato `{ campaigns: [{ name, ad_sets: [{ name, targeting }] }] }`, mas a IA pode retornar strings, arrays simples ou objetos com estrutura diferente. Isso causa erros de renderização.

2. **Botão "Criar Campanha" existe** mas só aparece na aba Estratégia (dentro dos cards de plataforma). Na aba Campanhas, os cards não têm o botão para abrir o tutorial.

3. **Redirecionamento pós-aprovação** já existe no código (`setActiveTab("campanhas")`), mas as campanhas criadas automaticamente precisam ter o botão de tutorial visível na aba Campanhas.

### Mudanças

#### 1. Corrigir renderização da estrutura de campanha (`ClienteTrafegoPagoResult.tsx`)

- Tornar o render de `campaign_structure` defensivo: verificar se é string (renderizar como texto), array (renderizar como lista), ou objeto com `campaigns` (renderizar com a estrutura atual)
- Tratar `ad_sets` que podem ser strings ou objetos
- Adicionar fallback para qualquer formato inesperado

#### 2. Adicionar botão "Criar Campanha" nos cards da aba Campanhas (`ClienteTrafegoPago.tsx`)

- Nos cards de campanha (linhas 330-388), adicionar um botão "Criar Campanha" que abre o `TutorialDialog` com os dados daquela campanha
- Importar `TutorialDialog` do `ClienteTrafegoPagoResult.tsx` (ou extraí-lo para ser reutilizável)
- Cada card de campanha terá o botão se a plataforma tiver tutorial disponível

#### 3. Melhorar diagramação geral dos cards de campanha na aba Campanhas

- Adicionar mais informações visuais: creative_formats, keywords (badges), optimization_actions
- Seções colapsáveis para detalhes extras

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteTrafegoPagoResult.tsx` | Extrair `TutorialDialog` para export; corrigir render defensivo de `campaign_structure` |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Importar `TutorialDialog`; adicionar botão "Criar Campanha" nos cards da aba Campanhas com dados do content |

### Detalhes técnicos — render defensivo de campaign_structure

```text
campaign_structure →
  se string → renderizar como <p>
  se array → renderizar cada item como card simples
  se objeto com .campaigns → renderizar estrutura atual (nome + ad_sets)
  se objeto sem .campaigns → renderizar JSON.stringify formatado
```

