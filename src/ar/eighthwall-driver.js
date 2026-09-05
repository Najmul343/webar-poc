import * as THREE from 'three'

export class EighthWallDriver {
  constructor(canvas, sceneManager, callbacks = {}) {
    this.canvas = canvas
    this.sceneManager = sceneManager
    this.callbacks = callbacks // { onSurfaceFound, onSurfaceLost, onTrackingStateChange, onError }
    this.isRunning = false
    this.lastHitPosition = null
  }

  isAvailable() {
    return typeof window !== 'undefined' && (!!window.XR8 || !!document.querySelector('script[src*="xr.js"]'))
  }

  async init() {
    return new Promise((resolve, reject) => {
      const startEngine = () => {
        if (!window.XR8) {
          reject(new Error('8th Wall XR8 engine not found on window.'))
          return
        }

        try {
          // Custom pipeline module to bridge XR8 with our SceneManager
          const customModule = {
            name: 'webar-poc-module',
            onStart: ({ canvasWidth, canvasHeight }) => {
              this.isRunning = true
              if (this.callbacks.onTrackingStateChange) {
                this.callbacks.onTrackingStateChange('SCANNING')
              }
              resolve(true)
            },
            onUpdate: ({ processGpuResult }) => {
              if (!this.isRunning) return

              // Perform center-screen hit-test for surface detection
              const results = window.XR8.XrController.hitTest(0.5, 0.5, ['SURFACE', 'FEATURE_POINTS'])

              if (results && results.length > 0) {
                const hit = results[0]
                const position = new THREE.Vector3(hit.position.x, hit.position.y, hit.position.z)
                const quaternion = new THREE.Quaternion(hit.rotation.x, hit.rotation.y, hit.rotation.z, hit.rotation.w)
                this.lastHitPosition = { position, quaternion }

                if (this.callbacks.onSurfaceFound) {
                  this.callbacks.onSurfaceFound(position, quaternion)
                }
              } else {
                this.lastHitPosition = null
                if (this.callbacks.onSurfaceLost) {
                  this.callbacks.onSurfaceLost()
                }
              }
            },
            onCameraStatusChange: (status) => {
              if (status.hasResult) {
                if (this.callbacks.onTrackingStateChange) {
                  this.callbacks.onTrackingStateChange('SCANNING')
                }
              }
            },
            onException: (error) => {
              console.error('8th Wall Exception:', error)
              if (this.callbacks.onError) {
                this.callbacks.onError(error)
              }
            }
          }

          // Register pipeline modules
          const modules = [
            window.XR8.GlTextureRenderer.pipelineModule(),
            window.XR8.Threejs.pipelineModule(),
            window.XR8.XrController.pipelineModule(),
            customModule
          ]

          window.XR8.addCameraPipelineModules(modules)

          // Run engine on canvas
          window.XR8.run({
            canvas: this.canvas,
            allowedDevices: window.XR8.XrConfig.device().ANY
          })
        } catch (err) {
          console.error('Failed to start 8th Wall:', err)
          reject(err)
        }
      }

      if (window.XR8) {
        startEngine()
      } else {
        window.addEventListener('xrloaded', startEngine, { once: true })
        // Fallback timeout if engine script failed
        setTimeout(() => {
          if (!window.XR8) {
            reject(new Error('Timeout waiting for 8th Wall XR8 engine script.'))
          }
        }, 5000)
      }
    })
  }

  performHitTest(screenX, screenY) {
    if (!window.XR8 || !this.isRunning) return null
    const normX = screenX / window.innerWidth
    const normY = screenY / window.innerHeight
    const results = window.XR8.XrController.hitTest(normX, normY, ['SURFACE', 'FEATURE_POINTS'])
    if (results && results.length > 0) {
      const hit = results[0]
      return {
        position: new THREE.Vector3(hit.position.x, hit.position.y, hit.position.z),
        quaternion: new THREE.Quaternion(hit.rotation.x, hit.rotation.y, hit.rotation.z, hit.rotation.w)
      }
    }
    return this.lastHitPosition
  }

  recenter() {
    if (window.XR8 && window.XR8.XrController) {
      window.XR8.XrController.recenter()
    }
  }

  stop() {
    if (window.XR8 && this.isRunning) {
      window.XR8.stop()
      this.isRunning = false
    }
  }
}
