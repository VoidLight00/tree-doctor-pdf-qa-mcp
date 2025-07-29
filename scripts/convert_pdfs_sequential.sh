#!/bin/bash

# Activate virtual environment
source ~/marker-env/bin/activate

# Output directory
OUTPUT_DIR="/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"

# PDF files to convert
PDFS=(
    "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf"
    "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf"
    "/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf"
    "/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf"
    "/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf"
    "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
    "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"
)

echo "🚀 Starting PDF conversion..."
echo "📁 Output directory: $OUTPUT_DIR"
echo "📚 Total PDFs to convert: ${#PDFS[@]}"
echo "================================"

# Counter for progress
COUNT=0
SUCCESS=0
FAILED=0

# Process each PDF
for PDF in "${PDFS[@]}"; do
    COUNT=$((COUNT + 1))
    BASENAME=$(basename "$PDF")
    echo ""
    echo "[$COUNT/${#PDFS[@]}] Converting: $BASENAME"
    echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Create temporary directory with single PDF
    TEMP_DIR="/tmp/marker_single_$$"
    mkdir -p "$TEMP_DIR"
    ln -s "$PDF" "$TEMP_DIR/$BASENAME"
    
    # Run marker
    START_TIME=$(date +%s)
    
    if gtimeout 1200 marker "$TEMP_DIR" \
        --output_dir "$OUTPUT_DIR" \
        --force_ocr \
        --output_format markdown \
        --max_files 1; then
        
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo "✅ Success! Duration: ${DURATION}s"
        SUCCESS=$((SUCCESS + 1))
        
        # Check output
        OUTPUT_NAME="${BASENAME%.pdf}"
        if [ -d "$OUTPUT_DIR/$OUTPUT_NAME" ]; then
            MD_FILE=$(find "$OUTPUT_DIR/$OUTPUT_NAME" -name "*.md" | head -1)
            if [ -n "$MD_FILE" ]; then
                SIZE=$(du -h "$MD_FILE" | cut -f1)
                echo "📄 Output: $(basename "$MD_FILE") ($SIZE)"
            fi
        fi
    else
        echo "❌ Failed or timed out after 20 minutes"
        FAILED=$((FAILED + 1))
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    echo "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
done

echo ""
echo "================================"
echo "📊 Conversion Summary:"
echo "✅ Successful: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "📁 Output directory: $OUTPUT_DIR"

# List all markdown files
echo ""
echo "📄 Generated markdown files:"
find "$OUTPUT_DIR" -name "*.md" -type f | while read -r file; do
    SIZE=$(du -h "$file" | cut -f1)
    echo "  - $(basename "$file") ($SIZE)"
done