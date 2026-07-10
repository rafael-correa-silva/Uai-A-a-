
(function () {

  /*
     CATÁLOGO E PREÇOS (mesmos valores reais do cardápio)
  */
  const PRECOS_ACAI = { '300ml': 12, '500ml': 18, '700ml': 24 };

  const BARCAS = {
    'Casal':   { label: 'Barca Casal — 700ml (5 adicionais inclusos)',      preco: 35 },
    'Família': { label: 'Barca Família — 1 litro (7 adicionais inclusos)',  preco: 48 },
    'Suprema': { label: 'Barca Suprema — 1,5 litro (10 adicionais inclusos)', preco: 65 }
  };

  const PRECO_MILKSHAKE = 15;
  const SABORES_MILKSHAKE = ['Tradicional', 'Morango', 'Chocolate', 'Creme de Avelã', 'Paçoca'];

  const ADICIONAIS_CATALOGO = [
    { categoria: 'Frutas',        preco: 2,   itens: ['Banana', 'Morango', 'Uva', 'Kiwi', 'Manga'] },
    { categoria: 'Pós & Xaropes', preco: 2,   itens: ['Leite em pó', 'Leite condensado', 'Coco ralado'] },
    { categoria: 'Crocantes',     preco: 2,   itens: ['Paçoca', 'Granola', 'Castanha triturada', 'Amendoim', 'Confetes', 'Gotas de chocolate', "M&M's"] },
    { categoria: 'Caldas',        preco: 2,   itens: ['Calda de chocolate', 'Calda de morango', 'Calda de caramelo'] },
    { categoria: 'Cremes',        preco: 3,   itens: ['Creme de avelã (Nutella)', 'Creme de ninho', 'Creme de leite condensado (Láctea)', 'Creme de morango', 'Creme de maracujá'] },
    { categoria: 'Premium',       preco: 4.5, itens: ['Kinder Bueno', 'Ouro Branco', 'Sonho de Valsa', 'Chocito', 'Kit Kat', 'Creme de Bis', 'Creme de Pistache'] }
  ];

  const LIMITE_ADICIONAIS_AVISO = 5;
  const CHAVE_LOCALSTORAGE = 'uaiacai_carrinho';
  const WHATSAPP_NUMERO = '5534998111439';

  /*
     ESTADO
  */
  let carrinho = [];
  let editandoId = null;

  /*
     HELPERS
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

  function gerarId() {
    return 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  /*localStorage (com try/catch para modo privado)*/
  function salvarCarrinho() {
    try {
      const observacoesEl = document.getElementById('campoObservacoes');
      const dados = {
        itens: carrinho,
        observacoes: observacoesEl ? observacoesEl.value : ''
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
          <span class="adicional-check__preco">${formatarPreco(grupo.preco)}</span>
        `;
        itensEl.appendChild(label);
      });

      grupoEl.appendChild(itensEl);
      container.appendChild(grupoEl);
    });

    // Aviso de "mais de 5 adicionais"
    container.addEventListener('change', atualizarAvisoAdicionais);
  }

  function atualizarAvisoAdicionais() {
    const aviso = document.getElementById('avisoAdicionais');
    if (!aviso) return;
    const marcados = document.querySelectorAll('#listaAdicionais input[type="checkbox"]:checked');
    if (marcados.length > LIMITE_ADICIONAIS_AVISO) {
      aviso.textContent = 'Uou, bastante recheio! Confere se cabe tudo no copo antes de confirmar 😄';
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
      if (indice === 0) tile.querySelector('input').checked = true;
      container.appendChild(tile);
    });
  }

  function montarOpcoesMilkshake() {
    const container = document.getElementById('listaSaborMilkshake');
    if (!container) return;
    container.innerHTML = '';
    SABORES_MILKSHAKE.forEach((sabor, indice) => {
      const tile = criarTileRadio('saborMilkshake', sabor, sabor, PRECO_MILKSHAKE);
      if (indice === 0) tile.querySelector('input').checked = true;
      container.appendChild(tile);
    });
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
      .forEach(chk => { chk.checked = false; });
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
    const precoUnitario = precoBaseItem(tipo, tamanho) + adicionais.reduce((soma, a) => soma + a.preco, 0);

    return {
      id: editandoId || gerarId(),
      tipo,
      tamanho,
      sabor,
      adicionais,
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
      if (radio) radio.checked = true;
      document.getElementById('campoSaborOculto').value = '';
    } else {
      const radio = document.querySelector(`#listaTamanho input[value="${CSS.escape(item.tamanho)}"]`);
      if (radio) radio.checked = true;
      document.getElementById('campoSaborOculto').value = item.sabor || '';
    }

    document.getElementById('campoQuantidade').value = item.quantidade;
    document.getElementById('campoSeparado').checked = item.separado;

    limparAdicionaisSelecionados();
    item.adicionais.forEach(a => {
      const chk = document.querySelector(`#listaAdicionais input[data-nome="${CSS.escape(a.nome)}"]`);
      if (chk) chk.checked = true;
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
          ? item.adicionais.map(a => `${a.nome} (${formatarPreco(a.preco)})`).join(', ')
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
    const linhas = [];

    linhas.push('Olá! Gostaria de fazer o seguinte pedido na UAI AÇAÍ:');
    linhas.push('');

    carrinho.forEach((item, indice) => {
      linhas.push(`${indice + 1}) ${tituloItem(item)}`);
      if (item.adicionais.length) {
        const listaAdicionais = item.adicionais.map(a => `${a.nome} (${formatarPreco(a.preco)})`).join(', ');
        linhas.push(`   Adicionais: ${listaAdicionais}`);
      }
      if (item.separado) linhas.push('   OBS: adicionais separados');
      linhas.push(`   Subtotal: ${formatarPreco(item.subtotal)}`);
      linhas.push('');
    });

    if (observacoes) {
      linhas.push(`Observações gerais: ${observacoes}`);
      linhas.push('');
    }

    linhas.push(`TOTAL DO PEDIDO: ${formatarPreco(calcularTotalGeral())}`);

    return linhas.join('\n');
  }

  function confirmarPedido() {
    if (carrinho.length === 0) {
      anunciarStatus('Seu carrinho está vazio — adicione pelo menos um item antes de confirmar. 🙂');
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
    sairModoEdicao();
    anunciarStatus('Pedido enviado! Confira o WhatsApp para finalizar. 🍇');
  }

  /*
     PRÉ-PREENCHIMENTO A PARTIR DO CARDÁPIO/GALERIA
  */
  window.preencherFormularioPedido = function (nomeProduto) {
    const dados = interpretarProduto(nomeProduto);

    document.getElementById('campoTipo').value = dados.tipo;
    atualizarCamposPorTipo();

    if (dados.tipo === 'milkshake') {
      const radio = document.querySelector(`#listaSaborMilkshake input[value="${CSS.escape(dados.sabor)}"]`);
      if (radio) radio.checked = true;
      document.getElementById('campoSaborOculto').value = '';
    } else {
      const radio = document.querySelector(`#listaTamanho input[value="${CSS.escape(dados.tamanho)}"]`);
      if (radio) radio.checked = true;
      document.getElementById('campoSaborOculto').value = dados.sabor || '';
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
    document.getElementById('formPedido').addEventListener('submit', adicionarOuAtualizarItem);
    document.getElementById('btnCancelarEdicao').addEventListener('click', () => {
      sairModoEdicao();
      limparFormulario();
      anunciarStatus('Edição cancelada.');
    });
    document.getElementById('btnConfirmarPedido').addEventListener('click', confirmarPedido);
    document.getElementById('campoObservacoes').addEventListener('input', salvarCarrinho);
  });

})();
