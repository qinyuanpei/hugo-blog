﻿---
abbrlink: 1700650235
categories:
- 编程语言
date: 2016-06-11 15:01:35
description: 本文介绍了如何在自己的 Web 服务器上实现 GET 和 POST 请求。GET 请求通过 URL 传递参数，而 POST 请求则将参数放在消息体中，相比
  GET 请求更安全且无参数长度限制。实现过程包括解析请求报文中的参数，针对不同请求类型做相应处理。提供了代码示例展示如何在服务器端处理 GET 和 POST 请求，以及在
  Unity 客户端使用 WWW 类发送 GET 和 POST 请求。最后展示了一个简单实例并给出了运行结果。
slug: 1700650235
tags:
- HTTP
- 服务器
- C#
title: 使用 C#开发 HTTP 服务器系列之实现 Get 和 Post
---

各位朋友大家好，我是秦元培，欢迎大家关注我的博客，我的博客地址是[http://qinyuanpei.com](http://qinyuanpei.com)。在我们这个 Web 服务器有了一个基本的门面以后，我们是时候来用它做点实际的事情了。还记得我们最早提到 HTTP 协议的用途是什么吗？它叫超文本传输协议啊，所以我们必须考虑让我们的服务器能够接收到客户端传来的数据。因为我们目前完成了大部分的工作，所以对数据传输这个问题我们这里选择以最简单的 GET 和 POST 为例来实现，这样我们今天的重点就落实在 Get 和 Post 的实现这个问题上来。而从原理上来讲，无论 Get 方式请求还是 Post 方式请求，我们都可以在请求报文中获得其请求参数，不同的是前者出现在请求行中，而后者出现在消息体中。例如我们传递的两个参数 num1 和 num2 对应的数值分别是 12 和 24，那么在具体的请求报文中我们都能找到类似“num1=12&num2=24”这样的字符结构，所以只要针对这个字符结构进行解析，就可以获得客户端传递给服务器的参数啦。

<!--more-->

# 实现 Get 请求
首先我们来实现 Get 请求，Get 是 HTTP 协议中默认的请求类型，我们平时访问网页、请求资源实际上都是通过 Get 方式实现的。Get 方式请求需要通过类似“?id=001&option=10”这样的形式附加在 URL 上，因此 Get 方式对浏览器来说是透明的，即用户可以通过浏览器地址栏知道，这个过程中传递了哪些参数以及这些参数的值分别是什么。而由于浏览器的限制，我们通过这种方式请求的时候能够传递的参数数目和长度都是有限的，而且当参数中存在中文数值的时候还需要对其进行编码。Get 方式请求相对简单，我们下面来看看它的请求报文：

```rfc
GET /?num1=23&num2=12 HTTP/1.1
Accept: text/html, application/xhtml+xml, image/jxr, */*
Accept-Language: zh-Hans-CN,zh-Hans;q=0.5
User-Agent: Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586
Accept-Encoding: gzip, deflate
Host: localhost:4040
Connection: Keep-Alive
Cookie: _ga=GA1.1.1181222800.1463541781
```
此时我们可以注意到在请求报文第一行，即请求行中出现了“/?num1=23&num2=12”这样的字样，这就是客户端传递给服务器的参数，我们很容易想到只需要将这个字段串中的“键”和“值”都解析出来，服务器就可以对这些数据进行处理然后返回给客户端了。所以下面我们通过这样的方式来实现，我们为 HtttpRequest 类增加了一个 Parms 属性，它是一个键和值均为字符串类型的字典，我们使用这个字典来存储和管理客户端传递来的参数。

```csharp
//获取请求参数
if (this.Method == "GET" && this.URL.Contains('?'))
    this.Params = GetRequestParams(lines[0].Split(' ')[1].Split('?')[1]);
```

显然我们首先需要判断请求类型是否为 GET 以及请求中是否带有参数，其方法是判断请求地址中是否含有“?"字符。这里的 lines 是指将报文信息按行分割以后的数组，显然请求地址在第一行，所以我们根据“?"分割该行数据以后就可以得到“num1=23&num2=12”这样的结果，这里我们使用一个方法 GetRequestParms 来返回参数字典，这样作做是为了复用方法，因为在处理 Post 请求的时候我们会继续使用这个方法。该方法定义如下：
```csharp
 /// <summary>
/// 从内容中解析请求参数并返回一个字典
/// </summary>
/// <param name="content">使用&连接的参数字符串</param>
/// <returns>如果存在参数则返回参数否则返回null</returns>
protected Dictionary<string, string> GetRequestParams(string content)
{
    //防御编程
    if (string.IsNullOrEmpty(content))
        return null;

    //按照&对字符进行分割
    string[] reval = content.Split('&');
    if (reval.Length <= 0)
        return null;

    //将结果添加至字典
    Dictionary<string, string> dict = new Dictionary<string, string>();
    foreach (string val in reval)
    {
        string[] kv = val.Split('=');
        if (kv.Length <= 1)
            dict.Add(kv[0], "");
        dict.Add(kv[0],kv[1]);
    }

    //返回字典
    return dict;
}
```

# 实现 Post 请求
Post 请求相对 Get 请求比较安全，因为它克服了 Get 请求参数长度的限制问题，而且由于它的参数是存放在消息体中的，所以在传递参数的时候对用户而言是不可见的，我们平时接触到的网站登录都是这种类型，而复杂点的网站会通过验证码、Cookie 等形式来避免爬虫程序模拟登录，在 Web 开发中 Post 请求可以由一个表单发起，可以由爬虫程序如 HttpWebRequest、WebClient 等发起，下面我们重点来分析它的请求报文：

```rfc
POST / HTTP/1.1
Accept: text/html, application/xhtml+xml, image/jxr, */*
Accept-Language: zh-Hans-CN,zh-Hans;q=0.5
User-Agent: Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586
Accept-Encoding: gzip, deflate
Host: localhost:4040
Connection: Keep-Alive
Cookie: _ga=GA1.1.1181222800.1463541781

num1=23&num2=12
```
我们可以注意到此时请求行的请求方法变成了 POST，而在报文结尾增加了一行内容，我们称其为“消息体”，这是一个可选的内容，请注意它前面有一个空行。所以，当我们处理一个 Posst 请求的时候，通过最后一行就可以解析出客户端传递过来的参数，和 Get 请求相同，我们这里继续使用 GetRequestParams 来完成解析。

```csharp
if (this.Method == "POST")
    this.Params = GetRequestParams(lines[lines.Length-1]);
```
# 实例
现在我们来完成一个简单地实例，服务器自然由我们这里设计的这个服务器来完成咯，而客户端则由 Unity 来完成因为 Unity 有简单的 WWW 可以使用。首先来编写服务端，这个继承 HttpServer 就好了，我们主要来写这里的方法：
```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HttpServerLib;
using System.IO;

namespace HttpServer
{
    public class ExampleServer : HttpServerLib.HttpServer
    {
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="ipAddress">IP地址</param>
        /// <param name="port">端口号</param>
        public ExampleServer(string ipAddress, int port)
            : base(ipAddress, port)
        {

        }

        public override void OnPost(HttpRequest request)
        {
            //获取客户端传递的参数
            int num1 = int.Parse(request.Params["num1"]);
            int num2 = int.Parse(request.Params["num2"]);

            //设置返回信息
            string content = string.Format("这是通过Post方式返回的数据:num1={0},num2={1}",num1,num2);

            //构造响应报文
            HttpResponse response = new HttpResponse(content, Encoding.UTF8);
            response.StatusCode = "200";
            response.Content_Type = "text/html; charset=UTF-8";
            response.Server = "ExampleServer";

            //发送响应
            ProcessResponse(request.Handler, response);
        }

        public override void OnGet(HttpRequest request)
        {
            //获取客户端传递的参数
            int num1 = int.Parse(request.Params["num1"]);
            int num2 = int.Parse(request.Params["num2"]);

            //设置返回信息
            string content = string.Format("这是通过Get方式返回的数据:num1={0},num2={1}",num1,num2);

            //构造响应报文
            HttpResponse response = new HttpResponse(content, Encoding.UTF8);
            response.StatusCode = "200";
            response.Content_Type = "text/html; charset=UTF-8";
            response.Server = "ExampleServer";

            //发送响应
            ProcessResponse(request.Handler, response);
        }
    }
}
```
因为这里需要对 Get 和 Post 进行响应，所以我们这里对 OnGet 和 OnPost 两个方法进行了重写，这里的处理方式非常简单，按照一定格式返回数据即可。下面我们来说说 Unity 作为客户端这边要做的工作。WWW 是 Unity3D 中提供的一个简单的 HTTP 协议的封装类，它和.NET 平台下的 WebClient、HttpWebRequest/HttpWebResponse 类似，都可以处理常见的 HTTP 请求如 Get 和 Post 这两种请求方式。

WWW 的优势主要是简单易用和支持协程，尤其是 Unity3D 中的协程（Coroutine）这个特性，如果能够得到良好的使用，常常能够起到事倍功半的效果。因为 WWW 强调的是以 HTTP 短链接为主的易用性，所以相应地在超时、Cookie 等 HTTP 头部字段支持的完整性上无法和 WebClient、HttpWebRequest/HttpWebRespons 相提并论，当我们需要更复杂的 HTTP 协议支持的时候，选择在 WebClient、HttpWebRequest/HttpWebResponse 上进行深度定制将会是一个不错的选择。我们这里需要的是发起一个简单的 HTTP 请求，所以使用 WWW 完全可以满足我们的要求，首先我们来看在 Unity3D 中如何发起一个 Get 请求，这里给出一个简单的代码示例：
```csharp
//采用GET方式请求数据
IEnumerator Get()
{
    WWW www = new WWW ("http://127.0.0.1:4040/?num1=12&num2=23");
    yield return www;
    Debug.Log(www.text);
}
```
现在我们是需要使用 StartCoroutine 调用这个方法就可以啦！同样地，对于 Post 请求，我们这里采用一个 WWWForm 来封装参数，而在网页开发中我们通常都是借助表单来向服务器传递参数的，这里给出同样简单的代码示例：
```csharp
//采用POST方式请求数据
IEnumerator Post()
{
    WWWForm form = new WWWForm ();
    form.AddField ("num1", 12);
    form.AddField ("num2", 23);
    WWW www = new WWW ("http://127.0.0.1:4040/", form);
    yield return www;
    Debug.Log (www.text);
}
```
而运行这个实例，我们可以得到下面的结果：

![测试结果](https://ww1.sinaimg.cn/large/4c36074fly1fzix87avuaj20dj05974c.jpg)

都是谁告诉你做服务器开发一定要用 Java 的啊，现在我们可以写出自己的服务器了，本篇结束，下期见！