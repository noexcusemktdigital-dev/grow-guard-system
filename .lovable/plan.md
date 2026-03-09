

## Plano: Teste P2Y COM Referências vs SEM Referências

### Contexto
O pipeline de geração já foi atualizado com CoT multimodal. Agora preciso executar o teste real com as 3 imagens de referência da P2Y que você enviou.

### Etapas

1. **Deploy do edge function atualizado** — garantir que `generate-social-image` com o CoT multimodal está live

2. **Upload das 3 referências para o storage** — salvar em `social-arts/references/p2y/ref1.png`, `ref2.png`, `ref3.png` via storage API

3. **Executar geração COM referências** — chamar `generate-social-image` com:
   - As 3 URLs públicas no campo `reference_images`
   - Briefing P2Y: crédito/consórcio, casal jovem, verde limão #C8D941, charcoal #2D2D2D
   - Headline: "O problema não é parcelar."
   - Highlight: "É parcelar sem planejamento!"
   - Supporting text, bullet points (Tempo, Renda, Objetivo)
   - Brand: "P2Y crédito e investimento"
   - Format: portrait 4:5
   - Style: foto_editorial (para foto realista + layout marketing)
   - Salvar em `posts/test/test-p2y-with-refs.png`

4. **Comparar resultados** — apresentar URLs dos dois testes (sem refs e com refs) lado a lado

### Briefing do Teste (baseado no prompt de referência)

```text
headline: "O problema não é parcelar."
highlight_headline: "É parcelar sem planejamento!"
supporting_text: "Parcelar pode ser estratégia ou armadilha. Tudo depende de três fatores."
bullet_points: "Tempo / Renda / Objetivo"
cta: "Fale com a P2Y"
brand_name: "P2Y crédito e investimento"
cena: "Brazilian couple sitting together at home planning finances on a laptop"
elementos_visuais: "three circular icon elements representing time, income and financial goal"
format: portrait (4:5)
art_style: foto_editorial
identidade_visual: { palette: "#C8D941, #2D2D2D, #FFFFFF", style: "modern financial consulting" }
```

O CoT multimodal vai analisar as 3 referências e extrair o design system real (cards arredondados, ícones circulares, verde limão) antes de gerar o prompt estruturado.

