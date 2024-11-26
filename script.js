let pozo = 0;
let apuestaInicial = 10;
let jugadores = [];
let turnoActual = 1;
let apuestaActual = 0;
let registroApuestas = {};
let baraja = [];

// Configuración inicial
document.getElementById("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();

    // Obtener valores ingresados por el usuario
    const numJugadores = parseInt(document.getElementById("num-jugadores").value);
    apuestaInicial = parseInt(document.getElementById("apuesta-inicial").value);

    initializeGame(numJugadores, apuestaInicial);
});

function initializeGame(numJugadores, apuestaInicial) {
    // Crear jugadores
    jugadores = Array.from({ length: numJugadores }, (_, i) => `Jugador ${i + 1}`);
    pozo = numJugadores * apuestaInicial;

    // Inicializar registro de apuestas
    registroApuestas = {};
    jugadores.forEach(jugador => {
        registroApuestas[jugador] = { totalGanado: 0, totalPerdido: 0 };
    });

    // Mostrar el pozo inicial
    document.getElementById("pozo-actual").textContent = `$${pozo}`;

    // Crear interfaz de jugadores
    const playersDiv = document.getElementById("players");
    playersDiv.innerHTML = ""; // Limpiar jugadores previos
    jugadores.forEach((jugador, index) => {
        const playerDiv = document.createElement("div");
        playerDiv.classList.add("player");
        playerDiv.id = `player-${index + 1}`;
        playerDiv.innerHTML = `
            <h3>${jugador}</h3>
            <p>Cartas: <span id="cards-player-${index + 1}">-</span></p>
            <button onclick="playTurn(${index + 1})" id="play-${index + 1}">Jugar</button>
            <button onclick="skipTurn(${index + 1})" id="skip-${index + 1}">Pasar</button>
        `;
        playersDiv.appendChild(playerDiv);
    });

    // Mostrar primera carta para todos y segunda para el primero
    inicializarCartas();

    // Cambiar de pantalla
    document.getElementById("setup-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
}

function restartRound() {
    document.getElementById("pozo-actual").textContent = `$${pozo}`;
    inicializarCartas(); // Reinitialize cards for all players
    turnoActual = 1; // Reset turn to the first player
    jugadores.forEach((_, index) => {
        const botones = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);
        if (index === 0) {
            botones.forEach((boton) => (boton.style.display = "inline-block")); // Enable buttons for the first player
        } else {
            botones.forEach((boton) => (boton.style.display = "none")); // Disable buttons for others
        }
    });
}


// Simulación de baraja española
function generateDeck() {
    const deck = [];
    const palos = ["Oro", "Copa", "Espada", "Basto"];
    for (let palo of palos) {
        for (let valor of [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]) {
            deck.push(`${valor} de ${palo}`);
        }
    }
    
    return deck;
}

// Barajar cartas
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Registrar acciones
function registrarAccion(mensaje) {
    const log = document.getElementById("game-log")
    const li = document.createElement("li");
    li.textContent = mensaje;
    log.appendChild(li);
    if (log.offsetHeight == 300) {
        log.style.overflowY = "scroll";
    }
    
}

function inicializarCartas() {
    baraja = shuffle(generateDeck());

    // Clear previous cards and reset player UI
    jugadores.forEach((_, index) => {
        const cartasSpan = document.getElementById(`cards-player-${index + 1}`);
        cartasSpan.textContent = "-";
        const botones = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);
        botones.forEach((boton) => (boton.style.display = "none"));
    });

    // First round: deal one card to each player
    jugadores.forEach((_, index) => {
        const carta = baraja.pop();
        const cartasSpan = document.getElementById(`cards-player-${index + 1}`);
        cartasSpan.textContent = carta;

        // Show buttons only for the first player
        if (index === 0) {
            const botones = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);
            botones.forEach((boton) => (boton.style.display = "inline-block"));
        }
    });

    // Second card for the first player
    const cartaExtra = baraja.pop();
    const cartasSpanFirstPlayer = document.getElementById("cards-player-1");
    cartasSpanFirstPlayer.textContent += `, ${cartaExtra}`;
}


function skipTurn(jugador) {
    if (jugador !== turnoActual) return;

    registrarAccion(`${jugadores[jugador - 1]} decide pasar.`);

    turnoSiguiente();
}

function turnoSiguiente() {
    turnoActual = (turnoActual % jugadores.length) + 1;

    jugadores.forEach((_, index) => {
        const cartasSpan = document.getElementById(`cards-player-${index + 1}`);
        const cartas = cartasSpan.textContent.split(", ");
        const botones = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);

        if (turnoActual === index + 1) {
            if (cartas.length === 1) {
                // Mostrar la segunda carta automáticamente al siguiente jugador
                const segundaCarta = baraja.pop();
                cartasSpan.textContent += `, ${segundaCarta}`;
            }
            else if (cartas.length === 2) {
                cartas[0] = cartas[1];
                cartas[1] = baraja.pop();
                cartasSpan.textContent = cartas.join(", ");
            }
            // Habilitar botones para el jugador actual con ambas cartas
            botones.forEach((boton) => (boton.style.display = "inline-block"));
        } else {
            // Ocultar botones para los demás
            botones.forEach((boton) => (boton.style.display = "none"));
        }
    });
    
    if (baraja.length < (40 - jugadores.length * 3)) {
        registrarAccion("Se acabaron las cartas. ¡Se vuelve a barajar!");
        restartRound();
    }
}

// Mostrar modal para ingresar la apuesta
function showBetModal(jugador) {
    const modal = document.getElementById("bet-modal");
    const pozoActualSpan = document.getElementById("modal-pozo");
    const betInput = document.getElementById("bet-input");
    const botones = document.querySelectorAll(`#play-, #skip-`);
    botones.disabled = true;

    // Mostrar el pozo actual en el modal
    pozoActualSpan.textContent = `$${pozo}`;
    betInput.max = pozo; // Limitar la apuesta al valor del pozo

    // Configurar botones
    const betAllButton = document.getElementById("bet-all");
    const confirmBetButton = document.getElementById("confirm-bet");
    const cancelButton = document.getElementById("cancel-bet");

    // Apostar todo
    betAllButton.onclick = () => {
        apuestaActual = pozo;
        betInput.value = apuestaActual;
    };

    // Confirmar apuesta ingresada
    confirmBetButton.onclick = () => {
        botones.disabled = false;
        const valorIngresado = parseInt(betInput.value, 10);
        if (valorIngresado > 0 && valorIngresado <= pozo) {
            apuestaActual = valorIngresado;
            modal.style.display = "none";
            procesarApuesta(jugador);
        } else {
            alert("Ingrese un monto válido.");
        }
    };

    cancelButton.onclick = () => {
        botones.disabled = false;
        modal.style.display = "none";
    }

    // Mostrar el modal
    modal.style.display = "flex";
}

// Procesar la apuesta después de seleccionar el monto
function procesarApuesta(jugador) {
    const jugadorNombre = jugadores[jugador - 1];
    const cartas = document.getElementById(`cards-player-${jugador}`).textContent.split(", ");
    const valor1 = parseInt(cartas[0].split(" ")[0]);
    const valor2 = parseInt(cartas[1]?.split(" ")[0] || "0");
    const rango = [Math.min(valor1, valor2), Math.max(valor1, valor2)];
    const cartaNueva = baraja.pop();
    const valorNueva = parseInt(cartaNueva.split(" ")[0]);

    if (rango[0] < valorNueva && valorNueva < rango[1]) {
        pozo -= apuestaActual;
        registroApuestas[jugadorNombre].totalGanado += apuestaActual;
        registrarAccion(`${jugadorNombre} apuesta $${apuestaActual} y gana con ${cartaNueva}.`);

        if (pozo === 0) {
            registrarAccion(`¡${jugadorNombre} gana la partida! El pozo está vacío.`);
            finalizarJuego();
            return;
        }
    } else {
        pozo += apuestaActual;
        registroApuestas[jugadorNombre].totalPerdido += apuestaActual;
        registrarAccion(`${jugadorNombre} apuesta $${apuestaActual} y pierde con ${cartaNueva}.`);
        restartRound();
        return
    }

    document.getElementById("pozo-actual").textContent = `$${pozo}`;
    turnoSiguiente();
}

function finalizarJuego() {
    const botones = document.querySelectorAll(`#play-, #skip-`);
    botones.disabled = true;
    document.getElementById("pozo-actual").textContent = '0';
    mostrarResultados();
    mostrarBotonReinicio();
}

function mostrarBotonReinicio() {
    const log = document.getElementById("game-log");
    const botonReinicio = document.createElement("button");
    botonReinicio.textContent = "Volver a jugar";
    botonReinicio.onclick = () => location.reload();
    botonReinicio.style.marginTop = "20px";
    botonReinicio.style.padding = "10px 15px";
    botonReinicio.style.fontSize = "16px";
    botonReinicio.style.cursor = "pointer";
    log.appendChild(botonReinicio);
}

function mostrarResultados() {
    const log = document.getElementById("game-log");
    log.innerHTML += "<h3>Resultados Finales</h3>";
    const resultados = document.createElement("ul");
    resultados.id = "resultados-finales";

    jugadores.forEach(jugador => {
        const { totalGanado, totalPerdido } = registroApuestas[jugador];
        const neto = totalGanado - (totalPerdido + Number(apuestaInicial));
        const resultadoItem = document.createElement("li");
        resultadoItem.textContent = `${jugador}: Ganado: $${totalGanado}, Perdido: $${totalPerdido}, Neto: $${neto}`;
        resultados.appendChild(resultadoItem);
    });

    log.appendChild(resultados);
}

// Modificar función "playTurn" para usar el modal
function playTurn(jugador) {
    if (jugador !== turnoActual) return; // Solo el jugador actual puede jugar
    showBetModal(jugador);
}
