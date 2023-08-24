---
categories:
- 编程语言
copyright: true
date: 2023-08-20 12:30:47
description: ''
slug: Practice-Of-SVG-Based-Graphic-Interaction-Solution
tags:
- 前端
- SVG
- 交互
- 探索
title: 基于 SVG 的图形交互方案实践
toc: true
image: /posts/基于-SVG-的图形交互方案实践/water-wave.jpg
---

不知道从什么时候起，人们开始喜欢上数字大屏这种“**花里胡哨**”的东西，仿佛只要用上“**科技蓝**”这样神奇的色调，就可以让一家公司焕然一新，瞬间变得科技感满满。不管数字大屏的实际意义，是用来帮助企业监控和决策，还是为了方便领导参观和视察，抑或是为了向外界展示和宣传。总之，自从数字大屏诞生之后，它始终就没能摆脱其前任“**中国式报表**”那种大而全的宿命。追随着 [ECharts](https://echarts.apache.org/zh/index.html)、[Superset](https://superset.apache.org/)、[FineBI](https://www.finebi.com/)、[DataEase](https://github.com/dataease/dataease) 等数据可视化产品的身影一路走来，你会发现人们在追求“**花里胡哨**”这件事情上永无止境。如今的数据大屏，元素多(表格、视频、2D/2.5D/3D地图)、种类多(图表、报表、流程图)、媒介多(PC、平板、电视、LED)，主打的就是一个眼花缭乱。

![某数据中心设备运行监控示意图](/posts/基于-SVG-的图形交互方案实践/SCADA.png)

当数字大屏的这股时尚潮涌向物联网和工业互联网领域以后，就不免催生出像上面这样的“**数字大屏**”需求，请原谅我使用如此模糊的措辞，因为我实在难以给它一个准确的定义，工艺流程图、设备运行监控图、组态图、SCADA...。也许，这些名称不见得都能做到全面概括，可这些东西的确具备了数字大屏的特征，哪怕这些设备元件、管道阀门在科技蓝配色下违和感十足。作为一名低调的程序员，我一向不喜欢这种粉饰太平的面子工程，所以，当设计师同事拿着设计图找到我的时候，我当时内心是拒绝的：

![基于 HTML5 图片热区特性实现交互的思路](/posts/基于-SVG-的图形交互方案实践/Demo-02.jpg)

也许，此时你内心深处会闪过一丝蔑视，这有什么难度呢？我只需要在图片上叠加若干个透明的 `div`，这样不就可以实现图片特定区域的交互逻辑啦！我承认，这是个非常好的思路，可是在实践过程中你就会发现，`div` 的交互区域通常都是一个标准矩形，而设计师同事通常会使用圆角矩形以及不规则图形来增强设计感。因此，在交互上或多或少会存在一点缺陷，更何况，在 2.5D 的图片设计稿中，其交互区域实际上变成了一个多边形。下面，博主将介绍一种基于 HTML5 图片[热区](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/area)特性实现交互的思路：

```html
<div class="container">
    <img src="Demo-01.jpg" usemap="#imageMap" style="width: 600px; height: 315px">
    <map name="imageMap"></map>
</div>
```
首先，准备一张图片以及一个 `map` 标签，并且这个 `map` 标签通过 `usemap` 属性与这张图片进行了关联。按照上面的示意图，我们定义了两个可交互的区域。其中，区域1是矩形区域，区域2是圆形区域：

```JavaScript
const areas = [{
    key: '半泽直树',
    shape: 'rect',
    coords: [0, 0, 308.5, 315]
}, {
    key: '大和田',
    shape: 'circle',
    coords: [418, 134, 157.5]
}]
```
因为 `area` 标签需要搭配 `map` 标签来使用，所以，我们将通过下面的代码来动态地创建区域，同时为每个区域绑定相应的事件：

```JavaScript
const popup = document.getElementById('popup');
const imageMap = document.getElementsByName('imageMap')[0];

areas.forEach(area => {

    // 创建区域
    let ele = document.createElement('area');
    ele.shape = area.shape;
    ele.coords = area.coords.join(',')
    ele.setAttribute('data-key', area.key);

    // 绑定事件
    ele.onclick = function (e) {
        alert(e.target.dataset.key);
    };
    ele.onmousemove = function (e) {
        popup.innerHTML = `<div class="content">${e.target.dataset.key}</div>`;
        popup.style.left = `${e.x - 75}px`;
        popup.style.top = `${e.y - 45}px`;
        popup.style.display = 'block'
    };
    ele.onmouseover = function (e) {
        popup.style.display = 'display';
    };
    
    // 添加到map标签
    imageMap.appendChild(ele);
})
```
此时，当我们鼠标移动到指定的区域时，就可以触发对应的气泡提示，如下图所示：

{{<codepen id="WNLvYXa" user="qinyuanpei">}}

这个方案相对于纯 `div` 标签的思路要稍微好上一点点，因为 `area` 标签里的 `shape` 属性支持多边形，这意味着不规则区域的交互可以继续进行下去。可这种方案，本质上并没有摆脱“**手工标注**”，你不得不为每一个区域标注好坐标，这对于没有设计感的程序员来说可能是一场折磨，更重要的是，一旦这个方案运用到数字大屏上面，你总要去解决屏幕尺寸变化、全屏/非全屏等一系列问题，显然，这个时候这些区域的坐标都需要重新计算。这个时候，博主就想到了 SVG 这种可缩放的矢量图形，这是一种自描述的标记语言，无论怎么缩放都不会失真。下面是一个简单的 SVG 图片示例，我们可以大致了解到其结构是一个 XML 文件：

{{<codepen id="ExGjrZe" user="qinyuanpei">}}

既然 SVG 中本身就自带着描述位置的坐标信息，那么，我们是不是可以基于 SVG 来实现相应的交互逻辑呢？下面我们以一张中国地图为例来验证这个想法：

![](/posts/基于-SVG-的图形交互方案实践/China.svg)

OK，我们希望实现什么样的交互效果呢？当鼠标移动到指定的省份时，该省份会变成红色高亮状态，并且会在鼠标位置触发气泡提示。具体怎么做呢？首先，我们来准备下面的 HTML 结构：

```html
<div id="popup" class="rectangle" style="display: none;"></div>
<div class="container"></div>
```

接下来，我们通过脚本来加载 SVG 图片，同时为其绑定相关事件：

```JavaScript
const popup = document.getElementById('popup');

fetch('China.svg')
    .then(res => res.text())
    .then(text => {
        const container = document.getElementsByClassName('container')[0];
        container.innerHTML = text;

        // 允许SVG交互
        const svg = document.getElementsByTagName('svg')[0];
        svg.setAttribute('pointer-events', 'cursor');

        // 为每一个路径绑定事件
        const paths = svg.childNodes[0].childNodes;
        for (var i = 0; i < paths.length; i++) {
            paths[i].onclick = function (e) {
                alert(`${e.target.id}`)
            };
            paths[i].onmouseover = function (e) {
                e.target.setAttribute('fill', 'red');
                popup.innerHTML = `<div class="content">${e.target.id}</div>`
                popup.style.left = `${e.x - 75}px`;
                popup.style.top = `${e.y - 45}px`;
                popup.style.display = 'block'
            };
            paths[i].onmouseout = function (e) {
                e.target.setAttribute('fill', '#eee');
                popup.style.display = 'none'
            };
        }
    })
```
在这个示例中，每一个省份对应着 SVG 中的一个 `path` 节点，因此，我们只需要在加载完 SVG 以后再去遍历这些节点即可。可能大家会有疑问，为什么这里不用 `img`、`embed` 或者 `object` 这些标签来承载一个 SVG 图形呢？因为这样我们是没有办法访问 `svg` 标签及其子节点的。现在，我们就可以看到下面的效果：

{{<codepen id="abPOXrr" user="qinyuanpei">}}

这两种方案，你更喜欢哪一种呢？从程序员的角度来看，我更喜欢 SVG，因为 XML 这种格式不管对人还是机器都相当友好。其实，这篇博客写到这里，技术上该探索的可能性业已完成，现实中更多的挑战往往是非技术性因素，譬如，如何让设计师同事适应稍显平庸、朴素的矢量图格式。当然，从今天这篇文章的思路向外延伸，无论数据大屏如何错综复杂，终归跳不出 DOM、Canvas、WebGL、SVG 这些知识体系，特别是当我们在处理布局编辑器/低代码、地图、流程图、工作流...这一类问题时，我们面对的场景其实是非常相似的，因为这里或多或少都会涉及到拖拽/平移、缩放、旋转这些常规操作，可偏偏这些从来都是最难搞的部分，不是吗？




