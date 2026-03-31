

## Plano — Substituir mapa SVG por autocomplete de localidades

### Abordagem

A melhor forma é usar uma **base de dados local (hardcoded)** com todos os 26 estados + DF e as ~100 principais cidades do Brasil, embutida no próprio componente. Não precisa de tabela no banco — a lista é estática e pequena o suficiente para ficar no frontend (~5KB).

O usuário digita no campo e vê sugestões filtradas em tempo real (estados e cidades), podendo selecionar múltiplos itens que aparecem como chips removíveis.

### Componente `BrazilLocationAutocomplete`

Substituirá o `BrazilMapSelector`. Estrutura:

- Toggle "Brasil inteiro" (mantém)
- Input de busca com dropdown de sugestões filtradas
- Sugestões agrupadas: **Estados** e **Cidades** (com UF ao lado, ex: "Campinas - SP")
- Chips dos itens selecionados com X para remover
- Base de dados local: array de `{ label: "São Paulo", type: "estado", uf: "SP" }` e `{ label: "Campinas", type: "cidade", uf: "SP" }` com ~150 cidades principais

O valor continua sendo uma string separada por vírgula (compatível com a Edge Function).

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/components/traffic/BrazilLocationAutocomplete.tsx` | **Novo** — Autocomplete com base local de estados + cidades |
| `src/components/traffic/BrazilMapSelector.tsx` | Remover (ou manter para uso futuro) |
| `src/pages/cliente/ClienteTrafegoPagoWizardStep.tsx` | Trocar import de `BrazilMapSelector` por `BrazilLocationAutocomplete` |

### Detalhes

- A base local terá os 27 UFs + ~150 cidades (capitais + cidades com >300k habitantes)
- Filtro por `includes` case-insensitive no label
- Dropdown com max 8 resultados, agrupados por tipo (estado primeiro, depois cidade)
- Ao selecionar um estado (ex: "SP"), adiciona "São Paulo (estado)" ao valor
- Ao selecionar uma cidade (ex: "Campinas - SP"), adiciona "Campinas - SP"
- Digitação livre também permitida (Enter adiciona texto customizado caso não encontre na base)

