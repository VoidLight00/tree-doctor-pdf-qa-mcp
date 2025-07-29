#!/usr/bin/env python3
"""Test single PDF conversion"""
import subprocess
import time
import os

pdf_file = "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf"
output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"
marker_cmd = os.path.expanduser("~/marker-env/bin/marker_single")

print(f"Testing conversion of: {os.path.basename(pdf_file)}")
print(f"Output directory: {output_dir}\n")

start_time = time.time()

cmd = [
    marker_cmd,
    pdf_file,
    "--output_dir", output_dir,
    "--force_ocr",
    "--output_format", "markdown",
    "--debug"  # Enable debug mode for more info
]

print(f"Running command: {' '.join(cmd)}\n")

try:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    elapsed = time.time() - start_time
    
    print(f"Return code: {result.returncode}")
    print(f"Time elapsed: {elapsed:.1f}s\n")
    
    if result.stdout:
        print("STDOUT:")
        print(result.stdout[:1000])
        print("...\n")
    
    if result.stderr:
        print("STDERR:")
        print(result.stderr[:1000])
        print("...\n")
        
except subprocess.TimeoutError:
    print(f"Timeout after 300 seconds")
except Exception as e:
    print(f"Error: {e}")

# Check output files
import glob
md_files = glob.glob(os.path.join(output_dir, "*.md"))
print(f"\nMarkdown files in output directory:")
for f in md_files:
    size = os.path.getsize(f) / 1024
    print(f"  - {os.path.basename(f)} ({size:.1f} KB)")