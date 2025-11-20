// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. SweetAlert2
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm";

// --- CONFIGURAÇÃO ---
const firebaseConfig = {
  apiKey: "AIzaSyDKBnPHgrTk3QArYQyCuD0Z1baOenf4GdE",
  authDomain: "mapadosrolezinhos.firebaseapp.com",
  projectId: "mapadosrolezinhos",
  storageBucket: "mapadosrolezinhos.firebasestorage.app",
  messagingSenderId: "283864853368",
  appId: "1:283864853368:web:6b6027885c158774ca768d",
  measurementId: "G-F6GCE32P6V"
};

// --- INICIALIZAÇÃO ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Estado Global
let currentUser = null;

// --- AUTENTICAÇÃO ---

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
        // [TRATAMENTO DE ERRO] Feedback claro de falha no login
        console.error("Erro Auth:", error);
        Swal.fire({ 
            title: 'Ops!', 
            text: 'Não foi possível conectar com o Google. Tente novamente.', 
            icon: 'error', 
            background: '#1e1e1e', color: '#fff' 
        });
    }
};

window.logout = () => {
    signOut(auth).then(() => window.location.reload());
};

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    atualizarInterfaceUsuario(user);
    if (user) atualizarIconesFavoritos();
});

function atualizarInterfaceUsuario(user) {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (user) {
        container.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-dark dropdown-toggle d-flex align-items-center gap-2 border-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="${user.photoURL}" class="rounded-circle" style="width: 24px; height: 24px;" alt="Foto de perfil">
                    <span class="d-none d-md-inline text-white">${user.displayName.split(' ')[0]}</span>
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

// --- BANCO DE DADOS (DATA FETCHING) ---

// [TRATAMENTO DE ERRO] Adicionado try/catch para lidar com falhas de rede
async function fetchRoles(termoBusca = null) {
    try {
        const eventosRef = collection(db, "eventos");
        const snapshot = await getDocs(eventosRef);
        let roles = [];
        
        snapshot.forEach(doc => roles.push({ id: doc.id, ...doc.data() }));

        if (termoBusca) {
            const termo = termoBusca.toLowerCase();
            roles = roles.filter(r => 
                r.nome.toLowerCase().includes(termo) || 
                (r.descricao && r.descricao.toLowerCase().includes(termo))
            );
        }
        return roles;
    } catch (error) {
        console.error("Erro ao buscar roles:", error);
        // Retorna array vazio para não quebrar o .forEach de quem chamou
        return []; 
    }
}

async function fetchRoleById(id) {
    try {
        if (!id) return null;
        const docRef = doc(db, "eventos", id.toString());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null; // Retorna explicitamente null se não existir
        }
    } catch (error) {
        console.error("Erro ao buscar role por ID:", error);
        throw error; // Lança o erro para ser tratado na UI (exibir mensagem)
    }
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

async function fetchCategoriaById(id) {
    const cats = await fetchCategorias();
    return cats.find(c => c.id == id) || { nome: "Geral" };
}

// --- FAVORITOS ---

window.toggleFavCard = async function(event, idRole) {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
        Swal.fire({
            icon: 'info', title: 'Faça login',
            text: 'Você precisa entrar com o Google para salvar favoritos!',
            background: '#1e1e1e', color: '#fff',
            confirmButtonText: 'Entrar', confirmButtonColor: '#6f42c1'
        }).then((res) => { if (res.isConfirmed) loginGoogle(); });
        return;
    }

    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const isFav = icon.classList.contains('bi-heart-fill');
    const userRef = doc(db, "usuarios", currentUser.uid);

    try {
        await setDoc(userRef, { email: currentUser.email }, { merge: true });

        if (isFav) {
            await updateDoc(userRef, { favoritos: arrayRemove(idRole.toString()) });
            icon.classList.replace('bi-heart-fill', 'bi-heart');
            icon.classList.replace('text-danger', 'text-white');
        } else {
            await updateDoc(userRef, { favoritos: arrayUnion(idRole.toString()) });
            icon.classList.replace('bi-heart', 'bi-heart-fill');
            icon.classList.replace('text-white', 'text-danger');
            
            Swal.fire({
                toast: true, position: 'top-end', icon: 'success',
                title: 'Salvo!', showConfirmButton: false, timer: 1500,
                background: '#1e1e1e', color: '#fff'
            });
        }
    } catch (e) {
        console.error("Erro favorito:", e);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível salvar.', background: '#1e1e1e', color: '#fff' });
    }
};

async function atualizarIconesFavoritos() {
    if (!currentUser) return;
    try {
        const userRef = doc(db, "usuarios", currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const favs = docSnap.data().favoritos || [];
            document.querySelectorAll('.btn-fav-card').forEach(btn => {
                // Extrai ID de forma segura
                const onclickText = btn.getAttribute('onclick'); 
                const idMatch = onclickText && onclickText.match(/toggleFavCard\(event,\s*['"]?(\d+)['"]?\)/);
                if (idMatch && favs.includes(idMatch[1])) {
                    const icon = btn.querySelector('i');
                    if(icon) {
                        icon.classList.replace('bi-heart', 'bi-heart-fill');
                        icon.classList.replace('text-white', 'text-danger');
                    }
                }
            });
            
            // Página de Detalhes
            const btnDetail = document.getElementById('btn-fav-detail');
            if(btnDetail) {
                const params = new URLSearchParams(window.location.search);
                const idUrl = params.get('id');
                if(favs.includes(idUrl)) {
                    const icon = btnDetail.querySelector('i');
                    icon.classList.replace('bi-heart', 'bi-heart-fill');
                    btnDetail.classList.remove('btn-outline-danger');
                    btnDetail.classList.add('btn-danger');
                }
            }
        }
    } catch (error) {
        console.warn("Falha silenciosa ao carregar favoritos", error);
    }
}

// --- RENDERIZAÇÃO HTML ---

async function renderCardHTML(role) {
    // Tratamento para dados ausentes
    const horarioSafe = role.horario || "Horário a definir";
    let dia = "DATA";
    let hora = "";
    
    if(role.horario) {
        const partes = role.horario.split(',');
        dia = partes[0] ? partes[0].split(' ')[0].substring(0, 3).toUpperCase() : "HOJE";
        hora = partes[1] ? partes[1].trim() : (partes[0] || "");
    }

    const cat = await fetchCategoriaById(role.categoria_principal_id);
    const nomeCategoria = cat ? cat.nome.split(' ')[0] : "Geral";
    
    // Fallback de imagem
    const imgSafe = role.imagem_principal || 'imgs/logoMapaDosRolezinhos.png';
    
    let badgePreco = "";
    if(role.ingressos && role.ingressos.toLowerCase().includes('gratuit')) {
        badgePreco = `<span class="badge-custom" style="background:var(--neon-accent); color:#000;">FREE</span>`;
    }

    return `
    <div class="col">
        <div class="card-role position-relative">
            <button class="btn-fav-card" onclick="toggleFavCard(event, ${role.id})" title="Favoritar" aria-label="Adicionar aos favoritos">
                <i class="bi bi-heart text-white"></i>
            </button>
            <a href="detalhes.html?id=${role.id}" class="text-decoration-none">
                <div class="card-badges">
                    <span class="badge-custom badge-category">${nomeCategoria}</span>
                    ${badgePreco}
                </div>
                <div class="card-img-wrapper">
                    <img src="${imgSafe}" 
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
                        <p class="card-desc">${role.descricao || 'Sem descrição.'}</p>
                    </div>
                </div>
            </a>
        </div>
    </div>`;
}

function renderSkeletonCards(qtd = 3) {
    let html = '';
    for (let i = 0; i < qtd; i++) {
        html += `
        <div class="col">
            <div class="card-role position-relative" aria-hidden="true">
                <div class="card-img-wrapper bg-secondary bg-opacity-25 placeholder-glow">
                    <span class="placeholder w-100 h-100"></span>
                </div>
                <div class="card-body-custom">
                    <div class="card-info w-100 ps-3">
                        <h5 class="card-title placeholder-glow"><span class="placeholder col-7"></span></h5>
                        <p class="card-desc placeholder-glow"><span class="placeholder col-4"></span></p>
                    </div>
                </div>
            </div>
        </div>`;
    }
    return html;
}

// --- ROUTER / INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idEvento = params.get('id');
    const termoBusca = params.get('busca');
    
    const listaDestaques = document.getElementById('lista-destaques');
    const listaTodos = document.getElementById('lista-roles-por-categoria');
    const detalheArea = document.getElementById('detalhe-do-evento');

    // 1. HOME (Destaques)
    if (listaDestaques && !termoBusca) {
        try {
            listaDestaques.innerHTML = renderSkeletonCards(3);
            const roles = await fetchRoles();
            
            listaDestaques.innerHTML = '';
            const destaques = roles.filter(r => r.destaque).slice(0, 6);
            
            if(destaques.length === 0) {
                // [TRATAMENTO DE ERRO] Estado vazio amigável
                listaDestaques.innerHTML = '<div class="col-12 text-center text-muted py-4">Nenhum destaque encontrado no momento.</div>';
            } else {
                for (const r of destaques) {
                    listaDestaques.innerHTML += await renderCardHTML(r);
                }
            }
            
            // Categorias (Estático + Dinâmico)
            const listaCat = document.getElementById('lista-de-categorias');
            if(listaCat) {
                const cats = await fetchCategorias();
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

        } catch (e) {
            console.error("Falha na Home:", e);
            listaDestaques.innerHTML = '<div class="text-danger text-center">Erro ao carregar destaques. Atualize a página.</div>';
        }
    }

    // 2. PÁGINA DE DETALHES (Robustez Crítica)
    if (detalheArea && idEvento) {
        try {
            // [TRATAMENTO DE ERRO] Busca dados
            const evt = await fetchRoleById(idEvento);

            // [TRATAMENTO DE ERRO] Redirecionamento se não existir
            if (!evt) {
                console.warn("Evento não encontrado, redirecionando para 404");
                window.location.href = '404.html';
                return;
            }

            // Sucesso: Remove loading e mostra conteúdo
            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('content-area').style.display = 'block';
            
            const cat = await fetchCategoriaById(evt.categoria_principal_id);
            
            // Preenchimento Seguro (usa "|| '-'" se faltar dado)
            document.getElementById('detalhe-categoria').textContent = cat ? cat.nome : 'Geral';
            document.getElementById('detalhe-titulo').textContent = evt.nome || 'Sem título';
            document.getElementById('detalhe-imagem').src = evt.imagem_principal || 'imgs/logoMapaDosRolezinhos.png';
            
            // Tratamento de erro para a imagem
            document.getElementById('detalhe-imagem').onerror = function() {
                this.src = 'imgs/logoMapaDosRolezinhos.png';
            };

            document.getElementById('detalhe-descricao').textContent = evt.descricao || '';
            document.getElementById('detalhe-conteudo').textContent = evt.conteudo || evt.descricao || 'Sem detalhes adicionais.';
            document.getElementById('detalhe-local').textContent = evt.local || 'A definir';
            document.getElementById('detalhe-horario').textContent = evt.horario || 'A definir';
            document.getElementById('detalhe-data').textContent = evt.data ? new Date(evt.data).toLocaleDateString('pt-BR') : 'Data a confirmar';
            document.getElementById('detalhe-ingressos').textContent = evt.ingressos || 'Sob consulta';
            document.getElementById('detalhe-atracoes').textContent = evt.atracoes_principais || 'Em breve';

            const btnFavDetail = document.getElementById('btn-fav-detail');
            if(btnFavDetail) btnFavDetail.onclick = (e) => toggleFavCard(e, evt.id);
            
            const btnEditar = document.getElementById('btn-editar');
            if(btnEditar) btnEditar.href = `editar.html?id=${evt.id}`;

            // Mapa (Leaflet)
            if (evt.lat && evt.lng) {
                const mapContainer = document.getElementById('map-detail');
                if (mapContainer && typeof L !== 'undefined') {
                    const map = L.map('map-detail').setView([evt.lat, evt.lng], 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
                        attribution: '&copy; OpenStreetMap contributors' 
                    }).addTo(map);
                    L.marker([evt.lat, evt.lng]).addTo(map).bindPopup(`<b>${evt.nome}</b>`).openPopup();
                }
            } else {
                // Se não tiver coordenadas, esconde o mapa ou mostra aviso
                const mapContainer = document.getElementById('map-detail');
                if(mapContainer) mapContainer.innerHTML = '<p class="text-muted small fst-italic p-3 text-center border border-secondary rounded">Mapa indisponível para este local.</p>';
            }

            setTimeout(atualizarIconesFavoritos, 1000);

        } catch (error) {
            // [TRATAMENTO DE ERRO] UI de erro na própria página (se rede cair)
            console.error("Erro crítico detalhes:", error);
            document.getElementById('loading-msg').innerHTML = `
                <div class="alert alert-danger bg-dark border-danger text-white w-75 mx-auto" role="alert">
                    <h4 class="alert-heading"><i class="bi bi-wifi-off"></i> Erro de Conexão</h4>
                    <p>Não conseguimos carregar os detalhes do rolê. Verifique sua internet.</p>
                    <button onclick="window.location.reload()" class="btn btn-outline-light btn-sm mt-2">Tentar Novamente</button>
                </div>
            `;
        }
    } else if (detalheArea && !idEvento) {
        // Se entrou em detalhes.html sem ID na URL
        window.location.href = 'index.html';
    }

    // 3. PÁGINA "TODOS" OU BUSCA
    if (listaTodos || (listaDestaques && termoBusca)) {
        const containerAlvo = listaTodos || document.getElementById('lista-resultados-busca');
        if(containerAlvo) {
            try {
                containerAlvo.innerHTML = renderSkeletonCards(3);
                const roles = await fetchRoles(termoBusca);
                
                containerAlvo.innerHTML = '';
                if (roles.length > 0) {
                    for (const r of roles) {
                        containerAlvo.innerHTML += await renderCardHTML(r);
                    }
                } else {
                    containerAlvo.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <i class="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                            <h4 class="text-white">Nenhum rolê encontrado.</h4>
                            <p class="text-muted">Tente buscar por outro termo.</p>
                        </div>`;
                }
                setTimeout(atualizarIconesFavoritos, 1000);
            } catch (e) {
                containerAlvo.innerHTML = '<p class="text-danger text-center">Erro ao buscar eventos.</p>';
            }
        }
    }

    // 4. CADASTRO / EDIÇÃO
    const fCad = document.getElementById('form-cadastro') || document.getElementById('form-edicao');
    if(fCad) {
        // Preencher categorias
        const s = document.getElementById('categoria_principal_id');
        if(s) {
            try {
                const cats = await fetchCategorias();
                s.innerHTML = '';
                cats.forEach(c => s.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
            } catch(e) {
                s.innerHTML = '<option>Erro ao carregar categorias</option>';
            }
        }

        fCad.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!currentUser) {
                Swal.fire('Atenção', 'Faça login para realizar esta ação!', 'warning');
                return;
            }

            const btnSubmit = fCad.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

            try {
                const idInput = document.getElementById('id'); // Existe na edição
                const isEdit = idInput && idInput.value;
                const idRole = isEdit ? idInput.value : Date.now().toString();

                const payload = {
                    nome: document.getElementById('nome').value,
                    imagem_principal: 'imgs/logoMapaDosRolezinhos.png', // Mock upload
                    descricao: document.getElementById('descricao').value,
                    conteudo: document.getElementById('conteudo').value,
                    local: document.getElementById('local').value,
                    horario: document.getElementById('horario').value,
                    atracoes_principais: document.getElementById('atracoes_principais').value,
                    ingressos: document.getElementById('ingressos').value,
                    categoria_principal_id: parseInt(s.value),
                    destaque: document.getElementById('destaque').checked,
                };

                if(!isEdit) payload.criado_por = currentUser.email;

                // Usa setDoc com merge para servir tanto pra criar quanto editar
                await setDoc(doc(db, "eventos", idRole), payload, { merge: true });

                Swal.fire({ 
                    title: 'Sucesso!', 
                    text: 'Rolê salvo na Nuvem!', 
                    icon: 'success', 
                    background: '#1e1e1e', color: '#fff' 
                }).then(() => window.location.href = 'index.html');

            } catch (error) {
                console.error("Erro ao salvar:", error);
                Swal.fire({ title: 'Erro', text: 'Falha ao salvar dados.', icon: 'error', background: '#1e1e1e', color: '#fff' });
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalText;
            }
        });
    }
});