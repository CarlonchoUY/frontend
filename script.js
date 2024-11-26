let pozo = 0;
let initialBet = 10;
let players = [];
let currentTurn = 1;
let currentBet = 0;
let betLedger = {};
let deck = [];

// Configuración inicial
document.getElementById("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();

    // Obtener valores ingresados por el usuario
    const playerCount = parseInt(document.getElementById("num-jugadores").value);
    initialBet = parseInt(document.getElementById("apuesta-inicial").value);

    initializeGame(playerCount, initialBet);
});

function initializeGame(playerCount, initialBet) {
    // Crear jugadores
    players = Array.from({ length: playerCount }, (_, i) => `Jugador ${i + 1}`);
    pozo = playerCount * initialBet;

    // Inicializar registro de apuestas
    betLedger = {};
    players.forEach(player => {
        betLedger[player] = { totalGanado: 0, totalPerdido: 0 };
    });

    // Mostrar el pozo inicial
    document.getElementById("pozo-actual").textContent = `$${pozo}`;

    // Crear interfaz de players
    const playersDiv = document.getElementById("players");
    playersDiv.innerHTML = ""; // Limpiar players previos
    players.forEach((player, index) => {
        const playerDiv = document.createElement("div");
        playerDiv.classList.add("player");
        playerDiv.id = `player-${index + 1}`;
        playerDiv.innerHTML = `
            <h3>${player}</h3>
            <p>Cartas: <span id="cards-player-${index + 1}">-</span></p>
            <button onclick="playTurn(${index + 1})" id="play-${index + 1}">Jugar</button>
            <button onclick="skipTurn(${index + 1})" id="skip-${index + 1}">Pasar</button>
        `;
        playersDiv.appendChild(playerDiv);
    });

    // Mostrar primera carta para todos y segunda para el primero
    initiliazeCards();

    // Cambiar de pantalla
    document.getElementById("setup-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
}

function restartRound() {
    document.getElementById("pozo-actual").textContent = `$${pozo}`;
    initiliazeCards(); // Reinitialize cards for all players
    currentTurn = 1; // Reset turn to the first player
    players.forEach((_, index) => {
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
    const cards = [];
    const palos = ["Oro", "Copa", "Espada", "Basto"];
    for (let palo of palos) {
        for (let valor of [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]) {
            cards.push(`${valor} de ${palo}`);
        }
    }
    
    return cards;
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
function registerAction(message) {
    const log = document.getElementById("game-log")
    const li = document.createElement("li");
    li.textContent = message;
    log.appendChild(li);
    if (log.offsetHeight == 300) {
        log.style.overflowY = "scroll";
    }
    
}

function initiliazeCards() {
    deck = shuffle(generateDeck());

    // Clear previous cards and reset player UI
    players.forEach((_, index) => {
        const spanCards = document.getElementById(`cards-player-${index + 1}`);
        spanCards.textContent = "-";
        const buttons = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);
        buttons.forEach((button) => (button.style.display = "none"));
    });

    // First round: deal one card to each player
    players.forEach((_, index) => {
        const card = deck.pop();
        const spanCards = document.getElementById(`cards-player-${index + 1}`);
        spanCards.textContent = card;

        // Show buttons only for the first player
        if (index === 0) {
            const buttons = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);
            buttons.forEach((button) => (button.style.display = "inline-block"));
        }
    });

    // Second card for the first player
    const extraCard = deck.pop();
    const spanFirstPlayerCards = document.getElementById("cards-player-1");
    spanFirstPlayerCards.textContent += `, ${extraCard}`;
}


function skipTurn(player) {
    if (player !== currentTurn) return;

    registerAction(`${players[player - 1]} decide pasar.`);

    nextTurn();
}

function nextTurn() {
    currentTurn = (currentTurn % players.length) + 1;

    players.forEach((_, index) => {
        const spanCards = document.getElementById(`cards-player-${index + 1}`);
        const cards = spanCards.textContent.split(", ");
        const buttons = document.querySelectorAll(`#play-${index + 1}, #skip-${index + 1}`);

        if (currentTurn === index + 1) {
            if (cards.length === 1) {
                // Mostrar la segunda carta automáticamente al siguiente jugador
                const secondCard = deck.pop();
                spanCards.textContent += `, ${secondCard}`;
            }
            else if (cards.length === 2) {
                cards[0] = cards[1];
                cards[1] = deck.pop();
                spanCards.textContent = cards.join(", ");
            }
            // Habilitar buttons para el jugador actual con ambas cartas
            buttons.forEach((button) => (button.style.display = "inline-block"));
        } else {
            // Ocultar buttons para los demás
            buttons.forEach((button) => (button.style.display = "none"));
        }
    });
    
    if (deck.length < (40 - players.length * 3)) {
        registerAction("Se acabaron las cartas. ¡Se vuelve a barajar!");
        restartRound();
    }
}

// Mostrar modal para ingresar la apuesta
function showBetModal(jugador) {
    const modal = document.getElementById("bet-modal");
    const spanCurrentPozo = document.getElementById("modal-pozo");
    const betInput = document.getElementById("bet-input");
    const buttons = document.querySelectorAll(`#play-, #skip-`);
    buttons.disabled = true;

    // Mostrar el pozo actual en el modal
    spanCurrentPozo.textContent = `$${pozo}`;
    betInput.max = pozo; // Limitar la apuesta al valor del pozo

    // Configurar botones
    const betAllButton = document.getElementById("bet-all");
    const confirmBetButton = document.getElementById("confirm-bet");
    const cancelButton = document.getElementById("cancel-bet");

    // Apostar todo
    betAllButton.onclick = () => {
        currentBet = pozo;
        betInput.value = currentBet;
    };

    // Confirmar apuesta ingresada
    confirmBetButton.onclick = () => {
        buttons.disabled = false;
        const inputValue = parseInt(betInput.value, 10);
        if (inputValue > 0 && inputValue <= pozo) {
            currentBet = inputValue;
            modal.style.display = "none";
            processBet(jugador);
        } else {
            alert("Ingrese un monto válido.");
        }
    };

    cancelButton.onclick = () => {
        buttons.disabled = false;
        modal.style.display = "none";
    }

    // Mostrar el modal
    modal.style.display = "flex";
}

// Procesar la apuesta después de seleccionar el monto
function processBet(player) {
    const playerName = players[player - 1];
    const cards = document.getElementById(`cards-player-${player}`).textContent.split(", ");
    const value1 = parseInt(cards[0].split(" ")[0]);
    const value2 = parseInt(cards[1]?.split(" ")[0] || "0");
    const range = [Math.min(value1, value2), Math.max(value1, value2)];
    const newCard = deck.pop();
    const newValue = parseInt(newCard.split(" ")[0]);

    if (range[0] < newValue && newValue < range[1]) {
        pozo -= currentBet;
        betLedger[playerName].totalGanado += currentBet;
        registerAction(`${playerName} apuesta $${currentBet} y gana con ${newCard}.`);

        if (pozo === 0) {
            registerAction(`¡${playerName} gana la partida! El pozo está vacío.`);
            finishGame();
            return;
        }
    } else {
        pozo += currentBet;
        betLedger[playerName].totalPerdido += currentBet;
        registerAction(`${playerName} apuesta $${currentBet} y pierde con ${newCard}.`);
        restartRound();
        return
    }

    document.getElementById("pozo-actual").textContent = `$${pozo}`;
    turnoSiguiente();
}

function finishGame() {
    const buttons = document.querySelectorAll(`#play-, #skip-`);
    buttons.disabled = true;
    document.getElementById("pozo-actual").textContent = '0';
    showResults();
    showRestartButton();
}

function showRestartButton() {
    const log = document.getElementById("game-log");
    const restartButton = document.createElement("button");
    restartButton.textContent = "Volver a jugar";
    restartButton.onclick = () => location.reload();
    restartButton.style.marginTop = "20px";
    restartButton.style.padding = "10px 15px";
    restartButton.style.fontSize = "16px";
    restartButton.style.cursor = "pointer";
    log.appendChild(restartButton);
}

function showResults() {
    const log = document.getElementById("game-log");
    log.innerHTML += "<h3>Resultados Finales</h3>";
    const results = document.createElement("ul");
    results.id = "results-list";

    players.forEach(jugador => {
        const { totalGanado, totalPerdido } = betLedger[jugador];
        const net = totalGanado - (totalPerdido + Number(initialBet));
        const resultItem = document.createElement("li");
        resultItem.textContent = `${jugador}: Ganado: $${totalGanado}, Perdido: $${totalPerdido}, Neto: $${net}`;
        results.appendChild(resultItem);
    });

    log.appendChild(results);
}

function playTurn(player) {
    if (player !== currentTurn) return;
    showBetModal(player);
}
