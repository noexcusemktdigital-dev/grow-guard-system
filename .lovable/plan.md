

# Melhoria das Artes de Redes Sociais + Integracao com Conteudos

Atualizar as edge functions e o frontend para melhorar drasticamente a qualidade das artes geradas e permitir importar conteudos ja criados como base para as artes.

---

## 1. Melhorar `generate-social-concepts` (Edge Function)

Atualizar o system prompt para receber novos campos (`tipo_post`, `nivel`, `descricao_produto`) e gerar prompts visuais muito mais detalhados por categoria:

- **Produto**: foto de estudio profissional, iluminacao, superficie, fundo
- **Promocao**: design grafico com formas geometricas, urgencia, gradientes
- **Institucional**: branding corporativo, composicao limpa, sofisticada
- **Depoimento**: pessoas reais, emocao, autenticidade
- **Educativo**: elementos didaticos, clareza visual

Quando receber roteiro importado de Conteudos, usar titulo/legenda/etapa do funil como contexto para prompts visuais mais relevantes.

---

## 2. Melhorar `generate-social-image` (Edge Function)

Adicionar system-level quality instructions e instrucoes por nivel de sofisticacao:

- **Simples**: Clean, professional, effective
- **Elaborado**: Strong composition, vibrant, polished
- **Alto Padrao**: Ultra-premium, luxury, magazine-quality, dramatic lighting

Adicionar instrucao para deixar espaco para overlay de texto na composicao.

---

## 3. Atualizar Frontend (`ClienteRedesSociais.tsx`)

Adicionar ao wizard:

- Campo `tipoPost` (Produto, Servico, Promocao, Institucional, Educativo, Depoimento)
- Campo `nivel` (Simples, Elaborado, Alto Padrao)
- Campo `descricaoProduto` (textarea opcional, visivel quando tipo = Produto ou Servico)
- Botao "Importar de Conteudos" que busca campanhas do localStorage e permite selecionar conteudos para preencher automaticamente titulos/legendas e enriquecer o prompt visual

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/generate-social-concepts/index.ts` | Prompts enriquecidos por tipo e nivel, suporte a roteiro importado |
| `supabase/functions/generate-social-image/index.ts` | System prompt de qualidade, instrucoes por nivel |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Novos campos no wizard, botao importar conteudos |

