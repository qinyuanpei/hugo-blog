﻿---
abbrlink: 1397717193
categories:
- 前端开发
date: 2019-04-12 12:37:10
description: 最近项目需要实现报表的自定义设置功能，选择了zTree插件来创建一个功能强大且美观的树形菜单。使用zTree的API简单，通过提供一个DOM节点和JSON数据就能渲染出树形菜单。作者介绍了如何结合节点的编辑、拖拽功能。发现了两个Bug并提供了解决方法。最后讨论了如何存储和获取树形结构的数据，通过递归遍历节点获取关键信息。作者强调前端开发集成到系统中的挑战。
slug: 1397717193
tags:
- JavaScript
- zTree
- 前端
title: zTree 删除/拖拽子节点保留父节点分组样式
---

最近需要在项目中实现报表的自定义设置功能，即用户可以针对报表新建自定义分组，分组间可以互相嵌套，分组及分组内的报表需要支持拖拽排序、编辑、删除……相信听到这里，你大概明白我要实现一个什么样的功能了。不错，我要实现一个集美观、功能于一身的树形菜单。本着“不要重复制造轮子”的原则，我在考察了 JQuery EasyUI、layui、Bootstrap、Kendo UI 等不同框架提供的“树形菜单”组件以后，最终选择了[zTree](http://www.treejs.cn/v3/main.php#_zTreeInfo)这样一个插件，虽然这个官网看上去相当复古，虽然最终的成品依然被同事吐槽丑，可它的确完美得实现了我想要的功能，是当之无愧的“树形菜单”王者。

zTree 的 API 相当复杂，尤其是属性和事件的种类，简直叫一个繁杂，这是大部分基于 jQuery 插件的一个特点。不过 zTree 的使用还是比较简单的，我们只需要提供一个 DOM 节点，一份 JSON 数据，zTree 就可以帮我们在界面上渲染出一个完整的树形菜单：
```JavaScript 
var data = res.Data;
var zNodes = JSON.parse(data.TreeData);
$.fn.zTree.init($("#reportTree"), setting, zNodes);
```
zTree 的节点是由 JSON 结构来定义的，其基本结构是{name:"节点名称",children:[]}，父子节点采用相同的结构相互嵌套。例如，下面是博主所使用的数据结构：
```JSON
[
  {
    "id": null,
    "name": "全部报表",
    "url": null,
    "pId": null,
    "viewUrl": null,
    "children": [
      {
        "id": null,
        "name": "示例报表A",
        "url": null,
        "pId": null,
        "viewUrl": null,
        "children": [
          {
            "id": null,
            "name": "示例报表B",
            "url": null,
            "pId": null,
            "viewUrl": "/MyReport/List?menuid=38c0e1ce7442419f9e3305a03b819128",
            "children": null
          },
          {
            "id": null,
            "name": "示例报表C",
            "url": null,
            "pId": null,
            "viewUrl": "/MyReport/List?menuid=e88ae4a5c07445a59c2f04ec405e6158",
            "children": null
          }
        ]
      }
    ]
  }
]
```
参考官网上的 DEMO，我们基本上就可以快速上手 zTree，博主这里就是结合了节点的编辑、拖拽这两个功能。不过，按照官网上的 DEMO 会存在两个 Bug，与我们实际的期望有所不同，**其一，是当一个分组下的子节点被全部删除后，这个分组的图标会变成一个子节点的图标；其二，是当个一个分组下的节点被全部拖拽到分组以外的地方，这个分组的图标会变成一个子节点的图标。**这两个 Bug 是由测试小姐姐们发现的，zTree 是我引入到项目中来的，这个 Bug 哪怕跪着都要改完，说多了都是泪啊，下面给出解决方案：
```JavaScript 
function onRemove(e, treeId, treeNode) {
    var zTree = $.fn.zTree.getZTreeObj(reportTreeId);
    var root = zTree.getNodes()[0];
    if (treeNode.isParent) {
        reports = GetReportsByNode(treeNode)
        var parentNode = treeNode.getParentNode();
        if (parentNode != null && (parentNode.children == null || parentNode.children.length == 0)) {
            parentNode.isParent = true;
            parentNode.isOpen = true;
            zTree.updateNode(parentNode);
        }
    }
}

var emptyNode;
function beforeDrop(treeId, treeNodes, targetNode, moveType, isCopy) {
    var zTree = $.fn.zTree.getZTreeObj(reportTreeId);
    for (var i = 0; i < treeNodes.length; i++) {
        var treeNode = treeNodes[i];
        var parentNode = treeNode.getParentNode();
        if (parentNode != null && (parentNode.children == null || parentNode.children.filter(function (s) { return s.name != treeNode.name; }).length == 0)) {
            emptyNode = parentNode;
            break;
        }
    }

    return true;
}

function onDrop(event, treeId, treeNodes, targetNode, moveType, isCopy) {
    var zTree = $.fn.zTree.getZTreeObj(reportTreeId);
    if (emptyNode != null) {
        emptyNode.isOpen = true; emptyNode.isParent = true;
        zTree.updateNode(emptyNode);
        emptyNode = null;
    }
}
```
OK，实际项目中可能需要存储这个树形结构，因为你能想象，用户编辑完这样一个“个性化”的设置以后，我们还要根据这个设置来加载树形菜单，以达到个性化的目的。那么，怎么获得这个树形结构呢，理论上我们只需要通过 zTree.getNodes()方法获得整个树的节点信息，然后将其序列化为 JSON 即可，可实际上 zTree 会在树上附加“冗余”信息，所以，博主的做法是，通过递归来遍历整个树的节点，获取其中的关键信息，这里以 name 字段为例：
```JavaScript 
function GetTreeData(zTree) {
    var data = [];
    for (var i = 0; i < zTree.length; i++) {
        var treeNode = zTree[i];
        if (!treeNode.isParent) {
            var obj = new Object();
            obj.name = treeNode.name;
            data.push(obj)
        } else {
            var obj = new Object();
            obj.name = treeNode.name;
            obj.children = GetTreeData(treeNode.children)
            data.push(obj)
        }
    }

    return data;
}
```
好了，最近接触到都是些零碎的东西，大家都讲究着看看吧，可以说没有什么干货。折腾前端最大的感悟就是，做一个页面其实并不难，真正难的是集成到一个系统里，像 iframe 和 tab 这种“垃圾”的东西，集成到一起就像猜地雷，你永远不知道别人埋了什么坑在里面，以上就是这篇博客啦，晚安！