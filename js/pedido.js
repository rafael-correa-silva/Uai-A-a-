
(function () {

  
  const PRECOS_ACAI = { '300ml': 12, '500ml': 18, '700ml': 24 };

  // adicionaisInclusos = quantos adicionais (os mais caros escolhidos) saem
  // de graça nessa barca — ver separarAdicionaisBarca() mais abaixo.
  const BARCAS = {
    'Casal':   { label: 'Barca Casal — 700ml (5 adicionais inclusos)',      preco: 35, adicionaisInclusos: 5 },
    'Família': { label: 'Barca Família — 1 litro (7 adicionais inclusos)',  preco: 48, adicionaisInclusos: 7 },
    'Suprema': { label: 'Barca Suprema — 1,5 litro (10 adicionais inclusos)', preco: 65, adicionaisInclusos: 10 }
  };

  const PRECO_MILKSHAKE = 15;
  const SABORES_MILKSHAKE = ['Tradicional', 'Morango', 'Chocolate', 'Creme de Avelã', 'Paçoca'];

  const ADICIONAIS_CATALOGO = [
    { categoria: 'Frutas',        preco: 2,   itens: ['Banana', 'Morango', 'Uva', 'Kiwi', 'Manga', 'Maracujá', 'Abacaxi', 'Melancia'] },
    { categoria: 'Pós & Xaropes', preco: 2,   itens: ['Leite em pó', 'Leite condensado', 'Coco ralado', 'Mel'] },
    { categoria: 'Crocantes',     preco: 2,   itens: ['Paçoca', 'Granola', 'Castanha triturada', 'Amendoim', 'Confetes', 'Gotas de chocolate', "M&M's", 'Ovo Maltine', 'Sucrilhos', 'Biscoito triturado', 'Jujuba', 'Disquete'] },
    { categoria: 'Caldas',        preco: 2,   itens: ['Calda de chocolate', 'Calda de morango', 'Calda de caramelo', 'Calda de maracujá'] },
    { categoria: 'Cremes',        preco: 3,   itens: ['Creme de avelã (Nutella)', 'Creme de ninho', 'Creme de leite condensado (Láctea)', 'Creme de morango', 'Creme de maracujá', 'Creme de Valsa', 'Creme de Oreo'] },
    { categoria: 'Premium',       preco: 4.5, itens: ['Kinder Bueno', 'Ouro Branco', 'Sonho de Valsa', 'Chocito', 'Kit Kat', 'Creme de Bis', 'Creme de Pistache', 'Ferrero Rocher', 'Diamante Negro'] }
  ];

  // Apelidos: como o adicional aparece no card da galeria → nome exato no catálogo acima.
  // Permite marcar automaticamente as caixinhas certas mesmo quando o texto do
  // card não é idêntico ao nome cadastrado (ex: "Nutella" → "Creme de avelã (Nutella)").
  // Um item pode virar mais de um adicional real (ex: "Morango com Calda").
  const ALIASES_ADICIONAIS = {
    'nutella': ['Creme de avelã (Nutella)'],
    'castanha': ['Castanha triturada'],
    'morango com calda': ['Morango', 'Calda de morango'],
  };

  const LIMITE_ADICIONAIS_AVISO = 5;
  const CHAVE_LOCALSTORAGE = 'uaiacai_carrinho';
  const WHATSAPP_NUMERO = '5534998111439';

  function normalizarTexto(texto) {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Índice: nome normalizado -> nome exato do catálogo (montado uma única vez)
  const MAPA_ADICIONAIS_POR_NOME = {};
  ADICIONAIS_CATALOGO.forEach(grupo => {
    grupo.itens.forEach(nome => {
      MAPA_ADICIONAIS_POR_NOME[normalizarTexto(nome)] = nome;
    });
  });

  // Converte os textos exibidos no card ("Nutella", "Castanha"...) nos nomes
  // exatos usados nas caixinhas de adicionais do formulário. Textos que não
  // correspondem a nenhum adicional real (ex: "5 adicionais inclusos",
  // "Serve até 2 pessoas") são simplesmente ignorados.
  function resolverAdicionaisDoCard(textos) {
    const resultado = [];
    (textos || []).forEach(textoBruto => {
      const chave = normalizarTexto(textoBruto);
      if (ALIASES_ADICIONAIS[chave]) {
        ALIASES_ADICIONAIS[chave].forEach(nome => {
          if (!resultado.includes(nome)) resultado.push(nome);
        });
        return;
      }
      const nomeCatalogo = MAPA_ADICIONAIS_POR_NOME[chave];
      if (nomeCatalogo && !resultado.includes(nomeCatalogo)) {
        resultado.push(nomeCatalogo);
      }
    });
    return resultado;
  }

  /*
     HELPERS DE FORMATAÇÃO (definidos cedo porque o gerador do cardápio,
     logo abaixo, já precisa deles)
  */
  function formatarPreco(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
  }

  function slugify(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // "R$ 12,00 – R$ 24,00": a faixa de preço do açaí, calculada a partir de
  // PRECOS_ACAI (nunca hardcoded no HTML — muda o preço aqui e o card
  // acompanha sozinho).
  function faixaPrecoAcai() {
    const valores = Object.values(PRECOS_ACAI);
    return `${formatarPreco(Math.min(...valores))} – ${formatarPreco(Math.max(...valores))}`;
  }

  const TAMANHOS_ACAI_ORDENADOS = Object.keys(PRECOS_ACAI); // ['300ml','500ml','700ml']

  /*
     DADOS DO CARDÁPIO (Seção "Cardápio")
     Cada card é gerado a partir daqui em vez de ficar hardcoded no HTML,
     então preço/tamanho nunca ficam duplicados em dois lugares.
  */
  const CARDAPIO = [
    { tipo: 'acai', sabor: "M&M's e Calda de Morango", titulo: "M&ms & Calda de Morango",
      imagemBase: 'copo-300ml-classico', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Clássico', altFallback: 'Açaí Clássico (imagem indisponível)',
      chips: ['Calda de Morango', "M&Ms"] },

    { tipo: 'acai', sabor: 'Nutella, Morango e Leite em pó', titulo: 'Nutella & Morango & Leite em pó',
      imagemBase: 'copo-500ml-nutella-morango', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Nutella e Morango', altFallback: 'Nutella e Morango (imagem indisponível)',
      chips: ['Nutella', 'Morango', 'Leite em pó'] },

    { tipo: 'acai', sabor: 'Uva, Nutella e Leite em pó', titulo: 'Uva & Nutella & Leite em pó',
      imagemBase: 'copo-500ml-uva', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Uva', altFallback: 'Uva (imagem indisponível)',
      chips: ['Uva', 'Nutella', 'Leite em pó'] },

    { tipo: 'acai', sabor: 'Paçoca e Leite em pó', titulo: 'Paçoca & Leite em pó',
      imagemBase: 'copo-500ml-pacoca', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Paçoca', altFallback: 'Paçoca (imagem indisponível)',
      chips: ['Paçoca', 'Leite em pó'] },

    { tipo: 'acai', sabor: 'Ovo Maltine e Nutella', titulo: 'Ovo Maltine & Nutella',
      imagemBase: 'copo-500ml-kiwi-morango', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Kiwi e Morango', altFallback: 'Kiwi e Morango (imagem indisponível)',
      chips: ['Nutella', 'Ovo Maltine'] },

    { tipo: 'acai', sabor: 'Banana, Leite em pó e Leite condensado', titulo: 'Banana & Leite em pó & Leite condensado',
      imagemBase: 'copo-700ml-banana', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Banana', altFallback: 'Banana (imagem indisponível)',
      chips: ['Banana', 'Leite condensado', 'Leite em pó'] },

    { tipo: 'acai', sabor: "M&M's e Creme de Valsa", titulo: "M&M's & Creme de Valsa",
      imagemBase: 'copo-700ml-mms-morango', imgW: 500, imgH: 500,
      altImagem: "Copo de açaí sabor M&M's e Morango", altFallback: 'M&Ms e Morango (imagem indisponível)',
      chips: ["M&M's", 'Creme de Valsa'] },

    { tipo: 'acai', sabor: 'Kiwi, Morango e Leite Condensado', titulo: 'Kiwi & Morango & Leite Condensado',
      imagemBase: 'copo-700ml-sonho-valsa', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Sonho de Valsa', altFallback: 'Sonho de Valsa (imagem indisponível)',
      chips: ['Kiwi', 'Morango', 'Leite Condensado'] },

    { tipo: 'acai', sabor: 'Maracujá, Granola e Amendoim', titulo: 'Maracujá & Granola & Amendoim',
      imagemBase: 'copo-morango-granola-amendoim', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Morango, Granola e Amendoim', altFallback: 'Morango, Granola e Amendoim (imagem indisponível)',
      chips: ['Maracujá', 'Granola', 'Amendoim'] },

    { tipo: 'acai', sabor: 'Morango com Calda, Castanha e Granola', titulo: 'Morango & Castanha & Granola',
      imagemBase: 'copo-maracuja-castanha', imgW: 500, imgH: 500,
      altImagem: 'Copo de açaí sabor Maracujá e Castanha', altFallback: 'Maracujá e Castanha (imagem indisponível)',
      chips: ['Morango com calda', 'Castanha', 'Granola'] },

    { tipo: 'barca', sabor: 'Barca Casal', titulo: 'Barca Casal', barcaKey: 'Casal',
      imagemBase: 'barca-especial', imgW: 900, imgH: 600,
      altImagem: 'Barca especial de açaí Casal com diversos adicionais', altFallback: 'Barca Casal (imagem indisponível)',
      chips: ['5 adicionais inclusos', 'Serve até 2 pessoas'], tamanhoLabel: '700ml' },

    { tipo: 'barca', sabor: 'Barca Família', titulo: 'Barca Família', barcaKey: 'Família',
      imagemBase: 'barca-especial', imgW: 900, imgH: 600,
      altImagem: 'Barca especial de açaí Família com diversos adicionais', altFallback: 'Barca Família (imagem indisponível)',
      chips: ['7 adicionais inclusos', 'Serve 3 a 4 pessoas'], tamanhoLabel: '1 litro' },

    { tipo: 'barca', sabor: 'Barca Suprema', titulo: 'Barca Suprema', barcaKey: 'Suprema',
      imagemBase: 'barca-especial', imgW: 900, imgH: 600,
      altImagem: 'Barca especial de açaí Suprema com diversos adicionais', altFallback: 'Barca Suprema (imagem indisponível)',
      chips: ['10 adicionais inclusos', 'Serve 5 a 6 pessoas'], tamanhoLabel: '1,5 litro' },

    { tipo: 'milkshake', sabor: 'Milk-Shake Tradicional', titulo: 'Milk-Shake Tradicional',
      imagemBase: 'milkshake-acai', imgW: 500, imgH: 500,
      altImagem: 'Milk-shake de açaí sabor Tradicional', altFallback: 'Milk-Shake Tradicional (imagem indisponível)',
      chips: ['Batido na hora'], tamanhoLabel: 'Tamanho único' },

    { tipo: 'milkshake', sabor: 'Milk-Shake Morango', titulo: 'Milk-Shake Morango',
      imagemBase: 'milkshake-acai', imgW: 500, imgH: 500,
      altImagem: 'Milk-shake de açaí sabor Morango', altFallback: 'Milk-Shake Morango (imagem indisponível)',
      chips: ['Batido na hora'], tamanhoLabel: 'Tamanho único' },

    { tipo: 'milkshake', sabor: 'Milk-Shake Chocolate', titulo: 'Milk-Shake Chocolate',
      imagemBase: 'milkshake-acai', imgW: 500, imgH: 500,
      altImagem: 'Milk-shake de açaí sabor Chocolate', altFallback: 'Milk-Shake Chocolate (imagem indisponível)',
      chips: ['Batido na hora'], tamanhoLabel: 'Tamanho único' },

    { tipo: 'milkshake', sabor: 'Milk-Shake Creme de Avelã', titulo: 'Milk-Shake Creme de Avelã',
      imagemBase: 'milkshake-acai', imgW: 500, imgH: 500,
      altImagem: 'Milk-shake de açaí sabor Creme de Avelã', altFallback: 'Milk-Shake Creme de Avelã (imagem indisponível)',
      chips: ['Batido na hora'], tamanhoLabel: 'Tamanho único' },

    { tipo: 'milkshake', sabor: 'Milk-Shake Paçoca', titulo: 'Milk-Shake Paçoca',
      imagemBase: 'milkshake-acai', imgW: 500, imgH: 500,
      altImagem: 'Milk-shake de açaí sabor Paçoca', altFallback: 'Milk-Shake Paçoca (imagem indisponível)',
      chips: ['Batido na hora'], tamanhoLabel: 'Tamanho único' },
  ];

  // Monta um card (<article class="galeria-card">)
  // hardcoded no HTML, mas 100% via DOM (createElement/textContent — nunca
  // innerHTML com texto livre) e já com <picture>/WebP + fallback JPG.
  function criarCardCardapio(dados) {
    const artigo = document.createElement('article');
    artigo.className = 'galeria-card reveal';
    artigo.dataset.sabor = dados.sabor;

    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = `assets/img/${dados.imagemBase}.jpg`;

    const img = document.createElement('img');
    img.className = 'galeria-card__img';
    img.loading = 'lazy';
    img.width = dados.imgW;
    img.height = dados.imgH;
    img.alt = dados.altImagem;
    img.src = `assets/img/${dados.imagemBase}.jpg`;
    // Fallback de imagem via JS (não inline), pra não depender de
    // "unsafe-inline" na Content-Security-Policy.
    img.addEventListener('error', () => {
      artigo.classList.add('img-fallback');
      img.alt = dados.altFallback;
    });

    picture.appendChild(source);
    picture.appendChild(img);

    const hint = document.createElement('span');
    hint.className = 'galeria-card__hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = '+';

    const overlay = document.createElement('div');
    overlay.className = 'galeria-card__overlay';

    const adicionaisEl = document.createElement('div');
    adicionaisEl.className = 'galeria-card__adicionais';
    dados.chips.forEach(chip => {
      const span = document.createElement('span');
      span.textContent = chip;
      adicionaisEl.appendChild(span);
    });

    const footer = document.createElement('div');
    footer.className = 'galeria-card__footer';

    const tamanhosEl = document.createElement('div');
    tamanhosEl.className = 'galeria-card__tamanhos';
    const rotulosTamanho = dados.tipo === 'acai' ? TAMANHOS_ACAI_ORDENADOS : [dados.tamanhoLabel];
    rotulosTamanho.forEach(rotulo => {
      const span = document.createElement('span');
      span.textContent = rotulo;
      tamanhosEl.appendChild(span);
    });

    const precoWrap = document.createElement('div');
    precoWrap.className = 'galeria-card__preco-wrap';

    const precoEl = document.createElement('span');
    precoEl.className = 'galeria-card__preco';
    if (dados.tipo === 'acai') {
      precoEl.textContent = faixaPrecoAcai();
    } else if (dados.tipo === 'barca') {
      precoEl.textContent = formatarPreco(BARCAS[dados.barcaKey].preco);
    } else {
      precoEl.textContent = formatarPreco(PRECO_MILKSHAKE);
    }

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn btn--sm btn--cta galeria-card__btn-pedir';
    botao.dataset.produto = dados.sabor;
    botao.textContent = 'Pedir';

    precoWrap.appendChild(precoEl);
    precoWrap.appendChild(botao);
    footer.appendChild(tamanhosEl);
    footer.appendChild(precoWrap);
    overlay.appendChild(adicionaisEl);
    overlay.appendChild(footer);

    const titulo = document.createElement('h3');
    titulo.className = 'galeria-card__titulo';
    titulo.textContent = dados.titulo;

    artigo.appendChild(picture);
    artigo.appendChild(hint);
    artigo.appendChild(overlay);
    artigo.appendChild(titulo);
    return artigo;
  }

  function gerarCardsCardapio() {
    const grid = document.getElementById('listaGaleria');
    if (!grid) return;
    const fragmento = document.createDocumentFragment();
    CARDAPIO.forEach(dados => fragmento.appendChild(criarCardCardapio(dados)));
    grid.appendChild(fragmento);
  }

  // Executa imediatamente (fora do DOMContentLoaded): como esta tag <script>
  // fica no fim do body, o grid #listaGaleria já existe no DOM nesse ponto.
  // Isso garante que os cards já estejam prontos quando script.js (carregado
  // antes) ligar os eventos de hover/toque/clique no DOMContentLoaded dele.
  gerarCardsCardapio();

  /*
     FALLBACK PARA NAVEGADORES SEM SUPORTE A :has()
     O destaque visual dos itens selecionados (adicional-check, opcao-tile)
     usa CSS :has(input:checked). Em navegadores sem suporte (Safari <15.4,
     Firefox <121) a seleção continua funcionando, só o destaque visual some.
     Esta função replica o mesmo destaque via classe, então funciona em
     qualquer navegador — é chamada sempre que uma caixinha é (des)marcada,
     seja por clique do usuário ou programaticamente pelo próprio JS.
  */
  function sincronizarSelecionado(input) {
    if (!input) return;
    const opcao = input.closest('.adicional-check, .opcao-tile');
    if (!opcao) return;
    if (input.type === 'radio') {
      // desmarca visualmente os outros do mesmo grupo (comportamento de radio)
      document.querySelectorAll(`input[name="${input.name}"]`).forEach(irmao => {
        const wrap = irmao.closest('.opcao-tile');
        if (wrap) wrap.classList.toggle('is-selecionado', irmao.checked);
      });
    } else {
      opcao.classList.toggle('is-selecionado', input.checked);
    }
  }

  /*
     ESTADO
  */
  let carrinho = [];
  let editandoId = null;

  function gerarId() {
    return 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  /*localStorage (com try/catch para modo privado)*/
  function salvarCarrinho() {
    try {
      const observacoesEl = document.getElementById('campoObservacoes');
      const enderecoEl = document.getElementById('campoEndereco');
      const entregaMarcada = document.querySelector('input[name="tipoEntrega"]:checked');
      const dados = {
        itens: carrinho,
        observacoes: observacoesEl ? observacoesEl.value : '',
        tipoEntrega: entregaMarcada ? entregaMarcada.value : 'retirada',
        endereco: enderecoEl ? enderecoEl.value : ''
      };
      window.localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(dados));
    } catch (erro) {
      console.warn('Não foi possível salvar o carrinho no localStorage:', erro);
    }
  }

  function carregarCarrinho() {
    try {
      const bruto = window.localStorage.getItem(CHAVE_LOCALSTORAGE);
      if (!bruto) return;
      const dados = JSON.parse(bruto);
      carrinho = Array.isArray(dados.itens) ? dados.itens : [];

      const observacoesEl = document.getElementById('campoObservacoes');
      if (observacoesEl && dados.observacoes) observacoesEl.value = dados.observacoes;

      if (dados.tipoEntrega === 'entrega') {
        const radioEntrega = document.getElementById('entrega-delivery');
        if (radioEntrega) {
          radioEntrega.checked = true;
          sincronizarSelecionado(radioEntrega);
        }
      }
      const enderecoEl = document.getElementById('campoEndereco');
      if (enderecoEl && dados.endereco) enderecoEl.value = dados.endereco;
      atualizarVisibilidadeEndereco();
    } catch (erro) {
      console.warn('Não foi possível carregar o carrinho salvo:', erro);
      carrinho = [];
    }
  }

  function limparCarrinhoStorage() {
    try {
      window.localStorage.removeItem(CHAVE_LOCALSTORAGE);
    } catch (erro) {
      console.warn('Não foi possível limpar o carrinho salvo:', erro);
    }
  }

  /* ---------- Retirada no local / Entrega ---------- */
  function atualizarVisibilidadeEndereco() {
    const marcado = document.querySelector('input[name="tipoEntrega"]:checked');
    const wrap = document.getElementById('campoEnderecoWrap');
    if (!wrap) return;
    wrap.hidden = !marcado || marcado.value !== 'entrega';
  }

  /*
     INTERPRETAÇÃO DE PRODUTOS VINDOS DO CARDÁPIO/GALERIA
  */
  function interpretarProduto(nomeProduto) {
    const texto = (nomeProduto || '').trim();
    const minusculo = texto.toLowerCase();

    if (minusculo.startsWith('barca')) {
      let tamanho = 'Casal';
      if (minusculo.includes('família') || minusculo.includes('familia')) tamanho = 'Família';
      else if (minusculo.includes('suprema')) tamanho = 'Suprema';
      return { tipo: 'barca', tamanho, sabor: '' };
    }

    if (minusculo.startsWith('milk-shake') || minusculo.startsWith('milkshake')) {
      let sabor = texto.replace(/milk-?shake/i, '').trim();
      if (sabor.toLowerCase() === 'avela' || sabor.toLowerCase() === 'creme de avela') sabor = 'Creme de Avelã';
      if (sabor.toLowerCase() === 'pacoca') sabor = 'Paçoca';
      if (!sabor || !SABORES_MILKSHAKE.includes(sabor)) sabor = 'Tradicional';
      return { tipo: 'milkshake', tamanho: '', sabor };
    }

    // Açaí — com ou sem o prefixo "Copo" (itens vindos da galeria não têm o prefixo)
    let resto = texto.replace(/^copo\s*/i, '').trim();
    let tamanho = '500ml';
    const combinaTamanho = resto.match(/(300|500|700)\s*ml/i);
    if (combinaTamanho) {
      tamanho = combinaTamanho[0].replace(/\s+/g, '').toLowerCase();
      resto = resto.replace(combinaTamanho[0], '').trim();
    }
    resto = resto.replace(/^,\s*|,\s*$/g, '').trim();
    const sabor = resto || '';
    return { tipo: 'acai', tamanho, sabor };
  }

  /*
     MONTAGEM DINÂMICA DO FORMULÁRIO
  */
  function montarListaAdicionais() {
    const container = document.getElementById('listaAdicionais');
    if (!container) return;
    container.innerHTML = '';

    ADICIONAIS_CATALOGO.forEach(grupo => {
      const grupoEl = document.createElement('div');
      grupoEl.className = 'adicionais-form-grupo';

      const titulo = document.createElement('h4');
      titulo.textContent = `${grupo.categoria} (${formatarPreco(grupo.preco)} cada)`;
      grupoEl.appendChild(titulo);

      const itensEl = document.createElement('div');
      itensEl.className = 'adicionais-form-itens';

      grupo.itens.forEach(nomeItem => {
        const id = 'adicional-' + slugify(nomeItem);
        const label = document.createElement('label');
        label.className = 'adicional-check';
        label.setAttribute('for', id);

        label.innerHTML = `
          <input type="checkbox" id="${id}" data-nome="${nomeItem}" data-preco="${grupo.preco}">
          <span>${nomeItem}</span>
        `;
        itensEl.appendChild(label);
      });

      grupoEl.appendChild(itensEl);
      container.appendChild(grupoEl);
    });

    // Aviso de "mais de 5 adicionais" + destaque visual (fallback de :has())
    container.addEventListener('change', (e) => {
      atualizarAvisoAdicionais();
      sincronizarSelecionado(e.target);
    });
  }

  function atualizarAvisoAdicionais() {
    const aviso = document.getElementById('avisoAdicionais');
    if (!aviso) return;
    const marcados = document.querySelectorAll('#listaAdicionais input[type="checkbox"]:checked');
    if (marcados.length > LIMITE_ADICIONAIS_AVISO) {
      aviso.textContent = 'Uou, bastante recheio! Confere se cabe tudo no copo antes de confirmar';
      aviso.classList.add('is-visivel');
    } else {
      aviso.textContent = '';
      aviso.classList.remove('is-visivel');
    }
  }

  /*Caixas de seleção (tamanho / sabor do milk-shake)*/
  function criarTileRadio(nomeGrupo, valor, rotulo, preco) {
    const id = `${nomeGrupo}-${slugify(valor)}`;
    const label = document.createElement('label');
    label.className = 'opcao-tile';
    label.setAttribute('for', id);
    label.innerHTML = `
      <input type="radio" id="${id}" name="${nomeGrupo}" value="${valor}">
      <span class="opcao-tile__nome">${rotulo}</span>
      <span class="opcao-tile__preco">${formatarPreco(preco)}</span>
    `;
    return label;
  }

  function montarOpcoesTamanho(tipo) {
    const container = document.getElementById('listaTamanho');
    if (!container) return;
    container.innerHTML = '';

    let opcoes = [];
    if (tipo === 'acai') {
      opcoes = Object.keys(PRECOS_ACAI).map(tam => ({ valor: tam, rotulo: tam, preco: PRECOS_ACAI[tam] }));
    } else if (tipo === 'barca') {
      opcoes = Object.keys(BARCAS).map(tam => ({ valor: tam, rotulo: `Barca ${tam}`, preco: BARCAS[tam].preco }));
    }

    opcoes.forEach((op, indice) => {
      const tile = criarTileRadio('tamanho', op.valor, op.rotulo, op.preco);
      const input = tile.querySelector('input');
      if (indice === 0) input.checked = true;
      container.appendChild(tile);
      sincronizarSelecionado(input);
    });
  }

  function montarOpcoesMilkshake() {
    const container = document.getElementById('listaSaborMilkshake');
    if (!container) return;
    container.innerHTML = '';
    SABORES_MILKSHAKE.forEach((sabor, indice) => {
      const tile = criarTileRadio('saborMilkshake', sabor, sabor, PRECO_MILKSHAKE);
      const input = tile.querySelector('input');
      if (indice === 0) input.checked = true;
      container.appendChild(tile);
      sincronizarSelecionado(input);
    });
  }

  // Mensagem explicando o desconto dos adicionais inclusos na barca — só
  // aparece quando tipo=barca, e muda de acordo com o tamanho escolhido
  // (Casal/Família/Suprema têm quantidades diferentes de inclusos).
  function atualizarAvisoBarcaInclusos() {
    const aviso = document.getElementById('avisoBarcaInclusos');
    if (!aviso) return;
    const tipo = document.getElementById('campoTipo').value;

    if (tipo !== 'barca') {
      aviso.textContent = '';
      aviso.classList.remove('is-visivel');
      return;
    }

    const radioMarcado = document.querySelector('#listaTamanho input:checked');
    const tamanho = radioMarcado ? radioMarcado.value : null;
    const incluidos = tamanho && BARCAS[tamanho] ? BARCAS[tamanho].adicionaisInclusos : 0;

    if (incluidos) {
      aviso.textContent = `Nessa barca, os ${incluidos} adicionais mais caros que você escolher vêm de graça — o restante é cobrado normalmente.`;
      aviso.classList.add('is-visivel');
    }
  }

  function atualizarCamposPorTipo() {
    const tipo = document.getElementById('campoTipo').value;
    const tamanhoWrap = document.getElementById('campoTamanhoWrap');
    const milkshakeWrap = document.getElementById('campoSaborMilkshakeWrap');

    if (tipo === 'milkshake') {
      // A caixa de sabor do milk-shake só existe/aparece quando este tipo é escolhido
      tamanhoWrap.hidden = true;
      milkshakeWrap.hidden = false;
    } else {
      tamanhoWrap.hidden = false;
      milkshakeWrap.hidden = true;
      montarOpcoesTamanho(tipo);
    }

    atualizarAvisoBarcaInclusos();
  }

  /*
     PREÇO BASE POR TIPO
  */
  function precoBaseItem(tipo, tamanho) {
    if (tipo === 'acai') return PRECOS_ACAI[tamanho] || 0;
    if (tipo === 'barca') return (BARCAS[tamanho] && BARCAS[tamanho].preco) || 0;
    if (tipo === 'milkshake') return PRECO_MILKSHAKE;
    return 0;
  }

  // Separa quais adicionais escolhidos entram "de graça" (inclusos no preço
  // da barca) e quais são cobrados à parte. Dá o desconto sempre nos mais
  // caros primeiro — assim o cliente sai ganhando o máximo possível.
  function separarAdicionaisBarca(tamanho, adicionais) {
    const incluidos = (BARCAS[tamanho] && BARCAS[tamanho].adicionaisInclusos) || 0;
    const ordenados = [...adicionais].sort((a, b) => b.preco - a.preco);
    return {
      gratuitos: ordenados.slice(0, incluidos),
      pagos: ordenados.slice(incluidos)
    };
  }

  function labelTipoTamanho(item) {
    if (item.tipo === 'acai') return `Açaí ${item.tamanho}`;
    if (item.tipo === 'barca') return BARCAS[item.tamanho] ? BARCAS[item.tamanho].label : `Barca ${item.tamanho}`;
    if (item.tipo === 'milkshake') return 'Milk-Shake';
    return item.tipo;
  }

  function tituloItem(item) {
    const base = `${item.quantidade}x ${labelTipoTamanho(item)}`;
    return item.sabor ? `${base} — ${item.sabor}` : base;
  }

  // Texto de um adicional no resumo/mensagem, já indicando quando ele está
  // incluso de graça (barca) em vez de cobrado.
  function textoAdicional(item, adicional) {
    const gratis = item.adicionaisGratuitos && item.adicionaisGratuitos.includes(adicional.nome);
    return `${adicional.nome} (${gratis ? 'incluso' : formatarPreco(adicional.preco)})`;
  }

  /*
     FORMULÁRIO → ITEM DO CARRINHO
  */
  function lerAdicionaisSelecionados() {
    const marcados = document.querySelectorAll('#listaAdicionais input[type="checkbox"]:checked');
    return Array.from(marcados).map(chk => ({
      nome: chk.dataset.nome,
      preco: parseFloat(chk.dataset.preco)
    }));
  }

  function limparAdicionaisSelecionados() {
    document.querySelectorAll('#listaAdicionais input[type="checkbox"]:checked')
      .forEach(chk => {
        chk.checked = false;
        sincronizarSelecionado(chk);
      });
    atualizarAvisoAdicionais();
  }

  function lerFormulario() {
    const tipo = document.getElementById('campoTipo').value;
    let tamanho = '';
    let sabor = document.getElementById('campoSaborOculto').value.trim();

    if (tipo === 'milkshake') {
      const radioMarcado = document.querySelector('#listaSaborMilkshake input:checked');
      sabor = radioMarcado ? radioMarcado.value : SABORES_MILKSHAKE[0];
      tamanho = '';
    } else {
      const radioMarcado = document.querySelector('#listaTamanho input:checked');
      tamanho = radioMarcado ? radioMarcado.value : '';
    }

    const quantidade = Math.max(1, parseInt(document.getElementById('campoQuantidade').value, 10) || 1);
    const separado = document.getElementById('campoSeparado').checked;
    const adicionais = lerAdicionaisSelecionados();

    // Nas barcas, os N adicionais mais caros escolhidos vêm inclusos no
    // preço — só o restante é cobrado à parte (ver separarAdicionaisBarca).
    let precoAdicionais;
    let adicionaisGratuitos = [];
    if (tipo === 'barca') {
      const { gratuitos, pagos } = separarAdicionaisBarca(tamanho, adicionais);
      precoAdicionais = pagos.reduce((soma, a) => soma + a.preco, 0);
      adicionaisGratuitos = gratuitos.map(a => a.nome);
    } else {
      precoAdicionais = adicionais.reduce((soma, a) => soma + a.preco, 0);
    }

    const precoUnitario = precoBaseItem(tipo, tamanho) + precoAdicionais;

    return {
      id: editandoId || gerarId(),
      tipo,
      tamanho,
      sabor,
      adicionais,
      adicionaisGratuitos,
      separado,
      quantidade,
      subtotal: precoUnitario * quantidade
    };
  }

  function preencherFormularioComItem(item) {
    document.getElementById('campoTipo').value = item.tipo;
    atualizarCamposPorTipo();

    if (item.tipo === 'milkshake') {
      const radio = document.querySelector(`#listaSaborMilkshake input[value="${CSS.escape(item.sabor)}"]`);
      if (radio) { radio.checked = true; sincronizarSelecionado(radio); }
      document.getElementById('campoSaborOculto').value = '';
    } else {
      const radio = document.querySelector(`#listaTamanho input[value="${CSS.escape(item.tamanho)}"]`);
      if (radio) { radio.checked = true; sincronizarSelecionado(radio); }
      document.getElementById('campoSaborOculto').value = item.sabor || '';
    }
    atualizarAvisoBarcaInclusos();

    document.getElementById('campoQuantidade').value = item.quantidade;
    document.getElementById('campoSeparado').checked = item.separado;

    limparAdicionaisSelecionados();
    item.adicionais.forEach(a => {
      const chk = document.querySelector(`#listaAdicionais input[data-nome="${CSS.escape(a.nome)}"]`);
      if (chk) { chk.checked = true; sincronizarSelecionado(chk); }
    });
    atualizarAvisoAdicionais();
  }

  function limparFormulario() {
    const form = document.getElementById('formPedido');
    if (!form) return;
    document.getElementById('campoTipo').value = 'acai';
    atualizarCamposPorTipo();
    document.getElementById('campoSaborOculto').value = '';
    document.getElementById('campoQuantidade').value = 1;
    document.getElementById('campoSeparado').checked = false;
    limparAdicionaisSelecionados();
  }

  /*
     RENDERIZAÇÃO DO CARRINHO
  */
  function calcularTotalGeral() {
    return carrinho.reduce((soma, item) => soma + item.subtotal, 0);
  }

  function renderizarCarrinho() {
    const lista = document.getElementById('carrinhoLista');
    const vazio = document.getElementById('carrinhoVazio');
    const totalEl = document.getElementById('carrinhoTotal');
    if (!lista) return;

    lista.innerHTML = '';

    if (carrinho.length === 0) {
      vazio.hidden = false;
    } else {
      vazio.hidden = true;
      carrinho.forEach(item => {
        const el = document.createElement('div');
        el.className = 'carrinho-item';
        el.dataset.id = item.id;

        const adicionaisTexto = item.adicionais.length
          ? item.adicionais.map(a => textoAdicional(item, a)).join(', ')
          : 'Sem adicionais';

        el.innerHTML = `
          <div class="carrinho-item__titulo">${tituloItem(item)}</div>
          <div class="carrinho-item__adicionais">Adicionais: ${adicionaisTexto}</div>
          ${item.separado ? '<span class="carrinho-item__badge">Adicionais separados</span>' : ''}
          <div class="carrinho-item__footer">
            <span class="carrinho-item__subtotal">${formatarPreco(item.subtotal)}</span>
            <div class="carrinho-item__acoes">
              <button type="button" class="carrinho-item__editar" data-id="${item.id}">Editar</button>
              <button type="button" class="carrinho-item__remover" data-id="${item.id}">Remover</button>
            </div>
          </div>
        `;
        lista.appendChild(el);
      });
    }

    if (totalEl) totalEl.textContent = formatarPreco(calcularTotalGeral());

    lista.querySelectorAll('.carrinho-item__editar').forEach(btn => {
      btn.addEventListener('click', () => editarItem(btn.dataset.id));
    });
    lista.querySelectorAll('.carrinho-item__remover').forEach(btn => {
      btn.addEventListener('click', () => removerItem(btn.dataset.id));
    });
  }

  /*
     AÇÕES DO CARRINHO
  */
  function anunciarStatus(mensagem) {
    const statusEl = document.getElementById('carrinhoStatus');
    if (statusEl) statusEl.textContent = mensagem;
  }

  function adicionarOuAtualizarItem(event) {
    if (event) event.preventDefault();

    const item = lerFormulario();

    if (editandoId) {
      const indice = carrinho.findIndex(i => i.id === editandoId);
      if (indice !== -1) carrinho[indice] = item;
      anunciarStatus('Item atualizado no seu pedido.');
      sairModoEdicao();
    } else {
      carrinho.push(item);
      anunciarStatus('Item adicionado ao seu pedido.');
    }

    salvarCarrinho();
    renderizarCarrinho();
    limparFormulario();
  }

  function editarItem(id) {
    const item = carrinho.find(i => i.id === id);
    if (!item) return;
    editandoId = id;
    preencherFormularioComItem(item);

    document.getElementById('btnAdicionarItem').textContent = 'Salvar alterações';
    document.getElementById('btnCancelarEdicao').hidden = false;

    const form = document.getElementById('formPedido');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    anunciarStatus('Editando item — ajuste os campos e clique em "Salvar alterações".');
  }

  function sairModoEdicao() {
    editandoId = null;
    document.getElementById('btnAdicionarItem').textContent = 'Adicionar ao Pedido';
    document.getElementById('btnCancelarEdicao').hidden = true;
  }

  function removerItem(id) {
    carrinho = carrinho.filter(i => i.id !== id);
    if (editandoId === id) {
      sairModoEdicao();
      limparFormulario();
    }
    salvarCarrinho();
    renderizarCarrinho();
    anunciarStatus('Item removido do seu pedido.');
  }

  /*
     MENSAGEM FINAL E ENVIO PARA O WHATSAPP
  */
  function montarMensagemWhatsApp() {
    const observacoes = document.getElementById('campoObservacoes').value.trim();
    const tipoEntregaEl = document.querySelector('input[name="tipoEntrega"]:checked');
    const tipoEntrega = tipoEntregaEl ? tipoEntregaEl.value : 'retirada';
    const endereco = document.getElementById('campoEndereco').value.trim();

    const SEPARADOR = '━━━━━━━━━━━━━━━';
    const linhas = [];

    linhas.push('Olá!  Gostaria de fazer o seguinte pedido na *UAI AÇAÍ*:');
    linhas.push('');

    carrinho.forEach((item, indice) => {
      linhas.push(SEPARADOR);
      linhas.push(`*${indice + 1}) ${tituloItem(item)}*`);
      if (item.adicionais.length) {
        linhas.push('Adicionais:');
        item.adicionais.forEach(a => {
          linhas.push(`   • ${textoAdicional(item, a)}`);
        });
      }
      if (item.separado) linhas.push('   Obs: adicionais separados');
      linhas.push(`Subtotal: ${formatarPreco(item.subtotal)}`);
    });

    linhas.push(SEPARADOR);
    linhas.push('');

    linhas.push(
      tipoEntrega === 'entrega'
        ? `📍 *Entrega* — ${endereco}`
        : '📍 *Retirada no local*'
    );
    linhas.push('');

    if (observacoes) {
      linhas.push(`📝 Observações: ${observacoes}`);
      linhas.push('');
    }

    linhas.push(`💰 *TOTAL: ${formatarPreco(calcularTotalGeral())}*`);

    // encodeURIComponent já converte as quebras de linha ("\n") em %0A
    // e escapa acentos/caracteres especiais, evitando quebrar a URL do WhatsApp.
    return linhas.join('\n');
  }

  function confirmarPedido() {
    if (carrinho.length === 0) {
      anunciarStatus('Seu carrinho está vazio — adicione pelo menos um item antes de confirmar. ');
      return;
    }

    const tipoEntregaEl = document.querySelector('input[name="tipoEntrega"]:checked');
    const tipoEntrega = tipoEntregaEl ? tipoEntregaEl.value : 'retirada';
    const enderecoEl = document.getElementById('campoEndereco');

    if (tipoEntrega === 'entrega' && !enderecoEl.value.trim()) {
      anunciarStatus('Informe o endereço de entrega antes de confirmar. 📍');
      enderecoEl.focus();
      enderecoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const mensagem = montarMensagemWhatsApp();
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener');

    carrinho = [];
    editandoId = null;
    limparCarrinhoStorage();
    renderizarCarrinho();
    limparFormulario();
    document.getElementById('campoObservacoes').value = '';
    enderecoEl.value = '';
    const radioRetirada = document.getElementById('entrega-retirada');
    radioRetirada.checked = true;
    sincronizarSelecionado(radioRetirada);
    atualizarVisibilidadeEndereco();
    sairModoEdicao();
    anunciarStatus('Pedido enviado! Confira o WhatsApp para finalizar. ');
  }

  /*
     PRÉ-PREENCHIMENTO A PARTIR DO CARDÁPIO/GALERIA
  */
  window.preencherFormularioPedido = function (nomeProduto, adicionaisDoCard) {
    const dados = interpretarProduto(nomeProduto);

    document.getElementById('campoTipo').value = dados.tipo;
    atualizarCamposPorTipo();

    if (dados.tipo === 'milkshake') {
      const radio = document.querySelector(`#listaSaborMilkshake input[value="${CSS.escape(dados.sabor)}"]`);
      if (radio) { radio.checked = true; sincronizarSelecionado(radio); }
      document.getElementById('campoSaborOculto').value = '';
    } else {
      const radio = document.querySelector(`#listaTamanho input[value="${CSS.escape(dados.tamanho)}"]`);
      if (radio) { radio.checked = true; sincronizarSelecionado(radio); }
      document.getElementById('campoSaborOculto').value = dados.sabor || '';
    }
    atualizarAvisoBarcaInclusos();

    // Marca automaticamente as caixinhas dos adicionais típicos daquele
    // sabor (mostrados no próprio card). Só faz sentido para açaí: nas
    // barcas os adicionais já vêm inclusos no preço, e no milk-shake não há
    // adicionais típicos — então não mexemos nas caixinhas nesses casos.
    limparAdicionaisSelecionados();
    if (dados.tipo === 'acai' && adicionaisDoCard && adicionaisDoCard.length) {
      const nomesParaMarcar = resolverAdicionaisDoCard(adicionaisDoCard);
      nomesParaMarcar.forEach(nome => {
        const chk = document.querySelector(`#listaAdicionais input[data-nome="${CSS.escape(nome)}"]`);
        if (chk) { chk.checked = true; sincronizarSelecionado(chk); }
      });
      atualizarAvisoAdicionais();
    }
  };

  /*
     INICIALIZAÇÃO
  */
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('formPedido')) return; // segurança, caso a seção não exista

    montarOpcoesMilkshake();
    montarListaAdicionais();
    atualizarCamposPorTipo();
    carregarCarrinho();
    renderizarCarrinho();

    document.getElementById('campoTipo').addEventListener('change', atualizarCamposPorTipo);
    document.getElementById('listaTamanho').addEventListener('change', (e) => {
      sincronizarSelecionado(e.target);
      atualizarAvisoBarcaInclusos();
    });
    document.getElementById('listaSaborMilkshake').addEventListener('change', (e) => sincronizarSelecionado(e.target));
    document.getElementById('formPedido').addEventListener('submit', adicionarOuAtualizarItem);
    document.getElementById('btnCancelarEdicao').addEventListener('click', () => {
      sairModoEdicao();
      limparFormulario();
      anunciarStatus('Edição cancelada.');
    });
    document.getElementById('btnConfirmarPedido').addEventListener('click', confirmarPedido);
    document.getElementById('campoObservacoes').addEventListener('input', salvarCarrinho);

    document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        sincronizarSelecionado(e.target);
        atualizarVisibilidadeEndereco();
        salvarCarrinho();
      });
    });
    document.getElementById('campoEndereco').addEventListener('input', salvarCarrinho);
  });

})();
