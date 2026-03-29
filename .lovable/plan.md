

## Hub de Integrações do CRM — Tutorial Interativo por Fonte de Lead

### Objetivo
Substituir a aba "Integrações" atual (que só tem webhook genérico + CSV) por um hub visual e interativo onde o cliente escolhe **de onde vêm seus leads** e recebe um guia passo-a-passo para configurar cada integração.

### Fontes de Lead (cards visuais)

| Fonte | Ícone | Método | Descrição |
|-------|-------|--------|-----------|
| **Site / Landing Page** | Globe | Webhook direto | Colar a URL do webhook no formulário do site |
| **Meta Ads (Facebook/Instagram)** | Facebook icon | Webhook via Zapier/Make ou integração direta | Conectar formulário de lead do Meta ao CRM |
| **Google Ads** | Search | Webhook via Zapier/Make | Conectar extensões de formulário do Google |
| **WhatsApp** | MessageCircle | Integração Izitech | Leads que chegam via WhatsApp (já integrado) |
| **Formulário externo** | FileText | Webhook direto | Qualquer formulário (Typeform, Google Forms, etc.) |
| **Zapier / Make** | Zap | Webhook + automação | Usar plataforma de automação como intermediário |
| **Importar planilha** | FileSpreadsheet | Upload CSV | Importação manual em massa |

### UX — Fluxo interativo

1. **Tela inicial**: Grid de cards (2-3 colunas) com ícone, nome e descrição curta de cada fonte
2. **Ao clicar num card**: Abre um painel/dialog com tutorial passo-a-passo específico para aquela fonte:
   - **Passo 1**: Explicação do que é necessário (ex: "Acesse o Gerenciador de Anúncios do Meta")
   - **Passo 2**: A URL do webhook já pronta para copiar (gerada automaticamente com o orgId)
   - **Passo 3**: Instruções visuais de onde colar (com screenshots placeholder ou descrições claras)
   - **Passo 4**: Testar a integração (botão "Enviar lead de teste")
   - Para Zapier/Make: campo para o usuário colar a URL do webhook do Zapier/Make (bidirecional)
3. Badge de status em cada card: "Configurado" (verde) / "Pendente" (cinza)

### Mudanças técnicas

**Arquivo novo**: `src/components/crm/CrmIntegrationHub.tsx`
- Componente principal com grid de cards
- Estado para qual integração está selecionada
- Dialog/Sheet com o tutorial step-by-step para cada fonte
- Reutiliza o `webhookUrl` já existente
- Mantém a importação CSV existente inline

**Arquivo editado**: `src/components/crm/CrmIntegrations.tsx`
- Renomear para wrapper que renderiza o novo `CrmIntegrationHub`
- Ou substituir o conteúdo diretamente

**Arquivo editado**: `src/components/crm/CrmConfigPage.tsx`
- Nenhuma mudança necessária (já importa `CrmIntegrations`)

### Conteúdo dos tutoriais (por fonte)

**Site / Landing Page:**
1. Copie a URL do webhook abaixo
2. No código do seu site, envie um POST para essa URL quando o formulário for submetido
3. Campos aceitos: name, email, phone, company, source, value, tags
4. Teste enviando um lead

**Meta Ads:**
1. Acesse o Gerenciador de Anúncios do Meta
2. Vá em Integrações > Webhooks do formulário de lead
3. Cole a URL do webhook
4. Ou: use Zapier/Make como intermediário (link para o card Zapier)

**Google Ads:**
1. Extensões de formulário do Google Ads não suportam webhook direto
2. Use Zapier ou Make para conectar: Google Ads Lead Form → Webhook
3. Cole a URL do webhook no Zapier/Make

**WhatsApp (Izitech):**
1. Sua integração WhatsApp via Izitech já sincroniza contatos automaticamente
2. Para converter contatos em leads no CRM, acesse a aba Contatos e clique "Criar negociação"

**Formulário externo:**
1. Copie a URL do webhook
2. Configure seu formulário (Typeform, Google Forms, JotForm, etc.) para enviar POST para essa URL
3. Mapeie os campos do formulário para: name, email, phone

**Zapier / Make:**
1. Crie um Zap ou cenário com o trigger desejado (ex: nova resposta no Google Forms)
2. Adicione uma ação "Webhook" e cole a URL abaixo
3. Mapeie os campos para o formato JSON aceito
4. Opcional: cole a URL do seu Zap aqui para referência

**Importar planilha:**
- Mantém o componente CSV existente inline

