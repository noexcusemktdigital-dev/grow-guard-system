

# Revisar Apresentação — Exibir imagens de criativos

## Problema
A seção de **Conteúdo & Criativos** no editor do acompanhamento permite upload de imagens (salvas em `analise.conteudo.imagens`), mas a página de **Apresentação** (`/apresentacao/:id`) não renderiza essas imagens em nenhuma seção.

## Solução

### Arquivo: `src/pages/Apresentacao.tsx`

**1. Adicionar galeria de criativos na `AnaliseSection`**
Dentro do card de "Conteúdo" (na seção de análise), após os positivos/negativos, renderizar as imagens do array `analise.conteudo?.imagens` em um grid responsivo com lightbox visual (imagens clicáveis em tamanho maior ou simplesmente um grid elegante).

**2. Adicionar seção de criativos na `ConteudoSection`**
Após a linha editorial e antes das pautas, adicionar um bloco "Criativos em Veiculação" que exibe as imagens de `analise.conteudo?.imagens` (pois é onde o editor salva os uploads). Grid de 2-3 colunas com imagens em `rounded-2xl`, bordas sutis e aspect-ratio consistente.

O código adicionado será algo como:
```tsx
{analise.conteudo?.imagens?.length > 0 && (
  <div className="mt-8">
    <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Criativos em Veiculação</h4>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {analise.conteudo.imagens.map((url, i) => (
        <img key={i} src={url} alt={`Criativo ${i+1}`} 
             className="rounded-xl border border-white/10 w-full object-cover aspect-square" />
      ))}
    </div>
  </div>
)}
```

Esse bloco será inserido em dois lugares:
1. Dentro da `AnaliseSection`, no card de Conteúdo (após positivos/negativos)
2. Na `ConteudoSection`, como destaque visual antes das pautas detalhadas

