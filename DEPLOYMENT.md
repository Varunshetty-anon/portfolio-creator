# Deployment Guide (Vercel)

This project is built with **Vite** and **React**, making it easy to deploy on Vercel.

## 1. Prerequisites
*   A GitHub, GitLab, or Bitbucket account.
*   A Vercel account (signup at [vercel.com](https://vercel.com)).
*   The project pushed to your git repository.

## 2. Deploying
1.  **Login to Vercel**.
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import** your repository (e.g., `frames-portfolio`).
4.  Vercel will detect it's a Vite project.
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (default)
    *   **Build Command**: `npm run build` (or `tsc && vite build`)
    *   **Output Directory**: `dist`

## 3. Environment Variables (Critical)
Before clicking "Deploy", you must configure the Environment Variables.

1.  Expand the **"Environment Variables"** section.
2.  Add the following variables using the Cloudinary details you have:

    | Key | Value |
    | --- | --- |
    | `VITE_CLOUDINARY_CLOUD_NAME` | `dtkvxraeo` |
    | `VITE_CLOUDINARY_UPLOAD_PRESET` | `Frames Portfolio` |

    **⚠️ IMPORTANT SECURITY WARNING:**
    *   **DO NOT** add your `CLOUDINARY_API_KEY` or `CLOUDINARY_API_SECRET` here.
    *   Since this is a frontend application, these variables are exposed to the browser.
    *   We are using "Unsigned Uploads" which relies only on the Cloud Name and Preset. Keeping the Secret private ensures your account remains secure.

## 4. Finalize
1.  Click **"Deploy"**.
2.  Wait for the build to complete.
3.  Your portfolio is now live!

## Troubleshooting
*   **Images not loading?** Check that your Cloudinary Upload Preset is marked as **Unsigned** in your Cloudinary Settings -> Upload -> Upload presets.
*   **Build fails?** Check the "Build Logs" in Vercel. Ensure `typescript` dependencies are resolved.
