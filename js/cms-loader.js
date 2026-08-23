
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

fetch('/content/site.json')
  .then((r) => r.json())
  .then((data) => {
    document.querySelectorAll('[data-cms]').forEach((el) => {
      const key = el.getAttribute('data-cms');
      if (data[key] === undefined) return;
      if (el.hasAttribute('data-cms-attr')) {
        const attr = el.getAttribute('data-cms-attr');
        el.setAttribute(attr, data[key]);
      } else {
        el.innerHTML = escapeHTML(data[key]).replace(/\n/g, '<br>');
      }
    });
  })
  .catch((err) => console.error('Erro ao carregar conteúdo do CMS:', err));
