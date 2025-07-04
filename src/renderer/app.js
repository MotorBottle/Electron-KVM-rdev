class KVMClient {
    constructor() {
        this.videoConnected = false;
        this.hidConnected = false;
        this.mouseCaptured = false;
        this.mouseMode = 'absolute'; // 'absolute' or 'relative'
        this.currentStream = null;
        this.sidebarVisible = false;
        this.headerVisible = true;
        this.hideTimer = null;
        this.mouseButtonsPressed = 0; // Track which buttons are pressed
        this.reverseScroll = false; // Natural scrolling direction
        
        // Common resolutions (from HttpVideo.html)
        this.COMMON_RESOLUTIONS = [
            [1920, 1080], [1280, 720], [720, 480], [640, 480]
        ];
        
        this.initializeElements();
        this.bindEvents();
        this.setupGlobalKeyHandler();
        this.initializeVideo();
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
        this.testF3Btn = document.getElementById('testF3');
        this.testF11Btn = document.getElementById('testF11');
        this.resetKeysBtn = document.getElementById('resetKeys');
        this.resetDevicesBtn = document.getElementById('resetDevices');
        
        // Quick control buttons
        this.sendCADBtn = document.getElementById('sendCAD');
        this.virtualKeyboardBtn = document.getElementById('virtualKeyboard');
        
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
    }

    bindEvents() {
        // Video controls
        this.refreshDevicesBtn.addEventListener('click', () => this.refreshVideoDevices());
        this.startVideoBtn.addEventListener('click', () => this.startVideo());
        this.stopVideoBtn.addEventListener('click', () => this.stopVideo());
        
        // Device selection changes
        this.videoDevicesSelect.addEventListener('change', () => this.buildResolutionFPS());
        this.resolutionSelect.addEventListener('change', () => this.buildFPS());
        this.fpsSelect.addEventListener('change', () => this.startVideo());
        
        // HID controls
        this.connectHIDBtn.addEventListener('click', () => this.connectHID());
        this.disconnectHIDBtn.addEventListener('click', () => this.disconnectHID());
        
        // Mouse mode toggle
        this.mouseModeToggle.addEventListener('change', () => this.toggleMouseMode());
        
        // Scroll direction toggle
        this.scrollReverseToggle.addEventListener('change', () => this.toggleScrollDirection());
        
        // Test controls
        this.testMouseBtn.addEventListener('click', () => this.testMouse());
        this.testKeyboardBtn.addEventListener('click', () => this.testKeyboard());
        this.testF3Btn.addEventListener('click', () => this.testFunctionKey('F3'));
        this.testF11Btn.addEventListener('click', () => this.testFunctionKey('F11'));
        this.resetKeysBtn.addEventListener('click', () => this.resetKeys());
        this.resetDevicesBtn.addEventListener('click', () => this.resetDevices());
        
        // Quick control buttons
        this.sendCADBtn.addEventListener('click', () => this.sendCtrlAltDelete());
        this.virtualKeyboardBtn.addEventListener('click', () => this.showVirtualKeyboard());
        this.closeVirtualKeyboardBtn.addEventListener('click', () => this.hideVirtualKeyboard());
        this.sendCombinationBtn.addEventListener('click', () => this.sendCurrentCombination());
        this.clearCombinationBtn.addEventListener('click', () => this.clearCombination());
        
        // Video stream mouse/keyboard capture
        this.videoElement.addEventListener('click', (e) => {
            if (!this.mouseCaptured) {
                // Toggle capture mode
                this.toggleMouseCapture();
                e.preventDefault();
            }
            // Note: Mouse clicks when captured are handled by mousedown/mouseup events
        });
        
        // Global keyboard handler for control exit and key capture
        document.addEventListener('keydown', (e) => {
            // Debug logging for F3 and F11
            if (['F3', 'F11'].includes(e.key)) {
                console.log(`Document keydown: ${e.key}, captured: ${this.mouseCaptured}, hidConnected: ${this.hidConnected}`);
            }
            
            // New quit shortcut: Ctrl+Alt (instead of just Escape)
            if (e.ctrlKey && e.altKey && this.mouseCaptured) {
                this.releaseMouseCaptureWithKeyReset();
                e.preventDefault();
                return;
            }
            
            if (this.mouseCaptured && this.hidConnected) {
                // Prevent default for ALL keys during capture to catch system keys
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.handleKeyboardEvent(e);
            }
        });
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            if (!document.pointerLockElement && this.mouseCaptured && this.mouseMode === 'relative') {
                // Pointer lock was lost, release capture with key reset
                this.releaseMouseCaptureWithKeyReset();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                // Prevent default for ALL keys during capture
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.handleKeyboardEvent(e);
            }
        });
        
        // Mouse capture overlay events (for relative mode)
        this.mouseCaptureOverlay.addEventListener('mousemove', (e) => {
            if (this.mouseCaptured && this.hidConnected && this.mouseMode === 'relative') {
                this.handleMouseMove(e);
            }
        });
        
        // Video element mouse events (for absolute mode)
        this.videoElement.addEventListener('mousemove', (e) => {
            if (this.mouseCaptured && this.hidConnected && this.mouseMode === 'absolute') {
                // In absolute mode, send position updates on mouse move
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
                this.refreshVideoDevices();
            });
        }
        
        // Virtual keyboard event listeners
        this.setupVirtualKeyboard();
    }

    setupGlobalKeyHandler() {
        // Listen for global key events from main process (F3, F11, ESC)
        if (window.electronAPI && window.electronAPI.onGlobalKeyPressed) {
            window.electronAPI.onGlobalKeyPressed((event, data) => {
                console.log('Global key intercepted:', data);
                
                // Only handle these keys if mouse is captured and HID is connected
                if (this.mouseCaptured && this.hidConnected) {
                    // Create a synthetic keyboard event
                    const syntheticEvent = {
                        key: data.key,
                        code: data.code,
                        type: 'keydown',
                        metaKey: false,
                        ctrlKey: false,
                        altKey: false,
                        shiftKey: false,
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        stopImmediatePropagation: () => {}
                    };
                    
                    // Send the key event to HID
                    this.handleKeyboardEvent(syntheticEvent);
                    
                    // Also send keyup event after a short delay
                    setTimeout(() => {
                        const keyupEvent = { ...syntheticEvent, type: 'keyup' };
                        this.handleKeyboardEvent(keyupEvent);
                    }, 50);
                }
            });
        }
    }

    async initializeVideo() {
        // Check WebRTC support
        if (!navigator.mediaDevices?.enumerateDevices) {
            alert('Browser does not support WebRTC');
            return;
        }

        try {
            // Request initial permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            await this.refreshVideoDevices();
        } catch (error) {
            console.error('Camera permission required:', error);
            alert('Camera permission is required for video streaming');
        }

        await this.loadHIDDevices();
        this.updateMouseModeDisplay();
        this.updateScrollDirectionDisplay();
        
        // Start periodic HID device monitoring
        this.startHIDMonitoring();
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
                alert('No video devices detected');
                return;
            }

            // Auto-select first device if none selected
            if (!this.videoDevicesSelect.value && videoDevices.length > 0) {
                this.videoDevicesSelect.selectedIndex = 1; // Skip the "Select..." option
                await this.buildResolutionFPS();
            }
        } catch (error) {
            console.error('Error refreshing video devices:', error);
        }
    }

    async buildResolutionFPS() {
        this.resolutionSelect.innerHTML = '<option value="">Select Resolution</option>';
        this.fpsSelect.innerHTML = '<option value="">Select FPS</option>';
        
        const deviceId = this.videoDevicesSelect.value;
        if (!deviceId) return;

        try {
            // Get device capabilities
            const tempStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });
            
            const track = tempStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            tempStream.getTracks().forEach(t => t.stop());

            // Build resolution list
            const availableResolutions = capabilities.width?.max 
                ? this.COMMON_RESOLUTIONS.filter(r => 
                    r[0] <= capabilities.width.max && r[1] <= capabilities.height.max)
                : this.COMMON_RESOLUTIONS.slice();

            if (!availableResolutions.length) {
                availableResolutions.push([capabilities.width.max, capabilities.height.max]);
            }

            availableResolutions.forEach(resolution => {
                const option = document.createElement('option');
                const value = `${resolution[0]}x${resolution[1]}`;
                option.value = value;
                option.textContent = `${resolution[0]}×${resolution[1]}`;
                this.resolutionSelect.appendChild(option);
            });

            // Auto-select 1920x1080 if available, otherwise first option
            const preferred = this.resolutionSelect.querySelector('option[value="1920x1080"]');
            if (preferred) {
                this.resolutionSelect.value = '1920x1080';
            } else {
                this.resolutionSelect.selectedIndex = 1;
            }

            await this.buildFPS();
        } catch (error) {
            console.error('Error building resolution list:', error);
        }
    }

    async buildFPS() {
        this.fpsSelect.innerHTML = '<option value="">Select FPS</option>';
        
        const deviceId = this.videoDevicesSelect.value;
        const resolution = this.resolutionSelect.value;
        if (!deviceId || !resolution) return;

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

            // Build FPS list
            const maxFPS = capabilities.frameRate?.max || 60;
            const availableFPS = [120, 90, 60, 30, 24, 15].filter(fps => fps <= Math.round(maxFPS));
            
            if (!availableFPS.length) {
                availableFPS.push(Math.round(maxFPS));
            }

            availableFPS.forEach(fps => {
                const option = document.createElement('option');
                option.value = fps.toString();
                option.textContent = `${fps} fps`;
                this.fpsSelect.appendChild(option);
            });

            // Auto-select 60 fps if available, otherwise first option
            if (availableFPS.includes(60)) {
                this.fpsSelect.value = '60';
            } else {
                this.fpsSelect.selectedIndex = 1;
            }

            // Auto-start if this is initial setup
            if (this.fpsSelect.value && !this.videoConnected) {
                setTimeout(() => this.startVideo(), 100);
            }
        } catch (error) {
            console.error('Error building FPS list:', error);
        }
    }

    async startVideo() {
        const deviceId = this.videoDevicesSelect.value;
        const resolution = this.resolutionSelect.value;
        const fps = this.fpsSelect.value;

        if (!deviceId) {
            alert('Please select a video device');
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

            // Try with ideal FPS first
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: deviceId },
                        width: { exact: width },
                        height: { exact: height },
                        frameRate: { ideal: frameRate }
                    },
                    audio: false
                });
            } catch (error) {
                console.warn('Ideal FPS failed, trying without FPS constraint:', error);
                // Fallback without FPS constraint
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: deviceId },
                        width: { exact: width },
                        height: { exact: height }
                    },
                    audio: false
                });
            }

            this.videoElement.srcObject = stream;
            this.currentStream = stream;
            this.videoConnected = true;
            this.updateVideoStatus();
            this.updateVideoDisplay();
            
            this.startVideoBtn.disabled = true;
            this.stopVideoBtn.disabled = false;

            console.log(`Video started: ${width}x${height} @ ${fps}fps`);
        } catch (error) {
            console.error('Failed to start video stream:', error);
            alert(`Failed to start video stream: ${error.message}`);
        }
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
            
            let osrbotDevice = null;
            
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.path;
                option.textContent = `${device.manufacturer || 'Unknown'} ${device.product || 'Device'} (${device.path})`;
                this.hidDevicesSelect.appendChild(option);
                
                // Look for OSRBOT KVM device for auto-connection
                if (device.product && device.product.includes('OSRBOT') && device.product.includes('KVM')) {
                    osrbotDevice = device;
                }
            });
            
            // Auto-connect to OSRBOT KVM device if found and not already connected
            if (osrbotDevice && !this.hidConnected) {
                console.log('OSRBOT KVM device found, auto-connecting...', osrbotDevice);
                this.hidDevicesSelect.value = osrbotDevice.path;
                
                // Show user feedback about auto-connection attempt
                this.showAutoConnectNotification('OSRBOT KVM device detected, connecting...');
                
                try {
                    await this.connectHID();
                    if (this.hidConnected) {
                        this.showAutoConnectNotification('✅ OSRBOT KVM auto-connected successfully!', 'success');
                    }
                } catch (error) {
                    console.error('Auto-connect failed:', error);
                    this.showAutoConnectNotification('❌ OSRBOT KVM auto-connect failed', 'error');
                }
            }
        } catch (error) {
            console.error('Error loading HID devices:', error);
        }
    }

    async connectHID() {
        const devicePath = this.hidDevicesSelect.value;
        if (!devicePath) {
            alert('Please select a HID device');
            return;
        }

        try {
            const result = await window.electronAPI.connectHIDDevice(devicePath);
            if (result.success) {
                this.hidConnected = true;
                this.updateHIDStatus();
                
                this.connectHIDBtn.disabled = true;
                this.disconnectHIDBtn.disabled = false;
                
                // Stop monitoring when successfully connected
                this.stopHIDMonitoring();
            } else {
                alert(`Failed to connect HID device: ${result.error}`);
            }
        } catch (error) {
            console.error('Error connecting HID:', error);
            alert('Error connecting HID device');
        }
    }

    async disconnectHID() {
        try {
            await window.electronAPI.disconnectHIDDevice();
            this.hidConnected = false;
            this.updateHIDStatus();
            
            this.connectHIDBtn.disabled = false;
            this.disconnectHIDBtn.disabled = true;
            
            if (this.mouseCaptured) {
                this.releaseMouseCapture();
            }
            
            // Restart monitoring when disconnected to auto-reconnect if device comes back
            this.startHIDMonitoring();
        } catch (error) {
            console.error('Error disconnecting HID:', error);
        }
    }

    async testMouse() {
        if (!this.hidConnected) {
            alert('Please connect HID device first');
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
            alert('Please connect HID device first');
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
            alert('Please connect HID device first');
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
            alert('Please connect HID device first');
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

    toggleMouseCapture() {
        if (!this.hidConnected) {
            alert('Please connect HID device first for mouse/keyboard control');
            return;
        }

        if (!this.videoConnected) {
            alert('Please start video stream first');
            return;
        }

        if (this.mouseCaptured) {
            this.releaseMouseCapture();
        } else {
            this.captureMouseKeyboard();
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
        this.releaseMouseCapture();
    }

    releaseMouseCapture() {
        this.mouseCaptured = false;
        this.mouseCaptureOverlay.style.display = 'none';
        document.body.style.cursor = 'default';
        
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
                        y: deltaY
                    });
                } catch (error) {
                    console.error('Error sending mouse move:', error);
                }
            }
        } else if (this.mouseMode === 'absolute') {
            // Send absolute position for absolute mode
            const videoRect = this.videoElement.getBoundingClientRect();
            const x = Math.round((event.clientX - videoRect.left) / videoRect.width * 0x7FFF);
            const y = Math.round((event.clientY - videoRect.top) / videoRect.height * 0x7FFF);

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
        const x = Math.round((event.clientX - videoRect.left) / videoRect.width * 0x7FFF);
        const y = Math.round((event.clientY - videoRect.top) / videoRect.height * 0x7FFF);

        console.log('Absolute mouse click:', { x, y, clientX: event.clientX, clientY: event.clientY });

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
            await window.electronAPI.sendMouseEvent({
                type: event.type === 'mousedown' ? 'mousedown' : 'mouseup',
                button: event.button,
                buttonsPressed: this.mouseButtonsPressed
            });
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
            
            // Send wheel events for both X and Y scroll
            if (Math.abs(event.deltaY) > 0) {
                await window.electronAPI.sendMouseEvent({
                    type: 'wheel',
                    delta: event.deltaY * scrollMultiplier
                });
            }
            if (Math.abs(event.deltaX) > 0) {
                // Some systems support horizontal scrolling
                await window.electronAPI.sendMouseEvent({
                    type: 'wheel',
                    delta: event.deltaX * scrollMultiplier
                });
            }
        } catch (error) {
            console.error('Error sending mouse wheel:', error);
        }
    }

    async handleKeyboardEvent(event) {
        if (!this.hidConnected) return;

        const eventType = event.type === 'keydown' ? 'keydown' : 'keyup';
        
        // Log key events for debugging
        console.log('Key event:', {
            type: eventType,
            key: event.key,
            code: event.code,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey
        });
        
        try {
            await window.electronAPI.sendKeyboardEvent({
                type: eventType,
                key: event.key,
                code: event.code,
                metaKey: event.metaKey,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey
            });
        } catch (error) {
            console.error('Error sending keyboard event:', error);
        }
    }

    updateVideoStatus() {
        this.videoStatus.textContent = this.videoConnected ? 'Connected' : 'Disconnected';
        this.videoStatus.setAttribute('data-status', this.videoConnected ? 'connected' : 'disconnected');
    }

    updateHIDStatus() {
        this.hidStatus.textContent = this.hidConnected ? 'Connected' : 'Disconnected';
        this.hidStatus.setAttribute('data-status', this.hidConnected ? 'connected' : 'disconnected');
        
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
    }

    updateMouseModeDisplay() {
        if (this.mouseMode === 'absolute') {
            this.mouseModeLabel.textContent = 'Absolute';
            this.mouseModeDescription.textContent = 'Click to send absolute mouse positions';
            this.mouseModeToggle.checked = false;
        } else {
            this.mouseModeLabel.textContent = 'Relative';
            this.mouseModeDescription.textContent = 'Move mouse for relative positioning';
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
        
        this.showHeader();
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => this.hideHeader(), 2000);
    }

    handleFullscreenChange() {
        if (document.fullscreenElement) {
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

    captureMouseKeyboard() {
        this.mouseCaptured = true;
        
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
        
        if (this.mouseMode === 'relative') {
            // Relative mode: hide cursor and show overlay for capturing
            this.mouseCaptureOverlay.style.display = 'block';
            document.body.style.cursor = 'none';
            
            // Request pointer lock for relative mode
            this.videoElement.requestPointerLock();
        } else {
            // Absolute mode: keep cursor visible, just enable click handling
            this.mouseCaptureOverlay.style.display = 'none';
            document.body.style.cursor = 'default';
        }
    }

    toggleScrollDirection() {
        this.reverseScroll = this.scrollReverseToggle.checked;
        this.updateScrollDirectionDisplay();
    }

    updateScrollDirectionDisplay() {
        if (this.reverseScroll) {
            this.scrollDirectionLabel.textContent = 'Reversed';
            this.scrollDirectionDescription.textContent = 'Traditional scrolling (like Windows)';
            this.scrollReverseToggle.checked = true;
        } else {
            this.scrollDirectionLabel.textContent = 'Natural';
            this.scrollDirectionDescription.textContent = 'Natural scrolling (like macOS/mobile)';
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
            alert('Please connect HID device first');
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
            alert('Please connect HID device first');
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
        return codeToKey[code] || code;
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
            if (!this.hidConnected) {
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
                z-index: 1500;
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
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KVMClient();
});