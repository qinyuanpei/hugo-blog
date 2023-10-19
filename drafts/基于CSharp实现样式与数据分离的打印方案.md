---
categories:
- 编程语言
copyright: true
date: 2023-09-20 12:30:47
description: ''
slug: A-Printing-Scheme-For-Separating-Style-and-Data-Based-on-CSharp
tags:
- 打印
- PrintDocument
- WebView2
- 模板引擎
title: 基于 C# 实现样式与数据分离的打印方案
toc: true
image: /posts/基于CSharp实现样式与数据分离的打印方案/pexels-suzy-hazelwood-1999352.jpg
---
对于八月份的印象，我发现大部分都留给了出差。而九月初出差回来，我便立马投入了新项目的研发工作。因此，无论是中秋节还是国庆节，在这一连串忙碌的日子里，无不充满着仓促的气息。王北洛说，“**活着不就是仓促，哪里由得了你我**”。最近，我一直在忙着搞打印，我时常怀疑在“**数字化转型**”这件事情上，人们的口号大于实质，否则，人们便不会如此热衷于打印单据，虽然时间已过去许多年，可有些事情似乎从未改变过，无论是过去的 [FastReport](https://www.fastreportcn.com/)、[FineReport](https://www.finereport.com/)，还是如今的 [PrintDocument](https://learn.microsoft.com/zh-cn/dotnet/api/system.drawing.printing.printdocument?view=windowsdesktop-7.0) 以及基于 Web 的打印方案，它们只是形式在变化而已，真正的本质并未改变，就像业务可以从线下转移到线上一样，可人们试图控制和聚合信息流的意愿从未小腿。在变与不变这两者间，我们总强调“**适应**” 和 “**向前看**”，可每个人都在有意无意地，试图向别人兜售某种在“**舒适圈**”浸染已久的概念，这一刻，我觉得还是应该多一点变化。所以，我想以 “**样式与数据分离的打印方案**” 为主题，探索一种 “**新**” 的玩法。

# 从 PrintDocument 说起

一切的故事都有一个起点，而对于 C# 或者 .NET 来说，[PrintDocument](https://learn.microsoft.com/zh-cn/dotnet/api/system.drawing.printing.printdocument?view=windowsdesktop-7.0) 始终是打印绕不过去的一个点。虽然，在别人的眼里，打印无非是调用系统 API 向打印机发送指令，可如果考虑到针式、喷墨、激光、热敏...等等不一而足的打印机种类，以及各种尺寸的打印纸、三联单/五联单、小票纸，我觉得这个问题还是蛮复杂的。考虑到篇幅，我不打算在这里科普这些 API 的使用方法，下面这张思维导图展示了 PrintDocument 所具备的关于 “**打印**” 的能力。从这个角度来看，打印需要考虑的事情何其纷扰耶，甚至你还要考虑打印机缺/卡纸、切刀打印机是否正确地切割了纸张...等等的问题。此前，网络上流传着一个段子，大意是有人问如何解决打印时产生的空白页。此时，在职场打拼多年的前辈会语重心长地告诉你，只需要将其打印出来然后丢掉其中的空白页😺。

![PrintDocument 思维导图](/posts/基于CSharp实现样式与数据分离的打印方案/PrintDocument.png)

相信大家都见过类似下面这样的单据或者小票：

![某公司公路出库单及华润万家购物小票](/posts/基于CSharp实现样式与数据分离的打印方案/20230922172720.png)

通常情况下，如果使用 C# 中的 PrintDocument 来实现打印，其基本思路是构造一个 PrintDocument 实例，同时注册 PrintPage 事件，而在该事件中，我们可以利用 Graphics 来绘制线条、文字、图片等元素：

```csharp
var printDocument = new PrintDocument();
printDocument.PrintController = new StandardPrintController();

// 设置打印机名称
printDocument.DefaultPageSettings.PrinterSettings.PrinterName = "HP LaserJet Pro MFP M126nw";

// 设置纸张大小为 A5
foreach (PaperSize paperSize in printDocument.DefaultPageSettings.PrinterSettings.PaperSizes)
{
    if (paperSize.PaperName == "A5")
    {
        printDocument.DefaultPageSettings.PaperSize = paperSize;
        break;
    }
}

// 注册 PrintPage 事件
printDocument.PrintPage += async (s, e) =>
{
    // ...
    // 绘制一个二维码
    var qrCodeWidth = 100;
    var qrCodeName = Guid.NewGuid().ToString("N");
    var qrCodePath = PathSourcecs.CaptureFace + @"\" + qrCodeName + ".png";
    QRCodeByZxingNet.NewQRCodeByZxingNet(qrCodePath, orderSaHwVo.saRecordId, qrCodeWidth, qrCodeWidth, ImageFormat.Png, BarcodeFormat.QR_CODE);
    var image = System.Drawing.Image.FromFile(qrCodePath);
    args.Graphics.DrawImage(image, marginLeft, totalHeight);
    // ...
};
```

当然，你还可以利用 BeginPrint 和 EndPrint 这组事件来处理打印开始和打印结束的逻辑，这里我们按下不表，下面是打印以及打印预览的代码实现，可以发现，这一切在微软 API 的加持下非常简单：

```csharp
// 打印
printDocument.Print()

// 打印预览
var printPreviewDialog = new PrintPreviewDialog();
printPreviewDialog.Document = printDocument;
printPreviewDialog.TopLevel = true;
printPreviewDialog.ShowDialog();
```

如下图所示，下面是通过 PrintPreviewDialog 组件实现的打印预览效果：

![通过 PrintPreviewDialog 实现打印预览](/posts/基于CSharp实现样式与数据分离的打印方案/PrintPreview.png)

如果从这个角度来审视 PrintDocument，它毫无疑问是一个非常完美的解决方案！

# 样式与数据分离的尝试

历史经验告诉我们，凡事没有绝对，使用这个方案来打印最大的问题在于，样式和数据没有分离开来，甚至严重耦合在一起。这就导致每次只要更换打印格式，整个代码基本上等于全部重写。时过境迁，一个项目里存在着各种版本的 PrintPage 代码更是家常便饭。作为一名程序员，我一直呼吁大家努力去抓住那些不变的东西，可对于人生而言，适应变化、拥抱变化、创造变化的心态显然更具有普适性。所以，这世上是否会有一种 “**以不变应万变**” 的方案来解决这个问题呢？下面，我们一起来探索 PrintDocument 样式与数据的分离。



# 本文小结






