

## Plano: Tela de manutenção para Marketing e Academy do Franqueado

### Abordagem

Criar um componente reutilizável `MaintenanceOverlay` que exibe uma tela de "Em manutenção" com visual premium. Aplicar diretamente nas páginas `FranqueadoMateriais.tsx` e `FranqueadoAcademy.tsx`, substituindo o conteúdo por esse overlay.

### Componente: `src/components/MaintenanceOverlay.tsx`

- Visual centralizado com ícone de construção/manutenção
- Título: "Em manutenção"
- Mensagem: "Estamos finalizando os ajustes desta ferramenta. Em breve sua unidade terá acesso completo!"
- Botão "Voltar ao início" → `/franqueado/inicio`
- Estética consistente com o design system (glassmorphism, gradientes)

### Alterações nas páginas

| Arquivo | Mudança |
|---------|---------|
| `src/components/MaintenanceOverlay.tsx` | Novo componente reutilizável |
| `src/pages/franqueado/FranqueadoMateriais.tsx` | Retornar `<MaintenanceOverlay>` no lugar do conteúdo atual |
| `src/pages/franqueado/FranqueadoAcademy.tsx` | Retornar `<MaintenanceOverlay>` no lugar do conteúdo atual |

Cada página renderizará apenas o overlay — sem carregar dados ou hooks desnecessários. Quando for liberar, basta remover o overlay e restaurar o conteúdo original.

