import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { createShadowPlane } from './shadow-plane.js'

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    )
    this.scene.add(this.camera)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Setup Loaders with Meshopt and DRACO support
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/external/draco/')

    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.setDRACOLoader(dracoLoader)
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder)

    this.modelCache = {}
    this.currentModel = null
    this.mixer = null
    this.actions = []
    this.currentActionIndex = 0
    this.clock = new THREE.Clock()

    // FPS & Performance tracking
    this.frameCount = 0
    this.lastTime = performance.now()
    this.currentFPS = 60
    this.metrics = {
      fps: 60,
      triangles: 0,
      vertices: 0,
      drawCalls: 0,
      loadTimeMs: 0
    }

    this.setupLights()
    this.setupReticle()
    this.setupAnchorGroup()

    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 1.3)
    hemiLight.position.set(0, 5, 0)
    this.scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4)
    dirLight.position.set(1.5, 4.0, 1.5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 10
    dirLight.shadow.camera.top = 2
    dirLight.shadow.camera.bottom = -2
    dirLight.shadow.camera.left = -2
    dirLight.shadow.camera.right = 2
    dirLight.shadow.bias = -0.0005
    this.scene.add(dirLight)
    this.dirLight = dirLight

    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.7)
    fillLight.position.set(-2, 2, -1.5)
    this.scene.add(fillLight)
  }

  setupReticle() {
    const reticleGroup = new THREE.Group()
    reticleGroup.visible = false

    const ringGeo = new THREE.RingGeometry(0.12, 0.14, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    reticleGroup.add(ring)

    const dotGeo = new THREE.CircleGeometry(0.02, 24)
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    })
    const dot = new THREE.Mesh(dotGeo, dotMat)
    dot.rotation.x = -Math.PI / 2
    reticleGroup.add(dot)

    const arrowShape = new THREE.Shape()
    arrowShape.moveTo(0, 0.16)
    arrowShape.lineTo(0.03, 0.19)
    arrowShape.lineTo(-0.03, 0.19)
    arrowShape.closePath()
    const arrowGeo = new THREE.ShapeGeometry(arrowShape)
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    })
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.rotation.x = -Math.PI / 2
    reticleGroup.add(arrow)

    this.scene.add(reticleGroup)
    this.reticle = reticleGroup
    this.reticleRing = ring
  }

  setupAnchorGroup() {
    this.anchor = new THREE.Group()
    this.anchor.visible = false

    this.shadowPlane = createShadowPlane()
    this.anchor.add(this.shadowPlane)

    this.modelContainer = new THREE.Group()
    this.anchor.add(this.modelContainer)

    this.scene.add(this.anchor)
    this.placed = false
  }

  async loadModel(url, targetHeight = 0.65, onProgress = null) {
    if (this.modelCache[url]) {
      return this.cloneLoadedModel(this.modelCache[url])
    }

    const startTime = performance.now()

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const loadTimeMs = Math.round(performance.now() - startTime)
          const model = gltf.scene

          // Normalize real-world dimensions
          const box = new THREE.Box3().setFromObject(model)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())

          const maxDim = Math.max(size.x, size.y, size.z)
          const scaleFactor = targetHeight / (size.y || maxDim)
          model.scale.setScalar(scaleFactor)

          box.setFromObject(model)
          model.position.x = -center.x * scaleFactor
          model.position.y = -box.min.y
          model.position.z = -center.z * scaleFactor

          // Count triangles and draw calls
          let triangles = 0
          let vertices = 0
          let drawCalls = 0

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = false
              drawCalls++
              if (child.geometry) {
                if (child.geometry.index) {
                  triangles += child.geometry.index.count / 3
                } else if (child.geometry.attributes.position) {
                  triangles += child.geometry.attributes.position.count / 3
                }
                if (child.geometry.attributes.position) {
                  vertices += child.geometry.attributes.position.count
                }
              }
            }
          })

          const cachedData = {
            scene: model,
            animations: gltf.animations || [],
            metrics: {
              triangles: Math.round(triangles),
              vertices: Math.round(vertices),
              drawCalls,
              loadTimeMs
            }
          }

          this.modelCache[url] = cachedData
          resolve(this.cloneLoadedModel(cachedData))
        },
        (xhr) => {
          if (xhr.lengthComputable && onProgress) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100)
            onProgress(percent)
          }
        },
        (err) => {
          console.error(`Error loading model: ${url}`, err)
          reject(err)
        }
      )
    })
  }

  cloneLoadedModel(cached) {
    const clonedScene = cached.scene.clone(true)
    return {
      scene: clonedScene,
      animations: cached.animations,
      metrics: cached.metrics
    }
  }

  async setModel(url, targetHeight = 0.65, onProgress = null) {
    while (this.modelContainer.children.length > 0) {
      this.modelContainer.remove(this.modelContainer.children[0])
    }
    
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }
    this.actions = []
    this.currentActionIndex = 0

    const loaded = await this.loadModel(url, targetHeight, onProgress)
    this.currentModel = loaded.scene
    this.modelContainer.add(loaded.scene)

    this.metrics.triangles = loaded.metrics.triangles
    this.metrics.vertices = loaded.metrics.vertices
    this.metrics.drawCalls = loaded.metrics.drawCalls
    this.metrics.loadTimeMs = loaded.metrics.loadTimeMs

    // Setup animations if present
    if (loaded.animations && loaded.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(loaded.scene)
      loaded.animations.forEach((clip, index) => {
        const action = this.mixer.clipAction(clip)
        this.actions.push({ name: clip.name || `Animation ${index + 1}`, action })
      })

      // Default: play primary animation
      if (this.actions.length > 0) {
        this.actions[0].action.play()
      }
    }

    return {
      metrics: this.metrics,
      animations: this.actions.map(a => a.name)
    }
  }

  nextAnimation() {
    if (!this.mixer || this.actions.length <= 1) return null

    const prevAction = this.actions[this.currentActionIndex].action
    this.currentActionIndex = (this.currentActionIndex + 1) % this.actions.length
    const nextAction = this.actions[this.currentActionIndex].action

    prevAction.fadeOut(0.3)
    nextAction.reset().fadeIn(0.3).play()

    return this.actions[this.currentActionIndex].name
  }

  getCurrentAnimationName() {
    if (this.actions.length > 0) {
      return this.actions[this.currentActionIndex].name
    }
    return null
  }

  updateReticle(position, quaternion) {
    if (this.placed) {
      this.reticle.visible = false
      return
    }

    if (position) {
      this.reticle.visible = true
      this.reticle.position.copy(position)
      if (quaternion) {
        this.reticle.quaternion.copy(quaternion)
      }

      const elapsed = performance.now() * 0.003
      const scale = 1.0 + Math.sin(elapsed) * 0.06
      this.reticleRing.scale.set(scale, scale, 1)
    } else {
      this.reticle.visible = false
    }
  }

  placeObject(position, quaternion) {
    if (!position) return

    this.anchor.position.copy(position)
    if (quaternion) {
      this.anchor.quaternion.copy(quaternion)
    } else {
      this.anchor.rotation.set(0, 0, 0)
    }

    this.anchor.visible = true
    this.placed = true
    this.reticle.visible = false

    this.modelContainer.scale.set(0.01, 0.01, 0.01)
    let progress = 0
    const animatePop = () => {
      progress += 0.08
      const s = Math.min(1.0, progress)
      const c1 = 1.70158
      const c3 = c1 + 1
      const eased = 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2)
      this.modelContainer.scale.setScalar(Math.max(0.01, eased))
      if (progress < 1.0) {
        requestAnimationFrame(animatePop)
      }
    }
    animatePop()
  }

  resetPosition() {
    this.modelContainer.rotation.set(0, 0, 0)
    this.modelContainer.scale.set(1, 1, 1)
  }

  removeObject() {
    this.anchor.visible = false
    this.placed = false
    this.resetPosition()
  }

  onWindowResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.1) // clamp delta
    if (this.mixer) {
      this.mixer.update(delta)
    }

    // Measure FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastTime >= 500) {
      this.currentFPS = (this.frameCount * 1000) / (now - this.lastTime)
      this.metrics.fps = this.currentFPS
      this.frameCount = 0
      this.lastTime = now
    }

    this.renderer.render(this.scene, this.camera)
  }
}
