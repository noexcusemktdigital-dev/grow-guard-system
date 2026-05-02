# Scripts CI/lint customizados

## check-stale-time.ts

Detecta `useQuery({...})` sem `staleTime` configurado.

Sem `staleTime`, React Query usa default `0` (refetch agressivo), causando:
- Carga desnecessária no Supabase
- Re-renders com flicker para o usuário
- Custo maior de requisições

Modos:

- `diff` (default): só arquivos alterados vs `origin/main`
- `all`: todos arquivos `src/`

Uso:

```bash
npm run check:stale-time         # PR-mode (rapido)
npm run check:stale-time:all     # Audit completo
```

Adicionar ao CI:

```yaml
- name: Check stale-time
  run: npm run check:stale-time
```

### Valores recomendados de staleTime

| Tipo de dado | staleTime |
|---|---|
| Listas (mudam pouco) | `5 * 60 * 1000` (5 min) |
| Detalhes de entidade | `60 * 1000` (1 min) |
| Tempo real (chat, notificacoes) | `0` |
