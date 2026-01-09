class KVMClient {
    constructor() {
        this.I18N = {
            en: {
                labelVideo: 'Video:',
                labelHID: 'HID:',
                deviceLabel: 'Device:',
                resolutionLabel: 'Resolution:',
                fpsLabel: 'FPS:',
                languageTitle: 'Language',
                languageHint: 'Auto-detected by system language; you can override here.',
                mouseModeTitle: 'Mouse Mode',
                mouseModeAbsolute: 'Absolute',
                mouseModeRelative: 'Relative',
                mouseModeDescAbs: 'Click to send absolute mouse positions',
                mouseModeDescRel: 'Move mouse for relative positioning',
                scrollTitle: 'Scroll Direction',
                scrollNatural: 'Natural',
                scrollTraditional: 'Traditional',
                scrollDescNatural: 'Natural scrolling (like macOS/mobile)',
                scrollDescTraditional: 'Traditional scrolling (like Windows)',
                quitKeyTitle: 'Quit Key Combination',
                quitKeyDesc: 'Key combination to exit control mode',
                changeBtn: 'Change',
                testTitle: 'Test Controls',
                testMouse: 'Test Mouse Click',
                testKeyboard: 'Test Keyboard (A)',
                customResTitle: 'Custom Resolutions',
                customResDesc: 'Append to the resolution menu (no guarantee device supports them).',
                addBtn: 'Add',
                saveBtn: 'Save',
                settings: 'Settings',
                btnStartVideo: 'Start Video',
                btnStopVideo: 'Stop Video',
                btnRefresh: 'Refresh',
                btnConnectHID: 'Connect HID',
                btnDisconnectHID: 'Disconnect HID',
                btnCtrlAltDel: 'Ctrl+Alt+Del',
                btnVirtualKeyboard: 'Virtual Keyboard',
                btnFullscreen: 'Fullscreen',
                videoDisconnected: 'Disconnected',
                videoConnected: 'Connected',
                hidDisconnected: 'Disconnected',
                hidConnected: 'Connected',
                overlayActive: '🎮 Control Mode Active',
                overlayHint: 'Press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> to exit',
                noValidRes: 'No valid resolutions found. Use formats like 1920x1200 or 2560*1440, separated by commas.',
                noWebRTC: 'Browser does not support WebRTC',
                cameraPermission: 'Camera permission is required for video streaming',
                noVideoDevices: 'No video devices detected',
                selectVideoDevice: 'Please select a video device',
                failedStartVideo: 'Failed to start video stream',
                selectHIDDevice: 'Please select a HID device',
                connectHIDFailed: 'Failed to connect HID device',
                connectHIDError: 'Error connecting HID device',
                refreshHIDError: 'Error refreshing HID connection',
                connectHIDFirst: 'Please connect HID device first',
                connectHIDFirstMouse: 'Please connect HID device first for mouse/keyboard control',
                startVideoFirst: 'Please start video stream first',
                fallbackResolution: 'Resolution {from} failed ({error}). Falling back to {to}.',
                negotiatedResolution: 'Requested {from}, device provided {to}. Using {to}.'
            },
            zh: {
                labelVideo: '视频：',
                labelHID: 'HID：',
                deviceLabel: '设备：',
                resolutionLabel: '分辨率：',
                fpsLabel: 'FPS：',
                languageTitle: '语言',
                languageHint: '默认根据系统语言，可在此手动切换。',
                mouseModeTitle: '鼠标模式',
                mouseModeAbsolute: '绝对',
                mouseModeRelative: '相对',
                mouseModeDescAbs: '点击直接定位鼠标坐标',
                mouseModeDescRel: '移动发送相对偏移',
                scrollTitle: '滚动方向',
                scrollNatural: '自然',
                scrollTraditional: '传统',
                scrollDescNatural: '自然滚动（macOS/移动端样式）',
                scrollDescTraditional: '传统滚动（Windows 样式）',
                quitKeyTitle: '退出快捷键',
                quitKeyDesc: '用于退出控制模式的组合键',
                changeBtn: '修改',
                testTitle: '测试',
                testMouse: '测试鼠标点击',
                testKeyboard: '测试键盘 (A)',
                customResTitle: '自定义分辨率',
                customResDesc: '添加到分辨率列表（设备是否支持不保证）。',
                addBtn: '添加',
                saveBtn: '保存',
                settings: '设置',
                btnStartVideo: '开始视频',
                btnStopVideo: '停止视频',
                btnRefresh: '刷新',
                btnConnectHID: '连接 HID',
                btnDisconnectHID: '断开 HID',
                btnCtrlAltDel: 'Ctrl+Alt+Del',
                btnVirtualKeyboard: '虚拟键盘',
                btnFullscreen: '全屏',
                videoDisconnected: '未连接',
                videoConnected: '已连接',
                hidDisconnected: '未连接',
                hidConnected: '已连接',
                overlayActive: '🎮 控制模式已开启',
                overlayHint: '按 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> 退出',
                noValidRes: '未找到有效分辨率。格式示例：1920x1200 或 2560*1440，使用逗号分隔。',
                noWebRTC: '浏览器不支持 WebRTC',
                cameraPermission: '需要相机权限才能开启视频流',
                noVideoDevices: '未检测到视频设备',
                selectVideoDevice: '请选择视频设备',
                failedStartVideo: '启动视频流失败',
                selectHIDDevice: '请选择 HID 设备',
                connectHIDFailed: '连接 HID 设备失败',
                connectHIDError: '连接 HID 设备出错',
                refreshHIDError: '刷新 HID 连接出错',
                connectHIDFirst: '请先连接 HID 设备',
                connectHIDFirstMouse: '请先连接 HID 设备以控制鼠标/键盘',
                startVideoFirst: '请先开启视频流',
                fallbackResolution: '分辨率 {from} 失败（{error}），切换到 {to}。',
                negotiatedResolution: '请求 {from}，设备返回 {to}，已使用 {to}。'
            }
        };

        this.videoConnected = false;
        this.hidConnected = false;
        this.manualHIDDisconnect = false; // Track if HID was manually disconnected
        this.mouseCaptured = false;
        this.mouseMode = 'absolute'; // 'absolute' or 'relative'
        this.currentStream = null;
        this.sidebarVisible = false;
        this.headerVisible = true;
        this.hideTimer = null;
        this.mouseButtonsPressed = 0; // Track which buttons are pressed
        this.reverseScroll = false; // Natural scrolling direction
        this.isFullscreen = false; // Track fullscreen state
        this.quitKeyCombo = { ctrlKey: true, altKey: true, shiftKey: false, metaKey: false, key: null, code: null }; // Default quit combination

        // Compatible KVM device list for auto-detection
        // Add new compatible devices here with their VID/PID and description
        this.COMPATIBLE_DEVICES = [
            {
                vendorId: 0x413D,
                productId: 0x2107,
                description: 'KVM Control Interface (OSRBOT, KVM Card Mini, CH582F-based devices)'
            }
            // Add more devices here:
            // { vendorId: 0x1234, productId: 0x5678, description: 'My Custom KVM Device' }
        ];

        // Disable WebRTC's default STUN servers to prevent external network connections
        this.disableWebRTCExternalConnections();

        // Load saved settings
        this.loadSettings();

        // Common resolutions (from HttpVideo.html)
        this.COMMON_RESOLUTIONS = [
            [1920, 1080], [1280, 720], [720, 480], [640, 480]
        ];

        this.initializeElements();
        this.bindEvents();
        this.setupGlobalKeyHandler();  // Setup rdev global key handler for quit key
        this.initializeVideo();
        this.applyLoadedSettings();
    }

    disableWebRTCExternalConnections() {
        // Override RTCPeerConnection to disable STUN servers and external connections
        if (typeof RTCPeerConnection !== 'undefined') {
            const originalRTCPeerConnection = RTCPeerConnection;
            
            window.RTCPeerConnection = function(config) {
                // Remove any external STUN/TURN servers
                if (config && config.iceServers) {
                    config.iceServers = [];
                }
                return new originalRTCPeerConnection(config);
            };
            
            // Copy static methods
            Object.setPrototypeOf(window.RTCPeerConnection, originalRTCPeerConnection);
            window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
        }
        
        // Override getUserMedia to ensure no external network calls
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log('WebRTC external connections disabled for local KVM use');
        }
    }

    initializeElements() {
        // Device selectors
        this.videoDevicesSelect = document.getElementById('videoDevices');
        this.resolutionSelect = document.getElementById('resolutionSelect');
        this.fpsSelect = document.getElementById('fpsSelect');
        this.hidDevicesSelect = document.getElementById('hidDevices');
        
        // Buttons
        this.refreshDevicesBtn = document.getElementById('refreshDevices');
        this.startVideoBtn = document.getElementById('startVideo');
        this.stopVideoBtn = document.getElementById('stopVideo');
        this.connectHIDBtn = document.getElementById('connectHID');
        this.disconnectHIDBtn = document.getElementById('disconnectHID');
        this.testMouseBtn = document.getElementById('testMouse');
        this.testKeyboardBtn = document.getElementById('testKeyboard');
        this.customResInput = document.getElementById('customResInput');
        this.addCustomResBtn = document.getElementById('addCustomRes');
        
        // Quick control buttons
        this.sendCADBtn = document.getElementById('sendCAD');
        this.virtualKeyboardBtn = document.getElementById('virtualKeyboard');
        this.toggleFullscreenBtn = document.getElementById('toggleFullscreen');
        this.languageSelect = document.getElementById('languageSelect');
        
        // Virtual keyboard elements
        this.virtualKeyboardModal = document.getElementById('virtualKeyboardModal');
        this.virtualKeyboardContent = document.getElementById('virtualKeyboardContent');
        this.virtualKeyboardHeader = document.getElementById('virtualKeyboardHeader');
        this.closeVirtualKeyboardBtn = document.getElementById('closeVirtualKeyboard');
        this.combinationKeys = document.getElementById('combinationKeys');
        this.sendCombinationBtn = document.getElementById('sendCombination');
        this.clearCombinationBtn = document.getElementById('clearCombination');
        
        // Mouse mode controls
        this.mouseModeToggle = document.getElementById('mouseModeToggle');
        this.mouseModeLabel = document.getElementById('mouseModeLabel');
        this.mouseModeDescription = document.getElementById('mouseModeDescription');
        
        // Scroll controls
        this.scrollReverseToggle = document.getElementById('scrollReverseToggle');
        this.scrollDirectionLabel = document.getElementById('scrollDirectionLabel');
        this.scrollDirectionDescription = document.getElementById('scrollDirectionDescription');
        
        // Status elements
        this.videoStatus = document.getElementById('videoStatus');
        this.hidStatus = document.getElementById('hidStatus');
        
        // Video elements
        this.videoElement = document.getElementById('videoElement');
        this.videoPlaceholder = document.getElementById('videoPlaceholder');
        
        // Mouse capture overlay
        this.mouseCaptureOverlay = document.getElementById('mouseCaptureOverlay');
        
        // UI elements
        this.header = document.querySelector('.header');
        this.infoPanel = document.querySelector('.info-panel');
        this.sidebarToggleBtn = document.getElementById('sidebarToggle');
        this.closeSidebarBtn = document.getElementById('closeSidebar');
        
        // Quit key elements
        this.quitKeyDisplay = document.getElementById('quitKeyDisplay');
        this.changeQuitKeyBtn = document.getElementById('changeQuitKey');
        this.quitKeyModal = document.getElementById('quitKeyModal');
        this.keyCaptureArea = document.getElementById('keyCaptureArea');
        this.capturedKeys = document.getElementById('capturedKeys');
        this.confirmQuitKeyBtn = document.getElementById('confirmQuitKey');
        this.cancelQuitKeyBtn = document.getElementById('cancelQuitKey');
        this.resetQuitKeyBtn = document.getElementById('resetQuitKey');
    }

    loadSettings() {
        try {
            // Language
            const savedLang = localStorage.getItem('kvmLanguage');
            if (savedLang && this.I18N[savedLang]) {
                this.language = savedLang;
            } else {
                this.language = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
            }

            // Load mouse mode preference
            const savedMouseMode = localStorage.getItem('kvmMouseMode');
            if (savedMouseMode && (savedMouseMode === 'absolute' || savedMouseMode === 'relative')) {
                this.mouseMode = savedMouseMode;
            }
            
            // Load scroll direction preference
            const savedScrollReverse = localStorage.getItem('kvmScrollReverse');
            if (savedScrollReverse !== null) {
                this.reverseScroll = savedScrollReverse === 'true';
            }
            
            // Load video source preferences
            const savedVideoDevice = localStorage.getItem('kvmVideoDevice');
            const savedVideoDeviceLabel = localStorage.getItem('kvmVideoDeviceLabel');
            const savedResolution = localStorage.getItem('kvmResolution');
            const savedFPS = localStorage.getItem('kvmFPS');
            const savedVideoPrefsByDevice = localStorage.getItem('kvmVideoPrefsByDevice');
            const savedCustomRes = localStorage.getItem('kvmCustomResolutions');
            
            this.savedVideoPreferences = {
                deviceId: savedVideoDevice,
                deviceLabel: savedVideoDeviceLabel,
                resolution: savedResolution,
                fps: savedFPS
            };
            this.videoPrefsByDevice = savedVideoPrefsByDevice ? JSON.parse(savedVideoPrefsByDevice) : {};
            try {
                this.customResolutions = savedCustomRes ? JSON.parse(savedCustomRes) : [];
            } catch (err) {
                console.warn('Failed to parse custom resolutions, resetting.', err);
                this.customResolutions = [];
            }
            if (!Array.isArray(this.customResolutions)) {
                this.customResolutions = [];
            }
            
            // Load quit key combination preference
            const savedQuitKeyCombo = localStorage.getItem('kvmQuitKeyCombo');
            if (savedQuitKeyCombo) {
                try {
                    const parsed = JSON.parse(savedQuitKeyCombo);
                    this.quitKeyCombo = parsed;
                    
                    // Migration: Add code field if it doesn't exist
                    if (this.quitKeyCombo.code === undefined) {
                        this.quitKeyCombo.code = null;
                    }
                } catch (error) {
                    console.error('Error parsing quit key combo:', error);
                }
            }
            
            console.log('Loaded settings:', { 
                mouseMode: this.mouseMode, 
                reverseScroll: this.reverseScroll,
                language: this.language,
                videoPreferences: this.savedVideoPreferences,
                videoPrefsByDevice: this.videoPrefsByDevice,
                customResolutions: this.customResolutions,
                quitKeyCombo: this.quitKeyCombo
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('kvmMouseMode', this.mouseMode);
            localStorage.setItem('kvmScrollReverse', this.reverseScroll.toString());
            localStorage.setItem('kvmQuitKeyCombo', JSON.stringify(this.quitKeyCombo));
            if (this.language) {
                localStorage.setItem('kvmLanguage', this.language);
            }
            console.log('Saved settings:', { mouseMode: this.mouseMode, reverseScroll: this.reverseScroll, quitKeyCombo: this.quitKeyCombo });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    saveVideoPreferences() {
        try {
            const deviceId = this.videoDevicesSelect.value;
            const deviceLabel = this.videoDevicesSelect.selectedOptions[0]?.textContent || '';
            const resolution = this.resolutionSelect.value;
            const fps = this.fpsSelect.value;

            // Persist per-device preferences (keyed by deviceId or label fallback)
            const deviceKey = deviceId || deviceLabel || 'default';
            if (!this.videoPrefsByDevice) {
                this.videoPrefsByDevice = {};
            }
            this.videoPrefsByDevice[deviceKey] = { deviceId, deviceLabel, resolution, fps };
            localStorage.setItem('kvmVideoPrefsByDevice', JSON.stringify(this.videoPrefsByDevice));
            
            if (deviceId) {
                localStorage.setItem('kvmVideoDevice', deviceId);
                localStorage.setItem('kvmVideoDeviceLabel', deviceLabel);
            }
            if (resolution) {
                localStorage.setItem('kvmResolution', resolution);
            }
            if (fps) {
                localStorage.setItem('kvmFPS', fps);
            }
            
            console.log('Saved video preferences:', { deviceId, deviceLabel, resolution, fps });
        } catch (error) {
            console.error('Error saving video preferences:', error);
        }
    }

    getDevicePreferences(deviceId, deviceLabel) {
        const deviceKey = deviceId || deviceLabel;
        if (deviceKey && this.videoPrefsByDevice && this.videoPrefsByDevice[deviceKey]) {
            return this.videoPrefsByDevice[deviceKey];
        }
        return this.savedVideoPreferences;
    }

    addCustomResolutionsFromInput() {
        if (!this.customResInput) return;
        const raw = this.customResInput.value || '';
        const parsed = this.parseCustomResolutions(raw);
        if (!raw.trim().length) {
            // Allow empty input to clear custom resolutions without warning
            this.customResolutions = [];
            localStorage.setItem('kvmCustomResolutions', JSON.stringify(this.customResolutions));
            this.buildResolutionFPS();
            return;
        }
        if (!parsed.length) {
            alert(this.t('noValidRes'));
            return;
        }
        if (!this.customResolutions) this.customResolutions = [];

        parsed.forEach(({ width, height }) => {
            if (!this.customResolutions.find(r => r.width === width && r.height === height)) {
                this.customResolutions.push({ width, height });
            }
        });

        localStorage.setItem('kvmCustomResolutions', JSON.stringify(this.customResolutions));
        this.buildResolutionFPS();
    }

    parseCustomResolutions(text) {
        return (text || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(entry => {
                const normalized = entry.replace('×', 'x').replace('*', 'x').toLowerCase();
                const parts = normalized.split('x');
                if (parts.length !== 2) return null;
                const w = parseInt(parts[0], 10);
                const h = parseInt(parts[1], 10);
                if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
                return { width: w, height: h };
            })
            .filter(Boolean);
    }

    setLanguage(lang) {
        if (!this.I18N[lang]) return;
        this.language = lang;
        localStorage.setItem('kvmLanguage', lang);
        this.applyTranslations();
        this.updateMouseModeDisplay();
        this.updateScrollDirectionDisplay();
    }

    t(key, params = {}) {
        const dict = this.I18N[this.language] || this.I18N.en;
        let str = dict[key] || this.I18N.en[key] || key;
        Object.entries(params).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, v);
        });
        return str;
    }

    applyTranslations() {
        const dict = this.I18N[this.language] || this.I18N.en;
        const mapIds = [
            { id: 'startVideo', key: 'btnStartVideo' },
            { id: 'stopVideo', key: 'btnStopVideo' },
            { id: 'refreshDevices', key: 'btnRefresh' },
            { id: 'connectHID', key: 'btnConnectHID' },
            { id: 'disconnectHID', key: 'btnDisconnectHID' },
            { id: 'sendCAD', key: 'btnCtrlAltDel' },
            { id: 'virtualKeyboard', key: 'btnVirtualKeyboard' },
            { id: 'toggleFullscreen', key: 'btnFullscreen' },
            { id: 'sidebarToggle', key: 'settings' },
            { id: 'mouseModeDescription', key: this.mouseMode === 'absolute' ? 'mouseModeDescAbs' : 'mouseModeDescRel' },
            { id: 'mouseModeLabel', key: this.mouseMode === 'absolute' ? 'mouseModeAbsolute' : 'mouseModeRelative' },
            { id: 'scrollDirectionDescription', key: this.reverseScroll ? 'scrollDescTraditional' : 'scrollDescNatural' },
            { id: 'scrollDirectionLabel', key: this.reverseScroll ? 'scrollTraditional' : 'scrollNatural' },
            { id: 'videoStatus', key: this.videoConnected ? 'videoConnected' : 'videoDisconnected' },
            { id: 'hidStatus', key: this.hidConnected ? 'hidConnected' : 'hidDisconnected' }
        ];
        mapIds.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            if (el && dict[key]) el.textContent = dict[key];
        });

        // data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                if (el.getAttribute('data-i18n-html') === 'true') {
                    el.innerHTML = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });

        // Overlay text
        const overlayTitle = document.querySelector('#mouseCaptureOverlay [data-i18n="controlModeTitle"]');
        if (overlayTitle) overlayTitle.textContent = dict.overlayActive;
        const overlayHint = document.querySelector('#mouseCaptureOverlay [data-i18n="controlModeHint"]');
        if (overlayHint) overlayHint.innerHTML = dict.overlayHint;

        // Custom res placeholder
        if (this.customResInput) {
            this.customResInput.placeholder = '1920x1200,2560x1440';
        }

        // Status labels via attributes already set; video/hid status updated elsewhere
    }

    applyLoadedSettings() {
        // Apply mouse mode setting to UI
        this.mouseModeToggle.checked = (this.mouseMode === 'relative');
        this.updateMouseModeDisplay();
        
        // Apply scroll direction setting to UI
        this.scrollReverseToggle.checked = this.reverseScroll;
        this.updateScrollDirectionDisplay();
        
        // Apply quit key combination setting to UI
        this.updateQuitKeyDisplay();

        // Populate custom resolution input
        if (this.customResInput) {
            const list = (this.customResolutions || []).map(r => `${r.width}x${r.height}`).join(',');
            this.customResInput.value = list;
        }

        // Apply language to UI
        if (this.languageSelect) {
            this.languageSelect.value = this.language;
        }
        this.applyTranslations();
        
        console.log('Applied loaded settings to UI');
    }

    bindEvents() {
        // Video controls
        this.refreshDevicesBtn.addEventListener('click', () => this.refreshAllDevices());
        this.startVideoBtn.addEventListener('click', () => this.startVideo());
        this.stopVideoBtn.addEventListener('click', () => this.stopVideo());
        
        // Device selection changes
        this.videoDevicesSelect.addEventListener('change', () => {
            this.buildResolutionFPS();
            this.saveVideoPreferences();
        });
        this.resolutionSelect.addEventListener('change', () => {
            this.buildFPS();
            this.saveVideoPreferences();
        });
        this.fpsSelect.addEventListener('change', () => {
            this.startVideo();
            this.saveVideoPreferences();
        });
        
        // HID controls
        this.connectHIDBtn.addEventListener('click', () => this.connectHID());
        this.disconnectHIDBtn.addEventListener('click', () => this.disconnectHID());
        
        // Mouse mode toggle
        this.mouseModeToggle.addEventListener('change', () => this.toggleMouseMode());
        
        // Scroll direction toggle
        this.scrollReverseToggle.addEventListener('change', () => this.toggleScrollDirection());
        
        // Quit key controls
        this.changeQuitKeyBtn.addEventListener('click', () => this.showQuitKeyModal());
        
        // Test controls
        this.testMouseBtn.addEventListener('click', () => this.testMouse());
        this.testKeyboardBtn.addEventListener('click', () => this.testKeyboard());
        this.addCustomResBtn.addEventListener('click', () => this.addCustomResolutionsFromInput());

        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (e) => this.setLanguage(e.target.value));
        }
        
        // Quick control buttons
        this.sendCADBtn.addEventListener('click', () => this.sendCtrlAltDelete());
        this.virtualKeyboardBtn.addEventListener('click', () => this.showVirtualKeyboard());
        this.toggleFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.closeVirtualKeyboardBtn.addEventListener('click', () => this.hideVirtualKeyboard());
        this.sendCombinationBtn.addEventListener('click', () => this.sendCurrentCombination());
        this.clearCombinationBtn.addEventListener('click', () => this.clearCombination());
        
        // Quit key modal event listeners
        this.confirmQuitKeyBtn.addEventListener('click', () => this.confirmQuitKeyChange());
        this.cancelQuitKeyBtn.addEventListener('click', () => this.hideQuitKeyModal());
        this.resetQuitKeyBtn.addEventListener('click', () => this.resetQuitKeyToDefault());
        
        // Video stream mouse/keyboard capture
        this.videoElement.addEventListener('click', (e) => {
            if (!this.mouseCaptured) {
                // Toggle capture mode
                this.toggleMouseCapture();
                e.preventDefault();
            }
            // Note: Mouse clicks when captured are handled by mousedown/mouseup events
        });
        
        // NOTE: Keyboard events are now handled by rdev in main process when in control mode
        // No need to listen to document keydown/keyup when rdev is active
        // The setupGlobalKeyHandler() method handles rdev events for quit key detection
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            console.log('Pointer lock changed:', document.pointerLockElement);
            if (!document.pointerLockElement && this.mouseCaptured && this.mouseMode === 'relative') {
                // Pointer lock was lost, release capture with key reset
                this.releaseMouseCaptureWithKeyReset();
            }
        });
        
        // Handle pointer lock errors
        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock failed');
            if (this.mouseCaptured && this.mouseMode === 'relative') {
                this.releaseMouseCaptureWithKeyReset();
            }
        });
        
        
        // Video element mouse events (for both absolute and relative modes)
        this.videoElement.addEventListener('mousemove', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseMove(e);
            }
        });
        
        // Mouse capture overlay events (backup for relative mode)
        this.mouseCaptureOverlay.addEventListener('mousemove', (e) => {
            if (this.mouseCaptured && this.hidConnected && this.mouseMode === 'relative') {
                this.handleMouseMove(e);
            }
        });
        
        // Mouse button events on video element
        this.videoElement.addEventListener('mousedown', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseEvent(e);
                e.preventDefault();
            }
        });
        
        this.videoElement.addEventListener('mouseup', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseEvent(e);
                e.preventDefault();
            }
        });
        
        // Mouse wheel events on video element
        this.videoElement.addEventListener('wheel', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseWheel(e);
                e.preventDefault();
            }
        });
        
        // Context menu prevention
        this.videoElement.addEventListener('contextmenu', (e) => {
            if (this.mouseCaptured) {
                e.preventDefault();
            }
        });
        
        this.mouseCaptureOverlay.addEventListener('mousedown', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseEvent(e);
            }
        });
        
        this.mouseCaptureOverlay.addEventListener('mouseup', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseEvent(e);
            }
        });
        
        this.mouseCaptureOverlay.addEventListener('wheel', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseWheel(e);
                e.preventDefault();
            }
        });
        
        // Additional drag support for overlay
        this.mouseCaptureOverlay.addEventListener('drag', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                e.preventDefault();
            }
        });
        
        this.mouseCaptureOverlay.addEventListener('dragstart', (e) => {
            if (this.mouseCaptured) {
                e.preventDefault();
            }
        });

        // Sidebar toggle
        this.sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });
        this.closeSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        
        // Click on header to close sidebar
        this.header.addEventListener('click', (e) => {
            if (this.sidebarVisible) {
                this.toggleSidebar();
            }
        });
        
        // Header auto-hide functionality
        document.addEventListener('mousemove', (e) => this.handleHeaderAutoHide(e));
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());

        // Device change detection
        if (navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', () => {
                this.handleDeviceChange();
            });
        }
        
        // Virtual keyboard event listeners
        this.setupVirtualKeyboard();
    }


    setupGlobalKeyHandler() {
        // Track last quit key detection time for debouncing
        this.lastQuitKeyTime = 0;
        this.quitKeyDebounceMs = 500; // Prevent multiple triggers within 500ms

        // Listen for rdev key events from main process for quit key detection
        if (window.electronAPI && window.electronAPI.onGlobalKeyPressed) {
            window.electronAPI.onGlobalKeyPressed((event, data) => {
                if (!this.mouseCaptured) return;

                // Only check for quit key combination in renderer
                // Main process handles sending to HID
                const eventType = data.eventType || data.event_type;

                // Check quit key on keydown only
                if (eventType === 'down') {
                    const syntheticEvent = {
                        key: data.key,
                        code: data.code,
                        metaKey: !!(data.metaKey ?? data.meta),
                        ctrlKey: !!(data.ctrlKey ?? data.ctrl),
                        altKey: !!(data.altKey ?? data.alt),
                        shiftKey: !!(data.shiftKey ?? data.shift),
                    };

                    // Debug logging for quit key detection
                    console.log('Checking quit key:', {
                        key: syntheticEvent.key,
                        modifiers: {
                            ctrl: syntheticEvent.ctrlKey,
                            alt: syntheticEvent.altKey,
                            shift: syntheticEvent.shiftKey,
                            meta: syntheticEvent.metaKey
                        },
                        required: this.quitKeyCombo
                    });

                    // Check if quit key combination is pressed
                    if (this.isQuitKeyCombo(syntheticEvent)) {
                        // Debounce: prevent multiple triggers in quick succession
                        const now = Date.now();
                        if (now - this.lastQuitKeyTime < this.quitKeyDebounceMs) {
                            console.log('Quit key debounced, ignoring');
                            return;
                        }

                        this.lastQuitKeyTime = now;
                        console.log('✓ Quit key combo matched! Exiting control mode');
                        this.releaseMouseCaptureWithKeyReset();
                    }
                }
            });
        }
    }

    async initializeVideo() {
        // Check WebRTC support
        if (!navigator.mediaDevices?.enumerateDevices) {
            alert(this.t('noWebRTC'));
            return;
        }

        try {
            // Request initial permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            await this.refreshVideoDevices();
        } catch (error) {
            console.error('Camera permission required:', error);
            alert(this.t('cameraPermission'));
        }

        await this.loadHIDDevices();
        this.updateMouseModeDisplay();
        this.updateScrollDirectionDisplay();
        
        // Start periodic HID device monitoring
        this.startHIDMonitoring();
    }

    async refreshAllDevices() {
        console.log('Refreshing all devices (video and HID)...');
        
        // Refresh both video and HID devices concurrently
        try {
            await Promise.all([
                this.refreshVideoDevicesWithReconnect(),
                this.refreshHID()
            ]);
            console.log('All devices refreshed successfully');
        } catch (error) {
            console.error('Error refreshing devices:', error);
        }
    }

    async refreshVideoDevicesWithReconnect() {
        // Store current video state
        const wasVideoConnected = this.videoConnected;
        const currentDeviceId = this.videoDevicesSelect.value;
        const currentResolution = this.resolutionSelect.value;
        const currentFPS = this.fpsSelect.value;
        
        // Disconnect video if connected
        if (wasVideoConnected) {
            await this.stopVideo();
        }
        
        // Refresh device list
        await this.refreshVideoDevices();
        
        // If video was connected, try to reconnect with same settings
        if (wasVideoConnected) {
            // Small delay to ensure device enumeration is complete
            setTimeout(async () => {
                try {
                    // Try to restore previous settings
                    if (currentDeviceId && this.videoDevicesSelect.querySelector(`option[value="${currentDeviceId}"]`)) {
                        this.videoDevicesSelect.value = currentDeviceId;
                    }
                    
                    // Rebuild resolution/FPS options
                    await this.buildResolutionFPS();
                    
                    // Try to restore previous settings
                    if (currentResolution && this.resolutionSelect.querySelector(`option[value="${currentResolution}"]`)) {
                        this.resolutionSelect.value = currentResolution;
                        await this.buildFPS();
                    }
                    if (currentFPS && this.fpsSelect.querySelector(`option[value="${currentFPS}"]`)) {
                        this.fpsSelect.value = currentFPS;
                    }
                    
                    // Restart video stream
                    if (this.videoDevicesSelect.value && this.resolutionSelect.value && this.fpsSelect.value) {
                        await this.startVideo();
                        console.log('Video stream reconnected after refresh');
                    }
                } catch (error) {
                    console.error('Error reconnecting video after refresh:', error);
                }
            }, 500); // 500ms delay
        }
    }

    async refreshVideoDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            this.videoDevicesSelect.innerHTML = '<option value="">Select Video Device</option>';
            
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Camera ${index + 1}`;
                this.videoDevicesSelect.appendChild(option);
            });

            if (videoDevices.length === 0) {
                alert(this.t('noVideoDevices'));
                return;
            }

            // Try to restore saved device preference first
            let deviceSelected = false;
            if (this.savedVideoPreferences?.deviceId) {
                // First try to find by exact deviceId
                const savedDevice = videoDevices.find(device => device.deviceId === this.savedVideoPreferences.deviceId);
                if (savedDevice) {
                    this.videoDevicesSelect.value = savedDevice.deviceId;
                    deviceSelected = true;
                    console.log('Restored saved video device by ID:', savedDevice.label);
                } else if (this.savedVideoPreferences.deviceLabel) {
                    // If deviceId not found, try to find by label (device may have been reconnected)
                    const deviceByLabel = videoDevices.find(device => 
                        device.label === this.savedVideoPreferences.deviceLabel
                    );
                    if (deviceByLabel) {
                        this.videoDevicesSelect.value = deviceByLabel.deviceId;
                        deviceSelected = true;
                        console.log('Restored saved video device by label:', deviceByLabel.label);
                    }
                }
            }
            
            // Auto-select first device if none selected and no saved preference
            if (!deviceSelected && !this.videoDevicesSelect.value && videoDevices.length > 0) {
                this.videoDevicesSelect.selectedIndex = 1; // Skip the "Select..." option
            }
            
            if (this.videoDevicesSelect.value) {
                await this.buildResolutionFPS();
            }
        } catch (error) {
            console.error('Error refreshing video devices:', error);
        }
    }

    async handleDeviceChange() {
        console.log('Device change detected');
        
        // Store current video state
        const wasVideoConnected = this.videoConnected;
        const currentDeviceId = this.videoDevicesSelect.value;
        const currentResolution = this.resolutionSelect.value;
        const currentFPS = this.fpsSelect.value;
        
        // Stop current stream if running
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
            this.videoConnected = false;
        }
        
        // Refresh device list
        await this.refreshVideoDevices();
        
        // If video was connected, try to reconnect
        if (wasVideoConnected) {
            // Small delay to ensure device enumeration is complete
            setTimeout(async () => {
                try {
                    // Try to find the same device by label/description
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    
                    let targetDevice = null;
                    
                    // First try to find by deviceId (same device)
                    targetDevice = videoDevices.find(device => device.deviceId === currentDeviceId);
                    
                    // If not found by ID, try to find by label (device unplugged/replugged)
                    if (!targetDevice && videoDevices.length > 0) {
                        // Use first available device as fallback
                        targetDevice = videoDevices[0];
                        console.log('Original device not found, using first available device');
                    }
                    
                    if (targetDevice) {
                        // Select the device
                        this.videoDevicesSelect.value = targetDevice.deviceId;
                        
                        // Rebuild resolution/FPS options
                        await this.buildResolutionFPS();
                        
                        // Try to restore previous settings
                        if (currentResolution && this.resolutionSelect.querySelector(`option[value="${currentResolution}"]`)) {
                            this.resolutionSelect.value = currentResolution;
                        }
                        if (currentFPS && this.fpsSelect.querySelector(`option[value="${currentFPS}"]`)) {
                            this.fpsSelect.value = currentFPS;
                        }
                        
                        // Restart video stream
                        await this.startVideo();
                        console.log('Video stream automatically reconnected after device change');
                    } else {
                        console.warn('No video devices available after device change');
                        this.updateVideoStatus();
                        this.startVideoBtn.disabled = false;
                        this.stopVideoBtn.disabled = true;
                    }
                } catch (error) {
                    console.error('Error reconnecting video after device change:', error);
                    this.updateVideoStatus();
                    this.startVideoBtn.disabled = false;
                    this.stopVideoBtn.disabled = true;
                }
            }, 1000); // 1 second delay
        }
    }

    async buildResolutionFPS() {
        this.resolutionSelect.innerHTML = '<option value="">Select Resolution</option>';
        this.fpsSelect.innerHTML = '<option value="">Select FPS</option>';
        const deviceId = this.videoDevicesSelect.value;
        if (!deviceId) return;
        const deviceLabel = this.videoDevicesSelect.selectedOptions[0]?.textContent || '';
        const devicePrefs = this.getDevicePreferences(deviceId, deviceLabel);

        try {
            // Get device capabilities
            const tempStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });
            
            const track = tempStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            tempStream.getTracks().forEach(t => t.stop());

            // Build resolution list using device-reported max first, then fall back to common set
            const maxWidth = capabilities.width?.max;
            const maxHeight = capabilities.height?.max;
            const availableResolutions = [];
            const resolutionSet = new Set();

            const addResolution = (w, h) => {
                if (!w || !h) return;
                const key = `${w}x${h}`;
                if (resolutionSet.has(key)) return;
                resolutionSet.add(key);
                availableResolutions.push([w, h]);
            };

            // Prefer the device's maximum capability as the first entry
            addResolution(maxWidth, maxHeight);

            // Add common resolutions that fit within the device limits (if known)
            this.COMMON_RESOLUTIONS.forEach(([w, h]) => {
                if (maxWidth && maxHeight && (w > maxWidth || h > maxHeight)) return;
                addResolution(w, h);
            });

            // Fallback: if nothing was added but max is known, ensure it's present
            if (!availableResolutions.length && maxWidth && maxHeight) {
                addResolution(maxWidth, maxHeight);
            }

            // Append user-defined resolutions (best effort)
            if (this.customResolutions && this.customResolutions.length) {
                this.customResolutions.forEach(({ width, height }) => addResolution(width, height));
            }

            // Sort by pixel count descending so the highest option is first
            availableResolutions.sort((a, b) => (b[0] * b[1]) - (a[0] * a[1]));

            availableResolutions.forEach(resolution => {
                const option = document.createElement('option');
                const value = `${resolution[0]}x${resolution[1]}`;
                option.value = value;
                option.textContent = `${resolution[0]}×${resolution[1]}`;
                this.resolutionSelect.appendChild(option);
            });

            // Try to restore saved resolution preference first
            let resolutionSelected = false;
            if (devicePrefs?.resolution) {
                const savedResolutionOption = this.resolutionSelect.querySelector(`option[value="${devicePrefs.resolution}"]`);
                if (savedResolutionOption) {
                    this.resolutionSelect.value = devicePrefs.resolution;
                    resolutionSelected = true;
                    console.log('Restored saved resolution:', devicePrefs.resolution);
                }
            }
            
            // Default to 1080p when available and no saved preference; otherwise pick first option
            if (!resolutionSelected && this.resolutionSelect.options.length > 1) {
                const prefer1080 = this.resolutionSelect.querySelector('option[value="1920x1080"]');
                if (prefer1080) {
                    this.resolutionSelect.value = '1920x1080';
                    console.log('Defaulting to 1080p resolution');
                } else {
                    this.resolutionSelect.selectedIndex = 1;
                }
            }

            await this.buildFPS();
        } catch (error) {
            console.error('Error building resolution list:', error);
            // Fallback to a basic list if capabilities fetch fails
            this.COMMON_RESOLUTIONS.forEach(resolution => {
                const option = document.createElement('option');
                const value = `${resolution[0]}x${resolution[1]}`;
                option.value = value;
                option.textContent = `${resolution[0]}×${resolution[1]}`;
                this.resolutionSelect.appendChild(option);
            });
            this.resolutionSelect.selectedIndex = 1;
        }
    }

    async buildFPS() {
        this.fpsSelect.innerHTML = '<option value="">Select FPS</option>';
        
        const deviceId = this.videoDevicesSelect.value;
        const resolution = this.resolutionSelect.value;
        if (!deviceId || !resolution) return;
        const deviceLabel = this.videoDevicesSelect.selectedOptions[0]?.textContent || '';
        const devicePrefs = this.getDevicePreferences(deviceId, deviceLabel);

        try {
            const [width, height] = resolution.split('x').map(Number);
            
            // Get FPS capabilities for specific resolution
            const tempStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    deviceId: { exact: deviceId },
                    width: { exact: width },
                    height: { exact: height }
                }
            });
            
            const track = tempStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            tempStream.getTracks().forEach(t => t.stop());

            // Build FPS list with robust fallbacks
            const frameRateCaps = capabilities.frameRate || {};
            const maxFPSRaw = Number.isFinite(frameRateCaps.max) ? frameRateCaps.max : null;
            const minFPSRaw = Number.isFinite(frameRateCaps.min) ? frameRateCaps.min : null;
            const candidates = [120, 90, 60, 30, 24, 15];
            let availableFPS = candidates.filter(fps => {
                const withinMax = !maxFPSRaw || fps <= Math.round(maxFPSRaw);
                const withinMin = !minFPSRaw || fps >= Math.ceil(minFPSRaw);
                return withinMax && withinMin;
            });

            if (!availableFPS.length) {
                const fallback = maxFPSRaw ? Math.max(minFPSRaw || 1, Math.min(Math.round(maxFPSRaw), 120)) : (minFPSRaw ? Math.max(Math.ceil(minFPSRaw), 60) : 60);
                availableFPS.push(fallback);
            }

            availableFPS.forEach(fps => {
                const option = document.createElement('option');
                option.value = fps.toString();
                option.textContent = `${fps} fps`;
                this.fpsSelect.appendChild(option);
            });

            // Try to restore saved FPS preference first
            let fpsSelected = false;
            if (devicePrefs?.fps) {
                const savedFPS = parseInt(devicePrefs.fps);
                if (availableFPS.includes(savedFPS)) {
                    this.fpsSelect.value = devicePrefs.fps;
                    fpsSelected = true;
                    console.log('Restored saved FPS:', devicePrefs.fps);
                }
            }
            
            // Auto-select highest available FPS when no saved preference
            if (!fpsSelected) {
                const highest = Math.max(...availableFPS);
                this.fpsSelect.value = highest.toString();
            }

            // Auto-start if this is initial setup
            if (this.fpsSelect.value && !this.videoConnected) {
                setTimeout(() => this.startVideo(), 100);
            }
        } catch (error) {
            console.error('Error building FPS list:', error);
            // Fallback to a basic FPS list
            [60, 30, 24].forEach(fps => {
                const option = document.createElement('option');
                option.value = fps.toString();
                option.textContent = `${fps} fps`;
                this.fpsSelect.appendChild(option);
            });
            this.fpsSelect.value = '60';
        }
    }

    async startVideo(allowFallback = true) {
        const deviceId = this.videoDevicesSelect.value;
        const resolution = this.resolutionSelect.value;
        const requestedResolution = resolution;
        const fps = this.fpsSelect.value;

        if (!deviceId) {
            alert(this.t('selectVideoDevice'));
            return;
        }

        if (!resolution || !fps) {
            console.log('Resolution or FPS not selected, building options...');
            if (!resolution) await this.buildResolutionFPS();
            if (!fps) await this.buildFPS();
            return;
        }

        // Stop current stream if running
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }

        try {
            const [width, height] = resolution.split('x').map(Number);
            const frameRate = Number(fps);

            // Configure getUserMedia to avoid external network connections
            const constraintsPrimary = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { exact: width },
                    height: { exact: height },
                    frameRate: { ideal: frameRate }
                },
                audio: false
            };

            const constraintsNoFps = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { exact: width },
                    height: { exact: height }
                },
                audio: false
            };

            const constraintsRelaxed = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: width },
                    height: { ideal: height }
                },
                audio: false
            };

            // Try primary, then progressively relax constraints
            let stream;
            let lastError = null;
            const attempts = [constraintsPrimary, constraintsNoFps, constraintsRelaxed];
            for (const attempt of attempts) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(attempt);
                    break;
                } catch (err) {
                    lastError = err;
                    console.warn('getUserMedia attempt failed, trying fallback:', err);
                }
            }

            if (!stream) {
                throw lastError || new Error('Unable to start video stream with current settings');
            }

            // Reflect actual negotiated settings in the UI (in case constraints were relaxed)
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings ? track.getSettings() : {};
            const actualWidth = settings.width;
            const actualHeight = settings.height;
            const actualFrameRate = settings.frameRate ? Math.round(settings.frameRate) : null;
            const actualResolution = (actualWidth && actualHeight) ? `${actualWidth}x${actualHeight}` : null;

            if (actualResolution && this.resolutionSelect.value !== actualResolution) {
                let opt = this.resolutionSelect.querySelector(`option[value="${actualResolution}"]`);
                if (!opt) {
                    opt = document.createElement('option');
                    opt.value = actualResolution;
                    opt.textContent = `${actualWidth}×${actualHeight}`;
                    // Insert after placeholder
                    this.resolutionSelect.insertBefore(opt, this.resolutionSelect.options[1] || null);
                }
                this.resolutionSelect.value = actualResolution;

                // Inform user when the device negotiated a different resolution
                if (requestedResolution && requestedResolution !== actualResolution) {
                    this.showAutoConnectNotification(
                        `Requested ${requestedResolution}, device provided ${actualResolution}. Using ${actualResolution}.`,
                        'error'
                    );
                }
            }

            if (actualFrameRate && this.fpsSelect.value !== actualFrameRate.toString()) {
                let fpsOpt = this.fpsSelect.querySelector(`option[value="${actualFrameRate}"]`);
                if (!fpsOpt) {
                    fpsOpt = document.createElement('option');
                    fpsOpt.value = actualFrameRate.toString();
                    fpsOpt.textContent = `${actualFrameRate} fps`;
                    this.fpsSelect.insertBefore(fpsOpt, this.fpsSelect.options[1] || null);
                }
                this.fpsSelect.value = actualFrameRate.toString();
            }

            this.saveVideoPreferences();

            this.videoElement.srcObject = stream;
            this.currentStream = stream;
            this.videoConnected = true;
            this.updateVideoStatus();
            this.updateVideoDisplay();
            
            this.startVideoBtn.disabled = true;
            this.stopVideoBtn.disabled = false;

            console.log(`Video started: ${actualResolution || `${width}x${height}`} @ ${actualFrameRate || fps}fps`);
        } catch (error) {
            console.error('Failed to start video stream:', error);

            const message = error?.message || 'Unknown error';

            if (allowFallback) {
                const nextResOption = this.getNextResolutionOption(resolution);
                if (nextResOption) {
                    const fallbackRes = nextResOption.value;
                    this.showAutoConnectNotification(
                        this.t('fallbackResolution', { from: resolution, to: fallbackRes, error: message }),
                        'error'
                    );
                    this.resolutionSelect.value = fallbackRes;
                    await this.buildFPS();
                    if (this.fpsSelect.value) {
                        return this.startVideo(false);
                    }
                }
            }

            alert(`${this.t('failedStartVideo')}: ${message}`);
        }
    }

    getNextResolutionOption(currentValue) {
        const options = Array.from(this.resolutionSelect?.options || []);
        const startIndex = options.findIndex(opt => opt.value === currentValue);
        const fromIndex = startIndex >= 0 ? startIndex + 1 : 1;
        for (let i = fromIndex; i < options.length; i++) {
            if (options[i].value) return options[i];
        }
        return null;
    }

    async stopVideo() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        this.videoElement.srcObject = null;
        this.videoConnected = false;
        this.updateVideoStatus();
        this.updateVideoDisplay();
        
        this.startVideoBtn.disabled = false;
        this.stopVideoBtn.disabled = true;

        if (this.mouseCaptured) {
            this.releaseMouseCapture();
        }
    }

    async loadHIDDevices() {
        try {
            const devices = await window.electronAPI.getHIDDevices();
            this.hidDevicesSelect.innerHTML = '<option value="">Select HID Device</option>';

            let compatibleDevice = null;

            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.path;
                // Show device info with VID/PID for better identification
                const vidPid = `VID:0x${(device.vendorId || 0).toString(16).padStart(4, '0')} PID:0x${(device.productId || 0).toString(16).padStart(4, '0')}`;
                option.textContent = `${device.product || 'Unknown Device'} (${vidPid})`;
                this.hidDevicesSelect.appendChild(option);

                // Check if device matches any in the compatible devices list
                const matchingConfig = this.COMPATIBLE_DEVICES.find(config =>
                    config.vendorId === device.vendorId &&
                    config.productId === device.productId
                );

                if (matchingConfig && !compatibleDevice) {
                    compatibleDevice = device;
                    console.log('Compatible KVM device found:', {
                        product: device.product || 'Unknown',
                        description: matchingConfig.description,
                        device: device
                    });
                }
            });

            // Auto-connect to compatible KVM device if found and not already connected
            if (compatibleDevice && !this.hidConnected) {
                const deviceName = compatibleDevice.product || 'KVM Device';
                console.log(`Compatible KVM device found (${deviceName}), auto-connecting...`, compatibleDevice);
                this.hidDevicesSelect.value = compatibleDevice.path;

                // Show user feedback about auto-connection attempt
                this.showAutoConnectNotification(`${deviceName} detected, connecting...`);

                try {
                    await this.connectHID();
                    if (this.hidConnected) {
                        this.showAutoConnectNotification(`✅ ${deviceName} connected successfully!`, 'success');
                    }
                } catch (error) {
                    console.error('Auto-connect failed:', error);
                    this.showAutoConnectNotification(`❌ ${deviceName} connection failed`, 'error');
                }
            }
        } catch (error) {
            console.error('Error loading HID devices:', error);
        }
    }

    async connectHID() {
        const devicePath = this.hidDevicesSelect.value;
        if (!devicePath) {
            alert(this.t('selectHIDDevice'));
            return;
        }

        try {
            const result = await window.electronAPI.connectHIDDevice(devicePath);
            if (result.success) {
                this.hidConnected = true;
                this.manualHIDDisconnect = false; // Clear manual disconnect flag on successful connection
                this.updateHIDStatus();
                
                // Stop monitoring when successfully connected
                this.stopHIDMonitoring();
            } else {
                alert(`${this.t('connectHIDFailed')}: ${result.error}`);
            }
        } catch (error) {
            console.error('Error connecting HID:', error);
            alert(this.t('connectHIDError'));
        }
    }

    async disconnectHID() {
        try {
            this.manualHIDDisconnect = true; // Mark as manual disconnect
            await window.electronAPI.disconnectHIDDevice();
            this.hidConnected = false;
            this.updateHIDStatus();
            
            if (this.mouseCaptured) {
                await this.releaseMouseCapture();
            }
            
            // Don't restart monitoring for manual disconnects to prevent auto-reconnection
            this.stopHIDMonitoring();
            console.log('HID manually disconnected - auto-reconnection disabled');
        } catch (error) {
            console.error('Error disconnecting HID:', error);
        }
    }

    async refreshHID() {
        try {
            // Store current device selection
            const currentDevicePath = this.hidDevicesSelect.value;
            
            // Full disconnect first
            if (this.hidConnected) {
                console.log('Refreshing HID: Disconnecting current device...');
                await window.electronAPI.disconnectHIDDevice();
                this.hidConnected = false;
                
                if (this.mouseCaptured) {
                    await this.releaseMouseCapture();
                }
            }
            
            // Stop any monitoring
            this.stopHIDMonitoring();
            
            // Clear flags and reset state
            this.manualHIDDisconnect = false;
            this.updateHIDStatus();
            
            // Refresh device list
            console.log('Refreshing HID: Loading device list...');
            await this.loadHIDDevices();
            
            // Try to reconnect to the same device if it's still available
            if (currentDevicePath && this.hidDevicesSelect.querySelector(`option[value="${currentDevicePath}"]`)) {
                console.log('Refreshing HID: Reconnecting to previous device...');
                this.hidDevicesSelect.value = currentDevicePath;
                await this.connectHID();
                
            } else {
                // Start monitoring for auto-connection when device not found
                this.startHIDMonitoring();
                console.log('Refreshing HID: Device list refreshed, monitoring restarted');
            }
            
            // Force UI update to ensure button states are correct
            this.updateHIDStatus();
        } catch (error) {
            console.error('Error refreshing HID:', error);
            alert(this.t('refreshHIDError'));
        }
    }

    async testMouse() {
        if (!this.hidConnected) {
            alert(this.t('connectHIDFirst'));
            return;
        }

        try {
            await window.electronAPI.sendMouseEvent({
                type: 'mousedown',
                button: 0
            });
            
            setTimeout(async () => {
                await window.electronAPI.sendMouseEvent({
                    type: 'mouseup',
                    button: 0
                });
            }, 100);
        } catch (error) {
            console.error('Error testing mouse:', error);
        }
    }

    async testKeyboard() {
        if (!this.hidConnected) {
            alert(this.t('connectHIDFirst'));
            return;
        }

        try {
            await window.electronAPI.sendKeyboardEvent({
                type: 'keydown',
                key: 'a'
            });
            
            setTimeout(async () => {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keyup',
                    key: 'a'
                });
            }, 100);
        } catch (error) {
            console.error('Error testing keyboard:', error);
        }
    }

    async testFunctionKey(key) {
        if (!this.hidConnected) {
            alert(this.t('connectHIDFirst'));
            return;
        }

        try {
            console.log(`Testing function key: ${key}`);
            await window.electronAPI.sendKeyboardEvent({
                type: 'keydown',
                key: key,
                code: key
            });
            
            setTimeout(async () => {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keyup',
                    key: key,
                    code: key
                });
            }, 100);
        } catch (error) {
            console.error(`Error testing ${key}:`, error);
        }
    }

    async resetKeys() {
        if (this.hidConnected) {
            try {
                await window.electronAPI.sendKeyboardEvent({ type: 'reset' });
                console.log('Manual keyboard reset triggered');
            } catch (error) {
                console.error('Error resetting keyboard:', error);
            }
        } else {
            alert(this.t('connectHIDFirst'));
        }
    }

    async resetDevices() {
        if (this.hidConnected) {
            try {
                await window.electronAPI.sendMouseEvent({ type: 'reset' });
                await window.electronAPI.sendKeyboardEvent({ type: 'reset' });
            } catch (error) {
                console.error('Error resetting devices:', error);
            }
        }
    }

    async toggleMouseCapture() {
        if (!this.hidConnected) {
            alert(this.t('connectHIDFirstMouse'));
            return;
        }

        if (!this.videoConnected) {
            alert(this.t('startVideoFirst'));
            return;
        }

        if (this.mouseCaptured) {
            await this.releaseMouseCapture();
        } else {
            await this.captureMouseKeyboard();
        }
    }


    async releaseMouseCaptureWithKeyReset() {
        // Send key reset to release any stuck modifier keys
        if (this.hidConnected) {
            try {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'reset'
                });
                console.log('Sent keyboard reset to release stuck keys');
            } catch (error) {
                console.error('Error sending keyboard reset:', error);
            }
        }
        
        // Then release mouse capture normally
        await this.releaseMouseCapture();
    }

    async releaseMouseCapture() {
        this.mouseCaptured = false;
        this.mouseCaptureOverlay.style.display = 'none';
        document.body.style.cursor = 'default';
        
        // Unregister ESC key when exiting control mode
        try {
            await window.electronAPI.setControlMode(false);
        } catch (error) {
            console.error('Error unsetting control mode:', error);
        }
        
        // Hide control mode notification
        const controlNotification = document.getElementById('controlModeNotification');
        if (controlNotification) {
            controlNotification.style.display = 'none';
        }
        
        // Exit pointer lock if active
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Restore all header and video container styles
        const videoContainer = document.querySelector('.video-container');
        
        // Restore header
        this.header.style.display = '';
        this.header.style.position = '';
        this.header.style.top = '';
        this.header.style.pointerEvents = '';
        this.header.classList.remove('hidden');
        this.headerVisible = true;
        
        // Restore video container to original state
        videoContainer.style.position = '';
        videoContainer.style.top = '';
        videoContainer.style.left = '';
        videoContainer.style.width = '';
        videoContainer.style.height = '';
        videoContainer.style.zIndex = '';
        
        console.log('macOS: Header and video container fully restored');
    }

    async handleMouseMove(event) {
        if (!this.hidConnected) return;

        if (this.mouseMode === 'relative') {
            const deltaX = event.movementX;
            const deltaY = event.movementY;

            if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
                try {
                    await window.electronAPI.sendMouseEvent({
                        type: 'move',
                        x: deltaX,
                        y: deltaY,
                        buttonsPressed: this.mouseButtonsPressed // Include button state for dragging
                    });
                } catch (error) {
                    console.error('Error sending mouse move:', error);
                }
            }
        } else if (this.mouseMode === 'absolute') {
            // Send absolute position for absolute mode
            const videoRect = this.videoElement.getBoundingClientRect();
            
            // Calculate relative position within the video element
            const relativeX = event.clientX - videoRect.left;
            const relativeY = event.clientY - videoRect.top;
            
            // Ensure coordinates are within bounds
            const clampedX = Math.max(0, Math.min(relativeX, videoRect.width));
            const clampedY = Math.max(0, Math.min(relativeY, videoRect.height));
            
            // Scale to HID coordinate space (0-32767)
            const x = Math.round((clampedX / videoRect.width) * 0x7FFF);
            const y = Math.round((clampedY / videoRect.height) * 0x7FFF);

            // Validate coordinates before sending
            if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
                console.error('Invalid coordinates detected:', { x, y });
                return;
            }

            try {
                await window.electronAPI.sendMouseEvent({
                    type: 'abs',
                    x: x,
                    y: y,
                    buttonsPressed: this.mouseButtonsPressed // Include button state for dragging
                });
            } catch (error) {
                console.error('Error sending absolute mouse position:', error);
            }
        }
    }

    async handleMouseClick(event) {
        if (!this.hidConnected || this.mouseMode !== 'absolute') return;

        // For absolute mode, use video element bounds, not overlay
        const videoRect = this.videoElement.getBoundingClientRect();
        
        // Calculate relative position within the video element
        const relativeX = event.clientX - videoRect.left;
        const relativeY = event.clientY - videoRect.top;
        
        // Ensure coordinates are within bounds
        const clampedX = Math.max(0, Math.min(relativeX, videoRect.width));
        const clampedY = Math.max(0, Math.min(relativeY, videoRect.height));
        
        // Scale to HID coordinate space (0-32767)
        const x = Math.round((clampedX / videoRect.width) * 0x7FFF);
        const y = Math.round((clampedY / videoRect.height) * 0x7FFF);


        try {
            await window.electronAPI.sendMouseEvent({
                type: 'abs',
                x: x,
                y: y
            });
        } catch (error) {
            console.error('Error sending absolute mouse position:', error);
        }
    }

    async handleMouseEvent(event) {
        if (!this.hidConnected) return;

        const buttonMask = this.getHIDButtonMask(event.button);

        if (event.type === 'mousedown') {
            this.mouseButtonsPressed |= buttonMask;
        } else if (event.type === 'mouseup') {
            this.mouseButtonsPressed &= ~buttonMask;
        }

        try {
            // In relative mode, only send button press/release without position
            // In absolute mode, include the click position
            if (this.mouseMode === 'relative') {
                // Relative mode: Send only button state, no position
                await window.electronAPI.sendMouseEvent({
                    type: event.type === 'mousedown' ? 'mousedown' : 'mouseup',
                    button: event.button,
                    buttonsPressed: this.mouseButtonsPressed
                    // No x, y coordinates in relative mode
                });
            } else {
                // Absolute mode: Calculate and send current mouse position
                const videoRect = this.videoElement.getBoundingClientRect();
                const relativeX = event.clientX - videoRect.left;
                const relativeY = event.clientY - videoRect.top;
                const clampedX = Math.max(0, Math.min(relativeX, videoRect.width));
                const clampedY = Math.max(0, Math.min(relativeY, videoRect.height));
                const x = Math.round((clampedX / videoRect.width) * 0x7FFF);
                const y = Math.round((clampedY / videoRect.height) * 0x7FFF);

                await window.electronAPI.sendMouseEvent({
                    type: event.type === 'mousedown' ? 'mousedown' : 'mouseup',
                    button: event.button,
                    buttonsPressed: this.mouseButtonsPressed,
                    x: x,  // Include current position in absolute mode
                    y: y
                });
            }
        } catch (error) {
            console.error('Error sending mouse event:', error);
        }

        event.preventDefault();
    }

    async handleMouseWheel(event) {
        if (!this.hidConnected) return;

        try {
            // Apply scroll direction preference
            const scrollMultiplier = this.reverseScroll ? -1 : 1;

            if (this.mouseMode === 'absolute') {
                // Absolute mode: Include current mouse position with wheel event
                const videoRect = this.videoElement.getBoundingClientRect();
                const relativeX = event.clientX - videoRect.left;
                const relativeY = event.clientY - videoRect.top;
                const clampedX = Math.max(0, Math.min(relativeX, videoRect.width));
                const clampedY = Math.max(0, Math.min(relativeY, videoRect.height));
                const x = Math.round((clampedX / videoRect.width) * 0x7FFF);
                const y = Math.round((clampedY / videoRect.height) * 0x7FFF);

                // Send wheel events for both X and Y scroll
                if (Math.abs(event.deltaY) > 0) {
                    await window.electronAPI.sendMouseEvent({
                        type: 'wheel',
                        delta: event.deltaY * scrollMultiplier,
                        x: x,
                        y: y,
                        buttonsPressed: this.mouseButtonsPressed
                    });
                }
                if (Math.abs(event.deltaX) > 0) {
                    await window.electronAPI.sendMouseEvent({
                        type: 'wheel',
                        delta: event.deltaX * scrollMultiplier,
                        x: x,
                        y: y,
                        buttonsPressed: this.mouseButtonsPressed
                    });
                }
            } else {
                // Relative mode: Send wheel delta without position (use zeros for relative deltas)
                // The HID backend will handle this as a relative mode wheel event
                if (Math.abs(event.deltaY) > 0) {
                    await window.electronAPI.sendMouseEvent({
                        type: 'wheel',
                        delta: event.deltaY * scrollMultiplier,
                        buttonsPressed: this.mouseButtonsPressed
                        // No x, y in relative mode - backend uses lastX/lastY or zeros
                    });
                }
                if (Math.abs(event.deltaX) > 0) {
                    await window.electronAPI.sendMouseEvent({
                        type: 'wheel',
                        delta: event.deltaX * scrollMultiplier,
                        buttonsPressed: this.mouseButtonsPressed
                        // No x, y in relative mode - backend uses lastX/lastY or zeros
                    });
                }
            }
        } catch (error) {
            console.error('Error sending mouse wheel:', error);
        }
    }


    updateVideoStatus() {
        this.videoStatus.textContent = this.videoConnected ? this.t('videoConnected') : this.t('videoDisconnected');
        this.videoStatus.setAttribute('data-status', this.videoConnected ? 'connected' : 'disconnected');
    }

    updateHIDStatus() {
        this.hidStatus.textContent = this.hidConnected ? this.t('hidConnected') : this.t('hidDisconnected');
        this.hidStatus.setAttribute('data-status', this.hidConnected ? 'connected' : 'disconnected');
        
        // Update connect/disconnect button states
        this.connectHIDBtn.disabled = this.hidConnected;
        this.disconnectHIDBtn.disabled = !this.hidConnected;
        
        // Enable/disable quick control buttons based on HID connection
        this.sendCADBtn.disabled = !this.hidConnected;
        this.virtualKeyboardBtn.disabled = !this.hidConnected;
    }

    updateVideoDisplay() {
        if (this.videoConnected) {
            this.videoElement.style.display = 'block';
            this.videoPlaceholder.style.display = 'none';
        } else {
            this.videoElement.style.display = 'none';
            this.videoPlaceholder.style.display = 'flex';
        }
    }

    toggleMouseMode() {
        this.mouseMode = this.mouseModeToggle.checked ? 'relative' : 'absolute';
        this.updateMouseModeDisplay();
        this.saveSettings();
    }

    updateMouseModeDisplay() {
        if (this.mouseMode === 'absolute') {
            this.mouseModeLabel.textContent = this.t('mouseModeAbsolute');
            this.mouseModeDescription.textContent = this.t('mouseModeDescAbs');
            this.mouseModeToggle.checked = false;
        } else {
            this.mouseModeLabel.textContent = this.t('mouseModeRelative');
            this.mouseModeDescription.textContent = this.t('mouseModeDescRel');
            this.mouseModeToggle.checked = true;
        }
    }

    toggleSidebar() {
        this.sidebarVisible = !this.sidebarVisible;
        this.infoPanel.classList.toggle('visible', this.sidebarVisible);
        this.sidebarToggleBtn.classList.toggle('active', this.sidebarVisible);
        this.sidebarToggleBtn.textContent = this.sidebarVisible ? 'Hide Settings' : 'Settings';
    }

    handleHeaderAutoHide(event) {
        // Don't auto-show header when mouse is captured
        if (this.mouseCaptured) return;
        
        // Only auto-hide in fullscreen mode
        if (this.isFullscreen) {
            this.showHeader();
            clearTimeout(this.hideTimer);
            this.hideTimer = setTimeout(() => this.hideHeader(), 2000);
        } else {
            // Always show header when not in fullscreen
            this.showHeader();
            clearTimeout(this.hideTimer);
        }
    }

    handleFullscreenChange() {
        // Detect fullscreen state from DOM
        this.isFullscreen = !!document.fullscreenElement;
        
        if (this.isFullscreen) {
            this.showHeader();
            clearTimeout(this.hideTimer);
            this.hideTimer = setTimeout(() => this.hideHeader(), 2000);
        } else {
            clearTimeout(this.hideTimer);
            this.showHeader();
        }
    }

    showHeader() {
        if (!this.headerVisible) {
            this.header.classList.remove('hidden');
            this.headerVisible = true;
        }
    }

    hideHeader() {
        if (this.headerVisible) {
            this.header.classList.add('hidden');
            this.headerVisible = false;
        }
    }

    async captureMouseKeyboard() {
        this.mouseCaptured = true;
        
        // Register ESC key for control mode
        try {
            await window.electronAPI.setControlMode(true);
        } catch (error) {
            console.error('Error setting control mode:', error);
        }
        
        // Multiple approaches for macOS compatibility
        const videoContainer = document.querySelector('.video-container');
        
        // 1. Hide header completely
        this.header.style.display = 'none';
        this.headerVisible = false;
        
        // 2. Remove header from document flow temporarily
        this.header.style.position = 'absolute';
        this.header.style.top = '-200px';
        this.header.style.pointerEvents = 'none';
        
        // 3. Ensure video container fills entire viewport
        videoContainer.style.position = 'fixed';
        videoContainer.style.top = '0';
        videoContainer.style.left = '0';
        videoContainer.style.width = '100vw';
        videoContainer.style.height = '100vh';
        videoContainer.style.zIndex = '9999';
        
        console.log('Header fully removed and video extended for macOS control');
        
        // Show control mode notification
        this.showControlModeNotification();
        
        if (this.mouseMode === 'relative') {
            // Relative mode: hide cursor and request pointer lock
            document.body.style.cursor = 'none';
            
            // Request pointer lock for relative mode
            console.log('Requesting pointer lock for relative mode');
            this.videoElement.requestPointerLock().then(() => {
                console.log('Pointer lock request succeeded');
            }).catch(error => {
                console.error('Pointer lock request failed:', error);
            });
        } else {
            // Absolute mode: keep cursor visible
            document.body.style.cursor = 'default';
        }
    }

    toggleScrollDirection() {
        this.reverseScroll = this.scrollReverseToggle.checked;
        this.updateScrollDirectionDisplay();
        this.saveSettings();
    }

    updateScrollDirectionDisplay() {
        if (this.reverseScroll) {
            this.scrollDirectionLabel.textContent = this.t('scrollTraditional');
            this.scrollDirectionDescription.textContent = this.t('scrollDescTraditional');
            this.scrollReverseToggle.checked = true;
        } else {
            this.scrollDirectionLabel.textContent = this.t('scrollNatural');
            this.scrollDirectionDescription.textContent = this.t('scrollDescNatural');
            this.scrollReverseToggle.checked = false;
        }
    }

    getHIDButtonMask(domButton) {
        // Convert DOM button index to HID button mask
        const buttonMap = {
            0: 1,  // Left button
            1: 4,  // Middle button  
            2: 2,  // Right button
            3: 8,  // Back button
            4: 16  // Forward button
        };
        return buttonMap[domButton] || 1;
    }

    async sendCtrlAltDelete() {
        if (!this.hidConnected) {
            alert(this.t('connectHIDFirst'));
            return;
        }

        try {
            console.log('Sending Ctrl+Alt+Delete');
            
            // Send the key combination in steps to avoid conflicts
            // First press modifiers
            await window.electronAPI.sendKeyboardEvent({
                type: 'keydown',
                key: 'Control',
                code: 'ControlLeft',
                ctrlKey: true,
                altKey: false,
                metaKey: false,
                shiftKey: false
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await window.electronAPI.sendKeyboardEvent({
                type: 'keydown',
                key: 'Alt',
                code: 'AltLeft',
                ctrlKey: true,
                altKey: true,
                metaKey: false,
                shiftKey: false
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Then press Delete
            await window.electronAPI.sendKeyboardEvent({
                type: 'keydown',
                key: 'Delete',
                code: 'Delete',
                ctrlKey: true,
                altKey: true,
                metaKey: false,
                shiftKey: false
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Release in reverse order
            await window.electronAPI.sendKeyboardEvent({
                type: 'keyup',
                key: 'Delete',
                code: 'Delete',
                ctrlKey: true,
                altKey: true,
                metaKey: false,
                shiftKey: false
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await window.electronAPI.sendKeyboardEvent({
                type: 'keyup',
                key: 'Alt',
                code: 'AltLeft',
                ctrlKey: true,
                altKey: false,
                metaKey: false,
                shiftKey: false
            });
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await window.electronAPI.sendKeyboardEvent({
                type: 'keyup',
                key: 'Control',
                code: 'ControlLeft',
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                shiftKey: false
            });
            
            console.log('Ctrl+Alt+Delete sequence completed');
            
        } catch (error) {
            console.error('Error sending Ctrl+Alt+Delete:', error);
            // Try to reset keyboard state on error
            try {
                await window.electronAPI.sendKeyboardEvent({ type: 'reset' });
            } catch (resetError) {
                console.error('Error resetting keyboard after CAD failure:', resetError);
            }
        }
    }

    showVirtualKeyboard() {
        this.virtualKeyboardModal.style.display = 'flex';
        // Reset position when opening
        this.virtualKeyboardContent.style.position = '';
        this.virtualKeyboardContent.style.left = '';
        this.virtualKeyboardContent.style.top = '';
        this.virtualKeyboardContent.style.margin = '';
        // Initialize display
        this.updateCombinationDisplay();
    }

    hideVirtualKeyboard() {
        this.virtualKeyboardModal.style.display = 'none';
        // Reset any active modifier states
        this.resetVirtualKeyboardModifiers();
    }

    setupVirtualKeyboard() {
        this.activeModifiers = new Set();
        this.pendingKeys = [];
        
        // Make keyboard draggable
        this.makeKeyboardDraggable();
        
        // Add event listeners to all virtual keyboard buttons
        const keyButtons = this.virtualKeyboardModal.querySelectorAll('.key-btn');
        
        keyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleVirtualKey(e.target);
            });
        });
        
        // Close modal when clicking outside
        this.virtualKeyboardModal.addEventListener('click', (e) => {
            if (e.target === this.virtualKeyboardModal) {
                this.hideVirtualKeyboard();
            }
        });
    }

    makeKeyboardDraggable() {
        let isDragging = false;
        let dragStartX, dragStartY, initialX, initialY;
        
        this.virtualKeyboardHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            const rect = this.virtualKeyboardContent.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
            e.preventDefault();
        });
        
        const handleDrag = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            const newX = initialX + deltaX;
            const newY = initialY + deltaY;
            
            this.virtualKeyboardContent.style.position = 'fixed';
            this.virtualKeyboardContent.style.left = `${newX}px`;
            this.virtualKeyboardContent.style.top = `${newY}px`;
            this.virtualKeyboardContent.style.margin = '0';
        };
        
        const handleDragEnd = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }

    async handleVirtualKey(button) {
        if (!this.hidConnected) {
            alert(this.t('connectHIDFirst'));
            return;
        }

        const key = button.dataset.key;
        const code = button.dataset.code || key;
        
        if (button.classList.contains('modifier-key')) {
            // Toggle modifier keys
            this.toggleVirtualModifier(button, key, code);
        } else {
            // For regular keys - either send immediately or add to combination
            if (this.activeModifiers.size === 0) {
                // No modifiers active - send immediately
                await this.sendSingleKey(key, code);
            } else {
                // Modifiers active - add to combination
                this.addToCombination(key, code);
            }
        }
    }

    toggleVirtualModifier(button, key, code) {
        if (this.activeModifiers.has(code)) {
            // Deactivate modifier
            this.activeModifiers.delete(code);
            button.classList.remove('active');
        } else {
            // Activate modifier
            this.activeModifiers.add(code);
            button.classList.add('active');
        }
        this.updateCombinationDisplay();
    }

    async sendSingleKey(key, code) {
        try {
            console.log(`Sending single key: ${key} (${code})`);

            // Send key down
            await window.electronAPI.sendKeyboardEvent({
                type: 'keydown',
                key: key,
                code: code
            });

            // Send key up after a short delay
            setTimeout(async () => {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keyup',
                    key: key,
                    code: code
                });
            }, 50);

        } catch (error) {
            console.error('Error sending single key:', error);
        }
    }

    addToCombination(key, code) {
        // Don't add duplicate keys
        if (!this.pendingKeys.find(k => k.code === code)) {
            this.pendingKeys.push({ key, code });
            this.updateCombinationDisplay();
        }
    }

    updateCombinationDisplay() {
        const modifierNames = {
            'ControlLeft': 'Ctrl',
            'ControlRight': 'Ctrl',
            'AltLeft': 'Alt', 
            'AltRight': 'Alt',
            'MetaLeft': 'Cmd',
            'MetaRight': 'Cmd',
            'ShiftLeft': 'Shift',
            'ShiftRight': 'Shift',
            'CapsLock': 'Caps'
        };

        const parts = [];
        
        // Add active modifiers
        this.activeModifiers.forEach(code => {
            if (modifierNames[code]) {
                parts.push(modifierNames[code]);
            }
        });
        
        // Add pending keys
        this.pendingKeys.forEach(keyObj => {
            parts.push(keyObj.key.toUpperCase());
        });

        if (parts.length === 0) {
            this.combinationKeys.textContent = 'None';
            this.sendCombinationBtn.disabled = true;
        } else {
            this.combinationKeys.textContent = parts.join(' + ');
            this.sendCombinationBtn.disabled = false;
        }
    }

    async sendCurrentCombination() {
        if (this.activeModifiers.size === 0 && this.pendingKeys.length === 0) {
            return;
        }

        try {
            console.log('Sending combination:', {
                modifiers: Array.from(this.activeModifiers),
                keys: this.pendingKeys
            });

            // If no regular keys, just send modifiers
            if (this.pendingKeys.length === 0) {
                for (const code of this.activeModifiers) {
                    await window.electronAPI.sendKeyboardEvent({
                        type: 'keydown',
                        key: this.getKeyFromCode(code),
                        code: code
                    });
                }
                
                setTimeout(async () => {
                    for (const code of this.activeModifiers) {
                        await window.electronAPI.sendKeyboardEvent({
                            type: 'keyup',
                            key: this.getKeyFromCode(code),
                            code: code
                        });
                    }
                }, 50);
                return;
            }

            // Send combination with modifiers
            // First, press all modifier keys
            for (const code of this.activeModifiers) {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keydown',
                    key: this.getKeyFromCode(code),
                    code: code
                });
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Then press and release each regular key
            for (const keyObj of this.pendingKeys) {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keydown',
                    key: keyObj.key,
                    code: keyObj.code
                });
                
                await new Promise(resolve => setTimeout(resolve, 50));
                
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keyup',
                    key: keyObj.key,
                    code: keyObj.code
                });
                
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Finally, release all modifier keys
            for (const code of this.activeModifiers) {
                await window.electronAPI.sendKeyboardEvent({
                    type: 'keyup',
                    key: this.getKeyFromCode(code),
                    code: code
                });
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Clear combination and release modifiers after sending
            this.clearCombination();
            this.releaseAllModifiers();

        } catch (error) {
            console.error('Error sending combination:', error);
        }
    }

    clearCombination() {
        this.pendingKeys = [];
        this.releaseAllModifiers();
        this.updateCombinationDisplay();
    }

    releaseAllModifiers() {
        this.activeModifiers.clear();
        const modifierButtons = this.virtualKeyboardModal.querySelectorAll('.modifier-key');
        modifierButtons.forEach(button => button.classList.remove('active'));
        this.updateCombinationDisplay();
    }

    getKeyFromCode(code) {
        // Handle the ShiftRight bug in Keyboard Lock API where event.code is empty
        let actualCode = code;
        if (code === '' && this.activeModifiers.has('ShiftRight')) {
            actualCode = 'ShiftRight';
        }
        
        const codeToKey = {
            'ControlLeft': 'Control',
            'ControlRight': 'Control',
            'AltLeft': 'Alt',
            'AltRight': 'Alt',
            'MetaLeft': 'Meta',
            'MetaRight': 'Meta',
            'ShiftLeft': 'Shift',
            'ShiftRight': 'Shift',
            'CapsLock': 'CapsLock'
        };
        return codeToKey[actualCode] || actualCode;
    }

    getDisplayKeyFromCode(code, fallbackKey) {
        // Convert event.code to a readable display key name
        // This helps avoid showing modified characters like 'œ' for Alt+Q
        const codeToDisplayKey = {
            // Letter keys
            'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E', 'KeyF': 'F',
            'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
            'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O', 'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R',
            'KeyS': 'S', 'KeyT': 'T', 'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X',
            'KeyY': 'Y', 'KeyZ': 'Z',
            
            // Number keys
            'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
            'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9',
            
            // Function keys
            'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
            'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
            
            // Special keys
            'Space': 'Space',
            'Enter': 'Enter',
            'Tab': 'Tab',
            'Escape': 'Escape',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'Insert': 'Insert',
            'Home': 'Home',
            'End': 'End',
            'PageUp': 'PageUp',
            'PageDown': 'PageDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight',
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            
            // Modifier keys (preserving left/right distinction)
            'ShiftLeft': 'Left Shift',
            'ShiftRight': 'Right Shift',
            'ControlLeft': 'Left Ctrl',
            'ControlRight': 'Right Ctrl',
            'AltLeft': 'Left Alt',
            'AltRight': 'Right Alt',
            'MetaLeft': 'Left Meta',
            'MetaRight': 'Right Meta'
        };
        
        // Return the mapped display key or fallback to the original key
        return codeToDisplayKey[code] || fallbackKey;
    }

    resetVirtualKeyboardModifiers() {
        this.activeModifiers.clear();
        this.pendingKeys = [];
        const modifierButtons = this.virtualKeyboardModal.querySelectorAll('.modifier-key');
        modifierButtons.forEach(button => button.classList.remove('active'));
        this.updateCombinationDisplay();
    }

    startHIDMonitoring() {
        // Check for new HID devices every 3 seconds
        this.hidMonitorInterval = setInterval(async () => {
            if (!this.hidConnected && !this.manualHIDDisconnect) {
                await this.loadHIDDevices();
            }
        }, 3000);
        
        console.log('HID device monitoring started - checking every 3 seconds');
    }

    stopHIDMonitoring() {
        if (this.hidMonitorInterval) {
            clearInterval(this.hidMonitorInterval);
            this.hidMonitorInterval = null;
            console.log('HID device monitoring stopped');
        }
    }

    showAutoConnectNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('autoConnectNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'autoConnectNotification';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background-color: #007acc;
                color: white;
                padding: 12px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(notification);
        }

        // Update styling based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc3545';
        } else {
            notification.style.backgroundColor = '#007acc';
        }

        notification.textContent = message;
        notification.style.display = 'block';
        notification.style.opacity = '1';

        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 4000);
    }

    showControlModeNotification() {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('controlModeNotification');
        if (!notification) {
            // Add animation styles to document head if not already present
            if (!document.getElementById('controlModeNotificationStyles')) {
                const style = document.createElement('style');
                style.id = 'controlModeNotificationStyles';
                style.textContent = `
                    @keyframes slideUpFadeIn {
                        0% {
                            transform: translateX(-50%) translateY(20px);
                            opacity: 0;
                        }
                        100% {
                            transform: translateX(-50%) translateY(0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            notification = document.createElement('div');
            notification.id = 'controlModeNotification';
            notification.style.cssText = `
                position: fixed;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                z-index: 10002;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                border: 2px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(12px);
                transition: all 0.3s ease;
                max-width: 400px;
                word-wrap: break-word;
                text-align: center;
                animation: slideUpFadeIn 0.4s ease-out;
            `;
            document.body.appendChild(notification);
        }

        // Get current quit key combination
        const parts = [];
        if (this.quitKeyCombo.ctrlKey) parts.push('Ctrl');
        if (this.quitKeyCombo.altKey) parts.push('Alt');
        if (this.quitKeyCombo.shiftKey) parts.push('Shift');
        if (this.quitKeyCombo.metaKey) parts.push('Meta');
        if (this.quitKeyCombo.key) parts.push(this.quitKeyCombo.key.toUpperCase());

        // Set the content with HTML for styled keys
        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 12px; font-size: 20px;">🎮 Control Mode Active</div>
            <div style="margin-bottom: 8px; font-size: 16px;">Press ${parts.map(key => `<kbd style="background-color: rgba(255, 255, 255, 0.25); border: 2px solid rgba(255, 255, 255, 0.4); border-radius: 6px; padding: 4px 10px; font-size: 14px; font-family: inherit; font-weight: 600; margin: 0 2px;">${key}</kbd>`).join(' + ')} to exit</div>
            <div style="font-size: 12px; color: #4CAF50; opacity: 0.9;">✅ Keyboard capture active</div>
        `;

        notification.style.display = 'block';
        notification.style.opacity = '1';

        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (notification && this.mouseCaptured) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.style.display = 'none';
                    }
                }, 300);
            }
        }, 4000);
    }

    async toggleFullscreen() {
        try {
            const isFullscreen = await window.electronAPI.toggleFullscreen();
            console.log('Fullscreen toggled:', isFullscreen);
            
            // Store fullscreen state for header auto-hide logic
            this.isFullscreen = isFullscreen;
            
            if (isFullscreen) {
                // In fullscreen mode, enable auto-hide behavior
                this.header.style.display = 'flex'; // Keep header available for auto-hide
                this.showHeader(); // Show initially
                clearTimeout(this.hideTimer);
                this.hideTimer = setTimeout(() => this.hideHeader(), 2000); // Auto-hide after 2 seconds
            } else {
                // Not in fullscreen, always show header
                this.header.style.display = 'flex';
                this.showHeader();
                clearTimeout(this.hideTimer); // No auto-hide when not fullscreen
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    }

    // Quit Key Functions
    isQuitKeyCombo(event) {
        const modifiersMatch = event.ctrlKey === this.quitKeyCombo.ctrlKey &&
                              event.altKey === this.quitKeyCombo.altKey &&
                              event.shiftKey === this.quitKeyCombo.shiftKey &&
                              event.metaKey === this.quitKeyCombo.metaKey;
        
        // If there's a specific key required, check it using the stored code for accuracy
        if (this.quitKeyCombo.key) {
            // Use event.code for comparison if available, otherwise fall back to event.key
            if (this.quitKeyCombo.code) {
                // Handle the ShiftRight bug in Keyboard Lock API where event.code is empty
                // This is a known issue where ShiftRight reports event.code as '' but event.key as 'Shift'
                let actualEventCode = event.code;
                if (event.code === '' && event.key === 'Shift') {
                    actualEventCode = 'ShiftRight'; // Assume right shift when code is empty but key is Shift
                }
                
                return modifiersMatch && actualEventCode === this.quitKeyCombo.code;
            } else {
                // Legacy support for old saved settings without code
                return modifiersMatch && event.key === this.quitKeyCombo.key;
            }
        }
        
        // For modifier-only combinations, ensure no other keys are pressed
        return modifiersMatch && !event.key.match(/^[a-zA-Z0-9]$/);
    }

    updateQuitKeyDisplay() {
        const parts = [];
        if (this.quitKeyCombo.ctrlKey) parts.push('Ctrl');
        if (this.quitKeyCombo.altKey) parts.push('Alt');
        if (this.quitKeyCombo.shiftKey) parts.push('Shift');
        if (this.quitKeyCombo.metaKey) parts.push('Meta');
        if (this.quitKeyCombo.key) parts.push(this.quitKeyCombo.key.toUpperCase());
        
        this.quitKeyDisplay.textContent = parts.join(' + ') || 'None';
        
        // Update the control mode notification
        this.updateControlModeNotification();
    }

    updateControlModeNotification() {
        // Update the overlay message with current quit key combination
        const parts = [];
        if (this.quitKeyCombo.ctrlKey) parts.push('Ctrl');
        if (this.quitKeyCombo.altKey) parts.push('Alt');
        if (this.quitKeyCombo.shiftKey) parts.push('Shift');
        if (this.quitKeyCombo.metaKey) parts.push('Meta');
        if (this.quitKeyCombo.key) parts.push(this.quitKeyCombo.key.toUpperCase());
        
        const quitKeyText = parts.join(' + ') || 'None';
        
        // Update the overlay in the mouse capture overlay
        const overlayInfo = this.mouseCaptureOverlay.querySelector('.mouse-capture-info');
        if (overlayInfo) {
            overlayInfo.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 6px;">🎮 Control Mode Active</div>
                <div style="margin-bottom: 4px;">Press ${parts.map(key => `<kbd>${key}</kbd>`).join(' + ')} to exit</div>
                <div style="font-size: 11px; opacity: 0.7;">F3/F11 keys via test buttons</div>
            `;
        }
    }

    showQuitKeyModal() {
        this.quitKeyModal.style.display = 'flex';
        this.tempQuitKeyCombo = null;
        this.capturedKeys.textContent = 'Press keys...';
        this.confirmQuitKeyBtn.disabled = true;
        this.keyCaptureArea.classList.add('capturing');
        
        // Add key capture listener
        this.quitKeyModalKeyHandler = (e) => this.handleQuitKeyCapture(e);
        document.addEventListener('keydown', this.quitKeyModalKeyHandler);
        document.addEventListener('keyup', this.quitKeyModalKeyHandler);
    }

    hideQuitKeyModal() {
        this.quitKeyModal.style.display = 'none';
        this.keyCaptureArea.classList.remove('capturing');
        
        // Remove key capture listener
        if (this.quitKeyModalKeyHandler) {
            document.removeEventListener('keydown', this.quitKeyModalKeyHandler);
            document.removeEventListener('keyup', this.quitKeyModalKeyHandler);
            this.quitKeyModalKeyHandler = null;
        }
    }

    handleQuitKeyCapture(event) {
        if (event.type === 'keydown') {
            event.preventDefault();
            
            // Check if it's a modifier-only key press
            const isModifierOnly = ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key);
            
            // Handle the ShiftRight bug in Keyboard Lock API where event.code is empty
            // This is a known issue where ShiftRight reports event.code as '' but event.key as 'Shift'
            let actualCode = event.code;
            if (event.code === '' && event.key === 'Shift') {
                actualCode = 'ShiftRight'; // Assume right shift when code is empty but key is Shift
            }
            
            // Use event.code to get the physical key instead of event.key for better display
            // event.code represents the physical key (e.g., 'KeyQ') while event.key represents the character ('œ' when Alt+Q)
            let displayKey = null;
            if (!isModifierOnly) {
                // Convert event.code to a readable key name
                displayKey = this.getDisplayKeyFromCode(actualCode, event.key);
            }
            
            // Capture the key combination
            this.tempQuitKeyCombo = {
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                key: displayKey,
                code: actualCode // Store the corrected code for accurate key detection
            };
            
            // Display the captured combination
            const parts = [];
            if (event.ctrlKey) parts.push('Ctrl');
            if (event.altKey) parts.push('Alt');
            if (event.shiftKey) parts.push('Shift');
            if (event.metaKey) parts.push('Meta');
            if (displayKey) parts.push(displayKey.toUpperCase());
            
            this.capturedKeys.textContent = parts.join(' + ') || 'None';
            
            // Enable confirm button if we have at least one modifier or a regular key
            this.confirmQuitKeyBtn.disabled = parts.length === 0;
        }
    }

    confirmQuitKeyChange() {
        if (this.tempQuitKeyCombo) {
            this.quitKeyCombo = this.tempQuitKeyCombo;
            this.updateQuitKeyDisplay();
            this.saveSettings();
            this.hideQuitKeyModal();
        }
    }

    resetQuitKeyToDefault() {
        this.quitKeyCombo = { ctrlKey: true, altKey: true, shiftKey: false, metaKey: false, key: null, code: null };
        this.updateQuitKeyDisplay();
        this.saveSettings();
        this.hideQuitKeyModal();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KVMClient();
});
