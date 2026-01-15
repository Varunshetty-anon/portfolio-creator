# Cloudinary Setup for Frames Portfolio

This project uses **Cloudinary** for storing images and videos (removing Firebase Storage).

## 1. Create a Cloudinary Account
1.  Go to [Cloudinary.com](https://cloudinary.com/) and sign up for a free account.
2.  Login to your dashboard.

## 2. Get your Cloud Name
1.  On the **Programmable Media** Dashboard, look for **Cloud Name**.
2.  Copy this value.

## 3. Create an Unsigned Upload Preset
1.  Go to **Settings** (Gear icon) -> **Upload**.
2.  Scroll down to **Upload presets**.
3.  Click **Add upload preset**.
4.  Set **Signing Mode** to **Unsigned**.
5.  Set a **Name** (e.g., `frames_uploads`).
6.  (Optional) Set a folder name (e.g., `users`).
7.  Click **Save**.
8.  Copy the **Name** of the preset you just created.

## 4. Configure Environment Variables
Create or update your `.env.local` file in the root of the project:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here
```

Replace `your_cloud_name_here` and `your_upload_preset_name_here` with your actual values.

## 5. Restart Development Server
If your server is running, restart it to load the new environment variables.

```bash
npm run dev
```
