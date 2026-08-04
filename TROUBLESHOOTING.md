# Troubleshooting

## Error: ENOENT: no such file or directory, open '.../tabster/src/index.ts'

This is a sourcemap issue with the tabster dependency (used by Fluent UI React Components).

### Solution 1: Disable Source Maps (Recommended)
The .env file already includes `GENERATE_SOURCEMAP=false` which resolves this issue.

### Solution 2: Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Solution 3: Use exact versions
The package.json includes an `overrides` section for tabster.

### Solution 4: Eject and fix webpack config (Advanced)
```bash
npm run eject
# Then edit config/webpack.config.js to ignore sourcemaps for tabster
```

## Other Common Issues

### "Cannot find module '@fluentui/react-components'"
```bash
npm install @fluentui/react-components@latest
```

### "Module not found: Can't resolve '@microsoft/teams-js'"
```bash
npm install @microsoft/teams-js@latest
```

### "Invalid hook call" error
Ensure React version is 18.x and not duplicated:
```bash
npm ls react react-dom
```
