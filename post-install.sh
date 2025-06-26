#!/bin/bash

# Pre-setup script for Satoshi theme development environment
# This script prepares the project structure BEFORE running CMA

echo "🏗️ Setting up Satoshi theme development project structure..."

# Check if already set up
if [ -d "satoshi-theme" ]; then
    echo "✅ Project already set up. Use 'yarn start' to run Magento."
    exit 0
fi

# 1. Move current package content into satoshi-theme subdirectory
echo "📦 Moving Satoshi theme package into ./satoshi-theme/"
mkdir -p satoshi-theme
git update-index --assume-unchanged package.json

# Move theme package files
mv src satoshi-theme/
mv composer.json satoshi-theme/
mv README.md satoshi-theme/
mv CONTRIBUTING.md satoshi-theme/
mv LICENSE.md satoshi-theme/
mv CHANGELOG.md satoshi-theme/
mv logo.png satoshi-theme/
mv .github satoshi-theme/ 2>/dev/null || echo "No .github directory"
mv .prettierrc satoshi-theme/

# Move git repository to theme package
mv .git satoshi-theme/
mv .gitignore satoshi-theme/

# 2. Create auth.json from template
echo "🔑 Creating auth.json template..."
cp auth.json.sample auth.json

# 3. Create composer.json for Magento project
echo "📄 Creating Magento composer.json with Satoshi theme repository..."
cp composer.json.sample composer.json

echo "✅ Project structure setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit auth.json and replace the following placeholders:"
echo "      - YOUR_MAGENTO_PUBLIC_KEY_HERE"
echo "      - YOUR_MAGENTO_PRIVATE_KEY_HERE" 
echo "      - YOUR_HYVA_USERNAME_HERE"
echo "      - YOUR_HYVA_TOKEN_HERE"
echo ""
echo "   2. Run: yarn start"
echo "      (This will install Magento using your configured composer.json)"
echo ""
echo "   3. Start developing:"
echo "      - Edit files in: ./satoshi-theme/src/"
echo "      - Files are automatically symlinked to vendor/"
echo "      - Only commit changes in ./satoshi-theme/" 