// Carrega o conteúdo editável (content/site.json) e injeta nos elementos
// do HTML que tiverem o atributo data-cms="chaveCorrespondente".
//
// Exemplo de uso no index.html:
//   <h1 data-cms="heroTitle">UAI AÇAÍ</h1>
//   <p data-cms="heroSubtitle">O melhor açaí da cidade</p>
//
// Basta adicionar o atributo data-cms nos elementos que você quer
// liberar para o cliente editar pelo painel /admin.

fetch('/content/site.json')
  .then((r) => r.json())
  .then((data) => {
    document.querySelectorAll('[data-cms]').forEach((el) => {
      const key = el.getAttribute('data-cms');
      if (data[key] === undefined) return;

      // Links de WhatsApp usam o número num atributo href, não em texto.
      if (el.hasAttribute('data-cms-attr')) {
        const attr = el.getAttribute('data-cms-attr');
        el.setAttribute(attr, data[key]);
      } else {
        // Quebras de linha digitadas pelo cliente viram <br>, pra manter
        // formatação tipo "rua numa linha, cidade na outra".
        el.innerHTML = String(data[key]).replace(/\n/g, '<br>');
      }
    });
  })
  .catch((err) => console.error('Erro ao carregar conteúdo do CMS:', err));
