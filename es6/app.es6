
/**
 * Defines global game settings
 */
var Settings = {
    foodColor: 'orange',
    snakeColor: 'green',
    mapColor: 'white',
    size: 20,
    startSpeed: 15,
    speedIncrement: 1,
    maxSpeed: 40,
    startSnakeLength: 8,
    scoreMultiplier: 3
};

/**
 * Initialized the game and all other classes
 */
class Game {

    constructor() {

        // Game objects
        this.level = null;
        this.snake = null;
        this.food = null;

        // State
        this.score = 0;
        this.speed = Settings.startSpeed;
        this.direction = Direction.right;
        this.interval = null;
        this.over = 0;
        this.paused = false;
        
        // Page ready
        $(() => {

            // Create elements
            $(document.body).append(
                '<div id="header">' +
                    '<span id="score-board"></span>' +
                '</div>' +
                '<div id="content"></div>'
            );
            this.scoreBoard = $('#score-board');
            this.content = $('#content');

            // Create map level in content area
            this.level = new Level(this.content);

            // Display welcome message
            Message.show('Welcome to Snake ES6/Traceur', 'press any key or click to start');

            this.initStartEvents();

        });

    }

    startGame() {

        // Key events
        $(document).unbind().keydown((e) => {

            var key = e.keyCode;

            // Change direction
            if (key == Direction.left ||
                key == Direction.up ||
                key == Direction.right ||
                key == Direction.down) {
                this.direction = key;
                e.preventDefault();
            }

            // Pause
            else if (e.keyCode == KeyCode.enter || e.keyCode == KeyCode.space) {
                this.togglePause();
            }

        });

        // Restart on click
        $(this.level.canvas).click(() => {
           this.paused = true;
           if (confirm('Are you sure you want to restart?')) {
               this.paused = false;
               this.startGame();
           }
        });

        this.reset();
        Message.remove();

    }

    togglePause() {
        this.paused = !this.paused;
    }

    update() {

        if (this.paused) return;

        var snake = this.snake,
            head = snake.head;

        // Move snake one point
        snake.move(this.direction);

        // Wall/Tail collision, Game Over!
        if (snake.wallCollision || snake.tailCollision) {
            if (this.over == 0) this.end();
            this.over++
        }

        // Food collision
        if (snake.foodCollision(this.food)) {

            // Add food and grow snake
            this.food = new Food(this.level);
            var tail = new Point(head.x, head.y);
            snake.parts.push(tail);

            // Increase speed
            if (this.speed <= Settings.maxSpeed) this.speed += Settings.speedIncrement;
            clearInterval(this.interval);
            this.interval = setInterval(() => this.renderAll(), 1000 / this.speed);

            // Display score, higher scores for faster speeds
            this.score += Settings.scoreMultiplier * ((this.speed - Settings.startSpeed) + 1);
            this.scoreBoard.text('Score: ' + this.score);

        }

    }

    animate() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.renderAll(), 1000 / this.speed);
    }

    renderAll() {
        requestAnimationFrame(() => {
            this.level.render();
            this.snake.render();
            this.update();
            this.food.render();
        });
    }

    reset() {
        this.snake = new Snake(this.level);
        this.food = new Food(this.level);
        this.direction = Direction.right;
        this.scoreBoard.text('Score: 0');
        this.over = 0;
        this.speed = Settings.startSpeed;
        if (this.interval !== undefined)  clearInterval(this.interval);
        this.interval = setInterval(() => this.renderAll(), 1000 / this.speed);
        this.score = 0;
    }

    end() {
        clearInterval(this.interval);
        Message.show('Game Over', 'press any key or click to try again');
        $(document).unbind();
        this.initStartEvents();
    }

    initStartEvents() {
        $(document)
        .click(() => this.startGame())
        .keypress(() => this.startGame());
    }

}

/**
 * Represents all possible directions and it's key code
 */
var Direction = {
    left: 37,
    up: 38,
    right: 39,
    down: 40
};

/**
 * Represents key codes
 */
var KeyCode = {
    enter: 13,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40
};

/**
 * Represents each graphic point on the level
 */
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * The map level area displayed with a canvas
 */
class Level {

    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }

    constructor(target) {

        // Create canvas in target element
        this.target = target;
        this.canvas = target.append('<canvas>').children()[0];
        this.context = this.canvas.getContext('2d');

        // Set width/height
        this.canvas.width = this.target.width();
        this.canvas.height = this.target.height();

        this.render();

    }

    render() {
        this.context.fillStyle = Settings.mapColor;
        this.context.fillRect(0, 0, this.width, this.height);
    }

}

/**
 * The coordinates for the snake's body
 */
class Snake {

    get head() {
        return this.parts[0];
    }

    get tail() {
        return this.parts[this.parts.length - 1];
    }

    get length() {
        return this.parts.length;
    }

    constructor(level) {

        this.level = level;
        this.parts = [];

        var length = Settings.startSnakeLength;
        for (var i = length - 1; i >= 0; i--) {
            this.parts.push(new Point(i, 0));
        }

    }

    render() {
        var size = Settings.size,
            context = this.level.context;
        for (var i = 0; i < this.parts.length; i++) {
            var s = this.parts[i];
            context.fillStyle = Settings.snakeColor;
            context.fillRect(s.x * size, s.y * size, size, size);
        }
    }

    // Manipulation

    grow() {
        var newTail = new Point(this.tail.x, this.tail.y);
        this.parts.unshift(newTail);
    }

    move(direction) {

        var head = this.head,
            x = head.x,
            y = head.y;

        if (direction == Direction.right) x++;
        else if (direction == Direction.left) x--;
        else if (direction == Direction.up) y--;
        else if (direction == Direction.down) y++;
        var tail = this.parts.pop();
        tail.x = x;
        tail.y = y;
        this.parts.unshift(tail);

    }

    // Collision detection

    get wallCollision() {
        var width = this.level.width,
            height = this.level.height,
            size = Settings.size,
            x = this.head.x,
            y = this.head.y;
        return x >= width / size ||
               x <= -1 ||
               y >= height / size ||
               y <= -1;
    }

    get tailCollision() {
        for (var i = 1; i < this.parts.length; i++) {
            var part = this.parts[i];
            if (this.head.x == part.x && this.head.y == part.y) {
                return true;
            }
        }
        return false;
    }

    foodCollision(food) {
        var head = this.head;
        return head.x == food.x && head.y == food.y;
    }

}

/**
 * A single point on the for the snake to eat
 */
class Food extends Point {

    constructor(level) {
        this.level = level;
        var size = Settings.size,
            x = Math.round(Math.random() * (level.width - size) / size),
            y = Math.round(Math.random() * (level.height - size) / size);
        super(x, y);
    }

    render() {
        var size = Settings.size,
            context = this.level.context;
        context.fillStyle = Settings.foodColor;
        context.fillRect(this.x * size, this.y * size, size, size);
    }

}

/**
 * Displays a modal message to user
 */
class Message {

    static show(title, subTitle) {
        $(document.body).append(
             '<div id="message">' +
                '<div id="message-modal"></div>' +
                '<div id="message-panel"><h1>' + title + '</h1><br/><h4>' + subTitle + '</h4></div>' +
            '</div>'
        );
    }

    static remove() {
        $('#message').remove();
    }

}

// Start the game
var game = new Game();
