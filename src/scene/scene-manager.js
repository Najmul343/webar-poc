import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createShadowPlane } from './shadow-plane.js'

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    
    // Camera will be updated by AR tracking matrices
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

    this.gltfLoader = new GLTFLoader()
    this.modelCache = {}

    this.setupLights()
    this.setupReticle()
    this.setupAnchorGroup()

    this.mixer = null
    this.clock = new THREE.Clock()

    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  setupLights() {
    // Ambient / Environmental lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 1.4)
    hemiLight.position.set(0, 5, 0)
    this.scene.add(hemiLight)

    // Key directional light for crisp PBR highlights and shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
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

    // Subtle fill light
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.8)
    fillLight.position.set(-2, 2, -1.5)
    this.scene.add(fillLight)
  }

  setupReticle() {
    // Modern circular placement indicator with pulsing inner ring
    const reticleGroup = new THREE.Group()
    reticleGroup.visible = false

    // Outer ring
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

    // Inner dot
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

    // Direction arrow pointer
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
    // Master container for the placed 3D object and its ground shadow
    this.anchor = new THREE.Group()
    this.anchor.visible = false

    // Shadow receiver plane
    this.shadowPlane = createShadowPlane()
    this.anchor.add(this.shadowPlane)

    // Sub-group for model manipulation (scaling & rotation)
    this.modelContainer = new THREE.Group()
    this.anchor.add(this.modelContainer)

    this.scene.add(this.anchor)
    this.placed = false
  }

  async loadModel(url, targetHeight = 0.65) {
    if (this.modelCache[url]) {
      return this.modelCache[url].clone()
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          
          // Calculate bounding box to normalize real-world scale
          const box = new THREE.Box3().setFromObject(model)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())

          // Scale so model height matches target real-world meters
          const maxDim = Math.max(size.x, size.y, size.z)
          const scaleFactor = targetHeight / (size.y || maxDim)
          model.scale.setScalar(scaleFactor)

          // Center model on ground anchor (y = 0 at model base)
          box.setFromObject(model)
          model.position.x = -center.x * scaleFactor
          model.position.y = -box.min.y
          model.position.z = -center.z * scaleFactor

          // Setup shadows on all sub-meshes
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = false
              if (child.material) {
                child.material.roughness = Math.min(child.material.roughness ?? 0.5, 0.95)
              }
            }
          })

          // Handle animations if present
          if (gltf.animations && gltf.animations.length > 0) {
            model.userData.animations = gltf.animations
          }

          // Cache root wrapper
          const wrapper = new THREE.Group()
          wrapper.add(model)
          wrapper.userData.originalScale = 1.0

          this.modelCache[url] = wrapper
          resolve(wrapper.clone())
        },
        undefined,
        (err) => {
          console.error(`Failed to load model from ${url}`, err)
          reject(err)
        }
      )
    })
  }

  async setModel(url, targetHeight = 0.65) {
    // Remove existing model
    while (this.modelContainer.children.length > 0) {
      this.modelContainer.remove(this.modelContainer.children[0])
    }
    this.currentModel = null
    this.mixer = null

    const model = await this.loadModel(url, targetHeight)
    this.currentModel = model
    this.modelContainer.add(model)

    // If animations exist, play the primary animation
    const innerModel = model.children[0]
    if (innerModel && innerModel.userData && innerModel.userData.animations) {
      this.mixer = new THREE.AnimationMixer(innerModel)
      const action = this.mixer.clipAction(innerModel.userData.animations[0])
      action.play()
    }

    return model
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

      // Subtle pulse animation
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
      // Keep upright
      this.anchor.rotation.set(0, 0, 0)
    }

    this.anchor.visible = true
    this.placed = true
    this.reticle.visible = false

    // Entrance pop animation
    this.modelContainer.scale.set(0.01, 0.01, 0.01)
    let progress = 0
    const animatePop = () => {
      progress += 0.08
      const s = Math.min(1.0, progress)
      // Ease out back
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
    const delta = this.clock.getDelta()
    if (this.mixer) {
      this.mixer.update(delta)
    }
    this.renderer.render(this.scene, this.camera)
  }
}
