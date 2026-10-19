/**
 * Skrip Pemeriksa Batas Impor Arsitektural (§3.6, AC-00.2, T-00.1)
 *
 * Menegakkan aturan arsitektur monorepo:
 * - Komponen UI, routes, domain, dan features DILARANG mengimpor dari drivers/mock/*.
 * - Seluruh akses data wajib melalui ApiClient / Domain Service.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const RESTRICTED_DIRS = [
	path.join(srcDir, 'lib', 'components'),
	path.join(srcDir, 'lib', 'ui'),
	path.join(srcDir, 'lib', 'domain'),
	path.join(srcDir, 'lib', 'features'),
	path.join(srcDir, 'lib', 'services'),
	path.join(srcDir, 'routes')
];

const FORBIDDEN_IMPORT_PATTERNS = [
	/from\s+['"][^'"]*drivers\/mock[^'"]*['"]/g,
	/import\s+['"][^'"]*drivers\/mock[^'"]*['"]/g,
	/import\s*\([^)]*drivers\/mock[^)]*\)/g
];

let violations = [];

function checkFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');

	lines.forEach((line, index) => {
		FORBIDDEN_IMPORT_PATTERNS.forEach((pattern) => {
			if (pattern.test(line)) {
				violations.push({
					file: path.relative(rootDir, filePath),
					line: index + 1,
					content: line.trim()
				});
			}
		});
	});
}

function scanDir(dirPath) {
	if (!fs.existsSync(dirPath)) return;

	const entries = fs.readdirSync(dirPath, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			scanDir(fullPath);
		} else if (/\.(svelte|ts|js)$/.test(entry.name) && !entry.name.includes('.test.')) {
			checkFile(fullPath);
		}
	}
}

console.log('🔍 Menjalankan pemeriksaan batas modul impor arsitektur (§3.6)...');

RESTRICTED_DIRS.forEach((dir) => scanDir(dir));

if (violations.length > 0) {
	console.error('\n❌ PELANGGARAN ARSITEKTUR TERDETEKSI:');
	console.error('Komponen UI atau domain dilarang mengimpor dari drivers/mock/*:');
	violations.forEach((v) => {
		console.error(`  - ${v.file}:${v.line} -> ${v.content}`);
	});
	console.error('\nPerbaiki impor dengan menggunakan ApiClient atau Service terpusat.\n');
	process.exit(1);
} else {
	console.log('✅ Seluruh batas modul bersih: Tidak ada komponen atau rute yang mengimpor dari drivers/mock/*.\n');
	process.exit(0);
}
