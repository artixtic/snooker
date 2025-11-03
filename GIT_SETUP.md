# Git Setup & Push Instructions

## 📦 Repository Status

✅ Git repository initialized  
✅ .gitignore configured  
✅ Files staged and ready to commit  

## 🚀 Push to Remote Repository

### Option 1: Push to GitHub (Recommended)

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `snooker-pos` (or your preferred name)
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Add remote and push:**
   ```powershell
   cd "C:\Users\HP PROBOOK 450 G10\Desktop\MahboobAhmed\Snooker"
   
   # Replace YOUR_USERNAME with your GitHub username
   git remote add origin https://github.com/YOUR_USERNAME/snooker-pos.git
   
   # Or if using SSH:
   # git remote add origin git@github.com:YOUR_USERNAME/snooker-pos.git
   
   git branch -M main
   git push -u origin main
   ```

### Option 2: Push to GitLab

1. **Create a new project on GitLab**
2. **Add remote:**
   ```powershell
   git remote add origin https://gitlab.com/YOUR_USERNAME/snooker-pos.git
   git branch -M main
   git push -u origin main
   ```

### Option 3: Push to Bitbucket

1. **Create a new repository on Bitbucket**
2. **Add remote:**
   ```powershell
   git remote add origin https://bitbucket.org/YOUR_USERNAME/snooker-pos.git
   git branch -M main
   git push -u origin main
   ```

## 🔐 Authentication

### Using HTTPS (requires personal access token)
- GitHub: Create token at https://github.com/settings/tokens
- GitLab: Create token at https://gitlab.com/-/user_settings/personal_access_tokens
- Use token as password when pushing

### Using SSH (recommended)
1. Generate SSH key:
   ```powershell
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```
2. Add to SSH agent:
   ```powershell
   ssh-add ~/.ssh/id_ed25519
   ```
3. Copy public key:
   ```powershell
   cat ~/.ssh/id_ed25519.pub
   ```
4. Add to GitHub/GitLab/Bitbucket settings

## 📝 Current Commit Status

The code has been committed locally with:
- Complete Snooker POS system
- All source files
- Configuration files
- Documentation
- Environment examples (not actual secrets)

## ⚠️ Important Notes

1. **Never commit:**
   - `.env` files with actual secrets
   - `node_modules/` (already in .gitignore)
   - Build outputs (already in .gitignore)

2. **Update .gitignore if needed:**
   - Add any additional files/folders you want to exclude

3. **First push:**
   ```powershell
   git push -u origin main
   ```

4. **Future pushes:**
   ```powershell
   git add .
   git commit -m "Your commit message"
   git push
   ```

## ✅ Verify Push

After pushing, check your repository:
- All files should be visible
- No sensitive data should be exposed
- README and documentation should be there

