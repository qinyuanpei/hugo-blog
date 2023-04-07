---
title: "如何用JavaScript实现秒表计时器"
date: 2023-03-07T18:50:21+08:00
lastmod: 
tags: ["project", "javascript"]
summary: "JavaScript的练习项目，实现开始计时，暂停计时，和重置时间的功能。"
slug: how-to-build-a-stop-watch-in-javascript
---

在这篇文章中会展示如何用JavaScript实现一个秒表计时器，这是我在学习JavaScript过程中的一个练习项目，接下来的内容也只是我作为初学者在练习过程中的理解。

在一个秒表计时器(stop watch)中会有**开始计时**，**暂停计时**，与**重置时间**的功能，同时，我们希望在暂停计时后，还能从当前位置**继续计时**，接下来将实现这些功能。
- Live Demo: https://mia-stop-watch.netlify.app/
- Source Code: https://github.com/miawithcode/stop-watch

## Prerequisite
这篇博文假设你已经学过JavaScript中的：
- Date Object
- DOM
- Arrow Function（箭头函数）
- Callback （回调函数）
- `addEventListener()`
- `setInterval()` & `setTimeout()`
- `Math.floor()`

## Date.now()
在开始写代码前，先了解**Date Object**中的`Date.now()`方法。

`Date.now()`是写在JavaScript内嵌对象Date中的方法，**表示从纪元时间(UTC 1970/01/01)到现在经过的时间**，返回以毫秒为单位的值。 

比如在写这篇文章的当下，`Date.now()`返回的值是：**1677832655179**，意味着从1970/01/01到现在一共流逝了1677832655179毫秒。 

下面是一个简单的例子：
```JavaScript
    const startTime = Date.now();
    console.log("开始计时");

    setTimeout(() => { 
        const elapsedTime = Date.now() - startTime;
        elapsedTime = Math.floor(elapsedTime / 1000);
        console.log(`结束计时，用时： ${elapsedTime}`s, 2000)
    })

    //Expected output: 结束计时，用时：2s
```

- 我们把【打印「开始计时」的时间】赋值给变量`startTime`，然后打印出“开始计时”。
- 用`setTimeout()`方法设置**2秒**后打印「结束计时」语句，同时打印出两条打印语句的间隔时间`elapsedTime`。
- 间隔时间`elapsedTime`等于【当前打印「结束计时」时的时间 `Date.now()`】减去【打印「开始计时」时的时间 `startTime`】
- 间隔时间`elapsedTime`应该为**2s**，因为`setTimeout()`设置的时间是**2s**。

理解了这个例子之后，我们会用这个·`Date.now()`方法表示计时器中涉及的时间。

## HTML
我们从HTML开始，写出计时器中基本的文本与按钮。
```HTML
<div class="container">
    <h1 id="timeDisplay">00:00:00:00</h1>
    <button type="button" id="startBtn">Start</button>
    <button type="button" id="pauseBtn">Pause</button>
    <button type="button" id="resetBtn">Reset</button>
</div>
```
使用了一些非常基础的HTML标签：
- 用一级标题`<h1>`来显示页面上的时间：00:00:00:00
- 用三个按钮`<button>`分别用于start（开始计时），pause（暂停计时），reset（重置时间）。

目前我们不关心CSS样式，只关心计时器的实现，你可以按照自己的喜好设计计时器，接下来用JavaScript实现计时器的功能。

## JavaScript
首先，声明我们需要的变量：

```JavaScript
const timeDisplay = document.querySelector("#timeDisplay");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const resetBtn = document.querySelector("#resetBtn");

let startTime = 0;
let elapsedTime = 0;
let paused = true;
let intervallId;
let hours = 0;
let minutes = 0;
let seconds = 0;
let miliseconds = 0;
```

- `document.querySelector`选择的是4个HTML中的元素（Element），一级标题和三个按钮。
- `startTime`与`elapsedTime`分别表示**开始时间**与**间隔时间**。
    - 开始时间`startTime`有两种，一种是从 00:00:00:00 开始计时的时间，另一种是暂停后继续计时的开始时间。
    - 间隔时间`elapsedTime`也有两种，一种是`setInterval()`设置的间隔时间，另一种是暂停后继续计时中暂停了多久的间隔时间。
- `paused`是一个布尔值，用于判断当前程序是暂停了，还是正在运行。在一开始时，把`paused`设置成`false`。
- `intervalId`是`setInterval()`这个timer的id，一开始只声明不赋值。
- `hours`, `minutes`, `seconds`, `miliseconds`分别代表 00:00:00:00 中各自的单位。

### The start button
然后我们实现开始计时的功能：

```JavaScript
startBtn.addEventListener("click", () => {
    if(paused){
            paused = false;
            startTime = Date.now() - elapsedTime;
            intervalId = setInterval(updateTime, 75);
    }
})
```
- 给开始计时的按钮`startBtn`添加**点击**事件，设置点击开始计时的按钮后会执行的程序。
- 检查暂停状态`paused`是否为`true`，如果程序是暂停的，则将暂停状态`paused`设置成`false`，表示计时器是开启的状态。
- 开始计时的时间`startTime`会等于现在的时间`Date.now()`减去间隔时间`elapsedTime`
- 因为接下来会用`setInterval`设置一个重复定时调用的函数，比如每隔1000毫秒调用一次函数，此时的1000毫秒就是`elapsedTime`。
    - 最开始的`elapsedTime`我们在声明变量时已经设置成`0`;
- 用`setInterval()`设置每隔75毫秒调用一次`updateTime()`函数。

### The updateTime function
接下来定义`updateTime()`函数：

1. 我们先看最基础的逻辑，`updateTime()`到底要实现什么：
    ```JavaScript
    function updateTime(){
        elapsedTime = Date.now() - startTime;

        miliseconds = Math.floor(elapsedTime % 1000);
        seconds = Math.floor(elapsedTime / 1000 % 60);
        minutes = Math.floor(elapsedTime / 1000 / 60 % 60);
        hours = Math.floor(elapsedTime / 1000 / 60 / 60 % 60);

        timeDisplay.textContent = `${hours}:${minutes}:${seconds}:${miliseconds}`;
    }
    ```
    - 间隔时间`elapsedTime`等于现在的时间`Date.now()`减去开始计时的时间`startTime`。而这个间隔时间就是我们显示在页面上的时间。
        - 举个例子，我从8:30开始计时，现在的时间是8:35，一共过去了5分钟，那么现在计时器上的时间就应该是5分钟。
    - 由于`Date.now()`返回的是以毫秒为单位的值，那么计算出的间隔时间`elapsedTime`的单位也是毫秒数，我们要把它格式化成00:00:00:00的形式
    - 由于1000毫秒等于1秒，那么每过1000毫秒，秒数就会增加1秒，而毫秒位会归零重新计数，所以用变量`miliseconds`等于`elapsedTime`取余`%`1000的值。秒数，分钟数，时钟数也是这个思路去格式化。
    - 将格式化后的`elapsedTime`显示在HTML页面上。但是此时会有一个问题：在显示时，秒数、分钟数、时钟数有1位数和2位数的情况，我们希望当它们是1位数时，前面会有1个0来组成2位数。

2. 我们在`updateTime()`函数中写一个内嵌函数`formatTime()`，当秒数、分钟数、时钟数是1位数时，在前面添加一个0：

    ```JavaScript
    function formatTime(unit){
        return (("0") + unit).length > 2 ? unit : "0" + unit;
    }
    ```
    - `formatTime()`函数接受一个时间单位作为参数，
    - 判断当`"0"`加上一个时间单位时，这个时间单位的字符串长度是否大于2。
        - 如果`"0" + unit`的字符串长度大于2，说明这是一个2位数的时间单位，只需要返回这个时间单位；
        - 如果`"0" + unit`的字符串小于2，说明这是一个1位数的时间单位，返回`"0" + unit`。
    
3. 在`formateTime()`我们没有考虑`miliseconds`的情况，因为它最多可以有3位数，我们用一个`formatMili()`来单独实现毫秒的格式化：

    ```JavaScript
    function formatMili(unit){
        unit = String(unit);

        switch(unit.length){
            case 1: 
                return "0" + unit;
                break;
            case 2:
                return unit;
                break;
            case 3:
                return unit.slice(0, 2);
                break;
        }
    }
    ```
    - 首先将数字类型的`miliseconds`类型转化为字符串类型，这样才能用`String.length`来判断毫秒数是几位数。
    - 用switch条件语句分别判断当毫秒数是1位数、2位数、3位数时的情况。

4. 完整的`updateTime()`函数的代码是：

    ```JavaScript
     function updateTime(){
        elapsedTime = Date.now() - startTime;

        miliseconds = Math.floor(elapsedTime % 1000);
        seconds = Math.floor(elapsedTime / 1000 % 60);
        minutes = Math.floor(elapsedTime / 1000 / 60 % 60);
        hours = Math.floor(elapsedTime / 1000 / 60 / 60 % 60);

        miliseconds = formatMili(miliseconds);
        seconds = formatTime(seconds);
        minutes = formatTime(minutes);
        hours = formatTime(hours);

        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        function formatTime(unit){
            return (("0") + unit).length > 2 ? unit : "0" + unit;
        }
        function formatMili(unit){
            unit = String(unit);
            switch(unit.length){
                case 1: 
                    return "0" + unit;
                    break;
                case 2:
                    return unit;
                    break;
                case 3:
                    return unit.slice(0, 2);
                    break;
            }
        }
    }
    ```

### The pause button
```JavaScript
pauseBtn.addEventListener("click", () => {
    if(!paused){
        paused = true;
        elapsedTime = Date.now() - startTime;
        clearInterval(intervalId);
    }
})
```
- 给暂停计时的按钮添加点击事件，设置点击暂停计时的按钮后会执行的程序。
- 检查现在是否不是处于暂停状态，即是否是正在计时的状态，如果是，则将`paused`设置成`true`，表示现在是暂停状态。
- 计算暂停了多长时间`eplasedTime`
- 调用clearInterval终止`setInterval()`设置的重复定时任务，即停止更新页面上的时间。

### The reset button
重置时间是一个比较简单的功能，重置就是把所有状态恢复到最开始的状态。

```JavaScript
resetBtn.addEventListener("click", () => {
    paused = true;
    clearInterval(intervalId);
    startTime = 0;
    elapsedTime = 0;
    hours = 0;
    minutes = 0;
    seconds = 0;
    miliseconds = 0;

    timeDisplay.textContent = "00:00:00:00";
})
```
- 把暂停状态`paused`设置成`true`，因为现在没有在计时。
- 调用clearInterval终止`setInterval()`设置的重复定时任务，即停止更新页面上的时间。
- 把所有变量重新设置为`0`
- 将HTML的文本重新设置为00:00:00:00

到此为止，一个秒表计时器的功能已经全部实现。

## 结语
这个project我在学习的时候有很多地方卡壳想不明白，写完这篇博文后发现思路其实非常清晰，看来「**The best way of learning is teaching.**」is so damn true

## Reference
- [Date.now()的解释 - Mozilla](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)
- [A stopwatch written in JavaScript ⏱️](https://www.youtube.com/watch?v=8Nsb9cjmOVA)