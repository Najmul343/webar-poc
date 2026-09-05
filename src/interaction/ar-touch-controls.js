import * as THREE from 'three'

/**
 * ARTouchControls
 * Snapchat-grade touch gesture engine for mobile WebAR and 3D inspection.
 * - Smooth 360-degree inertia rotation with velocity damping
 * - Completely unrestricted pinch-to-scale (0.05x to 8.0x) without lockouts
 * - Two-finger pan translation
 * - Single-tap raycast part selection
 * - Double-tap recenter
 */
export class ARTouchControls {
  constructor(targetObject, domElement, raycastCallback) {
    this.target = targetObject
    this.domElement = domElement
    this.raycastCallback = raycastCallback

    this.isDragging = false
    this.touches = []
    this.touchStartPositions = []
    this.touchStartTime = 0
    this.isPinching = false

    // Rotational velocities for smooth inertia
    this.velocity = new THREE.Vector2(0, 0)
    this.damping = 0.92
    this.rotationSensitivity = 0.006
    this.panSensitivity = 0.0025

    // Scale tracking
    this.initialPinchDistance = 0
    this.baseScale = 1.0

    // Touch positions
    this.lastTouchPos = new THREE.Vector2()
    this.lastPanCenter = new THREE.Vector2()

    // Last tap time for double-tap detection
    this.lastTapTime = 0

    this.setupTouchListeners()
    this.setupMouseListeners()
    this.startInertiaLoop()
  }

  setTarget(newTarget) {
    this.target = newTarget
    this.velocity.set(0, 0)
  }

  setupTouchListeners() {
    this.domElement.addEventListener(
      'touchstart',
      (e) => {
        // Ignore touches on interactive UI elements (buttons, sliders)
        if (e.target.closest('.interactive') || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
          return
        }

        this.velocity.set(0, 0)
        this.touches = Array.from(e.touches)
        this.touchStartTime = performance.now()
        this.touchStartPositions = this.touches.map((t) => new THREE.Vector2(t.clientX, t.clientY))

        if (e.touches.length === 1) {
          this.isDragging = true
          this.isPinching = false
          this.lastTouchPos.set(e.touches[0].clientX, e.touches[0].clientY)
        } else if (e.touches.length === 2) {
          this.isDragging = false
          this.isPinching = true
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          this.initialPinchDistance = Math.hypot(dx, dy)
          if (this.target) {
            this.baseScale = this.target.scale.x
          }

          this.lastPanCenter.set(
            (e.touches[0].clientX + e.touches[1].clientX) / 2,
            (e.touches[0].clientY + e.touches[1].clientY) / 2
          )
        }
      },
      { passive: false }
    )

    this.domElement.addEventListener(
      'touchmove',
      (e) => {
        if (e.target.closest('.interactive') || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
          return
        }
        e.preventDefault()

        if (!this.target) return

        if (e.touches.length === 1 && this.isDragging) {
          const clientX = e.touches[0].clientX
          const clientY = e.touches[0].clientY
          const deltaX = clientX - this.lastTouchPos.x
          const deltaY = clientY - this.lastTouchPos.y

          // Apply rotation
          this.target.rotation.y += deltaX * this.rotationSensitivity
          this.target.rotation.x += deltaY * this.rotationSensitivity
          // Clamp X rotation to prevent flipping upside down
          this.target.rotation.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.target.rotation.x))

          // Record velocity for inertia
          this.velocity.set(deltaX * this.rotationSensitivity, deltaY * this.rotationSensitivity)

          this.lastTouchPos.set(clientX, clientY)
        } else if (e.touches.length === 2 && this.isPinching) {
          // 1. Pinch to Scale
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const currentDistance = Math.hypot(dx, dy)

          if (this.initialPinchDistance > 10) {
            const scaleRatio = currentDistance / this.initialPinchDistance
            // Completely unrestricted scale: from tiny 0.05x to 8.0x life-size
            const newScale = Math.max(0.05, Math.min(8.0, this.baseScale * scaleRatio))
            this.target.scale.set(newScale, newScale, newScale)
          }

          // 2. Two-finger Pan
          const currentCenter = new THREE.Vector2(
            (e.touches[0].clientX + e.touches[1].clientX) / 2,
            (e.touches[0].clientY + e.touches[1].clientY) / 2
          )
          const panX = (currentCenter.x - this.lastPanCenter.x) * this.panSensitivity
          const panY = -(currentCenter.y - this.lastPanCenter.y) * this.panSensitivity

          this.target.position.x += panX
          this.target.position.y += panY

          this.lastPanCenter.copy(currentCenter)
        }
      },
      { passive: false }
    )

    this.domElement.addEventListener('touchend', (e) => {
      const now = performance.now()
      const touchDuration = now - this.touchStartTime

      // Check if this was a quick tap (<250ms and moved <10px)
      if (
        this.touchStartPositions.length === 1 &&
        touchDuration < 250 &&
        e.changedTouches.length > 0
      ) {
        const startPos = this.touchStartPositions[0]
        const endPos = new THREE.Vector2(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        const moveDist = startPos.distanceTo(endPos)

        if (moveDist < 12) {
          // Double-tap recenter
          if (now - this.lastTapTime < 300) {
            this.resetTransform()
            this.lastTapTime = 0
            return
          }
          this.lastTapTime = now

          // Single tap: raycast for component inspection
          if (typeof this.raycastCallback === 'function') {
            this.raycastCallback(endPos.x, endPos.y)
          }
        }
      }

      if (e.touches.length === 0) {
        this.isDragging = false
        this.isPinching = false
      } else if (e.touches.length === 1) {
        this.isDragging = true
        this.isPinching = false
        this.lastTouchPos.set(e.touches[0].clientX, e.touches[0].clientY)
      }
    })
  }

  setupMouseListeners() {
    let isMouseDown = false
    let isRightMouseDown = false
    let lastMousePos = new THREE.Vector2()

    this.domElement.addEventListener('mousedown', (e) => {
      if (e.target.closest('.interactive') || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
        return
      }

      this.velocity.set(0, 0)
      lastMousePos.set(e.clientX, e.clientY)

      if (e.button === 0) {
        isMouseDown = true
      } else if (e.button === 2) {
        isRightMouseDown = true
      }
    })

    window.addEventListener('mousemove', (e) => {
      if (!this.target) return

      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y
      lastMousePos.set(e.clientX, e.clientY)

      if (isMouseDown) {
        this.target.rotation.y += deltaX * this.rotationSensitivity
        this.target.rotation.x += deltaY * this.rotationSensitivity
        this.target.rotation.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.target.rotation.x))
        this.velocity.set(deltaX * this.rotationSensitivity, deltaY * this.rotationSensitivity)
      } else if (isRightMouseDown) {
        this.target.position.x += deltaX * this.panSensitivity
        this.target.position.y -= deltaY * this.panSensitivity
      }
    })

    window.addEventListener('mouseup', (e) => {
      if (isMouseDown && lastMousePos.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) < 5) {
        if (typeof this.raycastCallback === 'function') {
          this.raycastCallback(e.clientX, e.clientY)
        }
      }
      isMouseDown = false
      isRightMouseDown = false
    })

    // Mouse wheel zoom
    this.domElement.addEventListener(
      'wheel',
      (e) => {
        if (!this.target) return
        e.preventDefault()
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
        const currentScale = this.target.scale.x
        const newScale = Math.max(0.05, Math.min(8.0, currentScale * zoomFactor))
        this.target.scale.set(newScale, newScale, newScale)
      },
      { passive: false }
    )

    // Prevent context menu on right click
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  startInertiaLoop() {
    const updateInertia = () => {
      requestAnimationFrame(updateInertia)

      if (!this.isDragging && !this.isPinching && this.target) {
        if (this.velocity.lengthSq() > 0.000001) {
          this.target.rotation.y += this.velocity.x
          this.target.rotation.x += this.velocity.y
          this.target.rotation.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.target.rotation.x))

          this.velocity.multiplyScalar(this.damping)
        }
      }
    }
    updateInertia()
  }

  resetTransform() {
    if (!this.target) return
    this.target.position.set(0, 0, 0)
    this.target.rotation.set(0, 0, 0)
    this.target.scale.set(1.0, 1.0, 1.0)
    this.velocity.set(0, 0)
  }

  setScale(scaleFactor) {
    if (!this.target) return
    const s = Math.max(0.05, Math.min(8.0, scaleFactor))
    this.target.scale.set(s, s, s)
  }
}
