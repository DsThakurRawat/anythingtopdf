import os
import shutil
import zipfile

# Paths
base_dir = "/home/divyansh-rawat/anythingtopdf"
zip_path = os.path.join(base_dir, "test.zip")
extract_dir = os.path.join(base_dir, "whatsapp_extracted")

if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)
os.makedirs(extract_dir)

# Unzip fresh again
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)

files = []
for root, _, filenames in os.walk(extract_dir):
    for f in filenames:
        files.append(os.path.join(root, f))

# Sort alphabetically to get consistent base sequence
files.sort()

# Rename sequentially, but override the first three indices
renamed_files = []
for idx, filepath in enumerate(files, start=1):
    ext = os.path.splitext(filepath)[1]
    
    # Custom mapping logic as requested:
    # 3rd file alphabetically -> position 1
    # 1st file alphabetically -> position 2
    # 2nd file alphabetically -> position 3
    final_idx = idx
    if idx == 1:
        final_idx = 2
    elif idx == 2:
        final_idx = 3
    elif idx == 3:
        final_idx = 1
        
    new_name = f"img-{final_idx:02d}{ext}"
    new_path = os.path.join(extract_dir, new_name)
    os.rename(filepath, new_path)
    renamed_files.append(new_path)

# Repackage into a new zip
new_zip_path = os.path.join(base_dir, "whatsapp_renamed.zip")
with zipfile.ZipFile(new_zip_path, 'w') as zipf:
    for file in renamed_files:
        zipf.write(file, arcname=os.path.basename(file))

print(f"Renamed {len(renamed_files)} files with custom order. Saved to {new_zip_path}")
