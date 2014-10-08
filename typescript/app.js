/// <reference path="defs/jquery.d.ts" />
/// <reference path="defs/underscore.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
* Defines global game settings
*/
var Settings = (function () {
    function Settings() {
    }
    Settings.foodColor = 'orange';
    Settings.snakeColor = 'green';
    Settings.mapColor = 'white';
    Settings.size = 20;
    Settings.startSpeed = 15;
    Settings.speedIncrement = 1;
    Settings.maxSpeed = 40;
    Settings.startSnakeLength = 8;
    Settings.scoreMultiplier = 3;
    return Settings;
})();

/**
* Initialized the game and all other classes
*/
var Game = (function () {
    function Game() {
        var _this = this;
        // State
        this.score = 0;
        this.speed = Settings.startSpeed;
        this.over = 0;
        this.paused = false;
        // Page ready
        $(function () {
            // Create elements
            $(document.body).append('<div id="header">' + '<span id="score-board"></span>' + '</div>' + '<div id="content"></div>');
            _this.scoreBoard = $('#score-board');
            _this.content = $('#content');

            // Create map level in content area
            _this.level = new Level(_this.content);

            // Display welcome message
            Message.show('Welcome to Snake TypeScript', 'press any key or click to start');

            _this.initStartEvents();
        });
    }
    Game.prototype.startGame = function () {
        var _this = this;
        // Key events
        $(document).unbind().keydown(function (e) {
            var key = e.keyCode;

            // Change direction
            if (key == 37 /* left */ || key == 38 /* up */ || key == 39 /* right */ || key == 40 /* down */) {
                _this.direction = key;
                e.preventDefault();
            } else if (e.keyCode == 13 /* enter */ || e.keyCode == 32 /* space */) {
                _this.togglePause();
            }
        });

        // Restart on click
        $(this.level.canvas).click(function () {
            _this.paused = true;
            if (confirm('Are you sure you want to restart?')) {
                _this.paused = false;
                _this.startGame();
            }
        });

        this.reset();
        Message.remove();
    };

    Game.prototype.togglePause = function () {
        this.paused = !this.paused;
    };

    Game.prototype.update = function () {
        if (this.paused)
            return;

        var snake = this.snake, head = snake.head;

        // Move snake one point
        snake.move(this.direction);

        // Wall/Tail collision, Game Over!
        if (snake.wallCollision || snake.tailCollision) {
            if (this.over == 0)
                this.end();
            this.over++;
        }

        // Food collision
        if (snake.foodCollision(this.food)) {
            // Add food and grow snake
            this.food = new Food(this.level);
            var tail = new Point(head.x, head.y);
            snake.parts.push(tail);

            // Display score, higher scores for faster speeds
            this.score += Settings.scoreMultiplier * ((this.speed - Settings.startSpeed) + 1);
            this.scoreBoard.text('Score: ' + this.score);

            // Increase speed
            if (this.speed <= Settings.maxSpeed)
                this.speed += Settings.speedIncrement;
            this.animate();
        }
    };

    Game.prototype.animate = function () {
        var _this = this;
        if (this.interval)
            clearInterval(this.interval);
        this.interval = setInterval(function () {
            return _this.renderAll();
        }, 1000 / this.speed);
    };

    Game.prototype.renderAll = function () {
        var _this = this;
        requestAnimationFrame(function () {
            _this.level.render();
            _this.snake.render();
            _this.update();
            _this.food.render();
        });
    };

    Game.prototype.reset = function () {
        this.snake = new Snake(this.level);
        this.food = new Food(this.level);
        this.direction = 39 /* right */;
        this.scoreBoard.text('Score: 0');
        this.over = 0;
        this.speed = Settings.startSpeed;
        this.score = 0;
        this.animate();
    };

    Game.prototype.end = function () {
        clearInterval(this.interval);
        Message.show('Game Over', 'press any key or click to try again');
        $(document).unbind();
        this.initStartEvents();
    };

    Game.prototype.initStartEvents = function () {
        var _this = this;
        $(document).click(function () {
            return _this.startGame();
        }).keypress(function () {
            return _this.startGame();
        });
    };
    return Game;
})();

/**
* Represents all possible directions and it's key code
*/
var Direction;
(function (Direction) {
    Direction[Direction["left"] = 37] = "left";
    Direction[Direction["up"] = 38] = "up";
    Direction[Direction["right"] = 39] = "right";
    Direction[Direction["down"] = 40] = "down";
})(Direction || (Direction = {}));

/**
* Represents key codes
*/
var KeyCode;
(function (KeyCode) {
    KeyCode[KeyCode["enter"] = 13] = "enter";
    KeyCode[KeyCode["space"] = 32] = "space";
    KeyCode[KeyCode["left"] = 37] = "left";
    KeyCode[KeyCode["up"] = 38] = "up";
    KeyCode[KeyCode["right"] = 39] = "right";
    KeyCode[KeyCode["down"] = 40] = "down";
})(KeyCode || (KeyCode = {}));

/**
* Represents each graphic point on the level
*/
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();

/**
* The map level area displayed with a canvas
*/
var Level = (function () {
    function Level(target) {
        // Create canvas in target element
        this.target = target;
        this.canvas = target.append('<canvas>').children()[0];
        this.context = this.canvas.getContext('2d');

        // Set width/height
        this.canvas.width = this.target.width();
        this.canvas.height = this.target.height();

        this.render();
    }
    Object.defineProperty(Level.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Level.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: true,
        configurable: true
    });

    Level.prototype.render = function () {
        this.context.fillStyle = Settings.mapColor;
        this.context.fillRect(0, 0, this.width, this.height);
    };
    return Level;
})();

/**
* The coordinates for the snake's body
*/
var Snake = (function () {
    function Snake(level) {
        this.parts = [];
        this.level = level;
        var length = Settings.startSnakeLength;
        for (var i = length - 1; i >= 0; i--) {
            this.parts.push(new Point(i, 0));
        }
    }
    Object.defineProperty(Snake.prototype, "head", {
        get: function () {
            return this.parts[0];
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Snake.prototype, "tail", {
        get: function () {
            return this.parts[this.parts.length - 1];
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Snake.prototype, "length", {
        get: function () {
            return this.parts.length;
        },
        enumerable: true,
        configurable: true
    });

    Snake.prototype.render = function () {
        var size = Settings.size, context = this.level.context;
        for (var i = 0; i < this.parts.length; i++) {
            var s = this.parts[i];
            context.fillStyle = Settings.snakeColor;
            context.fillRect(s.x * size, s.y * size, size, size);
        }
    };

    // Manipulation
    Snake.prototype.grow = function () {
        var newTail = new Point(this.tail.x, this.tail.y);
        this.parts.unshift(newTail);
    };

    Snake.prototype.move = function (direction) {
        var head = this.head, x = head.x, y = head.y;

        if (direction == 39 /* right */)
            x++;
        else if (direction == 37 /* left */)
            x--;
        else if (direction == 38 /* up */)
            y--;
        else if (direction == 40 /* down */)
            y++;
        var tail = this.parts.pop();
        tail.x = x;
        tail.y = y;
        this.parts.unshift(tail);
    };

    Object.defineProperty(Snake.prototype, "wallCollision", {
        // Collision detection
        get: function () {
            var width = this.level.width, height = this.level.height, size = Settings.size, x = this.head.x, y = this.head.y;
            return x >= width / size || x <= -1 || y >= height / size || y <= -1;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Snake.prototype, "tailCollision", {
        get: function () {
            for (var i = 1; i < this.parts.length; i++) {
                var part = this.parts[i];
                if (this.head.x == part.x && this.head.y == part.y) {
                    return true;
                }
            }
            return false;
        },
        enumerable: true,
        configurable: true
    });

    Snake.prototype.foodCollision = function (food) {
        var head = this.head, food = food;
        return head.x == food.x && head.y == food.y;
    };
    return Snake;
})();

/**
* A single point on the for the snake to eat
*/
var Food = (function (_super) {
    __extends(Food, _super);
    function Food(level) {
        this.level = level;
        var size = Settings.size, x = Math.round(Math.random() * (level.width - size) / size), y = Math.round(Math.random() * (level.height - size) / size);
        _super.call(this, x, y);
    }
    Food.prototype.render = function () {
        var size = Settings.size, context = this.level.context;
        context.fillStyle = Settings.foodColor;
        context.fillRect(this.x * size, this.y * size, size, size);
    };
    return Food;
})(Point);

/**
* Displays a modal message to user
*/
var Message = (function () {
    function Message() {
    }
    Message.show = function (title, subTitle) {
        $(document.body).append('<div id="message">' + '<div id="message-modal"></div>' + '<div id="message-panel"><h1>' + title + '</h1><br/><h4>' + subTitle + '</h4></div>' + '</div>');
    };

    Message.remove = function () {
        $('#message').remove();
    };
    return Message;
})();

// Start the game
var game = new Game();
//# sourceMappingURL=app.js.map
