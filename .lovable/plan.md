

## Plano: Executar Teste P2Y COM Referências

### Problema
A edge function `generate-social-image` precisa de URLs públicas para as imagens de referência. As imagens `user-uploads://` não são acessíveis diretamente pela edge function.

### Solução

1. **Copiar as 3 imagens de referência para o projeto** em `public/test-refs/`

2. **Usar o preview URL para construir URLs públicas** das referências:
   - `https://id-preview--1d5802a2-4462-4bb6-a30e-a9b2d444f68e.lovable.app/test-refs/ref1.png`

3. **Chamar a edge function com URLs públicas** no campo `reference_images`

### Execução

```text
1. lov-copy user-uploads://Captura_de_Tela_2026-03-09_às_00.32.57-2.png → public/test-refs/p2y-ref1.png
2. lov-copy user-uploads://Captura_de_Tela_2026-03-09_às_00.33.11-2.png → public/test-refs/p2y-ref2.png
3. lov-copy user-uploads://Captura_de_Tela_2026-03-09_às_00.33.25-2.png → public/test-refs/p2y-ref3.png
4. Chamar generate-social-image com URLs públicas das referências
```

### Briefing do Teste (P2Y)

O prompt estruturado seguirá o formato ChatGPT com:

- **Headline**: "O problema não é parcelar."
- **Highlight**: "É parcelar sem planejamento!"
- **Supporting text**: "Parcelar pode ser estratégia ou armadilha. Tudo depende de três fatores."
- **Bullet points**: "Tempo / Renda / Objetivo"
- **CTA**: "Fale com a P2Y"
- **Brand**: "P2Y crédito e investimento"
- **Scene**: Brazilian couple planning finances
- **Visual elements**: Three circular icons, dark rounded card, lime green accents
- **Palette**: #C8D941, #2D2D2D, #FFFFFF, #1A1A1A
- **Art style**: foto_editorial

### Resultado Esperado

- O CoT multimodal vai analisar as 3 referências e extrair: rounded cards, circular icons, lime green highlights, dark text zones, logo placement
- O prompt final seguirá a estrutura do ChatGPT com "Use as style reference ONLY" + "Create NEW scene"
- Comparar lado a lado com o teste SEM referências já gerado

