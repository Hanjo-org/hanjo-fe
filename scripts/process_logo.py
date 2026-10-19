import os
from PIL import Image
import numpy as np

# Path gambar sumber logo awal (H dengan pita hijau)
input_path = r"C:\Users\Pradana Mahendra\.gemini\antigravity-ide\brain\06363862-7902-4fa2-8caa-cfd1bc7e4e42\.user_uploaded\media_1792211963334.jpg"
output_dir = r"c:\PROJECT\WEBSITE\hanjo\frontend\static"
assets_dir = r"c:\PROJECT\WEBSITE\hanjo\frontend\src\lib\assets"

os.makedirs(output_dir, exist_ok=True)
os.makedirs(assets_dir, exist_ok=True)

im = Image.open(input_path).convert("RGBA")
arr = np.array(im, dtype=np.float32)

r = arr[:, :, 0]
g = arr[:, :, 1]
b = arr[:, :, 2]

# 1. Menentukan Alpha Matting dari latar putih
dist_from_white = np.sqrt((255.0 - r)**2 + (255.0 - g)**2 + (255.0 - b)**2)

# Normalisasi:
# Jika dist_from_white <= 12 -> alpha = 0 (background bersih)
# Jika dist_from_white >= 60 -> alpha = 1 (solid content)
# Di antara 12 dan 60 -> smooth transition (anti-aliasing)
alpha = np.clip((dist_from_white - 12.0) / (60.0 - 12.0), 0.0, 1.0)

# Un-multiply latar putih agar warna tepi tidak ada halo/fringe putih
safe_alpha = np.maximum(alpha, 1e-4)[:, :, np.newaxis]
unmultiplied = (arr[:, :, :3] - (1.0 - safe_alpha) * 255.0) / safe_alpha
unmultiplied = np.clip(unmultiplied, 0.0, 255.0)

# -------------------------------------------------------------
# A. LOGO LIGHT (Tanpa background, warna asli)
# -------------------------------------------------------------
light_arr = np.zeros_like(arr)
light_arr[:, :, :3] = unmultiplied
light_arr[:, :, 3] = alpha * 255.0

# Potong margin kosong sekeliling logo (autocrop)
light_img = Image.fromarray(light_arr.astype(np.uint8), mode="RGBA")
bbox = light_img.getbbox()
light_cropped = light_img.crop(bbox)

light_out_path = os.path.join(output_dir, "logo-light.png")
light_cropped.save(light_out_path, format="PNG")
light_cropped.save(os.path.join(assets_dir, "logo-light.png"), format="PNG")
print("Saved logo-light.png:", light_cropped.size)

# -------------------------------------------------------------
# B. LOGO DARK (Font putih & Kiri-Atas / Kanan-Bawah H putih)
# -------------------------------------------------------------
dark_arr = light_arr.copy()

h, w, _ = dark_arr.shape
text_mask = np.zeros((h, w), dtype=bool)
text_mask[:, 330:] = True
is_text_pixel = text_mask & (alpha > 0.05)

# Jadikan warna teks menjadi putih murni, mempertahankan alpha asli
dark_arr[is_text_pixel, 0] = 255.0
dark_arr[is_text_pixel, 1] = 255.0
dark_arr[is_text_pixel, 2] = 255.0

# Pada emblem, bagian kiri-atas dan kanan-bawah adalah charcoal gelap.
# Di dark mode, bagian ini dibuat putih bersih (#FFFFFF).
emblem_mask = (~text_mask) & (alpha > 0.05)
is_charcoal_emblem = emblem_mask & (unmultiplied[:, :, 1] < unmultiplied[:, :, 0] + 25)
dark_arr[is_charcoal_emblem, 0] = 255.0
dark_arr[is_charcoal_emblem, 1] = 255.0
dark_arr[is_charcoal_emblem, 2] = 255.0

dark_img = Image.fromarray(dark_arr.astype(np.uint8), mode="RGBA")
dark_cropped = dark_img.crop(bbox)

dark_out_path = os.path.join(output_dir, "logo-dark.png")
dark_cropped.save(dark_out_path, format="PNG")
dark_cropped.save(os.path.join(assets_dir, "logo-dark.png"), format="PNG")
print("Saved logo-dark.png (white text & white H strokes):", dark_cropped.size)

# -------------------------------------------------------------
# C. EMBLEM ONLY (H Icon) untuk mode Collapsed Sidebar
# -------------------------------------------------------------
emblem_box = (bbox[0], bbox[1], min(bbox[0] + int((bbox[2] - bbox[0]) * 0.32), bbox[2]), bbox[3])
emblem_light = light_img.crop(emblem_box)
emblem_bbox = emblem_light.getbbox()
if emblem_bbox:
    emblem_light = emblem_light.crop(emblem_bbox)
emblem_light.save(os.path.join(output_dir, "logo-emblem.png"), format="PNG")
emblem_light.save(os.path.join(assets_dir, "logo-emblem.png"), format="PNG")
print("Saved logo-emblem.png:", emblem_light.size)

emblem_dark = dark_img.crop(emblem_box)
if emblem_bbox:
    emblem_dark = emblem_dark.crop(emblem_bbox)
emblem_dark.save(os.path.join(output_dir, "logo-emblem-dark.png"), format="PNG")
emblem_dark.save(os.path.join(assets_dir, "logo-emblem-dark.png"), format="PNG")
print("Saved logo-emblem-dark.png:", emblem_dark.size)
