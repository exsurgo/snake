import 'js.jsx';

/**
 * Defines global game settings
 */
class Settings {
    static var foodColor = 'orange';
    static var snakeColor = 'green';
    static var mapColor = 'white';
    static var size = 20;
    static var startSpeed = 15;
    static var speedIncrement = 1;
    static var maxSpeed = 40;
    static var startSnakeLength = 8;
    static var scoreMultiplier = 3;
}

/**
 * Initialized the game and all other classes
 */
class Game {

    // UI elements
    var scoreBoard;
    var content;

    // Game objects
    var level: Level;
    var snake: Snake;
    var food: Food;

    // State
    var score = 0;
    var speed = Settings.startSpeed;
    var direction: Direction;
    var interval;
    var over = 0;
    var paused = false;

    Game() {

        // Page ready
        $(() => {

            // Create elements
            $(document.body).append(
                '<div id="header">' +
                    '<span id="score-board"></span>' +
                '</div>' +
                '<div id="content"></div>'
            );
            scoreBoard = $('#score-board');
            content = $('#content');

            // Create map level in content area
            this.level = new Level(content);

            // Display welcome message
            Message.show('Welcome to Snake TypeScript', 'press any key or click to start');

            this.initStartEvents();

        });

    }

    function startGame() {

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

    function togglePause() {
        this.paused = !this.paused;
    }

    private function update() {

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

    private function renderAll() {
        this.level.render();
        this.snake.render();
        this.update();
        this.food.render();
    }

    private function reset() {
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

    private function end() {
        clearInterval(this.interval);
        Message.show('Game Over', 'press any key or click to try again');
        $(document).unbind();
        this.initStartEvents();
    }

    private function initStartEvents() {
        $(document)
        .click(() => this.startGame())
        .keypress(() => this.startGame());
    }

}

/**
 * Represents all possible directions and it's key code
 */
class Direction {
    static var left = 37;
    static var up = 38;
    static var right = 39;
    static var down = 40;
}

/**
 * Represents key codes
 */
class KeyCode {
    static var enter = 13;
    static var space = 32;
    static var left = 37;
    static var up = 38;
    static var right = 39;
    static var down = 40;
}

/**
 * Represents each graphic point on the level
 */
class Point {

    var x = 0;
    var y = 0;

    function constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

}

/**
 * The map level area displayed with a canvas
 */
class Level {

    var target : JQuery;
    var canvas : HTMLCanvasElement;
    var context : CanvasRenderingContext2D;

    get width() : number {
        return this.canvas.width;
    }
    get height(): number {
        return this.canvas.height;
    }

    function constructor(target: JQuery) {

        // Create canvas in target element
        this.target = target;
        this.canvas = target.append('<canvas>').children()[0];
        this.context = this.canvas.getContext('2d');

        // Set width/height
        this.canvas.width = this.target.width();
        this.canvas.height = this.target.height();

        this.render();

    }

    function render() {
        this.context.fillStyle = Settings.mapColor;
        this.context.fillRect(0, 0, this.width, this.height);
    }

}

/**
 * The coordinates for the snake's body
 */
class Snake {

    var level: Level;
    var parts = [];

    get head() : Point {
        return this.parts[0];
    }

    get tail() : Point {
        return this.parts[this.parts.length - 1];
    }

    get length() : number {
        return this.parts.length;
    }

    function constructor(level: Level) {
        this.level = level;
        var length = Settings.startSnakeLength;
        for (var i = length - 1; i >= 0; i--) {
            this.parts.push(new Point(i, 0));
        }
    }

    function render() {
        var size = Settings.size,
            context = this.level.context;
        for (var i = 0; i < this.parts.length; i++) {
            var s = this.parts[i];
            context.fillStyle = Settings.snakeColor;
            context.fillRect(s.x * size, s.y * size, size, size);
        }
    }

    // Manipulation

    function grow() {
        var newTail = new Point(this.tail.x, this.tail.y);
        this.parts.unshift(newTail);
    }

    function move(direction : Direction) {

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

    get wallCollision() : boolean {
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

    get tailCollision() : boolean {
        for (var i = 1; i < this.parts.length; i++) {
            var part = this.parts[i];
            if (this.head.x == part.x && this.head.y == part.y) {
                return true;
            }
        }
        return false;
    }

    function foodCollision(food : Food) : boolean {
        var head = this.head;
        return head.x == food.x && head.y == food.y;
    }

}

/**
 * A single point on the for the snake to eat
 */
class Food extends Point {

    var level: Level;

    Food(level: Level) {
        this.level = level;
        var size = Settings.size,
            x = Math.round(Math.random() * (level.width - size) / size),
            y = Math.round(Math.random() * (level.height - size) / size);
        super(x, y);
    }

    function render() {
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

    static show(title: String, subTitle: String) {
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
