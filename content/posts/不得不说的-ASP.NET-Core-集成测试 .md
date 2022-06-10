---
categories:
- 编程语言
copyright: true
date: 2022-06-07 15:49:47
description: ''
slug: I-Have-To-Say-ASP.NET-Core-Integration-Testing
tags:
- Moq
- 单元测试
- 集成测试
- TestServer
title: 不得不说的 ASP.NET Core 集成测试 
toc: true
image: /posts/不得不说的-ASP.NET-Core-集成测试/cover.jpg
---
一直打算写一篇关于 [ASP.NET Core 集成测试](https://docs.microsoft.com/zh-cn/aspnet/core/test/integration-tests?view=aspnetcore-6.0) 的文章，因为一旦说起单元测试这个话题，多多少少会牵动我内心深处的理想主义色彩，虽然如今已然是程序员职业生涯的第七年，可在我看来依然有太多东西在原地打转。这一路跌跌撞撞地走过来，在不同的公司里，见识到了形态各异的研发流程，接触到了貌合神离的敏捷思想，阅读过了风格迥异的框架/架构。当时间节点来到 2022 年，惊觉 `.NET` 诞生业已 20 周年，虽然技术一直在不断向前发展，可我个人感觉，我们并没有在工程化上取得多少感人的进步，譬如单元测试、需求管理，这些听起来丝毫不影响写代码的方方面面。回首往昔，有坚持写单元测试的公司，有从来不写单元测试的公司，有因为业务或者人力扩张而放弃写单元测试的公司，俨然是软件研发领域的众生相。作为程序员，每天除了和各种 `Bug` 斗智斗勇以外，接触最多的当属测试或者叫做 `QA`，所以，今天这篇博客，我们一起来聊聊 `ASP.NET Core` 里的集成测试。

# Moq：万物皆可模拟吗

我们说，单元测试这个话题，多少带点理想主义色彩，究其本质，是因为我们相信，只要软件中的最小可测试单元的输出符合预期，那么，整个软件的输出就是符合预期的。对于程序员而言，软件中的最小可测试单元，通常是一个方法或者函数，因此，通常意义上的单元测试，是指对一个模块、一个方法/函数或者一个类进行正确性检验的测试工作，并且这个工作讲究隔离性，换句话说，是指软件中的最小可测试单元在不依赖外部因素的情况下进行的独立测试。最近这几年，大家会发现，随着微服务、云原生、Serverless 等等理念的流行，我们的软件正在变得越来越复杂，复杂到让你打断点、单步调试都成为一种奢望。在这种情况下，单元测试的理想主义色彩就开始凸显出来，现实世界中的软件常常存在着大量的依赖或者说耦合，而为了消除这些外部因素，人们会在单元测试中使用 `Mock` 这一技术来进行模拟。不过，博主想说的是，万物皆可模拟吗？

![什么是单元测试？](/posts/不得不说的-ASP.NET-Core-集成测试/Minimum-Test-Unit.drawio.png)

[Moq](https://github.com/moq/moq4) 是 `.NET` 平台下最常用的模拟库，它可以利用动态代理出模拟一个接口的行为。前面提到，单元测试针对的是最小的测试单元，而当这个最小的测试单元依赖某个外部因素的时候，就需要对其进行模拟，从而保证整个测试环节满足隔离性的要求。举个例子，没有人会为了喝一口水而专门去挖一口井。此时，喝水这个动作即是最小的测试单元，而这个动作本身依赖着一口井，所以，我们需要对井这个外部因素进行模拟。我相信，这足以道出 `Mock` 和 [单元测试](https://docs.microsoft.com/zh-cn/visualstudio/test/getting-started-with-unit-testing?view=vs-2022) 这两者间千丝万缕的的联系。以喝水这件事情为例，我们该如何模拟出一口井呢？假设我们可以通过下面的接口 `IWaterProvider` 来获得一定体积的水：

```csharp
interface IWaterProvider
{
    Water GetWater();
}
```

此时，按照 `Moq` 的套路，我们可以快速地挖一口“井”出来：

```csharp
var mock = new Mock<IWaterProvider>();
mock.Setup(x => x.GetWater()).Returns(
    new Water() { Name = "农夫山泉", Volume = 1.5M }
);

// 现在，你已经有了一口井 :)
var well = mock.Object;
var water = well.GetWater();

Assert.Equal("农夫山泉", water.Name);
Assert.Equal(1.5M, water.Volume);
```

可我们同样了解到，真实的软件世界其实是现实世界的一种投影，这意味着现实世界的复杂性绝不会凭空消失，它只会换一种形式再重新进入软件世界。你看，虽然这个世界的熵始终是在不断增加的，可它归根到底是遵循某种守恒定律的。每当这时，我都会想起一位前辈语重心长的话：“没有银弹”。真实的软件世界里，依赖项常常会有多个，这就需要我们模拟多个依赖项，所以，写单元测试这件事情，本身是有沉没成本在里面，首先是写单元测试有一定的门槛，其次是维护单元测试需要时间和精力。例如，下面是对一个控制器下的方法进行测试的代码片段：

```csharp
var mock = new Mock<IEmployeeRepository>();
mock.Setup(repo => repo.GetAll())
    .Returns(new List<Employee>() { 
        new Employee() { Id = 100, Name = "张三" }, 
        new Employee() { Id = 200, Name = "李四"} 
    });

var controller = new EmployeesController(mock.Object);
var result = controller.Index();

var viewResult = Assert.IsType<ViewResult>(result);
var employees = Assert.IsType<List<Employee>>(viewResult.Model);

Assert.Equal(2, employees.Count);
Assert.Equal(100, employees[0].Id);
Assert.Equal("张三", employees[0].Name);
```

可以注意到，测试控制器的方法，与测试普通方法基本一致，难点是控制器中有非常多的“特性”，譬如 `Form 表单`、 `ModelState`、`Cookie`、`HttpContext`、`Redirect`等等，这些在实际操作中并不能做到 100% 的模拟。上家公司时常有发邮件、发短信这样的业务场景，如果不去测试的话，作为程序员的我会非常没有安全感；可如果去测试的话，你就要了解配置、额度等等的细节。在现在这家公司，那些靠消息/事件驱动的业务都需要用到 `Kafka`，每次大家都通过打断点来联调的时候我就觉得痛苦，可扪心自问，确实没有更好的办法进行模拟。再后来，我就干脆直接构造消息然后再传到回调函数里面。从这个过程，我们就可以看出，万物并非皆可模拟，虽然作为一名《刺客信条》玩家，我心中早已笃定：**万物为虚，万事皆允**。

![万物为虚，万事皆允](/posts/不得不说的-ASP.NET-Core-集成测试/Assassin's-Creed-Ezio.jpg)

从微服务的角度出发，当你需要十来个服务相互协同方能正常工作的时候，最小测试单元或者单个服务通过验证，其实并不能保证整个系统运行正常。这样无疑会引出一个问题，那就是，我们每一个人的精力始终是有限的，按照“关注点分离”的原则，我们不应该关注我们不需要的信息，可在这种情况下，你的测试显然无法做到独善其身，如果你依赖了别人的服务或者组件，那么你不得不花时间去了解这些细节。所以，每次我的 Leader 强调要做集成测试的时候，我内心都是拒绝的，因为集成测试会花费更多的时间和精力，当你必须要依靠别人才能去做一件事情的时候，这意味着你会失去主动性，可惜现实生活中这样的事情俯拾皆是。程序员做久了，你会喜欢上那种掌控全局的“上帝视角”，可现实生活中超出你控制范围的事情属实是不能更多。不知不觉间，我们已经来到了集成测试的路口。

# TestServer：快来测试你写的 API

好了，下面我们来聊聊集成测试。集成测试，顾名思义就是在单元测试的基础上，将所有的模块组装成子系统或者系统，然后再进行联合测试。因为相关的实践表明，单个模块可以单独、正常地工作，并不能保证连接起来就可以正常工作。大家平时所说的“联调”，其实就是一种集成测试，因为它是把各个部件组装好以后再进行测试，更不必说，大家平时写好了 API 接口，会使用 [Postman](https://www.postman.com/) 或者 [Apifox](https://www.apifox.cn/) 这样的工具进行测试。为了方便 ASP.NET Core 中 API 的测试，微软提供了 [TestServer](https://docs.microsoft.com/ZH-CN/dotnet/api/microsoft.aspnetcore.testhost.testserver?view=aspnetcore-6.0)，它可以让我们在没有 IIS 或者任何外部事物的情况下对 Web 应用进行测试。在使用 `TestServer` 前，请确保你已经安装了 `Microsoft.AspNetCore.Mvc.Testing` 这个包：

```csharp
// 方式一：通过 WebHostBuilder 构建 TestServer
var webHostBuilder =
    new WebHostBuilder()
        .UseStartup<YourStartup>(); 

using (var server = new TestServer(webHostBuilder))
using (var client = server.CreateClient())
{
    // 通过 HttpClient 调用 API
    var result = await client.GetStringAsync("/path/to/your/api/endpoint/");
}

// 方式二：通过 HostBuilder 构建 TestServer
var host = await new HostBuilder()
    .ConfigureWebHost(webBuilder =>
    {
        webBuilder
        .UseTestServer()
        .UseStartup<YourStartup>(); 
    })
    .StartAsync();

using (var server = host.GetTestServer())
using (var client = server.CreateClient())
{
    // 通过 HttpClient 调用 API
    var result = await client.GetStringAsync("/path/to/your/api/endpoint/");
}
```

这里，博主提供了两种方式来构建一个 `TestServer`，本质上两种方案都差不多，除了直接使用已有的 `Startup` 类，你同样可以显式地调用 `ConfigureServices()` 和 `Configure()` 这两个方法，以最大限度地使用依赖注入，这样，我们写测试的时候会更加得心应手一点。有时候，我们需要对整个 `ASP.NET Core` 管道里的中间件进行测试，在 `TestServer` 出现以前，我们只能通过打断点、单步调试的方式来进行验证，而此时此刻，我们有了更好的做法，假设我们有下面的中间件 `RequestCultureMiddleware`，它可以以查询字符串的形式修改当前的 `CultureInfo` ：

```csharp
public class RequestCultureMiddleware
{
    private readonly RequestDelegate _next;
    public RequestCultureMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task Invoke(HttpContext context)
    {
        var cultureQuery = context.Request.Query["culture"];
        if (!string.IsNullOrWhiteSpace(cultureQuery))
        {
            var culture = new CultureInfo(cultureQuery);
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;
        }

        return _next(context);
    }
}
```

接下来，按照一开始的思路，我们来构建对应的 `TestServer`，还记得怎么使用 `ASP.NET Core` 里的中间件吗？我们依样画葫芦即可，个人感觉还是挺简单的：

```csharp
var host = await new HostBuilder()
    .ConfigureWebHost(webBuilder =>
    {
        webBuilder
        .UseTestServer()
        .ConfigureServices(services =>
        {
            // 注入中间件
            services.AddScoped<RequestCultureMiddleware>();
            services.AddRouting();
        })
        .Configure(app =>
        {
            // 使用中间件
            app.UseMiddleware<RequestCultureMiddleware>();
            app.UseRouting();

            // 构造一个 API 端点
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/echo", async context =>
                {
                    var text = context.Request.Query["text"];
                    await context.Response.WriteAsync(text);
                });
            });
        });
    })
    .StartAsync();

using (var server = host.GetTestServer())
using (var client = server.CreateClient())
{
    var text = "Hello";
    var culture = "zh-CN";
    
    var endpoint = $"/echo?text={text}&culture={culture}" 
    var result = await client.GetStringAsync(endpoint);
    Assert.Equal(text, result);

    var cultureInfo = new CultureInfo(culture);
    Assert.Equal(cultureInfo.Name, CultureInfo.CurrentCulture.Name);
    Assert.Equal(cultureInfo.Name, CultureInfo.CurrentUICulture.Name);
}
```

除了中间件，我们还可以对 `HttpContext` 进行测试，这里主要利用了 `TestServer`的 `SendAsync()` 方法：

```csharp
using (var server = host.GetTestServer())
{
    // 返回经过后端处理过的 HttpContext
    var context = await server.SendAsync(c =>
    {
        c.Request.Method = HttpMethods.Get;
        c.Request.Path = "/echo";
        c.Request.QueryString = new QueryString("?text=Hello");
    });
    
    Assert.Equal(200, context.Response.StatusCode);
}
```

类似地，因为 `TestServer` 上暴露出了 `IServiceProvider`，所以，理论上我们可以使用任何注入到 `IoC` 容器中的组件，这其中自然包扩 `gRPC`，下面是一个对 `gRPC`进行测试的示例：

```csharp
using (var server = host.GetTestServer())
{
    var messageSrvClient = server.Services
        .GetRequiredService<MessageSrv.MessageSrvClient>();
    var messages = (await messageSrvClient.GetAllMessagesAsync()).Notes;
    Assert.True(messages.Count > 0);
```

截至到目前，在最新的 `.NET 6.0` 这一版本中，我们还可以使用 `WebApplicationFactory` 来进行测试，它主要的改进点是消除了对 `Startup` 类的需求，允许你直接使用 `Program` 这个入口类：

```csharp
var application = new WebApplicationFactory<Program>()
    .WithWebHostBuilder(builder =>
    {
        // ... 
        // Configure Your TestServer
    });

var client = application.CreateClient();

```
不过，实际使用中发现，这里还是可以传 `Startup`类进去，并且，接下来要分享的内容和它息息相关。


# xUnit：更优雅的集成测试

在写测试的过程中，如果每次都创建一个 `TestServer`，不单单麻烦，而且效率非常低，所以，微软官方的建议是让测试类实现 `IClassFixture<TFixture>` 接口，这是 [xUnit](https://xunit.net/) 中的一个特性，其作用是让 `TFixture` 这个具体的类型，在运行第一个测试用例前被初始化。而如果 `TFixture` 这个类型实现了 `IDisposable` 接口，则 `xUnit` 会在运行最后一个测试用例后调用其 `Dispose()` 方法。直白一点的说法就是，它解决的是测试类中共享的数据如何初始化、如何销毁的问题，对我们而言，我们当然希望 `TestServer` 只初始化一次，下面是一个基本的示例：

```csharp
 public class WebAppTest : IClassFixture<WebApplicationFactory<Startup>>
{
    private readonly WebApplicationFactory<Startup> _factory;
    public WebAppTest(WebApplicationFactory<Startup> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task InMemeryDBTest()
    {
        // 使用 WithWebHostBuilder() 方法对 Startup 里的行为进行自定义或者覆盖
        var factroy = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddDbContext<ChinookContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryDB");
                });
            });
        });

        var serviceProvider = factroy.Services;
        using (var scope = serviceProvider.CreateScope())
        {
            var respository = scope.ServiceProvider
                .GetRequiredService<IBaseRepository<VehicleRecord>>();
            var dbContext = scope.ServiceProvider
                .GetRequiredService<ChinookContext>();

            respository.Add(new VehicleRecord() { 
                FleetNum = "12138", StatusCode = "AVB" 
            });
            await dbContext.SaveChangesAsync();

            var instance = await respository.GetFirstOrDefaultAsync(
                x => x.FleetNum == "12138"
            );

            Assert.NotNull(instance);
            Assert.True(instance.StatusCode == "AVB");
        }
    }
}
```

可以注意到，这里我们对默认的 `_factory` 进行了一点加工，因为我们不希望这些测试代码对当前的数据库产生影响，所以，我们通过 `WithWebHostBuilder()` 方法对默认的 `ChinookContext` 进行了覆盖，使其可以使用一个基于内存的数据库，这在写测试的时候，其实是一个非常不错的特性，因为这样确保了一个用例可以重复多次运行，或者是我们希望能够隔离开发环境和测试环境，此时此刻，你都可以考虑对默认的注入行为进行覆盖，甚至你还可以考虑实现自定义的 `WebApplicationFactory`，并对其中的核心方法进行重写：

```csharp
public class CustomWebApplicationFactory<TStartup>
    : WebApplicationFactory<TStartup> where TStartup : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // ...
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        // ...
        return base.CreateHost(builder);
    }

    protected override TestServer CreateServer(IWebHostBuilder builder)
    {
        // ...
        return base.CreateServer(builder);
    }

    protected override void ConfigureClient(System.Net.Http.HttpClient client)
    {
        // ...
    }
}
```

相信看到这里，大家就明白了，真正做事情的还是 `TestServer`，无非是从前台转换到后台。写单元测试的好处大家都知道，可是当业务频繁发生变动的时候，维护这些单元测试就变成了一种负担，正如鲁迅先生所言，“我大抵是倦了”。

# 本文小结

写作计划中的话题，终于又减少了一项，我内心还是有一点开心，因为有些事情一直拖延下去，便不见得有什么太好的结果。这篇博客主要讲的是 `ASP.NET Core` 里的集成测试，而一开始的着眼点则是单元测试 和 `Mock`。考虑到真实软件世界里的复杂性，“万物皆可模拟”，大概只能是一种美好的想象，并且实践告诉我们，单个模块可以单独、正常地工作，并不能保证连接起来就可以正常工作，显然，这是集成测试产生或者说存在的一个契机。我们从最简单的 API 的测试，引出了 `TestServer`，然后在这个基础上分享了如何利用 `TestServer` 对 `Controller`/`API`、`中间件`、`HttpContext` 以及 `gRPC`进行测试。最后，博主为大家介绍了微软官方推荐的最佳实践，即通过 `WebApplicationFactory` 来实现更优雅的集成测试，这里捎带着介绍了一下 [xUnit](https://xunit.net/) 里的 `TFixture`，它解决的是测试类中共享的数据如何初始化、如何销毁的问题。好了，以上就是这篇博客的全部内容啦，如果大家对文章中的内容有任何建议或者意见，欢迎大家在评论区积极留言，谢谢大家！