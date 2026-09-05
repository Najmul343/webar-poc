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

    // Comprehensive Asset Registry (Lightweight + High-Quality References)
    this.models = {
      human: {
        id: 'human',
        label: 'Human',
        icon: '🧍',
        url: '/models/human-opt.glb',
        height: 0.7,
        sizeTag: '104 KB',
        format: 'Meshopt + WebP',
        anim: 'Skeletal Walk',
        sizeBytes: 106836,
        vramEstimate: '2.8 MB'
      },
      fox: {
        id: 'fox',
        label: 'Fox',
        icon: '🦊',
        url: '/models/fox-opt.glb',
        height: 0.45,
        sizeTag: '89 KB',
        format: 'Meshopt',
        anim: 'Walk/Run/Survey',
        sizeBytes: 91160,
        vramEstimate: '1.2 MB'
      },
      robot: {
        id: 'robot',
        label: 'Robot',
        icon: '🤖',
        url: '/models/robot-opt.glb',
        height: 0.65,
        sizeTag: '179 KB',
        format: 'Meshopt',
        anim: 'Dance/Walk/Wave',
        sizeBytes: 183320,
        vramEstimate: '2.1 MB'
      },
      vehicle: {
        id: 'vehicle',
        label: 'Car',
        icon: '🚗',
        url: '/models/vehicle-opt.glb',
        height: 0.35,
        sizeTag: '841 KB',
        format: 'Meshopt + WebP',
        anim: 'PBR Clearcoat',
        sizeBytes: 861124,
        vramEstimate: '8.4 MB'
      },
      plant: {
        id: 'plant',
        label: 'Plant',
        icon: '🌿',
        url: '/models/plant-opt.glb',
        height: 0.6,
        sizeTag: '1.2 MB',
        format: 'Meshopt + WebP',
        anim: 'Swaying Foliage',
        sizeBytes: 1299224,
        vramEstimate: '14.2 MB'
      },
      astronaut: {
        id: 'astronaut',
        label: 'Astronaut (HQ)',
        icon: '👨‍🚀',
        url: '/models/astronaut.glb',
        height: 0.65,
        sizeTag: '2.7 MB',
        format: 'Uncompressed GLB',
        anim: 'None (2K PNG)',
        sizeBytes: 2869044,
        vramEstimate: '22.4 MB'
      },
      helmet: {
        id: 'helmet',
        label: 'Helmet (HQ)',
        icon: '🪖',
        url: '/models/damaged-helmet.glb',
        height: 0.35,
        sizeTag: '3.6 MB',
        format: 'Uncompressed GLB',
        anim: 'None (5x 2K JPEG)',
        sizeBytes: 3773916,
        vramEstimate: '111.8 MB'
      }
    }

    this.currentModelId = 'fox'

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
      this.ui.setStatus('PLACED', 'Model orientation and scale reset')
    }

    this.ui.onRemoveCallback = () => {
      this.scene.removeObject()
      this.ui.setStatus('SCANNING', 'Object removed. Move phone to scan floor')
    }

    this.ui.onSelectModelCallback = async (modelId) => {
      if (this.currentModelId === modelId) return
      await this.switchModel(modelId)
    }

    this.ui.onNextAnimCallback = () => {
      const nextName = this.scene.nextAnimation()
      if (nextName) {
        this.ui.setAnimButton(nextName)
      }
    }

    this.ui.onOpenBenchCallback = () => {
      this.openBenchmark()
    }
  }

  async init() {
    this.ui.renderModelList(this.models, this.currentModelId)

    this.ui.showModal(
      'WebAR Asset Optimization Lab',
      'Experience high-framerate real-time 3D in physical space with lightweight assets (under 100 KB) and compare against uncompressed HQ models.',
      false,
      'Start AR Camera',
      async () => {
        await this.startARSession()
      }
    )
  }

  async startARSession() {
    this.ui.showModal('Starting Camera...', 'Initializing AR environment tracking...', false)
    this.ui.setStatus('STARTING_CAMERA')

    try {
      const overlayRoot = document.getElementById('ui-overlay')
      const driver = await this.ar.start(overlayRoot)
      console.log(`AR started with driver: ${driver}`)

      this.ui.hideModal()
      this.ui.setStatus('SCANNING', 'Move your phone slowly to scan the environment')

      // Lazy load initial lightweight model after camera is already running smoothly
      this.switchModel(this.currentModelId)

      // Start non-WebXR render loop
      if (driver !== 'webxr') {
        const loop = () => {
          this.scene.render()
          this.ui.updateFPS(this.scene.currentFPS)
          requestAnimationFrame(loop)
        }
        loop()
      } else {
        // WebXR render loop hook
        const origRender = this.scene.render.bind(this.scene)
        this.scene.render = () => {
          origRender()
          this.ui.updateFPS(this.scene.currentFPS)
        }
      }
    } catch (err) {
      console.error('Failed to start AR:', err)
      this.handleError(err)
    }
  }

  async switchModel(modelId) {
    const config = this.models[modelId]
    if (!config) return

    this.currentModelId = modelId
    this.ui.setActiveModelChip(modelId)
    this.ui.showModelLoading(config.label, 0)

    try {
      const startTime = performance.now()
      const res = await this.scene.setModel(config.url, config.height, (percent) => {
        this.ui.showModelLoading(config.label, percent)
      })

      const loadTime = Math.round(performance.now() - startTime)
      config.lastLoadTime = `${loadTime} ms`

      this.ui.hideModelLoading()

      // Update animation button
      if (res.animations && res.animations.length > 0) {
        this.ui.setAnimButton(res.animations[0])
      } else {
        this.ui.setAnimButton(null)
      }

      console.log(`Switched to ${config.label} in ${loadTime}ms. Triangles: ${res.metrics.triangles}, Draw calls: ${res.metrics.drawCalls}`)
    } catch (err) {
      console.error('Model switch failed:', err)
      this.ui.hideModelLoading()
    }
  }

  openBenchmark() {
    const benchmarkList = Object.keys(this.models).map(key => {
      const m = this.models[key]
      return {
        name: m.label,
        sizeBytes: m.sizeBytes,
        sizeStr: m.sizeTag,
        format: m.format,
        anim: m.anim,
        vramEstimate: m.vramEstimate,
        loadTime: m.lastLoadTime || 'Cached (<10ms)'
      }
    })

    this.ui.showBenchmarkModal(benchmarkList, {
      ...this.scene.metrics,
      fps: this.scene.currentFPS
    })
  }

  handleTap(screenX, screenY) {
    if (!this.scene.placed) {
      const hit = this.ar.performHitTest(screenX, screenY)
      if (hit && hit.position) {
        this.scene.placeObject(hit.position, hit.quaternion)
        this.ui.setStatus('PLACED', 'Object anchored! Walk around it • 1-finger rotate • 2-finger pinch')
      } else if (this.scene.reticle.visible) {
        this.scene.placeObject(this.scene.reticle.position, this.scene.reticle.quaternion)
        this.ui.setStatus('PLACED', 'Object anchored! Walk around it • 1-finger rotate • 2-finger pinch')
      }
    } else {
      const hit = this.ar.performHitTest(screenX, screenY)
      if (hit && hit.position) {
        this.scene.placeObject(hit.position, hit.quaternion)
        this.ui.setStatus('PLACED', 'Object repositioned')
      }
    }
  }

  handleError(err) {
    let title = 'AR Camera Access'
    let desc = 'This device or browser could not initialize augmented reality.'

    const msg = (err && err.message) ? err.message.toLowerCase() : ''
    if (msg.includes('permission') || msg.includes('notallowederror')) {
      title = 'Camera Permission Required'
      desc = 'Camera access was blocked. Please tap the lock/settings icon in the Chrome URL bar and allow Camera access, then reload.'
    }

    this.ui.showModal(title, desc, true, 'Retry', () => {
      window.location.reload()
    })
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WebARApp()
})
