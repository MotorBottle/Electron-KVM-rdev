// Video server is no longer needed - we'll use WebRTC directly in renderer
class VideoServer {
  constructor() {
    // Minimal stub for compatibility
  }

  async getVideoDevices() {
    // This will be handled in renderer with navigator.mediaDevices
    return [];
  }

  startStream(deviceId) {
    // This will be handled in renderer with WebRTC
    return { success: true };
  }

  stopStream() {
    return { success: true };
  }

  getStreamUrl() {
    return null;
  }

  stop() {
    // Nothing to stop
  }
}

module.exports = VideoServer;