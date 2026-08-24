#!/usr/bin/env python3
"""
AccessiShield - Project Setup Script
Initializes the project, verifies dependencies, and sets up the environment.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
SRC_DIR = BASE_DIR / "src"
WEB_DIR = BASE_DIR / "web"
CONFIG_PATH = BASE_DIR / "config.json"
CONFIG_LOCAL_PATH = BASE_DIR / "config.local.json"
ENV_EXAMPLE = WEB_DIR / ".env.example"
ENV_LOCAL = WEB_DIR / ".env.local"

def run_command(cmd, cwd=None, check=True):
    """Run a shell command and return result."""
    print(f"  $ {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        print(f"  {result.stdout.strip()}")
    if result.stderr and check:
        print(f"  ERROR: {result.stderr.strip()}")
    if check and result.returncode != 0:
        raise subprocess.CalledProcessError(result.returncode, cmd)
    return result

def check_python_version():
    """Verify Python version is 3.11+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print(f"❌ Python 3.11+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_node_version():
    """Verify Node.js version is 20+"""
    try:
        result = subprocess.run("node --version", shell=True, capture_output=True, text=True)
        version_str = result.stdout.strip().replace('v', '')
        major = int(version_str.split('.')[0])
        if major < 20:
            print(f"❌ Node.js 20+ required, found {version_str}")
            return False
        print(f"✅ Node.js {version_str}")
        return True
    except:
        print("❌ Node.js not found")
        return False

def setup_config():
    """Create local config from template if not exists"""
    if not CONFIG_LOCAL_PATH.exists():
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH) as f:
                config = json.load(f)
            with open(CONFIG_LOCAL_PATH, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"✅ Created {CONFIG_LOCAL_PATH}")
        else:
            print("❌ config.json not found")
            return False
    else:
        print(f"✅ {CONFIG_LOCAL_PATH} already exists")
    return True

def setup_env():
    """Create .env.local from example if not exists"""
    if not ENV_LOCAL.exists():
        if ENV_EXAMPLE.exists():
            import shutil
            shutil.copy(ENV_EXAMPLE, ENV_LOCAL)
            print(f"✅ Created {ENV_LOCAL}")
            print("  ⚠️  Edit .env.local with your credentials!")
        else:
            print("❌ .env.example not found")
            return False
    else:
        print(f"✅ {ENV_LOCAL} already exists")
    return True

def install_python_deps():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        run_command(f"{sys.executable} -m pip install -r requirements.txt", cwd=SRC_DIR)
        print("✅ Python dependencies installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install Python dependencies")
        return False

def install_playwright():
    """Install Playwright browsers"""
    print("🌐 Installing Playwright Chromium...")
    try:
        run_command("playwright install chromium", cwd=SRC_DIR)
        print("✅ Playwright Chromium installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install Playwright")
        return False

def install_node_deps():
    """Install Node.js dependencies"""
    print("📦 Installing Node.js dependencies...")
    try:
        run_command("npm ci", cwd=WEB_DIR)
        print("✅ Node.js dependencies installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install Node.js dependencies")
        return False

def verify_supabase_schema():
    """Check if Supabase schema file exists"""
    schema_path = BASE_DIR / "supabase" / "schema.sql"
    if schema_path.exists():
        print(f"✅ Supabase schema found: {schema_path}")
        return True
    else:
        print(f"❌ Supabase schema not found: {schema_path}")
        return False

def main():
    print("🚀 AccessiShield Project Setup")
    print("=" * 50)

    checks = [
        ("Python Version", check_python_version),
        ("Node.js Version", check_node_version),
        ("Config Setup", setup_config),
        ("Environment Setup", setup_env),
        ("Supabase Schema", verify_supabase_schema),
    ]

    all_passed = True
    for name, check_func in checks:
        print(f"\n🔍 {name}...")
        if not check_func():
            all_passed = False

    if not all_passed:
        print("\n❌ Some checks failed. Please fix and re-run.")
        sys.exit(1)

    print("\n📦 Installing dependencies...")
    deps_ok = all([
        install_python_deps(),
        install_playwright(),
        install_node_deps(),
    ])

    if not deps_ok:
        print("\n❌ Dependency installation failed.")
        sys.exit(1)

    print("\n" + "=" * 50)
    print("✅ Setup complete!")
    print("\n📋 Next steps:")
    print("  1. Edit config.local.json with your Supabase & PayPal credentials")
    print("  2. Edit web/.env.local with your environment variables")
    print("  3. Run Supabase schema in your Supabase SQL Editor")
    print("  4. Configure PayPal webhook: https://your-domain.com/api/paypal/webhook")
    print("\n🚀 To start development:")
    print("  Web app:    cd web && npm run dev")
    print("  Scanner:    cd src && python web_scanner.py https://example.com")
    print("  Batch:      cd src && python orchestrator.py batch 10")

if __name__ == "__main__":
    main()