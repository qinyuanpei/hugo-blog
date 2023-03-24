---
categories:
- 编程语言
copyright: true
date: 2023-03-20 15:49:47
description: ''
slug: The-Xiaoai-Speaker-Integrates-An-Incomplete-Tutorial-On-ChatGPT
tags:
- 人工智能
- ChatGPT
- 智能家居
- 小爱同学
title: 小爱音箱集成 ChatGPT 的不完全教程
toc: true
image: /posts/小爱音箱集成-ChatGPT-的不完全教程/cover.jpg
---
2023年三月对于金融和科技领域来说，可谓是“冰火两重天”。硅谷银行倒闭事件像一枚深水炸弹一样在金融领域扩散开来，而 OpenAI 则凭借 ChatGPT 这款产品一路“狂飙”，成为当下最负盛名的爆款话题。就在百度推出同类产品“文心一言”的前夕，OpenAI 正式发布了 GPT-4，直至微软高调宣布在 Office 全家桶中集成了 GPT-4，将这场技术狂欢推向高潮。作为一个关注聊天机器人的人，我从大学时期就开始通过 AIML 标记语言构建语料库，并逐渐接触 NLP 领域的知识。我认为这一波人工智能的热度代表了 OpenAI 主张的大语言模型(LLM)的胜利。ChatGPT 虽然始于聊天机器人，但绝不会止于聊天机器人。它的最终形态或许会是钢铁侠的智能管家“贾维斯”，抑或是《流浪地球》里超级人工智能 MOSS。事实上，我日常会用 ChatGPT 写程序原型、翻译文本、提取主题/关键词，这段时间更是尝鲜了智能家居。因此，我想和大家分享一下小爱音箱集成 ChatGPT 的过程。

# 基本原理

如果你像博主一样是一名智能家居新手玩家，那么在正式接触智能家居之前，你应该至少听说过 WIFI、ZigBee、BLE 这些名词。这些是指智能家居中的通信协议，例如小爱音箱可以作为蓝牙 Mesh 网关去连接那些使用蓝牙通信的设备，而 ZigBee 则是一种短距离、低功耗、支持自组网的无线通信协议。虽然 ZigBee 对外宣称是一个开放标准，但不同的厂商出于利益考虑，并不完全兼容彼此的设备，离真正的万物互联始终还有一段距离。因此，你会发现米家有类似多模网关这样的产品，现阶段的智能家居是一个多种协议混合使用的局面，2C 市场更青睐蓝牙和 WIFI 方案，2B 市场更青睐 ZigBee 方案。为了让更多的设备加入整个智能家居生态，开源的智能家居方案 [HomeAssistant](https://www.home-assistant.io/) 就此诞生。其中的 IFTTT 组件可以扩展出更多的智能玩法；为了让设备加入苹果公司的 HomeKit 生态，[HomeBridge](https://homebridge.io/) 这样一个“曲线救国”的方案就此诞生。可以说，现阶段智能家居的高阶玩法，基本都是围绕这两个平台展开。作为一名普通的消费者，你并没有机会去选择使用哪种协议，更多的是去选择使用哪一个平台。

[![Smart Home Protocols: WiFi vs Bluetooth vs ZigBee vs Z-Wave](https://smarthomehive.com/wp-content/uploads/2022/04/005-smart-home-protocols-1.png)](https://smarthomehive.com/smart-home-protocols/)

前面提到 ZigBee 的自组网具有离线可用的特性。与 WIFI 不同，WIFI 需要接入互联网，一旦断网就无法对设备进行有效控制，而蓝牙和 ZigBee 就没有这种烦恼。唯一的问题是它们都需要对应的网关。目前，米家的设备控制主要有远程控制和本地控制两种方式。远程控制需要发送指令到米家的服务器，这种方式对小米来说更有利，唯独不利于实现“万物互联”这一伟大远景。本地控制至少需要一个智能家庭屏或中枢网关，其好处是延迟低、离线可用、保障隐私。从某种角度来说，这与人们开始使用 NAS 搭建私有云的初衷一致，都是为了更好地保护隐私和数据安全。由于博主不具备本地控制的条件，所以，我们还是采用远程控制的方案，即通过向米家的服务器发送指令来达到控制设备的目的。在这个过程中，接入 ChatGPT 的 API，再控制小爱音箱将其响应内容朗读出来。这个方案可以实现远程控制的同时，利用 ChatGPT 弥补小爱同学“智能”上的不足。如图所示，下面是一个简单的示意图：

![米家远程控制及 ChatGPT 接入示意图](/posts/小爱音箱集成-ChatGPT-的不完全教程/MIHome_Remote_Control.drawio.png)

# 如何控制米家

接下来，我们来探讨如何控制米家设备。米家通过 HTTP 协议实现远程控制，为此，我们推荐使用两个非常实用的库：[MiService](https://github.com/Yonsm/MiService) 和 [python-miio](https://github.com/rytilahti/python-miio)。这两个库各有优缺点。如果你对米家物联网协议更感兴趣，我们建议使用 python-miio；如果你希望更快、更容易地上手米家智能家居，我们则推荐使用 MiService。从使用方式上来看，MiService 使用 `DID` 来区分不同的设备，而 python-miio 使用 `Token` 和 `IP` 来区分不同的设备。下面，我们以 MiService 为例来演示如何通过编程控制米家设备。

![网关在整个智能家居中的地位](/posts/小爱音箱集成-ChatGPT-的不完全教程/system-diagram-consumer.png)

在开始前，请确保你安装了 MiService , 你可以选择下面两种方式之一进行安装：

```Bash
# 从包管理器安装
python -m pip install MiService
# 从源代码安装
git clone git@github.com:Yonsm/MiService.git
cd MiService
python -m pip install .
```

安装后，你会在 Python 主目录下的 `Scipts` 目录看到一个叫做 `micli` 的命令行工具。如果你的 `Scripts` 目录在全局环境变量中 `Path` 中，那么，恭喜你，你可以直接在终端中使用该命令。为了向该工具表明身份，我们需要在终端中导出下面两个环境变量：

```Bash
export MI_USER=<小米账号>
export MI_PASS=<小米密码>
```

此时，我们在终端中输入命令 `micli list`，我们就可以得到当前账号下所有的米家设备信息：

```json
[{
    "name": "客厅主灯",
    "model": "yeelink.light.ceil31",
    "did": "",
    "token": ""
}, 
{
    "name": "小爱同学",
    "model": "xiaomi.wifispeaker.x08e",
    "did": "",
    "token": ""
}, 
{
    "name": "温湿度计",
    "model": "miaomiaoce.sensor_ht.t2",
    "did": "",
    "token": ""
}]
```
可以注意到，在这个列表中有我们想要的小爱同学，在获得关键信息 `DID` 后，我们将其在终端中导出：

```Bash
export MI_DID=<请替换为你的DID>
```

通过上述信息，我们了解到小爱音箱的型号为 `X08E`，你可以在音箱底部找到这个信息。接下来，我们需要访问 [https://home.miot-spec.com/](https://home.miot-spec.com/) 这个网站，以获取更多控制小爱音箱的信息。在该网站中，输入当前型号，你将会看到如下页面：

![米家产品规范截图-1](/posts/小爱音箱集成-ChatGPT-的不完全教程/miot-spec-01.png)

点击页面中标有链接的部分，你将看到小爱音箱拥有各种控制指令，如下图所示：

![米家产品规范截图-2](/posts/小爱音箱集成-ChatGPT-的不完全教程/miot-spec-02.png)

针对我们最关心的语音部分，你会发现它整体上分为三个级别：分类、属性(Properties) 和动作(Actions)。每个分类都有唯一的 SIID，每个属性都有唯一的 PIID，每个动作都有唯一的 AIID。参考 [MiService](https://github.com/Yonsm/MiService) 的文档，我们可以轻松编写以下指令：

```Bash 
# 获取小爱音箱播放状态 1:Playing, 0:Stop, 2:Pause
micli 3-1 
# 播放文本内容
micli 7-3 Hello
# 执行文本指令
micli 7-4 为我点亮世界
# 播放
micli action '{"did":"<你的DID>","siid":3,"aiid":2,"in":[]}'
# 暂停
micli action '{"did":"<你的DID>","siid":3,"aiid":3,"in":[]}'
# 停止
micli action '{"did":"<你的DID>","siid":3,"aiid":4,"in":[]}'
# 设置音量
micli 2-1=#60
```

以上演示以小爱音箱为例，事实上，只要掌握了这种方法，大多数米家设备都可以通过编程实现控制。例如，智能门锁和门窗传感器可以通过程序获取电池耗电量的信息，以便提醒您及时更换电池。目前，第三方物联网平台如 [巴法云](https://bemfa.com/) 采用发布/订阅模式来控制单片机，这使得像 ESP32 这样的开发板可以快速接入米家生态。我个人认为，这些技术都非常有趣，值得我们做进一步的深入探索。

# 如何接入 ChatGPT

对于 Python，接入 ChatGPT 非常方便，因为 OpenAI 官方提供了 SDK。首先，我们需要使用 `pip` 安装 `openai` 包：

```shell
python -m pip install openai
```

接下来，我们只需导入 `openai` 模块，并设置 `API` 密钥：

```python
import openai
openai.api_key = "<YOUR_API_KEY>"
```

现在，我们可以调用 OpenAI 的 API，输入对话文本，获取机器生成的回复，如下所示：

```python
completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo", 
    messages=[{"role": "user", "content":"Hi，ChatGPT!"}]
)
```

当然，鉴于 OpenAI 在国内的可访问性问题，笔者通过 Vercel 搭建了一个代理服务。此时，您可以使用下面的 API 接口，如下所示。虽然这只是对官方 SDK 进行了二次封装，但是考虑到国情如此，我们只能说聊胜于无：

```curl
curl -X POST 'https://openai-proxy.yuanpei.me/openai/v1/completions' \
-H 'Authorization: Bearer <Your-OpenAI-API-KEY>' \
-H 'Content-Type: application/json' \
-d '{
"model": "gpt-3.5-turbo",
"messages": [{"role": "user", "content":"Hello ChatGPT!"}]
}'
```
更多的细节，大家可以参考这里：[https://github.com/qinyuanpei/openai-proxy](https://github.com/qinyuanpei/openai-proxy)。

# 风云合璧

到目前为止，整个思路非常清晰。当我们使用米家 App 时，可以注意到米家存储了我们和小爱同学的对话内容。因此，我们的思路是通过接口获取对话记录，每一组对话中的第一句话，就是我们对小爱同学的提问。此时，我们可以用这个问题去询问 ChatGPT，等待 ChatGPT 给出回应后，再利用上述技巧将文本转化为语音输出。然而，这个方案最大的弊端是，无法完全屏蔽小爱同学自身的交互逻辑。因此，在下面的演示视频中，我们不得不通过程序来强行打断小爱同学的发言，这其实是一种无奈的做法：

{{<bilibili BV16M4y1r7g1>}}

当然，我们还有另一种思路，即通过蓝牙连接到小爱音箱。在这种情况下，小爱同学就完全成为一个输出设备，甚至无需介入米家。但这样做会失去与小爱同学互动的乐趣，除非您想创建类似于“贾维斯”的人工智能程序，否则请不要轻易尝试这条注定艰辛的道路。下面是一个针对这种方案的简化实现：

```Python
import speech_recognition as sr
import pyttsx3

# 初始化语音识别 & 语音合成
r = sr.Recognizer()
engine = pyttsx3.init()

# 语音识别函数
def recognize_speech():
    with sr.Microphone() as source:
        print('Please speak:')
        audio = r.listen(source)
    try:
        text = r.recognize_google(audio, language='zh-CN')
        print('You said:', text)
        return text
    except Exception as e:
        print('Error:', e)
        return ''

# 语音合成函数
def speak(text):
    engine.say(text)
    engine.runAndWait()

# 主程序
speak('你好，请问有什么可以帮助您的？')
while True:
    text = recognize_speech()
    if text == '退出':
        break
    elif text.startswith('帮我')
        # todo：在这里调用 ChatGPT
        pass
    else:
        speak('对不起，我不明白您的意思，请您再说一遍。')
```

视频中的演示程序源自 Github 上的一个开源项目 [https://github.com/yihong0618/xiaogpt](https://github.com/yihong0618/xiaogpt)。在此基础上，我做了一些微不足道的工作。首先，将对小爱的控制方式完全替换为上文中的指令，因为我感觉 MiNAService 这个类不是特别稳定；其次，将 OpenAI 的 API 替换为我自己架设的代理接口，这样就解决了科学上网的烦恼；最后，将 `MI_USER`、`MI_PASS`、`MI_DID`、`OPENAI_API_KEY` 四个参数放入 `.env` 文件中，简化了程序启动时的参数。我已将这些工作提交到了我的 Github 上，对此感兴趣的朋友可以自行下载：[https://github.com/Regularly-Archive/2023/tree/main/XiaoiGPT](https://github.com/Regularly-Archive/2023/tree/main/XiaoiGPT)。

# 本文小结

在这个过程中，我最大的收获是学会了如何用编程控制米家设备。尽管现在智能家居的交互场景还相对有限，但就像 ChatGPT 一样，当你意识到 AI 正式进入一个新阶段的时候，一切都显得为时已晚。百度的文心一言发布后，陆续有人拿到了内测资格，一时间好像没有人再去讨论 ChatGPT 了，因为大家的精力都放在戏谑文心一言生成的图片上面。我经常思考未来是否会出现一种职业叫做“魔法吟唱师”，负责为各种 AI 模型输入提示词。去年 Stable Diffusion 开始流行时，我就意识到提示词对结果产生影响。遗憾的是，此时此刻，人类仍然为比 AI 多懂几个成语、多吃过几道菜而沾沾自喜。作为一名技术人员，我对科技的未来一直抱有乐观的态度，因为我认为技术日新月异，真正拖累人心的始终是那些非技术因素。人们总以为 AI 能帮助解决各种各样的问题，但问题是我们是否能清晰地表达出我们的想法呢？我们总是太过痴迷于华丽的言辞，而忽略了简单直接的表达方式。人们实在太享受口是心非的感觉，就像今天这篇博客，其实是由我和 ChatGPT 一起完成的，但你是否能分清其中的真假吗？