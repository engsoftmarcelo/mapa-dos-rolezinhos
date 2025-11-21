/* =========================================
   MAPA DOS ROLEZINHOS - LÓGICA COMPLETA
   - Admin vs Visitante
   - Favoritos (LocalStorage)
   - Renderização de Cards com Coração
   ========================================= */

const DATA_URL = "db/db.json";

// --- 1. GESTÃO DE DADOS E FAVORITOS ---

async function carregarBanco() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Erro ao carregar db.json');
        return await response.json();
    } catch (error) {
        console.error("Erro:", error);
        return { eventos: [], categorias_principais: [] };
    }
}

// Recupera IDs favoritos do LocalStorage
function getFavoritos() {
    return JSON.parse(localStorage.getItem('meus_favoritos')) || [];
}

// Adiciona/Remove favorito e atualiza UI
window.toggleFavorito = (id) => {
    // Previne bubbling se clicado dentro de um link
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
    
    // Feedback visual rápido
    if(acao === 'adicionado') {
        Swal.fire({ toast: true, icon: 'success', title: 'Salvo nos favoritos!', position: 'top-end', showConfirmButton: false, timer: 1500 });
    } else {
        Swal.fire({ toast: true, icon: 'info', title: 'Removido dos favoritos', position: 'top-end', showConfirmButton: false, timer: 1500 });
    }

    // Atualiza botões na tela
    atualizarBotoesFavUI(id);
    
    // Se estiver na página de favoritos, recarrega a lista
    if(window.location.pathname.includes('favoritos.html')) {
        carregarListaEventos(); 
    }
};

// Atualiza visual dos botões (Coração Cheio/Vazio) em toda a tela
function atualizarBotoesFavUI(id) {
    const favs = getFavoritos();
    const isFav = favs.includes(id);

    // 1. Atualiza botão na página de detalhes (se existir)
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

    // 2. Atualiza botão nos cards (se existirem)
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
}

// --- 2. AUTENTICAÇÃO (ADMIN vs VISITANTE) ---

window.login = async () => {
    const { value: tipo } = await Swal.fire({
        title: 'Acesso ao Sistema',
        text: 'Selecione seu nível de acesso (Simulado):',
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Sou Admin',
        denyButtonText: 'Sou Visitante',
        confirmButtonColor: '#7B2CBF',
        denyButtonColor: '#00F5D4',
        cancelButtonText: 'Cancelar'
    });

    if (tipo === true) { // Admin
        const adminUser = { id: 'admin', nome: 'Marcelo Admin', email: 'admin@mapa.com', photoURL: 'imgs/foto-perfil.webp', role: 'admin' };
        localStorage.setItem('usuario_logado', JSON.stringify(adminUser));
        Swal.fire('Bem-vindo, Admin!', 'Você tem acesso total.', 'success').then(() => window.location.reload());
    } else if (tipo === false) { // Visitante
        const visitUser = { id: 'guest', nome: 'Visitante', email: 'visitante@gmail.com', photoURL: 'imgs/logo.png', role: 'user' };
        localStorage.setItem('usuario_logado', JSON.stringify(visitUser));
        Swal.fire('Bem-vindo!', 'Você pode explorar e favoritar eventos.', 'success').then(() => window.location.reload());
    }
};

window.logout = () => {
    localStorage.removeItem('usuario_logado');
    window.location.href = 'index.html';
};

function getUsuario() {
    return JSON.parse(localStorage.getItem('usuario_logado'));
}

function isAdmin() {
    const user = getUsuario();
    return user && user.role === 'admin';
}

function atualizarAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;
    
    const user = getUsuario();
    
    if (user) {
        const badgeAdmin = user.role === 'admin' ? '<span class="badge bg-warning text-dark ms-2" style="font-size: 0.7em;">ADMIN</span>' : '';
        container.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-dark dropdown-toggle d-flex align-items-center gap-2 border-secondary" type="button" data-bs-toggle="dropdown">
                    <img src="${user.photoURL}" class="rounded-circle" style="width: 24px; height: 24px; object-fit: cover;" onerror="this.src='imgs/logo.png'">
                    <span class="d-none d-md-inline text-white">${user.nome.split(' ')[0]}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg border-secondary">
                    <li class="px-3 py-2 border-bottom border-secondary mb-2"><small class="text-white opacity-50">${user.email}</small> ${badgeAdmin}</li>
                    <li><a class="dropdown-item" href="favoritos.html"><i class="bi bi-heart-fill text-danger me-2"></i>Meus Favoritos</a></li>
                    <li><button class="dropdown-item text-warning" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Sair</button></li>
                </ul>
            </div>`;
    } else {
        container.innerHTML = `<button onclick="login()" class="btn btn-outline-light btn-sm rounded-pill px-3 border-secondary"><i class="bi bi-person-circle me-2"></i>Entrar</button>`;
    }
}

// --- 3. RENDERIZAÇÃO DE INTERFACE ---

// Função principal executada ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    atualizarAuthUI();
    
    // Atualiza Navbar Ativa
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if(link.getAttribute('href') && path.includes(link.getAttribute('href'))) link.classList.add('active');
    });

    // PROTEÇÃO DE ROTAS ADMIN
    if ((path.includes('cadastro.html') || path.includes('editar.html')) && !isAdmin()) {
        Swal.fire({ icon: 'error', title: 'Acesso Negado', text: 'Apenas administradores podem acessar esta página.' })
        .then(() => window.location.href = 'index.html');
        return;
    }

    // CONTROLE DE VISIBILIDADE DE BOTÕES (ADMIN)
    const btnCadastrar = document.getElementById('btn-cadastrar-home');
    if(btnCadastrar) btnCadastrar.style.display = isAdmin() ? 'inline-flex' : 'none';

    // A. CARROSSEL (HOME)
    const containerDestaques = document.getElementById('lista-destaques');
    if (containerDestaques) {
        const db = await carregarBanco();
        const destaques = db.eventos.filter(r => r.destaque).slice(0, 3);
        
        if(destaques.length > 0) {
            containerDestaques.innerHTML = destaques.map((r, i) => `
                <div class="carousel-item ${i === 0 ? 'active' : ''}" style="height: 500px;">
                    <div class="w-100 h-100 bg-black">
                        <img src="${r.imagem_principal}" class="d-block w-100 h-100 object-fit-cover opacity-75" onerror="this.src='imgs/logo.png'">
                    </div>
                    <div class="carousel-caption-custom">
                        <span class="badge bg-warning text-dark mb-2">EM ALTA</span>
                        <h2 class="fw-bold text-white display-5">${r.nome}</h2>
                        <a href="detalhes.html?id=${r.id}" class="btn btn-light rounded-pill mt-2 fw-bold">Ver Detalhes</a>
                    </div>
                </div>
            `).join('');
        } else {
            containerDestaques.innerHTML = '<div class="carousel-item active" style="height:500px;"><div class="d-flex h-100 align-items-center justify-content-center text-white"><h3>Sem destaques no momento.</h3></div></div>';
        }
    }

    // B. CATEGORIAS (HOME)
    const listaCat = document.getElementById('lista-de-categorias');
    if(listaCat) {
        const db = await carregarBanco();
        listaCat.innerHTML = db.categorias_principais.map(c => `
            <div class="col">
                <a href="categoria.html?id=${c.id}" class="text-decoration-none">
                    <div class="card card-category h-100 p-3 d-flex align-items-center justify-content-center text-center">
                        <h5 class="m-0">${c.nome}</h5>
                    </div>
                </a>
            </div>`).join('');
    }

    // C. LISTAS DE EVENTOS (Index, Todos, Categoria, Favoritos)
    if (document.getElementById('lista-roles-por-categoria')) {
        carregarListaEventos();
    }

    // D. PÁGINA DE DETALHES
    if (document.getElementById('detalhe-do-evento')) {
        carregarDetalhesEvento();
    }

    // E. BUSCA GLOBAL
    const formBusca = document.getElementById('form-busca');
    if(formBusca) {
        formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            const termo = formBusca.querySelector('input').value;
            if(termo) window.location.href = `todos.html?busca=${encodeURIComponent(termo)}`;
        });
    }
});

// Renderiza os cards nas páginas de listagem
async function carregarListaEventos() {
    const containerLista = document.getElementById('lista-roles-por-categoria');
    if (!containerLista) return;

    containerLista.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-light"></div></div>';

    const db = await carregarBanco();
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    let eventos = db.eventos || [];
    let titulo = "Todos os Rolezinhos";
    let descricao = "Confira a programação completa da cidade.";

    // Lógica de Filtro
    if (path.includes('favoritos.html')) {
        const favs = getFavoritos();
        eventos = eventos.filter(e => favs.includes(e.id));
        titulo = "Meus Favoritos";
        descricao = "Seus eventos salvos.";
        if(eventos.length === 0) {
            containerLista.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-heartbreak display-1 text-muted"></i>
                    <h3 class="text-white mt-3">Você ainda não tem favoritos.</h3>
                    <a href="todos.html" class="btn btn-outline-light mt-3">Explorar Rolezinhos</a>
                </div>`;
            return;
        }
    } 
    else if (params.get('id')) {
        eventos = eventos.filter(e => e.categoria_principal_id == params.get('id'));
        const cat = db.categorias_principais.find(c => c.id == params.get('id'));
        if(cat) {
            titulo = cat.nome;
            descricao = cat.descricao;
        }
    } 
    else if (params.get('busca')) {
        const termo = params.get('busca').toLowerCase();
        eventos = eventos.filter(e => e.nome.toLowerCase().includes(termo));
        titulo = `Busca: "${params.get('busca')}"`;
        descricao = `${eventos.length} resultado(s) encontrado(s).`;
    }

    // Atualiza Títulos
    const elTitulo = document.getElementById('categoria-titulo');
    const elDesc = document.getElementById('categoria-descricao');
    if(elTitulo) elTitulo.innerText = titulo;
    if(elDesc) elDesc.innerText = descricao;

    // Gera HTML dos Cards
    if(eventos.length > 0) {
        const favs = getFavoritos();

        containerLista.innerHTML = eventos.map(r => {
            const catNome = db.categorias_principais.find(c => c.id == r.categoria_principal_id)?.nome || 'Geral';
            const isFav = favs.includes(r.id);
            const favClass = isFav ? 'active' : '';
            const iconClass = isFav ? 'bi-heart-fill' : 'bi-heart';
            const img = r.imagem_principal || 'imgs/logo.png';

            return `
            <div class="col">
                <div class="card-role h-100">
                    <!-- Botão Favoritar (canto superior direito) -->
                    <button class="btn-fav-card ${favClass}" id="fav-btn-${r.id}" onclick="toggleFavorito('${r.id}')" title="Favoritar">
                        <i class="bi ${iconClass}"></i>
                    </button>

                    <a href="detalhes.html?id=${r.id}" class="text-decoration-none d-flex flex-column h-100">
                        <div class="card-img-wrapper" style="height: 200px;">
                            <img src="${img}" class="w-100 h-100 object-fit-cover" onerror="this.src='imgs/logo.png'">
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
        containerLista.innerHTML = '<div class="col-12 text-center py-5"><h4 class="text-muted">Nenhum evento encontrado.</h4></div>';
    }
}

async function carregarDetalhesEvento() {
    const params = new URLSearchParams(window.location.search);
    const idDetalhe = params.get('id');
    
    if(!idDetalhe) return;

    const db = await carregarBanco();
    const evt = db.eventos.find(e => e.id == idDetalhe);

    if(evt) {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('content-area').style.display = 'block';

        // Preenche dados
        document.getElementById('detalhe-titulo').innerText = evt.nome;
        document.getElementById('detalhe-descricao').innerText = evt.descricao;
        document.getElementById('detalhe-conteudo').innerText = evt.conteudo;
        document.getElementById('detalhe-imagem').src = evt.imagem_principal || 'imgs/logo.png';
        document.getElementById('detalhe-data').innerText = evt.data ? new Date(evt.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir';
        document.getElementById('detalhe-horario').innerText = evt.horario;
        document.getElementById('detalhe-local').innerText = evt.local;
        document.getElementById('detalhe-ingressos').innerText = evt.ingressos;
        document.getElementById('detalhe-atracoes').innerText = evt.atracoes_principais;
        
        const cat = db.categorias_principais.find(c => c.id == evt.categoria_principal_id);
        if(cat) document.getElementById('detalhe-categoria').innerText = cat.nome;

        // Botão Favoritar Detalhes
        const btnFav = document.getElementById('btn-fav-detail');
        // Remove listeners antigos clonando
        const newBtnFav = btnFav.cloneNode(true);
        btnFav.parentNode.replaceChild(newBtnFav, btnFav);
        
        newBtnFav.onclick = () => toggleFavorito(evt.id);
        atualizarBotoesFavUI(evt.id);

        // Botões Admin (Editar/Excluir)
        const containerAdmin = document.getElementById('admin-buttons-container');
        if(containerAdmin) {
            if(isAdmin()) {
                containerAdmin.style.display = 'flex';
                document.getElementById('btn-editar').href = `editar.html?id=${evt.id}`;
                document.getElementById('btn-excluir').onclick = () => {
                    Swal.fire('Aviso', 'A exclusão é desabilitada neste modo de demonstração.', 'warning');
                };
            } else {
                containerAdmin.style.display = 'none';
            }
        }
        
        // Mapa Leaflet
        if (evt.lat && evt.lng && typeof L !== 'undefined') {
             const mapDiv = document.getElementById('map-detail');
             mapDiv.innerHTML = ""; 
             const map = L.map('map-detail').setView([evt.lat, evt.lng], 15);
             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
             L.marker([evt.lat, evt.lng]).addTo(map).bindPopup(evt.nome).openPopup();
        }
    } else {
        document.getElementById('loading-msg').innerHTML = '<h3 class="text-white">Evento não encontrado.</h3><a href="index.html" class="btn btn-light mt-3">Voltar</a>';
    }
}

// Busca de Endereço (Cadastro/Edição)
window.buscarEndereco = async () => {
    const end = document.getElementById('local').value;
    if(!end) return Swal.fire('Ops', 'Digite um endereço!', 'warning');
    
    const btn = document.getElementById('btn-buscar-geo');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';
    
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(end)}&limit=1`);
        const d = await r.json();
        if(d.length) {
            document.getElementById('lat').value = d[0].lat;
            document.getElementById('lng').value = d[0].lon;
            Swal.fire({ toast:true, icon:'success', title:'Local encontrado!', position:'top-end', timer:2000, showConfirmButton:false });
        } else { Swal.fire('Erro', 'Endereço não encontrado.', 'error'); }
    } catch(e) { Swal.fire('Erro', 'Falha na conexão.', 'error'); }
    finally { btn.innerHTML = oldHtml; }
};