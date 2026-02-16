import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renamingMapPath = path.join(__dirname, '../src/data/renaming-map.json');
let renamingMap;
try {
    renamingMap = JSON.parse(fs.readFileSync(renamingMapPath, 'utf8'));
} catch (err) {
    console.error(`Failed to load renaming-map.json: ${err.message}`);
    process.exit(1);
}

const publicDir = path.join(__dirname, '../public/assets/images');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function renameImages() {
    console.log('Starting image renaming process...');

    for (const [oldRelativePath, newNameBase] of Object.entries(renamingMap)) {
        const oldPath = path.join(publicDir, oldRelativePath);
        const directory = path.dirname(oldPath);
        const extension = path.extname(oldPath);
        const newPath = path.join(directory, `${newNameBase}${extension}`);

        if (fs.existsSync(oldPath)) {
            try {
                // Move/Rename the source file
                fs.renameSync(oldPath, newPath);
                console.log(`Renamed: ${oldRelativePath} -> ${newNameBase}${extension}`);

                // Also cleanup any existing optimized versions
                const oldBaseName = path.basename(oldRelativePath, extension);
                const escapedOldBaseName = escapeRegExp(oldBaseName);
                const filesInDir = fs.readdirSync(directory);

                filesInDir.forEach(file => {
                    if (file.startsWith(oldBaseName) && file !== path.basename(oldPath) && !file.includes(newNameBase)) {
                        if (file.match(new RegExp(`^${escapedOldBaseName}(-[0-9]+)?\\.(webp|avif|jpeg|jpg)$`))) {
                            fs.unlinkSync(path.join(directory, file));
                            console.log(`  Cleaned up old variant: ${file}`);
                        }
                    }
                });
            } catch (err) {
                console.error(`Error renaming ${oldRelativePath}:`, err.message);
            }
        } else {
            console.warn(`Source file not found: ${oldPath}`);
        }
    }

    console.log('Renaming process complete.');
}

renameImages();
