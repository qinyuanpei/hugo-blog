---
categories:
- 编程语言
date: 2022-04-07 09:34:36
description: ''
tags:
- Envoy
- Tracing
- Jeager
- 
title: 利用 ASP.NET Core 中的标头传播实现分布式链路跟踪
slug: ASP-NET-Core-Using-HeaderPropagation-For-Distributed-Tracking
---

在此之前，我曾写过一篇博客，[《Envoy 集成 Jaeger 实现分布式链路跟踪》](/posts/768684858/)，主要分享了 ASP.NET Core 应用如何结合 [Envoy](https://www.envoyproxy.io/) 和 [Jeager](https://www.jaegertracing.io/) 来实现分布式链路跟踪，其核心思想是生成一个全局唯一的`x-request-id`，并在不同的微服务或者子系统中传播该信息。进而，可以使得相关的信息像一条线上的珠子一样串联起来。在此基础上，社区主导并产生了 [OpenTracing](https://opentracing.io/) 规范，在这个 [规范](https://github.com/opentracing/specification/blob/master/specification.md) 中，一个 Trace，即调用链，是由多个 `Span` 组成的有向无环图，而每个 `Span` 则可以含有多个键值对组成的 `Tag`。不过，当时我们有一个非常尴尬的问题，那就是每个微服务必须显式地传递相关的 HTTP 请求头。那么，是否有一种更优雅的方案呢？而这就是我们今天要分享的内容。首先，我们来回头看看当初的方案，这是一个非常朴实无华的实现：

```csharp
[HttpPost]
public async Task<IActionResult> Post([FromBody] OrderInfo orderInfo)
{
  var paymentInfo = new PaymentInfo()
  {
    OrderId = orderInfo.OrderId,
    PaymentId = Guid.NewGuid().ToString("N"),
    Remark = orderInfo.Remark,
  };

  // 设置请求头
  _httpClient.DefaultRequestHeaders.Add(
      "x-request-id", Request.Headers["x-request-id"].ToString());
  _httpClient.DefaultRequestHeaders.Add(
      "x-b3-traceid", Request.Headers["x-b3-traceid"].ToString());
  _httpClient.DefaultRequestHeaders.Add(
      "x-b3-spanid", Request.Headers["x-b3-spanid"].ToString());
  _httpClient.DefaultRequestHeaders.Add(
      "x-b3-parentspanid", Request.Headers["x-b3-parentspanid"].ToString());
  _httpClient.DefaultRequestHeaders.Add(
      "x-b3-sampled", Request.Headers["x-b3-sampled"].ToString());
  _httpClient.DefaultRequestHeaders.Add(
      "x-b3-flags", Request.Headers["x-b3-flags"].ToString());
  _httpClient.DefaultRequestHeaders.Add(
      "x-ot-span-context", Request.Headers["x-ot-span-context"].ToString());

  // 调用/Payment接口
  var payload = JsonConvert.SerializeObject(paymentInfo)
  var content = new StringContent(payload, Encoding.UTF8, "application/json");
  var response = await _httpClient.PostAsync("/Payment", content);

  var result = response.IsSuccessStatusCode ? "成功" : "失败";
  return new JsonResult(new { Msg = $"订单创建{result}" });
}
```

这里，最大的问题是，传递 HTTP 请求头的代码片段对正常的业务代码存在入侵，当别人调用某个微服务或者子系统的接口时，必须要加上这些代码片段，这实在是一件难受的事情。子曰，“己所不欲，勿施于人”，如果一段代码，你自己都感觉看不下去，那就说明这代码该重构啦！下面，我们考虑对其进行重构。首先，通过 `NuGet` 安装一个微软提供的包：

```shell
dotnet add package Microsoft.AspNetCore.HeaderPropagation
```

接下来，我们在 `Startup` 中对 `HeaderPropagation` 进行简单配置：

```csharp
services.AddHeaderPropagation(options =>
{
    // 如果请求头中含 X-BetaFeatures 字段，则传播该字段对应的值
    options.Headers.Add("X-BetaFeatures");

    // 如果请求头中不含 X-BetaFeatures 字段，则生成一个新的值并进行传播
    // 注意，这里以 GUID 为例
    options.Headers.Add("X-BetaFeatures", context =>
    {
        return Guid.NewGuid().ToString("N");
    });
});
```

那么，这些请求头会传播到哪里呢？答案是 `HttpClient`，所以，你可以想到，不管是 `RESTful` 风格的 `API` 还是 `gRPC` 都可以享受到这一便利：

```csharp
// 传播所有注册过的请求头，如 X-BetaFeatures 
services
    .AddHttpClient("Ezio")
    .AddHeaderPropagation();

// 仅传播指定的请求头，如 X-BetaFeatures、X-Experiments
services
    .AddHttpClient("Altaïr")
    .AddHeaderPropagation(options => {
        options.Headers.Add("X-BetaFeatures", "X-Experiments");
    });
```

最后，我们还需要在请求管道中启用相应的中间件：

```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // ...
    // 注意：请放置在 app.UseRouting(); 前面
    app.UseHeaderPropagation();

    // ...
}

```

对于我们而言，我们需要让 `Jeager` 相关的请求头传播下去，因此，我们只需要像下面这样改造即可。当然，这些请求头会由 `Envoy` 自动生成，所以，我们同样不需要考虑它不存在的情况：

```csharp
services.AddHeaderPropagation(opt =>
{
    opt.Headers.Add("x-request-id");
    opt.Headers.Add("x-b3-traceid");
    opt.Headers.Add("x-b3-spanid");
    opt.Headers.Add("x-b3-parentspanid");
    opt.Headers.Add("x-b3-sampled");
    opt.Headers.Add("x-b3-flags");
    opt.Headers.Add("x-ot-span-context");
});

services.AddHttpClient("PaymentService", client =>
{
    client.BaseAddress = new Uri("http://127.0.0.1:9090");
})
.AddHeaderPropagation();
```

改造后的效果如何呢？博主表示，一切非常完美！

![It's Amazing！](/posts/利用-ASP.NET-Core-中的-HeaderPropagation-实现分布式追踪/Envoy-Jeager-Tracing.png)

关于这个中间件内部是如何运作的，大家可以阅读它的 [源代码](https://github.com/dotnet/aspnetcore/tree/main/src/Middleware/HeaderPropagation)，博主这里画了一个简单的示意图：

![HeaderPropagation 中间件示意图](/posts/利用-ASP.NET-Core-中的-HeaderPropagation-实现分布式追踪/HeaderPropagation.drawio.png)

可以注意到，这个中间件内部会维护一个叫做 `HeaderPropagationValues` 的对象实例，其生命周期为 `Singleton`，当有入站请求产生时，它会尝试从 `HttpContext` 中读取指定的请求头，并保存到 `HeaderPropagationValues` 实例的 `Headers` 属性中中。当我们注入 `HttpClient` 的时候，中间件内部会创建一个 `HeaderPropagationMessageHandler` 实例，它继承自 `DelegatingHandler`。如果你看过我以前的文章，[《使用 HttpMessageHandler 实现 HttpClient 请求管道自定义》](/posts/2070070822/)，相信你会在电光火石间明白我在说什么。总而言之，通过这个 Handler，你就可以把保存下来的请求头添加到 HttpClient 的实例上，相当于我们一开始手动设置请求头的这个环节，这样，这些请求头就可以“自动”传播下去啦！

![通过 HeaderPropagation 中间件传递请求头字段](/posts/利用-ASP.NET-Core-中的-HeaderPropagation-实现分布式追踪/HeaderPropagation.Logs.png)


其实，除了这个分布式链路跟踪的场景，更一般的场景，或许是认证的场景。譬如，客户端通过认证服务拿到了一个令牌，它在向后端发起请求的时候，会把这个令牌添加到请求头中。此时，我们只需要确保所有后端服务都配置了这个中间件，令牌会随着调用链路一路传播下去，这样，是不是比每个服务间都相互协商如何传递身份信息要好的多呢？我想，这是毫无疑问的，做正确的事情永远比单纯的做事情要重要得多。好啦，以上就是这篇博客的全部内容啦，如果大家对博客内容有任何意见或者建议，欢迎大家在评论区留言，谢谢大家！







