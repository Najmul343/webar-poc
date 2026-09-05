export class GestureHandler {
  constructor(domElement, sceneManager, callbacks = {}) {
    this.domElement = domElement
    this.sceneManager = sceneManager
    this.callbacks = callbacks // { onTap(screenX, screenY), onGestureStart(), onGestureEnd() }

    this.touchStartTime = 0
    this.touchStartX = 0
    this.touchStartY = 0
    this.isDragging = false
    this.initialPinchDistance = 0
    this.initialScale = 1.0

    this.bindEvents()
  }

  bindEvents() {
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false })
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false })
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false })

    // Mouse fallback for desktop testing/debugging
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this))
  }

  getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.hypot(dx, dy)
  }

  onTouchStart(e) {
    if (e.target.closest('.interactive')) return
    e.preventDefault()

    this.touchStartTime = performance.now()

    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX
      this.touchStartY = e.touches[0].clientY
      this.isDragging = true
      this.lastDragX = this.touchStartX
    } else if (e.touches.length === 2) {
      this.isDragging = false
      this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1])
      this.initialScale = this.sceneManager.modelContainer.scale.x
    }
  }

  onTouchMove(e) {
    if (e.target.closest('.interactive')) return
    e.preventDefault()

    // 1-finger horizontal swipe -> Rotate model
    if (e.touches.length === 1 && this.isDragging && this.sceneManager.placed) {
      const currentX = e.touches[0].clientX
      const deltaX = currentX - this.lastDragX
      this.lastDragX = currentX

      // Rotate around Y axis
      const rotationSpeed = 0.008
      this.sceneManager.modelContainer.rotation.y += deltaX * rotationSpeed
    }
    // 2-finger pinch -> Scale model
    else if (e.touches.length === 2 && this.sceneManager.placed) {
      const currentDist = this.getDistance(e.touches[0], e.touches[1])
      if (this.initialPinchDistance > 0) {
        const ratio = currentDist / this.initialPinchDistance
        const newScale = Math.min(Math.max(this.initialScale * ratio, 0.15), 3.0)
        this.sceneManager.modelContainer.scale.setScalar(newScale)
      }
    }
  }

  onTouchEnd(e) {
    if (e.target.closest('.interactive')) return
    const touchDuration = performance.now() - this.touchStartTime

    // Check for tap (short duration, minimal movement)
    if (e.changedTouches.length === 1 && touchDuration < 300) {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const dist = Math.hypot(endX - this.touchStartX, endY - this.touchStartY)

      if (dist < 20) {
        if (this.callbacks.onTap) {
          this.callbacks.onTap(endX, endY)
        }
      }
    }

    if (e.touches.length === 0) {
      this.isDragging = false
      this.initialPinchDistance = 0
    }
  }

  // Mouse emulation for desktop testing
  onMouseDown(e) {
    if (e.target.closest('.interactive')) return
    this.touchStartTime = performance.now()
    this.touchStartX = e.clientX
    this.touchStartY = e.clientY
    this.isDragging = true
    this.lastDragX = e.clientX
  }

  onMouseMove(e) {
    if (!this.isDragging || !this.sceneManager.placed) return
    const deltaX = e.clientX - this.lastDragX
    this.lastDragX = e.clientX
    this.sceneManager.modelContainer.rotation.y += deltaX * 0.008
  }

  onMouseUp(e) {
    if (e.target.closest('.interactive')) return
    const duration = performance.now() - this.touchStartTime
    const dist = Math.hypot(e.clientX - this.touchStartX, e.clientY - this.touchStartY)

    if (duration < 300 && dist < 10) {
      if (this.callbacks.onTap) {
        this.callbacks.onTap(e.clientX, e.clientY)
      }
    }
    this.isDragging = false
  }
}
