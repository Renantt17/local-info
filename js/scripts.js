
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
                //acha a loc
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
                //acha clima local
                const respostaClima = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
                );

                if (!respostaClima.ok) {
                    throw new Error("Erro ao consultar previsão do tempo.");
                }

                const dadosClima = await respostaClima.json();

                const temperatura = dadosClima.current.temperature_2m;
                const sensacao = dadosClima.current.apparent_temperature;
                const umidade = dadosClima.current.relative_humidity_2m;
                const vento = dadosClima.current.wind_speed_10m;

                //infos 
                resultado.innerHTML = `
                    <p><strong>${cidade} - ${estado}</strong></p>
                    <p>Temperatura atual: ${temperatura} °C</p>
                    <p>Sensação térmica: ${sensacao} °C</p>
                    <p>Umidade do ar: ${umidade}%</p>
                    <p>Velocidade do vento: ${vento} km/h</p>
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
