export class UIManager {
  constructor() {
    this.statusBadge = document.getElementById('status-badge')
    this.instructionToast = document.getElementById('instruction-toast')
    this.actionBar = document.getElementById('action-bar')
    this.btnReset = document.getElementById('btn-reset')
    this.btnRemove = document.getElementById('btn-remove')
    this.btnSwitchModel = document.getElementById('btn-switch-model')
    this.modalOverlay = document.getElementById('modal-overlay')
    this.modalTitle = document.getElementById('modal-title')
    this.modalDesc = document.getElementById('modal-desc')
    this.modalAction = document.getElementById('modal-action')
    this.modalSpinner = document.getElementById('modal-spinner')
    this.modalIcon = document.getElementById('modal-icon')

    this.onResetCallback = null
    this.onRemoveCallback = null
    this.onSwitchModelCallback = null

    this.setupListeners()
  }

  setupListeners() {
    if (this.btnReset) {
      this.btnReset.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this.onResetCallback) this.onResetCallback()
      })
    }

    if (this.btnRemove) {
      this.btnRemove.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this.onRemoveCallback) this.onRemoveCallback()
      })
    }

    if (this.btnSwitchModel) {
      this.btnSwitchModel.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this.onSwitchModelCallback) this.onSwitchModelCallback()
      })
    }
  }

  setStatus(state, message) {
    if (!this.statusBadge) return

    this.statusBadge.className = 'status-badge ' + state.toLowerCase()
    
    switch (state) {
      case 'SCANNING':
        this.statusBadge.textContent = 'Scanning Environment'
        this.instructionToast.textContent = message || 'Move your phone slowly to scan the environment'
        this.actionBar.classList.add('hidden')
        break
      case 'SURFACE_FOUND':
        this.statusBadge.textContent = 'Surface Detected'
        this.instructionToast.textContent = message || 'Tap on the surface to place the 3D model'
        this.actionBar.classList.add('hidden')
        break
      case 'PLACED':
        this.statusBadge.textContent = 'Object Placed'
        this.instructionToast.textContent = message || 'Object anchored • 1-finger rotate • 2-finger pinch scale'
        this.actionBar.classList.remove('hidden')
        break
      case 'STARTING_CAMERA':
        this.statusBadge.textContent = 'Starting Camera'
        this.instructionToast.textContent = message || 'Starting camera feed...'
        this.actionBar.classList.add('hidden')
        break
      default:
        this.statusBadge.textContent = state
        if (message) this.instructionToast.textContent = message
    }
  }

  showModal(title, desc, isError = false, buttonText = null, onAction = null) {
    if (!this.modalOverlay) return

    this.modalOverlay.classList.remove('hidden')
    this.modalTitle.textContent = title
    this.modalDesc.textContent = desc

    if (isError) {
      this.modalSpinner.style.display = 'none'
      this.modalIcon.style.display = 'flex'
      this.modalIcon.textContent = '⚠️'
    } else {
      this.modalSpinner.style.display = 'block'
      this.modalIcon.style.display = 'none'
    }

    if (buttonText && onAction) {
      this.modalAction.style.display = 'inline-flex'
      this.modalAction.textContent = buttonText
      this.modalAction.onclick = () => {
        onAction()
      }
    } else {
      this.modalAction.style.display = 'none'
    }
  }

  hideModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.add('hidden')
    }
  }

  showModelSwitchLabel(currentModelName) {
    if (this.btnSwitchModel) {
      this.btnSwitchModel.textContent = currentModelName === 'astronaut' ? 'Switch: Helmet' : 'Switch: Astronaut'
    }
  }
}
