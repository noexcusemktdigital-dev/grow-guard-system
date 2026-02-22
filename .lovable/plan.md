
# Tutorial de Integracao Z-API Aprimorado

## O que muda

### 1. Wizard expandido de 3 para 5 passos com conteudo visual rico

O `WhatsAppSetupWizard.tsx` sera completamente refeito. Em vez de um Sheet lateral estreito, usaremos um **Dialog grande** (max-w-2xl) para comportar imagens e conteudo detalhado.

**Novos passos:**

1. **Boas-vindas + Aviso de conta paga** -- Explica o que e a Z-API, destaca que e necessario um plano pago para remover a marca de trial nas mensagens, com um alerta amarelo visivel
2. **Criar conta na Z-API** -- Passo a passo visual com capturas de tela ilustrativas (usaremos placeholders estilizados com icones e descricoes detalhadas simulando screenshots), link direto para z-api.io, explicando como criar conta
3. **Criar e conectar instancia** -- Instrucoes de como criar uma instancia, conectar via QR Code, com destaques visuais
4. **Inserir credenciais** -- Campos para Instance ID, Token e Client-Token, com indicacoes visuais de onde encontrar cada um no painel Z-API
5. **Conectar e confirmar** -- Botao de conexao, loading, resultado com status

### 2. Aviso sobre conta trial da Z-API

- No passo 1 do wizard: alerta amarelo/amber destacado com icone de atencao
- Texto claro: "Para enviar mensagens sem a marca de trial, e necessario ter um plano pago na Z-API"
- Na pagina de Integracoes (`ClienteIntegracoes.tsx`): se conectado, mostrar um card informativo discreto lembrando sobre o plano pago

### 3. Botao de suporte

- No wizard: botao "Precisa de ajuda?" no rodape de cada passo, que abre link para suporte (WhatsApp ou pagina de atendimento)
- Na pagina de Integracoes: botao "Solicitar ajuda na implantacao" que direciona para o suporte

### 4. Estilo visual aprimorado

- Cada passo tera um card com numero grande, titulo em negrito e descricao
- Areas de destaque com bordas coloridas e fundo sutil para simular capturas de tela
- Icones Lucide grandes para ilustrar cada acao (Monitor, QrCode, Key, etc.)
- Progress bar horizontal no topo mostrando avanco
- Tipografia seguindo o padrao premium do projeto (Inter, uppercase labels)

## Arquivos a editar

| Acao | Arquivo |
|------|---------|
| Reescrever | `src/components/cliente/WhatsAppSetupWizard.tsx` -- wizard expandido com 5 passos, imagens, aviso trial, botao suporte |
| Editar | `src/pages/cliente/ClienteIntegracoes.tsx` -- adicionar aviso trial e botao suporte |

## Detalhes Tecnicos

- O wizard usara `Dialog` (max-w-2xl) em vez de `Sheet` para ter mais espaco
- Os "screenshots" serao simulados com cards estilizados usando icones Lucide e bordas, sem necessidade de imagens externas reais
- O botao de suporte abrira `window.open()` para um link configuravel (pode ser WhatsApp do suporte ou pagina de atendimento)
- Nenhuma alteracao de banco de dados necessaria
- A logica de conexao (handleConnect, useSetupWhatsApp) permanece identica
