/* =========================================
   MAPA DOS ROLEZINHOS - VERCEL FIXED
   ========================================= */

const DATA_URL = `/db/db.json?v=${new Date().getTime()}`;

// --- 1. GESTÃO DE DADOS ---

async function carregarBanco() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Erro HTTP: ' + response.status);
        const dadosEstaticos = await response.json();

        let dadosLocais = { eventos: [] };
        try {
            const localRaw = localStorage.getItem('mapa_dados_locais');
            if (localRaw) {
                dadosLocais = JSON.parse(localRaw);
            }
        } catch (e) {
            console.warn("Dados locais corrompidos, resetando...", e);
            localStorage.removeItem('mapa_dados_locais'); // Limpa se estiver ruim
        }

        let listaFinal = [...dadosEstaticos.eventos];

        dadosLocais.eventos.forEach(eventoLocal => {
            const index = listaFinal.findIndex(e => e.id === eventoLocal.id);
            if (index !== -1) {
                listaFinal[index] = eventoLocal;
            } else {
                listaFinal.push(eventoLocal);
            }
        });

        return {
            eventos: listaFinal,
            categorias_principais: dadosEstaticos.categorias_principais
        };
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        // Retorna estrutura vazia para não quebrar a UI
        return { eventos: [], categorias_principais: [] };
    }
}

function salvarEventoLocalmente(evento) {
    const dadosLocais = JSON.parse(localStorage.getItem('mapa_dados_locais')) || { eventos: [] };
    const index = dadosLocais.eventos.findIndex(e => e.id === evento.id);

    if (index !== -1) {
        dadosLocais.eventos[index] = evento;
    } else {
        dadosLocais.eventos.push(evento);
    }

    localStorage.setItem('mapa_dados_locais', JSON.stringify(dadosLocais));
}

// --- 2. FAVORITOS ---

function getFavoritos() {
    return JSON.parse(localStorage.getItem('meus_favoritos')) || [];
}

// Tornar global de forma segura
window.toggleFavorito = function (id) {
    // Captura o evento de forma segura ou ignora se não existir
    const e = window.event;
    if (e) { e.preventDefault(); e.stopPropagation(); }

    let favs = getFavoritos();
    let acao = '';

    if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
        acao = 'removido';
    } else {
        favs.push(id);
        acao = 'adicionado';
    }

    localStorage.setItem('meus_favoritos', JSON.stringify(favs));
    atualizarBotoesFavUI(id);

    if (typeof Swal !== 'undefined') {
        const msg = acao === 'adicionado' ? 'Salvo!' : 'Removido!';
        Swal.fire({ toast: true, icon: 'success', title: msg, position: 'top-end', showConfirmButton: false, timer: 1500 });
    }

    if (window.location.pathname.includes('favoritos.html')) carregarListaEventos();
};

function atualizarBotoesFavUI(id) {
    const favs = getFavoritos();
    const isFav = favs.includes(id);

    const btnCard = document.getElementById(`fav-btn-${id}`);
    if (btnCard) {
        const icon = btnCard.querySelector('i');
        if (isFav) {
            btnCard.classList.add('active');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
        } else {
            btnCard.classList.remove('active');
            icon.classList.remove('bi-heart-fill');
            icon.classList.add('bi-heart');
        }
    }

    const btnDetail = document.getElementById('btn-fav-detail');
    if (btnDetail) {
        const icon = btnDetail.querySelector('i');
        if (isFav) {
            btnDetail.classList.remove('btn-outline-danger');
            btnDetail.classList.add('btn-danger');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
        } else {
            btnDetail.classList.remove('btn-danger');
            btnDetail.classList.add('btn-outline-danger');
            icon.classList.remove('bi-heart-fill');
            icon.classList.add('bi-heart');
        }
    }
}

// --- 3. AUTH (MOCK) ---

window.login = async () => {
    const { value: tipo } = await Swal.fire({
        title: 'Login',
        text: 'Escolha o perfil (Simulação):',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Admin',
        denyButtonText: 'Visitante',
        confirmButtonColor: '#7B2CBF',
        denyButtonColor: '#00F5D4'
    });

    if (tipo === true) {
        localStorage.setItem('usuario_logado', JSON.stringify({ id: 'admin', nome: 'Admin', role: 'admin', photoURL: 'imgs/foto-perfil.webp' }));
        window.location.reload();
    } else if (tipo === false) {
        localStorage.setItem('usuario_logado', JSON.stringify({ id: 'guest', nome: 'Visitante', role: 'user', photoURL: 'imgs/logo.png' }));
        window.location.reload();
    }
};

window.logout = () => {
    localStorage.removeItem('usuario_logado');
    window.location.href = 'index.html';
};

function isAdmin() {
    try {
        const user = JSON.parse(localStorage.getItem('usuario_logado'));
        return user && user.role === 'admin';
    } catch (e) { return false; }
}

function atualizarAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    let user = null;
    try { user = JSON.parse(localStorage.getItem('usuario_logado')); } catch (e) { }

    if (user) {
        const badge = user.role === 'admin' ? '<span class="badge bg-warning text-dark ms-1">ADM</span>' : '';
        container.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-dark border-secondary dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                    <img src="${user.photoURL}" class="rounded-circle" style="width:24px; height:24px; object-fit: cover;" onerror="this.src='imgs/logo.png'">
                    <span class="d-none d-md-inline">${user.nome.split(' ')[0]}</span> ${badge}
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                    <li><a class="dropdown-item" href="favoritos.html">Meus Favoritos</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-warning" onclick="logout()">Sair</button></li>
                </ul>
            </div>`;
    } else {
        container.innerHTML = `<button onclick="login()" class="btn btn-outline-light btn-sm rounded-pill px-3">Entrar</button>`;
    }
}

// --- 4. INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("App iniciado");

    // Carrega UI de Auth imediatamente
    atualizarAuthUI();

    const path = window.location.pathname;

    // Proteção simples de rotas
    if ((path.includes('cadastro.html') || path.includes('editar.html')) && !isAdmin()) {
        window.location.href = 'index.html';
        return;
    }

    const btnCad = document.getElementById('btn-cadastrar-home');
    if (btnCad) btnCad.style.display = isAdmin() ? 'inline-flex' : 'none';

    // Carregamento de Conteúdo
    if (document.getElementById('lista-destaques')) carregarDestaques();
    if (document.getElementById('lista-de-categorias')) carregarCategorias();
    if (document.getElementById('lista-roles-por-categoria')) carregarListaEventos();
    if (document.getElementById('detalhe-do-evento')) carregarDetalhesEvento();

    // Select de Categorias
    const selectCat = document.getElementById('categoria_principal_id');
    if (selectCat) preencherCategorias(selectCat, path.includes('editar.html'));

    // Formulários
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) formCadastro.addEventListener('submit', (e) => salvarFormulario(e, 'criar'));

    const formEdicao = document.getElementById('form-edicao');
    if (formEdicao) formEdicao.addEventListener('submit', (e) => salvarFormulario(e, 'editar'));

    // Busca
    const formBusca = document.getElementById('form-busca');
    if (formBusca) {
        formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            const termo = formBusca.querySelector('input').value;
            if (termo) window.location.href = `todos.html?busca=${encodeURIComponent(termo)}`;
        });
    }
});

// --- FUNÇÕES AUXILIARES ---

async function preencherCategorias(selectEl, isEdit) {
    const db = await carregarBanco();
    if (db.categorias_principais.length > 0) {
        selectEl.innerHTML = '<option value="">Selecione...</option>' +
            db.categorias_principais.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }
    if (isEdit) carregarDadosEdicao();
}

async function carregarDestaques() {
    const container = document.getElementById('lista-destaques');
    const db = await carregarBanco();
    const destaques = db.eventos.filter(r => r.destaque).slice(0, 3);

    if (destaques.length > 0) {
        container.innerHTML = destaques.map((r, i) => `
            <div class="carousel-item ${i === 0 ? 'active' : ''}" style="height: 500px;">
                <div class="w-100 h-100 bg-black"><img src="${r.imagem_principal}" class="d-block w-100 h-100 object-fit-cover opacity-75" onerror="this.src='imgs/logo.png'"></div>
                <div class="carousel-caption-custom">
                    <span class="badge bg-warning text-dark mb-2">EM ALTA</span>
                    <h2 class="fw-bold text-white display-5">${r.nome}</h2>
                    <a href="detalhes.html?id=${r.id}" class="btn btn-light rounded-pill mt-2 fw-bold">Ver Detalhes</a>
                </div>
            </div>`).join('');
    } else {
        container.innerHTML = '<div class="carousel-item active" style="height:500px;"><div class="d-flex h-100 align-items-center justify-content-center text-white"><h3>Sem destaques.</h3></div></div>';
    }
}

async function carregarCategorias() {
    const lista = document.getElementById('lista-de-categorias');
    const db = await carregarBanco();
    if (db.categorias_principais.length > 0) {
        lista.innerHTML = db.categorias_principais.map(c => `
            <div class="col"><a href="categoria.html?id=${c.id}" class="text-decoration-none">
                <div class="card card-category h-100 p-3 d-flex align-items-center justify-content-center text-center">
                    <h5 class="m-0 text-white">${c.nome}</h5>
                </div>
            </a></div>`).join('');
    } else {
        lista.innerHTML = '<p class="text-white ms-3">Categorias indisponíveis.</p>';
    }
}

async function carregarListaEventos() {
    const container = document.getElementById('lista-roles-por-categoria');
    // Limpa spinner se já foi renderizado antes
    container.innerHTML = '<div class="col-12 text-center text-white py-5"><div class="spinner-border"></div></div>';

    const db = await carregarBanco();
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    let eventos = db.eventos;
    let titulo = "Todos os Rolezinhos";

    if (path.includes('favoritos.html')) {
        const favs = getFavoritos();
        eventos = eventos.filter(e => favs.includes(e.id));
        titulo = "Meus Favoritos";
        if (!eventos.length) { container.innerHTML = '<div class="col-12 text-center text-white mt-5"><h3>Sem favoritos ainda.</h3></div>'; return; }
    }
    else if (params.get('id')) {
        eventos = eventos.filter(e => e.categoria_principal_id == params.get('id'));
        const cat = db.categorias_principais.find(c => c.id == params.get('id'));
        if (cat) titulo = cat.nome;
    }
    else if (params.get('busca')) {
        eventos = eventos.filter(e => e.nome.toLowerCase().includes(params.get('busca').toLowerCase()));
        titulo = `Busca: "${params.get('busca')}"`;
    }

    const elTitulo = document.getElementById('categoria-titulo');
    if (elTitulo) elTitulo.innerText = titulo;

    const favs = getFavoritos();
    if (eventos.length > 0) {
        container.innerHTML = eventos.map(r => {
            const isFav = favs.includes(r.id);
            const catNome = db.categorias_principais.find(c => c.id == r.categoria_principal_id)?.nome || 'Geral';
            return `
            <div class="col">
                <div class="card-role h-100 position-relative">
                    <button class="btn-fav-card ${isFav ? 'active' : ''}" id="fav-btn-${r.id}" onclick="toggleFavorito('${r.id}')">
                        <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    </button>
                    <a href="detalhes.html?id=${r.id}" class="text-decoration-none d-flex flex-column h-100">
                        <div class="card-img-wrapper" style="height: 200px;">
                            <img src="${r.imagem_principal}" class="w-100 h-100 object-fit-cover" onerror="this.src='imgs/logo.png'">
                        </div>
                        <div class="card-body-custom">
                            <span class="badge bg-primary mb-2 w-auto align-self-start">${catNome}</span>
                            <h5 class="card-title text-white">${r.nome}</h5>
                            <p class="card-desc text-muted small">${r.descricao}</p>
                        </div>
                    </a>
                </div>
            </div>`;
        }).join('');
    } else {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted">Nenhum evento encontrado.</div>';
    }
}

async function carregarDetalhesEvento() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const db = await carregarBanco();
    const evt = db.eventos.find(e => e.id == id);

    if (evt) {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('content-area').style.display = 'block';

        const fields = ['titulo', 'descricao', 'conteudo', 'data', 'horario', 'local', 'ingressos', 'atracoes'];
        fields.forEach(field => {
            const el = document.getElementById(`detalhe-${field}`);
            const val = evt[field === 'atracoes' ? 'atracoes_principais' : field];
            if (el) el.innerText = val || '';
        });

        document.getElementById('detalhe-imagem').src = evt.imagem_principal || 'imgs/logo.png';

        const cat = db.categorias_principais.find(c => c.id == evt.categoria_principal_id);
        if (cat) document.getElementById('detalhe-categoria').innerText = cat.nome;

        const btnFav = document.getElementById('btn-fav-detail');
        // Remove listeners antigos
        const clone = btnFav.cloneNode(true);
        btnFav.parentNode.replaceChild(clone, btnFav);
        clone.onclick = () => toggleFavorito(evt.id);
        atualizarBotoesFavUI(evt.id);

        const adminDiv = document.getElementById('admin-buttons-container');
        if (adminDiv) {
            adminDiv.style.display = isAdmin() ? 'flex' : 'none';
            document.getElementById('btn-editar').href = `editar.html?id=${evt.id}`;
            document.getElementById('btn-excluir').onclick = () => Swal.fire('Aviso', 'A exclusão está desabilitada no modo demonstração.', 'info');
        }

        if (evt.lat && evt.lng && typeof L !== 'undefined') {
            document.getElementById('map-detail').innerHTML = "";
            const map = L.map('map-detail').setView([evt.lat, evt.lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.marker([evt.lat, evt.lng]).addTo(map).bindPopup(evt.nome).openPopup();
        }
    }
}

async function salvarFormulario(e, modo) {
    e.preventDefault();

    const novoEvento = {
        id: modo === 'criar' ? 'evt_local_' + Date.now() : document.getElementById('id').value,
        nome: document.getElementById('nome').value,
        imagem_principal: document.getElementById('imagem_principal').value,
        descricao: document.getElementById('descricao').value,
        conteudo: document.getElementById('conteudo').value,
        local: document.getElementById('local').value,
        lat: document.getElementById('lat').value,
        lng: document.getElementById('lng').value,
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value,
        atracoes_principais: document.getElementById('atracoes_principais').value,
        ingressos: document.getElementById('ingressos').value,
        categoria_principal_id: parseInt(document.getElementById('categoria_principal_id').value),
        destaque: document.getElementById('destaque').checked
    };

    salvarEventoLocalmente(novoEvento);
    await Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Salvo no navegador (Simulação).' });
    window.location.href = 'todos.html';
}

async function carregarDadosEdicao() {
    const id = new URLSearchParams(window.location.search).get('id');
    const db = await carregarBanco();
    const evt = db.eventos.find(e => e.id == id);
    if (evt) {
        document.getElementById('id').value = evt.id;
        document.getElementById('nome').value = evt.nome;
        document.getElementById('imagem_principal').value = evt.imagem_principal;
        document.getElementById('descricao').value = evt.descricao;
        document.getElementById('conteudo').value = evt.conteudo;
        document.getElementById('local').value = evt.local;
        document.getElementById('lat').value = evt.lat;
        document.getElementById('lng').value = evt.lng;
        document.getElementById('data').value = evt.data;
        document.getElementById('horario').value = evt.horario;
        document.getElementById('atracoes_principais').value = evt.atracoes_principais;
        document.getElementById('ingressos').value = evt.ingressos;
        document.getElementById('categoria_principal_id').value = evt.categoria_principal_id;
        document.getElementById('destaque').checked = evt.destaque;
    }
}

window.buscarEndereco = async () => {
    const end = document.getElementById('local').value;
    if (!end) return Swal.fire('Ops', 'Digite o endereço', 'warning');
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(end)}&limit=1`);
        const d = await r.json();
        if (d.length) {
            document.getElementById('lat').value = d[0].lat;
            document.getElementById('lng').value = d[0].lon;
            Swal.fire({ toast: true, icon: 'success', title: 'Localizado!', position: 'top-end', timer: 1500, showConfirmButton: false });
        } else Swal.fire('Erro', 'Endereço não encontrado', 'error');
    } catch (e) { Swal.fire('Erro', 'Falha de conexão', 'error'); }
};