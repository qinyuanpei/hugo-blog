---
categories:
- 编程语言
date: 2022-08-23 12:52:10
description: ''
slug: Implement-Static-Weaving-Of-Dot-NET-Via-Fody
tags:
- Fody
- PostSharp
- AOP
- 静态编织
title: 使用 Fody 实现 .NET 的静态编织
---

{{<meting server="netease" type="song" id="28244941">}}

在很长的一段时间里，我们的项目中一直使用 `OnMethodBoundaryAspect` 这个基类来记录每个方法的日志。诚然，`FodyWeavers.xml` 这个文件的存在，早已在冥冥之中暗示我，[Fody](https://github.com/Fody/Home) 才是这座冰山下真正的墨西哥湾暖流。可惜，因为某种阴差阳错的巧合，譬如两者都使用了 `OnMethodBoundaryAspect` 这个命名，这导致我过去一直以为我们使用的是 [PostSharp](https://www.postsharp.net/)。如果你是用过 [ReSharper](https://www.jetbrains.com/resharper/) 或者 [Rider](https://www.jetbrains.com/rider/) 这些由 [JetBrains](https://www.jetbrains.com) 出品的工具，你大概会听说过 PostSharp。不过，有趣的是，JetBrains 和 PostSharp 其实没有半毛钱的关系，两者唯一相似的地方，或许是它们都不姓微软:joy:。当我们谈论 PostSharp 的时候，我其实想说的是静态编织。由此，我们就引出了今天这篇文章的主题，即: `.NET` 中的静态编织。而对于静态编织，我们这里只需要知道，它是一种在编译时期间将特定的字节码插入到目标类和方法的技术。

# 再从 AOP 说起

想不到吧，此去经年，我再一次聊起了 `AOP` 这个话题。众所周知，`AOP` 是指面向切面编程 (Aspect Oriented Programming)，而所谓的切面，可以认为是具体拦截的某个业务点。对于面向对象编程的语言来说，一个业务点通常就是一个方法或者函数。因此，我们谈论 `AOP` 这个话题的时候，更多的是指在某个方法执行前后插入某种处理逻辑。此时，广义的 `AOP` 就有静态编织和动态代理两种形式，前者发生在编译时期间，后者发生在运行时期间。如下图所示，我们平时使用的 `Castle DynamicProxy` 、 `AspectCore`、`DispatchProxy` 等等都属于动态代理的范畴，这些都是在运行时期间对代码进行“修改”；而我们今天要讨论的 `Fody` ，则是属于静态编织的范畴，顾名思义，它是在编译时期间对代码进行“修改”。我们知道，按照实现方式上的不同， `AOP` 又可以分为代理模式和父子类重写两种“修改”方式。至此，我们对于 `AOP` 的认知范围被进一步扩大，就像我们以前学习数学的时候，我们对于对于“数”的定义，是先从有理数扩充到无理数，后来又从实数扩充到虚数。那么，屏幕前的你，真的搞懂 `AOP` 了吗？

![广义上的面向切面编程](/posts/使用-Fody-实现-.NET-的静态织入/面向切面编程.png)

# Fody 的初体验

作为一个类库，`Fody` 在使用上并没有任何非同寻常的地方。这意味着，你可以像使用任何一个第三方库一样，直接通过 `NuGet` 来安装：

```bash
dotnet add package Fody --version 6.6.3
```

可惜，这样或许会令你感到失望。因为对于 `Fody` 而言，我们通常使用的是它的插件 (Add-In) 而不是 `Fody` 本身，除非当你需要真正编写一个插件。身处西安这个十三朝古都，你一定听说过鼎鼎大名的三秦套餐，即：凉皮、冰峰、肉夹馍。这里，我们就以 `Rougamo.Fody` 这个插件为例来快速体验一下 `Fody` 。首先，我们通过 `NuGet` 来安装该插件：

```bash
dotnet add package Rougamo.Fody --version 1.1.2
```

接下来，我们来一起编写下面的代码，一个可以附加到方法上的特性 `LoggingAttribute` ：

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class LoggingAttribute: MoAttribute
{
    public override void OnEntry(MethodContext context)
    {
        Console.WriteLine("执行方法 {0}() 开始, 参数：{1}.", context.Method.Name, JsonConvert.SerializeObject(context.Arguments));
    }

    public override void OnException(MethodContext context)
    {
        Console.WriteLine("执行方法 {0}() 异常, {1}.", context.Method.Name, context.Exception.Message);
    }

    public override void OnExit(MethodContext context)
    {
        Console.WriteLine("执行方法 {0}() 结束.", context.Method.Name);
    }

    public override void OnSuccess(MethodContext context)
    {
        Console.WriteLine("执行方法 {0}() 成功.", context.Method.Name);
    }
}
```

为了测试这个特性的效果，相应地，我们再准备几个简单的函数：

```csharp
[Logging]
static int Add(int a, int b) => a + b;

[Logging]
static Task<int> AddAsync(int a, int b) => Task.FromResult(a + b);

[Logging]
static decimal Divide(decimal a, decimal b) => a / b;
```

此时，如果我们尝试调用这些方法，就可以获得下面的结果：

![使用 Rougamo.Fody 记录日志](/posts/使用-Fody-实现-.NET-的静态织入/使用-Fody-记录日志.jpg)

可以注意到，这个插件可以悄无声息地帮我们“织入”指定代码，就像小时候妈妈为我们织毛衣一样。那么，这一切究竟是怎么做到的呢？ 我想，这一切要从编译原理开始讲起 :ghost: 。

![.NET 编译原理示意图](/posts/使用-Fody-实现-.NET-的静态织入/Compilation-Process-Of-.NET-Application.drawio.png)

我们都知道，对于 C# 这门语言来说，它第一步是被编译为 `IL`，即中间代码，然后再经过 `JIT` 编译为本地代码。当然，现在 `.NET` 已经支持 `AOT` 编译模型。可不管使用哪一种编译模型，`Fody` 的势力范围始终都是 `IL` 被送到 `JIT` 或者 `AOT` 之前，即编译时期间。因此，`Fody` 或者说静态编织的本质，其实就是对第一步生成的 `IL` 进行修改，如下图所示，`Fody` 通过通过插件或者 `ModuleWeaver` 来对 `IL` 进行修改：

![.NET 静态编织原理示意图](/posts/使用-Fody-实现-.NET-的静态织入/Compilation-Process-With-Fody-Of-.NET-Application.drawio.png)

对于我们这个示例而言，你可以认为，是 `Fody` 帮我们把 `LoggingAttribute` 里的这些代码，悄无声息地“编织”进了我们的代码里，这一点怎么验证呢？其实，我们只需要通过 `Ildasm.exe` 这个工具对代码进行反编译即可，通常情况下，这个工具位于以下路径：`C:\Program Files (x86)\Microsoft SDKs\Windows\v10.0A\bin\NETFX 4.8 Tools`。此时，结果如下图所示：

![谁动了我的代码 A](/posts/使用-Fody-实现-.NET-的静态织入/IL-How-It-Was-Done-01.png)

可以看到，我们自己写的 `Add()` 方法，确实被 `Fody` 给修改了，它用一个 `try-catch` 语句块把我们的代码包裹在其中，然后在 `catch` 和 `finally` 块里分别调用 `OnException()` 和 `OnSuccess()` 两个方法。果然，哪有什么岁月静好，不过是在有人替你负重前行，对不对？


# 第一个 Add-In

好了，从接触 `Fody` 到现在，我们一直都是在使用别人写好的插件。虽然通过反编译代码，我们大概知道了 `Fody` 对我们的代码做了什么。可是，博主相信大家和我一样，对于 `Fody` 的原理还是云里雾里。下面，我们通过一个自定义的插件来展示更多的细节。按照程序世界的惯例，我们还是从 HelloWorld 开始，对于每一个 `Fody` 插件而言，其命名风格类似于 `Rougamo.Fody`，因此，我们创建一个名为 `HelloWorld.Fody` 的类库项目：

```bash
dotnet new classlib --name HelloWorld.Fody
```

接下来，我们定义一个特性 `HelloWorldAttribute` ，这个特性里什么都不用写，我们这里只用它来打标记：

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class HelloWorldAttribute : Attribute { }
```

这里我们希望做一件什么事情呢？我们希望每一个打上 `[HelloWorld]` 标签的方法，都可以自动输出一句：`Hello World.` 。参考 `Fody` 的[插件开发规范](https://github.com/Fody/Home/blob/master/pages/addin-development.md)，我们定义一个名为 `ModuleWeaver` 的类，它继承自 `BaseModuleWeaver` 这个类，为了使用这个类型，你还需要通过 `NuGet` 安装 `FodyHelpers` 这个包。默认情况下，我们需要重写 `Execute()` 和 `GetAssembliesForScanning()` 两个方法：

```csharp
public override void Execute()
{
    foreach (var type in ModuleDefinition.Types)
    {
        foreach (var method in type.Methods)
        {
            var customerAttribute = method.CustomAttributes.FirstOrDefault(x => x.AttributeType.Name == nameof(HelloWorldAttribute));
            if (customerAttribute != null)
            {
                ProcessMethod(method);
            }
        }
    }
}
```
首先，这里的 `ModuleDefinition` 属性定义来自父类，它包含了本次编织中所有可以使用的类型信息，如果你稍微仔细一点，就会发现 `ModuleDefinition` 其实是定义在 `Mono.Cecil` 这个程序集里面的，这恰恰印证了我们一开始的说法，即：`Fody` 是基于 `Mono.Cecil` 的扩展库。当然，这些细节暂时无关紧要。因为对我们来说，我们只需要遍历所有类型中的方法，然后判断这个方法上面有没有附加 `HelloWorldAttribute` 这个特性即可。至于具体怎么实现 `ProcessMethod()` 这个方法，我们可以先暂时放到到一边。

```csharp
public override IEnumerable<string> GetAssembliesForScanning()
{
    yield return "mscorlib";
    yield return "System";
}
```
其次，考虑到我们需要调用的 `Console.WriteLine()` 方法是位于 `System` 命名空间下面，因此，我们需要在 `GetAssembliesForScanning()` 这个方法里返回 `System` 和 `mscorlib` ，这一步的目的是告诉 `Fody` ，它应该去哪里找这些引用了的类型。

```csharp
public static void Echo()
{
    Console.WriteLine("Hello World.");
}

```

OK，让我们先暂时将眼睛从 `Fody` 上移开，既然 `Fody` 的秘诀是修改 `IL` ，我们不妨先从 `IL` 上入手。这里，我们准备一个 `Echo()` 方法，然后看看它编译为  `IL` 会变成什么样子：

![从 C# 代码到 IL 代码](/posts/使用-Fody-实现-.NET-的静态织入/IL-How-It-Was-Done-02.png)

这里简单翻译下这段代码，`IL_0000` 这一行表示把字符串 `Hello World.` 放入栈中；`IL_0005`这一行表示调用 `Console.WriteLine()` 这个方法；`IL_000a` 这一行表示返回值。当然，对于 `void` 类型的方法来说，这一句相当于什么都不做。这样，我们就认识了三个指令：`ldstr`、`call`、`ret`。这里再增加一个指令 `nop`，它相当于我们平时写代码时的空行，有了这四个指令，我们就可以尝试用 `IL` 来编程啦！如果你接触过 [Emit](https://docs.microsoft.com/zh-cn/dotnet/api/system.reflection.emit.ilgenerator.emit?view=net-6.0), 上面这段代码可以改写为下面这样：

```csharp
// 创建一个无参、无返回值的方法
var dynamicEcho = new DynamicMethod("DynamicEcho", null, Type.EmptyTypes);

// 利用 IL 填充方法体
var ilGenerator = dynamicEcho.GetILGenerator();
ilGenerator.Emit(OpCodes.Ldstr, "Hello World.");
ilGenerator.Emit(OpCodes.Call, typeof(Console).GetMethod("WriteLine", new Type[] { typeof(string) }));
ilGenerator.Emit(OpCodes.Ret);

// 调用方法
var dynamicEchoAction = dynamicEcho.CreateDelegate(typeof(Action)) as Action;
dynamicEchoAction.Invoke();
```

为什么要写这样一段代码呢？首先，是因为我确实不会 `Emit`，我需要了解它；其次，写 `Emit` 能加深我们对于 `ldstr`、`call`、`ret` 这三个指令的理解。有了这个基础，我们就可以来实现  `ProcessMethod()` 这个方法啦：

```csharp

private MethodInfo _writeLineMethod  => typeof(Console).GetMethod("WriteLine", new Type[] { typeof(string) });

private void ProcessMethod(MethodDefinition method)
{
    // 获取当前方法体中的第一个 IL 指令
    var processor = method.Body.GetILProcessor();
    var current = method.Body.Instructions.First();

    // 插入一个 Nop 指令，表示什么都不做
    var first = Instruction.Create(OpCodes.Nop);
    processor.InsertBefore(current, first);
    current = first;

    // 构造 Console.WriteLine("Hello World")
    foreach (var instruction in GetInstructions(method))
    {
        processor.InsertAfter(current, instruction);
        current = instruction;
    }
}

private IEnumerable<Instruction> GetInstructions(MethodDefinition method)
{
    yield return Instruction.Create(OpCodes.Nop);
    yield return Instruction.Create(OpCodes.Ldstr, "Hello World.");
    yield return Instruction.Create(OpCodes.Call, ModuleDefinition.ImportReference(_writeLineMethod));
}
```

这里，每一个 `Instruction` 对应着 `IL` 代码中的一条指令，一旦理解了这一点，静态编织本质上不就是修改 IL 代码吗？所以，我们的做法是：在原有方法的第一个指令前插入一个 `nop` 指令，然后再在这个 `nop` 指令后面插入我们自己的指令。这部分指令我们已经用 [Emit](https://docs.microsoft.com/zh-cn/dotnet/api/system.reflection.emit.ilgenerator.emit?view=net-6.0) 写过一次，这里直接抄下来就好啦！至此，我们就完成了整个 `HelloWorld.Fody` 插件的编写，该插件的目录结构如下：

```plain
HelloWorld.Fody
|--- HelloWorld.Fody.csproj
|--- HelloWorldAttribute.cs
|--- ModuleWeaver.cs
```

OK，现在我们还有最后一个问题要解决，即：`Fody` 是如何找到这些插件的。一开始在体验 `Rougamo.Fody` 的时候，我们完全没有这方面的困惑，这是因为它可以在程序生成时，自动找到对应的插件并在 `FodyWeavers.xml` 文件中生成下列内容：

```xml
<Weavers
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="FodyWeavers.xsd"
  >
  <Rougamo />
</Weavers>
```

是的，`Fody` 的秘密终于被揭晓了，它通过这个 XML 文件来决定编译时使用哪些插件。不过，博主在写这篇文章的时候发现，我们自己编写的这个插件，不管是通过项目引用还是包引用的方式，`Fody` 都提示找不到对应的插件，这意味着编译会失败，即使我照猫画虎一般地在 `FodyWeavers.xml` 文件中加入`<HelloWorld />` 节点。最终，我在 [官方文档](https://github.com/Fody/Home/blob/master/pages/addin-discovery.md) 中找到了答案，Fody 默认会从下面三个路径检索插件：

* NuGet Package 目录
* 解决方案路径下的 Tools 目录
* 解决方案中叫做 `Weavers` 的项目
 
不过，最简单粗暴的做法，还是在工程文件中指定插件的路径。虽然，我还是不知道，我写的这个插件和别人写的插件，到底差在哪里？

```xml
<Project
  xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup>
    <WeaverFiles Include="$(MsBuildThisFileDirectory)..\weavers\HelloWorld.Fody.dll" />
  </ItemGroup>
</Project>
```
现在，万事具备，只欠东风，我们修改一下 `Ehco()` 方法，添加 `[HelloWorld]` 这个特性：

```csharp
[HelloWorld]
public static void Echo()
{
    Console.WriteLine("Hello Fody.");
}
```

此时，我们会得到下面的结果。其中，`Hello World.` 是我们通过静态编织插入的代码，`Hello Fody.` 是 `Echo()` 方法自身的代码：

![HelloWorld.Fody 插件使用效果展示](/posts/使用-Fody-实现-.NET-的静态织入/The-Show-Of-First-Add-In.png)

现在，你会作何感想，是不是对 `AOP` 的印象更深了一点，忽略那些切面、拦截器、代理对象、被代理对象...等等的概念，你最终会发现，`AOP` 越来越呈现出一种返璞归真的状态，毕竟，我们只需要在某个方法体的第一条指令前、最后一条指令后，各自插入一组指令即可。虽然从我接触编程的那一刻起，已经完全不需要再去学习晦涩难懂的汇编语言，可是写这篇文章的时候，我好像知道了写汇编是一种什么样的感觉:smirk:...

# 本文小结

广义的面向切面编程，有静态编织和动态代理两种形式，它们都可以在某个方法执行前后插入某种处理逻辑。不同的地方在于，前者发生在编译时期间，后者发生在运行时期间。对于 .NET 而言，最常见的静态编织方案是 [PostSharp](https://www.postsharp.net/) 和 [Mono.Cecil](https://www.mono-project.com/docs/tools+libraries/libraries/Mono.Cecil/)，两者的区别是：一个付费、一个免费。本文介绍的 [Fody](https://github.com/Fody/Home) 是一个基于 Mono.Cecli 的扩展库，通过 Fody 的各种插件，我们可以向已有代码织入特定的功能，譬如 [Rougamo.Fody](https://github.com/inversionhourglass/Rougamo) 这个插件可以让我们对方法进行拦截。基于这个原理，我们实现了一个完全不同于动态代理的拦截器。动态编织的本质是修改 `IL` 代码，对于这一点我们可以通过 `ILdasm.exe` 这个工具来验证。为了进一步了解 Fody 是如何修改 `IL` 代码的，我们参照 Fody 的规范实现了一个自定义的插件，在这个过程中，我们了解了几个常见 `IL` 指令，以及如何通过 `Emit` 来生成 `IL` 指令。此时，我们就接触到比表达式树更为底层的东西，而操作 `IL` 指令更是让我们体会到写汇编语言的酸爽，同时让我们对 `.NET` 的编译原理有了更为直观的认识。