---
categories:
- 编程语言
copyright: true
date: 2023-05-29 20:49:47
description: ''
slug: Discussing-Dynamic-Import-In-Python-Again
tags:
- Python
- 动态导入
- 奇技淫巧
- importlib
title: 温故而知新，再话 Python 动态导入
toc: true
image: /posts/温故而知新-再话-Python-动态导入/pedro-lopes-PcoZLIoLAOM-unsplash.jpg
---
多年前，我曾写过一篇关于 Python 动态导入的[文章](/posts/1960676615/)，当时想要解决的问题是，如何通过动态导入 `Python` 脚本来实现插件机制，即整个应用程序由主程序和插件两部分组成，主程序通过 `importlib` 模块中的 `import_module` 方法动态地导入一个 `Python` 脚本，最终通过 `getattr`、`setattr` 等方法实现反射调用。时过境迁，代码还是那些代码，江湖故人早已不知所踪。我向来都是一个喜欢怀旧的人，我怀念的是那些遗忘在寒江孤影里的江湖故人，我怀念的是那些湮灭在时光尘埃里的代码片段。或许，在屏幕前的你看来，一个每天都在经历着“**更新换代**”的技术人员，更应该对这一切的消逝习以为常。可正如这世界上的风、沙、星辰等流动的事物一样，无论我们愿意与否，时间总会在不经意间将那些熟悉而珍贵的东西一一带走，不放弃对过去的回忆和珍视，这便是我在世事变幻的洪流中追求的安宁与平静。正所谓“**温故而知新**”，今天我想要怀旧的话题是 Python 里的动态导入。

{{<meting server="netease" type="song" id="34200623">}}

众所周知，这段时间我一直在开发基于 ChatGPT 的人工智能管家 Jarvis，在整个探索过程中，类似语音识别、语音合成这些领域，博主先后考察了微软、百度、腾讯...这些大厂的方案，这可以说是非常符合我作为 Python “调包侠” 的人设啦！以语音识别为例，最终，你可能会得到类似下面这样的代码：

```python
class ASREngineFactory:
    @staticmethod
    def create(config, type):
        if type == ASREngineProvider.Baidu:
            return BaiduASR(config['BAIDU_APP_ID'], config['BAIDU_API_KEY'], config['BAIDU_SECRET_KEY'])
        elif type == ASREngineProvider.PaddleSpeech:
            return PaddleSpeechASR()
        elif type == ASREngineProvider.OpenAIWhisper:
            return WhisperASR()
```

没错，非常经典的简单工厂模式，你只需要告诉工厂类，你需要使用哪种语音识别引擎，它就可以自动帮你创建出对应的示例，如下图所示，这看起来非常合理，对吧？

```python
config = load_config_from_env(env_file)
engine = ASREngineFactory.create(config, ASREngineProvider.PaddleSpeech)
```

这里，其实有一段小插曲，博主最近开始尝试使用 `virtualenv` 来管理不同的 Python 版本，这样做的好处是，我只需要在不同的工作场所拉取代码、激活环境，就可以享受到完全一样的开发环境。当然，这一切都只是理论上的，实际使用下来的感受是，它并不能完全抹平环境上的差异。譬如，当我试图在个人电脑上安装 [PaddleSpeech](https://github.com/PaddlePaddle/PaddleSpeech) 和 [Rasa](https://rasa.com/docs/rasa/) 这两个库时，依然免不了遇到各种错误，即使是在同一个 Python 环境下。

{{<douban type="book" id="3693292242">}}

此时，你会发现一个非常尴尬的问题，即使我不使用 [PaddleSpeech](https://github.com/PaddlePaddle/PaddleSpeech) 来作为 Jarvis 的语音识别引擎，它依然无法正常工作，原因是我环境中没有安装 PaddleSpeech，我不得不注释掉项目中所有和 PaddleSpeech 有关的代码，而这一切的根源其实是，我们在代码中使用了静态导入的方式，如下图所示：

```python
# baidu-aip
from aip import AipSpeech
# paddlespeech
from paddlespeech.cli.asr.infer import ASRExecutor
# openai-whisper
import whisper
```
我相信，这个代码在通常情况下是没有任何问题的，可凡事都有例外，有没有一种可能，我们可以像使用 `C#` 里的 `#if DEBUG`、`#if NET40` 等预处理指令一样，让它按照不同的条件去导入不同的模块呢？比如，当我使用 Whisper 时，我希望它只导入 `whisper` 模块，而当我使用 PaddleSpeech 时，我希望它只导入 `paddlespeech.cli.asr.infer` 模块下的 `ASRExecutor` 类。换言之，我希望实现两个目的，**其一是按需导入，只导入需要的模块。其二是延迟导入，使用的时候再导入**。



好了，既然一切问题的根源是静态导入，那么，我们的思路就是将其调整为动态导入，此时，我们需要祭出大杀器 `importlib`，这里以 `baidu-aip` 这个包为例：

```python
class BaiduASR:
    def __init__(self, APP_ID, API_KEY, SECRET_KEY):
        aip = None
        try:
            aip = importlib.import_module('aip')
        except ImportError as e:
            print("baidu-aip is required, run 'pip install baidu-aip' first")
        self.client = aip.AipSpeech(APP_ID, API_KEY, SECRET_KEY)
        self.recoginzer = sr.Recognizer()
        # ......
```

可以注意到，主要的改动在第 5 行，因为 `AipSpeech` 是 `aip` 这个模块中的一个类，所以，我们可以在动态导入 `aip` 模块后直接使用该类型。当然，这个方案会损失一点点编程体验，因为 IDE 的智能提示可能会失效。考虑到使用者不一定安装了这个库，我们可以在异常处理中提醒对方安装这个库，这是我从开源社区学会的一个小技巧😀。当然，你还需要删除此前静态导入部分的代码片段:

```python
from aip import AipSpeech
```

现在，当我需要使用某一个语音识别引擎时，我只需要给 `ASREngineFactory` 传入一个类型，它将会在创建实例的时候动态导入对应的模块。这样，即使我没有安装 `PaddleSpeech`，它丝毫不影响我使用 `baidu-aip` 或者 `openai-whisper` 这两个库，这样听起来更合理一点，不是吗？
