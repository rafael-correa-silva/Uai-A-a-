
document.addEventListener('DOMContentLoaded', () => {

  /* Fallback de imagem (hero e "sobre") via JS — antes era onerror inline no
     HTML, mas isso exigiria "unsafe-inline" no script-src da CSP. Fazendo
     assim, a política de segurança pode ficar restrita a 'self'. */
  const imgHero = document.getElementById('imgHero');
  if (imgHero) {
    imgHero.addEventListener('error', () => {
      imgHero.closest('.hero__media').classList.add('img-fallback');
      imgHero.alt = 'Foto do açaí UAI AÇAÍ (imagem indisponível)';
    });
  }
  const imgSobre = document.getElementById('imgSobre');
  if (imgSobre) {
    imgSobre.addEventListener('error', () => {
      imgSobre.parentElement.classList.add('img-fallback');
      imgSobre.alt = 'Foto da loja UAI AÇAÍ (imagem indisponível)';
    });
  }

  /* Ano no rodapé */
  const anoEl = document.getElementById('anoAtual');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /*Menu hambúrguer (drawer mobile)*/
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const menuDrawer = document.getElementById('menuDrawer');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openMenu() {
    menuDrawer.classList.add('is-open');
    menuBackdrop.classList.add('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    menuDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menuDrawer.classList.remove('is-open');
    menuBackdrop.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    menuDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = menuDrawer.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });
  }
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
  drawerLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /*Accordion FAQ (um item aberto por vez)*/
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const panel = trigger.parentElement.nextElementSibling;
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      accordionTriggers.forEach(other => {
        other.setAttribute('aria-expanded', 'false');
        other.parentElement.nextElementSibling.style.maxHeight = null;
      });

      if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /*Status "Aberto agora" / "Fechado no momento"*/
  const statusTexto = document.getElementById('statusTexto');
  const statusDot = document.getElementById('statusDot');

  function calcularStatusLoja() {
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 = domingo ... 6 = sábado
    const horaAtual = agora.getHours() + agora.getMinutes() / 60;

    const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
    const abertura = ehFimDeSemana ? 12 : 13;
    const fechamento = ehFimDeSemana ? 23 : 22;

    const aberto = horaAtual >= abertura && horaAtual < fechamento;

    if (aberto) {
      statusTexto.textContent = `Aberto agora · fecha às ${fechamento}h`;
      statusDot.classList.add('is-aberto');
      statusDot.classList.remove('is-fechado');
    } else {
      const proximaAbertura = horaAtual < abertura ? abertura : (ehFimDeSemana ? 13 : 12);
      statusTexto.textContent = `Fechado no momento, abre às ${abertura}h`;
      statusDot.classList.add('is-fechado');
      statusDot.classList.remove('is-aberto');
    }
  }
  if (statusTexto && statusDot) calcularStatusLoja();

  /*Galeria de sabores (Seção 4)*/
  const galeriaCards = document.querySelectorAll('.galeria-card');
  const secaoPedidoGaleria = document.getElementById('pedido');


  function preencherPedido(sabor, adicionaisDoCard) {
    if (typeof window.preencherFormularioPedido === 'function') {
      window.preencherFormularioPedido(sabor, adicionaisDoCard);
    }
  }

  // Dispositivos sem hover de mouse (toque) usam clique para abrir/fechar o overlay
  const ehDispositivoDeToque = window.matchMedia('(hover: none)').matches;

  if (ehDispositivoDeToque && galeriaCards.length) {
    galeriaCards.forEach(card => {
      card.addEventListener('click', () => {
        const jaEstavaAtivo = card.classList.contains('is-ativo');
        galeriaCards.forEach(outroCard => outroCard.classList.remove('is-ativo'));
        if (!jaEstavaAtivo) card.classList.add('is-ativo');
      });
    });

    // Toque fora da galeria fecha qualquer overlay aberto
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.galeria-card')) {
        galeriaCards.forEach(card => card.classList.remove('is-ativo'));
      }
    });
  }

  // Botão "Pedir" dentro do overlay — funciona em qualquer dispositivo
  const botoesPedirGaleria = document.querySelectorAll('.galeria-card__btn-pedir');
  botoesPedirGaleria.forEach(botao => {
    botao.addEventListener('click', (e) => {
      e.stopPropagation(); // evita reabrir/fechar o overlay do próprio card
      const sabor = botao.dataset.produto;

      // Lê os "adicionais típicos" mostrados no próprio card para marcar
      // automaticamente as caixinhas correspondentes no formulário de pedido
      const card = botao.closest('.galeria-card');
      const adicionaisDoCard = card
        ? Array.from(card.querySelectorAll('.galeria-card__adicionais span')).map(el => el.textContent.trim())
        : [];

      preencherPedido(sabor, adicionaisDoCard);
      if (secaoPedidoGaleria) {
        secaoPedidoGaleria.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /*Scroll reveal (IntersectionObserver)*/
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

});
