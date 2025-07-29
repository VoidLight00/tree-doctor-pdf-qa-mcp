#!/usr/bin/env python3
"""Test conversion using main marker command"""
import subprocess
import os
import time

# Create a temporary directory with just one PDF
test_dir = "/tmp/test_marker_single"
os.makedirs(test_dir, exist_ok=True)

# Create symlink to one PDF
pdf_source = "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf"
pdf_link = os.path.join(test_dir, os.path.basename(pdf_source))

if os.path.exists(pdf_link):
    os.unlink(pdf_link)
os.symlink(pdf_source, pdf_link)

output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"
marker_cmd = os.path.expanduser("~/marker-env/bin/marker")

print(f"Testing conversion with main marker command")
print(f"Input: {pdf_link}")
print(f"Output: {output_dir}\n")

start_time = time.time()

cmd = [
    marker_cmd,
    test_dir,
    "--output_dir", output_dir,
    "--force_ocr",
    "--output_format", "markdown",
    "--max_files", "1"  # Process only 1 file
]

print(f"Running: {' '.join(cmd)}\n")

try:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    elapsed = time.time() - start_time
    
    print(f"Return code: {result.returncode}")
    print(f"Time elapsed: {elapsed:.1f}s\n")
    
    if result.stdout:
        print("Output:")
        print(result.stdout)
    
    if result.stderr:
        print("\nErrors:")
        print(result.stderr)
        
except subprocess.TimeoutError:
    print(f"Timeout after 300 seconds")
except Exception as e:
    print(f"Error: {e}")
finally:
    # Cleanup
    import shutil
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

# Check output files
print("\n" + "="*60)
print("Output files:")
output_path = os.path.join(output_dir, "[Codekiller]제5회 기출문제 해설집(v1.0)")
if os.path.exists(output_path):
    for root, dirs, files in os.walk(output_path):
        for file in files:
            filepath = os.path.join(root, file)
            size = os.path.getsize(filepath) / 1024
            rel_path = os.path.relpath(filepath, output_dir)
            print(f"  - {rel_path} ({size:.1f} KB)")