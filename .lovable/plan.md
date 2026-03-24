

# Adicionar botão de redirecionamento ao alerta de CNPJ

## Problema

Quando o cliente tenta assinar um plano ou fazer recarga sem ter CNPJ/CPF cadastrado, aparece um alerta informando que ele precisa preencher os dados em "Configurações → Organização", mas não há nenhum botão para levá-lo diretamente a essa página.

## Correção

### Arquivo: `src/pages/cliente/ClientePlanoCreditos.tsx`

Na linha 488-492, onde o alerta `!hasCnpj` é exibido, transformar o texto estático em um bloco com botão/link que redireciona para `/cliente/configuracoes`:

```tsx
{!hasCnpj && (
  <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-center justify-between gap-2">
    <span>⚠️ Preencha o CNPJ/CPF da empresa antes de assinar.</span>
    <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate("/cliente/configuracoes")}>
      Cadastrar CNPJ
    </Button>
  </div>
)}
```

Verificar se `useNavigate` já está importado no componente (provavelmente sim). Caso contrário, adicionar o import.

---

### Arquivo afetado

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Adicionar botão "Cadastrar CNPJ" ao alerta |

