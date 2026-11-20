
function consultarLocalizacao() {
    const resultado = document.getElementById("resultado");

    if (!navigator.geolocation) {
        resultado.innerHTML = "<p>Seu navegador não suporta geolocalização.</p>";
        return;
    }

    resultado.innerHTML = "<p>Obtendo sua localização...</p>";

    navigator.geolocation.getCurrentPosition(
        async function (posicao) {
            const latitude = posicao.coords.latitude;
            const longitude = posicao.coords.longitude;

            try {
                const resposta = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
                );

                if (!resposta.ok) {
                    throw new Error("Erro na consulta da localização.");
                }

                const dados = await resposta.json();

                const cidade = dados.city || dados.locality;
                const estado = dados.principalSubdivision;

                if (!cidade) {
                    resultado.innerHTML = "<p>Não foi possível identificar sua cidade.</p>";
                    return;
                }

                resultado.innerHTML = `
                    <p><strong>${cidade} - ${estado}</strong></p>
                    <p>Latitude: ${latitude.toFixed(5)}</p>
                    <p>Longitude: ${longitude.toFixed(5)}</p>
                `;

            } catch (erro) {
                resultado.innerHTML = "<p>Erro ao consultar sua localização.</p>";
            }
        },

        function (erro) {
            resultado.innerHTML = "<p>Não foi possível obter sua localização.</p>";
        }
    );
}

const botao = document.getElementById("btn-localizacao");

botao.addEventListener("click", consultarLocalizacao);
