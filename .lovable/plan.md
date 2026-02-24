
# Corrigir avatar cortado pela capa no Perfil

## Problema
O container do banner tem `overflow-hidden` para manter os cantos arredondados, mas isso corta o avatar que esta posicionado com `-bottom-12` (saindo para fora do container).

## Solucao
Separar o `overflow-hidden` do container pai e aplica-lo apenas no elemento do gradiente (a capa em si), permitindo que o avatar se sobreponha livremente.

## Alteracao

**Arquivo:** `src/pages/franqueado/FranqueadoPerfil.tsx`

- Remover `overflow-hidden` do `div` container externo (manter apenas `relative rounded-2xl`)
- Adicionar `rounded-2xl overflow-hidden` diretamente no `div` do gradiente (a capa)

```text
Antes:
<div class="relative rounded-2xl overflow-hidden">   <-- corta o avatar
  <div class="h-48 bg-gradient-to-br ..." />
  <div class="absolute -bottom-12 ...">              <-- avatar cortado
    ...
  </div>
</div>

Depois:
<div class="relative">                               <-- sem overflow-hidden
  <div class="h-48 bg-gradient-to-br ... rounded-2xl overflow-hidden" />
  <div class="absolute -bottom-12 ...">              <-- avatar visivel
    ...
  </div>
</div>
```

Apenas 1 linha alterada em 1 arquivo.
