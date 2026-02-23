

# Plano de Vendas -- Reformulacao Estilo Consultoria + Dashboard vira Relatorios

## Resumo

Reformular o **Plano de Vendas** para seguir o mesmo padrao da **Estrategia de Marketing**: uma consultoria interativa com perguntas agrupadas em secoes, gerando um diagnostico comercial com termometro de maturidade, radar por area, plano de acao dinamico e projecoes. O resultado gera dicas e recomendacoes que direcionam o usuario para CRM, Agentes IA e Scripts.

Renomear **Dashboard** para **Relatorios** na sidebar e na pagina.

Remover as abas **Visao Geral** e **Estrutura Comercial** do Plano de Vendas.

---

## Mudancas na Sidebar

```text
VENDAS (antes)                    VENDAS (depois)
  Plano de Vendas                   Plano de Vendas
  CRM                              CRM
  Chat                             Chat
  Agentes IA                       Agentes IA
  Scripts                          Scripts
  Disparos                         Disparos
  Dashboard                        Relatorios    <-- renomeado
```

---

## Plano de Vendas -- Nova Estrutura

### Abas

O Plano de Vendas tera 3 abas:

| Aba | Descricao |
|-----|-----------|
| **Diagnostico** | Consultoria interativa com ~25 perguntas em ~8 secoes, seguindo o mesmo padrao do Estrategia de Marketing (secoes com progress bar, navegacao anterior/proximo, animacao de transicao). Ao finalizar, mostra resultados. |
| **Minhas Metas** | Manter a aba atual de metas (sem mudancas) |
| **Historico** | Historico de diagnosticos realizados (mesmo padrao do historico da Estrategia de Marketing) |

### Secoes do Diagnostico (~25 perguntas em 8 secoes)

1. **Sobre o Negocio** (contexto basico)
   - Segmento da empresa
   - Modelo de negocio (B2B/B2C/Ambos)
   - Tempo de mercado
   - Numero de funcionarios

2. **Financeiro Comercial** (dimensionar operacao)
   - Faturamento mensal
   - Ticket medio
   - Meta de faturamento mensal
   - Percentual da receita vinda de novos clientes vs recorrencia

3. **Equipe e Estrutura** (quem vende)
   - Tamanho da equipe comercial
   - Tem SDR? Closer? CS?
   - Processo comercial documentado?
   - Tempo medio de fechamento

4. **Gestao de Leads** (como gerencia leads)
   - Usa CRM? Qual?
   - Follow-up estruturado?
   - Cadencia de follow-up
   - Quantidade de leads mensais

5. **Canais e Prospeccao** (de onde vem os leads)
   - Canais de aquisicao ativos (multi-choice)
   - Canal principal
   - Mede ROI por canal?

6. **Processo de Vendas** (como vende)
   - Usa scripts/roteiros?
   - Etapas do funil de vendas (multi-choice)
   - Reuniao comercial recorrente?
   - Frequencia da reuniao

7. **Ferramentas e Automacao** (tecnologia)
   - Ferramentas utilizadas (multi-choice)
   - Tem automacoes ativas?
   - Usa agente de IA para atendimento?

8. **Metas e Performance** (controle)
   - Metas baseadas em dados historicos?
   - Acompanha taxa de conversao por etapa?
   - Relatorios comerciais periodicos?
   - Frequencia de analise de resultados

### Resultado do Diagnostico

Apos finalizar as perguntas, o usuario ve:

1. **Termometro de Maturidade Comercial** -- mesmo componente `DiagnosticoTermometro` usado na Estrategia de Marketing, com 4 niveis: Inicial (0-25%), Estruturando (26-50%), Escalavel (51-75%), Alta Performance (76-100%)

2. **Radar por Area (5 eixos)** -- Processo, Gestao de Leads, Ferramentas, Canais, Performance

3. **Insights Inteligentes** -- Cards com recomendacoes baseadas nas respostas, cada um com botao "Iniciar agora" que navega para o modulo relevante:
   - "Implante um CRM para controlar seus leads" -> navega para `/cliente/crm`
   - "Crie scripts padronizados para sua equipe" -> navega para `/cliente/scripts`
   - "Configure um agente de IA para qualificar leads" -> navega para `/cliente/agentes-ia`
   - "Estruture follow-ups automaticos" -> navega para `/cliente/disparos`

4. **Plano de Acao em 3 Fases** -- Estruturacao, Otimizacao, Escala (mesmo padrao da Estrategia de Marketing)

5. **Projecoes Comparativas** -- "Com Estrategia" vs "Sem Estrategia" para Leads e Receita (graficos lado a lado como na Estrategia de Marketing)

---

## Dashboard -> Relatorios

### Mudancas

- Renomear label na sidebar de "Dashboard" para "Relatorios"
- Renomear o titulo na pagina `ClienteDashboard.tsx` de "Dashboard" para "Relatorios"
- Subtitulo: "Analise e exporte relatorios das suas frentes comerciais"
- Manter todo o conteudo existente (abas CRM, Chat, Agentes IA com exportacao CSV) -- isso ja e essencialmente um modulo de relatorios

---

## Detalhes Tecnicos

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClientePlanoVendas.tsx` | Reescrever completamente: remover Visao Geral e Estrutura Comercial, implementar consultoria interativa com secoes/perguntas, resultados com termometro + radar + insights + plano de acao + projecoes. Manter aba Metas intacta. |
| `src/pages/cliente/ClienteDashboard.tsx` | Renomear titulo de "Dashboard" para "Relatorios", ajustar subtitulo |
| `src/components/ClienteSidebar.tsx` | Renomear "Dashboard" para "Relatorios" na sidebar |

### Nenhum arquivo novo necessario

- Reutiliza `DiagnosticoTermometro` ja existente
- Reutiliza `RadarChart` do recharts ja instalado
- Segue o mesmo padrao de codigo do `ClientePlanoMarketing.tsx`

### Logica de Score

Cada pergunta contribui para um dos 5 eixos do radar. Respostas mais maduras recebem maior pontuacao (ex: "Sim, completo" = 3 pts, "Parcial" = 2, "Nao" = 0). O score final e a media ponderada de todos os eixos, convertida em percentual para o termometro.

### Insights com direcionamento para modulos

Os insights serao gerados dinamicamente com base nos scores por eixo:
- Score baixo em "Gestao de Leads" -> recomenda CRM e follow-up
- Score baixo em "Ferramentas" -> recomenda Agente de IA
- Score baixo em "Processo" -> recomenda Scripts
- Score baixo em "Canais" -> recomenda Disparos

Cada insight tera um botao "Iniciar agora" com `useNavigate()` para o modulo correspondente, identico ao padrao da Estrategia de Marketing.

### Persistencia

Os dados do diagnostico serao salvos em `localStorage` (chave `plano_vendas_data`), mesma abordagem da Estrategia de Marketing, ate que a persistencia em banco seja implementada.

