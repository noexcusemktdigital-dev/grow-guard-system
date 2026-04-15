

## Correções no MemberPermissionsEditor

Três alterações no arquivo `src/components/cliente/MemberPermissionsEditor.tsx`:

1. **Painel expandido por padrão** — Linha 41: trocar `useState(false)` por `useState(true)`

2. **Botão Salvar sempre visível** — Linhas 260-264: remover condicional `{dirty && ...}` e substituir por botão que muda aparência conforme estado (disabled quando não há mudanças, destaque quando há)

3. **Toast mais descritivo** — Linha 95: incluir `description` com nome do usuário no toast de sucesso

### Alterações técnicas

**Linha 41:**
```typescript
const [expanded, setExpanded] = useState(true);
```

**Linhas 88-96 (handleSave):**
```typescript
toast({ title: "Permissões salvas!", description: `Permissões de ${userName} atualizadas com sucesso.` });
```

**Linhas 260-264 (botão):**
```tsx
<Button
  onClick={handleSave}
  disabled={saveMutation.isPending || !dirty}
  className={`w-full ${dirty ? "opacity-100" : "opacity-50"}`}
  variant={dirty ? "default" : "outline"}
>
  {saveMutation.isPending ? "Salvando..." : dirty ? "Salvar permissões ●" : "Permissões salvas ✓"}
</Button>
```

