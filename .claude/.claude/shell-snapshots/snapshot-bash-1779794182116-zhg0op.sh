# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
shopt -s expand_aliases
# Check for rg availability
if ! (unalias rg 2>/dev/null; command -v rg) >/dev/null 2>&1; then
  function rg {
  local _cc_bin="${CLAUDE_CODE_EXECPATH:-}"
  [[ -x $_cc_bin ]] || _cc_bin=/c/Users/ASUS/.local/bin/claude.exe
  if [[ ! -x $_cc_bin ]]; then command rg "$@"; return; fi
  if [[ -n $ZSH_VERSION ]]; then
    ARGV0=rg "$_cc_bin" "$@"
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    ARGV0=rg "$_cc_bin" "$@"
  elif [[ $BASHPID != $$ ]]; then
    exec -a rg "$_cc_bin" "$@"
  else
    (exec -a rg "$_cc_bin" "$@")
  fi
}
fi
export PATH='/c/Users/ASUS/bin:/mingw64/bin:/usr/local/bin:/usr/bin:/bin:/mingw64/bin:/usr/bin:/c/Users/ASUS/bin:/c/Users/ASUS/Documents/GitHub/pancake/venv/Scripts:/d/Python39/Scripts:/d/Python39:/c/Windows/system32:/c/Windows:/c/Windows/System32/Wbem:/c/Windows/System32/WindowsPowerShell/v1.0:/c/Windows/System32/OpenSSH:/c/Program Files (x86)/dotnet:/c/esst/PISPNETRUN/ES3D/bin:/c/WINDOWS/system32:/c/WINDOWS:/c/WINDOWS/System32/Wbem:/c/WINDOWS/System32/WindowsPowerShell/v1.0:/c/WINDOWS/System32/OpenSSH:/d/Xodo PDF Reader/jre/bin/server:/c/Program Files/dotnet:/c/Program Files (x86)/NVIDIA Corporation/PhysX/Common:/c/Program Files/NVIDIA Corporation/NVIDIA App/NvDLISR:/d/agent:/cmd:/c/Users/ASUS/AppData/Local/Programs/Python/Python312/Scripts:/c/Users/ASUS/AppData/Local/Programs/Python/Python312:/c/Users/ASUS/AppData/Local/Programs/Python/Python311-32/Scripts:/c/Users/ASUS/AppData/Local/Programs/Python/Python311-32:/c/Users/ASUS/AppData/Local/Microsoft/WindowsApps:/c/Users/ASUS/AppData/Local/Programs/Ollama:/d/agent/Microsoft VS Code/bin:/c/Users/ASUS/AppData/Roaming/npm:/usr/bin/vendor_perl:/usr/bin/core_perl'
