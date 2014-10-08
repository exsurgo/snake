import 'dart:html';
import 'dart:math';
import 'dart:async';

/**
 * Defines global game settings
 */
class Settings {
  static final foodColor = 'orange';
  static final snakeColor = 'green';
  static final mapColor = 'white';
  static final size = 20;
  static final startSpeed = 15;
  static final speedIncrement = 1;
  static final maxSpeed = 40;
  static final startSnakeLength = 8;
  static final scoreMultiplier = 3;
}

/**
 * Initialized the game and all other classes
 */
class Game {

  // UI elements
  Element scoreBoard;
  Element content;

  // Game objects
  Level level;
  Snake snake;
  Food food;

  // State
  int score = 0;
  int speed = Settings.startSpeed;
  int direction;
  Timer interval;
  int over = 0;
  bool paused = false;

  // Event subscriptions
  StreamSubscription docClick;
  StreamSubscription docKeyDown;

  Game() {

    // Create elements
    document.body.append(new Element.html('''
      <div id="main">
        <div id="header">
          <span id="score-board"></span>
        </div>
        <div id="content"></div>
      </div>
    '''));
    scoreBoard = querySelector('#score-board');
    content = querySelector('#content');

    // Create map level in content area
    level = new Level(content);

    // Display welcome message
    new Message('Welcome to Snake Dart', 'press any key or click to start');

    _initStartEvents();

  }

  startGame() {

    // Key events
    _clearDocEvents();
    document.onKeyDown.listen((e) {

      var key = e.keyCode;

      // Change direction
      if (key == Direction.left ||
          key == Direction.up ||
          key == Direction.right ||
          key == Direction.down)
      {
        direction = key;
        e.preventDefault();
      }

      // Pause
      else if (e.keyCode == KeyCode.enter || e.keyCode == KeyCode.space) {
        togglePause();
      }

    });

    // Restart on click
    this.level.canvas.onClick.listen((e) {
      paused = true;
      if (window.confirm('Are you sure you want to restart?')) {
        paused = false;
        startGame();
      }
    });

    _reset();
    Message.remove();

  }

  togglePause() {
    paused = !paused;
  }

  _update() {

    if (paused) return;

    var head = snake.head;

    // Move snake one point
    snake.move(direction);

    // Wall/Tail collision, Game Over!
    if (snake.wallCollision || snake.tailCollision) {
      if (over == 0) _end();
      over++;
    }

    // Food collision
    if (snake.foodCollision(food)) {

      // Add food and grow snake
      this.food = new Food(level);
      var tail = new Point(head.x, head.y);
      snake.parts.add(tail);

      // Increase speed
      if (speed <= Settings.maxSpeed) speed += Settings.speedIncrement;
      interval.cancel();
      interval = new Timer.periodic(new Duration(milliseconds: (1000 / speed).round()), (e) {
        _renderAll();
      });

      // Display score, higher scores for faster speeds
      score += Settings.scoreMultiplier * ((speed - Settings.startSpeed) + 1);
      scoreBoard.text = 'Score: ' + score.toString();

    }

  }

  _animate() {
    if (interval != null) interval.cancel();
    interval = new Timer.periodic(new Duration(milliseconds: (1000 / speed).round()), (e) {
      _renderAll();
    });
  }

  _renderAll() {
    window.animationFrame.then((e) {
      level.render();
      snake.render();
      _update();
      food.render();
    });
  }

  _reset() {
    snake = new Snake(level);
    food = new Food(level);
    direction = Direction.right;
    scoreBoard.text = 'Score: 0';
    over = 0;
    speed = Settings.startSpeed;
    if (interval != null) interval.cancel();
    interval = new Timer.periodic(new Duration(milliseconds: (1000 / speed).round()), (e) {
      _renderAll();
    });
    score = 0;
  }

  _end() {
    interval.cancel();
    new Message('Game Over', 'press any key or click to try again');
    _clearDocEvents();
    _initStartEvents();
  }

  _initStartEvents() {
    docClick = document.onClick.listen((e) => startGame());
    docKeyDown = document.onKeyPress.listen((e) => startGame());
  }

  _clearDocEvents() {
    if (docClick != null) docClick.cancel();
    if (docKeyDown != null) docKeyDown.cancel();
  }

}

/**
 * Represents all possible directions and it's key code
 */
class Direction {
  static int left = 37;
  static int up = 38;
  static int right = 39;
  static int down = 40;
}

/**
 * Represents key codes
 */
class KeyCode {
  static int enter = 13;
  static int space = 32;
  static int left = 37;
  static int up = 38;
  static int right = 39;
  static int down = 40;
}

/**
 * Represents each graphic point on the level
 */
class Point {
  int x;
  int y;
  Point([ this.x = 0, this.y = 0 ]);
}

/**
 * The map level area displayed with a canvas
 */
class Level {

  Element target;
  CanvasElement canvas;
  CanvasRenderingContext2D context;

  int get width => canvas.width;
  int get height => canvas.height;

  Level(this.target) {

    // Create canvas in target element
    canvas = new CanvasElement();
    target.append(canvas);
    context = canvas.getContext('2d');

    // Set width/height
    canvas.width = target.clientWidth;
    canvas.height = target.clientHeight;

    render();

  }

  render() {
    context.fillStyle = Settings.mapColor;
    context.fillRect(0, 0, width, height);
  }

}

/**
 * The coordinates for the snake's body
 */
class Snake {

  Level level;
  List<Point> parts = [];

  Point get head => parts.first;
  Point get tail => parts.last;

  int get length => parts.length;

  Snake(Level this.level) {
    var length = Settings.startSnakeLength;
    for (var i = length - 1; i >= 0; i--) {
      parts.add(new Point(i, 0));
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
    parts.insert(0, newTail);
  }

  move(int direction) {

    var x = head.x,
        y = head.y;

    if (direction == Direction.right) x++;
    else if (direction == Direction.left) x--;
    else if (direction == Direction.up) y--;
    else if (direction == Direction.down) y++;
    var tail = parts.last;
    parts.removeLast();
    tail.x = x;
    tail.y = y;
    parts.insert(0, tail);

  }

  // Collision detection

  bool get wallCollision  {
    var width = level.width,
        height = level.height,
        size = Settings.size,
        x = head.x,
        y = head.y;
    return x >= width / size ||
           x <= -1 ||
           y >= height / size ||
           y <= -1;
  }

  bool get tailCollision {
    for (var i = 1; i < parts.length; i++) {
      var part = parts[i];
      if (head.x == part.x && head.y == part.y) {
        return true;
      }
    }
    return false;
  }

  bool foodCollision(Food food) {
    return head.x == food.x && head.y == food.y;
  }

}

/**
 * A single point on the for the snake to eat
 */
class Food extends Point {

  Level level;

  Food(this.level) : super() {
    var size = Settings.size,
        rand = new Random();
    this.x = rand.nextInt(((level.width - size) / size).round());
    this.y = rand.nextInt(((level.height - size) / size).round());
  }

  render() {
    var size = Settings.size,
    context = this.level.context;
    context.fillStyle = Settings.foodColor;
    context.fillRect(x * size, y * size, size, size);
  }

}

/**
 * Displays a modal message to user
 */
class Message {

  Message(String title, String subTitle) {
    document.body.append(new Element.html('''
      <div id="message">
        <div id="message-modal"></div>
        <div id="message-panel"><h1>$title</h1><br/><h4>$subTitle</h4></div>
      </div>
    '''));
  }

  static remove() {
    var message = querySelector('#message');
    if (message != null) {
      message.remove();
    }
  }

}

// Start the game
main() {
  var game = new Game();
}
