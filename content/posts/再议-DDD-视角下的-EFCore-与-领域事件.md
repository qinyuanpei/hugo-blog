---
categories:
- 编程语言
copyright: true
date: 2022-05-28 16:37:47
description: ''
slug: Review-EFCore-And-Domain-Events-From-DDD-Perspective
tags:
- DDD
- EFCore
- 领域事件
- Kafka
title: 再议 DDD 视角下的 EFCore 与 领域事件
toc: true
image: /posts/再议-DDD-视角下的-EFCore-与-领域事件/Domain-Model-Ordering-MicroService.png
---
在上家公司工作的时候，我们有部分业务是采用事件/消息驱动的形式。虽然，当时博主还没能用上诸如 `Kafka`、`RabbitMQ` 这样的消息中间件，可数据库 + `Quartz` 这样一个堪称“简陋”的组合，完全不影响博主对事件/消息驱动这种思想的启蒙。后来，在实现[数据库审计](/posts/1289244227/)、[数据同步](/posts/580694660/) 等问题的时候，更是从实践层面上加深了这一印象。再后来，博主陆陆续续地接触了 [DDD](https://www.jdon.com/ddd.html)，其中 [领域事件](https://www.jdon.com/event.html) 的概念，第一次让博主意识到，原来事件可以和聚合根产生某种联系。退一步讲，即使你没有接触过 `DDD`，你只要听说过 [MediatR](https://github.com/jbogard/MediatR) 或者 [CQRS](https://docs.microsoft.com/zh-cn/azure/architecture/patterns/cqrs)，相信你立马就能明白我在说什么。最近的一次 Code Review，这个问题再次浮出水面，一个人在面对过去的时候，会非常容易生出物是人非的感慨，代码和人类最大的区别就在于，代码可以永远以某种永恒的形式存在，就像很多年后我打开高中时候用 Visual Basic 编写的程序，它依然可以像我第一次看见它一样运行。所以，一直在变化的大抵是我，无非是人类更擅长自我说服，它让你相信你一直“不忘初心”。因此，今天我想再聊聊 `DDD` 视角下的 `EFCore` 与 领域事件。

# 似曾相识燕归来

其实，人生中有特别多的似曾相识，就像 Wesley 老大哥和我说起 [Kubernetes](https://kubernetes.io/zh/) 的时候，我脑海中一直浮现着的画面，是第一次见到他的时候，他意气风发地给我讲 [MSBuild](https://docs.microsoft.com/zh-cn/visualstudio/msbuild/msbuild?view=vs-2022) 和 单元测试。为什么会记得他意气风发的样子呢？大概是有一天我到他这个年龄的时候，我终于羡慕彼时彼刻的他，还拥有着这样一副意气风发的面孔罢。对于大部分事件/消息驱动的业务，相信大家都见到过类似下面这样的代码片段：

```csharp
// 保存订单
var orderInfo = new OrderInfo(
    address: "陕西省西安市雁塔区大雁塔北广场", 
    telephone: "13456789091", 
    quantity: 10, 
    remarak: "盛夏白瓷梅子汤，碎冰碰壁铛啷响"
); 

_repository.Insert(orderInfo);
_chinookContext.SaveChnages();

// 发布消息
var orderInfoCreateEvent = orderInfo.Adapt<OrderInfoCreateEvent>();
eventBus.Publish(orderInfoCratedEvent)
```
这段代码非常容易理解，当我们创建完一个订单以后，需要发布一条订单创建的消息。当时组内做 Code Review 的时候，大家都普遍认为，`Publish()` 需要放在 `SaveChanges()` 后面，理由是：如果 `Publish()` 放在 `SaveChanges()` 前面，可能会出现消息发出去了，而数据没有保存成功的情况。这个想法当然没有问题，唯一的问题在于，实际业务中构造消息的过程绝不可能如此简单，如果它依赖中间过程的变量或者参数，你不可能总是有机会把这个过程放到 `SaveChanges()` 后面，更不必说，实际业务中可能会要求你在订单里处理客户相关的事件。显然，这种方案对代码的侵入非常严重。那么，有没有更好一点的方案呢？

```csharp
// Entity 定义，适用于无单主键或使用联合主键
public abstract class Entity : IEntity
{
    private List<IDomainEvent> _domainEvents = null;
    public IReadOnlyCollection<IDomainEvent> DomainEvents 
        => _domainEvents?.AsReadOnly();

    // 添加事件
    public void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents = _domainEvents ?? new List<IDomainEvent>();
        _domainEvents.Add(eventItem);
    }
    
    // 移除事件
    public void RemoveDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents?.Remove(eventItem);
    }
    
    // 清除事件
    public void ClearDomainEvents()
    {
        _domainEvents?.Clear();
    }

    public abstract object[] GetKeys();
    public virtual DateTime CreatedAt { get; set; }
    public virtual string CreatedBy { get; set; }
}

// Entity 定义，适用于单主键
public abstract class Entity<TKey> : Entity, IEntity<TKey>
{
    public TKey Id { get; set; }
	public override object[] GetKeys() => new object[] { Id };
}
```

我们不妨来换一种思路，既然我们期待这些 `Publish()` 相关的代码片段总是在 `SaveChanges()` 后面执行，那么，我们是不是可以将这些事件/消息存储下来，然后在某个合适的时机进行触发呢？当然，利用 `.NET` 里的委托就能达到这种延迟执行的目的，我们这里采用的方案是为每个 `Entity` 增加一个 `DomainEvents` 的属性，并通过重写 `DbContext` 的 `SaveChanges()` 方法来实现消息的分发，这里我们暂时不考虑事务，因为对于像 `Kafka`、`RabbitMQ` 这样的消息队列，基本上都不支持消息的撤回，换言之，其实这里是保证不了 `SavaChanges()` 和 `Publish()` 的一致性的：

```csharp
// OrderInfoCreatedEvent 继承自 DomainEvent
public class OrderInfoCreatedEvent : DomainEvent
{
    public string Remark { get; set; }
    public string Address { get; set; }
    public string Telephone { get; set; }
    public decimal Quantity { get; set; }
}

// DomainEvent 实现了 IDomainEvent 接口
public class DomainEvent : IDomainEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
}
```

此时，注意到，所有的消息都实现了 `IDomainEvent` 接口，所以，对于一开始的示例，我们可以像下面这样来改造。这里，我们采用 `DDD` 的思想来改造这段代码，即按照“充血模型”，为 `OrderInfo` 类添加更多的行为，我们不妨假设，当创建订单的时候，需要产生一条 `OrderInfoCreatedEvent` 消息；当修改订单地址的时候，需要产生一条 `OrderInfoUpdatedEvent` 消息，我们来看看改造以后的代码会变成什么样子：

```csharp
var orderInfo = new OrderInfo(
    address: "陕西省西安市雁塔区大雁塔北广场", 
    telephone: "13456789091", 
    quantity: 10, 
    remarak: "盛夏白瓷梅子汤，碎冰碰壁铛啷响"
); 
// 确认订单
orderInfo.Confirm();
_repository.Insert(orderInfo);

// 修改地址
orderInfo.ModifyAddress("陕西省西安市雁塔区卜蜂莲花超市");
await _chinookContext.SaveChangesAsync();
```

其中，`OrderInfo` 内部定义了 `Confirm()` 和 `ModifyAddress` 两个方法用来处理对应的领域事件：

```csharp
public class OrderInfo : Entity<Guid>
{
    // .... 

    public void Confirm()
    {
        CreatedBy = "System";
        CreatedAt = DateTime.Now;
        AddDomainEvent(this.Adapt<OrderInfoCreatedEvent>());
    }

    public void ModifyAddress(string address)
    {
        Address = address;
        AddDomainEvent(this.Adapt<OrderInfoUpdatedEvent>());
    }
}
```

可以注意到，鉴于 `Entity` 这个基类中可以操作领域事件，所以，我们只需要在合适的位置调用 `AddDomainEvent()` 即可。当然，按照 `DDD` 的思想，业务通常是针对某个聚合根来开展的，所以，你会看到人们更倾向于让 `DomainEvent` 成为聚合根的一部分。这里，博主的主要目的是想证明这种方案的可行性，个人以为，即使是放在实体上，一样是无伤大雅。大家可能会疑惑，博主你这样改造完以后，`Publish()`相关的代码片段哪里去了呢？还记得博主说过要对 `DbContext` 动一点小手术吗？我们一起来看看：

```csharp
public class ChinookContext : DbContext
{
    private readonly IDomainEventDispatcher _domainEventDispatcher;
    public ChinookContext(IDomainEventDispatcher domainEventDispatcher)
    {
        _domainEventDispatcher = domainEventDispatcher;
    }

    // .... 

    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        var entities = ChangeTracker.Entries()
            .Where(x => x.Entity is Entity && ((Entity)x.Entity).DomainEvents.Any())
            .Select(x => (Entity)x.Entity)
            .ToList();

        foreach (var entity in entities)
        {
            await _domainEventDispatcher.DispatchDomainEvent(entity.DomainEvents, cancellationToken);
            entity.ClearDomainEvents();
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

可以注意到，我们对 `DbContext` 的 `SaveChangesAsync()` 方法进行了重写，并利用 `EntityFramework` 的 `ChangeTracker` 特性对附加在每个实体的 `DomainEvents`进行收集，此时，我们只需要把每一个领域事件发布出去即可。请注意，`DbContext` 中 `SaveChanges()` 方法拥有多个重载形式，保险起见，你应该重写所有方法，这里仅仅以 `SaveChangesAsync()` 方法作为演示。对于 `IDomainEventDispatcher` 这个接口而言，它的定义其实非常简单，就单纯是一个事件分发器，你可以提供任何消息中间件，如 `Kafka`、`RabbitMQ` 等等的实现：

```csharp
public interface IDomainEventDispatcher
{
    public Task DispatchDomainEvent<TDomainEvent>(
        IEnumerable<TDomainEvent> domainEvents, 
        CancellationToken cancellationToken = default
    ) where TDomainEvent : IDomainEvent;
}
```

在大多数关于 `DDD` 的文章中，当提到“事件”这个概念的时候，下面的这个事件处理器的定义一定不会缺席。这其实可以牵扯出领域事件和集成事件的区别，领域事件，可以认为是一个领域内，不同聚合根之间互相传递事件，因此，领域事件通常都是进程内的事件，像 [MediatR](https://github.com/jbogard/MediatR) 这样的库就非常合适；而集成事件，则是不同微服务间互相传递事件，因此，集成事件一定是跨服务、跨进程的事件，像  `Kafka`、`RabbitMQ` 这样的消息队列就非常合适。

```csharp
public interface IEventHandler<TEventData> : IEventHandler 
    where TEventData : IEventData
{
    void HandleEvent(TEventData eventData);
}
```

虽然，博主目前工作中接触的主要是集成事件，甚至我们发布到 Kafka 中的是二进制形式的 Protobuf，可博主还是在尝试不断思考，是不是当下这个处境就是做好的方案。坦白讲，这篇博客里的内容并不算新颖，因为类似的 `EventBus`，我在两年前左右就曾亲手实现过，至少在上家公司的时候，面对同样的侵入式的“消息服务”，我个人当时是非常推崇这种事件/消息驱动业务的理念的。现在回过头再看，其实是因为整个物流的生命周期是确定的，业务上的分歧更多的是在中间环节产生，所以，至少在当时看来，事件/消息驱动业务的理念是完全正确的，唯一的问题在于“面条式”的业务代码被这些“消息服务”侵入地面目全非。直到来到现在的公司，发觉业务被 `Kafka` 肢解地支离破碎，平时工作中大家问的最多的问题居然是，Topic 是啥？Protobuf 是啥？Command 还是 Event？这无疑又让我对这种方案的合理性产生怀疑，作为一个人类，果然都拥有着始终都打不破的历史局限性啊！


# 且将新火试新茶

OK，到目前为止，我们基本上讲清楚了整个方案的运作机制，其实，早在两年前，博主就曾使用过类似的技术来实现 [数据库审计](https://blog.yuanpei.me/posts/1289244227/)，彼时彼刻，我对于 `DDD` 和 `领域事件`，更多的是一种浅尝辄止的态度，甚至在上家公司工作时的核心冲突，是源于它有大量的数据同步的需求，我们需要一种更优雅的方式来“通知”数据的变更，而不是在代码里到处“埋点”，所以，从某种意义上来讲，今时今日与那年那月是如此的似曾相识，我还是想找到一种方法来规避这些“埋点”。诚然，重写 `DbContext` 的 `SaveChnages()` 方法是一种方案，不过，自从 `EntityFramework` 支持 [SaveChanges Events](https://github.com/dotnet/efcore/pull/21862) 特性以后，我们又有了一种新的选择。

```csharp
public event EventHandler<SavingChangesEventArgs> SavingChanges;
public event EventHandler<SavedChangesEventArgs> SavedChanges;
public event EventHandler<SaveChangesFailedEventArgs> SaveChangesFailed;
```

简单来说，这个特性为 `DbContext` 增加了三个事件，分别表示保存中、保存后、保存失败，所以，像这种保存到数据库以后再发消息的“一心流”，我们可以使用用下面的方法：

```csharp
_chinookContext.SavedChanges += async (s, e) => 
{
    var context = s as ChinookContext;

    var entities = context.ChangeTracker.Entries()
        .Where(x => x.Entity is Entity && ((Entity)x.Entity).DomainEvents.Any())
        .Select(x => (Entity)x.Entity)
        .ToList();

    foreach (var entity in entities)
    {
        await _domainEventDispatcher.DispatchDomainEvent(entity.DomainEvents);
        entity.ClearDomainEvents();
    }
};
```

这个方案看起来还不错，特别是你没有机会去修改 `DbContext` 的时候，这会是个非常完美的思路。当然，如果觉得这个方案还不过瘾，你还可以考虑繼承 `SaveChangesInterceptor` 实现一个拦截器，下面以其中一个虚方法 `SavedChanges()` 为例：

```csharp
public class DbContextInterceptor : SaveChangesInterceptor
{
    public override int SavedChanges(
        SaveChangesCompletedEventData eventData, int result)
    {
        // 获取 DbContext
        var context = eventData.Context;

        // ....

        return base.SavedChanges(eventData, result);
    }
}
```

显然，只要在这里拿到 `DbContext`，剩下的事情就变得非常简单啦！什么叫做“且将新火试新茶”呢？大概就是当你看到这段代码的时候，突然意识到两年前写的数据库审计，应该可以使用这个方法重构一下。这个世界上的东西，每一分每一秒都在发生着变化，连同在这里写下这些只言片语的我，连同在屏幕前看到这些文过饰非的你，也许，追求永恒不变的人都是贪心的人，只是我们自己不愿意承认罢了。可恰恰是因为这个世界纷繁多变，所以，矢志不渝、海枯石烂这种只在童话故事里出现的字眼，始能衬托出这人世间的弥足珍贵，不是吗？就像我以前以为代码不会变，可当你看到过去的代码，突然有了新的体会的时候，这一切终究还是变了。大抵，一切事物间的关系，像磁场一样有强弱的区别，只需要一个人轻轻地走开，留给对方熟悉世界里的仓促与陌生。


# 谁道人生无再少

从写下这篇文章的那一刻，我已然三十岁啦，至少从年龄上我已不能再被叫做少年。现在写博客更像是一种心态的描摹，甚至有非常多的内容或者想法，都是在写作过程中一点点追加上去的，所以，你看到我选用了几句诗做了这篇文章的二级标题，根本原因是一开始计划写的时候，只有一个非常模糊的大纲。写这篇文章的动机，一来是先后在两家公司遇到伴随着“埋点”而生的代码侵入问题，二来则是对消息/事件驱动这种业务模式的反思。譬如过去实现 `EventBus` 都是用 `EventHandler` 来处理消息，强类型/泛型带来是依赖注入、程序集扫描方面的便利。而新公司则是采用委托来实现消息的订阅处理，两种模式都可以工作得非常好，我属实说不上来哪一种会更好一点。在这个过程中，渐渐地理解了过去理解不了的原理，所以，这应该可以算作一种收获，`DDD`对当下业务而言是否合适，我还没有找到答案，不过，单纯地去使用“充血模型”应该可以算做一种进步，就像以前实现 `ValueObject` 要考虑很多东西，而现在可以直接使用 `Record`，这种意识有时候是潜移默化的、甚至是可遇不可求的，也许，这就是一个人开始变老的征兆，谁知道呢？谢谢大家，本文完！
