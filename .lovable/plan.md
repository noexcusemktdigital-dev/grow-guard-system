

## Plano: Home Inicio Mais Robusto e Personalizado

Transformar a tela de Inicio do cliente final em uma experiencia mais envolvente, com saudacao personalizada (nome do usuario), hero section chamativa e layout que gere mais conexao.

---

### Mudancas

**Arquivo: `src/pages/cliente/ClienteInicio.tsx`**

1. **Saudacao com nome do usuario**
   - Importar `useUserProfile` que ja existe e retorna `full_name`
   - Mudar de `"Bom dia!"` para `"Bom dia, João!"` (primeiro nome extraido de full_name)
   - Fallback para saudacao sem nome caso profile nao carregue

2. **Hero Section chamativa**
   - Substituir o bloco de greeting simples (h1 + p) por um card hero com gradiente animado
   - Incluir emoji contextual por horario (sol de manha, lua a noite)
   - Mostrar resumo rapido inline: "X tarefas pendentes | Y leads novos | meta em Z%"
   - Frase do dia integrada dentro do hero (remover card separado)

3. **Layout mais visual**
   - Adicionar animacao sutil de entrada (fade-in) nos cards usando classes CSS ja existentes
   - Hero com gradiente primario mais forte e borda com brilho sutil
   - Data formatada mais destaque visual

---

### Detalhes Tecnicos

**Obtendo o nome:**
```typescript
const { data: profile } = useUserProfile();
const firstName = profile?.full_name?.split(" ")[0] || "";
const greeting = firstName ? `${saudacao}, ${firstName}!` : `${saudacao}!`;
```

**Hero Section - estrutura:**
```text
+--------------------------------------------------+
|  [emoji] Boa tarde, João!                         |
|  quarta-feira, 26 de fevereiro                    |
|                                                   |
|  "Frase do dia aqui..." — Autor                   |
|                                                   |
|  [3 tarefas] · [12 leads] · [Meta 67%]           |
+--------------------------------------------------+
```

O hero usa gradiente `bg-gradient-to-br from-primary/15 via-primary/5 to-background` com borda `border-primary/20` para destaque visual sem ser excessivo.

**Resumo de Arquivos:**

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClienteInicio.tsx` | Hero section com nome, frase integrada, resumo inline, visual mais chamativo |

Nenhuma mudanca de backend necessaria — `useUserProfile` ja busca `full_name` da tabela `profiles`.

