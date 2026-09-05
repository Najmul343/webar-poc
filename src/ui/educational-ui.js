import { VOCATIONAL_MODULES } from '../education/vocational-models.js'

/**
 * EducationalUI
 * High-performance, mobile-first interface adhering to NIMI / DGT vocational curriculum standards.
 * Bilingual (English / Hindi), touch-optimized, with exploded-view slider, scale presets, and part inspector.
 */
export class EducationalUI {
  constructor(options = {}) {
    this.currentLanguage = 'hi' // Default to Hindi for Indian vocational students, with instant English switch
    this.currentMachineId = 'engine'
    this.selectedComponentId = null
    this.isARMode = false
    this.isPlaying = true

    this.onSelectMachine = options.onSelectMachine || (() => {})
    this.onToggleAR = options.onToggleAR || (() => {})
    this.onExplodeChange = options.onExplodeChange || (() => {})
    this.onTogglePlay = options.onTogglePlay || (() => {})
    this.onResetView = options.onResetView || (() => {})
    this.onSelectScale = options.onSelectScale || (() => {})
    this.onSelectComponent = options.onSelectComponent || (() => {})

    this.initDOMElements()
    this.setupEvents()
    this.render()
  }

  initDOMElements() {
    this.elements = {
      langToggle: document.getElementById('btn-lang-toggle'),
      arToggle: document.getElementById('btn-ar-toggle'),
      machineTabs: document.getElementById('machine-tabs'),
      partsPills: document.getElementById('parts-pills'),
      explodeSlider: document.getElementById('explode-slider'),
      explodeValue: document.getElementById('explode-value'),
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnReset: document.getElementById('btn-reset'),
      scaleBtns: document.querySelectorAll('.btn-scale-preset'),
      fpsBadge: document.getElementById('fps-badge'),
      
      // Inspection bottom sheet
      inspectionSheet: document.getElementById('inspection-sheet'),
      sheetPartName: document.getElementById('sheet-part-name'),
      sheetMaterial: document.getElementById('sheet-material'),
      sheetFunction: document.getElementById('sheet-function'),
      sheetTrade: document.getElementById('sheet-trade'),
      btnCloseSheet: document.getElementById('btn-close-sheet')
    }
  }

  setupEvents() {
    // Language Switcher
    if (this.elements.langToggle) {
      this.elements.langToggle.addEventListener('click', () => {
        this.currentLanguage = this.currentLanguage === 'en' ? 'hi' : 'en'
        this.render()
        if (this.selectedComponentId) {
          this.showInspection(this.selectedComponentId)
        }
      })
    }

    // AR Mode Switcher
    if (this.elements.arToggle) {
      this.elements.arToggle.addEventListener('click', () => {
        this.onToggleAR()
      })
    }

    // Exploded View Slider
    if (this.elements.explodeSlider) {
      this.elements.explodeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value)
        if (this.elements.explodeValue) {
          this.elements.explodeValue.textContent = `${Math.round(val * 100)}%`
        }
        this.onExplodeChange(val)
      })
    }

    // Animation Play/Pause
    if (this.elements.btnPlayPause) {
      this.elements.btnPlayPause.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying
        this.updatePlayPauseButton()
        this.onTogglePlay(this.isPlaying)
      })
    }

    // Reset View
    if (this.elements.btnReset) {
      this.elements.btnReset.addEventListener('click', () => {
        if (this.elements.explodeSlider) {
          this.elements.explodeSlider.value = 0
          if (this.elements.explodeValue) this.elements.explodeValue.textContent = '0%'
          this.onExplodeChange(0)
        }
        this.onResetView()
      })
    }

    // Scale Presets
    if (this.elements.scaleBtns) {
      this.elements.scaleBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const scale = parseFloat(btn.dataset.scale)
          this.elements.scaleBtns.forEach((b) => b.classList.remove('active'))
          btn.classList.add('active')
          this.onSelectScale(scale)
        })
      })
    }

    // Close Inspection Sheet
    if (this.elements.btnCloseSheet) {
      this.elements.btnCloseSheet.addEventListener('click', () => {
        this.hideInspection()
      })
    }
  }

  setARModeState(isAR) {
    this.isARMode = isAR
    if (this.elements.arToggle) {
      if (isAR) {
        this.elements.arToggle.innerHTML = `🏢 <span>${this.currentLanguage === 'hi' ? '3D स्टूडियो' : '3D Studio'}</span>`
        this.elements.arToggle.classList.add('ar-active')
      } else {
        this.elements.arToggle.innerHTML = `📷 <span>${this.currentLanguage === 'hi' ? 'AR कैमरा' : 'AR Camera'}</span>`
        this.elements.arToggle.classList.remove('ar-active')
      }
    }
  }

  updatePlayPauseButton() {
    if (this.elements.btnPlayPause) {
      if (this.isPlaying) {
        this.elements.btnPlayPause.innerHTML = '⏸ <span class="lbl-play">Pause</span>'
      } else {
        this.elements.btnPlayPause.innerHTML = '▶ <span class="lbl-play">Run</span>'
      }
    }
  }

  updateFPS(fps) {
    if (this.elements.fpsBadge) {
      this.elements.fpsBadge.textContent = `${Math.round(fps)} FPS`
    }
  }

  render() {
    const isHi = this.currentLanguage === 'hi'

    // Update Lang button text
    if (this.elements.langToggle) {
      this.elements.langToggle.innerHTML = isHi
        ? '🌐 <span>English</span>'
        : '🌐 <span>हिन्दी</span>'
    }

    // Update AR toggle text
    this.setARModeState(this.isARMode)

    // Render Machine Selection Tabs
    if (this.elements.machineTabs) {
      this.elements.machineTabs.innerHTML = ''
      const machines = [
        { id: 'engine', icon: '🏎️', en: '4-Stroke Engine', hi: '४-स्ट्रोक इंजन' },
        { id: 'motor', icon: '⚡', en: 'AC Induction Motor', hi: '३-फेज इंडक्शन मोटर' },
        { id: 'compressor', icon: '💨', en: 'Air Compressor', hi: 'एयर कंप्रेसर' },
        { id: 'gearbox', icon: '⚙️', en: 'Manual Gearbox', hi: 'मैनुअल गियरबॉक्स' }
      ]

      machines.forEach((m) => {
        const btn = document.createElement('button')
        btn.className = `tab-machine ${m.id === this.currentMachineId ? 'active' : ''}`
        btn.innerHTML = `<span class="tab-icon">${m.icon}</span> <span class="tab-title">${isHi ? m.hi : m.en}</span>`
        btn.addEventListener('click', () => {
          if (this.currentMachineId !== m.id) {
            this.currentMachineId = m.id
            this.selectedComponentId = null
            this.hideInspection()
            if (this.elements.explodeSlider) {
              this.elements.explodeSlider.value = 0
              if (this.elements.explodeValue) this.elements.explodeValue.textContent = '0%'
            }
            this.render()
            this.onSelectMachine(m.id)
          }
        })
        this.elements.machineTabs.appendChild(btn)
      })
    }

    // Render Component Pills for the current machine
    this.renderComponentPills()
  }

  renderComponentPills() {
    if (!this.elements.partsPills) return

    const isHi = this.currentLanguage === 'hi'
    const machine = VOCATIONAL_MODULES[this.currentMachineId]
    if (!machine) return

    this.elements.partsPills.innerHTML = ''

    // All / Overview pill
    const allPill = document.createElement('button')
    allPill.className = `part-pill ${this.selectedComponentId === null ? 'active' : ''}`
    allPill.innerHTML = `<span>🔍 ${isHi ? 'संपूर्ण संरचना' : 'Complete View'}</span>`
    allPill.addEventListener('click', () => {
      this.selectedComponentId = null
      this.hideInspection()
      this.renderComponentPills()
      this.onSelectComponent(null)
    })
    this.elements.partsPills.appendChild(allPill)

    machine.components.forEach((comp) => {
      const pill = document.createElement('button')
      pill.className = `part-pill ${this.selectedComponentId === comp.id ? 'active' : ''}`
      pill.innerHTML = `<span>${isHi ? comp.nameHi : comp.name}</span>`
      pill.addEventListener('click', () => {
        this.selectedComponentId = comp.id
        this.showInspection(comp.id)
        this.renderComponentPills()
        this.onSelectComponent(comp.id)
      })
      this.elements.partsPills.appendChild(pill)
    })
  }

  showInspection(componentId) {
    this.selectedComponentId = componentId
    const machine = VOCATIONAL_MODULES[this.currentMachineId]
    if (!machine) return

    const comp = machine.components.find((c) => c.id === componentId)
    if (!comp) return

    const isHi = this.currentLanguage === 'hi'

    if (this.elements.sheetPartName) {
      this.elements.sheetPartName.textContent = isHi ? comp.nameHi : comp.name
    }
    if (this.elements.sheetMaterial) {
      this.elements.sheetMaterial.innerHTML = `<strong>${isHi ? 'अभियांत्रिकी सामग्री:' : 'Engineering Material:'}</strong> ${isHi ? comp.materialHi : comp.material}`
    }
    if (this.elements.sheetFunction) {
      this.elements.sheetFunction.innerHTML = `<strong>${isHi ? 'कार्यप्रणाली एवं उपयोग:' : 'Function & Working Principle:'}</strong> ${isHi ? comp.functionHi : comp.function}`
    }
    if (this.elements.sheetTrade) {
      this.elements.sheetTrade.innerHTML = `<strong>${isHi ? 'संबंधित आईटीआई/डिप्लोमा ट्रेड:' : 'Vocational Trade Curriculum:'}</strong> ${isHi ? machine.categoryHi : machine.category}`
    }

    if (this.elements.inspectionSheet) {
      this.elements.inspectionSheet.classList.add('visible')
    }

    this.renderComponentPills()
  }

  hideInspection() {
    this.selectedComponentId = null
    if (this.elements.inspectionSheet) {
      this.elements.inspectionSheet.classList.remove('visible')
    }
    this.renderComponentPills()
    this.onSelectComponent(null)
  }
}
