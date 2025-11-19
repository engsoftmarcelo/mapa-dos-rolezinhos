// --- IMPORTAÇÕES DO FIREBASE (Versão Modular via CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SUA CONFIGURAÇÃO (JÁ INSERIDA) ---
const firebaseConfig = {
  apiKey: "AIzaSyDKBnPHgrTk3QArYQyCuD0Z1baOenf4GdE",
  authDomain: "mapadosrolezinhos.firebaseapp.com",
  projectId: "mapadosrolezinhos",
  storageBucket: "mapadosrolezinhos.firebasestorage.app",
  messagingSenderId: "283864853368",
  appId: "1:283864853368:web:6b6027885c158774ca768d",
  measurementId: "G-F6GCE32P6V"
};

// --- INICIALIZAÇÃO DO FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Estado Global do Usuário
let currentUser = null;

// --- DADOS DE FALLBACK (Para popular o banco na primeira vez) ---
const DADOS_INICIAIS = [
    {
      "id": 1,
      "nome": "Festa da Atlética",
      "imagem_principal": "imgs/atletica_foto1.jpg",
      "descricao": "A maior festa universitária do semestre!",
      "local": "Espaço Modular, Centro",
      "horario": "Sexta, 22h",
      "data": "2023-11-24",
      "zona": "centro",
      "preco": 40,
      "ingressos": "R$ 40",
      "categoria_principal_id": 1,
      "destaque": true,
      "lat": -19.9191, "lng": -43.9386,
      "conteudo": "Prepare-se para a noite mais insana do ano! Open bar, 3 pistas de dança e as melhores atrações universitárias."
    },
    {
      "id": 2,
      "nome": "Piquenique Cultural",
      "imagem_principal": "imgs/piquenique_foto2.jpg",
      "descricao": "Música e arte no parque.",
      "local": "Parque Municipal, Centro",
      "horario": "Sábado, 15h",
      "data": "2023-11-25",
      "zona": "centro",
      "preco": 0,
      "ingressos": "Gratuito",
      "categoria_principal_id": 3,
      "destaque": true,
      "lat": -19.9246, "lng": -43.9363,
      "conteudo": "Um dia de sol, grama verde e muita cultura. Traga sua canga e aproveite shows acústicos."
    },
    {
      "id": 3,
      "nome": "Hype Neon",
      "imagem_principal": "imgs/Hype1.jpg",
      "descricao": "Festa eletrônica na Savassi.",
      "local": "Clube Chalezinho, Savassi",
      "horario": "Sábado, 23h",
      "data": "2023-11-25",
      "categoria_principal_id": 1,
      "destaque": true,
      "conteudo": "Muita luz negra, tintas neon e o melhor da cena eletrônica de BH."
    },
    {
      "id": 7,
      "nome": "Baile do Viaduto",
      "imagem_principal": "imgs/viaduto_foto2.jpg",
      "descricao": "Rap e cultura urbana embaixo do viaduto.",
      "local": "Viaduto Santa Tereza, Centro",
      "horario": "Sexta, 20h",
      "data": "2023-12-01",
      "categoria_principal_id": 1,
      "destaque": true,
      "conteudo": "A tradicional batalha de MCs seguida de shows locais."
    }
];

// --- AUTENTICAÇÃO ---

// Função Global de Login
window.loginGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        Swal.fire({ 
            icon: 'success', 
            title: 'Login realizado!', 
            toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, 
            background: '#1e1e1e', color: '#fff' 
        });
    } catch (error) {
        console.error("Erro login:", error);
        Swal.fire({ title: 'Erro', text: 'Falha ao fazer login com Google', icon: 'error', background: '#1e1e1e', color: '#fff' });
    }
};

// Função Global de Logout
window.logout = () => {
    signOut(auth).then(() => {
        window.location.reload();
    });
};

// Monitorar Estado do Usuário
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    atualizarInterfaceUsuario(user);
    if (user) {
        atualizarIconesFavoritos(); // Carrega os favoritos assim que logar
    }
});

function atualizarInterfaceUsuario(user) {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (user) {
        container.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-dark dropdown-toggle d-flex align-items-center gap-2 border-secondary" type="button" data-bs-toggle="dropdown">
                    <img src="${user.photoURL}" class="rounded-circle" style="width: 24px; height: 24px;">
                    <span class="d-none d-md-inline">${user.displayName.split(' ')[0]}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                    <li><span class="dropdown-item-text small text-muted">${user.email}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" onclick="logout()">Sair</button></li>
                </ul>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button onclick="loginGoogle()" class="btn btn-outline-light btn-sm rounded-pill">
                <i class="bi bi-google me-2"></i>Entrar
            </button>
        `;
    }
}

// --- BANCO DE DADOS (FIRESTORE) ---

// 1. Busca Eventos (Lê do Firestore)
async function fetchRoles(termoBusca = null) {
    const eventosRef = collection(db, "eventos");
    const snapshot = await getDocs(eventosRef);
    
    let roles = [];
    
    // MIGRAÇÃO AUTOMÁTICA SE O BANCO ESTIVER VAZIO
    if (snapshot.empty) {
        console.log("Banco vazio. Iniciando migração de dados...");
        await migrarDadosIniciais();
        return DADOS_INICIAIS; 
    }

    snapshot.forEach(doc => {
        roles.push({ id: doc.id, ...doc.data() });
    });

    if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        roles = roles.filter(r => 
            r.nome.toLowerCase().includes(termo) || 
            (r.descricao && r.descricao.toLowerCase().includes(termo))
        );
    }
    return roles;
}

async function migrarDadosIniciais() {
    for (const role of DADOS_INICIAIS) {
        await setDoc(doc(db, "eventos", role.id.toString()), role);
    }
    console.log("Migração concluída!");
    Swal.fire({ title: 'Banco Criado!', text: 'Dados iniciais carregados.', icon: 'success', background: '#1e1e1e', color: '#fff' }).then(() => window.location.reload());
}

async function fetchRoleById(id) {
    const docRef = doc(db, "eventos", id.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        return null;
    }
}

// Função Mock para categorias (mantendo simples por enquanto)
async function fetchCategoriaById(id) {
    const categorias = [
        { id: 1, nome: "Festas e Vida Noturna" },
        { id: 2, nome: "Cultura e Arte" },
        { id: 3, nome: "Ao Ar Livre" },
        { id: 4, nome: "Gastronomia" },
        { id: 5, nome: "Jogos e Geek" }
    ];
    return categorias.find(c => c.id == id) || { nome: "Geral" };
}

async function fetchCategorias() {
    return [
        { id: 1, nome: "Festas e Vida Noturna" },
        { id: 2, nome: "Cultura e Arte" },
        { id: 3, nome: "Ao Ar Livre" },
        { id: 4, nome: "Gastronomia" },
        { id: 5, nome: "Jogos e Geek" }
    ];
}

// --- FAVORITOS (NA NUVEM) ---

window.toggleFavCard = async function(event, idRole) {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
        Swal.fire({
            icon: 'info',
            title: 'Faça login',
            text: 'Você precisa entrar com o Google para salvar favoritos!',
            background: '#1e1e1e', color: '#fff',
            confirmButtonText: 'Entrar agora',
            confirmButtonColor: '#6f42c1'
        }).then((result) => {
            if (result.isConfirmed) loginGoogle();
        });
        return;
    }

    const userRef = doc(db, "usuarios", currentUser.uid);
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const isFav = icon.classList.contains('bi-heart-fill');

    try {
        // Garante que o documento do usuário existe
        await setDoc(userRef, { email: currentUser.email }, { merge: true });

        if (isFav) {
            // Remove favorito
            await updateDoc(userRef, {
                favoritos: arrayRemove(idRole.toString())
            });
            icon.classList.replace('bi-heart-fill', 'bi-heart');
            icon.classList.replace('text-danger', 'text-white');
        } else {
            // Adiciona favorito
            await updateDoc(userRef, {
                favoritos: arrayUnion(idRole.toString())
            });
            icon.classList.replace('bi-heart', 'bi-heart-fill');
            icon.classList.replace('text-white', 'text-danger');
            
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Salvo nos favoritos!', showConfirmButton: false, timer: 1500,
                background: '#1e1e1e', color: '#fff'
            });
        }
    } catch (e) {
        console.error("Erro ao favoritar:", e);
    }
};

async function atualizarIconesFavoritos() {
    if (!currentUser) return;

    const userRef = doc(db, "usuarios", currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        const dados = docSnap.data();
        const favoritos = dados.favoritos || [];

        document.querySelectorAll('.btn-fav-card').forEach(btn => {
            // Extrai ID do onclick="toggleFavCard(event, 1)"
            const onclickText = btn.getAttribute('onclick'); 
            const idMatch = onclickText && onclickText.match(/toggleFavCard\(event,\s*['"]?(\d+)['"]?\)/);
            
            if (idMatch && favoritos.includes(idMatch[1])) {
                const icon = btn.querySelector('i');
                icon.classList.replace('bi-heart', 'bi-heart-fill');
                icon.classList.remove('text-white');
                icon.classList.add('text-danger');
            }
        });

        // Atualiza botão da página de detalhes
        const btnDetail = document.getElementById('btn-fav-detail');
        if(btnDetail) {
            const params = new URLSearchParams(window.location.search);
            const idUrl = params.get('id');
            if(idUrl && favoritos.includes(idUrl)) {
                const icon = btnDetail.querySelector('i');
                icon.classList.replace('bi-heart', 'bi-heart-fill');
                btnDetail.classList.remove('btn-outline-danger');
                btnDetail.classList.add('btn-danger');
            }
        }
    }
}

// --- RENDERIZAÇÃO E UI ---

async function renderCardHTML(role) {
    let dia = "HOJE";
    let hora = "19h";
    
    if(role.horario) {
        const partes = role.horario.split(',');
        if(partes.length > 0) dia = partes[0].split(' ')[0].substring(0, 3).toUpperCase();
        if(partes.length > 1) hora = partes[1].trim();
        else hora = role.horario.split(' ')[0];
    }

    const cat = await fetchCategoriaById(role.categoria_principal_id);
    const nomeCategoria = cat.nome.split(' ')[0];

    let badgePreco = "";
    if(role.ingressos && role.ingressos.toLowerCase().includes('gratuit')) {
        badgePreco = `<span class="badge-custom" style="background:var(--neon-accent); color:#000;">FREE</span>`;
    }

    return `
    <div class="col">
        <div class="card-role position-relative">
            <button class="btn-fav-card" onclick="toggleFavCard(event, ${role.id})" title="Favoritar">
                <i class="bi bi-heart text-white"></i>
            </button>
            <a href="detalhes.html?id=${role.id}" class="text-decoration-none">
                <div class="card-badges">
                    <span class="badge-custom badge-category">${nomeCategoria}</span>
                    ${badgePreco}
                </div>
                <div class="card-img-wrapper">
                    <img src="${role.imagem_principal}" 
                         alt="${role.nome}" 
                         loading="lazy" 
                         class="w-100 h-100 object-fit-cover"
                         onerror="this.onerror=null; this.src='imgs/logoMapaDosRolezinhos.png';">
                </div>
                <div class="card-body-custom">
                    <div class="date-box">
                        <span class="date-day">${dia}</span>
                        <span class="date-time">${hora}</span>
                    </div>
                    <div class="card-info">
                        <h5 class="card-title text-truncate">${role.nome}</h5>
                        <p class="card-desc">${role.descricao}</p>
                    </div>
                </div>
            </a>
        </div>
    </div>`;
}

function renderSkeletonCards(quantidade = 3) {
    let html = '';
    for (let i = 0; i < quantidade; i++) {
        html += `
        <div class="col">
            <div class="card-role position-relative" aria-hidden="true">
                <div class="card-img-wrapper bg-secondary bg-opacity-25 placeholder-glow">
                    <span class="placeholder w-100 h-100"></span>
                </div>
                <div class="card-body-custom">
                    <div class="card-info w-100 ps-3">
                        <h5 class="card-title placeholder-glow"><span class="placeholder col-7"></span></h5>
                    </div>
                </div>
            </div>
        </div>`;
    }
    return html;
}

// --- ROUTER E INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idEvento = params.get('id');
    const termoBusca = params.get('busca');
    const isTodosPage = document.getElementById('lista-roles-por-categoria'); // Verifica se é a página "Todos" ou "Categoria"

    // 1. PÁGINA INICIAL (Index)
    const listaDestaques = document.getElementById('lista-destaques');
    if (listaDestaques && !termoBusca) {
        listaDestaques.innerHTML = renderSkeletonCards(3);
        const roles = await fetchRoles();
        
        listaDestaques.innerHTML = '';
        const destaques = roles.filter(r => r.destaque).slice(0, 6);
        
        if(destaques.length === 0) {
            listaDestaques.innerHTML = '<p class="text-muted">Carregando dados do servidor...</p>';
        }

        for (const r of destaques) {
            listaDestaques.innerHTML += await renderCardHTML(r);
        }
        
        // Carrega categorias
        const cats = await fetchCategorias();
        const listaCat = document.getElementById('lista-de-categorias');
        if(listaCat) {
            listaCat.innerHTML = '';
            cats.forEach(c => {
                listaCat.innerHTML += `
                    <div class="col">
                        <div class="card card-category h-100 p-3 d-flex align-items-center justify-content-center">
                            <a href="categoria.html?id=${c.id}" class="text-decoration-none w-100">
                                <h5 class="m-0" style="font-size: 0.9rem;">${c.nome}</h5>
                            </a>
                        </div>
                    </div>`;
            });
        }
        
        setTimeout(atualizarIconesFavoritos, 1000);
    }

    // 2. PÁGINA DETALHES
    const detalheArea = document.getElementById('detalhe-do-evento');
    if (detalheArea && idEvento) {
        const evt = await fetchRoleById(idEvento);
        if (evt) {
            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('content-area').style.display = 'block';
            
            // Preenchimento de dados
            const cat = await fetchCategoriaById(evt.categoria_principal_id);
            document.getElementById('detalhe-categoria').textContent = cat.nome;
            document.getElementById('detalhe-titulo').textContent = evt.nome;
            document.getElementById('detalhe-imagem').src = evt.imagem_principal;
            document.getElementById('detalhe-descricao').textContent = evt.descricao;
            document.getElementById('detalhe-conteudo').textContent = evt.conteudo || evt.descricao;
            document.getElementById('detalhe-local').textContent = evt.local;
            document.getElementById('detalhe-horario').textContent = evt.horario;
            document.getElementById('detalhe-data').textContent = evt.data ? new Date(evt.data).toLocaleDateString('pt-BR') : '';
            document.getElementById('detalhe-ingressos').textContent = evt.ingressos || '-';
            document.getElementById('detalhe-atracoes').textContent = evt.atracoes_principais || '-';

            // Botão Favorito Detalhes
            const btnFavDetail = document.getElementById('btn-fav-detail');
            if(btnFavDetail) btnFavDetail.onclick = (e) => toggleFavCard(e, evt.id);

            // Botão Excluir (Simulação/Admin)
            const btnExcluir = document.getElementById('btn-excluir');
            if(btnExcluir) btnExcluir.style.display = 'none'; // Esconde delete por enquanto no Firebase client-side
            
            // Botão Editar
            const btnEditar = document.getElementById('btn-editar');
            if(btnEditar) btnEditar.href = `editar.html?id=${evt.id}`;

            // --- LÓGICA GOOGLE CALENDAR ---
            const btnCalendar = document.getElementById('btn-google-calendar');
            if(btnCalendar) {
                let dataInicio = new Date();
                let dataFim = new Date();
                try {
                    const horaTexto = evt.horario ? evt.horario.replace(/\D/g, '') : '20';
                    const horaInt = parseInt(horaTexto) || 20;
                    if(evt.data) {
                        const dataParts = evt.data.split('-'); 
                        if(dataParts.length === 3) {
                             dataInicio = new Date(dataParts[0], dataParts[1] - 1, dataParts[2], horaInt, 0, 0);
                             dataFim = new Date(dataInicio.getTime() + (4 * 60 * 60 * 1000)); 
                        }
                    }
                } catch (e) { console.warn("Erro data calendar", e); }

                const formatGoogleDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.nome)}&dates=${formatGoogleDate(dataInicio)}/${formatGoogleDate(dataFim)}&details=${encodeURIComponent(evt.descricao)}&location=${encodeURIComponent(evt.local)}&sf=true&output=xml`;
                
                btnCalendar.href = googleUrl;
            }

            // Mapa Leaflet
            if (evt.lat && evt.lng) {
                const mapContainer = document.getElementById('map-detail');
                if (mapContainer && typeof L !== 'undefined') {
                    const map = L.map('map-detail').setView([evt.lat, evt.lng], 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
                    L.marker([evt.lat, evt.lng]).addTo(map).bindPopup(`<b>${evt.nome}</b>`).openPopup();
                }
            }

            setTimeout(atualizarIconesFavoritos, 1000);
        }
    }

    // 3. PÁGINA TODOS OS ROLÊS (ou Busca)
    if (isTodosPage || (listaDestaques && termoBusca)) {
        const containerAlvo = isTodosPage || document.getElementById('lista-resultados-busca');
        if(containerAlvo) {
            containerAlvo.innerHTML = renderSkeletonCards(3);
            
            const roles = await fetchRoles(termoBusca);
            
            containerAlvo.innerHTML = '';
            if (roles.length > 0) {
                for (const r of roles) {
                    containerAlvo.innerHTML += await renderCardHTML(r);
                }
            } else {
                containerAlvo.innerHTML = '<div class="col-12 text-center text-muted py-5"><h4>Nenhum rolê encontrado.</h4></div>';
            }
            setTimeout(atualizarIconesFavoritos, 1000);
        }
    }

    // 4. CADASTRO (Simplificado para Firestore)
    const fCad = document.getElementById('form-cadastro');
    if(fCad) {
        // Preencher categorias no select
        const s = document.getElementById('categoria_principal_id');
        const cats = await fetchCategorias();
        s.innerHTML = '';
        cats.forEach(c => s.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        fCad.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!currentUser) {
                Swal.fire('Erro', 'Faça login para cadastrar!', 'error');
                return;
            }
            
            // Lógica simples de imagem (mantém o logo se não tiver upload real configurado)
            const novoRole = {
                id: Date.now().toString(), // ID como string pro Firestore
                nome: document.getElementById('nome').value,
                imagem_principal: 'imgs/logoMapaDosRolezinhos.png', 
                descricao: document.getElementById('descricao').value,
                conteudo: document.getElementById('conteudo').value,
                local: document.getElementById('local').value,
                horario: document.getElementById('horario').value,
                atracoes_principais: document.getElementById('atracoes_principais').value,
                ingressos: document.getElementById('ingressos').value,
                categoria_principal_id: parseInt(s.value),
                destaque: document.getElementById('destaque').checked,
                criado_por: currentUser.email
            };

            await setDoc(doc(db, "eventos", novoRole.id), novoRole);
            Swal.fire({ title: 'Sucesso!', text: 'Rolê cadastrado na Nuvem!', icon: 'success', background: '#1e1e1e', color: '#fff' });
            setTimeout(() => window.location.href = 'index.html', 1500);
        });
    }
});