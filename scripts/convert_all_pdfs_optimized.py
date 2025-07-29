#!/usr/bin/env python3
"""
Convert all Tree Doctor PDFs with optimized settings
Based on successful test with 제11회 PDF
"""
import subprocess
import time
import os
import json
from pathlib import Path
from datetime import datetime

# PDF files to convert (excluding already converted)
pdf_files = [
    "/Users/voidlight/Downloads/[Codekiller]제5회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제6회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제7회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제8회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제9회 기출문제 해설집(v1.0).pdf",
    "/Users/voidlight/Downloads/[Codekiller]제10회 기출문제 해설집(v1.0).pdf"
]

output_dir = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/marker-output"
log_file = "/Users/voidlight/tree-doctor-pdf-qa-mcp/data/conversion_log.json"

# Initialize log
conversion_log = {
    "start_time": datetime.now().isoformat(),
    "total_pdfs": len(pdf_files),
    "conversions": []
}

print(f"📚 Tree Doctor PDF Conversion")
print(f"📁 Output directory: {output_dir}")
print(f"📄 PDFs to convert: {len(pdf_files)}")
print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)

total_start = time.time()
successful = 0
failed = 0

for i, pdf_path in enumerate(pdf_files, 1):
    pdf_name = os.path.basename(pdf_path)
    pdf_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    
    print(f"\n[{i}/{len(pdf_files)}] Converting: {pdf_name}")
    print(f"    Size: {pdf_size_mb:.1f} MB")
    
    # Check if already converted
    output_name = pdf_name.replace('.pdf', '')
    expected_output = Path(output_dir) / output_name / f"{output_name}.md"
    
    if expected_output.exists():
        print(f"    ⏭️  Already converted, skipping...")
        successful += 1
        conversion_log["conversions"].append({
            "pdf": pdf_name,
            "status": "skipped",
            "message": "Already converted"
        })
        continue
    
    # Create temporary directory for this PDF
    temp_dir = f"/tmp/marker_{int(time.time())}_{i}"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Create symlink
    pdf_link = os.path.join(temp_dir, pdf_name)
    os.symlink(pdf_path, pdf_link)
    
    # Prepare conversion command
    cmd = [
        "marker",
        temp_dir,
        "--output_dir", output_dir,
        "--force_ocr",
        "--output_format", "markdown",
        "--disable_multiprocessing",  # Avoid memory issues
        "--max_files", "1"
    ]
    
    start_time = time.time()
    print(f"    🚀 Starting conversion...")
    
    try:
        # Run conversion with timeout based on file size (10 min per 10MB)
        timeout_minutes = max(10, int(pdf_size_mb / 10) * 10)
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_minutes * 60
        )
        
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            # Check for output
            if expected_output.exists():
                size_kb = expected_output.stat().st_size / 1024
                print(f"    ✅ Success! ({elapsed:.1f}s, {size_kb:.1f} KB)")
                successful += 1
                
                conversion_log["conversions"].append({
                    "pdf": pdf_name,
                    "status": "success",
                    "duration_seconds": elapsed,
                    "output_size_kb": size_kb,
                    "throughput": f"{40 / elapsed:.2f} pages/sec" if "40" in result.stdout else "N/A"
                })
            else:
                print(f"    ❌ Conversion completed but no output file found")
                failed += 1
                conversion_log["conversions"].append({
                    "pdf": pdf_name,
                    "status": "failed",
                    "message": "No output file found"
                })
        else:
            print(f"    ❌ Failed with error code: {result.returncode}")
            if result.stderr:
                print(f"    Error: {result.stderr[:200]}...")
            failed += 1
            
            conversion_log["conversions"].append({
                "pdf": pdf_name,
                "status": "failed",
                "error_code": result.returncode,
                "error": result.stderr[:500] if result.stderr else None
            })
            
    except subprocess.TimeoutError:
        elapsed = time.time() - start_time
        print(f"    ❌ Timeout after {elapsed:.1f}s ({timeout_minutes} minute limit)")
        failed += 1
        
        conversion_log["conversions"].append({
            "pdf": pdf_name,
            "status": "timeout",
            "timeout_minutes": timeout_minutes
        })
        
    except Exception as e:
        print(f"    ❌ Error: {e}")
        failed += 1
        
        conversion_log["conversions"].append({
            "pdf": pdf_name,
            "status": "error",
            "error": str(e)
        })
        
    finally:
        # Cleanup
        import shutil
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
    
    # Save progress log after each conversion
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(conversion_log, f, ensure_ascii=False, indent=2)

# Final summary
total_elapsed = time.time() - total_start
conversion_log["end_time"] = datetime.now().isoformat()
conversion_log["total_duration_seconds"] = total_elapsed
conversion_log["successful"] = successful
conversion_log["failed"] = failed

print("\n" + "=" * 60)
print(f"📊 Conversion Summary")
print(f"✅ Successful: {successful}")
print(f"❌ Failed: {failed}")
print(f"⏱️  Total time: {total_elapsed:.1f}s ({total_elapsed/60:.1f} minutes)")
if successful > 0:
    print(f"📈 Average time per PDF: {total_elapsed/successful:.1f}s")

# List all converted files
print(f"\n📁 Converted files in {output_dir}:")
md_files = list(Path(output_dir).rglob("*.md"))
total_size_mb = 0
for md_file in sorted(md_files):
    size_kb = md_file.stat().st_size / 1024
    total_size_mb += size_kb / 1024
    rel_path = md_file.relative_to(output_dir)
    print(f"  - {rel_path} ({size_kb:.1f} KB)")

print(f"\n📊 Total markdown size: {total_size_mb:.2f} MB")

# Save final log
with open(log_file, 'w', encoding='utf-8') as f:
    json.dump(conversion_log, f, ensure_ascii=False, indent=2)
print(f"\n💾 Conversion log saved to: {log_file}")

print(f"\n✨ Conversion process completed!")