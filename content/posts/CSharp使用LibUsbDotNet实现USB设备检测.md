---
categories:
- 编程语言
copyright: true
date: 2023-10-18 12:30:47
description: 本文讨论了工作中围绕硬件展开的问题，以及尝试解决"简单"问题的经历。作者分享了在程序中集成某厂商硬件时遇到的挑战，并介绍了使用 WMI 和 LibUsbDotNet 库来检测和处理 USB 设备的方法。描述了如何通过硬件 ID 判断 USB 设备连接状态，并展示了通过 WMI 监听 USB 设备插入和拔出事件的实现。最终强调了编程的本质是不断照顾程序中的问题，以及对代码中的冗余部分进行反思。
image: /posts/CSharp使用LibUsbDotNet实现USB设备检测/immo-wegmann-HtsVneqf5Fg-unsplash.jpg
slug: CSharp-Uses-LibUsbDotNet-To-Implement-USB-Device-Detection
tags:
- 硬件
- USB
- WMI
- LibUsbDotNet
title: C# 使用 LibUsbDotNet 实现 USB 设备检测
toc: true
---

国庆节回来后的工作内容，基本都在围绕着各种各样的硬件展开，这无疑让本就漫长的 “**七天班**” ，更加平添了三分枯燥，我甚至在不知不觉中学会了，如何给打印机装上不同尺寸的纸张。华为的 **Mate 60** 发布以后，人群中此起彼伏地传出 “**遥遥领先**” 的声音，大概人类总是热衷于评价那些不甚了解的事物。这个现象到了工作中就会变成，总有某些人觉得某件事情特别简单。其实。一切你认为“**简单**”的东西，背后一定有无数的人们上下求索、苦心孤诣，就像计算机从早期的埃尼阿克(**ENIAC**)发展到今天的智能手机，你能使用它并不代表它就“**简单**”，人还是应该对为止的领域保持敬畏和谦逊。回到这篇文章，今天我想和大家聊一聊，我为了解决那些“**简单**”的问题而做出的尝试。本期的故事主角是我们最熟悉不过的 USB 设备，有道是 “**千古兴亡多少事**”，且听我娓娓道来。

{{<meting server="netease" type="song" id="508797">}}

故事是这样的，基于某些不可抗因素上的考虑，博主需要在程序中集成某厂商的硬件。我猜测，人们觉得这件事情“简单”，或许是看到这个设备有一条 USB 连接线，因为在人们的固有印象中，只要把它接到电脑上就可以正常工作了。事实的确如此，因为你只要考虑串口(**SerialPort**)、USB 以及这两者间的相互转换即可。当然，这世上的事情圆满者少，遗憾者多，博主在使用过程中发现，厂商的提供的 SDK 存在 Bug，当设备从电脑上拔出后，其 SDK 的初始化函数依然正常返回了，这意味着我们无法在使用设备前“**正确**”地检测出硬件状态。考虑厂商愿不愿意修复这个 Bug 还是个未知数，博主不得不尝试另辟蹊径。

![Windows 中的设备与打印机](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121008.png)

相信这张图片大家都见过无数次啦，在这里你可以看到操作系统接入的各种设备。以鼠标为例，通过下面这个对话框，我们可以获得这个设备的各种属性信息：

![查阅鼠标的硬件信息](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121009.png)

在各种属性信息中，硬件 Id 是最为关键的一组信息，我们可以看到鼠标这个设备的 VID 为 0000，PID 为 3825。其中，VID 是指 Vender ID，即：供应商识别码；PID 是指 Product ID，即：产品识别码。事实上，所有的 USB 设备都有 VID 和 PID，VID 由供应商向 USB-IF 申请获得，而 PID 则由供应商自行指定，计算机正是 VID、PID 以及设备的版本号来决定加载或者安装相应的驱动程序。因此，如果想要判断计算机是否连接了某个 USB 设备，我们可以使用下面的方案：

```C#
bool HasUsbDevice(string vid, string pid)
{
    var query = $"SELECT * FROM Win32_PnPEntity WHERE DeviceID LIKE 'USB%VID_{vid}&PID_{pid}%'";
    var searcher = new ManagementObjectSearcher(query);
    var devices = searcher.Get();
    return devices.Count > 0;
}
```

需要说明的是，这是通过古老的 WMI 来查询 USB 设备信息，还记得我们前面收集到的 VID 以及 PID 吗？此时，我们需要简单调用一下即可：

```C#
if (HasUsbDevice2("0000", "3825") {
    Console.WriteLine("[WMI]设备已连接");
} else {
    Console.WriteLine("[WMI]设备未连接");
}
```

当然，在 .NET 8.0 发布以后，依然固执地抱着这些 Windows 平台的 API 不放，多少有点食古不化的意味。所以，实际工作中我会推荐本文题目中的 LibUsbDotNet 库，除了跨平台方面的考量，这个库的功能要更强大一点，可以做到向 USB 设备发送数据或者从 USB 设备接收数据。下面由我来对这个库的使用进行说明，目前，我们可以从 Github 以及 SourceForge 上下载对应的项目，两者的区别是 Github 上的项目更新一点：

* [https://github.com/LibUsbDotNet/LibUsbDotNet](https://github.com/LibUsbDotNet/LibUsbDotNet)
* [https://sourceforge.net/projects/libusbdotnet/](https://sourceforge.net/projects/libusbdotnet/)

下载后是一个可执行文件，我们点击安装即可，它会安装好相关的库以及驱动文件，默认的安装目录为：C:\Program Files\LibUsbDotNet。在安装完成后，它会提示我们进入下面的对话框，这一步的目的是给特定的设备安装 libusb 驱动，因为只有安装了驱动的情况下，接下来的一切才会发生，除非 LibUsbDotNet 会隔空取物。

![为设备安装 libusb 驱动-1](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121010.png)

这里，我们还是选择鼠标这个硬件，你需要重点关注 PID 以及 VID 两个参数，因为这是唯一能区分不同 USB 设备的标识：

![为设备安装 libusb 驱动-2](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121011.png)

最后，点击 “**Install**” 按钮即可为当前设备安装 libusb 驱动。接下来的事情就变得非常简单啦，我们只需要通过 NuGet 安装 LibUsbDotNet 即可：

```C#
bool HasUsbDevice(short vid, short pid)
{
    var useDeviceFinder = new UsbDeviceFinder(vid, pid);
    var usbDevice = UsbDevice.OpenUsbDevice(useDeviceFinder);
    return usbDevice != null;
}
```

可以注意到，LibUsbDotNet 需要的 VID 以及 PID 都是 short 类型的，所以，相比于 WMI 的方案，它在调用上会存在一点差异：

```CSharp
var verdorId = Convert.ToInt16("0x0000", 16);
var productId = Convert.ToInt16("0x3825", 16);
if (HasUsbDevice(verdorId, productId)) {
    Console.WriteLine("[LibUsbDotNet]设备已连接");
} else {
    Console.WriteLine("[LibUsbDotNet]设备未连接");
}
```

显然，你会注意到，我在原本的 “0000” 和 “3825” 前面都补了 “0x” 这样的字符，这是因为 VID 和 PID 都是 16 位的二进制数，它们都可以简写为 4 位十六进制数，所以，不管是在 Windows 上还是 LibUsbDotNet 提供的软件中，它都是以 4 位十六进制数的简写形式存在的。因此，这里就需要进行先补 “0x” 再做转换的处理。

![两种 USB 设备检测方案效果演示](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121013.png)

除了判断 USB 设备是否存在，有时候我们还需要关注 USB 设备的状态变化。例如，插入 USB 设备或者拔出 USB 设备。古人云：**世上本无事，庸人自扰之**。可这个世界上还就真的有这般无聊的人，动辄喜欢搞拔设备、拔网线这种所谓的深度测试。所以，下面我们来考虑如何处理这种极端的场景。从一开始，博主选择 LibUsbDotNet 这个库，就是看到它提供了 DeviceNotifier 这个类型。不过，在博主后续的尝试中发现，截止到 2.2.29 版本，这个类型已然无迹可寻，而 3.X 版本目前依然出于预发行状态，并且 API 与现在的版本不兼容，所以，这个念头不得不就此作罢。

![事件查看器 & USB 设备](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121012.png)

当然，在觉醒了 WMI 的远古记忆以后，我们会意识到 Windows 下存在着一个大型的数据库，理论上我们只需要查询这个数据库，就可以监听到 USB 设备的状态变化。如图所示，我们会注意到每个硬件的对话框里有一个 “**事件**” 选项卡，而这些事件最终会在事件查看器里面汇合。在 ChatGPT 以及 wbemtest 的帮助下，我们找到了两个重要的重要的类名：`__InstanceCreationEvent`、`__InstanceDeletionEvent`。此时，我们可以编写出下面的代码：

```C#
void MonitorUsbDevice()
{
    // 监听 USB 设备插入
    var queryInsert = new WqlEventQuery("SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_USBControllerDevice'");
    var watcherInsert = new ManagementEventWatcher(queryInsert);
    watcherInsert.EventArrived += (sender, e) =>
    {
        // 被插入的逻辑处理
        var targetInstance = (ManagementBaseObject)e.NewEvent["TargetInstance"];
        // \\SNOWFLY-PC\root\cimv2:Win32_PnPEntity.DeviceID="HID\\VID_0000&PID_3825\\6&2BE8ADFA&0&0000"
        var deviceId = targetInstance.Properties["Dependent"].Value.ToString();
        var device = new ManagementObject(deviceId);

        var args = new DeviceNotifierEventArgs();
        // Win32_PnPEntity.DeviceID="HID\\VID_0000&PID_3825\\6&2BE8ADFA&0&0000"
        args.DeviceId = device.Path.RelativePath.Split("=")[1].Replace("\"", "");
        args.DevicePath = device.Path.ToString();
        args.Pid = "0x" + deviceId.Split(new char[] { '&', '\\' }).FirstOrDefault(x => x.StartsWith("PID_")).Replace("PID_", "");
        args.Vid = "0x" + deviceId.Split(new char[] { '&', '\\' }).FirstOrDefault(x => x.StartsWith("VID_")).Replace("VID_", "");
        if (!args.DeviceId.StartsWith("USB")) return;
        Console.WriteLine($"设备已插入 => {JsonConvert.SerializeObject(args)}");
    };
    watcherInsert.Start();

    var queryDelete = new WqlEventQuery("SELECT * FROM __InstanceDeletionEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_USBControllerDevice'");
    var watcherDelete = new ManagementEventWatcher(queryDelete);
    watcherDelete.EventArrived += (sender, e) =>
    {
        // 被拔出的逻辑处理
        var targetInstance = (ManagementBaseObject)e.NewEvent["TargetInstance"];
        // \\SNOWFLY-PC\root\cimv2:Win32_PnPEntity.DeviceID="HID\\VID_0000&PID_3825\\6&2BE8ADFA&0&0000"
        var deviceId = targetInstance.Properties["Dependent"].Value.ToString();
        var device = new ManagementObject(deviceId);

        var args = new DeviceNotifierEventArgs();
        // Win32_PnPEntity.DeviceID="HID\\VID_0000&PID_3825\\6&2BE8ADFA&0&0000"
        args.DeviceId = device.Path.RelativePath.Split("=")[1].Replace("\"", "");
        args.DevicePath = device.Path.ToString();
        args.Pid = "0x" + deviceId.Split(new char[] { '&', '\\' }).FirstOrDefault(x => x.StartsWith("PID_")).Replace("PID_", "");
        args.Vid = "0x" + deviceId.Split(new char[] { '&', '\\' }).FirstOrDefault(x => x.StartsWith("VID_")).Replace("VID_", "");
        if (!args.DeviceId.StartsWith("USB")) return;
        Console.WriteLine($"设备已拔出 => {JsonConvert.SerializeObject(args)}");
    };
    watcherDelete.Start();
}
```

理解这段代码基本上没有任何难度，唯一需要说明的地方是，插入或者拔出一个 USB 设备实际上会产生两条消息，它们分别表示的是设备实例与接口实例的创建。这个话听起来或许有些晦涩，可能连微软都不知道它自己在说什么。具体到博主的这个示例中，其规律是两者的 DeviceID 格式不同，一次是 HID ，一个是 USB，因此，我们只需要过滤掉 HID 的那条消息即可。最终，博主实现的效果如下图所示：

![通过 WMI 监听 USB 设备插入或者拔出](/posts/CSharp使用LibUsbDotNet实现USB设备检测/20231019121014.png)

有了这个思路，我们就可以在程序启动时对 USB 设备进行监控，一旦发现某个重要的设备被移除，程序就可以及时地做出响应或处理，而不用等到真正要用设备的时候引发异常，我越来越觉得，编程本质就是一群聪明人在千方百计地照顾一个“巨婴”，每次测试同事都说这里或者那里要加一个提示，可即使增加了提示，人们依然无止无休地问你为什么，错误信息不过是程序员自我安慰剂，除了程序员以外没有人会在乎它具体是什么。如果你对此怀疑表示怀疑的话，不妨回去翻翻你写的代码，有多少行是真正的、有用的代码，又有多少代码是为了防呆呢？好了，以上就是这篇博客的全部内容啦，本文完。