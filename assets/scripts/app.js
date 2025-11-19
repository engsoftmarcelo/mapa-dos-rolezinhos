// --- CONFIGURAÇÃO DO "BANCO DE DADOS" LOCAL ---
const DB_NAME = 'rolezinhos_db_v3_static';
const CAMINHO_JSON_INICIAL = 'db/db.json';
const FAVORITOS_KEY = 'rolezinhos_favoritos';

// --- DADOS PADRÃO (FALLBACK ESTÁTICO) ---
// Estes dados serão usados caso o fetch do arquivo db.json falhe ou na primeira carga
const DADOS_PADRAO = {
  "usuarios": [
    { "id": "admin", "login": "admin", "senha": "123", "nome": "Admin" }
  ],
  "categorias_principais": [
    { "id": 1, "nome": "Festas e Vida Noturna", "descricao": "Baladas, shows e bares." },
    { "id": 2, "nome": "Cultura e Arte", "descricao": "Museus, teatro e exposições." },
    { "id": 3, "nome": "Ao Ar Livre", "descricao": "Parques e atividades diurnas." },
    { "id": 4, "nome": "Gastronomia", "descricao": "Comida e bebida." },
    { "id": 5, "nome": "Jogos e Geek", "descricao": "Board games e e-sports." }
  ],
  "roles": [
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
      "lat": -19.9191,
      "lng": -43.9386,
      "destaque": true,
      "categoria_principal_id": 1,
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
      "lat": -19.9246,
      "lng": -43.9363,
      "destaque": true,
      "categoria_principal_id": 3,
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
      "zona": "savassi",
      "preco": 60,
      "ingressos": "R$ 60",
      "lat": -19.9724,
      "lng": -43.9638,
      "destaque": true,
      "categoria_principal_id": 1,
      "conteudo": "Muita luz negra, tintas neon e o melhor da cena eletrônica de BH."
    },
    {
      "id": 4,
      "nome": "Noite de Jogos",
      "imagem_principal": "imgs/jogos_foto2.jpg",
      "descricao": "Board games e hambúrguer.",
      "local": "Funtasy, Savassi",
      "horario": "Domingo, 18h",
      "data": "2023-11-26",
      "zona": "savassi",
      "preco": 20,
      "ingressos": "R$ 20",
      "lat": -19.9393,
      "lng": -43.9334,
      "destaque": false,
      "categoria_principal_id": 5,
      "conteudo": "Venha desafiar seus amigos nos melhores board games modernos enquanto come aquele burger."
    },
    {
      "id": 5,
      "nome": "Volta na Pampulha",
      "imagem_principal": "imgs/Hype3.jpg",
      "descricao": "Pedal matinal na lagoa.",
      "local": "Igrejinha da Pampulha",
      "horario": "Domingo, 08h",
      "data": "2023-11-26",
      "zona": "pampulha",
      "preco": 0,
      "ingressos": "Gratuito",
      "lat": -19.8586,
      "lng": -43.9783,
      "destaque": false,
      "categoria_principal_id": 3,
      "conteudo": "Energia lá em cima para começar o domingo. Ponto de encontro na Igrejinha."
    }
  ]
};

// --- FUNÇÃO AUXILIAR: CONVERTER PARA BASE64 ---
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// --- GERENCIAMENTO DE FAVORITOS ---
function getFavorites() {
    const favs = localStorage.getItem(FAVORITOS_KEY);
    return favs ? JSON.parse(favs) : [];
}

function saveFavorites(favs) {
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favs));
}

function isFavorite(id) {
    const favs = getFavorites();
    return favs.some(favId => favId.toString() === id.toString());
}

function toggleFavoriteLogic(id) {
    let favs = getFavorites();
    const strId = id.toString();
    const exists = favs.includes(strId);

    if (exists) {
        favs = favs.filter(favId => favId !== strId);
    } else {
        favs.push(strId);
    }
    
    saveFavorites(favs);
    return !exists;
}

// --- FUNÇÕES DE API (ADAPTADAS PARA MODO ESTÁTICO) ---
async function getDatabase() {
    const dadosSalvos = localStorage.getItem(DB_NAME);
    
    // 1. Se já existem dados editados pelo usuário no navegador, usa eles
    if (dadosSalvos) {
        return JSON.parse(dadosSalvos);
    } 

    // 2. Se não, tenta buscar o arquivo original ou usa o fallback
    try {
        const response = await fetch(CAMINHO_JSON_INICIAL);
        if (!response.ok) throw new Error("Arquivo db.json não acessível");
        
        const dadosIniciais = await response.json();
        localStorage.setItem(DB_NAME, JSON.stringify(dadosIniciais));
        return dadosIniciais;
    } catch (error) {
        console.warn("Usando banco de dados estático (fallback):", error);
        // Inicializa o localStorage com os dados padrão do código
        localStorage.setItem(DB_NAME, JSON.stringify(DADOS_PADRAO));
        return DADOS_PADRAO;
    }
}

function saveDatabase(dados) {
    // Em site estático, salvamos apenas no LocalStorage do navegador
    localStorage.setItem(DB_NAME, JSON.stringify(dados));
}

async function fetchCategorias() {
    const db = await getDatabase();
    return db.categorias_principais || [];
}

async function fetchCategoriaById(id) {
    const db = await getDatabase();
    return db.categorias_principais.find(c => c.id == id) || null;
}

async function fetchRoles(termoBusca = null) {
    const db = await getDatabase();
    let roles = db.roles || [];
    if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        roles = roles.filter(r => 
            r.nome.toLowerCase().includes(termo) || 
            r.descricao.toLowerCase().includes(termo)
        );
    }
    return roles;
}

async function fetchRolesByCategoriaId(id) {
    const db = await getDatabase();
    return (db.roles || []).filter(r => r.categoria_principal_id == id);
}

async function fetchRoleById(id) {
    const db = await getDatabase();
    return db.roles.find(r => r.id == id) || null;
}

// --- EXPORTAR FUNÇÃO PARA O ESCOPO GLOBAL ---
window.toggleFavCard = function(event, id) {
    event.preventDefault();
    event.stopPropagation();

    const novoEstado = toggleFavoriteLogic(id);
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    
    if (novoEstado) {
        icon.classList.remove('bi-heart', 'text-white');
        icon.classList.add('bi-heart-fill', 'text-danger');
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: 'Adicionado aos favoritos!', showConfirmButton: false, timer: 1500,
            background: '#1e1e1e', color: '#fff'
        });
    } else {
        icon.classList.remove('bi-heart-fill', 'text-danger');
        icon.classList.add('bi-heart', 'text-white');
    }
};

// --- HELPER: Gerador de Skeleton Loading (Bootstrap Placeholders) ---
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
                    <div class="date-box bg-secondary bg-opacity-25 placeholder-glow border-0">
                        <span class="placeholder w-100 h-100 rounded"></span>
                    </div>
                    <div class="card-info w-100 ps-3">
                        <h5 class="card-title placeholder-glow">
                            <span class="placeholder col-7 bg-light opacity-50"></span>
                        </h5>
                        <p class="card-desc placeholder-glow">
                            <span class="placeholder col-12 bg-secondary opacity-50"></span>
                            <span class="placeholder col-8 bg-secondary opacity-50"></span>
                        </p>
                    </div>
                </div>
            </div>
        </div>`;
    }
    return html;
}

// --- HELPER: Gerador de HTML do Card Moderno ---
async function renderCardHTML(role) {
    let dia = "HOJE";
    let hora = "19h";
    
    if(role.horario) {
        const partes = role.horario.split(',');
        if(partes.length > 0) dia = partes[0].split(' ')[0].substring(0, 3).toUpperCase();
        if(partes.length > 1) hora = partes[1].trim();
        else hora = role.horario.split(' ')[0];
    }

    let nomeCategoria = "Geral";
    const cat = await fetchCategoriaById(role.categoria_principal_id);
    if(cat) nomeCategoria = cat.nome.split(' ')[0];

    let badgePreco = "";
    if(role.ingressos && role.ingressos.toLowerCase().includes('gratuit')) {
        badgePreco = `<span class="badge-custom" style="background:var(--neon-accent); color:#000;">FREE</span>`;
    }

    const favoritado = isFavorite(role.id);
    const classeIcone = favoritado ? 'bi-heart-fill text-danger' : 'bi-heart text-white';

    return `
    <div class="col">
        <div class="card-role position-relative">
            <button class="btn-fav-card" onclick="toggleFavCard(event, ${role.id})" title="Favoritar">
                <i class="bi ${classeIcone}"></i>
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

// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idEvento = params.get('id') ? parseInt(params.get('id')) : null;
    const idCategoria = params.get('id') ? parseInt(params.get('id')) : null; 
    const termoBusca = params.get('busca');

    // --- BUSCA GLOBAL ---
    const formBusca = document.getElementById('form-busca');
    if (formBusca) {
        formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = formBusca.querySelector('input').value;
            if(val) window.location.href = `index.html?busca=${encodeURIComponent(val)}`;
        });
    }

    // --- INDEX.HTML ---
    const listaDestaques = document.getElementById('lista-destaques');
    if (listaDestaques) {
        if (termoBusca) {
            document.querySelector('.hero-section').style.display = 'none'; 
            document.getElementById('itens-em-destaque').style.display = 'none';
            document.getElementById('navegue-por-categorias').style.display = 'none';
            const secaoBusca = document.getElementById('secao-busca');
            secaoBusca.style.display = 'block';
            const listaResultados = document.getElementById('lista-resultados-busca');
            
            listaResultados.innerHTML = renderSkeletonCards(3);

            const res = await fetchRoles(termoBusca);
            
            listaResultados.innerHTML = ''; 

            if (res.length > 0) {
                for (const r of res) {
                    listaResultados.innerHTML += await renderCardHTML(r);
                }
            } else {
                listaResultados.innerHTML = '<div class="col-12 text-center text-muted py-5"><h4>Nenhum rolê encontrado :(</h4></div>';
            }
        } else {
            listaDestaques.innerHTML = renderSkeletonCards(3);

            const roles = await fetchRoles();
            const destaques = roles.filter(r => r.destaque).slice(0, 6);
            
            listaDestaques.innerHTML = '';
            for (const r of destaques) {
                listaDestaques.innerHTML += await renderCardHTML(r);
            }

            const cats = await fetchCategorias();
            const listaCat = document.getElementById('lista-de-categorias');
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
    }

    // --- CATEGORIA.HTML ---
    const listaCategoria = document.getElementById('lista-roles-por-categoria');
    if (listaCategoria) {
         if (!idCategoria) {
             window.location.href = 'index.html';
             return;
         }

         const c = await fetchCategoriaById(idCategoria);
         
         if(c) {
             const elTitulo = document.getElementById('categoria-titulo');
             if(elTitulo) elTitulo.textContent = c.nome;
             
             const elDesc = document.getElementById('categoria-descricao');
             if(elDesc) elDesc.textContent = c.descricao;
             
             listaCategoria.innerHTML = renderSkeletonCards(3);

             const roles = await fetchRolesByCategoriaId(idCategoria);
             
             listaCategoria.innerHTML = '';

             if(roles.length > 0) {
                 for (const r of roles) {
                     listaCategoria.innerHTML += await renderCardHTML(r);
                 }
             } else {
                 listaCategoria.innerHTML = '<div class="col-12 text-muted">Nenhum evento nesta categoria ainda.</div>';
             }
         } else {
             Swal.fire({
                 icon: 'error',
                 title: 'Categoria não encontrada',
                 text: 'Redirecionando...',
                 timer: 2000,
                 showConfirmButton: false,
                 background: '#1e1e1e', color: '#fff'
             }).then(() => {
                 window.location.href = 'index.html';
             });
         }
    }

    // --- DETALHES.HTML ---
    if (document.getElementById('detalhe-do-evento')) {
        if (!idEvento) {
            window.location.href = 'index.html';
            return;
        }

        const evt = await fetchRoleById(idEvento);
        const loadingMsg = document.getElementById('loading-msg');
        const contentArea = document.getElementById('content-area');
        
        if(loadingMsg) loadingMsg.style.display = 'none';

        if (evt) {
            if(contentArea) contentArea.style.display = 'block';

            const cat = await fetchCategoriaById(evt.categoria_principal_id);
            document.getElementById('detalhe-categoria').textContent = cat ? cat.nome : 'Geral';
            document.getElementById('detalhe-titulo').textContent = evt.nome;
            document.getElementById('detalhe-imagem').src = evt.imagem_principal;
            document.getElementById('detalhe-descricao').textContent = evt.descricao;
            document.getElementById('detalhe-conteudo').textContent = evt.conteudo || evt.descricao;
            document.getElementById('detalhe-local').textContent = evt.local;
            const dataFormatada = evt.data ? new Date(evt.data).toLocaleDateString('pt-BR') : '';
            document.getElementById('detalhe-data').textContent = dataFormatada;
            document.getElementById('detalhe-horario').textContent = evt.horario;
            document.getElementById('detalhe-atracoes').textContent = evt.atracoes_principais;
            document.getElementById('detalhe-ingressos').textContent = evt.ingressos;

            // Favoritos
            const btnFav = document.getElementById('btn-fav-detail');
            const iconFav = btnFav.querySelector('i');
            if (isFavorite(evt.id)) {
                iconFav.classList.replace('bi-heart', 'bi-heart-fill');
                btnFav.classList.remove('btn-outline-danger');
                btnFav.classList.add('btn-danger');
            }
            btnFav.addEventListener('click', () => {
                const agoraEhFavorito = toggleFavoriteLogic(evt.id);
                if (agoraEhFavorito) {
                    iconFav.classList.replace('bi-heart', 'bi-heart-fill');
                    btnFav.classList.remove('btn-outline-danger');
                    btnFav.classList.add('btn-danger');
                    Swal.fire({ title: 'Oba!', text: 'Evento salvo nos favoritos!', icon: 'success', background: '#1e1e1e', color: '#fff' });
                } else {
                    iconFav.classList.replace('bi-heart-fill', 'bi-heart');
                    btnFav.classList.remove('btn-danger');
                    btnFav.classList.add('btn-outline-danger');
                }
            });

            // Mapa
            if (evt.lat && evt.lng) {
                const mapContainer = document.getElementById('map-detail');
                if (mapContainer) {
                     if (typeof L !== 'undefined') {
                        const map = L.map('map-detail').setView([evt.lat, evt.lng], 15);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; OpenStreetMap contributors'
                        }).addTo(map);
                        L.marker([evt.lat, evt.lng]).addTo(map).bindPopup(`<b>${evt.nome}</b>`).openPopup();
                        setTimeout(() => { map.invalidateSize(); }, 100);
                     }
                }
            } else {
                 const mapContainer = document.getElementById('map-detail');
                 if(mapContainer) mapContainer.innerHTML = '<div class="alert alert-dark text-center m-0">Localização no mapa indisponível.</div>';
            }

            // Excluir e Editar
            const btnExcluir = document.getElementById('btn-excluir');
            if(btnExcluir) {
                btnExcluir.addEventListener('click', async () => {
                    const result = await Swal.fire({
                        title: 'Tem certeza?', text: "Ação irreversível (apenas no seu navegador)!",
                        icon: 'warning', background: '#1e1e1e', color: '#fff',
                        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6f42c1'
                    });
                    if (result.isConfirmed) {
                        const db = await getDatabase();
                        db.roles = db.roles.filter(r => r.id != idEvento);
                        saveDatabase(db);
                        window.location.href = 'index.html';
                    }
                });
            }
            const btnEditar = document.getElementById('btn-editar');
            if(btnEditar) btnEditar.href = `editar.html?id=${evt.id}`;

            // Galeria
             const galeria = document.getElementById('galeria-fotos');
            if(galeria && evt.fotos_extras) {
                evt.fotos_extras.forEach(f => {
                    galeria.innerHTML += `<div class="col"><div class="card bg-dark border-0"><img src="${f.imagem}" class="card-img-top rounded" style="height:180px; object-fit:cover;"></div></div>`;
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Ops!',
                text: 'Este rolê não foi encontrado ou foi excluído.',
                background: '#1e1e1e', color: '#fff',
                confirmButtonColor: '#6f42c1'
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    }
    
    // --- CADASTRO ---
    const fCad = document.getElementById('form-cadastro');
    if(fCad) { 
        const s = document.getElementById('categoria_principal_id');
        const cats = await fetchCategorias();
        s.innerHTML = '<option value="">Selecione...</option>';
        cats.forEach(c => s.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
        
        fCad.addEventListener('submit', async(e)=>{
            e.preventDefault();

            let imagemFinal = 'imgs/logoMapaDosRolezinhos.png';
            const fileInput = document.getElementById('imagem_upload');
            
            if (fileInput && fileInput.files.length > 0) {
                try {
                    imagemFinal = await convertToBase64(fileInput.files[0]);
                } catch(err) {
                    console.error("Erro conversão imagem", err);
                }
            }

            const novoRole = {
                id: Date.now(),
                nome: document.getElementById('nome').value,
                imagem_principal: imagemFinal,
                descricao: document.getElementById('descricao').value,
                conteudo: document.getElementById('conteudo').value,
                local: document.getElementById('local').value,
                horario: document.getElementById('horario').value,
                atracoes_principais: document.getElementById('atracoes_principais').value,
                ingressos: document.getElementById('ingressos').value,
                categoria_principal_id: parseInt(s.value),
                destaque: document.getElementById('destaque').checked,
                fotos_extras: []
            };
            const db = await getDatabase();
            if(!db.roles) db.roles = [];
            db.roles.push(novoRole);
            saveDatabase(db);
            await Swal.fire({ title: 'Sucesso!', text: 'Rolê cadastrado (Local)!', icon: 'success', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#6f42c1' });
            window.location.href = 'index.html';
        });
    }

    // --- EDIÇÃO ---
    const fEdit = document.getElementById('form-edicao');
    if(fEdit) {
        if (!idEvento) {
            window.location.href = 'index.html';
            return;
        }

        const s = document.getElementById('categoria_principal_id');
        const cats = await fetchCategorias();
        s.innerHTML = '';
        cats.forEach(c => s.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
        
        const evt = await fetchRoleById(idEvento);
        
        if(evt) {
            document.getElementById('id').value = evt.id;
            document.getElementById('nome').value = evt.nome;
            
            document.getElementById('imagem_principal').value = evt.imagem_principal;
            const imgPrev = document.getElementById('preview-imagem');
            if(imgPrev) imgPrev.src = evt.imagem_principal;

            const fileInputEdit = document.getElementById('imagem_upload');
            if(fileInputEdit) {
                fileInputEdit.addEventListener('change', async (ev) => {
                    if(ev.target.files && ev.target.files[0]) {
                        const base64 = await convertToBase64(ev.target.files[0]);
                        imgPrev.src = base64;
                    }
                });
            }

            document.getElementById('descricao').value = evt.descricao;
            document.getElementById('conteudo').value = evt.conteudo || "";
            document.getElementById('local').value = evt.local;
            document.getElementById('horario').value = evt.horario;
            if(document.getElementById('data') && evt.data) document.getElementById('data').value = evt.data;
            if(document.getElementById('zona') && evt.zona) document.getElementById('zona').value = evt.zona;
            if(document.getElementById('lat') && evt.lat) document.getElementById('lat').value = evt.lat;
            if(document.getElementById('lng') && evt.lng) document.getElementById('lng').value = evt.lng;
            document.getElementById('atracoes_principais').value = evt.atracoes_principais;
            document.getElementById('ingressos').value = evt.ingressos;
            document.getElementById('categoria_principal_id').value = evt.categoria_principal_id;
            if(evt.destaque) document.getElementById('destaque').checked = true;

            fEdit.addEventListener('submit', async (e) => {
                e.preventDefault();
                const db = await getDatabase();
                const idx = db.roles.findIndex(r => r.id == idEvento);
                
                if(idx !== -1) {
                    let finalImg = document.getElementById('imagem_principal').value;
                    if(fileInputEdit && fileInputEdit.files.length > 0) {
                        finalImg = await convertToBase64(fileInputEdit.files[0]);
                    }

                    const roleAtualizado = {
                        ...db.roles[idx],
                        nome: document.getElementById('nome').value,
                        imagem_principal: finalImg,
                        descricao: document.getElementById('descricao').value,
                        conteudo: document.getElementById('conteudo').value,
                        local: document.getElementById('local').value,
                        horario: document.getElementById('horario').value,
                        atracoes_principais: document.getElementById('atracoes_principais').value,
                        ingressos: document.getElementById('ingressos').value,
                        categoria_principal_id: parseInt(document.getElementById('categoria_principal_id').value),
                        destaque: document.getElementById('destaque').checked
                    };
                    if(document.getElementById('data')) roleAtualizado.data = document.getElementById('data').value;
                    if(document.getElementById('zona')) roleAtualizado.zona = document.getElementById('zona').value;
                    
                    const latInput = document.getElementById('lat');
                    if(latInput && latInput.value) roleAtualizado.lat = parseFloat(latInput.value);
                    const lngInput = document.getElementById('lng');
                    if(lngInput && lngInput.value) roleAtualizado.lng = parseFloat(lngInput.value);

                    db.roles[idx] = roleAtualizado;
                    saveDatabase(db);
                    await Swal.fire({ title: 'Atualizado!', text: 'Salvo com sucesso (Local).', icon: 'success', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#6f42c1' });
                    window.location.href = `detalhes.html?id=${idEvento}`;
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível carregar os dados para edição.',
                background: '#1e1e1e', color: '#fff'
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    }
});