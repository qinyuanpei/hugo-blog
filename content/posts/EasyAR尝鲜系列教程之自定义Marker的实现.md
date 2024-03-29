﻿---
description: 本文介绍了使用 EasyAR 增强现实引擎创建自定义 Marker 的过程。首先解释了 EasyAR 的基本流程，包括创建相机设备、图像追踪器和处理帧画面等步骤。然后详细说明了在
  EasyAR 中如何配置自定义 Marker，通过修改 dataset.json 文件并在 Unity3D 中设置相关属性实现自定义 Marker 的创建。最后展示了如何在场景中使用自定义
  Marker 并部署到手机上，实现AR效果。文章指出EasyAR官方API文档仍不完善，但作者将持续关注并解决相关问题，同时暗示将在未来写出更多关于自定义脚本和功能的内容。
slug: 1156673678
abbrlink: 1156673678
categories:
- Unity3D
date: 2015-11-03 10:23:14
tags:
- 增强现实
- AR
- Unity3D
- 教程
title: EasyAR 尝鲜系列教程之自定义 Marker 的实现
---

各位朋友大家好，欢迎大家关注我的博客，我是**秦元培**，我的博客地址是[http://qinyuanpei.com](http://qinyuanpei.com "秦元培")。通过本系列第一篇文章，我们初步了解了 EasyAR 这个增强现实引擎，这次我们来尝试自己定义一个 Marker，这样我们就可以用自己喜欢的图片来作为 Marker。因为目前 EasyAR 文档并不完善，所以下面的这些内容可能更多的是我个人的尝试和探索。如果大家对此感兴趣的话继续往下看否则就不要往下看了，因为我担心在官方正式文档出来以后大家可能会骂我啊。好了，对这个话题感兴趣的朋友就请继续往下看吧！

<!--more-->

# EasyAR 的基本流程
首先我们来看看官方给出的一张 EasyAR 的基本流程示意图：
![EasyAR基本流程示意图](https://ww1.sinaimg.cn/large/4c36074fly1fzix180mu7j20g0057dft.jpg)
在这张流程图，当中作为开发者的我们此刻需要关注的 Target 这一条线和 Frame 这条线。前者对应的是如何将普通的图片如.jpg、.png 配合 JSON 文件转化为系统可以识别的 Target，后者对应的是我们在识别到 Target 后要去处理哪些逻辑。在官方文档中我们可以找到这样一段话：
* **创建相机设备、图像追踪器和增强对象（Create CameraDevice and ImageTracker and Augmenter objects）**.
* **打开相机设备（Open CameraDevice）.**
* **给相机设备附加图像追踪器（Attach ImageTracker to CameraDevice）**.
* **开始执行相机设备和图形追踪器的相关逻辑（Start CameraDevice and ImageTracker）**.
* **获得从图像追踪器增强后的帧画面（New frame using Augmenter from ImageTracker）**.
* **绘制视频和其它的内容（Draw video background and other stuffs）**.

这段话基本上就是 EasyAR 流程示意图的全面解读了，所以我们学习 EasyAR 可以从这个基本流程来入手，了解这个流程能帮助我们更快地理解 API 接口，虽然现在官方的 API 文档依然处在 Debug 状态下，想到这里简直各种不开心啊！

# 创建自定义 Marker
在了解了 EasyAR 的基本流程后，我们就来说说如何在 EasyAR 中创建自定义 Marker 吧！相信使用过 Vuforia 的人都知道要创建一个自定义的 Marker 需要到开发者后台去创建然后下载资源包，这种方式虽然高效、直接，可是因为没有人为地干预过程，所以我们对 AR 引擎内部究竟做了怎样的处理基本上是一无所知的，换句话说我们大部分的工作都是在做黑箱测试。到了 EasyAR 这里，一切就变得特别简单，这一点要给 EasyAR 点个赞。首先在 EasyAR 中配置 Marker 是通过 StreamingAssets 目录下的 dataset.json 这个文件来实现的：
```json
{
  "images" :
  [
    {
      "image" : "mousepad.jpg",
      "name" : "mousepad"
    },
    {
      "image" : "idback.jpg",
      "name" : "idback",
      "size" : [8.56, 5.4],
      "uid" : "todo=uid-string"
    }
  ]
}
```
从这个文件中我们可以发现每一张图片都具有某些不同的属性，从目前博主掌握的资料来看，每张图片最重要的两个属性是 image 和 name。其中 image 是指图片的相对路径，该路径相对于 StreamingAssets 目录，因为我们做 Unity3D 游戏开发的时候都知道这个目录下的资源在编译的时候不会被压缩，当导出 APK 安装包的时候它会被完整的保留到根目录下的 assets 目录中。同样地，name 是指图片的名称即 ID，EasyAR 正是通过这个 ID 来和图片资源关联起来的。比如在默认的 SDK 项目中身份证背面这张图片是和 idback 这个 ID 对应的，如图所示，在这里 Easy 提供了四种存储方案即 Assets、App、Absolute、Json。和官方的人交流的时候说可以支持路径和 Json 字符串两种形式，但是对更加具体的这四种存储方案上的区别和优缺点目前并没有一个确切的说法，所以在这里我们就继续沿用 Assets 这种存储方案吧！我们可以注意到 idback 这张图片和 mousepad 这张图片相比增加了两个属性，即 uid 和 size。size 目前基本可以了解为 Unity3D 中的缩放，因为这个值表示的是在物理空间里的范围大小，单位是米，而我们知道 Unity3D 里默认的单位就是米，所以这个数值可以暂时理解为 Unity3D 里的缩放，它对应到下图里的 Size，我已经用红色字体标示出来。对于 uid 这个属性嘛，既然配置文件里都有 todo 标识出来了，那么我们就姑且认为这是一个暂时没有启用的属性值吧！


![配置文件和ImagTarget的对应关系](https://ww1.sinaimg.cn/large/None.jpg)

好了，下面我们来具体看看如何创建一个自定义 Markder。
* 首先我们在 StreamingAssets 目录中添加一张图片 ziying.jpg，然后在 dataset.json 文件中增加该图片的信息。此时 ziying.jpg 的位置是在 StreamingAssets 根目录下。如果我们希望把它放在一个自定义的文件夹中，如 StreamingAssets/ziying 目录下，则需要将 ziying 的 image 属性值改为 ziying/ziying.jpg，以此类推。

```json
{
  "images" :
  [
    {
      "image" : "mousepad.jpg",
      "name" : "mousepad"
    },
    {
      "image" : "ziying.jpg",
      "name" : "ziying"
    },
    {
      "image" : "idback.jpg",
      "name" : "idback",
      "size" : [8.56, 5.4],
      "uid" : "todo=uid-string"
    }
  ]
}
```
* 在 Materials 目录下新建一个材质，然后找到 ziying.jpg 将其作为该材质的纹理贴图。
* 在场景中找到 ImageTargetDataSet-idback 节点，修改其附加的 SimpleImageTargetBehaviour 脚本下的 Name 属性，将其修改为 ziying，同时将第二步创建的材质赋给 ImageTargetDataSet-idback 节点。此时场景效果如图所示，这意味着我们使用手机摄像头来扫描这张图片就可以看到场景中的这个模型啦！

![自定义Markder效果](https://ww1.sinaimg.cn/large/None.jpg)

* 好了，现在编译这个项目并部署到手机上可以得到我们期望的结果，哈哈，慕容紫英站在桌面上和我一起玩对一个仙剑迷来说是不是特别有趣呢？

![站在手机上的慕容紫英](https://ww1.sinaimg.cn/large/4c36074fly1fz68j4zrs5j20dc0m8al9.jpg)


# 总结
到目前为止，EasyAR 官方还没有给出一个完整的 API 文档，所以我们目前能做的研究依然十分有限，在本文中涉及到的部分没有解决的问题，博主会在官方给出文档后第一时间给予解决，希望大家继续关注我的博客！我们现在使用的都是 SDK 中现成的脚本，如果我们希望自己来设计脚本来满足自己的要求实现某些定制的功能或者是想用原生代码来减少 Unity3D 这类游戏引擎带来的性能上的损耗以及实现播放视频的功能等等。这些内容博主在稍后会陆续写出来，好了，今天的内容就是这个样子啦！希望大家喜欢。