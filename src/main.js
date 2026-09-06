import './ui/style.css'
import { UIManager } from './ui/ui-manager.js'

class SnapARApp {
  constructor() {
    this.viewer = document.getElementById('ar-viewer')
    this.ui = new UIManager()

    // 100% Clean, Standard glTF 2.0 Binary Models (Zero non-standard extensions, Instant Decode on Android)
    this.models = {
      ironman: {
        id: 'ironman',
        label: 'Iron Man',
        icon: '🦾',
        url: '/models/ironman.glb',
        sizeTag: '506 KB',
        reduction: 'Mark Armor Suit',
        anim: 'Metallic PBR Finish',
        vram: '2.1 MB',
        sizeBytes: 506812,
        defaultClip: null,
        clips: []
      },
      antman: {
        id: 'antman',
        label: 'Ant-Man',
        icon: '🐜',
        url: '/models/antman.glb',
        sizeTag: '506 KB',
        reduction: 'Quantum PBR Suit',
        anim: 'Pym Particle Scalable',
        vram: '2.1 MB',
        sizeBytes: 506508,
        defaultClip: 'human',
        clips: [
          { name: 'ant', label: '🐜 Ant (0.08m)', scale: '0.08 0.08 0.08' },
          { name: 'human', label: '🧍 Human (1.8m)', scale: '1 1 1' },
          { name: 'giant', label: '🏢 Giant (3.5m)', scale: '1.95 1.95 1.95' }
        ]
      },
      hulk: {
        id: 'hulk',
        label: 'Hulk',
        icon: '🟢',
        url: '/models/hulk.glb',
        sizeTag: '605 KB',
        reduction: 'Titan Anatomy',
        anim: '2.4m AR Grounded',
        vram: '3.2 MB',
        sizeBytes: 605792,
        defaultClip: null,
        clips: []
      },
      supercar: {
        id: 'supercar',
        label: 'Supercar',
        icon: '🏎️',
        url: '/models/supercar.glb',
        sizeTag: '5.7 MB',
        reduction: 'Lamborghini Huracan',
        anim: 'Clearcoat & Glass',
        vram: '18.5 MB',
        sizeBytes: 5787032,
        defaultClip: null,
        clips: []
      },
      spiderman: {
        id: 'spiderman',
        label: 'Spider-Man',
        icon: '🕷️',
        url: '/models/spiderman.glb',
        sizeTag: '9.1 MB',
        reduction: 'Advanced Suit',
        anim: 'Hero Web Pose',
        vram: '24.0 MB',
        sizeBytes: 9135076,
        defaultClip: null,
        clips: []
      },
      robot: {
        id: 'robot',
        label: 'Robot',
        icon: '🤖',
        url: '/models/robot-expressive.glb',
        sizeTag: '453 KB',
        reduction: 'Lightweight Rigged',
        anim: '5 Clips (Dance/Wave)',
        vram: '2.5 MB',
        sizeBytes: 463988,
        defaultClip: 'Dance',
        clips: [
          { name: 'Dance', label: '🕺 Dance' },
          { name: 'Wave', label: '👋 Wave' },
          { name: 'Running', label: '🏃 Run' },
          { name: 'Walking', label: '🚶 Walk' },
          { name: 'Jump', label: '🦘 Jump' },
          { name: 'Idle', label: '🛑 Idle' }
        ]
      },
      fox: {
        id: 'fox',
        label: 'Fox',
        icon: '🦊',
        url: '/models/fox.glb',
        sizeTag: '159 KB',
        reduction: 'Ultra-Lite Animal',
        anim: '3 Clips (Run/Walk)',
        vram: '1.2 MB',
        sizeBytes: 162852,
        defaultClip: 'Run',
        clips: [
          { name: 'Run', label: '🏃 Run' },
          { name: 'Walk', label: '🚶 Walk' },
          { name: 'Survey', label: '🦊 Survey' }
        ]
      },
      astronaut: {
        id: 'astronaut',
        label: 'Astronaut',
        icon: '👨‍🚀',
        url: '/models/astronaut.glb',
        sizeTag: '2.8 MB',
        reduction: 'HQ Reference',
        anim: 'Static (2K PNG)',
        vram: '22.4 MB',
        sizeBytes: 2869044,
        clips: []
      },
      helmet: {
        id: 'helmet',
        label: 'Helmet',
        icon: '🪖',
        url: '/models/damaged-helmet.glb',
        sizeTag: '3.6 MB',
        reduction: 'HQ Reference',
        anim: 'Static (5x 2K PBR)',
        vram: '111.8 MB',
        sizeBytes: 3773916,
        clips: []
      }
    }

    this.currentModelId = 'ironman'
    this.currentClipName = null
    this.modelLoadStartTime = performance.now()
    this.measuredLoadTime = 25

    this.setupListeners()
    this.setupFPSMonitor()
    this.init()
  }

  getAbsoluteUrl(relativePath) {
    return new URL(relativePath, window.location.href).href
  }

  setupListeners() {
    this.ui.onSelectModelCallback = (modelId) => {
      this.selectModel(modelId)
    }

    this.ui.onSelectClipCallback = (clip) => {
      const clipName = typeof clip === 'string' ? clip : clip.name
      this.currentClipName = clipName
      if (this.viewer) {
        if (clip && clip.scale) {
          this.viewer.scale = clip.scale
        } else if (clipName) {
          this.viewer.animationName = clipName
        }
      }
    }

    this.ui.onActivateARCallback = () => {
      if (this.viewer) {
        this.viewer.activateAR()
      }
    }

    this.ui.onOpenLabCallback = () => {
      const benchList = Object.keys(this.models).map(k => {
        const m = this.models[k]
        return {
          name: m.label,
          sizeBytes: m.sizeBytes,
          sizeStr: m.sizeTag,
          reduction: m.reduction,
          anim: m.anim,
          vram: m.vram,
          loadTime: m.lastLoadTime || '<30 ms'
        }
      })

      this.ui.showBenchmarkModal(benchList, {
        loadTimeMs: this.measuredLoadTime,
        fps: this.currentFPS || 60
      })
    }

    // Model viewer lifecycle hooks
    if (this.viewer) {
      this.viewer.addEventListener('load', () => {
        this.measuredLoadTime = Math.round(performance.now() - this.modelLoadStartTime)
        const currentModel = this.models[this.currentModelId]
        if (currentModel) {
          currentModel.lastLoadTime = `${this.measuredLoadTime} ms`
        }
        this.ui.hideLoading()
        console.log(`Model ${this.currentModelId} loaded in ${this.measuredLoadTime}ms`)
      })

      this.viewer.addEventListener('progress', (e) => {
        const percent = Math.round(e.detail.totalProgress * 100)
        const currentModel = this.models[this.currentModelId]
        if (percent < 100) {
          this.ui.showLoading(currentModel ? currentModel.label : 'Model', percent)
        } else {
          this.ui.hideLoading()
        }
      })

      this.viewer.addEventListener('error', (err) => {
        console.error('Model viewer error:', err)
        this.ui.hideLoading()
      })
    }
  }

  init() {
    this.ui.renderLensCarousel(this.models, this.currentModelId)
    const initialModel = this.models[this.currentModelId]
    
    // Set canonical absolute URL for instant ARCore loading
    if (this.viewer) {
      this.viewer.src = this.getAbsoluteUrl(initialModel.url)
      this.viewer.animationName = initialModel.defaultClip || null
    }

    this.ui.renderAnimationClips(initialModel.clips, this.currentClipName)
  }

  selectModel(modelId) {
    if (this.currentModelId === modelId) return

    const m = this.models[modelId]
    if (!m) return

    this.currentModelId = modelId
    this.ui.setActiveLens(modelId)
    this.ui.showLoading(m.label, 0)
    this.modelLoadStartTime = performance.now()

    if (this.viewer) {
      // Reset scale to standard 1:1 on model switch
      this.viewer.scale = '1 1 1'

      // Use canonical absolute HTTPS URL so Android Scene Viewer downloads it instantly
      const absUrl = this.getAbsoluteUrl(m.url)
      this.viewer.src = absUrl
      
      if (m.defaultClip) {
        this.currentClipName = m.defaultClip
        const defaultClipObj = m.clips.find(c => c.name === m.defaultClip)
        if (defaultClipObj && defaultClipObj.scale) {
          this.viewer.scale = defaultClipObj.scale
        } else {
          this.viewer.animationName = m.defaultClip
        }
      } else {
        this.viewer.animationName = null
        this.currentClipName = null
      }
    }

    this.ui.renderAnimationClips(m.clips, this.currentClipName)
  }

  setupFPSMonitor() {
    let frameCount = 0
    let lastTime = performance.now()
    this.currentFPS = 60

    const monitor = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 500) {
        this.currentFPS = (frameCount * 1000) / (now - lastTime)
        this.ui.updateFPS(this.currentFPS)
        frameCount = 0
        lastTime = now
      }
      requestAnimationFrame(monitor)
    }
    requestAnimationFrame(monitor)
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SnapARApp()
})
