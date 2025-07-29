#!/usr/bin/env python3
"""
Convert Tree Doctor PDFs sequentially
"""
import os
import sys
import subprocess
import time
from pathlib import Path

# PDF files to convert
pdf_files = [
    "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"
]

output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"

# Check if marker command is available
marker_cmd = os.path.expanduser("~/marker-env/bin/marker")

if not os.path.exists(marker_cmd):
    print(f"Error: marker command not found at {marker_cmd}")
    sys.exit(1)

print(f"📚 Converting {len(pdf_files)} PDFs sequentially...")
print(f"📁 Output directory: {output_dir}\n")

total_start = time.time()
successful = 0
failed = 0

for i, pdf_path in enumerate(pdf_files, 1):
    pdf_name = os.path.basename(pdf_path)
    print(f"\n[{i}/{len(pdf_files)}] Converting: {pdf_name}")
    
    if not os.path.exists(pdf_path):
        print(f"  ❌ File not found!")
        failed += 1
        continue
    
    start_time = time.time()
    
    # Run marker command
    cmd = [
        marker_cmd,
        pdf_path,
        "--output", output_dir,
        "--force_ocr",  # Force OCR for Korean text
        "--output_format", "markdown"
    ]
    
    try:
        # Run with timeout of 5 minutes per file
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            elapsed = time.time() - start_time
            print(f"  ✅ Success! ({elapsed:.1f}s)")
            successful += 1
            
            # Check output file
            output_file = Path(output_dir) / pdf_name.replace('.pdf', '.md')
            if output_file.exists():
                size = output_file.stat().st_size / 1024  # KB
                print(f"  📄 Output: {output_file.name} ({size:.1f} KB)")
        else:
            print(f"  ❌ Failed with error code: {result.returncode}")
            if result.stderr:
                print(f"  Error: {result.stderr[:200]}...")
            failed += 1
            
    except subprocess.TimeoutError:
        elapsed = time.time() - start_time
        print(f"  ❌ Timeout after {elapsed:.1f}s")
        failed += 1
    except Exception as e:
        print(f"  ❌ Error: {e}")
        failed += 1

total_elapsed = time.time() - total_start
print(f"\n{'='*60}")
print(f"📊 Conversion Summary:")
print(f"  ✅ Successful: {successful}")
print(f"  ❌ Failed: {failed}")
print(f"  ⏱️  Total time: {total_elapsed:.1f}s")
print(f"  📁 Output directory: {output_dir}")

if successful > 0:
    print(f"\n✨ Successfully converted {successful} PDF(s) to markdown!")
else:
    print(f"\n❌ No PDFs were successfully converted.")
    
# List output files
print(f"\n📁 Output files:")
output_path = Path(output_dir)
if output_path.exists():
    md_files = list(output_path.glob("*.md"))
    if md_files:
        for md_file in sorted(md_files):
            size = md_file.stat().st_size / 1024
            print(f"  - {md_file.name} ({size:.1f} KB)")
    else:
        print("  No markdown files found.")