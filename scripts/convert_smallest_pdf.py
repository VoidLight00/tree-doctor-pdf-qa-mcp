#!/usr/bin/env python3
"""Convert the smallest PDF first as a test"""
import subprocess
import time
import os
from pathlib import Path

# Start with the smallest PDF
pdf_file = "/Users/voidlight/Downloads/제11회 나무의사 자격시험 1차 시험지.pdf"
output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"

# Create a temporary directory
temp_dir = f"/tmp/marker_test_{int(time.time())}"
os.makedirs(temp_dir, exist_ok=True)

# Create symlink
pdf_link = os.path.join(temp_dir, os.path.basename(pdf_file))
os.symlink(pdf_file, pdf_link)

print(f"🧪 Testing Marker with smallest PDF (2.1MB)")
print(f"📄 File: {os.path.basename(pdf_file)}")
print(f"📁 Output: {output_dir}")
print(f"🚀 Starting conversion...\n")

start_time = time.time()

# Run marker with minimal settings
cmd = [
    "marker",
    temp_dir,
    "--output_dir", output_dir,
    "--force_ocr",
    "--output_format", "markdown",
    "--disable_multiprocessing",  # Disable multiprocessing to avoid memory issues
    "--max_files", "1"
]

print(f"Command: {' '.join(cmd)}\n")

try:
    # Run without timeout to see how long it takes
    result = subprocess.run(cmd, 
                          capture_output=True, 
                          text=True,
                          env={**os.environ, "PYTHONUNBUFFERED": "1"})
    
    elapsed = time.time() - start_time
    
    print(f"\n⏱️  Completed in {elapsed:.1f}s ({elapsed/60:.1f} minutes)")
    print(f"Return code: {result.returncode}")
    
    if result.stdout:
        print("\nOutput:")
        print(result.stdout[-2000:])  # Last 2000 chars
    
    if result.stderr:
        print("\nErrors/Progress:")
        print(result.stderr[-2000:])  # Last 2000 chars
        
    # Check for output
    output_name = os.path.basename(pdf_file).replace('.pdf', '')
    output_path = Path(output_dir) / output_name
    
    if output_path.exists():
        md_files = list(output_path.glob("*.md"))
        if md_files:
            print(f"\n✅ Success! Generated {len(md_files)} markdown file(s):")
            for md_file in md_files:
                size = md_file.stat().st_size / 1024
                print(f"  - {md_file.name} ({size:.1f} KB)")
                
                # Show preview
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read(500)
                    print(f"\nPreview of {md_file.name}:")
                    print("-" * 50)
                    print(content)
                    print("-" * 50)
        else:
            print(f"\n⚠️  Output directory created but no .md files found")
    else:
        print(f"\n❌ No output directory created at {output_path}")
        
except KeyboardInterrupt:
    elapsed = time.time() - start_time
    print(f"\n\n⚠️  Interrupted after {elapsed:.1f}s")
except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    # Cleanup
    import shutil
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
        print(f"\n🧹 Cleaned up temporary directory")