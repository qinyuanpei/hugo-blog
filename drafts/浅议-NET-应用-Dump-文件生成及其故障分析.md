---
abbrlink: 2478147871
categories:
- 开发工具
copyright: true
date: 2022-12-16 11:53:29
description: ''
slug: A-Brief-Talk-On-The-Dump-File-For-.NET-Application
tags:
- Demp
- 故障
- 性能
title: 浅议 .NET 应用 Dump 文件生成及其故障分析
toc: true
image: /posts/浅议-NET-应用-Dump-文件生成及其故障分析/tree-gf51df08e8_1280.jpg
---
作为一名程序员，我最难以接受的行业现状是：人类提需求或者是 Bug 的门槛低到你无法想象。且不说在我们编程界有一本书叫做 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)，实际工作中能按照 “背景-过程-结果” 这个思路描述问题的人是非常稀缺的。如果把程序员解决问题的过程比作福尔摩斯探案，除了关心 “5W” 这种基本要素以外，程序员更希望别人能提供丰富的线索。毕竟，神探夏洛克每次破案不总是靠着那 1% 的灵感，他更多的是靠着梳理记忆宫殿里的那些蛛丝马迹。对程序员而言，这种线索可以是日志或者是 Dump 文件。如果说，侦探破案讲究一个保护现场，那么，程序员眼中的案发现场，其实就是指可以重复推演的一系列步骤。所以，请不要再指责程序员们傲慢，关键是你要能让对方相信这一切是可以重复推演的，而不是丢给对方一个近乎玄学的事故现场。我相信，程序员们都是热爱科学的三好青年，讲道理、摆事实，是这个群体最朴实无华的是非观。日志问题我们已经讲过无数次，今天这篇文章我们来聊聊内存转储—— Dump 的是非曲直。

# .NET 应用 Dump 的生成

从人类发明照相机、按下快门键的那一刻开始，彼时彼刻的状态将被永久地记录在胶卷上。诚然，后来我们有了数码相机、数字影像，这一切无非是载体的变换。对于计算机里的程序而言，我们有内存、软盘、硬盘、闪存、光盘等等不同形式的载体，我们把应用程序在内存中某一时刻的状态的快照称之为内存转储，即：Dump 文件。它记录着程序在某一时刻的“案发现场”。物理学中有薛定谔的猫的概念，我们该如何得知某一时刻这只猫的状态呢？答案就是给它拍照生成一张快照，这就是 Dump 的实际含义。

## Windows 平台

在 Windows 平台下，如果你希望生成一个 Dump 文件，最为直观的方式是，使用任务管理器中的“创建转储文件”命令，如下图所示：

![通过任务管理器生成 Dump 文件](/posts/浅议-NET-应用-Dump-文件生成及其故障分析/Create-Dump-Via-Task-Manager.png)

当然，除了这种方法以外，你还可以通过修改注册表来实现系统级的异常上报，如下图所示：

![通过注册表生成 Dump 文件 A](/posts/浅议-NET-应用-Dump-文件生成及其故障分析/Create-Dump-Via-Register-Editor.png)

此时，当应用程序发生异常时，就可以看到有对应的 Dump 文件生成：

![通过注册表生成 Dump 文件 B](/posts/浅议-NET-应用-Dump-文件生成及其故障分析/Create-Dump-Via-Register-Editor-02.png)

除此以外，微软还提供了两个工具 [dotnet-dump](https://learn.microsoft.com/zh-cn/dotnet/core/diagnostics/dotnet-dump) 和 [ProcDump](https://learn.microsoft.com/zh-cn/sysinternals/downloads/procdump)，

## Linux 平台

# .NET 应用 Dump 的分析

## 异常分析

## 性能分析

# 本文小结