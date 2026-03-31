# Plano de Produto — God Money

## Tese do produto

O God Money não deve ser apenas um bot que manda notícia.

Ele deve ser um **copiloto de mercado no Telegram**, capaz de transformar excesso de informação em decisões rápidas, simples e personalizadas.

## Problema principal

O investidor pessoa física sofre com:

- excesso de notícias e ruído
- falta de contexto sobre o que realmente importa
- dificuldade de acompanhar ativos da própria carteira
- baixa disciplina de acompanhamento do mercado

## Solução central

O God Money entrega:

- notícias filtradas
- resumos acionáveis
- watchlist personalizada
- agenda econômica relevante
- alertas inteligentes por ativo e evento

## Posicionamento

**God Money: seu copiloto de mercado no Telegram.**

## Público-alvo inicial

### Primário

- investidores pessoa física no Brasil
- usuários de Telegram que consomem conteúdo financeiro
- perfis que acompanham bolsa mas não querem abrir vários apps todo dia

### Secundário

- traders iniciantes
- usuários de comunidades de investimento
- produtores de conteúdo financeiro que querem distribuição em Telegram

## Proposta de valor prática

### Gratuito

- receber notícias e resumos do mercado
- usar comandos principais
- acompanhar poucos ativos

### Pago

- alertas personalizados
- mais ativos na watchlist
- análises e explicações premium
- resumos mais profundos
- feed personalizado por perfil

## Princípios do produto

1. **Velocidade antes de complexidade**
2. **Clareza antes de volume**
3. **Personalização antes de generalismo**
4. **Cache e automação antes de IA cara**
5. **Retenção antes de escala de mídia paga**

## Produto mínimo forte (MVP profissional)

- `/start` com onboarding por perfil
- `/menu`
- `/noticias`
- `/ibov`
- `/acao TICKER`
- `/agenda`
- `/resumo`
- watchlist inicial por usuário
- resumo diário automático
- cache de notícias no Supabase
- workflow n8n para pré-mercado e fechamento
