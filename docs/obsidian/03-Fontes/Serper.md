# Serper no God Money

## Papel da Serper

A Serper deve ser usada como **fallback inteligente**, não como fonte principal.

## Ordem recomendada

1. cache do Supabase
2. InfoMoney
3. Serper fallback
4. cache novamente

## Benefícios

- melhora cobertura de notícias
- reduz falhas quando o scraping principal vier fraco
- evita depender de IA paga para enriquecimento simples

## Uso no projeto

O projeto foi preparado para usar:

```text
SERPER_API_KEY
SERPER_SEARCH_ENDPOINT
SERPER_RESULTS_LIMIT
```

## Onde isso impacta

- `/noticias`
- `/acao`
- `/radar`
