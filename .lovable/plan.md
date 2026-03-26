

## 1. Ícone de Olho para Visualizar Senha + 2. Corrigir Erro no Reset de Senha

### Problema 1: Falta ícone de visualizar senha
Todos os campos de senha no sistema são `type="password"` fixo, sem opção de alternar visibilidade.

### Problema 2: Erro ao redefinir senha na criação de conta
Os logs de autenticação mostram erro `same_password` (422) repetidamente quando o usuário tenta definir a senha via link de convite. Isso indica que o fluxo de recovery está tentando atualizar a senha mas o Supabase detecta que é igual à anterior — possivelmente porque a sessão de recovery não está sendo processada corretamente no `ResetPassword.tsx` (o `useEffect` que verifica `type=recovery` não faz nada útil, e o `supabase.auth.updateUser` pode estar sendo chamado sem uma sessão de recovery válida).

### Solução

**1. Componente reutilizável `PasswordInput`**

Criar `src/components/ui/password-input.tsx` — um wrapper do `Input` que:
- Aceita todas as mesmas props do Input
- Adiciona botão de olho (Eye/EyeOff do Lucide) no lado direito
- Alterna entre `type="password"` e `type="text"`
- Funciona com o padding esquerdo existente (ícone de cadeado)

**2. Substituir todos os campos de senha pelo novo componente**

Arquivos afetados:
- `src/pages/Auth.tsx` — campo de login
- `src/pages/SaasAuth.tsx` — campos de login e cadastro
- `src/pages/ResetPassword.tsx` — campos de nova senha e confirmação
- `src/pages/cliente/ClienteConfiguracoes.tsx` — campos de definir senha

**3. Corrigir fluxo de reset de senha**

No `ResetPassword.tsx`, o `useEffect` atual não processa o token de recovery. Corrigir para:
- Detectar o hash fragment com `access_token` e `type=recovery`
- Chamar `supabase.auth.setSession()` com o token do hash para estabelecer a sessão de recovery antes de permitir o `updateUser`
- Mostrar estado de carregamento enquanto processa o token
- Mostrar erro claro se não houver sessão válida

### Detalhes técnicos

**PasswordInput component:**
```tsx
// Toggle entre Eye e EyeOff
const [show, setShow] = useState(false);
<Input type={show ? "text" : "password"} className="pr-10" {...props} />
<button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2">
  {show ? <EyeOff /> : <Eye />}
</button>
```

**Fix do ResetPassword — processar sessão de recovery:**
```tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setSessionReady(true);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

### Arquivos
- `src/components/ui/password-input.tsx` — novo componente
- `src/pages/Auth.tsx` — usar PasswordInput
- `src/pages/SaasAuth.tsx` — usar PasswordInput
- `src/pages/ResetPassword.tsx` — usar PasswordInput + corrigir sessão de recovery
- `src/pages/cliente/ClienteConfiguracoes.tsx` — usar PasswordInput

