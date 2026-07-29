# Uai Açaí
# 🍇 UAI AÇAÍ

Landing page fictícia para uma loja de açaí em Guimarânia-MG, desenvolvida como projeto de portfólio. O site é 100% front-end (HTML, CSS e JavaScript puro, sem frameworks ou dependências de build) e simula uma experiência completa de pedido: cardápio interativo, montagem de açaí personalizado com carrinho e envio do pedido pronto direto pelo WhatsApp.

> ⚠️ Projeto de portfólio — loja, endereço, telefone e demais dados são fictícios.

## ✨ Funcionalidades

- **Cardápio interativo** — cards gerados dinamicamente via JS a partir de um catálogo central (preços, tamanhos e adicionais nunca ficam hardcoded no HTML).
- **Monte seu pedido** — formulário para Açaí, Barca Especial ou Milk-Shake, com tamanhos, sabores e adicionais organizados por categoria (frutas, cremes, crocantes, caldas, premium etc.).
- **Carrinho com múltiplos itens** — adicionar, editar e remover itens, cálculo automático de subtotal e total, com persistência via `localStorage` (o pedido não se perde ao atualizar a página).
- **Pedido direto pelo WhatsApp** — o botão de confirmação monta a mensagem com todos os itens, adicionais e valores e abre o WhatsApp já com o texto preenchido.
- **"Aberto agora" / "Fechado no momento"** — status calculado em tempo real com base no dia da semana e horário de funcionamento.
- **Menu mobile (drawer)** e **FAQ em acordeão**, ambos acessíveis via teclado (ARIA `aria-expanded`, `aria-hidden`, fechamento com `Esc`).
- **Scroll reveal** com `IntersectionObserver` para animações suaves ao rolar a página.
- **Fallback de imagem** tratado via JavaScript (sem `onerror` inline no HTML), permitindo uma Content Security Policy mais restrita.
- **SEO e compartilhamento** — meta tags Open Graph e dados estruturados (`schema.org/FoodEstablishment`) para rich snippets em buscadores.
- **Mobile-first e responsivo**, com breakpoints em 480 / 768 / 1024 / 1280px.

## 🛠️ Tecnologias

- **HTML5** semântico
- **CSS3** puro (variáveis CSS, grid, flexbox — sem frameworks)
- **JavaScript** vanilla (ES6+, sem bibliotecas ou frameworks)
- Fontes: [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (títulos) e [Inter](https://fonts.google.com/specimen/Inter) (corpo de texto), via Google Fonts

## 📁 Estrutura do projeto

```
uai-acai/
├── index.html          # Estrutura da página (hero, sobre, cardápio, pedido, FAQ, rodapé)
├── css/
│   └── style.css        # Estilos, variáveis de tema e responsividade
├── js/
│   ├── script.js         # Menu mobile, FAQ, status da loja, scroll reveal, fallback de imagens
│   └── pedido.js         # Catálogo de produtos, carrinho, formulário e integração com WhatsApp
└── assets/
    ├── img/               # Imagens (hero, loja, logo)
    └── icons/              # Ícones (WhatsApp, Instagram, localização)
```

> Os arquivos `style.css`, `script.js` e `pedido.js` devem ficar dentro de `css/` e `js/`, conforme referenciado no `index.html`.

## 🔒 Segurança

O site utiliza uma **Content Security Policy** restrita (`default-src 'self'`, sem `unsafe-inline`), o que exigiu mover toda a lógica de fallback de imagens e interações para arquivos JS externos, sem scripts ou estilos inline.

## 🚀 Como rodar localmente

Por ser um projeto totalmente estático, não há instalação de dependências. Basta servir os arquivos com qualquer servidor local, por exemplo:

```bash
# Com Python
python3 -m http.server 8000

# Ou com a extensão Live Server do VS Code
```

Depois é só acessar `http://localhost:8000` no navegador.

## 📌 Sobre os dados exibidos

Todos os preços, adicionais, horários e informações de contato do cardápio são fictícios e servem apenas para fins de demonstração do projeto.

## 👤 Autor

Desenvolvido por **Rafael Corrêa**.
- 📧 rafaelcorsil2006@gmail.com
- 📷 [@rafael_coorreea](https://instagram.com/rafael_coorreea)

---

Projeto de portfólio — sinta-se à vontade para explorar o código e usar como referência de estudo.
