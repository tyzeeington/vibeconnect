# VibeConnect CLI Tools

Essential CLI tools for VibeConnect development on macOS (installed via Homebrew).

## Installation

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Core Development Tools

### 1. Node.js & npm
```bash
brew install node
```
**Version Required:** Node.js 18+ | npm 9+
**Used for:** Frontend (Next.js), contracts (Hardhat), mobile (Expo)

### 2. Python
```bash
brew install python@3.10
```
**Version Required:** Python 3.10+
**Used for:** Backend (FastAPI)

### 3. PostgreSQL
```bash
brew install postgresql@15
brew services start postgresql@15
```
**Version Required:** PostgreSQL 15+
**Used for:** Database (user profiles, events, matches, connections)

### 4. Git
```bash
brew install git
```
**Used for:** Version control

## Optional but Recommended

### 5. Railway CLI
```bash
npm install -g @railway/cli
```
**Used for:** Deploying to Railway, managing environment variables

### 6. Watchman (for React Native)
```bash
brew install watchman
```
**Used for:** Mobile app development (React Native file watching)

### 7. PostgreSQL GUI (optional)
```bash
brew install --cask postico
# or
brew install --cask pgadmin4
```
**Used for:** Database management and visualization

### 8. jq (JSON processor)
```bash
brew install jq
```
**Used for:** JSON parsing in scripts

## Verification

After installation, verify all tools are properly installed:

```bash
# Check Node.js
node -v         # Should show v18.x or higher
npm -v          # Should show v9.x or higher

# Check Python
python3 --version  # Should show Python 3.10.x or higher
pip3 --version

# Check PostgreSQL
psql --version     # Should show psql 15.x

# Check Git
git --version

# Check Railway CLI (if installed)
railway --version

# Check Watchman (if installed)
watchman --version
```

## Post-Installation Setup

### 1. Create PostgreSQL Database
```bash
# Create the vibeconnect database
createdb vibeconnect

# Verify it was created
psql -l | grep vibeconnect
```

### 2. Install Python Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 4. Install Smart Contract Dependencies
```bash
cd contracts
npm install
```

### 5. Install Mobile Dependencies
```bash
cd mobile
npm install
```

## Quick Reference

| Tool | Command | Purpose |
|------|---------|---------|
| Node.js | `node -v` | Runtime for frontend/contracts |
| npm | `npm -v` | Package manager |
| Python | `python3 --version` | Backend runtime |
| pip | `pip3 --version` | Python package manager |
| PostgreSQL | `psql --version` | Database system |
| Git | `git --version` | Version control |
| Railway | `railway --version` | Deployment CLI |
| Watchman | `watchman --version` | File watcher for RN |

## Service Management

### Start Services
```bash
# Start PostgreSQL
brew services start postgresql@15

# Start backend dev server
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Start frontend dev server
cd frontend && npm run dev

# Start mobile dev server
cd mobile && npm start
```

### Stop Services
```bash
# Stop PostgreSQL
brew services stop postgresql@15
```

### Restart Services
```bash
# Restart PostgreSQL
brew services restart postgresql@15
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@15

# Check PostgreSQL logs
tail -f /opt/homebrew/var/log/postgresql@15.log
```

### Node Version Conflicts
```bash
# Install nvm (Node Version Manager) for better control
brew install nvm

# Use specific Node version
nvm install 18
nvm use 18
```

### Python PATH Issues
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="/opt/homebrew/opt/python@3.10/bin:$PATH"

# Reload shell
source ~/.zshrc
```

---

**Last Updated:** January 3, 2026

For full setup instructions, see `README.md` and run `./scripts/setup-dev.sh`
