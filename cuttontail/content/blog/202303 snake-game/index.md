---
title: "如何用JavaScript实现贪吃蛇游戏"
date: 2023-03-08T04:43:06+08:00
lastmod: 
tags: ["project", "javascript"]
summary: "JavaScript的练习项目，实现贪吃蛇游戏。"
slug: how-to-build-a-snake-game-in-javascript
---

我们都玩过贪吃蛇游戏，在写出一个贪吃蛇游戏前，先复习一下游戏的玩法：
1. 贪吃蛇向食物格移动，用方向键控制贪吃蛇的移动方向。
2. 每吃下一个食物格，贪吃蛇的身体会增长一格。
3. 当贪吃蛇碰到游戏四周的边界线，或者咬到自己的身体，则游戏结束。

- Live Demo: https://mia-snake-game.netlify.app/
- Source Code: https://github.com/miawithcode/snake-game

## Prerequisite
这篇博文假设你已经学过JavaScript中的：
- Array
- Object
- HTML Canvas
- DOM
- `addEventListener()`
- UI Events
- `setTimeout()`

## HTML

写一个JavaScript程序一定会从HTML开始，写出页面的基本骨架，这里会用到HTML5的`<canvas>`标签：
```HTML
<div class="container">
    <canvas id="gameBoard" width="500" height="500"></canvas>
    <div id="scoreDisplay">0</div>
    <button id="restartBtn">Play Again</button>
</div> 
```
- 用`gameBoard`的`<canvas>`来定义一个宽500px，高500px的画布，用JavaScript在画布上绘制贪吃蛇与食物。
- 用`scoreDisplay`的`<div>`来显示当前获得的游戏分数。
- 用`restartBtn`按钮`<button>`重新开始游戏。

## CSS
```CSS
#gameBorad{
    border: 3px solid;
}
```
只有「**添加画布的边框**」这件事是最重要的，因为玩家需要看到贪吃蛇不能碰到的“四个墙壁”，其他元素的样式可加可不加。

## JavaScript
第一件事，声明需要的变量。
1. 选中JavaScript中的元素：
    ```JavaScript
    const gameBoard = document.querySelector("#gameBoard");
    const context = gameBoard.getContext("2d");

    const scoreDisplay = document.querySelector("#scoreDisplay");
    const restartBtn = document.querySelector("#restartBtn");
    ```
    - 选中`<canvas>`元素，创建`context`对象。`getContext("2d")`对象是内建的 HTML5 对象，可以绘制各种图形。
    - 选中分数显示`scoreDisplay`和重启按钮`restartBtn`。

2. 声明游戏画布的宽度与高度：
    ```JavaScript
    const gameWidth = gameBoard.width;
    const gameHeight = gameBoard.height;
    ```

3. 声明颜色，在画布上绘制图形时使用：
    ```JavaScript
    const boardBackground = "#ffffff";
    const snakeColor = "#53b096";
    const snakeBorder = "#000000";
    const foodColor = "#d44444";
    ```
4. 声明其他变量：
    ```JavaScript
    const unitSize = 25;

    let running = false;

    let score = 0;
    ```
    - `unitSize`是游戏中的单位，不管是一个食物格的大小，还是贪吃蛇的一个身体部位的大小，包括贪吃蛇移动的速度，都会以`unitSize`为单位，这里设置为25px。
    - `running`表示游戏是否正在运行的状态。
    - `score`表示游戏的分数。
5. 声明移动速度：
    ```JavaScript
    let xVelocity = unitSize; 
    let yVelocity = 0;
    ```
    - `xVelocity`表示每个游戏单位时间x轴移动的速度。
        - 如果`xVelocity`是正数，贪吃蛇向右移动；如果是负数，贪吃蛇向左移动。
        - 一开始设置为一个`unitSize`，表示向右移动一个`unitSize`单位。
    - `yVelocity`表示每个游戏单位时间y轴移动的速度。
        - 如果`yVelocity`是正数，贪吃蛇向下移动；如果是负数，贪吃蛇向上移动。
        - 一开始设置为`0`，表示开始时即不向上移动也不向下移动。
6. 声明食物格的坐标变量：
    ```JavaScript
    let foodX;
    let foodY;
    ```
    - `foodX`是食物格在画布中的`x坐标`。
    - `foodY`是食物格在画布中的`y坐标`。
    - 食物格的坐标会用函数`createFood()`随机生成。
7. 声明一个对象数组表示贪吃蛇：
    ```JavaScript
    let snake = [
            {x:unisize * 4, y:0},
            {x:unisize * 3, y:0},
            {x:unisize * 2, y:0},
            {x:unisize, y:0},
            {x:0 y:0},
    ]
    ```
    - 定义初始贪吃蛇的长度是5格。
    - 每个对象中的属性是贪吃蛇身体每个部分在画布中的**x坐标**和**y坐标**。

---
声明完变量后，我们给windows窗口添加`addEventListner`监听键盘事件，监听`←↓↑→`方向键是否被按下。如果监听到方向键被按下，则执行`changeDirection()`函数改变贪吃蛇移动的方向，这个函数会在稍后被定义。

```JavaScript
window.addEventListener("keydown", changeDirection);
```

给`restartBtn`按钮添加`addEventListener`监听鼠标事件，当按钮被点击时，执行`restartGame()`函数，在稍后也会被定义。
```JavaScript
restartBtn.addEventListener("click", restartGame);
```

调用开始游戏的函数`startGame()`，稍后定义。
```JavaScript
startGame();
```

---
解下来定义我们所有需要的函数。

### The startGame function
```JavaScript
function startGame(){
    running = true;
    scoreDisplay.textContent = score;
    createFood();
    drawFood();
    nextTick();
}
```
- 设置运行状态`running`为`true`，表示游戏开始。
- 将页面上的游戏分数更改为当前获得的游戏分数。
- 依次调用`createFood()`和`drawFood()`和`nextTick()`函数。

### The nextTick function
`nextTick()`是每个游戏时间单位都会做的事情。
 ```JavaScript
 function nextTick(){
    if(running){
        setTimeout(() =>{
            clearBoard();
            drawFood();
            moveSnake();
            drawSnake(); 
            checkGameOver(); 
            nextTick(); 
        }, 75)
    }
    else{
        displayGameOver();
    }
}
 ```
- 如果游戏正在进行，设置75毫秒后会做的事情：清除画布，绘制食物格，移动贪吃蛇，绘制贪吃蛇，检查游戏是否结束，再调用一次`nextTick()`函数，这样就能不断重复这些过程，并在游戏结束时停下。
- 如果游戏停止，则在页面上提醒游戏结束。

### The clearBoard function
`clearBoard()`函数用于重画画布。
```JavaScript
function clearBoard(){
    context.fillStyle = boardBackground;
    context.fillRect(0, 0, gameWidth, gameHeight);
}
```
- `fillStyle`设置画布的填充颜色。
- `fillRect(x,y,width,height)`绘制一个画布，从坐标（0,0)开始，宽度和高度都是画布的宽度和高度。

### The creatFood function
`createFood`会随机在画布中找到一个位置放置食物格。
```JavaScript
function createFood(){
    function randomFood(min, max){
        const randNum = Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
        return randNum;
    }
    foodX = randomFood(0, gameWidth - unitSize);
    foodY = randomFood(0, gameWidth - unitSize);
} 
```
- 定义一个内嵌函数`randomFood`生成能被`unitSize`整除的随机数。
    - `(Math.random() * (max - min) + min)`会生成在`min`到`max`之间的**随机数**；
    - 这个`Math.round()`取得这个**随机数**除以`unitSize`的整数，得到这个随机数一共有多少个`UnitSize`；
    - 此时再乘以`UnitSize`，就会得到范围在`min`~`max`之间，并且无论如何都会被`unitSize`整除的随机数。
- 食物格x轴的范围是`0`～`gameWidth - unitSize`，y轴也一样。
- 分别随机生成食物格x轴的值与y轴的值，得到食物格的位置。

### The drawFood function
`drawFood`会在游戏画布中绘制出食物格。
```JavaScript
function drawFood(){
    context.fillStyle = foodColor;
    context.fillRect(foodX, foodY, unitSize, unitSize);
}
```
- `fillStyle`设置图形的填充颜色。
- `fillRect(x,y,width,height)`绘制一个方形，食物格的x轴与y轴，在`createFood()`函数中已经随机生成，食物格的宽度和高度都会是一个`unitSize`。

### The moveSnake function
移动贪吃蛇的思路是：在贪吃蛇的移动方向创建一个贪新的头部方块，并消除尾巴方块，这样看起来就像在移动一样。
```JavaScript
function moveSnake(){
    const head = {x: snake[0].x + xVelocity,
                  y: snake[0].y + yVelocity};
    snake.unshift(head);
    if(snake[0].x == foodX && snake[0].y == foodY){
        score++;
        scoreDisplay.textContent = score;
        createFood();
    }
    else{
        snake.pop();
    }
}
```
- 创建一个新的头部方块并用`Array.unshift()`方法向数组的开头添加该头部。
- 判断贪吃蛇是否吃掉了食物格，如果贪吃蛇头部的坐标和食物格的坐标重合，那么就是吃掉了食物格。此时将游戏分数加1，并再创建一个食物。
- 如果没有吃掉食物格，那么贪吃蛇在移动，用`Array.pop()`会删除数组的最后一个元素，在这里，就是删除贪吃蛇的尾巴方块。

### The drawSnake function
```JavaScript
function drawSnake(){
    context.fillStyle = snakeColor;
    context.strokeStyle = snakeBorder;
    snake.forEach(snakePart => {
        context.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        context.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    })
}
```
- 因为`snake`是一个数组对象，用`forEach`遍历贪吃蛇的每一个身体部位，并画出方块与边框。

### The changeDirection function
```JavaScript
function changeDirection(event){
    const keyPressed = event.keyCode;
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const goingUp = (yVelocity == -unitSize);
    const goingDown = (yVelocity == unitSize);
    const goingRight = (xVelocity == unitSize);
    const goingLeft  = (xVelocity == -unitSize);

    switch(true){
        case (keyPressed == LEFT && !goingRight): 
            xVelocity = -unitSize; 
            yVelocity = 0;
            break;
        case (keyPressed == UP && !goingDown):
            xVelocity = 0;
            yVelocity = -unitSize;
            break;
        case (keyPressed == RIGHT && !goingLeft):
            xVelocity = unitSize;
            yVelocity = 0;
            break;
        case (keyPressed == DOWN && !goinUp):
            xVelocity = 0;
            yVelocity =  unitSize;
            break;
    }
}
```
- `keyCode`表示键盘上的按键键的键码值，`keyPressed`存储当前按下的按键的键码值。方向键的键码值分别是：
    - ←: 37
    - ↑: 38
    - →: 39
    - ↓: 40
- 用描述性的语言`LEFT`、`UP`、`RIGHT`、`DOWN`存储这些键码值。
- `goingUp`、`goingDown`、`goingRight`、`goingLeft`返回的是布尔值。
- 判断`keyPressed == LEFT && !goingRight`的目的是保证按下左方向键←后，可以继续向左向上或向下，当不能向右，因为向右将咬到自己输掉游戏。

### The checkGameOver function
游戏结束有两种情况，一种情况是，贪吃蛇碰到游戏的边框，第二种情况是贪吃蛇咬到自己。
```JavaScript
function checkGameOver(){
    switch(true){
        case (snake[0].x < 0):
            running = false;
            break;
        case (snake[0].x >= gameWidth):
            running = false;
            break;
        case (snake[0].y < 0):
            running = false;
            break;
        case (snake[0].y >= gameHeight):
            running = false;
            break;
    }
    for(let i = 1; i < snake.length; i++){
        if(snake[i].x == snake[0].x && snake[i].y == snake[0].y){
            running = false; 
        }
    }
}
```
- 用switch条件语句判断是否碰到游戏画布的边框：
    - 当贪吃蛇头部的x坐标小于0，说明贪吃蛇碰到了左边的边框，结束游戏。
    - 当贪吃蛇头部的x坐标大于画布的宽度，说明贪吃蛇碰到了右边的边框，结束游戏。
    - 当贪吃蛇头部的y坐标小于0，说明贪吃蛇碰到了上面的边框，结束游戏。
    - 当贪吃蛇头部的y坐标大于画布的高度，说明贪吃蛇碰到了下面的边框，结束游戏。
- 用for循环遍历贪吃蛇身体的每个部分，判断贪吃蛇的头部是否与身体的任何一个部分重合。

### The display GameOver function
在游戏的中间显示“GAME OVER!”
```JavaScript
function displayGameOver(){
    context.font = "50px Shantell Sans";
    context.fillStyle = "black";
    context.textAlign = "center";
    context.fillText("GAME OVER!", gameWidth / 2, gameHeight /2);
    running = false;
}
```

### The restartGame function
```JavaScript
function restartGame(){
    score = 0;
    xVelocity = unitSize;
    yVelocity = 0;
    snake = [
        {x:unitSize * 4, y:0},
        {x:unitSize * 3, y:0},
        {x:unitSize * 2, y:0},
        {x:unitSize, y:0},
        {x:0, y:0},
    ];
    startGame();
}
```
- 将游戏分数和移动速度重置为0。
- 重新创建一个`snake`。
- 调用开始游戏`startGame()`函数。

到此为止，已经成功写出基本的贪吃蛇游戏了。

## 结语
发现贪吃蛇能很好的练习HTML5的Canvas，和JavaScript的DOM与事件，值得反复练习。

## Reference
- [A game of Snake written in JavaScript 🐍](https://www.youtube.com/watch?v=Je0B3nHhKmM)


