﻿---
abbrlink: 1071063696
categories:
- 编程语言
date: 2019-07-04 08:56:28
description: Payne在博客中分享了对XML与JSON在数据交换中的使用背景与困扰，探讨了HTTP异步化方案中的实际场景与解决方法。他介绍了Hangfire作为Quartz的替代品的使用方法和可扩展性，展示了通过HTTP调用的HttpJob的实现方式，以及如何使用Hangfire进行任务调度和记录日志。整体内容围绕着异步化处理、后台任务系统的应用与扩展展开，为读者提供了一些实践参考和技术思路。
slug: 1071063696
tags:
- .NET Core
- Hangfire
- HTTP
title: 使用 ASP.NET Core 和 Hangfire 实现 HTTP 异步化方案
---

Hi，大家好，我是 Payne，欢迎大家一如既往地关注我的博客。今天这篇博客里的故事背景，来自我工作中的一次业务对接，因为客户方提供的是长达上百行的 XML，所以一度让更喜欢使用 JSON 的博主感到沮丧，我这里不是想讨论 XML 和 JSON 彼此的优缺点，而是我不明白 AJAX 里的 X 现在基本都被 JSON 替代了，为什么还有这么多的人坚持使用并友好的 XML 作为数据的交换协议呢？也许你会说，因为有这样或者那样等等的理由，就像 SOA、ESB、SAP 等等类似的技术在企业级用户依然大量流行一样，而这些正是“消费”XML 的主力军。我真正想说的是，在对接这类接口时，我们会遇到一个异步化的 HTTP 协议场景，这里的异步和多线程、async/await 没有直接关系，因为它描述的实际上是业务流程上的一种“异步”。
# 引子-想对 XML 说不
我们知道，HTTP 协议是一个典型的请求-响应模型，由调用方(Client)调用服务提供者(Server)提供的接口，在理想状态下，后者在处理完请求后会直接返回结果。可是当后者面对的是一个“耗时”任务时，这种方式的问题就立马凸显出来，此时调用者有两个选择：一直等对方返回直至超时(同步)、隔一会儿就看看对方是否处理完了(轮询)。这两种方式，相信大家都非常熟悉了，如果继续延伸下去，我们会联想到长/短轮询、SignalR、WebSocket。其实，更好的方式是，我们接收到一个“耗时”任务时，立即返回表明我们接收了任务，等任务执行完以后再通知调用者，这就是我们今天要说的 HTTP 异步化方案。因为对接过程中，客户采用的就是这种方案，ESB 这类消息总线本身就提供了这种功能，可作为调用方的博主就非常难受啦，因为明明能“同步”地处理完的事情，现在全部要变成“异步”处理，就像一个习惯了 async/await 语法糖的人，突然间就要重新开始写 APM 风格的代码，宝宝心里苦啊，“异步”处理就异步处理嘛，可要按人家要求去返回上百行的 XML，博主表示想死的心都有了好嘛……

好了，吐槽归吐槽，吐槽完我们继续梳理下 HTTP 异步化的方案，这种方式在现实生活中还是相当普遍的，毕竟人类都是“异步”做事，譬如“等你哪天有空一起吃个饭”，测试同事对我说得最多的话就是，“等你这个 Bug 改完了同我说一声”，更不用说，JavaScript 里典型的异步单线程的应用等等……实现“异步”的思路其实是非常多的，比如同样在 JavaScript 里流行的回调函数，比如通过一张中间表存起来，比如推送消息到消息队列里。在面向数据库编程的时候，我听到最多的话就是，没有什么问题是不能用一张中间表来解决的，如果一张不行那就用两张。项目上我是用 Quartz+中间表的方式实现的，因为这是最为普通的方式。这里，我想和大家分享下，关于使用 Hangfire 来实现类似 Quartz 定时任务的相关内容，果然，我这次又做了一次标题党呢，希望大家会对今天的内容感兴趣。简单来说，我们会提供一个接口，调用方提供参数和回调地址，调用后通过 Hangfire 创建后台任务，等任务处理结束后，再通过回调地址返回结果给调用方，这就是所谓的 HTTP 异步化。
# 开箱即用的 Hangfire
我们项目上是使用 Quartz 来实现后台任务的，因为它采用了反射的方式来调用具体的 Job，因此，它的任务调度和任务实现是耦合在同一个项目里的，常常出现单个 Job 引发整个系统卡顿的情况，尤其是是它的触发器，常常导致一个 Job 停都停不下来，直到后来才渐渐开始通过 Web API 来分离这两个部分。Quartz 几乎没有一个自己的可视化界面，我们为此专门为它开发了一套 UI。我这里要介绍的 Hangfire，可以说它刚好可以作为 Quartz 的替代品，它是一个开箱即用的、轻量级的、开源后台任务系统，想想以前为 Windows 开发定时任务，只能通过定时器(Timer)来实现，尚不知道 CRON 为何物，而且只能用命令行那种拙劣的方式来安装/卸载，我至今都记得，测试同事问我，能不能不要每次都弹个黑窗口出来，这一起想起来还真是让人感慨啊。好了，下面我们开始今天的实践吧！首先，第一步自然是安装 Hangfire 啦，这里我们新建一个 ASP.NET Core 的 Web API 项目就好，然后通过 NuGet 依次安装以下库：
```Shell
Install-Package HangFire
Install-Package Hangfire.MySql.Core
```
这里我们选择了 MySQL 来实现任务的持久化，从官方的流程图中可以了解到，Hangfire 有服务端、持久化存储和客户端三大核心部件组成，而持久化存储这块儿，除了官方默认的 SQLServer(可以集成 MSMQ)以外，还支持 Redis、MongoDB 等，Hangfire 使用起来是非常简单哒，首先在 Startup 类的 ConfigureServices()方法中注入 Hangfire 相关的服务，然后在 Configure()方法中使用 HangfireServer 和 UseHangfireDashboard 即可：

```CSharp
public void ConfigureServices (IServiceCollection services) {
    //为了简化说明，已忽略该方法中无关的代码
    services.AddHangfire (x =>
        x.UseStorage (new MySqlStorage (Configuration.GetConnectionString ("Hangfire")))
        .UseFilter (new HttpJobFilter ())
        .UseSerilogLogProvider ()
    );
}

public void Configure (IApplicationBuilder app, IHostingEnvironment env) {
    //为了简化说明，已忽略该方法中无关的代码
    app.UseHangfireServer (new BackgroundJobServerOptions () {
        Queues = new string[] { "default" },
        WorkerCount = 5,
        ServerName = "default",
    });
    app.UseHangfireDashboard ();
    app.ApplicationServices.GetService<ILoggerFactory> ().AddSerilog ();
}
```

注意到在配置持久化的部分，我们使用了一个数据库连接字符串 Hangfire，它需要我们在 appsettings.json 中配置 ConnectionStrings 部分。这里我们为 Hangfire 设置了默认队列 default、默认服务器 default、并发数目为 5。与此同时，我们开启了 Hangfire 中自带的 Dashboard，可以通过这个界面来监控后台任务的执行情况。此时运行项目，输入以下地址：http://locahost:<port>/hangfire，就会看到下面的画面，这说明 Hangfire 配置成功：

![Hangfire Dashboard](https://ww1.sinaimg.cn/large/4c36074fly1g4vsktdif4j21hb0rz406.jpg)

Hangfire 中默认支持四种类型的后台任务，他们分别是**Fire-and-forget jobs**、**Delayed jobs**、**Recurring jobs**和**Continuations**。严格来说，**Fire-and-forget jobs**和**Delayed jobs**并不能算后台任务，因为它们在执行一次后就会从队列中移除，属于一次性“消费”的任务，这两者的不同在于**Delayed jobs**可以在设定的时间上延迟执行。而**Recurring jobs**和**Continuations**则是周期性任务，任务在入队后可以按照固定的时间间隔去执行，周期性任务都是支持 CRON 表达式的，**Continuations**类似于 Task 中的 ContinueWith()方法，可以对多个任务进行组合，我们现在的项目中开发了大量基于 Quartz 的 Job，可当你试图把这些 Job 相互组合起来的时候，你就会觉得相当尴尬，因为后台任务做所的事情往往都是大同小异的。从官方文档中 ，我们会发现 Hangfire 的关键代码只有下面这四行代码，可以说是相当简洁啦！

```CSharp
//Fire-and-forget jobs
var jobId = BackgroundJob.Enqueue(
    () => Console.WriteLine("Fire-and-forget!"));

//Delayed jobs
var jobId = BackgroundJob.Schedule(
    () => Console.WriteLine("Delayed!"),
    TimeSpan.FromDays(7));

//Recurring jobs
RecurringJob.AddOrUpdate(
    () => Console.WriteLine("Recurring!"),
    Cron.Daily);

//Continuations
BackgroundJob.ContinueWith(
    jobId,
    () => Console.WriteLine("Continuation!"));
```

Hangfire 除了这种偏函数式风格的用法以外，同样提供了泛型版本的用法，简而言之，泛型版本是自带依赖注入的版本。众所周知，稍微复杂点的功能，常常会依赖多个服务，比如后台任务常常需要给相关人员发邮件或者是消息，此时，Job 的实现就会依赖 MailService 和 MessageService。Hangfire 内置了基于 Autofac 的 IoC 容器，因此，当我们使用泛型版本时，它可以自动地从容器中 Resolve 相应的类型出来。事实上，我们可以通过重写 JobActivator 来实现自己的依赖注入，譬如博主就喜欢 Castle。下面是一个简单的例子：

```CSharp
//Define a class depends on IDbContext & IEmailService
public class EmailSender
{
    private IDbContext _dbContext;
    private IEmailService _emailService;

    public EmailSender()
    {
        _dbContext = new DbContext();
        _emailService = new EmailService();
    }

    // ...
}

//When it is registered in Ioc Container
BackgroundJob.Enqueue<EmailSender>(x => x.Send("Joe", "Hello!"));
```

# 可扩展的 Hangfire

OK，在对 Hangfire 有了一个初步的了解以后，我们再回到本文的题目，我们希望实现一个基于 HTTP 方式调用的 HttpJob。因为我们不希望任务调度和具体任务放在一起，我们项目上采用 Quartz 来开发后台任务，它要求我们实现一个特定接口 IbaseJob，最终任务调度时会通过反射来创建 Job，就在刚刚过去的这周里，测试同事向我反馈了一个 Bug，而罪魁祸首居然是因为某个 DLL 没有分发，所以，我希望实现一个基于 HTTP 方式调用的 HttpJob，这既是为了将任务调度和具体任务分离，同时为了满足这篇文章开头描述的场景，得益于 Hnagfire 良好的扩展性，我们提供了一组 Web API，代码如下：

```CSharp
/// <summary>
/// 添加一个任务到队列并立即执行
/// </summary>
/// <param name="jobDescriptor"></param>
/// <returns></returns>
[HttpPost ("AddEnqueue")]
public JsonResult Enqueue (HttpJobDescriptor jobDescriptor) {
    try {
        var jobId = string.Empty;
        jobId = BackgroundJob.Enqueue (() => HttpJobExecutor.DoRequest (jobDescriptor));
        return new JsonResult (new { Flag = true, Message = $"Job:#{jobId}-{jobDescriptor.JobName}已加入队列" });
    } catch (Exception ex) {
        return new JsonResult (new { Flag = false, Message = ex.Message });
    }
}

/// <summary>
/// 添加一个延迟任务到队列
/// </summary>
/// <param name="jobDescriptor"></param>
/// <returns></returns>
[HttpPost ("AddSchedule")]
public JsonResult Schedule ([FromBody] HttpJobDescriptor jobDescriptor) {
    try {
        var jobId = string.Empty;
        jobId = BackgroundJob.Schedule (() => HttpJobExecutor.DoRequest (jobDescriptor), TimeSpan.FromMinutes ((double) jobDescriptor.DelayInMinute));
        return new JsonResult (new { Flag = true, Message = $"Job:#{jobId}-{jobDescriptor.JobName}已加入队列" });
    } catch (Exception ex) {
        return new JsonResult (new { Flag = false, Message = ex.Message });
    }
}

/// <summary>
/// 添加一个定时任务
/// </summary>
/// <param name="jobDestriptor"></param>
/// <returns></returns>
[HttpPost ("AddRecurring")]
public JsonResult Recurring ([FromBody] HttpJobDescriptor jobDescriptor) {
    try {
        var jobId = string.Empty;
        RecurringJob.AddOrUpdate (jobDescriptor.JobName, () => HttpJobExecutor.DoRequest (jobDescriptor), jobDescriptor.Corn, TimeZoneInfo.Local);
        return new JsonResult (new { Flag = true, Message = $"Job:{jobDescriptor.JobName}已加入队列" });
    } catch (Exception ex) {
        return new JsonResult (new { Flag = false, Message = ex.Message });
    }
}

/// <summary>
/// 删除一个定时任务
/// </summary>
/// <param name="jobName"></param>
/// <returns></returns>
[HttpDelete ("DeleteRecurring")]
public JsonResult Delete (string jobName) {
    try {
        RecurringJob.RemoveIfExists (jobName);
        return new JsonResult (new { Flag = true, Message = $"Job:{jobName}已删除" });
    } catch (Exception ex) {
        return new JsonResult (new { Flag = false, Message = ex.Message });
    }
}

/// <summary>
/// 触发一个定时任务
/// </summary>
/// <param name="jobName"></param>
/// <returns></returns>
[HttpGet ("TriggerRecurring")]
public JsonResult Trigger (string jobName) {
    try {
        RecurringJob.Trigger (jobName);
        return new JsonResult (new { Flag = true, Message = $"Job:{jobName}已触发执行" });
    } catch (Exception ex) {
        return new JsonResult (new { Flag = false, Message = ex.Message });
    }

}

/// <summary>
/// 健康检查
/// </summary>
/// <returns></returns>
[HttpGet ("HealthCheck")]
public IActionResult HealthCheck () {
    var serviceUrl = Request.Host;
    return new JsonResult (new { Flag = true, Message = "All is Well!", ServiceUrl = serviceUrl, CurrentTime = DateTime.Now });
}

```

你可以注意到，这里用到其实还是四种后台任务，在此基础上增加了删除 Job 和触发 Job 的接口，尤其是触发 Job 执行的接口，可以弥补 Quartz 的不足，很多时候，我们希望别人调了接口后触发后台任务，甚至希望在编写 Job 的过程中使用依赖注入，因为种种原因，实施起来总感觉有点碍手碍脚。这里我们定义了一个 HttpJobExecutor 的类，顾名思义，它是执行 Http 请求的一个类，说来惭愧，我写作这篇博客时，是一边看文档一边写代码的，所以，等我实现了这里的 HttpJobExecutor 的时候，我忽然发现文档中关于依赖注入的内容，简直相见恨晚啊。这里直接给出它的实现，我要再一次安利 RestSharp 这个库，比 HttpWebRequest、HttpClient 这两套官方的 API 要好用许多，可还是有人喜欢一遍又一遍地封装啊，话说自从我们把 WCF 换成 Web API 后，看着相关同事在 Git 上的折腾历史，果然还是回到了写 Http Client 的老路上来，话说在纠结是手写代理还是动态代理的时候，Retrofit 了解下啊！

```csharp
[HttpJobFilter]
public static void DoRequest (HttpJobDescriptor jobDestriptor) {
    var client = new RestClient (jobDestriptor.HttpUrl);
    var httpMethod = (object) Method.POST;
    if (!Enum.TryParse (typeof (Method), jobDestriptor.HttpMethod.ToUpper (), out httpMethod))
        throw new Exception ($"不支持的HTTP动词：{jobDestriptor.HttpMethod}");
    var request = new RestRequest ((Method) httpMethod);
    if (jobDestriptor.JobParameter != null) {
        var json = JsonConvert.SerializeObject (jobDestriptor.JobParameter);
        request.AddParameter ("application/json", json, ParameterType.RequestBody);
    }
    var response = client.Execute (request);
    if (response.StatusCode != HttpStatusCode.OK)
        throw new Exception ($"调用接口{jobDestriptor.HttpUrl}失败，接口返回：{response.Content}");
}
```

在这里，我们以 HealthCheck 这个接口为例，来展示 HttpJob 是如何工作的。顾名思义，这是一个负责健康检查的接口。我们现在通过 Postman 来触发健康检查这个后台任务。在这里，该接口是一个 GET 请求：

![通过Postman创建后台任务](https://ww1.sinaimg.cn/large/4c36074fly1g4v4si2z4tj20t10cvaam.jpg)

接下来，我们我们就会在 Hangfire 的 Dashborad 中找到对应的记录，因为这是一个**Fire & Forget**类型的任务，因此我们几乎看不到中间的过程，它就已经执行结束啦。我们可以在 Dashboard 中找到对应的任务，然后了解它的具体执行情况。值得一提的是，Hangfire 自带了重试机制，对于执行失败的任务，我们可以重试栏目下看到，这里是其中一条任务的执行记录。可以注意到，Hangfire 会把每个 Job 的参数序列化为 JSON 并持久化起来，仔细对照的话，你会发现，它和我们在 Postman 中传入的参数是完全一样的！

![Hangfire中Job执行详情查看](https://ww1.sinaimg.cn/large/4c36074fly1g4v55j6cgfj21160j8wfq.jpg)



在执行 Job 的过程中，我们可能会希望记录 Job 执行过程中的日志。这个时候，Hangfire 强大的扩展性再次我们提供了这种可能性。注意到在 HttpJobExecutor 类上有一个 [HttpJobFilter]的标记，显然这是由 Hangfire 提供的一个过滤器，博主在这个过滤器中对 Job 的 ID、状态等做了记录，因为在整个项目中博主已经配置了 Serilog 作为 Hangfire 的 LogProvider，所以，我们可以在过滤器中使用 Serilog 来记录日志，不过博主个人感觉这个 Filtre 稍显鸡肋，这里还是给出代码片段吧！

```CSharp
public class HttpJobFilter : JobFilterAttribute, IApplyStateFilter {
    private static readonly ILog Logger = LogProvider.GetCurrentClassLogger ();

    public void OnStateApplied (ApplyStateContext context, IWriteOnlyTransaction transaction) {
        if (context.NewState is FailedState) {
            var failedState = context.NewState as FailedState;
            if (failedState != null) {
                Logger.ErrorException (
                    String.Format ("Background Job #{0} 执行失败。", context.BackgroundJob.Id),
                    failedState.Exception);
            }
        } else {
            Logger.InfoFormat (
                "当前执行的Job为：#{0}, 状态为：{1}。",
                context.BackgroundJob.Id,
                context.NewState.Name
            );
        }
    }

    public void OnStateUnapplied (ApplyStateContext context, IWriteOnlyTransaction transaction) {

    }
}
```

为什么我说这个 Filter 有点鸡肋呢？因为你看下面的图就会明白了啊！

![使用Serilog记录日志](https://ww1.sinaimg.cn/large/4c36074fly1g4vs8s6f2zj21f2074mxq.jpg)

# 本文小结
果然，我还是不得不承认，这又是一篇彻彻底底的"水文"啊,因为写着写着就发现自己变成了标题党。这篇文章总结下来其实只有两句话，一个不喜欢写 XML 报文的博主，如何与 ERP、SAP、ESB 里的 XML 报文斗智斗勇的故事，在这样一个背景下，为了满足对方的"异步"场景, 不得不引入一个后台任务系统来处理这些事情，其实，这个事情用消息队列、用 Redis、甚至普通的中间表都能解决，可惜我写这篇文章的时候，是有一点个人化的情绪在里面的，这种情绪化导致的后果就是，可能我越来越难以控制一篇文章的写作走向啦，大概是写东西越来越困难，而又没有时间取吸收新的知识进来，这让我觉得自己的进步越来越少，Hangfire 的有点说起来就是挺好用的，以上！