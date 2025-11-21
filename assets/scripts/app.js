/* =========================================
   MAPA DOS ROLEZINHOS - VERSÃO VERCEL (Híbrida)
   - Leitura: db.json (Base) + LocalStorage (Novos)
   - Escrita: LocalStorage (Persistência no Navegador)
   ========================================= */

const DATA_URL = "db/db.json";

// --- 1. GESTÃO DE DADOS ---

async function carregarBanco() {
    try {
        // 1. Tenta buscar dados originais do arquivo
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Erro ao carregar db.json');
        const dadosEstaticos = await response.json();

        // 2. Busca dados salvos no navegador (novos cadastros)
        const dadosLocais = JSON.parse(localStorage.getItem('mapa_dados_locais')) || { eventos: [] };

        // 3. Funde os dados (Prioriza os locais se houver edição)
        let listaFinal = [...dadosEstaticos.eventos];

        dadosLocais.eventos.forEach(eventoLocal => {
            const index = listaFinal.findIndex(e => e.id === eventoLocal.id);
            if (index !== -1) {
                listaFinal[index] = eventoLocal; // Substitui se foi editado
            } else {
                listaFinal.push(eventoLocal); // Adiciona se é novo
            }
        });

        return { 
            eventos: listaFinal, 
            categorias_principais: dadosEstaticos.categorias_principais 
        };
    } catch (error) {
        console.error("Erro:", error);
        // Fallback simples para não quebrar a tela
        return { eventos: [], categorias_principais: [] };
    }
}

function salvarEventoLocalmente(evento) {
    const dadosLocais = JSON.parse(localStorage.getItem('mapa_dados_locais')) || { eventos: [] };
    
    const index = dadosLocais.eventos.findIndex(e => e.id === evento.id);
    if (index !== -1) {
        dadosLocais.eventos[index] = evento; // Atualiza existente
    } else {
        dadosLocais.eventos.push(evento); // Adiciona novo
    }

    localStorage.setItem('mapa_dados_locais', JSON.stringify(dadosLocais));
}

// --- 2. FAVORITOS ---

function getFavoritos() {
    return JSON.parse(localStorage.getItem('meus_favoritos')) || [];
}

window.toggleFavorito = (id) => {
    if(event) event.preventDefault();
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
    
    const msg = acao === 'adicionado' ? 'Salvo nos favoritos!' : 'Removido dos favoritos';
    Swal.fire({ toast: true, icon: 'success', title: msg, position: 'top-end', showConfirmButton: false, timer: 1500 });
    
    atualizarBotoesFavUI(id);
    // Se estiver na página de favoritos, recarrega
    if(window.location.pathname.includes('favoritos.html')) carregarListaEventos(); 
};

function atualizarBotoesFavUI(id) {
    const favs = getFavoritos();
    const isFav = favs.includes(id);

    // Botão Detalhes
    const btnDetail = document.getElementById('btn-fav-detail');
    if (btnDetail) {
        const icon = btnDetail.querySelector('i');
        if (isFav) {
            btnDetail.classList.replace('btn-outline-danger', 'btn-danger');
            icon.classList.replace('bi-heart', 'bi-heart-fill');
        } else {
            btnDetail.classList.replace('btn-danger', 'btn-outline-danger');
            icon.classList.replace('bi-heart-fill', 'bi-heart');
        }
    }

    // Botão Cards
    const btnCard = document.getElementById(`fav-btn-${id}`);
    if (btnCard) {
        const icon = btnCard.querySelector('i');
        if (isFav) {
            btnCard.classList.add('active');
            icon.classList.replace('bi-heart', 'bi-heart-fill');
        } else {
            btnCard.classList.remove('active');
            icon.classList.replace('bi-heart-fill', 'bi-heart');
        }
    }
}

// --- 3. AUTH MOCK (Login Simulado) ---

window.login = async () => {
    const { value: tipo } = await Swal.fire({
        title: 'Acesso',
        text: 'Selecione seu perfil (Simulação):',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Sou Admin',
        denyButtonText: 'Sou Visitante',
        confirmButtonColor: '#7B2CBF',
        denyButtonColor: '#00F5D4',
    });

    if (tipo === true) {
        localStorage.setItem('usuario_logado', JSON.stringify({ id: 'admin', nome: 'Marcelo Admin', role: 'admin', photoURL: 'imgs/foto-perfil.webp' }));
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
    const user = JSON.parse(localStorage.getItem('usuario_logado'));
    return user && user.role === 'admin';
}

function atualizarAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;
    const user = JSON.parse(localStorage.getItem('usuario_logado'));
    
    if (user) {
        const badge = user.role === 'admin' ? '<span class="badge bg-warning text-dark ms-1">ADM</span>' : '';
        container.innerHTML = `
            <button class="btn btn-sm btn-dark border-secondary dropdown-toggle" data-bs-toggle="dropdown">
                <img src="${user.photoURL}" class="rounded-circle" style="width:20px; height:20px;" onerror="this.src='imgs/logo.png'">
                ${user.nome.split(' ')[0]} ${badge}
            </button>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                <li><a class="dropdown-item" href="favoritos.html">Favoritos</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item text-warning" onclick="logout()">Sair</button></li>
            </ul>`;
    } else {
        container.innerHTML = `<button onclick="login()" class="btn btn-outline-light btn-sm rounded-pill px-3">Entrar</button>`;
    }
}

// --- 4. INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', async () => {
    atualizarAuthUI();
    const path = window.location.pathname;

    // Proteção de Rotas
    if ((path.includes('cadastro.html') || path.includes('editar.html')) && !isAdmin()) {
        Swal.fire('Acesso Negado', 'Área restrita para administradores.', 'error').then(() => window.location.href = 'index.html');
        return;
    }

    // Exibir botão Cadastrar na Home apenas para Admin
    const btnCad = document.getElementById('btn-cadastrar-home');
    if(btnCad) btnCad.style.display = isAdmin() ? 'inline-flex' : 'none';

    // Carregar elementos específicos da página
    if (document.getElementById('lista-destaques')) carregarDestaques();
    if (document.getElementById('lista-de-categorias')) carregarCategorias();
    if (document.getElementById('lista-roles-por-categoria')) carregarListaEventos();
    if (document.getElementById('detalhe-do-evento')) carregarDetalhesEvento();
    
    // Preencher Select de Categorias (Cadastro/Edição)
    const selectCat = document.getElementById('categoria_principal_id');
    if(selectCat) {
        const db = await carregarBanco();
        selectCat.innerHTML = '<option value="">Selecione...</option>' + 
            db.categorias_principais.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        if(path.includes('editar.html')) carregarDadosEdicao();
    }

    // Listeners de Formulário
    const formCadastro = document.getElementById('form-cadastro');
    if(formCadastro) formCadastro.addEventListener('submit', (e) => salvarFormulario(e, 'criar'));

    const formEdicao = document.getElementById('form-edicao');
    if(formEdicao) formEdicao.addEventListener('submit', (e) => salvarFormulario(e, 'editar'));
});

// --- 5. LÓGICA DE UI ---

async function carregarDestaques() {
    const container = document.getElementById('lista-destaques');
    const db = await carregarBanco();
    const destaques = db.eventos.filter(r => r.destaque).slice(0, 3);
    
    if(destaques.length) {
        container.innerHTML = destaques.map((r, i) => `
            <div class="carousel-item ${i === 0 ? 'active' : ''}" style="height: 500px;">
                <div class="w-100 h-100 bg-black"><img src="${r.imagem_principal}" class="d-block w-100 h-100 object-fit-cover opacity-75" onerror="this.src='imgs/logo.png'"></div>
                <div class="carousel-caption-custom">
                    <span class="badge bg-warning text-dark mb-2">EM ALTA</span>
                    <h2 class="fw-bold text-white display-5">${r.nome}</h2>
                    <a href="detalhes.html?id=${r.id}" class="btn btn-light rounded-pill mt-2 fw-bold">Ver Detalhes</a>
                </div>
            </div>`).join('');
    }
}

async function carregarCategorias() {
    const lista = document.getElementById('lista-de-categorias');
    const db = await carregarBanco();
    lista.innerHTML = db.categorias_principais.map(c => `
        <div class="col"><a href="categoria.html?id=${c.id}" class="text-decoration-none">
            <div class="card card-category h-100 p-3 d-flex align-items-center justify-content-center text-center">
                <h5 class="m-0 text-white">${c.nome}</h5>
            </div>
        </a></div>`).join('');
}

async function carregarListaEventos() {
    const container = document.getElementById('lista-roles-por-categoria');
    container.innerHTML = '<div class="col-12 text-center text-white py-5">Carregando...</div>';
    
    const db = await carregarBanco();
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    let eventos = db.eventos;
    let titulo = "Todos os Rolezinhos";

    // Filtros
    if (path.includes('favoritos.html')) {
        const favs = getFavoritos();
        eventos = eventos.filter(e => favs.includes(e.id));
        titulo = "Meus Favoritos";
        if(!eventos.length) { container.innerHTML = '<div class="text-center text-white mt-5"><h3>Sem favoritos ainda.</h3></div>'; return; }
    } 
    else if (params.get('id')) {
        eventos = eventos.filter(e => e.categoria_principal_id == params.get('id'));
        const cat = db.categorias_principais.find(c => c.id == params.get('id'));
        if(cat) titulo = cat.nome;
    }
    else if (params.get('busca')) {
        eventos = eventos.filter(e => e.nome.toLowerCase().includes(params.get('busca').toLowerCase()));
        titulo = `Busca: "${params.get('busca')}"`;
    }

    const elTitulo = document.getElementById('categoria-titulo');
    if(elTitulo) elTitulo.innerText = titulo;

    const favs = getFavoritos();
    container.innerHTML = eventos.map(r => {
        const isFav = favs.includes(r.id);
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
                        <h5 class="card-title text-white">${r.nome}</h5>
                        <p class="card-desc text-muted small">${r.descricao}</p>
                    </div>
                </a>
            </div>
        </div>`;
    }).join('');
}

async function carregarDetalhesEvento() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if(!id) return;

    const db = await carregarBanco();
    const evt = db.eventos.find(e => e.id == id);

    if(evt) {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('content-area').style.display = 'block';
        
        ['titulo','descricao','conteudo','data','horario','local','ingressos','atracoes'].forEach(field => {
            const el = document.getElementById(`detalhe-${field}`);
            if(el) el.innerText = evt[field === 'atracoes' ? 'atracoes_principais' : field] || '';
        });
        
        document.getElementById('detalhe-imagem').src = evt.imagem_principal || 'imgs/logo.png';
        
        // Botões de Ação
        const btnFav = document.getElementById('btn-fav-detail');
        const cloneFav = btnFav.cloneNode(true);
        btnFav.parentNode.replaceChild(cloneFav, btnFav);
        cloneFav.onclick = () => toggleFavorito(evt.id);
        atualizarBotoesFavUI(evt.id);

        const adminDiv = document.getElementById('admin-buttons-container');
        if(adminDiv) {
            adminDiv.style.display = isAdmin() ? 'flex' : 'none';
            document.getElementById('btn-editar').href = `editar.html?id=${evt.id}`;
            document.getElementById('btn-excluir').onclick = () => Swal.fire('Simulação', 'Exclusão não implementada no modo estático.', 'info');
        }
        
        // Mapa
        if(evt.lat && evt.lng && typeof L !== 'undefined') {
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
    await Swal.fire('Sucesso!', 'Dados salvos no navegador (Simulação).', 'success');
    window.location.href = 'todos.html';
}

async function carregarDadosEdicao() {
    const id = new URLSearchParams(window.location.search).get('id');
    const db = await carregarBanco();
    const evt = db.eventos.find(e => e.id == id);
    if(evt) {
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
    if(!end) return Swal.fire('Ops', 'Digite o endereço', 'warning');
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(end)}&limit=1`);
        const data = await res.json();
        if(data.length) {
            document.getElementById('lat').value = data[0].lat;
            document.getElementById('lng').value = data[0].lon;
            Swal.fire({toast:true, icon:'success', title:'Localizado!', position:'top-end', timer:1500, showConfirmButton:false});
        } else Swal.fire('Erro', 'Endereço não encontrado', 'error');
    } catch(e) { Swal.fire('Erro', 'Falha na conexão', 'error'); }
};