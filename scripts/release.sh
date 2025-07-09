#!/bin/bash

# Star Wars RPG Character Manager - Release Script
# This script helps create new releases with proper versioning for Unraid updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: $0 <version> [release-notes]"
    echo "Example: $0 1.0.1 'Bug fixes and improvements'"
    exit 1
fi

VERSION="$1"
RELEASE_NOTES="${2:-Release $VERSION}"

echo -e "${YELLOW}Creating release v$VERSION${NC}"

# Validate version format (basic semver check)
if ! echo "$VERSION" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' > /dev/null; then
    echo -e "${RED}Error: Version must be in format X.Y.Z (e.g., 1.0.1)${NC}"
    exit 1
fi

# Update VERSION file
echo "$VERSION" > VERSION
echo -e "${GREEN}✅ Updated VERSION file to $VERSION${NC}"

# Update Unraid template
sed -i.bak "s|star-wars-rpg-character-manager:v[0-9]*\.[0-9]*\.[0-9]*|star-wars-rpg-character-manager:v$VERSION|g" unraid-templates/swrpg-character-manager.xml
rm unraid-templates/swrpg-character-manager.xml.bak
echo -e "${GREEN}✅ Updated Unraid template to use v$VERSION${NC}"

# Add changes entry (this would need manual editing for now)
echo -e "${YELLOW}📝 Remember to update the <Changes> section in unraid-templates/swrpg-character-manager.xml${NC}"

# Commit changes
git add VERSION unraid-templates/swrpg-character-manager.xml
git commit -m "RELEASE: Prepare v$VERSION - $RELEASE_NOTES"

# Create and push tag
git tag -a "v$VERSION" -m "Release v$VERSION: $RELEASE_NOTES"
git push origin main
git push origin "v$VERSION"

echo -e "${GREEN}🎉 Release v$VERSION created successfully!${NC}"
echo -e "${GREEN}📦 Docker image will be built as: ghcr.io/gr3enarr0w/star-wars-rpg-character-manager:v$VERSION${NC}"
echo -e "${GREEN}🚀 Unraid will detect this as an update${NC}"

# Show GitHub Actions URL
echo -e "${YELLOW}📋 Monitor build progress at:${NC}"
echo "https://github.com/gr3enarr0w/star-wars-rpg-character-manager/actions"