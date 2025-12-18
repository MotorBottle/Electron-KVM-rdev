# 兼容设备

本文档说明如何为 electron-kvm 客户端添加新 KVM 设备支持。

## 当前兼容的设备

| 设备 | VID | PID | 说明 |
|------|-----|-----|------|
| OSRBOT / KVM Card Mini | 0x413D | 0x2107 | 基于 CH582F 的 KVM 设备 |

## 如何添加新设备

你可以通过两种方式添加新的兼容设备：

### 方法 1：编辑 JavaScript 文件（推荐用于开发）

编辑 `src/renderer/app.js`，在 `COMPATIBLE_DEVICES` 数组中添加你的设备：

```javascript
this.COMPATIBLE_DEVICES = [
    {
        vendorId: 0x413D,
        productId: 0x2107,
        description: 'KVM 控制接口 (OSRBOT, KVM Card Mini, CH582F-based devices)'
    },
    // 在这里添加你的设备：
    {
        vendorId: 0x1234,  // 你的设备的供应商 ID
        productId: 0x5678,  // 你的设备的产品 ID
        description: '我的自定义 KVM 设备'
    }
];
```

### 方法 2：编辑 JSON 文件（计划用于未来）

编辑 `src/compatible-devices.json` 并添加你的设备：

```json
{
  "compatibleDevices": [
    {
      "vendorId": "0x413D",
      "productId": "0x2107",
      "description": "KVM 控制接口 (OSRBOT, KVM Card Mini, CH582F-based devices)"
    },
    {
      "vendorId": "0x1234",
      "productId": "0x5678",
      "description": "我的自定义 KVM 设备"
    }
  ]
}
```

## 查找设备的 VID/PID

### 在 macOS 上：
```bash
# 列出所有 USB HID 设备及其 VID/PID
system_profiler SPUSBDataType | grep -A 10 "Product ID"
```

### 在 Linux 上：
```bash
lsusb
```

### 在 Windows 上：
1. 打开设备管理器
2. 在"人体学输入设备"下找到你的设备
3. 右键 → 属性 → 详细信息 → 硬件 ID
4. 查找 `VID_xxxx` 和 `PID_xxxx`

### 在 electron-kvm 应用中：
下拉菜单以此格式显示设备：
```
KVM Card Mini (VID:0x413d PID:0x2107)
```

## 自动连接行为

当以下情况时，客户端将自动连接到找到的**第一个**兼容设备：
1. 应用启动时
2. 刷新设备列表时
3. 应用运行时插入兼容设备

如果不想自动连接，手动断开设备后，它不会自动重连，直到你手动连接或重启应用。

## 协议要求

兼容设备必须：
- 使用 USB HID 协议
- 具有与配置列表匹配的供应商 ID 和产品 ID
- 支持 KVM 控制协议（与 OSRBOT/KVM Card Mini 相同）
- 实现键盘/鼠标 HID 端点

## 贡献

如果你成功添加了对新设备的支持，请考虑提交拉取请求，将其添加到默认兼容设备列表中！
