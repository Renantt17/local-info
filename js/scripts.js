
function obterCondicao(codigo) {
    if (codigo === 0) {
        return { descricao: "Céu limpo", icone: "sol" };
    } else if (codigo === 1 || codigo === 2) {
        return { descricao: "Parcialmente nublado", icone: "sol-nuvem" };
    } else if (codigo === 3) {
        return { descricao: "Nublado", icone: "nuvem" };
    } else if (codigo === 45 || codigo === 48) {
        return { descricao: "Neblina", icone: "neblina" };
    } else if (codigo >= 51 && codigo <= 67) {
        return { descricao: "Chuva ou chuvisco", icone: "chuva" };
    } else if (codigo >= 71 && codigo <= 77) {
        return { descricao: "Neve", icone: "neve" };
    } else if (codigo >= 80 && codigo <= 82) {
        return { descricao: "Pancadas de chuva", icone: "chuva" };
    } else if (codigo >= 85 && codigo <= 86) {
        return { descricao: "Pancadas de neve", icone: "neve" };
    } else if (codigo >= 95 && codigo <= 99) {
        return { descricao: "Tempestade", icone: "tempestade" };
    }

    return { descricao: "Condição não identificada", icone: "nuvem" };
}

function obterPeriodo(horaAtual, nascerSol, porSol) {
    const converterMinutos = function (hora) {
        const partes = hora.split(":");
        return Number(partes[0]) * 60 + Number(partes[1]);
    };

    const atual = converterMinutos(horaAtual);
    const nascer = converterMinutos(nascerSol);
    const por = converterMinutos(porSol);

    if (Math.abs(atual - nascer) <= 60) {
        return {
            tema: "tema-amanhecer",
            descricao: "Amanhecer"
        };
    } else if (Math.abs(atual - por) <= 60) {
        return {
            tema: "tema-por-do-sol",
            descricao: "Pôr do sol"
        };
    } else if (atual > nascer && atual < por) {
        return {
            tema: "tema-dia",
            descricao: "Dia"
        };
    }

    return {
        tema: "tema-madrugada",
        descricao: "Noite"
    };
}

function aplicarTema(tema, periodo) {
    const temas = [
        "tema-madrugada",
        "tema-amanhecer",
        "tema-dia",
        "tema-por-do-sol"
    ];

    document.body.classList.remove(...temas);
    document.body.classList.add(tema);

    let indicador = document.getElementById("periodo-dia");

    if (!indicador) {
        indicador = document.createElement("div");
        indicador.id = "periodo-dia";
        indicador.className = "indicador-periodo";

        const cabecalho = document.querySelector("header .container");
        cabecalho.appendChild(indicador);
    }

    indicador.textContent = periodo;
}

function atualizarTemaSalvo() {
    const nascerSol = localStorage.getItem("nascerSol");
    const porSol = localStorage.getItem("porSol");
    const fusoHorario = localStorage.getItem("fusoHorario");

    if (!nascerSol || !porSol || !fusoHorario) return;

    const horaAtual = new Date().toLocaleTimeString("pt-BR", {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    const periodo = obterPeriodo(horaAtual, nascerSol, porSol);

    aplicarTema(periodo.tema, periodo.descricao);
}

function salvarConsulta() {
    const resultado = document.getElementById("resultado");

    localStorage.setItem("ultimaConsulta", resultado.innerHTML);
}

function recuperarConsulta() {
    const resultado = document.getElementById("resultado");
    const consultaSalva = localStorage.getItem("ultimaConsulta");

    if (consultaSalva) {
        resultado.innerHTML = consultaSalva;
    }
}

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

                const respostaClima = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code&forecast_days=6&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
                );

                if (!respostaClima.ok) {
                    throw new Error("Erro ao consultar previsão do tempo.");
                }

                const dadosClima = await respostaClima.json();

                const temperatura = dadosClima.current.temperature_2m;
                const sensacao = dadosClima.current.apparent_temperature;
                const umidade = dadosClima.current.relative_humidity_2m;
                const vento = dadosClima.current.wind_speed_10m;
                const codigoClima = dadosClima.current.weather_code;

                const climaAtual = obterCondicao(codigoClima);

                const nascerSol = dadosClima.daily.sunrise[0].split("T")[1].slice(0, 5);
                const porSol = dadosClima.daily.sunset[0].split("T")[1].slice(0, 5);

                localStorage.setItem("nascerSol", nascerSol);
                localStorage.setItem("porSol", porSol);
                localStorage.setItem("fusoHorario", dadosClima.timezone);

                const horaAtual = dadosClima.current.time.split("T")[1].slice(0, 5);
                const periodo = obterPeriodo(horaAtual, nascerSol, porSol);

                aplicarTema(periodo.tema, periodo.descricao);

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
                    const codigoDia = dadosClima.daily.weather_code[i];
                    const climaDia = obterCondicao(codigoDia);

                    previsao += `
                        <div class="dia-previsao">
                            <h4>${dia}</h4>

                            <svg class="icone-dia" aria-hidden="true">
                                <use href="#icone-${climaDia.icone}"></use>
                            </svg>

                            <p class="condicao-dia">${climaDia.descricao}</p>
                            <p class="maxima">Máx. ${maxima} °C</p>
                            <p class="minima">Mín. ${minima} °C</p>
                        </div>
                    `;
                }

                resultado.innerHTML = `
                    <div class="informacoes-clima">

                        <div class="localizacao">
                            <h3>${cidade} - ${estado}</h3>
                            <p>Condições meteorológicas atuais</p>
                        </div>

                        <div class="temperatura-principal">

                            <svg class="icone-atual" aria-hidden="true">
                                <use href="#icone-${climaAtual.icone}"></use>
                            </svg>

                            <h2>${temperatura} °C</h2>
                            <p>${climaAtual.descricao}</p>
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
                                <div class="horario nascer">
                                    <svg class="icone-sol" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 18h18"/>
                                        <path d="M5 16a7 7 0 0 1 14 0"/>
                                        <path d="M12 6v2 M6 7l2 2 M18 7l-2 2 M3 12h3 M18 12h3"/>
                                    </svg>
                                    <div>
                                        <h4>Nascer do sol</h4>
                                        <p>${nascerSol}</p>
                                    </div>
                                </div>

                                <div class="horario por-do-sol">
                                    <svg class="icone-sol" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 18h18"/>
                                        <path d="M5 18a7 7 0 0 1 14 0"/>
                                        <path d="M12 7v3 M5 11l2 2 M19 11l-2 2 M2 15h3 M19 15h3"/>
                                    </svg>
                                    <div>
                                        <h4>Pôr do sol</h4>
                                        <p>${porSol}</p>
                                    </div>
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

                salvarConsulta();

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

recuperarConsulta();
atualizarTemaSalvo();
