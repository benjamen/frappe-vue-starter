Frappe-UI with Vue 3 on Frappe App

✅bench new-site home.localhost -  Create a new site

*********
bench --site home.localhost set-config developer_mode 1
bench --site home.localhost set-config maintenance_mode 0
bench --site home.localhost clear-cache
bench --site your-site-name enable-scheduler - FOR EMAIL TO WORK

*************
✅bench get-app homemain https://github.com/benjamen/frappe-vue-starter.git --branch main
✅bench --site home.localhost install-app homemain

apps/
└── homemain/
    ├── homemain/        ← Frappe app module
    ├── setup.py
    └── frontend/        ← Vue 3 + Tailwind + frappe-ui app
        ├── package.json
        ├── vite.config.ts
        ├── src/
        └── ...

✅ Step-by-Step: Install and Run frontend
✅ 1. Navigate to the frontend folder
bash
Copy
Edit
cd apps/homemain/frontend
✅ 2. Install dependencies
bash
Copy
Edit
yarn install
This installs Vue 3, Vite, Tailwind, frappe-ui, etc.

✅ 3. Check your Vite proxy
Open vite.config.ts and ensure you have this:

ts
Copy
Edit
server: {
  proxy: {
    '/api': 'http://localhost:8000', // or http://home.localhost:8000 if using Docker
  }
}
This allows your frontend to talk to Frappe via /api.

✅ 4. Run the development server
bash
Copy
Edit
yarn dev




This code corrects issues with the original https://github.com/NagariaHussain/doppio with bench add-frappe-ui and extends to allow dynamics UI via webform configuration
