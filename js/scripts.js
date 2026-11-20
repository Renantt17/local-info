
async function consultarLocalizacao() {
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
                // Consulta a localização
                const respostaLocal = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
                );

                if (!respostaLocal.ok) {
                    throw new Error("Erro ao consultar localização.");
                }

                const dadosLocal = await respostaLocal.json();

                const cidade = dadosLocal.city || dadosLocal.locality;
                const estado = dadosLocal.principalSubdivision;

                if (!cidade) {
                    resultado.innerHTML = "<p>Não foi possível identificar sua cidade.</p>";
                    return;
                }

                // Consulta a temperatura atual
                const respostaClima = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=celsius&timezone=auto`
                );

                if (!respostaClima.ok) {
                    throw new Error("Erro ao consultar previsão do tempo.");
                }

                const dadosClima = await respostaClima.json();

                const temperatura = dadosClima.current.temperature_2m;

                resultado.innerHTML = `
                    <p><strong>${cidade} - ${estado}</strong></p>
                    <p>Temperatura atual: ${temperatura} °C</p>
                    <p>Latitude: ${latitude.toFixed(5)}</p>
                    <p>Longitude: ${longitude.toFixed(5)}</p>
                `;

            } catch (erro) {
                resultado.innerHTML = "<p>Não foi possível consultar as informações.</p>";
                console.error(erro);
            }
        },

        function (erro) {
            resultado.innerHTML = "<p>Não foi possível obter sua localização.</p>";
        }
    );
}

const botao = document.getElementById("btn-localizacao");

botao.addEventListener("click", consultarLocalizacao);
