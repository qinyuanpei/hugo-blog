---
categories:
- 编程语言
copyright: true
date: 2024-02-25 10:30:47
description: ''
slug: Practice-Local-AI-Knowledg-Base-Based-On-LLaMA-And-LangChain
 - 
tags:
- LLaMA
- LangChain
- RAG
- GPTs
title: 基于 LLaMA 和 LangChain 实践本地 AI 知识库 
toc: true
image: /posts/基于-LLaMA-和-LangChain-实践本地-AI-知识库/cover.png
---

有时候，我难免不由地感慨，真实的人类世界，本就是一个巨大的娱乐圈，即使是在英雄辈出的 IT 行业。数日前，Google 对外正式发布了 Gemini 1.5 Pro，一个建立在 Transformer 和 MoE 架构上的多模态模型。可惜，这个被 Google 寄予厚望的产品并未激起多少水花，因为 OpenAI 在同一天发布了 Sora，一个支持从文字生成视频的模型，可谓是一时风光无二。有人说，OpenAI 站在 Google 的肩膀上，用 Google 的技术疯狂刷屏。此中曲直，远非我等外人所能预也。我们唯一能确定的事情是，通用人工智能，即：AGI（**Artificial General Intelligence**）的实现，正在以肉眼可见的速度被缩短，以前在科幻电影中看到的种种场景，或许会比我们想象中来得更快一些。不过，等待 AGI 来临前的黑夜注定是漫长而孤寂的。在此期间，我们继续来探索 AI 应用落地的最佳实践，即：在成功部署本地 AI 大模型后，如何通过外挂知识库的方式为其 “**注入**” 新的知识。

# 从 RAG & GPTs 开始
在上一期博客中，博主曾经有一个困惑，那就是当前阶段 AI 应用的最佳实践到底是什么？站在 2023 年的时间节点上，博主曾经以为未来属于提示词工程(**Prompt Engineering**)，而站在 2024 年的时间节点上，博主认为 **RAG & GPTs** 在实践方面或许要略胜一筹。在过去的一年里，我们陆陆续续看到像 [Prompt Heroes](https://promptheroes.cn/)、[PromptBase](https://promptbase.cn/)、[AI Short](https://www.aishort.top/)...等等这样的提示词网站出现，甚至提示词可以像商品一样进行交易。与此同时，随着 OpenAI [GPT Store](https://openai.com/blog/introducing-the-gpt-store) 的发布，我们仿佛可以看到一种 AI 应用商店的雏形。什么是 GPTs 呢？通常是指可以让使用者量身定做 AI 助理的工具。譬如，它允许用户上传资料来丰富 ChatGPT 的知识库，允许用户使用个性化的提示词来指导 ChatGPT 的行为，允许用户整合各项技能(搜索引擎、Web API、[Function Calling](https://cookbook.openai.com/examples/function_calling_with_an_openapi_spec))...等等。我们在上一期博客中提到人工智能的 “**安卓时刻**”，一个重要的契机是目前产生了类似应用商店的 GPT Store，如下图所示：

![OpenAI 推出 GPT Store](/posts/基于-LLaMA-和-LangChain-实践本地-AI-知识库/ChatGPT-GPT-Store.png)

如果你觉得 OpenAI 的 GPT Store 离我们还稍微有点距离的话，不妨了解一下 [FastGPT](https://github.com/labring/FastGPT) 这个项目，它以更加直观的方式展示了一个 GPTs 是如何被创造出来的。如图所示，博主利用我的博客作为知识库创建了一个博客助手，而这一切只需要选模型、编写提示词、上传资料三个步骤即可。感兴趣的朋友可以从 [这里](https://share.fastgpt.in/chat/share?shareId=rrpn95r7p7x0mc50fvofkgfn) 进行体验：

![通过 FastGPT 创建 AI 应用](/posts/基于-LLaMA-和-LangChain-实践本地-AI-知识库/FastGPT-GPTs.png)

由此，我们就可以得出一个结论，目前 AI 应用落地主要还是围绕大模型微调(**Fine Tuning**)、提示词工程(**Prompt Engineering**) 以及知识增强展开，并且 GPTs 里依然有提示词参与，两者并不冲突。考虑到，大模型微调这条线存在一定的门槛，我们暂且将其放在一旁。此时，提示词工程和知识增强就成为了 AI 应用落地的关键。知识增强，专业术语为**检索增强生成**，即：**Retrieval-Augmented Generation**，**RAG**，其基本思路就是将大语言模型和知识库结合起来，通过外挂知识库的方式来增强大模型的生成能力。比如微软的 New Bing 是 GPT-4 + 搜索引擎的方案，而更一般的方案则是 LLM + 向量数据库的思路，下图展示了 RAG 运作的基本原理：

![RAG 运作的基本原理](/posts/基于-LLaMA-和-LangChain-实践本地-AI-知识库/LangChain-Flow.drawio.png)



# 知识库构建
# LLaMA 的再度整合
# 本文小结
