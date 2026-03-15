

## Problema

O `FranqueadoWelcomeModal` abre em 800ms e o `FranqueadoTour` abre em 1000ms. Os dois se sobrepõem. O tour usa `z-[9999]` com um overlay que captura os cliques, impedindo que o botão "Entendi, vamos lá!" do welcome modal funcione. O modal fica preso atrás do tour.

## Solução

Coordenar os dois componentes para que o tour só abra **depois** que o welcome modal for fechado.

### Mudanças

**`FranqueadoTour.tsx`** (linhas 59-65):
- Antes de abrir o tour, verificar se `franqueado_welcome_seen` já existe no localStorage
- Se não existir, escutar mudanças no localStorage (via `storage` event ou polling) e só abrir quando o welcome for fechado
- Alternativa mais simples: aumentar o delay do tour para 2000ms E verificar se o welcome já foi visto

**Abordagem escolhida** (mais robusta): Usar um intervalo curto que checa se o welcome já foi dismissado antes de mostrar o tour:

```typescript
useEffect(() => {
  if (localStorage.getItem(STORAGE_KEY)) return;
  const interval = setInterval(() => {
    // Only show tour after welcome modal is dismissed
    if (localStorage.getItem("franqueado_welcome_seen")) {
      clearInterval(interval);
      setTimeout(() => setOpen(true), 500);
    }
  }, 500);
  return () => clearInterval(interval);
}, []);
```

Se o welcome já foi visto em uma sessão anterior, o tour abre normalmente após 1s como hoje.

| Arquivo | Mudança |
|---------|---------|
| `src/components/FranqueadoTour.tsx` | Esperar welcome modal fechar antes de abrir |

