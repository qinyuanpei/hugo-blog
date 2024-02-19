---
categories:
- 编程语言
copyright: true
date: 2023-09-20 12:30:47
description: 这篇文章讨论了作者在忙碌工作生活中对打印技术和样式与数据分离的探索。作者提到了使用PrintDocument进行打印的基本思路和代码实现，以及尝试通过HTML模板来实现样式与数据分离的方案。作者还介绍了利用WebView2组件将HTML转换为图片或PDF文件，以及探讨了使用浏览器自带打印方案和RDLC报表设计的方法。最后，作者总结了这篇文章内容的零散性和对打印技术的看法。
image: /posts/基于CSharp实现样式与数据分离的打印方案/pexels-suzy-hazelwood-1999352.jpg
slug: A-Printing-Scheme-For-Separating-Style-and-Data-Based-on-CSharp
tags:
- 打印
- PrintDocument
- WebView2
- 模板引擎
title: 基于 C# 实现样式与数据分离的打印方案
toc: true
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

历史经验告诉我们，凡事没有绝对，使用这个方案来打印最大的问题在于，样式和数据没有分离开来，甚至严重耦合在一起。这就导致每次只要更换打印格式，整个代码基本上等于全部重写。时过境迁，一个项目里存在着各种版本的 PrintPage 代码更是家常便饭。作为一名程序员，我一直呼吁大家努力去抓住那些不变的东西，可对于人生而言，适应变化、拥抱变化、创造变化的心态显然更具有普适性。所以，这世上是否会有一种 “**以不变应万变**” 的方案来解决这个问题呢？所以，下面来探索打印样式与数据的分离问题。

![通过 HTML 模板实现打印](/posts/基于CSharp实现样式与数据分离的打印方案/PrintByTemplate.png)

作为一个前/后端都写的伪・全栈工程师，我有时候甚至觉得，人类或许是是一遍遍地重复循环着自身，从原生到 Web 的演化过程中，我看到的是人们周而复始地在用新技术 “**重制**” 过去的旧业务。譬如，前端同样有单据打印的需求，通常可以使用 vue-print-nb 或者 vue3-print-nb 来实现。诚然，前端的打印方案自始至终都摆脱不了浏览器自身的特性限制，可我们还是能从中找到某种共性。如图所示，在此前的前端项目中，我使用 EJS 这个模板引擎来编写和渲染 HTML模板，再通过 vue-print-nb 将其打印出来。所以，在这里我想继续沿用这个方案，下面是整体的实现思路：

![实现样式与数据分离的打印方案](/posts/基于CSharp实现样式与数据分离的打印方案/ThoughtsOfPrint.drawio.png)

如图所示，我们的思路是利用此前博主介绍过的 [Liquid](/posts/3742212493/) 来渲染 HTML 模板。此时，打印样式可以通过前端三件套搞定，我们只需要在模板文件中完成字段绑定即可，这样就可以实现数据和样式的分离。当然，这一切还不足以传递给 PrintDocument 来使用，所以，还需要将其进一步转化为图片或者 PDF 文件。在 IE 浏览器还没有寿终正寝的时间线里，你可以使用 [WebBrowser](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.webbrowser?view=windowsdesktop-7.0) 来实现图片的转化，可如果 2023 年我们还固执地着 WebBrowser 不愿放手，这何尝不是一种莫名的执念呢？下面采用全新的 [WebView2](https://learn.microsoft.com/zh-cn/microsoft-edge/webview2/) 方案的一种实现：

```C#
// 确保 WebView2 内核可用
await webView.EnsureCoreWebView2Async();

// 加载并渲染模板
var htmlContent = File.ReadAllText("HtmlTemplate.html");
var template = DotLiquid.Template.Parse(htmlContent);
htmlContent = template.Render(Hash.FromAnonymousObject(new { Remark = "这是通过打印模板渲染的内容" })

// 加载网页并截图
webView.Reload();
this.webView.NavigateToString(htmlContent);
using var fileStream = File.OpenWrite("snapshot.jpg")
await webView.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Jpeg, fileStream);
```
此时，我们只需要为 PrintDocument 注册 PrintPage 事件即可：

```C#
printDocument.PrintPage += async (s, e) =>
{
    // 以下两行代码可以显著提升打印效果
    e.Graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
    e.Graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;
    
    // 按实际打印区域缩放、绘制图片
    // 当然，这里会牵涉到像素、毫米、页边距等等的问题，还需要做进一步的研究，我这里表达的是一种可行性
    var image = System.Drawing.Image.FromFile("snapshot.jpg");
    var printableArea = printDocument.DefaultPageSettings.PrintableArea;
    var ratio = image.Width / image.Height;
    e.Graphics.DrawImage(image, new System.Drawing.RectangleF(printableArea.Left, printableArea.Top, printableArea.Width, printableArea.Width / ratio));
};
```
实际上，打印通常会牵扯到页边距、分页、纸张大小等等的问题，而采用前端三件套来渲染内容，自然不可避免地牵连出诸如像素、毫米、英寸、DPI ...等等一堆的名词。我不得不承认，这一切非常复杂，即便在普通用户眼中，打印就像变魔术一般，只需要轻轻地点击一下鼠标。如果考虑到图片放缩导致的变形问题，理论上 HTML 模板的宽高比应该与实际打印纸张的宽高比相同，可事实是每次处理打印问题总不免要花点时间来做调试。我个人觉得，如果使用 PDF 作为打印的载体，效果应该会比图片稍微好一点。

![使用浏览器自带的打印方案](/posts/基于CSharp实现样式与数据分离的打印方案/PrintByBrowser.png)

考虑 PDF 的理由主要有两个方面，其一是基于 Webkit 内核的浏览器天然地对 PDF 格式友好，其二是可以复用浏览器自身的打印能力。如图所示，我们可以利用全新的 WebView2 组件去调用浏览器自带的打印对话框。从某种意义上来讲，这和前端常用的 vue-print-nb 或者 vue3-print-nb 插件并没有任何区别，本文的一切碎碎念似乎都在这一刻流向了同一个地方。可这种方案的缺陷在于，它无法跳过打印浏览器自带的打印对话框，甚至你连用户点击了打印还是取消都无从判断，更不必说要去判断打印机是否打印完成。实际上，即便是 PrintDocument，它同样无法“**准确**”地获得打印进度。一旦人们提出静默打印的诉求，这一切的一切终将重新回到 PrintDocument 的方案。

![RDLC 报表设计器](/posts/基于CSharp实现样式与数据分离的打印方案/RDLC-Layout.png)

事实上，微软还提供了一种 RDLC 报表的[方案](https://learn.microsoft.com/en-us/dynamics365/business-central/ui-rdlc-report-layouts)，这种方案更贴近传统的报表类业务，它可以通过定义实体类、创建数据集、添加数据源、设计模板等一系列流程完成报表设计，如果你使用过 FastReport 这类产品，自然会觉得这一切似曾相识，甚至连 DataSet、DataTable 这种偏底层的 API 都会倍感亲切。微软的 RDLC 以及 FastReport 的报表模板，本质上都是一个 XML 文件，其底层应该都是利用了 PrintDocument 这套 API。如果你看到相关的代码片段，就会明白一件事情，即：**太阳底下没有新鲜事**，无外乎是将每一页渲染为图片，再通过 DrawImage() 方法绘制出来。当一个人越来越接近本质，就会天然地厌倦外在的装饰或者形式，可惜生活中好像到处都是这样的事情。


# 本文小结

在无数次纠结下，我终于写完了这篇没什么技术含量的文章。首先，打印这个话题非常零散，这些难以形成体系的内容，属实无法达到一篇文章的篇幅。其次，打印在业务中的价值非常低，有或者没有并不会影响主线流程，更多的情况下是一种聊胜于无的点缀。从这两个角度来看的话，我这篇文章甚至都没有什么价值，因为在人们的印象中，打印终归是一件非常简单的事情，哪怕有的人连装纸这件事情都能搞砸，可这丝毫不会影响人们心目中对它的定位，人们唯一能记住的就是接上电源、按下开关、点击鼠标。如果我永远改变不了这一点，我唯一能做的就是将这些碎碎念记录下来，无论是殊途同归还是独辟蹊径，我在意的是此时此刻坐在电脑前的我的感受，仅此而已。