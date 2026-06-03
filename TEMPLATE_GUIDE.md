# Guide: Using This Project as a Template

This document provides a step-by-step guide on how to use the source code of this project to create a new course application.

## 1. Copying the Source Code
Copy the entire project folder to a new location, **excluding** the following files and directories:
- `node_modules/` (You will need to run `npm install` again in the new project).
- `.git/` (Delete this folder so you can initialize a fresh Git repository using `git init`).
- `.env.local` or any other credential files (Do not copy old project credentials to the new project).
- `.gemini/` folder or any other specific AI configuration artifacts (if applicable).

## 2. Installing Dependencies
Once the folder has been copied, open your terminal in the new project directory and run:
```bash
npm install
```

## 3. Environment & Credentials Configuration (Security)
**IMPORTANT**: Always ensure project credentials are secure so they are not exposed publicly (e.g., in the frontend or accessible via client-side).
- Create a new `.env.local` file based on the `.env.example` file.
- Create a new backend/Firebase project (if required) and insert the new configuration/API Keys into `.env.local`.
- Remember: Only use the `VITE_` prefix for environment variables that are safe and need to be read by the browser/frontend. Never expose highly sensitive secret keys.

## 4. Updating Project Identity
Update the application identity from the old project to the new one in the following files:
- **`package.json`**: Update the `"name"` and `"description"` properties.
- **`index.html`**: Update the text inside the `<title>...</title>` tag.
- **Visual Assets**: Replace the logo, favicon, and other images in the `public/` and `src/assets/` directories.

## 5. Course Content Customization
- Adjust the content structure, quizzes, modules, and text on UI components or in your JSON/database files.
- Replace any static text on the registration page, home page, or dashboard.

## 6. Design Guidelines (Mobile-First)
Ensure you always adhere to the project's core design principle: **Mobile-View First Responsive Design**:
- When creating or modifying UI components, design and optimize the layout for mobile screen sizes first.
- Always use the browser's developer tools to test the mobile-view mode after making any styling (CSS) changes.

---
Once all the steps above are completed, you can run the new project locally with the following command:
```bash
npm run dev
```
