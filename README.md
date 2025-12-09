# USB KVM 客户端

中文 | [English](README_EN.md)

## 这是什么？

USB KVM Client 是一个基于 Electron 构建的跨平台 USB KVM 客户端。它允许你通过 USB 硬件 KVM 设备（基于 单片机 + 采集卡）来控制远程计算机。

本项目是以下项目的替代Host客户端：
- [osrbot/osrbot_client](https://github.com/osrbot/osrbot_client)

原始项目：
- [Jackadminx/KVM-Card-Mini](https://github.com/Jackadminx/KVM-Card-Mini)

**主要区别：**
- **跨平台**：支持 macOS (x64/ARM64)、Windows (x64/ARM64) 和 Linux (x64/ARM64)
- **现代化架构**：使用 Electron + Rust 原生模块，而非 Python/PySide
- **增强的键盘捕获**：使用平台特定的底层键盘钩子（灵感来自 RustDesk），而非Electron自带的Keyboardlock（自带的不够底层）
- **更好的性能**：直接 WebRTC 视频捕获，优化的 HID 协议实现

## 工作原理

1. **视频捕获**：通过 WebRTC API 从 USB 视频采集设备（MS2130 或兼容设备）捕获视频
2. **HID 通信**：通过基于 STM32 的 KVM 硬件，使用 USB HID 协议向远程计算机发送键盘/鼠标事件
3. **键盘捕获**：使用基于 rdev 库的原生 Rust 模块进行系统级键盘捕获（在控制模式下阻止操作系统快捷键）
4. **两种鼠标模式**：
   - **绝对模式**：点击定位（直接坐标映射）
   - **相对模式**：传统鼠标移动（增量定位）

## 使用方法

请查看[发布说明](../../releases)了解：
- 特定平台的安装说明
- 首次设置指南
- 权限要求（macOS 辅助功能、Linux udev 规则）
- 常见问题故障排除

### 快速开始

**Linux (Ubuntu 22.04+)：**
```bash
# 安装 fuse2 依赖
sudo apt install libfuse2

# 赋予 AppImage 执行权限并运行
chmod +x KVM-Client-*.AppImage
./KVM-Client-*.AppImage
```

**Linux (Ubuntu < 22.04)：**
```bash
# 安装 fuse2 依赖
sudo apt-get install fuse libfuse2

# 赋予 AppImage 执行权限并运行
chmod +x KVM-Client-*.AppImage
./KVM-Client-*.AppImage
```

**注意：**如果 AppImage 因文件名中的版本号无法启动，请将其重命名为更简单的名称（例如 `KVM.AppImage`）

**macOS：**
- 挂载 DMG 并拖动到应用程序文件夹
- 在提示时授予辅助功能和输入监控权限

**Windows：**
- 运行安装程序或使用便携版本
- 无需特殊权限

## 架构与技术细节

### 核心组件

1. **主进程** (`src/main.js`)
   - Electron 主进程
   - 窗口管理和 IPC 通信
   - 原生键盘模块集成
   - 系统托盘和全局快捷键

2. **HID 管理器** (`src/hid-manager.js`)
   - USB HID 设备通信
   - 键盘/鼠标事件转换为 HID 协议
   - 修饰键跟踪和缓冲区轮转
   - 设备断开时自动重连

3. **原生键盘捕获器** (`native/rdev-grabber/`)
   - Rust 原生 N-API 模块
   - 平台特定的键盘钩子：
     - **Windows**：带消息泵的底层键盘钩子 (WH_KEYBOARD_LL)
     - **macOS**：带辅助功能 API 的 CGEvent tap
     - **Linux**：通过 rdev 进行基于 evdev 的捕获
   - 在控制模式下阻止系统快捷键
   - 处理幽灵按键检测（macOS rdev bug 修复）

4. **渲染进程** (`src/renderer/`)
   - 基于 WebRTC 的视频捕获
   - UI 控件和设置
   - 鼠标事件处理（绝对/相对模式）

### 相比类似项目的改进

**1. 更好的键盘捕获**
- 使用底层操作系统钩子而非简单的键盘锁定
- 正确阻止 Windows 键、系统热键（Alt+Tab 等）
- 灵感来自 RustDesk 的实现方式 - 感谢 RustDesk 项目提供的优秀参考实现

**2. 跨平台支持**
- macOS、Windows 和 Linux 的单一代码库
- 带平台特定优化的原生模块
- 为 Apple Silicon 和 Windows ARM 提供适当的 ARM64 支持

**3. 现代化技术栈**
- 使用 Electron 构建 UI（而非 PySide/Qt）
- 使用 Rust 编写性能关键的原生代码
- 使用 WebRTC 进行低延迟视频流传输
- 使用 N-API 实现稳定的原生模块 ABI

**4. 增强的 HID 协议**
- 适当的修饰键状态跟踪
- 缓冲区轮转以防止按键卡住问题
- 支持所有标准按键和功能键
- 鼠标滚轮和多按钮支持

### 硬件兼容性

**重要提示：**此应用程序当前配置为特定的 HID 设备：
- **供应商 ID**：`0x413D`
- **产品 ID**：`0x2107`
- **用途页**：`0xFF00`

如果你有自己的基于 STM32 的 KVM 硬件，使用不同的 VID/PID，则需要修改 `src/hid-manager.js` 中的设备过滤器：

```javascript
// 在 hid-manager.js 中查找并修改这些值
const DEVICE_FILTER = {
  vendorId: 0x413D,   // 你的设备的 VID
  productId: 0x2107,  // 你的设备的 PID
  usagePage: 0xFF00   // 你的设备的用途页
};
```

## 从源代码构建

```bash
# 安装依赖
npm install

# 构建原生模块
npm run build:native

# 开发模式运行
npm run dev

# 创建分发包
npm run dist
```

对于 Ubuntu 20.04 或使用较旧 GLIBC 的系统，使用重建变体：
```bash
npm run build:rebuild
npm run dist:rebuild
```

## 致谢

特别感谢：
- **[RustDesk](https://github.com/rustdesk/rustdesk)**：提供了跨平台键盘捕获的优秀参考实现，本项目的键盘处理做了很多参考
- **[rdev](https://github.com/Narsil/rdev)**：提供了底层键盘/鼠标事件库

## 许可证

MIT 许可证 - 详见 LICENSE 文件
