import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

def print_colored(text, color):
    colors = {
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'red': '\033[91m',
        'end': '\033[0m'
    }
    print(f"{colors.get(color, '')}{text}{colors['end']}")

def run_command(command, shell=True):
    try:
        subprocess.run(command, shell=shell, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print_colored(f"Error executing command: {command}", 'red')
        print_colored(str(e), 'red')
        return False

def check_admin():
    try:
        return os.getuid() == 0
    except AttributeError:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0

def parse_version(version_string):
    # Remove 'v' prefix and split into components
    version = version_string.lstrip('v').split('.')
    # Convert to integers, padding with zeros if needed
    return [int(x) for x in version] + [0] * (3 - len(version))

def compare_versions(version1, version2):
    v1_parts = parse_version(version1)
    v2_parts = parse_version(version2)
    return v1_parts >= v2_parts

def get_node_version():
    # Common Node.js installation paths on Windows
    possible_paths = [
        r"C:\Program Files\nodejs\node.exe",
        r"C:\Program Files (x86)\nodejs\node.exe",
        os.path.expanduser("~\\AppData\\Roaming\\npm\\node.exe"),
        "node.exe"  # Try PATH
    ]
    
    for node_path in possible_paths:
        try:
            if os.path.exists(node_path):
                result = subprocess.run([node_path, '--version'], 
                                     capture_output=True, 
                                     text=True)
                if result.returncode == 0:
                    return result.stdout.strip()
        except Exception:
            continue
    
    return None

def get_postgres_path():
    # Common PostgreSQL installation paths on Windows
    possible_paths = [
        r"C:\Program Files\PostgreSQL\16\bin\psql.exe",
        r"C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
        "psql.exe"  # Try PATH
    ]
    
    for psql_path in possible_paths:
        if os.path.exists(psql_path):
            return psql_path
    return None

def get_redis_path():
    # Common Redis installation paths on Windows
    possible_paths = [
        r"C:\Program Files\Redis\redis-cli.exe",
        r"C:\Program Files (x86)\Redis\redis-cli.exe",
        "redis-cli.exe"  # Try PATH
    ]
    
    for redis_path in possible_paths:
        if os.path.exists(redis_path):
            return redis_path
    return None

def get_npm_path():
    # Common npm installation paths on Windows
    possible_paths = [
        r"C:\Program Files\nodejs\npm.cmd",
        r"C:\Program Files (x86)\nodejs\npm.cmd",
        os.path.expanduser("~\\AppData\\Roaming\\npm\\npm.cmd"),
        "npm.cmd"  # Try PATH
    ]
    
    for npm_path in possible_paths:
        if os.path.exists(npm_path):
            return npm_path
    return None

def main():
    print_colored("==== Datacanvas Project Setup ====", 'blue')
    print_colored("Installing and configuring required services...", 'blue')

    if not check_admin():
        print_colored("Please run this script with administrator privileges", 'red')
        sys.exit(1)

    # Check if running on Windows
    if platform.system() != 'Windows':
        print_colored("This script is designed for Windows only", 'red')
        sys.exit(1)

    # Install Node.js if not present
    print_colored("[1/5] Checking Node.js installation...", 'blue')
    node_version = get_node_version()
    if node_version:
        if compare_versions(node_version, '16.0.0'):
            print_colored(f"Node.js {node_version} is installed (✓)", 'green')
        else:
            print_colored(f"Node.js version {node_version} is too old. Please upgrade to v16 or higher from https://nodejs.org/", 'yellow')
            sys.exit(1)
    else:
        print_colored("Node.js not found. Please install Node.js v16 or higher from https://nodejs.org/", 'yellow')
        sys.exit(1)

    # Check npm installation
    npm_path = get_npm_path()
    if not npm_path:
        print_colored("npm not found. Please ensure Node.js is installed correctly", 'red')
        sys.exit(1)

    # Install PostgreSQL if not present
    print_colored("[2/5] Checking PostgreSQL installation...", 'blue')
    psql_path = get_postgres_path()
    if psql_path:
        try:
            result = subprocess.run([psql_path, '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print_colored("PostgreSQL is installed (✓)", 'green')
            else:
                print_colored("PostgreSQL is installed but not working properly", 'yellow')
                sys.exit(1)
        except Exception as e:
            print_colored(f"Error checking PostgreSQL: {str(e)}", 'red')
            sys.exit(1)
    else:
        print_colored("PostgreSQL not found. Please install PostgreSQL from https://www.postgresql.org/download/windows/", 'yellow')
        sys.exit(1)

    # Create PostgreSQL databases
    print_colored("[3/5] Setting up PostgreSQL databases...", 'blue')
    try:
        # Check if databases exist first
        check_db_dev = subprocess.run(f'"{psql_path}" -U postgres -lqt | cut -d \| -f 1 | grep -w portfolio_dev', 
                                    shell=True, capture_output=True, text=True)
        check_db_test = subprocess.run(f'"{psql_path}" -U postgres -lqt | cut -d \| -f 1 | grep -w portfolio_test', 
                                     shell=True, capture_output=True, text=True)
        
        if 'portfolio_dev' not in check_db_dev.stdout:
            run_command(f'"{psql_path}" -U postgres -c "CREATE DATABASE portfolio_dev;"', shell=True)
        if 'portfolio_test' not in check_db_test.stdout:
            run_command(f'"{psql_path}" -U postgres -c "CREATE DATABASE portfolio_test;"', shell=True)
            
        print_colored("PostgreSQL databases verified/created successfully (✓)", 'green')
    except Exception as e:
        print_colored(f"Error setting up PostgreSQL databases: {str(e)}", 'red')
        print_colored("Please ensure PostgreSQL is running and the postgres user has appropriate permissions", 'yellow')

    # Install Redis if not present
    print_colored("[4/5] Checking Redis installation...", 'blue')
    redis_path = get_redis_path()
    if redis_path:
        try:
            result = subprocess.run([redis_path, 'ping'], capture_output=True, text=True)
            if result.returncode == 0 and 'PONG' in result.stdout:
                print_colored("Redis is installed and running (✓)", 'green')
            else:
                print_colored("Redis is installed but not responding", 'yellow')
                sys.exit(1)
        except Exception as e:
            print_colored(f"Error checking Redis: {str(e)}", 'red')
            sys.exit(1)
    else:
        print_colored("Redis not found. Please install Redis for Windows from https://github.com/microsoftarchive/redis/releases", 'yellow')
        sys.exit(1)

    # Install project dependencies
    print_colored("[5/5] Installing project dependencies...", 'blue')
    if run_command(f'"{npm_path}" install'):
        print_colored("Project dependencies installed successfully (✓)", 'green')
    else:
        print_colored("Failed to install project dependencies", 'red')
        sys.exit(1)

    # Create .env file if it doesn't exist
    env_file = Path('.env')
    env_example = Path('.env.example')
    if not env_file.exists() and env_example.exists():
        print_colored("Creating .env file from example...", 'blue')
        shutil.copy('.env.example', '.env')
        
        # Replace placeholder values in .env file
        with open('.env', 'r') as file:
            content = file.read()
        
        content = content.replace('<your-secure-database-password>', 'postgres')
        content = content.replace('<your-redis-password>', '')
        content = content.replace('<your-secure-jwt-secret-key>', 'temp-jwt-secret-please-change-in-production')
        
        with open('.env', 'w') as file:
            file.write(content)
        print_colored(".env file created successfully (✓)", 'green')

    print_colored("\n==== Setup completed successfully! ====", 'green')
    print_colored("To start the application in development mode, run: npm run dev", 'yellow')
    print_colored("To start the application in production mode, run: npm start", 'yellow')
    print_colored("Note: For production use, please update the JWT secret and database passwords in your .env file!", 'red')

if __name__ == "__main__":
    main() 