#!/bin/bash
# Generate PWA icons from SVG

echo "🎨 Generating PWA icons..."

# Check if sips (macOS tool) is available
if command -v sips &> /dev/null; then
    echo "Using sips (macOS) to generate icons..."

    # For macOS, we can use sips to resize
    # First, we need to convert SVG to PNG at high resolution, then resize
    echo "Note: sips cannot directly convert SVG. Please use one of these methods:"
    echo ""
    echo "Option 1: Install ImageMagick"
    echo "  brew install imagemagick"
    echo "  then run:"
    echo "  convert -background none public/icon.svg -resize 192x192 public/icon-192.png"
    echo "  convert -background none public/icon.svg -resize 512x512 public/icon-512.png"
    echo ""
    echo "Option 2: Use online tool"
    echo "  1. Go to https://realfavicongenerator.net/"
    echo "  2. Upload public/icon.svg"
    echo "  3. Download and extract icons to public/ folder"
    echo ""
    echo "Option 3: Use VS Code or design tool"
    echo "  - Open icon.svg in a design tool"
    echo "  - Export as PNG at 192x192 and 512x512"
    echo "  - Save as icon-192.png and icon-512.png in public/ folder"

elif command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    convert -background none public/icon.svg -resize 192x192 public/icon-192.png
    convert -background none public/icon.svg -resize 512x512 public/icon-512.png

    # Also create apple-touch-icon
    convert -background none public/icon.svg -resize 180x180 public/apple-touch-icon.png

    echo "✅ Icons generated successfully!"
    echo "  - public/icon-192.png"
    echo "  - public/icon-512.png"
    echo "  - public/apple-touch-icon.png"
else
    echo "⚠️  No image conversion tool found."
    echo ""
    echo "Please generate icons manually:"
    echo "1. Open public/icon.svg in your browser or design tool"
    echo "2. Take screenshots or export at these sizes:"
    echo "   - 192x192 px → save as public/icon-192.png"
    echo "   - 512x512 px → save as public/icon-512.png"
    echo "   - 180x180 px → save as public/apple-touch-icon.png"
fi

echo ""
echo "📱 After generating icons, rebuild and redeploy:"
echo "   npm run build"
echo "   firebase deploy --only hosting"
