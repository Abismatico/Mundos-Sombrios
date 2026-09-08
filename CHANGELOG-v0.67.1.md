# Mundos Sombrios — v0.67.1

Atualização visual dos cards de seleção de classes e expansões.

## Novas artes integradas
### Êxodo: Assimilação
- Nexo Padrão → arte biomecânica de assimilação.
- Classer / Linhagem Herdada → arte de linhagem genética ancestral.
- Operador de Sistema → arte cibernética com HUD, IA e interfaces Kafra.
- Aprimorador → arte de engenharia biológica e aprimoramento experimental.

### Ocultatun: Ecos da Decadência
- Mercador da Morte → arte de mercador ocultista e relíquias funerárias.
- Carrasco Cinzento → arte de executor/caçador de contenção.
- Alquerino → arte alquímica e transmutacional.
- Hermético → arte de geometria ritual e conhecimento hermético.
- Taumatúrgico → arte de manifestação ritual e força taumatúrgica.
- Esotérico → arte de investigação e percepção do oculto.
- Ordem dos Sete → arte de ascensão, Recordação e geometria sagrada.
- Envolto → arte de corrupção ontológica e anti-existência.

## Implementação
- As 12 novas imagens foram convertidas para WebP em 900×1200 (3:4), qualidade 88, para reduzir o peso de carregamento mantendo detalhe adequado aos cards.
- Os SVGs antigos foram preservados como fallback e para as demais classes não substituídas nesta etapa.
- `MS_ARCHETYPE_ART` agora aceita `image` explícita por arquétipo; quando ausente, continua derivando o SVG antigo automaticamente.
