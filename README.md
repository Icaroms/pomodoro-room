# 🍅 Pomodoro Room

Jogo de produtividade em pixel art. Use a técnica Pomodoro para ganhar moedas e decorar seu quarto.

## Gameplay

- Defina o tempo de foco e inicie o timer
- 4 rodadas por ciclo (3 pausas de 5min + 1 de 15min)
- +10 moedas por rodada completa
- Gaste moedas na loja para decorar o quarto
- Arraste móveis para reorganizar
- Mova o personagem com WASD / setas / D-pad

## Stack

- HTML5 Canvas
- CSS3
- JavaScript (vanilla)
- Web Audio API (efeitos sonoros 8-bit)
- localStorage (persistência)
- Piskel (sprites)

## Estrutura

```
├── index.html
├── css/style.css
├── js/
│   ├── storage.js    → localStorage
│   ├── sound.js      → áudio 8-bit
│   ├── coins.js      → sistema de moedas
│   ├── timer.js      → pomodoro 4 rodadas
│   ├── shop.js       → loja
│   ├── room.js       → canvas, personagem, drag and drop
│   └── main.js       → inicialização
└── assets/sprites/   → pixel art 32x32
```

## Mecânicas

| Ação | Comportamento |
|---|---|
| Foco ativo | Personagem senta no PC (Work sprites sobrepostos) |
| Dormir | Personagem deita na cama (Sleep sprite sobreposto) |
| Dormindo | Bloqueia todas as ações até acordar |
| Sem luminária | Quarto escuro (overlay de sombra) |
| Drag and drop | Valida zona (chão/parede) e anti-sobreposição |

## Próximos passos

- Sprites dos itens da loja
- Ajuste do D-pad mobile
- Botões com sprites pixel art
