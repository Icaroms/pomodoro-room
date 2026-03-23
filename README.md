# 🍅 Pomodoro Room

Jogo de produtividade em pixel art. Técnica Pomodoro integrada com gamificação — complete ciclos de foco, ganhe moedas e decore o quarto.

## Gameplay

- Timer Pomodoro com tempo configurável e 4 rodadas por ciclo
- Rodadas 1-3: descanso de 5min | Rodada 4: descanso de 15min
- +10 moedas por rodada completa
- Loja de decorações com moedas acumuladas
- Drag and drop para reorganizar móveis com validação de zona
- Personagem controlável (WASD / setas / D-pad)

## Stack

HTML5 Canvas · CSS3 · JavaScript vanilla · Web Audio API · localStorage · Aseprite

## Arquitetura

```
js/
├── storage.js  → Persistência via localStorage (JSON)
├── sound.js    → Efeitos 8-bit via Web Audio API (osciladores)
├── coins.js    → Sistema de moedas (ganho/gasto/saldo)
├── timer.js    → Pomodoro 4 rodadas + integração com estados
├── shop.js     → Catálogo, compra, renderização dinâmica
├── room.js     → Canvas, grid, colisão, personagem, drag and drop
└── main.js     → Tela inicial e inicialização
```

Ordem de carregamento: `storage → sound → coins → timer → shop → room → main`

## Colisão e zonas

Grid 4×5 sobre canvas 528×656 (room 132×164 em escala 4×).

| Zona | Rows | Aceita |
|---|---|---|
| Bloqueada (teto) | 0 | Nada |
| Parede | 1 | Quadros, luminária |
| Chão | 2-4 | Móveis, personagem |

Anti-sobreposição entre itens. Exceção: computador sobre mesa. Personagem colide com móveis.

## Estados do personagem

| Estado | Trigger | Comportamento |
|---|---|---|
| Idle | Padrão | Movimenta, arrasta itens |
| Focado | Timer iniciado | Sprite de trabalho sobreposto no PC/cadeira |
| Dormindo | Botão dormir | Sprite de sono sobreposto na cama, bloqueia ações |

## Sprites

Todos em 32×32px, fundo transparente, escala 4× no canvas via `imageSmoothingEnabled = false`.

Personagem: 4 idle + 12 walk frames (3 por direção, ciclo ping-pong) + sleep + work (2 partes).