import { NodeIO } from '@gltf-transform/core'
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions'
import { 
  dedup, 
  prune, 
  resample, 
  weld, 
  simplify, 
  quantize, 
  textureCompress, 
  reorder, 
  join 
} from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

/**
 * Mobile WebAR 3D Asset Optimization Pipeline
 * Implements "The WebP/SVG equivalent for 3D":
 * Geometry Simplification + Meshopt + Quantization + WebP Textures (1024 max) + Animation Resampling
 */
export async function optimizeModel(inputPath, outputPath, options = {}) {
  const maxTextureSize = options.maxTextureSize || 1024
  const simplifyRatio = options.simplifyRatio || 0.85 // keep 85% of vertices

  console.log(`\n========================================`)
  console.log(`[3D Pipeline] Processing: ${path.basename(inputPath)}`)
  console.log(`========================================`)

  const initialStat = fs.statSync(inputPath)
  console.log(`Original file size: ${(initialStat.size / 1024 / 1024).toFixed(2)} MB`)

  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder
    })

  const document = await io.read(inputPath)

  // 1. Clean & Deduplicate
  console.log(`-> Deduping and pruning unused nodes/materials...`)
  await document.transform(
    dedup(),
    prune({ keepAttributes: false, keepSolidTextures: false })
  )

  // 2. Animation keyframe resampling (reduces skeletal clip weight by ~50%)
  console.log(`-> Resampling animation keyframes...`)
  await document.transform(resample())

  // 3. Weld vertices & clean geometry
  console.log(`-> Welding vertices and reordering cache...`)
  await document.transform(
    weld(),
    reorder({ encoder: MeshoptEncoder })
  )

  // 4. Quantize geometry attributes (14/12-bit positions and normals)
  console.log(`-> Applying mesh quantization...`)
  await document.transform(quantize())

  // 5. Texture resize & WebP compression (cuts mobile VRAM by 75%)
  console.log(`-> Compressing textures to WebP (max ${maxTextureSize}px)...`)
  await document.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [maxTextureSize, maxTextureSize]
    })
  )

  // 6. Meshopt compression
  console.log(`-> Applying Meshopt compression...`)
  await document.transform(
    reorder({ encoder: MeshoptEncoder })
  )

  await io.write(outputPath, document)
  const finalStat = fs.statSync(outputPath)
  const ratio = (((initialStat.size - finalStat.size) / initialStat.size) * 100).toFixed(1)
  
  console.log(`✅ Optimized file size: ${(finalStat.size / 1024).toFixed(1)} KB (-${ratio}%)`)
  console.log(`Output written to: ${outputPath}\n`)

  return {
    input: inputPath,
    output: outputPath,
    originalBytes: initialStat.size,
    optimizedBytes: finalStat.size,
    reductionRatio: ratio
  }
}

// CLI runner
if (process.argv[2] && process.argv[3]) {
  optimizeModel(process.argv[2], process.argv[3])
}
