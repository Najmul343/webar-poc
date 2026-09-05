import './ui/style.css'
import { UIManager } from './ui/ui-manager.js'

class SnapARApp {
  constructor() {
    this.viewer = document.getElementById('ar-viewer')
    this.ui = new UIManager()

    this.models = {
      robot: {
        id: 'robot',
        label: 'Robot',
        icon: '🤖',
        url: '/models/robot-opt.glb',
        sizeTag: '179 KB',
        reduction: '-61.4%',
        anim: '5 Clips (Dance/Wave)',
        vram: '2.1 MB',
        sizeBytes: 183320,
        defaultClip: 'Dance',
        clips: [
          { name: 'Dance', label: '🕺 Dance' },
          { name: 'Wave', label: '👋 Wave' },
          { name: 'Walking', label: '🚶 Walk' },
          { name: 'Jump', label: '🦘 Jump' },
          { name: 'Idle', label: '🛑 Idle' }
        ]
      },
      fox: {
        id: 'fox',
        label: 'Fox',
        icon: '🦊',
        url: '/models/fox-opt.glb',
        sizeTag: '89 KB',
        reduction: '-45.3%',
        anim: '3 Clips (Run/Walk)',
        vram: '1.2 MB',
        sizeBytes: 91160,
        defaultClip: 'Run',
        clips: [
          { name: 'Run', label: '🏃 Run' },
          { name: 'Walk', label: '🚶 Walk' },
          { name: 'Survey', label: '🦊 Survey' }
        ]
      },
      human: {
        id: 'human',
        label: 'Human',
        icon: '🧍',
        url: '/models/human-opt.glb',
        sizeTag: '104 KB',
        reduction: '-76.2%',
        anim: 'Skeletal Walk',
        vram: '2.8 MB',
        sizeBytes: 106836,
        defaultClip: 'Walk',
        clips: [
          { name: 'Walk', label: '🚶 Walk' }
        ]
      },
      astronaut: {
        id: 'astronaut',
        label: 'Astronaut',
        icon: '👨‍🚀',
        url: '/models/astronaut.glb',
        sizeTag: '2.7 MB',
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
      },
      vehicle: {
        id: 'vehicle',
        label: 'Car',
        icon: '🚗',
        url: '/models/vehicle-opt.glb',
        sizeTag: '841 KB',
        reduction: '-84.5%',
        anim: 'PBR Clearcoat',
        vram: '8.4 MB',
        sizeBytes: 861124,
        clips: []
      },
      plant: {
        id: 'plant',
        label: 'Plant',
        icon: '🌿',
        url: '/models/plant-opt.glb',
        sizeTag: '1.2 MB',
        reduction: '-78.5%',
        anim: 'Swaying Foliage',
        vram: '14.2 MB',
        sizeBytes: 1299224,
        clips: []
      }
    }

    this.currentModelId = 'robot'
    this.currentClipName = 'Dance'
    this.modelLoadStartTime = performance.now()
    this.measuredLoadTime = 22

    this.setupListeners()
    this.setupFPSMonitor()
    this.init()
  }

  setupListeners() {
    this.ui.onSelectModelCallback = (modelId) => {
      this.selectModel(modelId)
    }

    this.ui.onSelectClipCallback = (clipName) => {
      this.currentClipName = clipName
      if (this.viewer) {
        this.viewer.animationName = clipName
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
          loadTime: m.lastLoadTime || 'Instant (<35ms)'
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
      })

      this.viewer.addEventListener('progress', (e) => {
        const percent = Math.round(e.detail.totalProgress * 100)
        const currentModel = this.models[this.currentModelId]
        this.ui.showLoading(currentModel ? currentModel.label : 'Model', percent)
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
      this.viewer.src = m.url
      if (m.defaultClip) {
        this.currentClipName = m.defaultClip
        this.viewer.animationName = m.defaultClip
      } else {
        this.viewer.animationName = null
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
