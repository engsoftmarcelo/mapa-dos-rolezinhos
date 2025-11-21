/* =========================================
   VERSÃO DE PRODUÇÃO (ESTÁTICA)
   - Lê os dados diretamente do arquivo db/db.json
   - Funciona no Vercel/Firebase Hosting
   ========================================= */

// Caminho para o seu arquivo de dados
const DATA_URL = "db/db.json";

// --- 1. FUNÇÕES DE BUSCA (DATA) ---

// Função genérica para carregar todo o banco de dados
async function carregarBanco() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Erro ao carregar db.json');
        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return { eventos: [], categorias_principais: [] };
    }
}

// Busca lista de eventos
async function fetchRoles(termoBusca = null) {
    const db = await carregarBanco();
    let roles = db.eventos || [];

    // Filtragem manual
    if (termoBusca) {
        const t = termoBusca.toLowerCase();
        roles = roles.filter(r => 
            r.nome.toLowerCase().includes(t) || 
            (r.descricao && r.descricao.toLowerCase().includes(t))
        );
    }
    return roles;
}

// Busca evento por ID
async function fetchRoleById(id) {
    const db = await carregarBanco();
    const eventos = db.eventos || [];
    return eventos.find(r => r.id == id) || null;
}

// Busca categorias
async function fetchCategorias() {
    const db = await carregarBanco();
    return db.categorias_principais || [];
}

async function fetchCategoriaById(id) {
    const cats = await fetchCategorias();
    // Compara como string e número para garantir
    return cats.find(c => c.id == id) || { nome: "Geral", descricao: "" };
}

// --- 2. AUTENTICAÇÃO SIMULADA ---
// (Mantida para você conseguir ver a tela de cadastro, mesmo que não salve no servidor)
window.loginGoogle = () => {
    const fakeUser = {
        displayName: "Admin Visitante",
        email: "visitante@maparole.com",
        photoURL: "imgs/foto-perfil.webp"
    };
    localStorage.setItem('usuario_logado', JSON.stringify(fakeUser));
    window.location.reload();
};

window.logout = () => {
    localStorage.removeItem('usuario_logado');
    window.location.reload();
};

function checarUsuario() {
    const userJson = localStorage.getItem('usuario_logado');
    return userJson ? JSON.parse(userJson) : null;
}

function atualizarAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;
    
    const user = checarUsuario();
    
    if (user) {
        container.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-dark dropdown-toggle d-flex align-items-center gap-2 border-secondary" type="button" data-bs-toggle="dropdown">
                    <img src="${user.photoURL}" class="rounded-circle" style="width: 24px; height: 24px; object-fit: cover;" onerror="this.src='imgs/logo.png'">
                    <span class="d-none d-md-inline text-white">${user.displayName.split(' ')[0]}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                    <li><button class="dropdown-item text-danger" onclick="logout()">Sair</button></li>
                </ul>
            </div>`;
    } else {
        container.innerHTML = `<button onclick="loginGoogle()" class="btn btn-outline-light btn-sm rounded-pill"><i class="bi bi-person-circle me-2"></i>Entrar</button>`;
    }
}

// --- 3. LÓGICA DE PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    atualizarAuthUI();
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // A. CARROSSEL (HOME)
    const containerDestaques = document.getElementById('lista-destaques');
    if (containerDestaques && !path.includes('todos.html')) {
        try {
            const roles = await fetchRoles();
            let destaques = roles.filter(r => r.destaque === true);
            
            if (destaques.length === 0) destaques = roles.slice(0, 3);

            containerDestaques.innerHTML = '';
            
            if(destaques.length > 0) {
                destaques.forEach((r, index) => {
                    const active = index === 0 ? 'active' : '';
                    const img = r.imagem_principal || 'imgs/logo.png';
                    
                    containerDestaques.innerHTML += `
                        <div class="carousel-item ${active}" style="height: 500px;">
                            <div class="w-100 h-100 bg-black">
                                <img src="${img}" class="d-block w-100 h-100 object-fit-cover opacity-75" 
                                     onerror="this.onerror=null; this.src='imgs/logo.png'">
                            </div>
                            <div class="carousel-caption-custom">
                                <span class="badge bg-warning text-dark mb-2">EM ALTA</span>
                                <h2 class="fw-bold text-white display-5">${r.nome}</h2>
                                <a href="detalhes.html?id=${r.id}" class="btn btn-light rounded-pill mt-2">Ver Detalhes</a>
                            </div>
                        </div>`;
                });
            } else {
                containerDestaques.innerHTML = '<div class="carousel-item active" style="height:400px;"><div class="d-flex align-items-center justify-content-center h-100 text-white"><h3>Nenhum evento encontrado.</h3></div></div>';
            }
        } catch (e) {
            console.error(e);
            containerDestaques.innerHTML = '<div class="text-white text-center p-5">Erro ao carregar.</div>';
        }
    }

    // B. LISTA DE CATEGORIAS
    const listaCat = document.getElementById('lista-de-categorias');
    if(listaCat) {
        const cats = await fetchCategorias();
        listaCat.innerHTML = '';
        cats.forEach(c => {
            listaCat.innerHTML += `
            <div class="col">
                <a href="categoria.html?id=${c.id}" class="text-decoration-none">
                    <div class="card card-category h-100 p-3 d-flex align-items-center justify-content-center text-center">
                        <h5 class="m-0">${c.nome}</h5>
                    </div>
                </a>
            </div>`;
        });
    }

    // C. LISTAGEM (TODOS/CATEGORIA)
    const containerLista = document.getElementById('lista-roles-por-categoria');
    if (containerLista) {
        const termo = params.get('busca');
        const catId = params.get('id');
        
        let roles = await fetchRoles(termo);
        
        if(catId) {
            roles = roles.filter(r => String(r.categoria_principal_id) === String(catId));
            const catInfo = await fetchCategoriaById(catId);
            if(document.getElementById('categoria-titulo')) {
                document.getElementById('categoria-titulo').textContent = catInfo.nome;
                document.getElementById('categoria-descricao').textContent = catInfo.descricao || "";
            }
        } else if (termo && document.getElementById('categoria-titulo')) {
            document.getElementById('categoria-titulo').textContent = `Busca: "${termo}"`;
            document.getElementById('categoria-descricao').textContent = "Resultados encontrados.";
        }

        containerLista.innerHTML = '';
        if (roles.length > 0) {
            for(const r of roles) {
                const img = r.imagem_principal || 'imgs/logo.png';
                const c = await fetchCategoriaById(r.categoria_principal_id);
                
                containerLista.innerHTML += `
                <div class="col">
                    <div class="card-role h-100">
                        <a href="detalhes.html?id=${r.id}" class="text-decoration-none">
                            <div class="card-img-wrapper" style="height: 200px;">
                                <img src="${img}" class="w-100 h-100 object-fit-cover" 
                                     onerror="this.onerror=null; this.src='imgs/logo.png'">
                            </div>
                            <div class="card-body-custom">
                                <span class="badge bg-primary mb-2 w-auto align-self-start">${c.nome}</span>
                                <h5 class="card-title text-white">${r.nome}</h5>
                                <p class="card-desc text-muted small">${r.descricao || ''}</p>
                            </div>
                        </a>
                    </div>
                </div>`;
            }
        } else {
            containerLista.innerHTML = '<p class="text-white text-center col-12">Nenhum evento encontrado.</p>';
        }
    }

    // D. PÁGINA DETALHES
    const idDetalhe = params.get('id');
    if(idDetalhe && document.getElementById('detalhe-do-evento')) {
        const evt = await fetchRoleById(idDetalhe);
        if(evt) {
            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('content-area').style.display = 'block';
            
            document.getElementById('detalhe-titulo').textContent = evt.nome;
            document.getElementById('detalhe-descricao').textContent = evt.descricao;
            document.getElementById('detalhe-conteudo').textContent = evt.conteudo || evt.descricao;
            
            const imgDet = document.getElementById('detalhe-imagem');
            imgDet.src = evt.imagem_principal || 'imgs/logo.png';
            imgDet.onerror = function() { this.src = 'imgs/logo.png'; };

            document.getElementById('detalhe-data').textContent = evt.data ? new Date(evt.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir';
            document.getElementById('detalhe-horario').textContent = evt.horario || 'A definir';
            document.getElementById('detalhe-local').textContent = evt.local || 'Local a confirmar';
            document.getElementById('detalhe-ingressos').textContent = evt.ingressos || 'Consulte';
            document.getElementById('detalhe-atracoes').textContent = evt.atracoes_principais || 'A divulgar';

            // Ajuste visual
            const ul = document.querySelector('#detalhe-data')?.closest('ul');
            if(ul) ul.classList.add('text-white');
            
            if(evt.categoria_principal_id) {
                const c = await fetchCategoriaById(evt.categoria_principal_id);
                document.getElementById('detalhe-categoria').textContent = c.nome;
            }

            // Mapa
            if ((evt.lat && evt.lng) && typeof L !== 'undefined') {
                 const mapDiv = document.getElementById('map-detail');
                 mapDiv.innerHTML = ""; 
                 const map = L.map('map-detail').setView([evt.lat, evt.lng], 15);
                 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                 L.marker([evt.lat, evt.lng]).addTo(map).bindPopup(evt.nome).openPopup();
            }
        }
    }

    // E. CADASTRO (SIMULADO - AVISO)
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        const select = document.getElementById('categoria_principal_id');
        const cats = await fetchCategorias();
        select.innerHTML = cats.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        
        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            Swal.fire({
                icon: 'info',
                title: 'Modo Demonstração',
                text: 'No modo Vercel/Estático, novos cadastros não são salvos permanentemente. Configure o Firebase Firestore para habilitar essa função real.'
            });
        });
    }

    // F. BUSCA
    const formBusca = document.getElementById('form-busca');
    if(formBusca) {
        formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            const termo = formBusca.querySelector('input').value;
            if(termo) window.location.href = `todos.html?busca=${encodeURIComponent(termo)}`;
        });
    }
});

// 4. GLOBAIS
window.buscarEndereco = async () => {
    const end = document.getElementById('local').value;
    if(!end) return Swal.fire('Ops', 'Digite um endereço!', 'warning');
    
    const btn = document.getElementById('btn-buscar-geo');
    const oldTxt = btn.innerHTML;
    btn.innerHTML = '...';
    
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(end)}&limit=1`);
        const d = await r.json();
        if(d.length) {
            document.getElementById('lat').value = d[0].lat;
            document.getElementById('lng').value = d[0].lon;
            Swal.fire({ toast:true, icon:'success', title:'Achado!', position:'top-end', timer:2000, showConfirmButton:false });
        } else { Swal.fire('Erro', 'Endereço não achado.', 'error'); }
    } catch(e) { Swal.fire('Erro', 'Falha na busca.', 'error'); }
    finally { btn.innerHTML = oldTxt; }
};