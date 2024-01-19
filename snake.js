class Cell{
    #x;
    #y;
    #div;
    get X() {
        return this.#x;
    }

    get Y() {
        return this.#y;
    }

    set X(value) {
        this.#x = value;
        this.#div.style.setProperty("--x", value);
    }

    set Y(value) {
        this.#y = value;
        this.#div.style.setProperty("--y", value);
    }

    constructor(x, y, color, gameBoard) {
        this.#div = document.createElement("div");
        this.#div.className = "cell";
        this.#div.style.backgroundColor = color;
        this.X = x;
        this.Y = y;
        gameBoard.appendChild(this.#div);
    }

    collideWith(other) {
        return this.#x === other.X && this.#y === other.Y;
    }

    remove() {
        this.#div.remove();
    }

    enableTransition() {
        this.#div.classList.remove("stop-transition");
    }

    disableTransition() {
        this.#div.classList.add("stop-transition");
    }
}

class Snake {
    #body;
    #gameBoard;
    #tailPos;

    constructor(initSize, gameBoard) {
        this.#body = new Array(initSize);
        for (let i = 1; i < this.#body.length; i++) {
            this.#body[i] = new Cell(0, 0, "green", gameBoard);  
        }
        this.#body[0] = new Cell(0, 0, "darkgreen", gameBoard);
        this.#gameBoard = gameBoard;
        this.#tailPos = {x: 0, y: 0};
    }

    move(dir) {
        this.#tailPos.x = this.#body[this.#body.length -1].X;
        this.#tailPos.y = this.#body[this.#body.length -1].Y;
        for (let i = this.#body.length - 1; i > 0; i--) {
            this.#body[i].X = this.#body[i - 1].X;
            this.#body[i].Y = this.#body[i - 1].Y;
        }
        this.#body[0].X += dir.x;
        this.#body[0].Y += dir.y;
    }

    moveBack() {
        for (let i = 0; i < this.#body.length - 1; i++) {
            this.#body[i].X = this.#body[i + 1].X;
            this.#body[i].Y = this.#body[i + 1].Y;
        }
        this.#body[this.#body.length - 1].X = this.#tailPos.x;
        this.#body[this.#body.length - 1].Y = this.#tailPos.y;
    }

    collide() {
        let head = this.#body[0];
        if (head.X < 0 || head.X >= this.#gameBoard.Width || head.Y < 0 || head.Y >= this.#gameBoard.Height) return true;
        for (let i = 1; i < this.#body.length; i++) {
            if (head.collideWith(this.#body[i])) return true;
        }
        return false;
    }

    collideWith(cell) {
        for (let i = 0; i < this.#body.length; i++) {
            if (this.#body[i].collideWith(cell)) return true; 
        }
        return false;
    }

    eat(food) {
        if (food.X === this.#body[0].X && food.Y === this.#body[0].Y) {
            let lastCell = this.#body[this.#body.length -1];
            this.#body.push(new Cell(lastCell.X, lastCell.Y, "green", this.#gameBoard));
            food.remove();
            return true;
        }
        return false;
    }

    enableTransition() {
        for (const cell of this.#body) {
            cell.enableTransition();
        }
    }

    disableTransition() {
        for (const cell of this.#body) {
            cell.disableTransition();
        }
    }

    remove() {
        for (const cell of this.#body) {
            cell.remove();
        }
    }
}

class GameBoard{
    #gameBoard;
    #width;
    #height;

    get Width(){
        return this.#width;
    }

    get Height() {
        return this.#height;
    }

    constructor(width, height) {
        this.#width = width;
        this.#height = height;
        this.#gameBoard = document.getElementById("game-board");
        this.#gameBoard.style.setProperty("--grid-width", width);
        this.#gameBoard.style.setProperty("--grid-height", height);
    }

    appendChild(element) {
        this.#gameBoard.appendChild(element);
    }
}
let gameBoard = new GameBoard(32, 16);
let snake;
let food;
let dirQueue = [{x: 1, y: 0}];
let maxScore = 0;
let score = 0;
displayScore();
let dir = dirQueue[0];
let gameOver;
let eatSound = new Audio("eatfoodsound.mp3");
let gameOverSound = new Audio("gameoversound.mp3");
getSavedScore();
hideScore();
displayGameOver();

let gameInterval;

function startGame() {
    gameInterval = setInterval(() => {
        if (dirQueue.length > 0) {
            dir = dirQueue.shift();
        }
        snake.move(dir);
        if (snake.eat(food)) {
            playSound(eatSound);
            getNewFood();
            score++;
            displayScore();
        }
        if (snake.collide()) {
            playSound(gameOverSound);
            saveScore();
            snake.moveBack();
            snake.disableTransition();
            clearInterval(gameInterval);
            setTimeout(() => {
                hideScore();
                score = 0;
                displayGameOver();
                snake.remove();
                food.remove();
            }, 1500);
        }
    }, 200);
}

function addDir(newDir) {
    if (dir.x * newDir.x + dir.y * newDir.y === 0) {
        dirQueue.push(newDir);
    }
}

function randInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function getNewFood() {
    let cellPos = {X: randInt(0, gameBoard.Width), Y: randInt(0, gameBoard.Height)};
    while(snake.collideWith(cellPos)) {
        cellPos = {X: randInt(0, gameBoard.Width), Y: randInt(0, gameBoard.Height)};
    }
    food = new Cell(cellPos.X, cellPos.Y, "red", gameBoard);
    food.disableTransition();
}

document.addEventListener("keydown", (event) => {
    switch(event.key.toLowerCase()) {
        case "a":
            addDir({x: -1, y: 0});
            break;
        case "d":
            addDir({x: 1, y: 0});
            break;
        case "w":
            addDir({x: 0, y: -1});
            break;
        case "s":
            addDir({x: 0, y: 1});
            break;
        case " ":
            if (gameOver) {
                hideGameOver();
                displayScore();
                snake = new Snake(7, gameBoard);
                dirQueue = [{x: 1, y: 0}];
                dir = dirQueue[0];
                getNewFood();
                startGame();
            }
            break;
    }
});
let transitionTimeout = false;
window.addEventListener("resize", () => {
    if (transitionTimeout) {
        clearTimeout(transitionTimeout);
    } else {
        snake.disableTransition();
    }

    transitionTimeout = setTimeout(() => {
        snake.enableTransition();
        transitionTimeout = false;
    }, 20);
});

function displayScore() {
    document.getElementById("score").innerText = "Score: " + score;
}

function hideScore() {
    document.getElementById("score").innerText = "";
}

function displayGameOver() {
    gameOver = true;
    document.getElementById("highest-score").innerText = "Best score: " + maxScore;
    document.getElementById("game-over-div").style.display = "block";
}

function hideGameOver() {
    gameOver = false;
    document.getElementById("game-over-div").style.display = "none";
}

function getSavedScore() {
    let cookie = document.cookie.split("; ").find((row) => row.startsWith("max-score="))?.split("=")[1]; 
    maxScore = Number(cookie);
    if (isNaN(maxScore)) maxScore = 0;
}

function saveScore() {
    if (score > maxScore) {
        document.cookie = "max-score=" + score + ";path=/";
        maxScore = score;
    }
}

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}