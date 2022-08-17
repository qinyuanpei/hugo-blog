---
toc: true
title: .NET Core + ELK搭建可视化日志分析平台(中)
categories:
  - 编程语言
tags:
  - ELK
  - Logstash
  - Filebeat
copyright: true
abbrlink: 17402283
date: 2020-03-02 16:41:49
---
在上一篇博客中，我为大家分享了通过 `Docker` 来安装 `ELK` 的相关内容，并结合一个 `.NET Core` 项目完成了日志可视化的案例，相信大家已经对 `ELK` 有了一个初步的认识。今天，让我们来继续探讨关于 `ELK` 的话题。在实际的应用场景中，并不会有机会让我们从头开始构建整个 `ELK` 的流程，更多是结合现有的日志来做扩展或者迁移。因为，在 `ELK` 出现之前，人们或许已经在大量使用基于文本文件或者是数据库的存储方式。在这种情况下，日志的收集不会像上一篇博客中中介绍的那样简单。那么，怎么针对已经存在的日志文件进行收集和分析呢？这就是我们今天这篇博客要探讨的话题，在今天这篇博客中，我们将分别从使用 `Logstash` 收集日志 、使用 `Filebeat` 收集日志和 `Docker` 容器内的日志收集三个方面来一起探讨，希望对大家学习 `ELK` 有所帮助。

# 使用 Logstash 收集日志

在最开始介绍 `ELK` 全家桶的时候，我们曾提到过 `Logstash`。关于它的作用，我想使用 **输入、解码、过滤、输出** 这四个关键来总结。顾名思义，它可以按照某种解码方式对输入的日志文件进行解析，然后按照一定的方式进行过滤，并最终以某种方式进行输出。这听起来能满足我们的需求是不是？所以，我们首先来说说，如何使用 `Logstash` 进行日志收集。通过 `Docker` 安装 `ELK` 接口以后，`Logstash` 默认安装在容器内的以下位置：`\opt\logstash\`，其目录结构如下：

![Logstash目录结构](https://i.loli.net/2020/03/02/BVLlhWX82pQKZPR.png)

在 `\opt\logstash\config\` 目录中，`Logstash` 已经为我们预置了部分配置文件，这里以 `logstash-sample.conf` 文件为例，我们来看看传说中的配置文件长什么样子：

```conf
# Sample Logstash configuration for creating a simple
# Beats -> Logstash -> Elasticsearch pipeline.
input {
  beats {
    port => 5044
  }
}

output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "%{[@metadata][beat]}-%{[@metadata][version]}-%{+YYYY.MM.dd}"
  }
}
```
可以注意到，这是一个由 Beats -> Logstash -> Elasticsearch 组成的管线。它的输入是通过 `5044` 端口通信的 `beats`，而它的输出则是通过 `9200` 端口通信的 `elasticsearch` 。那么，既然说到了 `Logstash` 的配置文件，我们先来认识下它。下面，是一个 `Logstash` 配置文件的典型结构：

```conf
input { }

codec { }

filter { }

output { }
```
## 认识 Logstash 配置文件

相信细心的朋友已经发现，`Logstash` 配置文件的结构，恰好是由我们前面提到的 **输入、解码、过滤、输出** 四个部分组成。实际上，`Logstash` 定义了一套 `DSL` ，类似`Puppet` 的 `DSL`，可能是因为它们都出自相同的语言：`Ruby`。在这里，每一对花括号被称之为一个区域，区域内则可以定义一个或多个插件区域，每个插件区域内则由多个键值对组成。和大多数编程语言类似，它支持像布尔值、字符串、数值、数组、哈希等等的数据结构，参考地址：[https://elkguide.elasticsearch.cn/logstash/get-start/full-config.html](https://elkguide.elasticsearch.cn/logstash/get-start/full-config.html)，这里我们分别来认识下这几个部分。

### input

`input`，顾名思义就是输入了啦。在一个 `Logstash` 的配置中，至少应该有一个 `input` 和 `output`，就像我们一开始看到的示例配置一样。在没有指定输入、输出的情况下，就会使用默认的 `stdin` 和 `stdout` ，即标准输入和标准输出。那么，什么是标准输入呢？这里介绍四种最常用的输入插件，它们分别是：`file`、`syslog`、`stdin` 和 `tcp`。其中，`file` 应该是最常见的一种日志储存形式啦！我们今天这篇博客想做的事情，就是从一个日志文件中收集日志信息。对于该插件，我们可以使用下面的配置方式。
```conf
input {
    file {
        path => ["/var/log/*.log", "/var/log/message"]
        type => "system"
        start_position => "beginning"
    }
}
```
在这里，Logstash内部使用了一个名为`FileWatch`库，该库可以监听文件的变化，并使用一个名为`.sincedb`的数据库文件来记录被监听文件的记录位置。基于这样一种原理，Logstash可以从日志文件的指定位置读取日志信息，并且不用担心它会丢失某些日志信息。在这个配置文件中，我们指定了需要监听的文件路径，并定义了日志类型——system，这是为了在下面的流程中做进一步的识别。除此之外，有一些针对`FileWatch`库的配置项，譬如`discover_interval`、`exclude`、`sincedb_write_interval`等等，关于这些参数的详细解释，大家可以参考：[https://elkguide.elasticsearch.cn/logstash/plugins/input/file.html](https://elkguide.elasticsearch.cn/logstash/plugins/input/file.html)。

因为这边博客主要是针对日志文件进行收集，考虑到篇幅有限，我们不再详细介绍。而关于标准输入/输出，通常是在我们编写完配置文件后，需要进行调试或者测试的阶段来使用。通常这种方式，需要用到下面的命令：

```
bin/logstash -f xxx.conf
```

### codec
在早期的 `Logstash` 版本中，它支持纯文本的输入。因此，数据的预处理器就需要放到 `filter` 中来处理。从 `1.3.0` 版本开始，`Logstash` 引入了 `codec`的概念，这使得 `Logstash`可以处理来自不同形式的日志。我们知道，`Elasticsearch`中是使用类似`JSON` 的结构来存储日志数据的，所以，如果我们在写入日志前能把日志转化为 `JSON` ，那么，就可以省去讨厌的 `filter` 环节。同样，为了减少传输过程中数据量，我们可能还会使用 `MsgPack` 这样的序列化工具。针对 `codec`，一个最典型的例子是，当我们使用 `Nginx` 的时候，首先，通过 `logformat` 命令将纯文本格式的日志转换为 `JSON` 格式：

```bash
logformat json '{"@timestamp":"$time_iso8601",'
               '"@version":"1",'
               '"host":"$server_addr",'
               '"client":"$remote_addr",'
               '"size":$body_bytes_sent,'
               '"responsetime":$request_time,'
               '"domain":"$host",'
               '"url":"$uri",'
               '"status":"$status"}';
access_log /var/log/nginx/access.log_json json;
```

### filter
### output

## Logstash 收集 IIS 日志

# 使用 Filebeat 收集日志
`Beats` 在官网中被定义为：`单一用途数据采集器`。它们从成百上千或成千上万台机器和系统向 `Logstash` 或 `Elasticsearch` 发送数据。而 `FileBeat` 则是众多的数据采集器中的一种，顾名思义，这是一种针对日志文件的数据采集器。除此之外，例如针对指标分析的 `Metricbeat`、针对 `Windows` 日志的 `Winlogbeat`、针对审计的 `Auditbeat` 等等。在这里，我们关注的是 `Filebeat` :

# Docker 容器内的日志收集

docker exec -it <Your Container> /bin/bash
cd opt/logstash/config/


参考文档