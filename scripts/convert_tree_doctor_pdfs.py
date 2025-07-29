#!/usr/bin/env python3
"""
Convert specific Tree Doctor exam PDFs to markdown
"""
import os
import sys
import subprocess
from pathlib import Path

# Activate virtual environment variables
marker_env = os.path.expanduser("~/marker-env")
sys.path.insert(0, os.path.join(marker_env, "lib/python3.11/site-packages"))

# List of PDFs to convert
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
script_path = "/Users/voidlight/tree-doctor-pdf-qa-mcp/scripts/marker-parallel.py"

# Create a temporary directory with symlinks to our specific PDFs
temp_dir = "/tmp/tree_doctor_pdfs"
os.makedirs(temp_dir, exist_ok=True)

# Create symlinks
for pdf in pdf_files:
    if os.path.exists(pdf):
        link_name = os.path.join(temp_dir, os.path.basename(pdf))
        if os.path.exists(link_name):
            os.unlink(link_name)
        os.symlink(pdf, link_name)
        print(f"Linked: {os.path.basename(pdf)}")
    else:
        print(f"Warning: File not found - {pdf}")

# Run the conversion
cmd = [
    sys.executable,
    script_path,
    temp_dir,
    output_dir,
    "-w", "8",  # 8 workers
    "--force-ocr",  # Force OCR for scanned Korean PDFs
    "--overwrite",  # Overwrite if exists
    "--debug"  # Debug mode
]

print(f"\nRunning conversion with command:")
print(" ".join(cmd))
print()

try:
    result = subprocess.run(cmd, check=True)
except subprocess.CalledProcessError as e:
    print(f"Conversion failed with error code: {e.returncode}")
    sys.exit(1)
except KeyboardInterrupt:
    print("\nConversion interrupted by user")
    sys.exit(1)
finally:
    # Cleanup temp directory
    import shutil
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
        print(f"\nCleaned up temporary directory: {temp_dir}")