# TwinPay AI // Agentic Payments for Celo

TwinPay AI is a cognitive abstraction layer for the Celo blockchain. It translates natural human intent into secure, atomic blockchain operations, specifically designed for mobile-first interactions via the MiniPay wallet.

## 🚀 Concept
Most blockchain interfaces require users to understand hex addresses, gas fees, and complex payload construction. TwinPay AI removes this friction by allowing users to describe their goals in plain English (e.g., "pay for coffee") while an underlying AI agent handles the cryptographic heavy lifting.

## ✨ Key Features
- **Intent Decoding:** Converts natural language descriptions into valid transaction parameters.
- **MiniPay Native:** Seamlessly integrated with the MiniPay wallet standard for ultra-fast, mobile-friendly signatures.
- **Security Audit Engine:** Every transaction plan is verified by a heuristic engine to prevent typos and common phishing patterns.
- **Transparent Execution:** Users see exactly what the AI generated before they sign with their wallet—no hidden operations.

## 🛠 Tech Stack
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS (Modern Ink/Ghost aesthetic)
- **Blockchain:** Celo Network / MiniPay Standard
- **Infrastructure:** Firebase (Firestore & Auth)

## 📦 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arawrdn/TwinPay-AI.git
   cd TwinPay-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example` and add your Firebase configuration and AI API keys.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 🔐 Security Note
If you are deploying this to a public repository, you might receive a **GitHub Secret Scanning** alert for the Firebase API key. To resolve this:

1. **In Google AI Studio:** Go to Settings -> Secrets.
2. **Add a new secret:** Name it `VITE_FIREBASE_CONFIG`.
3. **Value:** Copy the entire JSON content from `firebase-applet-config.json` into this secret.
4. **Outcome:** The app will now read this configuration from environment variables at runtime, and you can safely delete or ignore the hardcoded config in public repositories.

## 📄 License
This project is licensed under the MIT License.
