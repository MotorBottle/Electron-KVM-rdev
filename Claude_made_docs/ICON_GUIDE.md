# Icon Setup Guide / 图标设置指南

## Icon Requirements / 图标要求

### Current Status / 当前状态

✅ **macOS**: `icon.icns` - Ready
❌ **Windows**: `icon.ico` - **MISSING - NEEDS TO BE CREATED**
❌ **Linux**: `icon.png` - **MISSING - NEEDS TO BE CREATED**

### How to Create Missing Icons / 如何创建缺失的图标

#### Option 1: Using Online Tools / 选项1：使用在线工具

**For Windows (.ico):**
1. Go to https://convertio.co/png-ico/ or https://icoconvert.com/
2. Upload your highest resolution favicon PNG (e.g., `Favicon (icon)/favicon-192.png`)
3. Select output format: ICO
4. Select sizes: Include 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
5. Download and save as `icon.ico` in project root

**For Linux (.png):**
1. Use your highest resolution favicon (e.g., `favicon-192.png`)
2. Resize to 512x512 or 1024x1024 using:
   - Online: https://www.iloveimg.com/resize-image
   - Or macOS Preview: Open PNG → Tools → Adjust Size → 512x512 or 1024x1024
3. Save as `icon.png` in project root

#### Option 2: Using Command Line (macOS/Linux) / 选项2：使用命令行

**For Windows (.ico) - using ImageMagick:**
```bash
# Install ImageMagick if not already installed
brew install imagemagick  # macOS
# sudo apt install imagemagick  # Linux

# Convert from PNG to ICO with multiple sizes
convert "Favicon (icon)/favicon-192.png" \
  -define icon:auto-resize=256,128,64,48,32,16 \
  icon.ico
```

**For Linux (.png) - using ImageMagick:**
```bash
# Resize to 512x512
convert "Favicon (icon)/favicon-192.png" \
  -resize 512x512 \
  icon.png

# Or resize to 1024x1024 for better quality
convert "Favicon (icon)/favicon-192.png" \
  -resize 1024x1024 \
  icon.png
```

#### Option 3: Using macOS Preview / 选项3：使用 macOS 预览

**For Windows (.ico):**
1. Open your existing `icon.icns` in Preview
2. Export as PNG at highest resolution (1024x1024)
3. Use online converter (Option 1) to create .ico

**For Linux (.png):**
1. Open your existing `icon.icns` in Preview
2. File → Export
3. Format: PNG
4. Resolution: 512x512 or 1024x1024
5. Save as `icon.png` in project root

### Icon File Specifications / 图标文件规格

| Platform | Format | Recommended Size | File Location |
|----------|--------|------------------|---------------|
| macOS    | .icns  | 1024x1024 (contains multiple sizes) | `icon.icns` (✅ exists) |
| Windows  | .ico   | 256x256 (multi-size: 16,32,48,64,128,256) | `icon.ico` (❌ create this) |
| Linux    | .png   | 512x512 or 1024x1024 | `icon.png` (❌ create this) |

### Verifying Icons / 验证图标

After creating the icons, verify they're in the correct location:

```bash
cd /path/to/electron-kvm
ls -lh icon.*

# You should see:
# icon.icns  (macOS - already exists)
# icon.ico   (Windows - you need to create this)
# icon.png   (Linux - you need to create this)
```

### Building with Icons / 使用图标构建

Once all icons are in place, build the application:

```bash
# Build for current platform
npm run dist

# The packaged apps will use the appropriate icon for each platform
```

### Troubleshooting / 故障排除

**"Icon not showing in Windows installer"**
- Make sure `icon.ico` exists in project root
- Verify package.json has `"win": { "icon": "icon.ico", ... }`
- Rebuild: `npm run dist`

**"Icon not showing in Linux AppImage"**
- Make sure `icon.png` is at least 512x512
- Verify package.json has `"linux": { "icon": "icon.png", ... }`
- Rebuild: `npm run dist`

**"Icon looks blurry"**
- Use higher resolution source image
- For .ico: Include multiple sizes (16, 32, 48, 64, 128, 256)
- For .png: Use at least 512x512, preferably 1024x1024

### Quick Command Summary / 快速命令摘要

```bash
# If you have ImageMagick installed:

# Create Windows icon
convert "Favicon (icon)/favicon-192.png" -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Create Linux icon
convert "Favicon (icon)/favicon-192.png" -resize 512x512 icon.png

# Verify all icons exist
ls -lh icon.*

# Build application
npm run dist
```
