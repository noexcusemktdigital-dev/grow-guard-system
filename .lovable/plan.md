

# Corrigir erro "Cliente invalido" na criacao de assinatura Asaas

## Problema

A organizacao "Empresa Teste" possui um `asaas_customer_id` (`cus_000109824322`) que foi criado quando o `ASAAS_BASE_URL` estava incorreto. Esse ID nao existe no Sandbox real do Asaas, causando o erro "Cliente invalido ou nao informado" ao tentar criar a assinatura.

## Solucao

Limpar o `asaas_customer_id` da organizacao para que a Edge Function crie um novo cliente valido no Sandbox correto.

## Passo a passo

1. **Executar migration SQL** para limpar o campo `asaas_customer_id` da organizacao teste:

```sql
UPDATE organizations
SET asaas_customer_id = NULL
WHERE id = 'adb09618-e9f3-4dbd-a89c-29e3eb1bec9f';
```

2. **Testar o fluxo** chamando `asaas-create-subscription` novamente -- a funcao vai:
   - Detectar que `asaas_customer_id` e NULL
   - Criar um novo cliente no Sandbox correto (`https://api-sandbox.asaas.com/v3`)
   - Salvar o novo ID
   - Criar a assinatura com sucesso

## Observacao

A funcao `asaas-create-subscription` ja possui a logica de criar o cliente quando `asaas_customer_id` e null (linhas 82-103 do codigo), entao nenhuma alteracao de codigo e necessaria.

