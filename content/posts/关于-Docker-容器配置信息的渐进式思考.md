---
categories:
- 编程语言
copyright: true
date: 2022-12-01 12:30:47
description: ''
slug:  Progressive-Thinking-About-Docker-Container-Configuration-Information
tags:
- 容器
- 配置
- Docker
- Bash
title: 关于 Docker 容器配置信息的渐进式思考
toc: true
image: /posts/关于-Docker-容器配置信息的渐进式思考/spiral-g6a266c317_1280.jpg
---

作为一名软件工程师，不，或许应该叫做 YAML 工程师、Markdown 工程师、Dockerfile 工程师……等等，这绝非自谦，更多的是一种自嘲。毕竟，从入行的那一天开始，追求配置上的动态灵活，就如同思想一般刻进每个程序员的 DNA 里。可当你意识到，在这个世界上，提出主张的人和解决问题的人，并不是同一群人时，你或许会心头一紧，接着便是直呼上当，我甚至不能理解，为什么程序员提交完代码，还要像运维一样折腾各种配置文件。特别是在 DevOps 的理念流行开以后，程序员们简直就是在通过各种配置文件互相折磨对方。如果程序员不能通过程序变得懒惰，那是不是说明，我们早已忘记了当初学习编程时的初心？我们都以为代码可以不用修改，可有哪一次代码能逃过面目全非的结局？每当这个时候，我就特别想怼那些主张配置文件的人，要不您来？言归正传，今天我想聊聊容器、配置文件和环境变量，为什么称为渐进式思考呢？因为它更像是一种不同人生阶段的回顾。

# 从何说起

故老相传，鸿蒙初开，天地混沌。上帝说，要有光。于是，盘古抄起那把传说中的开天神斧，对着虚空世界就是一通输出。那一刻，这位创世神周围就像发生了奇点大爆炸一样迅速扩张。最终，它的身体化作了世间万物，推动这个世界从无到有的进化历程。屏幕前的你，无需纠结这段融合了东/西方神话、现代物理学的表述是否严谨，因为我想说的是，在一个事物发展的初期，一定是朴素而且原始的。相信大家开始写 `Dockerfile` 的时候，一定没少写过下面这样的脚本：

```dockerfile
COPY /config/nginx.conf /etc/nginx/nginx.conf
```

如你所见，该命令会复制主机上的配置文件到容器的指定目录，而这其实是符合我们一开始对容器的预期的，即：我们只需要将程序打包到镜像里，就可以快速地完成程序的部署。可是，我们显然忽略了一个问题，当程序部署到不同的环境中时，它需要的配置文件自然是不同的。此时，你可能会采用下面的做法：

```bash
docker exec -it <容器Id> sh
vim /etc/nginx/nginx.conf
```
# 环境变量
果然，大道至简，没有任何技巧，简直真诚到极致。常言道：智者不入爱河，这个做法辛不辛苦姑且不论，关键是容器一旦重启，你连慨叹镜花水月的时间都没有啦。所以，这个方案可谓是劳心劳力，为我所不取也！再后来，你发现容器里可以使用环境变量，于是你就灵机一动，为什么不能让这个配置文件支持动态配置呢？于是，你尝试使用下面的做法：

```nginx
server {
    listen      ${NGINX_PORT};
    listen      [::]:${NGINX_PORT};
    server_name ${NGINX_HOST};

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```
此时，我们只需要在 `.env` 文件或者 `docker-compose.yml` 文件里指定这些环境变量即可。对于这个思路，我们可以使用 `envsubst` 这个工具来实现：

```bash
export NGINX_PORT=80
export NGINX_HOST=xyz.com
apt-get update && apt-get install -y gettext-base
envsubst < /config/nginx.conf > /etc/nginx/nginx.conf
```
此时，我们会发现，它可以实现环境变量的“**注入**”：

![环境变量的“注入”](/posts/关于-Docker-容器配置信息的渐进式思考/Docker-Configuration-Templates.png)

当然，如果这段脚本是写在 `RUN` 指令后面，那么，这个改进是非常有限的。因为如果你希望更新配置，你必须要重新构建一个镜像，一个更好的做法是，将这段脚本放到 `CMD` 或者 `ENTRYPOINT` 指令里。这样，我们更新配置时只需要重启容器即可，这是不是就符合配置上的动态灵活了呢？事实上，这正是博主公司一直采用的做法。不过，运维同事大概率是没听说过 `envsubst` 这个工具，他使用的是更朴素的 `sed` 命令：

```bash
echo -e "\nReading all environment variables..."
for line in $(printenv);
do
 varname=$(echo $line | tr -dc '[:alnum:]=_' | cut -d'=' -f1)
 if [ "$varname" != "" ]
 then
   envval=$(eval "echo \"\$$varname\"")
   if [ "$envval" != "" ]
   then
    echo -e "Filling $varname into config templates..."
    escaped_envval=$(printf '%s\n' "$envval" | sed -e 's/[\/&]/\\&/g')
    sed -i "s/{{ $varname }}/$escaped_envval/g" ./config-templates/*
   fi
 fi
done
```

当然，我们最终还是放弃了这个方案，因为它增加了我们的维护成本，在开发和测试各有一套配置的前提下，再增加一套配置模板，同时还要保证这 3 套配置上的一致性，其难度可想而知。更重要的是，这套基于字符串替换的方案，支持的绑定语法非常有限，譬如不支持默认值或者是参数计算。如果某一个环境变量忘记配置，那么容器大概率是无法正常启动的。在放弃了配置模板的方案以后，我们不得不开始学习下面这套[配置语法](https://learn.microsoft.com/zh-cn/aspnet/core/fundamentals/configuration/?view=aspnetcore-6.0)：

```bash
export Position__Title=Environment_Editor
export Position__Name=Environment_Rick
export Logging__0__Name ToEmail
export Logging__0__Level Critical
export Logging__0__Args__FromAddress MySystem@example.com
export Logging__0__Args__ToAddress SRE@example.com
export Logging__1__Name ToConsole
export Logging__1__Level Information
```

这份由环境变量组成的配置信息，其等价表示为：

```json
{
    "Position": {
        "Title": "Environment_Editor",
        "Name": "Environment_Rick"
    },
    "Logging": [{
        "Name": "ToEmail",
        "Level": "Critical",
        "Args": {
            "FromAddress": "MySystem@example.com",
            "ToAddress": "SRE@example.com"
        }
    }, {
        "Name": "ToConsole",
        "Level": "Information"
    }]
}
```
再后来，随着知识体系的不断完善，你发现容器内的配置文件可以挂载到主机上。此时，修改主机上的配置文件，就可以更新容器内的配置文件，其基本用法如下：

``` bash
docker run -v <host-dir>:<container-dir>:<rw|wo>
```

或者，你可以使用 `docker-compose.yml` 来进行服务编排，然后通过 `volumes` 字段来挂载一个目录:

```bash
version: '3.5'
services:
  nextcloud_web:
    build: ./
    ports:
      - ${NEXTCLOUD_SERVER_PORT_HTTP}:80
      - ${NEXTCLOUD_SERVER_PORT_HTTPS}:443
    volumes:
      - "./data/nextcloud/config:/var/www/html/data/config"
```
那么，在这种模式下，是否就完美无瑕了呢？我个人觉得，这个方案对人的要求变得更高了一点，因为此前你只需要关注特定的环境变量即可，可现在你面对是一份完整的配置文件，你不得不了解每一种配置文件的细节，甚至于连 YAML 文件里的缩进都要关心，博主已经不止一次地帮别人处理开发环境 Envoy 配置文件的问题。除此之外，如果配置文件的结构频繁地发生变动，确保这两份配置文件步调一致，就再次变成了一个新的问题。

# Docker Config

```html
<html lang="en">
  <head><title>Hello Docker</title></head>
  <body>
    <p>Hello {{ env "HELLO" }}! I'm service {{ .Service.Name }}.</p>
  </body>
</html>
```
事实上，在 [Docker Swarm](https://docs.docker.com/engine/swarm/) 的模式下，官方提供了一种[机制](https://docs.docker.com/engine/swarm/configs/)来管理配置文件，它最大的优点是：不用挂载目录或者注入环境变量。如上图所示，假设我们有一个名为 `index.html.tmpl` 的模板文件。接下来，我们只需要创建一个配置并使用这个配置即可：

```bash
# 创建一个名为 index-config 的配置
docker config create --template-driver golang index-config index.html.tmpl
# 使用 index-config 配置启动容器
docker service create \
    --name hello-world \
    --env HELLO="Docker" \
    --config source=index-config,target=/usr/share/nginx/html/index.html \
    --publish published=3000,target=80 \
    nginx:alpine
```
# K8S 与 ConfigMap
我不想评价 Docker Swarm 和 Kubernetes 孰优孰劣，我只知道，博主公司最终还是从 Docker Swarm 退回到了 Docker Compose 。对博主而言，现在主要使用 Docker Compose，我一直不愿意触碰 Kubernetes 的原因是，我不想再多学习一种配置文件。有人说， Kubernetes 是目前容器编排的事实标准，没有什么东西能在这个领域超越它。那么， Kubernetes 是如何管理容器内的配置的呢？答案是 [ConfigMap](https://kubernetes.io/zh-cn/docs/concepts/configuration/configmap/)：

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-info
data:
  baseUrl: "http://xyz.com:8080
  timeout: 86400
```
如图所示，这是一个最基本的 `ConfigMap` 示例，我们只需要通过下面的命令就可以创建一个 `ConfigMap`：

```bash
kubectl create -f configmap.yaml
```

当然，它还有下面这些重载形式，可以从不同的数据源创建 `ConfigMap` ：

```bash
# 从单个文件创建
kubectl create configmap *** --from-file=file1
# 从多个文件创建
kubectl create configmap *** --from-file=file1 --from-file=file2
# 从键值对创建
kubectl create configmap *** --from-literal=value1=123 --from-literal=value2=234
# 从环境变量创建
kubectl create configmap *** --from-env-file=.env
```
最终，这些 ConfigMap 可以作为 Pod 级别的卷或者是在环境变量中被引用。请注意，博主并不打算动手去写一个 K8S 示例，因为比做一件事情更重要的事情是，知道为什么要做这件事情。你也许完全想象不到，我当初对环境变量这个方案是有多抗拒，因为我觉得明明配置中心更好用啊，这些配置文件你全都放到配置中心里，届时容器只需要从配置中心里拉取配置即可。我承认，这个设想非常美好，可惜对于技术选型这些事情来说，有时候，它并不是一道选择题，而是一道填空题。

# 本文小结

圣人有云：温故而知新，可以为师矣！通过这一系列的梳理，我们可以得出一个结论，即：**容器内的配置管理，唯一正确的方向就是让配置和容器分离**。不管你是用上面这些方案中的哪一种，其关键就是让配置动态地在容器内生效，而非固化到容器中。可有意思的是，K8S 里的 ConfigMap 是可以设置为 Immutable 的，这就引申出一个关乎平衡的哲学命题，变与不变该如何去抉择，一个人想要在这个世界上安身立命，到底是要遵从本性、初心不改？还是要世故圆滑、适者生存？也许，到底还是古人更聪明一点，讲究一个外圆内方。从这个角度来看的话，古代的钱币被铸成外圆内方的形制，大抵有刻意为之的嫌疑。毕竟啊，无论是在哪个朝代，一心只想搞钱这种想法都显得真实、不做作，这同样是我对于技术的态度。好了，以上就是这篇文章的全部内容，欢迎大家在评论区交换想法！






