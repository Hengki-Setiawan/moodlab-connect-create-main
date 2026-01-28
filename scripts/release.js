import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const run = (command) => {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
};

try {
    // 1. Build
    console.log('Building...');
    run('npm run build');

    // 2. Bump version (no git tag/commit yet)
    // Get type from args (patch, minor, major), default to patch
    const type = process.argv[2] || 'patch';
    console.log(`Bumping version (${type})...`);
    run(`npm version ${type} --no-git-tag-version`);

    // 3. Get new version
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
    const version = packageJson.version;
    console.log(`New version: ${version}`);

    // 4. Commit and Tag
    console.log('Committing and Tagging...');
    run('git add .');
    run(`git commit -m "v${version}" --no-verify`);
    run(`git tag v${version}`);

    // 5. Push
    console.log('Pushing...');
    run('git push');
    run('git push --tags');

    console.log('Release successful!');
} catch (error) {
    console.error('Release failed:', error.message);
    process.exit(1);
}
