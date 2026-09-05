import './ui/style.css'
import { UIManager } from './ui/ui-manager.js'
import { SceneManager } from './scene/scene-manager.js'
import { ARManager } from './ar/ar-manager.js'
import { GestureHandler } from './interaction/gesture-handler.js'

class WebARApp {
  constructor() {
    this.canvas = document.getElementById('camera-canvas')
    this.ui = new UIManager()
    this.scene = new SceneManager(this.canvas)

    this.currentModelName = 'astronaut'
    this.models = {
      astronaut: { url: '/models/model.glb', height: 0.65 },
      helmet: { url: '/models/damaged-helmet.glb', height: 0.35 }
    }

    this.ar = new ARManager(this.canvas, this.scene, {
      onSurfaceFound: (pos, quat) => {
        if (!this.scene.placed) {
          this.ui.setStatus('SURFACE_FOUND', 'Tap anywhere on the floor to place the 3D model')
        }
      },
      onSurfaceLost: () => {
        if (!this.scene.placed) {
          this.ui.setStatus('SCANNING', 'Move your phone slowly to scan the environment')
        }
      },
      onTrackingStateChange: (state) => {
        if (state === 'SCANNING') {
          this.ui.setStatus('SCANNING', 'Move your phone slowly to scan the environment')
        }
      },
      onError: (err) => {
        console.error('AR error:', err)
        this.handleError(err)
      }
    })

    this.gestures = new GestureHandler(window, this.scene, {
      onTap: (x, y) => this.handleTap(x, y)
    })

    this.setupUIEvents()
    this.init()
  }

  setupUIEvents() {
    this.ui.onResetCallback = () => {
      this.scene.resetPosition()
      this.ui.setStatus('PLACED', 'Position and scale reset')
    }

    this.ui.onRemoveCallback = () => {
      this.scene.removeObject()
      this.ui.setStatus('SCANNING', 'Object removed. Move phone to scan surface')
    }

    this.ui.onSwitchModelCallback = async () => {
      this.currentModelName = this.currentModelName === 'astronaut' ? 'helmet' : 'astronaut'
      this.ui.showModelSwitchLabel(this.currentModelName)
      
      const config = this.models[this.currentModelName]
      await this.scene.setModel(config.url, config.height)
    }
  }

  async init() {
    try {
      this.ui.showModal(
        'WebAR Proof of Concept',
        'Experience interactive 3D in the real world on your phone. Tap below to start the camera.',
        false,
        'Start AR Experience',
        async () => {
          await this.startARSession()
        }
      )

      // Preload 3D model while waiting for user interaction
      console.log('Preloading 3D models...')
      const startLoad = performance.now()
      await this.scene.setModel(this.models.astronaut.url, this.models.astronaut.height)
      console.log(`Model preloaded in ${(performance.now() - startLoad).toFixed(0)}ms`)
      this.ui.showModelSwitchLabel('astronaut')

    } catch (err) {
      console.error('Initialization error:', err)
      this.handleError(err)
    }
  }

  async startARSession() {
    this.ui.showModal('Starting Camera...', 'Requesting camera and motion sensors...', false)
    this.ui.setStatus('STARTING_CAMERA')

    try {
      const overlayRoot = document.getElementById('ui-overlay')
      const driver = await this.ar.start(overlayRoot)
      console.log(`AR started successfully using driver: ${driver}`)
      
      this.ui.hideModal()
      this.ui.setStatus('SCANNING', 'Move your phone slowly to scan the environment')

      // Fallback render loop for 8th Wall / Non-WebXR
      if (driver !== 'webxr') {
        const renderLoop = () => {
          this.scene.render()
          requestAnimationFrame(renderLoop)
        }
        renderLoop()
      }
    } catch (err) {
      console.error('Failed to start AR session:', err)
      this.handleError(err)
    }
  }

  handleTap(screenX, screenY) {
    // If not placed, attempt to place object at detected surface
    if (!this.scene.placed) {
      const hit = this.ar.performHitTest(screenX, screenY)
      if (hit && hit.position) {
        this.scene.placeObject(hit.position, hit.quaternion)
        this.ui.setStatus('PLACED', 'Object anchored! Walk around it • 1-finger rotate • 2-finger pinch')
      } else {
        // If reticle is currently visible, place at reticle position
        if (this.scene.reticle.visible) {
          this.scene.placeObject(this.scene.reticle.position, this.scene.reticle.quaternion)
          this.ui.setStatus('PLACED', 'Object anchored! Walk around it • 1-finger rotate • 2-finger pinch')
        }
      }
    } else {
      // If already placed and user taps elsewhere on detected surface, reposition
      const hit = this.ar.performHitTest(screenX, screenY)
      if (hit && hit.position) {
        this.scene.placeObject(hit.position, hit.quaternion)
        this.ui.setStatus('PLACED', 'Object repositioned')
      }
    }
  }

  handleError(err) {
    let title = 'AR Not Available'
    let desc = 'This device or browser could not initialize augmented reality.'

    const msg = (err && err.message) ? err.message.toLowerCase() : ''

    if (msg.includes('permission') || msg.includes('notallowederror')) {
      title = 'Camera Permission Required'
      desc = 'Camera access was blocked. Please tap the lock/settings icon in the Chrome URL bar and allow Camera access, then reload.'
    } else if (msg.includes('not supported') || msg.includes('webxr')) {
      title = 'WebAR Setup'
      desc = 'For the best experience, open this HTTPS link in Chrome on an ARCore-compatible Android phone.'
    }

    this.ui.showModal(title, desc, true, 'Retry', () => {
      window.location.reload()
    })
  }
}

// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new WebARApp()
})
