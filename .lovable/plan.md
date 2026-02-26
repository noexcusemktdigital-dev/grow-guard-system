

## Plano: Perguntas Fechadas, Perguntas Condicionais por Tipo de Site e Limites de Plano

### Resumo

Tres mudancas principais:
1. Converter campos texto livre para perguntas fechadas (select/multi-select) em todos os agentes
2. Tornar as perguntas do Alex (Sites) condicionais ao tipo e objetivo do site, com perguntas especificas e campo de referencias/links
3. Adicionar suporte a limites de plano nos seletores de quantidade

---

### 1. ALEX_STEPS — Perguntas condicionais por tipo/objetivo de site

O roteiro do Alex hoje tem 22+ perguntas identicas independente do tipo de site. A mudanca:

**Tipos de site expandidos (com descricoes mais ricas):**
- Landing Page (1 pagina — hero, features, CTA)
- Site Institucional (3-5 paginas)
- Portfolio / Showcase
- E-commerce / Loja Virtual
- Blog / Conteudo

**Perguntas condicionais via `skipIf`:**

| Pergunta | LP | Institucional | Portfolio | E-commerce |
|---|---|---|---|---|
| Secoes desejadas (multi-select) | Sim | Sim | Sim | Sim |
| Quantidade de paginas | Nao | Sim | Sim | Sim |
| Catalogo/produtos | Nao | Nao | Nao | Sim |
| Cases/trabalhos | Nao | Nao | Sim | Nao |
| Formulario de contato | Sim | Sim | Sim | Nao |
| Carrinho/checkout | Nao | Nao | Nao | Sim |
| Blog integrado | Nao | Sim | Nao | Nao |
| Depoimentos | Sim | Sim | Sim | Sim |
| Numeros de impacto | Sim | Sim | Nao | Nao |

**Perguntas condicionais por objetivo:**

| Pergunta | Gerar Leads | Vender Online | Apresentar | Portfolio |
|---|---|---|---|---|
| Formulario lead magnet | Sim | Nao | Nao | Nao |
| Gateway de pagamento | Nao | Sim | Nao | Nao |
| Secao equipe | Nao | Nao | Sim | Nao |
| Galeria de projetos | Nao | Nao | Nao | Sim |

**Novo: Campo de referencias visuais (multi-step):**
- Pergunta "Tem algum site de referencia?" com opcoes: "Sim, tenho links", "Nao tenho"
- Se "sim": campo text para URL 1, opcao de adicionar mais (ate 3 links)
- Pergunta "O que voce gosta nessas referencias?" com multi-select: "Layout", "Cores", "Tipografia", "Animacoes", "Fotos", "Estilo geral"

**Secoes do site como multi-select (condicional ao tipo):**

Para LP:
- Hero com CTA, Features/Beneficios, Depoimentos, FAQ, Numeros, Formulario, Footer

Para Institucional:
- Hero, Sobre nos, Servicos, Equipe, Depoimentos, Blog, Contato, FAQ, Footer

Para Portfolio:
- Hero, Galeria de projetos, Sobre, Servicos, Contato, Footer

Para E-commerce:
- Hero, Catalogo, Produto destaque, Depoimentos, FAQ, Contato, Footer

---

### 2. Converter campos texto para perguntas fechadas (todos os agentes)

#### ALEX (Sites) — Conversoes

| Campo | Antes | Depois |
|---|---|---|
| `cta` | text | select: "Solicitar Orcamento", "Agendar Demo", "Comprar Agora", "Falar no WhatsApp", "Baixar Material", "Conhecer Planos", "Outro (custom)" |
| `segmento` | text | select (reutilizar opcoes da Sofia) |
| `faixaPreco` | text | select: "Nao exibir", "Ate R$ 100", "R$ 100-500", "R$ 500-2k", "R$ 2-10k", "R$ 10k+", "Sob consulta" |
| `faixaEtaria` | text | select (reutilizar opcoes da Sofia) |
| `coresPrincipais` | text | select: "Azul", "Verde", "Vermelho", "Roxo", "Laranja", "Preto/Dourado", "Rosa", "Usar da minha marca", "Deixar a IA escolher" |
| `fontesPreferidas` | text | select: "Moderna (Inter, Poppins)", "Classica (Playfair, Merriweather)", "Clean (Helvetica, Arial)", "Ousada (Montserrat Bold)", "Deixar a IA escolher" |
| `tomComunicacao` | text | select: "Profissional", "Descontraido", "Tecnico", "Inspirador", "Sofisticado" |
| `publicoAlvo` | textarea | multi-select: "Empresas (B2B)", "Consumidor final", "Profissionais liberais", "Jovens 18-30", "Adultos 30-50", "Premium/alto padrao" |
| `dores` | textarea | multi-select: "Falta de tempo", "Dificuldade de encontrar", "Preco alto", "Falta de confianca", "Necessidade urgente", "Baixa visibilidade" |
| `depoimentos` | textarea | select "Sim/Nao" + textarea condicional (skipIf) |
| `numerosImpacto` | text | select "Sim/Nao" + text condicional |
| `nomeEmpresa`, `slogan`, `descricaoNegocio`, `servicos`, `diferencial` | text/textarea | **Permanecem** (dados unicos) |
| `telefone`, `email`, `endereco`, `redesSociais`, `linkWhatsapp` | text | **Permanecem** (dados unicos) |

#### LUNA (Conteudos) — Conversoes

| Campo | Antes | Depois |
|---|---|---|
| `tema` | text | select: "Automacao", "Vendas", "Black Friday", "Lancamento", "Autoridade", "Cases", "Bastidores", "Tendencias", "Sazonalidade", "Produto/Servico", "Educativo" |
| `promocoes` | textarea | select "Sim/Nao" + textarea condicional |
| `datas` | textarea | multi-select com datas comuns: "Carnaval", "Dia da Mulher", "Pascoa", "Dia das Maes", "Dia dos Namorados", "Dia dos Pais", "Black Friday", "Natal", "Nenhuma" |
| `destaques` | textarea | multi-select: "Novo produto", "Case de sucesso", "Parceria", "Premiacao", "Evento" |
| `persona_nome` | text | select: "Empreendedor(a)", "Gestor(a)", "Profissional liberal", "Dono(a) de loja", "Estudante", "Personalizar" |
| `persona_descricao` | textarea | multi-select de caracteristicas: "25-34 anos", "35-44 anos", "Classe A/B", "Classe B/C", "Busca praticidade", "Busca economia", "Usa redes sociais", "Decide por indicacao" |

#### THEO (Artes) — Conversoes

| Campo | Antes | Depois |
|---|---|---|
| `temas` | text | multi-select: "Tecnologia", "Crescimento", "Natureza", "Luxo", "Urbano", "Abstrato", "Pessoas", "Minimalismo" |
| `promocoes` | textarea | select "Sim/Nao" + textarea condicional |
| `obs` | textarea | multi-select: "Incluir logo", "Usar cores da marca", "Texto grande", "Sem texto na imagem", "Incluir QR Code" + textarea condicional para "Outro" |
| `descricao_produto` | textarea | multi-select: "Premium/luxo", "Acessivel/popular", "Tecnologico", "Artesanal", "Natural/organico" |
| `persona_nome` | text | select (mesmo da Luna) |
| `persona_descricao` | textarea | multi-select (mesmo da Luna) |

#### SOFIA — Conversoes menores

| Campo | Antes | Depois |
|---|---|---|
| `cliente_ideal` | textarea | multi-select de perfis + opcao "Personalizar" com textarea condicional |
| `diferencial` | textarea | multi-select: "Atendimento personalizado", "Preco competitivo", "Velocidade", "Qualidade premium", "Tecnologia", "Localizacao" |
| `tentativas` | textarea | multi-select: "Contratei agencia", "Fiz sozinho", "Ads sem resultado", "Influenciadores", "Nada funcionou", "Nunca tentei" |

#### RAFAEL — Ja 100% fechado, sem mudancas

---

### 3. Limites de plano nos seletores de quantidade

**ChatBriefing.tsx:**
- Adicionar prop `context?: Record<string, any>` com dados do plano
- Suportar `dynamicOptions: (ctx: Record<string, any>, answers: Record<string, any>) => BriefingStepOption[]` no BriefingStep
- Interpolar variaveis `{saldo}`, `{max}`, `{planName}` no `agentMessage` usando context
- Validar total selecionado antes de avancar

**Steps de quantidade (Luna, Theo):**
- Antes do bloco de quantidades, step `info` do agente: "Seu plano {planName} permite ate {max} conteudos/mes. Voce ja usou {used}, entao pode criar ate {saldo}."
- Opcoes de quantidade geradas dinamicamente: 0 ate min(5, saldo restante)

**Steps de site (Alex):**
- Step `info`: "Seu plano permite ate {maxSites} sites. Voce ja tem {usedSites}."
- Se no limite, bloqueia criacao

**Paginas que passam context:**
- `ClienteConteudos.tsx`: `{ maxContents, usedContents, planName }`
- `ClienteRedesSociais.tsx`: `{ maxArts, usedArts, planName }`
- `ClienteSites.tsx`: `{ maxSites, usedSites, planName }`

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/cliente/briefingAgents.ts` | Editar — reescrever ALEX_STEPS com perguntas condicionais, converter ~20 campos text para select/multi-select em Luna/Theo/Sofia/Alex, adicionar dynamicOptions |
| `src/components/cliente/ChatBriefing.tsx` | Editar — adicionar prop `context`, suporte a `dynamicOptions`, interpolacao de variaveis, validacao de limites |
| `src/pages/cliente/ClienteConteudos.tsx` | Editar — passar context com limites do plano |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — passar context com limites do plano |
| `src/pages/cliente/ClienteSites.tsx` | Editar — passar context com limites do plano |

### Garantias

- Nenhum edge function alterado
- Nenhum payload muda (chaves dos answers identicas)
- Logica de scoring (Sofia/Rafael) intacta
- Campos que sao dados unicos do cliente (nome, slogan, servicos, contatos) continuam como texto livre
- Campos de referencia visual ganham suporte a links multiplos

