

## Plano — Memória de referências e aprendizado com artes aprovadas

### O que muda

Atualmente, toda vez que o usuário cria uma nova arte, precisa enviar as referências do zero. O sistema não lembra das referências anteriores nem aprende com as artes aprovadas. Queremos que:

1. O wizard sugira referências já usadas anteriormente (extraídas do histórico de posts)
2. Artes aprovadas apareçam como referências recomendadas ("A IA aprendeu com suas artes aprovadas")
3. O logo usado na última geração seja pré-carregado automaticamente

### Abordagem

Criar um hook `useReferenceMemory` que consulta `client_posts` da organização, extrai as `reference_image_urls` e `result_url` de posts com `status = 'approved'`, e retorna:
- **Referências recorrentes**: URLs que aparecem em 2+ posts (as que o cliente mais usa)
- **Artes aprovadas recentes**: `result_url` dos últimos posts aprovados (máx 12)
- **Último logo usado**: extrair do `result_data` ou do histórico

### Mudanças

#### 1. Novo hook `useReferenceMemory`

**Arquivo**: `src/hooks/useReferenceMemory.ts` (novo)

Consulta `client_posts` filtrado por `organization_id` e `status = 'approved'`. Retorna:
- `frequentRefs: string[]` — URLs de referência usadas em 2+ posts aprovados
- `approvedArts: string[]` — `result_url` dos últimos 12 posts aprovados
- `lastLogoUrl: string | null` — logo do post mais recente (se existir no result_data)

#### 2. Seção "Referências anteriores" no Step 9 (Referências)

**Arquivo**: `src/components/cliente/social/ArtWizardSteps.tsx`

Antes do RefUploader, mostrar duas seções colapsáveis:
- **"Referências que você já usou"** — grid de thumbnails das `frequentRefs`, clicáveis para adicionar
- **"Artes aprovadas"** — grid de thumbnails das `approvedArts`, clicáveis para adicionar como referência

Cada thumbnail com botão "+" para adicionar à lista de referências atual.

#### 3. Pré-carregar logo da última geração

**Arquivo**: `src/components/cliente/social/ArtWizard.tsx`

No `useEffect` inicial, se `logoUrl` estiver vazio e `referenceMemory.lastLogoUrl` existir, pré-preencher o campo de logo.

#### 4. Passar dados para o wizard

**Arquivo**: `src/components/cliente/social/ArtWizard.tsx`

Importar `useReferenceMemory`, passar os dados para `ArtWizardSteps` como prop `referenceMemory`.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useReferenceMemory.ts` | **Novo** — hook que extrai referências frequentes e artes aprovadas |
| `src/components/cliente/social/ArtWizardSteps.tsx` | Adicionar seção de referências anteriores + artes aprovadas no Step 9 |
| `src/components/cliente/social/ArtWizard.tsx` | Consumir `useReferenceMemory`, pré-preencher logo, passar dados ao steps |

### Resultado

- Na segunda vez que o usuário gera arte, já vê suas referências anteriores e artes aprovadas como sugestão
- Um clique adiciona a referência, sem precisar fazer upload novamente
- Logo é pré-carregada automaticamente
- O sistema "aprende" com o que o cliente aprovou, priorizando essas referências

