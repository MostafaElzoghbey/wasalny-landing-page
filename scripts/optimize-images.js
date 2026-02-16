import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';
import cliProgress from 'cli-progress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT_DIR, 'public/assets/images');

// ============================================================================
// CONFIGURATION
// ============================================================================
const WEBP_QUALITY = 60;      // Optimized for Quality 50 JPEGs
const WEBP_EFFORT = 6;        // Maximum compression effort (0-6)
const SKIP_IF_LARGER = true;  // Critical! Don't save WebP if larger than JPEG
const SIZES = [640, 1024, 1920];
const CONCURRENCY = 4;        // Process 4 images simultaneously
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Recursively get all files in a directory
 */
async function getFiles(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

/**
 * Check if image should be skipped (already optimized and newer than source)
 */
function shouldSkipImage(sourceFile, outputDir, baseName) {
    if (FORCE) return false;

    try {
        const sourceMtime = fs.statSync(sourceFile).mtime;
        const fullWebP = path.join(outputDir, `${baseName}.webp`);

        if (fs.existsSync(fullWebP)) {
            const outputMtime = fs.statSync(fullWebP).mtime;
            if (outputMtime > sourceMtime) {
                return true; // WebP is newer than source
            }
        }
    } catch (err) {
        return false;
    }

    return false;
}

/**
 * Clean up temporary files in case of errors
 */
function cleanupTempFiles(dir, baseName) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            if (file.startsWith(baseName) && file.endsWith('.tmp')) {
                fs.unlinkSync(path.join(dir, file));
            }
        });
    } catch (err) {
        // Ignore cleanup errors
    }
}

/**
 * Process a single image file
 */
async function processImage(file, stats, bar) {
    const dir = path.dirname(file);
    const ext = path.extname(file);
    const name = path.basename(file, ext);

    // Skip if already optimized and up-to-date
    if (shouldSkipImage(file, dir, name)) {
        stats.skipped++;
        bar?.increment();
        return;
    }

    if (DRY_RUN) {
        if (VERBOSE) {
            console.log(`[DRY RUN] Would process: ${path.relative(ROOT_DIR, file)}`);
        }
        stats.processed++;
        bar?.increment();
        return;
    }

    try {
        const originalSize = fs.statSync(file).size;
        const metadata = await sharp(file).metadata();

        // ====================================================================
        // STEP 1: Generate full-resolution WebP
        // ====================================================================
        const tempWebP = path.join(dir, `${name}.webp.tmp`);

        await sharp(file)
            .webp({
                quality: WEBP_QUALITY,
                effort: WEBP_EFFORT
            })
            .toFile(tempWebP);

        const webpSize = fs.statSync(tempWebP).size;

        // Only save if WebP is smaller than original
        if (SKIP_IF_LARGER && webpSize >= originalSize) {
            fs.unlinkSync(tempWebP);
            stats.skippedLarger++;

            if (VERBOSE) {
                const diff = webpSize - originalSize;
                console.log(`⊘ Skipped (larger): ${path.basename(file)} (+${(diff / 1024).toFixed(1)} KB)`);
            }
        } else {
            // WebP is smaller - save it!
            fs.renameSync(tempWebP, path.join(dir, `${name}.webp`));
            const saved = originalSize - webpSize;
            stats.bytesSaved += saved;
            stats.successful++;

            if (VERBOSE) {
                console.log(`✓ Created: ${name}.webp (-${(saved / 1024).toFixed(1)} KB)`);
            }
        }

        // ====================================================================
        // STEP 2: Generate responsive variants (640px, 1024px, 1920px)
        // ====================================================================
        for (const width of SIZES) {
            // Skip if original is smaller than or equal to target size
            if (metadata.width && metadata.width <= width) {
                continue;
            }

            const tempResized = path.join(dir, `${name}-${width}.webp.tmp`);

            await sharp(file)
                .resize(width, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .webp({
                    quality: WEBP_QUALITY,
                    effort: WEBP_EFFORT
                })
                .toFile(tempResized);

            const resizedSize = fs.statSync(tempResized).size;

            // Keep if it provides meaningful savings (at least 5%)
            if (resizedSize < originalSize * 0.95) {
                fs.renameSync(tempResized, path.join(dir, `${name}-${width}.webp`));

                if (VERBOSE) {
                    console.log(`  ✓ ${name}-${width}.webp`);
                }
            } else {
                fs.unlinkSync(tempResized);
            }
        }

        stats.processed++;

    } catch (error) {
        // Clean up any temp files on error
        cleanupTempFiles(dir, name);

        stats.errors.push({
            file: path.relative(ROOT_DIR, file),
            error: error.message
        });
        stats.failed++;

        if (VERBOSE) {
            console.error(`✗ Error: ${path.basename(file)}: ${error.message}`);
        }
    }

    bar?.increment();
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function optimizeImages() {
    console.log('🚀 WebP Image Optimizer - Production Ready\n');
    console.log('='.repeat(70));
    console.log(`📁 Source:       ${IMAGES_DIR}`);
    console.log(`📐 Sizes:        ${SIZES.join(', ')} pixels`);
    console.log(`🎨 WebP Quality: ${WEBP_QUALITY} (optimized for Q50 JPEGs)`);
    console.log(`⚙️  Effort:       ${WEBP_EFFORT} (maximum compression)`);
    console.log(`🔀 Concurrency:  ${CONCURRENCY} images at once`);
    console.log(`📊 Strategy:     ${SKIP_IF_LARGER ? 'Save only if smaller than JPEG' : 'Always save WebP'}`);

    if (DRY_RUN) {
        console.log(`🔍 Mode:         DRY RUN (no files will be created)`);
    }
    if (FORCE) {
        console.log(`⚡ Mode:         FORCE (regenerate all)`);
    }
    if (VERBOSE) {
        console.log(`💬 Mode:         VERBOSE (detailed output)`);
    }

    console.log('='.repeat(70));
    console.log('');

    // Scan for images
    console.log('🔍 Scanning for images...');
    const allFiles = await getFiles(IMAGES_DIR);

    // Filter for original images only (exclude already optimized files)
    const imageFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);
        const basename = path.basename(file);

        // Exclude files that are already optimized variants
        const isOptimized =
            basename.includes('-optimized') ||
            SIZES.some(s => basename.includes(`-${s}.`)) ||
            ext === '.webp' ||
            ext === '.avif';

        return isImage && !isOptimized;
    });

    if (imageFiles.length === 0) {
        console.log('✓ No images found to process!');
        return;
    }

    console.log(`📦 Found ${imageFiles.length} original images\n`);

    // Initialize statistics
    const stats = {
        processed: 0,
        successful: 0,      // WebP files created
        skipped: 0,         // Already optimized (cached)
        skippedLarger: 0,   // WebP would be larger
        failed: 0,          // Errors
        bytesSaved: 0,
        errors: []
    };

    // Progress bar
    const bar = new cliProgress.SingleBar({
        format: 'Progress |{bar}| {percentage}% | {value}/{total} images | ETA: {eta}s',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    if (!VERBOSE) {
        bar.start(imageFiles.length, 0);
    }

    // Process images with concurrency limit
    const limit = pLimit(CONCURRENCY);
    await Promise.all(
        imageFiles.map(file => limit(() => processImage(file, stats, VERBOSE ? null : bar)))
    );

    if (!VERBOSE) {
        bar.stop();
    }

    // ========================================================================
    // RESULTS
    // ========================================================================

    console.log('\n' + '='.repeat(70));
    console.log('✅ Optimization Complete!\n');

    console.log(`📊 Results:`);
    console.log(`   ✓ Processed:        ${stats.processed.toString().padStart(4)} images`);
    console.log(`   ├─ WebP created:    ${stats.successful.toString().padStart(4)} images`);
    console.log(`   └─ Kept as JPEG:    ${stats.skippedLarger.toString().padStart(4)} images (WebP would be larger)`);
    console.log(`   ⊘ Skipped (cached): ${stats.skipped.toString().padStart(4)} images (already optimized)`);
    console.log(`   ✗ Failed:           ${stats.failed.toString().padStart(4)} images`);

    if (!DRY_RUN && stats.successful > 0) {
        const savedMB = stats.bytesSaved / 1024 / 1024;
        const avgSavings = (stats.bytesSaved / stats.successful / 1024).toFixed(1);
        const successRate = stats.processed > 0
            ? ((stats.successful / stats.processed) * 100).toFixed(0)
            : "0";

        console.log(`\n💾 Savings:`);
        console.log(`   Total saved:     ${savedMB.toFixed(2)} MB`);
        console.log(`   Avg per image:   ${avgSavings} KB`);
        console.log(`   Success rate:    ${successRate}% of images benefit from WebP`);
    }

    // Show errors if any
    if (stats.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered:`);
        const errorsToShow = stats.errors.slice(0, 5);
        errorsToShow.forEach(({ file, error }) => {
            console.log(`   ✗ ${file}: ${error}`);
        });
        if (stats.errors.length > 5) {
            console.log(`   ... and ${stats.errors.length - 5} more errors`);
        }
    }

    console.log('='.repeat(70));

    // Recommendations
    if (!DRY_RUN && stats.processed > 0) {
        console.log('\n📌 Recommendations:\n');

        const successRate = stats.successful / stats.processed;

        if (successRate > 0.7) {
            console.log('   ✅ Excellent! Most images benefit from WebP conversion.');
            console.log('   ✅ Use <picture> elements with WebP + JPEG fallback.');
        } else if (successRate > 0.4) {
            console.log('   ⚠️  Mixed results. Some images benefit from WebP.');
            console.log('   💡 Consider using WebP only for images >100KB.');
        } else {
            console.log('   ℹ️  Your JPEGs are well-compressed - WebP has limited benefit.');
            console.log('   💡 Consider keeping most images as JPEG.');
        }

        if (stats.skippedLarger > stats.successful) {
            console.log('\n   💡 Tip: Most images are already well-optimized as JPEG.');
            console.log('      Consider using a CDN with automatic optimization instead.');
        }

        console.log('\n📖 Next steps:');
        console.log('   1. Update HTML to use <picture> elements with srcset');
        console.log('   2. Test in Chrome DevTools (Network tab)');
        console.log('   3. Run Lighthouse to verify performance gains');
        console.log('   4. Monitor Core Web Vitals in production\n');
    }

    if (DRY_RUN) {
        console.log('\n💡 This was a dry run. Run without --dry-run to optimize images.\n');
    }
}

// ============================================================================
// RUN
// ============================================================================

optimizeImages().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});