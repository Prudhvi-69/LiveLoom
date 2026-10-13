import { minify as terser } from 'terser';
import CleanCSS from 'clean-css';
import { minify as htmlMinify } from 'html-minifier-terser';
import fs from 'fs';
import path from 'path';

const DIST = 'dist';

// Clean and recreate dist/
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST);

// Copy static assets
['favicon.svg', 'Loom Logo.jpg', 'netlify.toml'].forEach(file => {
    if (fs.existsSync(file)) fs.copyFileSync(file, path.join(DIST, file));
});

// Minify CSS
const cssResult = new CleanCSS({ level: 2 }).minify(fs.readFileSync('style.css', 'utf8'));
fs.writeFileSync(path.join(DIST, 'style.css'), cssResult.styles);

const authCssResult = new CleanCSS({ level: 2 }).minify(fs.readFileSync('auth.css', 'utf8'));
fs.writeFileSync(path.join(DIST, 'auth.css'), authCssResult.styles);

// Minify JS files
const jsFiles = ['firebase.js', 'autoclose.js', 'app.js'];
for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const result = await terser(code, {
        module: true,
        compress: { drop_console: false },
        mangle: true
    });
    fs.writeFileSync(path.join(DIST, file), result.code);
}

// Minify HTML files
const htmlFiles = ['index.html', 'auth.html'];
for (const file of htmlFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const result = await htmlMinify(code, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
    });
    fs.writeFileSync(path.join(DIST, file), result);
}

console.log('Build complete → dist/');
