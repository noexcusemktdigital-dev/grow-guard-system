

## Plano: Pop-up de boas-vindas para novos franqueados

### O que será criado

Um componente `FranqueadoWelcomeModal` que aparece uma única vez para franqueados novos, com uma mensagem transparente sobre o sistema estar em fase de evolução e convidando-os a reportar erros e sugerir melhorias.

### Componente: `src/components/FranqueadoWelcomeModal.tsx`

- Segue o mesmo padrão do `TrialWelcomeModal` (localStorage para exibir apenas uma vez, delay de 800ms)
- **Header**: Icone + "Bem-vindo à rede NOEXCUSE!" com gradiente premium
- **Corpo**:
  - Mensagem explicando que o sistema é novo e está em constante evolução
  - Lista de pontos: "Estamos ajustando funcionalidades", "Sua opinião é essencial", "Encontrou um erro? Nos avise pelo Suporte"
  - Tom acolhedor e transparente
- **CTA**: "Entendi, vamos lá!" (fecha o modal) + link secundário "Abrir Suporte" (navega para `/franqueado/suporte`)
- Controle via `localStorage` key `franqueado_welcome_seen`

### Integração: `src/components/FranqueadoLayout.tsx`

- Importar e renderizar `<FranqueadoWelcomeModal />` ao lado dos outros popups já existentes

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/FranqueadoWelcomeModal.tsx` | Novo componente |
| `src/components/FranqueadoLayout.tsx` | Adicionar o modal |

