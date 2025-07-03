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
        
        // Common resolutions (from HttpVideo.html)
        this.COMMON_RESOLUTIONS = [
            [1920, 1080], [1280, 720], [720, 480], [640, 480]
        ];
        
        this.initializeElements();
        this.bindEvents();
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
        this.resetDevicesBtn = document.getElementById('resetDevices');
        
        // Mouse mode controls
        this.mouseModeToggle = document.getElementById('mouseModeToggle');
        this.mouseModeLabel = document.getElementById('mouseModeLabel');
        this.mouseModeDescription = document.getElementById('mouseModeDescription');
        
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
        
        // Test controls
        this.testMouseBtn.addEventListener('click', () => this.testMouse());
        this.testKeyboardBtn.addEventListener('click', () => this.testKeyboard());
        this.resetDevicesBtn.addEventListener('click', () => this.resetDevices());
        
        // Video stream mouse/keyboard capture
        this.videoElement.addEventListener('click', () => this.toggleMouseCapture());
        
        // Global keyboard handler for escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mouseCaptured) {
                this.releaseMouseCapture();
            }
            
            if (this.mouseCaptured && this.hidConnected) {
                this.handleKeyboardEvent(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleKeyboardEvent(e);
            }
        });
        
        // Mouse capture overlay events
        this.mouseCaptureOverlay.addEventListener('mousemove', (e) => {
            if (this.mouseCaptured && this.hidConnected) {
                this.handleMouseMove(e);
            }
        });
        
        this.mouseCaptureOverlay.addEventListener('click', (e) => {
            if (this.mouseCaptured && this.hidConnected && this.mouseMode === 'absolute') {
                this.handleMouseClick(e);
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
            
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.path;
                option.textContent = `${device.manufacturer || 'Unknown'} ${device.product || 'Device'} (${device.path})`;
                this.hidDevicesSelect.appendChild(option);
            });
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

    captureMouseKeyboard() {
        this.mouseCaptured = true;
        this.mouseCaptureOverlay.style.display = 'block';
        document.body.style.cursor = 'none';
    }

    releaseMouseCapture() {
        this.mouseCaptured = false;
        this.mouseCaptureOverlay.style.display = 'none';
        document.body.style.cursor = 'default';
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
        }
    }

    async handleMouseClick(event) {
        if (!this.hidConnected || this.mouseMode !== 'absolute') return;

        const rect = this.mouseCaptureOverlay.getBoundingClientRect();
        const x = Math.round((event.clientX - rect.left) / rect.width * 65535);
        const y = Math.round((event.clientY - rect.top) / rect.height * 65535);

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

        const eventType = event.type === 'mousedown' ? 'mousedown' : 'mouseup';
        
        try {
            await window.electronAPI.sendMouseEvent({
                type: eventType,
                button: event.button
            });
        } catch (error) {
            console.error('Error sending mouse event:', error);
        }
        
        event.preventDefault();
    }

    async handleMouseWheel(event) {
        if (!this.hidConnected) return;

        try {
            await window.electronAPI.sendMouseEvent({
                type: 'wheel',
                delta: event.deltaY
            });
        } catch (error) {
            console.error('Error sending mouse wheel:', error);
        }
    }

    async handleKeyboardEvent(event) {
        if (!this.hidConnected) return;

        const eventType = event.type === 'keydown' ? 'keydown' : 'keyup';
        
        try {
            await window.electronAPI.sendKeyboardEvent({
                type: eventType,
                key: event.key
            });
        } catch (error) {
            console.error('Error sending keyboard event:', error);
        }
        
        event.preventDefault();
    }

    updateVideoStatus() {
        this.videoStatus.textContent = this.videoConnected ? 'Connected' : 'Disconnected';
        this.videoStatus.setAttribute('data-status', this.videoConnected ? 'connected' : 'disconnected');
    }

    updateHIDStatus() {
        this.hidStatus.textContent = this.hidConnected ? 'Connected' : 'Disconnected';
        this.hidStatus.setAttribute('data-status', this.hidConnected ? 'connected' : 'disconnected');
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
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KVMClient();
});