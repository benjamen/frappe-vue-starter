Frappe-UI with Vue 3 on Frappe App

Based on all the work from here - https://github.com/NagariaHussain/doppio_frappeui_starter
[Start here]
https://github.com/NagariaHussain/doppio
bench add-frappe-ui

✅bench new-site home.localhost -  Create a new site


*********
bench --site home.localhost set-config developer_mode 1

bench --site home.localhost set-config maintenance_mode 0

bench --site home.localhost clear-cache

bench --site your-site-name enable-scheduler - FOR EMAIL TO WORK


************

✅bench get-app homemain https://github.com/benjamen/frappe-vue-starter.git --branch main

✅bench --site home.localhost install-app homemain

<img width="619" height="243" alt="image" src="https://github.com/user-attachments/assets/5f7af7b3-7bfc-4fd8-8e5e-3c9b46970f07" />


✅ Step-by-Step: Install and Run frontend

✅ 1. Navigate to the frontend folder

cd apps/homemain/frontend

✅ 2. Install dependencies

yarn install

This installs Vue 3, Vite, Tailwind, frappe-ui, etc.

✅ 3. Check your Vite proxy

Open vite.config.ts and ensure you have this:

server: {

  proxy: {
  
    '/api': 'http://localhost:8000', // or http://home.localhost:8000 if using Docker
    
  }
  
}

This allows your frontend to talk to Frappe via /api.

✅ 4. Run the development server

yarn dev

sometimes in site_config.json

  "ignore_csrf": 1,
  "allow_cors": "*",
  "cors_credentials": true


This code corrects issues with the original https://github.com/NagariaHussain/doppio with bench add-frappe-ui and extends to allow dynamics UI via webform configuration
