# VESA · Terminal Quantitativo das 27 Bolsas

Globo 3D com 27 bolsas, probabilidade de fechar acima da abertura (base e modelo logístico), cotação do dólar (PTAX do Banco Central), oportunidades de compra e venda com stop, alvo e tamanho de posição, e processo de gestão de risco.

Página estática: `index.html`, `engine.js` (motor quantitativo) e `worker.js` (cálculo em segundo plano). Sem build.

**Gerar de novo:** os arquivos vêm de `publicos/vesa` no projeto WAMP. Rode `roteiros/build-github-pages.ps1` e faça o commit desta pasta.

**Dados:** o USD/BRL é real (PTAX). Os preços das bolsas e ações ainda são simulados, com semente diária.

Conteúdo educacional baseado em estatística histórica. Probabilidade não é garantia; não constitui recomendação de investimento.
