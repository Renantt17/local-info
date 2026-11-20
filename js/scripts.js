
function consultarLocalizacao() {
    const resultado = document.getElementById("resultado");

    resultado.innerHTML = "<p>Preparando consulta da sua localização...</p>";
}

const botao = document.getElementById("btn-localizacao");

botao.addEventListener("click", consultarLocalizacao);
