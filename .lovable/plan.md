

# Login da Franquia com Tema Espacial + Logos NoExcuse

## Resumo

Redesign do painel esquerdo da pagina de login da franquia (`/auth`) com tema espacial animado, logos oficiais da NoExcuse e frases motivacionais rotativas. Tambem atualizar o login SaaS (`/app/auth`) com a logo correta.

---

## Logos a serem adicionados ao projeto

| Arquivo | Uso | Destino |
|---|---|---|
| `noe2.png` | Logo fundo claro (vermelho/preto) | `src/assets/noe2.png` -- formulario mobile, areas claras |
| `NOE3.png` | Logo fundo escuro (vermelho/branco) | `src/assets/NOE3.png` -- painel espacial, login SaaS |

---

## Fase 1 -- Componente SpaceScene

### Criar `src/components/ui/space-login-scene.tsx`

Componente do painel esquerdo com:

- **Fundo espacial**: Background escuro (#0a0a1a) com estrelas animadas (twinkle), nebulosas (gradientes radiais roxo/azul sutis)
- **Foguete SVG**: Segue o mouse com movimento suave (lerp), chamas animadas na base, inclinacao limitada
- **Astronauta SVG**: Flutuacao suave (bob animation), olha na direcao do mouse
- **Logo NoExcuse** (NOE3.png -- versao fundo escuro): Posicionada no topo do painel, importada como asset
- **Frases rotativas** acima dos personagens, trocando a cada 5 segundos com fade:
  - "Sem desculpas. So resultados."
  - "Sua franquia no proximo nivel."
  - "Gestao inteligente, crescimento real."
  - "Cada dia e uma nova chance de liderar."
  - "Disciplina hoje, liberdade amanha."
  - "Foco no processo, o resultado vem."

### Interatividade:
- Mouse tracking com `mousemove` para foguete e astronauta
- Foguete inclina suavemente na direcao do mouse (max 15 graus)
- Astronauta vira levemente e flutua independentemente
- Estrelas com diferentes velocidades de twinkle

---

## Fase 2 -- Atualizar Auth.tsx (Login Franquia)

### Painel esquerdo:
- Substituir o gradiente atual pelo componente `SpaceScene`

### Painel direito (formulario):
- Manter logica de login intacta
- Trocar o texto "NO EXCUSE" por `<img>` usando `noe2.png` (logo fundo claro) no mobile
- Manter "Acesso somente por convite do administrador"

---

## Fase 3 -- Atualizar SaasAuth.tsx (Login SaaS)

- Substituir o texto "NOEXCUSE" no painel esquerdo pela imagem `NOE3.png` (logo fundo escuro)
- Substituir o texto "NOEXCUSE" no mobile pela imagem `NOE3.png`
- Manter toda a logica de autenticacao intacta

---

## Detalhes Tecnicos

### Arquivos:

| Acao | Arquivo |
|---|---|
| Copiar | `user-uploads://noe2.png` -> `src/assets/noe2.png` |
| Copiar | `user-uploads://NOE3.png` -> `src/assets/NOE3.png` |
| Criar | `src/components/ui/space-login-scene.tsx` |
| Modificar | `src/pages/Auth.tsx` |
| Modificar | `src/pages/SaasAuth.tsx` |

### Importacao dos assets nos componentes:

```text
import logoLight from "@/assets/noe2.png";  // Auth.tsx (mobile)
import logoDark from "@/assets/NOE3.png";   // SpaceScene + SaasAuth
```

### Animacoes CSS (keyframes no componente):
- `twinkle`: opacidade das estrelas (0.3 -> 1 -> 0.3)
- `float`: astronauta flutuando (translateY -5px -> 5px)
- `flame`: chamas do foguete (scaleY 0.8 -> 1.2, opacidade)
- `fade-phrase`: transicao das frases (opacity 0 -> 1 -> 0)

### Mouse tracking:
- `useEffect` com `mousemove` listener
- `useRef` + `requestAnimationFrame` para lerp suave
- Posicoes limitadas com `Math.max/Math.min`

