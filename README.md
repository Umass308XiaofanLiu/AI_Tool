# AI Chat Client

一个支持多种 AI 模型的浏览器端聊天客户端，支持在线 API 和本地 LM Studio 模型。

## 功能特点

### 多模型支持
- Google Gemini (2.5 Flash Lite, 3 Flash, 3 Pro)
- OpenAI GPT-5 (Nano, Mini, 5.2)
- Anthropic Claude 4.5 (Haiku, Sonnet, Opus)
- DeepSeek V3.2 (Chat, Reasoner)
- LM Studio 本地模型

### iOS 简约风格界面
- 类似 iOS 的简约设计风格
- SF Pro 风格字体和圆角设计
- 浅灰色用户消息气泡
- SVG 线条图标
- 灰色齿轮设置图标
- 深色/浅色主题切换

### 文件上传支持
- **图片上传**: 支持 PNG, JPG, GIF 等格式，可预览和放大查看
- **文档上传**: 支持 PDF, TXT, MD, JSON, CSV 等
- **代码文件上传**: 支持 50+ 种编程语言
  - Python (`.py`, `.pyw`, `.pyi`)
  - MATLAB (`.m`)
  - R (`.r`, `.R`)
  - C/C++ (`.c`, `.h`, `.cpp`, `.hpp`)
  - Java/Kotlin (`.java`, `.kt`)
  - Go/Rust/Swift (`.go`, `.rs`, `.swift`)
  - Julia/Haskell/Clojure (`.jl`, `.hs`, `.clj`)
  - 更多: Scala, Dart, Lua, Perl, Ruby, PHP, SQL, Fortran, VHDL 等
- **拖拽上传**: 直接拖拽文件到聊天区域
- **剪贴板粘贴**: 支持粘贴图片

### 生成控制
- **停止生成**: 点击发送按钮（显示为方形停止图标）随时停止 AI 回复
- **旋转动画**: 生成时按钮周围显示旋转圆圈动画

### 对话分支历史
- **重新生成**: 点击 Regenerate 生成新回复
- **历史保留**: 旧回复不会丢失，保存为历史记录
- **分支导航**: 使用 `◀ 1/3 ▶` 在不同版本间切换
- **完整分支**: 每个分支保留完整的后续对话
- **智能上下文**: AI 只根据当前分支的对话链进行回答

### 其他功能
- 代码块带语言标签和复制按钮
- LaTeX 数学公式渲染 (KaTeX)
- 复制消息功能
- 聊天历史自动保存
- API 密钥本地存储

## 使用方法

### 方式一：直接使用

1. 打开 `dist/AI_Chat_Client.html` 文件
2. 点击左下角设置按钮（灰色齿轮图标）
3. 输入所需的 API 密钥
4. 选择模型开始聊天

### 方式二：从源码构建

```bash
# 运行构建脚本
python build.py

# 输出文件位于 dist/AI_Chat_Client.html
```

## 支持的模型

| 服务 | 模型 ID | 显示名称 |
|------|---------|----------|
| Google Gemini | `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite |
| | `gemini-3-flash-preview` | Gemini 3 Flash |
| | `gemini-3-pro-preview` | Gemini 3 Pro |
| OpenAI | `gpt-5-nano` | GPT-5 Nano |
| | `gpt-5-mini` | GPT-5 Mini |
| | `gpt-5.2` | GPT-5.2 |
| Anthropic Claude | `claude-haiku-4-5-20251001` | Claude Haiku 4.5 |
| | `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5 |
| | `claude-opus-4-5-20251101` | Claude Opus 4.5 |
| DeepSeek | `deepseek-chat` | DeepSeek V3.2 |
| | `deepseek-reasoner` | DeepSeek V3.2 Reasoner |

## 配置说明

### API 密钥

在设置中配置各个服务的 API 密钥：

| 服务 | 说明 |
|------|------|
| Google Gemini | 从 [Google AI Studio](https://aistudio.google.com/) 获取 |
| OpenAI | 从 [OpenAI Platform](https://platform.openai.com/) 获取 |
| Anthropic Claude | 需要 API 密钥 + CORS 代理 URL |
| DeepSeek | 从 [DeepSeek Platform](https://platform.deepseek.com/) 获取 |

### Claude CORS 代理

由于浏览器安全限制，Claude API 需要通过 CORS 代理访问。请在设置中配置代理 URL。

### LM Studio 本地模型

1. 启动 LM Studio 并加载模型
2. 开启 Local Server (默认端口 1234)
3. 在设置中输入 LM Studio URL (如 `http://localhost:1234`)
4. 点击"Connect & Verify"检测可用模型

## 项目结构

```
AI_Tool/
├── build.py              # 构建脚本
├── dist/
│   └── AI_Chat_Client.html  # 构建输出
└── src/
    ├── css/
    │   └── styles.css    # 样式文件 (iOS 简约风格)
    ├── html/
    │   └── template.html # HTML 模板
    └── js/
        ├── api/          # API 客户端
        │   ├── claude.js
        │   ├── deepseek.js
        │   ├── gemini.js
        │   ├── lmstudio.js
        │   └── openai.js
        ├── ui/           # UI 组件
        │   ├── chat.js       # 聊天界面、文件上传、分支历史
        │   ├── chatHistory.js # 对话历史管理、分支系统
        │   ├── main.js
        │   ├── settings.js
        │   └── sidebar.js
        └── utils/        # 工具模块
            ├── markdown.js
            └── storage.js
```

## 技术栈

- 纯 HTML/CSS/JavaScript，无框架依赖
- CSS 变量实现主题切换
- LocalStorage 数据持久化
- SSE 流式响应处理
- FileReader API 文件处理
- SVG 图标系统

## License

MIT
