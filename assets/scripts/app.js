// --- CONFIGURAÇÃO DO "BANCO DE DADOS" LOCAL ---
const DB_NAME = 'rolezinhos_db_v1';
const CAMINHO_JSON_INICIAL = 'db/db.json';

// Função que simula o Backend (Carrega dados iniciais ou lê do LocalStorage)
async function getDatabase() {
    const dadosSalvos = localStorage.getItem(DB_NAME);
    
    // Se já tem dados salvos no navegador, usa eles
    if (dadosSalvos) {
        return JSON.parse(dadosSalvos);
    } 
    
    // Se é a primeira vez, busca do arquivo JSON original
    try {
        const response = await fetch(CAMINHO_JSON_INICIAL);
        const dadosIniciais = await response.json();
        // Salva no navegador para as próximas vezes
        localStorage.setItem(DB_NAME, JSON.stringify(dadosIniciais));
        return dadosIniciais;
    } catch (error) {
        console.error("Erro ao carregar banco de dados inicial:", error);
        return { roles: [], categorias_principais: [] }; // Fallback seguro
    }
}

// Função para Salvar alterações (Simula o PUT/POST)
function saveDatabase(dados) {
    localStorage.setItem(DB_NAME, JSON.stringify(dados));
}

// --- FUNÇÕES DE API (SIMULADAS) ---

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
    const roles = db.roles || [];
    // Filtra quem tem o ID na categoria principal
    return roles.filter(r => r.categoria_principal_id == id);
}

async function fetchRoleById(id) {
    const db = await getDatabase();
    return db.roles.find(r => r.id == id) || null;
}

// --- LÓGICA PRINCIPAL (O resto continua quase igual) ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // Elementos Globais
    const spinner = document.getElementById('loading-spinner');
    const conteudoPrincipal = document.getElementById('conteudo-principal');
    const params = new URLSearchParams(window.location.search);
    const idEvento = parseInt(params.get('id')); // Pode ser string ou number no JSON
    const idCategoria = parseInt(params.get('id')); 
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
    const carrossel = document.getElementById('carousel-inner');
    if (carrossel) {
        if (termoBusca) {
            // MODO BUSCA
            const res = await fetchRoles(termoBusca);
            if(document.getElementById('itens-em-destaque')) document.getElementById('itens-em-destaque').style.display = 'none';
            if(document.getElementById('navegue-por-categorias')) document.getElementById('navegue-por-categorias').style.display = 'none';
            
            const secaoBusca = document.getElementById('secao-busca');
            if(secaoBusca) secaoBusca.style.display = 'block';
            
            const lista = document.getElementById('lista-resultados-busca');
            if(lista) {
                lista.innerHTML = '';
                if (res.length > 0) {
                    res.forEach(r => {
                        lista.innerHTML += `
                            <div class="col"><div class="card h-100 shadow-sm">
                                <img src="${r.imagem_principal}" class="card-img-top" style="height:200px; object-fit:cover;">
                                <div class="card-body">
                                    <h5 class="card-title">${r.nome}</h5>
                                    <a href="detalhes.html?id=${r.id}" class="btn btn-primary w-100">Ver</a>
                                </div>
                            </div></div>`;
                    });
                } else {
                    lista.innerHTML = '<div class="col-12"><p class="text-muted text-center">Nenhum rolê encontrado.</p></div>';
                }
            }
        } else {
            // MODO NORMAL
            const roles = await fetchRoles();
            const destaques = roles.filter(r => r.destaque);
            
            // Preenche Carrossel
            destaques.forEach((r, i) => {
                carrossel.innerHTML += `
                    <div class="carousel-item ${i===0?'active':''}">
                        <a href="detalhes.html?id=${r.id}">
                            <img src="${r.imagem_principal}" class="d-block w-100 rounded" style="height:400px; object-fit:cover;">
                        </a>
                        <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-75 rounded p-3">
                            <h5 class="fw-bold">${r.nome}</h5>
                            <p>${r.descricao}</p>
                        </div>
                    </div>`;
                document.getElementById('carousel-indicators').innerHTML += `<button type="button" data-bs-target="#meuCarrossel" data-bs-slide-to="${i}" class="${i===0?'active':''}"></button>`;
            });

            // Preenche Categorias
            const cats = await fetchCategorias();
            const listaCat = document.getElementById('lista-de-categorias');
            cats.forEach(c => {
                listaCat.innerHTML += `
                    <div class="col"><div class="card h-100 shadow-sm border-0 hover-effect">
                        <a href="categoria.html?id=${c.id}" class="text-decoration-none text-dark">
                            <div class="card-body text-center py-5">
                                <h5 class="card-title fw-bold text-primary">${c.nome}</h5>
                                <p class="text-muted small">${c.descricao}</p>
                            </div>
                        </a>
                    </div></div>`;
            });
        }
    }

    // --- DETALHES.HTML ---
    const containerDetalhes = document.getElementById('detalhe-do-evento');
    if (containerDetalhes && idEvento) {
        const evt = await fetchRoleById(idEvento);
        if (evt) {
            document.getElementById('detalhe-titulo').textContent = evt.nome;
            document.getElementById('detalhe-imagem').src = evt.imagem_principal;
            document.getElementById('detalhe-descricao').textContent = evt.descricao;
            document.getElementById('detalhe-conteudo').textContent = evt.conteudo;
            document.getElementById('detalhe-local').textContent = evt.local;
            document.getElementById('detalhe-horario').textContent = evt.horario;
            document.getElementById('detalhe-atracoes').textContent = evt.atracoes_principais;
            document.getElementById('detalhe-ingressos').textContent = evt.ingressos;
            
            if(evt.categoria_principal_id) {
                const cat = await fetchCategoriaById(evt.categoria_principal_id);
                document.getElementById('detalhe-tipo').textContent = cat ? cat.nome : "Geral";
            }
            
            // Botão Excluir (Agora funciona de verdade no LocalStorage)
            const btnExcluir = document.getElementById('btn-excluir');
            if(btnExcluir) {
                btnExcluir.addEventListener('click', () => {
                    Swal.fire({
                        title: 'Tem certeza?', text: "Isso apagará o rolê do seu navegador.", icon: 'warning',
                        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir!'
                    }).then(async(r)=>{
                        if(r.isConfirmed) {
                            // Lógica de Exclusão Local
                            const db = await getDatabase();
                            db.roles = db.roles.filter(role => role.id != idEvento); // Remove o item
                            saveDatabase(db); // Salva
                            
                            Swal.fire('Excluído!','Rolê removido com sucesso.','success')
                                .then(()=>window.location.href='index.html');
                        }
                    });
                });
            }

            const btnEditar = document.getElementById('btn-editar');
            if(btnEditar) btnEditar.href = `editar.html?id=${evt.id}`;
            
            // Galeria
            const galeria = document.getElementById('galeria-fotos');
            if(galeria && evt.fotos_extras && evt.fotos_extras.length > 0) {
                evt.fotos_extras.forEach(f => {
                    galeria.innerHTML += `<div class="col"><div class="card"><img src="${f.imagem}" class="card-img-top" style="height:180px; object-fit:cover;"></div></div>`;
                });
            } else { 
                if(document.getElementById('fotos-vinculadas')) document.getElementById('fotos-vinculadas').style.display='none'; 
            }
        }
    }

    // --- CADASTRO.HTML ---
    const fCad = document.getElementById('form-cadastro');
    if (fCad) {
        const s = document.getElementById('categoria_principal_id');
        const cats = await fetchCategorias();
        s.innerHTML = '<option value="">Selecione...</option>';
        cats.forEach(c => s.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        fCad.addEventListener('submit', async(e)=>{
            e.preventDefault();
            // Monta o objeto
            const novoId = Date.now(); // Gera um ID único baseado no tempo
            const novoRole = {
                id: novoId,
                nome: document.getElementById('nome').value,
                imagem_principal: document.getElementById('imagem_principal').value,
                descricao: document.getElementById('descricao').value,
                conteudo: document.getElementById('conteudo').value,
                local: document.getElementById('local').value,
                horario: document.getElementById('horario').value,
                atracoes_principais: document.getElementById('atracoes_principais').value,
                ingressos: document.getElementById('ingressos').value,
                categoria_principal_id: parseInt(s.value),
                destaque: document.getElementById('destaque').checked,
                subcategoria_ids: [], fotos_extras: []
            };

            // Salva no LocalStorage
            const db = await getDatabase();
            if(!db.roles) db.roles = [];
            db.roles.push(novoRole); // Adiciona
            saveDatabase(db); // Salva

            Swal.fire('Sucesso!','Rolê cadastrado e salvo no navegador!','success')
                .then(()=>window.location.href='index.html');
        });
    }

    // --- EDITAR.HTML ---
    const fEdit = document.getElementById('form-edicao');
    if (fEdit && idEvento) {
        const s = document.getElementById('categoria_principal_id');
        const cats = await fetchCategorias();
        s.innerHTML = '<option value="">Selecione...</option>';
        cats.forEach(c => s.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        const eventoOriginal = await fetchRoleById(idEvento);
        
        if(eventoOriginal) {
            // Preenche formulário
            document.getElementById('id').value = eventoOriginal.id;
            document.getElementById('nome').value = eventoOriginal.nome;
            document.getElementById('imagem_principal').value = eventoOriginal.imagem_principal;
            document.getElementById('descricao').value = eventoOriginal.descricao;
            document.getElementById('conteudo').value = eventoOriginal.conteudo;
            document.getElementById('local').value = eventoOriginal.local;
            document.getElementById('horario').value = eventoOriginal.horario;
            document.getElementById('atracoes_principais').value = eventoOriginal.atracoes_principais;
            document.getElementById('ingressos').value = eventoOriginal.ingressos;
            document.getElementById('categoria_principal_id').value = eventoOriginal.categoria_principal_id;
            document.getElementById('destaque').checked = eventoOriginal.destaque;

            fEdit.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const db = await getDatabase();
                // Encontra o índice do item a ser editado
                const index = db.roles.findIndex(r => r.id == idEvento);
                
                if(index !== -1) {
                    // Atualiza os campos mantendo o ID e fotos extras
                    db.roles[index] = {
                        ...db.roles[index],
                        nome: document.getElementById('nome').value,
                        imagem_principal: document.getElementById('imagem_principal').value,
                        descricao: document.getElementById('descricao').value,
                        conteudo: document.getElementById('conteudo').value,
                        local: document.getElementById('local').value,
                        horario: document.getElementById('horario').value,
                        atracoes_principais: document.getElementById('atracoes_principais').value,
                        ingressos: document.getElementById('ingressos').value,
                        categoria_principal_id: parseInt(document.getElementById('categoria_principal_id').value),
                        destaque: document.getElementById('destaque').checked
                    };
                    
                    saveDatabase(db); // Persiste a edição
                    
                    Swal.fire('Atualizado!', 'Dados salvos no navegador.', 'success')
                        .then(() => window.location.href = `detalhes.html?id=${idEvento}`);
                }
            });
        }
    }
    
    // --- CATEGORIA.HTML ---
    if (document.getElementById('lista-roles-por-categoria') && idCategoria) {
         const c = await fetchCategoriaById(idCategoria);
         if(c) {
             document.getElementById('categoria-titulo').textContent = c.nome;
             document.getElementById('categoria-descricao').textContent = c.descricao;
         }
         const roles = await fetchRolesByCategoriaId(idCategoria);
         const lista = document.getElementById('lista-roles-por-categoria');
         if(roles.length > 0) {
             roles.forEach(r => {
                 lista.innerHTML += `
                    <div class="col"><div class="card h-100 shadow-sm hover-effect"><a href="detalhes.html?id=${r.id}" class="text-decoration-none text-dark">
                        <img src="${r.imagem_principal}" class="card-img-top" style="height:180px; object-fit:cover;">
                        <div class="card-body"><h5 class="card-title fw-bold">${r.nome}</h5>
                        <p class="small text-muted">${r.descricao}</p></div>
                    </a></div></div>`;
             });
         } else {
             lista.innerHTML = '<div class="alert alert-warning w-100">Nenhum rolê encontrado nesta categoria.</div>';
         }
    }

    // FINALIZAÇÃO (Remove Spinner)
    if(spinner) spinner.style.display = 'none';
    if(conteudoPrincipal) conteudoPrincipal.style.display = 'block';
});