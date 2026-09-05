import './ui/style.css'
import { CameraAREngine } from './ar/camera-ar-engine.js'
import { MachineBuilder } from './education/machine-builder.js'
import { ARTouchControls } from './interaction/ar-touch-controls.js'
import { EducationalUI } from './ui/educational-ui.js'
import { VOCATIONAL_MODULES } from './education/vocational-models.js'

/**
 * Bharat AR Skills - Main Application Controller
 * Ultra-fast, zero-download procedural 3D WebAR platform for Indian vocational education.
 */
class BharatAREngineApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas')
    this.video = document.getElementById('ar-camera-feed')

    this.builder = new MachineBuilder()
    this.arEngine = new CameraAREngine(this.canvas, this.video)
    
    this.currentMachineId = 'engine'
    this.currentMachineObject = null

    this.initControls()
    this.initUI()
    this.setupFPSMonitor()

    // Load initial 4-Stroke IC Engine
    this.loadMachine('engine')
  }

  initControls() {
    this.touchControls = new ARTouchControls(
      this.arEngine.machineContainer,
      this.canvas,
      (clientX, clientY) => {
        this.handleScreenTap(clientX, clientY)
      }
    )
  }

  initUI() {
    this.ui = new EducationalUI({
      onSelectMachine: (machineId) => {
        this.loadMachine(machineId)
      },
      onToggleAR: async () => {
        const res = await this.arEngine.toggleAR()
        this.ui.setARModeState(this.arEngine.isARMode)
        if (!res.success && res.error) {
          alert('Camera permission needed for AR passthrough. Continuing in 3D Studio Mode!')
        }
      },
      onExplodeChange: (factor) => {
        if (this.currentMachineObject) {
          this.builder.setExplodeFactor(this.currentMachineObject, factor)
        }
      },
      onTogglePlay: (isPlaying) => {
        this.arEngine.isRunningAnimation = isPlaying
      },
      onResetView: () => {
        this.touchControls.resetTransform()
        if (this.currentMachineObject) {
          this.builder.setExplodeFactor(this.currentMachineObject, 0)
        }
      },
      onSelectScale: (scaleFactor) => {
        this.touchControls.setScale(scaleFactor)
      },
      onSelectComponent: (componentId) => {
        if (this.currentMachineObject) {
          this.builder.highlightComponent(this.currentMachineObject, componentId)
        }
      }
    })
  }

  loadMachine(machineId) {
    this.currentMachineId = machineId
    this.currentMachineObject = this.builder.buildMachine(machineId)

    const meta = VOCATIONAL_MODULES[machineId]
    const defaultScale = meta ? meta.scaleDefault || 1.0 : 1.0

    this.arEngine.setMachine(this.currentMachineObject, defaultScale)
    this.touchControls.resetTransform()
    this.touchControls.setScale(defaultScale)
  }

  handleScreenTap(clientX, clientY) {
    const componentId = this.arEngine.getIntersectedComponent(clientX, clientY)
    if (componentId) {
      this.ui.showInspection(componentId)
      this.builder.highlightComponent(this.currentMachineObject, componentId)
    } else {
      this.ui.hideInspection()
      this.builder.highlightComponent(this.currentMachineObject, null)
    }
  }

  setupFPSMonitor() {
    let frameCount = 0
    let lastTime = performance.now()

    const monitor = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 500) {
        const fps = (frameCount * 1000) / (now - lastTime)
        if (this.ui) {
          this.ui.updateFPS(fps)
        }
        frameCount = 0
        lastTime = now
      }
      requestAnimationFrame(monitor)
    }
    requestAnimationFrame(monitor)
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new BharatAREngineApp()
})
