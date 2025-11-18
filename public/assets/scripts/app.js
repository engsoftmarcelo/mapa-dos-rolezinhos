// URL base da sua API
const API_BASE_URL = 'http://localhost:3000';

// --- FUNÇÕES DE API ---

// Função para buscar todas as categorias principais
async function fetchCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias_principais`);
        if (!response.ok) throw new Error('Erro ao carregar categorias.');
        return await response.json();
    } catch (error) {
        console.error('Erro fetchCategorias:', error);
        return [];
    }
}

// Função para buscar UMA categoria principal por ID
async function fetchCategoriaById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias_principais/${id}`);
        if (!response.ok) throw new Error('Categoria não encontrada.');
        return await response.json();
    } catch (error) {
        console.error('Erro fetchCategoriaById:', error);
        return null;
    }
}

// Função para buscar todos os rolês (Read - List)
async function fetchRoles() {
    try {
        const response = await fetch(`${API_BASE_URL}/roles`);
        if (!response.ok) throw new Error('Erro ao carregar rolês.');
        return await response.json();
    } catch (error) {
        console.error('Erro fetchRoles:', error);
        return [];
    }
}

// Função para buscar Rolês de UMA categoria específica
// O json-server permite filtrar usando ?campo_id=valor
async function fetchRolesByCategoriaId(categoriaId) {
     try {
        const response = await fetch(`${API_BASE_URL}/roles?categoria_principal_id=${categoriaId}`);
        if (!response.ok) throw new Error('Erro ao carregar rolês da categoria.');
        return await response.json();
    } catch (error) {
        console.error('Erro fetchRolesByCategoriaId:', error);
        return [];
    }
}


// Função para buscar um rolê específico por ID (Read - Detail)
async function fetchRoleById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/roles/${id}`);
        if (!response.ok) throw new Error('Rolê não encontrado.');
        return await response.json();
    } catch (error) {
        console.error('Erro fetchRoleById:', error);
        return null;
    }
}

// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);
    const idEvento = parseInt(params.get('id'));
    const idCategoria = parseInt(params.get('id')); // Usado na nova página

    // --- LÓGICA PARA A PÁGINA INDEX.HTML ---
    const carrosselContainer = document.getElementById('carousel-inner');
    const carrosselIndicators = document.getElementById('carousel-indicators');
    const listaCategoriasContainer = document.getElementById('lista-de-categorias'); // Container NOVO

    if (carrosselContainer && listaCategoriasContainer) {
        const roles = await fetchRoles(); 

        // 1. Montar o Carrossel de Destaques
        const rolesDestaque = roles.filter(role => role.destaque === true);
        rolesDestaque.forEach((role, index) => {
            const activeClass = index === 0 ? 'active' : '';
            
            carrosselContainer.innerHTML += `
                <div class="carousel-item ${activeClass}">
                    <a href="detalhes.html?id=${role.id}">
                        <img src="${role.imagem_principal}" class="d-block w-100" alt="${role.nome}" style="height: 400px; object-fit: cover;">
                    </a>
                    <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded">
                        <h5>${role.nome}</h5>
                        <p>${role.descricao}</p>
                    </div>
                </div>
            `;
            
            carrosselIndicators.innerHTML += `
                <button type="button" data-bs-target="#meuCarrossel" data-bs-slide-to="${index}" class="${activeClass}" aria-current="true" aria-label="Slide ${index + 1}"></button>
            `;
        });

        // 2. Montar a lista de CATEGORIAS (NOVA LÓGICA)
        const categorias = await fetchCategorias();
        categorias.forEach(cat => {
            listaCategoriasContainer.innerHTML += `
                <div class="col">
                    <article class="card h-100 shadow-sm">
                        <a href="categoria.html?id=${cat.id}" class="text-decoration-none text-dark">
                            <div class="card-body text-center d-flex flex-column justify-content-center" style="min-height: 150px;">
                                <h5 class="card-title fw-bold">${cat.nome}</h5>
                                <p class="card-text small">${cat.descricao}</p>
                            </div>
                        </a>
                    </article>
                </div>
            `;
        });
    }


    // --- LÓGICA PARA A PÁGINA CATEGORIA.HTML (NOVO) ---
    const listaRolesCategoriaContainer = document.getElementById('lista-roles-por-categoria');
    if (listaRolesCategoriaContainer && idCategoria) {
        
        // 1. Buscar e mostrar os dados da Categoria (Título e Descrição)
        const categoria = await fetchCategoriaById(idCategoria);
        if (categoria) {
            document.getElementById('categoria-titulo').textContent = categoria.nome;
            document.getElementById('categoria-descricao').textContent = categoria.descricao;
        } else {
             document.getElementById('categoria-titulo').textContent = "Categoria não encontrada";
        }

        // 2. Buscar e mostrar os Rolês desta Categoria
        const rolesDaCategoria = await fetchRolesByCategoriaId(idCategoria);
        
        if (rolesDaCategoria.length > 0) {
            rolesDaCategoria.forEach(role => {
                listaRolesCategoriaContainer.innerHTML += `
                    <div class="col">
                        <article class="card h-100 shadow-sm">
                            <a href="detalhes.html?id=${role.id}" class="text-decoration-none text-dark">
                                <img src="${role.imagem_principal}" class="card-img-top" alt="${role.nome}" style="height: 180px; object-fit: cover;">
                                <div class="card-body text-center">
                                    <h5 class="card-title fw-bold">${role.nome}</h5>
                                    <p class="card-text small">${role.descricao}</p>
                                </div>
                            </a>
                        </article>
                    </div>
                `;
            });
        } else {
            // Se não houver rolês
            listaRolesCategoriaContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center" role="alert">
                      Ainda não há rolês cadastrados nesta categoria.
                    </div>
                </div>
            `;
        }
    }


    // --- LÓGICA PARA A PÁGINA DETALHES.HTML ---
    const detalheContainer = document.getElementById('detalhe-do-evento');
    if (detalheContainer && idEvento) {
        const evento = await fetchRoleById(idEvento); 

        if (evento) {
            document.getElementById('detalhe-titulo').textContent = evento.nome;
            document.getElementById('detalhe-imagem').src = evento.imagem_principal;
            document.getElementById('detalhe-descricao').textContent = evento.descricao;
            document.getElementById('detalhe-local').textContent = evento.local;
            document.getElementById('detalhe-horario').textContent = evento.horario;
            document.getElementById('detalhe-atracoes').textContent = evento.atracoes_principais;
            document.getElementById('detalhe-ingressos').textContent = evento.ingressos;
            // Busca o nome da categoria principal
            if(evento.categoria_principal_id) {
                const cat = await fetchCategoriaById(evento.categoria_principal_id);
                document.getElementById('detalhe-tipo').textContent = cat ? cat.nome : "Não categorizado";
            }
            document.getElementById('detalhe-conteudo').textContent = evento.conteudo;

            const btnExcluir = document.getElementById('btn-excluir');
            btnExcluir.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja excluir este rolê?')) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/roles/${idEvento}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            alert('Rolê excluído com sucesso!');
                            window.location.href = 'index.html';
                        } else {
                            throw new Error('Falha ao excluir o rolê.');
                        }
                    } catch (error) {
                        console.error('Erro ao excluir:', error);
                        alert('Ocorreu um erro ao excluir.');
                    }
                }
            });

            const btnEditar = document.getElementById('btn-editar');
            btnEditar.href = `editar.html?id=${evento.id}`; 

            const galeriaContainer = document.getElementById('galeria-fotos');
            if (evento.fotos_extras && evento.fotos_extras.length > 0) {
                let fotosHtml = '';
                evento.fotos_extras.forEach(foto => {
                    fotosHtml += `
                        <div class="col">
                            <div class="card">
                                <img src="${foto.imagem}" class="card-img-top" alt="${foto.legenda}" style="height: 200px; object-fit: cover;">
                                <div class="card-footer text-center">
                                    <small class="text-muted">${foto.legenda}</small>
                                </div>
                            </div>
                        </div>
                    `;
                });
                galeriaContainer.innerHTML = fotosHtml;
            } else {
                document.getElementById('fotos-vinculadas').style.display = 'none';
            }

        } else {
            detalheContainer.innerHTML = `
              <div class="alert alert-danger text-center" role="alert">
                <h2 class="alert-heading">Rolê não encontrado!</h2>
                <p>Parece que o rolê que você procura não existe.</p>
                <hr>
                <a href="index.html" class="btn btn-danger">Voltar para a Home</a>
              </div>
            `;
        }
    }

    // --- LÓGICA PARA A PÁGINA CADASTRO.HTML ---
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        
        // NOVO: Popular o <select> de categorias
        const selectCategoria = document.getElementById('categoria_principal_id');
        if(selectCategoria) {
            const categorias = await fetchCategorias();
            selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>'; // Limpa o "Carregando"
            categorias.forEach(cat => {
                selectCategoria.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
            });
        }


        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const novoRole = {
                nome: document.getElementById('nome').value,
                imagem_principal: document.getElementById('imagem_principal').value,
                descricao: document.getElementById('descricao').value,
                conteudo: document.getElementById('conteudo').value,
                local: document.getElementById('local').value,
                horario: document.getElementById('horario').value,
                atracoes_principais: document.getElementById('atracoes_principais').value,
                ingressos: document.getElementById('ingressos').value,
                categoria_principal_id: parseInt(document.getElementById('categoria_principal_id').value), // Modificado
                destaque: document.getElementById('destaque').checked,
                subcategoria_ids: [], 
                fotos_extras: [] 
            };

            try {
                const response = await fetch(`${API_BASE_URL}/roles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoRole)
                });

                if (response.ok) {
                    alert('Rolê cadastrado com sucesso!');
                    window.location.href = 'index.html';
                } else {
                    throw new Error('Falha ao cadastrar o rolê.');
                }
            } catch (error) {
                console.error('Erro ao cadastrar:', error);
                alert('Ocorreu um erro ao cadastrar.');
            }
        });
    }

    // --- LÓGICA PARA A PÁGINA EDITAR.HTML ---
    const formEdicao = document.getElementById('form-edicao');
    if (formEdicao && idEvento) {
        
        // NOVO: Popular o <select> de categorias
        const selectCategoriaEdicao = document.getElementById('categoria_principal_id');
        if(selectCategoriaEdicao) {
            const todasCategorias = await fetchCategorias();
            selectCategoriaEdicao.innerHTML = '<option value="">Selecione uma categoria</option>'; // Limpa o "Carregando"
            todasCategorias.forEach(cat => {
                selectCategoriaEdicao.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
            });
        }

        // 1. Busca os dados atuais para preencher o formulário
        const evento = await fetchRoleById(idEvento);
        if (evento) {
            document.getElementById('id').value = evento.id;
            document.getElementById('nome').value = evento.nome;
            document.getElementById('imagem_principal').value = evento.imagem_principal;
            document.getElementById('descricao').value = evento.descricao;
            document.getElementById('conteudo').value = evento.conteudo;
            document.getElementById('local').value = evento.local;
            document.getElementById('horario').value = evento.horario;
            document.getElementById('atracoes_principais').value = evento.atracoes_principais;
            document.getElementById('ingressos').value = evento.ingressos;
            if(selectCategoriaEdicao) {
                document.getElementById('categoria_principal_id').value = evento.categoria_principal_id; // Modificado
            }
            document.getElementById('destaque').checked = evento.destaque;
        }

        // 2. (Update) Lógica para salvar as alterações
        formEdicao.addEventListener('submit', async (e) => {
            e.preventDefault();

            const roleAtualizado = {
                id: idEvento, 
                nome: document.getElementById('nome').value,
                imagem_principal: document.getElementById('imagem_principal').value,
                descricao: document.getElementById('descricao').value,
                conteudo: document.getElementById('conteudo').value,
                local: document.getElementById('local').value,
                horario: document.getElementById('horario').value,
                atracoes_principais: document.getElementById('atracoes_principais').value,
                ingressos: document.getElementById('ingressos').value,
                categoria_principal_id: parseInt(document.getElementById('categoria_principal_id').value), // Modificado
                destaque: document.getElementById('destaque').checked,
                subcategoria_ids: evento.subcategoria_ids || [], // Mantém as subcategorias
                fotos_extras: evento.fotos_extras || [] // Mantém as fotos
            };

            try {
                const response = await fetch(`${API_BASE_URL}/roles/${idEvento}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(roleAtualizado)
                });

                if (response.ok) {
                    alert('Rolê atualizado com sucesso!');
                    window.location.href = `detalhes.html?id=${idEvento}`; 
                } else {
                    throw new Error('Falha ao atualizar o rolê.');
                }
            } catch (error) {
                console.error('Erro ao atualizar:', error);
                alert('Ocorreu um erro ao atualizar.');
            }
        });
    }
});