import { EighthWallDriver } from './eighthwall-driver.js'
import { WebXRDriver } from './webxr-driver.js'

export class ARManager {
  constructor(canvas, sceneManager, callbacks = {}) {
    this.canvas = canvas
    this.sceneManager = sceneManager
    this.callbacks = callbacks

    this.activeDriver = null
    this.driverType = null // '8thwall' | 'webxr' | 'none'

    this.eighthWall = new EighthWallDriver(canvas, sceneManager, {
      onSurfaceFound: (pos, quat) => this.handleSurfaceFound(pos, quat),
      onSurfaceLost: () => this.handleSurfaceLost(),
      onTrackingStateChange: (state) => this.handleTrackingStateChange(state),
      onError: (err) => this.handleError(err)
    })

    this.webxr = new WebXRDriver(canvas, sceneManager, {
      onSurfaceFound: (pos, quat) => this.handleSurfaceFound(pos, quat),
      onSurfaceLost: () => this.handleSurfaceLost(),
      onTrackingStateChange: (state) => this.handleTrackingStateChange(state),
      onError: (err) => this.handleError(err)
    })
  }

  handleSurfaceFound(position, quaternion) {
    this.sceneManager.updateReticle(position, quaternion)
    if (this.callbacks.onSurfaceFound) {
      this.callbacks.onSurfaceFound(position, quaternion)
    }
  }

  handleSurfaceLost() {
    this.sceneManager.updateReticle(null, null)
    if (this.callbacks.onSurfaceLost) {
      this.callbacks.onSurfaceLost()
    }
  }

  handleTrackingStateChange(state) {
    if (this.callbacks.onTrackingStateChange) {
      this.callbacks.onTrackingStateChange(state)
    }
  }

  handleError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error)
    }
  }

  async start(domOverlayRoot) {
    // 1. Check if native WebXR (ARCore) is available on Android Chrome
    const webxrSupported = await this.webxr.checkSupport()

    // 2. Check if 8th Wall engine is loaded
    const eighthWallAvailable = this.eighthWall.isAvailable()

    // On Android Chrome, WebXR is native hardware-accelerated AR.
    // If WebXR is supported, we can run WebXR directly.
    // If not, or if 8th Wall is loaded, we run 8th Wall.
    if (webxrSupported) {
      try {
        console.log('Starting WebXR AR Driver...')
        await this.webxr.start(domOverlayRoot)
        this.activeDriver = this.webxr
        this.driverType = 'webxr'
        return 'webxr'
      } catch (err) {
        console.warn('WebXR session failed, trying 8th Wall fallback...', err)
      }
    }

    if (eighthWallAvailable) {
      try {
        console.log('Starting 8th Wall SLAM Driver...')
        await this.eighthWall.init()
        this.activeDriver = this.eighthWall
        this.driverType = '8thwall'
        return '8thwall'
      } catch (err) {
        console.error('8th Wall start failed:', err)
        throw err
      }
    }

    // If neither is directly startable without permission check
    throw new Error('Neither WebXR nor 8th Wall AR is supported on this browser/device.')
  }

  performHitTest(screenX, screenY) {
    if (this.activeDriver) {
      return this.activeDriver.performHitTest(screenX, screenY)
    }
    return null
  }

  recenter() {
    if (this.driverType === '8thwall') {
      this.eighthWall.recenter()
    }
    this.sceneManager.resetPosition()
  }
}
