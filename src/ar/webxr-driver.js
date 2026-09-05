import * as THREE from 'three'

export class WebXRDriver {
  constructor(canvas, sceneManager, callbacks = {}) {
    this.canvas = canvas
    this.sceneManager = sceneManager
    this.callbacks = callbacks // { onSurfaceFound, onSurfaceLost, onTrackingStateChange, onError }

    this.xrSession = null
    this.xrRefSpace = null
    this.xrHitTestSource = null
    this.lastHitMatrix = new THREE.Matrix4()
    this.hasHit = false
    this.isSupported = false
  }

  async checkSupport() {
    if ('xr' in navigator) {
      try {
        this.isSupported = await navigator.xr.isSessionSupported('immersive-ar')
        return this.isSupported
      } catch (e) {
        console.warn('WebXR check error:', e)
        return false
      }
    }
    return false
  }

  async start(domOverlayRoot) {
    if (!('xr' in navigator)) {
      throw new Error('WebXR is not supported in this browser.')
    }

    const sessionInit = {
      requiredFeatures: ['hit-test', 'local-floor'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
      domOverlay: domOverlayRoot ? { root: domOverlayRoot } : undefined
    }

    try {
      this.xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit)
      this.sceneManager.renderer.xr.enabled = true
      await this.sceneManager.renderer.xr.setSession(this.xrSession)

      this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor')
      const viewerSpace = await this.xrSession.requestReferenceSpace('viewer')
      this.xrHitTestSource = await this.xrSession.requestHitTestSource({ space: viewerSpace })

      if (this.callbacks.onTrackingStateChange) {
        this.callbacks.onTrackingStateChange('SCANNING')
      }

      this.xrSession.addEventListener('end', () => {
        this.xrSession = null
        this.xrHitTestSource = null
        this.sceneManager.renderer.xr.enabled = false
        if (this.callbacks.onTrackingStateChange) {
          this.callbacks.onTrackingStateChange('ENDED')
        }
      })

      // Start custom render loop through WebXR
      this.sceneManager.renderer.setAnimationLoop((timestamp, frame) => {
        if (frame && this.xrHitTestSource) {
          const hitTestResults = frame.getHitTestResults(this.xrHitTestSource)
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0]
            const pose = hit.getPose(this.xrRefSpace)
            if (pose) {
              this.hasHit = true
              this.lastHitMatrix.fromArray(pose.transform.matrix)
              
              const position = new THREE.Vector3()
              const quaternion = new THREE.Quaternion()
              const scale = new THREE.Vector3()
              this.lastHitMatrix.decompose(position, quaternion, scale)

              if (this.callbacks.onSurfaceFound) {
                this.callbacks.onSurfaceFound(position, quaternion)
              }
            }
          } else {
            this.hasHit = false
            if (this.callbacks.onSurfaceLost) {
              this.callbacks.onSurfaceLost()
            }
          }
        }

        this.sceneManager.render()
      })

      return true
    } catch (err) {
      console.error('WebXR start failure:', err)
      throw err
    }
  }

  performHitTest() {
    if (!this.hasHit) return null
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    this.lastHitMatrix.decompose(position, quaternion, scale)
    return { position, quaternion }
  }

  stop() {
    if (this.xrSession) {
      this.xrSession.end()
    }
  }
}
