
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
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&forecast_days=6&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
                );

                if (!respostaClima.ok) {
                    throw new Error("Erro ao consultar previsão do tempo.");
                }

                const dadosClima = await respostaClima.json();

                const temperatura = dadosClima.current.temperature_2m;
                const sensacao = dadosClima.current.apparent_temperature;
                const umidade = dadosClima.current.relative_humidity_2m;
                const vento = dadosClima.current.wind_speed_10m;

                const nascerSol = dadosClima.daily.sunrise[0].split("T")[1].slice(0, 5);
                const porSol = dadosClima.daily.sunset[0].split("T")[1].slice(0, 5);

                //previsao dos proximos dias
                let previsao = "";

                for (let i = 1; i < 6; i++) {
                    const data = new Date(dadosClima.daily.time[i] + "T12:00:00");

                    const dia = data.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit"
                    });

                    const maxima = dadosClima.daily.temperature_2m_max[i];
                    const minima = dadosClima.daily.temperature_2m_min[i];

                    previsao += `
                        <div class="dia-previsao">
                            <h4>${dia}</h4>
                            <p class="maxima">Máx. ${maxima} °C</p>
                            <p class="minima">Mín. ${minima} °C</p>
                        </div>
                    `;
                }

                //infos 
                resultado.innerHTML = `
                    <div class="informacoes-clima">

                        <div class="localizacao">
                            <h3>${cidade} - ${estado}</h3>
                            <p>Condições meteorológicas atuais</p>
                        </div>

                        <div class="temperatura-principal">
                            <h2>${temperatura} °C</h2>
                            <p>Temperatura atual</p>
                        </div>

                        <div class="detalhes-clima">
                            <div class="info-clima">
                                <h4>Sensação térmica</h4>
                                <p>${sensacao} °C</p>
                            </div>

                            <div class="info-clima">
                                <h4>Umidade do ar</h4>
                                <p>${umidade}%</p>
                            </div>

                            <div class="info-clima">
                                <h4>Velocidade do vento</h4>
                                <p>${vento} km/h</p>
                            </div>
                        </div>

                        <div class="sol">
                            <h3>Nascer e pôr do sol</h3>

                            <div class="horarios-sol">
                                <div class="horario">
                                    <h4>Nascer do sol</h4>
                                    <p>${nascerSol}</p>
                                </div>

                                <div class="horario">
                                    <h4>Pôr do sol</h4>
                                    <p>${porSol}</p>
                                </div>
                            </div>
                        </div>

                        <div class="previsao">
                            <h3>Previsão dos próximos 5 dias</h3>

                            <div class="previsao-dias">
                                ${previsao}
                            </div>
                        </div>

                        <div class="coordenadas">
                            <p>Latitude: ${latitude.toFixed(5)}</p>
                            <p>Longitude: ${longitude.toFixed(5)}</p>
                        </div>

                    </div>
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
