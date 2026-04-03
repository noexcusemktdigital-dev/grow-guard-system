

## Plano — Resolver instabilidade de sessão, logouts e redirecionamentos

### Diagnóstico

Após revisão completa, o **AuthContext** e o **ProtectedRoute** já possuem as correções de race condition (getSession primeiro, listener depois, sem await no callback). Porém, há um problema crítico restante:

### Problema Principal: Script anti-DevTools em `index.html`

O `index.html` (linhas 23-35) contém um script de proteção anti-DevTools que:

1. **Destrói o DOM inteiro** (`document.body.innerHTML = ...`) quando detecta DevTools ou diferença de tamanho de janela > 170px
2. **Redireciona para `/`** após 2 segundos (`window.location.href = "/"`)
3. **Roda a cada 1 segundo** via `setInterval`, verificando `outerWidth - innerWidth > 170`
4. **Sobrescreve `window.console`** (linha 33) — mata todos os logs, incluindo o logger de autenticação

**Este script é a causa raiz da instabilidade.** Falsos positivos acontecem quando:
- O navegador está com sidebar, bookmarks bar, ou extensões que alteram o tamanho da janela
- O usuário redimensiona a janela
- Dispositivos com DPI alto ou telas menores produzem diferenças de tamanho que excedem 170px
- O preview do Lovable roda dentro de um iframe que afeta as medições

Quando dispara, ele **apaga toda a aplicação React**, destrói o estado em memória e redireciona — causando exatamente os sintomas relatados (logout, perda de estado, redirecionamento indevido).

### Correção

#### Arquivo: `index.html`

**Remover completamente o script anti-DevTools** (linhas 23-35). Este script:
- Causa falsos positivos que destroem a sessão do usuário
- Sobrescreve `window.console`, impedindo debug e logging
- Não oferece proteção real (qualquer pessoa pode desabilitá-lo)
- É incompatível com o ambiente de preview do Lovable

Manter apenas a proteção de context menu se desejado, mas sem destruição do DOM.

### Arquivos

| Arquivo | Acao |
|---------|------|
| `index.html` | Remover script anti-DevTools (linhas 23-35) |

### Resultado

- Fim dos logouts fantasma causados por destruicao do DOM
- Console funcional para logging e debug
- Sessao preservada durante toda a navegacao
- Sem redirecionamentos indevidos por falsos positivos do detector de janela

