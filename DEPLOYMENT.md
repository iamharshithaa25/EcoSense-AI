# Deploy EcoSense AI

This guide deploys the Flask API to Railway and the React/Vite dashboard to
Vercel. The two services are separate, which keeps the setup simple and lets
the dashboard remain fast.

## What is already prepared

- The backend reads its database from `ECOSENSE_DATA_DIR`. On Railway this will
  be `/data`, a persistent volume.
- Daily and weekly reports use `ECOSENSE_TIMEZONE` (set it to `Asia/Kolkata`).
- The scheduler runs when Gunicorn starts. Use exactly **one worker** and one
  Railway replica so there is only one scheduler.
- The frontend now reads `VITE_API_URL`. It still uses `http://127.0.0.1:5000`
  automatically while you develop locally.
- The local SQLite file and virtual environment are excluded from Git. The
  online app will begin with an empty, persistent database. Do not publish a
  local database unless you have chosen to share its contents.

## 1. Publish the code to GitHub

Create a new, empty GitHub repository named `ecosense-ai`. Do not add a README
or `.gitignore` on GitHub because this project already has one.

Then open a terminal in the `EcoSense AI` folder and run these commands. Replace
`YOUR-GITHUB-USERNAME` with your GitHub username:

```powershell
git init
git add .
git commit -m "Prepare EcoSense AI for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/ecosense-ai.git
git push -u origin main
```

## 2. Deploy the Flask backend on Railway

1. In Railway, create a project and choose **Deploy from GitHub repo**.
2. Select `ecosense-ai`.
3. In the service settings, set the **Root Directory** to `/backend`.
4. Set the **Build Command** to:

   ```text
   pip install -r requirements.txt
   ```

5. Set the **Start Command** to:

   ```text
   gunicorn --workers 1 --threads 4 --bind 0.0.0.0:$PORT app:app
   ```

6. Set the **Healthcheck Path** to:

   ```text
   /api/health
   ```

7. Add these variables in Railway:

   | Name | Value |
   | --- | --- |
   | `ECOSENSE_DATA_DIR` | `/data` |
   | `ECOSENSE_TIMEZONE` | `Asia/Kolkata` |
   | `ENABLE_REPORT_SCHEDULER` | `true` |

8. Create a **Volume** for the backend service and set its mount path to:

   ```text
   /data
   ```

9. Keep the backend as a persistent service with **one replica**. Do not enable
   a sleep/serverless mode: the scheduler must remain running to create reports.
10. Deploy, then use Railway's **Generate Domain** option. Open:

    ```text
    https://YOUR-RAILWAY-DOMAIN/api/health
    ```

    You should see a JSON response with `"status": "Online"`.

## 3. Deploy the dashboard on Vercel

1. In Vercel, choose **Add New → Project** and import the same GitHub repo.
2. Set the **Root Directory** to `frontend`.
3. Leave the framework as Vite. The build command is `npm run build` and the
   output directory is `dist`.
4. Before deploying, add this Vercel environment variable for Production,
   Preview, and Development:

   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://YOUR-RAILWAY-DOMAIN` |

   Do not add a trailing slash to the URL.

5. Deploy. Open the new Vercel URL and use the dashboard normally.

## 4. Final checks

1. Confirm the dashboard shows **Backend Online**.
2. Submit one sensor reading and refresh the page. It should remain in Sensor
   History.
3. Create a manual report and confirm it opens in Reports.
4. In Railway, restart the backend service. Refresh Sensor History: the reading
   must still exist. This proves the `/data` volume is attached correctly.
5. Leave the service running until 12:05 AM India time. A daily report will be
   created once readings are available. Mondays also create a weekly report.

## Important safety note

The database is intentionally not uploaded to GitHub. The deployed database is
new but remains persistent through restart and redeployment because it is stored
on Railway's `/data` volume. If you want to copy the existing local sensor
history to the public project, review it first and make that a separate,
intentional step.
