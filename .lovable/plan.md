

## Diagnóstico: Evolution API mostra "Desconectado"

### Problema Identificado

Analisando os logs da edge function `whatsapp-setup`, o check-status **nunca logou** uma verificação Evolution — só aparecem logs de Z-API. Isso indica que a chamada ao endpoint `GET /instance/connectionState/NOEXCUSE` está falhando silenciosamente (caindo no `catch` vazio).

A instância no banco tem os dados corretos:
- `base_url`: `http://129.121.44.154:8080`
- `instance_id`: `NOEXCUSE`
- `client_token`: `99808b60-2f06-4f00-94b7-89765259b66d`

Possíveis causas:
1. O IP `129.121.44.154:8080` pode não estar acessível a partir dos servidores da edge function (firewall, rede privada)
2. A Evolution API pode retornar um formato diferente do esperado
3. O `catch` vazio engole o erro sem logar

### Correções

#### `whatsapp-setup/index.ts`

1. **Adicionar logging nos catches** — tanto no connect quanto no check-status, logar o erro real em vez de engolir silenciosamente:
   - No check-status Evolution (linha ~93-99): adicionar `console.error` no catch
   - No connect Evolution connectionState (linha ~200-210): adicionar `console.error` no catch
   - No check-status geral (linha ~145): adicionar `console.error` no catch

2. **Aceitar mais formatos de resposta** do connectionState — além de `instance.state === "open"`, também verificar:
   - `stateData?.state === "open"`  
   - `stateData?.status === "CONNECTED"` (formato alternativo que algumas versões retornam)

Isso vai nos permitir ver exatamente o que está falhando nos logs na próxima tentativa.

### Arquivos Modificados
- `supabase/functions/whatsapp-setup/index.ts` (adicionar error logging nos catch blocks)

