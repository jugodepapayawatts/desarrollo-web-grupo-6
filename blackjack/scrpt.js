//cartas
class Card{
    #val;
    #pinta; 

    constructor(val, pinta){
        this.#val = val;
        this.#pinta = pinta; 
    }
    getVal(){ return this.#val; }
    getPinta(){  return this.#pinta; }
    getValNumeric(){
        if(isNaN(this.#val)){ // A, J, Q, K
            if (this.#val === "A") return 11;
            return 10;
        }
        return parseInt(this.#val);
    }
    isAce(){ return this.#val === "A"; }
    getImageCode(){ return `${this.#val}-${this.#pinta}`; }
}

//crar los mazos 
class CreateCards{
    #baraja; 
    constructor(){
        this.#baraja = []; 
        this.buildMazo(); 
    }

    buildMazo(){
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const pintas = ["C", "D", "H", "S"];
        this.#baraja = []; 

        for(let pi of pintas){
            for(let v of values){
                this.#baraja.push(new Card(v, pi));
            }
        }
    }

    desordenarMazo(){
        for(let i = 0; i < this.#baraja.length; i++){
            let j = Math.floor(Math.random() * this.#baraja.length);
            let temp = this.#baraja[i];
            this.#baraja[i] = this.#baraja[j];
            this.#baraja[j] = temp;
        }
    }

    popCard(){
        return this.#baraja.pop();
    }
}

class Player{
    #nombre;
    #mano;
    #score;
    #aceCount;
    constructor(nombre){
        this.#nombre = nombre;
        this.#mano = [];
        this.#score = 0;
        this.#aceCount = 0;
    }
    getNombre(){ return this.#nombre; }
    getMano(){ return this.#mano; }
    getScore(){ return this.#score; }
    getAceCount(){ return this.#aceCount; }
    addCard(card){
        this.#mano.push(card);
        this.#score += card.getValNumeric();
        if (card.isAce()) {
            this.#aceCount += 1;
        }
    }
    getAdjustedScore(){
        let currentScore = this.#score;
        let currentAces = this.#aceCount;
        while (currentScore > 21 && currentAces > 0) {
            currentScore -= 10;
            currentAces -= 1;
        }
        return currentScore;
    }
}

class BlackjackGame {
    #deck;
    #dealer;
    #player;
    #hiddenCard;
    #hiddenImgElement;
    #canHit;
    constructor(){
        this.#deck = new CreateCards();
        this.#dealer = new Player("Dealer");
        this.#player = new Player("Jugador");
        this.#hiddenCard = null;
        this.#hiddenImgElement = null;
        this.#canHit = true;
    }

    start(){
        this.#deck.desordenarMazo();

        //carta oculta del dealer
        this.#hiddenCard = this.#deck.popCard();
        this.#dealer.addCard(this.#hiddenCard);

        //inserta imagen del reverso de la carta en el dealer-cards
        this.#hiddenImgElement = document.createElement("img");
        this.#hiddenImgElement.src = "./cards/BACK.png";
        document.getElementById("dealer-cards").append(this.#hiddenImgElement);

        //Carta visiblke del dealer 
        let dealerVisibleCard = this.#deck.popCard();
        this.#dealer.addCard(dealerVisibleCard);
        this.renderCard("dealer-cards", dealerVisibleCard);


        //Dos cartas iniciales para el jugador
        for(let i = 0; i < 2; i++) {
            let card = this.#deck.popCard();
            this.#player.addCard(card);
            this.renderCard("player-cards", card);
        }
        //Conexión con elementos y acciones HTML (pedir, plantar)
        document.getElementById("pedir").onclick = () => this.hit();
        document.getElementById("plantar").onclick = () => this.stay();

        document.getElementById("pedir").disabled = false;
        document.getElementById("plantar").disabled = false;
        document.getElementById("reintentar").style.display = "none";
        document.getElementById("player-sum").innerText = this.#player.getAdjustedScore();
    }

    hit(){
        if(!this.#canHit) return;

        let card = this.#deck.popCard();
            this.#player.addCard(card);
            this.renderCard("player-cards", card);
        if (this.#player.getAdjustedScore() > 21) {
            this.stay();
        return;
}

        document.getElementById("player-sum").innerText =
            this.#player.getAdjustedScore();
    }

    stay(){
        this.#canHit = false;
        //Rvelar la carta oculta del dealer cambiando la imagen de BACK a la carta real
        this.#hiddenImgElement.src = `./cards/${this.#hiddenCard.getImageCode()}.png`;

        while(this.#dealer.getAdjustedScore() < 17) {
            let card = this.#deck.popCard();
            this.#dealer.addCard(card);
            this.renderCard("dealer-cards", card);
        }

        let playerFinalScore = this.#player.getAdjustedScore();
        let dealerFinalScore = this.#dealer.getAdjustedScore();
        let message = "";
        if (playerFinalScore > 21){
            message = "¡Perdiste Malaya!";
        }else if (dealerFinalScore > 21){
            message = "¡Ganaste viva España!";
        }else if (playerFinalScore === dealerFinalScore){
            message = "¡Empate!";
        }else if (playerFinalScore > dealerFinalScore){
            message = "¡Ganaste viva España!";
        }else{
            message = "¡Perdiste Malaya!";
        }
        //Se actualizan las variables de HTML
        document.getElementById("dealer-sum").innerText = dealerFinalScore;
        document.getElementById("player-sum").innerText = playerFinalScore;
        document.getElementById("resultadoss").innerText = message;
        document.getElementById("pedir").disabled = true;
        document.getElementById("plantar").disabled = true;
        document.getElementById("reintentar").style.display = "inline-block";
    
    }
    renderCard(containerId, card){
        let cardImg = document.createElement("img");
        cardImg.src = `./cards/${card.getImageCode()}.png`;
        document.getElementById(containerId).append(cardImg);
    }
}

//inicialización del juego al cargar la ventana
window.onload = function(){
    let game = new BlackjackGame();
    game.start();

    document.getElementById("reintentar").onclick = function(){
        document.getElementById("dealer-cards").innerHTML = "";
        document.getElementById("player-cards").innerHTML = "";

        document.getElementById("dealer-sum").innerText = "";
        document.getElementById("player-sum").innerText = "";
        document.getElementById("resultadoss").innerText = "";

        game = new BlackjackGame();
        game.start();
    };
};
