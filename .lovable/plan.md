

# Refactor -- Area do Franqueado 100% Independente

## Problema

3 paginas do Franqueado importam dados da area da Franqueadora (`homeData.ts`), quebrando a regra de separacao total:

- `FranqueadoDashboard.tsx` -- importa `getMensagemHoje`, `getProximosEventos`, `getComunicadosAtivos`
- `FranqueadoAgenda.tsx` -- importa `getProximosEventos`
- `FranqueadoComunicados.tsx` -- importa `getComunicadosAtivos`

As outras 9 paginas (Suporte, CRM, Propostas, Diagnostico, Prospeccao IA, Materiais, Academy, Financeiro, Contratos) ja estao 100% independentes usando apenas `franqueadoData.ts`.

## Solucao

Adicionar dados proprios em `franqueadoData.ts` e reescrever as 3 paginas para eliminar toda dependencia de `homeData.ts`.

---

## Arquivo 1: `src/data/franqueadoData.ts`

Adicionar ao final do arquivo existente (sem alterar nada que ja existe):

### Novos tipos

- `FranqueadoMensagemDia` -- { categoria: string, texto: string, autor: string }
- `FranqueadoEvento` -- { id, titulo, data, hora, tipo, visibilidade: "pessoal"|"unidade"|"rede", editavel: boolean }
- `FranqueadoComunicado` -- { id, titulo, conteudo, prioridade: "Critica"|"Alta"|"Normal", autorNome, criadoEm, destinatario: "rede"|"unidade", lido: boolean }

### Novas funcoes

- `getFranqueadoMensagemDia()` -- retorna mensagem motivacional propria da unidade (nao da franqueadora)
- `getFranqueadoEventos()` -- retorna 8-10 eventos com mix de visibilidades (pessoal/unidade/rede), onde eventos da rede tem `editavel: false`
- `getFranqueadoComunicadosUnidade()` -- retorna 6-8 comunicados com conteudo real diferente do titulo, prioridades variadas, campo `lido` inicialmente false

---

## Arquivo 2: `src/pages/franqueado/FranqueadoDashboard.tsx`

Reescrever para eliminar `import ... from "@/data/homeData"`.

Mudancas:
- Mensagem do dia: usar `getFranqueadoMensagemDia()` em vez de `getMensagemHoje()`
- Eventos: usar `getFranqueadoEventos()` em vez de `getProximosEventos()`
- Comunicados: usar `getFranqueadoComunicadosUnidade()` em vez de `getComunicadosAtivos()`
- Adicionar secao "Hoje eu preciso de..." com 4 botoes de atalho rapido (Criar Lead, Abrir Chamado, Ver Propostas, Acessar CRM) que navegam para as rotas do franqueado
- Manter tudo que ja funciona: KPIs, Metas, Ranking, Chamados (ja usam franqueadoData)

---

## Arquivo 3: `src/pages/franqueado/FranqueadoAgenda.tsx`

Reescrever para eliminar `import ... from "@/data/homeData"`.

Mudancas:
- Usar `getFranqueadoEventos()` em vez de `getProximosEventos()`
- Filtrar por visibilidade real dos eventos (Pessoal/Unidade/Rede) usando o campo `visibilidade`
- Mostrar badge "Somente leitura" nos eventos da rede
- Botao "Novo Evento" so habilitado para pessoal/unidade
- Formulario simples inline para criar evento (titulo, data, tipo, visibilidade pessoal ou unidade)

---

## Arquivo 4: `src/pages/franqueado/FranqueadoComunicados.tsx`

Reescrever para eliminar `import ... from "@/data/homeData"`.

Mudancas:
- Usar `getFranqueadoComunicadosUnidade()` em vez de `getComunicadosAtivos()`
- Exibir conteudo real de cada comunicado (campo `conteudo`, nao repetir o titulo)
- Adicionar filtros por prioridade (Todas/Critica/Alta/Normal) e status (Todos/Nao lidos/Lidos)
- Contador de nao lidos no topo
- Detalhe do comunicado ao clicar (view com conteudo completo em tela separada)
- Manter botao "Confirmar leitura" funcional
- Somente leitura -- sem edicao, sem exclusao

---

## Resultado Final

Zero imports de `homeData.ts` nas paginas do Franqueado. Todas as 12 paginas usam exclusivamente `franqueadoData.ts`. A area do Franqueado funciona como aplicacao completamente independente.

## Arquivos modificados

```text
src/data/franqueadoData.ts                        -- adicionar 3 tipos + 3 funcoes
src/pages/franqueado/FranqueadoDashboard.tsx       -- reescrever sem homeData
src/pages/franqueado/FranqueadoAgenda.tsx          -- reescrever sem homeData
src/pages/franqueado/FranqueadoComunicados.tsx     -- reescrever sem homeData
```

Nenhum arquivo da franqueadora e tocado.

