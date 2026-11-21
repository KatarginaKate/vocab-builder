# 📚 VocabBuilder

**VocabBuilder** is a web application designed to help users expand and improve their English vocabulary. It allows users to build their own personal dictionary, explore recommended words, track learning progress, and practice translations through interactive training sessions.

The application provides a convenient way to organize vocabulary and make language learning more effective.

## 🌐 Demo

* **[Live Demo](https://vocab-builder-gold.vercel.app/)**
* **[GitHub Repository](https://github.com/KatarginaKate/vocab-builder)**

## ✨ Features

* 🔐 **Authentication** — user registration and login.
* 📖 **Personal Dictionary** — add, edit, and delete vocabulary entries.
* 🔍 **Search & Filtering** — find words by keyword, category, and verb type.
* 💡 **Recommended Words** — explore suggested vocabulary and add new words to your collection.
* 📊 **Learning Progress** — track learned and unlearned words.
* 🎯 **Interactive Training** — practice English-to-Ukrainian and Ukrainian-to-English translations.
* 📱 **Responsive Design** — adaptive navigation and mobile menu for different screen sizes.

## 🧰 Tech Stack

<div align="left">

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![Yup](https://img.shields.io/badge/Yup-4B32C3?style=for-the-badge)
![TanStack Table](https://img.shields.io/badge/TanStack_Table-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=for-the-badge&logo=cssmodules&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

</div>

* **Framework:** Next.js 16 (App Router)
* **Library:** React 19
* **Language:** TypeScript
* **State Management:** Redux Toolkit
* **Forms & Validation:** React Hook Form, Yup
* **Data Tables:** TanStack Table
* **Styling:** CSS Modules
* **Code Quality:** ESLint, Prettier
* **Backend:** VocabBuilder REST API

## 📸 Screenshots

<!-- Add application screenshots here -->

## 📂 Project Structure

```text
vocab-builder/
├── app/              # Next.js routes, layouts, and styles
├── components/       # Reusable UI components
├── services/         # API requests and data types
├── store/            # Redux store, providers, and slices
├── public/            # Images and SVG sprite
├── .env.local         # Environment variables
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* [Node.js](https://nodejs.org/) 20 or later
* npm or another compatible package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/KatarginaKate/vocab-builder.git
```

2. Navigate to the project directory:

```bash
cd vocab-builder
```

3. Install dependencies:

```bash
npm install
```

4. Configure environment variables (optional).

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=https://vocab-builder-backend.p.goit.global/api
```

If the environment variable is not specified, the application uses the default API endpoint.

API URLs containing `/api-docs/` are automatically normalized to `/api`.

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint to check code quality |

## 🗺️ Application Routes

| Route | Description |
|-------|-------------|
| `/` | Registration page |
| `/register` | User registration |
| `/login` | User login |
| `/dictionary` | Personal vocabulary dictionary |
| `/recommend` | Recommended words |
| `/training` | Translation practice |

## 🔌 API Integration

The application communicates with the VocabBuilder Backend through authenticated API requests.

* User authentication and vocabulary management are handled through the REST API.
* Authentication tokens and user data are stored in the browser's `localStorage`.
* Protected requests use the authentication token.
* If the token expires or becomes invalid, the user is redirected to the login page.

## 💡 Key Implementation Highlights

* Built with the Next.js App Router architecture.
* Centralized application state management using Redux Toolkit.
* Form handling and validation with React Hook Form and Yup.
* Dynamic vocabulary filtering and search.
* Integration with an external REST API.
* Responsive user interface with CSS Modules.

---

## 👩‍💻 Author

**Kateryna Nehoda**

Frontend Developer

* [GitHub](https://github.com/KatarginaKate)
* [LinkedIn](https://www.linkedin.com/in/kateryna-nehoda/)

Made with ❤️ by Kateryna