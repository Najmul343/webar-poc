import * as THREE from 'three'

export function createShadowPlane() {
  const geometry = new THREE.PlaneGeometry(3, 3)
  // ShadowMaterial only renders the shadow received from directional lights
  const material = new THREE.ShadowMaterial({
    opacity: 0.45
  })
  
  const plane = new THREE.Mesh(geometry, material)
  plane.rotation.x = -Math.PI / 2
  plane.receiveShadow = true
  plane.name = 'AR_Shadow_Plane'
  return plane
}
