---
categories:
- 编程语言
date: 2022-03-20 09:34:36
description: ''
tags:
- gRPC
- Streaming
- 上传
- 下载
title: 利用 gRPC 实现文件的上传与下载
slug: Use-gRPC-to-realize-file-upload-and-download
---

几天前，某人同我抱怨，说是某接口无法正常工作，坦白地讲，这只是程序员生命里再枯燥不过的日常，因为无论“好”或者“不好”，他们都要努力回应来自灵魂深处的那声“为什么”。所以，善待程序员的方式之一，就是不要总问他“为什么”，因为他已经听了太多的“为什么”。经过一番攀谈交心，我了解到是模型绑定出了问题。原来，他需要实现一个导出/下载功能，因为他不确定能否通过 Envoy 代理来自 gRPC 的文件流，故而，他选择了传统的 Web API，结果不曾想在模型绑定上栽了跟头。听完了他的话，我不禁陷入了沉思，难道 gRPC 真的不能做文件的上传和下载吗？常言道，“实践出真知”，所以，今天这篇博客，我们来聊聊利用 gRPC 实现文件的上传和下载。

# 定义 Protobuf

首先，我们来看 `Protobuf` 的定义，此前介绍 gRPC [流式传输](/posts/grpc-streaming-transmission-minimalist-guide/)相关内容的时候，我一直找不到一个更为贴切的场景，而此时此刻，我只想说，冥冥中自有天意，难道还有比上传和下载更好的例子吗？

```protobuf
service FileService {
  rpc UploadFile(stream UploadFileRequest) returns (UploadFileResponse);
  rpc DownloadFile(DownloadFileRequest) returns (stream DownloadFileResponse);
}

//Upload
message UploadFileRequest {
  string FileName = 1;
  bytes Content = 2;
}

message UploadFileResponse {
  string FilePath = 1;
}

//Download
message DownloadFileRequest {
  string FilePath = 1;
}

message DownloadFileResponse {
  bytes Content = 1;
}
```

其中，`UploadFile`是一个针对客户端的流式接口，`DownloadFile`是一个针对服务器端的流式接口，可以注意到，这其实非常符合我们平时对于上传/下载的认知，即，对上传而言，客户端以二进制流的形式作为输入；对下载而言，服务器端以二进制流的形式作为输出。在 `Protobuf` 的定义中，二进制流可以使用 `bytes`类型来表示，因此，我们在 `UploadFileRequest` 和 `DownloadFileResponse` 这两个类型中，统一使用 `Content` 这个字段来表示上传或者下载过程中的二进制流。

# 实现上传

首先，我们来看上传的实现。此时，客户端将以流的方式写入 `UploadFileRequest` 这个参数。假设我们这里不考虑多个文件的上传，那么，我们有两种策略来处理 `UploadFileRequest` 这个参数。方案一是直接把整个文件取出来。然后一次性发出去；方案二则是把整个文件分成不同的块，然后按照顺序逐个发出去。考虑到，我们这里关注的是流式传输，我们采用第二种方案来实现：

```csharp
var uploadResult = fileServiceClient.UploadFile();
var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "ACRouge.png");

using (var fileStream = File.OpenRead(uploadPath))
{
    var sended = 0L;
    var totalLength = fileStream.Length;
    var buffer = new byte[1024 * 1024]; // 每次最多发送 1M 的文件内容
    while (sended < totalLength)
    {
        var length = await fileStream.ReadAsync(buffer);
        sended += length;

        var request = new UploadFileRequest() 
        { 
            Content = ByteString.CopyFrom(buffer), 
            FileName = uploadPath 
        };
        await uploadResult.RequestStream.WriteAsync(request);
    }
}
                        
await uploadResult.RequestStream.CompleteAsync();
var reply = await uploadResult.ResponseAsync;
```

毫无疑问，这里的关键是：设置一个固定大小的缓冲区，每次从文件中读取出一部分，然后将其发送出去，直到整个文件都读取完为止。这样做的好处是，服务器端在接收到这些二进制“块”以后，只需要按照接收顺序写入文件即可。下面，给出的是对应的服务器端的实现：

```csharp
public override async Task<UploadFileResponse> UploadFile(
  IAsyncStreamReader<UploadFileRequest> requestStream, ServerCallContext context)
{
    var requests = new Queue<UploadFileRequest>();
    while (await requestStream.MoveNext())
    {
        var request = requestStream.Current;
        requests.Enqueue(request);
    }

    var first = requests.Peek();
    var fileExt = Path.GetExtension(first.FileName);
    var fileName = $"{Guid.NewGuid().ToString()}{fileExt}";
    var filePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Upload", fileName);

    var fileFolder = Directory.GetParent(filePath);
    if (fileFolder != null && !fileFolder.Exists)
        fileFolder.Create();
            
    using (var fileStream = File.Open(filePath, FileMode.Append, FileAccess.Write))
    {
        var received = 0L;
        while (requests.Count() > 0)
        {
            var current = requests.Dequeue();
            var buffer = current.Content.ToByteArray();
            fileStream.Seek(received, SeekOrigin.Begin);
            await fileStream.WriteAsync(buffer);
            received += buffer.Length;
        }

        return new UploadFileResponse() { FilePath = $"/Upload/{fileName}" };
    }
}
```

这里，我们用一个先入先出的队列来存储由客户端发送的二进制“块”，并根据队列中的首个元素来生成服务器端文件的远程路径，因为这里是单个文件的上传，对于同一批次的二进制流而言，它们对应的是同一个文件。当服务器端接收完该文件后，会返回一个远程路径，客户端可以通过这个远程路径来下载文件。如下图所示，一张 6M 左右的图片，被分成 6 个“流”发送到了服务器端：

![利用 gRPC 实现文件上传](/posts/利用-gRPC-实现文件的上传与下载/gRPC-Streaming-Upload.png)

# 实现下载

下面，我们再来看看下载的实现。其实，服务器端下载的实现，与客户端上传完全一致。为什么这样说呢？因为它们都是从本地读取文件，然后将其以流的形式发送给对方，相当于两者身份的一次“互换”。所以，这次我们先从服务器端开始。在此之前，我们上传完文件以后，会返回一个远程路径。现在，客户端通过这个远程路径来下载对应的文件：

```csharp
public override async Task DownloadFile(DownloadFileRequest request, 
  IServerStreamWriter<DownloadFileResponse> responseStream, ServerCallContext context)
{
    var filePath = Path.Combine(Directory.GetCurrentDirectory(), request.FilePath);
    if (File.Exists(filePath))
    {
        using (var fileStream = File.OpenRead(filePath))
        {

            var received = 0L;
            var totalLength = fileStream.Length;

            var buffer = new byte[1024 * 1024]; // 每次最多发送 1M 的文件内容
            while (received < totalLength)
            {
                var length = await fileStream.ReadAsync(buffer);
                received += length;
                var response = new DownloadFileResponse()
                {
                    Content = ByteString.CopyFrom(buffer),
                    TotalSize = totalLength
                };

                await responseStream.WriteAsync(response);
            }
        }
    }
}
```

同样地，客户端在收到服务器端发送的二进制“块”以后，“照葫芦画瓢”，按照顺序写入即可：

```csharp
var downloadRequest = new DownloadFileRequest() { 
  FilePath = "/Upload/424017fc-0b58-4cad-9264-75efe3701444.png" 
};
var downloadResult = fileServiceClient.DownloadFile(downloadRequest);

var downloadPath = Path.Combine(Directory.GetCurrentDirectory(), downloadRequest.FilePath);
if (File.Exists(downloadPath)) File.Delete(downloadPath);

using(var fileStram = File.Open(downloadPath, FileMode.Append, FileAccess.Write))
{
    var received = 0L;
    while (await downloadResult.ResponseStream.MoveNext(CancellationToken.None))
    {
        var current = downloadResult.ResponseStream.Current;
        var buffer = current.Content.ToByteArray();

        fileStram.Seek(received, SeekOrigin.Begin);
        await fileStram.WriteAsync(buffer);

        received += buffer.Length;
        received = Math.Min(received, current.TotalSize);
    }
}
```

可以注意到，在缓冲区大小相同的情况下，同一张图片会再次被分成 6 个“块”下载下来：

![利用 gRPC 实现文件下载](/posts/利用-gRPC-实现文件的上传与下载/gRPC-Streaming-Download.png)

# 现实挺骨感

有时候，我感觉自己写东西越来越“肤浅”，因为那种特别有深度的“奇技淫巧”，不单单意味着“可遇不可得”，更意味着你需要投入更多的时间和精力。回到一开始的话题，我们利用 gRPC 实现了文件的上传和下载，确实没什么难度，但我们可曾收到过特别令人兴奋的反馈？仔细思索一番，好像确实是这样，因为我并不觉得这个过程中有什么成就感。问题出在哪里了呢？我想，大概是我们并没有解决一开始的问题，无论上传还是下载，它都有一个十分具体的使用场景，那就是 Web 浏览器。遗憾的是，虽然我们写流式传输写得非常嗨，可这一切并不能直接作用于 Web 浏览器环境，你说，还有什么比这个更尴尬的吗？

![gRPC-Web + Envoy Porxy 的理想很丰满](/posts/利用-gRPC-实现文件的上传与下载/gRPC-Web-Envoy-Proxy.drawio.png)


通常，在面对这个问题的时候，你可以考虑 Envoy 和 gRPC-Web 这样两个方向。其中，对于 Envoy 而言，它提供一部分过滤器或者说插件来提供相关的支持：

* [gRPC-JSON transcoder filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/grpc_json_transcoder_filter.html)：它可以让我们通过 JSON API 来消费 gRPC 接口，并且适用于大多数的 Unary gRPC API，那么，它是否适用于 Streaming gRPC API 呢？官方说它支持客户端和服务器端的 Streaming，不支持双向的 Streaming，目测是 Envoy 对请求和响应进行了缓存，所以，实时性非常差，并且由于客户端采用了 HTTP/1.1，并不是真正的 Streaming。

* [gRPC HTTP/1.1 bridge](https://www.envoyproxy.io/docs/envoy/latest/start/sandboxes/grpc_bridge.html)：一种通过 HTTP/1.1 来调用 gRPC (HTTP/2) 的机制，采用和 gRPC 一样的数据编码方式，即 Protobuf，缺点是只支持 Unary gRPC API，Streaming 就更不用说啦！

* [gRPC-Web filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/grpc_web_filter.html)：可以认为是 Envoy 针对 [gRPC-Web](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md) 协议的一种实现，可是 gRPC-Web 本身牺牲掉了一些东西，比如客户端的 Streaming，以及双向的 Streaming，至于 服务器端的 Streaming， 则需要开启 `application/grpc-web-text` 模式，存在一定限制。

综合以上信息，我们可以得出一个结论，即，至少在现阶段，基于 gRPC 实现的上传和下载，是无法直接在浏览器环境下使用的。当然，我们还有变通的方案，那就是用传统的 Web API 再包装一层，虽然这样没什么意思，可你会发现，这样比直接用 `HTTP` 实现分片上传/下载要简单许多，某种意义上，可以算作一种心理安慰，下面是一个简单的实现：

```csharp
// POST api/files/upload
[HttpPost("Upload")]
public async Task<ActionResult> Upload()
{
    var form = Request.Form;
    if (form.Files.Count == 0)
        return BadRequest();

    var uploadResult = _fileServiceClient.UploadFile();
    var fileToUpload = form.Files[0];

    using (var fileStream = fileToUpload.OpenReadStream())
    {
        var sended = 0L;
        var totalLength = fileStream.Length;
        var buffer = new byte[1024 * 1024];
        while (sended < totalLength)
        {
            var length = await fileStream.ReadAsync(buffer);
            sended += length;

            var request = new UploadFileRequest() { 
              Content = ByteString.CopyFrom(buffer), 
              FileName = fileToUpload.FileName 
            };
            await uploadResult.RequestStream.WriteAsync(request);
        }
    }

    await uploadResult.RequestStream.CompleteAsync();
    var reply = await uploadResult.ResponseAsync;
    return Ok(reply.FilePath);
}

// GET api/files/download
[HttpGet("Download")]
public async Task<ActionResult> Download(string filePath)
{
    var downloadRequest = new DownloadFileRequest() { FilePath = filePath };
    var downloadResult = _fileServiceClient.DownloadFile(downloadRequest);

    using (var fileStream = new MemoryStream())
    {
        var received = 0L;
        while (await downloadResult.ResponseStream.MoveNext(CancellationToken.None))
        {
            var current = downloadResult.ResponseStream.Current;
            var buffer = current.Content.ToByteArray();

            fileStream.Seek(received, SeekOrigin.Begin);
            await fileStream.WriteAsync(buffer);

            received += buffer.Length;
            received = Math.Min(received, current.TotalSize);
        }

        if (received > 0)
            return File(fileStream, "application/octet-stream", Path.GetFileName(filePath));
        else
            throw new FileNotFoundException(filePath);
        }
    }
}
```


# 本文小结

当我把这个结果告诉某人的时候，某人一脸嫌弃说，那就是无解。的确，对于无解的事情，我们只能学着去接受，学着去和自己和解，这是我在接受一个普通人的命运以后，时不时会在心里默念的一句话。这篇文章尝试了用 gRPC 来实现文件的上传与下载，而最终令我们感到无力的一件事情，则是 gRPC Streaming API 在浏览器环境下的支持不完整这件事情，HTTP/1.1 与 HTTP/2 的爱恨情仇，也许会在将来的某一天彻底终结，但对屏幕前的你我而言，你唯一能把握的永远只有当下，我是一个在游走在理性和感性之间的人，感性过多，让我的技术博客不再那么纯粹；理性过多，让我对事物间隐藏的美视而不见。我准备用一生去调和这两种人格，因为，作为一个双子座，我不得不去对抗时间、失去和错过的无解。


