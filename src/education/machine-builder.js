import * as THREE from 'three'
import { VOCATIONAL_MODULES } from './vocational-models.js'

/**
 * Procedural Machine Builder for Indian Vocational Training (ITI / Polytechnic / Engineering)
 * Builds high-fidelity, physically proportioned 3D machinery without any external heavy asset downloads (0 KB payload).
 * Features realistic PBR materials, kinematics (piston, crank, rotor, gears), and exploded-view offsets.
 */
export class MachineBuilder {
  constructor() {
    this.materials = this.initMaterials()
  }

  initMaterials() {
    return {
      castIron: new THREE.MeshStandardMaterial({
        color: 0x3a3d40,
        roughness: 0.75,
        metalness: 0.4,
        bumpScale: 0.02
      }),
      polishedSteel: new THREE.MeshStandardMaterial({
        color: 0xd8dde3,
        roughness: 0.2,
        metalness: 0.9
      }),
      forgedSteel: new THREE.MeshStandardMaterial({
        color: 0x5a636e,
        roughness: 0.45,
        metalness: 0.8
      }),
      aluminumAlloy: new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.35,
        metalness: 0.7
      }),
      copper: new THREE.MeshStandardMaterial({
        color: 0xc86a3b,
        roughness: 0.3,
        metalness: 0.85
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.8
      }),
      ceramic: new THREE.MeshStandardMaterial({
        color: 0xf4f6f8,
        roughness: 0.15,
        metalness: 0.05
      }),
      darkRubber: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
        metalness: 0.1
      }),
      combustionGlow: new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        emissiveIntensity: 0.8,
        roughness: 0.3
      }),
      cutawayGlass: new THREE.MeshPhysicalMaterial({
        color: 0x88bbff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.75,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      }),
      highlightGlow: new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0099ff,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      })
    }
  }

  /**
   * Build machine model by type ID ('engine', 'motor', 'compressor', 'gearbox')
   */
  buildMachine(typeId) {
    switch (typeId) {
      case 'engine':
        return this.buildICEngine()
      case 'motor':
        return this.buildInductionMotor()
      case 'compressor':
        return this.buildAirCompressor()
      case 'gearbox':
        return this.buildGearbox()
      default:
        return this.buildICEngine()
    }
  }

  /**
   * 1. 4-STROKE IC ENGINE
   * Reciprocating piston, connecting rod, counterweighted crankshaft, spark plug, cylinder block cutaway
   */
  buildICEngine() {
    const root = new THREE.Group()
    root.name = 'machine_engine'

    const parts = {}

    // Kinematic Parameters
    const crankRadius = 0.22
    const rodLength = 0.65

    // --- Component: Crankshaft ---
    const crankGroup = new THREE.Group()
    crankGroup.userData = { componentId: 'crankshaft', originalPos: new THREE.Vector3(0, -0.4, 0), explodeOffset: new THREE.Vector3(0, -0.35, 0) }
    crankGroup.position.copy(crankGroup.userData.originalPos)

    // Main journal shaft
    const crankShaftGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 24)
    crankShaftGeom.rotateZ(Math.PI / 2)
    const crankShaftMesh = new THREE.Mesh(crankShaftGeom, this.materials.polishedSteel)
    crankGroup.add(crankShaftMesh)

    // Counterweights (two lobe plates)
    for (let offset of [-0.14, 0.14]) {
      const lobeGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24, 1, false, 0, Math.PI)
      lobeGeom.rotateZ(Math.PI / 2)
      lobeGeom.rotateX(Math.PI)
      const lobeMesh = new THREE.Mesh(lobeGeom, this.materials.forgedSteel)
      lobeMesh.position.set(offset, 0, 0)
      crankGroup.add(lobeMesh)
    }

    // Crankpin (offset by crankRadius)
    const crankPinGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 24)
    crankPinGeom.rotateZ(Math.PI / 2)
    const crankPinMesh = new THREE.Mesh(crankPinGeom, this.materials.polishedSteel)
    crankPinMesh.position.set(0, crankRadius, 0)
    crankGroup.add(crankPinMesh)

    parts.crankshaft = crankGroup
    root.add(crankGroup)

    // --- Component: Connecting Rod ---
    const rodGroup = new THREE.Group()
    rodGroup.userData = { componentId: 'connectingRod', originalPos: new THREE.Vector3(0, 0, 0), explodeOffset: new THREE.Vector3(0, 0.2, 0.2) }
    
    // Rod beam (I-beam approximation)
    const rodBeamGeom = new THREE.BoxGeometry(0.04, rodLength * 0.8, 0.03)
    const rodBeamMesh = new THREE.Mesh(rodBeamGeom, this.materials.forgedSteel)
    rodGroup.add(rodBeamMesh)

    // Big-end bearing eye
    const bigEndGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 24)
    bigEndGeom.rotateX(Math.PI / 2)
    const bigEndMesh = new THREE.Mesh(bigEndGeom, this.materials.brass)
    bigEndMesh.position.set(0, -rodLength / 2, 0)
    rodGroup.add(bigEndMesh)

    // Small-end bearing eye
    const smallEndGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 24)
    smallEndGeom.rotateX(Math.PI / 2)
    const smallEndMesh = new THREE.Mesh(smallEndGeom, this.materials.brass)
    smallEndMesh.position.set(0, rodLength / 2, 0)
    rodGroup.add(smallEndMesh)

    parts.connectingRod = rodGroup
    root.add(rodGroup)

    // --- Component: Piston & Rings ---
    const pistonGroup = new THREE.Group()
    pistonGroup.userData = { componentId: 'piston', originalPos: new THREE.Vector3(0, 0.5, 0), explodeOffset: new THREE.Vector3(0, 0.5, 0) }
    pistonGroup.position.copy(pistonGroup.userData.originalPos)

    // Piston crown & skirt
    const pistonGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.35, 32)
    const pistonMesh = new THREE.Mesh(pistonGeom, this.materials.aluminumAlloy)
    pistonGroup.add(pistonMesh)

    // 3 Piston compression and oil scraper rings
    for (let i = 0; i < 3; i++) {
      const ringGeom = new THREE.TorusGeometry(0.242, 0.008, 12, 32)
      ringGeom.rotateX(Math.PI / 2)
      const ringMesh = new THREE.Mesh(ringGeom, this.materials.forgedSteel)
      ringMesh.position.set(0, 0.1 - i * 0.035, 0)
      pistonGroup.add(ringMesh)
    }

    // Gudgeon pin (wrist pin)
    const wristPinGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.44, 20)
    wristPinGeom.rotateX(Math.PI / 2)
    const wristPinMesh = new THREE.Mesh(wristPinGeom, this.materials.polishedSteel)
    wristPinMesh.position.set(0, -0.04, 0)
    pistonGroup.add(wristPinMesh)

    parts.piston = pistonGroup
    root.add(pistonGroup)

    // --- Component: Cylinder Block & Liner (with Cutaway for Inspection) ---
    const blockGroup = new THREE.Group()
    blockGroup.userData = { componentId: 'cylinderBlock', originalPos: new THREE.Vector3(0, 0.4, 0), explodeOffset: new THREE.Vector3(0.4, 0, 0) }
    blockGroup.position.copy(blockGroup.userData.originalPos)

    // Outer cooling finned block (open 120-degree cutaway window to reveal piston inside)
    const blockGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.85, 32, 1, false, 0, Math.PI * 1.35)
    const blockMesh = new THREE.Mesh(blockGeom, this.materials.castIron)
    blockMesh.rotation.y = -Math.PI * 0.67
    blockGroup.add(blockMesh)

    // Cooling fins
    for (let y = -0.3; y <= 0.35; y += 0.09) {
      const finGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.015, 32, 1, false, 0, Math.PI * 1.35)
      const finMesh = new THREE.Mesh(finGeom, this.materials.castIron)
      finMesh.rotation.y = -Math.PI * 0.67
      finMesh.position.set(0, y, 0)
      blockGroup.add(finMesh)
    }

    // Cylinder liner transparent cutaway glass section
    const linerGlassGeom = new THREE.CylinderGeometry(0.245, 0.245, 0.8, 32, 1, false, Math.PI * 1.35, Math.PI * 0.65)
    const linerGlassMesh = new THREE.Mesh(linerGlassGeom, this.materials.cutawayGlass)
    linerGlassMesh.rotation.y = -Math.PI * 0.67
    blockGroup.add(linerGlassMesh)

    parts.cylinderBlock = blockGroup
    root.add(blockGroup)

    // --- Component: Spark Plug & Combustion Zone ---
    const plugGroup = new THREE.Group()
    plugGroup.userData = { componentId: 'sparkPlug', originalPos: new THREE.Vector3(0, 0.95, 0), explodeOffset: new THREE.Vector3(0, 0.7, 0) }
    plugGroup.position.copy(plugGroup.userData.originalPos)

    // Hexagonal steel body
    const hexGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6)
    const hexMesh = new THREE.Mesh(hexGeom, this.materials.polishedSteel)
    plugGroup.add(hexMesh)

    // Ceramic white insulator with ribbed crests
    const ceramicGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.22, 16)
    const ceramicMesh = new THREE.Mesh(ceramicGeom, this.materials.ceramic)
    ceramicMesh.position.set(0, 0.15, 0)
    plugGroup.add(ceramicMesh)

    // Brass terminal nut
    const terminalGeom = new THREE.CylinderGeometry(0.02, 0.025, 0.05, 12)
    const terminalMesh = new THREE.Mesh(terminalGeom, this.materials.brass)
    terminalMesh.position.set(0, 0.28, 0)
    plugGroup.add(terminalMesh)

    // Spark gap electrode
    const electrodeGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8)
    const electrodeMesh = new THREE.Mesh(electrodeGeom, this.materials.copper)
    electrodeMesh.position.set(0, -0.07, 0)
    plugGroup.add(electrodeMesh)

    // Combustion flash indicator light
    const sparkGlowGeom = new THREE.SphereGeometry(0.05, 12, 12)
    const sparkGlowMesh = new THREE.Mesh(sparkGlowGeom, this.materials.combustionGlow)
    sparkGlowMesh.position.set(0, -0.12, 0)
    sparkGlowMesh.visible = false
    plugGroup.add(sparkGlowMesh)

    parts.sparkPlug = plugGroup
    parts.sparkGlow = sparkGlowMesh
    root.add(plugGroup)

    // --- Component: Poppet Valves (Intake & Exhaust) ---
    const valvesGroup = new THREE.Group()
    valvesGroup.userData = { componentId: 'valves', originalPos: new THREE.Vector3(0, 0.88, 0), explodeOffset: new THREE.Vector3(-0.35, 0.45, 0) }
    valvesGroup.position.copy(valvesGroup.userData.originalPos)

    // Intake valve (larger disc)
    const inValveHeadGeom = new THREE.CylinderGeometry(0.09, 0.04, 0.03, 20)
    const inValveStemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 12)
    inValveStemGeom.translate(0, 0.125, 0)
    const inValveHeadMesh = new THREE.Mesh(inValveHeadGeom, this.materials.polishedSteel)
    const inValveStemMesh = new THREE.Mesh(inValveStemGeom, this.materials.polishedSteel)
    const intakeValve = new THREE.Group()
    intakeValve.add(inValveHeadMesh, inValveStemMesh)
    intakeValve.position.set(-0.11, 0, 0)
    valvesGroup.add(intakeValve)

    // Exhaust valve (heat-resistant slightly smaller disc)
    const exValveHeadGeom = new THREE.CylinderGeometry(0.075, 0.035, 0.03, 20)
    const exValveStemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 12)
    exValveStemGeom.translate(0, 0.125, 0)
    const exValveHeadMesh = new THREE.Mesh(exValveHeadGeom, this.materials.forgedSteel)
    const exValveStemMesh = new THREE.Mesh(exValveStemGeom, this.materials.forgedSteel)
    const exhaustValve = new THREE.Group()
    exhaustValve.add(exValveHeadMesh, exValveStemMesh)
    exhaustValve.position.set(0.11, 0, 0)
    valvesGroup.add(exhaustValve)

    parts.valves = valvesGroup
    parts.intakeValve = intakeValve
    parts.exhaustValve = exhaustValve
    root.add(valvesGroup)

    // Setup kinematic animation driver
    root.userData = {
      type: 'engine',
      parts,
      crankRadius,
      rodLength,
      crankAngle: 0,
      updateKinematics: (delta, isRunning) => {
        if (!isRunning) return
        root.userData.crankAngle += delta * 4.5

        const theta = root.userData.crankAngle
        // Crank rotation around X axis
        crankGroup.rotation.x = theta

        // Kinematics: Piston height along Y axis
        const r = crankRadius
        const l = rodLength
        const sinTheta = Math.sin(theta)
        const cosTheta = Math.cos(theta)
        const pistonY = r * cosTheta + Math.sqrt(l * l - (r * sinTheta) * (r * sinTheta))

        // Update piston position if not exploded
        const originalPistonPos = pistonGroup.userData.originalPos
        pistonGroup.position.y = originalPistonPos.y - 0.45 + (pistonY - 0.4)

        // Connecting rod articulation:
        const crankPinY = crankGroup.position.y + r * cosTheta
        const crankPinZ = crankGroup.position.z - r * sinTheta

        const wristPinY = pistonGroup.position.y - 0.04
        const wristPinZ = pistonGroup.position.z

        rodGroup.position.set(0, (crankPinY + wristPinY) / 2, (crankPinZ + wristPinZ) / 2)
        
        const rodAngle = Math.atan2(crankPinZ - wristPinZ, crankPinY - wristPinY)
        rodGroup.rotation.x = -rodAngle

        // Spark plug combustion flash at Top Dead Center of power stroke
        const cycle = theta % (Math.PI * 4)
        if (cycle > 0 && cycle < 0.3) {
          sparkGlowMesh.visible = true
        } else {
          sparkGlowMesh.visible = false
        }

        // Valve timing simulation
        if (cycle >= Math.PI && cycle < Math.PI * 2) {
          intakeValve.position.y = -0.04 * Math.sin(cycle - Math.PI)
        } else {
          intakeValve.position.y = 0
        }

        if (cycle >= Math.PI * 3 && cycle < Math.PI * 4) {
          exhaustValve.position.y = -0.04 * Math.sin(cycle - Math.PI * 3)
        } else {
          exhaustValve.position.y = 0
        }
      }
    }

    return root
  }

  /**
   * 2. 3-PHASE AC INDUCTION MOTOR (SQUIRREL CAGE)
   * Stator laminations, distributed copper windings, squirrel-cage rotor bars, external cooling fan
   */
  buildInductionMotor() {
    const root = new THREE.Group()
    root.name = 'machine_motor'

    const parts = {}

    // --- Component: Laminated Stator Core ---
    const statorGroup = new THREE.Group()
    statorGroup.userData = { componentId: 'statorCore', originalPos: new THREE.Vector3(0, 0, 0), explodeOffset: new THREE.Vector3(0.45, 0, 0) }
    statorGroup.position.copy(statorGroup.userData.originalPos)

    // Cast iron frame casing with exterior cooling fins
    const casingGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.65, 32)
    casingGeom.rotateZ(Math.PI / 2)
    const casingMesh = new THREE.Mesh(casingGeom, this.materials.castIron)
    statorGroup.add(casingMesh)

    // External cooling ribs
    for (let i = 0; i < 16; i++) {
      const ribAngle = (i / 16) * Math.PI * 2
      const ribGeom = new THREE.BoxGeometry(0.65, 0.05, 0.015)
      const ribMesh = new THREE.Mesh(ribGeom, this.materials.castIron)
      ribMesh.position.set(0, Math.cos(ribAngle) * 0.4, Math.sin(ribAngle) * 0.4)
      ribMesh.rotation.x = -ribAngle
      statorGroup.add(ribMesh)
    }

    // Silicon steel lamination interior ring
    const coreGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.5, 32, 1, true)
    coreGeom.rotateZ(Math.PI / 2)
    const coreMesh = new THREE.Mesh(coreGeom, this.materials.forgedSteel)
    statorGroup.add(coreMesh)

    // Motor mounting feet
    const feetGeom = new THREE.BoxGeometry(0.5, 0.05, 0.6)
    const feetMesh = new THREE.Mesh(feetGeom, this.materials.castIron)
    feetMesh.position.set(0, -0.4, 0)
    statorGroup.add(feetMesh)

    // Terminal box on top
    const termBoxGeom = new THREE.BoxGeometry(0.18, 0.12, 0.18)
    const termBoxMesh = new THREE.Mesh(termBoxGeom, this.materials.castIron)
    termBoxMesh.position.set(0, 0.45, 0)
    statorGroup.add(termBoxMesh)

    parts.statorCore = statorGroup
    root.add(statorGroup)

    // --- Component: 3-Phase Copper Windings ---
    const windingsGroup = new THREE.Group()
    windingsGroup.userData = { componentId: 'copperWindings', originalPos: new THREE.Vector3(0, 0, 0), explodeOffset: new THREE.Vector3(0, 0.45, 0) }
    windingsGroup.position.copy(windingsGroup.userData.originalPos)

    // Overhang coil end-turns (front and back)
    for (let xOffset of [-0.28, 0.28]) {
      for (let j = 0; j < 12; j++) {
        const coilAngle = (j / 12) * Math.PI * 2
        const coilGeom = new THREE.TorusGeometry(0.08, 0.025, 12, 24, Math.PI)
        const coilMesh = new THREE.Mesh(coilGeom, this.materials.copper)
        coilMesh.position.set(xOffset, Math.cos(coilAngle) * 0.24, Math.sin(coilAngle) * 0.24)
        coilMesh.rotation.y = Math.PI / 2
        coilMesh.rotation.z = coilAngle
        windingsGroup.add(coilMesh)
      }
    }

    parts.copperWindings = windingsGroup
    root.add(windingsGroup)

    // --- Component: Squirrel-Cage Rotor & Shaft ---
    const rotorGroup = new THREE.Group()
    rotorGroup.userData = { componentId: 'rotor', originalPos: new THREE.Vector3(0, 0, 0), explodeOffset: new THREE.Vector3(-0.45, 0, 0) }
    rotorGroup.position.copy(rotorGroup.userData.originalPos)

    // Central drive shaft
    const shaftGeom = new THREE.CylinderGeometry(0.045, 0.045, 1.1, 24)
    shaftGeom.rotateZ(Math.PI / 2)
    const shaftMesh = new THREE.Mesh(shaftGeom, this.materials.polishedSteel)
    rotorGroup.add(shaftMesh)

    // Laminated rotor core cylinder
    const rotorCoreGeom = new THREE.CylinderGeometry(0.21, 0.21, 0.45, 28)
    rotorCoreGeom.rotateZ(Math.PI / 2)
    const rotorCoreMesh = new THREE.Mesh(rotorCoreGeom, this.materials.forgedSteel)
    rotorGroup.add(rotorCoreMesh)

    // Die-cast aluminum skewed rotor bars & end rings
    for (let r = 0; r < 18; r++) {
      const barAngle = (r / 18) * Math.PI * 2
      const barGeom = new THREE.BoxGeometry(0.48, 0.015, 0.015)
      const barMesh = new THREE.Mesh(barGeom, this.materials.aluminumAlloy)
      barMesh.position.set(0, Math.cos(barAngle) * 0.212, Math.sin(barAngle) * 0.212)
      barMesh.rotation.y = 0.06
      barMesh.rotation.x = -barAngle
      rotorGroup.add(barMesh)
    }

    // Aluminum short-circuiting end rings
    for (let endX of [-0.23, 0.23]) {
      const endRingGeom = new THREE.TorusGeometry(0.21, 0.02, 12, 32)
      endRingGeom.rotateY(Math.PI / 2)
      const endRingMesh = new THREE.Mesh(endRingGeom, this.materials.aluminumAlloy)
      endRingMesh.position.set(endX, 0, 0)
      rotorGroup.add(endRingMesh)
    }

    parts.rotor = rotorGroup
    root.add(rotorGroup)

    // --- Component: External Cooling Fan & Cowl ---
    const fanGroup = new THREE.Group()
    fanGroup.userData = { componentId: 'coolingFan', originalPos: new THREE.Vector3(-0.48, 0, 0), explodeOffset: new THREE.Vector3(-0.7, 0, 0) }
    fanGroup.position.copy(fanGroup.userData.originalPos)

    // Fan hub
    const fanHubGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 20)
    fanHubGeom.rotateZ(Math.PI / 2)
    const fanHubMesh = new THREE.Mesh(fanHubGeom, this.materials.darkRubber)
    fanGroup.add(fanHubMesh)

    // 8 Fan blades
    const fanBlades = new THREE.Group()
    for (let b = 0; b < 8; b++) {
      const bladeAngle = (b / 8) * Math.PI * 2
      const bladeGeom = new THREE.BoxGeometry(0.04, 0.16, 0.015)
      const bladeMesh = new THREE.Mesh(bladeGeom, this.materials.darkRubber)
      bladeMesh.position.set(0, Math.cos(bladeAngle) * 0.16, Math.sin(bladeAngle) * 0.16)
      bladeMesh.rotation.x = -bladeAngle + 0.35
      fanBlades.add(bladeMesh)
    }
    fanGroup.add(fanBlades)

    // Perforated fan cover cowl
    const cowlGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 32, 1, true)
    cowlGeom.rotateZ(Math.PI / 2)
    const cowlMesh = new THREE.Mesh(cowlGeom, this.materials.castIron)
    cowlMesh.position.set(-0.02, 0, 0)
    fanGroup.add(cowlMesh)

    parts.coolingFan = fanGroup
    parts.fanBlades = fanBlades
    root.add(fanGroup)

    // Setup kinematic animation driver
    root.userData = {
      type: 'motor',
      parts,
      rotorAngle: 0,
      updateKinematics: (delta, isRunning) => {
        if (!isRunning) return
        root.userData.rotorAngle += delta * 12.0

        rotorGroup.rotation.x = root.userData.rotorAngle
        fanBlades.rotation.x = root.userData.rotorAngle
      }
    }

    return root
  }

  /**
   * 3. RECIPROCATING AIR COMPRESSOR
   * Finned cylinder head, suction/delivery reed valves, compression piston, crankcase with splash oil sump
   */
  buildAirCompressor() {
    const root = new THREE.Group()
    root.name = 'machine_compressor'

    const parts = {}

    // --- Component: Cylinder Head & Reed Valves ---
    const headGroup = new THREE.Group()
    headGroup.userData = { componentId: 'cylinderHead', originalPos: new THREE.Vector3(0, 0.65, 0), explodeOffset: new THREE.Vector3(0, 0.5, 0) }
    headGroup.position.copy(headGroup.userData.originalPos)

    // Cast head block with heavy cooling fins
    const headGeom = new THREE.BoxGeometry(0.48, 0.18, 0.48)
    const headMesh = new THREE.Mesh(headGeom, this.materials.aluminumAlloy)
    headGroup.add(headMesh)

    for (let f = -0.05; f <= 0.12; f += 0.04) {
      const headFinGeom = new THREE.BoxGeometry(0.56, 0.015, 0.56)
      const headFinMesh = new THREE.Mesh(headFinGeom, this.materials.aluminumAlloy)
      headFinMesh.position.set(0, f, 0)
      headGroup.add(headFinMesh)
    }

    // Intake air filter canister
    const filterGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 20)
    const filterMesh = new THREE.Mesh(filterGeom, this.materials.darkRubber)
    filterMesh.position.set(-0.28, 0.05, 0)
    headGroup.add(filterMesh)

    // Brass pressure discharge fitting
    const dischargeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16)
    dischargeGeom.rotateZ(Math.PI / 2)
    const dischargeMesh = new THREE.Mesh(dischargeGeom, this.materials.brass)
    dischargeMesh.position.set(0.28, 0.05, 0)
    headGroup.add(dischargeMesh)

    parts.cylinderHead = headGroup
    root.add(headGroup)

    // --- Component: Compression Piston & Rings ---
    const pistonGroup = new THREE.Group()
    pistonGroup.userData = { componentId: 'pistonAssembly', originalPos: new THREE.Vector3(0, 0.25, 0), explodeOffset: new THREE.Vector3(0, 0.2, 0) }
    pistonGroup.position.copy(pistonGroup.userData.originalPos)

    // Piston
    const compPistonGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 28)
    const compPistonMesh = new THREE.Mesh(compPistonGeom, this.materials.aluminumAlloy)
    pistonGroup.add(compPistonMesh)

    // 2 Compression rings & 1 oil ring
    for (let k = 0; k < 3; k++) {
      const cRingGeom = new THREE.TorusGeometry(0.202, 0.006, 8, 28)
      cRingGeom.rotateX(Math.PI / 2)
      const cRingMesh = new THREE.Mesh(cRingGeom, this.materials.forgedSteel)
      cRingMesh.position.set(0, 0.08 - k * 0.035, 0)
      pistonGroup.add(cRingMesh)
    }

    // Connecting rod
    const compRodGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 16)
    const compRodMesh = new THREE.Mesh(compRodGeom, this.materials.forgedSteel)
    compRodMesh.position.set(0, -0.28, 0)
    pistonGroup.add(compRodMesh)

    parts.pistonAssembly = pistonGroup
    root.add(pistonGroup)

    // --- Component: Crankcase & Oil Sump ---
    const crankcaseGroup = new THREE.Group()
    crankcaseGroup.userData = { componentId: 'crankcase', originalPos: new THREE.Vector3(0, -0.35, 0), explodeOffset: new THREE.Vector3(0, -0.4, 0) }
    crankcaseGroup.position.copy(crankcaseGroup.userData.originalPos)

    // Heavy iron crankcase housing
    const caseGeom = new THREE.BoxGeometry(0.55, 0.45, 0.45)
    const caseMesh = new THREE.Mesh(caseGeom, this.materials.castIron)
    crankcaseGroup.add(caseMesh)

    // Circular oil sight glass
    const sightGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 20)
    sightGeom.rotateX(Math.PI / 2)
    const sightMesh = new THREE.Mesh(sightGeom, this.materials.brass)
    sightMesh.position.set(0, -0.1, 0.235)
    crankcaseGroup.add(sightMesh)

    // Flywheel pulley on drive side
    const pulleyGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 32)
    pulleyGeom.rotateZ(Math.PI / 2)
    const pulleyMesh = new THREE.Mesh(pulleyGeom, this.materials.castIron)
    pulleyMesh.position.set(0.32, 0, 0)
    crankcaseGroup.add(pulleyMesh)

    parts.crankcase = crankcaseGroup
    parts.pulley = pulleyMesh
    root.add(crankcaseGroup)

    // Setup kinematic animation driver
    root.userData = {
      type: 'compressor',
      parts,
      angle: 0,
      updateKinematics: (delta, isRunning) => {
        if (!isRunning) return
        root.userData.angle += delta * 5.0

        const a = root.userData.angle
        pulleyMesh.rotation.x = a

        const stroke = Math.sin(a) * 0.12
        pistonGroup.position.y = pistonGroup.userData.originalPos.y + stroke
      }
    }

    return root
  }

  /**
   * 4. AUTOMOTIVE MANUAL TRANSMISSION GEARBOX
   * Clutch input shaft, countershaft cluster with helical teeth, synchronizer sleeve & selector fork
   */
  buildGearbox() {
    const root = new THREE.Group()
    root.name = 'machine_gearbox'

    const parts = {}

    // Helper: create realistic toothed spur/helical gear mesh
    const createGear = (radius, thickness, teethCount, material) => {
      const gearGroup = new THREE.Group()
      const coreGeom = new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, thickness, 28)
      coreGeom.rotateZ(Math.PI / 2)
      const coreMesh = new THREE.Mesh(coreGeom, material)
      gearGroup.add(coreMesh)

      for (let t = 0; t < teethCount; t++) {
        const toothAngle = (t / teethCount) * Math.PI * 2
        const toothGeom = new THREE.BoxGeometry(thickness, radius * 0.22, 0.02)
        const toothMesh = new THREE.Mesh(toothGeom, material)
        toothMesh.position.set(0, Math.cos(toothAngle) * radius * 0.95, Math.sin(toothAngle) * radius * 0.95)
        toothMesh.rotation.x = -toothAngle
        gearGroup.add(toothMesh)
      }
      return gearGroup
    }

    // --- Component: Input Shaft & Primary Pinion ---
    const inputShaftGroup = new THREE.Group()
    inputShaftGroup.userData = { componentId: 'inputShaft', originalPos: new THREE.Vector3(0, 0.15, 0), explodeOffset: new THREE.Vector3(0, 0, 0.45) }
    inputShaftGroup.position.copy(inputShaftGroup.userData.originalPos)

    const inShaftGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.85, 20)
    inShaftGeom.rotateZ(Math.PI / 2)
    const inShaftMesh = new THREE.Mesh(inShaftGeom, this.materials.polishedSteel)
    inputShaftGroup.add(inShaftMesh)

    const primaryPinion = createGear(0.14, 0.08, 16, this.materials.forgedSteel)
    primaryPinion.position.set(-0.18, 0, 0)
    inputShaftGroup.add(primaryPinion)

    const gear3 = createGear(0.2, 0.07, 24, this.materials.forgedSteel)
    gear3.position.set(0.05, 0, 0)
    inputShaftGroup.add(gear3)

    const gear4 = createGear(0.16, 0.07, 18, this.materials.forgedSteel)
    gear4.position.set(0.22, 0, 0)
    inputShaftGroup.add(gear4)

    parts.inputShaft = inputShaftGroup
    root.add(inputShaftGroup)

    // --- Component: Countershaft (Layshaft) Cluster ---
    const counterGroup = new THREE.Group()
    counterGroup.userData = { componentId: 'countershaft', originalPos: new THREE.Vector3(0, -0.22, 0), explodeOffset: new THREE.Vector3(0, -0.4, 0) }
    counterGroup.position.copy(counterGroup.userData.originalPos)

    const layShaftGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 20)
    layShaftGeom.rotateZ(Math.PI / 2)
    const layShaftMesh = new THREE.Mesh(layShaftGeom, this.materials.forgedSteel)
    counterGroup.add(layShaftMesh)

    const layDriveGear = createGear(0.24, 0.08, 28, this.materials.forgedSteel)
    layDriveGear.position.set(-0.18, 0, 0)
    counterGroup.add(layDriveGear)

    const lay3 = createGear(0.18, 0.07, 20, this.materials.forgedSteel)
    lay3.position.set(0.05, 0, 0)
    counterGroup.add(lay3)

    const lay4 = createGear(0.22, 0.07, 26, this.materials.forgedSteel)
    lay4.position.set(0.22, 0, 0)
    counterGroup.add(lay4)

    parts.countershaft = counterGroup
    root.add(counterGroup)

    // --- Component: Synchronizer Ring & Selector Fork ---
    const forkGroup = new THREE.Group()
    forkGroup.userData = { componentId: 'shiftFork', originalPos: new THREE.Vector3(0.13, 0.15, 0), explodeOffset: new THREE.Vector3(0, 0.45, 0) }
    forkGroup.position.copy(forkGroup.userData.originalPos)

    const synchroGeom = new THREE.TorusGeometry(0.09, 0.02, 12, 28)
    synchroGeom.rotateY(Math.PI / 2)
    const synchroMesh = new THREE.Mesh(synchroGeom, this.materials.brass)
    forkGroup.add(synchroMesh)

    const sleeveGeom = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 24, 1, true)
    sleeveGeom.rotateZ(Math.PI / 2)
    const sleeveMesh = new THREE.Mesh(sleeveGeom, this.materials.polishedSteel)
    forkGroup.add(sleeveMesh)

    const forkCurveGeom = new THREE.TorusGeometry(0.13, 0.02, 8, 24, Math.PI)
    forkCurveGeom.rotateZ(Math.PI / 2)
    const forkCurveMesh = new THREE.Mesh(forkCurveGeom, this.materials.forgedSteel)
    forkCurveMesh.position.set(0, 0.05, 0)
    forkGroup.add(forkCurveMesh)

    const railGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.4, 16)
    railGeom.rotateZ(Math.PI / 2)
    const railMesh = new THREE.Mesh(railGeom, this.materials.polishedSteel)
    railMesh.position.set(0, 0.22, 0)
    forkGroup.add(railMesh)

    parts.shiftFork = forkGroup
    root.add(forkGroup)

    // Setup kinematic animation driver
    root.userData = {
      type: 'gearbox',
      parts,
      shaftAngle: 0,
      updateKinematics: (delta, isRunning) => {
        if (!isRunning) return
        root.userData.shaftAngle += delta * 4.0

        const ang = root.userData.shaftAngle
        inputShaftGroup.rotation.x = ang
        counterGroup.rotation.x = -ang * (16 / 28)
      }
    }

    return root
  }

  /**
   * Apply Exploded View factor (0 = fully assembled, 1 = fully exploded)
   */
  setExplodeFactor(machineRoot, factor) {
    if (!machineRoot || !machineRoot.userData || !machineRoot.userData.parts) return

    const parts = machineRoot.userData.parts
    for (let key in parts) {
      const part = parts[key]
      if (part && part.userData && part.userData.originalPos && part.userData.explodeOffset) {
        part.position.copy(part.userData.originalPos).addScaledVector(part.userData.explodeOffset, factor)
      }
    }
  }

  /**
   * Highlight a specific part by componentId
   */
  highlightComponent(machineRoot, componentId) {
    if (!machineRoot || !machineRoot.userData || !machineRoot.userData.parts) return

    machineRoot.traverse((node) => {
      if (node.isMesh) {
        if (!node.userData.originalMaterial) {
          node.userData.originalMaterial = node.material
        }

        // Check if ancestor belongs to componentId
        let curr = node
        let matches = false
        while (curr && curr !== machineRoot) {
          if (curr.userData && curr.userData.componentId === componentId) {
            matches = true
            break
          }
          curr = curr.parent
        }

        if (componentId === null) {
          // Restore all
          node.material = node.userData.originalMaterial
        } else if (matches) {
          node.material = this.materials.highlightGlow
        } else {
          // Dim or keep standard
          node.material = node.userData.originalMaterial
        }
      }
    })
  }
}
