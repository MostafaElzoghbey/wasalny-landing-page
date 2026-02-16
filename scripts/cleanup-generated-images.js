import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT_DIR, 'public/assets/images');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// Recursively get all files
async function getFiles(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

// Check if file is a generated variant
function isGeneratedFile(file) {
    const basename = path.basename(file);
    const ext = path.extname(file).toLowerCase();

    // All .webp and .avif are generated
    if (['.webp', '.avif'].includes(ext)) {
        return true;
    }

    // Resized JPEGs/PNGs (e.g., image-640.jpeg, image-1024.png)
    const hasSize = /-\d{3,4}\.(jpeg|jpg|png)$/i.test(basename);
    if (hasSize) {
        return true;
    }

    // Files with -optimized suffix
    if (basename.includes('-optimized')) {
        return true;
    }

    return false;
}

// Ask user for confirmation
function askConfirmation(message) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(`${message} (yes/no): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

async function cleanupGeneratedFiles() {
    console.log('🔍 Scanning for generated files...\n');

    const allFiles = await getFiles(IMAGES_DIR);
    const generatedFiles = allFiles.filter(isGeneratedFile);

    if (generatedFiles.length === 0) {
        console.log('✓ No generated files found. Directory is clean!');
        return;
    }

    console.log(`Found ${generatedFiles.length} generated files:\n`);

    // Group by type for better display
    const byType = {
        webp: generatedFiles.filter(f => f.endsWith('.webp')),
        avif: generatedFiles.filter(f => f.endsWith('.avif')),
        resizedJpeg: generatedFiles.filter(f => /-\d{3,4}\.(jpeg|jpg|png)$/i.test(f)),
        other: generatedFiles.filter(f =>
            !f.endsWith('.webp') &&
            !f.endsWith('.avif') &&
            !/-\d{3,4}\.(jpeg|jpg|png)$/i.test(f)
        )
    };

    console.log(`  WebP files:         ${byType.webp.length}`);
    console.log(`  AVIF files:         ${byType.avif.length}`);
    console.log(`  Resized JPEGs/PNGs: ${byType.resizedJpeg.length}`);
    if (byType.other.length > 0) {
        console.log(`  Other:              ${byType.other.length}`);
    }
    console.log('');

    // Calculate total size
    let totalSize = 0;
    for (const file of generatedFiles) {
        try {
            const stats = fs.statSync(file);
            totalSize += stats.size;
        } catch (err) {
            if (err.code === 'ENOENT') {
                // File was already removed, skip
            } else {
                console.error(`  ✗ Failed to stat ${path.relative(ROOT_DIR, file)}: ${err.message}`);
            }
        }
    }

    console.log(`Total size to be freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - Showing first 10 files that would be deleted:\n');
        generatedFiles.slice(0, 10).forEach(file => {
            console.log(`  - ${path.relative(ROOT_DIR, file)}`);
        });
        if (generatedFiles.length > 10) {
            console.log(`  ... and ${generatedFiles.length - 10} more files`);
        }
        console.log('\n✓ Dry run complete. Run without --dry-run to actually delete files.');
        return;
    }

    // Ask for confirmation unless --force is used
    if (!FORCE) {
        const confirmed = await askConfirmation(
            '⚠️  This will permanently delete all generated image files. Continue?'
        );

        if (!confirmed) {
            console.log('❌ Cleanup cancelled.');
            return;
        }
    }

    // Delete files
    console.log('\n🗑️  Deleting files...\n');

    let deleted = 0;
    let failed = 0;

    for (const file of generatedFiles) {
        try {
            fs.unlinkSync(file);
            deleted++;

            // Show progress every 50 files
            if (deleted % 50 === 0) {
                console.log(`  Deleted ${deleted}/${generatedFiles.length} files...`);
            }
        } catch (err) {
            console.error(`  ✗ Failed to delete ${path.relative(ROOT_DIR, file)}: ${err.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Cleanup Complete!\n');
    console.log(`  ✓ Deleted: ${deleted} files`);
    if (failed > 0) {
        console.log(`  ✗ Failed:  ${failed} files`);
    }
    console.log(`  💾 Freed:   ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('='.repeat(60));
}

// Run cleanup
cleanupGeneratedFiles().catch(err => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
});