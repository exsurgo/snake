$traceurRuntime.ModuleStore.getAnonymousModule(function() {
    "use strict";
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
    var Game = function Game() {
        var $__16 = this;
        this.level = null;
        this.snake = null;
        this.food = null;
        this.score = 0;
        this.speed = Settings.startSpeed;
        this.direction = Direction.right;
        this.interval = null;
        this.over = 0;
        this.paused = false;
        $((function() {
            $(document.body).append('<div id="header">' + '<span id="score-board"></span>' + '</div>' + '<div id="content"></div>');
            $__16.scoreBoard = $('#score-board');
            $__16.content = $('#content');
            $__16.level = new Level($__16.content);
            Message.show('Welcome to Snake ES6/Traceur', 'press any key or click to start');
            $__16.initStartEvents();
        }));
    };
    ($traceurRuntime.createClass)(Game, {
        startGame: function() {
            var $__16 = this;
            $(document).unbind().keydown((function(e) {
                var key = e.keyCode;
                if (key == Direction.left || key == Direction.up || key == Direction.right || key == Direction.down) {
                    $__16.direction = key;
                    e.preventDefault();
                } else if (e.keyCode == KeyCode.enter || e.keyCode == KeyCode.space) {
                    $__16.togglePause();
                }
            }));
            $(this.level.canvas).click((function() {
                $__16.paused = true;
                if (confirm('Are you sure you want to restart?')) {
                    $__16.paused = false;
                    $__16.startGame();
                }
            }));
            this.reset();
            Message.remove();
        },
        togglePause: function() {
            this.paused = !this.paused;
        },
        update: function() {
            var $__16 = this;
            if (this.paused)
                return;
            var snake = this.snake,
                head = snake.head;
            snake.move(this.direction);
            if (snake.wallCollision || snake.tailCollision) {
                if (this.over == 0)
                    this.end();
                this.over++;
            }
            if (snake.foodCollision(this.food)) {
                this.food = new Food(this.level);
                var tail = new Point(head.x, head.y);
                snake.parts.push(tail);
                if (this.speed <= Settings.maxSpeed)
                    this.speed += Settings.speedIncrement;
                clearInterval(this.interval);
                this.interval = setInterval((function() {
                    return $__16.renderAll();
                }), 1000 / this.speed);
                this.score += Settings.scoreMultiplier * ((this.speed - Settings.startSpeed) + 1);
                this.scoreBoard.text('Score: ' + this.score);
            }
        },
        animate: function() {
            var $__16 = this;
            if (this.interval)
                clearInterval(this.interval);
            this.interval = setInterval((function() {
                return $__16.renderAll();
            }), 1000 / this.speed);
        },
        renderAll: function() {
            var $__16 = this;
            requestAnimationFrame((function() {
                $__16.level.render();
                $__16.snake.render();
                $__16.update();
                $__16.food.render();
            }));
        },
        reset: function() {
            var $__16 = this;
            this.snake = new Snake(this.level);
            this.food = new Food(this.level);
            this.direction = Direction.right;
            this.scoreBoard.text('Score: 0');
            this.over = 0;
            this.speed = Settings.startSpeed;
            if (this.interval !== undefined)
                clearInterval(this.interval);
            this.interval = setInterval((function() {
                return $__16.renderAll();
            }), 1000 / this.speed);
            this.score = 0;
        },
        end: function() {
            clearInterval(this.interval);
            Message.show('Game Over', 'press any key or click to try again');
            $(document).unbind();
            this.initStartEvents();
        },
        initStartEvents: function() {
            var $__16 = this;
            $(document).click((function() {
                return $__16.startGame();
            })).keypress((function() {
                return $__16.startGame();
            }));
        }
    }, {});
    var Direction = {
        left: 37,
        up: 38,
        right: 39,
        down: 40
    };
    var KeyCode = {
        enter: 13,
        space: 32,
        left: 37,
        up: 38,
        right: 39,
        down: 40
    };
    var Point = function Point(x, y) {
        this.x = x;
        this.y = y;
    };
    ($traceurRuntime.createClass)(Point, {}, {});
    var Level = function Level(target) {
        this.target = target;
        this.canvas = target.append('<canvas>').children()[0];
        this.context = this.canvas.getContext('2d');
        this.canvas.width = this.target.width();
        this.canvas.height = this.target.height();
        this.render();
    };
    ($traceurRuntime.createClass)(Level, {
        get width() {
            return this.canvas.width;
        },
        get height() {
            return this.canvas.height;
        },
        render: function() {
            this.context.fillStyle = Settings.mapColor;
            this.context.fillRect(0, 0, this.width, this.height);
        }
    }, {});
    var Snake = function Snake(level) {
        this.level = level;
        this.parts = [];
        var length = Settings.startSnakeLength;
        for (var i = length - 1; i >= 0; i--) {
            this.parts.push(new Point(i, 0));
        }
    };
    ($traceurRuntime.createClass)(Snake, {
        get head() {
            return this.parts[0];
        },
        get tail() {
            return this.parts[this.parts.length - 1];
        },
        get length() {
            return this.parts.length;
        },
        render: function() {
            var size = Settings.size,
                context = this.level.context;
            for (var i = 0; i < this.parts.length; i++) {
                var s = this.parts[i];
                context.fillStyle = Settings.snakeColor;
                context.fillRect(s.x * size, s.y * size, size, size);
            }
        },
        grow: function() {
            var newTail = new Point(this.tail.x, this.tail.y);
            this.parts.unshift(newTail);
        },
        move: function(direction) {
            var head = this.head,
                x = head.x,
                y = head.y;
            if (direction == Direction.right)
                x++;
            else if (direction == Direction.left)
                x--;
            else if (direction == Direction.up)
                y--;
            else if (direction == Direction.down)
                y++;
            var tail = this.parts.pop();
            tail.x = x;
            tail.y = y;
            this.parts.unshift(tail);
        },
        get wallCollision() {
            var width = this.level.width,
                height = this.level.height,
                size = Settings.size,
                x = this.head.x,
                y = this.head.y;
            return x >= width / size || x <= -1 || y >= height / size || y <= -1;
        },
        get tailCollision() {
            for (var i = 1; i < this.parts.length; i++) {
                var part = this.parts[i];
                if (this.head.x == part.x && this.head.y == part.y) {
                    return true;
                }
            }
            return false;
        },
        foodCollision: function(food) {
            var head = this.head;
            return head.x == food.x && head.y == food.y;
        }
    }, {});
    var Food = function Food(level) {
        this.level = level;
        var size = Settings.size,
            x = Math.round(Math.random() * (level.width - size) / size),
            y = Math.round(Math.random() * (level.height - size) / size);
        $traceurRuntime.superCall(this, $Food.prototype, "constructor", [x, y]);
    };
    var $Food = Food;
    ($traceurRuntime.createClass)(Food, {render: function() {
        var size = Settings.size,
            context = this.level.context;
        context.fillStyle = Settings.foodColor;
        context.fillRect(this.x * size, this.y * size, size, size);
    }}, {}, Point);
    var Message = function Message() {};
    ($traceurRuntime.createClass)(Message, {}, {
        show: function(title, subTitle) {
            $(document.body).append('<div id="message">' + '<div id="message-modal"></div>' + '<div id="message-panel"><h1>' + title + '</h1><br/><h4>' + subTitle + '</h4></div>' + '</div>');
        },
        remove: function() {
            $('#message').remove();
        }
    });
    var game = new Game();
    return {};
});
//# sourceURL=traceured.js